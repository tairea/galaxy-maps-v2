//=========== USER PRECENSE SYSTEM ===================
import store from "@/store/index.js";
import firebase from "firebase/compat/app";

export const startPresenceSystem = (uid) => {
  if (!uid) return;
  // This is where we will store data about being online/offline.
  var userStatusDatabaseRef = firebase.database().ref("/status/" + uid);

  var userStatusFirestoreRef = firebase.firestore().doc("/status/" + uid);

  // We'll create two constants which we will write to
  // the Realtime database when this device is offline
  // or online.
  var isOfflineForDatabase = {
    state: "offline",
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  var isOnlineForDatabase = {
    state: "online",
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  // Firestore uses a different server timestamp value, so we'll
  // create two more constants for Firestore state.
  var isOfflineForFirestore = {
    state: "offline",
    last_changed: firebase.firestore.FieldValue.serverTimestamp(),
  };

  var isOnlineForFirestore = {
    state: "online",
    last_changed: firebase.firestore.FieldValue.serverTimestamp(),
  };

  firebase
    .database()
    .ref(".info/connected")
    .on("value", function (snapshot) {
      if (snapshot.val() == false) {
        // If offline we'll set Firestore's state to offline
        userStatusFirestoreRef.set(isOfflineForFirestore);
        return;
      }

      // if online well set the database and firestore
      userStatusDatabaseRef
        .onDisconnect()
        .set(isOfflineForDatabase)
        .then(function () {
          userStatusDatabaseRef.set(isOnlineForDatabase);
          userStatusFirestoreRef.set(isOnlineForFirestore);
        });
    });

  firebase
    .firestore()
    .collection("status")
    .where("state", "==", "online")
    .onSnapshot((snapshot) => {
      // watch for changes to user status and update the our store
      snapshot.docChanges().forEach(function (change) {
        if (change.type === "added") {
          store.state.userStatus[change.doc.id] = change.doc.data();
        } else if (change.type === "removed") {
          // db still returns online because the watch is triggered locally
          const data = {
            ...change.doc.data(),
            ...{ state: "offline" },
          };
          store.state.userStatus[change.doc.id] = data;
        }
      });
    });

  store.dispatch("getAllUsersStatus");
};
