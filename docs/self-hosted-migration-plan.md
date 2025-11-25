# Galaxy Maps Self-Hosted Infrastructure Migration Analysis

## Executive Summary

Based on my analysis of the Galaxy Maps codebase and current Firebase infrastructure, I've identified comprehensive self-hosted alternatives that can enable a fully containerized, self-hosted deployment. This report provides recommended solutions for each infrastructure component with implementation considerations.

---

## Current Firebase Dependencies

### Core Services Identified:
1. **Firebase Auth** - User authentication, email verification, password reset
2. **Firestore** - Primary NoSQL document database
3. **Realtime Database** - User presence system, online/offline status
4. **Cloud Functions** - 50+ serverless functions for business logic
5. **Cloud Storage** - File uploads (avatars, course images)
6. **Email Service** - Automated notifications (Nodemailer via Cloud Functions)
7. **xAPI/LRS** - Learning Record Store (currently external: Veracity LRS)

---

## Recommended Self-Hosted Stack

### 🏆 Primary Recommendation: **Supabase**

**Why Supabase?**
- **Most complete Firebase replacement** with minimal code changes
- Built on PostgreSQL (production-ready, not SQLite)
- Native real-time subscriptions via WebSockets
- Integrated authentication with JWT
- S3-compatible storage built-in
- PostgreSQL Edge Functions (Deno-based)
- **Fully open-source and self-hostable**
- Strong community and active development

### Infrastructure Component Breakdown:

---

## 1. Database Solution

### 🥇 **Recommended: Supabase (PostgreSQL)**

**Pros:**
- Production-grade PostgreSQL database
- Native real-time subscriptions (replaces both Firestore + Realtime DB)
- Advanced querying with full SQL support
- Row-level security policies
- Automatic API generation (REST + GraphQL)
- Handles billions of rows efficiently

**Migration Considerations:**
- Firestore's document model → PostgreSQL relational tables
- Need to design normalized schema for courses, users, cohorts
- Firestore subcollections → Foreign key relationships
- Real-time listeners work similarly (Postgres logical replication)

**Alternative: Appwrite**
- Also uses PostgreSQL/MariaDB backend
- Simpler than Supabase but less SQL flexibility
- Better for teams avoiding direct SQL

---

## 2. Authentication Solution

### 🥇 **Recommended: Supabase Auth (GoTrue)**

**Pros:**
- Drop-in replacement for Firebase Auth
- Email/password, magic links, OAuth providers
- JWT-based authentication
- Email verification built-in
- Integrated with Supabase database (user management in PostgreSQL)
- Row-level security policies

**Current Galaxy Maps Auth Features:**
- ✅ Email/password authentication
- ✅ Email verification
- ✅ Password reset
- ✅ Admin role management
- ✅ Custom user profiles

**Migration Path:**
- Replace Firebase Auth SDK with Supabase Auth SDK
- User table migration: Firebase Auth → Supabase `auth.users`
- Keep existing profile system in `people` collection → `people` table

**Alternative: Appwrite Auth**
- Similar feature set
- SDKs for multiple languages
- Built-in session management

---

## 3. Real-Time Database (Presence System)

### 🥇 **Recommended: Supabase Realtime**

**Current Usage:**
- User online/offline status tracking (`/src/presence/index.ts`)
- Real-time status updates across clients

**Supabase Solution:**
- **Realtime Presence API** - Built specifically for this use case
- Broadcast channels for real-time messaging
- PostgreSQL Change Data Capture (CDC) for data updates
- WebSocket-based, similar to Firebase Realtime Database

**Implementation:**
```javascript
// Current Firebase approach
firebase.database().ref('/status/' + uid)

// Supabase equivalent
const channel = supabase.channel('online-users')
channel.on('presence', { event: 'sync' }, () => {
  const presenceState = channel.presenceState()
})
```

**Alternative: Redis + Socket.io**
- More flexible but requires custom implementation
- Better for complex real-time features
- Higher maintenance overhead

---

