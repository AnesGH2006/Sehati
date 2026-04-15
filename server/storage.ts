import {
  type Artisan,
  type InsertArtisan,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
  type User,
  users,
  artisans,
  conversations,
  messages,
  reviews,
  artisanViews,
} from "@shared/schema";
import { db } from "server/db";
import { eq, and, ilike, gte, lte, desc, or } from "drizzle-orm";
import crypto from "crypto";

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "herfati_salt").digest("hex");
}

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IStorage {
  // Auth
  registerUser(name: string, email: string, password: string, phone?: string): Promise<User | null>;
  loginUser(email: string, password: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  forceVerifyUser(id: string): Promise<void>;
  linkUserToArtisan(userId: string, artisanId: number): Promise<void>;
  verifyUserEmail(email: string, otp: string): Promise<boolean>;
  setUserOTP(email: string, otp: string): Promise<void>;
  resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean>;

  // Artisans
  getArtisan(id: number): Promise<Artisan | undefined>;
  getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]>;
  createArtisan(artisan: InsertArtisan): Promise<Artisan>;
  updateArtisan(id: number, updates: Partial<Artisan>): Promise<Artisan | undefined>;
  deleteArtisan(id: number): Promise<boolean>;

  // Views ✦ جديد
  trackArtisanView(artisanId: number, viewerIp: string, viewerId?: string): Promise<void>;
  getArtisanViewStats(artisanId: number): Promise<{
    total: number;
    thisMonth: number;
    lastMonth: number;
    daily: { date: string; count: number }[];
  }>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string, role: "artisan" | "customer"): Promise<Conversation[]>;
  getConversationsByArtisan(artisanId: string): Promise<Conversation[]>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(conv: InsertConversation): Promise<Conversation>;

  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  deleteMessage(id: number): Promise<boolean>;
  editMessage(id: number, content: string): Promise<Message | null>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByArtisan(artisanId: number): Promise<Review[]>;
  hasReviewed(artisanId: number, customerId: string): Promise<boolean>;
  deleteReview(id: number): Promise<boolean>;
}

// ── Implementation ────────────────────────────────────────────────────────────
class PostgresStorage implements IStorage {

  // ── Auth ──────────────────────────────────────────────────────────────────

  async registerUser(name: string, email: string, password: string, phone?: string): Promise<User | null> {
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return null;

    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [user] = await db.insert(users).values({
      id,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      phone,
      role: "customer",
      isVerified: false,
    }).returning();
    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async forceVerifyUser(id: string): Promise<void> {
    await db.update(users)
      .set({ isVerified: true, otp: null, otpExpiry: null })
      .where(eq(users.id, id));
  }

  async linkUserToArtisan(userId: string, artisanId: number): Promise<void> {
    await db.update(users).set({ role: "artisan", artisanId }).where(eq(users.id, userId));
    await db.update(artisans).set({ userId }).where(eq(artisans.id, artisanId));
  }

  async setUserOTP(email: string, otp: string): Promise<void> {
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(users).set({ otp, otpExpiry: expiry }).where(eq(users.email, email.toLowerCase()));
  }

  async verifyUserEmail(email: string, otp: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    await db.update(users)
      .set({ isVerified: true, otp: null, otpExpiry: null })
      .where(eq(users.id, user.id));
    return true;
  }

  async resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    await db.update(users)
      .set({ passwordHash: hashPassword(newPassword), otp: null, otpExpiry: null })
      .where(eq(users.id, user.id));
    return true;
  }

  // ── Artisans ──────────────────────────────────────────────────────────────

  async getArtisan(id: number): Promise<Artisan | undefined> {
    const [artisan] = await db.select().from(artisans).where(eq(artisans.id, id)).limit(1);
    return artisan;
  }

