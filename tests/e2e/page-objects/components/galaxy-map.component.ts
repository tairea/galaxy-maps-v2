import { Page, Locator } from '@playwright/test';

/**
 * Galaxy Map Component - handles vis-network interactions
 *
 * Note: vis-network renders on canvas, so we need to use page.evaluate()
 * to interact with the network API directly.
 */
export class GalaxyMapComponent {
  readonly page: Page;
  readonly canvas: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('canvas.vis-network');
  }

  /**
   * Click at a specific position on the canvas
   */
  async clickAtPosition(x: number, y: number) {
    const bbox = await this.canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // Click relative to canvas position
    await this.canvas.click({
      position: { x, y }
    });
  }

  /**
   * Click on a node by its label/title
   * Uses vis-network API via page.evaluate()
   */
  async clickNode(nodeTitle: string) {
    await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      if (!network) throw new Error('vis-network instance not exposed to window');

      // Find node by label
      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];
      const node = nodeArray.find((n: any) => n.label === title);

      if (!node) throw new Error(`Node "${title}" not found`);

      // Get node position
      const position = network.getPosition(node.id);

      // Simulate click on node
      network.selectNodes([node.id]);
      network.emit('click', {
        nodes: [node.id],
        edges: [],
        pointer: {
          DOM: position,
          canvas: position
        }
      });
    }, nodeTitle);

    // Wait for any UI response
    await this.page.waitForTimeout(500);
  }

  /**
   * Drag between two nodes to create an edge
   */
  async dragBetweenNodes(fromTitle: string, toTitle: string) {
    await this.page.evaluate(({ from, to }) => {
      const network = (window as any).__visNetwork__;
      if (!network) throw new Error('vis-network instance not exposed');

      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];

      const fromNode = nodeArray.find((n: any) => n.label === from);
      const toNode = nodeArray.find((n: any) => n.label === to);

      if (!fromNode || !toNode) {
        throw new Error(`Nodes not found: ${from}, ${to}`);
      }

      // Simulate edge creation
      // Note: This is a simplified approach; actual implementation may vary
      network.selectNodes([fromNode.id]);
      network.emit('dragStart', {
        nodes: [fromNode.id],
        pointer: network.getPosition(fromNode.id)
      });

      network.emit('dragEnd', {
        nodes: [toNode.id],
        pointer: network.getPosition(toNode.id)
      });

      // If network is in addEdgeMode, this should create an edge
      // The actual event handling depends on GalaxyMap.vue implementation
    }, { from: fromTitle, to: toTitle });

    // Wait for edge creation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click on an edge between two nodes
   */
  async clickEdge(fromTitle: string, toTitle: string) {
    await this.page.evaluate(({ from, to }) => {
      const network = (window as any).__visNetwork__;
      const nodes = network.body.data.nodes;
      const edges = network.body.data.edges;

      const nodeArray = Array.from(nodes._data.values()) as any[];
      const edgeArray = Array.from(edges._data.values()) as any[];

      const fromNode = nodeArray.find((n: any) => n.label === from);
      const toNode = nodeArray.find((n: any) => n.label === to);

      if (!fromNode || !toNode) {
        throw new Error(`Nodes not found: ${from}, ${to}`);
      }

      const edge = edgeArray.find(
        (e: any) => e.from === fromNode.id && e.to === toNode.id
      );

      if (!edge) throw new Error(`Edge not found: ${from} -> ${to}`);

      // Select edge
      network.selectEdges([edge.id]);
      network.emit('click', {
        nodes: [],
        edges: [edge.id],
        pointer: {}
      });
    }, { from: fromTitle, to: toTitle });

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
        const nodes = network.body.data.nodes;
        const nodeArray = Array.from(nodes._data.values()) as any[];
        return nodeArray.some((n: any) => n.label === title);
      },
      title,
      { timeout }
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
        const nodes = network.body.data.nodes;
        const nodeArray = Array.from(nodes._data.values()) as any[];
        return !nodeArray.some((n: any) => n.label === title);
      },
      title,
      { timeout }
    );
  }

  /**
   * Check if node exists
   */
  async nodeExists(title: string): Promise<boolean> {
    return await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      if (!network) return false;
      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];
      return nodeArray.some((n: any) => n.label === title);
    }, title);
  }

  /**
   * Check if edge exists between two nodes
   */
  async edgeExists(fromTitle: string, toTitle: string): Promise<boolean> {
    return await this.page.evaluate(({ from, to }) => {
      const network = (window as any).__visNetwork__;
      if (!network) return false;

      const nodes = network.body.data.nodes;
      const edges = network.body.data.edges;

      const nodeArray = Array.from(nodes._data.values()) as any[];
      const edgeArray = Array.from(edges._data.values()) as any[];

      const fromNode = nodeArray.find((n: any) => n.label === from);
      const toNode = nodeArray.find((n: any) => n.label === to);

      if (!fromNode || !toNode) return false;

      return edgeArray.some(
        (e: any) => e.from === fromNode.id && e.to === toNode.id
      );
    }, { from: fromTitle, to: toTitle });
  }

  /**
   * Get total node count
   */
  async getNodeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return 0;
      return network.body.data.nodes.length;
    });
  }

  /**
   * Get total edge count
   */
  async getEdgeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return 0;
      return network.body.data.edges.length;
    });
  }

  /**
   * Drag node to a new position
   */
  async dragNodeTo(nodeTitle: string, position: { x: number; y: number }) {
    await this.page.evaluate(({ title, pos }) => {
      const network = (window as any).__visNetwork__;
      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];
      const node = nodeArray.find((n: any) => n.label === title);

      if (!node) throw new Error(`Node "${title}" not found`);

      // Update node position
      network.moveNode(node.id, pos.x, pos.y);
    }, { title: nodeTitle, pos: position });

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

        const nodes = network.body.data.nodes;
        const edges = network.body.data.edges;

        const nodeArray = Array.from(nodes._data.values()) as any[];
        const edgeArray = Array.from(edges._data.values()) as any[];

        const fromNode = nodeArray.find((n: any) => n.label === from);
        const toNode = nodeArray.find((n: any) => n.label === to);

        if (!fromNode || !toNode) return true;

        return !edgeArray.some(
          (e: any) => e.from === fromNode.id && e.to === toNode.id
        );
      },
      { from: fromTitle, to: toTitle },
      { timeout }
    );
  }

  /**
   * Get node position
   */
  async getNodePosition(nodeTitle: string): Promise<{ x: number; y: number }> {
    return await this.page.evaluate((title) => {
      const network = (window as any).__visNetwork__;
      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];
      const node = nodeArray.find((n: any) => n.label === title);

      if (!node) throw new Error(`Node "${title}" not found`);

      return network.getPosition(node.id);
    }, nodeTitle);
  }

  /**
   * Get all node titles
   */
  async getAllNodeTitles(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const network = (window as any).__visNetwork__;
      if (!network) return [];
      const nodes = network.body.data.nodes;
      const nodeArray = Array.from(nodes._data.values()) as any[];
      return nodeArray.map((n: any) => n.label);
    });
  }
}
