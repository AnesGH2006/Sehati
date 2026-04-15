// client/src/components/LocationPicker.tsx
// يسمح للحرفي بتحديد موقعه تلقائياً أو يدوياً

import { useState } from "react";

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

  // تحديد الموقع تلقائياً عبر GPS
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
        // محاولة عكس الإحداثيات لاسم المكان
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`
          );
          const data = await res.json();
          const name = data.address?.city || data.address?.town || data.address?.state || "";
          setLocationName(name);
        } catch { /* تجاهل */ }
        setGpsLoading(false);
      },
      (err) => {
        setError("تعذّر تحديد الموقع: " + err.message);
        setGpsLoading(false);
      }
    );
  };

  // حفظ الموقع في السيرفر
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

  return (
    <div style={{
      direction: "rtl", background: "#fff",
      border: "1px solid #e2e8f0", borderRadius: 14,
      padding: 20, maxWidth: 400,
    }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1e293b", fontWeight: 700 }}>
        📍 موقعي على الخريطة
      </h3>

      {/* زر GPS */}
      <button
        onClick={detectLocation}
        disabled={gpsLoading}
        style={{
          width: "100%", padding: "10px 0",
          background: "#eff6ff", color: "#2563eb",
          border: "1.5px dashed #93c5fd", borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          marginBottom: 12,
        }}
      >
        {gpsLoading ? "جاري التحديد..." : "🎯 تحديد موقعي الحالي تلقائياً"}
      </button>

      {/* اسم المكان */}
      <input
        type="text"
        placeholder="اسم المدينة / الحي (اختياري)"
        value={locationName}
        onChange={e => setLocationName(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px",
          border: "1px solid #e2e8f0", borderRadius: 8,
          fontSize: 14, marginBottom: 8, boxSizing: "border-box",
          textAlign: "right",
        }}
      />

      {/* عرض الإحداثيات */}
      {lat && lng && (
        <div style={{
          background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
          fontSize: 12, color: "#64748b", marginBottom: 10,
          display: "flex", gap: 10,
        }}>
          <span>خط العرض: {lat.toFixed(5)}</span>
          <span>خط الطول: {lng.toFixed(5)}</span>
        </div>
      )}

      {error && (
        <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{error}</div>
      )}

      {/* زر الحفظ */}
      <button
        onClick={saveLocation}
        disabled={loading || !lat}
        style={{
          width: "100%", padding: "10px 0",
          background: saved ? "#22c55e" : "#0f172a",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        {loading ? "جاري الحفظ..." : saved ? "✓ تم الحفظ!" : "حفظ الموقع"}
      </button>
    </div>
  );
}