import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Artisans from "@/pages/artisans";
import Profile from "@/pages/profile";
import Chat from "@/pages/chat";
import Subscription from "@/pages/subscription";
import Auth from "@/pages/auth";
import ArtisanDashboard from "@/pages/artisan-dashboard";
import About from "@/pages/about";
import Admin from "@/pages/admin";
import { ThemeProvider } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/lib/auth";
import SplashScreen from "@/components/splashscreen";
import { InstallPrompt } from "@/components/install-prompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/lib/auth";
import NearbyPage from "@/pages/Nearby";
<Route path="/Nearby" component={NearbyPage} />
// ── تسجيل الإشعارات بعد تحميل الـ Auth ──────────────────────────────────────
function PushRegistrar() {
  const { user, artisan, isArtisan } = useAuth();

  // الحرفي يسجّل بـ id الحرفي (رقم → string)
  // الزبون يسجّل بـ user.id
  const pushId = isArtisan && artisan?.id
    ? String(artisan.id)
    : user?.id ?? null;

  usePushNotifications(pushId);

  return null; // لا يعرض شيئاً
}

// ── Page Transition ───────────────────────────────────────────────────────────
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={i18n.language}
        initial={{ opacity: 0, x: isAr ? -100 : 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isAr ? 100 : -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
        className="min-h-screen flex flex-col overflow-x-hidden"
      >
        <Switch>
          <Route path="/">
            <PageTransition><Home /></PageTransition>
          </Route>
          <Route path="/artisans">
            <PageTransition><Artisans /></PageTransition>
          </Route>
          <Route path="/profile/:id">
            <PageTransition><Profile /></PageTransition>
          </Route>
          <Route path="/chat/:id">
            <PageTransition><Chat /></PageTransition>
          </Route>
          <Route path="/chat">
            <PageTransition><Chat /></PageTransition>
          </Route>
          <Route path="/subscription">
            <PageTransition><Subscription /></PageTransition>
          </Route>
          <Route path="/auth">
            <PageTransition><Auth /></PageTransition>
          </Route>
          <Route path="/artisan/dashboard">
            <PageTransition><ArtisanDashboard /></PageTransition>
          </Route>
          <Route path="/about">
            <PageTransition><About /></PageTransition>
          </Route>
          <Route path="/admin">
            <Admin />
          </Route>
          <Route path="/nearby">
            <PageTransition><NearbyPage /></PageTransition>
          </Route>
          <Route>
            <PageTransition><NotFound /></PageTransition>
          </Route>
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <PushRegistrar />   {/* ← هنا — داخل AuthProvider */}
            <SplashScreen />
            <InstallPrompt />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;