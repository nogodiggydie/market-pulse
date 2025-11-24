const MANIFOLD_API_BASE = "https://api.manifold.markets/v0";

export interface ManifoldMarket {
  id: string;
  question: string;
  description?: string;
  creatorUsername: string;
  createdTime: number;
  closeTime?: number;
  isResolved: boolean;
  probability?: number;
  volume: number;
  volume24Hours: number;
  outcomeType: string;
  mechanism: string;
  url: string;
  pool?: Record<string, number>;
  totalLiquidity?: number;
}

/**
 * Fetch markets from Manifold
 * Fully public API - no authentication required
 */
export async function fetchManifoldMarkets(limit: number = 100): Promise<ManifoldMarket[]> {
  try {
    const response = await fetch(
      `${MANIFOLD_API_BASE}/markets?limit=${limit}&sort=last-bet-time`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Manifold] API error: ${response.status} - ${errorText}`);
      throw new Error(`Manifold API error: ${response.status}`);
    }

    const markets = await response.json();
    
    return Array.isArray(markets) ? markets : [];
  } catch (error) {
    console.error("[Manifold] Failed to fetch markets:", error);
    throw error;
  }
}

/**
 * Search Manifold markets by query
 */
export async function searchManifoldMarkets(query: string, limit: number = 20): Promise<ManifoldMarket[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${MANIFOLD_API_BASE}/search-markets?term=${encodedQuery}&limit=${limit}&sort=liquidity`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Manifold] Search error: ${response.status}`);
      return [];
    }

    const markets = await response.json();
    
    return Array.isArray(markets) ? markets : [];
  } catch (error) {
    console.error("[Manifold] Failed to search markets:", error);
    return [];
  }
}

/**
 * Get a specific market by ID or slug
 */
export async function getManifoldMarket(marketId: string): Promise<ManifoldMarket | null> {
  try {
    const response = await fetch(`${MANIFOLD_API_BASE}/market/${marketId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Manifold] Market not found: ${marketId}`);
      return null;
    }

    const market = await response.json();
    
    return market || null;
  } catch (error) {
    console.error(`[Manifold] Failed to get market ${marketId}:`, error);
    return null;
  }
}

/**
 * Get trending markets (high volume in last 24h)
 */
export async function getTrendingManifoldMarkets(limit: number = 20): Promise<ManifoldMarket[]> {
  try {
    const response = await fetch(
      `${MANIFOLD_API_BASE}/markets?limit=${limit}&sort=last-bet-time`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[Manifold] Failed to get trending markets`);
      return [];
    }

    const markets = await response.json();
    
    return Array.isArray(markets) ? markets : [];
  } catch (error) {
    console.error("[Manifold] Failed to get trending markets:", error);
    return [];
  }
}
