import { Page, Locator } from "@playwright/test";

/**
 * Galaxy Map Component - handles vis-network interactions
 *
 * Note: vis-network renders on canvas, so we need to use page.evaluate()
 * to interact with the network API directly.
 */
export class GalaxyMapComponent {
  readonly page: Page;
  readonly canvas: Locator;
  readonly container: Locator;

  constructor(page: Page) {
    this.page = page;
    // vis-network creates a container div with class "vis-network" and a canvas inside it
    // Selector should be ".vis-network canvas" (canvas descendant of vis-network container)
    this.canvas = page.locator(".vis-network canvas");
    // Fallback: container div (vis-network handles clicks on container too)
    this.container = page.locator(".vis-network");
  }

  /**
   * Click at a specific position on the canvas
   * When in addNodeMode, this should trigger vis-network's addNode event
   *
   * IMPORTANT: This method uses Playwright's native click() with force: true to generate
   * trusted events (isTrusted: true) that vis-network's manipulation system requires.
   *
   * Why trusted events are needed:
   * - vis-network's manipulation system only processes trusted browser events
   * - Synthetic JavaScript events (new MouseEvent()) have isTrusted: false and are ignored
   * - Playwright's native click() generates trusted events that vis-network recognizes
   *
   * Position considerations:
   * - Avoid positions with x < 450 to prevent clicks from being intercepted by the
   *   left-section overlay (z-index: 3) which covers the canvas (z-index: 1)
   * - CANVAS_POSITIONS constants are already configured with x >= 450 for left-side positions
   * - force: true bypasses actionability checks and ensures clicks reach the canvas
   */
  async clickAtPosition(x: number, y: number, pauseForManualClick = false) {
    console.log("[GalaxyMapComponent] Starting clickAtPosition at", { x, y });

    // Check if page is still alive before proceeding
    if (this.page.isClosed()) {
      throw new Error("Page has been closed");
    }

    // Wait for network to be ready
    await this.page.waitForFunction(() => !!(window as any).__visNetwork__, { timeout: 15000 });

    // Check if page is still alive
    if (this.page.isClosed()) {
      throw new Error("Page has been closed while waiting for network");
    }

    // Wait for canvas to be visible
    await this.canvas.waitFor({ state: "visible", timeout: 10000 });

    // Check if page is still alive
    if (this.page.isClosed()) {
      throw new Error("Page has been closed while waiting for canvas");
    }

    // Get canvas bounding box
    const canvasBbox = await this.canvas.boundingBox();
    if (!canvasBbox) {
      throw new Error("Canvas bounding box not available");
    }

    if (canvasBbox.width === 0 || canvasBbox.height === 0) {
      throw new Error(`Canvas has zero dimensions: ${JSON.stringify(canvasBbox)}`);
    }

    // Calculate absolute coordinates relative to viewport
    const absoluteX = canvasBbox.x + x;
    const absoluteY = canvasBbox.y + y;

    console.log("[GalaxyMapComponent] Click coordinates:", {
      relative: { x, y },
      absolute: { x: absoluteX, y: absoluteY },
      canvasBbox,
    });

    // DEBUG: Capture manual click events to see what makes it work
    if (pauseForManualClick) {
      console.log("[GalaxyMapComponent] Setting up click event capture...");

      // Set up event listeners to capture click details
      await this.page.evaluate(() => {
        (window as any).__capturedClicks = [];

        const captureClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const data = {
            type: e.type,
            clientX: e.clientX,
            clientY: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            offsetX: (e as any).offsetX,
            offsetY: (e as any).offsetY,
            target: {
              tagName: target?.tagName,
              className: target?.className,
              id: target?.id,
            },
            currentTarget: {
              tagName: (e.currentTarget as HTMLElement)?.tagName,
              className: (e.currentTarget as HTMLElement)?.className,
            },
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: e.defaultPrevented,
          };
          (window as any).__capturedClicks.push(data);
          console.log("[Captured Click]", data);
        };

        // Add listeners in capture phase to catch all events
        document.addEventListener("click", captureClick, true);
        document.addEventListener("mousedown", captureClick, true);
        document.addEventListener("mouseup", captureClick, true);

        const canvas = document.querySelector(".vis-network canvas");
        const container = document.querySelector(".vis-network");

        if (canvas) {
          canvas.addEventListener("click", captureClick, true);
          canvas.addEventListener("mousedown", captureClick, true);
          canvas.addEventListener("mouseup", captureClick, true);
        }

        if (container) {
          container.addEventListener("click", captureClick, true);
          container.addEventListener("mousedown", captureClick, true);
          container.addEventListener("mouseup", captureClick, true);
        }
      });

      console.log("[GalaxyMapComponent] PAUSED - Click on the canvas manually");
      console.log("[GalaxyMapComponent] Target position:", { x, y });
      console.log(
        "[GalaxyMapComponent] After clicking, check browser console for '[Captured Click]' logs",
      );
      console.log("[GalaxyMapComponent] Events will be logged to browser console as you click");

      // Pause - user can manually click and see events in browser console
      // The events are logged to browser console in real-time via console.log in the capture function
      await this.page.pause();

      // After pause, get the captured clicks and log them
      const capturedClicks = await this.page.evaluate(() => {
        const clicks = (window as any).__capturedClicks || [];
        // Also log to browser console for visibility
        console.log("[All Captured Clicks]", clicks);
        return clicks;
      });

      console.log("[GalaxyMapComponent] Total captured click events:", capturedClicks.length);
      if (capturedClicks.length > 0) {
        console.log(
          "[GalaxyMapComponent] Captured click events:",
          JSON.stringify(capturedClicks, null, 2),
        );
      } else {
        console.log(
          "[GalaxyMapComponent] No click events were captured. Make sure you clicked while paused.",
        );
      }

      // Exit - don't run automated click after manual click
      return;
    }

