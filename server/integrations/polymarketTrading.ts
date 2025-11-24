import crypto from 'crypto';

const POLYMARKET_CLOB_API = 'https://clob.polymarket.com';

interface PolymarketCredentials {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
}

interface PolymarketOrderRequest {
  tokenId: string; // The outcome token ID
  price: number; // Price in USDC (0-1 range)
  size: number; // Size in USDC
  side: 'BUY' | 'SELL';
  feeRateBps?: number;
}

interface PolymarketOrder {
  orderId: string;
  marketId: string;
  tokenId: string;
  price: number;
  size: number;
  side: string;
  status: string;
  createdAt: string;
}

interface PolymarketPosition {
  marketId: string;
  tokenId: string;
  outcome: string;
  size: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

/**
 * Generate HMAC signature for Polymarket CLOB API
 */
function generatePolymarketSignature(
  timestamp: string,
  method: string,
  path: string,
  body: string,
  secret: string
): string {
  const message = timestamp + method + path + body;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
}

/**
 * Make authenticated request to Polymarket CLOB API
 */
async function polymarketAuthRequest(
  method: string,
  endpoint: string,
  credentials: PolymarketCredentials,
  body?: any
): Promise<any> {
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  
  const signature = generatePolymarketSignature(
    timestamp,
    method,
    endpoint,
    bodyStr,
    credentials.apiSecret
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'POLY-API-KEY': credentials.apiKey,
    'POLY-SIGNATURE': signature,
    'POLY-TIMESTAMP': timestamp,
    'POLY-PASSPHRASE': credentials.apiPassphrase,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = bodyStr;
  }

  const response = await fetch(`${POLYMARKET_CLOB_API}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Polymarket API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Place an order on Polymarket
 */
export async function placePolymarketOrder(
  credentials: PolymarketCredentials,
  order: PolymarketOrderRequest
): Promise<PolymarketOrder> {
  const response = await polymarketAuthRequest(
    'POST',
    '/orders',
    credentials,
    order
  );

  return response;
}

/**
 * Cancel an order on Polymarket
 */
export async function cancelPolymarketOrder(
  credentials: PolymarketCredentials,
  orderId: string
): Promise<void> {
  await polymarketAuthRequest(
    'DELETE',
    `/orders/${orderId}`,
    credentials
  );
}

/**
 * Get user's orders
 */
export async function getPolymarketOrders(
  credentials: PolymarketCredentials,
  marketId?: string
): Promise<PolymarketOrder[]> {
  const query = marketId ? `?market=${marketId}` : '';
  const response = await polymarketAuthRequest(
    'GET',
    `/orders${query}`,
    credentials
  );

  return response.orders || [];
}

/**
 * Get user's positions
 */
export async function getPolymarketPositions(
  credentials: PolymarketCredentials
): Promise<PolymarketPosition[]> {
  const response = await polymarketAuthRequest(
    'GET',
    '/positions',
    credentials
  );

  return response.positions || [];
}

/**
 * Get user's balance (USDC)
 */
export async function getPolymarketBalance(
  credentials: PolymarketCredentials
): Promise<number> {
  const response = await polymarketAuthRequest(
    'GET',
    '/balance',
    credentials
  );

  return response.balance || 0;
}

/**
 * Get market orderbook
 */
export async function getPolymarketOrderbook(
  tokenId: string
): Promise<{ bids: Array<{ price: number; size: number }>; asks: Array<{ price: number; size: number }> }> {
  const response = await fetch(`${POLYMARKET_CLOB_API}/book?token_id=${tokenId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orderbook: ${response.status}`);
  }

  return response.json();
}
