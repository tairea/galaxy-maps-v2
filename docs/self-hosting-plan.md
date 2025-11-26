# Galaxy Maps v2 - Self-Hosting Plan

**Last Updated:** November 2, 2025

## Overview

This document outlines a comprehensive plan for running Galaxy Maps v2 entirely on a local developer machine without any cloud dependencies. While the application is designed for Firebase cloud hosting, this guide enables local development, testing, and contribution without incurring hosting costs or requiring internet connectivity (after initial setup).

**Goal:** Enable developers to run a fully functional Galaxy Maps instance on localhost for experimentation, contribution, and offline development.

---

## Table of Contents

1. [Current Cloud Dependencies](#current-cloud-dependencies)
2. [Local Alternatives Strategy](#local-alternatives-strategy)
3. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
4. [Service-by-Service Replacement Plan](#service-by-service-replacement-plan)
5. [Data Seeding Strategy](#data-seeding-strategy)
6. [Development Workflow](#development-workflow)
7. [Limitations & Trade-offs](#limitations--trade-offs)
8. [Future Improvements](#future-improvements)

---

## Current Cloud Dependencies

### Firebase Services (Google Cloud)
1. **Firebase Firestore** - NoSQL database (primary data store)
2. **Firebase Authentication** - User authentication and management
3. **Firebase Cloud Functions** - Serverless backend API (Node.js)
4. **Firebase Storage** - File storage (images, avatars, uploads)
5. **Firebase Realtime Database** - Presence system (online/offline tracking)
6. **Firebase Hosting** - Static site hosting (production only)

### Third-Party Services
7. **Veracity LRS** (https://galaxymaps.lrs.io) - xAPI Learning Record Store
   - Used for: Learning analytics, activity tracking, time tracking
   - Protocol: xAPI HTTP API
   
8. **Gmail SMTP** - Email notifications
   - Used for: User invitations, help requests, submission reviews, inactivity alerts
   - Protocol: SMTP via Nodemailer

### Build/Deploy Services
9. **Vite Dev Server** - Frontend development server (already local)
10. **Firebase CLI** - Deployment and emulator management (already local)

---

## Local Alternatives Strategy

### ✅ **Already Supported (Firebase Emulators)**
Firebase provides official emulators that run 100% locally:
- ✅ Firestore Emulator
- ✅ Authentication Emulator  
- ✅ Functions Emulator
- ✅ Storage Emulator
- ✅ Realtime Database Emulator
- ✅ Hosting Emulator

**Status:** Firebase emulators are already configured and working! The codebase has `npm run dev:emulator` script.

### 🔧 **Needs Replacement/Mocking**

#### 1. Veracity LRS (xAPI)
**Options:**
- **Option A:** Local xAPI LRS (Learning Locker open source)
- **Option B:** Mock xAPI server (simple Express.js endpoint)
- **Option C:** Disable analytics (development mode flag)

**Recommendation:** Option B (Mock server) - simplest for development

#### 2. Gmail SMTP
**Options:**
- **Option A:** Local SMTP server (MailHog, Mailpit)
- **Option B:** Mock email service (log to console)
- **Option C:** Use local SMTP relay

**Recommendation:** Option A (MailHog) - captures emails in web UI

---

## Step-by-Step Setup Guide

### Prerequisites

```bash
# Required software
- Node.js 18+ (for frontend) and Node.js 20 (for functions)
- npm or yarn
- Git
- Java JRE 11+ (for Firebase emulators)

# Optional but recommended
- Docker (for MailHog)
- curl or Postman (for testing)
```

### 1. Initial Repository Setup

```bash
# Clone repository
git clone <repo-url>
cd galaxy-maps-v2

# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Firebase Emulator Setup

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase (one-time, for emulator data persistence)
firebase login

# Initialize emulators (if not already done)
# The project already has firebase.json configured
firebase init emulators

# Verify emulator configuration
cat firebase.json
```

**Expected firebase.json emulator config:**
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### 3. Mock xAPI/LRS Server Setup

Create a simple mock server for xAPI statements:

**File:** `dev-tools/mock-lrs-server.js`
```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8081;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// In-memory storage for statements
let statements = [];

// Store statements to file for persistence
const STATEMENTS_FILE = path.join(__dirname, 'xapi-statements.json');

// Load existing statements
if (fs.existsSync(STATEMENTS_FILE)) {
  statements = JSON.parse(fs.readFileSync(STATEMENTS_FILE, 'utf8'));
}

function saveStatements() {
  fs.writeFileSync(STATEMENTS_FILE, JSON.stringify(statements, null, 2));
}

// POST /xapi/statements - Accept xAPI statements
app.post('/xapi/statements', (req, res) => {
  const statement = {
    ...req.body,
    id: `stmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: req.body.timestamp || new Date().toISOString(),
    stored: new Date().toISOString()
  };
  
  statements.push(statement);
  saveStatements();
  
  console.log(`✅ Statement received: ${statement.verb?.display?.['en-nz']} - ${statement.object?.definition?.description?.['en-nz']}`);
  
  res.status(200).json([statement.id]);
});

// POST /xapi/statements/aggregate - Mock aggregation queries
app.post('/xapi/statements/aggregate', (req, res) => {
  console.log('📊 Aggregation query received:', JSON.stringify(req.body, null, 2));
  
  // Return empty results for now (sufficient for development)
  // In production, this would process the aggregation pipeline
  res.status(200).json([]);
});

// GET /xapi/statements - Retrieve statements
app.get('/xapi/statements', (req, res) => {
  res.status(200).json({ statements });
});

// DELETE /xapi/statements - Clear all statements (development helper)
app.delete('/xapi/statements', (req, res) => {
  statements = [];
  saveStatements();
  res.status(200).json({ message: 'All statements cleared' });
});

// Web UI to view statements
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock LRS - xAPI Statements</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
        h1 { color: #00E676; }
        .statement { background: #2a2a2a; border-left: 3px solid #69A1E2; padding: 10px; margin: 10px 0; }
        .verb { color: #E269CF; font-weight: bold; }
        .actor { color: #00E676; }
        pre { background: #1a1a1a; padding: 10px; overflow-x: auto; }
        button { background: #69A1E2; color: #fff; border: none; padding: 10px 20px; cursor: pointer; }
        button:hover { background: #5891D2; }
      </style>
    </head>
    <body>
      <h1>🚀 Mock xAPI LRS Server</h1>
      <p>Total statements: <strong id="count">${statements.length}</strong></p>
      <button onclick="location.reload()">Refresh</button>
      <button onclick="clearStatements()">Clear All</button>
      <div id="statements"></div>
      <script>
        const statements = ${JSON.stringify(statements, null, 2)};
        const container = document.getElementById('statements');
        
        statements.reverse().forEach(stmt => {
          const div = document.createElement('div');
          div.className = 'statement';
          div.innerHTML = \`
            <div>
              <span class="actor">\${stmt.actor?.name || 'Unknown'}</span>
              <span class="verb">\${stmt.verb?.display?.['en-nz'] || 'performed'}</span>
              <span>\${stmt.object?.definition?.description?.['en-nz'] || ''}</span>
            </div>
            <small>\${new Date(stmt.timestamp).toLocaleString()}</small>
            <details>
              <summary>Full Statement</summary>
              <pre>\${JSON.stringify(stmt, null, 2)}</pre>
            </details>
          \`;
          container.appendChild(div);
        });
        
        function clearStatements() {
          if (confirm('Clear all xAPI statements?')) {
            fetch('/xapi/statements', { method: 'DELETE' })
              .then(() => location.reload());
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          🚀 Mock xAPI LRS Server Running              ║
╠════════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                          ║
║  Endpoint: http://localhost:${PORT}/xapi/statements     ║
║  Web UI: http://localhost:${PORT}                       ║
╚════════════════════════════════════════════════════════╝
  `);
});
```

**Setup:**
```bash
# Create dev-tools directory
mkdir -p dev-tools
cd dev-tools

# Create package.json
npm init -y

# Install dependencies
npm install express cors

# Save the mock server code above to mock-lrs-server.js
```

### 4. Mock Email Server Setup (MailHog)

**Using Docker (Recommended):**
```bash
# Start MailHog container
docker run -d \
  --name mailhog \
  -p 1025:1025 \
  -p 8025:8025 \
  mailhog/mailhog

# MailHog SMTP: localhost:1025
# MailHog Web UI: http://localhost:8025
```

**Without Docker (Download binary):**
```bash
# macOS
brew install mailhog
mailhog

# Linux
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
./MailHog_linux_amd64

# Windows
# Download from https://github.com/mailhog/MailHog/releases
```

### 5. Environment Configuration

Create `.env` file in project root:

```bash
# Frontend (.env)
VITE_USE_EMULATOR=true
VITE_VERACITY_LRS_SECRET=bW9ja2xyczp0ZXN0  # Base64 of "mocklrs:test"
```

Create `functions/.env` file:

```bash
# Functions environment
VERACITY_LRS_SECRET=mocklrs:test
```

Update Firebase Functions config for local SMTP:

```bash
cd functions

# Set local email config for emulator
firebase functions:config:set gmail.email="noreply@localhost" gmail.password="test123"

# Export for local development
firebase functions:config:get > .runtimeconfig.json
```

### 6. Source Code Modifications for Local Mode

**Option A: Environment-Based Switching (Recommended)**

Modify `src/store/firestoreConfig.ts` to auto-detect local mode:

```typescript
// After existing emulator connection code, add:

// Auto-connect to local LRS if in emulator mode
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  console.log('🔧 Using local mock LRS at http://localhost:8081');
  // The LRS URL is already configured in veracityLRS.js
  // Just ensure VITE_VERACITY_LRS_SECRET is set
}
```

Modify `functions/src/emails.ts` for local SMTP:

```typescript
// Add at top of file
import { config } from "firebase-functions/v1";

const gmailEmail = config().gmail?.email || "noreply@localhost";
const gmailPassword = config().gmail?.password || "test123";

const mailTransport = createTransport({
  // Use local SMTP when in emulator
  host: process.env.FUNCTIONS_EMULATOR === "true" ? "localhost" : "smtp.gmail.com",
  port: process.env.FUNCTIONS_EMULATOR === "true" ? 1025 : 465,
  secure: process.env.FUNCTIONS_EMULATOR !== "true",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
  // Disable TLS for local development
  tls: {
    rejectUnauthorized: process.env.FUNCTIONS_EMULATOR !== "true"
  }
});
```

Modify `src/lib/veracityLRS.js` for local LRS:

```javascript
// Replace the hardcoded URL with environment variable
const LRS_URL = import.meta.env.VITE_LRS_URL || "http://localhost:8081/xapi/statements";

// Update all fetch calls to use LRS_URL
return fetch(LRS_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: auth,
  },
  body: JSON.stringify(statement),
});
```

**Option B: Development Mode Flag (Alternative)**

Add a development mode that skips external services entirely:

```typescript
// In src/store/firestoreConfig.ts
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Conditional xAPI sending
if (!DEV_MODE) {
  await sendXAPIStatement(...);
} else {
  console.log('[DEV] xAPI statement skipped:', statement);
}
```

---

## Service-by-Service Replacement Plan

### 1. Firebase Firestore → Firestore Emulator ✅

**Status:** Already supported out of the box!

**Configuration:** `firebase.json`
```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    }
  }
}
```

**Usage:**
```bash
# Start emulator
firebase emulators:start --only firestore

# Or start all emulators
firebase emulators:start
```

**Features:**
- Full Firestore API compatibility
- Security rules testing
- Data persistence (optional)
- Web UI for data inspection (port 4000)

**Data Persistence:**
```bash
# Enable data persistence between runs
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

---

### 2. Firebase Authentication → Auth Emulator ✅

**Status:** Already supported!

**Configuration:** `firebase.json`
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    }
  }
}
```

**Features:**
- All auth methods supported
- Custom claims (admin role)
- Email verification simulation
- Password reset simulation
- No real emails sent

**Auto-Login (Development Helper):**

Create `dev-tools/create-dev-users.js`:
```javascript
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const adminApp = admin.initializeApp({
  projectId: 'galaxy-maps-ac367'
});

// Set emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

async function createDevUsers() {
  const auth = adminApp.auth();
  
  const users = [
    { email: 'admin@test.com', password: 'admin123', displayName: 'Dev Admin', uid: 'dev-admin-1', admin: true },
    { email: 'teacher@test.com', password: 'teacher123', displayName: 'Dev Teacher', uid: 'dev-teacher-1' },
    { email: 'student@test.com', password: 'student123', displayName: 'Dev Student', uid: 'dev-student-1' },
  ];
  
  for (const user of users) {
    try {
      const userRecord = await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true
      });
      
      if (user.admin) {
        await auth.setCustomUserClaims(user.uid, { admin: true });
      }
      
      console.log(`✅ Created: ${user.email} (${user.uid})`);
    } catch (error) {
      console.log(`⚠️  User exists: ${user.email}`);
    }
  }
  
  console.log('\n🎉 Dev users ready! Login credentials:');
  users.forEach(u => console.log(`   ${u.email} / ${u.password}`));
  
  process.exit(0);
}

