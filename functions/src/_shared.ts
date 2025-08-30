import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { type CallableContext, HttpsError } from "firebase-functions/v1/https";
import type { File } from "@google-cloud/storage";

// Initialize Firebase Admin SDK with proper configuration
export const app = getApps().length === 0 ? initializeApp({}) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Generate a signed URL for a file in Firebase Storage
 * @param file - The file reference
 * @param expiresInYears - Number of years until expiration (default: 100)
 * @returns Promise<string> - The signed URL
 */
export async function generateSignedUrl(file: File, expiresInYears: number = 100): Promise<string> {
  const [downloadURL] = await file.getSignedUrl({
    action: "read",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * expiresInYears),
    version: "v4",
  });
  return downloadURL;
}

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
