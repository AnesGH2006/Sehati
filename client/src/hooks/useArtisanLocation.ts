// ======================================================
// client/src/hooks/useArtisanLocation.ts
// hook لتحديث موقع الحرفي تلقائياً في قاعدة البيانات
// ======================================================

import { useEffect, useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

// ─── Hook: يطلب الموقع ويرفعه للسيرفر ────────────────
export function useArtisanLocation(artisanId: number | null) {
  const [location, setLocation] = useState<LocationState>({
    lat: null, lng: null, error: null, loading: false,
  });

  // Mutation لرفع الموقع
  const { mutate: uploadLocation } = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      apiRequest(`/api/artisans/${artisanId}/location`, {
        method: "PUT",
        body: JSON.stringify({ lat, lng }),
      }),
    onError: (err) => console.error("فشل رفع الموقع:", err),
  });

  // طلب الموقع من المتصفح
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(s => ({ ...s, error: "المتصفح لا يدعم تحديد الموقع" }));
      return;
    }
    setLocation(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng, error: null, loading: false });
        // إذا كان الحرفي مسجل دخوله → يرفع موقعه
        if (artisanId) uploadLocation({ lat, lng });
      },
      err => {
        const msgs: Record<number, string> = {
          1: "رفض المستخدم الوصول للموقع",
          2: "تعذر تحديد الموقع",
          3: "انتهت مهلة تحديد الموقع",
        };
        setLocation(s => ({ ...s, loading: false, error: msgs[err.code] ?? "خطأ غير معروف" }));
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [artisanId, uploadLocation]);

  // رفع الموقع كل 5 دقائق إذا كان الحرفي متاحاً
  useEffect(() => {
    if (!artisanId) return;
    requestLocation();
    const interval = setInterval(requestLocation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [artisanId]);

  return { location, requestLocation };
}

// ─── Hook: للزبون فقط (بدون رفع للسيرفر) ────────────
export function useUserLocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("لم يتم السماح بالوصول للموقع");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { request(); }, []);

  return { coords, loading, error, request };
}