// Using Kalshi's public API endpoints (no authentication required for market data)
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  category: string;
  status: string;
  close_time: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  liquidity: number;
}

/**
 * Fetch active markets from Kalshi using public endpoints
 * No authentication required
 */
export async function fetchKalshiMarkets(limit: number = 100): Promise<KalshiMarket[]> {
  try {
    const response = await fetch(
      `${KALSHI_API_BASE}/markets?limit=${limit}&status=open`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kalshi] API error: ${response.status} - ${errorText}`);
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.markets || [];
  } catch (error) {
    console.error("[Kalshi] Failed to fetch markets:", error);
    throw error;
  }
}

/**
 * Search Kalshi markets by query using public endpoints
 */
export async function searchKalshiMarkets(query: string, limit: number = 20): Promise<KalshiMarket[]> {
  try {
    // Fetch markets and filter client-side since public API doesn't support search
    const markets = await fetchKalshiMarkets(200);
    
    const lowerQuery = query.toLowerCase();
    const filtered = markets.filter(
      (m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.subtitle?.toLowerCase().includes(lowerQuery) ||
        m.ticker.toLowerCase().includes(lowerQuery)
    );

    return filtered.slice(0, limit);
  } catch (error) {
    console.error("[Kalshi] Failed to search markets:", error);
    return [];
  }
}

/**
 * Get a specific market by ticker using public endpoints
 */
export async function getKalshiMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const response = await fetch(`${KALSHI_API_BASE}/markets/${ticker}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Kalshi] Market not found: ${ticker}`);
      return null;
    }

    const data = await response.json();
    
    return data.market || null;
  } catch (error) {
    console.error(`[Kalshi] Failed to get market ${ticker}:`, error);
    return null;
  }
}

// TODO: Add authenticated endpoints when RSA signing is resolved
// For now, public endpoints provide all the market data we need
