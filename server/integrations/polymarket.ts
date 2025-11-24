const POLYMARKET_API_BASE = "https://gamma-api.polymarket.com";
const POLYMARKET_CLOB_API = "https://clob.polymarket.com";

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  closed: boolean;
  active: boolean;
  category?: string;
}

/**
 * Fetch active markets from Polymarket
 * Uses public Gamma API - no authentication required
 */
export async function fetchPolymarketMarkets(limit: number = 100): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(
      `${POLYMARKET_API_BASE}/markets?limit=${limit}&active=true&closed=false`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Polymarket] API error: ${response.status} - ${errorText}`);
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const markets = await response.json();
    
    return Array.isArray(markets) ? markets : [];
  } catch (error) {
    console.error("[Polymarket] Failed to fetch markets:", error);
    throw error;
  }
}

/**
 * Search Polymarket markets by query
 */
export async function searchPolymarketMarkets(query: string, limit: number = 20): Promise<PolymarketMarket[]> {
  try {
    // Polymarket doesn't have a direct search endpoint, so we fetch and filter
    const markets = await fetchPolymarketMarkets(200);
    
    const lowerQuery = query.toLowerCase();
    const filtered = markets.filter(
      (m) =>
        m.question.toLowerCase().includes(lowerQuery) ||
        m.description?.toLowerCase().includes(lowerQuery)
    );

    return filtered.slice(0, limit);
  } catch (error) {
    console.error("[Polymarket] Failed to search markets:", error);
    return [];
  }
}

/**
 * Get a specific market by ID
 */
export async function getPolymarketMarket(marketId: string): Promise<PolymarketMarket | null> {
  try {
    const response = await fetch(`${POLYMARKET_API_BASE}/markets/${marketId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Polymarket] Market not found: ${marketId}`);
      return null;
    }

    const market = await response.json();
    
    return market || null;
  } catch (error) {
    console.error(`[Polymarket] Failed to get market ${marketId}:`, error);
    return null;
  }
}

/**
 * Get market prices (orderbook data)
 */
export async function getPolymarketPrices(tokenId: string): Promise<any> {
  try {
    const response = await fetch(`${POLYMARKET_CLOB_API}/prices/${tokenId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Polymarket] Prices not found for token: ${tokenId}`);
      return null;
    }

    const prices = await response.json();
    
    return prices;
  } catch (error) {
    console.error(`[Polymarket] Failed to get prices for ${tokenId}:`, error);
    return null;
  }
}

// TODO: Add trading functions when API credentials are available
// export async function placePolymarketOrder(params: OrderParams) { ... }
