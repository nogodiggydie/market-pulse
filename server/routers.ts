import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // News & Markets
  news: router({
    // Fast endpoint - just news, no matching
    trending: publicProcedure
      .input(z.object({ limit: z.number().optional().default(10) }).optional())
      .query(async ({ input }) => {
        const { fetchTrendingEvents } = await import("./services/newsDetector");
        return fetchTrendingEvents(input?.limit || 10, process.env.NEWSAPI_KEY);
      }),
    // Get trending news events with matched markets (optimized - only top 3)
    opportunities: publicProcedure
      .input(z.object({ limit: z.number().optional().default(3) }).optional())
      .query(async ({ input }) => {
        const { fetchTrendingEvents } = await import("./services/newsDetector");
        const { fetchAllMarkets } = await import("./services/marketAggregator");
        const { findMarketsForEvent } = await import("./services/marketMatcher");

        // Fetch only top events for matching (faster)
        const limit = Math.min(input?.limit || 3, 5);
        const events = await fetchTrendingEvents(limit, process.env.NEWSAPI_KEY);

        // Fetch markets
        const markets = await fetchAllMarkets(150);

        // Match markets to events with timeout
        const opportunities = [];
        for (const event of events) {
          try {
            const matchedMarkets = await Promise.race([
              findMarketsForEvent(event.title, event.keywords, markets, 3),
              new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 10000))
            ]);

            opportunities.push({
              event,
              markets: matchedMarkets,
            });
          } catch (error) {
            // If matching fails, still return event without markets
            opportunities.push({
              event,
              markets: [],
            });
          }
        }

        return opportunities;
      }),

    // Match markets for a single event (on-demand) with caching
    matchEvent: publicProcedure
      .input(z.object({
        title: z.string(),
        keywords: z.array(z.string()),
        limit: z.number().optional().default(3),
      }))
      .query(async ({ input }) => {
        const { getCachedMarkets, setCachedMarkets } = await import("./services/marketCache");
        
        // Try to get from cache first
        const cached = await getCachedMarkets(input.title, input.keywords);
        if (cached) {
          // Return cached results (already limited to requested amount)
          return cached.slice(0, input.limit);
        }

        // Cache miss - fetch and match markets
        const { fetchAllMarkets } = await import("./services/marketAggregator");
        const { findMarketsForEvent } = await import("./services/marketMatcher");

        const markets = await fetchAllMarkets(150);
        const matchedMarkets = await findMarketsForEvent(
          input.title,
          input.keywords,
          markets,
          input.limit
        );

        // Store in cache for future requests
        await setCachedMarkets(input.title, input.keywords, matchedMarkets);

        return matchedMarkets;
      }),

    // Warm cache for high-velocity events (background job)
    warmCache: publicProcedure
      .input(z.object({
        velocityThreshold: z.number().optional().default(60),
      }).optional())
      .mutation(async ({ input }) => {
        const { fetchTrendingEvents } = await import("./services/newsDetector");
        const { warmCacheForHighVelocityEvents } = await import("./services/cacheWarming");

        const events = await fetchTrendingEvents(20, process.env.NEWSAPI_KEY);
        const result = await warmCacheForHighVelocityEvents(
          events,
          input?.velocityThreshold || 60
        );

        return result;
      }),

    // Get Market of the Hour (top opportunity)
    marketOfHour: publicProcedure.query(async () => {
      const { fetchTrendingEvents } = await import("./services/newsDetector");
      const { fetchAllMarkets } = await import("./services/marketAggregator");
      const { findMarketsForEvent } = await import("./services/marketMatcher");

      const events = await fetchTrendingEvents(5, process.env.NEWSAPI_KEY);
      const markets = await fetchAllMarkets(200);

      // Find best opportunity
      let bestOpportunity = null;
      let bestScore = 0;

      for (const event of events) {
        const matchedMarkets = await findMarketsForEvent(
          event.title,
          event.keywords,
          markets,
          1
        );

        if (matchedMarkets.length > 0) {
          const score = event.velocity * matchedMarkets[0].relevanceScore;
          if (score > bestScore) {
            bestScore = score;
            bestOpportunity = {
              event,
              market: matchedMarkets[0].market,
              relevance: matchedMarkets[0].relevanceScore,
            };
          }
        }
      }

      return bestOpportunity;
    }),
  }),

  markets: router({
    // Get active markets
    active: publicProcedure.query(async () => {
      const { getActiveMarkets } = await import("./db");
      return getActiveMarkets();
    }),

    // Get market by ID
    byId: publicProcedure.input(z.number()).query(async ({ input }) => {
      const { getMarketById } = await import("./db");
      return getMarketById(input);
    }),
  }),

  stripe: router({
    // Create checkout session for subscription
    createCheckoutSession: protectedProcedure
      .input(z.object({ tier: z.enum(["pro", "premium"]) }))
      .mutation(async ({ ctx, input }) => {
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

        const { PRODUCTS } = await import("./products");
        const product = PRODUCTS[input.tier];

        if (!product.priceId) {
          throw new Error(`Price ID not configured for ${input.tier} tier`);
        }

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          line_items: [
            {
              price: product.priceId,
              quantity: 1,
            },
          ],
          success_url: `${ctx.req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${ctx.req.headers.origin}/pricing`,
          allow_promotion_codes: true,
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            tier: input.tier,
          },
        });

        return { url: session.url! };
      }),

    // Get user's subscription status
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return {
        tier: ctx.user.subscriptionTier,
        status: ctx.user.subscriptionStatus,
        endsAt: ctx.user.subscriptionEndsAt,
      };
    }),
  }),

  // Trading endpoints
  trading: router({
    // Place order on Kalshi
    placeKalshiOrder: protectedProcedure
      .input(z.object({
        ticker: z.string(),
        action: z.enum(['buy', 'sell']),
        side: z.enum(['yes', 'no']),
        count: z.number().positive(),
        type: z.enum(['market', 'limit']),
        yesPrice: z.number().optional(),
        noPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { placeKalshiOrder } = await import('./integrations/kalshiTrading');
        
        if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_PRIVATE_KEY) {
          throw new Error('Kalshi credentials not configured');
        }

        return placeKalshiOrder(
          {
            apiKey: process.env.KALSHI_API_KEY,
            privateKey: process.env.KALSHI_PRIVATE_KEY,
          },
          input
        );
      }),

    // Get Kalshi positions
    getKalshiPositions: protectedProcedure.query(async () => {
      const { getKalshiPositions } = await import('./integrations/kalshiTrading');
      
      if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_PRIVATE_KEY) {
        return [];
      }

      return getKalshiPositions({
        apiKey: process.env.KALSHI_API_KEY,
        privateKey: process.env.KALSHI_PRIVATE_KEY,
      });
    }),

    // Get Kalshi orders
    getKalshiOrders: protectedProcedure
      .input(z.object({ status: z.enum(['resting', 'canceled', 'executed']).optional() }).optional())
      .query(async ({ input }) => {
        const { getKalshiOrders } = await import('./integrations/kalshiTrading');
        
        if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_PRIVATE_KEY) {
          return [];
        }

        return getKalshiOrders(
          {
            apiKey: process.env.KALSHI_API_KEY,
            privateKey: process.env.KALSHI_PRIVATE_KEY,
          },
          input?.status
        );
      }),

    // Cancel Kalshi order
    cancelKalshiOrder: protectedProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        const { cancelKalshiOrder } = await import('./integrations/kalshiTrading');
        
        if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_PRIVATE_KEY) {
          throw new Error('Kalshi credentials not configured');
        }

        await cancelKalshiOrder(
          {
            apiKey: process.env.KALSHI_API_KEY,
            privateKey: process.env.KALSHI_PRIVATE_KEY,
          },
          input.orderId
        );

        return { success: true };
      }),

    // Place order on Polymarket
    placePolymarketOrder: protectedProcedure
      .input(z.object({
        tokenId: z.string(),
        price: z.number().min(0).max(1),
        size: z.number().positive(),
        side: z.enum(['BUY', 'SELL']),
      }))
      .mutation(async ({ input }) => {
        const { placePolymarketOrder } = await import('./integrations/polymarketTrading');
        
        if (!process.env.POLYMARKET_API_KEY || !process.env.POLYMARKET_API_SECRET || !process.env.POLYMARKET_API_PASSPHRASE) {
          throw new Error('Polymarket credentials not configured');
        }

        return placePolymarketOrder(
          {
            apiKey: process.env.POLYMARKET_API_KEY,
            apiSecret: process.env.POLYMARKET_API_SECRET,
            apiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
          },
          input
        );
      }),

    // Get Polymarket positions
    getPolymarketPositions: protectedProcedure.query(async () => {
      const { getPolymarketPositions } = await import('./integrations/polymarketTrading');
      
      if (!process.env.POLYMARKET_API_KEY || !process.env.POLYMARKET_API_SECRET || !process.env.POLYMARKET_API_PASSPHRASE) {
        return [];
      }

      return getPolymarketPositions({
        apiKey: process.env.POLYMARKET_API_KEY,
        apiSecret: process.env.POLYMARKET_API_SECRET,
        apiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
      });
    }),
  }),

  // User positions management
  positions: router({
    // Get all positions for current user
    list: protectedProcedure
      .input(z.object({ status: z.enum(["open", "closed", "expired"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const { getUserPositions } = await import("./positions");
        return getUserPositions(ctx.user.id, input?.status);
      }),

    // Get single position by ID
    get: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const { getPositionById } = await import("./positions");
        return getPositionById(input, ctx.user.id);
      }),

    // Create new position
    create: protectedProcedure
      .input(z.object({
        venue: z.string(),
        question: z.string(),
        externalMarketId: z.string().optional(),
        marketUrl: z.string().optional(),
        side: z.enum(["YES", "NO"]),
        entryPrice: z.number().min(0).max(100),
        currentPrice: z.number().min(0).max(100).optional(),
        quantity: z.number().positive(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createPosition } = await import("./positions");
        return createPosition({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // Update position
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentPrice: z.number().min(0).max(100).optional(),
        quantity: z.number().positive().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updatePosition } = await import("./positions");
        const { id, ...updates } = input;
        return updatePosition(id, ctx.user.id, updates);
      }),

    // Close position
    close: protectedProcedure
      .input(z.object({
        id: z.number(),
        exitPrice: z.number().min(0).max(100),
        pnl: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { closePosition } = await import("./positions");
        return closePosition(input.id, ctx.user.id, input.exitPrice, input.pnl);
      }),

    // Delete position
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const { deletePosition } = await import("./positions");
        return deletePosition(input, ctx.user.id);
      }),

    // Get P&L summary
    summary: protectedProcedure.query(async ({ ctx }) => {
      const { calculateTotalPnL } = await import("./positions");
      return calculateTotalPnL(ctx.user.id);
    }),
  }),

  opportunities: router({
    // Get top opportunities
    top: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        const { getTopOpportunities } = await import("./db");
        return getTopOpportunities(input?.limit || 10);
      }),

    // Get opportunities for a specific event
    forEvent: publicProcedure.input(z.number()).query(async ({ input }) => {
      const { getOpportunitiesForEvent } = await import("./db");
      return getOpportunitiesForEvent(input);
    }),
  }),
});

export type AppRouter = typeof appRouter;

