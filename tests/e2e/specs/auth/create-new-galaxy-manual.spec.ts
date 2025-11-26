import { test, expect } from "@playwright/test";

// Load test credentials from environment variables
const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test("test", async ({ page }) => {
  // Validate that required environment variables are set
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing required environment variables: E2E_TEST_EMAIL and E2E_TEST_PASSWORD. " +
        "Please create a .env.test file based on .env.test.example",
    );
  }

  await page.goto("http://127.0.0.1:5174/");
  await page.getByRole("button", { name: "SIGN IN or CREATE AN ACCOUNT" }).click();
  await page.getByRole("textbox", { name: "E-mail" }).click();
  await page.getByRole("textbox", { name: "E-mail" }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "E-mail" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign-in" }).click();
});
