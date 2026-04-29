import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface StatusToggleProps {
  initialStatus: boolean;
  onStatusChange?: (isOnline: boolean) => void;
  variant?: "compact" | "full";
}

export default function StatusToggle({ initialStatus, onStatusChange, variant = "compact" }: StatusToggleProps) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newStatus = !isOnline;
    setLoading(true);
    try {
      const res = await fetch("/api/artisan/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isOnline: newStatus }),
      });
      if (res.ok) {
        setIsOnline(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch (err) {
      console.error("فشل تحديث الحالة:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "full") {
    return (
      <div dir="rtl" className="w-full">
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isOnline ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-400"}`}>
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              {isOnline && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-zinc-950 animate-pulse" />}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-white">
                {isOnline ? "أنت متصل الآن" : "غير متاح حالياً"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isOnline ? "الزبائن يمكنهم رؤيتك والتواصل معك" : "لن تظهر للزبائن في نتائج البحث"}
              </p>
            </div>
          </div>

          <button
            data-testid="button-toggle-status"
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 ${
              isOnline ? "bg-green-500" : "bg-zinc-700"
            }`}
            aria-pressed={isOnline}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
              className={`inline-block h-5 w-5 mt-1 rounded-full bg-white shadow-md flex items-center justify-center ${
                isOnline ? "ml-1" : "mr-8"
              }`}
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin text-zinc-700" />}
            </motion.span>
          </button>
        </div>
      </div>
    );
  }

  // compact variant - for header
  return (
    <button
      data-testid="button-toggle-status-compact"
      onClick={handleToggle}
      disabled={loading}
      dir="rtl"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all disabled:opacity-50 ${
        isOnline
          ? "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25"
          : "bg-zinc-700/40 text-zinc-300 border-zinc-600/40 hover:bg-zinc-700/60"
      }`}
    >
      <span className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-zinc-400"}`} />
        {isOnline && <span className="absolute w-2 h-2 rounded-full bg-green-400 animate-ping" />}
      </span>
      {loading ? "..." : isOnline ? "متاح للعمل" : "غير متاح"}
    </button>
  );
}
