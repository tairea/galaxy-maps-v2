import { defineStore } from "pinia";
import { generateRealtimeToken } from "@/lib/ff";

export interface TokenCache {
  token: string;
  expiresAt: number;
}

export const useAiConversationStore = defineStore("aiConversation", {
  state: () => ({
    tokenCache: null as TokenCache | null,
  }),

  getters: {
    hasValidToken: (state) => {
      if (!state.tokenCache) return false;
      return Date.now() < state.tokenCache.expiresAt;
    },
  },

  actions: {
    async getRealtimeToken(): Promise<string> {
      // Check if we have a valid cached token
      if (this.hasValidToken && this.tokenCache) {
        const timeLeft = this.tokenCache.expiresAt - Date.now();
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
        console.log(`🔄 Using cached realtime token (expires in ${minutesLeft}m ${secondsLeft}s)`);
        return this.tokenCache.token;
      }

      // Generate new token
      console.log("🆕 Generating new realtime token...");
      try {
        const response = await generateRealtimeToken();
        const { clientSecret, expires_at } = response as {
          clientSecret: string;
          expires_at: number;
        };

        if (!clientSecret) {
          throw new Error("Received empty client secret from server");
        }

        if (!expires_at) {
          throw new Error("Received empty expiration time from server");
        }

        // Cache the token with the actual expiration time from the API
        this.tokenCache = {
          token: clientSecret,
          expiresAt: expires_at * 1000, // Convert from seconds to milliseconds
        };

        // Log readable expiration time
        const expirationDate = new Date(expires_at * 1000);
        const timeLeft = expires_at * 1000 - Date.now();
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);

        // Format date as dd/mm/yyyy hh:mm:ss
        const day = expirationDate.getDate().toString().padStart(2, "0");
        const month = (expirationDate.getMonth() + 1).toString().padStart(2, "0");
        const year = expirationDate.getFullYear();
        const hours = expirationDate.getHours().toString().padStart(2, "0");
        const minutes = expirationDate.getMinutes().toString().padStart(2, "0");
        const seconds = expirationDate.getSeconds().toString().padStart(2, "0");
        const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

        console.log(`🔑 New token generated successfully!`);
        console.log(`⏰ Token expires at: ${formattedDate}`);
        console.log(`⏱️ Token expires in: ${minutesLeft}m ${secondsLeft}s`);

        return clientSecret;
      } catch (error: any) {
        // Extract error message from Firebase error
        let errorMessage = "Failed to generate realtime token";
        if (error?.code === "functions/unauthenticated") {
          errorMessage = "Authentication required. Please log in and try again.";
        } else if (error?.code === "functions/failed-precondition") {
          errorMessage = "Server configuration error. Please contact support.";
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        console.error("💥 Failed to generate realtime token:", {
          error,
          code: error?.code,
          message: errorMessage,
          details: error?.details,
        });

        // Clear cache on error to force retry
        this.clearTokenCache();

        throw new Error(errorMessage);
      }
    },

    clearTokenCache() {
      console.log("🧹 Clearing token cache");
      this.tokenCache = null;
    },
  },
});
