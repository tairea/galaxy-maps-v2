# Bug: Mission Editor Not Displaying missionInstructionsHtmlString

## Bug Description
When editing a mission in the CreateEditDeleteMissionDialog component, the VueEditor displays `task.description` instead of `task.missionInstructionsHtmlString`. The component should prioritize showing `task.missionInstructionsHtmlString` if it exists, falling back to `task.description` only when `missionInstructionsHtmlString` is not available.

**Symptoms:**
- When editing an existing mission that has `missionInstructionsHtmlString`, the editor shows the `description` field instead
- This causes the wrong content to be displayed in the editor
- The pattern exists elsewhere in the codebase (e.g., MissionsCard.vue:435) where `missionInstructionsHtmlString` is properly prioritized

**Expected Behavior:**
The VueEditor should display `task.missionInstructionsHtmlString` if it exists, otherwise fall back to `task.description`

**Actual Behavior:**
The VueEditor always displays `task.description` regardless of whether `missionInstructionsHtmlString` exists

## Problem Statement
The dialog watcher in CreateEditDeleteMissionDialog.vue (lines 614-626) only checks for `task.description` when initializing the Quill editor content. It does not check for or prioritize the `missionInstructionsHtmlString` field, which is the newer, preferred field for storing formatted mission instructions.

## Solution Statement
Update the dialog watcher to check for `missionInstructionsHtmlString` first before falling back to `description`, following the same pattern used in other components like MissionsCard.vue.

## Steps to Reproduce
1. Navigate to a course/galaxy with existing missions
2. Open a mission that has `missionInstructionsHtmlString` populated
3. Click the edit button on the mission
4. Observe that the VueEditor displays the `description` field content instead of `missionInstructionsHtmlString`

## Root Cause Analysis
The root cause is in the `watch.dialog()` method at lines 614-626 of CreateEditDeleteMissionDialog.vue:

```javascript
watch: {
  dialog(newVal) {
    if (newVal && this.taskToEdit) {
      Object.assign(this.task, this.taskToEdit);
      // If there's existing HTML content, set it in the Quill editor
      if (this.task.description && this.task.description.trim()) {  // <-- PROBLEM: Only checks description
        this.$nextTick(() => {
          const cleanedHtml = this.sanitizeHtmlEdges(this.task.description);  // <-- PROBLEM: Only uses description
          this.setQuillContent(cleanedHtml);
        });
      }
    }
  },
},
```

The code only checks `this.task.description` and never considers `this.task.missionInstructionsHtmlString`. This is inconsistent with the rest of the codebase, where `missionInstructionsHtmlString` is the preferred field.

**Evidence from codebase:**
- MissionsCard.vue:435 uses: `this.task.missionInstructionsHtmlString || this.task.description || ""`
- SelectedMissionsCard.vue:69 uses: `this.task.missionInstructionsHtmlString || this.task.description || ""`
- ActiveMissionsCard.vue:96 uses: `this.task.missionInstructionsHtmlString || this.task.description || ""`

## Relevant Files
Use these files to fix the bug:

### Existing Files
- **src/components/Dialogs/CreateEditDeleteMissionDialog.vue** (lines 614-626)
  - Contains the dialog watcher that needs to be updated to check for `missionInstructionsHtmlString` first
  - This is the primary file that needs modification

- **src/components/SolarSystemView/MissionsList/MissionsCard.vue** (line 435)
  - Reference implementation showing the correct pattern: `this.task.missionInstructionsHtmlString || this.task.description || ""`
  - Demonstrates the proper fallback logic to follow

### New Files
No new files need to be created.

## Step by Step Tasks

### 1. Update the dialog watcher to prioritize missionInstructionsHtmlString
- Modify the `watch.dialog()` method in CreateEditDeleteMissionDialog.vue (lines 614-626)
- Change the condition to check for `missionInstructionsHtmlString` first, then fall back to `description`
- Use the same pattern as MissionsCard.vue: `this.task.missionInstructionsHtmlString || this.task.description`
- Ensure the logic properly handles cases where:
  - Both fields exist (use `missionInstructionsHtmlString`)
  - Only `missionInstructionsHtmlString` exists (use it)
  - Only `description` exists (use it)
  - Neither exists (handle gracefully)

### 2. Verify the fix handles edge cases
- Test with missions that have only `description`
- Test with missions that have only `missionInstructionsHtmlString`
- Test with missions that have both fields
- Test with missions that have neither field
- Verify the Quill editor correctly displays the content in all cases

### 3. Run validation commands
- Build the project to ensure no compilation errors
- Run linting to verify code quality
- Run E2E tests to validate the fix works correctly

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `npm run build` - Build the project to validate no compilation errors
- `npm run lint` - Run linting to validate code quality
- `npm run type-check` - Run TypeScript type checking to ensure type safety

## Notes
- The `missionInstructionsHtmlString` field is the newer, preferred field for storing mission instructions
- The `description` field is kept for backwards compatibility
- This pattern of prioritizing `missionInstructionsHtmlString` is already established in multiple components (MissionsCard.vue, SelectedMissionsCard.vue, ActiveMissionsCard.vue)
- The fix should be minimal and surgical - only update the watcher logic to check the correct field
- No database migrations or data changes are required
- The fix maintains backwards compatibility with missions that only have `description`
