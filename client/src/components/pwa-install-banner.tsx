import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Download } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { trackEvent } from "@/lib/analytics";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, install, isInstalled, isInWebView } = usePWA();

  useEffect(() => {
    // Show banner if app can be installed and user hasn't dismissed it
    const dismissed = localStorage.getItem('nutrisnap-install-dismissed');
    
    // Only show banner if app is NOT installed and not dismissed
    if (!isInstalled && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Hide banner if app is installed
      setIsVisible(false);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    trackEvent('pwa_install_attempt', 'engagement', 'banner_click');
    
    // First check if app is already installed
    if (isInstalled) {
      trackEvent('pwa_already_installed', 'engagement', 'banner_click');
      setIsVisible(false);
      return;
    }
    
    // If in webview (messenger/kakaotalk), open in browser directly
    if (isInWebView) {
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent.toLowerCase();
      
      trackEvent('webview_browser_redirect', 'engagement', 'install_redirect');
      
      // Try multiple methods to open in browser
      let opened = false;
      
      if (userAgent.includes('kakaotalk')) {
        // KakaoTalk specific methods
        try {
          // Method 1: KakaoTalk external browser
          window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
          opened = true;
        } catch (e) {
          console.log('KakaoTalk method 1 failed, trying fallback');
        }
      } else if (userAgent.includes('messenger') || userAgent.includes('fban') || userAgent.includes('fbav')) {
        // Facebook Messenger methods
        try {
          // Method 1: Android intent
          if (userAgent.includes('android')) {
            window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
            opened = true;
          }
        } catch (e) {
          console.log('Messenger method 1 failed, trying fallback');
        }
      }
      
      // Universal fallback methods
      if (!opened) {
        try {
          // Method 2: Try to open in new window/tab
          const newWindow = window.open(currentUrl, '_blank');
          if (newWindow) {
            opened = true;
          }
        } catch (e) {
          console.log('Window.open failed, trying location change');
        }
      }
      
      // Last resort: direct location change
      if (!opened) {
        window.location.href = currentUrl;
      }
      
      return;
    }
    
    // For regular browsers, attempt PWA installation
    if (canInstall && install) {
      try {
        const installed = await install();
        if (installed) {
          trackEvent('pwa_install_success', 'engagement', 'automatic_install');
          setIsVisible(false);
          localStorage.setItem('nutrisnap-install-dismissed', 'true');
          return;
        }
      } catch (error) {
        console.error('Installation failed:', error);
        trackEvent('pwa_install_failed', 'engagement', 'automatic_install');
      }
    } else {
      // If PWA install isn't available, hide the banner
      setIsVisible(false);
      trackEvent('pwa_install_unavailable', 'engagement', 'banner_attempt');
    }
  };



  const handleDismiss = () => {
    trackEvent('pwa_install_dismiss', 'engagement', 'banner_dismiss');
    setIsVisible(false);
    localStorage.setItem('nutrisnap-install-dismissed', 'true');
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-50 shadow-lg animate-in slide-in-from-top">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6" />
            <div>
              <div className="text-sm font-medium">Get the App</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="text-xs px-4 py-2 h-auto font-semibold"
            >
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs px-3 py-1 h-auto text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
