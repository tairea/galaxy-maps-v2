import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object class providing common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific selector to be visible
   */
  async waitForSelector(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout
    });
  }

  /**
   * Wait for a selector to be hidden/removed
   */
  async waitForSelectorToDisappear(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, {
      state: 'detached',
      timeout
    });
  }

  /**
   * Click an element with optional wait
   */
  async click(locator: Locator) {
    await locator.click();
  }

  /**
   * Fill an input field
   */
  async fill(locator: Locator, value: string) {
    await locator.fill(value);
  }

  /**
   * Get text content from an element
   */
  async getText(locator: Locator): Promise<string> {
    return await locator.textContent() ?? '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading(timeout = 30000) {
    const spinner = this.page.locator('[data-testid="loading-spinner"]');
    if (await spinner.isVisible().catch(() => false)) {
      await spinner.waitFor({ state: 'detached', timeout });
    }
  }

  /**
   * Wait for a snackbar/toast message
   */
  async waitForSnackbar(message?: string, timeout = 5000) {
    const snackbar = this.page.locator('.v-snackbar--active');
    await snackbar.waitFor({ state: 'visible', timeout });

    if (message) {
      await expect(snackbar).toContainText(message);
    }
  }

  /**
   * Dismiss any open dialogs
   */
  async dismissDialogs() {
    const dialogs = this.page.locator('.v-dialog--active');
    const count = await dialogs.count();

    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for URL to contain a specific string
   */
  async waitForUrlContains(urlPart: string, timeout = 10000) {
    await this.page.waitForURL(url => url.toString().includes(urlPart), { timeout });
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload();
  }
}
