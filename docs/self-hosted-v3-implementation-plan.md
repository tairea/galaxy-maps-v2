# Galaxy Maps V3: Self-Hosted Implementation Plan

## Executive Summary

This document outlines a **staged approach** to building Galaxy Maps V3 - a fully self-hosted, Docker-based version that users can deploy with a single `docker compose up` command. The end goal is a complete, production-ready platform with all infrastructure (database, auth, LRS, email, storage) containerized and pre-configured.

**Timeline:** 8-12 weeks
**Approach:** Incremental refactoring on a new branch, maintaining current codebase
**End Result:** `docker compose up` → fully functional Galaxy Maps instance
**Container Count:** 8 containers (optimized for simplicity)

### Key Optimizations

This plan has been **optimized for simplicity** based on careful analysis:

✅ **Removed Kong API Gateway** - Nginx in frontend handles all routing
✅ **Removed MinIO** - Supabase Storage provides integrated file management
✅ **Result:** 8 containers instead of 11 (27% reduction)
✅ **Simpler configuration** - One Nginx config instead of Kong + Nginx
✅ **Better integration** - All Supabase services work together seamlessly

---

## Current Architecture Analysis

### What We Have (Firebase-based)

```
┌─────────────────────────────────────────────────┐
│              Current Stack (V2)                  │
├─────────────────────────────────────────────────┤
│ Frontend:  Vue 2.7 + Vuetify + Pinia + Vite    │
│ Backend:   Firebase Cloud Functions (Node 20)   │
│ Database:  Firestore (NoSQL)                    │
│ Realtime:  Firebase Realtime Database           │
│ Auth:      Firebase Auth                        │
│ Storage:   Firebase Cloud Storage               │
│ Email:     Nodemailer via Cloud Functions       │
│ LRS:       External (Veracity LRS)              │
│ AI:        OpenAI API (external)                │
└─────────────────────────────────────────────────┘
```

### Dependencies to Replace

1. ❌ **Firebase Auth** → ✅ Supabase Auth
2. ❌ **Firestore** → ✅ PostgreSQL (via Supabase)
3. ❌ **Firebase Realtime DB** → ✅ Supabase Realtime
4. ❌ **Cloud Functions** → ✅ Node.js Express API
5. ❌ **Firebase Storage** → ✅ Supabase Storage (file-based)
6. ❌ **External LRS** → ✅ SQL LRS (containerized)
7. ✅ **OpenAI API** → ✅ Keep as-is (external service)
8. ❌ **Email (implicit)** → ✅ SMTP relay container

---

## Target Architecture (V3)

### Self-Hosted Stack

