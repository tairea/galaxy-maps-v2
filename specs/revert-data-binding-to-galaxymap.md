# Revert Data Binding to GalaxyMap.vue

## Problem

Unauthenticated users viewing public galaxy maps get permission errors when loading nodes/edges because:

1. GalaxyView.vue now binds nodes/edges immediately after binding the course
2. Firestore security rules need to evaluate `coursePublicAccess()` which reads the course document
3. The course document isn't cached yet for unauthenticated users
4. Security rule evaluation fails → Permission denied

## Root Cause

In the e2e-tests-pipeline branch, data binding was moved from GalaxyMap.vue to GalaxyView.vue for consistency. However, this creates a timing issue:

**Current (Broken) Flow:**
```
GalaxyView.mounted() → bindCourse() → [no cache yet] → bindNodes() → Security rule fails!
```

**Main (Working) Flow:**
```
GalaxyView.mounted() → bindCourse() → [cache populates]
  ↓ (component fully mounted)
GalaxyMap.mounted() → refreshData() → bindNodes() → [cache available] → Success!
```

## Solution Plan

Revert data binding back to how it was in main branch while preserving E2E test changes.

---

## Files to Modify

### 1. `src/views/GalaxyView.vue`

**Changes to REVERT (remove from mounted):**
- ❌ Remove: `await this.bindCourseNodes(this.courseId);`
- ❌ Remove: `await this.bindCourseEdges(this.courseId);`
- ❌ Remove: All task binding logic (student/teacher checks)
- ❌ Remove: Added delay/nextTick logic

**Changes to KEEP:**
- ✅ Keep: Authentication checks for cohort fetching (lines 370-376, 431-464)
- ✅ Keep: Try/catch error handling for cohort fetches
- ✅ Keep: E2E test related changes (if any)

**Result:** GalaxyView.vue should only bind the course document, just like in main.

---

### 2. `src/components/GalaxyView/GalaxyMap.vue`

**Changes to REVERT:**
- ✅ Restore: `refreshData()` call in `mounted()` hook
- ✅ Restore: Original `refreshData()` method that binds nodes/edges/tasks

**Changes to KEEP:**
- ✅ Keep: All E2E test watchers (currentCourseNodes, courseTasks, personsCourseTasks)
- ✅ Keep: E2E test exposure logic (`window.__visNetwork__`, etc.)
- ✅ Keep: `refreshTaskData()` method (for course switches)
- ✅ Keep: Updated node/edge array access (`.nodesArray` instead of `.nodes`)

**New logic needed:**
- Only call `refreshData()` if `currentCourseId` is available (like main)
- Update `currentCourseId` watcher to NOT call `refreshData()` on initial load

---

### 3. `src/components/GalaxyList/GalaxyListInfoPanel/PopupGalaxyPreview.vue`

**Changes to KEEP:**
- ✅ Keep: First 3 letters for avatar fallback (line 159)
- ✅ Keep: Skip image fetching for unauthenticated users (lines 203-205)

---

## Implementation Steps

### Step 1: Restore GalaxyMap.vue `mounted()` and `refreshData()`

1. Add back `refreshData()` call in `mounted()` hook
2. Ensure `refreshData()` binds nodes, edges, and tasks (like main)
3. Keep E2E test watchers and exposure logic intact
4. Update `currentCourseId` watcher to avoid double-refresh on initial load

### Step 2: Simplify GalaxyView.vue `mounted()`

1. Remove `bindCourseNodes()` call
2. Remove `bindCourseEdges()` call
3. Remove all task binding logic (student/teacher checks)
4. Remove the delay/nextTick logic
5. Keep authentication-protected cohort fetching with try/catch

### Step 3: Update GalaxyView.vue `methods`

1. Remove `bindCourseNodes`, `bindCourseEdges`, `getCourseTasks`, `getPersonsCourseTasks`, `bindThisPersonsCourseTopics` from mapActions (if they were added)
2. These should only be in GalaxyMap.vue

### Step 4: Verify watcher logic

1. Ensure `boundCourse` watcher in GalaxyView.vue doesn't trigger data binding
2. Ensure `currentCourseId` watcher in GalaxyMap.vue triggers data refresh correctly

---

## Expected Behavior After Reversion

### For Authenticated Users (Teacher/Student)
- GalaxyView.vue mounts → binds course → binds cohorts
- GalaxyMap.vue mounts → calls `refreshData()` → binds nodes/edges/tasks
- Everything works as before

### For Unauthenticated Users (Public Galaxy)
- GalaxyView.vue mounts → binds course → skips cohorts (not authenticated)
- GalaxyMap.vue mounts → calls `refreshData()` → binds nodes/edges/tasks
- Course is cached by now → security rules succeed → Map loads!

---

## Testing Checklist

After implementation:

- [ ] Authenticated teacher can view galaxy map with all features
- [ ] Authenticated student can view assigned galaxy map with progress
- [ ] **Unauthenticated user can view public galaxy map without errors**
- [ ] E2E tests still pass (nodes/edges/planets load correctly)
- [ ] No console errors for permission denied
- [ ] Planets (tasks) display correctly for all user types

---

## Notes

- The key insight: GalaxyMap.vue mounting happens **after** GalaxyView.vue is fully mounted
- This delay allows Firestore to cache the course document
- Security rules can then successfully evaluate `coursePublicAccess()` for nodes/edges
- This is why it worked in main branch!
