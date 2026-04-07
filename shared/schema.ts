import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "artisan"] }).notNull().default("customer"),
  artisanId: integer("artisan_id"),
  isVerified: boolean("is_verified").notNull().default(false),
  otp: text("otp"),
  otpExpiry: timestamp("otp_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Artisans ─────────────────────────────────────────────────────────────────
export const artisans = pgTable("artisans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  wilaya: text("wilaya").notNull().default("الجزائر"),
  daira: text("daira").notNull(),
  description: text("description"),
  priceStart: integer("price_start").notNull().default(1000),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  yearsOfExperience: integer("years_of_experience").notNull().default(0),
  imageUrl: text("image_url"),
  portfolioImages: text("portfolio_images").array().notNull().default([]),
  languages: text("languages").array().notNull().default(["العربية"]),
  workingHours: text("working_hours"),
  subscriptionType: text("subscription_type", { enum: ["free", "premium", "featured"] }).notNull().default("free"),
  subscriptionDuration: integer("subscription_duration").notNull().default(1),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  artisanId: integer("artisan_id").notNull().references(() => artisans.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Messages ──────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  senderType: text("sender_type", { enum: ["customer", "artisan"] }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  artisanId: integer("artisan_id").notNull().references(() => artisans.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Artisan = typeof artisans.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;

// ── Insert Schemas (Zod) ──────────────────────────────────────────────────────
export const insertArtisanSchema = createInsertSchema(artisans).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertArtisan = z.infer<typeof insertArtisanSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;