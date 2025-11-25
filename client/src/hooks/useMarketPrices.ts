import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface MarketUpdate {
  venue: string;
  marketId: string;
  probability: number;
  change: number;
}

interface MarketPrice {
  probability: number;
  change: number;
  timestamp: number;
}

/**
 * Hook to subscribe to real-time market price updates via WebSocket
 */
export function useMarketPrices(markets: Array<{ venue: string; id: string }>) {
  const [prices, setPrices] = useState<Map<string, MarketPrice>>(new Map());
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const subscribedMarketsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = io({
      path: "/api/ws",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setConnected(false);
    });

    socket.on("market_update", (update: MarketUpdate) => {
      console.log("[WebSocket] Market update:", update);
      
      const key = `${update.venue}:${update.marketId}`;
      setPrices((prev) => {
        const newPrices = new Map(prev);
        newPrices.set(key, {
          probability: update.probability,
          change: update.change,
          timestamp: Date.now(),
        });
        return newPrices;
      });
    });

    return () => {
      console.log("[WebSocket] Cleaning up connection");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    // Build set of current market keys
    const currentMarkets = new Set(
      markets.map((m) => `${m.venue}:${m.id.replace(`${m.venue}-`, "")}`)
    );

    // Unsubscribe from markets no longer displayed
    subscribedMarketsRef.current.forEach((key) => {
      if (!currentMarkets.has(key)) {
        const [venue, marketId] = key.split(":");
        console.log(`[WebSocket] Unsubscribing from ${key}`);
        socket.emit("unsubscribe", { venue, marketId });
        subscribedMarketsRef.current.delete(key);
      }
    });

    // Subscribe to new markets
    currentMarkets.forEach((key) => {
      if (!subscribedMarketsRef.current.has(key)) {
        const [venue, marketId] = key.split(":");
        console.log(`[WebSocket] Subscribing to ${key}`);
        socket.emit("subscribe", { venue, marketId });
        subscribedMarketsRef.current.add(key);
      }
    });
  }, [markets, connected]);

  return {
    prices,
    connected,
    getPrice: (venue: string, marketId: string) => {
      const cleanId = marketId.replace(`${venue}-`, "");
      const key = `${venue}:${cleanId}`;
      return prices.get(key);
    },
  };
}
