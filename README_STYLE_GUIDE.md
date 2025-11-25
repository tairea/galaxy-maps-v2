# Galaxy Maps – Visual Style Guide

This document defines the distinct visual style and design patterns used throughout Galaxy Maps. Use this guide when creating new components or updating existing ones to maintain visual consistency.

---

## Design Philosophy

Galaxy Maps has a **bold, technical, space-themed aesthetic** that emphasizes:

- **Sharp, angular geometry** — No rounded corners; zero border-radius everywhere
- **High contrast interfaces** — Dark theme by default with vibrant accent colors
- **Segmented layouts** — Dashed borders divide component sections
- **Ribbon labels** — Diagonal-cut labels for component headers
- **Minimalist icons** — Material Design Icons (MDI) used consistently
- **Transparent overlays** — Backdrop blur effects for floating UI elements

The UI feels like a **command center interface** or **mission control dashboard** — functional, precise, and futuristic.

---

## Framework & Theming

### Vuetify 2.7

Galaxy Maps uses **Vuetify 2** as the UI framework with extensive customization:

- Material Design Icons via `mdiSvg` iconfont
- Custom theme colors (see Color System below)
- Global overrides for border-radius, buttons, dialogs
- Dark mode as default theme

**Configuration**: `src/plugins/vuetify.ts`

---

## Color System

### Theme Colors

Galaxy Maps uses semantic color naming with distinct accent colors for different contexts:

#### Dark Theme (Default)

| Color Name         | Hex Value | Usage                                           |
| ------------------ | --------- | ----------------------------------------------- |
| **primary**        | `#f7f7f7` | Primary text color                              |
| **background**     | `#141E30` | Main background (dark navy blue)                |
| **subBackground**  | `#000`    | Secondary/nested backgrounds                    |
| **baseAccent**     | `#00E676` | Active states, success, confirmations (green)   |
| **galaxyAccent**   | `#E269CF` | Galaxy/course-related elements (pink/magenta)   |
| **missionAccent**  | `#69A1E2` | Missions/tasks, primary UI elements (blue)      |
| **cohortAccent**   | `#FAF200` | Cohort/squad-related elements (yellow)          |
| **warningAccent**  | `#f39237` | Warnings, alerts, important notices (orange)    |

#### Light Theme

| Color Name         | Hex Value | Usage                                           |
| ------------------ | --------- | ----------------------------------------------- |
| **primary**        | `#212121` | Primary text color (dark grey)                  |
| **background**     | `#f7f7ff` | Main background (off-white)                     |
| **subBackground**  | `#DDE0E4` | Secondary/nested backgrounds (light grey)       |
| **baseAccent**     | `#495867` | Active states (dark grey-blue)                  |
| **galaxyAccent**   | `#fe5f55` | Galaxy/course-related elements (coral red)      |
| **missionAccent**  | `#577399` | Missions/tasks, primary UI elements (blue-grey) |
| **cohortAccent**   | `#fe5f55` | Cohort/squad-related elements (coral red)       |
| **warningAccent**  | `#f39237` | Warnings, alerts (orange)                       |

### Using Theme Colors in Components

**In Templates:**
```vue
<v-btn color="missionAccent">Click Me</v-btn>
<v-icon color="galaxyAccent">{{ mdiStar }}</v-icon>
```

**In Styles (CSS Variables):**
```scss
.my-component {
  color: var(--v-missionAccent-base);
  border-color: var(--v-galaxyAccent-base);
  background: var(--v-background-base);
}
```

**Utility Classes:**
```vue
<p class="missionAccent--text">Blue text</p>
<p class="galaxyAccent--text">Pink text</p>
<p class="cohortAccent--text">Yellow text</p>
<p class="baseAccent--text">Green text</p>
```

### Color Usage Guidelines

1. **missionAccent (blue)** — Default for most UI elements (buttons, borders, icons, panels)
2. **galaxyAccent (pink/coral)** — Galaxy map features, course creation, AI features
3. **cohortAccent (yellow)** — Squad/cohort management, teacher dashboards
4. **baseAccent (green)** — Active states, success confirmations, "online" status
5. **warningAccent (orange)** — Warnings, alerts, destructive actions

---

## Typography

### Font Stack

Galaxy Maps relies on system default fonts with no custom typeface:

```scss
font-family: 'Roboto', sans-serif; // Vuetify default
```

### Text Styles

