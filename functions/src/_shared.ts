import * as adminApp from "firebase-admin/app";
import * as adminAuth from "firebase-admin/auth";
import * as adminFirestore from "firebase-admin/firestore";
import * as functions from "firebase-functions";

export const app = adminApp.initializeApp();
export const auth = adminAuth.getAuth(app);
export const db = adminFirestore.getFirestore(app);

/**
 * Requires the context to be authenticated.
 * @param {functions.https.CallableContext} context - The context object.
 * @throws {functions.https.HttpsError} - Throws an error if not authenticated.
 */
export function requireAuthenticated(
  context: functions.https.CallableContext,
): asserts context is functions.https.CallableContext & {
  auth: Required<functions.https.CallableContext>["auth"];
} {
  if (context.auth == null) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to access this endpoint",
    );
  }
}
