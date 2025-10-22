import { useState, useEffect } from "react";

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInWebView, setIsInWebView] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
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

    // Detect platform and browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChromeBrowser = /chrome|chromium/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);
    setIsChrome(isChromeBrowser);

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
      setIsReady(true);
    });

    const handleAppInstalled = () => {
      console.log('🎉 App was installed!');
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // For iOS and Android, we always show install instructions
  const canInstall = (isIOS || isAndroid) && !isInstalled;

  return {
    canInstall,
    isInstalled,
    isInWebView,
    isIOS,
    isAndroid,
    isChrome,
    isSafari,
    isReady,
  };
}