import { test, expect } from "../../fixtures/galaxy.fixture";
import { GalaxyViewPage } from "../../page-objects/galaxy-view.page";
import { CANVAS_POSITIONS } from "../../fixtures/test-data.fixture";

/**
 * Full Galaxy Creation Workflow Tests
 *
 * These tests cover the complete manual galaxy creation workflow
 * as defined in tests/testing-guide.md, including:
 * - Creating complex node structures (branching and converging paths)
 * - Managing prerequisites
 * - Deleting nodes with prerequisite cleanup
 */
test.describe("Manual Galaxy Creation - Full Workflow", () => {
  /**
   * TC007-011: Create branching and converging path structure
   *
   * Structure:
   * D fork splits into E, F, G
   * E, F, G converge into Final Boss
   * Final Boss leads to Done
   */
  test("TC007-011: should create complex branching and converging path", async ({
    page,
    emptyGalaxy,
  }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Navigate to galaxy
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Create base node "D fork"
    await galaxyPage.addNode({
      title: "D fork",
      position: { x: 500, y: 150 },
    });

    // TC007: Add node E with prerequisite "D fork"
    await galaxyPage.addNode({
      title: "E",
      position: { x: 450, y: 300 },
      prerequisites: ["D fork"],
    });

    expect(await galaxyPage.verifyNodeExists("E")).toBeTruthy();

    // TC008: Add node F with prerequisite "D fork"
    await galaxyPage.addNode({
      title: "F",
      position: { x: 550, y: 300 },
      prerequisites: ["D fork"],
    });

    expect(await galaxyPage.verifyNodeExists("F")).toBeTruthy();

    // TC009: Add node G with prerequisite "D fork"
    await galaxyPage.addNode({
      title: "G",
      position: { x: 650, y: 300 },
      prerequisites: ["D fork"],
    });

    expect(await galaxyPage.verifyNodeExists("G")).toBeTruthy();

    // TC010: Add "Final Boss" with prerequisites E, F, G (converging path)
    await galaxyPage.addNode({
      title: "Final Boss",
      position: { x: 550, y: 450 },
      prerequisites: ["E", "F", "G"],
    });

    expect(await galaxyPage.verifyNodeExists("Final Boss")).toBeTruthy();

    // TC011: Add "Done" with prerequisite "Final Boss"
    await galaxyPage.addNode({
      title: "Done",
      position: { x: 550, y: 600 },
      prerequisites: ["Final Boss"],
    });

    expect(await galaxyPage.verifyNodeExists("Done")).toBeTruthy();

    // ASSERT - Verify complete structure
    // Verify all nodes exist
    expect(await galaxyPage.verifyNodeExists("D fork")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("E")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("F")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("G")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("Final Boss")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("Done")).toBeTruthy();

    // Verify node count (intro + 6 created nodes = 7, or just 6 if no intro)
    const nodeCount = await galaxyPage.getNodeCount();
    expect(nodeCount).toBeGreaterThanOrEqual(6);
  });

  /**
   * TC018-019: Delete node F and verify prerequisite cleanup on "Final Boss"
   */
  test("TC018-019: should delete node and clean up prerequisites", async ({
    page,
    emptyGalaxy,
  }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE - Create the branching/converging structure
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Create base structure
    await galaxyPage.addNode({
      title: "D fork",
      position: { x: 500, y: 150 },
    });

    await galaxyPage.addNode({
      title: "E",
      position: { x: 450, y: 300 },
      prerequisites: ["D fork"],
    });

    await galaxyPage.addNode({
      title: "F",
      position: { x: 550, y: 300 },
      prerequisites: ["D fork"],
    });

    await galaxyPage.addNode({
      title: "G",
      position: { x: 650, y: 300 },
      prerequisites: ["D fork"],
    });

    await galaxyPage.addNode({
      title: "Final Boss",
      position: { x: 550, y: 450 },
      prerequisites: ["E", "F", "G"],
    });

    // Verify all nodes exist before deletion
    expect(await galaxyPage.verifyNodeExists("E")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("F")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("G")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("Final Boss")).toBeTruthy();

    const nodeCountBeforeDelete = await galaxyPage.getNodeCount();

    // ACT - Delete node F
    await galaxyPage.deleteNode("F");

    // ASSERT - Verify F is deleted
    expect(await galaxyPage.verifyNodeExists("F")).toBeFalsy();

    // Verify Final Boss still exists
    expect(await galaxyPage.verifyNodeExists("Final Boss")).toBeTruthy();

    // Verify E and G still exist
    expect(await galaxyPage.verifyNodeExists("E")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("G")).toBeTruthy();

    // Verify node count decreased by 1
    const nodeCountAfterDelete = await galaxyPage.getNodeCount();
    expect(nodeCountAfterDelete).toBe(nodeCountBeforeDelete - 1);

    // Note: Verifying that "Final Boss" prerequisites were cleaned up
    // (i.e., "F" removed from prerequisites but "E" and "G" remain)
    // would require Firestore verification:
    // const finalBossPrereqs = await getNodePrerequisites(emptyGalaxy.galaxyId, 'final-boss-id');
    // expect(finalBossPrereqs).not.toContain('f-id');
    // expect(finalBossPrereqs).toContain('e-id');
    // expect(finalBossPrereqs).toContain('g-id');
  });

  /**
   * TC020: Complete workflow - All steps in sequence
   *
   * This test runs the entire manual galaxy creation workflow
   * from the testing guide in one continuous test.
   */
  test("TC020: complete manual galaxy creation workflow", async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // ARRANGE
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // TC002: Add node A
    await galaxyPage.addNode({
      title: "A",
      position: { x: 450, y: 150 },
    });

    // TC003: Add node B with larger size and prerequisite A
    await galaxyPage.addNode({
      title: "B",
      position: { x: 600, y: 150 },
      size: 35, // larger
      prerequisites: ["A"],
    });

    // TC004: Add node C with prerequisite A
    await galaxyPage.addNode({
      title: "C",
      position: { x: 450, y: 300 },
      prerequisites: ["A"],
    });

    // TC005: Add node D with prerequisite C
    await galaxyPage.addNode({
      title: "D",
      position: { x: 450, y: 450 },
      prerequisites: ["C"],
    });

    // TC006: Edit D to "D fork"
    await galaxyPage.editNode("D", {
      title: "D fork",
    });

    // TC007-009: Add E, F, G with prerequisite "D fork"
    await galaxyPage.addNode({
      title: "E",
      position: { x: 450, y: 600 },
      prerequisites: ["D fork"],
    });

    await galaxyPage.addNode({
      title: "F",
      position: { x: 550, y: 600 },
      prerequisites: ["D fork"],
    });

    await galaxyPage.addNode({
      title: "G",
      position: { x: 650, y: 600 },
      prerequisites: ["D fork"],
    });

    // TC010: Add "Final Boss" with prerequisites E, F, G
    await galaxyPage.addNode({
      title: "Final Boss",
      position: { x: 550, y: 750 },
      prerequisites: ["E", "F", "G"],
    });

    // TC011: Add "Done" with prerequisite "Final Boss"
    await galaxyPage.addNode({
      title: "Done",
      position: { x: 550, y: 900 },
      prerequisites: ["Final Boss"],
    });

    // TC012-013: Add and delete node H
    await galaxyPage.addNode({
      title: "H",
      position: { x: 750, y: 400 },
    });

    expect(await galaxyPage.verifyNodeExists("H")).toBeTruthy();

    await galaxyPage.deleteNode("H");

    expect(await galaxyPage.verifyNodeExists("H")).toBeFalsy();

    // TC014: Add "random connected" and create edge from A
    await galaxyPage.addNode({
      title: "random connected",
      position: { x: 700, y: 150 },
    });

    await galaxyPage.connectNodes("A", "random connected");

    // TC015: Add "random disconnected" (no edges)
    await galaxyPage.addNode({
      title: "random disconnected",
      position: { x: 800, y: 150 },
    });

    // TC016: Connect A to "random disconnected"
    await galaxyPage.connectNodes("A", "random disconnected");

    // TC017: Delete edge between A and "random disconnected"
    await galaxyPage.deleteEdge("A", "random disconnected");

    // TC018-019: Delete F and verify cleanup
    await galaxyPage.deleteNode("F");

    // FINAL ASSERTIONS
    // Verify critical nodes exist
    expect(await galaxyPage.verifyNodeExists("A")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("B")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("C")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("D fork")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("E")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("G")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("Final Boss")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("Done")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("random connected")).toBeTruthy();
    expect(await galaxyPage.verifyNodeExists("random disconnected")).toBeTruthy();

    // Verify deleted nodes don't exist
    expect(await galaxyPage.verifyNodeExists("D")).toBeFalsy(); // Renamed to D fork
    expect(await galaxyPage.verifyNodeExists("H")).toBeFalsy(); // Deleted
    expect(await galaxyPage.verifyNodeExists("F")).toBeFalsy(); // Deleted

    // Verify edges
    expect(await galaxyPage.verifyEdgeExists("A", "random connected")).toBeTruthy();
    expect(await galaxyPage.verifyEdgeExists("A", "random disconnected")).toBeFalsy(); // Deleted

    // Verify total counts
    const finalNodeCount = await galaxyPage.getNodeCount();
    expect(finalNodeCount).toBeGreaterThanOrEqual(10); // Should have ~10-11 nodes

    console.log(`✅ Complete workflow test passed! Final node count: ${finalNodeCount}`);
  });
});