```
┌─────────────────────────────────────────────────────────────┐
│              Docker Compose Stack (8 Containers)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │         Frontend (Nginx) - Entry Point         │          │
│  │  • Serves Vue.js app                           │          │
│  │  • Routes API requests (replaces Kong)         │          │
│  └───┬────────────────────────────────────────────┘          │
│      │                                                        │
│      ├─ /api/* ──────────► Express API (Business Logic)     │
│      ├─ /auth/* ─────────► Supabase Auth (JWT)              │
│      ├─ /storage/* ──────► Supabase Storage (Files)         │
│      ├─ /realtime/* ─────► Supabase Realtime (WebSocket)    │
│      └─ /rest/* ─────────► PostgREST (Internal)             │
│                                                               │
│  Core Services:                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   SQL LRS    │  │   Mailpit    │      │
│  │   (Data)     │  │   (xAPI)     │  │   (Email)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Container Breakdown (8 Containers)

| Container | Image | Purpose | Ports | Exposed |
|-----------|-------|---------|-------|---------|
| **frontend** | `nginx:alpine` | Serve Vue.js + Route API | 80, 443 | ✅ Public |
| **api** | Custom `node:20-alpine` | Business logic API | 3000 | Internal |
| **postgres** | `supabase/postgres:latest` | Main database + LRS DB | 5432 | Internal |
| **auth** | `supabase/gotrue:latest` | Authentication (JWT) | 9999 | Via Nginx |
| **rest** | `postgrest/postgrest:latest` | Auto REST API (internal) | 3000 | Internal |
| **realtime** | `supabase/realtime:latest` | WebSocket subscriptions | 4000 | Via Nginx |
| **storage** | `supabase/storage-api:latest` | File storage (filesystem) | 5000 | Via Nginx |
| **sql-lrs** | `yetanalytics/lrsql:latest` | Learning Record Store | 8080 | Internal |
| **mailpit** | `axllent/mailpit:latest` | SMTP server + Web UI | 1025, 8025 | 8025 public |

**Removed Containers:**
- ❌ **Kong** - Nginx handles all routing
- ❌ **MinIO** - Supabase Storage uses filesystem storage

---

## Staged Implementation Plan

### 🎯 Stage 0: Preparation & Branch Setup (Week 1)

**Goal:** Set up development infrastructure

#### Tasks:

1. **Create New Branch**
```bash
git checkout -b self-hosted-v3
git push -u origin self-hosted-v3
```

2. **Create Directory Structure**
```
galaxy-maps-v2/
├── docker/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── api/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   ├── supabase/
│   │   ├── config.toml
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql
│   │       └── 002_seed_data.sql
│   └── init-scripts/
│       └── setup.sh
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── api/ (new backend directory)
    ├── src/
    │   ├── index.ts
    │   ├── routes/
    │   ├── services/
    │   ├── middleware/
    │   └── utils/
    ├── package.json
    └── tsconfig.json
```

3. **Documentation**
```
docs/
├── SELF_HOSTING_GUIDE.md
├── DEPLOYMENT.md
├── API_REFERENCE.md
└── TROUBLESHOOTING.md
```

**Deliverables:**
- ✅ New branch `self-hosted-v3`
- ✅ Docker directory structure
- ✅ Initial documentation templates

---

### 🎯 Stage 1: Database Layer (Weeks 2-3)

**Goal:** Set up PostgreSQL with Supabase and migrate schema

#### Phase 1.1: Supabase Setup (Week 2)

1. **Create Docker Compose Foundation**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: supabase/postgres:15.1.0.147
    container_name: galaxy_postgres
    environment:
      POSTGRES_DB: galaxy_maps
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PORT: 5432
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/supabase/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - galaxy_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:

networks:
  galaxy_network:
    driver: bridge
```

2. **Create Initial Schema Migration**

Create `docker/supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- People table
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  -- ... (from postgresql-schema-migration.md)
);

-- Courses table
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  -- ... (from postgresql-schema-migration.md)
);

-- (Continue with all tables)
```

3. **Create Seed Data**

Create `docker/supabase/migrations/002_seed_data.sql`:
```sql
-- Insert default admin user
INSERT INTO people (id, email, display_name, first_name, last_name)
VALUES
  ('admin', 'admin@galaxymaps.local', 'Admin User', 'Admin', 'User');

-- Insert sample course
INSERT INTO courses (id, title, description, status, public, owner_id)
VALUES
  ('demo-course', 'Welcome to Galaxy Maps', 'A sample course to get you started', 'published', true, 'admin');
```

**Test:**
```bash
docker compose up postgres
docker exec -it galaxy_postgres psql -U postgres -d galaxy_maps -c "\dt"
```

#### Phase 1.2: Supabase Services (Week 3)

1. **Add Auth Service**

Update `docker-compose.yml`:
```yaml
  auth:
    image: supabase/gotrue:v2.99.0
    container_name: galaxy_auth
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      GOTRUE_SITE_URL: ${SITE_URL:-http://localhost}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_SMTP_HOST: ${SMTP_HOST:-mailpit}
      GOTRUE_SMTP_PORT: ${SMTP_PORT:-1025}
      GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_ADMIN_EMAIL:-admin@galaxymaps.local}
      GOTRUE_MAILER_AUTOCONFIRM: ${MAILER_AUTOCONFIRM:-false}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "9999:9999"
    networks:
      - galaxy_network
```

