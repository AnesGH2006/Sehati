import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDoctorSchema, insertMessageSchema, insertConversationSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { sendVerificationEmail, sendPasswordResetEmail, generateOTP } from "./Email";
import { saveSubscription, removeSubscription, sendPushToUser } from "./Push";
import nearbyRouter from "./routes/nearby";
import emergencyRouter from "./routes/emergency";
import doctorStatusRouter from "./routes/doctor-status";
import { db } from "./db";

const ADMIN_PASSWORD = "AlaaGH_Mil";
const adminSessions = new Set<string>();
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim();
  return req.socket.remoteAddress || "unknown";
}
function isAdmin(req: Request): boolean { return adminSessions.has(getClientIp(req)); }
function safeUser(user: any) { const { passwordHash, ...safe } = user; return safe; }

// ── resolveUserIds: يجد كل الـ IDs المحتملة لأي مستخدم ──────────────────────
async function resolveUserIds(rawId: string): Promise<string[]> {
  const ids = new Set<string>([rawId]);
  try {
    const userById = await storage.getUserById(rawId);
    if (userById) {
      ids.add(userById.id);
      if (userById.doctorId) ids.add(String(userById.doctorId));
    }
    const numId = parseInt(rawId);
    if (!isNaN(numId)) {
      const doctor = await storage.getDoctor(numId);
      if (doctor?.userId) ids.add(doctor.userId);
    }
  } catch { /* صامت */ }
  return Array.from(ids);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const express = (await import("express")).default;
  app.use("/uploads", express.static(UPLOADS_DIR));
  app.use("/api/doctors", nearbyRouter);
  app.use("/api/emergency", emergencyRouter);
  app.use("/api/doctor", doctorStatusRouter);

  // ── Upload ────────────────────────────────────────────────────────────────
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      const { data } = req.body as { data: string; filename?: string };
      if (!data || typeof data !== "string") return res.status(400).json({ message: "Invalid upload data" });
      const match = data.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return res.status(400).json({ message: "Invalid upload data" });
      const mime = match[1];
      const base64 = match[2];
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
        "image/webp": "webp", "image/gif": "gif",
        "video/mp4": "mp4", "video/webm": "webm",
        "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3",
      };
      const ext  = extMap[mime] || "bin";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await fs.promises.writeFile(path.join(UPLOADS_DIR, name), Buffer.from(base64, "base64"));
      res.json({ url: `/uploads/${name}` });
    } catch { res.status(500).json({ message: "Upload failed" }); }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ message: "الاسم والبريد وكلمة المرور مطلوبة" });
      if (password.length < 6) return res.status(400).json({ message: "كلمة المرور يجب ان تكون 6 احرف على الاقل" });
      const user = await storage.registerUser(name, email, password, phone);
      if (!user) return res.status(409).json({ message: "البريد الالكتروني مستخدم بالفعل" });
      const otp  = generateOTP();
      await storage.setUserOTP(email, otp);
      const sent = await sendVerificationEmail(email, name, otp);
      res.status(201).json({ user: safeUser(user), emailSent: sent, message: sent ? "تم ارسال رمز التحقق" : "تم انشاء الحساب لكن فشل ارسال البريد" });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ message: "البريد والرمز مطلوبان" });
      const verified = await storage.verifyUserEmail(email, otp);
      if (!verified) return res.status(400).json({ message: "رمز التحقق غير صحيح او انتهت صلاحيته" });
      res.json({ success: true, message: "تم تاكيد بريدك الالكتروني بنجاح" });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.post("/api/auth/resend-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "البريد غير موجود" });
      if (user.isVerified) return res.status(400).json({ message: "الحساب مؤكد بالفعل" });
      const otp  = generateOTP();
      await storage.setUserOTP(email, otp);
      const sent = await sendVerificationEmail(email, user.name, otp);
      res.json({ success: sent, message: sent ? "تم ارسال رمز جديد" : "فشل الارسال" });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "البريد غير موجود" });
      const otp  = generateOTP();
      await storage.setUserOTP(email, otp);
      const sent = await sendPasswordResetEmail(email, user.name, otp);
      res.json({ success: sent, message: sent ? "تم ارسال رمز اعادة التعيين" : "فشل الارسال" });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      if (newPassword.length < 6) return res.status(400).json({ message: "كلمة المرور يجب ان تكون 6 احرف على الاقل" });
      const success = await storage.resetUserPassword(email, otp, newPassword);
      if (!success) return res.status(400).json({ message: "رمز التحقق غير صحيح او انتهت صلاحيته" });
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
      const user = await storage.loginUser(email, password);
      if (!user) return res.status(401).json({ message: "البريد او كلمة المرور غير صحيحة" });
      if (!user.isVerified) return res.status(403).json({ message: "يجب تاكيد بريدك الالكتروني اولا", needsVerification: true, email });
      let doctorData = null;
      if (user.role === "doctor" && user.doctorId) doctorData = await storage.getDoctor(user.doctorId);
      res.json({ user: safeUser(user), doctor: doctorData });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  app.get("/api/auth/me/:userId", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserById(req.params.userId);
      if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
      let doctorData = null;
      if (user.role === "doctor" && user.doctorId) doctorData = await storage.getDoctor(user.doctorId);
      res.json({ user: safeUser(user), doctor: doctorData });
    } catch { res.status(500).json({ message: "خطا في الخادم" }); }
  });

  // ── Admin ─────────────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) { adminSessions.add(getClientIp(req)); return res.json({ success: true }); }
    return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
  });
  app.get("/api/admin/check", (req: Request, res: Response) => res.json({ isAdmin: isAdmin(req), ip: getClientIp(req) }));
  app.post("/api/admin/logout", (req: Request, res: Response) => { adminSessions.delete(getClientIp(req)); res.json({ success: true }); });
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
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    res.json(await storage.getAllUsers());
  });
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try { const d = await storage.deleteUser(req.params.id); if (!d) return res.status(404).json({ message: "User not found" }); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Failed to delete user" }); }
  });
  app.post("/api/admin/users/:id/verify", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try { await storage.forceVerifyUser(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Failed to verify user" }); }
  });

  // ── Doctors ───────────────────────────────────────────────────────────────
  app.get("/api/doctors", async (req: Request, res: Response) => {
    try {
      const { specialty, daira, search, minFee, maxFee } = req.query;
      res.json(await storage.getDoctors({
        specialty: specialty as string,
        daira:     daira     as string,
        search:    search    as string,
        minFee:    minFee ? parseInt(minFee as string) : undefined,
        maxFee:    maxFee ? parseInt(maxFee as string) : undefined,
      }));
    } catch { res.status(500).json({ message: "Failed to fetch doctors" }); }
  });

  app.get("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const doctor = await storage.getDoctor(parseInt(req.params.id));
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      res.json(doctor);
    } catch { res.status(500).json({ message: "Failed to fetch doctor" }); }
  });

  app.post("/api/doctors", async (req: Request, res: Response) => {
    try {
      const b = req.body;

      // Required field check
      const name      = b.name?.trim();
      const email     = b.email?.trim();
      const phone     = b.phone?.trim();
      const specialty = b.specialty || b.SPECIALTIES;
      const wilaya    = b.wilaya || "الجزائر";
      const daira     = b.daira;

      if (!name || !email || !phone || !specialty || !daira) {
        return res.status(400).json({ message: "الحقول المطلوبة: name, email, phone, specialty, daira" });
      }

      // Use raw SQL to bypass Drizzle's column-name mismatch
      // (DB column is still "SPECIALTIES" uppercase until migration runs)
      const { rows } = await (db as any).execute(
        `INSERT INTO doctors
           (name, email, phone, "SPECIALTIES", wilaya, daira,
            description, image_url, is_verified, years_of_experience,
            subscription_type, subscription_duration,
            consultation_fee, rating, review_count,
            working_days, working_hours_start, working_hours_end,
            appointment_duration, languages, is_online)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,0,
            ARRAY['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء'],
            '08:00','17:00',30,ARRAY['العربية'],false)
         RETURNING *`,
        [
          name,
          email,
          phone,
          specialty,
          wilaya,
          daira,
          b.description || "طبيب محترف في منصة طبيبي",
          b.imageUrl || null,
          false,
          parseInt(b.yearsOfExperience) || 0,
          b.subscriptionType || "free",
          parseInt(b.subscriptionDuration) || 1,
          parseInt(b.consultationFee) || 1000,
        ]
      );

      const doctor = rows[0];

      if (b.userId) {
        try { await storage.linkUserToDoctor(b.userId, doctor.id); }
        catch (linkErr) { console.warn("[linkUserToDoctor] failed:", linkErr); }
      }

      res.status(201).json(doctor);
    } catch (error) {
      console.error("[createDoctor]", error);
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.patch("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const doctor = await storage.updateDoctor(parseInt(req.params.id), req.body);
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      res.json(doctor);
    } catch { res.status(500).json({ message: "Failed to update doctor" }); }
  });

  app.delete("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteDoctor(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Doctor not found" });
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete doctor" }); }
  });

  app.post("/api/doctors/:id/view", async (req: Request, res: Response) => {
    try {
      await storage.trackDoctorView(parseInt(req.params.id), getClientIp(req), req.body?.viewerId);
      res.json({ success: true });
    } catch (err) { console.warn("[view-track]", err); res.json({ success: false }); }
  });

  // ── Doctor Analytics ──────────────────────────────────────────────────────
  app.get("/api/doctors/:id/analytics", async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.id;
      const [convList, reviewList, viewStats, appointmentList] = await Promise.all([
        storage.getConversationsByDoctor(doctorId),
        storage.getReviewsByDoctor(parseInt(doctorId)),
        storage.getDoctorViewStats(parseInt(doctorId)),
        storage.getAppointmentsByDoctor(parseInt(doctorId)),
      ]);
      const now              = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const convsThisMonth       = convList.filter((c: any) => new Date(c.createdAt) >= startOfThisMonth).length;
      const convsLastMonth       = convList.filter((c: any) => new Date(c.createdAt) >= startOfLastMonth && new Date(c.createdAt) < startOfThisMonth).length;
      const reviewsThisMonth     = reviewList.filter((r: any) => new Date(r.createdAt) >= startOfThisMonth).length;
      const reviewsLastMonth     = reviewList.filter((r: any) => new Date(r.createdAt) >= startOfLastMonth && new Date(r.createdAt) < startOfThisMonth).length;
      const apptThisMonth        = appointmentList.filter((a: any) => new Date(a.createdAt) >= startOfThisMonth).length;
      const apptLastMonth        = appointmentList.filter((a: any) => new Date(a.createdAt) >= startOfLastMonth && new Date(a.createdAt) < startOfThisMonth).length;
      const completedAppointments = appointmentList.filter((a: any) => a.status === "completed").length;

      const ratingDist = [1,2,3,4,5].map(star => ({ star, count: reviewList.filter((r: any) => r.rating === star).length }));
      const dailyConvs: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d  = new Date(); d.setDate(d.getDate() - i);
        const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const de = new Date(ds.getTime() + 86400000);
        dailyConvs.push({ date: d.toLocaleDateString("ar-DZ", { weekday: "short" }), count: convList.filter((c: any) => { const t = new Date(c.createdAt); return t >= ds && t < de; }).length });
      }
      const monthlyConvs: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nx = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        monthlyConvs.push({ month: d.toLocaleDateString("ar-DZ", { month: "short" }), count: convList.filter((c: any) => { const t = new Date(c.createdAt); return t >= d && t < nx; }).length });
      }
      const pct = (c: number, p: number) => { if (p === 0) return c > 0 ? 100 : 0; return Math.round(((c - p) / p) * 100); };
      const totalConvs = convList.length;
      const replyRate  = totalConvs > 0 ? Math.round((convList.filter((c: any) => c.lastMessage).length / totalConvs) * 100) : 100;
      const avgRating  = reviewList.length > 0 ? reviewList.reduce((s: number, r: any) => s + r.rating, 0) / reviewList.length : 0;

      res.json({
        totalViews: viewStats.total, viewsThisMonth: viewStats.thisMonth, viewsLastMonth: viewStats.lastMonth, viewsChange: pct(viewStats.thisMonth, viewStats.lastMonth), dailyViews: viewStats.daily,
        totalConversations: totalConvs, convsThisMonth, convsLastMonth, convsChange: pct(convsThisMonth, convsLastMonth),
        avgRating: Math.round(avgRating * 10) / 10, totalReviews: reviewList.length, reviewsThisMonth, reviewsLastMonth, reviewsChange: pct(reviewsThisMonth, reviewsLastMonth),
        totalAppointments: appointmentList.length, apptThisMonth, apptLastMonth, apptChange: pct(apptThisMonth, apptLastMonth), completedAppointments,
        replyRate, dailyConversations: dailyConvs, monthlyConversations: monthlyConvs, ratingDistribution: ratingDist,
        improvements: [
          { key: "views",        label: "المشاهدات",   value: Math.min(Math.round((viewStats.thisMonth / 100) * 100), 100), change: pct(viewStats.thisMonth, viewStats.lastMonth), color: "#3B82F6" },
          { key: "appointments", label: "المواعيد",    value: Math.min(Math.round((apptThisMonth / 20) * 100), 100),        change: pct(apptThisMonth, apptLastMonth),             color: "#8B5CF6" },
          { key: "rating",       label: "التقييم",     value: Math.round((avgRating / 5) * 100),                            change: pct(reviewsThisMonth, reviewsLastMonth),        color: "#F59E0B" },
          { key: "replyRate",    label: "معدل الرد",   value: replyRate, change: 0, color: "#10B981" },
          { key: "completed",    label: "مواعيد مكتملة", value: appointmentList.length > 0 ? Math.round((completedAppointments / appointmentList.length) * 100) : 0, change: 0, color: "#EC4899" },
        ],
      });
    } catch (err) { console.error("[analytics]", err); res.status(500).json({ error: "فشل جلب الاحصاءات" }); }
  });

  // ── Reviews ───────────────────────────────────────────────────────────────
  app.get("/api/doctors/:id/reviews", async (req: Request, res: Response) => {
    try { res.json(await storage.getReviewsByDoctor(parseInt(req.params.id))); }
    catch { res.status(500).json({ message: "Failed to fetch reviews" }); }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse(req.body) as { doctorId: number; patientId: string };
      if (await storage.hasReviewed(data.doctorId, data.patientId)) return res.status(409).json({ message: "لقد قيمت هذا الطبيب من قبل" });
      res.status(201).json(await storage.createReview(data));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.delete("/api/reviews/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
    try { const d = await storage.deleteReview(parseInt(req.params.id)); if (!d) return res.status(404).json({ message: "Review not found" }); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Failed to delete review" }); }
  });

  // ── Appointments ──────────────────────────────────────────────────────────
  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      const data        = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      // إرسال إشعار للطبيب
      const doctor = await storage.getDoctor(data.doctorId);
      if (doctor?.userId) {
        const receiverIds = await resolveUserIds(doctor.userId);
        for (const id of receiverIds) {
          const sent = await sendPushToUser(id, {
            title: `موعد جديد من ${data.patientName} 📅`,
            body:  `${data.appointmentDate} - ${data.appointmentTime}${data.isUrgent ? " 🚨 عاجل" : ""}`,
            url:   "/doctor/dashboard",
            type:  "appointment",
          });
          if (sent) break;
        }
      }
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", async (req: Request, res: Response) => {
    try { res.json(await storage.getAppointmentsByDoctor(parseInt(req.params.doctorId))); }
    catch { res.status(500).json({ message: "Failed to fetch appointments" }); }
  });

  app.get("/api/appointments/patient/:patientId", async (req: Request, res: Response) => {
    try { res.json(await storage.getAppointmentsByPatient(req.params.patientId)); }
    catch { res.status(500).json({ message: "Failed to fetch appointments" }); }
  });

  app.get("/api/appointments/slots/:doctorId", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ message: "التاريخ مطلوب" });
      const slots = await storage.getAvailableSlots(parseInt(req.params.doctorId), date as string);
      res.json(slots);
    } catch { res.status(500).json({ message: "Failed to fetch available slots" }); }
  });

  app.patch("/api/appointments/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, doctorNotes } = req.body;
      const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
      if (!validStatuses.includes(status)) return res.status(400).json({ message: "حالة غير صالحة" });
      const appointment = await storage.updateAppointmentStatus(parseInt(req.params.id), status, doctorNotes);
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });
      // إرسال إشعار للمريض عند تأكيد أو إلغاء الموعد
      if (status === "confirmed" || status === "cancelled") {
        const statusText = status === "confirmed" ? "تم تأكيد موعدك ✅" : "تم إلغاء موعدك ❌";
        const receiverIds = await resolveUserIds(appointment.patientId);
        for (const id of receiverIds) {
          const sent = await sendPushToUser(id, {
            title: statusText,
            body:  `${appointment.appointmentDate} - ${appointment.appointmentTime}`,
            url:   "/my-appointments",
            type:  "appointments",
          });
          if (sent) break;
        }
      }
      res.json(appointment);
    } catch { res.status(500).json({ message: "Failed to update appointment" }); }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteAppointment(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Appointment not found" });
      res.json({ success: true });
    } catch { res.status(500).json({ message: "Failed to delete appointment" }); }
  });

  // ── Conversations ─────────────────────────────────────────────────────────
  app.get("/api/conversations/:userId", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as "doctor" | "patient";
      if (!role) return res.status(400).json({ message: "Role is required" });
      res.json(await storage.getConversationsByUser(req.params.userId, role));
    } catch { res.status(500).json({ message: "Failed to fetch conversations" }); }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try { const data = insertConversationSchema.parse(req.body); res.status(201).json(await storage.createConversation(data)); }
    catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors }); res.status(500).json({ message: "Failed to create conversation" }); }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try { res.json(await storage.getMessages(req.params.id)); }
    catch { res.status(500).json({ message: "Failed to fetch messages" }); }
  });

  // ── Push Notifications ────────────────────────────────────────────────────
  app.post("/api/push/subscribe", (req: Request, res: Response) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) return res.status(400).json({ message: "Missing data" });
    saveSubscription(userId, subscription);
    res.json({ success: true });
  });
  app.post("/api/push/unsubscribe", (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId) removeSubscription(userId);
    res.json({ success: true });
  });

  // ── Messages ──────────────────────────────────────────────────────────────
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const data    = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      sendPushNotification(data).catch(err => console.warn("[Push] Background notification failed:", err));
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: error.errors });
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.delete("/api/messages/:id", async (req: Request, res: Response) => {
    try { const d = await storage.deleteMessage(parseInt(req.params.id)); if (!d) return res.status(404).json({ message: "Message not found" }); res.json({ success: true }); }
    catch { res.status(500).json({ message: "Failed to delete message" }); }
  });

  app.patch("/api/messages/:id", async (req: Request, res: Response) => {
    try { const { content } = req.body; const msg = await storage.editMessage(parseInt(req.params.id), content); if (!msg) return res.status(404).json({ message: "Message not found" }); res.json(msg); }
    catch { res.status(500).json({ message: "Failed to edit message" }); }
  });

  return httpServer;
}

// ── إرسال إشعار رسائل مع حل مشكلة عدم تطابق الـ IDs ─────────────────────────
async function sendPushNotification(data: any): Promise<void> {
  const body = data.content.startsWith("data:image") ? "📷 صورة" : data.content.slice(0, 80);

  if (data.senderType === "doctor") {
    const doctor = await storage.getDoctor(parseInt(data.senderId));
    if (!doctor) return;
    const title      = `رسالة جديدة من د. ${doctor.name} 🩺`;
    const url        = `/chat/${doctor.id}`;
    const receiverIds = await resolveUserIds(data.receiverId);
    for (const id of receiverIds) {
      const sent = await sendPushToUser(id, { title, body, url, type: "message" });
      if (sent) break;
    }
  } else {
    const conv = await storage.getConversation(data.conversationId);
    if (!conv) return;
    const title      = `رسالة جديدة من ${conv.patientName || "مريض"} 👤`;
    const url        = `/doctor/dashboard`;
    const receiverIds = await resolveUserIds(String(conv.doctorId));
    for (const id of receiverIds) {
      const sent = await sendPushToUser(id, { title, body, url, type: "message" });
      if (sent) break;
    }
  }
}