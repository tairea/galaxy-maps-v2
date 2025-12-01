import { test as base, Page } from '@playwright/test';
import { LandingPage } from '../page-objects/landing.page';
import { generateTestUser } from '../utils/test-data-generator';
import { cleanupTestData } from '../utils/firestore-helpers';
import { fetchLatestEmailVerificationLink } from '../utils/auth-emulator';

/**
 * Authenticated user type
 */
export type AuthenticatedUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  uid: string;
  fullName: string;
};

/**
 * Auth fixtures type definition
 */
type AuthFixtures = {
  authenticatedUser: AuthenticatedUser;
  landingPage: LandingPage;
};

/**
 * Extended test with auth fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Landing page fixture
   */
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await use(landingPage);
  },

  /**
   * Authenticated user fixture
   * Automatically registers, verifies, and logs in a test user
   */
  authenticatedUser: async ({ page }, use) => {
    const user = generateTestUser();
    const fullName = `${user.firstName} ${user.lastName}`;

    const projectId = process.env.FIREBASE_PROJECT_ID ?? 'galaxy-maps-test';
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR;

    // Handle any alert/confirm dialogs
    page.on('dialog', async (dialog) => {
      await dialog.dismiss().catch(() => undefined);
    });

    const landingPage = new LandingPage(page);

    // Navigate to landing page
    await landingPage.goto();

    // Register user
    await landingPage.register({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
    });

    // Wait for verification message
    await landingPage.waitForVerificationMessage();

    // Fetch verification link from auth emulator
    const { oobCode } = await fetchLatestEmailVerificationLink(user.email, {
      projectId,
      authEmulatorHost,
    });

    // Verify email
    await landingPage.verifyEmail(oobCode);

    // Continue to login
    await landingPage.continueToLogin();

    // Sign in
    await landingPage.signIn(user.email, user.password);

    // Wait for successful login (redirect to my-galaxies or home)
    await page.waitForURL(/\/(my-galaxies|)$/, { timeout: 10000 });

    // Verify user is logged in
    const isLoggedIn = await landingPage.isLoggedIn(fullName);
    if (!isLoggedIn) {
      throw new Error('User login failed');
    }

    // Get the real Firebase Auth UID by querying Firestore for the person document
    // The registration process creates a person document with the auth UID
    const { initializeTestFirestore } = await import('../utils/firestore-helpers');
    const db = initializeTestFirestore();

    // Query for the person document by email
    const peopleQuery = db.collection('people').where('email', '==', user.email);
    const peopleSnapshot = await peopleQuery.get();

    if (peopleSnapshot.empty) {
      throw new Error(`Person document not found for email: ${user.email}`);
    }

    const personDoc = peopleSnapshot.docs[0];
    const uid = personDoc.id;  // The document ID is the Firebase Auth UID

    console.log('[authenticatedUser] Retrieved UID from Firestore:', uid);
    console.log('[authenticatedUser] Person document data:', {
      id: personDoc.data().id,
      email: personDoc.data().email,
      firstName: personDoc.data().firstName,
      lastName: personDoc.data().lastName,
    });

    const authenticatedUser: AuthenticatedUser = {
      ...user,
      uid,
      fullName,
    };

    // Use the authenticated user
    await use(authenticatedUser);

    // Cleanup after test
    await cleanupTestData(uid);
  },
});

export { expect } from '@playwright/test';

/**
 * Test with only landing page (no authentication)
 */
export const testUnauth = base.extend<{ landingPage: LandingPage }>({
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await use(landingPage);
  },
});
