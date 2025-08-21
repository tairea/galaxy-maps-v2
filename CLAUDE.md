# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Galaxy Maps is an online learning platform that enables educators to map learning paths into a "Galaxy Map" format. Learners can navigate learning paths in an individualized, self-paced, gamified way, similar to how ancestors used stars to navigate the seas.

## Technology Stack

- **Frontend**: Vue.js v2.7 with TypeScript support
- **UI Framework**: Vuetify v2.7
- **State Management**: Pinia with persistence
- **Backend**: Firebase Cloud Functions (Node.js 20)
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Build Tool**: Vite
- **Testing**: Vitest with jsdom
- **Visualization**: vis-network, vis-timeline for interactive galaxy maps
- **AI Integration**: OpenAI API for content generation

## Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Run tests
npm run test:unit

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format
```

### Backend Functions
```bash
# Navigate to functions directory first
cd functions

# Build TypeScript
npm run build

# Run local emulators
npm run serve

# Deploy functions
npm run deploy

# View logs
npm run logs
```

## Code Architecture

### Frontend Structure
- **Views**: Main application screens (`/src/views/`)
  - `GalaxyView.vue` - Interactive galaxy map visualization
  - `SolarSystemView.vue` - Individual topic/mission interface
  - `CohortView.vue` - Student cohort management
  - `UserDashboard.vue` - Student progress dashboard
  - `AllStudentsView.vue` - Teacher overview of all students

- **Components**: Organized by feature areas (`/src/components/`)
  - `GalaxyView/` - Galaxy map rendering and controls
  - `CohortView/` - Student cards, progress charts, cohort management
  - `Dialogs/` - Modal dialogs for CRUD operations
  - `Reused/` - Shared components across features

- **State Management** (`/src/store/`):
  - `index.ts` - Root store with user auth, course data, real-time listeners
  - `galaxyListView.ts` - Galaxy discovery and filtering
  - `cohortView.ts` - Cohort-specific state
  - `solarSystemView.ts` - Topic/mission state

- **Piniafire Integration** (`/src/piniafire/`): Custom Firestore bindings for reactive data

### Backend Structure (`/functions/src/`)
- **Cloud Functions**: TypeScript functions with proper error handling
- **AI Integration**: OpenAI API functions for content generation
- **Email System**: Automated notifications via Nodemailer
- **Activity Tracking**: xAPI/LRS integration for learning analytics
- **User Management**: Account creation, organization management

### Key Architectural Patterns

1. **Real-time Data Binding**: Firestore listeners automatically update Pinia state
2. **Route-based Data Loading**: Each route loads required data via store actions
3. **Component Communication**: Props down, events up pattern with centralized state
4. **Authentication Guards**: Router middleware for protected routes and admin access
5. **Performance Optimization**: Lazy loading, component splitting, data validation

### Database Schema (Firestore)
- `people` - User profiles and assignments
- `courses` - Galaxy map data with subcollections:
  - `map-nodes` - Stars/topics in the galaxy
  - `map-edges` - Connections between topics
  - `submissionsForReview` - Student work submissions
  - `requestsForHelp` - Student help requests
- `cohorts` - Student groups and teacher assignments
- `organisations` - Institution management

### Firebase Configuration
- Authentication with email verification required
- Firestore security rules control data access
- Cloud Functions handle server-side logic and integrations
- Real-time presence system for collaborative features

## Testing Guidelines

- Unit tests use Vitest with jsdom environment
- Test files should be co-located with components
- Mock Firebase services for testing
- Focus on component logic and user interactions

## Performance Considerations

- Large galaxy maps use vis-network for efficient rendering
- Firestore queries are optimized with proper indexing
- Components use lazy loading where appropriate
- Real-time listeners are properly unsubscribed to prevent memory leaks

## AI Features

The platform includes AI-powered galaxy generation and content creation:
- Course structure generation via OpenAI
- Automated task and mission creation
- Content suggestions and improvements
- Structured output validation with Zod schemas