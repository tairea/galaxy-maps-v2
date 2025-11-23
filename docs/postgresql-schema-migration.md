# Galaxy Maps PostgreSQL Schema Migration Guide

## Overview

This document outlines the complete PostgreSQL schema design for migrating Galaxy Maps from Firebase Firestore to a self-hosted PostgreSQL database (via Supabase). The schema normalizes Firestore's nested document structure into relational tables with proper foreign keys, indexes, and constraints.

---

## Table of Contents

1. [Schema Design Philosophy](#schema-design-philosophy)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Complete SQL Schema](#complete-sql-schema)
4. [Table Descriptions](#table-descriptions)
5. [Migration Strategy](#migration-strategy)
6. [Data Migration Scripts](#data-migration-scripts)
7. [Performance Optimizations](#performance-optimizations)
8. [Supabase Integration](#supabase-integration)

---

## Schema Design Philosophy

### Key Decisions

1. **Denormalization Strategy**: Firestore's embedded documents (like `image`, `contentBy`, `mappedBy`) are extracted into separate JSONB columns where they're purely metadata, avoiding over-normalization.

2. **Person Progress Tracking**: Firestore stores student progress nested within `people/{personId}/{courseId}/{topicId}/tasks/{taskId}`. PostgreSQL uses dedicated junction tables (`person_topics`, `person_tasks`) for better querying.

3. **Subcollections to Tables**: Firestore subcollections (`map-nodes`, `map-edges`, `topics`, `requestsForHelp`, `submissionsForReview`) become separate tables with foreign keys.

4. **Array Types**: Firestore arrays (`assignedCourses`, `students`, `teachers`, `prerequisites`) use PostgreSQL arrays or junction tables depending on relationship complexity.

5. **Timestamps**: Firestore timestamps convert to PostgreSQL `TIMESTAMPTZ` for timezone awareness.

6. **UUIDs vs Strings**: Maintain Firestore's string IDs for easier migration, but could migrate to UUIDs later for performance.

---

## Entity Relationship Diagram

```
┌─────────────┐
│   people    │──┐
└─────────────┘  │
       │         │
       │ 1:N     │ N:M (via person_courses)
       │         │
┌──────▼──────┐  │
│person_topics│  │
└─────────────┘  │
       │         │
       │ 1:N     │
       │         │
┌──────▼──────┐  │
│person_tasks │  │
└─────────────┘  │
                 │
       ┌─────────▼──────┐
       │    courses     │
       └────────────────┘
              │
         ┌────┼────┬─────────┬──────────┐
         │    │    │         │          │
      1:N  1:N  1:N       1:N        1:N
         │    │    │         │          │
    ┌────▼┐ ┌─▼──┐ ┌────────▼─┐  ┌────▼─────────┐
    │topics│ │edges│ │map_nodes │  │help_requests │
    └──────┘ └────┘ └──────────┘  └──────────────┘
       │
      1:N                          ┌──────────────┐
       │                           │ submissions  │
    ┌──▼──┐                        └──────────────┘
    │tasks│
    └─────┘

┌─────────┐       ┌──────────────┐
│ cohorts │──N:M──│organisations │
└─────────┘       └──────────────┘
     │
    N:M (via cohort_students/cohort_teachers)
     │
┌────▼────┐
│ people  │
└─────────┘
```

---

## Complete SQL Schema

### Core Tables

#### 1. People (Users)

```sql
-- Core user/person table
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  discord TEXT,
  nsn TEXT,
  parent_email TEXT,
  inviter TEXT,
  image JSONB, -- {name: string, url: string}
  xp_points_total INTEGER DEFAULT 0,
  registered TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_display_name ON people(display_name);
CREATE INDEX idx_people_registered ON people(registered);

-- Row Level Security (RLS) for Supabase
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY people_select_own ON people
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY people_update_own ON people
  FOR UPDATE USING (auth.uid() = id);

-- Admins can see all people
CREATE POLICY people_select_admin ON people
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

#### 2. Courses (Galaxy Maps)

```sql
-- Core courses/galaxy maps table
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  public BOOLEAN DEFAULT FALSE,
  owner_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  content_by JSONB, -- {name: string, personId: string}
  mapped_by JSONB, -- {name: string, personId: string}
  image JSONB, -- {name: string, url: string}
  topic_total INTEGER DEFAULT 0,
  task_total INTEGER DEFAULT 0,
  collaborator_ids TEXT[], -- Array of person IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_owner_id ON courses(owner_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_public ON courses(public);
CREATE INDEX idx_courses_collaborators ON courses USING GIN(collaborator_ids);
CREATE INDEX idx_courses_created_at ON courses(created_at);

-- Full-text search on title and description
CREATE INDEX idx_courses_search ON courses USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public published courses are visible to all
CREATE POLICY courses_select_public ON courses
  FOR SELECT USING (public = TRUE AND status = 'published');

-- Owners can see their own courses
CREATE POLICY courses_select_own ON courses
  FOR SELECT USING (auth.uid() = owner_id);

-- Collaborators can see courses they collaborate on
CREATE POLICY courses_select_collaborator ON courses
  FOR SELECT USING (auth.uid() = ANY(collaborator_ids));

-- Owners can update their own courses
CREATE POLICY courses_update_own ON courses
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admins can see all courses
CREATE POLICY courses_select_admin ON courses
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

#### 3. Topics (Star Systems)

```sql
-- Topics/star systems within courses
-- Note: This mirrors courses.topics subcollection AND courses.map-nodes
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT,
  connected_edge TEXT,
  prerequisites TEXT[], -- Array of topic IDs
  task_total INTEGER DEFAULT 0,
  x NUMERIC,
  y NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, id)
);

-- Indexes
CREATE INDEX idx_topics_course_id ON topics(course_id);
CREATE INDEX idx_topics_label ON topics(label);
CREATE INDEX idx_topics_created_at ON topics(created_at);

-- GIN index for prerequisite array searches
CREATE INDEX idx_topics_prerequisites ON topics USING GIN(prerequisites);

-- RLS Policies (inherit from courses)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY topics_select ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = topics.course_id
      AND (
        courses.public = TRUE AND courses.status = 'published'
        OR courses.owner_id = auth.uid()
        OR auth.uid() = ANY(courses.collaborator_ids)
        OR auth.jwt() ->> 'role' = 'admin'
      )
    )
  );
```

#### 4. Tasks (Missions)

```sql
-- Tasks/missions within topics
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  mission_instructions_html TEXT, -- Rich HTML content
  duration TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  slides TEXT, -- URL or identifier
  video TEXT, -- URL or identifier
  submission_required BOOLEAN DEFAULT FALSE,
  submission_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, topic_id, id)
);

-- Indexes
CREATE INDEX idx_tasks_course_id ON tasks(course_id);
CREATE INDEX idx_tasks_topic_id ON tasks(topic_id);
CREATE INDEX idx_tasks_order_index ON tasks(order_index);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Composite index for topic-specific task queries
CREATE INDEX idx_tasks_topic_order ON tasks(topic_id, order_index);

-- RLS Policies (inherit from courses)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = tasks.course_id
      AND (
        courses.public = TRUE AND courses.status = 'published'
        OR courses.owner_id = auth.uid()
        OR auth.uid() = ANY(courses.collaborator_ids)
        OR auth.jwt() ->> 'role' = 'admin'
      )
    )
  );
```

#### 5. Map Edges (Galaxy Connections)

```sql
-- Visual graph edges connecting topics
CREATE TABLE map_edges (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  from_topic_id TEXT NOT NULL,
  to_topic_id TEXT NOT NULL,
  dashes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (course_id, from_topic_id) REFERENCES topics(course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, to_topic_id) REFERENCES topics(course_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_map_edges_course_id ON map_edges(course_id);
CREATE INDEX idx_map_edges_from ON map_edges(from_topic_id);
CREATE INDEX idx_map_edges_to ON map_edges(to_topic_id);

-- Prevent duplicate edges
CREATE UNIQUE INDEX idx_map_edges_unique ON map_edges(course_id, from_topic_id, to_topic_id);

-- RLS Policies
ALTER TABLE map_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY map_edges_select ON map_edges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = map_edges.course_id
      AND (
        courses.public = TRUE AND courses.status = 'published'
        OR courses.owner_id = auth.uid()
        OR auth.uid() = ANY(courses.collaborator_ids)
        OR auth.jwt() ->> 'role' = 'admin'
      )
    )
  );
```

### Student Progress Tables

#### 6. Person Topics (Student Topic Progress)

```sql
-- Tracks student progress on topics
-- Replaces Firestore: people/{personId}/{courseId}/{topicId}
CREATE TABLE person_topics (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'active', 'completed')) DEFAULT 'not_started',
  color TEXT,
  label TEXT,
  group_name TEXT,
  task_total INTEGER DEFAULT 0,
  x NUMERIC,
  y NUMERIC,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (person_id, course_id, topic_id),
  FOREIGN KEY (course_id, topic_id) REFERENCES topics(course_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_person_topics_person_id ON person_topics(person_id);
CREATE INDEX idx_person_topics_course_id ON person_topics(course_id);
CREATE INDEX idx_person_topics_status ON person_topics(status);
CREATE INDEX idx_person_topics_person_course ON person_topics(person_id, course_id);

-- RLS Policies
ALTER TABLE person_topics ENABLE ROW LEVEL SECURITY;

-- Students can see their own progress
CREATE POLICY person_topics_select_own ON person_topics
  FOR SELECT USING (auth.uid() = person_id);

-- Teachers can see student progress in their cohorts
CREATE POLICY person_topics_select_teacher ON person_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_teachers ct
      JOIN cohort_courses cc ON ct.cohort_id = cc.cohort_id
      WHERE ct.person_id = auth.uid()
      AND cc.course_id = person_topics.course_id
    )
  );
```

#### 7. Person Tasks (Student Task Progress)

```sql
-- Tracks student progress on tasks
-- Replaces Firestore: people/{personId}/{courseId}/{topicId}/tasks/{taskId}
CREATE TABLE person_tasks (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'active', 'completed')) DEFAULT 'not_started',
  color TEXT,
  title TEXT,
  description TEXT,
  duration TEXT,
  order_index INTEGER,
  slides TEXT,
  video TEXT,
  submission_required BOOLEAN,
  submission_instructions TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (person_id, course_id, topic_id, task_id),
  FOREIGN KEY (course_id, topic_id, task_id) REFERENCES tasks(course_id, topic_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_person_tasks_person_id ON person_tasks(person_id);
CREATE INDEX idx_person_tasks_course_id ON person_tasks(course_id);
CREATE INDEX idx_person_tasks_status ON person_tasks(status);
CREATE INDEX idx_person_tasks_person_topic ON person_tasks(person_id, course_id, topic_id);
CREATE INDEX idx_person_tasks_completed_at ON person_tasks(completed_at);

-- RLS Policies
ALTER TABLE person_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY person_tasks_select_own ON person_tasks
  FOR SELECT USING (auth.uid() = person_id);

CREATE POLICY person_tasks_select_teacher ON person_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_teachers ct
      JOIN cohort_courses cc ON ct.cohort_id = cc.cohort_id
      WHERE ct.person_id = auth.uid()
      AND cc.course_id = person_tasks.course_id
    )
  );
```

### Assignment & Cohort Tables

#### 8. Person Courses (Course Assignments)

```sql
-- Tracks which courses are assigned/completed by students
-- Replaces: people.assignedCourses and people.completedCourses arrays
CREATE TABLE person_courses (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,

  PRIMARY KEY (person_id, course_id)
);

-- Indexes
CREATE INDEX idx_person_courses_person_id ON person_courses(person_id);
CREATE INDEX idx_person_courses_course_id ON person_courses(course_id);
CREATE INDEX idx_person_courses_completed ON person_courses(is_completed);

-- RLS Policies
ALTER TABLE person_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY person_courses_select_own ON person_courses
  FOR SELECT USING (auth.uid() = person_id);
```

#### 9. Organisations

```sql
-- Organisations (schools, institutions)
CREATE TABLE organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image JSONB, -- {name: string, url: string}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organisations_name ON organisations(name);

-- RLS Policies
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY organisations_select ON organisations
  FOR SELECT TO authenticated USING (true);
```

#### 10. Cohorts (Squads)

```sql
-- Cohorts/squads of students
CREATE TABLE cohorts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organisation_id TEXT REFERENCES organisations(id) ON DELETE SET NULL,
  course_cohort BOOLEAN DEFAULT FALSE,
  image JSONB, -- {name: string, url: string}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cohorts_name ON cohorts(name);
CREATE INDEX idx_cohorts_organisation_id ON cohorts(organisation_id);

-- RLS Policies
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Members can see cohorts they belong to
CREATE POLICY cohorts_select_member ON cohorts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_students
      WHERE cohort_students.cohort_id = cohorts.id
      AND cohort_students.person_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM cohort_teachers
      WHERE cohort_teachers.cohort_id = cohorts.id
      AND cohort_teachers.person_id = auth.uid()
    )
  );
```

#### 11. Cohort Students (Many-to-Many)

```sql
-- Junction table: cohorts <-> students
CREATE TABLE cohort_students (
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (cohort_id, person_id)
);

-- Indexes
CREATE INDEX idx_cohort_students_cohort_id ON cohort_students(cohort_id);
CREATE INDEX idx_cohort_students_person_id ON cohort_students(person_id);

-- RLS Policies
ALTER TABLE cohort_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_students_select ON cohort_students
  FOR SELECT USING (
    auth.uid() = person_id
    OR EXISTS (
      SELECT 1 FROM cohort_teachers
      WHERE cohort_teachers.cohort_id = cohort_students.cohort_id
      AND cohort_teachers.person_id = auth.uid()
    )
  );
```

#### 12. Cohort Teachers (Many-to-Many)

```sql
-- Junction table: cohorts <-> teachers
CREATE TABLE cohort_teachers (
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (cohort_id, person_id)
);

-- Indexes
CREATE INDEX idx_cohort_teachers_cohort_id ON cohort_teachers(cohort_id);
CREATE INDEX idx_cohort_teachers_person_id ON cohort_teachers(person_id);

-- RLS Policies
ALTER TABLE cohort_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_teachers_select ON cohort_teachers
  FOR SELECT USING (
    auth.uid() = person_id
    OR EXISTS (
      SELECT 1 FROM cohort_teachers ct2
      WHERE ct2.cohort_id = cohort_teachers.cohort_id
      AND ct2.person_id = auth.uid()
    )
  );
```

#### 13. Cohort Courses (Many-to-Many)

```sql
-- Junction table: cohorts <-> courses
CREATE TABLE cohort_courses (
  cohort_id TEXT NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (cohort_id, course_id)
);

-- Indexes
CREATE INDEX idx_cohort_courses_cohort_id ON cohort_courses(cohort_id);
CREATE INDEX idx_cohort_courses_course_id ON cohort_courses(course_id);

-- RLS Policies
ALTER TABLE cohort_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY cohort_courses_select ON cohort_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_students
      WHERE cohort_students.cohort_id = cohort_courses.cohort_id
      AND cohort_students.person_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM cohort_teachers
      WHERE cohort_teachers.cohort_id = cohort_courses.cohort_id
      AND cohort_teachers.person_id = auth.uid()
    )
  );
```

### Submissions & Help Requests

#### 14. Submissions for Review

```sql
-- Student task submissions
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id TEXT,
  task_id TEXT,
  student_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  submission_link TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')) DEFAULT 'pending',
  response_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  context_course JSONB, -- Snapshot of course data at submission time
  context_topic JSONB,  -- Snapshot of topic data at submission time
  context_task JSONB,   -- Snapshot of task data at submission time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (course_id, topic_id, task_id) REFERENCES tasks(course_id, topic_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_submissions_course_id ON submissions(course_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_teacher_id ON submissions(teacher_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- RLS Policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Students can see their own submissions
CREATE POLICY submissions_select_student ON submissions
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can see submissions in their cohorts
CREATE POLICY submissions_select_teacher ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_teachers ct
      JOIN cohort_courses cc ON ct.cohort_id = cc.cohort_id
      WHERE ct.person_id = auth.uid()
      AND cc.course_id = submissions.course_id
    )
  );
```

#### 15. Help Requests

```sql
-- Student help requests
CREATE TABLE help_requests (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id TEXT,
  task_id TEXT,
  student_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  responder_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'responded', 'resolved')) DEFAULT 'pending',
  response_message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  context_course JSONB, -- Snapshot of course data
  context_topic JSONB,  -- Snapshot of topic data
  context_task JSONB,   -- Snapshot of task data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (course_id, topic_id, task_id) REFERENCES tasks(course_id, topic_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_help_requests_course_id ON help_requests(course_id);
CREATE INDEX idx_help_requests_student_id ON help_requests(student_id);
CREATE INDEX idx_help_requests_responder_id ON help_requests(responder_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_submitted_at ON help_requests(submitted_at);

-- RLS Policies
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Students can see their own requests
CREATE POLICY help_requests_select_student ON help_requests
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can see requests in their cohorts
CREATE POLICY help_requests_select_teacher ON help_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_teachers ct
      JOIN cohort_courses cc ON ct.cohort_id = cc.cohort_id
      WHERE ct.person_id = auth.uid()
      AND cc.course_id = help_requests.course_id
    )
  );
```

### Presence & Status Tables

#### 16. User Status (Presence)

```sql
-- User online/offline status for real-time presence
CREATE TABLE user_status (
  person_id TEXT PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  state TEXT CHECK (state IN ('online', 'offline')) DEFAULT 'offline',
  last_changed TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_status_state ON user_status(state);
CREATE INDEX idx_user_status_last_changed ON user_status(last_changed);

-- RLS Policies
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see who's online
CREATE POLICY user_status_select ON user_status
  FOR SELECT TO authenticated USING (true);

-- Users can update their own status
CREATE POLICY user_status_update_own ON user_status
  FOR UPDATE USING (auth.uid() = person_id);
```

---

## Table Descriptions

### Core Tables Summary

| Table | Purpose | Firestore Equivalent |
|-------|---------|---------------------|
| `people` | User profiles and metadata | `people/{personId}` |
| `courses` | Galaxy maps/courses | `courses/{courseId}` |
| `topics` | Star systems within courses | `courses/{courseId}/topics/{topicId}` + `map-nodes/{nodeId}` |
| `tasks` | Missions within topics | `courses/{courseId}/topics/{topicId}/tasks/{taskId}` |
| `map_edges` | Visual connections between topics | `courses/{courseId}/map-edges/{edgeId}` |
| `person_topics` | Student progress on topics | `people/{personId}/{courseId}/{topicId}` |
| `person_tasks` | Student progress on tasks | `people/{personId}/{courseId}/{topicId}/tasks/{taskId}` |
| `person_courses` | Course assignments | `people.assignedCourses[]` + `people.completedCourses[]` |
| `organisations` | Institutions/schools | `organisations/{orgId}` |
| `cohorts` | Student groups | `cohorts/{cohortId}` |
| `cohort_students` | Students in cohorts | `cohorts.students[]` |
| `cohort_teachers` | Teachers in cohorts | `cohorts.teachers[]` |
| `cohort_courses` | Courses in cohorts | `cohorts.courses[]` |
| `submissions` | Task submissions | `courses/{courseId}/submissionsForReview/{submissionId}` |
| `help_requests` | Student help requests | `courses/{courseId}/requestsForHelp/{requestId}` |
| `user_status` | Online presence | `status/{personId}` |

---

## Migration Strategy

### Phase 1: Schema Creation (Week 1)

1. **Create Database & Extensions**
```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
```

2. **Run DDL Scripts**
   - Execute all CREATE TABLE statements in order
   - Create indexes
   - Set up RLS policies

3. **Validate Schema**
   - Check foreign key constraints
   - Test RLS policies with test users

### Phase 2: Data Migration Scripts (Week 2)

#### Migration Script Structure

```javascript
// Example: Migrate People Collection
const migratePeople = async () => {
  const firestoreDb = admin.firestore();
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const peopleSnapshot = await firestoreDb.collection('people').get();

  const peopleData = peopleSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      display_name: data.displayName,
      discord: data.discord,
      nsn: data.nsn,
      parent_email: data.parentEmail,
      inviter: data.inviter,
      image: data.image ? JSON.stringify(data.image) : null,
      xp_points_total: data.xpPointsTotal || 0,
      registered: data.registered?.toDate() || new Date(),
    };
  });

  // Batch insert
  const { error } = await supabase
    .from('people')
    .insert(peopleData);

  if (error) throw error;

  console.log(`Migrated ${peopleData.length} people`);
};
```

### Phase 3: Complex Migrations (Week 2-3)

#### Migrate Nested Student Progress

```javascript
const migratePersonProgress = async () => {
  const firestoreDb = admin.firestore();
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const peopleSnapshot = await firestoreDb.collection('people').get();

  for (const personDoc of peopleSnapshot.docs) {
    const personId = personDoc.id;
    const personData = personDoc.data();

    // Migrate assigned/completed courses
    if (personData.assignedCourses) {
      const courseAssignments = personData.assignedCourses.map(courseId => ({
        person_id: personId,
        course_id: courseId,
        assigned_at: new Date(),
      }));

      await supabase.from('person_courses').insert(courseAssignments);
    }

    // Migrate nested course progress: people/{personId}/{courseId}/{topicId}
    // This requires iterating through subcollections
    const courseIds = Object.keys(personData).filter(
      key => !['email', 'firstName', 'lastName', /* ... */].includes(key)
    );

    for (const courseId of courseIds) {
      const courseProgress = personData[courseId];

      if (typeof courseProgress === 'object') {
        // Process topics
        for (const [topicId, topicData] of Object.entries(courseProgress)) {
          if (typeof topicData === 'object' && topicData.tasks) {
            // Insert person_topics
            await supabase.from('person_topics').insert({
              person_id: personId,
              course_id: courseId,
              topic_id: topicId,
              status: topicData.topicStatus || 'not_started',
              color: topicData.color,
              label: topicData.label,
              task_total: topicData.taskTotal,
              x: topicData.x,
              y: topicData.y,
              started_at: topicData.topicStartedTimestamp?.toDate(),
              created_at: topicData.topicCreatedTimestamp?.toDate(),
            });

            // Insert person_tasks
            for (const [taskId, taskData] of Object.entries(topicData.tasks)) {
              await supabase.from('person_tasks').insert({
                person_id: personId,
                course_id: courseId,
                topic_id: topicId,
                task_id: taskId,
                status: taskData.taskStatus || 'not_started',
                color: taskData.color,
                title: taskData.title,
                description: taskData.description,
                duration: taskData.duration,
                order_index: taskData.orderIndex,
                started_at: taskData.taskStartedTimestamp?.toDate(),
                created_at: taskData.taskCreatedTimestamp?.toDate(),
              });
            }
          }
        }
      }
    }
  }

  console.log('Migrated person progress data');
};
```

#### Migrate Courses with Subcollections

```javascript
const migrateCourses = async () => {
  const firestoreDb = admin.firestore();
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const coursesSnapshot = await firestoreDb.collection('courses').get();

  for (const courseDoc of coursesSnapshot.docs) {
    const courseId = courseDoc.id;
    const courseData = courseDoc.data();

    // 1. Insert course
    const courseRow = {
      id: courseId,
      title: courseData.title,
      description: courseData.description,
      status: courseData.status,
      public: courseData.public,
      owner_id: courseData.owner?.id || courseData.mappedBy?.personId,
      content_by: courseData.contentBy ? JSON.stringify(courseData.contentBy) : null,
      mapped_by: courseData.mappedBy ? JSON.stringify(courseData.mappedBy) : null,
      image: courseData.image ? JSON.stringify(courseData.image) : null,
      topic_total: courseData.topicTotal || 0,
      collaborator_ids: courseData.collaboratorIds || [],
    };

    await supabase.from('courses').insert(courseRow);

    // 2. Migrate topics subcollection
    const topicsSnapshot = await courseDoc.ref.collection('topics').get();
    const topicsData = topicsSnapshot.docs.map(topicDoc => ({
      id: topicDoc.id,
      course_id: courseId,
      label: topicDoc.data().label,
      color: topicDoc.data().color,
      connected_edge: topicDoc.data().connectedEdge,
      prerequisites: topicDoc.data().prerequisites || [],
      task_total: topicDoc.data().taskTotal || 0,
      x: topicDoc.data().x,
      y: topicDoc.data().y,
      created_at: topicDoc.data().topicCreatedTimestamp?.toDate(),
    }));

    if (topicsData.length > 0) {
      await supabase.from('topics').insert(topicsData);
    }

    // 3. Migrate map-edges subcollection
    const edgesSnapshot = await courseDoc.ref.collection('map-edges').get();
    const edgesData = edgesSnapshot.docs.map(edgeDoc => ({
      id: edgeDoc.id,
      course_id: courseId,
      from_topic_id: edgeDoc.data().from,
      to_topic_id: edgeDoc.data().to,
      dashes: edgeDoc.data().dashes || false,
    }));

    if (edgesData.length > 0) {
      await supabase.from('map_edges').insert(edgesData);
    }

    // 4. Migrate tasks (nested under topics)
    for (const topicDoc of topicsSnapshot.docs) {
      const tasksSnapshot = await topicDoc.ref.collection('tasks').get();
      const tasksData = tasksSnapshot.docs.map(taskDoc => ({
        id: taskDoc.id,
        course_id: courseId,
        topic_id: topicDoc.id,
        title: taskDoc.data().title,
        description: taskDoc.data().description,
        mission_instructions_html: taskDoc.data().missionInstructionsHtmlString,
        duration: taskDoc.data().duration,
        color: taskDoc.data().color,
        order_index: taskDoc.data().orderIndex || 0,
        slides: taskDoc.data().slides,
        video: taskDoc.data().video,
        submission_required: taskDoc.data().submissionRequired || false,
        submission_instructions: taskDoc.data().submissionInstructions,
        created_at: taskDoc.data().taskCreatedTimestamp?.toDate(),
      }));

      if (tasksData.length > 0) {
        await supabase.from('tasks').insert(tasksData);
      }
    }

    // 5. Migrate submissionsForReview
    const submissionsSnapshot = await courseDoc.ref.collection('submissionsForReview').get();
    const submissionsData = submissionsSnapshot.docs.map(subDoc => ({
      id: subDoc.id,
      course_id: courseId,
      topic_id: subDoc.data().contextTopic?.id,
      task_id: subDoc.data().contextTask?.id,
      student_id: subDoc.data().studentId,
      teacher_id: subDoc.data().teacherId,
      submission_link: subDoc.data().submissionLink,
      status: subDoc.data().taskSubmissionStatus,
      response_message: subDoc.data().responseMessage,
      submitted_at: subDoc.data().taskSubmittedForReviewTimestamp?.toDate(),
      reviewed_at: subDoc.data().responseSubmittedTimestamp?.toDate(),
      context_course: JSON.stringify(subDoc.data().contextCourse),
      context_topic: JSON.stringify(subDoc.data().contextTopic),
      context_task: JSON.stringify(subDoc.data().contextTask),
    }));

    if (submissionsData.length > 0) {
      await supabase.from('submissions').insert(submissionsData);
    }

    // 6. Migrate requestsForHelp
    const requestsSnapshot = await courseDoc.ref.collection('requestsForHelp').get();
    const requestsData = requestsSnapshot.docs.map(reqDoc => ({
      id: reqDoc.id,
      course_id: courseId,
      topic_id: reqDoc.data().contextTopic?.id,
      task_id: reqDoc.data().contextTask?.id,
      student_id: reqDoc.data().personId,
      responder_id: reqDoc.data().responderPersonId,
      message: reqDoc.data().requestForHelpMessage,
      status: reqDoc.data().requestForHelpStatus,
      response_message: reqDoc.data().responseMessage,
      submitted_at: reqDoc.data().requestSubmittedTimestamp?.toDate(),
      responded_at: reqDoc.data().responseSubmittedTimestamp?.toDate(),
      context_course: JSON.stringify(reqDoc.data().contextCourse),
      context_topic: JSON.stringify(reqDoc.data().contextTopic),
      context_task: JSON.stringify(reqDoc.data().contextTask),
    }));

    if (requestsData.length > 0) {
      await supabase.from('help_requests').insert(requestsData);
    }
  }

  console.log('Migrated courses with subcollections');
};
```

#### Migrate Cohorts

```javascript
const migrateCohorts = async () => {
  const firestoreDb = admin.firestore();
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const cohortsSnapshot = await firestoreDb.collection('cohorts').get();

  for (const cohortDoc of cohortsSnapshot.docs) {
    const cohortId = cohortDoc.id;
    const cohortData = cohortDoc.data();

    // 1. Insert cohort
    await supabase.from('cohorts').insert({
      id: cohortId,
      name: cohortData.name,
      description: cohortData.description,
      organisation_id: cohortData.organisation,
      course_cohort: cohortData.courseCohort || false,
      image: cohortData.image ? JSON.stringify(cohortData.image) : null,
    });

    // 2. Insert cohort_students
    if (cohortData.students && cohortData.students.length > 0) {
      const studentMappings = cohortData.students.map(studentId => ({
        cohort_id: cohortId,
        person_id: studentId,
      }));

      await supabase.from('cohort_students').insert(studentMappings);
    }

    // 3. Insert cohort_teachers
    if (cohortData.teachers && cohortData.teachers.length > 0) {
      const teacherMappings = cohortData.teachers.map(teacherId => ({
        cohort_id: cohortId,
        person_id: teacherId,
      }));

      await supabase.from('cohort_teachers').insert(teacherMappings);
    }

    // 4. Insert cohort_courses
    if (cohortData.courses && cohortData.courses.length > 0) {
      const courseMappings = cohortData.courses.map(courseId => ({
        cohort_id: cohortId,
        course_id: courseId,
      }));

      await supabase.from('cohort_courses').insert(courseMappings);
    }
  }

  console.log('Migrated cohorts');
};
```

### Phase 4: Validation & Testing (Week 3-4)

1. **Data Integrity Checks**
```sql
-- Verify row counts match Firestore
SELECT 'people' as table_name, COUNT(*) as row_count FROM people
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'topics', COUNT(*) FROM topics
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'person_topics', COUNT(*) FROM person_topics
UNION ALL
SELECT 'person_tasks', COUNT(*) FROM person_tasks;

-- Check for orphaned records
SELECT t.* FROM topics t
LEFT JOIN courses c ON t.course_id = c.id
WHERE c.id IS NULL;

-- Verify foreign key relationships
SELECT COUNT(*) as orphaned_tasks
FROM tasks t
LEFT JOIN topics tp ON t.topic_id = tp.id AND t.course_id = tp.course_id
WHERE tp.id IS NULL;
```

2. **Sample Data Queries**
```sql
-- Get student's active courses with progress
SELECT
  c.title,
  COUNT(DISTINCT pt.topic_id) as topics_started,
  COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.topic_id END) as topics_completed,
  COUNT(DISTINCT pt2.task_id) as tasks_started,
  COUNT(DISTINCT CASE WHEN pt2.status = 'completed' THEN pt2.task_id END) as tasks_completed
FROM person_courses pc
JOIN courses c ON pc.course_id = c.id
LEFT JOIN person_topics pt ON pt.person_id = pc.person_id AND pt.course_id = pc.course_id
LEFT JOIN person_tasks pt2 ON pt2.person_id = pc.person_id AND pt2.course_id = pc.course_id
WHERE pc.person_id = 'USER_ID'
GROUP BY c.id, c.title;
```

---

## Performance Optimizations

### 1. Materialized Views for Analytics

```sql
-- Student course progress summary view
CREATE MATERIALIZED VIEW student_course_progress AS
SELECT
  pc.person_id,
  pc.course_id,
  c.title as course_title,
  COUNT(DISTINCT pt.topic_id) as topics_started,
  COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.topic_id END) as topics_completed,
  COUNT(DISTINCT pt2.task_id) as tasks_started,
  COUNT(DISTINCT CASE WHEN pt2.status = 'completed' THEN pt2.task_id END) as tasks_completed,
  MAX(pt2.updated_at) as last_activity
FROM person_courses pc
JOIN courses c ON pc.course_id = c.id
LEFT JOIN person_topics pt ON pt.person_id = pc.person_id AND pt.course_id = pc.course_id
LEFT JOIN person_tasks pt2 ON pt2.person_id = pc.person_id AND pt2.course_id = pc.course_id
GROUP BY pc.person_id, pc.course_id, c.title;

CREATE INDEX idx_mv_student_progress_person ON student_course_progress(person_id);
CREATE INDEX idx_mv_student_progress_course ON student_course_progress(course_id);

-- Refresh strategy (daily or on-demand)
REFRESH MATERIALIZED VIEW CONCURRENTLY student_course_progress;
```

### 2. Partitioning for Large Tables

```sql
-- Partition person_tasks by course_id if you have millions of records
CREATE TABLE person_tasks_partitioned (
  LIKE person_tasks INCLUDING ALL
) PARTITION BY HASH (course_id);

CREATE TABLE person_tasks_p1 PARTITION OF person_tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE person_tasks_p2 PARTITION OF person_tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE person_tasks_p3 PARTITION OF person_tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE person_tasks_p4 PARTITION OF person_tasks_partitioned
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

### 3. Database Functions for Common Queries

```sql
-- Function to get student progress on a course
CREATE OR REPLACE FUNCTION get_student_course_progress(
  p_person_id TEXT,
  p_course_id TEXT
)
RETURNS TABLE (
  topics_total INTEGER,
  topics_completed INTEGER,
  tasks_total INTEGER,
  tasks_completed INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM topics WHERE course_id = p_course_id)::INTEGER as topics_total,
    (SELECT COUNT(*) FROM person_topics
     WHERE person_id = p_person_id AND course_id = p_course_id AND status = 'completed')::INTEGER as topics_completed,
    (SELECT COUNT(*) FROM tasks WHERE course_id = p_course_id)::INTEGER as tasks_total,
    (SELECT COUNT(*) FROM person_tasks
     WHERE person_id = p_person_id AND course_id = p_course_id AND status = 'completed')::INTEGER as tasks_completed,
    CASE
      WHEN (SELECT COUNT(*) FROM tasks WHERE course_id = p_course_id) > 0 THEN
        ROUND(
          (SELECT COUNT(*) FROM person_tasks
           WHERE person_id = p_person_id AND course_id = p_course_id AND status = 'completed')::NUMERIC /
          (SELECT COUNT(*) FROM tasks WHERE course_id = p_course_id)::NUMERIC * 100,
          2
        )
      ELSE 0
    END as completion_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- Usage
SELECT * FROM get_student_course_progress('student123', 'course456');
```

### 4. Composite Indexes for Common Join Patterns

```sql
-- Optimize cohort-based queries
CREATE INDEX idx_cohort_students_courses ON cohort_students(person_id, cohort_id)
  INCLUDE (joined_at);

CREATE INDEX idx_cohort_courses_lookup ON cohort_courses(cohort_id, course_id)
  INCLUDE (assigned_at);

-- Optimize student progress queries
CREATE INDEX idx_person_tasks_progress ON person_tasks(person_id, course_id, status)
  INCLUDE (completed_at);
```

---

## Supabase Integration

### 1. Real-time Subscriptions Setup

```javascript
// Frontend: Subscribe to course updates
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listen to course changes
const courseSubscription = supabase
  .channel('courses-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'courses',
      filter: `id=eq.${courseId}`
    },
    (payload) => {
      console.log('Course updated:', payload.new);
      // Update Pinia store
      store.updateCourse(payload.new);
    }
  )
  .subscribe();

// Listen to student task progress
const taskProgressSubscription = supabase
  .channel('task-progress')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'person_tasks',
      filter: `person_id=eq.${userId}`
    },
    (payload) => {
      console.log('Task progress updated:', payload.new);
      store.updateTaskProgress(payload.new);
    }
  )
  .subscribe();
```

### 2. Replace Piniafire with Supabase Bindings

```javascript
// Current Piniafire approach (Firestore)
import { firestoreAction } from '@/piniafire/firestore';

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: []
  }),
  actions: {
    bindCourses: firestoreAction(async function({ bindFirestoreRef }) {
      await bindFirestoreRef('courses', db.collection('courses'));
    })
  }
});