## 4. Cloud Functions / Serverless Backend

### 🥇 **Recommended: Supabase Edge Functions + Node.js API**

**Current Functions Count:** 50+ Cloud Functions including:
- Course management (20+ functions)
- User management (10+ functions)
- Activity tracking (5+ functions)
- Email notifications (10+ functions)
- AI/OpenAI integration (10+ functions)

**Supabase Approach:**
- **Edge Functions (Deno)** - For simple, lightweight functions
- **Separate Node.js API container** - For complex business logic, OpenAI integration

**Why Hybrid Approach:**
- Edge Functions are Deno-based (not Node.js) → Limited npm package support
- Your existing OpenAI, Nodemailer code needs Node.js
- Solution: Run Node.js Express/Fastify API as separate container

**Architecture:**
```
Docker Compose:
├── Supabase Stack (Auth, DB, Storage, Edge Functions)
├── Node.js API Container (Complex business logic)
├── LRS Container (SQL LRS)
├── Email Container (docker-mailserver)
└── MinIO Container (Object storage)
```

**Alternative: OpenFaaS**
- Full serverless framework on Docker/Kubernetes
- Supports Node.js functions natively
- Auto-scaling, metrics, templates
- **Recommended if you want true serverless experience**

**Alternative: Simple Express.js API**
- Convert all Cloud Functions to REST endpoints
- Easier migration, familiar stack
- Run as single container

---

## 5. Object Storage (File Uploads)

### 🥇 **Recommended: MinIO**

**Pros:**
- AWS S3 API compatible
- High performance, production-ready
- Native Kubernetes support
- Enterprise features in open-source version
- Excellent web UI for management
- Single binary, Docker-ready

**Current Storage Needs:**
- User avatars
- Course/galaxy images
- AI-generated images
- Student submissions

**Integration:**
- Supabase Storage uses S3-compatible backends
- Can configure Supabase to use MinIO
- Or use MinIO directly via AWS S3 SDK

**Alternative: SeaweedFS**
- Better for millions of small files
- O(1) disk seeks
- More complex setup
- **Choose if you expect massive file counts**

**Alternative: Supabase Storage (Built-in)**
- Simplest option if using Supabase
- S3-compatible API
- Integrated authentication
- Uses PostgreSQL for metadata

---

## 6. Email Service (SMTP)

### 🥇 **Recommended: docker-mailserver**

**Pros:**
- Production-ready, fully-featured
- SMTP, IMAP, Anti-spam, Anti-virus
- Single Docker container
- Most popular solution (13k+ GitHub stars)
- Excellent documentation

**Current Email Features:**
- Course notifications
- Cohort invitations
- Submission notifications
- Help request alerts
- Email verification

**Integration:**
- Your existing Nodemailer code works as-is
- Just update SMTP configuration
- All emails stay within your infrastructure

**Alternative: Mailu**
- Web UI for email management
- Docker Compose based
- Full webmail interface
- **Choose if users need web email access**

**Alternative: Postal**
- Designed for transactional emails (like SendGrid)
- Web UI, API, SMTP
- **Best for application emails, not full mail server**

---

## 7. Learning Record Store (LRS)

### 🥇 **Recommended: SQL LRS** ✅ (Your suggestion confirmed!)

**Pros:**
- ✅ Open-source (Apache 2.0)
- ✅ Docker container available
- ✅ PostgreSQL or SQLite backend
- ✅ Full xAPI specification support
- ✅ Direct SQL queries for analytics
- ✅ Integrates with BI tools (Power BI, Tableau, Superset)
- ✅ Lightweight, production-ready

**Current LRS Usage:**
- Mission start/complete tracking
- Activity statements (xAPI)
- Student progression analytics
- Time tracking

**Integration:**
```javascript
// Minimal changes to existing xAPI code
// Just update LRS endpoint
const lrsEndpoint = process.env.LRS_ENDPOINT // Internal container URL
```

**Alternative: Learning Locker**
- More features (dashboards, visualizations)
- Heavier resource requirements
- MongoDB-based (another database to manage)
- **Overkill for Galaxy Maps' needs**

