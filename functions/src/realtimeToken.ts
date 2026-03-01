import { runWith, https } from "firebase-functions/v1";
import { defineSecret } from "firebase-functions/params";
import fetch from "node-fetch";
import { requireAuthenticated } from "./_shared.js";

// Define OpenAI API key secret for Realtime API
export const OPENAI_NAVIGATOR_KEY_SECRET = defineSecret("OPENAI_NAVIGATOR_KEY");

export const generateRealtimeTokenHttpsEndpoint = runWith({
  secrets: [OPENAI_NAVIGATOR_KEY_SECRET],
}).https.onCall(async (data, context) => {
  try {
    // Require authentication
    requireAuthenticated(context);
    console.log("✅ Authentication check passed for user:", context.auth.uid);

    // Get API key from secret
    const openaiApiKey = OPENAI_NAVIGATOR_KEY_SECRET.value();

    // Debug: Check if API key is available
    if (!openaiApiKey) {
      const errorMsg = "OpenAI API key (OPENAI_NAVIGATOR_KEY) not configured in secrets";
      console.error(errorMsg);
      throw new https.HttpsError("failed-precondition", errorMsg);
    }

    console.log("API key configured (length:", openaiApiKey.length, ")");

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
      console.error("OpenAI API error response:", {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        body: errorText,
      });
      throw new https.HttpsError(
        "internal",
        `OpenAI API error: ${apiResponse.status} ${apiResponse.statusText}`,
        { apiError: errorText },
      );
    }

    const responseData = (await apiResponse.json()) as any;
    console.log("API response keys:", Object.keys(responseData));
    console.log("API response client_secret structure:", typeof responseData.client_secret);

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
      console.error("Full response structure:", JSON.stringify(responseData, null, 2));
      throw new https.HttpsError(
        "internal",
        `Unexpected API response structure. Available keys: ${Object.keys(responseData).join(", ")}`,
        { responseData },
      );
    }

    if (!clientSecret) {
      throw new https.HttpsError("internal", "Client secret is empty or undefined");
    }

    if (!responseData.expires_at) {
      console.warn("expires_at not found in response, using default 1 hour from now");
      responseData.expires_at = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    }

    console.log("Successfully generated realtime token");
    return {
      success: true,
      clientSecret: clientSecret,
      expires_at: responseData.expires_at,
    };
  } catch (error) {
    // If it's already an HttpsError, re-throw it
    if (error instanceof https.HttpsError) {
      console.error("HttpsError generating realtime token:", error.message, error.details);
      throw error;
    }

    // Otherwise, wrap it
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error generating realtime token:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    throw new https.HttpsError("internal", `Failed to generate realtime token: ${errorMessage}`, {
      originalError: errorMessage,
      stack: errorStack,
    });
  }
});
