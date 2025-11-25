import { describe, expect, it } from "vitest";
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

describe("positions", () => {
  it("should create a new position", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.positions.create({
      venue: "Kalshi",
      question: "Will Bitcoin reach $100k by end of 2025?",
      side: "YES",
      entryPrice: 65,
      quantity: 10,
      notes: "Test position",
    });

    expect(result).toBeDefined();
  });

  it("should list user positions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const positions = await caller.positions.list();

    expect(Array.isArray(positions)).toBe(true);
  });

  it("should filter positions by status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const openPositions = await caller.positions.list({ status: "open" });
    const closedPositions = await caller.positions.list({ status: "closed" });

    expect(Array.isArray(openPositions)).toBe(true);
    expect(Array.isArray(closedPositions)).toBe(true);
  });

  it("should calculate P&L summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.positions.summary();

    expect(summary).toBeDefined();
    expect(typeof summary.totalPnL).toBe("number");
    expect(typeof summary.openPositions).toBe("number");
    expect(typeof summary.closedPositions).toBe("number");
  });

  it("should only return positions for the authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);
    
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Create position for user 1
    await caller1.positions.create({
      venue: "Polymarket",
      question: "Test market for user 1",
      side: "YES",
      entryPrice: 50,
      quantity: 5,
    });

    // User 2 should not see user 1's positions
    const user2Positions = await caller2.positions.list();
    const user1Position = user2Positions.find(p => p.question === "Test market for user 1");
    
    expect(user1Position).toBeUndefined();
  });
});
