import crypto from 'crypto';

const KALSHI_API_URL = 'https://trading-api.kalshi.com/trade-api/v2';

interface KalshiCredentials {
  apiKey: string;
  privateKey: string;
}

interface OrderRequest {
  ticker: string;
  action: 'buy' | 'sell';
  side: 'yes' | 'no';
  count: number;
  type: 'market' | 'limit';
  yesPrice?: number;
  noPrice?: number;
  expirationTs?: number;
}

interface Order {
  orderId: string;
  ticker: string;
  action: string;
  side: string;
  count: number;
  yesPrice?: number;
  noPrice?: number;
  status: string;
  createdTime: string;
}

interface Position {
  ticker: string;
  marketTitle: string;
  position: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

/**
 * Generate authentication signature for Kalshi API
 */
function generateSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  privateKey: string
): string {
  // Reconstruct PEM format if needed
  let pemKey = privateKey;
  if (!pemKey.includes('BEGIN RSA PRIVATE KEY')) {
    const base64Key = pemKey.replace(/\s+/g, '');
    pemKey = `-----BEGIN RSA PRIVATE KEY-----\n${base64Key.match(/.{1,64}/g)?.join('\n')}\n-----END RSA PRIVATE KEY-----`;
  }

  const message = `${timestamp}${method}${path}${body}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  
  return sign.sign(pemKey, 'base64');
}

/**
 * Make authenticated request to Kalshi API
 */
async function kalshiAuthRequest(
  method: string,
  endpoint: string,
  credentials: KalshiCredentials,
  body?: any
): Promise<any> {
  const timestamp = Date.now().toString();
  const path = `/trade-api/v2${endpoint}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  
  const signature = generateSignature(
    method,
    path,
    bodyStr,
    timestamp,
    credentials.privateKey
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'KALSHI-ACCESS-KEY': credentials.apiKey,
    'KALSHI-ACCESS-SIGNATURE': signature,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = bodyStr;
  }

  const response = await fetch(`${KALSHI_API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kalshi API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Place an order on Kalshi
 */
export async function placeKalshiOrder(
  credentials: KalshiCredentials,
  order: OrderRequest
): Promise<Order> {
  const response = await kalshiAuthRequest(
    'POST',
    '/portfolio/orders',
    credentials,
    order
  );

  return response.order;
}

/**
 * Cancel an order on Kalshi
 */
export async function cancelKalshiOrder(
  credentials: KalshiCredentials,
  orderId: string
): Promise<void> {
  await kalshiAuthRequest(
    'DELETE',
    `/portfolio/orders/${orderId}`,
    credentials
  );
}

/**
 * Get user's orders
 */
export async function getKalshiOrders(
  credentials: KalshiCredentials,
  status?: 'resting' | 'canceled' | 'executed'
): Promise<Order[]> {
  const query = status ? `?status=${status}` : '';
  const response = await kalshiAuthRequest(
    'GET',
    `/portfolio/orders${query}`,
    credentials
  );

  return response.orders || [];
}

/**
 * Get user's positions
 */
export async function getKalshiPositions(
  credentials: KalshiCredentials
): Promise<Position[]> {
  const response = await kalshiAuthRequest(
    'GET',
    '/portfolio/positions',
    credentials
  );

  return response.positions || [];
}

/**
 * Get user's balance
 */
export async function getKalshiBalance(
  credentials: KalshiCredentials
): Promise<number> {
  const response = await kalshiAuthRequest(
    'GET',
    '/portfolio/balance',
    credentials
  );

  return response.balance || 0;
}
