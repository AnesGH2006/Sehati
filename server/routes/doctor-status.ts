// server/routes/artisan-status.ts
// نقاط النهاية التي يستخدمها الحرفي لتحديث حالته (متصل/غير متصل) وموقعه على الخريطة
import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// ─── POST /api/artisan/:id/status ─────────────────────
// Body: { isOnline: boolean }
// يحدّث حالة الاتصال + lastSeen + status (available/offline)
router.post("/:id/status", async (req: Request, res: Response) => {
  try {
    const artisanId = parseInt(req.params.id);
    if (isNaN(artisanId)) return res.status(400).json({ error: "معرّف غير صالح" });

    const isOnline = !!req.body.isOnline;

    const updated = await storage.updateArtisan(artisanId, {
      isOnline,
      status: isOnline ? "available" : "offline",
      lastSeen: new Date(),
    } as any);

    if (!updated) return res.status(404).json({ error: "الحرفي غير موجود" });

    return res.json({
      success: true,
      isOnline: updated.isOnline,
      status: updated.status,
      message: isOnline ? "أصبحت متاحاً للزبائن" : "تم إخفاؤك من نتائج البحث",
    });
  } catch (err) {
    console.error("[artisan/status]", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ─── POST /api/artisan/:id/location ───────────────────
// Body: { latitude, longitude, locationName? }
router.post("/:id/location", async (req: Request, res: Response) => {
  try {
    const artisanId = parseInt(req.params.id);
    if (isNaN(artisanId)) return res.status(400).json({ error: "معرّف غير صالح" });

    const { latitude, longitude, locationName } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "خط الطول والعرض مطلوبان" });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "إحداثيات غير صالحة" });
    }

    const updated = await storage.updateArtisan(artisanId, {
      latitude: lat,
      longitude: lng,
      ...(locationName ? { locationName } : {}),
    } as any);

    if (!updated) return res.status(404).json({ error: "الحرفي غير موجود" });

    return res.json({
      success: true,
      latitude: updated.latitude,
      longitude: updated.longitude,
      locationName: updated.locationName,
      message: "تم حفظ الموقع بنجاح",
    });
  } catch (err) {
    console.error("[artisan/location]", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

export default router;
