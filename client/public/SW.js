// Service Worker for Herfati Push Notifications
const CACHE_NAME = 'herfati-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, badge, url, type } = data;

  const options = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: url || '/', type },
    actions: type === 'message' ? [
      { action: 'open', title: 'فتح المحادثة' },
      { action: 'dismiss', title: 'تجاهل' }
    ] : [],
    requireInteraction: type === 'call',
    tag: type === 'message' ? 'new-message' : 'notification',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});