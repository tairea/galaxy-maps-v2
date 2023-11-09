import * as functions from "firebase-functions";
import { firestore } from "./_shared.js";
import { studentOnlineXAPIStatement, studentOfflineXAPIStatement } from "./veracityLRS.js";

//  ============ PRESENCE SYSTEM SYNC ============
// Watch realtime DB for changes and trigger function on change
export const onUserStatusChangedOnUpdateTrigger = functions.database
  .ref("/status/{uid}")
  .onUpdate(async (change, context) => {
    // Get the data written to Realtime Database
    const eventStatus = change.after.val();
    functions.logger.log("=====eventStatus=====: ", eventStatus);

    // get the doc from the firestore DB
    const userStatusFirestoreRef = firestore.doc(`status/${context.params.uid}`);

    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so we'll re-read the current data
    // and compare the timestamps.
    const statusSnapshot = await change.after.ref.once("value");
    const status = statusSnapshot.val();
    // If the current timestamp for this data is newer than
    // the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) {
      return null;
    }

    // Otherwise, we convert the last_changed field to a Date
    eventStatus.last_changed = new Date(eventStatus.last_changed);
    const personSnapshot = await firestore.collection("people").doc(context.params.uid).get();
    const person = {
      id: personSnapshot.id,
      ...personSnapshot.data(),
    };

    if (eventStatus.state === "online") studentOnlineXAPIStatement(person);
    if (eventStatus.state === "offline") studentOfflineXAPIStatement(person);

    // push XAPI statement here
    // ... and write it to Firestore.
    return userStatusFirestoreRef.set(eventStatus);
  });
