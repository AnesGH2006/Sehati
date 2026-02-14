import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtisanSchema, insertUserSchema, insertMessageSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Artisans API
  app.get("/api/artisans", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const daira = req.query.daira as string | undefined;
      const search = req.query.search as string | undefined;
      const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;

      const artisans = await storage.getArtisans({
        category,
        daira,
        search,
        minPrice,
        maxPrice
      });
      res.json(artisans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artisans" });
    }
  });

  app.get("/api/artisans/:id", async (req, res) => {
    try {
      const artisan = await storage.getArtisan(parseInt(req.params.id));
      if (!artisan) return res.status(404).json({ message: "Artisan not found" });
      res.json(artisan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artisan" });
    }
  });

  app.post("/api/artisans", async (req, res) => {
    try {
      const data = insertArtisanSchema.parse(req.body);
      const artisan = await storage.createArtisan(data);
      res.status(201).json(artisan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create artisan" });
    }
  });

  // Users API
  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(400).json({ message: "Username already exists" });
      
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Chat API
  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const role = req.query.role as 'artisan' | 'customer';
      if (!role) return res.status(400).json({ message: "Role is required" });
      
      const conversations = await storage.getConversationsByUser(req.params.userId, role);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
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