createDevUsers();
```

**Run:**
```bash
cd dev-tools
npm install firebase-admin firebase
node create-dev-users.js
```

---

### 3. Firebase Cloud Functions → Functions Emulator ✅

**Status:** Already supported!

**Configuration:** Automatic when emulators running

**Start Functions Emulator:**
```bash
# Terminal 1: Build functions in watch mode
cd functions
npm run build:watch

# Terminal 2: Start emulator
firebase emulators:start --only functions
```

**Environment Variables:**
The emulator reads from `functions/.runtimeconfig.json`:
```json
{
  "gmail": {
    "email": "noreply@localhost",
    "password": "test123"
  }
}
```

**Secrets (for VERACITY_LRS_SECRET):**
For emulator, create `functions/.secret.local`:
```
VERACITY_LRS_SECRET=mocklrs:test
```

---

### 4. Firebase Storage → Storage Emulator ✅

**Status:** Supported but needs configuration

**Enable in firebase.json:**
```json
{
  "emulators": {
    "storage": {
      "port": 9199
    }
  }
}
```

**Update firestoreConfig.ts:**
```typescript
// Add storage emulator connection
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  storage.useEmulator('localhost', 9199);
}
```

**Features:**
- Local file storage
- Rules testing
- No cloud costs
- Fast uploads

**Persistence:**
Storage emulator saves to `~/.cache/firebase/emulators/storage_export/`

---

### 5. Firebase Realtime Database → RTDB Emulator

**Status:** Not currently in firebase.json but supported

**Add to firebase.json:**
```json
{
  "emulators": {
    "database": {
      "port": 9000
    }
  }
}
```

**Update firestoreConfig.ts:**
```typescript
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  database.useEmulator('localhost', 9000);
}
```

---

### 6. Veracity LRS → Mock LRS Server 🔧

**Implementation:** Use the mock server from Step 3

**Frontend Configuration:**

Create `.env.local`:
```bash
VITE_USE_EMULATOR=true
VITE_LRS_URL=http://localhost:8081/xapi/statements
VITE_VERACITY_LRS_SECRET=bW9ja2xyczp0ZXN0
```

**Functions Configuration:**

Modify `functions/src/veracityLRS.ts`:
```typescript
// Add at top
const LRS_URL = process.env.LRS_URL || "https://galaxymaps.lrs.io/xapi/statements";

