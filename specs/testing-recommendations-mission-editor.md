# Testing Recommendations for Mission Editor Component

## Overview

This document outlines comprehensive testing practices for the `CreateEditDeleteMissionDialog.vue` component fix and suggests testing infrastructure improvements that could benefit the entire Galaxy Maps project.

## Current Testing Infrastructure

Based on the codebase analysis:

### ✅ Currently Implemented
- **E2E Testing**: Playwright configured for end-to-end testing
  - Test directory: `tests/e2e/`
  - Config: `playwright.config.ts`
  - Firebase emulator integration for isolated testing
  - One existing test: `register-verify-login.spec.ts`

- **Unit Testing Framework**: Vitest configured with jsdom
  - Config: `vitest.config.ts`
  - Test command: `npm run test:unit`
  - Environment: jsdom (simulates browser)

- **Type Checking**: TypeScript with Vue TSC
  - Command: `npm run type-check`

- **Linting**: ESLint with Vue plugin
  - Command: `npm run lint`

### ❌ Missing
- **No unit tests** for Vue components (no `*.spec.ts` or `*.test.ts` files in `src/`)
- **No component integration tests** for complex components like dialogs
- **No visual regression testing** for UI components
- **No accessibility testing** automated checks
- **No mock/stub utilities** for Firebase services

---

## Recommended Testing Strategy for This Bug Fix

### Level 1: Unit Tests (High Priority)

#### Why Unit Tests for This Component?
The `CreateEditDeleteMissionDialog.vue` component has complex logic:
- Quill editor integration
- Data transformation (HTML sanitization)
- Firebase storage image uploads
- AI-powered content generation
- Reactive state management (watchers)

#### Test File Structure

Create: `src/components/Dialogs/__tests__/CreateEditDeleteMissionDialog.spec.ts`

```typescript
import { mount, createLocalVue } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Vuetify from 'vuetify';
import CreateEditDeleteMissionDialog from '../CreateEditDeleteMissionDialog.vue';

describe('CreateEditDeleteMissionDialog.vue', () => {
  let localVue;
  let vuetify;

  beforeEach(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
  });

  describe('Dialog Watcher - Field Prioritization', () => {
    it('should display missionInstructionsHtmlString when available', async () => {
      // Test case: Task has both fields
      const taskToEdit = {
        id: 'test-task-1',
        title: 'Test Mission',
        description: 'Old description',
        missionInstructionsHtmlString: '<h2>New Instructions</h2><p>Use this instead</p>',
        color: '#69a1e2'
      };

      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          taskToEdit,
          edit: true
        }
      });

      // Open dialog
      wrapper.vm.dialog = true;
      await wrapper.vm.$nextTick();

      // Verify the Quill editor receives missionInstructionsHtmlString
      const quillContent = wrapper.vm.getQuillHtml();
      expect(quillContent).toContain('New Instructions');
      expect(quillContent).not.toContain('Old description');
    });

    it('should fall back to description when missionInstructionsHtmlString is empty', async () => {
      const taskToEdit = {
        id: 'test-task-2',
        title: 'Test Mission',
        description: '<p>Fallback content</p>',
        missionInstructionsHtmlString: '',
        color: '#69a1e2'
      };

      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          taskToEdit,
          edit: true
        }
      });

      wrapper.vm.dialog = true;
      await wrapper.vm.$nextTick();

      const quillContent = wrapper.vm.getQuillHtml();
      expect(quillContent).toContain('Fallback content');
    });

    it('should handle undefined missionInstructionsHtmlString gracefully', async () => {
      const taskToEdit = {
        id: 'test-task-3',
        title: 'Test Mission',
        description: '<p>Only description</p>',
        color: '#69a1e2'
        // missionInstructionsHtmlString: undefined (omitted)
      };

      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          taskToEdit,
          edit: true
        }
      });

      wrapper.vm.dialog = true;
      await wrapper.vm.$nextTick();

      const quillContent = wrapper.vm.getQuillHtml();
      expect(quillContent).toContain('Only description');
    });

    it('should handle both fields being empty', async () => {
      const taskToEdit = {
        id: 'test-task-4',
        title: 'Empty Mission',
        description: '',
        missionInstructionsHtmlString: '',
        color: '#69a1e2'
      };

      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          taskToEdit,
          edit: true
        }
      });

      wrapper.vm.dialog = true;
      await wrapper.vm.$nextTick();

      // Should not throw error
      expect(() => wrapper.vm.getQuillHtml()).not.toThrow();
    });

    it('should sanitize HTML edges when setting Quill content', async () => {
      const taskToEdit = {
        id: 'test-task-5',
        title: 'Test Mission',
        description: '',
        missionInstructionsHtmlString: '<p></p><h2>Title</h2><p>Content</p><p><br></p>',
        color: '#69a1e2'
      };

      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          taskToEdit,
          edit: true
        }
      });

      wrapper.vm.dialog = true;
      await wrapper.vm.$nextTick();

      const quillContent = wrapper.vm.getQuillHtml();
      // Should remove leading/trailing empty paragraphs
      expect(quillContent).not.toMatch(/^<p><\/p>/);
      expect(quillContent).not.toMatch(/<p><br><\/p>$/);
    });
  });

  describe('HTML Sanitization', () => {
    it('should remove leading empty paragraphs', () => {
      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          edit: false
        }
      });

      const input = '<p></p><p><br></p><h2>Title</h2>';
      const result = wrapper.vm.sanitizeHtmlEdges(input);
      expect(result).toBe('<h2>Title</h2>');
    });

    it('should remove trailing empty paragraphs', () => {
      const wrapper = mount(CreateEditDeleteMissionDialog, {
        localVue,
        vuetify,
        propsData: {
          course: { id: 'course-1' },
          topic: { id: 'topic-1' },
          edit: false
        }
      });

      const input = '<h2>Title</h2><p></p><p><br></p>';
      const result = wrapper.vm.sanitizeHtmlEdges(input);
      expect(result).toBe('<h2>Title</h2>');
    });
  });
});
```

