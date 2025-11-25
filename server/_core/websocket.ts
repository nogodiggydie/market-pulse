import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getMarketById } from "../services/marketFetcher";

interface MarketSubscription {
  marketId: string;
  venue: string;
}

interface SocketData {
  subscriptions: Set<string>; // Set of "venue:marketId" strings
}

let io: SocketIOServer | null = null;
const activeSubscriptions = new Map<string, Set<string>>(); // venue:marketId -> Set of socket IDs
let pollingInterval: NodeJS.Timeout | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/ws",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    const socketData: SocketData = {
      subscriptions: new Set(),
    };

    // Handle market subscription
    socket.on("subscribe", (data: MarketSubscription) => {
      const { marketId, venue } = data;
      const subscriptionKey = `${venue}:${marketId}`;
      
      console.log(`[WebSocket] ${socket.id} subscribing to ${subscriptionKey}`);
      
      // Add to socket's subscriptions
      socketData.subscriptions.add(subscriptionKey);
      
      // Add to global active subscriptions
      if (!activeSubscriptions.has(subscriptionKey)) {
        activeSubscriptions.set(subscriptionKey, new Set());
      }
      activeSubscriptions.get(subscriptionKey)!.add(socket.id);
      
      // Start polling if not already running
      startPolling();
    });

    // Handle market unsubscription
    socket.on("unsubscribe", (data: MarketSubscription) => {
      const { marketId, venue } = data;
      const subscriptionKey = `${venue}:${marketId}`;
      
      console.log(`[WebSocket] ${socket.id} unsubscribing from ${subscriptionKey}`);
      
      // Remove from socket's subscriptions
      socketData.subscriptions.delete(subscriptionKey);
      
      // Remove from global active subscriptions
      const sockets = activeSubscriptions.get(subscriptionKey);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeSubscriptions.delete(subscriptionKey);
        }
      }
      
      // Stop polling if no active subscriptions
      if (activeSubscriptions.size === 0) {
        stopPolling();
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      
      // Remove all subscriptions for this socket
      socketData.subscriptions.forEach((subscriptionKey) => {
        const sockets = activeSubscriptions.get(subscriptionKey);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            activeSubscriptions.delete(subscriptionKey);
          }
        }
      });
      
      // Stop polling if no active subscriptions
      if (activeSubscriptions.size === 0) {
        stopPolling();
      }
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

const marketPriceCache = new Map<string, number>(); // venue:marketId -> last known price

async function pollMarkets() {
  if (activeSubscriptions.size === 0) {
    return;
  }

  console.log(`[WebSocket] Polling ${activeSubscriptions.size} subscribed markets...`);

  const updates: Array<{
    venue: string;
    marketId: string;
    probability: number;
    change: number;
  }> = [];

  for (const subscriptionKey of Array.from(activeSubscriptions.keys())) {
    const [venue, marketId] = subscriptionKey.split(":");
    
    try {
      // Fetch latest market data
      const market = await getMarketById(venue, marketId);
      
      if (market && market.probability !== null && market.probability !== undefined) {
        const currentPrice = market.probability;
        const lastPrice = marketPriceCache.get(subscriptionKey);
        
        // Check if price changed
        if (lastPrice === undefined || Math.abs(currentPrice - lastPrice) > 0.001) {
          const change = lastPrice !== undefined ? currentPrice - lastPrice : 0;
          
          updates.push({
            venue,
            marketId,
            probability: currentPrice,
            change,
          });
          
          // Update cache
          marketPriceCache.set(subscriptionKey, currentPrice);
          
          console.log(`[WebSocket] Price update for ${subscriptionKey}: ${currentPrice} (${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%)`);
        }
      }
    } catch (error) {
      console.error(`[WebSocket] Error fetching ${subscriptionKey}:`, error);
    }
  }

  // Broadcast updates to subscribed clients
  if (updates.length > 0 && io) {
    updates.forEach((update) => {
      const subscriptionKey = `${update.venue}:${update.marketId}`;
      const sockets = activeSubscriptions.get(subscriptionKey);
      
      if (sockets) {
        sockets.forEach((socketId) => {
          io!.to(socketId).emit("market_update", update);
        });
      }
    });
  }
}

function startPolling() {
  if (pollingInterval) {
    return; // Already polling
  }

  console.log("[WebSocket] Starting market polling (10s interval)");
  
  // Poll immediately
  pollMarkets();
  
  // Then poll every 10 seconds
  pollingInterval = setInterval(pollMarkets, 10000);
}

function stopPolling() {
  if (pollingInterval) {
    console.log("[WebSocket] Stopping market polling");
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

export function getWebSocketServer() {
  return io;
}
