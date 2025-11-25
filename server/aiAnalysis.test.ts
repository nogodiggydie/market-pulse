import { describe, expect, it } from "vitest";
import { analyzeNewsImpact } from "./services/aiAnalysis";

describe("AI Analysis", () => {
  it("analyzes bullish news impact", async () => {
    const analysis = await analyzeNewsImpact(
      "Bitcoin surges to new all-time high above $100,000",
      "Bitcoin has reached a historic milestone, breaking through $100,000 for the first time amid strong institutional demand and positive regulatory developments.",
      [
        {
          question: "Will Bitcoin reach $150,000 by end of 2025?",
          venue: "Polymarket",
          probability: 0.45,
        },
      ]
    );

    expect(analysis).toBeDefined();
    expect(analysis.sentiment).toMatch(/bullish|bearish|neutral/);
    expect(analysis.confidence).toBeGreaterThanOrEqual(0);
    expect(analysis.confidence).toBeLessThanOrEqual(100);
    expect(analysis.reasoning).toBeTruthy();
    expect(analysis.marketImpact).toBeTruthy();
    expect(analysis.suggestedAction).toBeTruthy();
    expect(Array.isArray(analysis.keyFactors)).toBe(true);
    expect(analysis.keyFactors.length).toBeGreaterThan(0);
    expect(analysis.riskLevel).toMatch(/low|medium|high/);
  }, 60000); // 60s timeout for LLM call

  it("analyzes bearish news impact", async () => {
    const analysis = await analyzeNewsImpact(
      "Major cryptocurrency exchange hacked, $500M stolen",
      "A major security breach has compromised user funds on one of the world's largest cryptocurrency exchanges, raising concerns about market security.",
      []
    );

    expect(analysis).toBeDefined();
    expect(analysis.sentiment).toMatch(/bullish|bearish|neutral/);
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.reasoning).toBeTruthy();
    expect(analysis.keyFactors.length).toBeGreaterThan(0);
  }, 60000);

  it("analyzes news without related markets", async () => {
    const analysis = await analyzeNewsImpact(
      "Federal Reserve announces interest rate decision",
      "The Federal Reserve has decided to maintain current interest rates amid mixed economic signals.",
      undefined
    );

    expect(analysis).toBeDefined();
    expect(analysis.sentiment).toBeDefined();
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.marketImpact).toBeTruthy();
  }, 60000);

  it("returns valid risk assessment", async () => {
    const analysis = await analyzeNewsImpact(
      "Tech stocks rally on strong earnings reports",
      "Major technology companies have reported better-than-expected quarterly earnings, driving market optimism.",
      [
        {
          question: "Will NASDAQ reach new highs this quarter?",
          venue: "Manifold",
          probability: 0.65,
        },
      ]
    );

    expect(analysis.riskLevel).toMatch(/low|medium|high/);
    expect(analysis.keyFactors).toBeDefined();
    expect(analysis.keyFactors.length).toBeGreaterThanOrEqual(1);
  }, 60000);
});
