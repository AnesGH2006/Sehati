import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function setupGoogleAuth(app: Express) {
  // ── متغيرات البيئة المطلوبة في .env ──────────────────────────────────────
  // GOOGLE_CLIENT_ID=...
  // GOOGLE_CLIENT_SECRET=...
  // APP_URL=https://your-replit-url.repl.co

  const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "180429058585-98arm61fqvb5o505efa1d7m8f6b6uo52.apps.googleusercontent.com";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
  const APP_URL              = process.env.APP_URL               || "https://herfati--alaagh23dz.replit.app";

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth غير مفعّل: أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في .env");
    // أضف route يعيد خطأ واضح بدل crash
    app.get("/api/auth/google", (_req, res) => {
      res.redirect(`/auth?error=google_not_configured`);
    });
    return;
  }

  app.use(passport.initialize());

  passport.use(new GoogleStrategy(
    {
      clientID:     GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:  `https://herfati--alaagh23dz.replit.app/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), undefined);

        // ابحث عن يوزر موجود
        const [existing] = await db.select().from(users).where(eq(users.email, email));

        if (existing) {
          // لو الحساب موجود، سجّل دخول مباشرة
          return done(null, existing);
        }

        // إنشاء حساب جديد
        const newUser = {
          id:           `user-${crypto.randomUUID()}`,
          name:         profile.displayName || email.split("@")[0],
          email,
          passwordHash: "",          // بدون كلمة مرور لـ OAuth
          phone:        null,
          role:         "customer" as const,
          isVerified:   true,        // Google verified automatically
        };

        await db.insert(users).values(newUser);
        return done(null, newUser);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  ));

  // ── Route 1: بدء تسجيل الدخول بـ Google ──────────────────────────────────
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })
  );

  // ── Route 2: Callback بعد موافقة Google ──────────────────────────────────
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_failed" }),
    (req: any, res) => {
      const user = req.user;
      if (!user) return res.redirect("/auth?error=no_user");

      // احفظ في session نفس طريقة تسجيل الدخول العادي
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      // أرجع لـ homepage
      res.redirect("/");
    }
  );
}