**Alternative: ADL LRS**
- Official ADL implementation
- Docker-based
- Simpler than Learning Locker
- **Good backup option if SQL LRS doesn't fit**

---

## 8. AI/OpenAI Integration

**No Change Required** ✅
- Keep existing OpenAI API integration
- Runs in Node.js API container
- All current features maintained:
  - Galaxy generation
  - Mission instruction generation
  - Content refinement
  - Image generation

---

## Recommended Docker Compose Architecture

```yaml
version: '3.8'

services:
  # Supabase Stack (7 containers)
  postgres:
    image: supabase/postgres:latest
    volumes:
      - postgres-data:/var/lib/postgresql/data

  auth:
    image: supabase/gotrue:latest
    depends_on:
      - postgres

  rest:
    image: postgrest/postgrest:latest
    depends_on:
      - postgres

  realtime:
    image: supabase/realtime:latest
    depends_on:
      - postgres

  storage:
    image: supabase/storage-api:latest
    depends_on:
      - postgres
      - minio

  functions:
    image: supabase/edge-runtime:latest

  kong:
    image: kong:latest # API Gateway

  # Object Storage
  minio:
    image: minio/minio:latest
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

  # Email Server
  mailserver:
    image: docker-mailserver/docker-mailserver:latest
    volumes:
      - mail-data:/var/mail

  # Learning Record Store
  sql-lrs:
    image: yetanalytics/lrsql:latest
    environment:
      - LRSQL_DB_TYPE=postgres
    depends_on:
      - postgres

  # Node.js API (Your business logic)
  api:
    build: ./api
    environment:
      - SUPABASE_URL=http://kong:8000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LRS_ENDPOINT=http://sql-lrs:8080
    depends_on:
      - postgres
      - auth
      - sql-lrs

  # Vue.js Frontend
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres-data:
  minio-data:
  mail-data:
```

---

## Migration Complexity Assessment

### Low Complexity:
- ✅ **LRS** - Change endpoint URL only
- ✅ **AI Integration** - No changes needed
- ✅ **Email** - Update SMTP config only

### Medium Complexity:
- 🟡 **Storage** - Swap Firebase Storage SDK for S3 SDK
- 🟡 **Real-time Presence** - Rewrite presence logic for Supabase Realtime
- 🟡 **Authentication** - Replace Firebase Auth SDK, migrate user data

### High Complexity:
- 🔴 **Database Migration** - Redesign Firestore document model → PostgreSQL schema
- 🔴 **Cloud Functions** - Refactor to REST API or Edge Functions
- 🔴 **Piniafire Integration** - Replace Firestore bindings with Supabase bindings

---

## Data Migration Strategy

### Phase 1: Schema Design
1. Map Firestore collections → PostgreSQL tables
2. Design foreign key relationships
3. Plan indexes for performance

### Phase 2: Historical Data Migration
```javascript
// Example: Courses collection
const courses = await db.collection('courses').get()
courses.forEach(async (doc) => {
  await supabase.from('courses').insert({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().createdAt?.toDate()
  })
})
```

### Phase 3: Real-time Listener Migration
```javascript
// Firestore
db.collection('courses').onSnapshot(snapshot => {
  // handle changes
})

// Supabase
supabase
  .channel('courses-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'courses'
  }, payload => {
    // handle changes
  })
  .subscribe()
```

---

## Cost Analysis: Firebase vs Self-Hosted

### Firebase Estimated Monthly Cost (Medium Usage):
- **Firestore:** $50-200/month (reads, writes, storage)
- **Auth:** $0-50/month (included up to 50k users)
- **Cloud Functions:** $100-500/month (compute time)
- **Storage:** $25-100/month (file storage + bandwidth)
- **Total:** **~$175-850/month**

### Self-Hosted Infrastructure Cost:
- **VPS/Server:** $40-200/month (8GB RAM, 4 vCPU, 200GB storage)
- **Maintenance:** Developer time (1-2 days/month setup, ongoing monitoring)
- **Total:** **~$40-200/month** + developer time

