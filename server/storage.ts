import {
  type Doctor,
  type InsertDoctor,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
  type Appointment,
  type InsertAppointment,
  type User,
  users,
  doctors,
  conversations,
  messages,
  reviews,
  doctorViews,
  appointments,
} from "@shared/schema";
import { db } from "./db";
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
  linkUserToDoctor(userId: string, doctorId: number): Promise<void>;
  verifyUserEmail(email: string, otp: string): Promise<boolean>;
  setUserOTP(email: string, otp: string): Promise<void>;
  resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean>;

  // Doctors
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctors(filters?: { specialty?: string; daira?: string; search?: string; minFee?: number; maxFee?: number; }): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, updates: Partial<Doctor>): Promise<Doctor | undefined>;
  deleteDoctor(id: number): Promise<boolean>;

  // Views
  trackDoctorView(doctorId: number, viewerIp: string, viewerId?: string): Promise<void>;
  getDoctorViewStats(doctorId: number): Promise<{ total: number; thisMonth: number; lastMonth: number; daily: { date: string; count: number }[]; }>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed", doctorNotes?: string): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  getAvailableSlots(doctorId: number, date: string): Promise<string[]>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string, role: "doctor" | "patient"): Promise<Conversation[]>;
  getConversationsByDoctor(doctorId: string): Promise<Conversation[]>;
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
  getReviewsByDoctor(doctorId: number): Promise<Review[]>;
  hasReviewed(doctorId: number, patientId: string): Promise<boolean>;
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
      id, name, email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      phone, role: "patient", isVerified: false,
    }).returning();
    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) return null;
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
    await db.update(users).set({ isVerified: true, otp: null, otpExpiry: null }).where(eq(users.id, id));
  }

  async linkUserToDoctor(userId: string, doctorId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      console.warn(`[linkUserToDoctor] user ${userId} not found — skipping`);
      return;
    }
    await db.update(users).set({ role: "doctor", doctorId }).where(eq(users.id, userId));

    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
    if (!doctor) {
      console.warn(`[linkUserToDoctor] doctor ${doctorId} not found — skipping doctors update`);
      return;
    }
    await db.update(doctors).set({ userId }).where(eq(doctors.id, doctorId));
  }

  async setUserOTP(email: string, otp: string): Promise<void> {
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(users).set({ otp, otpExpiry: expiry }).where(eq(users.email, email.toLowerCase()));
  }

  async verifyUserEmail(email: string, otp: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    await db.update(users).set({ isVerified: true, otp: null, otpExpiry: null }).where(eq(users.id, user.id));
    return true;
  }

  async resetUserPassword(email: string, otp: string, newPassword: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.otp || user.otp !== otp) return false;
    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) return false;
    await db.update(users).set({ passwordHash: hashPassword(newPassword), otp: null, otpExpiry: null }).where(eq(users.id, user.id));
    return true;
  }

  // ── Doctors ───────────────────────────────────────────────────────────────

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
    return doctor;
  }

  async getDoctors(filters?: { specialty?: string; daira?: string; search?: string; minFee?: number; maxFee?: number; }): Promise<Doctor[]> {
    let query = db.select().from(doctors).$dynamic();
    const conditions = [];
    if (filters?.specialty)             conditions.push(eq(doctors.specialty, filters.specialty));
    if (filters?.daira)                 conditions.push(eq(doctors.daira, filters.daira));
    if (filters?.minFee !== undefined)  conditions.push(gte(doctors.consultationFee, filters.minFee));
    if (filters?.maxFee !== undefined)  conditions.push(lte(doctors.consultationFee, filters.maxFee));
    if (filters?.search) {
      const q = `%${filters.search}%`;
      conditions.push(or(ilike(doctors.name, q), ilike(doctors.specialty, q), ilike(doctors.clinicName, q)));
    }
    if (conditions.length > 0) query = query.where(and(...conditions));
    return query.orderBy(desc(doctors.createdAt));
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const [doctor] = await db.insert(doctors).values({
      userId:               insertDoctor.userId || null,
      name:                 insertDoctor.name,
      email:                insertDoctor.email,
      phone:                insertDoctor.phone,
      specialty:            insertDoctor.specialty,
      licenseNumber:        insertDoctor.licenseNumber || null,
      clinicName:           insertDoctor.clinicName || null,
      consultationFee:      insertDoctor.consultationFee ?? 1000,
      wilaya:               insertDoctor.wilaya || "الجزائر",
      daira:                insertDoctor.daira,
      clinicAddress:        insertDoctor.clinicAddress || null,
      description:          insertDoctor.description || null,
      rating:               0,
      reviewCount:          0,
      isVerified:           insertDoctor.isVerified || false,
      yearsOfExperience:    insertDoctor.yearsOfExperience || 0,
      imageUrl:             insertDoctor.imageUrl || null,
      workingDays:          insertDoctor.workingDays || ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"],
      workingHoursStart:    insertDoctor.workingHoursStart || "08:00",
      workingHoursEnd:      insertDoctor.workingHoursEnd || "17:00",
      appointmentDuration:  insertDoctor.appointmentDuration || 30,
      languages:            insertDoctor.languages || ["العربية"],
      subscriptionType:     insertDoctor.subscriptionType || "free",
      subscriptionDuration: insertDoctor.subscriptionDuration || 1,
      subscriptionExpiresAt: insertDoctor.subscriptionExpiresAt || null,
    }).returning();
    return doctor;
  }

  async updateDoctor(id: number, updates: Partial<Doctor>): Promise<Doctor | undefined> {
    const safeUpdates = { ...updates };
    if (safeUpdates.imageUrl?.startsWith("data:")) safeUpdates.imageUrl = null;
    const [updated] = await db.update(doctors).set(safeUpdates).where(eq(doctors.id, id)).returning();
    return updated;
  }

  async deleteDoctor(id: number): Promise<boolean> {
    const result = await db.delete(doctors).where(eq(doctors.id, id)).returning();
    return result.length > 0;
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  async trackDoctorView(doctorId: number, viewerIp: string, viewerId?: string): Promise<void> {
    const today    = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = await db.select().from(doctorViews).where(
      and(eq(doctorViews.doctorId, doctorId), eq(doctorViews.viewerIp, viewerIp), gte(doctorViews.createdAt, dayStart))
    ).limit(1);
    if (existing.length > 0) return;
    await db.insert(doctorViews).values({ doctorId, viewerIp, viewerId: viewerId || null });
  }

  async getDoctorViewStats(doctorId: number): Promise<{ total: number; thisMonth: number; lastMonth: number; daily: { date: string; count: number }[]; }> {
    const now              = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const allViews = await db.select().from(doctorViews).where(eq(doctorViews.doctorId, doctorId));
    const thisMonth = allViews.filter(v => new Date(v.createdAt!) >= startOfThisMonth).length;
    const lastMonth = allViews.filter(v => new Date(v.createdAt!) >= startOfLastMonth && new Date(v.createdAt!) < startOfThisMonth).length;
    const daily: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const de = new Date(ds.getTime() + 86400000);
      daily.push({
        date: d.toLocaleDateString("ar-DZ", { weekday: "short" }),
        count: allViews.filter(v => { const t = new Date(v.createdAt!); return t >= ds && t < de; }).length,
      });
    }
    return { total: allViews.length, thisMonth, lastMonth, daily };
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values({
      doctorId:        insertAppointment.doctorId,
      patientId:       insertAppointment.patientId,
      patientName:     insertAppointment.patientName,
      patientPhone:    insertAppointment.patientPhone || null,
      appointmentDate: insertAppointment.appointmentDate,
      appointmentTime: insertAppointment.appointmentTime,
      status:          "pending",
      notes:           insertAppointment.notes || null,
      isUrgent:        insertAppointment.isUrgent || false,
    }).returning();
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return appointment;
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async updateAppointmentStatus(
    id: number,
    status: "pending" | "confirmed" | "cancelled" | "completed",
    doctorNotes?: string
  ): Promise<Appointment | undefined> {
    const updates: Partial<Appointment> = { status, updatedAt: new Date() };
    if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
    const [updated] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    return updated;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  async getAvailableSlots(doctorId: number, date: string): Promise<string[]> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
    if (!doctor) return [];

    // توليد كل الأوقات الممكنة بناءً على ساعات العمل ومدة الموعد
    const slots: string[] = [];
    const [startH, startM] = doctor.workingHoursStart.split(":").map(Number);
    const [endH, endM]     = doctor.workingHoursEnd.split(":").map(Number);
    const startMinutes     = startH * 60 + startM;
    const endMinutes       = endH * 60 + endM;
    const duration         = doctor.appointmentDuration;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const h   = Math.floor(m / 60).toString().padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      slots.push(`${h}:${min}`);
    }

    // استبعاد الأوقات المحجوزة مسبقاً
    const booked = await db.select().from(appointments).where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, date),
        or(eq(appointments.status, "pending"), eq(appointments.status, "confirmed"))
      )
    );
    const bookedTimes = new Set(booked.map(a => a.appointmentTime));
    return slots.filter(s => !bookedTimes.has(s));
  }

  // ── Conversations ─────────────────────────────────────────────────────────

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return conv;
  }

  async getConversationsByUser(userId: string, role: "doctor" | "patient"): Promise<Conversation[]> {
    if (role === "patient") {
      return db.select().from(conversations).where(eq(conversations.patientId, userId)).orderBy(desc(conversations.lastMessageAt));
    }
    const doctorId = parseInt(userId);
    if (isNaN(doctorId)) return [];
    return db.select().from(conversations).where(eq(conversations.doctorId, doctorId)).orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationsByDoctor(doctorId: string): Promise<Conversation[]> {
    const id = parseInt(doctorId);
    if (isNaN(id)) return [];
    return db.select().from(conversations).where(eq(conversations.doctorId, id)).orderBy(desc(conversations.lastMessageAt));
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [existing] = await db.select().from(conversations).where(eq(conversations.id, insertConversation.id)).limit(1);
    if (existing) {
      if (insertConversation.patientName && !existing.patientName) {
        const [updated] = await db.update(conversations)
          .set({ patientName: insertConversation.patientName })
          .where(eq(conversations.id, insertConversation.id))
          .returning();
        return updated;
      }
      return existing;
    }
    const [conv] = await db.insert(conversations).values({
      id:          insertConversation.id,
      doctorId:    insertConversation.doctorId,
      patientId:   insertConversation.patientId,
      patientName: insertConversation.patientName || null,
      lastMessage: insertConversation.lastMessage  || null,
    }).returning();
    return conv;
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
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
    await db.update(conversations).set({ lastMessageAt: new Date(), lastMessage: preview }).where(eq(conversations.id, insertMessage.conversationId));
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(
      and(eq(messages.conversationId, conversationId), eq(messages.receiverId, userId))
    );
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
      doctorId:    insertReview.doctorId,
      patientId:   insertReview.patientId,
      patientName: insertReview.patientName,
      rating:      insertReview.rating,
      comment:     insertReview.comment || null,
    }).returning();
    await this._recalcRating(insertReview.doctorId);
    return review;
  }

  async getReviewsByDoctor(doctorId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.doctorId, doctorId)).orderBy(desc(reviews.createdAt));
  }

  async hasReviewed(doctorId: number, patientId: string): Promise<boolean> {
    const [existing] = await db.select().from(reviews).where(
      and(eq(reviews.doctorId, doctorId), eq(reviews.patientId, patientId))
    ).limit(1);
    return !!existing;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deleted] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    if (!deleted) return false;
    await this._recalcRating(deleted.doctorId);
    return true;
  }

  private async _recalcRating(doctorId: number): Promise<void> {
    const doctorReviews = await db.select().from(reviews).where(eq(reviews.doctorId, doctorId));
    if (doctorReviews.length === 0) {
      await db.update(doctors).set({ rating: 0, reviewCount: 0 }).where(eq(doctors.id, doctorId));
    } else {
      const avg = doctorReviews.reduce((s, r) => s + r.rating, 0) / doctorReviews.length;
      await db.update(doctors).set({ rating: Math.round(avg * 10) / 10, reviewCount: doctorReviews.length }).where(eq(doctors.id, doctorId));
    }
  }
}

export const storage = new PostgresStorage();