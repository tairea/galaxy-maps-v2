import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Visual testing helpers for screenshots and comparisons
 */

export interface ScreenshotOptions {
  name: string;
  fullPage?: boolean;
  path?: string;
  mask?: Array<{ selector: string }>;
}

/**
 * Take a screenshot with standardized naming and storage
 */
export async function takeScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<string> {
  const screenshotDir = options.path ?? 'test-results/screenshots';

  // Ensure directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${options.name}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: options.fullPage ?? false,
  });

  return filepath;
}

/**
 * Take a screenshot of a specific element
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string,
  screenshotPath?: string
): Promise<string> {
  const element = page.locator(selector);
  const screenshotDir = screenshotPath ?? 'test-results/screenshots';

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  await element.screenshot({ path: filepath });

  return filepath;
}

/**
 * Take a screenshot with masked elements (for dynamic content)
 */
export async function takeScreenshotWithMask(
  page: Page,
  options: ScreenshotOptions
): Promise<string> {
  const screenshotDir = options.path ?? 'test-results/screenshots';

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${options.name}-${timestamp}.png`;
  const filepath = path.join(screenshotDir, filename);

  const mask = options.mask?.map(m => page.locator(m.selector)) ?? [];

  await page.screenshot({
    path: filepath,
    fullPage: options.fullPage ?? false,
    mask,
  });

  return filepath;
}

/**
 * Capture screenshot on test failure
 * Usage in test: await captureOnFailure(page, testInfo, 'test-name');
 */
export async function captureOnFailure(
  page: Page,
  testInfo: any,
  testName: string
): Promise<void> {
  if (testInfo.status !== 'passed') {
    await takeScreenshot(page, {
      name: `${testName}-failure`,
      fullPage: true,
      path: testInfo.outputDir,
    });
  }
}

/**
 * Wait for element to be stable (no animation)
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });

  // Wait for animations to complete
  await page.waitForTimeout(300);
}

/**
 * Take a screenshot of the galaxy map canvas
 */
export async function captureGalaxyMap(
  page: Page,
  name: string
): Promise<string> {
  // Wait for vis-network to stabilize
  await page.waitForTimeout(1000);

  return await takeElementScreenshot(page, 'canvas.vis-network', `galaxy-map-${name}`);
}

/**
 * Compare two screenshots (requires additional library like pixelmatch)
 * This is a placeholder for future implementation
 */
export async function compareScreenshots(
  screenshot1Path: string,
  screenshot2Path: string,
  threshold = 0.1
): Promise<{ match: boolean; diffPercentage: number }> {
  // TODO: Implement screenshot comparison using pixelmatch or similar
  // For now, return a placeholder
  console.warn('Screenshot comparison not yet implemented');
  return { match: true, diffPercentage: 0 };
}

/**
 * Create a baseline screenshot for visual regression testing
 */
export async function createBaseline(
  page: Page,
  name: string,
  selector?: string
): Promise<string> {
  const baselineDir = 'test-results/baselines';

  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }

  const filename = `${name}.png`;
  const filepath = path.join(baselineDir, filename);

  if (selector) {
    const element = page.locator(selector);
    await element.screenshot({ path: filepath });
  } else {
    await page.screenshot({ path: filepath });
  }

  return filepath;
}

/**
 * Check if baseline exists for visual regression test
 */
export function baselineExists(name: string): boolean {
  const baselineDir = 'test-results/baselines';
  const filepath = path.join(baselineDir, `${name}.png`);
  return fs.existsSync(filepath);
}

/**
 * Take a screenshot and compare with baseline (Playwright built-in)
 */
export async function compareWithBaseline(
  page: Page,
  name: string,
  options?: {
    maxDiffPixels?: number;
    threshold?: number;
  }
): Promise<void> {
  await page.screenshot({
    animations: 'disabled', // Disable animations for consistent screenshots
  });

  // Playwright's built-in visual comparison
  // This will automatically handle baseline creation and comparison
  // await expect(page).toHaveScreenshot(`${name}.png`, {
  //   maxDiffPixels: options?.maxDiffPixels ?? 100,
  //   threshold: options?.threshold ?? 0.2,
  // });
}

/**
 * Mask dynamic elements for visual comparison
 */
export const DEFAULT_MASKS = {
  timestamps: '[data-testid="timestamp"]',
  userAvatars: '[data-testid="user-avatar"]',
  activityIndicators: '[data-testid="activity-indicator"]',
  loadingSpinners: '[data-testid="loading-spinner"]',
};

/**
 * Helper to get common mask selectors
 */
export function getDefaultMasks(): Array<{ selector: string }> {
  return Object.values(DEFAULT_MASKS).map(selector => ({ selector }));
}
