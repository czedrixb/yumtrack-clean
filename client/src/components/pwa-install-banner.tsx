import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

export default function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, install, isInstalled } = usePWA();

  useEffect(() => {
    // Show banner if app can be installed and user hasn't dismissed it
    const dismissed = localStorage.getItem('nutrisnap-install-dismissed');
    
    // Always show banner after 3 seconds if not installed and not dismissed
    if (!isInstalled && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      const installed = await install();
      if (installed) {
        setIsVisible(false);
        return;
      }
    }
    
    // Show manual install instructions if automatic install isn't available
    showManualInstallInstructions();
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = "";
    if (isIOS) {
      instructions = "Tap the Share button in Safari, then select 'Add to Home Screen'";
    } else if (isAndroid) {
      instructions = "Tap the menu (⋮) in Chrome, then select 'Add to Home screen'";
    } else {
      instructions = "Look for the install button in your browser's address bar";
    }
    
    alert(`To install NutriSnap:\n\n${instructions}`);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('nutrisnap-install-dismissed', 'true');
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-50 shadow-lg animate-in slide-in-from-top">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        <div className="flex items-center space-x-3">
          <Download className="w-6 h-6" />
          <span className="text-sm font-medium">Install NutriSnap</span>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="text-xs px-3 py-1 h-auto"
          >
            Install
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
  );
}