#### Test Execution
```bash
npm run test:unit
```

---

### Level 2: Component Integration Tests (Medium Priority)

Test the component integrated with real Quill editor instance but mocked Firebase services.

#### Create: `src/components/Dialogs/__tests__/CreateEditDeleteMissionDialog.integration.spec.ts`

```typescript
import { mount, createLocalVue } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Vuetify from 'vuetify';
import CreateEditDeleteMissionDialog from '../CreateEditDeleteMissionDialog.vue';
import { VueEditor } from 'vue2-editor';

// Mock Firebase
vi.mock('@/store/firestoreConfig', () => ({
  storage: {
    ref: vi.fn(() => ({
      put: vi.fn(() => Promise.resolve({
        ref: { getDownloadURL: () => Promise.resolve('https://example.com/image.png') }
      }))
    }))
  },
  db: {},
  functions: {}
}));

describe('CreateEditDeleteMissionDialog Integration', () => {
  let localVue;
  let vuetify;

  beforeEach(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
    // Register VueEditor globally for testing
    localVue.component('VueEditor', VueEditor);
  });

  it('should load and render Quill editor with missionInstructionsHtmlString', async () => {
    const taskToEdit = {
      id: 'test-1',
      title: 'Integration Test',
      description: 'Old content',
      missionInstructionsHtmlString: '<h2>Header</h2><ul><li>Item 1</li><li>Item 2</li></ul>',
      color: '#69a1e2'
    };

    const wrapper = mount(CreateEditDeleteMissionDialog, {
      localVue,
      vuetify,
      propsData: {
        course: { id: 'course-1' },
        topic: { id: 'topic-1' },
        taskToEdit,
        edit: true,
        tasks: []
      },
      attachTo: document.body // Needed for Quill to initialize properly
    });

    // Open the dialog
    await wrapper.find('.v-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Quill init

    // Check if Quill editor contains the right content
    const quillEditor = wrapper.findComponent({ ref: 'quillEditor' });
    expect(quillEditor.exists()).toBe(true);

    const editorContent = wrapper.vm.getQuillHtml();
    expect(editorContent).toContain('Header');
    expect(editorContent).toContain('Item 1');
    expect(editorContent).toContain('Item 2');
    expect(editorContent).not.toContain('Old content');

    wrapper.destroy();
  });

  it('should update task.description in v-model as user types', async () => {
    const wrapper = mount(CreateEditDeleteMissionDialog, {
      localVue,
      vuetify,
      propsData: {
        course: { id: 'course-1' },
        topic: { id: 'topic-1' },
        taskToEdit: {
          id: 'test-2',
          title: 'Test',
          missionInstructionsHtmlString: '<p>Initial</p>'
        },
        edit: true,
        tasks: []
      },
      attachTo: document.body
    });

    await wrapper.find('.v-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate user editing content
    const quillEditor = wrapper.vm.$refs.quillEditor;
    if (quillEditor && quillEditor.quill) {
      quillEditor.quill.setText('New content from user');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.task.description).toContain('New content from user');
    }

    wrapper.destroy();
  });
});
```

---

### Level 3: E2E Tests (High Priority for Regression Prevention)

Create end-to-end tests that validate the entire user workflow of editing a mission.

#### Create: `tests/e2e/mission-editor.spec.ts`

