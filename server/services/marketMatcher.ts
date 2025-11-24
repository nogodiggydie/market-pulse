/**
 * Market Matcher Service
 * 
 * Finds prediction markets related to news events using:
 * 1. Quick keyword pre-filter (reduces LLM calls by 99%)
 * 2. LLM relevance scoring for top candidates
 */

import { invokeLLM } from "../_core/llm";
import type { Market, Quote, Venue } from "../../drizzle/schema";

export interface MarketCandidate {
  market: Market;
  venue: Venue;
  latestQuote?: Quote;
  relevanceScore: number; // 0-100
  reasoning?: string;
}

/**
 * Find markets related to a news event
 */
export async function findMarketsForEvent(
  eventTitle: string,
  eventKeywords: string[],
  markets: Market[],
  venues: Map<number, Venue>,
  quotes: Map<number, Quote>,
  limit: number = 5
): Promise<MarketCandidate[]> {
  console.log(`\nSearching ${markets.length} markets for event: '${eventTitle}'`);
  console.log(`Keywords: ${eventKeywords.slice(0, 5).join(", ")}`);

  // First pass: Quick keyword filter
  const candidates: Array<{ market: Market; keywordScore: number }> = [];

  for (const market of markets) {
    const titleLower = market.title.toLowerCase();
    const keywordMatches = eventKeywords.filter((kw) => titleLower.includes(kw.toLowerCase())).length;

    if (keywordMatches > 0) {
      candidates.push({
        market,
        keywordScore: keywordMatches / eventKeywords.length,
      });
    }
  }

  console.log(`Pre-filtered to ${candidates.length} candidates with keyword overlap`);

  if (candidates.length === 0) {
    return [];
  }

  // Sort by keyword score and take top candidates for LLM analysis
  candidates.sort((a, b) => b.keywordScore - a.keywordScore);
  const topCandidates = candidates.slice(0, Math.min(20, candidates.length));

  // Second pass: LLM relevance scoring
  const results: MarketCandidate[] = [];

  for (const candidate of topCandidates) {
    const { market } = candidate;
    const venue = venues.get(market.venueId);
    const latestQuote = quotes.get(market.id);

    if (!venue) continue;

    const relevanceScore = await scoreMarketRelevance(
      eventTitle,
      eventKeywords,
      market.title,
      market.description || ""
    );

    if (relevanceScore > 60) {
      // Only include if >60% relevant
      results.push({
        market,
        venue,
        latestQuote,
        relevanceScore,
      });
    }
  }

  // Sort by relevance and return top N
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * Use LLM to score how relevant a market is to an event
 * Returns: Relevance score from 0-100
 */
async function scoreMarketRelevance(
  eventTitle: string,
  eventKeywords: string[],
  marketTitle: string,
  marketDescription: string
): Promise<number> {
  // Fallback to simple keyword matching if LLM fails
  const fallbackScore = simpleRelevanceScore(eventKeywords, marketTitle);

  try {
    const prompt = `Analyze if this prediction market is relevant to the given news event.

NEWS EVENT: "${eventTitle}"
EVENT KEYWORDS: ${eventKeywords.slice(0, 10).join(", ")}

PREDICTION MARKET: "${marketTitle}"
MARKET DESCRIPTION: "${marketDescription.slice(0, 200)}"

Respond with ONLY a JSON object:
{
  "relevance": 0-100,
  "reasoning": "brief explanation"
}

Scoring guide:
- 100: Directly about the same topic/outcome
- 80: Closely related, likely to be affected
- 60: Moderately related
- 40: Tangentially related
- 20: Weak connection
- 0: Not related

Example:
Event: "Fed raises interest rates"
Market: "Will inflation drop below 2% in 2024?"
Response: {"relevance": 90, "reasoning": "Fed rate hikes directly target inflation"}`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "relevance_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              relevance: { type: "number", description: "Relevance score 0-100" },
              reasoning: { type: "string", description: "Brief explanation" },
            },
            required: ["relevance", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") return fallbackScore;

    const parsed = JSON.parse(content);
    return Math.max(0, Math.min(100, parsed.relevance));
  } catch (error) {
    console.warn("LLM relevance scoring failed:", error);
    return fallbackScore;
  }
}

/**
 * Simple keyword-based relevance scoring (fallback)
 */
function simpleRelevanceScore(keywords: string[], marketTitle: string): number {
  const titleLower = marketTitle.toLowerCase();
  const matches = keywords.filter((kw) => titleLower.includes(kw.toLowerCase())).length;

  if (keywords.length === 0) return 0;

  // Boost score slightly, cap at 100
  return Math.min(100, Math.round((matches / keywords.length) * 150));
}