2. **Add REST API (PostgREST)**

```yaml
  rest:
    image: postgrest/postgrest:v12.0.2
    container_name: galaxy_rest
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3001:3000"
    networks:
      - galaxy_network
```

3. **Add Realtime Service**

```yaml
  realtime:
    image: supabase/realtime:v2.25.35
    container_name: galaxy_realtime
    environment:
      DB_HOST: postgres
      DB_NAME: galaxy_maps
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_PORT: 5432
      PORT: 4000
      JWT_SECRET: ${JWT_SECRET}
      REPLICATION_MODE: RLS
      REPLICATION_POLL_INTERVAL: 100
      SECURE_CHANNELS: "true"
      SLOT_NAME: supabase_realtime_rls
      TEMPORARY_SLOT: "true"
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"
    networks:
      - galaxy_network
```

**Deliverables:**
- ✅ PostgreSQL with complete schema
- ✅ Supabase Auth running
- ✅ PostgREST API auto-generated
- ✅ Realtime subscriptions enabled

---

### 🎯 Stage 2: Storage & Supporting Services (Week 4)

**Goal:** Set up Supabase Storage, LRS, and Email

#### Phase 2.1: Supabase Storage (File Storage)

**Why Supabase Storage instead of MinIO?**
- ✅ Integrated with Supabase Auth (automatic RLS)
- ✅ Simpler configuration (no separate S3-compatible service)
- ✅ Unified API with database operations
- ✅ Built-in image transformations
- ✅ One less container to manage

```yaml
  storage:
    image: supabase/storage-api:v0.43.11
    container_name: galaxy_storage
    restart: unless-stopped
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      FILE_SIZE_LIMIT: 52428800 # 50MB max file size
      STORAGE_BACKEND: file # Use local filesystem storage
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: local
      GLOBAL_S3_BUCKET: galaxy-storage
      ENABLE_IMAGE_TRANSFORMATION: "true"
      IMGPROXY_URL: http://imgproxy:8080 # Optional: for image transformations
    volumes:
      - storage_data:/var/lib/storage
    depends_on:
      - postgres
      - rest
    networks:
      - galaxy_network
```

Add to volumes section:
```yaml
volumes:
  storage_data: # Stores uploaded files
```

**Storage Buckets Setup:**

Create `docker/supabase/migrations/003_storage_buckets.sql`:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('course-images', 'course-images', true),
  ('submissions', 'submissions', false);

-- RLS policies for avatars (public read, owner write)
CREATE POLICY "Public avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Similar policies for course-images and submissions...
```

#### Phase 2.2: SQL LRS

```yaml
  sql-lrs:
    image: yetanalytics/lrsql:latest
    container_name: galaxy_lrs
    environment:
      LRSQL_DB_TYPE: postgres
      LRSQL_DB_HOST: postgres
      LRSQL_DB_PORT: 5432
      LRSQL_DB_NAME: galaxy_maps_lrs
      LRSQL_DB_USER: postgres
      LRSQL_DB_PASSWORD: ${POSTGRES_PASSWORD}
      LRSQL_ADMIN_USER_DEFAULT: admin
      LRSQL_ADMIN_PASS_DEFAULT: ${LRS_ADMIN_PASSWORD}
      LRSQL_API_KEY_DEFAULT: ${LRS_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"
    networks:
      - galaxy_network
```

Create LRS database in migration:
```sql
-- In 001_initial_schema.sql
CREATE DATABASE galaxy_maps_lrs;
```

#### Phase 2.3: Email (Mailpit for Dev/Demo)

```yaml
  mailpit:
    image: axllent/mailpit:latest
    container_name: galaxy_mailpit
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - galaxy_network
    environment:
      MP_MAX_MESSAGES: 500
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

**Deliverables:**
- ✅ Supabase Storage with buckets configured
- ✅ SQL LRS connected to PostgreSQL
- ✅ Mailpit for email testing

---

### 🎯 Stage 3: Backend API (Weeks 5-6)

**Goal:** Build Express.js API to replace Cloud Functions

#### Phase 3.1: API Foundation (Week 5)

1. **Create API Structure**

`api/package.json`:
```json
{
  "name": "galaxy-maps-api",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "openai": "^4.95.1",
    "nodemailer": "^6.9.7",
    "luxon": "^3.4.3",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

`api/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import coursesRouter from './routes/courses';
import usersRouter from './routes/users';
import cohortsRouter from './routes/cohorts';
import tasksRouter from './routes/tasks';
import aiRouter from './routes/ai';
import lrsRouter from './routes/lrs';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/courses', authMiddleware, coursesRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/cohorts', authMiddleware, cohortsRouter);
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/lrs', authMiddleware, lrsRouter);