  async getArtisans(filters?: {
    category?: string;
    daira?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Artisan[]> {
    let query = db.select().from(artisans).$dynamic();
    const conditions = [];
    if (filters?.category)                   conditions.push(eq(artisans.category, filters.category));
    if (filters?.daira)                      conditions.push(eq(artisans.daira, filters.daira));
    if (filters?.minPrice !== undefined)     conditions.push(gte(artisans.priceStart, filters.minPrice));
    if (filters?.maxPrice !== undefined)     conditions.push(lte(artisans.priceStart, filters.maxPrice));
    if (filters?.search) {
      const q = `%${filters.search}%`;
      conditions.push(or(ilike(artisans.name, q), ilike(artisans.category, q)));
    }
    if (conditions.length > 0) query = query.where(and(...conditions));
    return query.orderBy(desc(artisans.createdAt));
  }

  async createArtisan(insertArtisan: InsertArtisan): Promise<Artisan> {
    const [artisan] = await db.insert(artisans).values({
      userId:               insertArtisan.userId || null,
      name:                 insertArtisan.name,
      email:                insertArtisan.email,
      phone:                insertArtisan.phone,
      category:             insertArtisan.category,
      wilaya:               insertArtisan.wilaya || "الجزائر",
      daira:                insertArtisan.daira,
      description:          insertArtisan.description || null,
      priceStart:           insertArtisan.priceStart || 1000,
      rating:               0,
      reviewCount:          0,
      isVerified:           insertArtisan.isVerified || false,
      yearsOfExperience:    insertArtisan.yearsOfExperience || 0,
      imageUrl:             insertArtisan.imageUrl || null,
      portfolioImages:      insertArtisan.portfolioImages || [],
      languages:            insertArtisan.languages || ["العربية"],
      workingHours:         insertArtisan.workingHours || null,
      subscriptionType:     insertArtisan.subscriptionType || "free",
      subscriptionDuration: insertArtisan.subscriptionDuration || 1,
      subscriptionExpiresAt: insertArtisan.subscriptionExpiresAt || null,
    }).returning();
    return artisan;
  }

  async updateArtisan(id: number, updates: Partial<Artisan>): Promise<Artisan | undefined> {
    const safeUpdates = { ...updates };
    if (safeUpdates.imageUrl?.startsWith("data:")) safeUpdates.imageUrl = null;
    if (safeUpdates.portfolioImages) {
      safeUpdates.portfolioImages = safeUpdates.portfolioImages.filter((img: string) => !img.startsWith("data:"));
    }
    const [updated] = await db.update(artisans).set(safeUpdates).where(eq(artisans.id, id)).returning();
    return updated;
  }

  async deleteArtisan(id: number): Promise<boolean> {
    const result = await db.delete(artisans).where(eq(artisans.id, id)).returning();
    return result.length > 0;
  }

  // ── Views ✦ جديد ──────────────────────────────────────────────────────────

  async trackArtisanView(artisanId: number, viewerIp: string, viewerId?: string): Promise<void> {
    const today    = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // منع التكرار: نفس الـ IP في نفس اليوم
    const existing = await db
      .select()
      .from(artisanViews)
      .where(
        and(
          eq(artisanViews.artisanId, artisanId),
          eq(artisanViews.viewerIp,  viewerIp),
          gte(artisanViews.createdAt, dayStart)
        )
      )
      .limit(1);

    if (existing.length > 0) return;

    await db.insert(artisanViews).values({
      artisanId,
      viewerIp,
      viewerId: viewerId || null,
    });
  }

  async getArtisanViewStats(artisanId: number): Promise<{
    total: number;
    thisMonth: number;
    lastMonth: number;
    daily: { date: string; count: number }[];
  }> {
    const now              = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const allViews = await db
      .select()
      .from(artisanViews)
      .where(eq(artisanViews.artisanId, artisanId));

    const thisMonth = allViews.filter(v => new Date(v.createdAt!) >= startOfThisMonth).length;
    const lastMonth = allViews.filter(
      v => new Date(v.createdAt!) >= startOfLastMonth && new Date(v.createdAt!) < startOfThisMonth
    ).length;

    // آخر 7 أيام
    const daily: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d        = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(dayStart.getTime() + 86400000);
      daily.push({
        date:  d.toLocaleDateString("ar-DZ", { weekday: "short" }),
        count: allViews.filter(v => {
          const t = new Date(v.createdAt!);
          return t >= dayStart && t < dayEnd;
        }).length,
      });
    }

    return { total: allViews.length, thisMonth, lastMonth, daily };
  }

  // ── Conversations ─────────────────────────────────────────────────────────

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return conv;
  }

