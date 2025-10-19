import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInWebView, setIsInWebView] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkPWAEligibility = () => {
      // Check if manifest exists and is accessible
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        console.warn('No manifest found');
        return false;
      }

      // Check if manifest is accessible
      return fetch('/manifest.json')
        .then(response => {
          if (!response.ok) {
            console.warn('Manifest not accessible');
            return false;
          }
          return response.json().then(manifest => {
            const hasIcons = manifest.icons && manifest.icons.length > 0;
            const hasRequiredFields = manifest.name && manifest.start_url;
            
            console.log('Manifest check:', { hasIcons, hasRequiredFields });
            return hasIcons && hasRequiredFields;
          });
        })
        .catch(() => {
          console.warn('Failed to fetch manifest');
          return false;
        });
    };

    // Detect iOS and Safari
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsSafari(isSafariBrowser);

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      
      console.log('PWA Installation Status:', {
        isStandalone,
        isInWebApp,
        userAgent: navigator.userAgent
      });
      
      return isStandalone || isInWebApp;
    };

    const detectWebView = () => {
      return (
        userAgent.includes('kakaotalk') ||
        userAgent.includes('fban') || userAgent.includes('fbav') ||
        userAgent.includes('instagram') ||
        userAgent.includes('line') ||
        userAgent.includes('micromessenger') ||
        userAgent.includes('wv') ||
        (userAgent.includes('android') && userAgent.includes('version') && !userAgent.includes('chrome')) ||
        ((userAgent.includes('iphone') || userAgent.includes('ipad')) && !userAgent.includes('safari'))
      );
    };

    // Initialize checks
    Promise.resolve(checkPWAEligibility()).then(isEligible => {
      if (!isEligible) {
        console.warn('PWA criteria not met');
        setIsReady(true);
        return;
      }

      setIsInstalled(checkInstalled());
      setIsInWebView(detectWebView());

      // For iOS Safari, we can always show install instructions
      if (isIOSDevice) {
        setCanInstall(true);
      }

      setIsReady(true);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      console.log('📱 PWA Install Prompt Available!', {
        platforms: event.platforms
      });
      
      setDeferredPrompt(event);
      setCanInstall(true);
      (window as any).deferredPrompt = event;
    };

    const handleAppInstalled = () => {
      console.log('🎉 App was installed!');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (isIOS) {
      console.log('iOS device - showing installation instructions');
      return true; // Signal that iOS instructions should be shown
    }

    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return false;
    }

    try {
      console.log('Prompting user for installation...');
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      console.log('User choice:', choice.outcome);
      
      if (choice.outcome === 'accepted') {
        console.log('User accepted PWA installation');
        setDeferredPrompt(null);
        setCanInstall(false);
        (window as any).deferredPrompt = null;
        return true;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
    
    return false;
  };

  return {
    canInstall,
    isInstalled,
    isInWebView,
    isIOS,
    isSafari,
    isReady,
    install,
  };
}