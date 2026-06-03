import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function InstallPrompt() {
  const { canInstall, install, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem("pwa_dismissed"); } catch { return false; }
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (canInstall && !dismissed) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, [canInstall, dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    try { localStorage.setItem("pwa_dismissed", "1"); } catch {}
  };

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) setShow(false);
  };

  if (isInstalled || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:w-80 z-50"
        dir="rtl"
      >
        <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-teal-500/10 px-4 py-3 flex items-center justify-between border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="صحتي" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm">صحتي</p>
                <p className="text-xs text-muted-foreground">ثبّت التطبيق مجاناً</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              ثبّت التطبيق على هاتفك للوصول السريع وإشعارات المواعيد حتى بدون إنترنت.
            </p>
            <div className="flex gap-2">
              <button onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors">
                <Download className="h-4 w-4" />
                تثبيت الآن
              </button>
              <button onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}