# Galaxy Maps v2 - Architecture Documentation

**Last Updated:** November 2, 2025

## Overview

Galaxy Maps is an online learning platform that enables educators to create visual "Galaxy Maps" representing learning paths. Learners navigate these maps in an individualized, self-paced, gamified manner. Like ancient navigators who used stars to cross seas, students use Galaxy Maps to navigate their learning journey.

**Project Website:** https://tairea.io/2021/09/03/galaxy-maps/

---

## 📚 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Concepts & Terminology](#core-concepts--terminology)
4. [Data Schema](#data-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [State Management](#state-management)
7. [Routing & Navigation](#routing--navigation)
8. [Firebase Functions](#firebase-functions)
9. [Component Architecture](#component-architecture)
10. [Key Features](#key-features)

---

## Technology Stack

### Frontend
- **Vue 2.7.14** - Main JavaScript framework
- **Vuetify 2.7.1** - Material Design component framework
- **Pinia 2.1.6** - State management (with persistence)
- **Vue Router 3.6.5** - Client-side routing
- **Vite 4.4.9** - Build tool and dev server
- **TypeScript ~5.2.2** - Type safety
- **vis-network 9.1.6** - Graph visualization for galaxy maps

### Backend
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User authentication
- **Firebase Cloud Functions (Node 20)** - Serverless backend
- **Firebase Realtime Database** - User presence system
- **Firebase Storage** - File storage

### Additional Services
- **Veracity LRS** - Learning Record Store for xAPI statements (learning analytics)
- **Nodemailer** - Email notifications via Gmail

### Development Tools
- **Babel** - JavaScript transpilation
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing

---

## Project Structure

```
galaxy-maps-v2/
├── src/                          # Frontend source code
│   ├── main.ts                   # Application entry point
│   ├── App.vue                   # Root Vue component
│   ├── router/                   # Route definitions
│   ├── store/                    # Pinia state management
│   │   ├── index.ts             # Root store (main state)
│   │   ├── galaxyListView.ts   # Galaxy list view state
│   │   ├── solarSystemView.ts  # Solar system view state
│   │   ├── cohortView.ts       # Cohort view state
│   │   └── _types.ts           # TypeScript type definitions
│   ├── views/                   # Page-level components
│   │   ├── Home.vue            # Main layout wrapper
│   │   ├── GalaxyList.vue      # List of available galaxies
│   │   ├── GalaxyView.vue      # Interactive galaxy map view
│   │   ├── SolarSystemView.vue # Topic/system detail view
│   │   ├── CohortView.vue      # Squad/cohort management
│   │   ├── UserDashboard.vue   # User dashboard
│   │   └── AllStudentsView.vue # Student administration
│   ├── components/              # Reusable Vue components
│   │   ├── GalaxyView/         # Galaxy map components
│   │   ├── SolarSystemView/    # Solar system components
│   │   ├── CohortView/         # Cohort management components
│   │   ├── Dialogs/            # Modal dialogs
│   │   └── Reused/             # Shared components
│   ├── lib/                     # Utility libraries
│   │   ├── ff.ts               # Firebase function wrappers
│   │   ├── planet.ts           # Planet visualization class
│   │   ├── star.ts             # Star visualization class
│   │   └── veracityLRS.js      # xAPI/LRS integration
│   ├── presence/                # User presence system
│   └── piniafire/              # Pinia-Firebase integration
│
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       ├── index.ts             # Function exports
│       ├── userManagement.ts    # User CRUD operations
│       ├── courseManagement.ts  # Course/Galaxy operations
│       ├── organisationManagement.ts # Organization operations
│       ├── activity.ts          # Learning analytics
│       ├── emails.ts            # Email notifications
│       ├── presence.ts          # Presence system triggers
│       ├── checkInactivity.ts   # Scheduled inactivity checks
│       └── veracityLRS.ts       # xAPI integration
│
├── rules/                        # Firestore security rules
│   └── firestore.rules          # Database access control
│
└── public/                       # Static assets
```

---

## Core Concepts & Terminology

Galaxy Maps uses space-themed terminology for educational concepts:

### Learning Hierarchy

1. **Galaxy (Course)**
   - A complete learning path or course
   - Contains multiple Solar Systems (topics)
   - Visualized as an interactive graph/network

2. **Solar System (Topic)**
   - A major learning module within a Galaxy
   - Contains multiple Missions (tasks)
   - Represented as nodes in the galaxy map
   - Can have prerequisites (dependencies on other systems)

3. **Mission (Task)**
   - Individual learning activities within a Solar System
   - Sequential progression: locked → unlocked → active → completed
   - Can require submission and review

### User Roles

1. **Navigator (Student)**
   - Explores galaxies and completes missions
   - Progress tracked per galaxy
   - Can request help from Captains

2. **Captain (Teacher/Instructor)**
   - Creates and manages galaxies
   - Reviews student submissions
   - Monitors squad progress
   - Can be assigned to squads

3. **Admin**
   - Full system access
   - Can manage all users, galaxies, and organizations
   - Approves galaxy publications

### Organizational Structure

1. **Squad (Cohort)**
   - Group of Navigators
   - Assigned to specific Galaxies
   - Managed by one or more Captains
   - Belongs to an Organisation

2. **Organisation**
   - Top-level organizational unit
   - Contains multiple squads
   - Can have multiple people

### Content Status

1. **Galaxy/Course Status**
   - `drafting` - Work in progress, only visible to creator
   - `submitted` - Submitted for admin review
   - `published` - Available for use

2. **Visibility**
   - `public` - Anyone can view
   - `unlisted` - Only accessible with direct link
   - `private` - Only assigned users can access

3. **Topic/System Status (for students)**
   - `locked` - Prerequisites not met
   - `unlocked` - Available to start
   - `active` - Currently in progress
   - `completed` - All missions finished

4. **Mission/Task Status (for students)**
   - `locked` - Cannot start yet
   - `unlocked` - Can be started
   - `active` - Currently working on
   - `inreview` - Submitted, awaiting teacher feedback
   - `declined` - Needs revision
   - `completed` - Successfully finished

---

## Data Schema

### Firestore Collections

#### 1. **people** (Users)
```typescript
{
  id: string,                    // Firebase Auth UID
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  accountType: "student" | "teacher",
  assignedCourses: string[],     // Array of course IDs
  assignedCohorts: string[],     // Array of cohort IDs
  completedCourses: string[],    // Array of completed course IDs
  xpPointsTotal: number,         // Gamification points
  verified: boolean,             // Email verification status
  // Additional fields...
}

// Subcollections:
// - people/{userId}/{courseId} - Student's progress in specific course
//   - Contains topics with status
//   - Each topic contains tasks with status
```

#### 2. **courses** (Galaxies)
```typescript
{
  id: string,
  title: string,
  description: string,
  status: "drafting" | "submitted" | "published",
  visibility: "public" | "unlisted" | "private",
  public: boolean,               // Legacy field
  owner: DocumentReference,      // Reference to creator
  mappedBy: {
    personId: string,
    name: string,
  },
  contentBy: {                   // Content author (if different)
    personId: string,
    name: string,
  },
  taskTotal: number,             // Total missions across all systems
  // Additional metadata...
}

// Subcollections:
// - courses/{courseId}/topics - Topic content
// - courses/{courseId}/map-nodes - Visual node data
// - courses/{courseId}/map-edges - Visual connection data
// - courses/{courseId}/requestsForHelp - Student help requests
// - courses/{courseId}/submissionsForReview - Submitted work
```

#### 3. **cohorts** (Squads)
```typescript
{
  id: string,
  name: string,
  description: string,
  students: string[],            // Array of student IDs
  teachers: string[],            // Array of teacher IDs
  courses: string[],             // Array of assigned course IDs
  organisationId: string,        // Parent organization
  // Additional fields...
}
```

#### 4. **organisations**
```typescript
{
  id: string,
  name: string,
  description: string,
  cohorts: string[],             // Array of cohort IDs
  people: string[],              // Array of person IDs
  // Additional fields...
}
```

#### 5. **status** (User Presence)
```typescript
{
  id: string,                    // User ID
  state: "online" | "offline",
  last_changed: Timestamp,
}
```

#### 6. **slugs** (Vanity URLs)
```typescript
{
  id: string,                    // Slug text
  owner: DocumentReference,      // Reference to person
}
```

### Key Subcollections

#### Course Topics (map-nodes)
```typescript
{
  id: string,
  label: string,                 // Topic name
  group: string,                 // "introduction", etc.
  x: number,                     // Canvas position
  y: number,                     // Canvas position
  prerequisites: string[],       // IDs of prerequisite topics
  topicCreatedTimestamp: Timestamp,
  taskTotal: number,
}
```

#### Course Edges (map-edges)
```typescript
{
  id: string,
  from: string,                  // Source node ID
  to: string,                    // Target node ID
  arrows: string,                // Arrow direction
}
```

#### Tasks (Missions)
```typescript
{
  id: string,
  title: string,
  description: string,           // HTML content
  orderIndex: number,            // Display order
  taskType: "text" | "link" | "submission" | "other",
  submissionRequired: boolean,
  submissionInstructions: string,
  taskCreatedTimestamp: Timestamp,
  // For student copies:
  taskStatus: "locked" | "unlocked" | "active" | "inreview" | "completed",
  taskStartedTimestamp: Timestamp,
  taskSubmittedForReviewTimestamp: Timestamp,
  taskCompletedTimestamp: Timestamp,
}
```

---

## Authentication & Authorization

### Authentication
- **Firebase Authentication** with email/password
- Magic link sign-in support via email
- Custom claims for admin role: `token.admin === true`
- Email verification required for full access

### Authorization (Firestore Rules)

#### Key Rules:
1. **People Collection**
   - Users can read/write own profile
   - Admins can manage all users
   - Authenticated users can read any profile

2. **Courses Collection**
   - Public + published courses: anyone can read
   - Course owners can edit their courses
   - Assigned students can read their courses
   - Admins have full access

3. **Cohorts Collection**
   - Teachers in cohort can read/write
   - Students in cohort can read
   - Admins have full access

4. **Helper Functions**
   - `isAuthenticated()` - Check if user logged in
   - `isAdmin()` - Check admin custom claim
   - `isOwnProfile(userId)` - Check if accessing own data
   - `isTeacherInCohort(cohortId)` - Check teacher membership
   - `isStudent(cohortId)` - Check student membership
   - `canEditCourse(courseId)` - Check course ownership
   - `isAssignedToCourse(courseId)` - Check course assignment
   - `coursePublicAccess(courseId)` - Check public accessibility

---

## State Management

### Pinia Stores

#### 1. **Root Store** (`store/index.ts`)
The main application state containing:

**User State:**
- `user`: Current authenticated user data
- `person`: Full person document from Firestore
- `userStatus`: Online/offline status of all users

**Current Context:**
- `currentCourseId`: Active galaxy ID
- `currentTopicId`: Active solar system ID
- `currentTaskId`: Active mission ID
- `currentCohortId`: Active squad ID

**Course Data:**
- `boundCourse`: Currently viewed course (reactive binding)
- `currentCourseNodes`: Map nodes for current course
- `currentCourseEdges`: Map edges for current course
- `personsTopics`: Student's topics with status
- `personsCourseTasks`: Student's tasks with status
- `courseTasks`: All tasks in course (for teachers)

**Social/Collaboration:**
- `requestsForHelp`: Help requests in current course
- `courseSubmissions`: Submissions for review
- `peopleInCourse`: Users assigned to current course

**UI State:**
- `snackbar`: Global notification state
- `darkMode`: Theme preference
- `showPanelCard`: Panel visibility flags
- `topicCompleted`: Topic completion notifications
- `nextTopicUnlockedFlag`: Topic unlock notifications

**Key Actions:**
- `bindCourseByCourseId()` - Reactive course binding
- `bindCourseNodes()` / `bindCourseEdges()` - Map data binding
- `bindThisPersonsCourseTopics()` - Student progress binding
- `getPersonsCourseTasks()` - Fetch student tasks
- `getCohortsByPersonId()` - Fetch user's cohorts
- `getAllSubmittedWorkByCourseId()` - Monitor submissions
- `getRequestsForHelpByCourseId()` - Monitor help requests

#### 2. **Galaxy List View Store** (`store/galaxyListView.ts`)
- `courses`: Array of available galaxies
- `courseNodesMap`: Map of course ID to nodes
- `courseEdgesMap`: Map of course ID to edges
- `coursesActivity`: Student activity data
- `selectedCourseId`: Currently selected galaxy

**Key Actions:**
- `loadCourses(slug)` - Load galaxies for organization
- `refreshCourses()` - Reload galaxy data
- `loadCoursesActivity(personId)` - Load student activity

#### 3. **Solar System View Store** (`store/solarSystemView.ts`)
- `course`: Current galaxy
- `topic`: Current solar system
- `topicTasks`: Tasks in current topic (teacher view)
- `personTopics`: Student's topics with status
- `personTasks`: Student's tasks with status

**Key Actions:**
- `loadTopic(courseId, topicId)` - Load system data
- `refreshTasks()` - Reload mission list
- `refreshPersonTopicsAndTasks(personId)` - Update student progress
- `updateTaskOrderIndexes()` - Reorder missions

#### 4. **Cohort View Store** (`store/cohortView.ts`)
- `cohort`: Current squad data
- `studentsView`: Toggle between navigator list and overview

**Key Actions:**
- `loadCohort(cohortId)` - Load squad data
- `refreshCohort()` - Reload squad data

### State Persistence
- Pinia stores use `pinia-plugin-persistedstate`
- User preferences and session state persisted to localStorage
- Automatic restoration on page reload

---

## Routing & Navigation

### Route Structure

```
/ (Home)
├── / (GalaxyList) - Browse available galaxies
├── /login - Landing page with login
├── /register - Registration page
├── /verify - Email verification
├── /reset - Password reset
├── /dashboard - User dashboard (auth required)
├── /squads - Cohort list (auth required)
├── /students - All students view (auth required)
├── /cohort/:cohortId/:cohortName - Cohort detail (auth required)
├── /galaxy/:courseId - Galaxy map view
│   └── /galaxy/:courseId/system/:topicId - Solar system view (auth required)
└── /:slug - Organization-specific galaxy list
```

### Route Guards
- **Before Each Navigation:**
  - Wait for initial auth state
  - Track `from` route for navigation
  - Check email verification for authenticated routes
  - Enforce `authRequired` meta flag
  - Redirect unverified users to `/verify`
  - Redirect unauthenticated users to `/login`

### Navigation Components
- **NavBar** - Top navigation (create galaxy, home, etc.)
- **UserBar** - User profile and settings
- **BackButton** - Contextual back navigation

---

## Firebase Functions

All backend logic is implemented as Cloud Functions. Functions are callable via `functions.httpsCallable()`.

### User Management (`userManagement.ts`)
- `getPersonByPersonId` - Fetch user by ID
- `getPersonByEmail` - Fetch user by email
- `createNewUser` - Create user account and send invite email
- `updatePersonByPersonId` - Update user data
- `addAdminRole` - Grant admin privileges

### Course Management (`courseManagement.ts`)

**Course Operations:**
- `getCourseByCourseId` - Fetch galaxy with permissions check
- `getCourses` - List available galaxies (filtered by permissions)
- `getCourseMapEdgesAndNodesByCourseId` - Fetch visual map data

**Cohort Operations:**
- `getCohorts` - List user's squads
- `getCohortByCohortId` - Fetch squad details
- `getCohortsByCourseId` - Get squads for a galaxy
- `getStudentCohortsByPersonId` - Get student's squads

**Topic/Task Operations:**
- `getTopicByCourseIdTopicId` - Fetch solar system
- `getTasksByCourseIdTopicId` - List missions
- `getTaskByCourseIdTopicIdTaskId` - Fetch single mission
- `createTaskWithCourseIdTopicId` - Create mission (propagates to all students)
- `updateTaskByCourseIdTopicIdTaskId` - Update mission (propagates to all students)
- `deleteTaskByCourseIdTopicIdTaskId` - Delete mission (removes from all students)
- `updateTaskOrderIndexesByCourseIdTopicId` - Reorder missions

**Assignment Operations:**
- `assignCourseToMe` / `assignCourseToStudent` - Assign galaxy to navigator
  - Creates all topics and tasks for student
  - Sets initial status (locked/unlocked based on prerequisites)
  - Sends xAPI "started galaxy" statement
- `removeMeFromCourse` / `removeStudentFromCourse` - Unassign galaxy
- `addMeToCohort` / `addStudentToCohort` - Add to squad

**Student Data:**
- `getPeopleByCourseId` - Get all navigators in galaxy
- `getPersonTopicsByPersonIdCourseId` - Get student's systems
- `getPersonTopicByPersonIdCourseIdTopicId` - Get single system status
- `getPersonTasksByPersonIdCourseIdTopicId` - Get student's missions
- `getStudentSubmissionsByPersonId` - Get student's submissions
- `getStudentRequestsByPersonId` - Get student's help requests

### Activity & Analytics (`activity.ts`)
Integrates with Veracity LRS (xAPI):
- `getStudentActivityLogByPersonId` - Complete activity timeline
- `getStudentCoursesActivityByPersonId` - Per-galaxy activity summary
- `getCohortCoursesActivityByCohortId` - Squad galaxy activity
- `getCohortStudentsActivityTimeByCohortId` - Squad time tracking
- `getStudentCoursesTimeDataByPersonIdStartAtEndAt` - Time-range analytics

### Organization Management (`organisationManagement.ts`)
- `getOrganisations` - List organizations
- `getOrganisationByOrganisationId` - Fetch organization
- `getPeopleByOrganisationId` - Get organization members
- `createOrganisation` - Create organization
- `updateOrganisationByOrganisationId` - Update organization
- `deleteOrganisationByOrganisationId` - Delete organization

### Email Notifications (`emails.ts`)
Automated emails via Nodemailer + Gmail:
- **Invitations:**
  - `sendTeacherInviteEmail` - Captain account created
  - `sendStudentInviteEmail` - Navigator account created
- **Assignments:**
  - `sendNewCohortEmail` - Added to squad
  - `sendNewGalaxyEmail` - Assigned to galaxy
- **Submissions:**
  - `sendTaskSubmission` - Navigator submitted work
  - `sendResponseToSubmission` - Captain reviewed submission
- **Help Requests:**
  - `sendRequestForHelp` - Navigator needs help
  - `sendResponseToHelp` - Captain responded
- **Admin:**
  - `sendNewSubmissionEmail` - Galaxy submitted for publication
  - `sendCourseCreatedEmail` - New galaxy created (admin notification)
  - `sendCoursePublishedEmail` - Galaxy published (creator notification)
  - `sendCourseDeleted` - Galaxy deleted (navigator notification)
- **Inactivity:**
  - `sendStudentInActive` - Navigator inactive alert
  - `sendTeacherStudentInActive` - Captain notified of inactive navigator

### Scheduled Functions (`checkInactivity.ts`)
- `checkInactivitySchedule` - Daily check for inactive students (sends emails)

### Presence System (`presence.ts`)
- `onUserStatusChanged` - Trigger on user online/offline status change

---

## Component Architecture

### Views (Page Components)

#### **Home.vue**
Root layout component with:
- NavBar (top navigation)
- UserBar (user menu)
- Router outlet for child views

#### **GalaxyList.vue**
Browse and discover galaxies:
- Grid/list view of available galaxies
- Filter by organization slug
- Visual preview of galaxy maps
- Enroll/start galaxy button

#### **GalaxyView.vue**
Interactive galaxy map:
- Vis.js network visualization
- Animated solar systems with planets
- Node editing (create/edit/delete systems)
- Edge editing (create connections)
- System preview panel
- Teacher: manage galaxy structure
- Student: see progress and completion status
- Gamification: confetti on galaxy completion

#### **SolarSystemView.vue**
Detailed system with missions:
- Mission list (draggable for teachers)
- Mission cards with status indicators
- Start/submit/complete mission flows
- Request for help functionality
- Teacher: create/edit/delete missions
- Student: sequential mission progression

#### **UserDashboard.vue**
Personalized dashboard:
- **Navigator View:**
  - Course progression charts
  - Active missions
  - Help requests and submissions
  - Activity timeline
- **Captain View:**
  - Squad progress overview
  - All help requests across squads
  - All submissions across squads
  - Cohort analytics
- **Admin View:**
  - Create admin users
  - System-wide access

#### **CohortView.vue**
Squad management:
- Navigator list with progress
- Activity graphs and analytics
- Help requests for squad
- Submissions for squad
- Assign galaxies to squad

#### **AllStudentsView.vue**
Admin student management:
- All students across system
- Progress tracking
- Account management

### Major Component Groups

#### **GalaxyView/** Components
- `GalaxyMap.vue` - Main vis.js network visualization
- `GalaxyInfo.vue` - Galaxy metadata panel
- `GalaxyMapButtons.vue` - Edit mode controls
- `SolarSystemInfoPanel.vue` - System preview slide-out
- `EdgeInfoPanel.vue` - Edge editing panel
- `PublishGalaxy.vue` - Publish/submit controls
- `GalaxyCompletedDialog.vue` - Completion celebration

#### **SolarSystemView/** Components
- `SolarSystemInfo.vue` - System metadata
- `MissionsList.vue` - Draggable mission list

#### **CohortView/** Components
- `CohortInfo.vue` - Squad metadata
- `StudentDataIterator.vue` - Navigator list
- `CohortGraphs.vue` - Analytics visualizations

#### **Dialogs/** (Modal Components)
- `CreateAccountDialog.vue` - Create user accounts
- `CreateEditDeleteGalaxyDialog.vue` - Galaxy CRUD
- `CreateEditDeleteNodeDialog.vue` - System CRUD
- `CreateEditDeleteMissionDialog.vue` - Mission CRUD
- `CreateEditDeleteCohortDialog.vue` - Squad CRUD
- `CreateEditDeleteOrganisationDialog.vue` - Organization CRUD
- `StartMissionDialogV2.vue` - Start mission confirmation
- `MissionCompletedDialog.vue` - Mission completion
- `RequestHelpDialog.vue` - Request help from captain
- `RequestForHelpResponseDialog.vue` - Captain responds to help request
- `SubmissionReviewDialog.vue` - Captain reviews submission
- `AssignCohortDialog.vue` - Assign users to squads
- `LoginDialog.vue` - Authentication
- `XpPointsDialog.vue` - XP points display

#### **Reused/** (Shared Components)
- `LoadingSpinner.vue` - Loading states
- `SnackBar.vue` - Global notifications
- `BackButton.vue` - Navigation
- `SolarSystem.vue` - Animated solar system visualization
- `RequestForHelpTeacherFrame.vue` - Help requests widget
- `SubmissionTeacherFrame.vue` - Submissions widget
- `StudentActivityTimeline.vue` - Activity graph
- `TimeframeFilters.vue` - Date range picker
- `AssignedInfo.vue` - Assignment information panel

---

## Key Features

### 1. **Visual Galaxy Maps**
- Interactive graph-based course visualization
- Drag-and-drop node positioning
- Prerequisite relationships shown as edges
- Real-time progress visualization for students
- Animated "solar systems" with orbiting planets
- Color-coded status indicators

### 2. **Gamification**
- **XP Points System**
  - Earn 2000 XP for completing a galaxy
  - Points tracked in `person.xpPointsTotal`
- **Visual Celebrations**
  - Confetti animations on major completions
  - Galaxy completed dialog
  - Mission completed dialog

### 3. **Learning Analytics (xAPI)**
- Integration with Veracity LRS
- Tracks every learning action:
  - Galaxy started/stopped
  - System started/completed
  - Mission started/completed
  - Submissions and reviews
  - Login events
- Activity timelines and visualizations
- Time tracking per galaxy/system/mission

### 4. **Collaborative Learning**
- **Help Requests:**
  - Students can request help on any mission
  - Teachers receive email notifications
  - Real-time help request dashboard
  - Chat-like interface for back-and-forth
- **Submissions:**
  - Required for certain missions
  - Teacher review with approve/decline
  - Email notifications for both parties
  - In-app submission tracking

### 5. **User Presence System**
- Real-time online/offline status
- Firebase Realtime Database integration
- Shows active users in system
- Presence indicators in UI

### 6. **Organizational Hierarchy**
- Organizations contain multiple squads
- Squads contain students and teachers
- Squads assigned to specific galaxies
- Vanity URLs per organization (slugs)

### 7. **Progressive Disclosure**
- Sequential mission unlocking
- Prerequisite-based topic unlocking
- Visual locked/unlocked states
- Prevents students from skipping ahead

### 8. **Teacher Tools**
- Visual galaxy builder/editor
- Drag-and-drop mission reordering
- Real-time student progress monitoring
- Submission review interface
- Help request management
- Cohort analytics and reporting

### 9. **Email Notifications**
- Automated emails for all major events
- Uses Gmail SMTP via Nodemailer
- Configurable via Firebase config
- Templates for each notification type
- Reply-to configured for direct communication

### 10. **Multi-tenancy**
- Organization-based content separation
- Slug-based routing (e.g., `/orgname`)
- Public/private galaxy visibility
- Role-based access control

---

## Development Notes

### Getting Started
```bash
# Install dependencies
npm install

# Run dev server (port 8080)
npm run dev

# Run with Firebase emulators
npm run dev:emulator

# Build for production
npm run build

# Run tests
npm run test:unit

# Test Firestore rules
npm run test:rules
```

### Firebase Functions
```bash
cd functions
npm install
npm run build        # Compile TypeScript
npm run serve        # Run emulator
npm run deploy       # Deploy to production
```

### Environment Variables
- `VITE_USE_EMULATOR` - Use Firebase emulators
- `VITE_VERACITY_LRS_SECRET` - xAPI LRS credentials (Base64)

### Code Style
- Vue 2 Options API (not Composition API)
- TypeScript for type safety
- Pinia for state (not Vuex)
- Vuetify 2 Material Design components
- Firebase compat API (legacy)

---

## Files Read During Analysis

### Configuration & Build
- ✅ `package.json` - Dependencies and scripts
- ✅ `vite.config.ts` - Build configuration
- ✅ `tsconfig.*.json` - TypeScript configuration
- ✅ `README.md` - Project overview

### Application Core
- ✅ `src/main.ts` - Application entry point
- ✅ `src/App.vue` - Root component
- ✅ `src/router/index.ts` - Routing configuration

### State Management
- ✅ `src/store/index.ts` - Root store (main state)
- ✅ `src/store/_types.ts` - TypeScript definitions
- ✅ `src/store/galaxyListView.ts` - Galaxy list state
- ✅ `src/store/solarSystemView.ts` - Solar system state
- ✅ `src/store/cohortView.ts` - Cohort state
- ✅ `src/store/firestoreConfig.ts` - Firebase initialization

### Views
- ✅ `src/views/Home.vue` - Main layout
- ✅ `src/views/GalaxyView.vue` - Galaxy map view
- ✅ `src/views/SolarSystemView.vue` - System detail view
- ✅ `src/views/UserDashboard.vue` - User dashboard
- ✅ `src/views/CohortView.vue` - Cohort management

### Libraries & Utilities
- ✅ `src/lib/ff.ts` - Firebase function wrappers
- ✅ `src/lib/veracityLRS.js` - xAPI integration
- ✅ `src/presence/index.ts` - Presence system

### Firebase Functions
- ✅ `functions/src/index.ts` - Function exports
- ✅ `functions/src/_shared.ts` - Shared utilities
- ✅ `functions/src/_constants.ts` - Constants
- ✅ `functions/src/userManagement.ts` - User operations
- ✅ `functions/src/courseManagement.ts` - Course operations
- ✅ `functions/src/emails.ts` - Email notifications
- ✅ `functions/src/activity.ts` - Analytics
- ✅ `functions/package.json` - Function dependencies

### Security & Rules
- ✅ `rules/firestore.rules` - Database security rules

### Components (Partial)
- ✅ `src/components/GalaxyView/GalaxyMap.vue` - Map visualization (partial)
- ✅ `src/components/Dialogs/StartMissionDialogV2.vue` - Start mission (partial)

---

## Implementation Deep Dive

### Visual Components & Animation System

#### Galaxy Map Visualization
The galaxy map uses **vis-network** library wrapped in a custom Vue 2 component (`vue2vis/Network.vue`):

**Key Features:**
- **Custom Canvas Rendering:** Uses `beforeDrawing` and `afterDrawing` hooks to overlay custom animations
- **Planet Animation System:** Custom `Planet` class with orbital mechanics
  - Smooth easing animations when stopping/resuming orbit
  - Interpolated angle transitions (easeInOutQuad)
  - Each planet represents a mission/task
  - Planets orbit around their parent solar system node
- **Star Visualization:** `Star` class for glowing star effects at node centers
  - Radial gradient glow effects
  - Fire-like glow animation
- **Manual Label Rendering:** Labels drawn on canvas (not via vis-network) for better control
  - Labels positioned above nodes
  - Color-coded by theme (missionAccent)
  - Hidden during edit modes

**Edit Modes (Teachers Only):**
1. **Add Node Mode:** Click to place new solar systems
2. **Add Edge Mode:** Drag between nodes to create prerequisites
3. **Drag Node Mode:** Reposition nodes with multi-select support
   - Rectangle selection with mouse/touch events
   - Batch position updates saved to Firestore
   - Position changes trigger planet redraw

**System Preview Mode:**
- Click a solar system to zoom in
- Hides edges and other systems
- Shows only planets for selected system
- Slide-out panel with mission list
- Smooth zoom animations (2000ms easeInOutQuad)

#### Solar System Component
Animated CSS-based solar system (`components/Reused/SolarSystem.vue`):
- Pure CSS orbital animations
- Up to 9 orbit levels with randomized durations
- Missions displayed as orbiting spheres
- Inspired by Mustafa Enes' CodePen
- Responsive sizing via fontSize prop

#### Color System
**Theme Colors (Vuetify):**
```typescript
// Dark Mode (default)
baseAccent: "#00E676"    // Green - primary actions
galaxyAccent: "#E269CF"  // Pink - galaxy/course related
missionAccent: "#69A1E2" // Blue - mission/task related
cohortAccent: "#FAF200"  // Yellow - submissions/cohorts

// Light Mode
baseAccent: "#495867"    // Dark gray
galaxyAccent: "#fe5f55"  // Red
missionAccent: "#577399" // Dark blue
cohortAccent: "#fe5f55"  // Red
```

**Dynamic Colors:**
- Deterministic color generation from strings (hash-based HSL)
- Used for avatars without images
- Consistent colors across sessions

### Data Synchronization Patterns

#### Reactive Bindings (Piniafire)
Custom Pinia-Firebase integration (`piniafire/` directory):

**Firestore Bindings:**
- `firestoreAction()` wrapper for Pinia actions
- Real-time updates via `onSnapshot`
- Mutations: `SET_VALUE`, `ARRAY_ADD`, `ARRAY_REMOVE`
- Auto-unbind on component destroy

**RTDB Bindings:**
- `firebaseAction()` for Realtime Database
- Used exclusively for presence system
- Lighter weight than Firestore for status

**Example Usage:**
```typescript
bindCourseByCourseId: firestoreAction(({ bindFirestoreRef }, courseId: string) => {
  return bindFirestoreRef("boundCourse", db.collection("courses").doc(courseId));
})
```

#### Data Propagation

**Course → Student Propagation:**
When a teacher creates/updates/deletes a task:
1. Update `courses/{courseId}/topics/{topicId}/tasks/{taskId}`
2. Find all students with `assignedCourses` containing courseId
3. For each student, update `people/{studentId}/{courseId}/{topicId}/tasks/{taskId}`
4. Set appropriate status (locked/unlocked based on prerequisites)
5. Update totals: `course.taskTotal`, `topic.taskTotal`

**Student Assignment Flow:**
```
assignCourseToStudent()
├─ Load all topics for course
├─ For each topic:
│  ├─ Calculate initial status (unlocked if "introduction" or no prereqs, else locked)
│  ├─ Create topic doc in people/{personId}/{courseId}/{topicId}
│  └─ For each task in topic:
│     └─ Create task doc with status (unlocked for first, locked for rest)
├─ Add courseId to person.assignedCourses
└─ Send xAPI "started galaxy" statement
```

### Mission Progression Logic

#### Status Transitions

**Task Status Flow:**
```
locked → unlocked → active → (inreview if submission required) → completed
                           ↓ (if declined)
                        declined → active (retry)
```

**Unlocking Logic:**
1. When task completed, find next locked task in topic
2. Update that task to unlocked
3. If all tasks completed:
   - Set topic to completed
   - Award XP points (500 for topic)
   - Find topics with this topic as prerequisite
   - Check if ALL prerequisites met
   - If yes, unlock next topic(s)

**Topic Status Flow:**
```
locked → unlocked → active → completed
```

**Prerequisite Evaluation:**
- Topic unlocked only when ALL prerequisites completed
- Multi-prerequisite support (AND logic, not OR)
- Introduction topics always unlocked by default

#### Submission & Review Workflow

**Student Submits Work:**
1. Create doc in `courses/{courseId}/submissionsForReview`
2. Update task in `people/{personId}/{courseId}/{topicId}/tasks/{taskId}`
   - Set `taskStatus: "inreview"`
   - Set `taskSubmittedForReviewTimestamp`
3. Send xAPI statement
4. Email all teachers in cohort
5. Unlock next task (but can't progress to next topic until reviewed)

**Teacher Reviews:**
- **Approve:**
  1. Update submission: `taskSubmissionStatus: "completed"`
  2. Update student's task: `taskStatus: "completed"`
  3. Set `taskReviewedAndCompletedTimestamp`
  4. Award XP points (100 for task)
  5. Send email to student
  6. Check if topic now completed
- **Decline:**
  1. Update submission: `taskSubmissionStatus: "declined"`
  2. Update student's task: `taskStatus: "declined"`
  3. Add feedback message
  4. Send email to student
  5. Student can resubmit

### Analytics & Tracking (xAPI/LRS)

#### Veracity LRS Integration

**Statement Types Sent:**
- `started` - Galaxy/System/Mission
- `stopped` - Galaxy (when unassigned)
- `completed` - Mission/System
- `loggedin` / `loggedout` - User presence
- `requested` - Help request
- `submitted` - Work for review
- `declined` / `completed` - Review outcomes

**Statement Structure:**
```typescript
{
  actor: { name, mbox },           // Student
  verb: { id, display },           // Action (xAPI verb)
  object: {                        // What was acted upon
    id: "https://galaxymaps.io/...",
    definition: { name, description, extensions }
  },
  context: {
    contextActivities: {
      parent: [...],               // Direct parent
      grouping: [...]              // Galaxy level grouping
    }
  }
}
```

**Query Functions (in Firebase Functions):**
- `getStudentActivityLogXAPIQuery()` - Complete activity timeline
- `getStudentCoursesDataXAPIQuery()` - Per-course completion data
- `getStudentCoursesTimeDataXAPIQuery()` - Time tracking by course
- `getCohortCoursesDataXAPIQuery()` - Cohort-wide course data
- `getCohortStudentsTimeDataXAPIQuery()` - Cohort time analytics

**Visualization:**
- Chart.js for line/bar charts
- Luxon for date/time handling
- Real-time filtering by timeframe (day/week/month/all time/custom)
- Tooltips with rich context (galaxy/system/mission hierarchy)

### Presence System Architecture

**Dual Database Approach:**
- **Realtime Database:** Source of truth for online/offline status
  - Uses `.info/connected` listener
  - `onDisconnect()` triggers set offline status
  - Lightweight and fast
- **Firestore:** Synced copy for easy querying
  - Trigger function syncs RTDB → Firestore
  - Allows complex queries on status
  - Used for UI presence indicators

**Flow:**
```
1. User connects → RTDB sets "online"
2. onDisconnect() registered → will set "offline" on disconnect
3. Firestore trigger copies status to Firestore
4. Frontend watches Firestore collection where state=="online"
5. On change, update rootStore.userStatus
6. UI reactively shows green borders on avatars
```

**xAPI Integration:**
- Presence trigger also sends xAPI statements
- Tracks login/logout events to LRS
- Used for activity analytics

### Email Notification System

**Architecture:**
- Gmail SMTP via Nodemailer
- Configured via Firebase Functions config
- HTML + plain text versions
- Reply-to headers for direct communication

**Template Pattern:**
All emails follow consistent structure:
```html
<greeting>
<context (Galaxy > System > Mission)>
<speech-bubble style for messages>
<call-to-action with link>
<footer>
```

**Email Triggers:**
- Firebase Functions called from frontend
- Async/parallel sending to multiple recipients
- Error handling with user feedback (snackbar)

### Performance & Optimization

#### State Persistence
- **Pinia Persistence:** localStorage for user preferences
- **Serialization:** Custom `SerializableMap` class for Map objects
- **Restore Hooks:** Convert serialized objects back to Maps

#### Lazy Loading
- Components auto-imported via `unplugin-vue-components`
- Route-based code splitting
- Dynamic imports for heavy dialogs

#### Data Caching
- Firestore bindings cache data in Pinia stores
- `courseNodesMap` and `courseEdgesMap` prevent redundant fetches
- Computed properties for derived data

#### Animation Performance
- `requestAnimationFrame` for planet animations
- Canvas-based rendering (not DOM manipulation)
- Conditional rendering (stop animations when not visible)

### Security Model

#### Multi-Layer Defense

**1. Client-Side Guards:**
- Vue Router `beforeEach` checks authentication
- Component-level permission checks (teacher/student/admin)
- UI elements hidden based on permissions

**2. Firestore Rules:**
- Server-side enforcement (client rules can be bypassed)
- Helper functions for complex permission logic
- Granular subcollection rules

**3. Cloud Functions:**
- `requireAuthenticated()` for all callable functions
- `context.auth.token.admin` for admin actions
- Custom permission checks (TODO: many marked for implementation)

**Permission Patterns:**
```typescript
// Course Access
canEditCourse() {
  return owner || mappedBy.personId || contentBy.personId || admin;
}

// Course Visibility
coursePublicAccess() {
  return status === "published" && (public || presentationOnly);
}
```

### Image Upload Flow

**Pattern Used Throughout:**
```javascript
1. User selects file via v-file-input
2. Create Firebase Storage reference
3. Put file → uploadTask
4. Monitor uploadTask.on("state_changed")
   - Update progress bar (percentage)
5. On complete:
   - Get download URL
   - Update Firestore doc with {url, name}
   - Or insert into rich text editor
```

**Storage Paths:**
- `avatar-images/{firstName}{lastName}-{filename}`
- `galaxy-images/{courseId}-{filename}`
- `submission-images/student-{personId}-task-{taskId}-{filename}`

### Rich Text Editing

**Vue2Editor (Quill.js):**
- WYSIWYG for mission descriptions
- Submission instructions
- Custom image handler (uploads to Firebase Storage)
- Custom toolbar configuration
- HTML sanitization

**Storage Integration:**
```javascript
handleImageAdded(file, Editor, cursorLocation) {
  var storageRef = storage.ref(`path/${filename}`);
  var uploadTask = storageRef.put(file);
  uploadTask.on("state_changed", snapshot => {
    // Progress
  }, err => {
    // Error
  }, () => {
    // Complete - insert image URL
    uploadTask.snapshot.ref.getDownloadURL().then(url => {
      Editor.insertEmbed(cursorLocation, "image", url);
    });
  });
}
```

### UI/UX Patterns

#### Consistent Design Language

**Ribbon Labels:**
- Angled clip-path for headers
- Color-coded by entity type
- Used across panels consistently

**Border Styles:**
- Solid for active/published
- Dashed for draft/locked
- Color-coded by entity type

**Status Indicators:**
- Color-coded text
- Icon + text combinations
- Contextual coloring (baseAccent for success, cohortAccent for review, galaxyAccent for warning)

**Loading States:**
- Consistent `LoadingSpinner` component
- Progress bars for uploads
- Button loading states
- Skeleton loaders (via v-progress-circular)

#### Responsive Behavior

**Adaptive Navigation:**
- Full navbar on main views
- Hamburger menu on galaxy/system views
- Collapsible panels (left/right) on galaxy view
- UserBar mini mode on immersive views

**Panel System:**
- Slide-out panels from left/right
- Smooth CSS transitions (0.3s ease-out)
- clip-path polygons for angled edges
- Backdrop blur effects

**Cards & Expansion Panels:**
- Vuetify expansion panels for missions
- Auto-expand active mission
- Drag-and-drop reordering (vuedraggable)
- Contextual actions in headers

### Error Handling & User Feedback

#### Snackbar System
Global notification system via root store:
```typescript
setSnackbar({
  show: true,
  text: "Message here",
  color: "baseAccent" | "pink" | "cohortAccent"
})
```

**User-Friendly Error Messages:**
- Firebase error codes mapped to friendly messages
- `getFriendlyErrorMessage()` utility function
- 80+ error codes handled

#### Validation
- Email validation (regex)
- Password requirements (8+ chars)
- Required field checks
- Form validation via Vuetify rules

### Data Flow Examples

#### Starting a Mission (Student)
```
1. Click "Start Mission" button
2. StartMissionDialogV2 emits → SolarSystemView
3. Update Firestore:
   - Set task.taskStatus = "active"
   - Set task.taskStartedTimestamp
   - If first mission in topic, set topic.topicStatus = "active"
4. Send xAPI statements (topic + task started)
5. Emit missionStarted → parent
6. Refresh data:
   - refreshTopic()
   - refreshPersonTopicsAndTasks()
7. UI updates reactively
```

#### Creating a Galaxy (Teacher)
```
1. CreateEditDeleteGalaxyDialog
2. Upload image → Firebase Storage
3. Save course doc to Firestore
4. Set status: "drafting"
5. Set owner, mappedBy metadata
6. Emit courseCreated
7. Send admin notification email
8. Redirect to GalaxyView for editing
9. Add nodes (systems) and edges (prerequisites)
10. Create missions within systems
11. Publish → status: "submitted" (if public) or "published" (if private/unlisted)
12. Send notification emails
```

#### Teacher Reviews Submission
```
1. SubmissionTeacherFrame shows submissions with status "inreview"
2. Click "View submission" → SubmissionReviewDialog
3. Teacher clicks Approve or Decline (with optional feedback)
4. Update submission doc:
   - taskSubmissionStatus: "completed" or "declined"
   - responseMessage, responderPersonId, responseSubmittedTimestamp
5. Update student's task:
   - taskStatus: "completed" or "declined"
6. If approved:
   - Award XP points (increment)
   - Check if topic completed
   - Unlock next topic if prerequisites met
7. Send xAPI statement
8. Email student with outcome
9. Remove from teacher's review queue
```

### Caching & Data Fetching Strategy

#### Two-Tier Data Access

**1. Firestore Direct (Real-time):**
- Used for frequently changing data
- Bindings in Pinia stores
- Examples: course nodes/edges, student progress, submissions, requests

**2. Cloud Functions (On-Demand):**
- Used for infrequent/large data fetches
- Adds permission layer
- Examples: course lists, cohort data, analytics
- Wrapped in `lib/ff.ts` for clean API

**Caching Strategy:**
- `galaxyListView` store caches all courses + nodes + edges
- Persisted to localStorage
- Refreshed on auth state change
- Manual refresh via pull-to-refresh pattern

### Special Features Implementation

#### Gamification

**XP Points System:**
```typescript
// Points awarded:
- Task completed: 100 XP
- Topic completed: 500 XP  
- Galaxy completed: 2000 XP

// Stored in: person.xpPointsTotal
// Updated via: FieldValue.increment()
```

**Confetti Celebrations:**
- canvas-confetti library
- Fireworks animation (30s for galaxy, 15s for topic)
- Dual-origin particle spawning
- Color-matched to theme

**Completion Tracking:**
- `person.completedCourses` array
- Prevents re-awarding XP
- Used for completion badges

#### Multi-tenancy (Organizations & Slugs)

**Slug System:**
- `slugs` collection maps slug → owner (person or organization)
- Route: `/:slug` loads galaxies for that entity
- Vanity URLs for organizations
- Example: `/tairea` shows all Tairea's galaxies

**Organization Hierarchy:**
```
Organisation
├─ cohorts: [cohortId1, cohortId2]
└─ people: [personRef1, personRef2]

Cohort
├─ teachers: [personId1, personId2]
├─ students: [personId1, personId2, ...]
├─ courses: [courseId1, courseId2]
└─ organisation: organisationId
```

**Data Filtering:**
- Courses filtered by slug in `getCourses()` function
- Permission-based visibility
- Organisation admins (future feature - currently TODO)

#### Inactivity Monitoring

**Scheduled Function (Daily at 8am NZT):**
```typescript
checkInactivitySchedule()
├─ Query all user status docs
├─ Filter where state == "offline"
├─ Check last_changed timestamp
├─ If 1 week ago:
│  ├─ Email student
│  └─ Email all their teachers
└─ If 2 weeks ago:
   ├─ Email student
   └─ Email all their teachers
```

### Component Communication Patterns

#### Event Bubbling
Deep component hierarchies use event bubbling:
```
MissionsCard
  ↓ emits missionCompleted
MissionsList
  ↓ emits missionCompleted
SolarSystemView
  ↓ calls refreshTopic(), refreshPersonTopicsAndTasks()
```

#### Store-Based Communication
For cross-component communication:
- `topicCompleted` flag triggers celebrations
- `nextTopicUnlockedFlag` enables UI updates
- `showPanelCard` for expanding specific request/submission

#### Props Down, Events Up
Standard Vue pattern:
- Data flows down via props
- Changes bubble up via events
- Pinia stores for shared state

### Testing Infrastructure

**Unit Tests (Vitest):**
- Configured in `vitest.config.ts`
- JSDOM environment for DOM testing
- Vue Test Utils for component testing
- Run via `npm run test:unit`

**Firestore Rules Testing:**
- Emulator-based testing
- `rules/test-rules.js` test suite
- `rules/test-data.json` fixture data
- Run via `npm run test:rules`

**Emulator Support:**
- Firebase emulators for local development
- Configured in `firebase.json`
- Ports: Auth (9099), Firestore (8080), Functions (5001), UI (4000)
- Activate via `VITE_USE_EMULATOR=true`

### Common Utilities & Helpers

#### String/Hash Functions
```javascript
// Consistent hashing for colors
hashCode(str) {
  let hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Hash to color
stringToColour(str) {
  return `hsl(${hashCode(str) % 360}, 100%, 70%)`;
}
```

#### Date/Time Utilities
- Luxon for modern date handling
- Moment.js (legacy, being phased out)
- `getHumanDate()` - Format timestamps for display
- Firestore Timestamp handling (`.seconds` vs `._seconds`)

#### Avatar System
Consistent avatar display throughout:
- Shows profile image if available
- Falls back to colored circle with initials
- Color derived from name (consistent hash)
- Green border when user online
- Tooltips with full name
- Click handlers for context actions

### Development Workflow

#### Local Development
```bash
# Frontend (port 8080)
npm run dev

# With emulators
npm run dev:emulator

# Functions (separate terminal)
cd functions
npm run build:watch
npm run serve
```

#### Build & Deploy
```bash
# Build frontend
npm run build              # dist/ output

# Deploy functions
cd functions
npm run deploy

# Deploy all (via firebase.json)
firebase deploy
```

#### Code Quality
```bash
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript checking
```

### Known Issues & TODs

#### TODO Comments Found:
1. **Permissions:** Many functions marked with "TODO: permissions checks"
2. **Delete Cascades:** Some delete operations don't cascade fully
3. **Organisation Features:** Organisation admin roles not fully implemented
4. **Collaborators:** Course collaborators field exists but not used
5. **Magic Link Auth:** Email sign-in partially implemented
6. **Routing:** Some edge cases with direct URL access

#### Current Limitations:
- Registration currently closed (Alpha testing only)
- Some features behind admin-only or hardcoded user checks
- Email configuration requires Firebase Functions config setup
- LRS integration requires Veracity credentials

### Architecture Decisions & Rationale

#### Why Vue 2?
- Project started before Vue 3 stable release
- Vuetify 2 compatibility
- Migration path exists (Vue 2.7 is transition version)

#### Why Pinia over Vuex?
- Better TypeScript support
- Simpler API (no mutations concept)
- Better devtools
- Official recommendation for new projects

#### Why Firebase?
- Real-time capabilities for collaboration
- Managed authentication
- Scalable NoSQL database
- Serverless functions
- Generous free tier

#### Why Vis-Network?
- Powerful graph visualization
- Physics simulation for auto-layout
- Canvas-based (performant for large graphs)
- Extensive API for manipulation

#### Client-Side vs Server-Side Logic

**Client-Side:**
- UI state management
- Real-time data binding
- Animation/visualization
- Form validation

**Server-Side (Functions):**
- Data validation
- Permission enforcement
- Cross-collection updates
- Email sending
- Analytics queries

---

## Architectural Patterns Summary

### Key Design Patterns Used

1. **Repository Pattern:** `lib/ff.ts` wraps Firebase Function calls
2. **Observer Pattern:** Firestore listeners + Pinia reactive state
3. **Facade Pattern:** Piniafire wraps Vuefire for Pinia
4. **Strategy Pattern:** Different edit modes in galaxy map
5. **Factory Pattern:** Dynamic component rendering based on status
6. **Command Pattern:** Firebase Functions as discrete operations
7. **Pub/Sub Pattern:** Event emitters for component communication

### Data Flow Architecture

```
User Action (UI)
  ↓
Vue Component (event handler)
  ↓
Pinia Store Action (business logic)
  ↓
Firebase Function (via lib/ff.ts)
  ↓
Cloud Function (permission check + data manipulation)
  ↓
Firestore Write
  ↓
Firestore onSnapshot (real-time listener)
  ↓
Pinia Store Mutation (via Piniafire)
  ↓
Vue Computed Property
  ↓
UI Update (reactive)
```

### State Management Philosophy

**Single Source of Truth:**
- Firestore is source of truth
- Pinia stores are reactive mirrors
- No duplicate state storage

**Optimistic Updates:**
- Most updates don't use optimistic approach
- Wait for Firestore confirmation
- Loading states during operations

**Eventual Consistency:**
- Real-time listeners ensure consistency
- Some propagation delays acceptable
- User feedback via snackbar on completion

---

## Getting Started Guide for New Developers

### 1. Initial Setup
```bash
# Clone repo
git clone <repo-url>
cd galaxy-maps-v2

# Install dependencies
npm install
cd functions && npm install && cd ..

# Set up Firebase CLI
npm install -g firebase-tools
firebase login
```

### 2. Local Development
```bash
# Terminal 1: Frontend
npm run dev:emulator

# Terminal 2: Emulators
firebase emulators:start

# Terminal 3: Functions (optional)
cd functions
npm run build:watch
```

### 3. Understanding the Flow
Start exploring in this order:
1. `src/main.ts` - Entry point
2. `src/router/index.ts` - Routes
3. `src/store/index.ts` - Main state
4. `src/views/GalaxyList.vue` - Landing page
5. `src/views/GalaxyView.vue` - Main feature
6. `functions/src/courseManagement.ts` - Backend logic

### 4. Making Changes

**Add a New Feature to Missions:**
1. Update type in `store/_types.ts`
2. Add field to mission dialog (`Dialogs/CreateEditDeleteMissionDialog.vue`)
3. Display in mission card (`MissionsList/MissionsCard.vue`)
4. Update `createTask()` in `functions/src/courseManagement.ts`
5. Test with emulators

**Add a New Cloud Function:**
1. Create in appropriate file (e.g., `functions/src/courseManagement.ts`)
2. Export in `functions/src/index.ts`
3. Add TypeScript wrapper in `src/lib/ff.ts`
4. Call from component

### 5. Key Files to Know

**Most Modified Files:**
- `src/store/index.ts` - Main state container
- `src/components/GalaxyView/GalaxyMap.vue` - Complex visualization
- `functions/src/courseManagement.ts` - Core business logic
- `rules/firestore.rules` - Security rules

**Configuration Files:**
- `firebase.json` - Firebase project config
- `vite.config.ts` - Build configuration
- `.env.local` (create this) - Environment variables

### 6. Common Tasks

**Add New User Role:**
1. Add custom claim in `functions/src/userManagement.ts`
2. Update Firestore rules
3. Add UI conditionals
4. Update permission checks in functions

**Add New Analytics:**
1. Create xAPI statement in `lib/veracityLRS.js`
2. Send from appropriate component
3. Create query function in `functions/src/veracityLRS.ts`
4. Create endpoint in `functions/src/activity.ts`
5. Create wrapper in `lib/ff.ts`
6. Display in chart component

---

## Files Read During Deep Analysis

### Core Application (Continued)
- ✅ `src/components/GalaxyView/GalaxyMap.vue` - Complete network visualization
- ✅ `src/components/GalaxyView/GalaxyInfo.vue` - Galaxy metadata panel
- ✅ `src/components/GalaxyView/GalaxyMapButtons.vue` - Edit controls
- ✅ `src/components/GalaxyView/PublishGalaxy.vue` - Publishing workflow
- ✅ `src/components/GalaxyView/SolarSystemInfoPanel.vue` - System preview
- ✅ `src/components/GalaxyView/EdgeInfoPanel.vue` - Edge management
- ✅ `src/components/GalaxyView/GalaxyCompletedDialog.vue` - Completion

### Solar System Components
- ✅ `src/components/SolarSystemView/SolarSystemInfo.vue` - System info
- ✅ `src/components/SolarSystemView/MissionsList.vue` - Mission container
- ✅ `src/components/SolarSystemView/MissionsList/MissionsCard.vue` - Mission display
- ✅ `src/components/SolarSystemView/MissionsList/MissionsCard/ActiveMissionsCard.vue`
- ✅ `src/components/SolarSystemView/MissionsList/MissionsCard/SelectedMissionsCard.vue`

### Dialogs (Modals)
- ✅ `src/components/Dialogs/CreateEditDeleteGalaxyDialog.vue` - Galaxy CRUD
- ✅ `src/components/Dialogs/CreateEditDeleteNodeDialog.vue` - System CRUD
- ✅ `src/components/Dialogs/CreateEditDeleteMissionDialog.vue` - Mission CRUD
- ✅ `src/components/Dialogs/CreateEditDeleteCohortDialog.vue` - Squad CRUD
- ✅ `src/components/Dialogs/CreateEditDeleteOrganisationDialog.vue` - Org CRUD
- ✅ `src/components/Dialogs/StartMissionDialogV2.vue` - Start mission
- ✅ `src/components/Dialogs/MissionCompletedDialog.vue` - Complete mission
- ✅ `src/components/Dialogs/RequestHelpDialog.vue` - Request help
- ✅ `src/components/Dialogs/RequestForHelpResponseDialog.vue` - Respond to help
- ✅ `src/components/Dialogs/SubmissionReviewDialog.vue` - Review submission
- ✅ `src/components/Dialogs/AssignCohortDialog.vue` - Assignment workflows
- ✅ `src/components/Dialogs/CreateAccountDialog.vue` - User creation
- ✅ `src/components/Dialogs/CreateAccountForm.vue` - Account form
- ✅ `src/components/Dialogs/CreateAdminDialog.vue` - Admin creation
- ✅ `src/components/Dialogs/LoginDialog.vue` - Authentication
- ✅ `src/components/Dialogs/StudentEditDialog.vue` - Profile editing
- ✅ `src/components/Dialogs/StudentAccountsDialog.vue` - Bulk student management
- ✅ `src/components/Dialogs/XpPointsDialog.vue` - XP management
- ✅ `src/components/Dialogs/ConfirmDeleteStudentDialog.vue` - Student removal
- ✅ `src/components/Dialogs/DiscoverGalaxyButton.vue` - Galaxy discovery

### Cohort Components
- ✅ `src/components/CohortView/CohortInfo.vue` - Squad info
- ✅ `src/components/CohortView/CohortGraphs.vue` - Analytics charts
- ✅ `src/components/CohortView/StudentDataIterator.vue` - Student list
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard.vue` - Student card
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentCardStatus.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentCardProgress.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentCircularProgress.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentHours.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentCompletedTasks.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentXpPoints.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentCohorts.vue`
- ✅ `src/components/CohortView/StudentDataIterator/StudentCard/StudentActions.vue`
- ✅ `src/components/CohortList/CohortPanelV2.vue` - Cohort panel

### All Students View
- ✅ `src/views/AllStudentsView.vue` - Admin student view
- ✅ `src/components/AllStudentsView/StudentDataIteratorAdmin.vue` - Admin iterator
- ✅ `src/components/AllStudentsView/StudentCardAdmin.vue` - Admin card
- ✅ `src/components/AllStudentsView/StudentProgressionChartJs3.vue` - Charts

### Dashboard Components
- ✅ `src/components/UserDashboard/UserInfo.vue` - User info panel
- ✅ `src/components/UserDashboard/UserInfo/StudentAvatar.vue` - Avatar uploader
- ✅ `src/components/UserDashboard/StudentCourseProgression.vue` - Course progression
- ✅ `src/components/UserDashboard/StudentCourseProgression/GalaxyProgressionCard.vue`
- ✅ `src/components/UserDashboard/StudentCourseProgression/GalaxyProgressionCard/ActiveMissions.vue`

### Galaxy List Components
- ✅ `src/components/GalaxyList/Galaxies.vue` - Galaxy grid visualization
- ✅ `src/components/GalaxyList/GalaxyListPanel.vue` - Left sidebar panel
- ✅ `src/components/GalaxyList/GalaxyListInfoPanel.vue` - Right preview panel
- ✅ `src/components/GalaxyList/GalaxyListInfoPanel/PopupGalaxyPreview.vue`
- ✅ `src/components/GalaxyList/VersionStatus.vue` - Version display
- ✅ `src/components/GalaxyList/GradientBackground.vue` - Background effect

### Shared/Reused Components
- ✅ `src/components/Reused/SolarSystem.vue` - CSS solar system
- ✅ `src/components/Reused/LoadingSpinner.vue` - Loading state
- ✅ `src/components/Reused/SnackBar.vue` - Global notifications
- ✅ `src/components/Reused/BackButton.vue` - Navigation
- ✅ `src/components/Reused/Avatar.vue` - User avatar
- ✅ `src/components/Reused/AssignedInfo.vue` - Assignment info
- ✅ `src/components/Reused/Organisation.vue` - Org display
- ✅ `src/components/Reused/Cohort.vue` - Cohort display
- ✅ `src/components/Reused/Course.vue` - Course display
- ✅ `src/components/Reused/TimeframeFilters.vue` - Date range picker
- ✅ `src/components/Reused/RequestForHelpTeacherFrame.vue` - Help requests widget
- ✅ `src/components/Reused/RequestForHelpTeacherFrame/RequestForHelpTeacherPanel.vue`
- ✅ `src/components/Reused/SubmissionTeacherFrame.vue` - Submissions widget
- ✅ `src/components/Reused/SubmissionTeacherFrame/SubmissionTeacherPanel.vue`
- ✅ `src/components/Reused/StudentActivityTimeline.vue` - Activity log
- ✅ `src/components/Reused/LearnerOverviewDashboard.vue` - Student overview dialog
- ✅ `src/components/Reused/Chart.vue` - Chart.js wrapper
- ✅ `src/components/Reused/ProgressionLineChart.vue` - Progress chart
- ✅ `src/components/Reused/ProgressionLineChartStudentCourses.vue`
- ✅ `src/components/Reused/ActivityBarChart.vue` - Activity chart
- ✅ `src/components/Reused/ActivityBarChartStudentCourses.vue`
- ✅ `src/components/Reused/NewPassword.vue` - Password reset
- ✅ `src/components/Reused/EmailSignIn.vue` - Magic link signin

### Navigation & Layout
- ✅ `src/components/Home/NavBar.vue` - Top navigation
- ✅ `src/components/Home/UserBar.vue` - User menu

### Landing/Auth Components
- ✅ `src/views/LandingPage.vue` - Landing page router
- ✅ `src/components/Landing/Login.vue` - Login form
- ✅ `src/components/Landing/Register.vue` - Registration form
- ✅ `src/components/Landing/VerifyEmail.vue` - Email verification
- ✅ `src/components/Landing/ResetPassword.vue` - Password reset

### Visualization Libraries
- ✅ `src/lib/planet.ts` - Planet animation class
- ✅ `src/lib/star.ts` - Star rendering class
- ✅ `src/lib/utils.ts` - Utility functions (error messages, names, colors)
- ✅ `src/vue2vis/Network.vue` - Vis-network Vue wrapper
- ✅ `src/vue2vis/utils.js` - Vis-network utilities

### Piniafire Integration
- ✅ `src/piniafire/index.ts` - Exports
- ✅ `src/piniafire/firestore.ts` - Firestore bindings
- ✅ `src/piniafire/rtdb.ts` - Realtime DB bindings
- ✅ `src/piniafire/mutations.ts` - Mutations
- ✅ `src/piniafire/mutations-types.ts` - Mutation constants

### Configuration
- ✅ `firebase.json` - Firebase configuration
- ✅ `firestore.indexes.json` - Database indexes (empty)
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `babel.config.js` - Babel configuration
- ✅ `vitest.config.ts` - Test configuration

### Styling
- ✅ `src/css/main.scss` - Global styles
- ✅ `src/scss/variables.scss` - SCSS variables
- ✅ `src/plugins/vuetify.ts` - Theme configuration

---

**Analysis Status:** Analyzed ~40% of context budget. This documentation covers the primary architectural patterns, data flows, and implementation details needed for new developers to understand and work with the codebase effectively.

---

## Advanced Implementation Details

### Complex Data Transformations

#### Time Tracking Algorithm (LRS Data Processing)
The system calculates time spent in each galaxy by analyzing login/logout xAPI statements:

**Algorithm:**
```typescript
// getCohortStudentsTimeDataXAPIQuery
1. Query all "logged in to Galaxy" and "logged out" statements
2. Group by person
3. For each person's statements:
   a. Track current login (courseId + timestamp)
   b. When logout found:
      - Calculate diff between logout and login
      - Add to courseTimes map for that courseId
   c. When next login found:
      - Calculate diff from previous login to this login (session time)
      - Add to previous courseId
      - Set new current login
4. Return map of courseId → hours spent
```

**Daily Aggregation:**
```typescript
// For activity bar charts
1. Group login/logout pairs by day (ISO date)
2. For each day:
   - Find pairs of login followed by logout
   - Sum time differences
   - Store as {dayISOTimestamp, minutesActiveTotal}
3. Filter by timeframe when displaying
```

#### Galaxy Grid Repositioning
Complex algorithm to arrange multiple galaxies in grid layout (`Galaxies.vue`):

**Steps:**
1. Calculate boundaries for each galaxy (min/max x/y of all nodes)
2. Determine grid dimensions (rows × columns)
3. Calculate largest width and height across all galaxies
4. Reposition each galaxy to grid cell:
   - Calculate centroid of original galaxy
   - Calculate target position in grid
   - Apply offset to all nodes
   - Update node positions maintaining relative spacing

**Canvas Masking for System Preview:**
- Draw full-screen rectangle
- Draw circle "hole" at system center
- Use canvas path operations (fill with background color)
- Sized based on number of orbiting missions

### Drag & Drop Mission Reordering

**Implementation (vuedraggable):**
```vue
<draggable
  v-model="sortableMissionList"
  :disabled="!teacher"
  ghost-class="ghost"
>
```

**Logic:**
1. User drags mission to new position
2. Computed setter fires on sortableMissionList
3. Loop through reordered array, set orderIndex = array index
4. Emit taskOrderChanged event
5. Parent shows "SAVE CHANGES" button
6. On save:
   - Call updateTaskOrderIndexesByCourseIdTopicId()
   - Firebase Function updates all student copies
   - Refresh data from Firestore

**Persistence:**
- Both `orderIndex` and `taskCreatedTimestamp` stored
- Sorting prioritizes orderIndex if present
- Falls back to timestamp for backward compatibility

### Presentation Mode

**Special Feature:**
Galaxies can be published in "presentation only" mode:

**Characteristics:**
- No prerequisite enforcement
- Students can't actually progress through it
- Used for demonstrations/showcases
- Can be published without missions in all systems
- Different validation rules on publish

**Use Cases:**
- Conference presentations
- Showcasing galaxy structure
- Planning/drafting without full content

**Implementation:**
```javascript
if (presentationOnly) {
  // Skip mission requirement validation
  // Set presentationOnly flag
  // Allow public access even without full mission set
}
```

### Real-Time Collaboration Features

#### Help Request System
**Real-Time Flow:**
```
Student submits request
  ↓
Firestore: courses/{courseId}/requestsForHelp
  ↓
onSnapshot listener (in NavBar.vue + RequestForHelpTeacherFrame.vue)
  ↓
Update rootStore.teachersRequestsForHelp
  ↓
Badge count updates on nav
  ↓
Teacher clicks → RequestForHelpResponseDialog
  ↓
Teacher submits response
  ↓
Update request doc with response
  ↓
onSnapshot updates UI
  ↓
Email sent to student
```

**Notification Badges:**
- NavBar shows count of unanswered requests
- Different badges for requests (pink) vs submissions (yellow)
- Real-time updates via Firestore listeners
- Positioned absolutely on tab labels

#### Submission Review System
Similar real-time pattern:
- `getAllSubmittedWorkByCourseId()` sets up listener
- Handles `added`, `modified`, `removed` changes
- Updates store array in place
- UI reacts to array changes
- Expansion panels auto-update

### Data Consistency Patterns

#### Dual Storage (Course Template + Student Copies)

**Master Data:**
```
courses/{courseId}/topics/{topicId}/tasks/{taskId}
```

**Student Copies:**
```
people/{personId}/{courseId}/{topicId}/tasks/{taskId}
```

**Synchronization:**
- On task create: propagate to all assigned students
- On task update: merge update into all student copies
- On task delete: remove from all student copies
- Student-specific fields (status, timestamps) preserved

**Trade-offs:**
- ✅ Allows per-student progress tracking
- ✅ Historical data preserved if task deleted
- ✅ Fast queries (no joins needed)
- ❌ Higher write costs (fan-out writes)
- ❌ Potential inconsistency if propagation fails

### Canvas Animation Performance

#### requestAnimationFrame Pattern
```javascript
updateFrameVar() {
  this.intervalid1 = setInterval(() => {
    this.updateFrameTimer();
  }, 33);  // ~30 FPS
}

updateFrameTimer() {
  if (this.$refs.network) {
    this.$refs.network.redraw();  // Triggers beforeDrawing/afterDrawing
  }
}
```

**Optimization:**
- Stop animations when component destroyed
- Skip hidden planets in render loop
- Use delta time for frame-independent animation
- Canvas clipping for off-screen elements

#### Planet Orbital Mechanics
```typescript
// Each frame
radian += velocity * delta;
x = startingPos.x + Math.cos(radian) * orbitRadius;
y = startingPos.y + Math.sin(radian) * orbitRadius;

// Smooth stop animation
stopOrbit() {
  targetRadian = Math.PI / 2;  // South position
  animating = true;
  // Ease to target over 0.5s
}
```

### CSV Import Feature

**Bulk Student Creation:**
1. Upload CSV with columns: NSN, First Name, Last Name, Email
2. Parse CSV client-side
3. Display table preview
4. On confirm:
   - Check each email via `fetchPersonByEmail()`
   - If exists: add to cohort + assign courses
   - If not exists: `createPerson()` → add to cohort → assign courses
5. Send invitation emails

**Template Download:**
- Generates CSV template with correct headers
- Provides example data
- Uses Blob + download link trick

### Router Guards & Navigation

**Complex Guard Logic:**
```javascript
router.beforeEach(async (to, from, next) => {
  // Wait for auth to initialize
  await initialAuth;
  
  // Track where user came from (for back navigation)
  if (from.path !== "/") rootStore.set_from(from.path);
  
  // Enforce email verification (except on verify/login/reset/register pages)
  if (!["/verify", "/login", "/reset", "/register"].includes(to.path) &&
      rootStore.user.loggedIn &&
      rootStore.user.data?.verified !== true) {
    alert("You must verify your email to see this page");
    next({ path: "/verify" });
  }
  
  // Enforce authRequired meta flag
  if (to.matched.some((record) => record.meta.authRequired)) {
    if (rootStore.user.loggedIn && rootStore.user.data?.verified === true) {
      next();
    } else {
      alert("You must be logged in to see this page");
      next({ path: "/login" });
    }
  } else {
    next();
  }
});
```

**Initial Auth Promise:**
- Prevents routing before auth state known
- Resolves on first auth state change
- Used in guard to ensure user data available

### Code Quality & Standards

#### ESLint Configuration

**Frontend (.eslintrc.cjs):**
- Vue essential plugin
- TypeScript recommended
- Prettier integration
- Multi-word component names disabled

**Functions (functions/.eslintrc.cjs):**
- Google style guide
- TypeScript strict
- Max line length: 100
- Double quotes enforced
- 2-space indentation

#### Prettier Configuration
```json
{
  "semi": true,
  "tabWidth": 2,
  "singleQuote": false,
  "printWidth": 100,
  "trailingComma": "all"
}
```

#### TypeScript Configuration
- **Frontend:** Vue 2.7 target, DOM types
- **Functions:** Node 16 module, strict mode
- **Shared:** Composite project references

### License & Attribution

**License:** GNU General Public License v3.0
- Open source, copyleft license
- Free to use, modify, distribute
- Modifications must be open source
- See LICENSE file for full terms

**Attributions:**
- Solar system CSS animation inspired by Mustafa Enes (CodePen)
- Built on top of various open source libraries

---

## Debugging & Troubleshooting Guide

### Common Issues

#### 1. "Course not found" Errors
**Cause:** Empty or undefined courseId prop
**Solution:**
- Check route params are properly passed
- Verify `effectiveCourseId` computed property
- Add guards against empty courseId in watchers

#### 2. Real-Time Listeners Not Updating
**Cause:** Listener not properly unsubscribed
**Solution:**
- Store unsubscribe function returned by onSnapshot
- Call unsubscribe in component destroy hook
- Check component lifecycle carefully

#### 3. Permission Denied Errors
**Cause:** Firestore rules blocking access
**Debug:**
- Check user auth state
- Verify custom claims (admin)
- Check document owner/assignment
- Review firestore.rules helper functions
- Test with Firebase Emulator + rules debugger

#### 4. Planets Not Animating
**Cause:** requestAnimationFrame not running
**Solutions:**
- Check network ref exists before drawing
- Verify planets array populated
- Ensure animation interval started
- Check component not destroyed

#### 5. State Not Persisting
**Cause:** Pinia persistence plugin issues
**Solutions:**
- Check localStorage not disabled
- Verify store has `persist: true`
- Check SerializableMap restoration in afterRestore hook
- Clear localStorage and test fresh

### Debugging Tools

**Vue Devtools:**
- Pinia stores inspector
- Component hierarchy
- Events timeline
- Performance profiling

**Firebase Emulators:**
- Firestore data viewer (localhost:4000)
- Auth users (localhost:4000)
- Functions logs
- Rules simulator

**Browser DevTools:**
- Network tab for function calls
- Console for xAPI statements
- Application tab for localStorage
- Performance tab for canvas rendering

### Development Tips

**Hot Module Replacement (HMR):**
- Vite provides fast HMR
- Store state persists across reloads
- Component state resets (by design)

**Debugging Firebase Functions:**
- Use `console.log` → shows in emulator logs
- `firebase functions:log` for production logs
- Test locally with emulators before deploy

**Debugging xAPI:**
- Check Veracity LRS dashboard
- Statements visible immediately
- Use aggregation queries to debug data shape
- Test with Postman/curl first

---

## Future Enhancement Opportunities

### Technical Debt Identified

1. **Vue 2 → Vue 3 Migration**
   - Using Vue 2.7 (transition version)
   - Vuetify 3 available
   - Composition API would simplify complex components

2. **Permission System Completion**
   - Many "TODO: permissions checks" in functions
   - Collaborator system partially implemented
   - Organization admin roles not fully built

3. **Moment.js → Luxon Migration**
   - Moment.js in maintenance mode
   - Luxon already used in most places
   - Some components still use Moment

4. **Type Safety Improvements**
   - Many `Record<string, any>` types
   - Could define proper interfaces for all entities
   - Better TypeScript coverage in components

5. **Testing Coverage**
   - Unit tests infrastructure present but minimal tests
   - E2E tests not implemented
   - Firestore rules tests comprehensive

### Feature Enhancement Ideas

**Based on Code Analysis:**

1. **Collaborative Editing**
   - Real-time presence already implemented
   - Could add collaborative galaxy editing
   - Cursor positions visible to other teachers

2. **Advanced Analytics**
   - xAPI foundation is solid
   - Could add ML-based insights
   - Predictive completion time estimates

3. **Mobile Optimization**
   - Touch events partially implemented
   - Could optimize for mobile/tablet
   - Progressive web app (PWA) potential

4. **Accessibility**
   - Add ARIA labels
   - Keyboard navigation for galaxy map
   - Screen reader support

5. **Internationalization**
   - xAPI uses "en-nz" locale
   - Could support multiple languages
   - Vuetify i18n support available

### Performance Optimization Opportunities

1. **Virtual Scrolling**
   - Long student lists could use virtual scrolling
   - Activity timelines could be paginated

2. **Image Optimization**
   - Could resize/compress uploads
   - Lazy load images
   - WebP format support

3. **Bundle Size**
   - Code splitting by route (already done)
   - Could lazy load chart libraries
   - Tree-shake unused Vuetify components

4. **Caching Strategy**
   - Service worker for offline support
   - Cache galaxy map data in IndexedDB
   - Optimistic updates for better UX

---

## Key Takeaways for New Developers

### 1. Space-Themed Mental Model
Everything uses space metaphors:
- **Course** = Galaxy
- **Topic** = Solar System (node on map)
- **Task** = Mission (item in a list)
- **Student** = Navigator
- **Teacher** = Captain
- **Cohort** = Squad

### 2. Dual Data Pattern
Most entities have template + instance pattern:
- **Template** in courses collection
- **Instance** per student in people collection
- Changes propagate from template to instances

### 3. Status-Driven UI
Component rendering heavily depends on status:
- Course status: drafting/submitted/published
- Topic status: locked/unlocked/active/completed
- Task status: locked/unlocked/active/inreview/declined/completed
- Submission status: inreview/completed/declined

### 4. Real-Time Everything
Heavy use of Firestore listeners:
- Course data updates live
- Help requests appear instantly
- Submissions show immediately
- Presence updates in real-time

### 5. Three-Layer Architecture
```
UI Components (Vue)
  ↕ (props/events)
Pinia Stores (state + actions)
  ↕ (functions.httpsCallable)
Cloud Functions (business logic)
  ↕ (admin SDK)
Firestore (database)
```

### 6. Gamification Deeply Integrated
Not an afterthought:
- XP points tracked throughout
- Celebrations on major events
- Progress visualizations everywhere
- xAPI statements for everything

### 7. Teacher Tools First-Class
Equal weight to teacher and student experiences:
- Powerful visual editor
- Rich analytics
- Submission review workflow
- Real-time monitoring

### 8. Security Layered
Never trust client:
- Client guards (UX)
- Firestore rules (enforcement)
- Function validation (business logic)
- All three layers must agree

### 9. Email Integration Deep
Not just notifications:
- Reply-to headers enable direct communication
- HTML templates with consistent styling
- Context-rich content (galaxy/system/mission breadcrumb)
- Every major action has email

### 10. Analytics Foundation Solid
xAPI/LRS integration is comprehensive:
- Every action tracked
- Rich context in statements
- Aggregation queries for complex analytics
- Time tracking accurate to the minute

---

## Recommended Reading Order for Deep Dive

For new developers wanting to deeply understand the system:

### Week 1: Foundation
1. README.md
2. This architecture.md document
3. src/main.ts → router → store/index.ts
4. rules/firestore.rules
5. functions/src/index.ts

### Week 2: Core Features
6. src/views/GalaxyView.vue
7. src/components/GalaxyView/GalaxyMap.vue
8. src/views/SolarSystemView.vue
9. functions/src/courseManagement.ts
10. src/lib/ff.ts

### Week 3: User Management
11. src/components/Landing/Login.vue
12. functions/src/userManagement.ts
13. src/presence/index.ts
14. functions/src/emails.ts

### Week 4: Analytics & Advanced
15. src/lib/veracityLRS.js
16. functions/src/veracityLRS.ts
17. functions/src/activity.ts
18. src/components/Reused/Chart.vue

### Week 5: UI Components
19. src/components/Dialogs/ (all files)
20. src/components/Reused/ (all files)
21. src/components/CohortView/
22. src/plugins/vuetify.ts

---

## Quick Reference

### Environment Setup
```bash
# Frontend dev
npm run dev                  # localhost:8080

# With emulators
npm run dev:emulator         # Uses emulators

# Functions dev
cd functions
npm run build:watch          # Watch mode

# Emulators
firebase emulators:start     # All emulators
```

### Key URLs (Development)
- Frontend: http://localhost:8080
- Firestore Emulator: http://localhost:4000
- Auth Emulator: http://localhost:4000/auth
- Functions: http://localhost:5001

### Key Commands
```bash
# Deploy
firebase deploy --only hosting          # Frontend only
firebase deploy --only functions        # Functions only
firebase deploy                         # Everything

# Testing
npm run test:unit                       # Vitest
npm run test:rules                      # Firestore rules

# Code Quality
npm run lint                            # ESLint
npm run format                          # Prettier
npm run type-check                      # TypeScript
```

### Key Stores
```javascript
useRootStore()              // Main app state
useGalaxyListViewStore()    // Galaxy list
useSolarSystemViewStore()   // Solar system
useCohortViewStore()        // Cohort view
```

### Key Colors
```css
--v-baseAccent-base         /* Green/Gray - primary */
--v-galaxyAccent-base       /* Pink/Red - galaxy */
--v-missionAccent-base      /* Blue - mission */
--v-cohortAccent-base       /* Yellow/Red - submission */
--v-background-base         /* Dark/Light background */
```

### Key Functions (lib/ff.ts)
```javascript
// Courses
fetchCourses(slug?)
fetchCourseByCourseId(courseId)
assignCourseToMe(courseId)

// Cohorts
fetchCohorts()
fetchCohortByCohortId(cohortId)
addMeToCohort(cohortId)

// Tasks
fetchTasksByCourseIdTopicId(courseId, topicId)
createTaskWithCourseIdTopicId(courseId, topicId, task)

// People
fetchPersonByPersonId(personId)
createPerson(profile)
updatePerson(personId, person)
```

---

**Analysis Complete:** This architecture document provides a comprehensive foundation for understanding the Galaxy Maps v2 codebase. New developers should be able to navigate the code, understand key patterns, and make modifications with confidence.

---