```typescript
import { expect, test } from '@playwright/test';
import { fetchLatestEmailVerificationLink } from './utils/auth-emulator';

test.describe('Mission Editor - missionInstructionsHtmlString Display', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher/admin user with proper permissions
    // This would require a helper function similar to the registration flow
    await page.goto('/');
    // ... authentication steps ...
  });

  test('should display missionInstructionsHtmlString when editing a mission', async ({ page }) => {
    // Navigate to a course/galaxy
    await page.goto('/course/test-course-id');

    // Navigate to a topic (Solar System View)
    await page.getByRole('button', { name: /topic name/i }).click();

    // Click the edit button on a mission that has missionInstructionsHtmlString
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Wait for dialog to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify the Quill editor contains the correct content
    const editorContent = await page.locator('.ql-editor').innerHTML();
    expect(editorContent).toContain('expected content from missionInstructionsHtmlString');

    // Verify it does NOT contain the old description field
    expect(editorContent).not.toContain('old description content');
  });

  test('should fall back to description when missionInstructionsHtmlString is empty', async ({ page }) => {
    // Similar test but with a mission that only has description
    await page.goto('/course/test-course-id/topic/test-topic-id');

    await page.getByRole('button', { name: /edit mission with only description/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    const editorContent = await page.locator('.ql-editor').innerHTML();
    expect(editorContent).toContain('description field content');
  });

  test('should save edited mission with missionInstructionsHtmlString intact', async ({ page }) => {
    await page.goto('/course/test-course-id/topic/test-topic-id');

    // Edit a mission
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Make changes to the content
    await page.locator('.ql-editor').fill('Updated mission content');

    // Save the mission
    await page.getByRole('button', { name: /update/i }).click();

    // Wait for save to complete
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Re-open the mission and verify the changes persisted
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const editorContent = await page.locator('.ql-editor').innerHTML();
    expect(editorContent).toContain('Updated mission content');
  });
});
```

#### Run E2E Tests
```bash
# With emulators
npm run e2e:run-local

# Headed mode (see browser)
npm run e2e:run-local:headed

# UI mode (interactive)
npm run test:e2e:ui
```

---

### Level 4: Visual Regression Testing (Nice to Have)

Use Playwright's screenshot comparison to catch unintended visual changes.

#### Update `playwright.config.ts`

```typescript
export default defineConfig({
  // ... existing config
  use: {
    // ... existing config
    screenshot: 'only-on-failure',
  },
  // Add snapshot path configuration
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
});
```

#### Add Visual Tests to `tests/e2e/mission-editor-visual.spec.ts`

```typescript
import { expect, test } from '@playwright/test';

test.describe('Mission Editor - Visual Regression', () => {
  test('dialog should match snapshot when editing mission', async ({ page }) => {
    await page.goto('/course/test-course-id/topic/test-topic-id');

    // Open edit dialog
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Wait for editor to fully load
    await page.waitForTimeout(500);

    // Take screenshot and compare
    await expect(page.locator('.create-dialog')).toHaveScreenshot('mission-editor-dialog.png', {
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('editor with missionInstructionsHtmlString renders correctly', async ({ page }) => {
    await page.goto('/course/test-course-id/topic/test-topic-id');
    await page.getByRole('button', { name: /edit mission with html/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(500);

    // Screenshot just the editor area
    await expect(page.locator('.ql-editor')).toHaveScreenshot('editor-with-html-content.png');
  });
});
```

---

### Level 5: Accessibility Testing (Recommended)

Ensure the dialog meets WCAG 2.1 AA standards.

#### Install axe-core for Playwright

```bash
npm install --save-dev @axe-core/playwright
```

#### Create `tests/e2e/mission-editor-a11y.spec.ts`

```typescript
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mission Editor - Accessibility', () => {
  test('dialog should not have accessibility violations', async ({ page }) => {
    await page.goto('/course/test-course-id/topic/test-topic-id');

    // Open dialog
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.create-dialog')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('quill editor should be keyboard accessible', async ({ page }) => {
    await page.goto('/course/test-course-id/topic/test-topic-id');
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Tab to the editor
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is on the editor
    const focusedElement = await page.evaluate(() => document.activeElement?.className);
    expect(focusedElement).toContain('ql-editor');

    // Type in the editor
    await page.keyboard.type('Testing keyboard input');

    const editorContent = await page.locator('.ql-editor').textContent();
    expect(editorContent).toContain('Testing keyboard input');
  });
});
```

---

## Testing Infrastructure Improvements

### 1. Create Test Utilities and Mocks

#### Create `src/test-utils/setup.ts`

