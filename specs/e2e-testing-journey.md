# E2E Testing Journey - Current Status

**Last Updated:** 2025-11-28
**Current Branch:** `e2e-tests-pipeline`

## Overview

This document tracks our progress implementing end-to-end (E2E) tests for Galaxy Maps using Playwright. It documents fixtures created, code changes made, issues encountered, and lessons learned.

---

## Current Status

### ✅ Completed
- **Phase 1:** E2E testing framework foundation (Playwright, fixtures, page objects)
- **Phase 2:** Core test scenarios (authentication, galaxy CRUD basics)
- **Phase 3:** Application code changes for testability
- **Authentication fixture:** Email verification flow working with Firebase Auth Emulator
- **Galaxy fixtures:** Created `emptyGalaxy` fixture that properly mimics production galaxy creation
- **Security rules:** Updated to use string UIDs instead of DocumentReferences for `owner` field
- **Component fixes:** Fixed GalaxyMap component crashes when network isn't available yet

### 🔄 In Progress
- **TC002: Galaxy Node CRUD test** - Currently debugging intro node loading issue
- Resolving CORS errors from Cloud Functions calls during test execution

### ⏳ Pending
- Complete galaxy node CRUD operations tests
- Galaxy edge/connection tests
- Additional test scenarios from Phase 2 specs

---

## Fixtures Created

### 1. Authentication Fixtures (`tests/e2e/fixtures/auth.fixture.ts`)

#### `authenticatedUser`
- **Purpose:** Creates a test user, verifies email, and logs them in
- **Returns:** `{ uid, email, password }`
- **Key Features:**
  - Registers user via Landing page
  - Fetches OOB code from Auth Emulator
  - Verifies email via verification link
  - Logs in and waits for navigation to `/my-galaxies` or `/`
  - Retrieves real Firebase Auth UID from Firestore person document

#### `unauthenticatedPage`
- **Purpose:** Provides a clean browser page without authentication
- **Use Case:** Testing login/registration flows

**Key Learning:** The Auth fixture was initially using fake generated UIDs, but we discovered it needs to query Firestore for the actual Firebase Auth UID assigned to the person document. This ensures security rules work correctly.

```typescript
// Get the real Firebase Auth UID by querying Firestore
const peopleQuery = db.collection('people').where('email', '==', user.email);
const peopleSnapshot = await peopleQuery.get();
const personDoc = peopleSnapshot.docs[0];
const uid = personDoc.id;  // Document ID is the Firebase Auth UID
```

### 2. Galaxy Fixtures (`tests/e2e/fixtures/galaxy.fixture.ts`)

#### `emptyGalaxy`
- **Purpose:** Creates a test galaxy with only the intro node (mimics production behavior)
- **Returns:** `{ galaxyId, title, userId }`
- **Key Features:**
  - Uses Firebase Admin SDK to bypass security rules during test setup
  - Creates galaxy document with proper structure
  - **Automatically creates intro node** (critical: matches `saveCourse()` in CreateEditDeleteGalaxyDialog)
  - Creates both map-node and topic documents for the intro node
  - Includes 1-second delay for Firestore propagation

**Key Learning:** The fixture MUST create the intro node because that's what the production UI does. Every galaxy created through `CreateEditDeleteGalaxyDialog.vue` automatically gets an intro node at position (0,0).

---

## Test Helpers Created

### Firestore Helpers (`tests/e2e/utils/firestore-helpers.ts`)

**Key Change:** Switched from client SDK to **Firebase Admin SDK** to bypass security rules during test data setup.

```typescript
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
```

#### Functions:
- `initializeTestFirestore()` - Initializes Admin SDK with emulator connection
- `createTestUser()` - Creates person document in Firestore
- `createTestGalaxy()` - Creates galaxy with intro node and topic
- `createTestNode()` - Creates additional map nodes
- `createTestEdge()` - Creates connections between nodes
- `cleanupTestData()` - Removes test data after tests

**Why Admin SDK?**
- Client SDK enforces Firestore security rules
- Admin SDK bypasses rules (perfect for test data setup)
- Test fixtures need to create data regardless of user permissions

