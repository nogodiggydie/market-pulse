import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("news.trending", () => {
  it("should return trending news events", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.trending();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check first event structure
    const firstEvent = result[0];
    expect(firstEvent).toHaveProperty("title");
    expect(firstEvent).toHaveProperty("description");
    expect(firstEvent).toHaveProperty("keywords");
    expect(firstEvent).toHaveProperty("source");
    expect(firstEvent).toHaveProperty("velocity");
    expect(firstEvent).toHaveProperty("category");
    expect(firstEvent).toHaveProperty("publishedAt");

    // Validate types
    expect(typeof firstEvent.title).toBe("string");
    expect(typeof firstEvent.velocity).toBe("number");
    expect(Array.isArray(firstEvent.keywords)).toBe(true);
    expect(firstEvent.velocity).toBeGreaterThanOrEqual(0);
    expect(firstEvent.velocity).toBeLessThanOrEqual(100);
  });

  it("should return events with valid categories", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.trending();

    const validCategories = ["crypto", "politics", "economy", "tech", "general"];
    
    result.forEach((event) => {
      expect(validCategories).toContain(event.category);
    });
  });

  it("should return events sorted by velocity (highest first)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.trending();

    if (result.length > 1) {
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].velocity).toBeGreaterThanOrEqual(result[i + 1].velocity);
      }
    }
  });
});
