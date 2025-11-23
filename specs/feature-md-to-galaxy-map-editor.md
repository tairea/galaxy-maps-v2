# Feature: MD to Galaxy Map Editor

## Feature Description
A real-time markdown-based galaxy map editor that allows users to create and edit galaxy map structures using a simple markdown syntax. The editor provides a split-screen interface with a markdown editor on the left side and a live-updating galaxy map visualization on the right side. As users type markdown bullet lists following a specific hierarchy, the galaxy map network graph renders instantly, providing immediate visual feedback.

The markdown hierarchy maps directly to galaxy map concepts:
- **Level 1 bullets**: Sequential connecting nodes (Stars/Topics that flow from one to another)
- **Level 2 bullets (1 indent)**: Branching nodes from the parent (Related topics within a Star)
- **Level 3 bullets (2 indents)**: Planets that orbit a node (Missions/tasks to complete)

This feature democratizes galaxy map creation by allowing users to quickly prototype and structure learning journeys using familiar markdown syntax, eliminating the need for manual node positioning and edge creation.

## User Story
As a **galaxy map creator (Captain)**
I want to **type a structured markdown outline that automatically generates a galaxy map**
So that **I can rapidly prototype learning journeys without manually positioning nodes and creating connections**

## Problem Statement
Currently, creating galaxy maps requires:
1. Manual node positioning on the canvas (time-consuming and requires visual design skills)
2. Manual edge creation between nodes (tedious for complex maps)
3. Multiple dialog interactions to create nodes, planets, and missions
4. Understanding of vis-network graph editing interface
5. Difficulty in seeing the overall structure before committing to node positions

This creates friction for educators who want to focus on content structure rather than visual layout. A text-based approach would allow rapid iteration and easier collaboration (markdown can be shared, version controlled, and edited in any text editor).

## Solution Statement
Create a new view component (`MarkdownGalaxyEditor.vue`) accessible via:
- A third creation mode option in `CreateEditDeleteGalaxyDialog.vue` ("Create with .MD")
- A new route (`/md-editor`)

The editor provides:

1. **Split-pane interface**: Milkdown markdown editor (left) + Live galaxy map preview (right)
2. **Real-time parsing**: Parse markdown as user types using a custom parser function
3. **Automatic layout**: Use vis-network's native physics engine to calculate node positions
4. **Automatic edge creation**: Create connections based on markdown hierarchy
5. **Save to Firestore**: Save physics-generated positions as x,y coordinates in map-nodes collection
6. **Manual adjustment**: Users can refine positions later using existing galaxy editing features

The parser will:
- Parse markdown bullet lists into a structured data format
- Generate unique IDs for each node/planet
- Create nodes and edges arrays for vis-network
- Let vis-network physics engine calculate optimal positions
- Capture final positions after physics stabilization
- Create edges between sequential nodes (level 1) and parent-child relationships (level 1-2)
- Generate Planet instances for level 3 items

## Relevant Files
Use these files to implement the feature:

### Existing Files to Reference/Modify

**Core Galaxy Map Rendering:**
- `src/components/GalaxyView/GalaxyMap.vue` - The vis-network galaxy map component that will render the parsed markdown structure. We'll reuse this for the right-side preview.
- `src/lib/planet.ts` - Planet class for rendering orbiting missions around nodes
- `src/lib/star.ts` - Star class for visual effects

**Data Structures & Types:**
- `src/store/_types.ts` - Contains `IMapNode` and `IMapEdge` interfaces that define the shape of galaxy map data
- `src/refiners/apply-structure-ops.ts` - Contains `StarNode`, `PlanetNode`, and `GalaxyMapNode` interfaces used in AI generation (good reference for hierarchical structure)

**AI Generation Reference (for understanding structure):**
- `src/components/Dialogs/AICreateGalaxyDialog.vue` - Shows how galaxy maps are created programmatically
- `src/views/AiGalaxyEdit.vue` - Shows treeview of galaxy structure, good UX reference for showing hierarchy

