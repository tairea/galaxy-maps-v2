import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/functions";
import "firebase/storage";

var firebaseConfig = {
  apiKey: "AIzaSyBSOVegvIYfI49DykugprcD-yJFLf-WgNs",
  authDomain: "galaxy-maps-ac367.firebaseapp.com",
  projectId: "galaxy-maps-ac367",
  storageBucket: "galaxy-maps-ac367.appspot.com",
  messagingSenderId: "527578025987",
  appId: "1:527578025987:web:3fa9411ad04559cf223e36",
  measurementId: "G-EHZLKWQG14",
};
const firebaseApp = firebase.initializeApp(firebaseConfig)
// Initialize Firestore Database
export const db = firebaseApp.firestore();
// Initialize Firestore Functions
export const functions = firebaseApp.functions('us-central1');
// Initialize Firestore Storage
export const storage = firebaseApp.storage();
