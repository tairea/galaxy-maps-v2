import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { type CallableContext, HttpsError } from "firebase-functions/v1/https";
import type { File } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// Initialize Firebase Admin SDK with proper configuration
export const app = getApps().length === 0 ? initializeApp({}) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Generate a Firebase Storage download URL that uses a persistent download token
 * (matches getDownloadURL behavior from client SDK; no signed URLs).
 * If the file has no token yet, one will be created and saved in custom metadata.
 */
export async function generateSignedUrl(file: File): Promise<string> {
  // Read current metadata to check for an existing token
  const [currentMetadata] = await file.getMetadata();

  const existingTokens = currentMetadata.metadata?.firebaseStorageDownloadTokens as
    | string
    | undefined;

  let token: string | undefined = existingTokens?.split(",").filter(Boolean)[0];

  if (!token) {
    token = randomUUID();
    // Preserve existing custom metadata while adding the token
    await file.setMetadata({
      metadata: {
        ...(currentMetadata.metadata || {}),
        firebaseStorageDownloadTokens: token,
      },
    });
  }

  const bucketName = file.bucket.name;
  const objectPath = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${objectPath}?alt=media&token=${token}`;
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
