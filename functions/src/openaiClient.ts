import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

/**
 * Creates and returns an OpenAI client instance.
 * This function must be called at runtime (inside a function handler),
 * not at module load time, because secrets are only available at runtime.
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = OPENAI_API_KEY.value();

  if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY secret.");
  }

  return new OpenAI({ apiKey });
}
