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
