import { Page, Locator } from '@playwright/test';

/**
 * Create/Edit Galaxy Dialog page object
 */
export class CreateGalaxyDialog {
  readonly page: Page;

  // Mode selection
  readonly createManuallyButton: Locator;
  readonly createWithAIButton: Locator;

  // Form fields
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly imageUpload: Locator;

  // Actions
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  // Dialog
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Mode selection
    this.createManuallyButton = page.locator('[data-testid="create-manually-button"]')
      .or(page.getByRole('button', { name: /create manually/i }));
    this.createWithAIButton = page.locator('[data-testid="create-with-ai-button"]')
      .or(page.getByRole('button', { name: /create with ai/i }));

    // Form fields
    this.titleInput = page.locator('[data-testid="galaxy-title-input"]')
      .or(page.getByLabel(/galaxy name/i));
    this.descriptionInput = page.locator('[data-testid="galaxy-description-input"]')
      .or(page.getByLabel(/galaxy description/i));
    this.imageUpload = page.locator('[data-testid="galaxy-image-upload"]')
      .or(page.getByLabel(/upload galaxy image/i));

    // Actions
    this.createButton = page.locator('[data-testid="create-galaxy-button"]')
      .or(page.getByRole('button', { name: /create galaxy/i }));
    this.updateButton = page.getByRole('button', { name: /update/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.deleteButton = page.getByRole('button', { name: /delete/i });

    // Dialog
    this.dialog = page.locator('.v-dialog--active');
  }

  /**
   * Wait for dialog to open
   */
  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for dialog to close
   */
  async waitForClose() {
    await this.dialog.waitFor({ state: 'detached', timeout: 5000 });
  }

  /**
   * Select "Create Manually" mode
   */
  async selectManualMode() {
    await this.createManuallyButton.click();
  }

  /**
   * Select "Create with AI" mode
   */
  async selectAIMode() {
    await this.createWithAIButton.click();
  }

  /**
   * Fill galaxy details
   */
  async fillGalaxyDetails(options: {
    title?: string;
    description?: string;
    image?: string;
  }) {
    if (options.title) {
      await this.titleInput.fill(options.title);
    }

    if (options.description) {
      await this.descriptionInput.fill(options.description);
    }

    if (options.image) {
      await this.imageUpload.setInputFiles(options.image);
    }
  }

  /**
   * Create galaxy (manual mode)
   */
  async createManualGalaxy(options: {
    title: string;
    description?: string;
    image?: string;
  }) {
    await this.selectManualMode();
    await this.fillGalaxyDetails(options);
    await this.createButton.click();
    await this.waitForClose();
  }

  /**
   * Create galaxy with AI
   */
  async createAIGalaxy(prompt: string) {
    await this.selectAIMode();

    // Fill AI prompt
    const aiPromptInput = this.page.getByLabel(/describe your learning journey/i);
    await aiPromptInput.fill(prompt);

    // Click generate
    const generateButton = this.page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Wait for generation to complete (this can take a while)
    await this.page.waitForSelector('[data-testid="generation-complete"]', {
      timeout: 180000 // 3 minutes
    });

    // Save generated galaxy
    await this.createButton.click();
    await this.waitForClose();
  }

  /**
   * Update galaxy
   */
  async updateGalaxy(options: {
    title?: string;
    description?: string;
    image?: string;
  }) {
    await this.fillGalaxyDetails(options);
    await this.updateButton.click();
    await this.waitForClose();
  }

  /**
   * Cancel dialog
   */
  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  /**
   * Delete galaxy
   */
  async delete() {
    await this.deleteButton.click();

    // Confirm deletion in confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /delete/i }).last();
    await confirmButton.click();
    await this.waitForClose();
  }
}
