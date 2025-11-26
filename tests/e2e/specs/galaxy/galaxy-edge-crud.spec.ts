import { test, expect } from '../../fixtures/galaxy.fixture';
import { GalaxyViewPage } from '../../page-objects/galaxy-view.page';
import { edgeExists } from '../../utils/firestore-helpers';
import { CANVAS_POSITIONS } from '../../fixtures/test-data.fixture';

/**
 * Galaxy Edge CRUD Tests
 *
 * Test cases for creating and deleting edges (connections) between nodes
 * using the "Connect Stars" mode in the galaxy editor.
 */
test.describe('Galaxy Edge CRUD Operations', () => {
  /**
   * TC014: Create edge between "A" and "random connected" using connect mode
   */
  test('TC014: should create edge using connect stars mode', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create two nodes
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topLeft,
    });

    await galaxyPage.addNode({
      title: 'random connected',
      position: CANVAS_POSITIONS.topRight,
    });

    // Get initial edge count
    const initialEdgeCount = await galaxyPage.getEdgeCount();

    // ACT - Connect nodes A and "random connected"
    await galaxyPage.connectNodes('A', 'random connected');

    // ASSERT - Verify edge was created
    const edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random connected');
    expect(edgeCreated).toBeTruthy();

    // Verify edge count increased
    const finalEdgeCount = await galaxyPage.getEdgeCount();
    expect(finalEdgeCount).toBe(initialEdgeCount + 1);
  });

  /**
   * TC015: Add node "random disconnected" (no edges initially)
   */
  test('TC015: should add isolated node without connections', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Create node A for reference
    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topLeft,
    });

    const initialEdgeCount = await galaxyPage.getEdgeCount();

    // ACT - Add "random disconnected" without creating edges
    await galaxyPage.addNode({
      title: 'random disconnected',
      position: CANVAS_POSITIONS.bottomRight,
    });

    // ASSERT - Verify node exists but no new edges created
    const nodeExists = await galaxyPage.verifyNodeExists('random disconnected');
    expect(nodeExists).toBeTruthy();

    // Verify no edges were added
    const finalEdgeCount = await galaxyPage.getEdgeCount();
    expect(finalEdgeCount).toBe(initialEdgeCount);

    // Verify no edge exists between A and random disconnected
    const edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random disconnected');
    expect(edgeCreated).toBeFalsy();
  });

  /**
   * TC016: Create edge from "A" to "random disconnected"
   */
  test('TC016: should connect previously isolated node', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create two disconnected nodes
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topCenter,
    });

    await galaxyPage.addNode({
      title: 'random disconnected',
      position: CANVAS_POSITIONS.bottomCenter,
    });

    // Verify no edge exists initially
    let edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random disconnected');
    expect(edgeCreated).toBeFalsy();

    // ACT - Connect A to "random disconnected"
    await galaxyPage.connectNodes('A', 'random disconnected');

    // ASSERT - Verify edge was created
    edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random disconnected');
    expect(edgeCreated).toBeTruthy();
  });

  /**
   * TC017: Delete edge between "random disconnected" and "A"
   */
  test('TC017: should delete edge between nodes', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create nodes and edge
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topCenter,
    });

    await galaxyPage.addNode({
      title: 'random disconnected',
      position: CANVAS_POSITIONS.bottomCenter,
    });

    await galaxyPage.connectNodes('A', 'random disconnected');

    // Verify edge exists
    let edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random disconnected');
    expect(edgeCreated).toBeTruthy();

    const initialEdgeCount = await galaxyPage.getEdgeCount();

    // ACT - Delete the edge
    await galaxyPage.deleteEdge('A', 'random disconnected');

    // ASSERT - Verify edge was deleted
    edgeCreated = await galaxyPage.verifyEdgeExists('A', 'random disconnected');
    expect(edgeCreated).toBeFalsy();

    // Verify edge count decreased
    const finalEdgeCount = await galaxyPage.getEdgeCount();
    expect(finalEdgeCount).toBe(initialEdgeCount - 1);

    // Verify nodes still exist (only edge was deleted)
    expect(await galaxyPage.verifyNodeExists('A')).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists('random disconnected')).toBeTruthy();
  });

  /**
   * Complete edge workflow: TC014-017
   */
  test('TC014-017: complete edge creation and deletion workflow', async ({
    page,
    emptyGalaxy,
  }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Create node A
    await galaxyPage.addNode({
      title: 'A',
      position: { x: 300, y: 200 },
    });

    // TC014: Add "random connected" and create edge
    await galaxyPage.addNode({
      title: 'random connected',
      position: { x: 500, y: 200 },
    });

    await galaxyPage.connectNodes('A', 'random connected');
    expect(await galaxyPage.verifyEdgeExists('A', 'random connected')).toBeTruthy();

    // TC015: Add "random disconnected" without edges
    await galaxyPage.addNode({
      title: 'random disconnected',
      position: { x: 300, y: 400 },
    });

    expect(await galaxyPage.verifyNodeExists('random disconnected')).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists('A', 'random disconnected')).toBeFalsy();

    // TC016: Connect A to "random disconnected"
    await galaxyPage.connectNodes('A', 'random disconnected');
    expect(await galaxyPage.verifyEdgeExists('A', 'random disconnected')).toBeTruthy();

    // TC017: Delete edge between "random disconnected" and A
    await galaxyPage.deleteEdge('A', 'random disconnected');
    expect(await galaxyPage.verifyEdgeExists('A', 'random disconnected')).toBeFalsy();

    // Verify nodes still exist
    expect(await galaxyPage.verifyNodeExists('A')).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists('random connected')).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists('random disconnected')).toBeTruthy();

    // Verify remaining edge still exists
    expect(await galaxyPage.verifyEdgeExists('A', 'random connected')).toBeTruthy();
  });

  /**
   * Test creating multiple edges from one node (branching)
   */
  test('should create multiple edges from single node', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create one source node and three target nodes
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'Source',
      position: CANVAS_POSITIONS.topCenter,
    });

    await galaxyPage.addNode({
      title: 'Target 1',
      position: CANVAS_POSITIONS.midLeft,
    });

    await galaxyPage.addNode({
      title: 'Target 2',
      position: CANVAS_POSITIONS.center,
    });

    await galaxyPage.addNode({
      title: 'Target 3',
      position: CANVAS_POSITIONS.midRight,
    });

    // ACT - Create edges from Source to all targets
    await galaxyPage.connectNodes('Source', 'Target 1');
    await galaxyPage.connectNodes('Source', 'Target 2');
    await galaxyPage.connectNodes('Source', 'Target 3');

    // ASSERT - Verify all edges were created
    expect(await galaxyPage.verifyEdgeExists('Source', 'Target 1')).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists('Source', 'Target 2')).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists('Source', 'Target 3')).toBeTruthy();

    // Verify edge count
    const edgeCount = await galaxyPage.getEdgeCount();
    expect(edgeCount).toBeGreaterThanOrEqual(3);
  });

  /**
   * Test creating multiple edges to one node (converging)
   */
  test('should create multiple edges to single node', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create three source nodes and one target node
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'Source 1',
      position: CANVAS_POSITIONS.topLeft,
    });

    await galaxyPage.addNode({
      title: 'Source 2',
      position: CANVAS_POSITIONS.topCenter,
    });

    await galaxyPage.addNode({
      title: 'Source 3',
      position: CANVAS_POSITIONS.topRight,
    });

    await galaxyPage.addNode({
      title: 'Target',
      position: CANVAS_POSITIONS.bottomCenter,
    });

    // ACT - Create edges from all sources to Target
    await galaxyPage.connectNodes('Source 1', 'Target');
    await galaxyPage.connectNodes('Source 2', 'Target');
    await galaxyPage.connectNodes('Source 3', 'Target');

    // ASSERT - Verify all edges were created
    expect(await galaxyPage.verifyEdgeExists('Source 1', 'Target')).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists('Source 2', 'Target')).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists('Source 3', 'Target')).toBeTruthy();
  });
});
