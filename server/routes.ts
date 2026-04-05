import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtisanSchema, insertMessageSchema, insertConversationSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

const ADMIN_PASSWORD = "AlaaGH_Mil";
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

function safeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  const express = (await import("express")).default;
  app.use("/uploads", express.static(UPLOADS_DIR));

  // ─── File Upload ───────────────────────────────────────────────────────────
  app.post("/api/upload", (req: Request, res: Response) => {
    try {
      const { data } = req.body as { data: string; filename: string };
      if (!data || !data.startsWith("data:image")) return res.status(400).json({ message: "Invalid image data" });
      const base64 = data.split(",")[1];
      const ext = data.includes("image/png") ? "png" : data.includes("image/webp") ? "webp" : "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, name), Buffer.from(base64, "base64"));
      res.json({ url: `/uploads/${name}` });
    } catch {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // ─── Customer Auth ─────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ message: "الاسم والبريد وكلمة المرور مطلوبة" });
      if (password.length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      const user = await storage.registerUser(name, email, password, phone);
      if (!user) return res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      res.status(201).json({ user: safeUser(user) });
    } catch {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
      const user = await storage.loginUser(email, password);
      if (!user) return res.status(401).json({ message: "البريد أو كلمة المرور غير صحيحة" });

      // If artisan, return artisan data too
      let artisanData = null;
      if (user.role === "artisan" && user.artisanId) {
        artisanData = await storage.getArtisan(user.artisanId);
      }
      res.json({ user: safeUser(user), artisan: artisanData });
    } catch {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/auth/me/:userId", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserById(req.params.userId);
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
      let artisanData = null;
      if (user.role === "artisan" && user.artisanId) {
        artisanData = await storage.getArtisan(user.artisanId);
      }
      res.json({ user: safeUser(user), artisan: artisanData });
    } catch {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // ─── Admin Auth ─────────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      adminSessions.add(getClientIp(req));
      return res.json({ success: true });
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
    res.json(await storage.getAllConversations());
  });

  app.get("/api/admin/messages", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    res.json(await storage.getAllMessages());
  });

  app.get("/api/admin/conversations/:id/messages", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    res.json(await storage.getMessages(req.params.id));
  });

  // ─── Artisans ───────────────────────────────────────────────────────────────
  app.get("/api/artisans", async (req: Request, res: Response) => {
    try {
      const { category, daira, search, minPrice, maxPrice } = req.query;
      const artisans = await storage.getArtisans({
        category: category as string,
        daira: daira as string,
        search: search as string,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      });
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
      // Link to user if userId provided
      if (req.body.userId) {
        await storage.linkUserToArtisan(req.body.userId, artisan.id);
      }
      res.status(201).json(artisan);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create artisan" });
    }
  });

  app.patch("/api/artisans/:id", async (req: Request, res: Response) => {
    try {
      const artisan = await storage.updateArtisan(parseInt(req.params.id), req.body);
      if (!artisan) return res.status(404).json({ message: "Artisan not found" });
      res.json(artisan);
    } catch {
      res.status(500).json({ message: "Failed to update artisan" });
    }
  });

  app.delete("/api/artisans/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteArtisan(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Artisan not found" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete artisan" });
    }
  });

  // ─── Reviews ────────────────────────────────────────────────────────────────
  app.get("/api/artisans/:id/reviews", async (req: Request, res: Response) => {
    try {
      res.json(await storage.getReviewsByArtisan(parseInt(req.params.id)));
    } catch {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const alreadyReviewed = await storage.hasReviewed(data.artisanId, data.customerId);
      if (alreadyReviewed) return res.status(409).json({ message: "لقد قيّمت هذا الحرفي من قبل" });
      res.status(201).json(await storage.createReview(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.delete("/api/reviews/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try {
      const deleted = await storage.deleteReview(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Review not found" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // ─── Conversations ──────────────────────────────────────────────────────────
  app.get("/api/conversations/:userId", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as 'artisan' | 'customer';
      if (!role) return res.status(400).json({ message: "Role is required" });
      res.json(await storage.getConversationsByUser(req.params.userId, role));
    } catch {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      res.status(201).json(await storage.createConversation(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      res.json(await storage.getMessages(req.params.id));
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      res.status(201).json(await storage.createMessage(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}