**Store & Data Management:**
- `src/store/index.ts` - Root store with `bindCourseNodes` and `bindCourseEdges` actions for Firestore sync
- `src/store/firestoreConfig.ts` - Firebase/Firestore configuration

**Router:**
- `src/router/index.ts` - Add new route for the markdown editor view

**Existing Dialogs (for save/export functionality):**
- `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue` - **MODIFY**: Add third creation mode option "Create with .MD" alongside AI and Manual modes
- `src/components/Dialogs/CreateEditDeleteNodeDialog.vue` - Shows node data structure and editing
- `src/components/Dialogs/SaveGalaxyDialog.vue` - Shows how to save galaxy data to Firestore

### New Files

**Main Editor View:**
- `src/views/MarkdownGalaxyEditor.vue` - Main split-pane editor view component

**Parser Library:**
- `src/lib/markdownGalaxyParser.ts` - Core parser that converts markdown text to galaxy map data structure (nodes, edges, planets)

**Editor Component:**
- `src/components/MarkdownEditor/MarkdownGalaxyInput.vue` - Milkdown-based markdown editor component with real-time preview

**Utility:**
- `src/lib/markdownGalaxyUtils.ts` - Helper functions for markdown validation, formatting, export, and physics position capture

## Implementation Plan

### Phase 1: Foundation
1. **Create parser infrastructure** - Build the markdown parser that can convert markdown bullet lists into structured data (nodes, edges, planets)
2. **Install and configure Milkdown** - Set up Milkdown markdown editor with Vue 2 compatibility
3. **Set up routing and entry point** - Add new route and modify CreateEditDeleteGalaxyDialog to include "Create with .MD" option

### Phase 2: Core Implementation
1. **Build split-pane UI** - Create the main editor view with resizable panes
2. **Implement Milkdown editor component** - Integrate Milkdown with proper Vue 2 bindings
3. **Integrate galaxy map preview** - Reuse GalaxyMap.vue with physics enabled for auto-layout
4. **Connect parser to preview** - Wire up real-time parsing and physics-based rendering pipeline
5. **Capture physics positions** - Listen to physics stabilization events and capture final x,y coordinates

### Phase 3: Integration
1. **Implement save functionality** - Save parsed markdown structure to Firestore (map-nodes, map-edges, topics/tasks)
2. **Add import/export** - Allow loading existing galaxy maps as markdown and exporting maps to markdown
3. **Add validation and error handling** - Show parsing errors, validate structure, provide helpful feedback
4. **Create documentation** - Add help panel explaining markdown syntax with examples

## Step by Step Tasks

### Step 1: Create Markdown Parser
- Create `src/lib/markdownGalaxyParser.ts` with functions to:
  - Parse markdown text into hierarchical structure
  - Detect indentation levels (0, 1, 2 for three levels)
  - Extract node labels from bullet points
  - Generate unique IDs for each node, topic, and planet
  - Build edges array based on sequential and parent-child relationships
- Write unit tests for the parser with the example markdown provided
- Validate that parser handles edge cases (empty lines, mixed indentation, extra spaces)

### Step 2: Install and Configure Milkdown
- Install Milkdown and required plugins:
  ```bash
  npm install @milkdown/core @milkdown/ctx @milkdown/prose @milkdown/preset-commonmark @milkdown/theme-nord @milkdown/vue
  ```
- Create Milkdown configuration with:
  - Commonmark preset for markdown support
  - Theme (Nord or custom Vuetify-themed)
  - Read-only mode disabled (allow editing)
  - Real-time change listeners
- Test Milkdown integration in a simple test component
- Ensure Vue 2 compatibility (Milkdown may require compatibility wrapper)

### Step 3: Create Milkdown Editor Component
- Create `src/components/MarkdownEditor/MarkdownGalaxyInput.vue`:
  - Integrate Milkdown editor instance
  - Configure with bullet list support and proper indentation handling
  - Add keyboard shortcuts (Tab for indent, Shift+Tab for outdent)
  - Emit markdown text on change events for real-time parsing
  - Show character/line count in footer
  - Add toolbar with common markdown actions (bold, italic, lists)