// Replace all fetch URLs
fetch(LRS_URL, { ... })
```

Set in functions/.env:
```bash
LRS_URL=http://localhost:8081/xapi/statements
```

**Alternative: Skip xAPI in Dev Mode**

Add to `.env.local`:
```bash
VITE_SKIP_XAPI=true
```

Wrap all xAPI calls:
```javascript
export const sendXAPIStatement = async (statement) => {
  if (import.meta.env.VITE_SKIP_XAPI === 'true') {
    console.log('[DEV] xAPI skipped:', statement);
    return Promise.resolve();
  }
  return fetch(LRS_URL, { ... });
};
```

---

### 7. Gmail SMTP → MailHog 🔧

**Setup:** Use MailHog from Step 4

**Functions Configuration:**

The modified `emails.ts` from Step 6 already handles this:
```typescript
const mailTransport = createTransport({
  host: process.env.FUNCTIONS_EMULATOR === "true" ? "localhost" : "smtp.gmail.com",
  port: process.env.FUNCTIONS_EMULATOR === "true" ? 1025 : 465,
  secure: process.env.FUNCTIONS_EMULATOR !== "true",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  }
});
```

**Environment Detection:**
Functions emulator automatically sets `process.env.FUNCTIONS_EMULATOR = "true"`

**View Emails:**
Open http://localhost:8025 in browser to see all sent emails

---

## Data Seeding Strategy

### Option 1: Firestore Emulator Import

**Export from Production (if you have access):**
```bash
# Export production data
firebase emulators:export ./production-export

# Import to local emulator
firebase emulators:start --import=./production-export
```

### Option 2: Custom Seed Script

Create `dev-tools/seed-database.js`:
```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Admin SDK for emulator
admin.initializeApp({
  projectId: 'galaxy-maps-ac367'
});

