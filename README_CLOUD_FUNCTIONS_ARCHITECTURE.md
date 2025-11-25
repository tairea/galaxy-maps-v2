# Cloud Functions Architecture & Development Guide

> **Quick Reference:** For fast lookups and common patterns while coding, see **[README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md](./README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md)**
>
> **Developer Guide:** For overall project architecture and setup, see **[README_DEV.md](./README_DEV.md)**

## Overview

This document outlines the architecture, patterns, and development workflow for Firebase Cloud Functions in the Galaxy Maps project. We've established a clean, maintainable pattern that separates client-side UI concerns from server-side business logic.

## Architecture Pattern

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Vue Component │───▶│     ff.ts    │───▶│  Cloud Function  │───▶│  Firestore  │
│                 │    │              │    │                  │    │             │
│ - UI Logic      │    │ - Type Safety│    │ - Business Logic │    │ - Database  │
│ - State Mgmt    │    │ - Error Hdl  │    │ - Validation     │    │ - Security  │
│ - User Input    │    │ - Abstraction│    │ - Auth Checks    │    │             │
└─────────────────┘    └──────────────┘    └──────────────────┘    └─────────────┘
```

## File Structure

```
functions/src/
├── index.ts                 # Main entry point, exports all functions
├── courseManagement.ts      # Course-related business logic
└── [other modules].ts       # Additional business logic modules

src/lib/
└── ff.ts                    # Client-side abstraction layer

src/components/
└── [Component].vue          # Vue components using ff.ts functions
```

## Naming Conventions

### Cloud Functions

- **Internal names**: Use `HttpsEndpoint` suffix (e.g., `saveNodeHttpsEndpoint`)
- **Export aliases**: Use clean names without suffix (e.g., `saveNodeHttpsEndpoint as saveNode`)
- **File naming**: Use camelCase with descriptive names (e.g., `courseManagement.ts`)

### Client Functions

- **ff.ts functions**: Use the same names as export aliases (e.g., `saveNode`)
- **Vue methods**: Use descriptive names ending with `Handler` if calling cloud functions (e.g., `saveNodeHandler`)

## Development Workflow

### 1. Create Cloud Function

```typescript
// functions/src/courseManagement.ts
export const functionNameHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  try {
    // 1. Authentication
    const { uid } = await requireAuthenticated(context);

    // 2. Input validation
    const { param1, param2 } = data;
    if (!param1 || !param2) {
      throw new HttpsError("invalid-argument", "Missing required parameters");
    }

    // 3. Business logic
    const result = await performBusinessLogic(param1, param2);

    // 4. Return structured response
    return {
      success: true,
      data: result,
      message: "Operation completed successfully",
    };
  } catch (error) {
    console.error("❌ Error in functionName:", error);
    throw new HttpsError("internal", "Operation failed");
  }
});
```

### 2. Export in index.ts

```typescript
// functions/src/index.ts
import { functionNameHttpsEndpoint } from "./courseManagement";

export {
  functionNameHttpsEndpoint as functionName, // Clean alias for clients
  // ... other functions
};
```

### 3. Add Client Abstraction

```typescript
// src/lib/ff.ts
export const functionName = async (
  param1: string,
  param2: number,
): Promise<{
  success: boolean;
  data: any;
  message: string;
}> => {
  const data = { param1, param2 };
  const functionNameFunction = functions.httpsCallable("functionName");
  const result = await functionNameFunction(data);
  return result.data;
};
```

### 4. Update Vue Component

```vue
<!-- src/components/Component.vue -->
<script>
import { functionName } from "@/lib/ff";

export default {
  methods: {
    async handleOperation() {
      try {
        const result = await functionName(this.param1, this.param2);
        console.log("✅ Success:", result);
      } catch (error) {
        console.error("❌ Error:", error);
      }
    },
  },
};
</script>
```

## Key Patterns & Best Practices

### 1. Authentication & Security

```typescript
// Always require authentication in cloud functions
const { uid } = await requireAuthenticated(context);
console.log("🔐 User authenticated:", uid);
```

### 2. Input Validation

```typescript
// Validate all required parameters
if (!courseId || !node || !students || !Array.isArray(students)) {
  throw new HttpsError(
    "invalid-argument",
    "Missing required parameters: courseId, node, and students array",
  );
}
```

### 3. Structured Responses

```typescript
// Return consistent response structure
return {
  success: true,
  data: result,
  count: items.length,
  message: `Processed ${items.length} items successfully`,
};
```

### 4. Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  console.error("❌ Error in functionName:", error);
  throw new HttpsError("internal", "Operation failed");
}
```

