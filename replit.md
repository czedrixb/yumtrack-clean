# YumTrack - AI Food Nutrition Analyzer

## Overview

YumTrack is a Progressive Web Application (PWA) that uses AI-powered computer vision to analyze food images and provide detailed nutritional information. Users can take photos of their meals and receive instant calorie counts, macronutrient breakdowns, and health insights powered by OpenAI's GPT-4V model.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds
- **PWA Features**: Service worker, manifest, and offline capabilities

### Backend
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Upload**: Multer for multipart form handling
- **Database**: Drizzle ORM with PostgreSQL (Neon Database)
- **AI Integration**: OpenAI GPT-4V for food image analysis

### Mobile-First Design
- Responsive design optimized for mobile devices
- PWA capabilities for app-like experience
- Camera integration for photo capture
- Bottom navigation for thumb-friendly interaction

## Key Components

### Food Analysis Engine
- **Image Processing**: Multer handles image uploads with size/type validation
- **AI Analysis**: OpenAI GPT-4V model analyzes food images and returns structured nutritional data
- **Data Schema**: Comprehensive nutrition schema including macronutrients, vitamins, minerals, and health insights
- **Storage**: Persistent storage of analysis results with timestamps

### User Interface
- **Camera Capture**: Native camera integration with fallback to file upload
- **Image Compression**: Client-side image optimization before upload
- **Real-time Analysis**: Loading states and progress indicators during AI processing
- **Nutrition Display**: Comprehensive nutrition cards with macronutrient breakdowns
- **History Tracking**: Persistent history of analyzed foods with search/filter capabilities
- **Statistics Dashboard**: Weekly stats, trends, and insights

### PWA Features
- **Offline Support**: Service worker caching for core functionality
- **Install Prompts**: Smart install banner with user dismissal handling
- **Mobile Optimized**: Touch-friendly interface with mobile-first design
- **Performance**: Optimized loading and caching strategies

## Data Flow

1. **Image Capture**: User captures or uploads food image through camera interface
2. **Image Processing**: Client-side compression and base64 encoding
3. **Upload**: Secure multipart upload to Express server with validation
4. **AI Analysis**: OpenAI GPT-4V processes image and returns structured nutrition data
5. **Data Storage**: Analysis results stored in PostgreSQL with Drizzle ORM
6. **Response**: Formatted nutrition data returned to client
7. **Display**: Rich nutrition cards with actionable insights
8. **History**: Analysis saved to user's history for future reference

## External Dependencies

### AI & Machine Learning
- **OpenAI GPT-4V**: Advanced vision model for food recognition and nutrition analysis
- **Image Processing**: Client-side compression and optimization

### Database & Storage
- **Neon Database**: Serverless PostgreSQL for production scalability
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Local Storage**: Browser storage for user preferences and offline data

### UI & Design System
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent iconography throughout the application
- **shadcn/ui**: Pre-built component library with Radix + Tailwind

### Development & Build
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundling for server-side code

### Analytics & Tracking
- **Google Analytics 4**: User behavior tracking, session analytics, and engagement metrics
- **Event Tracking**: Custom event tracking for food analysis, navigation, and PWA installation
- **Page View Tracking**: Single-page application route tracking

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with HMR
- **Database**: Local PostgreSQL or Neon development database
- **Environment**: Environment variables for API keys and database connections

### Production
- **Build Process**: Vite builds client assets, ESBuild bundles server code
- **Server**: Express.js server serving both API and static files
- **Database**: Production Neon PostgreSQL instance
- **PWA**: Service worker registration and manifest serving
- **Security**: Input validation, file type restrictions, and rate limiting

### Environment Configuration
- **dotenv Integration**: Automatic environment variable loading via dotenv
- **Configuration Management**: Centralized config with validation in `server/config.ts`
- **OpenAI API key**: Required for food analysis functionality
- **Google Analytics**: Measurement ID for user tracking
- **EmailJS**: Service configuration for contact support
- **SendGrid**: Optional API key for server-side email functionality

## Changelog

```
Changelog:
- July 14, 2025. Updated Google Analytics key and implemented comprehensive session duration tracking with user engagement metrics
- July 06, 2025. Added Google Analytics integration for user tracking and session analytics
- July 04, 2025. Renamed app from NutriSnap to YumTrack
- July 03, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```