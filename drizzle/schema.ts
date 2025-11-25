import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  /** Stripe customer ID for payment processing */
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  /** Current subscription tier */
  subscriptionTier: mysqlEnum("subscription_tier", ["free", "pro", "premium"]).default("free").notNull(),
  /** Stripe subscription ID for active subscription */
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  /** Subscription status */
  subscriptionStatus: mysqlEnum("subscription_status", ["active", "canceled", "past_due", "trialing", "incomplete"]),
  /** Subscription end date (for canceled subscriptions) */
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Prediction market venues (Kalshi, Polymarket, Manifold)
 */
export const venues = mysqlTable("venues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  apiBase: text("apiBase"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = typeof venues.$inferInsert;

/**
 * Prediction markets from various venues
 */
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  externalId: varchar("externalId", { length: 255 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }),
  status: mysqlEnum("status", ["open", "active", "closed", "resolved"]).default("open").notNull(),
  closeTime: timestamp("closeTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

/**
 * Market price quotes (snapshots over time)
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  priceYes: int("priceYes"),
  priceNo: int("priceNo"),
  liquidity: int("liquidity"),
  volume: int("volume"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Trending news events from NewsAPI or demo data
 */
export const newsEvents = mysqlTable("newsEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  keywords: text("keywords"),
  source: varchar("source", { length: 64 }).notNull(),
  velocity: int("velocity").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  url: text("url"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsEvent = typeof newsEvents.$inferSelect;
export type InsertNewsEvent = typeof newsEvents.$inferInsert;

/**
 * Market-to-event matches with relevance scores
 */
export const marketMatches = mysqlTable("marketMatches", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  marketId: int("marketId").notNull(),
  relevanceScore: int("relevanceScore").notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketMatch = typeof marketMatches.$inferSelect;
export type InsertMarketMatch = typeof marketMatches.$inferInsert;

/**
 * Scored opportunities (news + market + signals)
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  marketId: int("marketId").notNull(),
  totalScore: int("totalScore").notNull(),
  relevanceScore: int("relevanceScore").notNull(),
  velocityScore: int("velocityScore").notNull(),
  liquidityScore: int("liquidityScore").notNull(),
  urgencyScore: int("urgencyScore").notNull(),
  momentumScore: int("momentumScore").notNull(),
  momentum1h: int("momentum1h"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Market matching cache with TTL (5 minutes)
 * Stores LLM-matched markets for news events to reduce API costs
 */
export const marketCache = mysqlTable("marketCache", {
  id: int("id").autoincrement().primaryKey(),
  /** Hash of event title + keywords for cache key */
  eventHash: varchar("eventHash", { length: 64 }).notNull().unique(),
  /** Original event title for debugging */
  eventTitle: text("eventTitle").notNull(),
  /** JSON array of matched markets with relevance scores */
  matchedMarkets: text("matchedMarkets").notNull(),
  /** Cache creation timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Cache expiration timestamp (createdAt + 5 minutes) */
  expiresAt: timestamp("expiresAt").notNull(),
});

export type MarketCache = typeof marketCache.$inferSelect;
export type InsertMarketCache = typeof marketCache.$inferInsert;

/**
 * User positions (trades) in prediction markets
 * Tracks active and closed positions across all venues
 */
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  /** User who owns this position */
  userId: int("userId").notNull(),
  /** Venue where the trade was made (Kalshi, Polymarket, Manifold) */
  venue: varchar("venue", { length: 64 }).notNull(),
  /** Market question/title */
  question: text("question").notNull(),
  /** External market ID from the venue */
  externalMarketId: varchar("externalMarketId", { length: 255 }),
  /** Market URL for direct access */
  marketUrl: text("marketUrl"),
  /** Position side (YES or NO) */
  side: mysqlEnum("side", ["YES", "NO"]).notNull(),
  /** Entry price (probability 0-100) */
  entryPrice: int("entryPrice").notNull(),
  /** Current price (probability 0-100) - updated manually or via API */
  currentPrice: int("currentPrice"),
  /** Quantity/size of position */
  quantity: int("quantity").notNull(),
  /** Position status */
  status: mysqlEnum("status", ["open", "closed", "expired"]).default("open").notNull(),
  /** Exit price if closed */
  exitPrice: int("exitPrice"),
  /** Profit/loss in dollars */
  pnl: int("pnl"),
  /** Notes or reasoning for the trade */
  notes: text("notes"),
  /** Date position was opened */
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  /** Date position was closed */
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;