  async getConversationsByUser(userId: string, role: "artisan" | "customer"): Promise<Conversation[]> {
    if (role === "customer") {
      return db.select().from(conversations)
        .where(eq(conversations.customerId, userId))
        .orderBy(desc(conversations.lastMessageAt));
    }
    const artisanId = parseInt(userId);
    if (isNaN(artisanId)) return [];
    return db.select().from(conversations)
      .where(eq(conversations.artisanId, artisanId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  // دالة مخصصة للـ analytics — تقبل string وتحوّلها داخلياً
  async getConversationsByArtisan(artisanId: string): Promise<Conversation[]> {
    const id = parseInt(artisanId);
    if (isNaN(id)) return [];
    return db.select().from(conversations)
      .where(eq(conversations.artisanId, id))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [existing] = await db.select().from(conversations)
      .where(eq(conversations.id, insertConversation.id)).limit(1);

    if (existing) {
      if (insertConversation.customerName && !existing.customerName) {
        const [updated] = await db.update(conversations)
          .set({ customerName: insertConversation.customerName })
          .where(eq(conversations.id, insertConversation.id))
          .returning();
        return updated;
      }
      return existing;
    }

    const [conv] = await db.insert(conversations).values({
      id:           insertConversation.id,
      artisanId:    insertConversation.artisanId,
      customerId:   insertConversation.customerId,
      customerName: insertConversation.customerName || null,
      lastMessage:  insertConversation.lastMessage  || null,
    }).returning();
    return conv;
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getAllMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      conversationId: insertMessage.conversationId,
      senderId:       insertMessage.senderId,
      receiverId:     insertMessage.receiverId,
      senderType:     insertMessage.senderType,
      content:        insertMessage.content,
      isRead:         false,
    }).returning();

    const preview = insertMessage.content.startsWith("data:image") ? "📷 صورة" : insertMessage.content;
    await db.update(conversations)
      .set({ lastMessageAt: new Date(), lastMessage: preview })
      .where(eq(conversations.id, insertMessage.conversationId));

    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
      ));
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async editMessage(id: number, content: string): Promise<Message | null> {
    const [updated] = await db.update(messages).set({ content }).where(eq(messages.id, id)).returning();
    return updated || null;
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values({
      artisanId:    insertReview.artisanId,
      customerId:   insertReview.customerId,
      customerName: insertReview.customerName,
      rating:       insertReview.rating,
      comment:      insertReview.comment || null,
    }).returning();
    await this._recalcRating(insertReview.artisanId);
    return review;
  }

  async getReviewsByArtisan(artisanId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.artisanId, artisanId))
      .orderBy(desc(reviews.createdAt));
  }

  async hasReviewed(artisanId: number, customerId: string): Promise<boolean> {
    const [existing] = await db.select().from(reviews)
      .where(and(eq(reviews.artisanId, artisanId), eq(reviews.customerId, customerId)))
      .limit(1);
    return !!existing;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deleted] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    if (!deleted) return false;
    await this._recalcRating(deleted.artisanId);
    return true;
  }

  private async _recalcRating(artisanId: number): Promise<void> {
    const artisanReviews = await db.select().from(reviews).where(eq(reviews.artisanId, artisanId));
    if (artisanReviews.length === 0) {
      await db.update(artisans).set({ rating: 0, reviewCount: 0 }).where(eq(artisans.id, artisanId));
    } else {
      const avg = artisanReviews.reduce((s, r) => s + r.rating, 0) / artisanReviews.length;
      await db.update(artisans)
        .set({ rating: Math.round(avg * 10) / 10, reviewCount: artisanReviews.length })
        .where(eq(artisans.id, artisanId));
    }
  }
}

export const storage = new PostgresStorage();
// ======================================================
// server/storage.ts — أضف هذه الدالة داخل PostgresStorage
// ======================================================

import { db } from "./db";
import { artisans, users } from "../shared/schema";
import { sql, and, eq, gte, lte, like, or } from "drizzle-orm";

// ─── نوع نتيجة البحث ─────────────────────────────────
export interface NearbyArtisan {
  id: number;
  userId: number;
  name: string;
  craft: string;
  rating: number;
  reviewCount: number;
  status: string;
  isVerified: boolean;
  latitude: number;
  longitude: number;
  city: string | null;
  wilaya: string | null;
  distanceKm: number;   // المسافة المحسوبة بالكيلومتر
  avatarUrl: string | null;
}

