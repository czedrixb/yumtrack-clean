// config.ts
import dotenv from 'dotenv';

// Load environment variables at the top
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  firebase: {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  },
  
  // OpenAI API (required for food analysis)
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // Google Analytics (client-side, prefixed with VITE_)
  gaTrackingId: process.env.VITE_GA_MEASUREMENT_ID,
  
  // EmailJS configuration (client-side, prefixed with VITE_)
  emailjs: {
    serviceId: process.env.VITE_EMAILJS_SERVICE_ID,
    templateId: process.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY,
  },
  
  // SendGrid API (optional, for server-side email)
  sendgridApiKey: process.env.SENDGRID_API_KEY,
} as const;

// Validation helper to check required environment variables
export function validateConfig() {
  const required = {
    OPENAI_API_KEY: config.openaiApiKey,
  };
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const optional = {
    VITE_GA_MEASUREMENT_ID: config.gaTrackingId,
    VITE_EMAILJS_SERVICE_ID: config.emailjs.serviceId,
    SENDGRID_API_KEY: config.sendgridApiKey,
  };
  
  const missingOptional = Object.entries(optional)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingOptional.length > 0) {
    console.info(`Info: Optional environment variables not set: ${missingOptional.join(', ')}`);
  }
}