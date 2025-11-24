import { fetchKalshiMarkets, searchKalshiMarkets, type KalshiMarket } from "../integrations/kalshi";
import { fetchPolymarketMarkets, searchPolymarketMarkets, type PolymarketMarket } from "../integrations/polymarket";
import { fetchManifoldMarkets, searchManifoldMarkets, type ManifoldMarket } from "../integrations/manifold";

export interface UnifiedMarket {
  id: string;
  venue: "kalshi" | "polymarket" | "manifold";
  question: string;
  description?: string;
  category?: string;
  probability?: number;
  volume: number;
  liquidity: number;
  closeTime?: Date;
  url: string;
  status: "open" | "closed" | "resolved";
}

/**
 * Normalize Kalshi market to unified format
 */
function normalizeKalshiMarket(market: KalshiMarket): UnifiedMarket {
  const midPrice = market.yes_bid && market.yes_ask 
    ? (market.yes_bid + market.yes_ask) / 2 
    : 0.5;

  return {
    id: `kalshi-${market.ticker}`,
    venue: "kalshi",
    question: market.title,
    description: market.subtitle,
    category: market.category,
    probability: midPrice,
    volume: market.volume || 0,
    liquidity: market.liquidity || 0,
    closeTime: market.close_time ? new Date(market.close_time) : undefined,
    url: `https://kalshi.com/markets/${market.ticker}`,
    status: market.status === "open" ? "open" : "closed",
  };
}

/**
 * Normalize Polymarket market to unified format
 */
function normalizePolymarketMarket(market: PolymarketMarket): UnifiedMarket {
  const probability = market.outcomePrices && market.outcomePrices[0]
    ? parseFloat(market.outcomePrices[0])
    : 0.5;

  return {
    id: `polymarket-${market.id}`,
    venue: "polymarket",
    question: market.question,
    description: market.description,
    category: market.category,
    probability,
    volume: parseFloat(market.volume || "0"),
    liquidity: parseFloat(market.liquidity || "0"),
    closeTime: market.endDate ? new Date(market.endDate) : undefined,
    url: `https://polymarket.com/event/${market.id}`,
    status: market.closed ? "closed" : market.active ? "open" : "resolved",
  };
}

/**
 * Normalize Manifold market to unified format
 */
function normalizeManifoldMarket(market: ManifoldMarket): UnifiedMarket {
  return {
    id: `manifold-${market.id}`,
    venue: "manifold",
    question: market.question,
    description: market.description,
    probability: market.probability || 0.5,
    volume: market.volume24Hours || market.volume || 0,
    liquidity: market.totalLiquidity || 0,
    closeTime: market.closeTime ? new Date(market.closeTime) : undefined,
    url: market.url || `https://manifold.markets/${market.id}`,
    status: market.isResolved ? "resolved" : "open",
  };
}

/**
 * Fetch markets from all venues and normalize them
 */
export async function fetchAllMarkets(limit: number = 50): Promise<UnifiedMarket[]> {
  const perVenue = Math.ceil(limit / 3);

  const [kalshiMarkets, polymarketMarkets, manifoldMarkets] = await Promise.allSettled([
    fetchKalshiMarkets(perVenue),
    fetchPolymarketMarkets(perVenue),
    fetchManifoldMarkets(perVenue),
  ]);

  const unified: UnifiedMarket[] = [];

  if (kalshiMarkets.status === "fulfilled") {
    unified.push(...kalshiMarkets.value.map(normalizeKalshiMarket));
  }

  if (polymarketMarkets.status === "fulfilled") {
    unified.push(...polymarketMarkets.value.map(normalizePolymarketMarket));
  }

  if (manifoldMarkets.status === "fulfilled") {
    unified.push(...manifoldMarkets.value.map(normalizeManifoldMarket));
  }

  // Sort by volume descending
  return unified.sort((a, b) => b.volume - a.volume).slice(0, limit);
}

/**
 * Search markets across all venues
 */
export async function searchAllMarkets(query: string, limit: number = 20): Promise<UnifiedMarket[]> {
  const perVenue = Math.ceil(limit / 3);

  const [kalshiResults, polymarketResults, manifoldResults] = await Promise.allSettled([
    searchKalshiMarkets(query, perVenue),
    searchPolymarketMarkets(query, perVenue),
    searchManifoldMarkets(query, perVenue),
  ]);

  const unified: UnifiedMarket[] = [];

  if (kalshiResults.status === "fulfilled") {
    unified.push(...kalshiResults.value.map(normalizeKalshiMarket));
  }

  if (polymarketResults.status === "fulfilled") {
    unified.push(...polymarketResults.value.map(normalizePolymarketMarket));
  }

  if (manifoldResults.status === "fulfilled") {
    unified.push(...manifoldResults.value.map(normalizeManifoldMarket));
  }

  // Sort by relevance (volume as proxy) and liquidity
  return unified
    .sort((a, b) => {
      const scoreA = a.volume + a.liquidity;
      const scoreB = b.volume + b.liquidity;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
