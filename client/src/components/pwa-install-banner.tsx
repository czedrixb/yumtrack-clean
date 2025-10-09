import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, install, isInstalled, isInWebView } = usePWA();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }

    const dismissed = localStorage.getItem('yumtrack-install-dismissed');
    const installedDismissed = localStorage.getItem('yumtrack-installed-dismissed');
    
    if ((!isInstalled && !dismissed) || (isInstalled && !installedDismissed)) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isInstalled, isMobile]); 

  useEffect(() => {
    if (isVisible && isInstalled && isMobile) {
      const autoDismissTimer = setTimeout(() => {
        localStorage.setItem('yumtrack-installed-dismissed', 'true');
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(autoDismissTimer);
    }
  }, [isVisible, isInstalled, isMobile]); 

  const handleInstall = async () => {
    trackEvent('pwa_install_attempt', 'engagement', 'banner_click');
    
    if (isInstalled) {
      trackEvent('pwa_already_installed', 'engagement', 'banner_click');
      localStorage.setItem('yumtrack-installed-dismissed', 'true');
      setIsVisible(false);
      return;
    }
    
    if (isInWebView) {
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent.toLowerCase();
      
      trackEvent('webview_browser_redirect', 'engagement', 'install_redirect');
      
      let opened = false;
      
      if (userAgent.includes('kakaotalk')) {
        try {
          window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
          opened = true;
        } catch (e) {
          console.log('KakaoTalk method 1 failed, trying fallback');
        }
      } else if (userAgent.includes('messenger') || userAgent.includes('fban') || userAgent.includes('fbav')) {
        try {
          if (userAgent.includes('android')) {
            window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
            opened = true;
          }
        } catch (e) {
          console.log('Messenger method 1 failed, trying fallback');
        }
      }
      
      if (!opened) {
        try {
          const newWindow = window.open(currentUrl, '_blank');
          if (newWindow) {
            opened = true;
          }
        } catch (e) {
          console.log('Window.open failed, trying location change');
        }
      }
      
      if (!opened) {
        window.location.href = currentUrl;
      }
      
      return;
    }
    
    if (canInstall && install) {
      try {
        const installed = await install();
        if (installed) {
          trackEvent('pwa_install_success', 'engagement', 'automatic_install');
          setIsVisible(false);
          localStorage.setItem('yumtrack-install-dismissed', 'true');
          return;
        }
      } catch (error) {
        console.error('Installation failed:', error);
        trackEvent('pwa_install_failed', 'engagement', 'automatic_install');
      }
    } else {
      setIsVisible(false);
      trackEvent('pwa_install_unavailable', 'engagement', 'banner_attempt');
    }
  };

  const handleDismiss = () => {
    if (isInstalled) {
      trackEvent('pwa_installed_dismiss', 'engagement', 'banner_dismiss');
      localStorage.setItem('yumtrack-installed-dismissed', 'true');
    } else {
      trackEvent('pwa_install_dismiss', 'engagement', 'banner_dismiss');
      localStorage.setItem('yumtrack-install-dismissed', 'true');
    }
    setIsVisible(false);
  };

  const handleAppInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleInstall();
  };

  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 p-4 z-50 shadow-lg animate-in slide-in-from-top ${
          isInstalled ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
        }`}
        onClick={!isInstalled ? handleInstall : undefined}
      >
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div 
            className="flex items-center space-x-3 flex-1 cursor-pointer"
            onClick={handleAppInfoClick}
          >
            {isInstalled ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <Download className="w-6 h-6" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {isInstalled ? 'App Installed' : 'Get the App'}
              </div>
              {isInstalled && (
                <div className="text-xs text-white/80 mt-0.5">
                  Now added to your homescreen
                </div>
              )}
            </div>
          </div>
          <div 
            className="flex space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            {isInstalled ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs px-3 py-1 h-auto text-white/80 hover:text-white hover:bg-white/10"
              >
                Dismiss
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}