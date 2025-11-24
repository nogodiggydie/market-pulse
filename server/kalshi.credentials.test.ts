import { describe, expect, it } from "vitest";
import { getKalshiBalance } from "./integrations/kalshiTrading";

describe("Kalshi Credentials Validation", () => {
  it("should successfully authenticate and fetch balance", async () => {
    if (!process.env.KALSHI_API_KEY || !process.env.KALSHI_PRIVATE_KEY) {
      throw new Error("Kalshi credentials not configured");
    }

    const balance = await getKalshiBalance({
      apiKey: process.env.KALSHI_API_KEY,
      privateKey: process.env.KALSHI_PRIVATE_KEY,
    });

    // Balance should be a number (could be 0)
    expect(typeof balance).toBe("number");
    expect(balance).toBeGreaterThanOrEqual(0);
  }, 30000); // 30 second timeout for API call
});
