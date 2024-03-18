import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { type CallableContext, HttpsError } from "firebase-functions/v1/https";

export const app = initializeApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Requires the context to be authenticated.
 * @param {CallableContext} context - The context object.
 * @throws {HttpsError} - Throws an error if not authenticated.
 */
export function requireAuthenticated(
  context: CallableContext,
): asserts context is CallableContext & {
  auth: Required<CallableContext>["auth"];
} {
  if (context.auth == null) {
    throw new HttpsError("unauthenticated", "Must be authenticated to access this endpoint");
  }
}
