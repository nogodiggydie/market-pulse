import { describe, expect, it } from "vitest";
import { fetchAllMarkets, searchAllMarkets } from "./services/marketAggregator";
import { fetchTrendingEvents } from "./services/newsDetector";
import { findMarketsForEvent } from "./services/marketMatcher";

describe("Live API Integration", () => {
  it("fetches markets from all venues", async () => {
    const markets = await fetchAllMarkets(30);
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
    expect(markets.length).toBeLessThanOrEqual(30);
    
    // Check unified format
    const market = markets[0];
    expect(market).toHaveProperty("id");
    expect(market).toHaveProperty("venue");
    expect(market).toHaveProperty("question");
    expect(market).toHaveProperty("volume");
    expect(market).toHaveProperty("url");
    expect(["kalshi", "polymarket", "manifold"]).toContain(market.venue);
  }, 20000);

  it("searches markets across all venues", async () => {
    const markets = await searchAllMarkets("election", 10);
    
    expect(Array.isArray(markets)).toBe(true);
    // Search may return 0 results if no matches
    if (markets.length > 0) {
      expect(markets[0]).toHaveProperty("question");
      expect(markets[0].question.toLowerCase()).toMatch(/election|president|vote|congress/);
    }
  }, 20000);

  it("fetches trending news events", async () => {
    const events = await fetchTrendingEvents(5, process.env.NEWSAPI_KEY);
    
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    
    const event = events[0];
    expect(event).toHaveProperty("title");
    expect(event).toHaveProperty("description");
    expect(event).toHaveProperty("keywords");
    expect(event).toHaveProperty("velocity");
    expect(event).toHaveProperty("category");
    expect(Array.isArray(event.keywords)).toBe(true);
  }, 15000);

  it("matches markets to news events", async () => {
    const events = await fetchTrendingEvents(2, process.env.NEWSAPI_KEY);
    const markets = await fetchAllMarkets(100);
    
    expect(events.length).toBeGreaterThan(0);
    expect(markets.length).toBeGreaterThan(0);
    
    const event = events[0];
    const matches = await findMarketsForEvent(
      event.title,
      event.keywords,
      markets,
      3
    );
    
    expect(Array.isArray(matches)).toBe(true);
    // Matches may be 0 if no relevant markets found
    if (matches.length > 0) {
      expect(matches[0]).toHaveProperty("market");
      expect(matches[0]).toHaveProperty("relevanceScore");
      expect(matches[0].relevanceScore).toBeGreaterThan(0);
      expect(matches[0].relevanceScore).toBeLessThanOrEqual(100);
    }
  }, 30000);
});
