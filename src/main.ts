import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import firebase from "firebase";
import './css/main.scss';
import { startPresenceSystem } from './presence'

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user?.getIdTokenResult().then(idTokenResult => {
      Object.assign(user, {admin: idTokenResult.claims.admin})
      store.dispatch("setUser", user);
      store.dispatch("getPersonById", user.uid);
      startPresenceSystem (user.uid)
    })
  } else {
    store.dispatch("setUser", user);
    store.dispatch("getPersonById", user);
    // store.dispatch("userLoggedOut")
  }
});

// //=========== USER PRECENSE SYSTEM ===================
// var uid = firebase.auth().currentUser?.uid;

// // This is where we will store data about being online/offline.
// var userStatusDatabaseRef = firebase.database().ref('/status/' + uid);

// var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid);

// // We'll create two constants which we will write to 
// // the Realtime database when this device is offline
// // or online.
// var isOfflineForDatabase = {
//   state: 'offline',
//   last_changed: firebase.database.ServerValue.TIMESTAMP,
// };

// var isOnlineForDatabase = {
//   state: 'online',
//   last_changed: firebase.database.ServerValue.TIMESTAMP,
// };

// // Firestore uses a different server timestamp value, so we'll 
// // create two more constants for Firestore state.
// var isOfflineForFirestore = {
//     state: 'offline',
//     last_changed: firebase.firestore.FieldValue.serverTimestamp(),
// };

// var isOnlineForFirestore = {
//     state: 'online',
//     last_changed: firebase.firestore.FieldValue.serverTimestamp(),
// };

// firebase.database().ref('.info/connected').on('value', function(snapshot) {
//     if (snapshot.val() == false) {
//         // If offline we'll set Firestore's state to offline
//         userStatusFirestoreRef.set(isOfflineForFirestore);
//         return;
//     };

//     // if online well set the database and firestore
//     userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
//         console.log("setting online for uid: ", uid)
//         userStatusDatabaseRef.set(isOnlineForDatabase);
//         userStatusFirestoreRef.set(isOnlineForFirestore);
//     });
// });

firebase.firestore().collection('status')
    .where('state', '==', 'online')
    .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === 'added') {
                var msg = 'User ' + change.doc.id + ' is online.';
                console.log(msg);
                // ...
            }
            if (change.type === 'removed') {
                var msg = 'User ' + change.doc.id + ' is offline.';
                console.log(msg);
                // ...
            }
        });
    });

new Vue({
  router,
  vuetify,
  store,
  render: (h) => h(App),
}).$mount("#app");
