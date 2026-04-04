import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const app = express();
const httpServer = createServer(app);

// ── Socket.io for WebRTC signaling ──────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

// Track active users: userId -> socketId
const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.join(userId); // join a room with their userId
  }

  // ── WebRTC Signaling ────────────────────────────────────────────────────

  // Caller initiates call
  socket.on("call:start", ({ to, from, fromName, callType }: {
    to: string; from: string; fromName: string; callType: "audio" | "video"
  }) => {
    io.to(to).emit("call:incoming", { from, fromName, callType });
  });

  // Callee accepts
  socket.on("call:accept", ({ to }: { to: string }) => {
    io.to(to).emit("call:accepted");
  });

  // Callee rejects
  socket.on("call:reject", ({ to }: { to: string }) => {
    io.to(to).emit("call:rejected");
  });

  // Either side ends the call
  socket.on("call:end", ({ to }: { to: string }) => {
    io.to(to).emit("call:ended");
  });

  // WebRTC offer
  socket.on("rtc:offer", ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
    io.to(to).emit("rtc:offer", { from: userId, offer });
  });

  // WebRTC answer
  socket.on("rtc:answer", ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
    io.to(to).emit("rtc:answer", { from: userId, answer });
  });

  // ICE candidates
  socket.on("rtc:ice", ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
    io.to(to).emit("rtc:ice", { from: userId, candidate });
  });

  socket.on("disconnect", () => {
    if (userId) onlineUsers.delete(userId);
  });
});

// ────────────────────────────────────────────────────────────────────────────

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "1000mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "1000mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => { log(`serving on port ${port}`); },
  );
})();