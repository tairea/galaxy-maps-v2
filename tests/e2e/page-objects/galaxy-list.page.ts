import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Galaxy List page object for galaxy discovery and management
 */
export class GalaxyListPage extends BasePage {
  // Navigation
  readonly myGalaxiesLink: Locator;
  readonly publicGalaxiesLink: Locator;
  readonly createGalaxyButton: Locator;

  // Galaxy cards
  readonly galaxyCards: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation
    this.myGalaxiesLink = page.getByRole('link', { name: /my galaxies/i });
    this.publicGalaxiesLink = page.getByRole('link', { name: /public galaxies/i });
    this.createGalaxyButton = page.getByRole('button', { name: /create.*galaxy/i });

    // Galaxy cards - will need to be more specific based on actual implementation
    this.galaxyCards = page.locator('[data-testid="galaxy-card"]');
  }

  /**
   * Navigate to My Galaxies page
   */
  async gotoMyGalaxies() {
    await super.goto('/my-galaxies');
    await this.waitForLoading();
  }

  /**
   * Navigate to Public Galaxies page
   */
  async gotoPublicGalaxies() {
    await super.goto('/public-galaxies');
    await this.waitForLoading();
  }

  /**
   * Open create galaxy dialog
   */
  async openCreateGalaxyDialog() {
    await this.createGalaxyButton.click();
    await this.page.waitForSelector('.v-dialog--active', { state: 'visible' });
  }

  /**
   * Find galaxy card by title
   */
  getGalaxyCard(title: string): Locator {
    return this.page.locator('[data-testid="galaxy-card"]').filter({ hasText: title });
  }

  /**
   * Click on a galaxy card to open it
   */
  async openGalaxy(title: string) {
    const card = this.getGalaxyCard(title);
    await card.click();
    await this.waitForLoading();
  }

  /**
   * Check if galaxy exists in list
   */
  async galaxyExists(title: string): Promise<boolean> {
    const card = this.getGalaxyCard(title);
    return await card.isVisible().catch(() => false);
  }

  /**
   * Get count of galaxies in list
   */
  async getGalaxyCount(): Promise<number> {
    return await this.galaxyCards.count();
  }

  /**
   * Search for galaxy by title
   */
  async searchGalaxy(searchTerm: string) {
    const searchInput = this.page.getByRole('textbox', { name: /search/i });
    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for search to filter
  }

  /**
   * Get all galaxy titles
   */
  async getAllGalaxyTitles(): Promise<string[]> {
    const cards = await this.galaxyCards.all();
    const titles: string[] = [];

    for (const card of cards) {
      const titleElement = card.locator('[data-testid="galaxy-title"]');
      const title = await titleElement.textContent();
      if (title) {
        titles.push(title);
      }
    }

    return titles;
  }

  /**
   * Delete galaxy from list (via context menu or button)
   */
  async deleteGalaxy(title: string) {
    const card = this.getGalaxyCard(title);

    // Look for delete button within the card
    const deleteButton = card.locator('[data-testid="delete-galaxy-button"]');
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /delete/i }).last();
    await confirmButton.click();

    // Wait for card to disappear
    await card.waitFor({ state: 'detached' });
  }
}
