import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import vue2 from "@vitejs/plugin-vue2";
import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import { VuetifyResolver } from "unplugin-vue-components/resolvers";

// Load .env.test if VITE_USE_EMULATOR is set (indicates test/emulator mode)
// This ensures Vite picks up the emulator host configuration for E2E tests
if (process.env.VITE_USE_EMULATOR === "true") {
  try {
    const envTestPath = resolve(process.cwd(), ".env.test");
    const envTestContent = readFileSync(envTestPath, "utf-8");
    envTestContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#") && trimmedLine.includes("=")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        const value = valueParts.join("=").trim();
        // Only set if not already in process.env (command line vars take precedence)
        // Vite automatically picks up VITE_* vars from process.env
        if (key.startsWith("VITE_") && !(key in process.env)) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // .env.test might not exist, that's okay
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue2(),
    Components({
      resolvers: [
        {
          type: "component",
          resolve: (name: string) => {
            if (name.match(/^VTour/)) return { name, from: "vue-tour" };
          },
        },
        VuetifyResolver(),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@openai/agents-realtime": fileURLToPath(
        new URL(
          "./node_modules/@openai/agents-realtime/dist/bundle/openai-realtime-agents.umd.js",
          import.meta.url,
        ),
      ),
    },
  },

  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      external: (id) => {
        // Don't externalize @openai/agents-realtime, we want to bundle it
        return false;
      },
    },
  },

  server: {
    hmr: true, // Enable HMR for hot reloading
  },
});
