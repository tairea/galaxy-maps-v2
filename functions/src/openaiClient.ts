import functions from "firebase-functions";
import OpenAI from "openai";

/**
 * Attempts to read the OpenAI API key from Firebase Functions config.
 */
function getConfigApiKey(): string | undefined {
  try {
    const config = functions.config();
    return config?.openai?.key;
  } catch (error) {
    return undefined;
  }
}

const apiKey = process.env.OPENAI_API_KEY || getConfigApiKey();

if (!apiKey) {
  throw new Error(
    "Missing OpenAI API key. Set OPENAI_API_KEY env var or firebase config openai.key.",
  );
}

export const openai = new OpenAI({ apiKey });

export default openai;
