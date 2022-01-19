import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const getAllCourseNodesByPersonId = functions.https.onCall(async (data, context) => {
    // Check that the function was called while authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "The functions must be called with authenticated");
    }

    // Get the person ID from the request
    const personId = data.personId;

    // Check that personId has a value
    if (typeof personId !== "string" || personId.length === 0) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with one arguments \"personId\"" +
            " containing the person ID to get course nodes for."
        );
    }

    // Get app
    const app = initializeApp();

    // Get firestore
    const firestore = getFirestore(app);

    // For storing results
    const personsNodes = [];

    // Get courses for personId
    const coursesQuerySnapshot = await firestore
        .collection("courses")
        .where("mappedBy.personId", "==", personId)
        .get();

    for (const courseDoc of coursesQuerySnapshot.docs) {
        const mapNodesQuerySnapshot = await firestore.collection(`courses/${courseDoc.id}/map-nodes`).get();

        personsNodes.push(
            ...mapNodesQuerySnapshot.docs.map((mapNodeDoc) => {
                const node = mapNodeDoc.data();
                return {
                    ...node,
                    courseId: courseDoc.id, // add course id to nodes list for some reason
                };
            })
        );
    }

    return personsNodes;
});
