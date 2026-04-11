import webpush from "web-push";
import fs from "fs";
import path from "path";

const VAPID_PUBLIC_KEY  = "BJLmuiQop_NNT8b28tn9M5CmcZyekRNNpdjI4MezLaX7FBAHecOvti-yZ-xLkskmLOuC1gPuL7LopTKOUvSWTr4";
const VAPID_PRIVATE_KEY = "W9itWRvLZTixHEfFyEL1lju2SKdtA5-K9mjiq7kU8kM";

webpush.setVapidDetails(
  "mailto:alaagh23dz@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// ── حفظ دائم في ملف ──────────────────────────────────────────
const SUBS_FILE = path.join(process.cwd(), "data", "push-subscriptions.json");

function loadSubscriptions(): Map<string, any> {
  try {
    if (!fs.existsSync(path.dirname(SUBS_FILE))) {
      fs.mkdirSync(path.dirname(SUBS_FILE), { recursive: true });
    }
    if (!fs.existsSync(SUBS_FILE)) return new Map();
    const raw = fs.readFileSync(SUBS_FILE, "utf-8");
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveSubscriptions(map: Map<string, any>) {
  try {
    const obj = Object.fromEntries(map);
    fs.writeFileSync(SUBS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("[Push] Failed to save subscriptions:", err);
  }
}

// تحميل عند بدء السيرفر
const subscriptions = loadSubscriptions();
console.log(`[Push] Loaded ${subscriptions.size} subscription(s) from disk`);

// ── API ───────────────────────────────────────────────────────
export function saveSubscription(userId: string, subscription: any) {
  subscriptions.set(userId, subscription);
  saveSubscriptions(subscriptions);
  console.log(`[Push] Saved subscription for user: ${userId}`);
}

export function removeSubscription(userId: string) {
  subscriptions.delete(userId);
  saveSubscriptions(subscriptions);
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body:  string;
    url?:  string;
    type?: "message" | "call" | "general";
  }
): Promise<boolean> {
  const subscription = subscriptions.get(userId);

  if (!subscription) {
    console.warn(`[Push] No subscription for user: ${userId}`);
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body:  payload.body,
        icon:  "/icon-192.png",
        badge: "/icon-192.png",
        url:   payload.url  || "/",
        type:  payload.type || "general",
      })
    );
    console.log(`[Push] Sent to user: ${userId} — "${payload.title}"`);
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // الـ subscription انتهت صلاحيتها
      subscriptions.delete(userId);
      saveSubscriptions(subscriptions);
      console.warn(`[Push] Removed expired subscription for user: ${userId}`);
    } else {
      console.error(`[Push] Send error for user ${userId}:`, err.message);
    }
    return false;
  }
}

export function getSubscriptionCount() {
  return subscriptions.size;
}

export { VAPID_PUBLIC_KEY };