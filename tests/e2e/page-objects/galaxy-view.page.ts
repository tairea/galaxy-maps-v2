import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { GalaxyMapComponent } from './components/galaxy-map.component';
import { CreateNodeDialog } from './dialogs/create-node.dialog';
import { EdgeInfoPanel } from './components/edge-panel.component';

/**
 * Galaxy View page object for editing galaxy maps
 */
export class GalaxyViewPage extends BasePage {
  // Components
  readonly galaxyMap: GalaxyMapComponent;
  readonly createNodeDialog: CreateNodeDialog;
  readonly edgePanel: EdgeInfoPanel;

  // Buttons
  readonly addNodeButton: Locator;
  readonly connectStarsButton: Locator;
  readonly dragNodeButton: Locator;
  readonly savePositionsButton: Locator;
  readonly cancelPositionsButton: Locator;
  readonly publishButton: Locator;

  // Info displays
  readonly galaxyTitle: Locator;
  readonly galaxyDescription: Locator;

  // Instructions (appear when modes are active)
  readonly addNodeInstruction: Locator;
  readonly connectStarsInstruction: Locator;
  readonly dragInstruction: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize components
    this.galaxyMap = new GalaxyMapComponent(page);
    this.createNodeDialog = new CreateNodeDialog(page);
    this.edgePanel = new EdgeInfoPanel(page);

    // Initialize locators
    this.addNodeButton = page.getByRole('button', { name: /add a new star/i });
    this.connectStarsButton = page.getByRole('button', { name: /connect stars/i });
    this.dragNodeButton = page.getByRole('button', { name: /change star positions/i });
    this.savePositionsButton = page.locator('[data-testid="save-positions"]');
    this.cancelPositionsButton = page.locator('[data-testid="cancel-positions"]');
    this.publishButton = page.getByRole('button', { name: /publish/i });

    this.galaxyTitle = page.locator('[data-testid="galaxy-title"]');
    this.galaxyDescription = page.locator('[data-testid="galaxy-description"]');