---

## Code Changes for E2E Testing

### 1. Firebase Configuration (`src/store/firestoreConfig.ts`)

**Status:** Already configured correctly
- Connects to emulators when `VITE_USE_EMULATOR=true`
- Properly configures Firestore, Auth, Functions, Storage, and Realtime DB emulators

### 2. Security Rules Updates (`rules/firestore.rules`)

**Key Change:** Updated `canEditCourse()` function to accept `owner` as a string UID instead of DocumentReference.

```javascript
function canEditCourse(courseId) {
  let course = get(/databases/$(database)/documents/courses/$(courseId)).data;
  return isAuthenticated() && exists(...) && (
    // Owner can be a simple string UID
    (course.owner != null && request.auth.uid == course.owner) ||
    // ... other checks
  );
}
```

**Test Fixture Change:** Updated `createTestGalaxy()` to use string UID:
```typescript
owner: options.userId,  // String UID (not DocumentReference)
```

### 3. GalaxyView Component (`src/views/GalaxyView.vue`)

#### Issue: CORS Errors from Cloud Functions
**Problem:** Draft courses were calling `fetchCohorts()` and `getCohortsByCourseId()` which caused CORS errors in test environment.

**Solution:** Skip cohort fetching for draft courses (cohorts only relevant for published courses).

**Changes Made:**

```typescript
// In boundCourse watcher (line 369-372)
// Only fetch cohorts for published courses (not needed for draft courses)
if (newVal && newVal.status === 'published') {
  this.cohortsInCourse = await fetchAllCohortsInCourseByCourseId(this.courseId);
}

// In mounted() hook (line 410-440)
// Only fetch cohorts for published courses (not needed for draft courses)
if (this.boundCourse && this.boundCourse.status === 'published') {
  const cohorts = await fetchCohorts();
  // ... cohort-related logic
}
```

**Why This Works:**
- Test galaxies have `status: 'drafting'`
- Cloud Functions aren't needed for draft courses
- Avoids CORS preflight issues with Functions Emulator
- Matches production behavior (cohorts only matter for published courses)

### 4. GalaxyMap Component (`src/components/GalaxyView/GalaxyMap.vue`)

#### Issue 1: Component Crash on Mount
**Problem:** `mounted()` hook tried to access `this.$refs.network` before the network component rendered.

**Solution:** Added null check:
```typescript
if (this.$refs.network) {
  console.log("this.$refs.network.nodes: ", this.$refs.network.nodes);
  // Expose vis-network for E2E tests
  if (import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_EMULATOR) {
    window.__visNetwork__ = this.$refs.network;
  }
} else {
  console.log("Network ref not available yet in mounted()");
}
```

#### Issue 2: Network Not Exposed for Tests
**Problem:** `__visNetwork__` wasn't available because nodes loaded after `mounted()` hook.

**Solution:** Added watcher to expose network once nodes load:
```typescript
// Watch for nodes loading and expose network for E2E tests (line 275-287)
currentCourseNodes: {
  handler(newNodes) {
    if (newNodes && newNodes.length > 0 && this.$refs.network) {
      if (import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_EMULATOR) {
        console.log('[GalaxyMap] Exposing __visNetwork__ with', newNodes.length, 'nodes');
        window.__visNetwork__ = this.$refs.network;
      }
    }
  },
  immediate: false,
},
```

### 5. GalaxyView Permission Checks

#### Issue: Teacher Permission Check
**Problem:** The `teacher` computed property didn't check the `owner` field.

**Solution:** Added owner check (line 477):
```typescript
teacher() {
  if (!this.person?.id || !this.boundCourse) {
    return false;
  }
  return (
    this.boundCourse?.owner === this.person.id ||  // Added this check
    this.boundCourse?.mappedBy?.personId === this.person.id ||
    this.user.data?.admin ||
    // ... collaboratorIds check
  );
}
```

#### Issue: Restricted Galaxy Check
**Problem:** `isRestricted()` returned `true` when `boundCourse` was null/loading, showing "INVALID OR RESTRICTED" error.