- Style Milkdown with Vuetify theme colors for consistency
- Add validation indicators (green checkmark for valid, red for errors)
- Handle Milkdown lifecycle (mount, unmount, update)

### Step 4: Create Main Editor View
- Create `src/views/MarkdownGalaxyEditor.vue`:
  - Split-pane layout using flexbox (50/50 default, resizable with drag handle)
  - Left pane: `<MarkdownGalaxyInput>` component
  - Right pane: `<GalaxyMap>` component in preview mode (read-only)
  - Add header with title "Markdown Galaxy Editor"
  - Add toolbar with buttons: Save, Export, Import, Help, Clear
  - Use Vuetify `v-container`, `v-row`, `v-col` for responsive layout
- Implement resize handle between panes (CSS-based or use library)
- Add loading states and error boundaries

### Step 5: Wire Up Real-Time Parsing and Physics Layout
- In `MarkdownGalaxyEditor.vue`:
  - Watch markdown input changes from Milkdown
  - Debounce parsing (300ms) to avoid excessive re-renders
  - Call `markdownGalaxyParser.parse(markdownText)` to get structure
  - Transform parsed structure into vis-network format (nodes without x,y, edges arrays)
  - Configure GalaxyMap with physics enabled:
    - Use hierarchical layout or force-directed physics
    - Enable physics solver (hierarchicalRepulsion or forceAtlas2Based)
  - Pass transformed data to GalaxyMap component as props
  - Listen for physics stabilization event: `@stabilized="onPhysicsStabilized"`
  - On stabilization, capture node positions using `network.getPositions()`
  - Store positions in component state for later save
  - Handle parsing errors gracefully with error messages
- Create computed properties for `nodesToDisplay` and `edgesToDisplay`
- Ensure planets are generated from level 3 items

### Step 6: Add Route and Entry Point in CreateEditDeleteGalaxyDialog
- Add route to `src/router/index.ts`:
  ```typescript
  {
    path: "/md-editor",
    name: "MarkdownGalaxyEditor",
    component: MarkdownGalaxyEditor,
    meta: { authRequired: true }
  }
  ```
- Modify `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue`:
  - Add third `<div class="creation-mode-option">` for "Create with .MD" option
  - Position it between or after "Create with AI" and "Create Manually"
  - Use appropriate icon (e.g., `mdiCodeTags` or `mdiFileDocumentOutline`)
  - Style with `base-border` or custom color
  - Add click handler that routes to `/md-editor`
  - Ensure responsive layout works with three options (may need to adjust grid or flex layout)
- Add breadcrumb navigation in MarkdownGalaxyEditor
- Ensure auth guards work correctly

### Step 7: Implement Save to Firestore with Physics Positions
- Create save function in `MarkdownGalaxyEditor.vue`:
  - Parse markdown to get final structure
  - Use captured physics positions from stabilization event
  - Generate map-nodes documents with schema:
    - `id`, `label` (from markdown)
    - `x`, `y` (from physics engine positions)
    - `color`, `size`, `shape`, `group` (defaults or based on level)
  - Generate map-edges documents with proper schema (`id`, `from`, `to`, `color`)
  - Create course document with title, description, metadata
  - Create topics subcollection for each node
  - Create tasks subcollection for each planet (level 3 items)
  - Use batch writes for atomic operations
- Add validation to ensure physics has stabilized before allowing save
- Integrate with existing save dialogs (`SaveGalaxyDialog.vue`)
- Show save progress and success/error messages
- Redirect to galaxy view after successful save (where user can manually adjust positions using existing features)

### Step 8: Implement Import Existing Galaxy
- Create function to convert existing galaxy map to markdown:
  - Fetch map-nodes and map-edges from Firestore
  - Fetch topics and tasks
  - Analyze graph structure to determine hierarchy
  - Generate markdown text from structure
  - Handle edge cases (cycles, disconnected nodes, orphaned planets)
