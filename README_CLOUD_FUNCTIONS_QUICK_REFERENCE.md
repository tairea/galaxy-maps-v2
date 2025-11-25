# Cloud Functions Quick Reference

> **New to Cloud Functions?** Start with **[README_CLOUD_FUNCTIONS_ARCHITECTURE.md](./README_CLOUD_FUNCTIONS_ARCHITECTURE.md)** to understand the architecture, patterns, and philosophy first.
>
> **Developer Guide:** For overall project setup and onboarding, see **[README_DEV.md](./README_DEV.md)**

## 🚀 Quick Start

### 1. Create New Cloud Function

```typescript
export const functionNameHttpsEndpoint = runWith({}).https.onCall(async (data, context) => {
  const { uid } = await requireAuthenticated(context);
  const { param1, param2 } = data;

  // Your logic here

  return { success: true, data: result };
});
```

### 2. Export in index.ts

```typescript
import { functionNameHttpsEndpoint } from "./module";
export { functionNameHttpsEndpoint as functionName };
```

### 3. Add to ff.ts

```typescript
export const functionName = async (param1: string, param2: number) => {
  const functionNameFunction = functions.httpsCallable("functionName");
  const result = await functionNameFunction({ param1, param2 });
  return result.data;
};
```

### 4. Use in Vue Component

```vue
<script>
import { functionName } from "@/lib/ff";

export default {
  methods: {
    async handleOperation() {
      const result = await functionName(this.param1, this.param2);
    },
  },
};
</script>
```

## 📁 File Locations

- **Cloud Functions**: `functions/src/[module].ts`
- **Exports**: `functions/src/index.ts`
- **Client Layer**: `src/lib/ff.ts`
- **Components**: `src/components/[Component].vue`

## 🔧 Common Patterns

### Authentication

```typescript
const { uid } = await requireAuthenticated(context);
```

### Input Validation

```typescript
if (!param1 || !param2) {
  throw new HttpsError("invalid-argument", "Missing parameters");
}
```

### Error Handling

```typescript
try {
  // logic
} catch (error) {
  console.error("❌ Error:", error);
  throw new HttpsError("internal", "Operation failed");
}
```

### Batch Operations

```typescript
const batch = db.batch();
batch.set(ref, data);
batch.update(ref, data);
await batch.commit();
```

### Structured Response

```typescript
return {
  success: true,
  data: result,
  count: items.length,
  message: "Success message",
};
```

## 📝 Logging Standards

```typescript
console.log("🔐 User authenticated:", uid);
console.log("📝 Processing:", { param1, param2 });
console.log("✅ Success:", result);
console.log("⚠️ Warning:", message);
console.error("❌ Error:", error);
```

## 🚨 Common Issues

| Issue                                         | Solution                               |
| --------------------------------------------- | -------------------------------------- |
| `uid` property error                          | Ignore linter warning - function works |
| Function not found                            | Check import/export in index.ts        |
| Can't call cloud function from cloud function | Extract logic to helper function       |
| Batch not committed                           | Call `batch.commit()` before return    |

## 🚀 Commands

```bash
# Start emulator
firebase emulators:start --only functions

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:functionName
```

## 📊 Response Structure

Always return:

```typescript
{
  success: boolean;
  data?: any;
  message: string;
  [additional fields as needed];
}
```

## 🔐 Security Checklist

- [ ] Authentication required
- [ ] Input validation
- [ ] No sensitive data in logs
- [ ] Proper error messages (no internal details)
- [ ] Rate limiting if needed

---

## Related Documentation

- **[README_CLOUD_FUNCTIONS_ARCHITECTURE.md](./README_CLOUD_FUNCTIONS_ARCHITECTURE.md)** - In-depth architecture guide, migration workflows, and best practices
- **[README_DEV.md](./README_DEV.md)** - Overall developer guide and project architecture
- **[functions/DELAYED_EMAIL_SETUP.md](./functions/DELAYED_EMAIL_SETUP.md)** - Example of advanced Cloud Functions feature (scheduled emails with Cloud Tasks)
