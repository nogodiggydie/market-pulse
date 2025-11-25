import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    stripeCustomerId: null,
    subscriptionTier: "free",
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionEndsAt: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("journal - tags", () => {
  it("should create a new tag", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tag = await caller.journal.tags.create({
      name: "high conviction",
      color: "#10b981",
    });

    expect(tag).toBeDefined();
    expect(tag.name).toBe("high-conviction"); // Should be normalized
    expect(tag.color).toBe("#10b981");
  });

  it("should list user tags", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tags = await caller.journal.tags.list();

    expect(Array.isArray(tags)).toBe(true);
  });

  it("should delete a tag", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tag
    const tag = await caller.journal.tags.create({
      name: "test-tag",
    });

    // Delete it
    const result = await caller.journal.tags.delete(tag.id);

    expect(result.success).toBe(true);
  });

  it("should only show tags for the authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a tag
    await caller1.journal.tags.create({ name: "user1-tag" });

    // User 2 should not see user 1's tags
    const user2Tags = await caller2.journal.tags.list();
    const user1Tag = user2Tags.find((t) => t.name === "user1-tag");

    expect(user1Tag).toBeUndefined();
  });
});

describe("journal - position tagging", () => {
  it("should add a tag to a position", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tag
    const tag = await caller.journal.tags.create({ name: "earnings-play" });

    // Create a position
    const position = await caller.positions.create({
      venue: "Kalshi",
      question: "Test market",
      side: "YES",
      entryPrice: 50,
      quantity: 10,
    });

    // Add tag to position
    const result = await caller.journal.addTag({
      positionId: position.id,
      tagId: tag.id,
    });

    expect(result.success).toBe(true);
  });

  it("should remove a tag from a position", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create tag and position
    const tag = await caller.journal.tags.create({ name: "test-tag" });
    const position = await caller.positions.create({
      venue: "Polymarket",
      question: "Test market",
      side: "NO",
      entryPrice: 40,
      quantity: 5,
    });

    // Add tag
    await caller.journal.addTag({
      positionId: position.id,
      tagId: tag.id,
    });

    // Remove tag
    const result = await caller.journal.removeTag({
      positionId: position.id,
      tagId: tag.id,
    });

    expect(result.success).toBe(true);
  });

  it("should get positions with their tags", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const positions = await caller.journal.positionsWithTags();

    expect(Array.isArray(positions)).toBe(true);
    // Each position should have a tags array
    positions.forEach((p) => {
      expect(Array.isArray(p.tags)).toBe(true);
    });
  });
});

describe("journal - analytics", () => {
  it("should calculate tag analytics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const analytics = await caller.journal.tagAnalytics();

    expect(Array.isArray(analytics)).toBe(true);
    // Each analytics entry should have required fields
    analytics.forEach((a) => {
      expect(a).toHaveProperty("tagName");
      expect(a).toHaveProperty("totalTrades");
      expect(a).toHaveProperty("winRate");
      expect(a).toHaveProperty("totalPnL");
    });
  });

  it("should calculate journal insights", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const insights = await caller.journal.insights();

    expect(insights).toBeDefined();
    expect(insights).toHaveProperty("totalTrades");
    expect(insights).toHaveProperty("winRate");
    expect(insights).toHaveProperty("totalPnL");
    expect(insights).toHaveProperty("avgWin");
    expect(insights).toHaveProperty("avgLoss");
    expect(insights).toHaveProperty("profitFactor");
  });

  it("should calculate win rate correctly", async () => {
    const { ctx } = createAuthContext(99); // Use unique user ID
    const caller = appRouter.createCaller(ctx);

    // Get initial state
    const initialInsights = await caller.journal.insights();
    const initialClosed = initialInsights?.closedTrades || 0;
    const initialWinning = initialInsights?.winningTrades || 0;
    const initialLosing = initialInsights?.losingTrades || 0;

    // Create two closed positions - one win, one loss
    await caller.positions.create({
      venue: "Kalshi",
      question: "Winning trade",
      side: "YES",
      entryPrice: 50,
      quantity: 10,
    });

    // Close with profit
    const positions = await caller.positions.list();
    const winPosition = positions.find((p) => p.question === "Winning trade");
    if (winPosition) {
      await caller.positions.close({
        id: winPosition.id,
        exitPrice: 70,
        pnl: 200,
      });
    }

    // Create losing position
    await caller.positions.create({
      venue: "Polymarket",
      question: "Losing trade",
      side: "NO",
      entryPrice: 60,
      quantity: 10,
    });

    const updatedPositions = await caller.positions.list();
    const lossPosition = updatedPositions.find((p) => p.question === "Losing trade");
    if (lossPosition) {
      await caller.positions.close({
        id: lossPosition.id,
        exitPrice: 40,
        pnl: -200,
      });
    }

    // Check insights - verify the delta
    const finalInsights = await caller.journal.insights();

    expect(finalInsights?.closedTrades).toBe(initialClosed + 2);
    expect(finalInsights?.winningTrades).toBe(initialWinning + 1);
    expect(finalInsights?.losingTrades).toBe(initialLosing + 1);
    // Win rate should be calculated correctly
    expect(finalInsights?.winRate).toBeGreaterThan(0);
    expect(finalInsights?.winRate).toBeLessThanOrEqual(100);
  });
});
