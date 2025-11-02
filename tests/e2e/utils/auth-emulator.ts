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
    pollTimeoutMs = 15_000,
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

  while (Date.now() < deadline) {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to query Auth emulator oobCodes: ${response.statusText}`);
    }

    const payload = (await response.json()) as { oobCodes?: Array<Record<string, string>> };
    const codes = payload.oobCodes ?? [];
    const match = codes
      .filter((code) => code.requestType === "VERIFY_EMAIL")
      .reverse()
      .find((code) => code.email?.toLowerCase() === email.toLowerCase());

    if (match?.oobCode) {
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
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for verification email for ${email}`);
};