```typescript
import { config } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vue from 'vue';

// Configure Vue Test Utils globally
Vue.use(Vuetify);

// Mock Firebase globally for all tests
export const mockFirebase = {
  storage: {
    ref: vi.fn(() => ({
      put: vi.fn(() => Promise.resolve({
        ref: { getDownloadURL: () => Promise.resolve('https://mock-url.com/image.png') }
      })),
      putString: vi.fn(() => Promise.resolve({
        ref: { getDownloadURL: () => Promise.resolve('https://mock-url.com/image.png') }
      }))
    }))
  },
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve())
      }))
    }))
  },
  functions: {
    httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} })))
  }
};

// Mock Pinia store
export const createMockStore = () => ({
  person: {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com'
  }
});
```

#### Create `src/test-utils/mount-helpers.ts`

```typescript
import { mount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import { createPinia, setActivePinia } from 'pinia';

/**
 * Helper to mount Vue components with commonly needed plugins
 */
export function mountWithPlugins(component, options = {}) {
  const localVue = createLocalVue();
  const vuetify = new Vuetify();
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(component, {
    localVue,
    vuetify,
    pinia,
    ...options
  });
}
```

### 2. Update `vitest.config.ts` with Setup File

```typescript
import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/*"],
      root: fileURLToPath(new URL("./", import.meta.url)),
      setupFiles: ['./src/test-utils/setup.ts'], // Add this
      coverage: { // Add coverage reporting
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test-utils/',
          '**/*.spec.ts',
          '**/*.test.ts',
        ]
      }
    },
  }),
);
```

### 3. Add Test Coverage Command to `package.json`

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:coverage": "vitest --coverage",
    "test:unit:ui": "vitest --ui"
  }
}
```

### 4. Create E2E Test Fixtures

#### Create `tests/e2e/fixtures/missions.ts`

```typescript
export const testMissions = {
  withBothFields: {
    id: 'mission-1',
    title: 'Mission with Both Fields',
    description: '<p>Old description</p>',
    missionInstructionsHtmlString: '<h2>New Instructions</h2><p>Use these</p>',
    color: '#69a1e2',
    submissionRequired: false
  },
  withOnlyDescription: {
    id: 'mission-2',
    title: 'Mission with Only Description',
    description: '<p>Description content</p>',
    color: '#69a1e2',
    submissionRequired: false
  },
  withOnlyHtmlString: {
    id: 'mission-3',
    title: 'Mission with Only HTML String',
    missionInstructionsHtmlString: '<h2>Instructions</h2>',
    color: '#69a1e2',
    submissionRequired: false
  }
};
```

---

## Testing Workflow

### Pre-Commit Testing
Add to `.husky/pre-commit` (if using Husky):
```bash
#!/bin/sh
npm run lint
npm run type-check
npm run test:unit
```

### CI/CD Pipeline Testing
Add to `.github/workflows/test.yml`:
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run e2e:run-local
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Testing Checklist for This Bug Fix

Before merging the bug fix, ensure:

### Unit Tests
- [ ] Test passes when `missionInstructionsHtmlString` exists
- [ ] Test passes when falling back to `description`
- [ ] Test handles `undefined` and empty values
- [ ] HTML sanitization works correctly
- [ ] No console errors or warnings

### Integration Tests
- [ ] Quill editor initializes correctly
- [ ] Content loads into editor properly
- [ ] v-model binding works

### E2E Tests
- [ ] User can open edit dialog
- [ ] Correct content is displayed
- [ ] User can edit and save
- [ ] Changes persist after save
- [ ] No visual regressions

### Manual Testing
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox (if supported)
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] Test coverage ≥ 80% for changed files

---

## Recommended Prioritization

1. **Immediate (Before Merging)**:
   - Unit tests for the dialog watcher logic
   - E2E test for the happy path (edit mission with missionInstructionsHtmlString)

2. **Short Term (Next Sprint)**:
   - Integration tests with real Quill editor
   - E2E tests for edge cases
   - Test utilities and mocks setup

3. **Medium Term (Next Quarter)**:
   - Visual regression testing
   - Accessibility testing
   - Coverage reporting in CI/CD

4. **Long Term (Ongoing)**:
   - Component test coverage across the app
   - Performance testing for large mission lists
   - Mutation testing for critical paths

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Guide](https://v1.test-utils.vuejs.org/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Vue.js Testing Handbook](https://lmiller1990.github.io/vue-testing-handbook/)

---

## Conclusion

Implementing these testing practices will:
- ✅ Prevent regressions of this bug
- ✅ Catch similar issues in other components
- ✅ Increase confidence in refactoring
- ✅ Improve code quality and maintainability
- ✅ Reduce manual testing time
- ✅ Enable faster feature development

Start with the high-priority tests and gradually build out the testing infrastructure as the team becomes more familiar with the practices.
