import { expect, test } from "@playwright/test";
import { fetchLatestEmailVerificationLink } from "../../utils/auth-emulator";

const TEST_FIRST_NAME = "E2E";
const TEST_LAST_NAME = "Explorer";
const TEST_PASSWORD = "TestPass123!";
const DEFAULT_PROJECT_ID = "galaxy-maps-ac367";

test.describe("Register → Verify Email → Login", () => {
  test("user can complete onboarding flow against emulators", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const email = `galaxy-e2e-${uniqueSuffix}@example.test`;
    const projectId = process.env.FIREBASE_PROJECT_ID ?? DEFAULT_PROJECT_ID;
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR;

    page.on("dialog", async (dialog) => {
      await dialog.dismiss().catch(() => undefined);
    });

    await page.goto("/");

    // Verify the app is connected to emulators by checking console logs
    // The app should log "🔧 Connecting to Firebase emulators..." when VITE_USE_EMULATOR=true
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes("Connecting to Firebase emulators")) {
        console.log("✅ App is connected to Firebase emulators");
      }
    });

    // Also check in the browser if Firebase Auth is using emulator
    const isUsingEmulatorInBrowser = await page
      .evaluate(() => {
        // Check if Firebase Auth is configured to use emulator
        // The emulator URL should be in the auth instance
        try {
          const auth = (window as any).firebase?.auth?.();
          // If using emulator, the auth domain will point to localhost
          return auth && auth.config?.emulator;
        } catch (e) {
          return false;
        }
      })
      .catch(() => false);

    if (!isUsingEmulatorInBrowser) {
      console.warn("⚠️ Firebase Auth may not be using emulator - check browser console");
    }

    const signInButton = page.getByRole("button", { name: /sign in or create an account/i });
    if ((await signInButton.count()) > 0) {
      await signInButton.first().click();
    } else {
      await page.getByRole("link", { name: /sign in or create an account/i }).click();
    }

    await page.getByRole("link", { name: /create an account/i }).click();

    await page.getByLabel(/first name/i).fill(TEST_FIRST_NAME);
    await page.getByLabel(/last name/i).fill(TEST_LAST_NAME);
    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(TEST_PASSWORD);

    await page.getByRole("button", { name: /^register$/i }).click();

    // Wait for registration to complete and verification message to appear
    await expect(page.getByText(/please check your email/i)).toBeVisible();

    // Give the emulator a moment to process and store the verification email
    // The email verification is sent asynchronously, so we need to wait a bit
    await page.waitForTimeout(2000);

    // Check if app is using emulator by looking for emulator connection logs
    const isUsingEmulator = consoleMessages.some(
      (msg) =>
        msg.includes("Connecting to Firebase emulators") ||
        msg.includes("Connected to Firebase emulators"),
    );

    if (!isUsingEmulator) {
      console.warn("⚠️ WARNING: App may not be connected to Firebase emulators!");
      console.warn("⚠️ Make sure the dev server is running with VITE_USE_EMULATOR=true");
      console.warn("⚠️ Use: npm run dev:emulator OR npm run e2e:run-local");
    }

    const { oobCode } = await fetchLatestEmailVerificationLink(email, {
      projectId,
      authEmulatorHost,
    });

    await page.goto(`/login?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}`);
    await expect(page.getByRole("heading", { name: /email verified/i })).toBeVisible();

    await page.getByRole("button", { name: /continue to login/i }).click();

    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign-in/i }).click();

    // After login, user should be redirected to their galaxies page or home
    await expect(page).toHaveURL(/\/(my-galaxies|)$/);
    await expect(page.getByText(`${TEST_FIRST_NAME} ${TEST_LAST_NAME}`)).toBeVisible();
  });
});
