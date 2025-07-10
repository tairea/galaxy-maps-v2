# Structured Outputs Implementation

This project now uses OpenAI's Structured Outputs feature with Zod validation to ensure reliable and type-safe AI responses.

## What Changed

### 1. Installed Zod

```bash
npm install zod
```

### 2. Created Zod Schemas (`src/lib/schemas.ts`)

- `GatheringContextSchema` - For when AI needs more information
- `JourneyReadySchema` - For when AI has enough info to create a journey
- `GalaxyCreationResponseSchema` - Union of both response types

### 3. Created Helper Functions (`src/lib/openaiHelpers.ts`)

- `createGalaxyCreationSchema()` - Creates the schema definition (currently unused, kept for reference)
- `validateGalaxyCreationResponse()` - Validates AI responses with Zod (no longer needed with zodTextFormat)

### 4. Updated AI Calls

Replaced complex JSON parsing logic with structured outputs:

**Before:**

```javascript
const aiResponse = await this.$openai.responses.create({
  model: "o4-mini",
  input: [
    { role: "system", content: systemPrompt },
    { role: "user", content: this.description },
  ],
  store: true,
});

// Complex JSON parsing logic...
let assistantMessage = aiResponse.output_text;
let parsed = JSON.parse(assistantMessage);
// Manual validation and error handling...
```

**After:**

```javascript
import { zodTextFormat } from "openai/helpers/zod";
import { GalaxyCreationResponseSchema } from "@/lib/schemas";

const aiResponse = await this.$openai.responses.parse({
  model: "gpt-4o-mini",
  input: [
    { role: "system", content: systemPrompt },
    { role: "user", content: this.description },
  ],
  text: {
    format: zodTextFormat(GalaxyCreationResponseSchema, "galaxy_creation"),
  },
  store: true,
});

// Get the parsed and validated response
const parsed = aiResponse.output_parsed;
```

## Benefits

1. **Reliability**: OpenAI guarantees the response format matches the Zod schema
2. **Type Safety**: Automatic validation with Zod schemas
3. **Cleaner Code**: No manual JSON parsing or validation needed
4. **Better Error Handling**: Clear error messages when validation fails
5. **Maintainability**: Schemas are centralized and reusable

## Usage

### Creating a New Structured Output

1. Define the schema in `src/lib/schemas.ts`:

```typescript
export const MyResponseSchema = z.object({
  status: z.literal("success"),
  data: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
});
```

2. Create a helper function in `src/lib/openaiHelpers.ts`:

```typescript
export const createMySchema = () => ({
  type: "object",
  properties: {
    status: { type: "string", enum: ["success"] },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["status", "data"],
});

export const validateMyResponse = (response: any) => {
  return MyResponseSchema.parse(response);
};
```

3. Use in your component:

```javascript
const response = await this.$openai.responses.parse({
  model: "gpt-4o-mini",
  input: [{ role: "user", content: "Your prompt" }],
  schema: createMySchema(),
  store: true,
});

const result = validateMyResponse(response);
```

## Migration Notes

- The old `responses.create()` API has been replaced with `responses.parse()`
- Response parsing uses `zodTextFormat()` with Zod schemas
- Responses are automatically parsed and validated
- Error handling is more specific and informative
- All responses are validated against Zod schemas