**Vuetify Typography Classes Used:**

| Class         | Usage                                      | Transform   |
| ------------- | ------------------------------------------ | ----------- |
| `.overline`   | Labels, metadata, button text              | UPPERCASE   |
| `.caption`    | Small supporting text                      | None        |
| `.body-1`     | Body text                                  | None        |
| `.body-2`     | Secondary body text                        | None        |
| `.headline`   | Section headers                            | None        |
| `.title`      | Card/dialog titles                         | None        |

### Text Transform

**UPPERCASE is used extensively** for:
- Component labels (ribbon headers)
- Button text
- Dialog titles
- Section headers

```vue
<!-- Common pattern -->
<p class="overline">Squad Captains:</p>
```

---

## Layout Patterns

### Sharp Edges (Zero Border Radius)

**ALL UI elements use sharp, 90-degree corners:**

```scss
// Global override in src/scss/variables.scss
$btn-border-radius: 0;
$text-field-border-radius: 0;

.v-dialog {
  border-radius: 0px;
}
```

**Never use rounded corners** — this is a core design principle.

---

## Component Patterns

### 1. Ribbon Labels

Ribbon labels are **diagonal-cut labels** positioned at the top-left of component frames. They're used for panel headers that can be clicked to minimize/expand.

**Visual Style:**
- Diagonal cut on the right side using `clip-path`
- Positioned absolutely at top-left
- Background color matches the component's theme
- Text color uses `var(--v-background-base)` for contrast
- Includes a chevron icon for expand/collapse

**Example (Galaxy Info Panel):**

```vue
<template>
  <div id="galaxy-info" :class="{ minimized: isMinimized }">
    <h2 class="galaxy-label" @click="toggleMinimize" :class="{ minimized: isMinimized }">
      <div v-if="!isMinimized">Galaxy</div>
      <div v-else>{{ truncateTitle(course.title) }}</div>
      <v-icon class="arrow">{{ isMinimized ? mdiMenuDown : mdiMenuUp }}</v-icon>
    </h2>

    <div class="galaxy-content" :class="{ minimized: isMinimized }">
      <!-- Content here -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.galaxy-label {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;

  // Ribbon label styling
  position: absolute;
  top: 0;
  left: -1px;
  color: var(--v-background-base);
  background-color: var(--v-galaxyAccent-base);
  padding: 0px 15px 0px 5px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%); // Diagonal cut
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  min-width: 120px;
}

.galaxy-label .arrow {
  font-size: 0.6rem;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.galaxy-content {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  max-height: 1000px;
}

.galaxy-content.minimized {
  max-height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}
</style>
```

**Color Variants:**
- Galaxy panels: `var(--v-galaxyAccent-base)` (pink)
- Cohort panels: `var(--v-cohortAccent-base)` (yellow)
- Mission panels: `var(--v-missionAccent-base)` (blue)

---

### 2. Bordered Frames

Components are framed with **solid borders** using theme accent colors.

**Pattern:**
```scss
.component-frame {
  border: 1px solid var(--v-missionAccent-base);
  padding: 20px;
  position: relative;
  backdrop-filter: blur(2px); // Adds depth
}
```

**Borders match component context:**
- Galaxy panels: `var(--v-galaxyAccent-base)`
- Cohort panels: `var(--v-cohortAccent-base)`
- Mission panels: `var(--v-missionAccent-base)`

---

### 3. Dashed Dividers

**Dashed borders** are used to segment sections within components.

**Pattern:**
```scss
.student-card {
  border: 1px dashed var(--v-missionAccent-base);

  .section-divider {
    border-left: 1px dashed var(--v-missionAccent-base);
  }

  .top-row {
    border-bottom: 1px dashed var(--v-missionAccent-base);
  }
}
```

**When to use:**
- Grid-style layouts (student cards, data tables)
- Splitting component sections vertically/horizontally
- Creating visual rhythm in dense layouts

---

### 4. Map Control Buttons

Galaxy Map editing buttons follow a **segmented button pattern** with icons and text separated by borders.

**Visual Style:**
- Icon section + text section divided by border
- Transparent background with `backdrop-filter: blur(2px)`
- Active state uses `baseAccent` (green)
- Border and icon color match state

**Example:**

