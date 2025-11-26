# Required Code Changes for E2E Tests

This document outlines the code changes needed in the Galaxy Maps application to enable effective E2E testing with Playwright. The test infrastructure has been built, but several application changes are required for tests to interact with the UI properly.

## Overview

The E2E tests use the Page Object Model pattern and interact with the application through:
1. **data-testid attributes** for reliable element selection
2. **vis-network API exposure** for canvas-based interactions
3. **Proper button/element roles** for accessibility and testability

## Priority Levels

- 🔴 **Critical**: Required for tests to run
- 🟡 **High**: Significantly improves test reliability
- 🟢 **Medium**: Nice to have, improves maintainability

---

## 1. Expose vis-network Instance (🔴 Critical)

The galaxy map uses vis-network which renders on a canvas. To interact with nodes and edges in tests, we need to expose the network instance to the window object.

### File: `src/components/GalaxyView/GalaxyMap.vue`

**Location**: In the `mounted()` lifecycle hook, after network initialization

```typescript
// Add after network initialization
mounted() {
  // ... existing network initialization code

  // Expose vis-network for E2E tests
  if (import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_EMULATOR) {
    (window as any).__visNetwork__ = this.$refs.network;
  }
}
```

**Why**: Tests use `page.evaluate()` to interact with nodes/edges on the canvas since they can't be accessed via DOM.

**Test Dependencies**:
- `GalaxyMapComponent.clickNode()`
- `GalaxyMapComponent.dragBetweenNodes()`
- `GalaxyMapComponent.nodeExists()`
- All node/edge interaction tests

---

## 2. Add data-testid Attributes (🟡 High Priority)

Add `data-testid` attributes to key UI elements for reliable test selection.

### 2.1 Galaxy Creation Dialog

**File**: `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue`

```vue
<template>
  <!-- Mode selection buttons -->
  <v-btn
    @click="selectManualMode"
    data-testid="create-manually-button"
  >
    Create Manually
  </v-btn>

  <v-btn
    @click="selectAIMode"
    data-testid="create-with-ai-button"
  >
    Create with AI
  </v-btn>

  <!-- Form fields -->
  <v-text-field
    v-model="title"
    label="Galaxy name"
    data-testid="galaxy-title-input"
  />

  <v-textarea
    v-model="description"
    label="Galaxy description"
    data-testid="galaxy-description-input"
  />

  <v-file-input
    label="Upload Galaxy Image"
    data-testid="galaxy-image-upload"
  />

  <!-- Action buttons -->
  <v-btn
    @click="handleCreateGalaxy"
    data-testid="create-galaxy-button"
  >
    CREATE GALAXY
  </v-btn>
</template>
```

**Test Dependencies**:
- `CreateGalaxyDialog` page object
- `create-manual-galaxy.spec.ts`

### 2.2 Node Creation/Edit Dialog

**File**: `src/components/Dialogs/CreateEditDeleteNodeDialog.vue`

```vue
<template>
  <!-- Form fields -->
  <v-text-field
    v-model="nodeTitle"
    label="Node title"
    data-testid="node-title-input"
  />

  <v-file-input
    label="Node image"
    data-testid="node-image-upload"
  />

  <v-text-field
    v-model="nodeSize"
    label="Node size"
    type="number"
    data-testid="node-size-input"
  />

  <v-checkbox
    v-model="hasPrerequisites"
    label="Does another Node need to be completed first?"
    data-testid="prerequisites-checkbox"
  />

  <v-select
    v-model="selectedPrerequisites"
    :items="availableNodes"
    multiple
    data-testid="prerequisites-select"
  />

  <!-- Action buttons -->
  <v-btn
    @click="saveNode"
    data-testid="save-node-button"
  >
    SAVE
  </v-btn>

  <v-btn
    @click="updateNode"
    data-testid="update-node-button"
  >
    UPDATE
  </v-btn>

  <v-btn
    color="error"
    @click="deleteNode"
    data-testid="delete-node-button"
  >
    DELETE
  </v-btn>
</template>
```