    // Instructions
    this.addNodeInstruction = page.locator('[data-testid="add-node-instruction"]');
    this.connectStarsInstruction = page.locator('[data-testid="connect-stars-instruction"]');
    this.dragInstruction = page.locator('[data-testid="drag-instruction"]');
  }

  /**
   * Navigate to galaxy view by ID
   */
  async goto(galaxyId: string) {
    await super.goto(`/galaxy/${galaxyId}`);
    await this.waitForGalaxyToLoad();
  }

  /**
   * Wait for galaxy map to fully load
   */
  async waitForGalaxyToLoad(timeout = 30000) {
    // Wait for vis-network to initialize
    await this.page.waitForSelector('.vis-network', { state: 'visible', timeout });

    // Wait for loading spinner to disappear
    await this.waitForLoading(timeout);
  }

  /**
   * Enable Add Node mode
   */
  async enableAddNodeMode() {
    await this.addNodeButton.click();

    // Verify mode is active
    // The instruction might not always have a data-testid, so use flexible selector
    await this.page.waitForTimeout(500);
  }

  /**
   * Disable Add Node mode
   */
  async disableAddNodeMode() {
    await this.addNodeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Enable Connect Stars mode
   */
  async enableConnectStarsMode() {
    await this.connectStarsButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Disable Connect Stars mode
   */
  async disableConnectStarsMode() {
    await this.connectStarsButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Enable Drag mode
   */
  async enableDragMode() {
    await this.dragNodeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Disable Drag mode
   */
  async disableDragMode() {
    await this.dragNodeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Add a new node to the galaxy
   */
  async addNode(options: {
    title: string;
    position?: { x: number; y: number };
    size?: number;
    color?: string;
    image?: string;
    prerequisites?: string[];
  }) {
    // Enable add node mode
    await this.enableAddNodeMode();

    // Click on canvas to add node
    await this.galaxyMap.clickAtPosition(
      options.position?.x ?? 300,
      options.position?.y ?? 300
    );

    // Wait for dialog to open
    await this.createNodeDialog.waitForOpen();

    // Fill in node details
    await this.createNodeDialog.fillNodeDetails({
      title: options.title,
      size: options.size,
      color: options.color,
      image: options.image,
      prerequisites: options.prerequisites,
    });

    // Save node
    await this.createNodeDialog.save();

    // Wait for node to appear on map
    await this.galaxyMap.waitForNode(options.title);

    // Disable add node mode
    await this.disableAddNodeMode();
  }

  /**
   * Edit an existing node
   */
  async editNode(
    nodeTitle: string,
    updates: Partial<{
      title: string;
      size: number;
      color: string;
      prerequisites: string[];
    }>
  ) {
    // Click on node to select
    await this.galaxyMap.clickNode(nodeTitle);

    // Wait for edit dialog
    await this.createNodeDialog.waitForOpen();

    // Update fields
    await this.createNodeDialog.fillNodeDetails(updates);

    // Click UPDATE
    await this.createNodeDialog.update();

    // Wait for dialog to close
    await this.createNodeDialog.waitForClose();

    // If title was updated, wait for new node
    if (updates.title) {
      await this.galaxyMap.waitForNode(updates.title);
    }
  }

  /**
   * Delete a node
   */
  async deleteNode(nodeTitle: string) {
    // Click on node
    await this.galaxyMap.clickNode(nodeTitle);

    // Wait for dialog
    await this.createNodeDialog.waitForOpen();

    // Click DELETE button
    await this.createNodeDialog.clickDelete();

    // Confirm deletion
    await this.createNodeDialog.confirmDelete();

    // Wait for node to disappear
    await this.galaxyMap.waitForNodeToDisappear(nodeTitle);
  }

  /**
   * Create edge between two nodes
   */
  async connectNodes(fromTitle: string, toTitle: string) {
    // Enable connect mode
    await this.enableConnectStarsMode();

    // Create edge
    await this.galaxyMap.dragBetweenNodes(fromTitle, toTitle);

    // Wait for edge to be created (Firestore write)
    await this.page.waitForTimeout(1000);

    // Disable connect mode
    await this.disableConnectStarsMode();
  }

  /**
   * Delete edge between two nodes
   */
  async deleteEdge(fromTitle: string, toTitle: string) {
    // Click on edge
    await this.galaxyMap.clickEdge(fromTitle, toTitle);

    // Wait for edge panel to open
    await this.edgePanel.waitForOpen();

    // Click delete
    await this.edgePanel.deleteEdge();

    // Wait for edge to disappear
    await this.galaxyMap.waitForEdgeToDisappear(fromTitle, toTitle);
  }

  /**
   * Drag node to new position
   */
  async dragNode(nodeTitle: string, toPosition: { x: number; y: number }) {
    await this.enableDragMode();
    await this.galaxyMap.dragNodeTo(nodeTitle, toPosition);
  }

  /**
   * Save node positions after dragging
   */
  async saveNodePositions() {
    await this.savePositionsButton.click();
    // Wait for save to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Cancel node position changes
   */
  async cancelNodePositions() {
    await this.cancelPositionsButton.click();
  }

  /**
   * Get count of nodes in galaxy
   */
  async getNodeCount(): Promise<number> {
    return await this.galaxyMap.getNodeCount();
  }

  /**
   * Get count of edges in galaxy
   */
  async getEdgeCount(): Promise<number> {
    return await this.galaxyMap.getEdgeCount();
  }

  /**
   * Verify node exists on map
   */
  async verifyNodeExists(title: string): Promise<boolean> {
    return await this.galaxyMap.nodeExists(title);
  }

  /**
   * Verify edge exists between two nodes
   */
  async verifyEdgeExists(fromTitle: string, toTitle: string): Promise<boolean> {
    return await this.galaxyMap.edgeExists(fromTitle, toTitle);
  }

  /**
   * Get galaxy title from page
   */
  async getGalaxyTitle(): Promise<string> {
    return await this.getText(this.galaxyTitle);
  }

  /**
   * Get galaxy description from page
   */
  async getGalaxyDescription(): Promise<string> {
    return await this.getText(this.galaxyDescription);
  }

  /**
   * Publish galaxy
   */
  async publishGalaxy() {
    await this.publishButton.click();

    // Wait for confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|publish/i });
    await confirmButton.click();

    // Wait for success message
    await this.waitForSnackbar();
  }
}
