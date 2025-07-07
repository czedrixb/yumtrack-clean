# Environment Variables Setup

YumTrack uses dotenv for environment variable management, providing a clean and organized way to handle configuration.

## How It Works

1. **Automatic Loading**: Environment variables are loaded automatically via `dotenv.config()` in `server/index.ts`
2. **Centralized Config**: All configuration is managed through `server/config.ts`
3. **Validation**: The app validates required and optional environment variables on startup

## Configuration Files

### `.env` File
Contains local environment variables that are loaded by dotenv:
- EmailJS configuration for contact support
- Comments showing which variables should be set via Replit Secrets

### `server/config.ts`
Centralized configuration management with:
- Type-safe access to environment variables
- Validation for required vs optional variables
- Clear organization of all configuration options

## Environment Variables

### Required (via Replit Secrets)
- `OPENAI_API_KEY`: OpenAI API key for food analysis
- `VITE_GA_MEASUREMENT_ID`: Google Analytics measurement ID

### Optional
- `SENDGRID_API_KEY`: SendGrid API for server-side email
- `VITE_EMAILJS_*`: EmailJS configuration for contact support

### Client-Side Variables (VITE_ prefix)
Variables prefixed with `VITE_` are exposed to the client-side code:
- Can be set in `.env` file or Replit Secrets
- Automatically available in the browser via `import.meta.env`

## Startup Validation

The server validates configuration on startup and shows:
- **Warnings**: for missing required variables
- **Info**: for missing optional variables

This helps ensure the app is properly configured before starting.

## Best Practices

1. **Sensitive Keys**: Use Replit Secrets for API keys and sensitive data
2. **Local Config**: Use `.env` file for development configuration
3. **Documentation**: Keep `.env` file documented with comments
4. **Validation**: Check the startup logs to ensure all required variables are set