// ─── خيارات البحث ────────────────────────────────────
export interface NearbySearchOptions {
  lat: number;            // موقع الزبون — خط العرض
  lng: number;            // موقع الزبون — خط الطول
  radiusKm?: number;      // النطاق بالكيلومتر (افتراضي: 10)
  craft?: string;         // فلترة بالحرفة
  status?: string;        // فلترة بالحالة: available | busy
  query?: string;         // بحث نصي باسم الحرفي أو الحرفة
  sortBy?: "distance" | "rating" | "name";
  limit?: number;
}

// ─── حساب المسافة بـ Haversine (داخل SQL) ────────────
//
//  d = 2R × arcsin( √( sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2) ) )
//
//  نستخدم نصف قطر الأرض = 6371 كم
//
const haversineSQL = (userLat: number, userLng: number) => sql<number>`
  (
    6371 * 2 * ASIN(
      SQRT(
        POWER(SIN((RADIANS(${artisans.latitude}) - RADIANS(${userLat})) / 2), 2)
        +
        COS(RADIANS(${userLat}))
        * COS(RADIANS(${artisans.latitude}))
        * POWER(SIN((RADIANS(${artisans.longitude}) - RADIANS(${userLng})) / 2), 2)
      )
    )
  )
`;

// ─── الدالة الرئيسية ──────────────────────────────────
export async function getNearbyArtisans(
  opts: NearbySearchOptions
): Promise<NearbyArtisan[]> {
  const {
    lat,
    lng,
    radiusKm = 10,
    craft,
    status,
    query,
    sortBy = "distance",
    limit = 50,
  } = opts;

  const distanceExpr = haversineSQL(lat, lng);

  const conditions = [
    // يجب أن يكون لدى الحرفي إحداثيات
    sql`${artisans.latitude} IS NOT NULL AND ${artisans.longitude} IS NOT NULL`,
    // ضمن النطاق المطلوب
    sql`${distanceExpr} <= ${radiusKm}`,
  ];

  // فلترة بالحرفة
  if (craft && craft !== "all") {
    conditions.push(eq(artisans.craft, craft));
  }

  // فلترة بالحالة
  if (status && status !== "all") {
    conditions.push(eq(artisans.status, status as any));
  }

  // بحث نصي (اسم الحرفي أو الحرفة)
  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        like(artisans.craft, q),
        // نبحث في جدول users باستخدام join أدناه
        sql`u.full_name ILIKE ${q}`
      )!
    );
  }

  const rows = await db
    .select({
      id:           artisans.id,
      userId:       artisans.userId,
      name:         sql<string>`u.full_name`,
      craft:        artisans.craft,
      rating:       artisans.rating,
      reviewCount:  artisans.reviewCount,
      status:       artisans.status,
      isVerified:   artisans.isVerified,
      latitude:     artisans.latitude,
      longitude:    artisans.longitude,
      city:         artisans.city,
      wilaya:       artisans.wilaya,
      distanceKm:   distanceExpr,
      avatarUrl:    sql<string | null>`u.avatar_url`,
    })
    .from(artisans)
    .innerJoin(sql`users u`, sql`u.id = ${artisans.userId}`)
    .where(and(...conditions))
    .orderBy(
      sortBy === "distance" ? distanceExpr :
      sortBy === "rating"   ? sql`${artisans.rating} DESC` :
                              sql`u.full_name ASC`
    )
    .limit(limit);

  // نقرب المسافة لـ 1 خانة عشرية
  return rows.map(r => ({
    ...r,
    rating:      r.rating ?? 0,
    reviewCount: r.reviewCount ?? 0,
    distanceKm:  Math.round((r.distanceKm ?? 0) * 10) / 10,
  })) as NearbyArtisan[];
}

// ─── تحديث موقع الحرفي ───────────────────────────────
export async function updateArtisanLocation(
  artisanId: number,
  lat: number,
  lng: number,
  city?: string,
  wilaya?: string
) {
  await db
    .update(artisans)
    .set({
      latitude:  lat,
      longitude: lng,
      city:      city ?? null,
      wilaya:    wilaya ?? null,
      updatedAt: new Date(),
    })
    .where(eq(artisans.id, artisanId));
}