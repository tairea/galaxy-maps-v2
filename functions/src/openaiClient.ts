import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// For testing/emulator environments, allow missing API key
// Check for emulator by looking for FIREBASE_EMULATOR_HUB or other emulator indicators
// The Functions emulator sets FIREBASE_EMULATOR_HUB when running
const isEmulator =
  process.env.NODE_ENV === "test" ||
  !!process.env.FIREBASE_EMULATOR_HUB ||
  !!process.env.FUNCTIONS_EMULATOR ||
  // Check if we're running from the emulator's context
  (typeof process !== "undefined" && process.argv.some((arg) => arg.includes("emulator")));

if (!apiKey && !isEmulator) {
  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY environment variable.");
}

// Create OpenAI client with optional API key (will fail at runtime if used without key in non-emulator)
export const openai = apiKey
  ? new OpenAI({ apiKey })
  : new OpenAI({ apiKey: "dummy-key-for-emulator" });

export default openai;
