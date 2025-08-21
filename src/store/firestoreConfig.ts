import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/storage";

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
// Intialize Firebase Cloud Functions
export const functions = firebaseApp.functions();

// Get a reference to the database service
export const database = firebase.database();

// Function to connect to emulators
export const connectToEmulators = () => {
  console.log('🔧 Connecting to Firebase emulators...');
  
  // Connect Firestore to emulator
  db.useEmulator('localhost', 3000);
  
  // Connect Auth to emulator
  firebase.auth().useEmulator('http://localhost:9099');
  
  // Connect Functions to emulator
  functions.useEmulator('localhost', 5001);
  
  // Connect Storage to emulator (if you have it enabled)
  // storage.useEmulator('localhost', 9199);
  
  console.log('✅ Connected to Firebase emulators');
  console.log('📊 Firestore: localhost:8080');
  console.log('🔐 Auth: localhost:9099');
  console.log('⚡ Functions: localhost:5001');
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