### 5. Comprehensive Logging

```typescript
console.log("🔐 User authenticated:", uid);
console.log("📝 Processing data:", { courseId, nodeId, count });
console.log("✅ Operation completed:", result);
console.log("⚠️ Warning:", warningMessage);
console.error("❌ Error:", error);
```

### 6. Batch Operations

```typescript
// Use Firestore batches for multiple operations
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
batch.delete(ref3);
await batch.commit();
```

## Migration Checklist

When migrating client-side logic to cloud functions:

- [ ] **Identify the function** to migrate
- [ ] **Create cloud function** with proper naming convention
- [ ] **Add authentication** and input validation
- [ ] **Implement business logic** with error handling
- [ ] **Add comprehensive logging** for debugging
- [ ] **Export in index.ts** with clean alias
- [ ] **Create client abstraction** in ff.ts
- [ ] **Update Vue component** to use new function
- [ ] **Remove old client-side logic**
- [ ] **Test thoroughly** before deployment
- [ ] **Update documentation** if needed

## Common Pitfalls & Solutions

### 1. Linter Errors with `uid`

**Problem**: `Property 'uid' does not exist on type 'void'`

**Solution**: This is a TypeScript configuration issue. The function works correctly despite the linter warning.

### 2. Calling Cloud Functions from Other Cloud Functions

**Problem**: Can't directly call one cloud function from another

**Solution**: Extract shared logic into helper functions or implement the logic directly

### 3. Batch Operation Timing

**Problem**: Batch operations must be committed before the function returns

**Solution**: Ensure all batch operations are added before calling `batch.commit()`

### 4. Import/Export Mismatches

**Problem**: Function not found when importing

**Solution**: Check both import statement and export alias in index.ts

## Testing & Deployment

### Local Testing

```bash
# Start Firebase emulator
firebase emulators:start --only functions

# Test cloud functions locally
# Update ff.ts to point to local emulator if needed
```

### Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName
```

### Monitoring

- **Firebase Console**: View function logs and performance
- **Error Tracking**: Monitor for failed executions
- **Performance**: Track execution time and memory usage

## Example: Complete Migration

Here's a complete example of migrating a client-side function:

### Before (Client-side)

```vue
<script>
export default {
  methods: {
    async saveData() {
      await db.collection("items").add(this.item);
      this.close();
    },
  },
};
</script>
```

### After (Cloud Function + Client)

```typescript
// functions/src/module.ts
export const saveDataHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  const { uid } = await requireAuthenticated(context);
  const { item } = data;

  await db.collection("items").add(item);

  return { success: true, message: "Data saved successfully" };
});
```

```typescript
// src/lib/ff.ts
export const saveData = async (item: any) => {
  const saveDataFunction = functions.httpsCallable("saveData");
  const result = await saveDataFunction({ item });
  return result.data;
};
```

```vue
<!-- src/components/Component.vue -->
<script>
import { saveData } from "@/lib/ff";

export default {
  methods: {
    async saveDataHandler() {
      try {
        const result = await saveData(this.item);
        console.log("✅ Success:", result);
        this.close();
      } catch (error) {
        console.error("❌ Error:", error);
      }
    },
  },
};
</script>
```

## Benefits of This Architecture

1. **🔒 Security**: All database operations happen server-side
2. **⚡ Performance**: Cloud functions can optimize operations
3. **🔄 Consistency**: Centralized business logic reduces inconsistencies
4. **🧹 Clean Components**: Vue components focus on UI, not business logic
5. **📝 Better Logging**: Server-side logging for debugging
6. **✅ Error Handling**: Proper HTTP error codes and messages
7. **🛠️ Maintainability**: Business logic in one place
8. **📊 Monitoring**: Built-in Firebase monitoring and analytics

## Advanced Patterns: Scheduled & Background Tasks

### Cloud Tasks for Delayed Operations

Galaxy Maps uses **Google Cloud Tasks** for scheduling operations that need to run at a specific time in the future. This is more reliable than setTimeout or scheduled functions for precise timing.

**Current Implementation:**
- **Delayed Feedback Emails**: Users receive a feedback email 3 hours after creating a galaxy map
- Location: `functions/src/emails.ts` (lines 860-1050)
- See [functions/DELAYED_EMAIL_SETUP.md](./functions/DELAYED_EMAIL_SETUP.md) for complete setup guide

**How It Works:**
```typescript
// 1. User triggers action (e.g., creates galaxy)
// 2. Cloud Function creates a Cloud Task scheduled for future
const task = {
  httpRequest: {
    url: 'https://[region]-[project].cloudfunctions.net/taskHandler',
    body: Buffer.from(JSON.stringify(data)).toString('base64'),
  },
  scheduleTime: {
    seconds: Math.floor(futureTime.getTime() / 1000),
  },
};
await cloudTasksClient.createTask({ parent, task });

