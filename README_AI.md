# AI-Powered Features in Galaxy Maps

This document describes how Galaxy Maps uses AI to generate and refine learning roadmaps.

## Overview

Galaxy Maps leverages OpenAI's API to automatically create complete learning journeys from natural language descriptions. The AI system generates:
- **Stars** (major milestones)
- **Planets** (small, achievable wins)
- **Mission Instructions** (detailed step-by-step guides)

## Table of Contents

1. [Galaxy Map Generation](#galaxy-map-generation)
2. [Galaxy Map Refinement](#galaxy-map-refinement)
3. [Voice-Powered AI Agent](#voice-powered-ai-agent)
4. [Key Files Reference](#key-files-reference)

---

## Galaxy Map Generation

### User Experience Flow

**Entry Point**: `src/components/Dialogs/AICreateGalaxyDialog.vue`

1. **User Input**
   - Natural language description of learning goal
   - Optional file attachments (PDFs, images, JSON)
   - Files up to 512MB supported (large files auto-upload to Firebase Storage)

2. **AI Processing**
   - If goal is unclear → AI asks clarifying questions
   - If goal is clear → Complete galaxy map structure generated
   - Typical generation time: 3-5 minutes

3. **Output**
   - Complete learning roadmap with Stars, Planets, and Mission Instructions
   - Optional mission patch image (NASA-style emblem)
   - Token usage and cost tracking

### Backend Implementation

**Cloud Function**: `generateUnifiedGalaxyMapHttpsEndpoint`
**Location**: `functions/src/openAIActions.ts:651-978`

**Models Used**:
- GPT-5 (initial generation with reasoning)
- gpt-image-1-mini (mission patch images)

**System Prompt**: `StarsAndPlanetsAndInstructionsSystemPrompt` (lines 188-309)

### Response Structure

The AI returns a structured JSON validated with Zod schemas:

```typescript
{
  status: "journey_ready" | "clarification_needed",

  // If clarification_needed:
  questions: ["Question 1", "Question 2"],

  // If journey_ready:
  title: "Journey Title",
  description: "Brief journey description",
  stars: [
    {
      title: "1: Milestone Name",
      description: "Milestone description",
      planets: [
        {
          title: "1.1: Small Win Task",
          description: "Task description",
          missionInstructions: {
            intro: "Motivating setup explaining what/why/how",
            steps: [
              {
                title: "Step 1: Action Name",
                tasks: [
                  { taskContent: "Discrete action item (may include micro-teach)" }
                ],
                checkpoint: "Motivating progress statement"
              }
            ],
            outro: "Recap and next steps"
          }
        }
      ]
    }
  ],
  image: { name: "filename.png", url: "https://..." }
}
```

### Design Principles

The AI follows strict design rules to maintain quality:

**Stars (Milestones)**:
- One clear milestone only
- Completable in 1-2 days
- Clear, visible outcome
- No mixing of unrelated skills/tools

**Planets (Small Wins)**:
- Atomic actions (15-60 minutes)
- One clear, concrete action per Planet
- Essential for completing parent Star
- Creates momentum and progress

**Mission Instructions**:
- **Intro**: Motivates and connects to larger journey
- **Steps**: Sequential actions with discrete tasks
- **Micro-teach**: 1-3 sentence explanations when new concepts appear
- **Checkpoint**: Progress confirmation after each step
- **Outro**: Celebration and handoff to next mission

### File Attachment Handling

**Small Files (<8MB)**: Base64 encoded and sent inline
**Large Files (>8MB)**: Uploaded to Firebase Storage, URL passed to AI

**Supported Formats**:
- Images: Converted to signed URLs for AI vision
- PDFs: Uploaded to OpenAI Files API
- JSON: Formatted and included as text context

---

## Galaxy Map Refinement

Galaxy Maps supports two types of refinement: structural changes and content updates.

### Structure Refinement (Operation-Based)

**Purpose**: Modify the galaxy map structure while maintaining consistency.

**Entry Point**: `src/views/AiGalaxyEdit.vue`

**Cloud Function**: `refineStructureHttpsEndpoint`
**Location**: `functions/src/refiners/refine-structure.ts:487-604`

#### Operation Types

**Star Operations**:
- `insert_star_after` - Add new Star after target
- `delete_star` - Remove Star
- `move_star` - Reposition Star in sequence
- `reorder_stars` - Reorder all Stars
- `replace_star_fields` - Update Star title/description

**Planet Operations**:
- `insert_planet_after` - Add new Planet after target
- `delete_planet` - Remove Planet
- `move_planet` - Move Planet within or between Stars
- `reorder_planets` - Reorder Planets within a Star
- `replace_planet_fields` - Update Planet title/description
- `split_planet` - Split overloaded Planet into multiple smaller ones

#### Refinement Flow

1. **User Selection**
   - User selects Stars/Planets to modify (locked_targets mode)
   - OR provides request and AI auto-selects (auto_select mode)

2. **AI Processing**
   - GPT-5 for initial operations (complex reasoning)
   - GPT-5-mini for clarification follow-ups
   - Returns array of operations to apply

3. **Operation Application** (`src/refiners/apply-structure-ops.ts`)
   - Operations applied immutably to galaxy map
   - Automatic ID generation for new items
   - Renumbering maintains sequence consistency
   - Deep cloning preserves original state

#### Example User Requests

```text
"Split planet 1.3 into two smaller tasks"
→ AI generates: split_planet operation with 2 new planets

"Add a new star about testing after star 2"
→ AI generates: insert_star_after operation with complete star structure

"Move planet 2.4 to be the first planet in star 3"
→ AI generates: move_planet operation with position details

"Reorder the planets in star 1 to make more sense"
→ AI generates: reorder_planets operation with new sequence
```

### Content Refinement

**Purpose**: Update mission instructions without structural changes.

**Cloud Function**: `generateInstructionsForMissionHttpsEndpoint`
**Location**: `functions/src/openAIActions.ts:1046-1242`

**Use Cases**:
- Refine existing mission instructions based on feedback
- Generate new instructions for manually created missions
- Adjust tone, detail level, or difficulty

**Input Parameters**:
```typescript
{
  missionContext: "Planet description",
  aiGeneratedGalaxyMap: { /* full galaxy map for context */ },
  refinement: {
    currentInstructions: "Existing mission content",
    userFeedback: "What to change"
  }
}
```

**Output**: Complete mission instructions with intro, steps, and outro.

---

## Voice-Powered AI Agent

**Component**: `src/components/Reused/AiGalaxyMapAgent.vue`

Galaxy Maps includes a voice-activated AI assistant using OpenAI's Realtime API.

### Features

- **Voice Interaction**: Speak naturally to create galaxy maps
- **Squad Management**: Check on student cohorts
- **Status Reports**: Generate progress reports
- **Navigation**: Voice commands to navigate the app

### Available Tools

The agent has access to these functions:

1. **generateGalaxyMap**
   - Create galaxy maps from voice description
   - Handles clarification questions conversationally

2. **getMySquads**
   - Fetch teacher's cohorts
   - Required before generating squad reports

3. **generateSquadStatusReport**
   - AI-generated progress analysis
   - Emails report to teacher
   - Includes at-risk student identification and intervention suggestions

4. **sendGenericEmail**
   - Send data/reports to user's email
   - Useful for sharing AI-generated content

5. **takeMeToSquad**
   - Navigate to specific squad page
   - Uses squad ID and name

6. **terminateSession**
   - End the voice session gracefully

### Technical Details

- **Transport**: OpenAI Realtime WebRTC
- **Model**: gpt-realtime
- **Voice**: coral
- **Turn Detection**: Semantic VAD with medium eagerness
- **Token Caching**: Ephemeral tokens cached for performance (`src/store/aiConversation.ts`)

### System Prompt

The agent is instructed to:
- Act as a starship captain (warm, confident, theatrical)
- Use navigational metaphors sparingly
- Provide clear, patient guidance
- Always give preamble before triggering tools
- Ask clarifying questions rather than guessing

---

## Key Files Reference

### Frontend

**Generation UI**:
- `src/components/Dialogs/AICreateGalaxyDialog.vue` - Main generation dialog
- `src/views/AiGalaxyEdit.vue` - Galaxy editing and refinement interface

**AI Agent**:
- `src/components/Reused/AiGalaxyMapAgent.vue` - Voice-powered AI assistant

**State Management**:
- `src/store/aiConversation.ts` - Realtime token caching

**Refinement Logic**:
- `src/refiners/apply-structure-ops.ts` - Apply structure operations to galaxy map
- `src/refiners/structure-refine-schemas.ts` - Operation type definitions

**Schemas**:
- `src/lib/schemas.ts` - Frontend Zod validation schemas

**API Wrappers**:
- `src/lib/ff.ts` - Callable function wrappers

### Backend (Cloud Functions)

**Main AI Functions** (`functions/src/openAIActions.ts`):
- `generateUnifiedGalaxyMapHttpsEndpoint` (lines 651-978) - Complete galaxy generation
- `generateGalaxyImageHttpsEndpoint` (lines 981-1044) - Mission patch images only
- `generateInstructionsForMissionHttpsEndpoint` (lines 1046-1242) - Mission instructions
- `refineGalaxyMapHttpsEndpoint` (lines 1454-1661) - Legacy content refinement
- `generateSquadReportHttpsEndpoint` (lines 1774-1939) - Squad status reports

**Structure Refinement** (`functions/src/refiners/refine-structure.ts`):
- `refineStructureHttpsEndpoint` (lines 487-604) - Structure operation generation

**System Prompts** (`functions/src/openAIActions.ts`):
- `StarsAndPlanetsAndInstructionsSystemPrompt` (lines 188-309) - Main generation
- `MissionInstructionsSystemPrompt` (lines 107-186) - Mission instructions
- `GalaxyMapImagePrompt` (lines 311-328) - Image generation
- `SquadAnalystSystemPrompt` (lines 331-416) - Squad reports

**Structure Refinement Prompts** (`functions/src/refiners/structure-constants.ts`):
- `STRUCTURE_SYSTEM_PROMPT` - Operation-based refinement instructions

**Schemas** (`functions/src/schemas.ts`):
- `UnifiedGalaxyMapResponseSchema` - Main generation response
- `MissionInstructionsV2Schema` - Mission instructions
- `StructureRefineResponseSchema` - Structure operations
- `SquadReportSchema` - Squad status reports

**Utilities** (`functions/src/lib/utils.ts`):
- `createModelTokenUsage` - Track individual model usage
- `createCombinedTokenUsage` - Aggregate token costs

### Other Files

**System Prompts** (Frontend):
- `src/lib/GalaxyMapPrompts.ts` - Legacy prompts (mostly replaced by backend prompts)

**Squad Utilities**:
- `src/lib/squadPacketBuilder.ts` - Build standardized squad data packets for AI analysis

---

## Token Management & Cost Tracking

All AI operations track token usage for transparency and cost monitoring:

```typescript
{
  totalTokens: number,
  totalInputTokens: number,
  totalOutputTokens: number,
  combinedEstimatedCost: number,
  modelsUsed: [
    {
      model: "gpt-5",
      totalTokens: number,
      estimatedCost: number
    }
  ]
}
```

Token usage is:
- Accumulated across multiple API calls
- Displayed to users during generation
- Logged for cost analysis
- Per-model breakdown available

---

## OpenAI Models Used

| Model | Purpose | Reasoning | Cost |
|-------|---------|-----------|------|
| **gpt-5** | Initial galaxy generation | medium effort | Higher |
| **gpt-5** | Structure refinement (initial) | - | Higher |
| **gpt-5** | Mission instructions | - | Higher |
| **gpt-5-mini** | Clarification follow-ups | - | Lower |
| **gpt-5-mini** | Structure refinement (clarification) | - | Lower |
| **gpt-5-mini** | Squad reports | - | Lower |
| **gpt-image-1-mini** | Mission patch images | - | Per image |
| **gpt-realtime** | Voice agent | - | Per minute |

---

## Best Practices

### For Galaxy Generation

1. **Be Specific**: Include audience, outcome, and starting point in description
2. **Use Files**: Attach course outlines, syllabi, or reference materials
3. **Iterate**: Use clarification questions to refine the AI's understanding
4. **Review Structure**: Check that Planets are truly 15-60 min wins

### For Refinement

1. **Be Precise**: Clearly state what to change and why
2. **Use Selection**: Select specific Stars/Planets when possible
3. **Small Changes**: Make incremental refinements rather than large rewrites
4. **Test Operations**: Verify structure changes maintain sequence logic

### For Voice Agent

1. **Clear Speech**: Speak clearly in quiet environment
2. **Wait for Prompts**: Let agent finish before responding
3. **Specific Requests**: Use concrete names (squad names, etc.)
4. **Confirm Actions**: Review generated content before saving

---

## Troubleshooting

**Generation times out**:
- Break description into smaller, more focused requests
- Remove unnecessary file attachments
- Check Firebase function timeout settings

**AI asks unnecessary clarification questions**:
- Include more context in initial description
- Specify audience, starting point, and end goal explicitly

**Structure operations fail**:
- Verify selected items exist in current galaxy map
- Check that operation makes logical sense (can't move planet to non-existent star)
- Review frontend console for validation errors

**Voice agent not responding**:
- Check microphone permissions
- Verify realtime token is valid (check console logs)
- Ensure stable internet connection
- Try refreshing and reconnecting

**Token costs higher than expected**:
- Review token usage breakdown
- Consider using simpler models for non-critical operations
- Reduce file attachment sizes
- Break large generations into smaller steps

---

## Future Enhancements

Planned AI features:
- Streaming responses for real-time generation feedback
- Multi-language support for mission instructions
- Learning style customization (visual, kinesthetic, etc.)
- Automatic difficulty adjustment based on learner performance
- AI-powered learning path recommendations
- Collaborative refinement with multi-user suggestions
