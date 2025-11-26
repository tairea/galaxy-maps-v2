import { expect, test } from "@playwright/test";
import { fetchLatestEmailVerificationLink } from "./utils/auth-emulator";

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

    await expect(page.getByText(/please verify your email/i)).toBeVisible();

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

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`${TEST_FIRST_NAME} ${TEST_LAST_NAME}`)).toBeVisible();
  });
});
