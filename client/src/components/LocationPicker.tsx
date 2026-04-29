// client/src/components/LocationPicker.tsx
// يسمح للحرفي بتحديد موقعه تلقائياً أو يدوياً

import { useState } from "react";
import { MapPin, Crosshair, Save, Check, AlertCircle, Loader2 } from "lucide-react";

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  onSaved?: (lat: number, lng: number, name: string) => void;
}

export default function LocationPicker({
  initialLat,
  initialLng,
  initialName = "",
  onSaved,
}: LocationPickerProps) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [locationName, setLocationName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGpsLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`
          );
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.state || "";
          if (name) setLocationName(name);
        } catch { /* تجاهل */ }
        setGpsLoading(false);
      },
      (err) => {
        setError("تعذّر تحديد الموقع: " + err.message);
        setGpsLoading(false);
      }
    );
  };

  const saveLocation = async () => {
    if (!lat || !lng) { setError("حدّد موقعك أولاً"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/artisan/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latitude: lat, longitude: lng, locationName }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.(lat, lng, locationName);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("فشل الحفظ");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const hasLocation = lat != null && lng != null;

  return (
    <div dir="rtl" className="space-y-3">
      {/* GPS Button */}
      <button
        data-testid="button-detect-location"
        onClick={detectLocation}
        disabled={gpsLoading}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 text-blue-300 text-sm font-bold hover:bg-blue-500/10 hover:border-blue-500/50 transition-all disabled:opacity-50"
      >
        {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        {gpsLoading ? "جاري التحديد..." : "تحديد موقعي تلقائياً"}
      </button>

      {/* Location Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">اسم المكان</label>
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            data-testid="input-location-name"
            type="text"
            placeholder="المدينة / الحي"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pr-10 pl-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Coordinates Display */}
      {hasLocation && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-400" data-testid="text-coordinates">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>خط العرض: <span className="text-white font-mono">{lat!.toFixed(4)}</span></span>
          <span className="text-zinc-600">•</span>
          <span>خط الطول: <span className="text-white font-mono">{lng!.toFixed(4)}</span></span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs" data-testid="text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Save */}
      <button
        data-testid="button-save-location"
        onClick={saveLocation}
        disabled={loading || !hasLocation}
        className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl font-black text-sm transition-all disabled:opacity-40 ${
          saved
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-primary/90"
        }`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {loading ? "جاري الحفظ..." : saved ? "تم الحفظ" : "حفظ الموقع"}
      </button>
    </div>
  );
}
