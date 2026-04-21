import { CapacitorConfig } from '@capacitor/cli';

// =============================================================================
// MINDI Mobile — Capacitor Configuration
// Wraps Next.js web app for iOS (App Store) and Android (Play Store).
// =============================================================================

const config: CapacitorConfig = {
  appId: 'ai.mindi.app',
  appName: 'Mindi',
  webDir: '../../web/.next/server/app', // Built Next.js output

  // Use live reload from Next.js dev server during development
  server: process.env.NODE_ENV === 'development'
    ? {
        url: 'http://localhost:3000',
        cleartext: true, // Dev only — prod uses HTTPS
      }
    : undefined,

  ios: {
    // Required for Firebase Auth
    allowsLinkPreview: false,
    contentInset: 'always', // Respect safe areas (ui-ux-pro-max: safe-area-compliance)
    scheme: 'mindi',
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },

  plugins: {
    // Firebase push notifications (Phase 4+)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Deep linking — mindi:// scheme
    App: {
      launchUrl: 'mindi://',
    },

    // Haptic feedback for gesture actions (ui-ux-pro-max: haptic-feedback)
    Haptics: {},

    // Status bar — match Mindi's dark theme
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0f0f13',
    },

    // Keyboard — manage safe areas
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },

    // Splash screen
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f0f13',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