// Error handling
app.use(errorHandler);

const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Galaxy Maps API running on port ${PORT}`);
});
```

2. **Create Middleware**

`api/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

3. **Port Cloud Functions to Routes**

`api/src/routes/courses.ts`:
```typescript
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from '../config';

const router = Router();
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('public', true)
      .eq('status', 'published');

    if (error) throw error;

    res.json({ courses: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Course not found' });

    res.json({ course: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /api/courses
router.post('/', async (req, res) => {
  try {
    const courseSchema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      public: z.boolean().default(false),
    });

    const courseData = courseSchema.parse(req.body);

    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        owner_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ course: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
```

4. **Create Dockerfile**

`docker/api/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY api/package*.json ./
RUN npm ci

COPY api/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

5. **Add to Docker Compose**

```yaml
  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    container_name: galaxy_api
    environment:
      NODE_ENV: production
      PORT: 3000
      SUPABASE_URL: http://kong:8000
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGRES_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      LRS_ENDPOINT: http://sql-lrs:8080
      LRS_API_KEY: ${LRS_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
    depends_on:
      - postgres
      - auth
      - sql-lrs
    ports:
      - "3000:3000"
    networks:
      - galaxy_network
    volumes:
      - ./api:/app # For development hot-reload
```

#### Phase 3.2: Port All Cloud Functions (Week 6)

**Strategy:** Systematically port each Cloud Function to Express route

1. **Course Management** (`/api/courses/*`)
   - ✅ getCourses
   - ✅ getCourseByCourseId
   - ✅ getCourseMapEdgesAndNodesByCourseId
   - ✅ saveGalaxyMap
   - etc.

2. **User Management** (`/api/users/*`)
3. **Cohort Management** (`/api/cohorts/*`)
4. **Task/Topic Management** (`/api/topics/*`, `/api/tasks/*`)
5. **Activity Tracking** (`/api/activity/*`)
6. **AI Functions** (`/api/ai/*`)
7. **LRS Functions** (`/api/lrs/*`)

**Deliverables:**
- ✅ Express API with all Cloud Functions ported
- ✅ Authentication middleware
- ✅ Error handling
- ✅ Logging (Winston)

---

### 🎯 Stage 4: Frontend Integration (Weeks 7-8)

**Goal:** Update Vue.js app to use new backend

#### Phase 4.1: Supabase Client Integration (Week 7)

1. **Install Supabase Client**

```bash
npm install @supabase/supabase-js
```

2. **Create Supabase Client**

`src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

3. **Replace Firebase Auth**

`src/store/auth.ts`:
```typescript
import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
  }),

  actions: {
    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },

    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.user = data.user;
      this.session = data.session;
      return data;
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.user = null;
      this.session = null;
    },

    async getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      this.user = user;
      return user;
    },
  },
});
```

4. **Replace Piniafire with Supabase Realtime**

`src/store/courses.ts`:
```typescript
import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase';

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    courses: [],
    subscription: null,
  }),

  actions: {
    async fetchCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('public', true)
        .eq('status', 'published');

      if (error) throw error;
      this.courses = data;
    },

    subscribeToCoursesRealtime() {
      this.subscription = supabase
        .channel('courses-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'courses' },
          (payload) => {
            this.handleRealtimeUpdate(payload);
          }
        )
        .subscribe();
    },

    handleRealtimeUpdate(payload: any) {
      if (payload.eventType === 'INSERT') {
        this.courses.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        const index = this.courses.findIndex(c => c.id === payload.new.id);
        if (index !== -1) this.courses[index] = payload.new;
      } else if (payload.eventType === 'DELETE') {
        this.courses = this.courses.filter(c => c.id !== payload.old.id);
      }
    },

    unsubscribe() {
      if (this.subscription) {
        supabase.removeChannel(this.subscription);
      }
    },
  },
});
```

5. **Replace Cloud Functions Calls**

Replace:
```typescript
// Old Firebase approach
import { functions } from '@/store/firestoreConfig';

