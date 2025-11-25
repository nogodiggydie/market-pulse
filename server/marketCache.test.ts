import { describe, expect, it, beforeEach } from "vitest";
import { generateEventHash, getCachedMarkets, setCachedMarkets } from "./services/marketCache";
import { getDb } from "./db";
import { marketCache } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("marketCache", () => {
  const testTitle = "Bitcoin price surges to new highs";
  const testKeywords = ["bitcoin", "price", "surge"];
  const testMarkets = [
    {
      market: {
        id: 1,
        venue: "Kalshi",
        title: "Will Bitcoin reach $100k?",
        probability: 0.65,
      },
      relevanceScore: 95,
    },
    {
      market: {
        id: 2,
        venue: "Polymarket",
        title: "Bitcoin above $90k by EOY?",
        probability: 0.72,
      },
      relevanceScore: 88,
    },
  ];

  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDb();
    if (db) {
      const hash = generateEventHash(testTitle, testKeywords);
      await db.delete(marketCache).where(eq(marketCache.eventHash, hash));
    }
  });

  it("generates consistent hash for same input", () => {
    const hash1 = generateEventHash(testTitle, testKeywords);
    const hash2 = generateEventHash(testTitle, testKeywords);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex is 64 chars
  });

  it("generates different hash for different keywords order (normalized)", () => {
    const hash1 = generateEventHash(testTitle, ["bitcoin", "price", "surge"]);
    const hash2 = generateEventHash(testTitle, ["surge", "bitcoin", "price"]);
    
    // Should be same because keywords are sorted
    expect(hash1).toBe(hash2);
  });

  it("stores and retrieves cached markets", async () => {
    // Store in cache
    await setCachedMarkets(testTitle, testKeywords, testMarkets);

    // Retrieve from cache
    const cached = await getCachedMarkets(testTitle, testKeywords);

    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(2);
    expect(cached![0].market.title).toBe("Will Bitcoin reach $100k?");
    expect(cached![0].relevanceScore).toBe(95);
  });

  it("returns null for cache miss", async () => {
    const cached = await getCachedMarkets("Nonexistent event", ["test"]);
    
    expect(cached).toBeNull();
  });

  it("respects TTL and expires after 5 minutes", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available, skipping TTL test");
      return;
    }

    // Store in cache
    await setCachedMarkets(testTitle, testKeywords, testMarkets);

    // Manually update expiration to past
    const hash = generateEventHash(testTitle, testKeywords);
    const pastDate = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
    
    await db
      .update(marketCache)
      .set({ expiresAt: pastDate })
      .where(eq(marketCache.eventHash, hash));

    // Try to retrieve - should return null and clean up
    const cached = await getCachedMarkets(testTitle, testKeywords);
    
    expect(cached).toBeNull();
  }, 10000);

  it("updates existing cache entry on duplicate", async () => {
    // Store first version
    await setCachedMarkets(testTitle, testKeywords, testMarkets);

    // Store updated version
    const updatedMarkets = [
      {
        market: {
          id: 3,
          venue: "Manifold",
          title: "Updated market",
          probability: 0.80,
        },
        relevanceScore: 92,
      },
    ];
    
    await setCachedMarkets(testTitle, testKeywords, updatedMarkets);

    // Retrieve - should get updated version
    const cached = await getCachedMarkets(testTitle, testKeywords);

    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(1);
    expect(cached![0].market.title).toBe("Updated market");
  });
});
