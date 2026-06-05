import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Calendar, MessageSquare, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

type Notif = {
  id: number;
  recipientId: string;
  recipientType: "doctor" | "patient";
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

function typeIcon(type: string) {
  if (type.startsWith("appointment")) return <Calendar className="h-4 w-4" />;
  if (type === "new_message")         return <MessageSquare className="h-4 w-4" />;
  if (type === "review_new")          return <Star className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function typeColor(type: string) {
  if (type === "appointment_new")       return "bg-teal-500/15 text-teal-400 border-teal-500/20";
  if (type === "appointment_confirmed") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (type === "appointment_cancelled") return "bg-red-500/15 text-red-400 border-red-500/20";
  if (type === "appointment_completed") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (type === "new_message")           return "bg-purple-500/15 text-purple-400 border-purple-500/20";
  return "bg-primary/15 text-primary border-primary/20";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "الآن";
  if (mins < 60)  return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} ي`;
}

export function NotificationBell() {
  const { doctor, customer, isLoggedIn, isDoctor } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // recipient id used for API calls
  const recipientId = isDoctor
    ? String(doctor?.id ?? "")
    : (customer?.id ?? "");

  const enabled = isLoggedIn && !!recipientId;

  const { data: notifs = [] } = useQuery<Notif[]>({
    queryKey: ["/api/notifications", recipientId],
    queryFn: () => fetch(`/api/notifications/${recipientId}`).then(r => r.json()),
    enabled,
    refetchInterval: 15000,
  });

  const unread = notifs.filter(n => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications", recipientId] }),
  });

  const markAll = useMutation({
    mutationFn: () =>
      fetch(`/api/notifications/read-all/${recipientId}`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications", recipientId] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/notifications/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications", recipientId] }),
  });

  const handleClick = (n: Notif) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.link) setLocation(n.link);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 leading-none ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-80 z-50 rounded-2xl border bg-popover shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-black text-sm">الإشعارات</span>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  قراءة الكل
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
                </div>
              ) : notifs.map(n => (
                <div
                  key={n.id}
                  className={`relative flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${!n.isRead ? "bg-primary/5" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${typeColor(n.type)}`}>
                    {typeIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground/50 hover:text-destructive transition-colors mt-auto opacity-0 group-hover:opacity-100"
                      aria-label="حذف"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Unread indicator stripe */}
                  {!n.isRead && (
                    <span className="absolute right-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">{notifs.length} إشعار</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
