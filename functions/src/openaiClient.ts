import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// For testing/emulator environments, allow missing API key
// Check for emulator by looking for FIREBASE_EMULATOR_HUB or other emulator indicators
// The Functions emulator sets FIREBASE_EMULATOR_HUB when running
// Also allow during Firebase deployment analysis (which doesn't have access to secrets)
const isEmulator =
  process.env.NODE_ENV === "test" ||
  !!process.env.FIREBASE_EMULATOR_HUB ||
  !!process.env.FUNCTIONS_EMULATOR ||
  // Check if we're running from the emulator's context
  (typeof process !== "undefined" && process.argv.some((arg) => arg.includes("emulator")));

// Check if we're in Firebase deployment analysis (code analysis phase)
// During deployment, Firebase analyzes code but doesn't have access to secrets yet
// We detect this by checking for Cloud Build environment or if we're being analyzed
const isDeploymentAnalysis =
  !!process.env.CLOUDBUILD_PROJECT_ID || // Google Cloud Build sets this during deployment
  !!process.env.GCLOUD_PROJECT || // GCP project is set during deployment
  (typeof process !== "undefined" &&
    (process.argv.some((arg) => arg.includes("firebase")) ||
      process.argv.some((arg) => arg.includes("deploy"))));

// Only throw error if we're not in emulator and not in deployment analysis
if (!apiKey && !isEmulator && !isDeploymentAnalysis) {
  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY environment variable.");
}

// Create OpenAI client with optional API key (will fail at runtime if used without key in non-emulator)
export const openai = apiKey
  ? new OpenAI({ apiKey })
  : new OpenAI({ apiKey: "dummy-key-for-emulator" });

export default openai;