```vue
<template>
  <div class="mapButton" :class="{ active: isActive }">
    <div class="mapButton-icon" :class="{ activeIcon: isActive }">
      <v-icon color="missionAccent">{{ mdiIcon }}</v-icon>
    </div>
    <div class="mapButton-text">
      <p class="overline ma-0">Button Text</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mapButton {
  display: flex;
  color: var(--v-missionAccent-base);
  border: 1px solid var(--v-missionAccent-base);
  height: 45px;
  cursor: pointer;
  backdrop-filter: blur(2px);
}

.active {
  color: var(--v-baseAccent-base);
  border: 1px solid var(--v-baseAccent-base);
}

.mapButton-icon,
.mapButton-text {
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 1px solid var(--v-missionAccent-base);
  padding: 0px 10px;
}

.activeIcon {
  border-left: 1px solid var(--v-baseAccent-base);
  border-right: 1px solid var(--v-baseAccent-base);
}
</style>
```

**Galaxy Accent Variant:**
```scss
.mapButtonGalaxyAccent {
  display: flex;
  color: var(--v-galaxyAccent-base);
  border: 1px solid var(--v-galaxyAccent-base);
  height: 45px;
  cursor: pointer;
  backdrop-filter: blur(2px);

  .mapButton-icon {
    border-left: none;
  }

  .mapButton-text {
    border-left: 1px solid var(--v-galaxyAccent-base);
  }
}
```

---

### 5. Dialog Styling

Dialogs follow a **header + content** pattern with sharp corners and accent borders.

**Pattern:**

```vue
<template>
  <v-dialog v-model="dialog" light style="z-index: 1000">
    <div class="create-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <p class="dialog-title">Dialog Title</p>
        <div class="d-flex align-center">
          <v-icon left color="missionAccent">{{ mdiInformationVariant }}</v-icon>
          <p class="dialog-description">
            Description text here
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Form fields, buttons, etc. -->
      </div>
    </div>
  </v-dialog>
</template>

<style scoped lang="scss">
.create-dialog {
  color: var(--v-missionAccent-base);
  background-color: var(--v-background-base);
  border: 1px solid var(--v-missionAccent-base);
  display: flex;
  flex-wrap: wrap;

  .dialog-header {
    width: 100%;
    padding: 20px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--v-missionAccent-base);

    .dialog-title {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-weight: 600;
    }

    .dialog-description {
      color: var(--v-missionAccent-base);
      text-transform: uppercase;
      font-size: 0.7rem;
    }
  }

  .dialog-content {
    width: 100%;
    padding: 20px;
  }
}
</style>
```

**Dialog Features:**
- Light theme by default (`light` prop on `v-dialog`)
- Sharp corners (no border-radius)
- Border color matches context (mission/galaxy/cohort)
- UPPERCASE headers
- Icon + description pattern in header

---

### 6. Button Styles

Buttons use **outlined style** with zero border-radius.

**Primary Pattern:**
```vue
<v-btn color="missionAccent" outlined small>
  <v-icon left>{{ mdiIcon }}</v-icon>
  Button Text
</v-btn>
```

**Common Variants:**

| Color            | Usage                          |
| ---------------- | ------------------------------ |
| `missionAccent`  | Default actions                |
| `galaxyAccent`   | Galaxy/AI features             |
| `cohortAccent`   | Squad management               |
| `baseAccent`     | Success/confirm actions        |
| `warningAccent`  | Warning/destructive actions    |

**Button Sizes:**
- `small` — Most common
- `x-small` — Dense layouts
- `large` — Primary CTAs

**Always use:**
- `outlined` prop for bordered style
- Icon + text combination when space allows
- UPPERCASE text (use `class="text-uppercase"` if needed)

---

## Special UI Elements

### 1. Scrollbars

Custom scrollbar styling maintains the color theme:

```scss
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--v-background-base);
}

::-webkit-scrollbar-thumb {
  background: var(--v-missionAccent-base);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--v-missionAccent-base);
}
```

**Note:** In some views, scrollbars are intentionally hidden for a cleaner aesthetic.

---

### 2. Backdrop Blur

Floating UI elements use **backdrop blur** for depth and separation:

```scss
.floating-panel {
  backdrop-filter: blur(2px);
  background: rgba(20, 30, 48, 0.8); // Semi-transparent background
}
```

**Use cases:**
- Map control buttons
- Info panels overlaying the galaxy map
- Floating action buttons

---

### 3. Viewport Utilities

Galaxy Maps uses **custom viewport utilities** to handle mobile viewport issues:

