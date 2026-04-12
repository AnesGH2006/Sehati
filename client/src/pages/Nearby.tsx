// ======================================================
// client/src/pages/nearby.tsx
// صفحة البحث عن حرفي قريب — Leaflet + API حرفتي
// ======================================================

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; // دالة الـ fetch عندك

// ─── أنواع البيانات ───────────────────────────────────
interface NearbyArtisan {
  id: number;
  userId: number;
  name: string;
  craft: string;
  rating: number;
  reviewCount: number;
  status: "available" | "busy" | "offline";
  isVerified: boolean;
  latitude: number;
  longitude: number;
  city: string | null;
  wilaya: string | null;
  distanceKm: number;
  avatarUrl: string | null;
}

interface SearchParams {
  lat: number;
  lng: number;
  radius: number;
  craft: string;
  status: string;
  q: string;
  sort: "distance" | "rating" | "name";
}

// ─── ألوان الحرف ──────────────────────────────────────
const CRAFT_COLORS: Record<string, string> = {
  نجار:    "#5D4037",
  حداد:    "#37474F",
  كهربائي: "#F57F17",
  سباك:    "#1565C0",
  دهان:    "#6A1B9A",
  بناء:    "#2E7D32",
  default: "#888888",
};

const CRAFT_LIST = ["الكل", "نجار", "حداد", "كهربائي", "سباك", "دهان", "بناء"];

// ─── صناعة أيقونة Leaflet مخصصة ─────────────────────
function makeCraftIcon(craft: string, selected = false) {
  const color = CRAFT_COLORS[craft] ?? CRAFT_COLORS.default;
  const size = selected ? 40 : 34;
  const letter = craft[0] ?? "؟";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}"
        fill="${selected ? color : "white"}"
        stroke="${color}"
        stroke-width="${selected ? 0 : 2.5}"
      />
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle"
        font-size="${selected ? 17 : 14}"
        font-weight="600"
        fill="${selected ? "white" : color}"
        font-family="Arial, sans-serif"
      >${letter}</text>
      <polygon points="${size / 2 - 5},${size - 2} ${size / 2 + 5},${size - 2} ${size / 2},${size + 6}"
        fill="${color}" />
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

