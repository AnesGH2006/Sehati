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
import { ThemeProvider } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

function Router() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={i18n.language}
        initial={{ opacity: 0, x: isAr ? -100 : 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isAr ? 100 : -100 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3 
        }}
        className="min-h-screen flex flex-col overflow-x-hidden"
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/artisans" component={Artisans} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/chat" component={Chat} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/auth" component={Auth} />
          <Route path="/artisan/dashboard" component={ArtisanDashboard} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
