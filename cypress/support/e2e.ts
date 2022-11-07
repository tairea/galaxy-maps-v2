// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';
import { attachCustomCommands } from 'cypress-firebase';

const fbConfig = {
    apiKey: "AIzaSyBSOVegvIYfI49DykugprcD-yJFLf-WgNs",
    authDomain: "galaxy-maps-ac367.firebaseapp.com",
    databaseURL: "https://galaxy-maps-ac367-default-rtdb.firebaseio.com",
    projectId: "galaxy-maps-ac367",
    storageBucket: "galaxy-maps-ac367.appspot.com",
    messagingSenderId: "527578025987",
    appId: "1:527578025987:web:3fa9411ad04559cf223e36",
    measurementId: "G-EHZLKWQG14",
};

firebase.initializeApp(fbConfig);

attachCustomCommands({ Cypress, cy, firebase });