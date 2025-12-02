import { Page, Locator } from "@playwright/test";

/**
 * Create/Edit Node Dialog page object
 */
export class CreateNodeDialog {
  readonly page: Page;

  // Form fields
  readonly titleInput: Locator;
  readonly imageUpload: Locator;
  readonly sizeInput: Locator;
  readonly colorPicker: Locator;
  readonly prerequisitesCheckbox: Locator;
  readonly prerequisitesSelect: Locator;

  // Actions
  readonly saveButton: Locator;
  readonly updateButton: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;

  // Confirmation dialog (for delete)
  readonly confirmDeleteInput: Locator;
  readonly confirmDeleteButton: Locator;

  // Dialog
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form fields
    this.titleInput = page
      .locator('[data-testid="node-title-input"]')
      .or(page.getByLabel(/node title/i));
    this.imageUpload = page
      .locator('[data-testid="node-image-upload"]')
      .or(page.getByLabel(/node image/i));
    this.sizeInput = page
      .locator('[data-testid="node-size-input"]')
      .or(page.getByLabel(/node size/i));
    this.colorPicker = page.locator(".v-color-picker");
    this.prerequisitesCheckbox = page
      .locator('[data-testid="prerequisites-checkbox"]')
      .or(page.getByLabel(/does another node/i));
    this.prerequisitesSelect = page.locator('[data-testid="prerequisites-select"]');

    // Actions
    this.saveButton = page
      .locator('[data-testid="save-node-button"]')
      .or(page.getByRole("button", { name: /^save$/i }));
    this.updateButton = page
      .locator('[data-testid="update-node-button"]')
      .or(page.getByRole("button", { name: /^update$/i }));
    this.deleteButton = page
      .locator('[data-testid="delete-node-button"]')
      .or(page.getByRole("button", { name: /^delete$/i }));
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Confirmation dialog
    this.confirmDeleteInput = page.getByPlaceholder(/destroy/i);
    this.confirmDeleteButton = page.getByRole("button", { name: /delete/i }).last();

    // Dialog
    this.dialog = page.locator(".v-dialog--active");
  }

  /**
   * Wait for dialog to open
   */
  async waitForOpen(timeout = 10000) {
    await this.dialog.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for dialog to close
   */
  async waitForClose() {
    await this.dialog.waitFor({ state: "detached", timeout: 5000 });
  }

  /**
   * Fill node details
   */
  async fillNodeDetails(options: {
    title?: string;
    size?: number;
    color?: string;
    image?: string;
    prerequisites?: string[];
  }) {
    if (options.title !== undefined) {
      await this.titleInput.clear();
      await this.titleInput.fill(options.title);
    }

    if (options.size !== undefined) {
      await this.sizeInput.clear();
      await this.sizeInput.fill(options.size.toString());
    }

    if (options.color !== undefined) {
      // Color picker interaction is complex, may need custom logic
      // For now, skip or implement basic color selection
    }

    if (options.image !== undefined) {
      await this.imageUpload.setInputFiles(options.image);
    }

    if (options.prerequisites !== undefined && options.prerequisites.length > 0) {
      // Enable prerequisites checkbox
      const isChecked = await this.prerequisitesCheckbox.isChecked();
      if (!isChecked) {
        // Use force: true to bypass ripple overlay that intercepts pointer events
        await this.prerequisitesCheckbox.click({ force: true });
      }

      // Select prerequisites
      for (const prereq of options.prerequisites) {
        // Reopen dropdown for each selection (it closes automatically after each option is selected)
        await this.prerequisitesSelect.click();

        // Use getByRole with exact: true to match exact text, not substring
        // This prevents "A" from matching "Empty Test Galaxy Intro"
        const option = this.page.getByRole("option", { name: prereq, exact: true });
        await option.click();
        // Note: Dropdown closes automatically after each selection
      }
    }
  }

  /**
   * Save node (for create)
   */
  async save() {
    await this.saveButton.click();
    await this.waitForClose();
  }

  /**
   * Update node (for edit)
   */
  async update() {
    await this.updateButton.click();
    await this.waitForClose();
  }

  /**
   * Click delete button (opens confirmation dialog)
   */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /**
   * Confirm delete action
   */
  async confirmDelete() {
    // Wait for confirmation dialog
    await this.confirmDeleteInput.waitFor({ state: "visible" });

    // Type "DESTROY"
    await this.confirmDeleteInput.fill("DESTROY");

    // Click confirm delete
    await this.confirmDeleteButton.click();

    // Wait for dialog to close
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel dialog
   */
  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  /**
   * Create node with details
   */
  async createNode(options: {
    title: string;
    size?: number;
    color?: string;
    image?: string;
    prerequisites?: string[];
  }) {
    await this.fillNodeDetails(options);
    await this.save();
  }

  /**
   * Update existing node
   */
  async updateNode(options: {
    title?: string;
    size?: number;
    color?: string;
    prerequisites?: string[];
  }) {
    await this.fillNodeDetails(options);
    await this.update();
  }

  /**
   * Delete node with confirmation
   */
  async deleteNode() {
    await this.clickDelete();
    await this.confirmDelete();
  }
}
