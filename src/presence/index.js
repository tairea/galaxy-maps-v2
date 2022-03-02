//=========== USER PRECENSE SYSTEM ===================
import firebase from 'firebase'

export const startPresenceSystem = (uid) => {
  console.log("starting presence system: ", uid)

  // This is where we will store data about being online/offline.
  var userStatusDatabaseRef = firebase.database().ref('/status/' + uid);

  var userStatusFirestoreRef = firebase.firestore().doc('/status/' + uid);

  // We'll create two constants which we will write to 
  // the Realtime database when this device is offline
  // or online.
  var isOfflineForDatabase = {
    state: 'offline',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  var isOnlineForDatabase = {
    state: 'online',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
  };

  // Firestore uses a different server timestamp value, so we'll 
  // create two more constants for Firestore state.
  var isOfflineForFirestore = {
      state: 'offline',
      last_changed: firebase.firestore.FieldValue.serverTimestamp(),
  };

  var isOnlineForFirestore = {
      state: 'online',
      last_changed: firebase.firestore.FieldValue.serverTimestamp(),
  };


 return firebase.database().ref('.info/connected').on('value', function(snapshot) {
      if (snapshot.val() == false) {
          // If offline we'll set Firestore's state to offline
          userStatusFirestoreRef.set(isOfflineForFirestore);
          return;
      };
  
      // if online well set the database and firestore
      userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
        console.log("setting online for uid: ", uid)
        userStatusDatabaseRef.set(isOnlineForDatabase);
        userStatusFirestoreRef.set(isOnlineForFirestore);
      });
  });
}

