import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { GalaxyMapComponent } from "./components/galaxy-map.component";
import { CreateNodeDialog } from "./dialogs/create-node.dialog";
import { EdgeInfoPanel } from "./components/edge-panel.component";

/**
 * Galaxy View page object for editing galaxy maps
 */
export class GalaxyViewPage extends BasePage {
  // Components
  readonly galaxyMap: GalaxyMapComponent;
  readonly createNodeDialog: CreateNodeDialog;
  readonly edgePanel: EdgeInfoPanel;

  // Buttons
  readonly editStarsToggle: Locator;
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
    // Note: These are div elements with click handlers, not semantic buttons
    this.editStarsToggle = page.getByText(/add\/edit stars/i); // Top panel toggle
    this.addNodeButton = page.getByText(/add a new star/i); // Bottom toolbar
    this.connectStarsButton = page.getByText(/connect stars/i);
    this.dragNodeButton = page.getByText(/change star positions/i);
    this.savePositionsButton = page.locator('[data-testid="save-positions"]');
    this.cancelPositionsButton = page.locator('[data-testid="cancel-positions"]');
    this.publishButton = page.getByRole("button", { name: /publish/i });

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
    // Listen to console logs and errors
    this.page.on("console", (msg) => {
      const text = msg.text();
      const type = msg.type();

      // Log all warnings and errors
      if (type === "warning" || type === "error") {
        console.log(`[Browser ${type.toUpperCase()}] ${text}`);
      }

      // Log debug messages
      if (
        text.includes("[E2E Debug]") ||
        text.includes("currentCourseId") ||
        text.includes("refreshData") ||
        text.includes("bindCourseNodes")
      ) {
        console.log(`[Browser Console] ${text}`);
      }
    });

    // Listen to page errors
    this.page.on("pageerror", (error) => {
      console.log(`[Browser Page Error] ${error.message}`);
    });

