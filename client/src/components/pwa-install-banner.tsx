import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import IOSInstallInstructions from "./ios-install-instructions";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { canInstall, install, isInstalled, isInWebView, isIOS } = usePWA();
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

    // 🚫 Skip showing iOS instructions
    if (isIOS) {
      console.log('iOS installation is manual. Skipping instructions.');
      setIsVisible(false);
      return;
    }

    // ✅ Trigger Chrome/Android install prompt directly
    if (canInstall && install) {
      try {
        const installed = await install();
        if (installed) {
          trackEvent('pwa_install_success', 'engagement', 'automatic_install');
          localStorage.setItem('yumtrack-install-dismissed', 'true');
          setIsVisible(false);
        } else {
          console.log('User dismissed install prompt.');
        }
      } catch (error) {
        console.error('Installation failed:', error);
        trackEvent('pwa_install_failed', 'engagement', 'automatic_install');
      }
    } else {
      console.log('PWA install not available.');
      trackEvent('pwa_install_unavailable', 'engagement', 'banner_attempt');
      setIsVisible(false);
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
        className={`fixed top-0 left-0 right-0 p-4 z-50 shadow-lg animate-in slide-in-from-top ${isInstalled ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
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
                  {isIOS ? 'Install' : 'Download'}
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

      {/* iOS Installation Instructions Modal */}
      <IOSInstallInstructions
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}