# Galaxy Maps 🌌

An AI-powered learning and knowledge platform that visualizes journeys of knowledge as constellations of Stars, Planets, and Missions. Built with Firebase, Vue.js, and OpenAI.

---

## Features

- 🪐 **Visual Learning Journeys** — Explore personalized “Galaxies” of knowledge mapped as Stars (learning milestone), and Planets (Missions with actionable tasks).
- 🤖 **AI-Generated Maps** — Galaxy Maps can be created manually or dynamically generated using OpenAI’s GPT models.
- 📈 **Progress Tracking** — Each mission start/completion triggers an xApi call that stores an xApi record in the LRS (Learning Record Store). This data allows Captains (map creators) to be able to track Navigators (users) progression through maps.
- 🔐 **Firebase Auth & Firestore** — Secure user accounts, real-time database syncing, and scalable data storage.
- ⚡ **Modern Frontend** — Built with Vue 2 & Vuetify 2 + Vite for speed and a seamless user experience.

---

## Prerequisites

- Node.js 18+
- Firebase project (Firestore, Auth, Storage enabled)
- OpenAI API key

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tairea/galaxy-maps.git
cd galaxy-maps
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

#### Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - **Authentication** (enable Email/Password provider)
   - **Firestore Database**
   - **Realtime Database**
   - **Cloud Storage**
   - **Cloud Functions**
4. Go to **Project Settings** → **General**
5. Scroll to **Your apps** section
6. Click on the web app icon (or add a new web app if none exists)
7. Copy the Firebase configuration object

#### Update Your .env File

Add all your Firebase configuration values to `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF123

# Third-Party API Keys
VITE_VERACITY_LRS_SECRET=your-lrs-username:your-lrs-password
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

See `.env.example` for detailed comments and instructions.

---

## Quick Start

```bash
npm run dev
```

This starts the local development server at **http://localhost:5173**.  
You can now create an account, explore sample galaxies, or generate your own.

---

## User Flow

1. **Visit galaxymaps.io** — Browse the platform as a guest.
2. **Sign Up / Sign In** — Create an account using Firebase Auth (email + password + profile picture).
3. **Email Verification** — Receive a verification email and confirm your account.
4. **Create or Join a Galaxy** — Start exploring a learning journey created by a “Captain” or create your own.
5. **Complete Missions** — Each mission completed unlocks new Planets and Stars.

---

## Development

### Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview built site
npm run lint         # Check for linting issues
```

### Firebase Tools

```bash
firebase deploy      # Deploy app and functions
firebase emulators:start  # Run local emulators for testing
```

---

## Project Structure

```
galaxy-maps-v2/
├── src/
│   ├── components/
│   │   ├── AllStudentsView/      # Admin student management components
│   │   ├── CohortList/           # Cohort listing and panels
│   │   ├── CohortView/           # Cohort detail view with student data
│   │   ├── Dialogs/              # Modal dialogs (auth, CRUD operations, etc.)
│   │   ├── GalaxyList/           # Galaxy browsing and preview
│   │   ├── GalaxyView/           # Interactive galaxy map visualization
│   │   ├── Home/                 # Navigation and user bar
│   │   ├── Landing/              # Auth flow (login, register, verify)
│   │   ├── Reused/               # Shared components (charts, avatars, etc.)
│   │   ├── SolarSystemView/      # Mission details and progress
│   │   └── UserDashboard/        # Student progress tracking
│   ├── lib/
│   │   ├── ff.ts                 # Firebase callable functions wrapper
│   │   ├── planet.ts             # Planet/Mission logic
│   │   ├── star.ts               # Star/Milestone logic
│   │   ├── utils.ts              # Utility functions
│   │   └── veracityLRS.js        # xAPI/LRS integration
│   ├── piniafire/                # Firebase-Pinia integration layer
│   ├── presence/                 # Real-time user presence tracking
│   ├── router/                   # Vue Router configuration
│   ├── store/                    # Pinia stores (auth, galaxy, cohort, etc.)
│   ├── views/                    # Top-level page views
│   ├── App.vue                   # Root component
│   └── main.ts                   # App entry point
├── public/
│   └── assets/                   # Static assets (images, icons)
├── functions/
│   └── src/
│       ├── activity.ts           # Activity tracking logic
│       ├── courseManagement.ts   # Course/Galaxy CRUD operations
│       ├── emails.ts             # Email notifications
│       ├── organisationManagement.ts  # Organization logic
│       ├── userManagement.ts     # User/Person operations
│       ├── veracityLRS.ts        # xAPI LRS backend
│       └── index.ts              # Cloud Functions entry point
├── rules/
│   ├── firestore.rules           # Firestore security rules
│   ├── storage.rules             # Storage security rules
│   └── test-rules.js             # Rules unit tests
├── tests/                        # E2E tests (Playwright)
├── scripts/                      # Build and deployment scripts
└── firebase.json                 # Firebase project configuration
```

---

## API Overview

All backend operations use Firebase Cloud Functions (callable from `src/lib/ff.ts`):

### 📚 Cohort Management

