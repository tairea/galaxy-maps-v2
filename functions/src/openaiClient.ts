import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// For testing/emulator environments, allow missing API key
if (!apiKey && process.env.NODE_ENV !== "test" && !process.env.FIREBASE_EMULATOR_HUB) {
  throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY environment variable.");
}

export const openai = new OpenAI({ apiKey: apiKey! });

export default openai;
