import { runWith } from "firebase-functions/v1";
import functions from "firebase-functions";
import fetch from "node-fetch";

// Get OpenAI API key for Realtime API
const openaiApiKey = functions.config().openai.navigatorkey;

export const generateRealtimeTokenHttpsEndpoint = runWith({}).https.onCall(
  async (data, context) => {
    try {
      // Debug: Check if API key is available
      if (!openaiApiKey) {
        throw new Error("OpenAI API key not configured");
      }

      console.log("API key length:", openaiApiKey.length);
      console.log("API key starts with:", openaiApiKey.substring(0, 10) + "...");

      // Generate ephemeral client token using direct API call
      const apiResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          },
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("OpenAI API error response:", errorText);
        throw new Error(
          `OpenAI API error: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`,
        );
      }

      const responseData = (await apiResponse.json()) as any;
      console.log("API response keys:", Object.keys(responseData));
      console.log("API response client_secret:", responseData.client_secret);

      // Handle different response structures
      let clientSecret: string;
      if (responseData.client_secret && responseData.client_secret.value) {
        clientSecret = responseData.client_secret.value;
      } else if (responseData.client_secret) {
        clientSecret = responseData.client_secret;
      } else if (responseData.value) {
        clientSecret = responseData.value;
      } else if (responseData.secret) {
        clientSecret = responseData.secret;
      } else if (responseData.token) {
        clientSecret = responseData.token;
      } else {
        console.log("Full response structure:", JSON.stringify(responseData, null, 2));
        throw new Error(
          `Unexpected API response structure. Available keys: ${Object.keys(responseData).join(", ")}`,
        );
      }

      console.log("Successfully generated realtime token");
      return {
        success: true,
        clientSecret: clientSecret,
        expires_at: responseData.expires_at,
      };
    } catch (error) {
      console.error("Error generating realtime token:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate realtime token",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
);