- Add "Import" button that opens file picker or galaxy selector
- Populate editor with generated markdown
- Show conversion warnings if structure doesn't map cleanly

### Step 9: Add Validation and Error Handling
- Create validation function in `markdownGalaxyUtils.ts`:
  - Check for proper indentation (0, 4, or 8 spaces)
  - Validate bullet point syntax (must start with `-` or `*`)
  - Ensure no orphaned level 3 without level 2 parent
  - Warn if too many nodes (performance concern)
  - Check for duplicate node names
- Display validation errors inline in editor
- Use Vuetify `v-alert` for error messages
- Provide helpful suggestions for fixing errors

### Step 10: Create Help Documentation Panel
- Create collapsible help panel in `MarkdownGalaxyEditor.vue`:
  - Show markdown syntax rules with examples
  - Display the Web Development Level 1 example
  - Explain the three-level hierarchy
  - Add visual diagram showing how markdown maps to galaxy structure
  - Include tips for best practices (node naming, structure depth)
  - Add link to full documentation
- Use Vuetify `v-expansion-panel` for collapsible sections
- Make help accessible via "?" button in toolbar

### Step 11: Add Export Functionality
- Create export function to download markdown as `.md` file:
  - Generate markdown from current editor content
  - Create downloadable blob
  - Trigger browser download with filename (e.g., `galaxy-map-{timestamp}.md`)
- Add "Export" button to toolbar
- Support copying markdown to clipboard
- Add export options (include comments, add metadata header)

### Step 12: Styling and Polish
- Apply consistent Vuetify theming across all components
- Add smooth transitions for parsing updates
- Implement dark mode support
- Add keyboard shortcuts panel (Ctrl+S for save, Ctrl+H for help)
- Improve mobile responsiveness (stack panes vertically on small screens)
- Add tooltips to all toolbar buttons
- Ensure accessibility (ARIA labels, keyboard navigation)

### Step 13: Write Unit Tests
- Test `markdownGalaxyParser.ts`:
  - Parse valid markdown structures
  - Handle edge cases (empty input, malformed bullets, inconsistent indentation)
  - Verify correct node/edge generation
  - Test ID generation uniqueness
- Test `galaxyLayoutEngine.ts`:
  - Verify position calculations
  - Test collision detection
  - Ensure consistent layouts for same input
- Test validation functions in `markdownGalaxyUtils.ts`
- Use Vitest with mock data

### Step 14: Integration Testing
- Create E2E test using Playwright (`tests/e2e/markdown-galaxy-editor.spec.ts`):
  - Navigate to markdown editor
  - Type example markdown
  - Verify galaxy map renders with correct number of nodes
  - Save galaxy and verify Firestore documents created
  - Import galaxy and verify markdown generated
  - Test error handling with invalid markdown
- Run tests in emulator environment
- Ensure zero regressions in existing galaxy functionality

### Step 15: Run Validation Commands
- Execute all validation commands to ensure feature works correctly:
  - `npm run build` - Ensure no TypeScript or build errors
  - `npm run lint` - Verify code quality and style
  - `npm run type-check` - Check TypeScript types
  - `npm run test:unit` - Run unit tests
  - `npx playwright test tests/e2e/markdown-galaxy-editor.spec.ts` - Run E2E tests
  - `npm run dev` - Manually test the feature end-to-end
- Fix any errors or regressions found
- Document any known issues or limitations

## Testing Strategy

### Unit Tests
- **Parser Tests** (`markdownGalaxyParser.test.ts`):
  - Test parsing of simple linear structure (3 sequential nodes)
  - Test parsing of complex branching structure (Web Dev example)
  - Test edge cases: empty input, single node, deeply nested, mixed indentation
  - Test edge generation for sequential and parent-child relationships
  - Test ID generation and uniqueness

