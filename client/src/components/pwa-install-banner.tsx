import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X, Download } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { trackEvent } from "@/lib/analytics";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { canInstall, install, isInstalled, isInWebView } = usePWA();

  useEffect(() => {
    // Don't show PWA banner in webviews - the webview helper handles this
    if (isInWebView) {
      return;
    }
    
    // Show banner if app can be installed and user hasn't dismissed it
    const dismissed = localStorage.getItem('nutrisnap-install-dismissed');
    
    // Always show banner after 3 seconds if not installed and not dismissed
    if (!isInstalled && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, isInWebView]);

  const handleInstall = async () => {
    trackEvent('pwa_install_attempt', 'engagement', 'banner_click');
    
    // If in webview, show instructions modal instead of trying to install
    if (isInWebView) {
      trackEvent('pwa_install_webview_detected', 'engagement', 'banner_click');
      setShowInstallModal(true);
      return;
    }
    
    if (canInstall) {
      try {
        const installed = await install();
        if (installed) {
          trackEvent('pwa_install_success', 'engagement', 'automatic_install');
          setIsVisible(false);
          return;
        }
      } catch (error) {
        console.error('Installation failed:', error);
        trackEvent('pwa_install_failed', 'engagement', 'automatic_install');
      }
    }
    
    // If automatic install isn't available, show manual instructions
    setShowInstallModal(true);
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Special instructions for webview contexts
    if (isInWebView) {
      const userAgent = navigator.userAgent.toLowerCase();
      const isKakao = userAgent.includes('kakaotalk');
      const isFacebook = userAgent.includes('fban') || userAgent.includes('fbav');
      
      let appName = "messenger app";
      if (isKakao) appName = "KakaoTalk";
      else if (isFacebook) appName = "Facebook Messenger";
      
      return {
        title: `Add to Home Screen from ${appName}`,
        description: `While PWA installation isn't available in ${appName}, you can still add YumTrack to your home screen for quick access.`,
        steps: isIOS ? [
          isKakao ? "Tap the Safari icon (🌐) at the bottom" : "Tap the Share button (□↗) at the bottom",
          isKakao ? "This opens the page in Safari" : "Select 'Open in Safari'",
          "In Safari, tap the Share button again",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to create a shortcut"
        ] : [
          isKakao ? "Tap the browser icon at the top right" : "Tap the menu (⋮) in the top right",
          isKakao ? "Select your default browser" : "Select 'Open in Browser' or 'Open in Chrome'",
          "In your browser, tap the menu (⋮) again",
          "Look for 'Add to Home screen'",
          "Tap to create a shortcut"
        ]
      };
    }
    
    if (isIOS) {
      return {
        title: "Install on iOS",
        description: "Install YumTrack as an app on your iPhone or iPad for faster access.",
        steps: [
          "Tap the Share button (□↗) in Safari",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to confirm"
        ]
      };
    } else if (isAndroid) {
      return {
        title: "Install on Android",
        description: "Install YumTrack as an app on your Android device for faster access.",
        steps: [
          "Tap the menu (⋮) in Chrome",
          "Tap 'Add to Home screen'",
          "Tap 'Add' to confirm"
        ]
      };
    } else {
      return {
        title: "Install on Desktop",
        description: "Install YumTrack as an app on your computer for faster access.",
        steps: [
          "Look for the install button (⊕) in your browser's address bar",
          "Or check the browser menu for 'Install app' option",
          "Click to install the app"
        ]
      };
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
              <div className="text-sm font-medium">{isInWebView ? "Add to Home Screen" : "Get the App"}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="text-xs px-4 py-2 h-auto font-semibold"
            >
              {isInWebView ? "Add" : "Download"}
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

      {/* Install Instructions Modal */}
      <AlertDialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getInstallInstructions().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getInstallInstructions().description || "Follow these steps to install YumTrack as an app on your device:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-4">
            {getInstallInstructions().steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground flex-1">{step}</p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInstallModal(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