// New Supabase approach
import { createClient } from '@supabase/supabase-js';

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [],
    subscription: null
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
        .channel('courses-all')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              this.courses.push(payload.new);
            } else if (payload.eventType === 'UPDATE') {
              const index = this.courses.findIndex(c => c.id === payload.new.id);
              if (index !== -1) this.courses[index] = payload.new;
            } else if (payload.eventType === 'DELETE') {
              this.courses = this.courses.filter(c => c.id !== payload.old.id);
            }
          }
        )
        .subscribe();
    },

    unsubscribe() {
      if (this.subscription) {
        supabase.removeChannel(this.subscription);
      }
    }
  }
});
```

### 3. Authentication Integration

```javascript
// Replace Firebase Auth with Supabase Auth
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

### 4. Row Level Security Helper Functions

```sql
-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user is course owner
CREATE OR REPLACE FUNCTION auth.is_course_owner(course_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM courses
    WHERE id = course_id_param
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user is in cohort
CREATE OR REPLACE FUNCTION auth.is_in_cohort(cohort_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cohort_students
    WHERE cohort_id = cohort_id_param
    AND person_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM cohort_teachers
    WHERE cohort_id = cohort_id_param
    AND person_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## Migration Checklist

### Pre-Migration

- [ ] Set up PostgreSQL database (via Supabase)
- [ ] Create all tables using DDL scripts
- [ ] Set up indexes
- [ ] Configure RLS policies
- [ ] Test RLS with sample data
- [ ] Create database backup strategy

### Data Migration

- [ ] Export Firestore data to JSON
- [ ] Run migration script for `people` table
- [ ] Run migration script for `organisations` table
- [ ] Run migration script for `courses` table
- [ ] Run migration script for `topics` table
- [ ] Run migration script for `tasks` table
- [ ] Run migration script for `map_edges` table
- [ ] Run migration script for `cohorts` and junction tables
- [ ] Run migration script for `person_courses`, `person_topics`, `person_tasks`
- [ ] Run migration script for `submissions` and `help_requests`
- [ ] Run migration script for `user_status`
- [ ] Verify row counts match Firestore
- [ ] Run data integrity checks

### Application Updates

- [ ] Replace Firebase SDK with Supabase SDK
- [ ] Update authentication logic
- [ ] Replace Piniafire bindings with Supabase real-time
- [ ] Update Cloud Functions to use PostgreSQL
- [ ] Update all queries to use Supabase client
- [ ] Update environment variables
- [ ] Update test suites

### Testing

- [ ] Test user authentication flow
- [ ] Test course creation and editing
- [ ] Test student progress tracking
- [ ] Test real-time updates
- [ ] Test cohort management
- [ ] Test submissions and help requests
- [ ] Performance testing with production data volume
- [ ] Load testing

### Deployment

- [ ] Deploy schema to production PostgreSQL
- [ ] Run migration scripts on production data
- [ ] Update application to use PostgreSQL
- [ ] Monitor for errors
- [ ] Set up database monitoring
- [ ] Configure automated backups
- [ ] Document rollback procedure

---

## Conclusion

This PostgreSQL schema provides a robust, normalized foundation for Galaxy Maps' self-hosted future. The schema:

✅ Maintains all Firestore functionality
✅ Improves query performance with proper indexes
✅ Enables complex relational queries (JOINs, aggregations)
✅ Supports real-time updates via Supabase
✅ Implements fine-grained access control with RLS
✅ Provides clear migration path from Firestore
✅ Scales better for analytics and reporting

The migration is complex but achievable in 2-3 months with careful planning and testing.
