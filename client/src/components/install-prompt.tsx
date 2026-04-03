import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { useLang } from "@/contexts/language.context"
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    // Already installed (standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    if (ios && !sessionStorage.getItem("ios-prompt-dismissed")) {
      setTimeout(() => setShow(true), 3000);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!sessionStorage.getItem("install-dismissed")) {
        setTimeout(() => setShow(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("install-dismissed", "1");
    sessionStorage.setItem("ios-prompt-dismissed", "1");
  };

  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-3 right-3 z-[60] md:left-auto md:right-6 md:w-80"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="p-4 rounded-2xl bg-card border border-primary/30 shadow-2xl shadow-primary/10 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-0.5">
                  {lang === "ar" ? "ثبّت التطبيق" : "Install the App"}
                </p>
                {isIos ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "ar"
                      ? 'اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"'
                      : 'Tap Share then "Add to Home Screen"'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === "ar"
                      ? "أضف الموقع لشاشتك الرئيسية لتجربة تطبيق كاملة بدون متصفح"
                      : "Add to your home screen for a full app experience"}
                  </p>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-white transition p-1 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isIos && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
                >
                  <Download className="w-4 h-4" />
                  {lang === "ar" ? "تثبيت" : "Install"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-muted-foreground text-sm"
                >
                  {lang === "ar" ? "لاحقًا" : "Later"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}