**Test Dependencies**:
- `CreateNodeDialog` page object
- All node CRUD tests

### 2.3 Galaxy View Elements

**File**: `src/components/GalaxyView/GalaxyView.vue` or `GalaxyInfo.vue`

```vue
<template>
  <!-- Galaxy info -->
  <div data-testid="galaxy-title">
    {{ galaxyTitle }}
  </div>

  <div data-testid="galaxy-description">
    {{ galaxyDescription }}
  </div>

  <!-- Mode toggle instructions -->
  <div
    v-if="addNodeMode"
    data-testid="add-node-instruction"
  >
    Click on the map to add a new Star
  </div>

  <div
    v-if="addEdgeMode"
    data-testid="connect-stars-instruction"
  >
    Click and drag to connect two Stars
  </div>

  <div
    v-if="dragMode"
    data-testid="drag-instruction"
  >
    Click and drag to reposition Star
  </div>
</template>
```

**Test Dependencies**:
- `GalaxyViewPage.getGalaxyTitle()`
- `GalaxyViewPage.getGalaxyDescription()`
- Mode detection in tests

### 2.4 Galaxy Map Buttons

**File**: `src/components/GalaxyView/GalaxyMapButtons.vue`

```vue
<template>
  <v-btn
    v-if="positionsChanged"
    @click="savePositions"
    data-testid="save-positions-button"
  >
    <v-icon>{{ mdiContentSaveCheck }}</v-icon>
  </v-btn>

  <v-btn
    v-if="positionsChanged"
    @click="cancelPositions"
    data-testid="cancel-positions-button"
  >
    CANCEL
  </v-btn>
</template>
```

**Test Dependencies**:
- `GalaxyViewPage.saveNodePositions()`
- `GalaxyViewPage.cancelNodePositions()`

### 2.5 Edge Info Panel

**File**: `src/components/GalaxyView/EdgeInfoPanel.vue`

```vue
<template>
  <div
    class="edge-info-panel"
    data-testid="edge-info-panel"
  >
    <v-btn
      color="error"
      @click="deleteEdge"
      data-testid="delete-edge-button"
    >
      Delete Edge
    </v-btn>
  </div>
</template>
```

**Test Dependencies**:
- `EdgeInfoPanel` component
- Edge deletion tests

### 2.6 Loading Spinner

**File**: Components that show loading states (multiple files)

```vue
<template>
  <v-progress-circular
    indeterminate
    data-testid="loading-spinner"
  />
</template>
```

**Test Dependencies**:
- `BasePage.waitForLoading()`
- All page objects that wait for loading

### 2.7 Galaxy List Cards

**File**: `src/components/GalaxyList/*.vue`

```vue
<template>
  <v-card data-testid="galaxy-card">
    <div data-testid="galaxy-title">
      {{ galaxy.title }}
    </div>

    <v-btn
      @click="deleteGalaxy"
      data-testid="delete-galaxy-button"
    >
      Delete
    </v-btn>
  </v-card>
</template>
```

**Test Dependencies**:
- `GalaxyListPage.getGalaxyCard()`
- `GalaxyListPage.deleteGalaxy()`

---

## 3. Improve Button Accessibility (🟢 Medium Priority)

Ensure buttons have proper `role` attributes and accessible names for Playwright's `getByRole()` selectors.

### General Pattern

```vue
<!-- Good -->
<v-btn
  role="button"
  aria-label="Add a new Star"
  @click="addNode"
>
  Add a new Star
</v-btn>

<!-- Also Good (button role is implicit for v-btn) -->
<v-btn @click="addNode">
  Add a new Star
</v-btn>
```

**Test Dependencies**:
- All page objects using `page.getByRole('button', { name: ... })`

---

## 4. Confirmation Messages (🟢 Medium Priority)

Add success/error messages for user actions to make tests more deterministic.

### File: Components with CRUD operations

