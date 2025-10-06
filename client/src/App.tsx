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
import FloatingFeedbackButton from "@/components/floating-feedback-button";
import { useRef, useEffect } from "react";
import { initGA, trackEvent } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { usePWA } from "./hooks/use-pwa";
import LoginPage from "@/pages/login";
import { useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import { useAuthSync } from '@/hooks/useAuthSync';

function Router() {
  const homeRef = useRef<{ goToHome: () => void }>(null);
  const [location, setLocation] = useLocation();
  const { isInWebView } = usePWA();
  const { user } = useAuth();
  
  useAnalytics();

  const handleHomeClick = () => {
    if (location === "/" && homeRef.current) {
      homeRef.current.goToHome();
    } else {
      setLocation("/");
    }
  };

    useEffect(() => {
    if (user && location === '/login') {
      setLocation('/');
    }
  }, [user, location, setLocation]);


 return (
    <div className="min-h-screen bg-background pb-16">
      <PWAInstallBanner />
      <Switch>
        <Route path="/login">
          <LoginPage />
        </Route>
        
        <Route path="/">
          <ProtectedRoute>
            <Home ref={homeRef} />
          </ProtectedRoute>
        </Route>
        
        <Route path="/history">
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        </Route>
        
        <Route path="/stats">
          <ProtectedRoute>
            <Stats />
          </ProtectedRoute>
        </Route>
        
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/download">
          <ProtectedRoute>
            <Download />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Only show navigation when user is logged in and not on login page */}
      {user && location !== '/login' && (
        <>
          <BottomNavigation onHomeClick={handleHomeClick} />
          <FloatingFeedbackButton />
        </>
      )}
    </div>
  );
}

function App() {
  useAuthSync();
  
  useEffect(() => {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
      
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