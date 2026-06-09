import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerRoutes } from "./routes";
import { setupGoogleAuth } from "./google-Auth";
import path from "path";
import fs from "fs";
async function main() {
  const app = express();
  const httpServer = createServer(app);

  // ── Middleware ──────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));
  // ── Socket.IO ───────────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("[Socket.IO] client connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(userId);
    });

    socket.on("send_message", (data: any) => {
      io.to(data.receiverId).emit("new_message", data);
    });

    socket.on("call_offer", (data: any) => {
      io.to(data.to).emit("call_offer", data);
    });

    socket.on("call_answer", (data: any) => {
      io.to(data.to).emit("call_answer", data);
    });

    socket.on("ice_candidate", (data: any) => {
      io.to(data.to).emit("ice_candidate", data);
    });

    socket.on("call_end", (data: any) => {
      io.to(data.to).emit("call_end", data);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] client disconnected:", socket.id);
    });
  });

  // ── Routes ──────────────────────────────────────────────────────────────────
  setupGoogleAuth(app);
  await registerRoutes(httpServer, app);

  // ── Vite (dev) / Static (prod) ──────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else {
    const distPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("⚠️  dist/public not found — run npm run build first");
    }
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  const PORT = parseInt(process.env.PORT || "5000");
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});