const db = admin.firestore();
db.settings({
  host: 'localhost:8080',
  ssl: false
});

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // Create sample admin
  await db.collection('people').doc('dev-admin-1').set({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    displayName: 'Dev Admin',
    accountType: 'teacher',
    assignedCourses: [],
    completedCourses: [],
    xpPointsTotal: 0,
    verified: true
  });
  console.log('✅ Created admin user');
  
  // Create sample teacher
  await db.collection('people').doc('dev-teacher-1').set({
    firstName: 'Captain',
    lastName: 'Smith',
    email: 'teacher@test.com',
    displayName: 'Captain Smith',
    accountType: 'teacher',
    assignedCourses: [],
    completedCourses: [],
    xpPointsTotal: 0,
    verified: true
  });
  console.log('✅ Created teacher user');
  
  // Create sample student
  await db.collection('people').doc('dev-student-1').set({
    firstName: 'Navigator',
    lastName: 'Jones',
    email: 'student@test.com',
    displayName: 'Navigator Jones',
    accountType: 'student',
    assignedCourses: [],
    completedCourses: [],
    xpPointsTotal: 0,
    verified: true
  });
  console.log('✅ Created student user');
  
  // Create sample organization
  const orgRef = await db.collection('organisations').add({
    name: 'Test School',
    description: 'A test organization for local development',
    cohorts: [],
    people: []
  });
  console.log('✅ Created organization:', orgRef.id);
  
  // Create sample cohort
  const cohortRef = await db.collection('cohorts').add({
    name: 'Dev Squad',
    description: 'Development test cohort',
    students: ['dev-student-1'],
    teachers: ['dev-teacher-1'],
    courses: [],
    organisation: orgRef.id
  });
  console.log('✅ Created cohort:', cohortRef.id);
  
  // Create sample galaxy (course)
  const courseRef = await db.collection('courses').add({
    title: 'Introduction to Local Development',
    description: 'A sample galaxy for testing local setup',
    status: 'published',
    visibility: 'public',
    public: true,
    owner: db.doc(`people/dev-teacher-1`),
    mappedBy: {
      personId: 'dev-teacher-1',
      name: 'Captain Smith'
    },
    taskTotal: 3,
    topicTotal: 2,
    image: { url: '', name: '' }
  });
  console.log('✅ Created course:', courseRef.id);
  
  // Create sample topics (map nodes)
  const topic1Ref = await db.collection('courses').doc(courseRef.id)
    .collection('map-nodes').add({
      label: 'Getting Started',
      group: 'introduction',
      x: 0,
      y: 0,
      prerequisites: [],
      topicCreatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      taskTotal: 2
    });
  
  const topic2Ref = await db.collection('courses').doc(courseRef.id)
    .collection('map-nodes').add({
      label: 'Advanced Concepts',
      group: 'content',
      x: 200,
      y: 100,
      prerequisites: [topic1Ref.id],
      topicCreatedTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      taskTotal: 1
    });
  console.log('✅ Created 2 topics');
  
  // Create edge
  await db.collection('courses').doc(courseRef.id)
    .collection('map-edges').add({
      from: topic1Ref.id,
      to: topic2Ref.id,
      arrows: 'to'
    });
  console.log('✅ Created prerequisite edge');
  
  // Create sample missions
  await db.collection('courses').doc(courseRef.id)
    .collection('topics').doc(topic1Ref.id)
    .collection('tasks').add({
      title: 'Welcome Mission',
      description: '<p>Welcome to Galaxy Maps! This is your first mission.</p>',
      orderIndex: 0,
      submissionRequired: false,
      taskCreatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  
  await db.collection('courses').doc(courseRef.id)
    .collection('topics').doc(topic1Ref.id)
    .collection('tasks').add({
      title: 'Setup Your Environment',
      description: '<p>Follow the self-hosting guide to set up your local environment.</p>',
      orderIndex: 1,
      submissionRequired: true,
      submissionInstructions: '<p>Provide a screenshot of your running emulators.</p>',
      taskCreatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  
  console.log('✅ Created 2 missions in topic 1');
  
  // Create slug
  await db.collection('slugs').doc('dev').set({
    owner: db.doc(`people/dev-teacher-1`)
  });
  console.log('✅ Created slug: /dev');
  
  console.log('\n🎉 Database seeded successfully!');
  console.log('📍 Access the app at: http://localhost:8080');
  console.log('📍 View data at: http://localhost:4000');
  console.log('🔑 Login as:');
  console.log('   Admin:   admin@test.com / admin123');
  console.log('   Teacher: teacher@test.com / teacher123');
  console.log('   Student: student@test.com / student123');
  
  process.exit(0);
}

seedDatabase().catch(console.error);
```

**Run seeding:**
```bash
# Start emulators first
firebase emulators:start

# In another terminal:
cd dev-tools
npm install firebase-admin
node seed-database.js
```

### Option 3: Rules Test Data

The project already has test data in `rules/test-data.json` that can be imported:

```bash
# Use the existing test data import from rules testing
firebase emulators:exec --only firestore,auth "node rules/test-rules.js"

# This imports all the test users, courses, cohorts, etc.
```

---

## Complete Local Stack Startup

### Master Startup Script

Create `dev-tools/start-local-stack.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Galaxy Maps Local Stack..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js required but not installed. Aborting." >&2; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI required. Run: npm install -g firebase-tools" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || echo "⚠️  Docker not found. MailHog won't start."

echo "✅ Prerequisites OK"
echo ""

# Start MailHog (if Docker available)
if command -v docker >/dev/null 2>&1; then
  echo "📧 Starting MailHog..."
  docker start mailhog 2>/dev/null || docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
  echo "✅ MailHog running at http://localhost:8025"
else
  echo "⚠️  Skipping MailHog (Docker not available)"
fi

# Start Mock LRS
echo ""
echo "📊 Starting Mock LRS Server..."
cd dev-tools
npm install >/dev/null 2>&1
node mock-lrs-server.js &
LRS_PID=$!
echo "✅ Mock LRS running at http://localhost:8081"

# Return to root
cd ..

# Start Firebase Emulators
echo ""
echo "🔥 Starting Firebase Emulators..."
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data &
FIREBASE_PID=$!

# Wait for emulators to start
echo "⏳ Waiting for emulators to initialize..."
sleep 10

# Check if we need to seed data
if [ ! -d "./emulator-data" ]; then
  echo ""
  echo "🌱 No existing data found. Seeding database..."
  cd dev-tools
  node create-dev-users.js
  node seed-database.js
  cd ..
fi

# Start frontend
echo ""
echo "🎨 Starting Frontend Dev Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║     🎉 Galaxy Maps Local Stack Running!              ║${NC}"
echo "${GREEN}╠════════════════════════════════════════════════════════╣${NC}"
echo "${GREEN}║  Frontend:      http://localhost:8080                 ║${NC}"
echo "${GREEN}║  Firebase UI:   http://localhost:4000                 ║${NC}"
echo "${GREEN}║  MailHog:       http://localhost:8025                 ║${NC}"
echo "${GREEN}║  Mock LRS:      http://localhost:8081                 ║${NC}"
echo "${GREEN}╠════════════════════════════════════════════════════════╣${NC}"
echo "${GREEN}║  Press Ctrl+C to stop all services                    ║${NC}"
echo "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

# Cleanup on exit
trap "kill $LRS_PID $FIREBASE_PID $FRONTEND_PID 2>/dev/null; docker stop mailhog 2>/dev/null; exit" INT TERM

# Wait
wait
```

**Make executable and run:**
```bash
chmod +x dev-tools/start-local-stack.sh
./dev-tools/start-local-stack.sh
```

---

## Development Workflow

### Daily Workflow

**Start Everything:**
```bash
# Option 1: Use master script
./dev-tools/start-local-stack.sh

# Option 2: Manual (3 terminals)
# Terminal 1: Emulators
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

# Terminal 2: Frontend
npm run dev

# Terminal 3: Mock Services
cd dev-tools && node mock-lrs-server.js
```

**Access Points:**
- **App:** http://localhost:8080
- **Firebase UI:** http://localhost:4000
  - View Firestore data
  - Manage auth users
  - See function logs
- **MailHog:** http://localhost:8025
  - View all sent emails
- **Mock LRS:** http://localhost:8081
  - View xAPI statements

**Login:**
```
Admin:   admin@test.com / admin123
Teacher: teacher@test.com / teacher123  
Student: student@test.com / student123
```

### Making Changes

**Frontend Changes:**
- Edit files in `src/`
- Vite HMR updates instantly
- No rebuild needed

**Functions Changes:**
```bash
cd functions
npm run build        # Or build:watch
# Emulator automatically reloads
```

**Firestore Rules Changes:**
```bash
# Edit rules/firestore.rules
# Emulator hot-reloads rules automatically

# Test rules
npm run test:rules
```

**Database Changes:**
- Use Firebase Emulator UI (port 4000)
- Or use seed scripts
- Data persists between runs (with --export-on-exit)

### Resetting Data

```bash
# Stop emulators
# Delete emulator data
rm -rf emulator-data

# Delete mock LRS data
rm dev-tools/xapi-statements.json

# Restart and re-seed
./dev-tools/start-local-stack.sh
```

---

## Limitations & Trade-offs

### What Works Locally ✅

- ✅ Complete frontend functionality
- ✅ All Firebase services (via emulators)
- ✅ Authentication (email/password)
- ✅ Real-time database sync
- ✅ File uploads (local storage)
- ✅ Cloud functions execution
- ✅ Firestore rules testing
- ✅ Email capture (via MailHog)
- ✅ xAPI statement logging (via mock LRS)
- ✅ User presence system
- ✅ All CRUD operations
- ✅ Visual galaxy editing
- ✅ Student progress tracking
- ✅ Submission reviews
- ✅ Help requests

### Limitations ⚠️

#### Minor Limitations:
- ⚠️ xAPI analytics queries return empty (mock doesn't implement aggregation)
  - **Impact:** Charts won't show historical data
  - **Workaround:** Implement basic aggregation in mock server
  - **Alternative:** Use production LRS for development

- ⚠️ Email templates won't render exactly as production
  - **Impact:** Formatting may differ slightly
  - **Workaround:** MailHog shows HTML preview

- ⚠️ Magic link email sign-in requires manual testing
  - **Impact:** Have to copy link from MailHog
  - **Workaround:** Use regular password login for development

#### Performance Differences:
- ⚠️ Emulators may be slower than production
- ⚠️ Cold starts on functions (first call slower)
- ⚠️ No CDN for static assets

#### Features Not Available:
- ❌ Firebase Hosting (use Vite dev server instead)
- ❌ Firebase App Check (security feature, development-only bypass)
- ❌ Scheduled functions (cron jobs)
  - **Impact:** Inactivity checking won't run automatically
  - **Workaround:** Manually trigger checkInactivity function

### What Doesn't Work (But Isn't Critical) ❌

- ❌ Production analytics dashboards (xAPI aggregation)
- ❌ Actual email delivery (captured in MailHog instead)
- ❌ Production monitoring/logging
- ❌ Scheduled inactivity checks (can trigger manually)

---

## Advanced: Fully Offline Mode

For scenarios where internet isn't available after initial setup:

### 1. Install All Dependencies Offline

```bash
# Before going offline, cache all dependencies
npm install
cd functions && npm install && cd ..
cd dev-tools && npm install && cd ..

# Download emulator binaries
firebase setup:emulators:firestore
firebase setup:emulators:database
firebase setup:emulators:functions
firebase setup:emulators:ui
```

### 2. Mock External Requests

Create `dev-tools/offline-mode.js`:
```javascript
// Intercept and mock any remaining external requests
const http = require('http');
const url = require('url');

const MOCK_RESPONSES = {
  'galaxymaps.lrs.io': { status: 200, body: { success: true } },
  'smtp.gmail.com': { status: 200, body: { success: true } }
};

http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const host = parsed.hostname;
  
  if (MOCK_RESPONSES[host]) {
    const mock = MOCK_RESPONSES[host];
    res.writeHead(mock.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mock.body));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(8888);

console.log('🔌 Offline mode proxy running on port 8888');
```

### 3. Disable External Service Calls

Add to `.env.local`:
```bash
VITE_OFFLINE_MODE=true
VITE_SKIP_XAPI=true
VITE_SKIP_EMAILS=true
```

Update code to respect offline mode:
```typescript
if (import.meta.env.VITE_OFFLINE_MODE === 'true') {
  console.log('[OFFLINE] Skipping external service call');
  return;
}
```

---

## Docker Compose Alternative

For the simplest one-command setup, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # MailHog for email capture
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - galaxy-maps-local

  # Mock LRS Server
  mock-lrs:
    build:
      context: ./dev-tools
      dockerfile: Dockerfile.mock-lrs
    ports:
      - "8081:8081"
    volumes:
      - ./dev-tools/xapi-statements.json:/app/xapi-statements.json
    networks:
      - galaxy-maps-local

  # Note: Firebase emulators can't easily run in Docker
  # They should run on host machine via firebase CLI

networks:
  galaxy-maps-local:
    driver: bridge
```

**Dockerfile for Mock LRS** (`dev-tools/Dockerfile.mock-lrs`):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY mock-lrs-server.js ./

EXPOSE 8081

CMD ["node", "mock-lrs-server.js"]
```

**Usage:**
```bash
# Start Docker services
docker-compose up -d

# Start Firebase emulators (on host)
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data

# Start frontend (on host)
npm run dev
```

---

## Testing the Local Setup

### Verification Checklist

```bash
# ✅ 1. Firebase Emulators Running
curl http://localhost:4000
# Should return Firebase Emulator UI

# ✅ 2. Frontend Running
curl http://localhost:8080
# Should return HTML

# ✅ 3. Mock LRS Running
curl http://localhost:8081
# Should return LRS web interface

# ✅ 4. MailHog Running
curl http://localhost:8025
# Should return MailHog UI

# ✅ 5. Auth Emulator
curl http://localhost:9099/emulator/v1/projects/galaxy-maps-ac367/accounts
# Should return JSON

# ✅ 6. Firestore Emulator
curl http://localhost:8080
# Should return error (expected - not a web interface)
```

### End-to-End Test

1. **Create Account:**
   - Go to http://localhost:8080/register
   - Create account
   - Check MailHog (localhost:8025) for verification email
   - Click link to verify

2. **Create Galaxy:**
   - Login as teacher
   - Create new galaxy
   - Add solar systems (nodes)
   - Add prerequisites (edges)
   - Add missions to systems

3. **Assign Student:**
   - Create student account
   - Assign to galaxy
   - Check data propagated in Firebase UI (localhost:4000)

4. **Student Journey:**
   - Login as student
   - View assigned galaxy
   - Start mission
   - Complete mission
   - Check xAPI statement in Mock LRS (localhost:8081)

5. **Help Request:**
   - Submit help request
   - Check MailHog for email
   - Login as teacher
   - See request in dashboard
   - Respond to request
   - Check student received response

---

## Troubleshooting Local Setup

### Common Issues

#### Firebase Emulators Won't Start

**Error:** "Port already in use"
```bash
# Find and kill processes on Firebase ports
lsof -ti:8080 | xargs kill -9  # Firestore
lsof -ti:9099 | xargs kill -9  # Auth
lsof -ti:5001 | xargs kill -9  # Functions
lsof -ti:4000 | xargs kill -9  # UI

# Or use firebase command
firebase emulators:kill
```

**Error:** "Java not found"
```bash
# Install Java (required for Firestore emulator)
# macOS:
brew install openjdk@11

# Linux:
sudo apt-get install openjdk-11-jre

# Verify:
java -version
```

#### Frontend Can't Connect to Emulators

**Issue:** CORS errors or connection refused

**Solution:**
```typescript
// Verify in src/store/firestoreConfig.ts
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  db.useEmulator('localhost', 8080);
  auth.useEmulator('http://localhost:9099');
  functions.useEmulator('localhost', 5001);
  storage.useEmulator('localhost', 9199);
}
```

**Check .env.local:**
```bash
VITE_USE_EMULATOR=true
```

#### Functions Not Working

**Error:** "Function not found"

**Solution:**
```bash
# Rebuild functions
cd functions
npm run build

# Check functions are exported in src/index.ts
# Restart emulators
firebase emulators:start
```

#### Mock LRS Not Receiving Statements

**Check configuration:**
```bash
# .env.local should have:
VITE_LRS_URL=http://localhost:8081/xapi/statements

# Check mock server is running:
curl http://localhost:8081
```

**Check browser console:**
- CORS errors? Mock server has cors enabled
- 404 errors? Check LRS_URL matches mock server

#### MailHog Not Capturing Emails

**Check SMTP configuration in functions:**
```typescript
// functions/src/emails.ts should detect emulator mode
host: process.env.FUNCTIONS_EMULATOR === "true" ? "localhost" : "smtp.gmail.com"
port: process.env.FUNCTIONS_EMULATOR === "true" ? 1025 : 465
```

**Test SMTP connection:**
```bash
# Use telnet to test
telnet localhost 1025
# Should connect
```

### Debug Mode

**Enable verbose logging:**

```bash
# Frontend
VITE_DEBUG=true npm run dev

# Functions  
DEBUG=* firebase emulators:start

# Mock LRS
NODE_ENV=development node dev-tools/mock-lrs-server.js
```

---

## Alternative: Minimal Setup (Fastest Start)

For developers who just want to run the app quickly:

### Quick Start (5 minutes)

```bash
# 1. Install and start emulators
npm install -g firebase-tools
firebase emulators:start

# 2. In another terminal - start frontend
npm install
npm run dev:emulator

# 3. Import test data
firebase emulators:exec "node rules/test-rules.js"

# 4. Open browser
open http://localhost:8080

# Login with test users from rules/test-data.json
```

**That's it!** This minimal setup:
- ✅ Runs frontend
- ✅ Runs all Firebase emulators
- ✅ Seeds test data
- ❌ No email (emails will fail silently)
- ❌ No xAPI analytics (charts will be empty)

For most development tasks, this is sufficient!

---

## Production Parity Checklist

How close is local setup to production?

| Feature | Local | Production | Notes |
|---------|-------|------------|-------|
| Frontend serving | ✅ Identical | ✅ | Vite dev vs hosted build |
| Firestore database | ✅ Identical | ✅ | Same API, local storage |
| Authentication | ✅ Identical | ✅ | Same flows, no real emails |
| Cloud Functions | ✅ ~95% | ✅ | Emulator very accurate |
| File Storage | ✅ Identical | ✅ | Local files vs GCS |
| Realtime Database | ✅ Identical | ✅ | Same API |
| Security Rules | ✅ Identical | ✅ | Same rules engine |
| Email Delivery | ⚠️ Mock | ✅ | MailHog vs Gmail |
| xAPI Analytics | ⚠️ Limited | ✅ | Mock vs Veracity LRS |
| Performance | ⚠️ Different | ✅ | Slower, no CDN |
| Scheduled Functions | ❌ Manual | ✅ | Can trigger manually |

**Overall Parity:** ~90% for feature development, ~70% for testing

---

## Cost Comparison

### Cloud Hosting (Current)
```
Firebase Free Tier:
- Firestore: 1GB storage, 50K reads/20K writes per day
- Functions: 2M invocations per month
- Storage: 5GB storage, 1GB download per day
- Auth: Unlimited

Paid (if exceeded):
- Firestore: ~$0.06 per 100K reads
- Functions: ~$0.40 per million invocations
- Storage: ~$0.026 per GB per month

Gmail SMTP: Free (within limits)
Veracity LRS: Unknown (likely paid)

Estimated Monthly Cost: $0-50 depending on usage
```

### Local Hosting
```
Hardware Requirements:
- Laptop/Desktop with 8GB+ RAM
- 10GB disk space
- Any OS (macOS/Linux/Windows)

Costs:
- Electricity: ~$1-5 per month
- No service fees
- No bandwidth costs
- No storage costs

Total: < $5 per month
```

**Savings:** Potentially $0-45 per month + no vendor lock-in

---

## Future Improvements

### Enhanced Mock LRS

Implement basic aggregation queries:
```javascript
// In mock-lrs-server.js
app.post('/xapi/statements/aggregate', (req, res) => {
  const pipeline = req.body;
  
  // Implement basic $match
  let filtered = statements;
  const matchStage = pipeline.find(stage => stage.$match);
  if (matchStage) {
    filtered = statements.filter(stmt => {
      // Implement matching logic
      return matchesQuery(stmt, matchStage.$match);
    });
  }
  
  // Implement basic $group
  const groupStage = pipeline.find(stage => stage.$group);
  if (groupStage) {
    const grouped = groupBy(filtered, groupStage.$group);
    res.json(grouped);
    return;
  }
  
  res.json(filtered);
});
```

### Docker Everything

Full Docker Compose setup including Firebase emulators:
- Use firebase-tools-docker image
- Mount volumes for persistence
- Single `docker-compose up` command
- Cross-platform compatibility

### GUI Management Tools

Create admin panel:
```
dev-tools/admin-panel/
├── index.html
├── app.js
└── styles.css
```

Features:
- View all collections
- Create test users
- Assign courses
- Trigger functions manually
- View logs in real-time

### Automated Testing Suite

Integration tests for local stack:
```bash
# Test all services are running
npm run test:local-stack

# Run E2E tests against emulators
npm run test:e2e:local
```

---

## Contributor Onboarding Optimized

### New Contributor Script

Create `CONTRIBUTING.md` with:

```markdown
# Contributing to Galaxy Maps

## Quick Start (Local Development)

1. **Clone and Install:**
   ```bash
   git clone <repo>
   cd galaxy-maps-v2
   npm install
   cd functions && npm install && cd ..
   ```

2. **Start Local Stack:**
   ```bash
   ./dev-tools/start-local-stack.sh
   ```

3. **Access the App:**
   - Open http://localhost:8080
   - Login: `admin@test.com` / `admin123`

4. **Make Changes:**
   - Edit files in `src/` (auto-reload)
   - View data at http://localhost:4000
   - View emails at http://localhost:8025

5. **Submit PR:**
   - Create feature branch
   - Make changes
   - Test locally
   - Submit pull request
```

### First-Time Setup Time

**Estimated Times:**
- Manual setup: ~30-45 minutes
- Script-assisted setup: ~10-15 minutes
- Quick start (minimal): ~5 minutes

**Internet Required:**
- Initial: Download dependencies (~500MB)
- Ongoing: None (fully offline capable)

---

## Recommended Local Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer Laptop                         │
│                                                              │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │   Browser    │  │         Vite Dev Server             │ │
│  │ localhost:   │←→│       (Frontend Build)              │ │
│  │    8080      │  │         Port 8080                   │ │
│  └──────────────┘  └─────────────────────────────────────┘ │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Firebase Emulator Suite                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │Firestore │ │   Auth   │ │Functions │            │   │
│  │  │Port 8080 │ │Port 9099 │ │Port 5001 │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │  ┌──────────┐ ┌──────────┐                          │   │
│  │  │ Storage  │ │   RTDB   │                          │   │
│  │  │Port 9199 │ │Port 9000 │                          │   │
│  │  └──────────┘ └──────────┘                          │   │
│  │                                                       │   │
│  │         Emulator UI: Port 4000                       │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                        ↓                          │
│  ┌──────────────┐        ┌─────────────┐                   │
│  │  Mock LRS    │        │  MailHog    │                   │
│  │  (Node.js)   │        │  (Docker)   │                   │
│  │  Port 8081   │        │  Port 1025  │                   │
│  │              │        │  UI: 8025   │                   │
│  └──────────────┘        └─────────────┘                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Local File System                           │   │
│  │  • emulator-data/ (Firestore + Auth data)           │   │
│  │  • dev-tools/xapi-statements.json (LRS data)        │   │
│  │  • ~/.cache/firebase/storage/ (uploaded files)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations for Local Development

### Safe Practices

1. **Don't Use Production Credentials:**
   - Never use real Gmail credentials locally
   - Never use production Firebase config locally
   - Use test data only

2. **Don't Commit Secrets:**
   - `.env.local` in `.gitignore`
   - `.runtimeconfig.json` in `.gitignore`
   - `emulator-data/` in `.gitignore`

3. **Firestore Rules Still Apply:**
   - Emulator enforces security rules
   - Test rules before deploying
   - Use `npm run test:rules`

4. **Network Isolation:**
   - Emulators only bind to localhost
   - Not accessible from network
   - Safe for public WiFi development

### Unsafe Practices (Development Only!)

**DO NOT** do these in production:

```javascript
// ❌ NEVER in production
allow read, write: if true;  // Open to all

// ✅ OK for local development
match /{document=**} {
  allow read, write: if request.auth != null;  // Any authenticated user
}
```

---

## Scripts & Automation

### Recommended Scripts to Add to package.json

```json
{
  "scripts": {
    "dev:local": "concurrently \"npm:dev:emulator\" \"npm:dev:mock-services\"",
    "dev:mock-services": "cd dev-tools && node mock-lrs-server.js",
    "seed:data": "firebase emulators:exec --only firestore,auth \"node dev-tools/seed-database.js\"",
    "seed:test-data": "firebase emulators:exec --only firestore,auth \"node rules/test-rules.js\"",
    "reset:emulator": "rm -rf emulator-data && echo '✅ Emulator data cleared'",
    "start:mailhog": "docker start mailhog || docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog",
    "stop:mailhog": "docker stop mailhog",
    "local:stack": "./dev-tools/start-local-stack.sh",
    "local:check": "curl http://localhost:8080 && curl http://localhost:4000 && curl http://localhost:8081",
    "local:logs": "firebase emulators:start --only functions --inspect-functions"
  }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

---

## Developer Documentation

### README Addition

Add to main README.md:

```markdown
## Local Development Setup

### Quick Start
```bash
# One-command setup
npm install
npm run local:stack
```

Open http://localhost:8080

### Services
- **Frontend:** http://localhost:8080
- **Firebase UI:** http://localhost:4000
- **Email Viewer:** http://localhost:8025
- **xAPI Viewer:** http://localhost:8081

### Default Credentials
- Admin: `admin@test.com` / `admin123`
- Teacher: `teacher@test.com` / `teacher123`
- Student: `student@test.com` / `student123`

See [docs/self-hosting-plan.md](docs/self-hosting-plan.md) for detailed setup.
```

---

## Performance Benchmarks

### Local vs Cloud (Expected)

| Metric | Local (Emulator) | Cloud (Production) |
|--------|------------------|-------------------|
| Cold start (first load) | 5-10s | 2-3s |
| Hot reload (HMR) | <1s | N/A |
| Function call latency | 10-50ms | 100-300ms |
| Firestore query | <10ms | 50-200ms |
| File upload | Very fast | Depends on connection |
| Auth operations | <50ms | 100-500ms |

**Verdict:** Local is actually faster for development! 🚀

---

## Open Source Alternatives (Future)

For a fully self-hostable version without Firebase:

### Backend Replacement Options

1. **Supabase** (Open source Firebase alternative)
   - PostgreSQL instead of Firestore
   - Built-in auth
   - Real-time subscriptions
   - Storage
   - Functions (Deno)
   
2. **Appwrite** (Open source BaaS)
   - Self-hosted
   - Docker-based
   - Multiple database options
   - Built-in auth & storage

3. **Custom Stack:**
   - **Database:** PostgreSQL or MongoDB
   - **Auth:** Keycloak or Auth0 (open source)
   - **Functions:** Express.js API
   - **Storage:** MinIO (S3-compatible)
   - **Real-time:** Socket.io or Server-Sent Events

**Effort:** ~2-4 weeks of refactoring

### LRS Replacement

**Learning Locker** (Open Source xAPI LRS):
```bash
# Docker Compose setup
git clone https://github.com/LearningLocker/learninglocker
cd learninglocker
docker-compose up

# Configure Galaxy Maps to use:
VITE_LRS_URL=http://localhost:8080/data/xAPI/statements
```

**Features:**
- Full xAPI compliance
- Aggregation support
- Web UI for analytics
- Open source

---

## Conclusion

**Feasibility:** ✅ Highly feasible! 

The Galaxy Maps v2 codebase is already well-prepared for local development thanks to:
- Firebase Emulator Suite (official support)
- Environment-based configuration
- Modular service architecture

**Minimal Changes Needed:**
1. ✅ Create mock LRS server (~50 lines of code)
2. ✅ Set up MailHog (Docker one-liner)
3. ✅ Create seed data scripts (~200 lines)
4. ✅ Add startup scripts (~100 lines)
5. ✅ Update environment configs (a few files)

**Total Effort:** ~4-8 hours for complete setup with documentation

**Result:** Developers can run Galaxy Maps entirely locally with near-production parity, enabling:
- ✅ Offline development
- ✅ Zero hosting costs
- ✅ Fast iteration cycles
- ✅ Easy contribution workflow
- ✅ Privacy (no data leaves laptop)
- ✅ Multi-developer setups (no conflicts)

**Recommendation:** Implement the "Complete Local Stack" setup as the official development environment!

---

## Next Steps

1. **Create dev-tools directory structure**
2. **Implement mock LRS server**
3. **Create seed database scripts**
4. **Write startup automation scripts**
5. **Test on fresh machine**
6. **Document in CONTRIBUTING.md**
7. **Add to main README.md**
8. **Create video walkthrough (optional)**

This will make Galaxy Maps v2 one of the most contributor-friendly educational platforms! 🌟

