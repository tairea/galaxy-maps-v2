import { Page, Locator } from '@playwright/test';

/**
 * Edge Info Panel Component - appears when an edge is selected
 */
export class EdgeInfoPanel {
  readonly page: Page;

  // Panel
  readonly panel: Locator;

  // Buttons
  readonly deleteEdgeButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Panel (fixed position on right side of screen)
    this.panel = page.locator('[data-testid="edge-info-panel"]')
      .or(page.locator('.edge-info-panel'));

    // Buttons
    this.deleteEdgeButton = page.locator('[data-testid="delete-edge-button"]')
      .or(page.getByRole('button', { name: /delete edge/i }));
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  /**
   * Wait for panel to open
   */
  async waitForOpen() {
    await this.panel.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for panel to close
   */
  async waitForClose() {
    await this.panel.waitFor({ state: 'detached', timeout: 5000 });
  }

  /**
   * Check if panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Delete the selected edge
   */
  async deleteEdge() {
    await this.deleteEdgeButton.click();

    // Wait for panel to close
    await this.waitForClose();
  }

  /**
   * Cancel and close panel
   */
  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }
}
