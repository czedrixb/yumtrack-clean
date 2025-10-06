// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Session tracking variables
let sessionStartTime: number = 0;
let lastActivityTime: number = 0;
let isSessionActive: boolean = false;

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
      send_page_view: false,
      transport_type: 'beacon',
      custom_map: {
        'custom_parameter_1': 'app_name'
      }
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

  // Start session tracking
  startSessionTracking();
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
  // console.log('Tracking event:', { action, category, label, value });
  
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('gtag not available for event tracking');
    return;
  }
  
  // Check if dataLayer exists to verify GA is properly loaded
  if (window.dataLayer) {
    // console.log('DataLayer length before event:', window.dataLayer.length);
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
    // console.log('DataLayer length after event:', window.dataLayer.length);
    // console.log('Latest dataLayer entry:', window.dataLayer[window.dataLayer.length - 1]);
  }
  
  // console.log('Event tracked successfully:', action);
};

// Session tracking functions
export const startSessionTracking = () => {
  if (isSessionActive) return;
  
  sessionStartTime = Date.now();
  lastActivityTime = Date.now();
  isSessionActive = true;
  
  console.log('Session tracking started');
  
  // Track session start
  trackEvent('session_start', 'engagement', 'session_tracking');
  
  // Set up activity tracking
  const events = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, updateLastActivity, { passive: true });
  });
  
  // Set up periodic session duration reporting
  setInterval(reportSessionDuration, 30000); // Report every 30 seconds
  
  // Set up visibility change tracking
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Set up beforeunload to track session end
  window.addEventListener('beforeunload', endSession);
};

const updateLastActivity = () => {
  lastActivityTime = Date.now();
};

const reportSessionDuration = () => {
  if (!isSessionActive) return;
  
  const currentTime = Date.now();
  const sessionDuration = Math.round((currentTime - sessionStartTime) / 1000); // in seconds
  const timeSinceActivity = Math.round((currentTime - lastActivityTime) / 1000);
  
  // Only report if user was active recently (within 60 seconds)
  if (timeSinceActivity < 60) {
    trackEvent('session_duration', 'engagement', 'active_session', sessionDuration);
    // console.log(`Session duration: ${sessionDuration}s, last activity: ${timeSinceActivity}s ago`);
  }
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    // Page became hidden - track session pause
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
    trackEvent('session_pause', 'engagement', 'page_hidden', sessionDuration);
  } else {
    // Page became visible - update activity
    updateLastActivity();
    trackEvent('session_resume', 'engagement', 'page_visible');
  }
};

export const endSession = () => {
  if (!isSessionActive) return;
  
  const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
  trackEvent('session_end', 'engagement', 'session_complete', sessionDuration);
  
  console.log(`Session ended. Total duration: ${sessionDuration}s`);
  isSessionActive = false;
};

// Get current session info
export const getSessionInfo = () => {
  if (!isSessionActive) return null;
  
  const currentTime = Date.now();
  return {
    duration: Math.round((currentTime - sessionStartTime) / 1000),
    timeSinceActivity: Math.round((currentTime - lastActivityTime) / 1000),
    isActive: isSessionActive
  };
};