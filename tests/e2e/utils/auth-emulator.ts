export interface EmailVerificationOob {
  email: string;
  oobCode: string;
  oobLink: string;
  requestType: string;
  createdAt: string;
}

const DEFAULT_PROJECT_ID = "galaxy-maps-ac367";
const DEFAULT_AUTH_EMULATOR = "http://127.0.0.1:9099";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normaliseUrl = (raw?: string) => {
  if (!raw) return DEFAULT_AUTH_EMULATOR;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
};

export const fetchLatestEmailVerificationLink = async (
  email: string,
  {
    projectId = process.env.FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID,
    authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR,
    pollTimeoutMs = 30_000, // Increased timeout to 30 seconds
    pollIntervalMs = 500,
  }: {
    projectId?: string;
    authEmulatorHost?: string;
    pollTimeoutMs?: number;
    pollIntervalMs?: number;
  } = {},
): Promise<EmailVerificationOob> => {
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not defined. Provide it via environment variable.");
  }

  const baseUrl = normaliseUrl(authEmulatorHost);
  const endpoint = `${baseUrl}/emulator/v1/projects/${projectId}/oobCodes`;
  const deadline = Date.now() + pollTimeoutMs;
  let attemptCount = 0;

  console.log(`[Auth Emulator] Fetching verification code for ${email}`);
  console.log(`[Auth Emulator] Endpoint: ${endpoint}`);
  console.log(`[Auth Emulator] Project ID: ${projectId}`);

  while (Date.now() < deadline) {
    attemptCount++;
    
    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        console.error(`[Auth Emulator] Failed to query oobCodes: ${response.status} ${errorText}`);
        throw new Error(`Failed to query Auth emulator oobCodes: ${response.status} ${errorText}`);
      }

      const payload = (await response.json()) as { oobCodes?: Array<Record<string, string>> };
      const codes = payload.oobCodes ?? [];
      
      console.log(`[Auth Emulator] Attempt ${attemptCount}: Found ${codes.length} total oobCodes`);
      
      // Log all VERIFY_EMAIL codes for debugging
      const verifyEmailCodes = codes.filter((code) => code.requestType === "VERIFY_EMAIL");
      if (verifyEmailCodes.length > 0) {
        console.log(`[Auth Emulator] Found ${verifyEmailCodes.length} VERIFY_EMAIL codes:`);
        verifyEmailCodes.forEach((code, idx) => {
          console.log(`  [${idx}] Email: ${code.email}, Created: ${code.createdAt || 'unknown'}`);
        });
      }

      const match = verifyEmailCodes
        .reverse() // Get the most recent one first
        .find((code) => code.email?.toLowerCase() === email.toLowerCase());

      if (match?.oobCode) {
        console.log(`[Auth Emulator] Found matching verification code for ${email}`);
        const oobLink =
          match.oobLink ??
          `${baseUrl}/emulator/action?mode=verifyEmail&oobCode=${
            match.oobCode
          }&apiKey=${encodeURIComponent("dummy-api-key")}`;

        return {
          email: match.email ?? email,
          oobCode: match.oobCode,
          oobLink,
          requestType: match.requestType ?? "VERIFY_EMAIL",
          createdAt: match.createdAt ?? new Date().toISOString(),
        };
      } else {
        console.log(`[Auth Emulator] No matching code found for ${email}, continuing to poll...`);
      }
    } catch (error) {
      // If it's a network error, log it but continue polling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`[Auth Emulator] Network error on attempt ${attemptCount}: ${error.message}`);
        console.warn(`[Auth Emulator] Make sure Firebase Auth emulator is running on ${baseUrl}`);
      } else {
        // For other errors, throw immediately
        throw error;
      }
    }

    await sleep(pollIntervalMs);
  }

  // Final attempt to get diagnostic info
  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      const payload = (await response.json()) as { oobCodes?: Array<Record<string, string>> };
      const codes = payload.oobCodes ?? [];
      const verifyEmailCodes = codes.filter((code) => code.requestType === "VERIFY_EMAIL");
      console.error(`[Auth Emulator] Final state: ${verifyEmailCodes.length} VERIFY_EMAIL codes found`);
      verifyEmailCodes.forEach((code, idx) => {
        console.error(`  [${idx}] Email: ${code.email} (looking for: ${email})`);
      });
    }
  } catch (e) {
    console.error(`[Auth Emulator] Could not fetch final diagnostic info: ${e}`);
  }

  throw new Error(
    `Timed out waiting for verification email for ${email} after ${attemptCount} attempts. ` +
    `Make sure:\n` +
    `1. Firebase Auth emulator is running on ${baseUrl}\n` +
    `2. Project ID "${projectId}" matches your emulator configuration\n` +
    `3. Email verification was actually sent (check emulator logs)`
  );
};