    await super.goto(`/galaxy/${galaxyId}`);
    await this.waitForGalaxyToLoad();
  }

  /**
   * Wait for galaxy map to fully load
   */
  async waitForGalaxyToLoad(timeout = 30000) {
    // Wait for loading spinner to disappear first
    await this.waitForLoading(timeout);

    // Debug: Log current state periodically while waiting
    const debugInterval = setInterval(async () => {
      try {
        await this.page.evaluate(() => {
          console.log("[E2E Debug] Checking galaxy load state");
          console.log("[E2E Debug] __visNetwork__ exists:", !!(window as any).__visNetwork__);
          const network = (window as any).__visNetwork__;
          if (network) {
            console.log("[E2E Debug] network.nodes length:", network.nodes?.length ?? 0);
            console.log(
              "[E2E Debug] network.visData.nodes length:",
              network.visData?.nodes?.length ?? 0,
            );
          }
        });
      } catch {
        // Page might be navigating, ignore errors
      }
    }, 2000);

    try {
      // Wait for vis-network to initialize
      // The network component exposes visData.nodes which is the DataSet
      console.log("[GalaxyViewPage] Waiting for vis-network to initialize...");
      await this.page.waitForFunction(
        () => {
          const network = (window as any).__visNetwork__;
          console.log("[GalaxyViewPage] Checking network:", {
            exists: !!network,
            type: typeof network,
            keys: network ? Object.keys(network) : [],
          });

          if (!network) {
            console.log("[GalaxyViewPage] __visNetwork__ not found yet");
            return false;
          }

          // Check visData.nodes (DataSet) which has getIds() method
          const nodes = network.visData?.nodes;
          console.log("[GalaxyViewPage] Checking nodes:", {
            hasVisData: !!network.visData,
            hasNodes: !!nodes,
            nodesType: typeof nodes,
            hasGetIds: nodes && typeof nodes.getIds === "function",
          });

          if (nodes && typeof nodes.getIds === "function") {
            const nodeCount = nodes.getIds().length;
            console.log("[E2E Debug] DataSet node count:", nodeCount);
            if (nodeCount > 0) {
              console.log("[GalaxyViewPage] Network ready with", nodeCount, "nodes!");
            }
            return nodeCount > 0;
          }

          // Fallback: check nodes array directly
          if (network.nodes && network.nodes.length > 0) {
            console.log(
              "[GalaxyViewPage] Network ready with",
              network.nodes.length,
              "nodes (array)!",
            );
            return true;
          }

          console.log("[GalaxyViewPage] Network exists but no nodes yet");
          return false;
        },
        { timeout, polling: 500 },
      );

      // Wait for canvas to be visible
      console.log("[GalaxyViewPage] Waiting for .vis-network container...");
      await this.page.waitForSelector(".vis-network", { state: "visible", timeout: 5000 });
      console.log("[GalaxyViewPage] .vis-network container is visible!");

      // Verify __visNetwork__ is still available after waiting
      const networkStillAvailable = await this.page.evaluate(() => {
        const network = (window as any).__visNetwork__;
        return {
          available: !!network,
          hasNetwork: !!network?.network,
          hasVisData: !!network?.visData,
        };
      });
      console.log("[GalaxyViewPage] Final network check:", networkStillAvailable);
    } finally {
      clearInterval(debugInterval);
    }
  }

  /**
   * Enable Add Node mode
   */
  async enableAddNodeMode() {
    // First ensure edit toolbar is visible
    const isEditToolbarVisible = await this.addNodeButton.isVisible().catch(() => false);
    if (!isEditToolbarVisible) {
      await this.editStarsToggle.click();
      await this.page.waitForTimeout(300);
    }

    // Then click "Add a new Star" button in the bottom toolbar
    await this.addNodeButton.click();

    // Verify mode is active
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
    // First ensure edit toolbar is visible
    const isEditToolbarVisible = await this.connectStarsButton.isVisible().catch(() => false);
    if (!isEditToolbarVisible) {
      await this.editStarsToggle.click();
      await this.page.waitForTimeout(300);
    }

    // Click the "Connect Stars" button
    await this.connectStarsButton.click();

    // Wait for addEdgeMode to be active
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__galaxyMapState__;
        if (!state) return false;
        return state.addingEdge === true;
      },
      { timeout: 5000, polling: 200 },
    );

    await this.page.waitForTimeout(300);
  }

  /**
   * Disable Connect Stars mode
   */
  async disableConnectStarsMode() {
    await this.connectStarsButton.click();

    // Wait for addEdgeMode to be inactive
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__galaxyMapState__;
        if (!state) return true; // If state doesn't exist, consider it disabled
        return state.addingEdge !== true;
      },
      { timeout: 5000, polling: 200 },
    );

    await this.page.waitForTimeout(200);
  }

  /**
   * Enable Drag mode
   */
  async enableDragMode() {
    // First ensure edit toolbar is visible
    const isEditToolbarVisible = await this.dragNodeButton.isVisible().catch(() => false);
    if (!isEditToolbarVisible) {
      await this.editStarsToggle.click();
      await this.page.waitForTimeout(300);
    }

    // Click the "Change Star Positions" button
    await this.dragNodeButton.click();

    // Wait for draggingNodes to be active
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__galaxyMapState__;
        if (!state) return false;
        return state.draggingNodes === true;
      },
      { timeout: 5000, polling: 200 },
    );

    await this.page.waitForTimeout(300);
  }

  /**
   * Disable Drag mode
   */
  async disableDragMode() {
    await this.dragNodeButton.click();

    // Wait for draggingNodes to be inactive
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__galaxyMapState__;
        if (!state) return true; // If state doesn't exist, consider it disabled
        return state.draggingNodes !== true;
      },
      { timeout: 5000, polling: 200 },
    );

    await this.page.waitForTimeout(200);
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

    // Small delay to ensure state propagates and addNodeMode is activated
    await this.page.waitForTimeout(500);

    // Verify addNodeMode is active by checking Vue component's addingNode flag
    // This is more reliable than checking vis-network's internal editMode property
    await this.page.waitForFunction(
      () => {
        const network = (window as any).__visNetwork__;
        const state = (window as any).__galaxyMapState__;

        console.log("[GalaxyViewPage] Checking addNodeMode state:", {
          hasNetwork: !!network,
          hasNetworkNetwork: !!network?.network,
          hasState: !!state,
          stateValue: state,
          stateKeys: state ? Object.keys(state) : [],
          addingNode: state?.addingNode,
          addingEdge: state?.addingEdge,
          draggingNodes: state?.draggingNodes,
        });

        if (!network || !network.network) {
          console.log("[GalaxyViewPage] Network not available");
          return false;
        }

        // Check Vue component's addingNode flag (most reliable)
        // If state isn't available yet, wait a bit more
        if (!state) {
          console.log("[GalaxyViewPage] State not available yet");
          return false;
        }

        const addingNode = state.addingNode === true;

        // Also verify canvas is ready
        const visNetwork = network.network;
        const hasCanvas = !!visNetwork.canvas?.frame?.canvas;

        console.log("[GalaxyViewPage] Final check:", {
          addingNode,
          hasCanvas,
          isReady: addingNode && hasCanvas,
        });

        return addingNode && hasCanvas;
      },
      { timeout: 5000, polling: 200 },
    );

    // Click on canvas to add node
    // Set third parameter to true to pause and manually click for debugging
    await this.galaxyMap.clickAtPosition(
      options.position?.x ?? 450,
      options.position?.y ?? 450,
      false, // Set to true to pause and manually click to capture events
    );

    // Wait for dialog to open (increase timeout since click might take time to process)
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

    // Ensure dialog is fully closed before returning (allows animations to complete)
    await this.createNodeDialog.waitForClose().catch(() => {
      // Dialog might already be closed, continue
    });

    // Small delay to ensure any animations complete and canvas is ready for next interaction
    await this.page.waitForTimeout(300);
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
    }>,
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
    const confirmButton = this.page.getByRole("button", { name: /confirm|publish/i });
    await confirmButton.click();

    // Wait for success message
    await this.waitForSnackbar();
  }
}
