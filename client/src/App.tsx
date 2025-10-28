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
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
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
import EmailVerificationHandler from '@/components/email-verification-handler'; // Add this

function Router() {
  const homeRef = useRef<{ goToHome: () => void }>(null);
  const [location, setLocation] = useLocation();
  const { isInWebView } = usePWA();
  const { user, isEmailVerified } = useAuth();

  useAnalytics();

  const handleHomeClick = () => {
    if (location === "/" && homeRef.current) {
      homeRef.current.goToHome();
    } else {
      setLocation("/");
    }
  };

  useEffect(() => {
    // If user is logged in and verified, and they're on login page, redirect to home
    if (user && isEmailVerified && location === '/login') {
      setLocation('/');
    }
  }, [user, isEmailVerified, location, setLocation]);

  // Show bottom nav for authenticated users, regardless of verification status
  const showBottomNav = user && location !== '/login' &&
    !['/privacy-policy', '/terms-of-service', '/verify-email'].includes(location) &&
    !location.includes('mode=verifyEmail');

  return (
    <div className="min-h-screen bg-background">
      <PWAInstallBanner />

      <div className={showBottomNav ? "pb-16" : ""}>
        <Switch>
          <Route path="/login">
            <LoginPage />
          </Route>

          {/* Add email verification handler route */}
          <Route path="/verify-email">
            <EmailVerificationHandler />
          </Route>

          <Route path="/">
            <ProtectedRoute requireEmailVerification={false}>
              <Home ref={homeRef} />
            </ProtectedRoute>
          </Route>

          <Route path="/history">
            <ProtectedRoute requireEmailVerification={false}>
              <History />
            </ProtectedRoute>
          </Route>

          <Route path="/stats">
            <ProtectedRoute requireEmailVerification={false}>
              <Stats />
            </ProtectedRoute>
          </Route>

          <Route path="/settings">
            <ProtectedRoute requireEmailVerification={false}>
              <Settings />
            </ProtectedRoute>
          </Route>

          <Route path="/download">
            <ProtectedRoute requireEmailVerification={false}>
              <Download />
            </ProtectedRoute>
          </Route>

          <Route path="/privacy-policy">
            <PrivacyPolicy />
          </Route>

          <Route path="/terms-of-service">
            <TermsOfService />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>

      {showBottomNav && (
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