**Break-even:** Self-hosted becomes cost-effective with moderate usage, especially valuable for data sovereignty and no vendor lock-in.

---

## Implementation Timeline Estimate

### Minimal Viable Migration (3-4 weeks):
- **Week 1:** Set up Docker infrastructure, Supabase, MinIO, SQL LRS
- **Week 2:** Database schema design, data migration scripts
- **Week 3:** Migrate authentication, convert Cloud Functions to API
- **Week 4:** Frontend integration, testing, deployment

### Production-Ready Migration (2-3 months):
- **Month 1:** Infrastructure, testing, security hardening
- **Month 2:** Feature parity, performance optimization
- **Month 3:** Beta testing, rollback plan, production cutover

---

## Security Considerations

### Required Security Measures:
1. **TLS/SSL Certificates** - Let's Encrypt for HTTPS
2. **Network Isolation** - Docker network segmentation
3. **Database Encryption** - PostgreSQL encryption at rest
4. **Secrets Management** - Docker secrets or Vault
5. **Backup Strategy** - Automated PostgreSQL backups
6. **Rate Limiting** - API gateway (Kong/Traefik)
7. **Firewall Rules** - Restrict external access to necessary ports

---

## Alternative Stack: Simpler Approach

If Supabase feels too complex, consider:

### **PocketBase + MinIO + SQL LRS + docker-mailserver**

**PocketBase Advantages:**
- Single binary (~50MB)
- Built-in admin UI
- SQLite database (file-based)
- Real-time subscriptions
- Authentication included
- **Faster to set up (~1 hour)**

**Trade-offs:**
- SQLite not ideal for high concurrency
- Less scalable than PostgreSQL
- Smaller ecosystem than Supabase

**Best for:** Small-medium deployments (< 1000 concurrent users)

---

## Final Recommendations

### 🏆 **Recommended Stack (Production-Grade):**

| Component | Solution | Why |
|-----------|----------|-----|
| **Primary Database** | Supabase (PostgreSQL) | Production-ready, real-time, full SQL |
| **Authentication** | Supabase Auth | Integrated, JWT-based, feature-complete |
| **Real-time** | Supabase Realtime | Native presence API, WebSocket-based |
| **Serverless Functions** | Node.js API Container | Best for existing Cloud Functions code |
| **Object Storage** | MinIO | S3-compatible, production-ready |
| **Email** | docker-mailserver | Most popular, production-ready |
| **LRS** | SQL LRS ✅ | Your suggestion - perfect fit! |
| **Frontend** | Existing Vue.js | Minimal changes needed |

### 🥈 **Alternative Stack (Faster Setup):**

| Component | Solution |
|-----------|----------|
| **All-in-One Backend** | PocketBase |
| **Object Storage** | MinIO |
| **Email** | Mailu |
| **LRS** | SQL LRS |

### 📋 **Next Steps:**

1. **Prototype Environment** - Set up Docker Compose with recommended stack
2. **Schema Migration** - Design PostgreSQL schema for Firestore data
3. **API Development** - Convert Cloud Functions to REST endpoints
4. **Testing** - Parallel run self-hosted + Firebase for validation
5. **Documentation** - Create deployment guide for end users
6. **Packaging** - Build final Docker Compose template + .env.example

---

## Conclusion

Your instinct about **SQL LRS** was spot-on - it's the perfect fit for the LRS component! Combined with **Supabase** as the Firebase replacement, you'll have a powerful, fully self-hosted Galaxy Maps platform that users can deploy with a single `docker-compose up` command.

The migration is **absolutely feasible** and will give you:
- ✅ Complete data sovereignty
- ✅ No vendor lock-in
- ✅ Predictable costs
- ✅ Easier compliance (GDPR, FERPA for education)
- ✅ Customization freedom

Would you like me to create a proof-of-concept Docker Compose setup to test this stack, or help with any specific component migration?
