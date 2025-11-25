import { createHash } from "crypto";
import { eq, lt } from "drizzle-orm";
import { getDb } from "../db";
import { marketCache, type InsertMarketCache } from "../../drizzle/schema";

/**
 * Generate a unique hash for an event based on title and keywords
 */
export function generateEventHash(title: string, keywords: string[]): string {
  const normalized = `${title.toLowerCase()}|${keywords.sort().join(",")}`;
  return createHash("sha256").update(normalized).digest("hex").substring(0, 64);
}

/**
 * Get cached matched markets for an event
 * Returns null if cache miss or expired
 */
export async function getCachedMarkets(
  title: string,
  keywords: string[]
): Promise<any[] | null> {
  const db = await getDb();
  if (!db) return null;

  const eventHash = generateEventHash(title, keywords);
  const now = new Date();

  try {
    const cached = await db
      .select()
      .from(marketCache)
      .where(eq(marketCache.eventHash, eventHash))
      .limit(1);

    if (cached.length === 0) {
      console.log(`[Cache] MISS for event: "${title}"`);
      return null;
    }

    const entry = cached[0];
    
    // Check if expired
    if (entry.expiresAt < now) {
      console.log(`[Cache] EXPIRED for event: "${title}"`);
      // Clean up expired entry
      await db.delete(marketCache).where(eq(marketCache.eventHash, eventHash));
      return null;
    }

    console.log(`[Cache] HIT for event: "${title}"`);
    return JSON.parse(entry.matchedMarkets);
  } catch (error) {
    console.error("[Cache] Error reading cache:", error);
    return null;
  }
}

/**
 * Store matched markets in cache with 5-minute TTL
 */
export async function setCachedMarkets(
  title: string,
  keywords: string[],
  matchedMarkets: any[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const eventHash = generateEventHash(title, keywords);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  try {
    const cacheEntry: InsertMarketCache = {
      eventHash,
      eventTitle: title,
      matchedMarkets: JSON.stringify(matchedMarkets),
      expiresAt,
    };

    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle race conditions
    await db
      .insert(marketCache)
      .values(cacheEntry)
      .onDuplicateKeyUpdate({
        set: {
          matchedMarkets: cacheEntry.matchedMarkets,
          expiresAt: cacheEntry.expiresAt,
        },
      });

    console.log(`[Cache] STORED for event: "${title}" (expires at ${expiresAt.toISOString()})`);
  } catch (error) {
    console.error("[Cache] Error storing cache:", error);
  }
}

/**
 * Clean up expired cache entries
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanExpiredCache(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();

  try {
    await db
      .delete(marketCache)
      .where(lt(marketCache.expiresAt, now));

    console.log(`[Cache] Cleaned up expired entries`);
    return 0;
  } catch (error) {
    console.error("[Cache] Error cleaning cache:", error);
    return 0;
  }
}
