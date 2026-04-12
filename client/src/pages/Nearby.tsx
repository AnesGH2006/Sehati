// client/src/pages/Nearby.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, Star, Search, SlidersHorizontal, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Link } from "wouter";

interface NearbyArtisan {
  id: number;
  userId: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  status: "available" | "busy" | "offline";
  isVerified: boolean;
  latitude: number;
  longitude: number;
  city: string | null;
  wilaya: string | null;
  distanceKm: number;
  imageUrl: string | null;
  priceStart: number;
}

const CRAFTS = ["الكل", "نجارة", "سباكة", "كهرباء", "دهانات", "بناء", "ميكانيك", "تلحيم", "خياطة"];

function makePinIcon(selected = false, available = true) {
  const color = selected ? "#2DD4BF" : available ? "#2DD4BF" : "#6B7280";
  const size = selected ? 44 : 36;
  return L.divIcon({
    html: `
      <div style="width:${size}px;height:${size}px;background:${selected ? color : "white"};border:2.5px solid ${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px ${color}55;">
        <div style="transform:rotate(45deg);width:8px;height:8px;background:${selected ? "white" : color};border-radius:50%"></div>
      </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const USER_ICON = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#2DD4BF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px #2DD4BF33"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function NearbyPage() {
  const mapRef     = useRef<L.Map | null>(null);
  const mapDivRef  = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const userMarker = useRef<L.Marker | null>(null);
  const circleRef  = useRef<L.Circle | null>(null);
  const tileRef    = useRef<L.TileLayer | null>(null); // ← مرة واحدة فقط هنا

  const { theme, setTheme } = useTheme(); // ← داخل الـ component

  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [userLat, setUserLat]         = useState(36.7372);
  const [userLng, setUserLng]         = useState(3.0865);
  const [radius, setRadius]           = useState(10);
  const [craft, setCraft]             = useState("الكل");
  const [status, setStatus]           = useState("all");
  const [q, setQ]                     = useState("");
  const [sort, setSort]               = useState<"distance" | "rating">("distance");
  const [locating, setLocating]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Fetch ────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<{ data: NearbyArtisan[] }>({
    queryKey: ["nearby", userLat, userLng, radius, craft, status, q, sort],
    queryFn: async () => {
      const p = new URLSearchParams({ lat: String(userLat), lng: String(userLng), radius: String(radius), sort });
      if (craft !== "الكل") p.set("craft", craft);
      if (status !== "all") p.set("status", status);
      if (q.trim()) p.set("q", q.trim());
      const res = await fetch(`/api/artisans/nearby?${p}`);
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const artisans = data?.data ?? [];

  // ─── Init Map (مرة واحدة) ─────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, { center: [userLat, userLng], zoom: 13, zoomControl: false });
    L.control.zoom({ position: "topleft" }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ─── Tile layer يتغير مع الـ theme ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(
      theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }
    ).addTo(map);
  }, [theme, mapRef.current]); // يشتغل لما تتهيأ الخريطة أو يتغير الـ theme

  // ─── User marker + circle ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (userMarker.current) userMarker.current.setLatLng([userLat, userLng]);
    else userMarker.current = L.marker([userLat, userLng], { icon: USER_ICON, zIndexOffset: 1000 }).addTo(map);
    if (circleRef.current) { circleRef.current.setLatLng([userLat, userLng]); circleRef.current.setRadius(radius * 1000); }
    else circleRef.current = L.circle([userLat, userLng], {
      radius: radius * 1000, color: "#2DD4BF", weight: 1, dashArray: "6,5", fillColor: "#2DD4BF", fillOpacity: 0.05,
    }).addTo(map);
    circleRef.current.setLatLng([userLat, userLng]);
    circleRef.current.setRadius(radius * 1000);
  }, [userLat, userLng, radius]);

  // ─── Pins ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();
    artisans.forEach(a => {
      const sel = a.id === selectedId;
      const avail = a.status === "available";
      const marker = L.marker([a.latitude, a.longitude], {
        icon: makePinIcon(sel, avail), zIndexOffset: sel ? 500 : 0,
      }).addTo(map)
        .bindPopup(`
          <div style="direction:rtl;font-family:sans-serif;min-width:170px;padding:4px 0">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${a.name}</div>
            <div style="color:#2DD4BF;font-size:12px;margin-bottom:6px">${a.category}</div>
            <div style="display:flex;gap:8px;font-size:12px;color:#9CA3AF">
              <span>⭐ ${a.rating.toFixed(1)}</span>
              <span>📍 ${a.distanceKm} كم</span>
              <span style="color:${avail ? "#2DD4BF" : "#F59E0B"}">${avail ? "● متاح" : "● مشغول"}</span>
            </div>
          </div>`, { className: "herfati-popup" })
        .on("click", () => { setSelectedId(a.id); scrollToCard(a.id); });
      markersRef.current.set(a.id, marker);
    });
  }, [artisans, selectedId]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
      mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1 });
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true });
  }, []);

  const flyTo = (a: NearbyArtisan) => {
    setSelectedId(a.id);
    mapRef.current?.flyTo([a.latitude, a.longitude], 16, { duration: 0.8 });
    markersRef.current.get(a.id)?.openPopup();
  };

  const scrollToCard = (id: number) => {
    setTimeout(() => document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  };

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background" dir="rtl">

      {/* ── Top Bar ── */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <h1 className="font-bold text-foreground text-base leading-tight">ابحث عن حرفي قريب</h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "جاري البحث..." : `${artisans.length} حرفي ضمن ${radius} كم`}
              </p>
            </div>
          </div>

          {/* زر الموقع */}
          <Button variant="outline" size="sm" onClick={locateUser} disabled={locating}
            className="gap-1.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 text-xs">
            <Navigation className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} />
            {locating ? "جاري..." : "موقعي"}
          </Button>

          {/* زر Light/Dark */}
          <Button variant="outline" size="sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="gap-1.5 rounded-full border-primary/40 text-primary hover:bg-primary/10 text-xs">
            {isDark ? <><Sun className="h-3.5 w-3.5" /> فاتح</> : <><Moon className="h-3.5 w-3.5" /> داكن</>}
          </Button>

          {/* زر الفلترة */}
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(f => !f)}
            className="gap-1.5 rounded-full text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فلترة
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو التخصص..."
            className="pr-9 rounded-full bg-muted/40 border-border/40 text-sm h-9" />
          {q && <button onClick={() => setQ("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
        </div>

        {/* Craft chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CRAFTS.map(c => (
            <button key={c} onClick={() => setCraft(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                craft === c ? "bg-primary text-primary-foreground border-primary font-medium" : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}>{c}</button>
          ))}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">الحالة:</span>
              {[["all","الكل"],["available","متاح"],["busy","مشغول"]].map(([v,l]) => (
                <button key={v} onClick={() => setStatus(v)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${status === v ? "bg-primary/20 text-primary border-primary/40" : "border-border/30 text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-muted-foreground">ترتيب:</span>
              {[["distance","الأقرب"],["rating","الأعلى تقييماً"]].map(([v,l]) => (
                <button key={v} onClick={() => setSort(v as any)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${sort === v ? "bg-primary/20 text-primary border-primary/40" : "border-border/30 text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground whitespace-nowrap">النطاق:</span>
              <input type="range" min={1} max={30} value={radius} onChange={e => setRadius(+e.target.value)} className="flex-1 accent-primary" />
              <span className="text-xs text-primary font-medium w-12 text-center">{radius} كم</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main: Map + List ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* List */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-y-auto border-l border-border/30 bg-background/50">
          {isError && (
            <div className="p-6 text-center">
              <p className="text-destructive text-sm mb-2">خطأ في جلب البيانات</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">إعادة المحاولة</Button>
            </div>
          )}
          {!isLoading && !isError && artisans.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <MapPin className="h-10 w-4 mx-auto mb-3 opacity-20" />
              لا يوجد حرفي ضمن هذه المعايير
            </div>
          )}
          <div className="p-3 flex flex-col gap-2">
            {artisans.map(a => (
              <ArtisanCard key={a.id} artisan={a} selected={a.id === selectedId} onClick={() => flyTo(a)} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapDivRef} className="w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-sm text-primary">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                جاري البحث...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup style — يتكيف مع الـ theme */}
      <style>{`
        .herfati-popup .leaflet-popup-content-wrapper {
          background: ${isDark ? "hsl(222 47% 11%)" : "white"};
          color: ${isDark ? "#f1f5f9" : "#1e293b"};
          border: 1px solid ${isDark ? "#2DD4BF33" : "#e2e8f0"};
          border-radius: 12px;
          box-shadow: 0 4px 24px ${isDark ? "#0008" : "#0002"};
        }
        .herfati-popup .leaflet-popup-tip {
          background: ${isDark ? "hsl(222 47% 11%)" : "white"};
        }
        .leaflet-control-zoom a {
          background: ${isDark ? "hsl(222 47% 11%)" : "white"} !important;
          color: ${isDark ? "#f1f5f9" : "#1e293b"} !important;
          border-color: ${isDark ? "#2DD4BF33" : "#e2e8f0"} !important;
        }
        .leaflet-control-zoom a:hover { background: #2DD4BF22 !important; }
      `}</style>
    </div>
  );
}

// ─── Artisan Card ─────────────────────────────────────
function ArtisanCard({ artisan: a, selected, onClick }: {
  artisan: NearbyArtisan; selected: boolean; onClick: () => void;
}) {
  const avail = a.status === "available";
  return (
    <div id={`card-${a.id}`} onClick={onClick}
      className={`rounded-xl border p-3 cursor-pointer transition-all ${
        selected ? "border-primary/60 bg-primary/5" : "border-border/30 hover:border-primary/30 bg-card/50 hover:bg-card"
      }`}>
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
          {a.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{a.name}</span>
            {a.isVerified && (
              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          <p className="text-xs text-primary/80">{a.category}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${avail ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-400"}`}>
          {avail ? "متاح" : "مشغول"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {a.rating.toFixed(1)}
          <span className="text-muted-foreground/60">({a.reviewCount})</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-primary" />
          {a.distanceKm} كم
        </span>
        {a.priceStart && (
          <span className="mr-auto text-primary/80 font-medium">{a.priceStart.toLocaleString()} د.ج</span>
        )}
      </div>
      <Link href={`/profile/${a.id}`}>
        <button onClick={e => e.stopPropagation()}
          className="w-full text-xs py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
          عرض الملف الشخصي ←
        </button>
      </Link>
    </div>
  );
}