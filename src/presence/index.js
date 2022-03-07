//=========== USER PRECENSE SYSTEM ===================
import store from '@/store';
import firebase from 'firebase'
import { studentOnlineXAPIStatement, studentOfflineXAPIStatement } from '@/store/veracityLRS'
// import store from './store'

export const startPresenceSystem = (uid) => {
  if (!uid) return
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


  firebase.database().ref('.info/connected').on('value', function(snapshot) {
    console.log('database ref .on: ', snapshot.val())
    if (snapshot.val() == false) {
        console.log('snapshot if false')
        console.log('set firestore if offline: ', uid)
        // If offline we'll set Firestore's state to offline
        userStatusFirestoreRef.set(isOfflineForFirestore);
        return;
    };

    // if online well set the database and firestore
    userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase)
    .then(function() {
      console.log('set firestore and database online: ', uid)
      userStatusDatabaseRef.set(isOnlineForDatabase);
      userStatusFirestoreRef.set(isOnlineForFirestore);
    })
  })

  firebase.firestore().collection('status')
    .where('state', '==', 'online')
    .onSnapshot((snapshot) => {
      // watch for changes to user status and update the our store
      snapshot.docChanges().forEach(function(change) {
        if (change.type === 'added') {
          console.log('firestore watch shows ', change.doc.id, ' is online')
          store.state.userStatus[change.doc.id] = change.doc.data()
          
          // if the change is mine set and XAPI statement
          // if (change.doc.id === store.state.user.data.id) {
          //     console.log('im online')
          //     studentOnlineXAPIStatement(store.state.person)
          //   }
          }
          else if (change.type === 'removed') {
            // db still returns online because the watch is triggered locally
          console.log('firstore watch shows ', change.doc.id, ' is offline')
          const data = {
            ...change.doc.data(),
            ...{state: 'offline'}
          }
          store.state.userStatus[change.doc.id] = data
          
          // if the change is mine set and XAPI statement
          // if (change.doc.id === store.state.user.data.id) {
          //   studentOfflineXAPIStatement(store.state.person)
          // }
        }
      });
  });

  store.dispatch("getAllUsersStatus")
}