| Function                                      | Description                             |
| --------------------------------------------- | --------------------------------------- |
| `getCohorts`                                  | Fetch all cohorts                       |
| `getCohortByCohortId`                         | Get cohort details by ID                |
| `getStudentCohortsByPersonId`                 | Get cohorts for a specific student      |
| `getCohortsByCourseId`                        | Get all cohorts in a course             |
| `getCohortCoursesActivityByCohortId`          | Fetch cohort activity data              |
| `getCohortStudentsActivityTimeByCohortId`     | Track student time in cohort            |
| `addMeToCohort`                               | Join a cohort (self-enrollment)         |
| `addStudentToCohort`                          | Assign student to cohort                |

### 🌌 Course/Galaxy Management

| Function                                      | Description                             |
| --------------------------------------------- | --------------------------------------- |
| `getCourses`                                  | Fetch all courses/galaxies              |
| `getCourseByCourseId`                         | Get course details by ID                |
| `getCourseMapEdgesAndNodesByCourseId`         | Fetch galaxy map nodes and edges        |
| `getPeopleByCourseId`                         | Get all students in a course            |
| `assignCourseToMe`                            | Self-assign a course                    |
| `assignCourseToStudent`                       | Assign course to student                |
| `removeMeFromCourse`                          | Unenroll from course                    |
| `removeStudentFromCourse`                     | Remove student from course              |

### ⭐ Topic (Star) & Task (Mission) Management

| Function                                      | Description                             |
| --------------------------------------------- | --------------------------------------- |
| `getTopicByCourseIdTopicId`                   | Get topic/star details                  |
| `getTasksByCourseIdTopicId`                   | Fetch all tasks for a topic             |
| `getTaskByCourseIdTopicIdTaskId`              | Get specific task details               |
| `createTaskWithCourseIdTopicId`               | Create new mission                      |
| `updateTaskByCourseIdTopicIdTaskId`           | Update mission                          |
| `deleteTaskByCourseIdTopicIdTaskId`           | Delete mission                          |
| `updateTaskOrderIndexesByCourseIdTopicId`     | Reorder missions                        |

### 🏢 Organization Management

| Function                                              | Description                     |
| ----------------------------------------------------- | ------------------------------- |
| `getOrganisations`                                    | Fetch all organizations         |
| `getOrganisationByOrganisationId`                     | Get organization details        |
| `getPeopleByOrganisationId`                           | Get members of organization     |
| `createOrganisation`                                  | Create new organization         |
| `updateOrganisationByOrganisationId`                  | Update organization             |
| `addPersonToOrganisationByOrganisationIdAndPersonId`  | Add member to organization      |
| `removePersonFromOrganisationByOrganisationIdAndPersonId` | Remove member from organization |
| `deleteOrganisationByOrganisationId`                  | Delete organization             |

### 👤 User/Person Management

| Function                  | Description                 |
| ------------------------- | --------------------------- |
| `getPersonByPersonId`     | Get user profile by ID      |
| `getPersonByEmail`        | Find user by email          |
| `createNewUser`           | Create new user account     |
| `updatePersonByPersonId`  | Update user profile         |

### 📊 Progress & Activity Tracking

| Function                                              | Description                             |
| ----------------------------------------------------- | --------------------------------------- |
| `getPersonTopicsByPersonIdCourseId`                   | Get student's topics progress           |
| `getPersonTopicByPersonIdCourseIdTopicId`             | Get specific topic progress             |
| `getPersonTasksByPersonIdCourseIdTopicId`             | Get student's task progress             |
| `getStudentActivityLogByPersonId`                     | Fetch activity timeline                 |
| `getStudentCoursesActivityByPersonId`                 | Overview of all course activities       |
| `getStudentCoursesTimeDataByPersonId`                 | Time tracking across courses            |
| `getStudentCoursesTimeDataByPersonIdStartAtEndAt`     | Time data with date range               |
| `getStudentSubmissionsByPersonId`                     | Get student submissions                 |
| `getStudentRequestsByPersonId`                        | Get help requests                       |

### 🆘 Request Management

| Function                              | Description            |
| ------------------------------------- | ---------------------- |
| `deleteRequestByCourseIdRequestId`    | Delete help request    |

---

## Security

- All user data stored in Firebase with custom rules.
- API access protected via Firebase Auth tokens.
- File uploads validated and restricted by user scope.

---

## Troubleshooting

**App won't start:**

- Check Node version: `node --version` (must be ≥18)
- Confirm `.env` file exists and API keys are correct
- Make sure you copied `.env.example` to `.env` and filled in all values

**Firebase Configuration Error:**

If you see an error about missing Firebase environment variables:
1. Verify `.env` file exists in the project root
2. Check that all `VITE_FIREBASE_*` variables are set
3. Make sure you replaced placeholder values (e.g., "your-api-key-here")
4. Restart the dev server after updating `.env`

**Firebase Connection Errors:**

- Run `firebase login` to authenticate with Firebase CLI
- Verify your Firebase project ID in `.env` matches your actual project
- Check that all required Firebase services are enabled in your project
- Ensure Firebase Security Rules allow your operations

**OpenAI API issues:**

- Ensure your API key is active and has available credits
- Check network connectivity and quotas
- Verify the key starts with `sk-` and is properly formatted

---

## License

MIT © 2025 Galaxy Maps