const USER_ICON = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#1565C0;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #1565C040"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ─── الصفحة الرئيسية ─────────────────────────────────
export default function NearbyPage() {
  const mapRef     = useRef<L.Map | null>(null);
  const mapDivRef  = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const userMarker = useRef<L.Marker | null>(null);
  const radiusCircle = useRef<L.Circle | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [params, setParams] = useState<SearchParams>({
    lat: 36.7372,   // الجزائر العاصمة — سيتغير لما يسمح الزبون بالموقع
    lng: 3.0865,
    radius: 10,
    craft: "الكل",
    status: "all",
    q: "",
    sort: "distance",
  });
  const [locationGranted, setLocationGranted] = useState(false);

  // ─── جلب البيانات من API ──────────────────────────
  const { data, isLoading, isError } = useQuery<{ data: NearbyArtisan[] }>({
    queryKey: [
      "nearby-artisans",
      params.lat, params.lng, params.radius,
      params.craft, params.status, params.q, params.sort,
    ],
    queryFn: () => {
      const p = new URLSearchParams({
        lat:    String(params.lat),
        lng:    String(params.lng),
        radius: String(params.radius),
        sort:   params.sort,
      });
      if (params.craft !== "الكل") p.set("craft", params.craft);
      if (params.status !== "all")  p.set("status", params.status);
      if (params.q.trim())           p.set("q", params.q.trim());
      return apiRequest(`/api/artisans/nearby?${p}`);
    },
    staleTime: 30_000,
  });

  const artisans = data?.data ?? [];

  // ─── تهيئة الخريطة ───────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [params.lat, params.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topleft" }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ─── تحديث marker الزبون + دائرة النطاق ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // marker الزبون
    if (userMarker.current) userMarker.current.setLatLng([params.lat, params.lng]);
    else userMarker.current = L.marker([params.lat, params.lng], { icon: USER_ICON, zIndexOffset: 1000 })
      .addTo(map)
      .bindTooltip("أنت هنا", { direction: "top", permanent: false });

    // دائرة النطاق
    if (radiusCircle.current) radiusCircle.current.setRadius(params.radius * 1000);
    else radiusCircle.current = L.circle([params.lat, params.lng], {
      radius: params.radius * 1000,
      color: "#1565C0", weight: 1.5, dashArray: "6,4",
      fillColor: "#1565C0", fillOpacity: 0.06,
    }).addTo(map);

    radiusCircle.current.setLatLng([params.lat, params.lng]);
  }, [params.lat, params.lng, params.radius]);

  // ─── رسم pins الحرفيين ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // حذف القديمة
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    artisans.forEach(a => {
      const isSelected = a.id === selectedId;
      const marker = L.marker([a.latitude, a.longitude], {
        icon: makeCraftIcon(a.craft, isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      })
        .addTo(map)
        .bindPopup(`
          <div style="direction:rtl;font-family:sans-serif;min-width:160px">
            <strong style="font-size:14px">${a.name}</strong><br/>
            <span style="color:#666;font-size:12px">${a.craft}</span><br/>
            <span style="color:#E9A800;font-size:13px">${"★".repeat(Math.round(a.rating))}${"☆".repeat(5 - Math.round(a.rating))}</span>
            <span style="font-size:12px;color:#555"> ${a.rating} (${a.reviewCount})</span><br/>
            <span style="font-size:12px;color:#666">📍 ${a.distanceKm} كم</span>
            <span style="font-size:11px;padding:2px 6px;border-radius:10px;margin-right:6px;
              background:${a.status === "available" ? "#E8F5E9" : "#FFF8E1"};
              color:${a.status === "available" ? "#2E7D32" : "#F57F17"}">
              ${a.status === "available" ? "متاح" : "مشغول"}
            </span>
          </div>
        `, { direction: "rtl" })
        .on("click", () => {
          setSelectedId(a.id);
          scrollToCard(a.id);
        });

      markersRef.current.set(a.id, marker);
    });
  }, [artisans, selectedId]);

  // ─── الموقع الحقيقي ──────────────────────────────
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return alert("المتصفح لا يدعم تحديد الموقع");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setParams(p => ({ ...p, lat: latitude, lng: longitude }));
        mapRef.current?.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
        setLocationGranted(true);
      },
      () => alert("لم يتم السماح بالوصول للموقع"),
      { enableHighAccuracy: true }
    );
  }, []);

  // ─── الانتقال للكارت عند اختيار حرفي ─────────────
  const scrollToCard = (id: number) => {
    setTimeout(() => {
      document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const flyToArtisan = (a: NearbyArtisan) => {
    setSelectedId(a.id);
    mapRef.current?.flyTo([a.latitude, a.longitude], 16, { animate: true, duration: 0.8 });
    markersRef.current.get(a.id)?.openPopup();
  };

  // ─── UI ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <h1 className="font-semibold text-gray-800 text-base">ابحث عن حرفي قريب</h1>
          <p className="text-xs text-gray-400">{artisans.length} حرفي ضمن {params.radius} كم</p>
        </div>
        <button
          onClick={locateUser}
          className="mr-auto flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
          </svg>
          {locationGranted ? "تحديث موقعي" : "موقعي الحالي"}
        </button>
      </div>

      {/* ── شريط البحث ── */}
      <div className="bg-white px-4 py-2.5 border-b flex gap-2">
        <input
          type="text"
          placeholder="ابحث باسم الحرفي أو الحرفة..."
          value={params.q}
          onChange={e => setParams(p => ({ ...p, q: e.target.value }))}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 text-right"
        />
        <select
          value={params.sort}
          onChange={e => setParams(p => ({ ...p, sort: e.target.value as any }))}
          className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none"
        >
          <option value="distance">الأقرب</option>
          <option value="rating">الأعلى تقييماً</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {/* ── فلاتر الحرفة ── */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {CRAFT_LIST.map(c => (
          <button
            key={c}
            onClick={() => setParams(p => ({ ...p, craft: c }))}
            className={`flex-shrink-0 text-sm px-3 py-1 rounded-full border transition ${
              params.craft === c
                ? "bg-blue-600 text-white border-transparent"
                : "text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {c}
          </button>
        ))}
        <div className="mr-auto flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setParams(p => ({ ...p, status: p.status === "available" ? "all" : "available" }))}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              params.status === "available"
                ? "bg-green-600 text-white border-transparent"
                : "text-gray-500 border-gray-200"
            }`}
          >
            متاح الآن
          </button>
        </div>
      </div>

      {/* ── فلتر النطاق ── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-500 whitespace-nowrap">النطاق:</span>
        <input
          type="range" min={1} max={30} step={1}
          value={params.radius}
          onChange={e => setParams(p => ({ ...p, radius: parseInt(e.target.value) }))}
          className="flex-1"
        />
        <span className="text-xs font-medium text-blue-600 whitespace-nowrap w-14 text-center">
          {params.radius} كم
        </span>
      </div>

      {/* ── المحتوى الرئيسي: خريطة + قائمة ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* الخريطة */}
        <div className="flex-1 relative">
          <div ref={mapDivRef} className="w-full h-full z-0" />
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="text-sm text-gray-500 animate-pulse">جاري البحث...</div>
            </div>
          )}
        </div>

        {/* القائمة الجانبية */}
        <div className="w-80 bg-white border-r flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {isError && (
              <div className="text-center text-sm text-red-500 py-8">
                خطأ في جلب البيانات، تحقق من الاتصال
              </div>
            )}
            {!isLoading && artisans.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                لا يوجد حرفي ضمن هذه المعايير
              </div>
            )}
            {artisans.map(a => (
              <ArtisanCard
                key={a.id}
                artisan={a}
                selected={a.id === selectedId}
                onClick={() => flyToArtisan(a)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── كارت الحرفي ─────────────────────────────────────
function ArtisanCard({
  artisan: a,
  selected,
  onClick,
}: {
  artisan: NearbyArtisan;
  selected: boolean;
  onClick: () => void;
}) {
  const color = CRAFT_COLORS[a.craft] ?? CRAFT_COLORS.default;

  return (
    <div
      id={`card-${a.id}`}
      onClick={onClick}
      className={`rounded-xl border p-3 cursor-pointer transition-all ${
        selected ? "border-blue-400 bg-blue-50/50" : "border-gray-100 hover:border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        {/* أفاتار */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0"
          style={{ background: color + "22", color }}
        >
          {a.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-gray-800 truncate">{a.name}</span>
            {a.isVerified && (
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          <div className="text-xs text-gray-400">{a.craft}</div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            a.status === "available"
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {a.status === "available" ? "متاح" : "مشغول"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="text-amber-400">{"★".repeat(Math.round(a.rating))}{"☆".repeat(5 - Math.round(a.rating))}</span>
        <span>{a.rating} ({a.reviewCount})</span>
        <span className="mr-auto bg-gray-50 px-2 py-0.5 rounded-full text-gray-400">
          📍 {a.distanceKm} كم
        </span>
      </div>

      {/* زر التواصل */}
      <button
        onClick={e => { e.stopPropagation(); /* navigate to chat */ }}
        className="mt-2.5 w-full text-xs border border-gray-200 rounded-lg py-1.5 text-gray-600 hover:bg-gray-50 transition"
      >
        تواصل معه
      </button>
    </div>
  );
}