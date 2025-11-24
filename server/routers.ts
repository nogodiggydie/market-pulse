import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

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
    // Get trending news events
    trending: publicProcedure.query(async () => {
      const { fetchTrendingEvents } = await import("./services/newsDetector");
      const newsApiKey = process.env.NEWSAPI_KEY;
      const events = await fetchTrendingEvents(10, newsApiKey);
      return events;
    }),

    // Get news by category
    byCategory: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const { getNewsEventsByCategory } = await import("./db");
        return getNewsEventsByCategory(input.category, input.limit);
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
