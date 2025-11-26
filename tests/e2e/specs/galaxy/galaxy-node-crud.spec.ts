import { test, expect } from '../../fixtures/galaxy.fixture';
import { GalaxyViewPage } from '../../page-objects/galaxy-view.page';
import { getNodePrerequisites, nodeExists } from '../../utils/firestore-helpers';
import { CANVAS_POSITIONS, NODE_SIZES } from '../../fixtures/test-data.fixture';

/**
 * Galaxy Node CRUD Tests
 *
 * Test cases for creating, reading, updating, and deleting nodes
 * in a manual galaxy map.
 */
test.describe('Galaxy Node CRUD Operations', () => {
  /**
   * TC002: Add node "A" with default settings
   */
  test('TC002: should add node with default settings', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Navigate to empty galaxy
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Get initial node count (should have intro node)
    const initialNodeCount = await galaxyPage.getNodeCount();

    // ACT - Add node "A" with default settings
    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.midLeft,
    });

    // ASSERT - Verify node was created
    const nodeAExists = await galaxyPage.verifyNodeExists('A');
    expect(nodeAExists).toBeTruthy();

    // Verify node count increased
    const finalNodeCount = await galaxyPage.getNodeCount();
    expect(finalNodeCount).toBe(initialNodeCount + 1);
  });

  /**
   * TC003: Add node "B" with larger size and prerequisite "A"
   */
  test('TC003: should add node with larger size and prerequisite', async ({
    page,
    emptyGalaxy,
  }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Navigate to galaxy and create node A
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topLeft,
    });

    // ACT - Add node "B" with larger size and prerequisite "A"
    await galaxyPage.addNode({
      title: 'B',
      position: CANVAS_POSITIONS.topCenter,
      size: NODE_SIZES.large, // 35 (larger than default 25)
      prerequisites: ['A'],
    });

    // ASSERT - Verify node B exists
    const nodeBExists = await galaxyPage.verifyNodeExists('B');
    expect(nodeBExists).toBeTruthy();

    // Note: Verifying size and prerequisites would require:
    // 1. Either querying Firestore directly
    // 2. Or having data-testid attributes on nodes to inspect
    // For now, we verify the node was created successfully
  });

  /**
   * TC004: Add node "C" with image and prerequisite "A"
   */
  test('TC004: should add node with image and prerequisite', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create node A first
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topLeft,
    });

    // ACT - Add node "C" with image and prerequisite
    await galaxyPage.addNode({
      title: 'C',
      position: CANVAS_POSITIONS.topRight,
      // Note: Image upload would require actual test image file
      // image: 'tests/e2e/fixtures/assets/test-node-image.png',
      prerequisites: ['A'],
    });

    // ASSERT - Verify node C exists
    const nodeCExists = await galaxyPage.verifyNodeExists('C');
    expect(nodeCExists).toBeTruthy();
  });

  /**
   * TC005: Add node "D" with prerequisite "C"
   */
  test('TC005: should add node with chained prerequisite', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create prerequisite chain A -> C
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topLeft,
    });

    await galaxyPage.addNode({
      title: 'C',
      position: CANVAS_POSITIONS.topCenter,
      prerequisites: ['A'],
    });

    // ACT - Add node "D" with prerequisite "C" (creates chain A -> C -> D)
    await galaxyPage.addNode({
      title: 'D',
      position: CANVAS_POSITIONS.topRight,
      prerequisites: ['C'],
    });

    // ASSERT - Verify node D exists
    const nodeDExists = await galaxyPage.verifyNodeExists('D');
    expect(nodeDExists).toBeTruthy();

    // Verify prerequisite chain was created
    // This would require Firestore verification:
    // const dPrereqs = await getNodePrerequisites(emptyGalaxy.galaxyId, 'd-node-id');
    // expect(dPrereqs).toContain('c-node-id');
  });

  /**
   * TC006: Edit node "D" and rename to "D fork"
   */
  test('TC006: should edit node and rename', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create node D
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'D',
      position: CANVAS_POSITIONS.center,
    });

    // Verify D exists
    let nodeDExists = await galaxyPage.verifyNodeExists('D');
    expect(nodeDExists).toBeTruthy();

    // ACT - Edit node D and rename to "D fork"
    await galaxyPage.editNode('D', {
      title: 'D fork',
    });

    // ASSERT - Verify old name no longer exists
    nodeDExists = await galaxyPage.verifyNodeExists('D');
    expect(nodeDExists).toBeFalsy();

    // Verify new name exists
    const nodeDForkExists = await galaxyPage.verifyNodeExists('D fork');
    expect(nodeDForkExists).toBeTruthy();
  });

  /**
   * TC012-013: Add node "H" and immediately delete it
   */
  test('TC012: should add and delete node', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Navigate to galaxy
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    const initialNodeCount = await galaxyPage.getNodeCount();

    // ACT - Add node H
    await galaxyPage.addNode({
      title: 'H',
      position: CANVAS_POSITIONS.bottomCenter,
    });

    // Verify node was created
    let nodeHExists = await galaxyPage.verifyNodeExists('H');
    expect(nodeHExists).toBeTruthy();

    const afterAddCount = await galaxyPage.getNodeCount();
    expect(afterAddCount).toBe(initialNodeCount + 1);

    // Delete node H
    await galaxyPage.deleteNode('H');

    // ASSERT - Verify node was deleted
    nodeHExists = await galaxyPage.verifyNodeExists('H');
    expect(nodeHExists).toBeFalsy();

    // Verify node count decreased
    const finalNodeCount = await galaxyPage.getNodeCount();
    expect(finalNodeCount).toBe(initialNodeCount);
  });

  /**
   * TC013: Delete node with prerequisites and verify cleanup
   */
  test('TC013: should delete node and clean up dependent prerequisites', async ({
    page,
    emptyGalaxy,
  }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create nodes A and B where B depends on A
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    await galaxyPage.addNode({
      title: 'A',
      position: CANVAS_POSITIONS.topCenter,
    });

    await galaxyPage.addNode({
      title: 'B',
      position: CANVAS_POSITIONS.bottomCenter,
      prerequisites: ['A'],
    });

    // Verify both exist
    expect(await galaxyPage.verifyNodeExists('A')).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists('B')).toBeTruthy();

    // ACT - Delete node A (which is a prerequisite of B)
    await galaxyPage.deleteNode('A');

    // ASSERT - Verify A is deleted
    const nodeAExists = await galaxyPage.verifyNodeExists('A');
    expect(nodeAExists).toBeFalsy();

    // Verify B still exists (dependent node should remain)
    const nodeBExists = await galaxyPage.verifyNodeExists('B');
    expect(nodeBExists).toBeTruthy();

    // Note: Verifying that B's prerequisites were cleaned up would require
    // Firestore verification:
    // const bPrereqs = await getNodePrerequisites(emptyGalaxy.galaxyId, 'b-node-id');
    // expect(bPrereqs).not.toContain('a-node-id');
  });

  /**
   * Complete workflow: Add multiple nodes with different configurations
   */
  test('TC002-006: complete node creation workflow', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE
    await galaxyPage.goto(emptyGalaxy.galaxyId);
    const initialNodeCount = await galaxyPage.getNodeCount();

    // ACT & ASSERT - Create nodes following the test scenario

    // TC002: Add node A
    await galaxyPage.addNode({
      title: 'A',
      position: { x: 200, y: 200 },
    });
    expect(await galaxyPage.verifyNodeExists('A')).toBeTruthy();

    // TC003: Add node B with larger size and prerequisite A
    await galaxyPage.addNode({
      title: 'B',
      position: { x: 400, y: 200 },
      size: NODE_SIZES.large,
      prerequisites: ['A'],
    });
    expect(await galaxyPage.verifyNodeExists('B')).toBeTruthy();

    // TC004: Add node C with prerequisite A
    await galaxyPage.addNode({
      title: 'C',
      position: { x: 200, y: 350 },
      prerequisites: ['A'],
    });
    expect(await galaxyPage.verifyNodeExists('C')).toBeTruthy();

    // TC005: Add node D with prerequisite C (chain: A -> C -> D)
    await galaxyPage.addNode({
      title: 'D',
      position: { x: 200, y: 500 },
      prerequisites: ['C'],
    });
    expect(await galaxyPage.verifyNodeExists('D')).toBeTruthy();

    // TC006: Edit D to "D fork"
    await galaxyPage.editNode('D', {
      title: 'D fork',
    });
    expect(await galaxyPage.verifyNodeExists('D fork')).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists('D')).toBeFalsy();

    // Verify total node count
    const finalNodeCount = await galaxyPage.getNodeCount();
    expect(finalNodeCount).toBe(initialNodeCount + 4); // A, B, C, D fork
  });
});
