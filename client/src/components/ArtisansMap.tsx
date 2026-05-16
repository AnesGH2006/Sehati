// client/src/components/ArtisansMap.tsx
// يستخدم Leaflet.js (مجاني، بدون API key)
// تثبيت: npm install leaflet @types/leaflet

import { useEffect, useRef, useState } from "react";
import { SPECIALTIES } from "@/lib/constants";

interface ArtisanLocation {
  id: number;
  name: string;
  craft?: string;
  category?: string;
  rating: number;
  latitude: number;
  longitude: number;
  locationName?: string;
  location_name?: string;
  isOnline?: boolean;
  is_online?: boolean;
  avatarUrl?: string;
}

interface ArtisansMapProps {
  height?: string;
  /** إذا كانت true تعرض فقط الحرفيين المتاحين */
  onlineOnly?: boolean;
}

export default function ArtisansMap({ height = "450px", onlineOnly = true }: ArtisansMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [artisans, setArtisans] = useState<ArtisanLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب بيانات الحرفيين
  useEffect(() => {
    // نحاول /api/artisans/map أولاً، وإذا فشل نرجع لـ /api/artisans
    fetch("/api/artisans/map", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        // ضمان أن البيانات دائماً array
        const arr = Array.isArray(data) ? data : [];
        setArtisans(arr);
        setLoading(false);
      })
      .catch(() => {
        // fallback: جلب كل الحرفيين من الـ endpoint الرئيسي
        fetch("/api/artisans", { credentials: "include" })
          .then(r => r.json())
          .then(data => {
            const arr = Array.isArray(data) ? data : [];
            setArtisans(arr);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }, []);

  // تهيئة الخريطة
  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return;

    // تحميل Leaflet ديناميكياً
    const loadLeaflet = async () => {
      // CSS
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;

      // الجزائر مركز الخريطة افتراضياً
      const map = L.map(mapRef.current).setView([28.0339, 1.6596], 5);
      mapInstanceRef.current = map;

      // خلفية OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // ── أيقونة حمراء مخصصة ──────────────────────────────
      const redIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            width: 24px; height: 24px;
            background: #ef4444;
            border: 3px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%,-50%) rotate(45deg);
              width: 6px; height: 6px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -28],
      });

      // ── رسم ماركر لكل حرفي ──────────────────────────────
      const filtered = onlineOnly
        ? artisans.filter(a => a.isOnline || a.is_online)
        : artisans;

      filtered.forEach((artisan) => {
        if (!artisan.latitude || !artisan.longitude) return;

        const craftLabel = artisan.craft || categoryLabel(artisan.category) || "";
        const locLabel   = artisan.locationName || artisan.location_name || "";

        const popup = `
          <div style="direction:rtl; font-family:sans-serif; min-width:160px;">
            <div style="font-weight:700; font-size:15px; color:#1e293b; margin-bottom:4px;">
              ${artisan.name}
            </div>
            <div style="color:#64748b; font-size:13px;">${craftLabel}</div>
            <div style="margin-top:6px; display:flex; align-items:center; gap:6px;">
              <span style="
                background:#dcfce7; color:#16a34a;
                border-radius:999px; padding:2px 10px;
                font-size:12px; font-weight:600;
              ">● متاح</span>
              <span style="color:#f59e0b;">★ ${artisan.rating?.toFixed(1) ?? "—"}</span>
            </div>
            ${locLabel ? `<div style="color:#94a3b8; font-size:12px; margin-top:4px;">📍 ${locLabel}</div>` : ""}
          </div>
        `;

        L.marker([artisan.latitude, artisan.longitude], { icon: redIcon })
          .addTo(map)
          .bindPopup(popup);
      });

      // تكيّف الخريطة مع الماركرات
      if (filtered.length > 0) {
        const validCoords = filtered
          .filter(a => a.latitude && a.longitude)
          .map(a => [a.latitude, a.longitude] as [number, number]);
        if (validCoords.length > 0) {
          map.fitBounds(validCoords, { padding: [40, 40] });
        }
      }
    };

    loadLeaflet();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [loading, artisans, onlineOnly]);

  return (
    <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden" }}>
      {loading && (
        <div style={{
          position: "absolute", inset: 0,
          background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10, fontSize: 14, color: "#64748b", direction: "rtl",
        }}>
          جاري تحميل الخريطة...
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height, direction: "ltr" }}
      />
      <div style={{
        position: "absolute", bottom: 12, right: 12,
        background: "white", borderRadius: 8, padding: "6px 12px",
        fontSize: 12, color: "#374151", direction: "rtl",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 1000,
      }}>
        🔴 موقع الحرفي المتاح
      </div>
    </div>
  );
}