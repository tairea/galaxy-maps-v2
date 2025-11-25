# Galaxy Maps – Developer Guide

This document orients new contributors to the codebase. It outlines the runtime architecture, key modules, and the day-to-day workflows for both the Vue front end and the Firebase back end.

## Quick Start
- Install dependencies for the web app: `npm install`
- Run the Vite dev server: `npm run dev` (or `npm run dev:emulator` to auto-connect to local Firebase emulators)
- Install the Firebase Functions workspace: `cd functions && npm install`
- Build and watch Cloud Functions during emulator work: `npm run build --workspace functions && npm run serve --workspace functions`

> The project assumes Node 18+ for the front end and Node 20 for Cloud Functions (`functions/package.json#L17`).

## Project Layout
- `src/` – Vue 2 (TypeScript) single-page application
- `functions/` – Firebase Cloud Functions (TypeScript, ESM)
- `rules/` – Firestore security rules and emulator test harness
- `public/` – Static assets served by Vite
- `screenshots/` – Product imagery referenced in the public README
- Root config (`vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `firebase.json`) keep build tooling aligned across apps

## Front-End Architecture

### Application Bootstrap
- `src/main.ts` wires Vue 2, Vue Router, Vuetify, Pinia, and the persisted state plugin. It waits on Firebase Auth (`firebase/compat`) to hydrate user state and kicks off realtime presence tracking once the session is verified.
- `src/plugins/vuetify.ts` centralises theme and iconfont configuration (dark mode is default).

### Routing & Layout
- `src/router/index.ts` defines the history-mode SPA routes. Auth guard logic gates squad/galaxy dashboards, and stores the last route in the root store for navigation breadcrumbs.
- `src/views/` hosts top-level route components (Galaxy map, Solar System view, cohorts, students, dashboards, landing flows).
- `src/components/` holds feature modules split by domain (GalaxyMap, Cohort, Dialogs, Dashboard, etc.). Layout shells live under `src/components/Home` and reusable UI primitives under `src/components/Reused`.

### State Management
- Pinia is the single source of truth. `src/store/index.ts` (root store) binds Firestore collections via custom helpers, tracks the signed-in user, cohort/course context, submissions, presence, and UI flags.
- Feature stores (e.g. `src/store/galaxyListView.ts`) manage view-specific loading and cache logic. They use `SerializableMap` (`src/store/_helpers.ts`) to persist nested Map structures.
- `src/piniafire/` extends the VueFire core bindings for Firestore and Realtime Database, exposing `firestoreAction`/`piniafireMutations` that sync collections into Pinia state while keeping writes local-first.
- Persisted state: `pinia-plugin-persistedstate` stores portions of Pinia across reloads, with custom hydration for `SerializableMap`.

### Data & Network Access
- Firebase client SDK configuration lives in `src/store/firestoreConfig.ts`. It initialises Auth, Firestore, Functions, Storage, and toggles emulator endpoints when `VITE_USE_EMULATOR=true`.
- REST-like operations call callable Cloud Functions through `src/lib/ff.ts`. Functions cover cohort membership, galaxy maps, mission/task CRUD, submissions, and activity analytics.
- Direct Firestore listeners live in Pinia actions for real-time collections (requests for help, submissions, presence `status`).
- `src/presence/index.ts` combines Realtime Database presence beacons with Firestore mirrors and updates the root store’s `userStatus`, enabling squad dashboards to track online navigators.

### Visualisation & UI Libraries
- The galaxy map is rendered with `vis-network` through wrappers under `src/vue2vis/` (Network / Graph2d). `src/components/GalaxyView/GalaxyMap.vue` orchestrates layout, event handling, and integration with `Planet`/`Star` helpers (`src/lib/planet.ts`, `src/lib/star.ts`).
- Charts rely on `chart.js` + `vue-chartjs`, and guided onboarding uses `vue-tour`.
- Vuetify components are auto-imported via `unplugin-vue-components` (see `components.d.ts` for generated typings).

### Mocking & Testing Utilities
- `src/mocks/` provides sample galaxies/courses for development or tests.
- `specs/` is reserved for higher-level tests (currently empty); unit tests run through Vitest/JSdom (`vitest.config.ts`).

## Firebase Back End

### Cloud Functions

Galaxy Maps uses Firebase Cloud Functions for server-side business logic following a clean architecture pattern.

**Key Resources:**
- 📚 **[Cloud Functions Architecture Guide](./README_CLOUD_FUNCTIONS_ARCHITECTURE.md)** - Deep dive into patterns, migration workflows, and best practices
- ⚡ **[Cloud Functions Quick Reference](./README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md)** - Quick lookup for common tasks and patterns

**Architecture Pattern:**
```
Vue Component → ff.ts (client abstraction) → Cloud Function → Firestore
```

**Key Modules:**
- Entry point `functions/src/index.ts` aggregates HTTP callable endpoints and triggers grouped by concern:
  - `courseManagement.ts` – galaxy CRUD, map node/edge operations, cohort enrolment, task ordering, and xAPI statements for mission lifecycle events.
  - `activity.ts` – learner activity analytics and reporting endpoints.
  - `organisationManagement.ts` – organisation CRUD, membership queries.
  - `userManagement.ts` – admin utilities, person profile reads/updates, elevated role assignment.
  - `emails.ts` – transaction email senders (course publish, submissions, help requests) via Nodemailer. Also includes delayed/scheduled emails using Cloud Tasks.
  - `presence.ts` – Realtime Database triggers that sync online/offline status into Firestore and emit xAPI statements (`veracityLRS.ts`).
  - `checkInactivity.ts` – scheduled function that monitors inactive learners.
- Functions run on Node 20, TypeScript compiled to `lib/`. Secrets (e.g. LRS credentials) are injected via `defineSecret` and `.env` loading (`functions/src/_dotenv.ts`).

For detailed documentation on creating, testing, and deploying functions, see the Architecture Guide and Quick Reference above.

### Firestore & Realtime Database
- Core collections observed in the stores/functions include: `people`, `courses`, `courses/{courseId}/map-nodes`, `courses/{courseId}/map-edges`, `courses/{courseId}/requestsForHelp`, `courses/{courseId}/submissionsForReview`, `cohorts`, `organisations`, `status`, plus derived analytics documents.
- Realtime Database `/status/{uid}` documents mirror Firestore `status` for presence.
- Security rules live in `rules/firestore.rules`. A Jest-style harness (`rules/test-rules.js`) runs against emulators with canned data (`rules/test-data.json`).

### Firebase Configuration
- `firebase.json` and `firestore.indexes.json` configure emulators, hosting, and indexes.
- CI/CD or manual deploys run `firebase deploy --only functions` from the `functions` workspace; front-end deploys rely on Vite builds (`npm run build`).

## Development Workflow Tips
- **Auth & Presence:** When using emulators (`npm run dev:emulator`), ensure the Auth, Firestore, Functions emulators are running; presence watchers still require the Realtime Database emulator.
- **State Resets:** Root/galaxy stores auto-reset when Auth state changes to avoid stale course data (`src/main.ts`).
- **Map Editing:** Galaxy editing flows depend on vis-network events; verify new interactions hook into the `network` listeners in `GalaxyMap.vue`.
- **Callable Functions:** Handle errors from `lib/ff.ts` with user-friendly messaging—`FirebaseError` instances bubble up to the UI.
- **xAPI Integration:** Presence and mission events call the Veracity LRS; confirm secrets are configured before deploying to shared environments.

## AI-Powered Features

Galaxy Maps uses OpenAI's API to automate learning roadmap creation and refinement. The AI system can:

- **Generate Complete Galaxy Maps**: From natural language descriptions to fully-structured learning journeys with Stars, Planets, and detailed Mission Instructions
- **Refine Structures**: Add, delete, move, split, or reorder Stars and Planets using operation-based refinement
- **Update Content**: Refine mission instructions while maintaining consistency
- **Voice Interaction**: Real-time voice-powered AI agent for hands-free map creation and squad management

**Key Components**:
- Generation UI: `src/components/Dialogs/AICreateGalaxyDialog.vue`
- Editing Interface: `src/views/AiGalaxyEdit.vue`
- Voice Agent: `src/components/Reused/AiGalaxyMapAgent.vue`
- Backend Functions: `functions/src/openAIActions.ts`, `functions/src/refiners/refine-structure.ts`

**Models Used**: GPT-5 (generation/reasoning), GPT-5-mini (clarifications), gpt-image-1-mini (images), gpt-realtime (voice)

For detailed documentation on AI features, architecture, and usage, see **[README_AI.md](./README_AI.md)**.

## Testing & Quality
- `npm run test:unit` – Vitest suite (JSdom). Create tests alongside components or utilities.
- `npm run lint` / `npm run format` – ESLint (Vue + TypeScript) and Prettier for the front end.
- `npm run test:rules` – Executes Firestore rule tests inside emulators.
- Functions lint/build: `npm run lint --workspace functions`, `npm run build --workspace functions`.

## Documentation Index

### Project Guides
- **[README_PROJECT.md](./README_PROJECT.md)** - Project overview, features, and technology stack
- **[README_DEV.md](./README_DEV.md)** - This file: Developer onboarding and architecture overview
- **[README_AI.md](./README_AI.md)** - AI-powered features, voice agent, and OpenAI integration
- **[README_STYLE_GUIDE.md](./README_STYLE_GUIDE.md)** - UI/UX style guide, Vuetify theming, and design patterns
- **[CLAUDE.md](./CLAUDE.md)** - Instructions for Claude Code AI assistant

### Cloud Functions
- **[README_CLOUD_FUNCTIONS_ARCHITECTURE.md](./README_CLOUD_FUNCTIONS_ARCHITECTURE.md)** - Architecture patterns, migration workflows, and best practices
- **[README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md](./README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md)** - Quick reference for common tasks and patterns

### Deployment & Operations
- **[DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md)** - Delayed email system deployment summary
- **[functions/DELAYED_EMAIL_SETUP.md](./functions/DELAYED_EMAIL_SETUP.md)** - Setup guide for scheduled emails with Cloud Tasks
- **[SETUP_DELAYED_EMAIL.sh](./SETUP_DELAYED_EMAIL.sh)** - Automated setup script for delayed email infrastructure

## Key References
- Front-end bootstrap: `src/main.ts`
- Root Pinia store & Firestore bindings: `src/store/index.ts`
- Firebase client setup: `src/store/firestoreConfig.ts`
- Router guards and route map: `src/router/index.ts`
- Galaxy map rendering pipeline: `src/components/GalaxyView/GalaxyMap.vue`
- Cloud Functions entrypoint: `functions/src/index.ts`
- Course & mission callable APIs: `functions/src/courseManagement.ts`
- Presence trigger & LRS sync: `functions/src/presence.ts`, `functions/src/veracityLRS.ts`
- Firestore security rules & tests: `rules/firestore.rules`, `rules/test-rules.js`

With this overview you should be able to trace data from the Vue UI, through Pinia and Firebase, into Cloud Functions, and back. Explore the referenced files to dive deeper into specific workflows (galaxy editing, squad dashboards, activity analytics) as you ramp up.
