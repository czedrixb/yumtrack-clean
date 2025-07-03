import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import History from "@/pages/history";
import Stats from "@/pages/stats";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/bottom-navigation";
import PWAInstallBanner from "@/components/pwa-install-banner";
import { useRef } from "react";

function Router() {
  const homeRef = useRef<{ goToHome: () => void }>(null);
  const [location, setLocation] = useLocation();

  const handleHomeClick = () => {
    // If on home page, reset to upload view instead of reloading
    if (location === "/" && homeRef.current) {
      homeRef.current.goToHome();
    } else {
      // If on other pages, navigate to home normally
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PWAInstallBanner />
      <Switch>
        <Route path="/">
          <Home ref={homeRef} />
        </Route>
        <Route path="/history" component={History} />
        <Route path="/stats" component={Stats} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavigation onHomeClick={handleHomeClick} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
