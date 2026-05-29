// server/routes/nearby.ts
import { Router, Request, Response } from "express";
import { storage } from "../storage";

const router = Router();

// ─── حساب المسافة بـ Haversine ────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

// ─── GET /api/doctors/nearby ──────────────────────────
// ?lat=36.73&lng=3.08&radius=10&specialty=cardiology&status=available&q=علي&sort=distance
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "lat و lng مطلوبان" });
    }

    const radiusKm = Math.min(parseFloat(req.query.radius as string) || 10, 100);
    const specialty = req.query.specialty as string | undefined;
    const status    = req.query.status as string | undefined;
    const q         = (req.query.q as string | undefined)?.trim().toLowerCase();
    const sort      = (req.query.sort as string) || "distance";
    const limit     = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // جلب كل الأطباء من storage
    const all = await storage.getDoctors({
      specialty: specialty && specialty !== "all" ? specialty : undefined,
      search:    q || undefined,
    });

    // فلترة + حساب المسافة في JS
    let results = all
      .filter((d: any) => {
        if (d.latitude == null || d.longitude == null) return false;
        if (status && status !== "all" && d.status !== status) return false;
        const dist = haversineKm(lat, lng, d.latitude, d.longitude);
        return dist <= radiusKm;
      })
      .map((d: any) => ({
        ...d,
        distanceKm: haversineKm(lat, lng, d.latitude, d.longitude),
      }));

    // ترتيب
    if (sort === "rating")    results.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === "name") results.sort((a: any, b: any) => (a.name ?? "").localeCompare(b.name ?? "", "ar"));
    else                      results.sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    return res.json({
      success: true,
      count:   results.slice(0, limit).length,
      data:    results.slice(0, limit),
      meta:    { userLocation: { lat, lng }, radiusKm, sort },
    });
  } catch (err) {
    console.error("[nearby]", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ─── PUT /api/doctors/:id/location ───────────────────
// Body: { lat, lng, locationName?, wilaya? }
router.put("/:id/location", async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id);
    const { lat, lng, locationName, wilaya } = req.body;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "lat و lng مطلوبان" });
    }

    await storage.updateDoctor(doctorId, {
      latitude:     lat,
      longitude:    lng,
      ...(locationName ? { locationName } : {}),
      ...(wilaya       ? { wilaya }       : {}),
    });

    return res.json({ success: true, message: "تم تحديث الموقع" });
  } catch (err) {
    console.error("[location update]", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

export default router;
