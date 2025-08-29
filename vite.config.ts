import { fileURLToPath, URL } from "node:url";

import vue2 from "@vitejs/plugin-vue2";
import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import { VuetifyResolver } from "unplugin-vue-components/resolvers";

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
