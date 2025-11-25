import { fetchAllMarkets } from "./marketAggregator";
import type { UnifiedMarket } from "./marketAggregator";

/**
 * Fetch a single market by ID from a specific venue
 */
export async function getMarketById(venue: string, marketId: string): Promise<UnifiedMarket | null> {
  try {
    // Fetch all markets and find the specific one
    // This is not optimal but works for now - in production, use venue-specific APIs
    const markets = await fetchAllMarkets(100);
    
    // Try to find market by exact ID match or by venue-prefixed ID
    const market = markets.find((m) => 
      m.id === marketId || 
      m.id === `${venue}-${marketId}` ||
      (m.venue === venue && m.id.endsWith(marketId))
    );
    
    return market || null;
  } catch (error) {
    console.error(`[MarketFetcher] Error fetching ${venue}:${marketId}:`, error);
    return null;
  }
}
