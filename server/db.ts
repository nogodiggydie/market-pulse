import { eq, desc, and, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  venues,
  markets,
  quotes,
  newsEvents,
  marketMatches,
  opportunities,
  InsertVenue,
  InsertMarket,
  InsertQuote,
  InsertNewsEvent,
  InsertMarketMatch,
  InsertOpportunity,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * News & Market Intelligence Queries
 */

// Venue operations
export async function getActiveVenues() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(venues).where(eq(venues.isActive, 1));
}

export async function upsertVenue(venue: InsertVenue) {
  const db = await getDb();
  if (!db) return;
  await db.insert(venues).values(venue).onDuplicateKeyUpdate({ set: { apiBase: venue.apiBase } });
}

// Market operations
export async function getActiveMarkets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(markets).where(eq(markets.status, "open"));
}

export async function getMarketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result[0];
}

export async function upsertMarket(market: InsertMarket) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(markets)
    .values(market)
    .onDuplicateKeyUpdate({
      set: {
        title: market.title,
        description: market.description,
        status: market.status,
        closeTime: market.closeTime,
      },
    });
}

// Quote operations
export async function insertQuote(quote: InsertQuote) {
  const db = await getDb();
  if (!db) return;
  await db.insert(quotes).values(quote);
}

export async function getLatestQuoteForMarket(marketId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(quotes)
    .where(eq(quotes.marketId, marketId))
    .orderBy(desc(quotes.timestamp))
    .limit(1);
  return result[0];
}

export async function getQuoteHistory(marketId: number, hoursAgo: number) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return db
    .select()
    .from(quotes)
    .where(and(eq(quotes.marketId, marketId), gte(quotes.timestamp, cutoff)))
    .orderBy(desc(quotes.timestamp));
}

// News event operations
export async function insertNewsEvent(event: InsertNewsEvent) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(newsEvents).values(event);
  return result;
}

export async function getRecentNewsEvents(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsEvents).orderBy(desc(newsEvents.publishedAt)).limit(limit);
}

export async function getNewsEventsByCategory(category: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(newsEvents)
    .where(eq(newsEvents.category, category))
    .orderBy(desc(newsEvents.publishedAt))
    .limit(limit);
}

// Market match operations
export async function insertMarketMatch(match: InsertMarketMatch) {
  const db = await getDb();
  if (!db) return;
  await db.insert(marketMatches).values(match);
}

export async function getMatchesForEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(marketMatches)
    .where(eq(marketMatches.eventId, eventId))
    .orderBy(desc(marketMatches.relevanceScore));
}

// Opportunity operations
export async function insertOpportunity(opp: InsertOpportunity) {
  const db = await getDb();
  if (!db) return;
  await db.insert(opportunities).values(opp);
}

export async function getTopOpportunities(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunities).orderBy(desc(opportunities.totalScore)).limit(limit);
}

export async function getOpportunitiesForEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(opportunities)
    .where(eq(opportunities.eventId, eventId))
    .orderBy(desc(opportunities.totalScore));
}