const getCourse = functions.httpsCallable('getCourseByCourseId');
const result = await getCourse({ courseId: 'xyz' });
```

With:
```typescript
// New API approach
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Add auth token to all requests
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Use API
const response = await apiClient.get(`/courses/${courseId}`);
const course = response.data.course;
```

6. **Update Environment Variables**

`.env.example`:
```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API
VITE_API_URL=http://localhost:3000/api

# OpenAI
VITE_OPENAI_API_KEY=sk-your-key-here
```

#### Phase 4.2: Storage Integration (Week 8)

1. **Replace Firebase Storage with Supabase Storage**

`src/lib/storage.ts`:
```typescript
import { supabase } from '@/lib/supabase';

/**
 * Upload avatar for user
 */
export async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return {
    name: file.name,
    url: publicUrl,
  };
}

/**
 * Upload course image
 */
export async function uploadCourseImage(file: File, courseId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${courseId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('course-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('course-images')
    .getPublicUrl(fileName);

  return {
    name: file.name,
    url: publicUrl,
  };
}

/**
 * Upload task submission
 */
export async function uploadSubmission(file: File, submissionId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${submissionId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('submissions')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false // Submissions should not be overwritten
    });

  if (error) throw error;

  // Submissions are private, use signed URL
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('submissions')
    .createSignedUrl(fileName, 60 * 60 * 24); // 24 hour expiry

  if (urlError) throw urlError;

  return {
    name: file.name,
    url: signedUrlData.signedUrl,
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}
```

**Benefits of Supabase Storage:**
- ✅ Simpler API (no AWS SDK needed)
- ✅ Integrated with auth (automatic user context)
- ✅ RLS policies for security
- ✅ Public and private buckets
- ✅ Signed URLs for temporary access
- ✅ Built-in image transformations (optional)

**Deliverables:**
- ✅ Frontend using Supabase Auth
- ✅ Frontend using new API endpoints
- ✅ Real-time subscriptions working
- ✅ File uploads to Supabase Storage

---

### 🎯 Stage 5: Frontend Build & Nginx (Week 9)

**Goal:** Build and containerize Vue.js frontend with Nginx routing (replaces Kong)

**Why skip Kong?**
- ❌ Adds complexity for single-tenant deployments
- ❌ Requires separate configuration file
- ❌ Extra container to manage
- ✅ **Nginx can handle all routing** from the frontend container!

---

### 🎯 Stage 6: Frontend Build & Nginx (Week 10)

**Goal:** Containerize Vue.js frontend

#### Frontend Dockerfile

`docker/frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

`docker/frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Vue.js SPA routing (must be last)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Route to Express API
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # Route to Supabase Auth
    location /auth/ {
        proxy_pass http://auth:9999/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Route to Supabase Storage
    location /storage/ {
        proxy_pass http://storage:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50M; # Match storage file size limit
    }

    # Route to Supabase Realtime (WebSocket support)
    location /realtime/ {
        proxy_pass http://realtime:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400; # 24 hours for WebSocket
    }

    # Route to PostgREST (optional, for direct DB access)
    location /rest/ {
        proxy_pass http://rest:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting (optional)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

Add to `docker-compose.yml`:
```yaml
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: galaxy_frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443" # For HTTPS
    depends_on:
      - api
      - auth
      - storage
      - realtime
    networks:
      - galaxy_network
    volumes:
      - ./docker/frontend/ssl:/etc/nginx/ssl:ro # For SSL certificates
```

**Deliverables:**
- ✅ Production-ready Nginx serving frontend
- ✅ API proxied through Nginx
- ✅ WebSocket support for realtime

---

### 🎯 Stage 7: Testing & Polish (Week 11)

**Goal:** End-to-end testing and bug fixes

#### Tasks:

1. **Integration Testing**
   - Test user registration/login flow
   - Test course creation and editing
   - Test student progress tracking
   - Test file uploads
   - Test real-time updates
   - Test email notifications

2. **Create Test Data Script**

`docker/init-scripts/seed-test-data.sh`:
```bash
#!/bin/bash
# Create test users, courses, cohorts
```

3. **Performance Testing**
   - Load testing with k6
   - Database query optimization
   - Frontend bundle size optimization

4. **Security Hardening**
   - Review RLS policies
   - HTTPS setup with Let's Encrypt
   - Environment variable validation
   - Rate limiting

**Deliverables:**
- ✅ All features working end-to-end
- ✅ Performance optimized
- ✅ Security hardened

---

### 🎯 Stage 8: Documentation & Release (Week 12)

**Goal:** Production-ready with complete documentation

#### Documentation Tasks:

1. **Self-Hosting Guide** (`docs/SELF_HOSTING_GUIDE.md`)
   - System requirements
   - Installation steps
   - Configuration options
   - Domain setup
   - SSL certificate setup

2. **Deployment Guide** (`docs/DEPLOYMENT.md`)
   - Docker Compose production configuration
   - Environment variables reference
   - Backup strategies
   - Update procedures
   - Troubleshooting

3. **User Guide**
   - First-time setup
   - Creating first course
   - Inviting students
   - Managing cohorts

4. **Developer Guide**
   - Local development setup
   - API reference
   - Database schema
   - Contributing guidelines

#### Release Preparation:

1. **Create `.env.example`**

```bash
# PostgreSQL
POSTGRES_PASSWORD=change-me-to-secure-password

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase Keys (generate these)
SUPABASE_ANON_KEY=your-anon-key-here

# LRS
LRS_ADMIN_PASSWORD=change-me
LRS_API_KEY=your-lrs-api-key

# OpenAI (optional)
OPENAI_API_KEY=sk-your-key-here

# Site Configuration
SITE_URL=http://localhost
SMTP_ADMIN_EMAIL=admin@yourdomain.com

# Email (for production, use real SMTP)
SMTP_HOST=mailpit
SMTP_PORT=1025
```

2. **Create Quick Start Script**

`scripts/quickstart.sh`:
```bash
#!/bin/bash
set -e

echo "🌌 Galaxy Maps V3 - Self-Hosted Setup"
echo "======================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

# Copy env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and set secure passwords!"
    echo "Press Enter when ready..."
    read
fi

# Generate JWT secret if not set
if grep -q "your-jwt-secret-here" .env; then
    echo "🔑 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|your-jwt-secret-here|$JWT_SECRET|g" .env
fi

# Pull images
echo "📦 Pulling Docker images..."
docker compose pull

# Build custom images
echo "🔨 Building custom images..."
docker compose build

# Start services
echo "🚀 Starting Galaxy Maps..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker compose ps

echo ""
echo "✅ Galaxy Maps is running!"
echo "📍 Frontend: http://localhost"
echo "📍 API: http://localhost:3000"
echo "📍 Mailpit UI (Email): http://localhost:8025"
echo "📍 Mailpit UI: http://localhost:8025"
echo "📍 Database: localhost:5432"
echo ""
echo "🔐 Default admin credentials:"
echo "   Email: admin@galaxymaps.local"
echo "   Password: (set during first login)"
echo ""
echo "📚 Documentation: docs/SELF_HOSTING_GUIDE.md"
```

Make executable:
```bash
chmod +x scripts/quickstart.sh
```

3. **Create Update Script**

`scripts/update.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Updating Galaxy Maps..."

# Pull latest
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

echo "✅ Update complete!"
```

4. **Create Backup Script**

`scripts/backup.sh`:
```bash
#!/bin/bash
set -e

BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."

# Backup database
docker compose exec -T postgres pg_dump -U postgres galaxy_maps > "$BACKUP_DIR/database.sql"

# Backup Storage data
docker compose exec -T storage tar czf - /var/lib/storage > "$BACKUP_DIR/storage.tar.gz"

echo "✅ Backup complete!"
```

**Deliverables:**
- ✅ Complete documentation
- ✅ Quick start script
- ✅ Backup/restore scripts
- ✅ Production-ready `docker-compose.yml`

---

## Final Docker Compose Stack

### Complete `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: supabase/postgres:15.1.0.147
    container_name: galaxy_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: galaxy_maps
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/supabase/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - galaxy_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Supabase Auth
  auth:
    image: supabase/gotrue:v2.99.0
    container_name: galaxy_auth
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      GOTRUE_SITE_URL: ${SITE_URL:-http://localhost}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_SMTP_HOST: ${SMTP_HOST:-mailpit}
      GOTRUE_SMTP_PORT: ${SMTP_PORT:-1025}
      GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_ADMIN_EMAIL}
      GOTRUE_MAILER_AUTOCONFIRM: ${MAILER_AUTOCONFIRM:-false}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - galaxy_network

  # PostgREST
  rest:
    image: postgrest/postgrest:v12.0.2
    container_name: galaxy_rest
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - galaxy_network

  # Supabase Realtime
  realtime:
    image: supabase/realtime:v2.25.35
    container_name: galaxy_realtime
    restart: unless-stopped
    environment:
      DB_HOST: postgres
      DB_NAME: galaxy_maps
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_PORT: 5432
      PORT: 4000
      JWT_SECRET: ${JWT_SECRET}
      REPLICATION_MODE: RLS
      SECURE_CHANNELS: "true"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - galaxy_network

  # Supabase Storage
  storage:
    image: supabase/storage-api:v0.43.11
    container_name: galaxy_storage
    restart: unless-stopped
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      FILE_SIZE_LIMIT: 52428800 # 50MB
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: local
      GLOBAL_S3_BUCKET: galaxy-storage
      ENABLE_IMAGE_TRANSFORMATION: "true"
    volumes:
      - storage_data:/var/lib/storage
    depends_on:
      - postgres
      - rest
    networks:
      - galaxy_network

  # SQL LRS
  sql-lrs:
    image: yetanalytics/lrsql:latest
    container_name: galaxy_lrs
    restart: unless-stopped
    environment:
      LRSQL_DB_TYPE: postgres
      LRSQL_DB_HOST: postgres
      LRSQL_DB_PORT: 5432
      LRSQL_DB_NAME: galaxy_maps_lrs
      LRSQL_DB_USER: postgres
      LRSQL_DB_PASSWORD: ${POSTGRES_PASSWORD}
      LRSQL_ADMIN_USER_DEFAULT: admin
      LRSQL_ADMIN_PASS_DEFAULT: ${LRS_ADMIN_PASSWORD}
      LRSQL_API_KEY_DEFAULT: ${LRS_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"
    networks:
      - galaxy_network

  # Mailpit (SMTP + Web UI)
  mailpit:
    image: axllent/mailpit:latest
    container_name: galaxy_mailpit
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - galaxy_network

  # Backend API
  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    container_name: galaxy_api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      SUPABASE_URL: http://rest:3000
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGRES_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/galaxy_maps
      LRS_ENDPOINT: http://sql-lrs:8080
      LRS_API_KEY: ${LRS_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SMTP_HOST: mailpit
      SMTP_PORT: 1025
    depends_on:
      - postgres
      - auth
      - rest
      - storage
      - sql-lrs
    networks:
      - galaxy_network

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: galaxy_frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - auth
      - storage
      - realtime
    networks:
      - galaxy_network
    volumes:
      - ./docker/frontend/ssl:/etc/nginx/ssl:ro # For HTTPS

volumes:
  postgres_data:
  storage_data:

networks:
  galaxy_network:
    driver: bridge
```

---

## Development Workflow

### Local Development

```bash
# Clone and checkout branch
git clone https://github.com/yourusername/galaxy-maps-v2.git
cd galaxy-maps-v2
git checkout self-hosted-v3

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start infrastructure only (for frontend dev)
docker compose up postgres auth rest realtime kong minio sql-lrs mailpit -d

# Run frontend in dev mode
npm run dev

# Run API in dev mode (in another terminal)
cd api
npm run dev

# Run full stack
docker compose up
```

### Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# API tests
cd api
npm test
```

---

## Migration Path for Existing Users

While V3 is built from scratch, we can provide a migration tool:

```bash
scripts/migrate-from-firebase.sh
```

This script would:
1. Export Firestore data
2. Transform to PostgreSQL format
3. Import into V3 database
4. Verify data integrity

---

## Success Criteria

### Week 12 Deliverables:

✅ **Single Command Deployment**
```bash
./scripts/quickstart.sh
# Galaxy Maps running at http://localhost
```

✅ **Complete Feature Parity**
- User registration/login
- Course creation and editing
- Student progress tracking
- Cohort management
- File uploads
- Real-time updates
- Email notifications
- AI-powered galaxy generation
- xAPI/LRS tracking

✅ **Production Ready**
- All services containerized
- Database migrations automated
- Backups automated
- Monitoring configured
- SSL/HTTPS support
- Security hardened

✅ **Documentation Complete**
- Self-hosting guide
- Deployment guide
- API reference
- Troubleshooting guide
- Video walkthrough

✅ **Performance Benchmarks**
- Page load < 2 seconds
- API response < 200ms
- Real-time updates < 100ms latency
- Handles 100+ concurrent users

---

## Risk Mitigation

### Potential Challenges:

1. **Real-time complexity**: Supabase Realtime might not perfectly match Firebase
   - **Mitigation**: Extensive testing, fallback to polling if needed

2. **Storage migration**: Migrating from Firebase Storage to Supabase Storage
   - **Mitigation**: Similar API patterns, good documentation, comprehensive testing

3. **Cloud Functions to Express**: Large refactoring effort
   - **Mitigation**: Incremental porting, maintain function parity

4. **Performance**: PostgreSQL vs Firestore performance characteristics
   - **Mitigation**: Proper indexing, query optimization, caching layer

5. **Docker complexity for end users**: Not all users are Docker-savvy
   - **Mitigation**: Excellent documentation, quick-start script, video tutorials

---

## Post-Release Roadmap (V3.1+)

1. **Kubernetes Support** - For larger deployments
2. **Multi-tenancy** - Isolated instances per organization
3. **Horizontal Scaling** - Load balancing, read replicas
4. **Monitoring Stack** - Prometheus + Grafana
5. **Backup UI** - Web interface for backups/restores
6. **Admin Panel** - System configuration UI
7. **Plugin System** - Extensibility for custom features

---

## Conclusion

This staged approach gives you:

✅ **Clear path forward** - 12-week timeline with weekly milestones
✅ **Incremental progress** - Each stage delivers working functionality
✅ **Low risk** - Work on separate branch, maintain V2
✅ **Production ready** - Complete, tested, documented
✅ **User-friendly** - `docker compose up` and it works

The self-hosted V3 will empower users to run Galaxy Maps on their own infrastructure, giving them full control, data sovereignty, and zero dependency on Firebase.

**Ready to start?** Begin with Stage 0 - create the branch and directory structure. Each week builds on the previous, and by Week 12, you'll have a fully self-hosted Galaxy Maps platform! 🚀
