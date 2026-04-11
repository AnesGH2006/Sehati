// client/src/hooks/usePushNotifications.ts
import { useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = "BJLmuiQop_NNT8b28tn9M5CmcZyekRNNpdjI4MezLaX7FBAHecOvti-yZ-xLkskmLOuC1gPuL7LopTKOUvSWTr4";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userId: string | null | undefined) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!userId || registeredRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Not supported in this browser");
      return;
    }

    async function register() {
      try {
        // ① تسجيل Service Worker
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        console.log("[Push] Service Worker registered");

        // ② طلب إذن الإشعارات
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[Push] Permission denied");
          return;
        }

        // ③ التحقق إذا في subscription موجودة
        let subscription = await reg.pushManager.getSubscription();

        // ④ إذا ما فيها أو انتهت صلاحيتها، أنشئ جديدة
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          console.log("[Push] New subscription created");
        }

        // ⑤ أرسل الـ subscription للسيرفر
        const res = await fetch("/api/push/subscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userId, subscription }),
        });

        if (res.ok) {
          registeredRef.current = true;
          console.log(`[Push] Subscription saved for user: ${userId}`);
        }
      } catch (err) {
        console.error("[Push] Registration error:", err);
      }
    }

    register();

    // إلغاء التسجيل عند تسجيل الخروج
    return () => {
      if (registeredRef.current && userId) {
        fetch("/api/push/unsubscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userId }),
        }).catch(() => {});
      }
    };
  }, [userId]);
}