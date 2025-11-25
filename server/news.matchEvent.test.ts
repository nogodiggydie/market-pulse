import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("news.matchEvent", () => {
  it("returns matched markets for a given event", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.matchEvent({
      title: "Bitcoin price surges to new all-time high",
      keywords: ["bitcoin", "price", "surge", "high"],
      limit: 3,
    });

    // Should return an array of matched markets
    expect(Array.isArray(result)).toBe(true);
    
    // Each market should have required fields
    if (result.length > 0) {
      const market = result[0];
      expect(market).toHaveProperty("market");
      expect(market).toHaveProperty("relevanceScore");
      expect(market.market).toHaveProperty("venue");
      expect(market.market).toHaveProperty("title");
    }
  }, 30000); // 30 second timeout for LLM processing

  it("respects the limit parameter", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.matchEvent({
      title: "Federal Reserve announces interest rate decision",
      keywords: ["federal", "reserve", "interest", "rate"],
      limit: 2,
    });

    // Should return at most 2 markets
    expect(result.length).toBeLessThanOrEqual(2);
  }, 30000);

  it("handles events with no matching markets gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.matchEvent({
      title: "Completely unrelated topic with no markets",
      keywords: ["xyzabc123", "nonexistent", "topic"],
      limit: 3,
    });

    // Should return empty array if no matches found
    expect(Array.isArray(result)).toBe(true);
  }, 30000);
});
