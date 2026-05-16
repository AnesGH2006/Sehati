import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import { ThemeProvider } from "next-themes";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/lib/auth";
import SplashScreen from "@/components/splashscreen";
import { InstallPrompt } from "@/components/install-prompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/lib/auth";
import { useEffect, lazy, Suspense, useState } from "react";
import PageLoader from "./components/PageLoader";
import { motion } from "framer-motion";

const Doctors         = lazy(() => import("@/pages/doctors"));
const Profile         = lazy(() => import("@/pages/profile"));
const Chat            = lazy(() => import("@/pages/chat"));
const Subscription    = lazy(() => import("@/pages/subscription"));
const DoctorDashboard = lazy(() => import("@/pages/doctor-dashboard"));
const About           = lazy(() => import("@/pages/about"));
const Admin           = lazy(() => import("@/pages/admin"));
const NearbyPage      = lazy(() => import("@/pages/Nearby"));
const EmergencyPage   = lazy(() => import("@/pages/emergency"));
const appointments  = lazy(() => import("@/pages/appointments"));


// ── Google OAuth ──────────────────────────────────────────────────────────────
function GoogleAuthHandler() {
  const { loginPatient, loginDoctor } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_auth") !== "1") return;

    const id       = params.get("id")       || "";
    const name     = params.get("name")     || "";
    const phone    = params.get("phone")    || "";
    const role     = params.get("role")     || "patient";
    const doctorId = params.get("doctorId") || "";
    const specialty = params.get("specialty") || "";
    const wilaya   = params.get("wilaya")   || "";
    const daira    = params.get("daira")    || "";
    const imageUrl = params.get("imageUrl") || "";

    if (!id || !name) return;

    if (role === "doctor") {
      loginDoctor({
        id: Number(doctorId || id),
        name,
        email: params.get("email") || "",
        phone,
        specialty,
        wilaya,
        daira,
        subscriptionType: params.get("subscriptionType") || "free",
        imageUrl,
      });
    } else {
      loginPatient({ id, name, phone });
    }
    window.history.replaceState({}, document.title, "/");

    if (role === "doctor" && doctorId) {
      setLocation("/doctor/dashboard");
    } else {
      setLocation("/");
    }
  }, []);

  return null;
}

// ── Push Notifications ────────────────────────────────────────────────────────
function PushRegistrar() {
  const { patient, doctor, isDoctor } = useAuth();
  const pushId = isDoctor && doctor?.id ? String(doctor.id) : patient?.id ?? null;
  usePushNotifications(pushId);
  return null;
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location === displayLocation) return;
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayLocation(location);
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);

  if (isTransitioning) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageLoader />
    </motion.div>
  );

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch location={displayLocation}>
        <Route path="/"                 component={Home}            />
        <Route path="/doctors"          component={Doctors}         />
        <Route path="/profile/:id"      component={Profile}         />
        <Route path="/chat/:id"         component={Chat}            />
        <Route path="/chat"             component={Chat}            />
        <Route path="/subscription"     component={Subscription}    />
        <Route path="/auth"             component={Auth}            />
        <Route path="/doctor/dashboard" component={DoctorDashboard} />
        <Route path="/about"            component={About}           />
        <Route path="/admin"            component={Admin}           />
        <Route path="/nearby"           component={NearbyPage}      />
        <Route path="/emergency"        component={EmergencyPage}   />
        <Route path="/appointments"     component={appointments} />
        <Route path="/appointments/:id" component={appointments} />
        <Route                          component={NotFound}        />
      </Switch>
    </Suspense>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <GoogleAuthHandler />
            <PushRegistrar />
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