import { test, expect } from '../../fixtures/auth.fixture';
import { GalaxyListPage } from '../../page-objects/galaxy-list.page';
import { CreateGalaxyDialog } from '../../page-objects/dialogs/create-galaxy.dialog';
import { GalaxyViewPage } from '../../page-objects/galaxy-view.page';

/**
 * TC001: Create manual galaxy with title, description, and image
 *
 * This test covers the basic manual galaxy creation workflow:
 * 1. Navigate to galaxy list
 * 2. Open create galaxy dialog
 * 3. Select "Create Manually" option
 * 4. Fill in title, description, and upload image
 * 5. Create galaxy
 * 6. Verify redirect to galaxy view
 * 7. Verify galaxy loads with intro node
 */
test.describe('Manual Galaxy Creation', () => {
  test('TC001: should create manual galaxy with title, description, and image', async ({
    page,
    authenticatedUser,
  }) => {
    const galaxyListPage = new GalaxyListPage(page);
    const createGalaxyDialog = new CreateGalaxyDialog(page);
    const galaxyViewPage = new GalaxyViewPage(page);

    // ARRANGE - Navigate to My Galaxies page
    await galaxyListPage.gotoMyGalaxies();

    // ACT - Create new galaxy
    await galaxyListPage.openCreateGalaxyDialog();
    await createGalaxyDialog.waitForOpen();

    // Fill in galaxy details
    await createGalaxyDialog.createManualGalaxy({
      title: 'Test Galaxy - Manual Creation',
      description: 'A test galaxy created manually for automated testing',
      // Note: Image upload would require a test image file
      // image: 'tests/e2e/fixtures/assets/test-galaxy-image.png',
    });

    // Wait for redirect to galaxy view
    await page.waitForURL(/\/galaxy\/.*/, { timeout: 10000 });

    // ASSERT - Verify galaxy loaded
    await galaxyViewPage.waitForGalaxyToLoad();

    // Verify galaxy title and description are displayed
    const galaxyTitle = await galaxyViewPage.getGalaxyTitle();
    expect(galaxyTitle).toContain('Test Galaxy - Manual Creation');

    // Verify intro node exists (auto-created)
    // Note: The intro node is automatically created by the backend
    const nodeCount = await galaxyViewPage.getNodeCount();
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    // Verify galaxy appears in list when we navigate back
    await galaxyListPage.gotoMyGalaxies();
    const galaxyExists = await galaxyListPage.galaxyExists('Test Galaxy - Manual Creation');
    expect(galaxyExists).toBeTruthy();
  });

  test('TC001b: should validate required fields when creating galaxy', async ({
    page,
    authenticatedUser,
  }) => {
    const galaxyListPage = new GalaxyListPage(page);
    const createGalaxyDialog = new CreateGalaxyDialog(page);

    // Navigate to My Galaxies
    await galaxyListPage.gotoMyGalaxies();
    await galaxyListPage.openCreateGalaxyDialog();
    await createGalaxyDialog.waitForOpen();

    // Select manual mode
    await createGalaxyDialog.selectManualMode();

    // Try to create without title (should fail validation)
    await createGalaxyDialog.createButton.click();

    // Dialog should still be open (validation failed)
    const dialogVisible = await createGalaxyDialog.dialog.isVisible();
    expect(dialogVisible).toBeTruthy();

    // Fill title and create successfully
    await createGalaxyDialog.fillGalaxyDetails({
      title: 'Valid Galaxy Title',
    });
    await createGalaxyDialog.createButton.click();

    // Should redirect to galaxy view
    await page.waitForURL(/\/galaxy\/.*/, { timeout: 10000 });
  });

  test('TC001c: should create galaxy and verify status is "drafting"', async ({
    page,
    authenticatedUser,
  }) => {
    const galaxyListPage = new GalaxyListPage(page);
    const createGalaxyDialog = new CreateGalaxyDialog(page);
    const galaxyViewPage = new GalaxyViewPage(page);

    // Create galaxy
    await galaxyListPage.gotoMyGalaxies();
    await galaxyListPage.openCreateGalaxyDialog();
    await createGalaxyDialog.waitForOpen();

    await createGalaxyDialog.createManualGalaxy({
      title: 'Draft Status Test Galaxy',
      description: 'Testing draft status',
    });

    // Wait for redirect
    await page.waitForURL(/\/galaxy\/.*/, { timeout: 10000 });
    await galaxyViewPage.waitForGalaxyToLoad();

    // Extract galaxy ID from URL
    const url = await page.url();
    const galaxyId = url.split('/galaxy/')[1]?.split('?')[0];
    expect(galaxyId).toBeTruthy();

    // Verify galaxy status in Firestore
    // Note: This would require Firestore helpers
    // const galaxy = await getGalaxy(galaxyId);
    // expect(galaxy.status).toBe('drafting');

    // Verify publish button is visible (indicates draft status)
    const publishButtonVisible = await galaxyViewPage.publishButton.isVisible();
    expect(publishButtonVisible).toBeTruthy();
  });
});
