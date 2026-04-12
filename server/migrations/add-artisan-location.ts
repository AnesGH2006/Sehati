// ======================================================
// server/migrations/add-artisan-location.ts
// شغله مرة واحدة لإضافة أعمدة الموقع للجدول الموجود
// ======================================================

import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("🔄 إضافة أعمدة الموقع الجغرافي لجدول artisans...");

  try {
    // إضافة enum للحالة (إذا ما كانت موجودة)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE artisan_status AS ENUM ('available', 'busy', 'offline');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // إضافة عمود الحالة
    await db.execute(sql`
      ALTER TABLE artisans
        ADD COLUMN IF NOT EXISTS status artisan_status DEFAULT 'available',
        ADD COLUMN IF NOT EXISTS latitude  REAL,
        ADD COLUMN IF NOT EXISTS longitude REAL,
        ADD COLUMN IF NOT EXISTS city      TEXT,
        ADD COLUMN IF NOT EXISTS wilaya    TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    // Index على الإحداثيات للأداء
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_artisans_location
        ON artisans (latitude, longitude)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    // Index على الحرفة
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_artisans_craft
        ON artisans (craft);
    `);

    console.log("✅ Migration اكتمل بنجاح!");
  } catch (err) {
    console.error("❌ خطأ في Migration:", err);
    process.exit(1);
  }
}

migrate();

// ─── تشغيل ──────────────────────────────────────────
// npx tsx server/migrations/add-artisan-location.ts