import webpush from "web-push";

const VAPID_PUBLIC_KEY = "BJLmuiQop_NNT8b28tn9M5CmcZyekRNNpdjI4MezLaX7FBAHecOvti-yZ-xLkskmLOuC1gPuL7LopTKOUvSWTr4";
const VAPID_PRIVATE_KEY = "W9itWRvLZTixHEfFyEL1lju2SKdtA5-K9mjiq7kU8kM";

webpush.setVapidDetails(
  "mailto:alaagh23dz@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In-memory subscription store (persisted via storage)
const subscriptions = new Map<string, any>(); // userId -> pushSubscription

export function saveSubscription(userId: string, subscription: any) {
  subscriptions.set(userId, subscription);
}

export function removeSubscription(userId: string) {
  subscriptions.delete(userId);
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    type?: "message" | "call" | "general";
  }
) {
  const subscription = subscriptions.get(userId);
  if (!subscription) return false;

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/icon-192.png",
      url: payload.url || "/",
      type: payload.type || "general",
    }));
    return true;
  } catch (err: any) {
    if (err.statusCode === 410) {
      // Subscription expired
      subscriptions.delete(userId);
    }
    console.error("Push send error:", err.message);
    return false;
  }
}

export function getSubscriptionCount() {
  return subscriptions.size;
}