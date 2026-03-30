import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtisanSchema, insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";

const ADMIN_PASSWORD = "AlaaGH_RoadTo1M$";
const adminSessions = new Set<string>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim();
  return req.socket.remoteAddress || "unknown";
}

function isAdmin(req: Request): boolean {
  return adminSessions.has(getClientIp(req));
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

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

  // ─── Admin: all conversations + messages ───────────────────────────────────
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
    } catch {
      res.status(500).json({ message: "Failed to update artisan" });
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
