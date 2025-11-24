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