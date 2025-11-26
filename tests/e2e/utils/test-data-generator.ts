/**
 * Test Data Generator - Factory methods for creating test data
 */

/**
 * Galaxy Builder - Fluent API for building galaxy test data
 */
export class GalaxyBuilder {
  private galaxyData = {
    title: 'Test Galaxy',
    description: 'A test galaxy for automated testing',
    status: 'drafting' as 'drafting' | 'published',
    nodes: [] as Array<{
      id: string;
      label: string;
      x?: number;
      y?: number;
      size?: number;
      color?: string;
      prerequisites?: string[];
      image?: string;
    }>,
    edges: [] as Array<{ from: string; to: string }>,
  };

  /**
   * Set galaxy title
   */
  withTitle(title: string): this {
    this.galaxyData.title = title;
    return this;
  }

  /**
   * Set galaxy description
   */
  withDescription(description: string): this {
    this.galaxyData.description = description;
    return this;
  }

  /**
   * Set galaxy status
   */
  withStatus(status: 'drafting' | 'published'): this {
    this.galaxyData.status = status;
    return this;
  }

  /**
   * Add a single node
   */
  withNode(node: {
    id: string;
    label: string;
    x?: number;
    y?: number;
    size?: number;
    color?: string;
    prerequisites?: string[];
    image?: string;
  }): this {
    this.galaxyData.nodes.push(node);
    return this;
  }

  /**
   * Add multiple nodes with default settings
   */
  withNodes(count: number, prefix = 'Node'): this {
    for (let i = 0; i < count; i++) {
      this.galaxyData.nodes.push({
        id: `node-${i}`,
        label: `${prefix} ${i + 1}`,
        x: 200 + i * 150,
        y: 300,
      });
    }
    return this;
  }

  /**
   * Add an edge between two nodes
   */
  withEdge(from: string, to: string): this {
    this.galaxyData.edges.push({ from, to });
    return this;
  }

  /**
   * Connect nodes in a linear path
   */
  withLinearPath(): this {
    for (let i = 0; i < this.galaxyData.nodes.length - 1; i++) {
      this.galaxyData.edges.push({
        from: this.galaxyData.nodes[i].id,
        to: this.galaxyData.nodes[i + 1].id,
      });
    }
    return this;
  }

  /**
   * Create a branching structure (one node to multiple)
   */
  withBranch(fromNodeId: string, toNodeIds: string[]): this {
    for (const toNodeId of toNodeIds) {
      this.galaxyData.edges.push({ from: fromNodeId, to: toNodeId });
    }
    return this;
  }

  /**
   * Create a converging structure (multiple nodes to one)
   */
  withConverge(fromNodeIds: string[], toNodeId: string): this {
    for (const fromNodeId of fromNodeIds) {
      this.galaxyData.edges.push({ from: fromNodeId, to: toNodeId });
    }
    return this;
  }

  /**
   * Build and return the galaxy data
   */
  build() {
    return this.galaxyData;
  }
}

/**
 * Node Builder - Fluent API for building node test data
 */
export class NodeBuilder {
  private nodeData = {
    id: `node-${Date.now()}`,
    label: 'Test Node',
    x: 300,
    y: 300,
    size: 25,
    color: '#5C6BC0',
    prerequisites: [] as string[],
  };

  withId(id: string): this {
    this.nodeData.id = id;
    return this;
  }

  withLabel(label: string): this {
    this.nodeData.label = label;
    return this;
  }

  atPosition(x: number, y: number): this {
    this.nodeData.x = x;
    this.nodeData.y = y;
    return this;
  }

  withSize(size: number): this {
    this.nodeData.size = size;
    return this;
  }

  withColor(color: string): this {
    this.nodeData.color = color;
    return this;
  }

  withPrerequisites(prerequisites: string[]): this {
    this.nodeData.prerequisites = prerequisites;
    return this;
  }

  build() {
    return this.nodeData;
  }
}

/**
 * Generate unique email address for testing
 */
export function generateUniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@example.test`;
}

/**
 * Generate test user data
 */
export function generateTestUser(options?: {
  firstName?: string;
  lastName?: string;
  emailPrefix?: string;
}) {
  return {
    firstName: options?.firstName ?? 'Test',
    lastName: options?.lastName ?? 'User',
    email: generateUniqueEmail(options?.emailPrefix ?? 'test-user'),
    password: 'TestPass123!',
  };
}

/**
 * Generate test galaxy data
 */
export function generateTestGalaxy(options?: {
  title?: string;
  description?: string;
  nodeCount?: number;
  withEdges?: boolean;
}) {
  const builder = new GalaxyBuilder()
    .withTitle(options?.title ?? `Test Galaxy ${Date.now()}`)
    .withDescription(options?.description ?? 'Generated test galaxy');

  if (options?.nodeCount) {
    builder.withNodes(options.nodeCount);

    if (options.withEdges) {
      builder.withLinearPath();
    }
  }

  return builder.build();
}

/**
 * Generate unique node ID
 */
export function generateNodeId(prefix = 'node'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate unique galaxy ID
 */
export function generateGalaxyId(prefix = 'galaxy'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate random position within bounds
 */
export function generateRandomPosition(
  bounds = { minX: 100, maxX: 700, minY: 100, maxY: 500 }
): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * (bounds.maxX - bounds.minX) + bounds.minX),
    y: Math.floor(Math.random() * (bounds.maxY - bounds.minY) + bounds.minY),
  };
}

/**
 * Generate test node with random data
 */
export function generateTestNode(options?: {
  label?: string;
  size?: number;
  withPrerequisites?: string[];
}) {
  return new NodeBuilder()
    .withId(generateNodeId())
    .withLabel(options?.label ?? `Node ${Date.now()}`)
    .atPosition(...Object.values(generateRandomPosition()))
    .withSize(options?.size ?? 25)
    .withPrerequisites(options?.withPrerequisites ?? [])
    .build();
}

/**
 * Wait utility for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for flaky operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options = { maxAttempts: 3, delayMs: 1000 }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < options.maxAttempts) {
        await wait(options.delayMs);
      }
    }
  }

  throw lastError;
}
