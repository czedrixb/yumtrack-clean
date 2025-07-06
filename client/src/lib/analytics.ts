// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  console.log('Initializing Google Analytics with ID:', measurementId);

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script1.onload = () => {
    console.log('Google Analytics script loaded successfully');
  };
  script1.onerror = () => {
    console.error('Failed to load Google Analytics script');
  };
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      debug_mode: true,
      send_page_view: true,
      transport_type: 'beacon'
    });
    console.log('Google Analytics initialized with config:', '${measurementId}');
    
    // Send a test event to verify connection
    gtag('event', 'ga_connection_test', {
      event_category: 'debug',
      event_label: 'initial_setup'
    });
    console.log('Test event sent to Google Analytics');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  console.log('Tracking page view:', url);
  
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('gtag not available for page view tracking');
    return;
  }
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn('No measurement ID for page view tracking');
    return;
  }
  
  window.gtag('config', measurementId, {
    page_path: url
  });
  
  console.log('Page view tracked successfully:', url);
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  console.log('Tracking event:', { action, category, label, value });
  
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('gtag not available for event tracking');
    return;
  }
  
  // Check if dataLayer exists to verify GA is properly loaded
  if (window.dataLayer) {
    console.log('DataLayer length before event:', window.dataLayer.length);
  }
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    // Add custom parameter to help identify our events
    custom_parameter_1: 'yumtrack_app'
  });
  
  // Check dataLayer after sending event
  if (window.dataLayer) {
    console.log('DataLayer length after event:', window.dataLayer.length);
    console.log('Latest dataLayer entry:', window.dataLayer[window.dataLayer.length - 1]);
  }
  
  console.log('Event tracked successfully:', action);
};