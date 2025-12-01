import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/storage";

// Use localhost instead of 127.0.0.1 to avoid CORS issues when frontend runs on localhost
const DEFAULT_EMULATOR_HOST = "localhost";
const DEFAULT_AUTH_PORT = 9099;
const DEFAULT_FIRESTORE_PORT = 8080;
const DEFAULT_FUNCTIONS_PORT = 5001;
const DEFAULT_STORAGE_PORT = 9199;
const DEFAULT_DATABASE_PORT = 9000;

/**
 * Validates that all required Firebase configuration environment variables are present
 * @throws Error if any required environment variable is missing
 */
const validateFirebaseConfig = () => {
  const requiredVars = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_DATABASE_URL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value || value.includes("your-") || value.includes("here"))
    .map(([key]) => key);

  if (missingVars.length > 0) {
    const errorMessage = `
❌ Firebase Configuration Error

Missing or invalid required environment variables:
${missingVars.map((v) => `  - ${v}`).join("\n")}

To fix this:
1. Copy .env.example to .env: cp .env.example .env
2. Get your Firebase config from https://console.firebase.google.com/
3. Go to Project Settings → General → Your apps
4. Copy the config values to your .env file
5. Make sure to replace all placeholder values (e.g., "your-api-key-here")

See README_PROJECT.md for detailed setup instructions.
    `.trim();

    throw new Error(errorMessage);
  }
};

// Validate Firebase configuration before initializing
validateFirebaseConfig();

// Build Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Optional
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = firebaseApp.firestore();
// Initialize Firestore Storage
export const storage = firebaseApp.storage();
// Initialize Firebase Cloud Functions
// Note: Region is NOT specified here to allow emulator connection to work properly.
// The emulator ignores region settings. Production functions in us-central1 will still work
// because the SDK defaults to us-central1 when no region is specified.
export const functions = firebaseApp.functions();

// Get a reference to the database service
export const database = firebase.database();

const parseHostPort = (raw: string | undefined, fallbackPort: number) => {
  if (!raw) {
    return { host: DEFAULT_EMULATOR_HOST, port: fallbackPort };
  }

  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(`http://${raw}`);
    return {
      host: url.hostname || DEFAULT_EMULATOR_HOST,
      port: Number(url.port) || fallbackPort,
    };
  } catch (error) {
    console.warn(`Unable to parse emulator host "${raw}". Falling back to defaults.`, error);
    return { host: DEFAULT_EMULATOR_HOST, port: fallbackPort };
  }
};

let emulatorsConnected = false;

// Function to connect to emulators
export const connectToEmulators = () => {
  if (emulatorsConnected) {
    return;
  }

  emulatorsConnected = true;

  console.log("🔧 Connecting to Firebase emulators...");

  const firestore = parseHostPort(
    import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined,
    DEFAULT_FIRESTORE_PORT,
  );
  const authSource = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR as string | undefined;
  const authUrl =
    authSource && authSource.startsWith("http")
      ? authSource
      : `http://${authSource ?? `${DEFAULT_EMULATOR_HOST}:${DEFAULT_AUTH_PORT}`}`;
  const auth = parseHostPort(authUrl, DEFAULT_AUTH_PORT);
  const functionsHost = parseHostPort(
    import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST as string | undefined,
    DEFAULT_FUNCTIONS_PORT,
  );
  const storageHost = parseHostPort(
    import.meta.env.VITE_STORAGE_EMULATOR_HOST as string | undefined,
    DEFAULT_STORAGE_PORT,
  );
  const databaseHost = parseHostPort(
    import.meta.env.VITE_DATABASE_EMULATOR_HOST as string | undefined,
    DEFAULT_DATABASE_PORT,
  );

  db.useEmulator(firestore.host, firestore.port);
  firebase.auth().useEmulator(authUrl);
  functions.useEmulator(functionsHost.host, functionsHost.port);
  storage.useEmulator(storageHost.host, storageHost.port);
  database.useEmulator(databaseHost.host, databaseHost.port);

  console.log("✅ Connected to Firebase emulators");
  console.log(`📊 Firestore: ${firestore.host}:${firestore.port}`);
  console.log(`🔐 Auth: ${auth.host}:${auth.port}`);
  console.log(`⚡ Functions: ${functionsHost.host}:${functionsHost.port}`);
  console.log(`🗄️ Storage: ${storageHost.host}:${storageHost.port}`);
  console.log(`🔁 Realtime DB: ${databaseHost.host}:${databaseHost.port}`);
};

// Function to disconnect from emulators (connect to production)
export const connectToProduction = () => {
  console.log("🚀 Connecting to Firebase production...");
  // Note: Once connected to emulator, you need to refresh the page to reconnect to production
  console.log("ℹ️ Refresh the page to reconnect to production");
};

// Auto-connect to emulators only when using dev:emulator script
if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectToEmulators();
}