**Solution:** Return `false` during loading (line 493-496):
```typescript
isRestricted() {
  // If no course data loaded yet, DON'T show restricted - let loading state handle it
  if (!this.boundCourse || !this.boundCourse.id) return false;
  // ... rest of checks
}
```

---

## Page Objects

### GalaxyViewPage (`tests/e2e/page-objects/galaxy-view.page.ts`)

**Key Methods:**
- `goto(galaxyId)` - Navigate to galaxy and wait for load
- `waitForGalaxyToLoad()` - Waits for `__visNetwork__` to be available
- `enableAddNodeMode()` - Clicks both "Add/Edit Stars" toggle and "Add a new star" button
- `addNode()` - Clicks canvas position and fills in node details
- `getNodeCount()` - Returns count of nodes in the network

**Key Learning:** Galaxy map buttons are `<div>` elements with click handlers, not semantic `<button>` elements. Must use `getByText()` instead of `getByRole('button')`.

```typescript
// These are div elements, not semantic buttons
this.editStarsToggle = page.getByText(/add\/edit stars/i);  // Top panel toggle
this.addNodeButton = page.getByText(/add a new star/i);     // Bottom toolbar
```

### GalaxyMapComponent (`tests/e2e/page-objects/components/galaxy-map.component.ts`)

**Key Methods:**
- `clickAtPosition(x, y)` - Clicks relative to canvas bounding box
- `getNodeCount()` - Uses `window.__visNetwork__.nodes.length`
- `verifyNodeExists(title)` - Checks if node with title exists

**Key Learning:** Initially tried to access `network.body.data.nodes`, but correct API is `network.nodes` directly.

---

## Issues Encountered & Solutions

### 1. Email Verification Timeout
**Problem:** Test couldn't find OOB codes in Auth Emulator.
**Root Cause:** Dev server not running with `VITE_USE_EMULATOR=true`.
**Solution:** Run dev server with `npm run dev:emulator`.

### 2. Firestore Permission Errors
**Problem:** `7 PERMISSION_DENIED` errors when creating test data.
**Root Cause:** Client SDK enforces security rules.
**Solution:** Switched test helpers to use Firebase Admin SDK.

### 3. UID Mismatch
**Problem:** User couldn't access their own galaxy.
**Root Cause:** Fixture generated fake UID instead of using real Firebase Auth UID.
**Solution:** Query Firestore person document to get actual UID.

### 4. Canvas Not Rendering
**Problem:** vis-network canvas didn't appear for empty galaxies.
**Root Cause:** `nodesToDisplay()` returned `false` when no nodes, preventing `<network>` component from rendering.
**Solution:** Fixed fixture to create intro node (matching production behavior).

### 5. CORS Errors from Cloud Functions
**Problem:** `getCohorts()` and `getCohortsByCourseId()` failed with CORS errors.
**Root Cause:** Functions Emulator doesn't handle CORS preflight properly from localhost.
**Solution:** Skip cohort fetching for draft courses (cohorts only relevant for published courses).

### 6. Button Selector Issues
**Problem:** `getByRole('button')` couldn't find galaxy map buttons.
**Root Cause:** Buttons are `<div>` elements, not semantic `<button>` elements.
**Solution:** Use `getByText()` selectors instead.

### 7. Two-Button Confusion
**Problem:** Test clicked wrong button for add node mode.
**Root Cause:** "Add/Edit Stars" is a toggle for the toolbar, "ADD A NEW STAR" is the actual action button.
**Solution:** Create separate selectors and click both in sequence.

---

## Lessons Learned

### Test Data Setup
1. **Use Admin SDK for test data creation** - Bypasses security rules
2. **Match production data structures exactly** - Don't skip steps like intro node creation
3. **Use real Firebase Auth UIDs** - Query Firestore to get actual UIDs, don't generate fake ones
4. **Owner field format matters** - Use string UID to match security rules

