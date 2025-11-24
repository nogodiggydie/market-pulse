import { describe, expect, it } from "vitest";
import { fetchKalshiMarkets, searchKalshiMarkets } from "./integrations/kalshi";
import { fetchPolymarketMarkets, searchPolymarketMarkets } from "./integrations/polymarket";
import { fetchManifoldMarkets, searchManifoldMarkets } from "./integrations/manifold";

describe("Kalshi API Integration", () => {
  it("fetches active markets with valid credentials", async () => {
    const markets = await fetchKalshiMarkets(5);
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0]).toHaveProperty("ticker");
    expect(markets[0]).toHaveProperty("title");
  }, 15000);

  it("searches markets by query", async () => {
    const markets = await searchKalshiMarkets("election", 5);
    
    expect(Array.isArray(markets)).toBe(true);
    // Search may return 0 results if no matches
    if (markets.length > 0) {
      expect(markets[0]).toHaveProperty("ticker");
    }
  }, 15000);
});

describe("Polymarket API Integration", () => {
  it("fetches active markets from public API", async () => {
    const markets = await fetchPolymarketMarkets(5);
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0]).toHaveProperty("question");
  }, 15000);

  it("searches markets by query", async () => {
    const markets = await searchPolymarketMarkets("trump", 5);
    
    expect(Array.isArray(markets)).toBe(true);
    if (markets.length > 0) {
      expect(markets[0]).toHaveProperty("question");
    }
  }, 15000);
});

describe("Manifold API Integration", () => {
  it("fetches markets from public API", async () => {
    const markets = await fetchManifoldMarkets(5);
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0]).toHaveProperty("question");
    expect(markets[0]).toHaveProperty("id");
  }, 15000);

  it("searches markets by query", async () => {
    const markets = await searchManifoldMarkets("AI", 5);
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
    expect(markets[0]).toHaveProperty("question");
  }, 15000);
});

describe("NewsAPI Integration", () => {
  it("validates NewsAPI key is configured", () => {
    expect(process.env.NEWSAPI_KEY).toBeTruthy();
    expect(process.env.NEWSAPI_KEY).toMatch(/^[a-f0-9]{32}$/);
  });
});
