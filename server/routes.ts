import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtisanSchema, insertMessageSchema, insertConversationSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

const ADMIN_PASSWORD = "AlaaGH_RoadTo1M$";
const adminSessions = new Set<string>();
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim();
  return req.socket.remoteAddress || "unknown";
}

function isAdmin(req: Request): boolean {
  return adminSessions.has(getClientIp(req));
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── Static Uploads ────────────────────────────────────────────────────────
  const express = (await import("express")).default;
  app.use("/uploads", express.static(UPLOADS_DIR));

  // ─── File Upload ───────────────────────────────────────────────────────────
  app.post("/api/upload", (req: Request, res: Response) => {
    try {
      const { data, filename } = req.body as { data: string; filename: string };
      if (!data || !data.startsWith("data:image")) {
        return res.status(400).json({ message: "Invalid image data" });
      }
      const base64 = data.split(",")[1];
      const ext = data.includes("image/png") ? "png" : data.includes("image/webp") ? "webp" : "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, name);
      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
      res.json({ url: `/uploads/${name}` });
    } catch (e) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // ─── Admin Auth ─────────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const ip = getClientIp(req);
      adminSessions.add(ip);
      return res.json({ success: true, ip });
    }
    return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
  });

  app.get("/api/admin/check", (req: Request, res: Response) => {
    res.json({ isAdmin: isAdmin(req), ip: getClientIp(req) });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    adminSessions.delete(getClientIp(req));
    res.json({ success: true });
  });

  app.get("/api/admin/conversations", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const convs = await storage.getAllConversations();
    res.json(convs);
  });

  app.get("/api/admin/messages", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const msgs = await storage.getAllMessages();
    res.json(msgs);
  });

  app.get("/api/admin/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    const msgs = await storage.getMessages(req.params.id);
    res.json(msgs);
  });

  // ─── Artisans ───────────────────────────────────────────────────────────────
  app.get("/api/artisans", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const daira = req.query.daira as string | undefined;
      const search = req.query.search as string | undefined;
      const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
      const artisans = await storage.getArtisans({ category, daira, search, minPrice, maxPrice });
      res.json(artisans);
    } catch {
      res.status(500).json({ message: "Failed to fetch artisans" });
    }
  });

  app.get("/api/artisans/:id", async (req: Request, res: Response) => {
    try {
      const artisan = await storage.getArtisan(parseInt(req.params.id));
      if (!artisan) return res.status(404).json({ message: "Artisan not found" });
      res.json(artisan);
    } catch {
      res.status(500).json({ message: "Failed to fetch artisan" });
    }
  });

  app.post("/api/artisans", async (req: Request, res: Response) => {
    try {
      const data = insertArtisanSchema.parse(req.body);
      const artisan = await storage.createArtisan(data);
      res.status(201).json(artisan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create artisan", error: error instanceof Error ? error.message : "Unknown" });
    }
  });

  app.patch("/api/artisans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const artisan = await storage.updateArtisan(id, req.body);
      if (!artisan) return res.status(404).json({ message: "Artisan not found" });
      res.json(artisan);
    } catch (err) {
      res.status(500).json({ message: "Failed to update artisan", error: err instanceof Error ? err.message : "Unknown" });
    }
  });

  app.delete("/api/artisans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteArtisan(id);
      if (!deleted) return res.status(404).json({ message: "Artisan not found" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete artisan" });
    }
  });

  // ─── Reviews ────────────────────────────────────────────────────────────────
  app.get("/api/artisans/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviewsByArtisan(parseInt(req.params.id));
      res.json(reviews);
    } catch {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const alreadyReviewed = await storage.hasReviewed(data.artisanId, data.customerId);
      if (alreadyReviewed) return res.status(409).json({ message: "لقد قيّمت هذا الحرفي من قبل" });
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // ─── Conversations ──────────────────────────────────────────────────────────
  app.get("/api/conversations/:userId", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as 'artisan' | 'customer';
      if (!role) return res.status(400).json({ message: "Role is required" });
      const conversations = await storage.getConversationsByUser(req.params.userId, role);
      res.json(conversations);
    } catch {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(data);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}
