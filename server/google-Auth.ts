import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || "180429058585-98arm61fqvb5o505efa1d7m8f6b6uo52.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
const APP_URL              = process.env.APP_URL               || "https://herafi.onrender.com";

export function setupGoogleAuth(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth غير مفعّل");
    app.get("/api/auth/google", (_req, res) => res.redirect("/auth?error=google_not_configured"));
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

        const [existing] = await db.select().from(users).where(eq(users.email, email));
        if (existing) return done(null, existing);

        const newUser = {
          id:           `user-${crypto.randomUUID()}`,
          name:         profile.displayName || email.split("@")[0],
          email,
          passwordHash: "",
          phone:        null,
          role:         "customer" as const,
          isVerified:   true,
        };
        await db.insert(users).values(newUser);
        return done(null, newUser);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  ));

  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth?error=google_failed" }),
    (req: any, res) => {
      try {
        const user = req.user;
        if (!user) return res.redirect("/auth?error=no_user");

        // نفس أسماء الـ params التي يقرأها GoogleAuthHandler في App.tsx
        const params = new URLSearchParams({
          google_auth: "1",
          id:          user.id,
          name:        user.name,
          phone:       user.phone || "",
          role:        user.role,
          artisanId:   user.artisanId ? String(user.artisanId) : "",
        });

        res.redirect(`/?${params.toString()}`);
      } catch (err) {
        console.error("[Google Callback Error]", err);
        res.redirect("/auth?error=callback_failed");
      }
    }
  );
}