- **Physics Integration Tests** (`markdownGalaxyPhysics.test.ts`):
  - Test physics stabilization detection
  - Test position capture after stabilization
  - Test handling of physics timeout scenarios
  - Verify positions are valid numbers and within expected bounds

- **Validation Tests** (`markdownGalaxyUtils.test.ts`):
  - Test indentation validation
  - Test bullet syntax validation
  - Test structural validation (no orphaned nodes)
  - Test error message generation

### Integration Tests
- **E2E Editor Tests** (`tests/e2e/markdown-galaxy-editor.spec.ts`):
  - User types markdown → galaxy map renders
  - User saves galaxy → Firestore documents created correctly
  - User imports existing galaxy → markdown generated correctly
  - User edits markdown → map updates in real-time
  - Validation errors displayed correctly
  - Export functionality downloads file

- **Component Integration Tests**:
  - Test MarkdownGalaxyEditor with GalaxyMap component
  - Test data flow from input → parser → layout → visualization
  - Test save flow with Firestore mocks

### Edge Cases
1. **Empty input**: Show empty galaxy map or placeholder
2. **Malformed markdown**: Show helpful error messages, don't crash
3. **Inconsistent indentation**: Normalize or show warning
4. **Very large maps** (100+ nodes): Test performance, add warnings
5. **Duplicate node names**: Allow but show warning, append numbers
6. **Level 3 without level 2**: Show error or auto-create parent node
7. **Special characters in node names**: Sanitize for Firestore IDs
8. **Rapid typing**: Ensure debouncing works, no race conditions
9. **Browser back button**: Confirm unsaved changes dialog
10. **Network errors during save**: Show error, allow retry