// 3. Task executes at scheduled time and calls the HTTP endpoint
// 4. HTTP endpoint performs the delayed action (sends email, etc.)
```

**Use Cases for Cloud Tasks:**
- ✅ Delayed feedback emails (implemented)
- 📅 Reminder emails (7-day check-in, 30-day engagement)
- ⏰ Scheduled notifications (course deadlines, inactive user prompts)
- 🔄 Retry logic for failed operations
- 📊 Periodic data aggregation tasks
- 🗑️ Cleanup operations (delete old data after X days)

**Benefits:**
- Precise timing (down to the second)
- Automatic retries with exponential backoff
- Scalable (handles millions of tasks)
- Cost-effective (1M operations free/month)
- Decoupled from main function execution

**Pattern:**
```typescript
// In emails.ts or similar module
export const scheduleTaskHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  const { uid } = await requireAuthenticated(context);

  // Create Cloud Task
  const client = new CloudTasksClient();
  const task = {
    httpRequest: {
      url: `https://[region]-[project].cloudfunctions.net/taskHandler`,
      body: Buffer.from(JSON.stringify(data)).toString('base64'),
    },
    scheduleTime: { seconds: Math.floor(scheduledTime.getTime() / 1000) },
  };

  await client.createTask({ parent: queuePath, task });
});

export const taskHandlerHttpsEndpoint = runWith({}).https.onRequest(async (req, res) => {
  const data = req.body;

  // Perform the scheduled action
  await performScheduledAction(data);

  res.status(200).send({ success: true });
});
```

**Setup Requirements:**
1. Enable Cloud Tasks API
2. Create task queue: `gcloud tasks queues create [queue-name] --location=[region]`
3. Grant permissions to Cloud Tasks service account
4. Deploy both the scheduling function and task handler

### Future Platform Automation Opportunities

**Engagement & Retention:**
- 7-day check-in email after galaxy creation
- 30-day milestone celebrations (X students enrolled, Y missions completed)
- Re-engagement campaigns for inactive users
- Weekly/monthly progress summaries for teachers

**Educational Features:**
- Scheduled release of locked content (time-based missions)
- Deadline reminders for mission submissions
- Auto-archive old submissions after review period
- Periodic cohort performance reports

**Platform Operations:**
- Daily/weekly analytics aggregation
- Monthly usage reports to admins
- Cleanup of orphaned data (unclaimed invites, test accounts)
- Cache warming for frequently accessed galaxies
- Backup verification tasks

**Implementation Example:**
```typescript
// Schedule 7-day check-in email
await scheduleEngagementEmail(userId, galaxyId, {
  delay: 7 * 24 * 60 * 60 * 1000, // 7 days
  templateType: 'weekly-checkin',
});

// Schedule deadline reminder
await scheduleDeadlineReminder(studentId, missionId, {
  dueDate: mission.dueDate,
  reminderOffset: 24 * 60 * 60 * 1000, // 1 day before
});
```

See the delayed email implementation in `functions/src/emails.ts` as a template for adding new scheduled tasks.

## Future Considerations

- **Rate Limiting**: Implement if needed for high-traffic functions
- **Caching**: Add Redis or similar for frequently accessed data
- **Webhooks**: Implement for external service integrations
- **Analytics**: Add custom metrics for business insights
- **Queue Management**: Monitor Cloud Tasks queues and set up alerts for failures

---

## Related Documentation

- **[README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md](./README_CLOUD_FUNCTIONS_QUICK_REFERENCE.md)** - Quick reference for common patterns and daily development
- **[README_DEV.md](./README_DEV.md)** - Overall developer guide and project architecture
- **[functions/DELAYED_EMAIL_SETUP.md](./functions/DELAYED_EMAIL_SETUP.md)** - Real-world example: Scheduled emails using Cloud Tasks

---

_This architecture ensures clean separation of concerns, improved security, and maintainable code. Follow these patterns for all new cloud function development._