```vue
<template>
  <v-snackbar
    v-model="nodeCreatedSnackbar"
    data-testid="node-created-message"
  >
    Node "{{ createdNodeTitle }}" created successfully
  </v-snackbar>

  <v-snackbar
    v-model="nodeDeletedSnackbar"
    data-testid="node-deleted-message"
  >
    Node deleted successfully
  </v-snackbar>

  <v-snackbar
    v-model="edgeDeletedSnackbar"
    data-testid="edge-deleted-message"
  >
    Edge deleted successfully
  </v-snackbar>
</template>
```

**Test Dependencies**:
- `BasePage.waitForSnackbar()`
- Improved test reliability by confirming actions completed

---

## 5. User Menu (🟢 Medium Priority)

Add data-testid to user menu for login verification.

### File: `src/components/Home/UserBar.vue`

```vue
<template>
  <div data-testid="user-menu">
    <span data-testid="user-name">{{ userName }}</span>
    <!-- ... other user menu items -->
  </div>
</template>
```

**Test Dependencies**:
- `LandingPage.isLoggedIn()`

---

## Implementation Checklist

### Phase 1: Critical Changes (Required to run tests)

- [ ] Expose vis-network instance to window (GalaxyMap.vue)
- [ ] Add data-testid to galaxy creation dialog form
- [ ] Add data-testid to node creation dialog form

### Phase 2: High Priority (Improves reliability)

- [ ] Add data-testid to galaxy view elements (title, description)
- [ ] Add data-testid to edge info panel
- [ ] Add data-testid to galaxy map buttons (save/cancel positions)
- [ ] Add data-testid to loading spinners
- [ ] Add data-testid to galaxy list cards

### Phase 3: Medium Priority (Nice to have)

- [ ] Add success/error snackbars for actions
- [ ] Add data-testid to user menu
- [ ] Improve button accessibility attributes
- [ ] Add data-testid to mode instruction messages

---

## Testing the Changes

After implementing these changes:

1. **Start Firebase Emulators**:
   ```bash
   npm run emulators:start
   ```

2. **Start Dev Server with Emulator Mode**:
   ```bash
   npm run dev:emulator
   ```

3. **Run E2E Tests**:
   ```bash
   npm run test:e2e
   ```

4. **Or use the all-in-one command**:
   ```bash
   npm run e2e:run-local
   ```

---

## Debugging Tips

### 1. Check if vis-network is exposed

Open browser console in test mode:
```javascript
console.log(window.__visNetwork__);
// Should show the network instance
```

### 2. Verify data-testid attributes

In headed mode, inspect elements:
```bash
npm run test:e2e:headed
```

Then check if data-testid attributes are present in the DOM.

### 3. Use Playwright Inspector

```bash
npm run test:e2e -- --debug
```

Step through tests and inspect element selectors.

---

## Impact on Production

All changes are safe for production:

- **data-testid attributes**: Ignored by browsers, no performance impact
- **vis-network exposure**: Only enabled in test/emulator mode
- **Accessibility improvements**: Benefit all users

---

## Alternative Approaches

If adding data-testid attributes is not desired, alternative selectors can be used:

1. **CSS Classes** (less stable):
   ```typescript
   page.locator('.galaxy-title-class')
   ```

2. **Text Content** (locale-dependent):
   ```typescript
   page.getByText('Galaxy name')
   ```

3. **XPath** (brittle):
   ```typescript
   page.locator('xpath=//div[@class="v-input"]//input')
   ```

However, `data-testid` is the recommended approach for:
- Stability across refactors
- Clear test intent
- Separation of concerns (testing vs styling)

---

## Questions?

For questions about E2E testing implementation, see:
- [TESTING.md](../TESTING.md) - Testing guide
- [automated-testing-plan.md](./automated-testing-plan.md) - Complete testing plan
- Playwright docs: https://playwright.dev/

---

*Last Updated: 2025-01-26*
*Status: Ready for Implementation*
