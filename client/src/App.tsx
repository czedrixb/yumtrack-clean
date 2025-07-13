import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import History from "@/pages/history";
import Stats from "@/pages/stats";
import Settings from "@/pages/settings";
import Download from "@/pages/download";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/bottom-navigation";
import PWAInstallBanner from "@/components/pwa-install-banner";
import WebViewHelper from "@/components/webview-helper";
import { useRef, useEffect } from "react";
import { initGA, trackEvent } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { usePWA } from "./hooks/use-pwa";

function Router() {
  const homeRef = useRef<{ goToHome: () => void }>(null);
  const [location, setLocation] = useLocation();
  const { isInWebView } = usePWA();
  
  // Track page views when routes change
  useAnalytics();

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
    <div className="h-full bg-background safe-area-top safe-area-left safe-area-right">
      <PWAInstallBanner />
      <WebViewHelper isInWebView={isInWebView} />
      
      {/* Mobile Status Bar Area */}
      <div className="safe-area-top bg-background" />
      
      {/* Main Content Area */}
      <div className="flex flex-col h-full pb-20 safe-area-bottom">
        <main className="flex-1 native-scroll">
          <Switch>
            <Route path="/">
              <Home ref={homeRef} />
            </Route>
            <Route path="/history" component={History} />
            <Route path="/stats" component={Stats} />
            <Route path="/settings" component={Settings} />
            <Route path="/download" component={Download} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation onHomeClick={handleHomeClick} />
      </div>
    </div>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
      
      // Track initial app load after a short delay to ensure GA is ready
      setTimeout(() => {
        trackEvent('app_load', 'engagement', 'initial_visit');
      }, 1000);
    }
  }, []);

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
