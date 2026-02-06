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

function Router() {
  return (
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