### Component Testing
1. **Check if refs exist before accessing** - Components may mount before child components render
2. **Use watchers for async initialization** - Don't rely on `mounted()` hook for reactive data
3. **Skip unnecessary API calls in tests** - Conditional logic based on draft vs published status
4. **Non-semantic HTML needs different selectors** - Use `getByText()` when elements aren't proper buttons

### Emulator Quirks
1. **Firestore emulator doesn't hot-reload rules** - Must restart emulator after rules changes
2. **Functions emulator has CORS issues** - Avoid calling functions from localhost if possible
3. **Wait for data propagation** - Add small delays after Admin SDK writes

### Test Architecture
1. **Fixtures should mimic user actions** - But using direct API calls for speed
2. **Page Objects for maintainability** - Separate selectors from test logic
3. **Component Page Objects for reusability** - Extract common interactions (like galaxy-map)
4. **Console logging in headed mode** - Essential for debugging complex issues

---

## Next Steps

### Immediate (To Complete TC002)
1. ✅ Skip cohort fetching for draft courses (DONE)
2. 🔄 Verify intro node now loads correctly
3. ⏳ Complete canvas clicking and node creation flow
4. ⏳ Ensure test passes end-to-end

### Short Term
1. Complete remaining galaxy node CRUD tests (TC003-TC006)
2. Implement galaxy edge/connection tests
3. Add test for editing existing nodes
4. Add test for deleting nodes

### Medium Term
1. Refactor other test scenarios to use fixtures consistently
2. Create additional fixtures (e.g., `galaxyWithNodes`, `publishedGalaxy`)
3. Add visual regression testing
4. Set up CI/CD pipeline for E2E tests

### Long Term
1. Expand test coverage to other views (CohortView, UserDashboard, etc.)
2. Performance testing for large galaxies
3. Mobile viewport testing
4. Accessibility testing

---

## Test Data Patterns

### Naming Conventions
- Test users: `test-user-{timestamp}-{random}@example.test`
- Test galaxies: `test-galaxy-{timestamp}-{random}`
- Test nodes: `test-node-{timestamp}-{random}`

### Cleanup Strategy
- Use `cleanupTestData()` in `afterEach` hooks
- Admin SDK can delete regardless of security rules
- Clean up in reverse order of creation (edges → nodes → galaxies → users)

---

## Running Tests

### Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- galaxy-node-crud.spec.ts

# Run specific test by grep
npm run test:e2e -- galaxy-node-crud.spec.ts --grep "TC002:"

# Run in headed mode (with visible browser)
npm run test:e2e -- galaxy-node-crud.spec.ts --headed

# Run with single worker (sequential, easier to debug)
npm run test:e2e -- galaxy-node-crud.spec.ts --workers=1
```

### Prerequisites
1. Emulators running: `npm run emulators:start`
2. Dev server with emulator mode: `npm run dev:emulator`
3. Environment variables set in `.env.test`

---

## References

- **Test Specs:** `/specs/e2e-test-scenarios.md`
- **Required Changes:** `/specs/e2e-required-code-changes.md`
- **Auth Fixture:** `/tests/e2e/fixtures/auth.fixture.ts`
- **Galaxy Fixture:** `/tests/e2e/fixtures/galaxy.fixture.ts`
- **Firestore Helpers:** `/tests/e2e/utils/firestore-helpers.ts`
- **Page Objects:** `/tests/e2e/page-objects/`

---

## Notes for Future Testing

### When Adding New Tests
1. Check if existing fixtures can be reused
2. Follow the Page Object Model pattern
3. Use Admin SDK for test data setup
4. Add console logging for debugging
5. Test in headed mode first to see visual feedback

### When Tests Fail
1. Run in headed mode with `--headed`
2. Check browser console for errors
3. Verify emulators are running
4. Check Firestore security rules
5. Ensure fixture data matches production structure
6. Look for CORS issues if calling Cloud Functions

### Performance Considerations
1. Fixtures run once per test (fast setup)
2. Admin SDK is faster than UI actions
3. Use `--workers=1` for debugging, parallel workers for CI
4. Add minimal delays only when absolutely necessary
