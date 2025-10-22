import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, X } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import IOSInstallInstructions from "./ios-install-instructions";
import AndroidInstallInstructions from "./android-install-instructions";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const { canInstall, isInstalled, isInWebView, isIOS, isAndroid } = usePWA();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }

    const dismissed = localStorage.getItem('yumtrack-install-dismissed');
    const installedDismissed = localStorage.getItem('yumtrack-installed-dismissed');

    // Only show banner if not installed and not dismissed, OR if installed and not dismissed
    if ((!isInstalled && !dismissed) || (isInstalled && !installedDismissed)) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isInstalled, isMobile]);

  useEffect(() => {
    if (isVisible && isInstalled && isMobile) {
      const autoDismissTimer = setTimeout(() => {
        localStorage.setItem('yumtrack-installed-dismissed', 'true');
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(autoDismissTimer);
    }
  }, [isVisible, isInstalled, isMobile]);

  const handleInstall = () => {
    trackEvent('pwa_install_attempt', 'engagement', 'banner_click');

    if (isInstalled) {
      trackEvent('pwa_already_installed', 'engagement', 'banner_click');
      localStorage.setItem('yumtrack-installed-dismissed', 'true');
      setIsVisible(false);
      return;
    }

    // Show platform-specific instructions
    if (isIOS) {
      trackEvent('ios_install_instructions_shown', 'engagement', 'banner_click');
      setShowIOSInstructions(true);
      return;
    }

    if (isAndroid) {
      trackEvent('android_install_instructions_shown', 'engagement', 'banner_click');
      setShowAndroidInstructions(true);
      return;
    }

    if (isInWebView) {
      handleWebViewRedirect();
      return;
    }

    // For other browsers, just track and dismiss
    trackEvent('pwa_install_unavailable', 'engagement', 'banner_attempt');
    setIsVisible(false);
  };

  const handleWebViewRedirect = () => {
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

  const getButtonText = () => {
    if (isInstalled) return "Open App";
    if (isIOS) return "Install";
    if (isAndroid) return "Install";
    return "Install";
  };

  const getBannerMessage = () => {
    if (isInstalled) {
      return {
        title: "App Installed",
        subtitle: "Now added to your homescreen"
      };
    }

    if (isIOS) {
      return {
        title: "Add to Home Screen",
        subtitle: "Install YumTrack for quick access"
      };
    }

    if (isAndroid) {
      return {
        title: "Install App",
        subtitle: "Get the full app experience"
      };
    }

    return {
      title: "Get the App",
      subtitle: "Install for better experience"
    };
  };

  // Only show banner on mobile devices that can install the PWA or have it installed
  if (!isMobile || !isVisible || (!canInstall && !isInstalled)) {
    return null;
  }

  const message = getBannerMessage();

  return (
    <>
      <div
        className={`w-full p-4 shadow-lg animate-in slide-in-from-top ${isInstalled ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground'
          }`}
      >
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center space-x-3 flex-1">
            {isInstalled ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <Download className="w-6 h-6" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {message.title}
              </div>
              {message.subtitle && (
                <div className="text-xs text-white/80 mt-0.5">
                  {message.subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
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
                  {getButtonText()}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-xs px-3 py-1 h-auto text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X className="w-4 h-4" />
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

      {/* Android Installation Instructions Modal */}
      <AndroidInstallInstructions
        isOpen={showAndroidInstructions}
        onClose={() => setShowAndroidInstructions(false)}
      />
    </>
  );
}