## Acceptance Criteria
1. ✅ User can access markdown editor via "Create with .MD" option in CreateEditDeleteGalaxyDialog
2. ✅ User can navigate to markdown editor via new route `/md-editor`
3. ✅ Editor displays split-pane interface (Milkdown editor left, preview right)
4. ✅ User can type markdown using 3-level bullet hierarchy in Milkdown
5. ✅ Galaxy map preview updates in real-time (<500ms latency)
6. ✅ Parser correctly identifies level 1 (sequential), level 2 (branching), level 3 (planets)
7. ✅ Vis-network physics engine positions nodes automatically
8. ✅ Sequential nodes (level 1) are connected with edges
9. ✅ Branching nodes (level 2) connect to parent nodes
10. ✅ Planets (level 3) orbit their parent nodes
11. ✅ Web Development Level 1 example renders correctly with auto-layout
12. ✅ Physics stabilization is detected and positions are captured
13. ✅ User can save galaxy map to Firestore with physics-generated positions
14. ✅ Saved map creates proper map-nodes (with x,y from physics), map-edges, topics, and tasks collections
15. ✅ User can manually adjust positions later in standard galaxy view
16. ✅ User can import existing galaxy as markdown
17. ✅ User can export markdown as `.md` file
18. ✅ Validation errors display inline with helpful messages
19. ✅ Help panel explains syntax with examples
20. ✅ Editor works on desktop and tablet (stacked on mobile)
21. ✅ No regressions in existing galaxy editing functionality
22. ✅ All tests pass (unit + E2E)
23. ✅ Build completes without errors

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npm run type-check` - Validate TypeScript types are correct
- `npm run lint` - Run linting to validate code quality and style
- `npm run format` - Format code with Prettier
- `npm run build` - Build the project to validate no compilation errors
- `npm run test:unit` - Run unit tests for parser, layout, and utilities
- `npx playwright test tests/e2e/markdown-galaxy-editor.spec.ts` - Run E2E test for markdown editor
- `npx playwright test` - Run all E2E tests to ensure zero regressions
- `npm run dev` - Start dev server and manually test:
  - Navigate to `/md-editor`
  - Type the Web Development Level 1 example
  - Verify map renders correctly with proper node connections
  - Save galaxy and verify in Firestore
  - Import galaxy and verify markdown generated
  - Test validation with malformed markdown
  - Test export functionality
  - Test responsiveness on different screen sizes

## Notes

### Libraries to Install
- **Markdown Editor**: **Milkdown** (selected)
  - Package: `@milkdown/core @milkdown/ctx @milkdown/prose @milkdown/preset-commonmark @milkdown/theme-nord @milkdown/vue`
  - Modern, extensible markdown editor with WYSIWYG capabilities
  - Built on ProseMirror for rich editing experience
  - Good theming support for Vuetify integration
  - Note: May require Vue 2 compatibility wrapper or bridge

- **Markdown Parsing**: Custom regex-based parser
  - Write custom parser for bullet list hierarchy (best control)
  - Lightweight, tailored to specific 3-level structure
  - No external dependencies needed

- **Split Pane**: CSS Flexbox-based
  - Use CSS-based split pane with resize handle
  - Consider `splitpanes` npm package if needed for advanced features

- **Physics Layout**: vis-network native
  - Use built-in physics engines (hierarchicalRepulsion, forceAtlas2Based)
  - Configuration via `network.options.physics` and `network.options.layout`

### Future Enhancements
1. **Collaborative editing**: Multiple users editing markdown simultaneously
2. **Version history**: Track markdown changes over time
3. **Templates**: Predefined markdown templates for common learning paths
4. **Auto-complete**: Suggest node names based on existing content
5. **Visual markdown**: Rich text editor with markdown output
6. **Drag-and-drop reordering**: Drag markdown lines to reorder
7. **AI assistance**: Generate markdown structure from natural language
8. **Import from other formats**: Import from outline tools (Workflowy, Notion)
9. **Export to other formats**: PDF, JSON, YAML
10. **Nested indentation beyond 3 levels**: Support for more complex structures

### Performance Considerations
- Debounce markdown parsing (300-500ms) to avoid excessive re-renders
- Use `Object.freeze()` or immutable data structures for large graphs
- Consider virtual scrolling for very large maps (100+ nodes)
- Lazy-load planet animations until node is selected
- Use `requestAnimationFrame` for smooth preview updates
- Disable physics after stabilization to improve preview performance
- Consider physics timeout (10 seconds) to prevent infinite layout calculations
- Cache parsed structure to avoid re-parsing on every stabilization event

### Accessibility
- Ensure textarea has proper ARIA labels
- Support keyboard shortcuts (Tab/Shift+Tab for indent/outdent)
- Screen reader announcements for parsing errors
- High contrast mode support
- Keyboard navigation for toolbar buttons

### Mobile Considerations
- Stack panes vertically on mobile (editor on top, preview below)
- Add "Preview" toggle button to show/hide map on small screens
- Touch-friendly toolbar buttons (44px minimum tap target)
- Consider read-only preview on mobile (editing complex markdown on mobile is challenging)

### Data Model Notes
The markdown structure maps to Firestore as follows:

**Level 1 (Sequential Nodes)**:
- Create map-node document in `courses/{courseId}/map-nodes`
- Node includes `x`, `y` from vis-network physics stabilization
- Create edge from previous node to current node in `courses/{courseId}/map-edges`
- Create topic document in legacy `topics` collection (for backward compatibility)

**Level 2 (Branching Nodes)**:
- Create map-node document with physics-generated `x`, `y`
- Create edge from parent (level 1) node to this node
- Create topic document

**Level 3 (Planets)**:
- Create task document in `courses/{courseId}/topics/{topicId}/tasks`
- Task contains: `name`, `description`, `order`, `topicId`
- Planets are rendered via `Planet` class instances, not as map-nodes

**Physics Position Capture**:
- After user finishes typing and physics stabilizes, call `network.getPositions()`
- Returns object: `{ nodeId: { x: number, y: number } }`
- Store these positions in map-node documents
- Positions can be manually adjusted later using drag-and-drop in standard galaxy view

This preserves compatibility with existing galaxy visualization and editing tools while leveraging vis-network's built-in layout algorithms.
