import { test as authTest, AuthenticatedUser } from './auth.fixture';
import {
  createTestGalaxy,
  createTestNode,
  createTestEdge,
} from '../utils/firestore-helpers';
import { GalaxyBuilder, generateNodeId } from '../utils/test-data-generator';

/**
 * Galaxy fixture types
 */
export type EmptyGalaxy = {
  galaxyId: string;
  title: string;
  userId: string;
};

export type GalaxyWithNodes = {
  galaxyId: string;
  title: string;
  userId: string;
  nodes: Array<{ id: string; label: string }>;
};

export type GalaxyWithNodesAndEdges = {
  galaxyId: string;
  title: string;
  userId: string;
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
};

/**
 * Galaxy fixtures type definition
 */
type GalaxyFixtures = {
  authenticatedUser: AuthenticatedUser;
  emptyGalaxy: EmptyGalaxy;
  galaxyWithNodes: GalaxyWithNodes;
  galaxyWithNodesAndEdges: GalaxyWithNodesAndEdges;
};

/**
 * Extended test with galaxy fixtures
 */
export const test = authTest.extend<GalaxyFixtures>({
  /**
   * Empty galaxy fixture (only the auto-created intro node)
   */
  emptyGalaxy: async ({ authenticatedUser }, use) => {
    console.log('[emptyGalaxy] Creating galaxy for user:', authenticatedUser.uid);

    const galaxyId = await createTestGalaxy({
      userId: authenticatedUser.uid,
      title: 'Empty Test Galaxy',
      description: 'A test galaxy with only the intro node',
    });

    console.log('[emptyGalaxy] Galaxy created with ID:', galaxyId);

    // Verify the galaxy was created correctly
    const { initializeTestFirestore } = await import('../utils/firestore-helpers');
    const db = initializeTestFirestore();
    const galaxyDoc = await db.collection('courses').doc(galaxyId).get();

    if (galaxyDoc.exists) {
      const data = galaxyDoc.data();
      console.log('[emptyGalaxy] Galaxy data:', {
        id: data?.id,
        owner: data?.owner,
        creator: data?.creator,
        title: data?.title,
      });
    } else {
      console.error('[emptyGalaxy] Galaxy document not found!');
    }

    // Verify intro node was created
    const nodesSnapshot = await db.collection(`courses/${galaxyId}/map-nodes`).get();
    console.log('[emptyGalaxy] Nodes count:', nodesSnapshot.size);
    nodesSnapshot.forEach(doc => {
      console.log('[emptyGalaxy] Node:', doc.id, '-', doc.data().label);
    });

    const emptyGalaxy: EmptyGalaxy = {
      galaxyId,
      title: 'Empty Test Galaxy',
      userId: authenticatedUser.uid,
    };

    // Wait a moment for Firestore to propagate the data to the browser client
    await new Promise(resolve => setTimeout(resolve, 1000));

    await use(emptyGalaxy);

    // Cleanup handled by authenticatedUser fixture
  },

  /**
   * Galaxy with 3 pre-created nodes
   */
  galaxyWithNodes: async ({ authenticatedUser }, use) => {
    const galaxyData = new GalaxyBuilder()
      .withTitle('Galaxy with Nodes')
      .withDescription('Test galaxy with 3 nodes')
      .withNodes(3, 'Test Node')
      .build();

    const galaxyId = await createTestGalaxy({
      userId: authenticatedUser.uid,
      title: galaxyData.title,
      description: galaxyData.description,
    });

    const nodes: Array<{ id: string; label: string }> = [];

    for (const node of galaxyData.nodes) {
      await createTestNode({
        galaxyId,
        nodeId: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
      });
      nodes.push({ id: node.id, label: node.label });
    }

    const galaxyWithNodes: GalaxyWithNodes = {
      galaxyId,
      title: galaxyData.title,
      userId: authenticatedUser.uid,
      nodes,
    };

    await use(galaxyWithNodes);

    // Cleanup handled by authenticatedUser fixture
  },

  /**
   * Galaxy with nodes and edges in a linear path
   */
  galaxyWithNodesAndEdges: async ({ authenticatedUser }, use) => {
    const galaxyData = new GalaxyBuilder()
      .withTitle('Galaxy with Nodes and Edges')
      .withDescription('Test galaxy with nodes connected in a linear path')
      .withNodes(4, 'Node')
      .withLinearPath()
      .build();

    const galaxyId = await createTestGalaxy({
      userId: authenticatedUser.uid,
      title: galaxyData.title,
      description: galaxyData.description,
    });

    const nodes: Array<{ id: string; label: string }> = [];

    // Create nodes
    for (const node of galaxyData.nodes) {
      await createTestNode({
        galaxyId,
        nodeId: node.id,
        label: node.label,
        x: node.x,
        y: node.y,
        prerequisites: node.prerequisites,
      });
      nodes.push({ id: node.id, label: node.label });
    }

    // Create edges
    const edges: Array<{ from: string; to: string }> = [];
    for (const edge of galaxyData.edges) {
      await createTestEdge({
        galaxyId,
        from: edge.from,
        to: edge.to,
      });
      edges.push({ from: edge.from, to: edge.to });
    }

    const galaxyWithNodesAndEdges: GalaxyWithNodesAndEdges = {
      galaxyId,
      title: galaxyData.title,
      userId: authenticatedUser.uid,
      nodes,
      edges,
    };

    await use(galaxyWithNodesAndEdges);

    // Cleanup handled by authenticatedUser fixture
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to create a custom galaxy fixture
 */
export async function createCustomGalaxy(
  userId: string,
  galaxyData: ReturnType<GalaxyBuilder['build']>
): Promise<GalaxyWithNodesAndEdges> {
  const galaxyId = await createTestGalaxy({
    userId,
    title: galaxyData.title,
    description: galaxyData.description,
    status: galaxyData.status,
  });

  const nodes: Array<{ id: string; label: string }> = [];

  // Create nodes
  for (const node of galaxyData.nodes) {
    await createTestNode({
      galaxyId,
      nodeId: node.id,
      label: node.label,
      x: node.x,
      y: node.y,
      size: node.size,
      color: node.color,
      prerequisites: node.prerequisites,
      image: node.image,
    });
    nodes.push({ id: node.id, label: node.label });
  }

  // Create edges
  const edges: Array<{ from: string; to: string }> = [];
  for (const edge of galaxyData.edges) {
    await createTestEdge({
      galaxyId,
      from: edge.from,
      to: edge.to,
    });
    edges.push({ from: edge.from, to: edge.to });
  }

  return {
    galaxyId,
    title: galaxyData.title,
    userId,
    nodes,
    edges,
  };
}
