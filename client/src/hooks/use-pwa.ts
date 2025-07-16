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
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebApp = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebApp);

    // Detect if running in webview (messenger apps, KakaoTalk, etc.)
    const detectWebView = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isWebView = (
        // KakaoTalk webview
        userAgent.includes('kakaotalk') ||
        // Facebook Messenger
        userAgent.includes('fban') || userAgent.includes('fbav') ||
        // Instagram
        userAgent.includes('instagram') ||
        // Line browser
        userAgent.includes('line') ||
        // WeChat
        userAgent.includes('micromessenger') ||
        // Generic webview indicators
        userAgent.includes('wv') ||
        // Android WebView
        (userAgent.includes('android') && userAgent.includes('version') && !userAgent.includes('chrome')) ||
        // iOS WebView (not Safari)
        (userAgent.includes('iphone') || userAgent.includes('ipad')) && !userAgent.includes('safari')
      );
      
      return isWebView;
    };

    setIsInWebView(detectWebView());

    // Check if there's already a global prompt stored
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setCanInstall(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event received!');
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setCanInstall(true);
      // Store globally as backup
      (window as any).deferredPrompt = event;
      console.log('PWA install prompt is now available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
    
    return false;
  };

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    isInWebView,
    install,
  };
}
