// server/routes/emergency.ts
import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { sendPushToUser } from "../Push";

const router = Router();

// ─── POST /api/emergency ──────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, category, description, latitude, longitude } = req.body;

    if (!customerId || !category || !description) {
      return res.status(400).json({ error: "customerId, category, description مطلوبة" });
    }

    // 1. ابحث عن حرفيين بنفس التخصص
    const allArtisans = await storage.getArtisans({ category });

    if (allArtisans.length === 0) {
      return res.status(404).json({ error: "لا يوجد حرفي متاح في هذا التخصص حالياً" });
    }

    // 2. رتّبهم حسب المسافة إذا متوفرة
    let sorted = allArtisans;
    if (latitude && longitude) {
      const withDist = allArtisans
        .filter((a: any) => a.latitude && a.longitude)
        .map((a: any) => ({
          ...a,
          dist: haversine(latitude, longitude, a.latitude, a.longitude),
        }))
        .sort((a: any, b: any) => a.dist - b.dist);
      if (withDist.length > 0) sorted = withDist;
    }

    const artisan = sorted[0];

    // 3. أنشئ محادثة جديدة
    const convId = `emergency-${customerId}-${artisan.id}-${Date.now()}`;
    await storage.createConversation({
      id: convId,
      artisanId: artisan.id,
      customerId,
      customerName: customerName || "زبون",
    });

    // 4. أرسل رسالة الطوارئ كأول رسالة
    const emergencyMsg = `🚨 طلب طارئ\n\nالتخصص: ${category}\nالمشكلة: ${description}`;
    await storage.createMessage({
      conversationId: convId,
      senderId: customerId,
      receiverId: String(artisan.id),
      senderType: "customer",
      content: emergencyMsg,
    });

    // 5. Push notification للحرفي
    const pushIds = [String(artisan.id)];
    if (artisan.userId) pushIds.push(artisan.userId);
    for (const id of pushIds) {
      await sendPushToUser(id, {
        title: `🚨 طلب طارئ — ${category}`,
        body: description.slice(0, 80),
        url: `/artisan/dashboard`,
        type: "general",
      });
    }

    // 6. Socket event — نستورده lazy بدون circular import
    try {
      const { io } = await import("../index");
      const payload = { conversationId: convId, customerId, customerName: customerName || "زبون", category, description };
      io.to(String(artisan.id)).emit("emergency:incoming", payload);
      if (artisan.userId) io.to(artisan.userId).emit("emergency:incoming", payload);
    } catch {
      // صامت — الـ push كافي إذا فشل الـ socket
    }

    return res.json({
      success: true,
      conversationId: convId,
      artisan: {
        id: artisan.id,
        name: artisan.name,
        category: artisan.category,
        phone: artisan.phone,
        rating: artisan.rating,
        distanceKm: (artisan as any).dist
          ? Math.round((artisan as any).dist * 10) / 10
          : null,
      },
    });
  } catch (err) {
    console.error("[emergency]", err);
    return res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default router;