```scss
// Available classes
.vh-100 { height: calc(var(--vh, 1vh) * 100); }
.vh-75 { height: calc(var(--vh, 1vh) * 75); }
.vh-50 { height: calc(var(--vh, 1vh) * 50); }

.vw-100 { width: calc(var(--vw, 1vw) * 100); }
.min-vh-100 { min-height: calc(var(--vh, 1vh) * 100); }
```

**Use these instead of standard `vh`/`vw` units** to prevent mobile keyboard issues.

---

## Responsive Design

### Breakpoints

Vuetify breakpoints are used throughout:

| Breakpoint       | Width     | Usage                     |
| ---------------- | --------- | ------------------------- |
| `xs`             | < 600px   | Mobile portrait           |
| `sm`             | 600-959px | Mobile landscape, tablet  |
| `md`             | 960-1263px| Tablet landscape, desktop |
| `lg`             | 1264-1903px| Desktop                  |
| `xl`             | > 1904px  | Large desktop             |

**Checking breakpoints:**
```vue
<template>
  <div v-if="$vuetify.breakpoint.smAndDown">Mobile layout</div>
  <div v-else>Desktop layout</div>
</template>
```

### Mobile Adaptations

1. **Hide text labels** — Show only icons on small screens
2. **Stack layouts vertically** — Use `flex-column` on mobile
3. **Simplify ribbons** — Truncate long titles
4. **Remove borders** — Reduce visual clutter on small screens

**Example:**
```vue
<div class="mapButton-text" v-if="!$vuetify.breakpoint.smAndDown">
  <p class="overline ma-0">Button Text</p>
</div>
```

---

## Icons

### Material Design Icons (MDI)

Galaxy Maps uses **@mdi/js** for tree-shakeable SVG icons.

**Import pattern:**
```vue
<script>
import {
  mdiPlus,
  mdiPencil,
  mdiClose,
  mdiRobotExcited,
  mdiStarPlus
} from '@mdi/js';

export default {
  data() {
    return {
      mdiPlus,
      mdiPencil,
      // ...
    };
  }
};
</script>
```

**Usage:**
```vue
<v-icon color="missionAccent">{{ mdiPlus }}</v-icon>
```

**Common Icons:**

| Icon                    | Usage                        |
| ----------------------- | ---------------------------- |
| `mdiPlus`               | Create/add actions           |
| `mdiPencil`             | Edit actions                 |
| `mdiClose`              | Close/cancel                 |
| `mdiRobotExcited`       | AI features                  |
| `mdiStarPlus`           | Add star/topic               |
| `mdiEarth`              | Show missions                |
| `mdiMenuUp`/`mdiMenuDown` | Expand/collapse            |
| `mdiInformationVariant` | Info/help                    |

---

## Animation & Transitions

### Transition Patterns

**Standard transition timing:**
```scss
transition: all 0.3s ease-in-out;
```

**Common animations:**

1. **Panel expand/collapse:**
```scss
.panel-content {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  max-height: 1000px;

  &.minimized {
    max-height: 0;
    opacity: 0;
  }
}
```

2. **Slide up/down:**
```scss
.element {
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);

  &.hidden {
    transform: translateY(calc(100% + 25px));
  }
}
```

3. **Opacity fade:**
```scss
.element {
  transition: opacity 0.2s ease-in-out;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
}
```

---

## Best Practices

### ✅ Do

- Use semantic theme colors (`missionAccent`, `galaxyAccent`, etc.)
- Keep borders sharp (zero border-radius)
- Use dashed borders for internal dividers
- Apply `backdrop-filter: blur(2px)` to floating elements
- Use UPPERCASE for labels and headers
- Use outlined button style consistently
- Leverage ribbon labels for collapsible panels
- Use viewport utilities (`vh-100`, `vw-100`) instead of raw `vh`/`vw`

### ❌ Don't

- Don't add rounded corners (border-radius)
- Don't use custom fonts
- Don't hardcode colors — always use CSS variables
- Don't mix elevation/shadow styles with bordered style
- Don't use filled button variants (use `outlined`)
- Don't use title case — prefer UPPERCASE or sentence case

---

## Code Examples

### Complete Component Template

