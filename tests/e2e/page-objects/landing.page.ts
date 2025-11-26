import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Landing Page object for authentication flows
 */
export class LandingPage extends BasePage {
  // Locators
  readonly signInButton: Locator;
  readonly createAccountLink: Locator;

  // Login form
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInSubmitButton: Locator;

  // Registration form
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerButton: Locator;

  // Messages
  readonly verifyEmailMessage: Locator;
  readonly emailVerifiedHeading: Locator;
  readonly continueToLoginButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.signInButton = page.getByRole('button', { name: /sign in or create an account/i });
    this.createAccountLink = page.getByRole('link', { name: /create an account/i });

    // Login form
    this.emailInput = page.getByLabel(/e-mail/i);
    this.passwordInput = page.getByRole('textbox', { name: /password/i });
    this.signInSubmitButton = page.getByRole('button', { name: /sign-in/i });

    // Registration form
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.registerEmailInput = page.getByLabel(/e-mail/i);
    this.registerPasswordInput = page.getByRole('textbox', { name: /password/i });
    this.registerButton = page.getByRole('button', { name: /^register$/i });

    // Messages
    this.verifyEmailMessage = page.getByText(/please check your email/i);
    this.emailVerifiedHeading = page.getByRole('heading', { name: /email verified/i });
    this.continueToLoginButton = page.getByRole('button', { name: /continue to login/i });
  }

  /**
   * Navigate to landing page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Open sign in dialog
   */
  async openSignIn() {
    // Check if button or link is available
    const buttonCount = await this.signInButton.count();
    if (buttonCount > 0) {
      await this.signInButton.first().click();
    } else {
      const linkButton = this.page.getByRole('link', { name: /sign in or create an account/i });
      await linkButton.click();
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    await this.openSignIn();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInSubmitButton.click();
    await this.waitForNavigation();
  }

  /**
   * Open registration form
   */
  async openRegistration() {
    await this.openSignIn();
    await this.createAccountLink.click();
  }

  /**
   * Register a new account
   */
  async register(options: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await this.openRegistration();
    await this.firstNameInput.fill(options.firstName);
    await this.lastNameInput.fill(options.lastName);
    await this.registerEmailInput.fill(options.email);
    await this.registerPasswordInput.fill(options.password);
    await this.registerButton.click();
  }

  /**
   * Wait for email verification message
   */
  async waitForVerificationMessage() {
    await this.verifyEmailMessage.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to verification URL with oobCode
   */
  async verifyEmail(oobCode: string) {
    await this.goto(`/login?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}`);
    await this.emailVerifiedHeading.waitFor({ state: 'visible' });
  }

  /**
   * Continue to login after verification
   */
  async continueToLogin() {
    await this.continueToLoginButton.click();
  }

  /**
   * Check if user is logged in (by checking for user name display)
   */
  async isLoggedIn(userName?: string): Promise<boolean> {
    if (userName) {
      const userNameElement = this.page.getByText(userName);
      return await userNameElement.isVisible();
    }

    // Check for any sign of logged in state (e.g., user menu)
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    return await userMenu.isVisible().catch(() => false);
  }

  /**
   * Complete registration and login flow with email verification
   * Requires auth emulator to fetch verification link
   */
  async registerAndLogin(options: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    oobCode: string;
  }) {
    // Register
    await this.register({
      firstName: options.firstName,
      lastName: options.lastName,
      email: options.email,
      password: options.password
    });

    // Wait for verification message
    await this.waitForVerificationMessage();

    // Verify email
    await this.verifyEmail(options.oobCode);

    // Continue to login
    await this.continueToLogin();

    // Sign in
    await this.signIn(options.email, options.password);

    // Wait for redirect to home
    await this.waitForUrlContains('/');
  }
}
