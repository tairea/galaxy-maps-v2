import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.test file for E2E tests
config({ path: resolve(__dirname, ".env.test") });

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "on-first-retry",
    locale: "en-US",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  // Keep browser open on failure
  globalSetup: undefined,
  globalTeardown: undefined,
  // Add this to prevent auto-closing
  workers: 1, // Ensure single worker for debugging
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Disable web security (CORS) for E2E tests to work around
        // Firebase Functions emulator CORS limitations with callable functions
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
      },
    },
  ],
});