```vue
<template>
  <div id="my-panel" :class="getBorderClass()" v-if="data">
    <!-- Ribbon Label -->
    <h2 class="panel-label" @click="toggleMinimize" :class="{ minimized: isMinimized }">
      <div v-if="!isMinimized">Panel Name</div>
      <div v-else>{{ truncateTitle(data.title) }}</div>
      <v-icon class="arrow" color="var(--v-background-base)">
        {{ isMinimized ? mdiMenuDown : mdiMenuUp }}
      </v-icon>
    </h2>

    <!-- Content -->
    <div class="panel-content" :class="{ minimized: isMinimized }">
      <h1 class="panel-title">{{ data.title }}</h1>
      <p class="panel-description">{{ data.description }}</p>

      <!-- Action Buttons -->
      <v-btn color="missionAccent" outlined small @click="handleAction">
        <v-icon left small>{{ mdiPlus }}</v-icon>
        Add Item
      </v-btn>
    </div>
  </div>
</template>

<script>
import { mdiMenuUp, mdiMenuDown, mdiPlus } from '@mdi/js';

export default {
  name: 'MyPanel',
  props: ['data'],
  data() {
    return {
      mdiMenuUp,
      mdiMenuDown,
      mdiPlus,
      isMinimized: false,
    };
  },
  methods: {
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },
    getBorderClass() {
      return 'mission-border'; // or 'galaxy-border', 'cohort-border'
    },
    truncateTitle(title) {
      if (this.$vuetify.breakpoint.smAndDown && title.length > 15) {
        return title.substring(0, 15) + '...';
      }
      return title;
    },
    handleAction() {
      // Handle action
    },
  },
};
</script>

<style lang="scss" scoped>
#my-panel {
  width: 100%;
  margin-top: 30px;
  padding: 20px;
  position: relative;
  backdrop-filter: blur(2px);
  z-index: 3;

  &.mission-border {
    border: 1px solid var(--v-missionAccent-base);
    color: var(--v-missionAccent-base);
  }

  &.galaxy-border {
    border: 1px solid var(--v-galaxyAccent-base);
    color: var(--v-galaxyAccent-base);
  }

  &.cohort-border {
    border: 1px solid var(--v-cohortAccent-base);
    color: var(--v-cohortAccent-base);
  }

  &.minimized {
    padding: 0;
    border: none;
  }

  .panel-label {
    font-size: 0.8rem;
    font-weight: 400;
    text-transform: uppercase;
    position: absolute;
    top: 0;
    left: -1px;
    color: var(--v-background-base);
    background-color: var(--v-missionAccent-base);
    padding: 0px 15px 0px 5px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    width: fit-content;
    min-width: 120px;

    &.minimized {
      border: none;
    }

    .arrow {
      font-size: 0.6rem;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }
  }

  .panel-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    max-height: 1000px;

    &.minimized {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }
  }

  .panel-title {
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    margin: 5px 0;
    color: var(--v-missionAccent-base);
  }

  .panel-description {
    margin-top: 10px;
    color: var(--v-missionAccent-base);
    font-size: 0.8rem;
  }
}
</style>
```

---

## Resources

### Key Files

- **Theme Configuration**: `src/plugins/vuetify.ts`
- **Global Styles**: `src/css/main.scss`
- **Vuetify Overrides**: `src/scss/variables.scss`
- **Viewport Utilities**: `src/css/viewport-utils.scss`

### Reference Components

Study these components to understand style patterns:

- **Ribbon Labels**: `src/components/GalaxyView/GalaxyInfo.vue`
- **Map Buttons**: `src/components/GalaxyView/GalaxyMapButtons.vue`
- **Dialogs**: `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue`
- **Cards**: `src/components/CohortView/StudentDataIterator/StudentCard.vue`
- **Panels**: `src/components/CohortView/CohortInfo.vue`

---

## Summary

Galaxy Maps' visual identity is defined by:

1. **Sharp, angular geometry** — No rounded corners anywhere
2. **High-contrast color accents** — Blue, pink, yellow, green on dark backgrounds
3. **Ribbon-cut labels** — Diagonal-cut headers with clip-path
4. **Segmented borders** — Solid for frames, dashed for dividers
5. **Transparent overlays** — Backdrop blur for depth
6. **Consistent iconography** — MDI icons throughout
7. **UPPERCASE typography** — For labels, buttons, headers
8. **Outlined button style** — Never filled buttons
9. **Context-aware theming** — Color matches feature domain

Follow these patterns to maintain Galaxy Maps' distinctive **command center aesthetic** across all new features.
