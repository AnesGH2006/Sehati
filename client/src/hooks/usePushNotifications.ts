import { useEffect, useRef, useCallback } from "react";

const VAPID_PUBLIC_KEY = "BJLmuiQop_NNT8b28tn9M5CmcZyekRNNpdjI4MezLaX7FBAHecOvti-yZ-xLkskmLOuC1gPuL7LopTKOUvSWTr4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications(userId: string) {
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const subscribedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!userId || subscribedRef.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRef.current = reg;
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Subscribe to push
      const existing = await reg.pushManager.getSubscription();
      const subscription = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription }),
      });

      subscribedRef.current = true;
      console.log('✅ Push notifications enabled');
    } catch (err) {
      console.error('Push subscription error:', err);
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!swRef.current) return;
    try {
      const sub = await swRef.current.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      }
      subscribedRef.current = false;
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) subscribe();
    return () => {};
  }, [userId, subscribe]);

  return { subscribe, unsubscribe };
}