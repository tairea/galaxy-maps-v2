import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/storage";

const DEFAULT_EMULATOR_HOST = "127.0.0.1";
const DEFAULT_AUTH_PORT = 9099;
const DEFAULT_FIRESTORE_PORT = 8080;
const DEFAULT_FUNCTIONS_PORT = 5001;
const DEFAULT_STORAGE_PORT = 9199;
const DEFAULT_DATABASE_PORT = 9000;

const firebaseConfig = {
  apiKey: "AIzaSyBSOVegvIYfI49DykugprcD-yJFLf-WgNs",
  authDomain: "galaxy-maps-ac367.firebaseapp.com",
  databaseURL: "https://galaxy-maps-ac367-default-rtdb.firebaseio.com",
  projectId: "galaxy-maps-ac367",
  storageBucket: "galaxy-maps-ac367.appspot.com",
  messagingSenderId: "527578025987",
  appId: "1:527578025987:web:3fa9411ad04559cf223e36",
  measurementId: "G-EHZLKWQG14",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = firebaseApp.firestore();
// Initialize Firestore Storage
export const storage = firebaseApp.storage();
// Intialize Firebase Cloud Functions and set region explicitly to avoid CORS/redirects
export const functions = firebaseApp.functions("us-central1");

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

  console.log('🔧 Connecting to Firebase emulators...');

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

  console.log('✅ Connected to Firebase emulators');
  console.log(`📊 Firestore: ${firestore.host}:${firestore.port}`);
  console.log(`🔐 Auth: ${auth.host}:${auth.port}`);
  console.log(`⚡ Functions: ${functionsHost.host}:${functionsHost.port}`);
  console.log(`🗄️ Storage: ${storageHost.host}:${storageHost.port}`);
  console.log(`🔁 Realtime DB: ${databaseHost.host}:${databaseHost.port}`);
};

// Function to disconnect from emulators (connect to production)
export const connectToProduction = () => {
  console.log('🚀 Connecting to Firebase production...');
  // Note: Once connected to emulator, you need to refresh the page to reconnect to production
  console.log('ℹ️ Refresh the page to reconnect to production');
};

// Auto-connect to emulators only when using dev:emulator script
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectToEmulators();
}
