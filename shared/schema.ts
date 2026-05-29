import { pgTable, text, integer, boolean, timestamp, real, serial, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:           text("id").primaryKey(),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone:        text("phone"),
  role:         text("role", { enum: ["patient", "doctor"] }).notNull().default("patient"),
  doctorId:     integer("artisan_id"),
  isVerified:   boolean("is_verified").notNull().default(false),
  otp:          text("otp"),
  otpExpiry:    timestamp("otp_expiry"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctors = pgTable("doctors", {
  id:                    integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId:                text("user_id").references(() => users.id, { onDelete: "set null" }),
  name:                  text("name").notNull(),
  email:                 text("email").notNull(),
  phone:                 text("phone").notNull(),

  // ── المعلومات الطبية ──────────────────────────────────
  specialty:             text("specialty").notNull(),            // التخصص (مثال: طب عام، قلب، أطفال...)
  licenseNumber:         text("license_number"),                 // رقم الترخيص الطبي
  clinicName:            text("clinic_name"),                    // اسم العيادة
  consultationFee: integer("consultation_fee").notNull().default(1000),

  wilaya:                text("wilaya").notNull().default("الجزائر"),
  daira:                 text("daira").notNull(),
  clinicAddress:         text("clinic_address"),                 // عنوان العيادة التفصيلي

  description:           text("description"),
  rating:                real("rating").notNull().default(0),
  reviewCount:           integer("review_count").notNull().default(0),
  isVerified:            boolean("is_verified").notNull().default(false),
  yearsOfExperience:     integer("years_of_experience").notNull().default(0),
  imageUrl:              text("image_url"),

  // ── أوقات العمل والمواعيد ─────────────────────────────
  workingDays:           text("working_days").array().notNull().default(["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء"]),
  workingHoursStart:     text("working_hours_start").notNull().default("08:00"),
  workingHoursEnd:       text("working_hours_end").notNull().default("17:00"),
  appointmentDuration:   integer("appointment_duration").notNull().default(30),

  languages:             text("languages").array().notNull().default(["العربية"]),

  // ── الاشتراك ──────────────────────────────────────────
  subscriptionType:      text("subscription_type", {
                           enum: ["free", "standard", "pro", "gold"],
                         }).notNull().default("free"),
  subscriptionDuration:  integer("subscription_duration").notNull().default(1),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),

  // ── الحالة ────────────────────────────────────────────
  isOnline:              boolean("is_online").notNull().default(false),
  lastSeen:              timestamp("last_seen").defaultNow(),

  // ── الموقع الجغرافي ───────────────────────────────────
  latitude:              doublePrecision("latitude"),
  longitude:             doublePrecision("longitude"),
  locationName:          text("location_name"),

  status:                text("status", {
                           enum: ["available", "busy", "offline"],
                         }).default("available"),

  createdAt:             timestamp("created_at").notNull().defaultNow(),
});

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointments = pgTable("appointments", {
  id:              integer("id").primaryKey().generatedAlwaysAsIdentity(),
  doctorId:        integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  patientId: text("patient_id").notNull(),
  patientName:     text("patient_name").notNull(),
  patientPhone:    text("patient_phone"),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status:          text("status", {
                     enum: ["pending", "confirmed", "cancelled", "completed"],
                   }).notNull().default("pending"),
  notes:           text("notes"),
  doctorNotes:     text("doctor_notes"),
  isUrgent:        boolean("is_urgent").notNull().default(false),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
});

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id:            text("id").primaryKey(),
  doctorId:      integer("doctor_id").notNull(),
  patientId:     text("patient_id").notNull(),
  patientName:   text("patient_name"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  lastMessage:   text("last_message"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

// ── Messages ──────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id:             integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: text("conversation_id").notNull(),
  senderId:       text("sender_id").notNull(),
  receiverId:     text("receiver_id").notNull(),
  senderType:     text("sender_type", { enum: ["patient", "doctor"] }).notNull(),
  content:        text("content").notNull(),
  isRead:         boolean("is_read").notNull().default(false),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id:          integer("id").primaryKey().generatedAlwaysAsIdentity(),
  doctorId:    integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  patientId:   text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  rating:      integer("rating").notNull(),
  comment:     text("comment"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

// ── Doctor Views ──────────────────────────────────────────────────────────────
export const doctorViews = pgTable("doctor_views", {
  id:        serial("id").primaryKey(),
  doctorId:  integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  viewerIp:  text("viewer_ip").notNull().default("unknown"),
  viewerId:  text("viewer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type User             = typeof users.$inferSelect;
export type Doctor           = typeof doctors.$inferSelect;
export type Appointment      = typeof appointments.$inferSelect;
export type Conversation     = typeof conversations.$inferSelect;
export type Message          = typeof messages.$inferSelect;
export type Review           = typeof reviews.$inferSelect;
export type DoctorView       = typeof doctorViews.$inferSelect;
export type InsertDoctorView = typeof doctorViews.$inferInsert;

// ── Insert Schemas (Zod) ──────────────────────────────────────────────────────
export const insertDoctorSchema = createInsertSchema(doctors)
  .omit({ id: true, rating: true, reviewCount: true, createdAt: true })
  .extend({
    // جميع الحقول الاختيارية غير المطلوبة في نموذج التسجيل
    userId:                z.string().optional(),
    licenseNumber:         z.string().optional(),
    clinicName:            z.string().optional(),
    clinicAddress:         z.string().optional(),
    consultationFee:       z.number().optional(),
    description:           z.string().optional(),
    isVerified:            z.boolean().optional(),
    yearsOfExperience:     z.number().optional(),
    imageUrl:              z.string().optional(),
    workingDays:           z.array(z.string()).optional(),
    workingHoursStart:     z.string().optional(),
    workingHoursEnd:       z.string().optional(),
    appointmentDuration:   z.number().optional(),
    languages:             z.array(z.string()).optional(),
    subscriptionType:      z.enum(["free", "standard", "pro", "gold"]).optional(),
    subscriptionDuration:  z.number().optional(),
    subscriptionExpiresAt: z.date().optional(),
    isOnline:              z.boolean().optional(),
    lastSeen:              z.date().optional(),
    latitude:              z.number().optional(),
    longitude:             z.number().optional(),
    locationName:          z.string().optional(),
    status:                z.enum(["available", "busy", "offline"]).optional(),
    wilaya:                z.string().optional(),
  });

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  lastMessageAt: true, createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true, isRead: true, createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true, createdAt: true,
});

export const insertDoctorViewSchema = createInsertSchema(doctorViews).omit({
  id: true, createdAt: true,
});

export type InsertDoctor       = z.infer<typeof insertDoctorSchema>;
export type InsertAppointment  = z.infer<typeof insertAppointmentSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage      = z.infer<typeof insertMessageSchema>;
export type InsertReview       = z.infer<typeof insertReviewSchema>;