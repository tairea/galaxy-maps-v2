# Cloud Functions Architecture & Development Guide

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

## Future Considerations

- **Rate Limiting**: Implement if needed for high-traffic functions
- **Caching**: Add Redis or similar for frequently accessed data
- **Background Jobs**: Use Cloud Tasks for long-running operations
- **Webhooks**: Implement for external service integrations
- **Analytics**: Add custom metrics for business insights

---

_This architecture ensures clean separation of concerns, improved security, and maintainable code. Follow these patterns for all new cloud function development._
