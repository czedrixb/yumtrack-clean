// Environment configuration with dotenv
// All environment variables are automatically loaded via dotenv.config() in server/index.ts

export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
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
    console.warn(`Warning: Missing required environment variables: ${missing.join(', ')}`);
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