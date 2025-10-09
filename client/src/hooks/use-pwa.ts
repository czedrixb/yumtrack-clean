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

  useEffect(() => {
    const checkPWAEligibility = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]');
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      
      console.log('PWA Eligibility Check:', {
        hasServiceWorker,
        hasManifest: !!hasManifest,
        isHTTPS,
        userAgent: navigator.userAgent
      });
      
      return hasServiceWorker && hasManifest && isHTTPS;
    };

    if (!checkPWAEligibility()) {
      console.warn('PWA criteria not met - install banner will not show');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('Service Worker registrations:', registrations.length);
        registrations.forEach(reg => {
          console.log('SW scope:', reg.scope);
        });
      });
    }

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      
      console.log('PWA Installation Status:', {
        isStandalone,
        isInWebApp,
        url: window.location.href
      });
      
      return isStandalone || isInWebApp;
    };

    setIsInstalled(checkInstalled());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('Display mode changed:', e.matches);
      setIsInstalled(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    const detectWebView = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isWebView = (
        userAgent.includes('kakaotalk') ||
        userAgent.includes('fban') || userAgent.includes('fbav') ||
        userAgent.includes('instagram') ||
        userAgent.includes('line') ||
        userAgent.includes('micromessenger') ||
        userAgent.includes('wv') ||
        (userAgent.includes('android') && userAgent.includes('version') && !userAgent.includes('chrome')) ||
        ((userAgent.includes('iphone') || userAgent.includes('ipad')) && !userAgent.includes('safari'))
      );
      
      console.log('WebView Detection:', { isWebView, userAgent });
      return isWebView;
    };

    setIsInWebView(detectWebView());

    if ((window as any).deferredPrompt) {
      console.log('Found existing deferred prompt');
      setDeferredPrompt((window as any).deferredPrompt);
      setCanInstall(true);
    }

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
      localStorage.setItem('yumtrack-installed-dismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available for installation');
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
      } else {
        console.log('User dismissed PWA installation');
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
    install,
  };
}