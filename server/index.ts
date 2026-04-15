import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "server/static";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import webpush from "web-push";
import { setupGoogleAuth } from "./google-Auth";
import session from "express-session";
const app = express();
const httpServer = createServer(app);
app.use(session({
  secret: process.env.SESSION_SECRET || "180429058585-98arm61fqvb5o505efa1d7m8f6b6uo52.apps.googleusercontent.com",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
setupGoogleAuth(app);
// ── Web Push Setup ───────────────────────────────────────────────────────────
webpush.setVapidDetails(
  "mailto:admin@herfati.com",
  "BFpzy5LKld1r6PnRWcQpA3fXGBjBelwb9yXVTiUOkIyJeBL_prUlef95PJ8MU9vpCgRFa1HXPoZz4wdzAC5G4mI",
  "TUqce04i4eAxl6vAaPCQKMXbiz5E470zHQkq0YfDEMc"
);

// Store push subscriptions: userId -> PushSubscription
export const pushSubscriptions = new Map<string, any>();

// ── Socket.io for WebRTC signaling ──────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

// Track active users: userId -> socketId
const onlineUsers = new Map<string, string>();

async function sendPushToUser(userId: string, payload: object) {
  const sub = pushSubscriptions.get(userId);
  if (!sub) return;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log(`🔔 Push sent to user: ${userId}`);
  } catch (err: any) {
    console.warn(`⚠️ Push failed for ${userId}:`, err.message);
    if (err.statusCode === 410) {
      // Subscription expired
      pushSubscriptions.delete(userId);
    }
  }
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`✅ User connected: ${userId} (socket: ${socket.id})`);
  }

  // ── WebRTC Signaling ────────────────────────────────────────────────────

  // Caller initiates call
  socket.on("call:start", async ({ to, from, fromName, callType }: {
    to: string; from: string; fromName: string; callType: "audio" | "video"
  }) => {
    console.log(`📞 call:start | from=${from} (${fromName}) → to=${to}`);
    console.log(`👥 Online users:`, [...onlineUsers.entries()]);

    // Send socket event if user is online
    io.to(to).emit("call:incoming", { from, fromName, callType });

    // Send push notification if user is offline or on another tab
    const isOnline = onlineUsers.has(to);
    console.log(`📡 Target ${to} is ${isOnline ? "ONLINE" : "OFFLINE"}`);

    await sendPushToUser(to, {
      title: `📞 مكالمة ${callType === "video" ? "بالكاميرا" : "صوتية"} واردة`,
      body: `${fromName} يتصل بك الآن`,
      tag: "incoming-call",
      requireInteraction: true,
      actions: [
        { action: "accept", title: "✅ قبول" },
        { action: "reject", title: "❌ رفض" },
      ],
      data: {
        from,
        fromName,
        callType,
        artisanId: to,
      },
    });
  });

  // Callee accepts
  socket.on("call:accept", ({ to }: { to: string }) => {
    console.log(`✅ call:accept | to=${to}`);
    io.to(to).emit("call:accepted", { from: userId });
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
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    }
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