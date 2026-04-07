// client/src/hooks/usePushNotifications.ts
import { useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = "BFpzy5LKld1r6PnRWcQpA3fXGBjBelwb9yXVTiUOkIyJeBL_prUlef95PJ8MU9vpCgRFa1HXPoZz4wdzAC5G4mI";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: string) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return;
    }

    const register = async () => {
      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Push notification permission denied");
          return;
        }

        // Check existing subscription
        let subscription = await reg.pushManager.getSubscription();

        // Create new subscription if needed
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Send subscription to server
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, subscription }),
        });

        subscribedRef.current = true;
        console.log("✅ Push notifications registered for:", userId);

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "CALL_ACCEPTED") {
            window.dispatchEvent(new CustomEvent("sw:call-accepted", { detail: event.data }));
          }
        });

      } catch (err) {
        console.error("Push registration error:", err);
      }
    };

    register();
  }, [userId]);
}