    // Use Playwright's native click on canvas element
    // This generates trusted events (isTrusted: true) that vis-network's manipulation
    // system requires to detect clicks and trigger the nodes-add event.
    // force: true bypasses overlay interception (left-section overlay) and ensures
    // clicks go directly to the canvas element.
    await this.canvas.click({
      position: { x, y },
      force: true, // Critical: bypasses overlays and generates trusted events
      timeout: 5000,
    });

    // Wait for vis-network to process the click and emit nodes-add event
    await this.page.waitForTimeout(500);
  }

  /**
   * Click on a node by its label/title
   * Uses vis-network API via page.evaluate()
   */
  async clickNode(nodeTitle: string) {
    await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      if (!network) throw new Error("vis-network instance not exposed to window");

      // Get nodes from visData.nodes (DataSet) - the correct API
      let nodes: any[] = [];
      if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
        nodes = network.visData.nodes.get();
      } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
        nodes = network.nodesArray;
      } else {
        throw new Error("Cannot access nodes from vis-network");
      }

      const node = nodes.find((n: any) => n.label === title);
      if (!node) throw new Error(`Node "${title}" not found`);

      // Get node position - use network.network if available (raw vis-network instance)
      const visNetwork = network.network || network;
      const position = visNetwork.getPosition(node.id);

      // Simulate click on node
      visNetwork.selectNodes([node.id]);
      visNetwork.emit("click", {
        nodes: [node.id],
        edges: [],
        pointer: {
          DOM: position,
          canvas: position,
        },
      });
    }, nodeTitle);

    // Wait for any UI response
    await this.page.waitForTimeout(500);
  }

  /**
   * Drag between two nodes to create an edge
   */
  async dragBetweenNodes(fromTitle: string, toTitle: string) {
    await this.page.evaluate(
      ({ from, to }) => {
        const network = (window as any).__visNetwork__;
        if (!network) throw new Error("vis-network instance not exposed");

        // Get nodes from visData.nodes (DataSet) - the correct API
        let nodes: any[] = [];
        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          nodes = network.visData.nodes.get();
        } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
          nodes = network.nodesArray;
        } else {
          throw new Error("Cannot access nodes from vis-network");
        }

        const fromNode = nodes.find((n: any) => n.label === from);
        const toNode = nodes.find((n: any) => n.label === to);

        if (!fromNode || !toNode) {
          throw new Error(`Nodes not found: ${from}, ${to}`);
        }

        // Get raw vis-network instance
        const visNetwork = network.network || network;

        // Simulate edge creation
        // Note: This is a simplified approach; actual implementation may vary
        visNetwork.selectNodes([fromNode.id]);
        visNetwork.emit("dragStart", {
          nodes: [fromNode.id],
          pointer: visNetwork.getPosition(fromNode.id),
        });

        visNetwork.emit("dragEnd", {
          nodes: [toNode.id],
          pointer: visNetwork.getPosition(toNode.id),
        });

        // If network is in addEdgeMode, this should create an edge
        // The actual event handling depends on GalaxyMap.vue implementation
      },
      { from: fromTitle, to: toTitle },
    );

    // Wait for edge creation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click on an edge between two nodes
   */
  async clickEdge(fromTitle: string, toTitle: string) {
    await this.page.evaluate(
      ({ from, to }) => {
        const network = (window as any).__visNetwork__;
        if (!network) throw new Error("vis-network instance not exposed");

        // Get nodes and edges from visData (DataSet) - the correct API
        let nodes: any[] = [];
        let edges: any[] = [];

        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          nodes = network.visData.nodes.get();
        } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
          nodes = network.nodesArray;
        } else {
          throw new Error("Cannot access nodes from vis-network");
        }

        if (network.visData?.edges && typeof network.visData.edges.get === "function") {
          edges = network.visData.edges.get();
        } else if (network.edgesArray && Array.isArray(network.edgesArray)) {
          edges = network.edgesArray;
        } else {
          throw new Error("Cannot access edges from vis-network");
        }

        const fromNode = nodes.find((n: any) => n.label === from);
        const toNode = nodes.find((n: any) => n.label === to);

        if (!fromNode || !toNode) {
          throw new Error(`Nodes not found: ${from}, ${to}`);
        }

        const edge = edges.find((e: any) => e.from === fromNode.id && e.to === toNode.id);

        if (!edge) throw new Error(`Edge not found: ${from} -> ${to}`);

        // Get raw vis-network instance
        const visNetwork = network.network || network;

        // Select edge
        visNetwork.selectEdges([edge.id]);
        visNetwork.emit("click", {
          nodes: [],
          edges: [edge.id],
          pointer: {},
        });
      },
      { from: fromTitle, to: toTitle },
    );

    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for a node with specific title to appear
   */
  async waitForNode(title: string, timeout = 5000) {
    await this.page.waitForFunction(
      (title) => {
        const network = (window as any).__visNetwork__;
        if (!network) return false;

        // Use visData.nodes (DataSet) - the correct API
        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          const nodes = network.visData.nodes.get();
          return Array.isArray(nodes) && nodes.some((n: any) => n.label === title);
        }

        // Fallback: check nodesArray if available (Vue component computed property)
        if (network.nodesArray && Array.isArray(network.nodesArray)) {
          return network.nodesArray.some((n: any) => n.label === title);
        }

        return false;
      },
      title,
      { timeout },
    );
  }

  /**
   * Wait for a node to disappear
   */
  async waitForNodeToDisappear(title: string, timeout = 5000) {
    await this.page.waitForFunction(
      (title) => {
        const network = (window as any).__visNetwork__;
        if (!network) return true;

        // Use visData.nodes (DataSet) - the correct API
        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          const nodes = network.visData.nodes.get();
          return !Array.isArray(nodes) || !nodes.some((n: any) => n.label === title);
        }

        // Fallback: check nodesArray if available
        if (network.nodesArray && Array.isArray(network.nodesArray)) {
          return !network.nodesArray.some((n: any) => n.label === title);
        }

        return true;
      },
      title,
      { timeout },
    );
  }

  /**
   * Check if node exists
   */
  async nodeExists(title: string): Promise<boolean> {
    return await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      if (!network) return false;

      // Use visData.nodes (DataSet) - the correct API
      if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
        const nodes = network.visData.nodes.get();
        return Array.isArray(nodes) && nodes.some((n: any) => n.label === title);
      }

      // Fallback: check nodesArray if available
      if (network.nodesArray && Array.isArray(network.nodesArray)) {
        return network.nodesArray.some((n: any) => n.label === title);
      }

      return false;
    }, title);
  }

  /**
   * Check if edge exists between two nodes
   */
  async edgeExists(fromTitle: string, toTitle: string): Promise<boolean> {
    return await this.page.evaluate(
      ({ from, to }) => {
        const network = (window as any).__visNetwork__;
        if (!network) return false;

        // Get nodes and edges from visData (DataSet) - the correct API
        let nodes: any[] = [];
        let edges: any[] = [];

        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          nodes = network.visData.nodes.get();
        } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
          nodes = network.nodesArray;
        } else {
          return false;
        }

        if (network.visData?.edges && typeof network.visData.edges.get === "function") {
          edges = network.visData.edges.get();
        } else if (network.edgesArray && Array.isArray(network.edgesArray)) {
          edges = network.edgesArray;
        } else {
          return false;
        }

        const fromNode = nodes.find((n: any) => n.label === from);
        const toNode = nodes.find((n: any) => n.label === to);

        if (!fromNode || !toNode) return false;

        return edges.some((e: any) => e.from === fromNode.id && e.to === toNode.id);
      },
      { from: fromTitle, to: toTitle },
    );
  }

  /**
   * Get total node count
   */
  async getNodeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return 0;

      // vis-network stores nodes in visData.nodes as a DataSet
      if (network.visData?.nodes && typeof network.visData.nodes.getIds === "function") {
        return network.visData.nodes.getIds().length;
      }

      // Fallback: check nodesArray (Vue component computed property)
      if (network.nodesArray && Array.isArray(network.nodesArray)) {
        return network.nodesArray.length;
      }

      // Fallback: check nodes array directly
      if (network.nodes && Array.isArray(network.nodes)) {
        return network.nodes.length;
      }

      return 0;
    });
  }

  /**
   * Get total edge count
   */
  async getEdgeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return 0;

      // vis-network stores edges in visData.edges as a DataSet
      if (network.visData?.edges && typeof network.visData.edges.getIds === "function") {
        return network.visData.edges.getIds().length;
      }

      // Fallback: check edgesArray (Vue component computed property)
      if (network.edgesArray && Array.isArray(network.edgesArray)) {
        return network.edgesArray.length;
      }

      // Fallback: check edges array directly
      if (network.edges && Array.isArray(network.edges)) {
        return network.edges.length;
      }

      return 0;
    });
  }

  /**
   * Drag node to a new position
   */
  async dragNodeTo(nodeTitle: string, position: { x: number; y: number }) {
    await this.page.evaluate(
      ({ title, pos }) => {
        const network = (window as any).__visNetwork__;
        if (!network) throw new Error("vis-network instance not exposed");

        // Get nodes from visData.nodes (DataSet) - the correct API
        let nodes: any[] = [];
        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          nodes = network.visData.nodes.get();
        } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
          nodes = network.nodesArray;
        } else {
          throw new Error("Cannot access nodes from vis-network");
        }

        const node = nodes.find((n: any) => n.label === title);
        if (!node) throw new Error(`Node "${title}" not found`);

        // Get raw vis-network instance
        const visNetwork = network.network || network;

        // Update node position
        visNetwork.moveNode(node.id, pos.x, pos.y);
      },
      { title: nodeTitle, pos: position },
    );

    await this.page.waitForTimeout(300);
  }

  /**
   * Wait for edge to disappear
   */
  async waitForEdgeToDisappear(fromTitle: string, toTitle: string, timeout = 5000) {
    await this.page.waitForFunction(
      ({ from, to }) => {
        const network = (window as any).__visNetwork__;
        if (!network) return true;

        // Get nodes and edges from visData (DataSet) - the correct API
        let nodes: any[] = [];
        let edges: any[] = [];

        if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
          nodes = network.visData.nodes.get();
        } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
          nodes = network.nodesArray;
        } else {
          return true;
        }

        if (network.visData?.edges && typeof network.visData.edges.get === "function") {
          edges = network.visData.edges.get();
        } else if (network.edgesArray && Array.isArray(network.edgesArray)) {
          edges = network.edgesArray;
        } else {
          return true;
        }

        const fromNode = nodes.find((n: any) => n.label === from);
        const toNode = nodes.find((n: any) => n.label === to);

        if (!fromNode || !toNode) return true;

        return !edges.some((e: any) => e.from === fromNode.id && e.to === toNode.id);
      },
      { from: fromTitle, to: toTitle },
      { timeout },
    );
  }

  /**
   * Get node position
   */
  async getNodePosition(nodeTitle: string): Promise<{ x: number; y: number }> {
    return await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      if (!network) throw new Error("vis-network instance not exposed");

      // Get nodes from visData.nodes (DataSet) - the correct API
      let nodes: any[] = [];
      if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
        nodes = network.visData.nodes.get();
      } else if (network.nodesArray && Array.isArray(network.nodesArray)) {
        nodes = network.nodesArray;
      } else {
        throw new Error("Cannot access nodes from vis-network");
      }

      const node = nodes.find((n: any) => n.label === title);
      if (!node) throw new Error(`Node "${title}" not found`);

      // Get raw vis-network instance
      const visNetwork = network.network || network;

      return visNetwork.getPosition(node.id);
    }, nodeTitle);
  }

  /**
   * Get all node titles
   */
  async getAllNodeTitles(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return [];

      // Use visData.nodes (DataSet) - the correct API
      if (network.visData?.nodes && typeof network.visData.nodes.get === "function") {
        const nodes = network.visData.nodes.get();
        return Array.isArray(nodes) ? nodes.map((n: any) => n.label || "").filter(Boolean) : [];
      }

      // Fallback: check nodesArray if available
      if (network.nodesArray && Array.isArray(network.nodesArray)) {
        return network.nodesArray.map((n: any) => n.label || "").filter(Boolean);
      }

      return [];
    });
  }
}
