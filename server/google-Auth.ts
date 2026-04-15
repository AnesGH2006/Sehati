// server/google-Auth.ts

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function setupGoogleAuth(app: Express) {
  const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const APP_URL              = process.env.APP_URL               || "https://herfati--alaagh23dz.replit.app";

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth غير مفعّل: أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET");
    app.get("/api/auth/google", (_req, res) => {
      res.redirect("/auth?error=google_not_configured");
    });
    return;
  }

  app.use(passport.initialize());

  passport.use(new GoogleStrategy(
    {
      clientID:     GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:  `${APP_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), undefined);

        // ابحث عن حساب موجود
        const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        if (existing) return done(null, existing);

        // إنشاء حساب جديد
        const [newUser] = await db.insert(users).values({
          id:           `user-${crypto.randomUUID()}`,
          name:         profile.displayName || email.split("@")[0],
          email:        email.toLowerCase(),
          passwordHash: "",
          phone:        null,
          role:         "customer",
          isVerified:   true,
        }).returning();

        return done(null, newUser);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  ));

  // ── Route 1: بدء OAuth ───────────────────────────────────────────────────
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  // ── Route 2: Callback ────────────────────────────────────────────────────
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_failed" }),
    (req: any, res) => {
      const user = req.user;
      if (!user) return res.redirect("/auth?error=no_user");

      // نمرر بيانات المستخدم للـ frontend عبر query params
      // الـ frontend سيقرأها ويحفظها في localStorage
      const params = new URLSearchParams({
        google_auth: "1",
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        artisanId: user.artisanId ? String(user.artisanId) : "",
      });

      res.redirect(`/?${params.toString()}`);
    }
  );
}