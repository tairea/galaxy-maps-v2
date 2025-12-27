/// <reference types="vite/client" />

/**
 * Type definitions for environment variables used in Galaxy Maps
 * These variables are injected by Vite at build time from .env files
 */
interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string; // Optional

  // Third-Party API Keys
  readonly VITE_VERACITY_LRS_SECRET: string;

  // Firebase Emulator Configuration (Optional)
  readonly VITE_USE_EMULATOR?: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR?: string;
  readonly VITE_FUNCTIONS_EMULATOR_HOST?: string;
  readonly VITE_STORAGE_EMULATOR_HOST?: string;
  readonly VITE_DATABASE_EMULATOR_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
