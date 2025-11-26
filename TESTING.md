// Testing Guide for Galaxy Maps v2

This document provides comprehensive instructions for running, writing, and maintaining tests in the Galaxy Maps v2 project.

## Table of Contents

1. [Overview](#overview)
2. [Test Setup](#test-setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Architecture](#test-architecture)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Galaxy Maps v2 uses a multi-layered testing approach:

- **E2E Tests (Playwright)**: Full user journey testing against Firebase emulators
- **Unit Tests (Vitest)**: Component and utility function testing
- **Integration Tests**: Component + Store + Firestore interactions

### Test Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── fixtures/                 # Reusable test fixtures
│   │   ├── auth.fixture.ts       # Authentication fixtures
│   │   ├── galaxy.fixture.ts     # Galaxy creation fixtures
│   │   └── test-data.fixture.ts  # Sample test data
│   ├── page-objects/             # Page Object Model classes
│   │   ├── base.page.ts          # Base page object
│   │   ├── landing.page.ts       # Landing/auth page
│   │   ├── galaxy-list.page.ts   # Galaxy list page
│   │   ├── galaxy-view.page.ts   # Galaxy editor page
│   │   ├── dialogs/              # Dialog page objects
│   │   └── components/           # Component page objects
│   ├── utils/                    # Test utilities
│   │   ├── auth-emulator.ts      # Auth emulator helpers
│   │   ├── firestore-helpers.ts  # Firestore test utilities
│   │   ├── test-data-generator.ts # Test data factories
│   │   └── visual-helpers.ts     # Screenshot utilities
│   └── specs/                    # Test specifications
│       ├── auth/                 # Authentication tests
│       ├── galaxy/               # Galaxy management tests
│       └── smoke/                # Smoke tests
├── unit/                         # Unit tests
└── integration/                  # Integration tests
```

---

## Test Setup

### Prerequisites

1. **Node.js 20+**: Ensure Node.js is installed
2. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```
3. **Dependencies**: Install project dependencies
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env.test` file in the project root:

```env
# Base URL for E2E tests
BASE_URL=http://127.0.0.1:5173

# Firebase Emulator Configuration
FIREBASE_PROJECT_ID=galaxy-maps-test
FIREBASE_AUTH_EMULATOR=localhost:9099
FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001

# Enable emulator mode
VITE_USE_EMULATOR=true
```

### Install Playwright Browsers

```bash
npx playwright install
```

Or install a specific browser:

```bash
npx playwright install chromium
```

---

## Running Tests

### E2E Tests

#### Quick Start (All-in-One)

Run E2E tests with automatic emulator and dev server startup:

```bash
# Headless mode
npm run e2e:run-local

# Headed mode (see browser)
npm run e2e:run-local:headed
```

This command automatically:
1. Starts Firebase emulators
2. Starts the Vite dev server
3. Waits for services to be ready
4. Runs E2E tests
5. Cleans up when done

#### Manual Execution

If you prefer to control each service separately:

**Terminal 1 - Start Firebase Emulators:**
```bash
npm run emulators:start
```

**Terminal 2 - Start Dev Server:**
```bash
npm run dev:emulator
```

**Terminal 3 - Run Tests:**
```bash
npm run test:e2e
```

#### Test Execution Options

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- galaxy-node-crud.spec.ts

# Run tests matching a pattern
npm run test:e2e -- -g "should create node"

# Run with specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Debug mode (step through tests)
npm run test:e2e -- --debug

# Run with trace (detailed debugging)
npm run test:e2e -- --trace on
```

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode
npm run test:unit -- --watch

# Run specific test file
npm run test:unit -- src/components/GalaxyView/GalaxyView.spec.ts

# Run with coverage
npm run test:unit -- --coverage
```

### Firestore Rules Tests

```bash
# Run Firestore security rules tests
npm run test:rules

# Start emulators for manual rule testing
npm run test:rules:start
```

---

## Writing Tests

### Using Page Objects

Page objects encapsulate page structure and provide semantic methods:

```typescript
import { test, expect } from '@playwright/test';
import { GalaxyViewPage } from '../page-objects/galaxy-view.page';

test('should add node to galaxy', async ({ page }) => {
  const galaxyPage = new GalaxyViewPage(page);

  // Navigate to galaxy
  await galaxyPage.goto('test-galaxy-id');

  // Add node using high-level method
  await galaxyPage.addNode({
    title: 'Test Node',
    position: { x: 300, y: 300 },
  });

  // Verify node exists
  const nodeExists = await galaxyPage.verifyNodeExists('Test Node');
  expect(nodeExists).toBeTruthy();
});
```

### Using Fixtures

Fixtures provide pre-configured test data and authenticated sessions:

```typescript
import { test, expect } from '../fixtures/galaxy.fixture';

test.describe('Galaxy Node Operations', () => {
  test('add node to existing galaxy', async ({ page, galaxyWithNodes }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // Galaxy is already created with 3 nodes
    await galaxyPage.goto(galaxyWithNodes.galaxyId);

    // Verify existing nodes
    expect(galaxyWithNodes.nodes.length).toBe(3);

    // Add new node
    await galaxyPage.addNode({
      title: 'New Node',
      prerequisites: [galaxyWithNodes.nodes[0].label],
    });

    // Verify node count increased
    const nodeCount = await galaxyPage.getNodeCount();
    expect(nodeCount).toBe(4);
  });
});
```

### Test Data Generation

Use builders and generators for consistent test data:

```typescript
import { GalaxyBuilder, generateTestUser } from '../utils/test-data-generator';

// Generate test user
const user = generateTestUser({
  firstName: 'Test',
  emailPrefix: 'e2e-test',
});

// Build galaxy with nodes
const galaxyData = new GalaxyBuilder()
  .withTitle('My Test Galaxy')
  .withNodes(5)
  .withLinearPath()
  .build();

// Create branching structure
const branchingGalaxy = new GalaxyBuilder()
  .withTitle('Branching Galaxy')
  .withNode({ id: 'start', label: 'Start', x: 400, y: 100 })
  .withNode({ id: 'path-a', label: 'Path A', x: 200, y: 300 })
  .withNode({ id: 'path-b', label: 'Path B', x: 400, y: 300 })
  .withNode({ id: 'path-c', label: 'Path C', x: 600, y: 300 })
  .withBranch('start', ['path-a', 'path-b', 'path-c'])
  .build();
```

### Complete Test Example

```typescript
import { test, expect } from '../fixtures/galaxy.fixture';
import { GalaxyViewPage } from '../page-objects/galaxy-view.page';
import { getNodePrerequisites } from '../utils/firestore-helpers';
import { SAMPLE_NODE_COLORS } from '../fixtures/test-data.fixture';

test.describe('Galaxy Node CRUD Operations', () => {
  test('should create, edit, and delete node', async ({ page, emptyGalaxy }) => {
    const galaxyPage = new GalaxyViewPage(page);

    // Navigate to galaxy
    await galaxyPage.goto(emptyGalaxy.galaxyId);

    // Create node
    await galaxyPage.addNode({
      title: 'Test Node',
      size: 30,
      color: SAMPLE_NODE_COLORS.primary,
    });

    // Verify node created
    const exists = await galaxyPage.verifyNodeExists('Test Node');
    expect(exists).toBeTruthy();

    // Edit node
    await galaxyPage.editNode('Test Node', {
      title: 'Updated Node',
      size: 40,
    });

    // Verify update
    const updatedExists = await galaxyPage.verifyNodeExists('Updated Node');
    expect(updatedExists).toBeTruthy();

    // Delete node
    await galaxyPage.deleteNode('Updated Node');

    // Verify deletion
    const deletedExists = await galaxyPage.verifyNodeExists('Updated Node');
    expect(deletedExists).toBeFalsy();
  });

  test('should handle prerequisites correctly', async ({ page, galaxyWithNodes }) => {
    const galaxyPage = new GalaxyViewPage(page);
    await galaxyPage.goto(galaxyWithNodes.galaxyId);

    const firstNode = galaxyWithNodes.nodes[0];

    // Add node with prerequisite
    await galaxyPage.addNode({
      title: 'Dependent Node',
      prerequisites: [firstNode.label],
    });

    // Verify prerequisite in Firestore
    const prerequisites = await getNodePrerequisites(
      galaxyWithNodes.galaxyId,
      'dependent-node-id' // Would need to track actual ID
    );

    expect(prerequisites).toContain(firstNode.id);
  });
});
```

---

## Test Architecture

### Page Object Model (POM)

The Page Object Model separates test logic from page structure:

**Benefits:**
- Single source of truth for selectors
- Easy to maintain when UI changes
- Reusable across multiple tests
- Semantic, readable test code

**Structure:**
```
PageObject
  ├── Locators (readonly)
  ├── Constructor
  └── Methods (high-level actions)
```

**Example:**
```typescript
export class GalaxyViewPage extends BasePage {
  // Locators
  readonly addNodeButton: Locator;
  readonly galaxyTitle: Locator;

  // Constructor
  constructor(page: Page) {
    super(page);
    this.addNodeButton = page.getByRole('button', { name: /add a new star/i });
    this.galaxyTitle = page.locator('[data-testid="galaxy-title"]');
  }

  // Methods
  async addNode(options: NodeOptions) {
    await this.enableAddNodeMode();
    await this.galaxyMap.clickAtPosition(options.x, options.y);
    // ... rest of implementation
  }
}
```

### Fixtures

Fixtures provide reusable test setup:

**Types of Fixtures:**
1. **Auth Fixtures**: Pre-authenticated users
2. **Galaxy Fixtures**: Pre-created galaxies with various states
3. **Data Fixtures**: Sample test data constants

**Usage:**
```typescript
// Define fixture
export const test = base.extend<{ myFixture: MyType }>({
  myFixture: async ({}, use) => {
    // Setup
    const data = await setupData();
    await use(data);
    // Teardown
    await cleanupData(data);
  },
});

// Use in test
test('my test', async ({ myFixture }) => {
  // myFixture is ready to use
});
```

### Test Utilities

Utility modules provide helper functions:

- **firestore-helpers.ts**: Direct Firestore access for setup/verification
- **test-data-generator.ts**: Factory methods and builders
- **visual-helpers.ts**: Screenshot and visual comparison utilities

---

## Best Practices

### 1. Test Independence

Each test should be completely independent:

**❌ Bad:**
```typescript
let galaxyId: string;

test('create galaxy', async () => {
  galaxyId = await createGalaxy();
});

test('add node', async () => {
  await addNode(galaxyId); // Depends on previous test
});
```

**✅ Good:**
```typescript
test('add node to galaxy', async ({ emptyGalaxy }) => {
  await addNode(emptyGalaxy.galaxyId); // Self-contained
});
```

### 2. Use Proper Waits

Avoid arbitrary timeouts:

**❌ Bad:**
```typescript
await page.click('#save');
await page.waitForTimeout(2000); // Arbitrary wait
```

**✅ Good:**
```typescript
await page.click('#save');
await page.waitForSelector('[data-testid="success-message"]', {
  state: 'visible',
  timeout: 5000
});
```

### 3. Add data-testid Attributes

Make elements easily testable:

```vue
<template>
  <v-btn
    data-testid="save-node-button"
    @click="saveNode"
  >
    SAVE
  </v-btn>
</template>
```

```typescript
await page.locator('[data-testid="save-node-button"]').click();
```

### 4. Descriptive Test Names

Use clear, descriptive test names:

```typescript
// ✅ Good
test('should create node with prerequisites and verify dependency chain', async () => {});

// ❌ Bad
test('test 1', async () => {});
test('node test', async () => {});
```

### 5. AAA Pattern

Structure tests with Arrange, Act, Assert:

```typescript
test('should delete node and clean up prerequisites', async ({ galaxyWithNodes }) => {
  // ARRANGE
  const galaxyPage = new GalaxyViewPage(page);
  await galaxyPage.goto(galaxyWithNodes.galaxyId);
  await galaxyPage.addNode({ title: 'Final', prerequisites: ['Node 1'] });

  // ACT
  await galaxyPage.deleteNode('Node 1');

  // ASSERT
  const nodeExists = await galaxyPage.verifyNodeExists('Node 1');
  expect(nodeExists).toBeFalsy();

  const prerequisites = await getNodePrerequisites(galaxyWithNodes.galaxyId, 'final-id');
  expect(prerequisites).not.toContain('node-1');
});
```

### 6. Test Organization

Use describe blocks to group related tests:

```typescript
test.describe('Galaxy Node Management', () => {
  test.describe('Node Creation', () => {
    test('should create node with default settings', async () => {});
    test('should create node with custom image', async () => {});
  });

  test.describe('Node Editing', () => {
    test('should update node title', async () => {});
    test('should add prerequisites', async () => {});
  });

  test.describe('Node Deletion', () => {
    test('should delete node', async () => {});
    test('should clean up prerequisites', async () => {});
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Fail with "Element not found"

**Cause**: Element not loaded or selector incorrect

**Solution:**
- Add explicit wait: `await page.waitForSelector('[data-testid="element"]')`
- Check if element is in shadow DOM or canvas
- Verify data-testid attribute exists

#### 2. vis-network Interactions Don't Work

**Cause**: vis-network renders on canvas, not DOM

**Solution:**
- Expose network instance to window:
  ```typescript
  // In GalaxyMap.vue
  if (import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_EMULATOR) {
    (window as any).__visNetwork__ = this.$refs.network;
  }
  ```
- Use page.evaluate() to interact with network API

#### 3. Tests Pass Locally but Fail in CI

**Cause**: Timing differences, screen resolution, or setup issues

**Solution:**
- Increase timeouts for CI environment
- Ensure emulators are fully started before tests
- Check screen resolution settings in CI config
- Review CI logs for environment-specific errors

#### 4. Firebase Emulator Connection Errors

**Cause**: Emulators not running or wrong ports

**Solution:**
- Verify emulators are running: `lsof -i :9099`
- Check `.env.test` configuration
- Ensure no other services using same ports
- Restart emulators if stuck

#### 5. Flaky Tests (Intermittent Failures)

**Cause**: Race conditions, timing issues, or external dependencies

**Solution:**
- Remove hard-coded waits (`waitForTimeout`)
- Add proper wait conditions
- Ensure test independence
- Check for shared state between tests

### Debugging Tests

#### Run Single Test

```bash
npm run test:e2e -- galaxy-node-crud.spec.ts
```

#### Debug Mode (Step Through)

```bash
npm run test:e2e -- --debug
```

#### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

#### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

#### Enable Trace

```bash
npm run test:e2e -- --trace on
```

View trace after test:
```bash
npx playwright show-trace trace.zip
```

#### Take Screenshot

```typescript
await page.screenshot({ path: 'debug.png' });
```

#### Console Logging

```typescript
// In page context
await page.evaluate(() => console.log('Debug info:', window.__visNetwork__));

// In test
console.log('Current URL:', await page.url());
```

### View Test Reports

After running tests:

```bash
npx playwright show-report
```

---

## Additional Resources

- **Playwright Docs**: https://playwright.dev/
- **Vitest Docs**: https://vitest.dev/
- **Firebase Emulators**: https://firebase.google.com/docs/emulator-suite
- **Testing Best Practices**: https://playwright.dev/docs/best-practices

---

## Contributing Tests

When contributing new tests:

1. Follow existing patterns (Page Objects, Fixtures)
2. Add descriptive test names
3. Ensure tests are independent
4. Add proper assertions
5. Include error scenarios
6. Document complex test logic
7. Run tests locally before committing
8. Update this documentation if adding new patterns

---

*Last Updated: 2025-01-26*
