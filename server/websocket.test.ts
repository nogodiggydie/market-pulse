import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";

describe("WebSocket Real-Time Price Updates", () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeEach((done) => {
    // Create HTTP server
    httpServer = new HTTPServer();
    
    // Create Socket.IO server
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Find available port
    httpServer.listen(0, () => {
      const address = httpServer.address();
      serverPort = typeof address === "object" && address ? address.port : 3001;
      done();
    });
  });

  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  it("should connect client to WebSocket server", (done) => {
    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it("should handle market subscription", (done) => {
    io.on("connection", (socket) => {
      socket.on("subscribe", (data) => {
        expect(data).toHaveProperty("venue");
        expect(data).toHaveProperty("marketId");
        expect(data.venue).toBe("polymarket");
        expect(data.marketId).toBe("test-market-123");
        done();
      });
    });

    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("connect", () => {
      clientSocket.emit("subscribe", {
        venue: "polymarket",
        marketId: "test-market-123",
      });
    });
  });

  it("should handle market unsubscription", (done) => {
    io.on("connection", (socket) => {
      socket.on("unsubscribe", (data) => {
        expect(data).toHaveProperty("venue");
        expect(data).toHaveProperty("marketId");
        expect(data.venue).toBe("kalshi");
        expect(data.marketId).toBe("test-market-456");
        done();
      });
    });

    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("connect", () => {
      clientSocket.emit("unsubscribe", {
        venue: "kalshi",
        marketId: "test-market-456",
      });
    });
  });

  it("should broadcast market price updates to subscribed clients", (done) => {
    io.on("connection", (socket) => {
      // Simulate price update broadcast
      setTimeout(() => {
        socket.emit("market_update", {
          venue: "polymarket",
          marketId: "test-market-123",
          probability: 0.65,
          change: 0.05,
        });
      }, 100);
    });

    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("market_update", (update) => {
      expect(update).toHaveProperty("venue");
      expect(update).toHaveProperty("marketId");
      expect(update).toHaveProperty("probability");
      expect(update).toHaveProperty("change");
      expect(update.venue).toBe("polymarket");
      expect(update.marketId).toBe("test-market-123");
      expect(update.probability).toBe(0.65);
      expect(update.change).toBe(0.05);
      done();
    });
  });

  it("should handle multiple simultaneous subscriptions", (done) => {
    const subscriptions: any[] = [];
    
    io.on("connection", (socket) => {
      socket.on("subscribe", (data) => {
        subscriptions.push(data);
        
        if (subscriptions.length === 3) {
          expect(subscriptions).toHaveLength(3);
          expect(subscriptions[0].venue).toBe("polymarket");
          expect(subscriptions[1].venue).toBe("kalshi");
          expect(subscriptions[2].venue).toBe("manifold");
          done();
        }
      });
    });

    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("connect", () => {
      clientSocket.emit("subscribe", { venue: "polymarket", marketId: "market-1" });
      clientSocket.emit("subscribe", { venue: "kalshi", marketId: "market-2" });
      clientSocket.emit("subscribe", { venue: "manifold", marketId: "market-3" });
    });
  });

  it("should handle disconnection gracefully", (done) => {
    io.on("connection", (socket) => {
      socket.on("disconnect", () => {
        done();
      });
    });

    clientSocket = ioClient(`http://localhost:${serverPort}`);
    
    clientSocket.on("connect", () => {
      clientSocket.disconnect();
    });
  });
});
