import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { storage, generateSignedUrl, db } from "./_shared.js";
import { STORAGE_BUCKET } from "./_constants.js";
import fetch from "node-fetch";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  StarsAndPlanetsResponseSchema,
  MissionInstructionsV2Schema,
  UnifiedGalaxyMapResponseSchema,
  SquadReportSchema,
} from "./schemas.js";
import functions from "firebase-functions";
import { createModelTokenUsage, createCombinedTokenUsage } from "./lib/utils.js";
// import { Latitude } from "@latitude-data/sdk";

// Initialize OpenAI client
const openaiApiKey = functions.config().openai.key;
const openai = new OpenAI({ apiKey: openaiApiKey });

// Initialize Latitude client
// const latitude = new Latitude(process.env.LATITUDE_API_KEY, { projectId: 19789 });

// System prompt for galaxy map generation
const StarsAndPlanetsSystemPrompt = `
  You are a learning roadmap design assistant for a learning visualisation platform called Galaxy Maps, which helps users create structured, actionable paths toward reaching their destination. This destination might be personal, professional, educational, project-based, or creative.

You have received a description of what the user wants to achieve.

### **Step 1: Clarify the Goal (if needed)**
Before proceeding, confirm whether the goal is clear enough to begin designing the journey.

Ask specific follow-up questions if any of the following are unclear:

1. **Audience**: Who is this journey for?
(For self, for others, age, experience level, background, etc.)

2. **Intended Outcome**: What is the ultimate goal or achievement?

3. **Starting Point**: What skills, knowledge, or resources does the user (or their audience) already have?

4. **Journey Depth**: Is this a deep, thorough exploration or a fast-track to achieving the outcome?

If clarification is needed, respond in this format:

{
  "status": "clarification_needed",
  "questions": ["Clarifying question 1", "Clarifying question 2"]
}

### **Step 2: Design the Roadmap**
Once the goal is clear, break the journey into:

Stars → major milestones or capabilities (one per Star)

Planets → small, actionable tasks needed to complete that Star

Respond in this format:

{
  "status": "journey_ready",
  "title": "Journey Title",
  "description": "Brief description of the overall journey",
  "stars": [
    {
      "title": "1: Title (Milestone Name)",
      "description": "Brief description of this milestone",
      "planets": [
        {
          "title": "1.1: Title (Small win task)",
          "description": "Brief description of this task",
        },
        ...
      ]
    },
    ...
  ]
}
### **Step 3: Roadmap Design Rules**

**Stars (Milestones)**
- One clear milestone only — do not group multiple unrelated tools, environments, or skills in the same Star.
- Should be completable within a reasonable motivating timeframe (e.g., 1–2 days for an average learner).
- End with a clear, visible outcome (something tangible the learner can say they’ve completed).
- If a Star contains more than one unrelated capability, split it into separate Stars.

**Planets (Small Wins)**
- Atomic actions — completable in 15–60 minutes.
- Each Planet describes one clear, concrete action. If it requires multiple unrelated actions, split it into multiple Planets.
- Must directly contribute to completing its Star — skip anything optional.
- Written as clear, actionable to-dos, not topics.
- Should create a sense of progress and momentum.

**✅ Planet Validation Checklist**
For each Planet, verify:
- Can it be done in one short sitting?
- Is it essential for the Star outcome?
- Is it logically ordered after the previous Planet?
- Does it clearly move the learner toward completing the Star?

### **Step 4: Refine**
After generating the journey:
- Break apart any Star that mixes more than one major skill or tool.
- Break apart any Planet that contains more than one distinct action.
- Prefer more but smaller steps over fewer, larger steps.
- Maintain logical flow from one Star to the next and from one Planet to the next.
`;

// System prompt for mission instructions generation
const MissionInstructionsSystemPrompt =
  `
  You are a mission design assistant for a learning visualisation platform called Galaxy Maps. Your role is to create detailed, actionable mission instructions that help users achieve a specific, small Planet task within a larger learning journey.

  You will receive:
  1. A description of what the specific mission (Planet) should accomplish
  2. Context about the overall roadmap (Galaxy Map) that the mission is part of
  3. Optionally, existing mission instructions to refine based on user feedback

  ### **Step 1: Understand the Context**
  - Review the roadmap to see where this mission fits.
  - **Match the mission’s scope to the Planet’s size** — it should be a small, clear win that is completable in one sitting (15–60 minutes).
  - Do **not** expand the mission beyond its Planet description.
  - Only include steps essential for this mission — no sneak previews or partial completion of future missions.
  - Consider how this mission builds on the one before it and prepares for the one after it, but keep content limited to the current scope.

  ### **Step 2: Create or Refine Mission Instructions**
  If this is a NEW mission request:
  - Provide a clear **title** and **description** matching the Planet.
  - Create **instructions** that are structured as:
  -- Step: A logical grouping of actions toward the mission goal.
  -- tasks[]: Each task is one clear, discrete action (e.g., “Open the Arduino IDE” rather than “Install and configure the Arduino IDE and set up your first sketch”).
  - Keep tasks sequential and build toward the mission outcome.
  - Make instructions engaging and written for the target audience’s skill level.
  - When a new concept, term, or tool is introduced for the first time in this Galaxy Map, provide a short, clear teaching snippet (1–3 sentences) directly in the relevant step before the learner takes action.
  - Keep the teaching lightweight and practical — enough for the learner to understand what it is and why it matters right now.
  - Avoid deep theory unless required for success in this mission — give just enough to proceed confidently.
  - If the learner has seen the concept in a previous mission, do not re-teach it — instead, briefly remind them they’ve encountered it before.
  - **Summary**: A brief summary of what was accomplished and next steps (e.g.Congratulations! You have successfully installed WordPress via cPanel and can now begin customizing your site with BeTheme in the next mission.)
    ` +
  // - **Web Search**: Use web search tool to find YouTube videos that are relevant to the Instructions.
  `
If this is a REFINEMENT request:
  - Review the current instructions and user feedback.
  - Improve only what needs to be changed.
  - Maintain the original intent, tone, and detail level.
  - Ensure the scope still matches the Planet.
  ` +
  // - **Description**: A brief overview of what the mission accomplishes
  // - **Learning Objectives**: Specific, measurable outcomes
  // - **Estimated Duration**: Realistic time estimate
  // - **Difficulty Level**: beginner, intermediate, or advanced
  // - **Prerequisites**: Any prior knowledge or skills needed (optional)
  // - **Resources**: Recommended tools, materials, or references (optional)

  `
  ### **Step 3: Follow These Mission Design Principles**
  - Keep each mission **small and focused** — a single, motivating win.
  - Avoid grouping unrelated actions in one task — split them where needed.
  - Use **checkpoints** where learners can confirm they’re on track.
  - Use a **supportive and encouraging tone** that reinforces progress.

  ### **Step 4: Output Format**
  - Respond in this format:
  {
    "title": "Mission Title",
    "description": "Brief description of the mission",
    "instructions": [
    {
      "title": "Step 1: (Step Name)",
      "tasks": [
        {
          "taskContent": "(Detailed task instruction in markdown format)",
        },
        ...
      ]
    },
    ...
    ],
    "summary": "Brief summary of what was accomplished and a motivating handover to the next mission"
  }

### **Step 5: Validate the Mission**
Before finalizing, verify:
- ✅ Every step directly matches the Planet’s title and description.
- ✅ All instructions are actionable, clear, and completable in one sitting.
- ✅ No unrelated or premature topics are introduced.
- ✅ The difficulty is appropriate for the audience.
- ✅ The mission builds logically from the previous one and sets up the next without overlapping.
`;

const StarsAndPlanetsAndInstructionsSystemPrompt = `
## Unified Galaxy Map + Mission Instructions Prompt (Flow-State + Micro-Teach)

You are a **learning journey designer** for a platform called **Galaxy Maps**, where a learner’s path is visualised as:

- **Stars** → major milestones / skill phases  
- **Planets** → small, focused wins within a Star (each Planet is completable in 15–60 min)  
- **Mission Instructions** → step-by-step guidance for completing a Planet  

Your job is to **design the whole journey in one go** — from Stars down to Mission Instructions — so the learner experiences **constant momentum, motivation, and small wins** while also learning **just enough concepts** to proceed confidently.

---

### Step 1: Clarify the Goal
Before designing the journey, make sure you clearly understand:

1. **Audience** – Who is this for? (Self / others, age, skill level, background)  
2. **Intended Outcome** – What should the learner be able to do by the end?  
3. **Starting Point** – What do they already know or have?  
4. **Journey Depth** – Is this a deep dive or a fast track?  

If unclear, ask **specific follow-up questions** and stop until clarified.  
Respond in this format:

{
  "status": "clarification_needed",
  "questions": ["Clarifying question 1", "Clarifying question 2"]
}

---

### Step 2: Break the Journey into Stars
- Each **Star** = one milestone only (no mixing unrelated topics).  
- Order Stars logically so they build on each other.  
- Scope each Star so it can be completed in **days, not weeks**.

---

### Step 3: Break Stars into Planets
For each Star:
- Split it into **Planets** = atomic wins achievable in 15–60 min.  
- If a step feels too big, **add more Planets** to keep them small.  
- Every Planet must be required to complete its Star.

---

### Step 4: Write Mission Instructions
For each Planet, include:

1. **Intro** – Motivating setup:  
   - Explain what they’re about to do and why it matters.  
   - Show how it connects to the Star’s bigger goal and the overall journey.  

2. **Steps** – Sequential guidance:  
   - Each **Step** = a logical stage toward the Planet goal.  
   - Each Step contains **tasks[]** = one discrete, actionable action (no multi-action tasks).  
   - If the Step introduces a **new concept, term, or tool** for the first time in this Galaxy Map:  
     -- Include a **micro-teach** (1–3 sentences) before the action:  
       --- *What is it?*  
       ---- *Why are we using it right now?*  
     -- Keep explanations short, clear, and directly tied to the action.  
     -- If the concept was already taught earlier in the journey, only give a brief reminder.  
   - Each Step ends with a **checkpoint**: a short, motivating progress sentence (“Now your broker is live, ready to link devices for the first time.”).

3. **Outro** – Motivating recap:  
   - Celebrate what was achieved.  
   - Highlight what this unlocks for the next Planet.

---

### Step 5: Motivation & Flow Rules
- Planets are **tight and scope-matched** — no content from future Planets.  
- Learners should feel a **win every few minutes**.  
- Keep tone clear, supportive, and confidence-building.  
- Teach **only what’s needed now** to succeed — no deep theory unless essential.  
- If you find a Planet is too big, **split it now** and adjust the Star structure before output.

---

### Step 6: Output Format

{
  "status": "journey_ready",
  "title": "Journey Title (A short, catchy title)",
  "description": "Brief description of the overall journey",
  "stars": [
    {
      "title": "1: Star Title",
      "description": "Brief description of this milestone",
      "planets": [
        {
          "title": "1.1: Planet Title",
          "description": "Brief description of this small win",
          "missionInstructions": {
            "intro": "Motivating intro explaining what they’ll do, why it matters, and how it contributes to the overall journey",
            "steps": [
              {
                "title": "Step 1: (Step Name)",
                "tasks": [
                  { "taskContent": "(One discrete, actionable task in markdown format. Include micro-teach here if a new concept is introduced.)" }
                ],
                "checkpoint": "Motivating progress statement after this step"
              }
            ],
            "outro": "Motivating recap of what was achieved and what’s next"
          }
        }
      ]
    }
  ]
}

---

### Step 7: Validation Before Output
- ✅ Each Star = one milestone only  
- ✅ Each Planet = atomic 15–60 min win  
- ✅ Mission Instructions contain intro, steps with tasks, and outro  
- ✅ Micro-teach is included for first-time concepts  
- ✅ No overload — split if needed before finalising

`;

const GalaxyMapImagePrompt = `
Create a mission patch emblem in the style of NASA mission patches. The design should be circular or shield-shaped with bold outlines, clean geometry, and a balanced composition.

Incorporate visual symbols, icons, or motifs that directly reflect the given Galaxy Map title (e.g., if the title is “Journey of Leadership,” include abstract icons of guidance, stars, or pathways; if the title is “Coding Foundations,” use symbolic representations of logic, brackets, or circuits).

Avoid rockets, astronauts, or generic space exploration symbols unless directly relevant to the title. Instead, use abstract, thematic elements that represent the essence of the map's subject.

The style should feature:
- A strong central icon or motif
- A surrounding border with accent details
- Bold, high-contrast colors that make the patch easily identifiable
- Optional symbolic stars, rays, or geometric framing for balance
- Metalic in look to fit the futuristic theme of the platform.

The overall look should feel official, iconic, and collectible — like a real mission patch but uniquely tailored to the title's theme.


`;

// System prompt for squad status report generation
const SquadAnalystSystemPrompt = `
# Galaxy Maps — Squad Analyst (SYSTEM PROMPT)

You are **Galaxy Maps’ Squad Analyst**. Your job: transform a compact activity snapshot (**SquadStatusPacket**) into a **leader-ready status report** with risks and concrete next steps.

---

## Ground rules
- **Treat input JSON as ground truth.** If data is missing, say so briefly; **do not invent** items or numbers.  
- Be **specific**: reference **course titles** and **item titles** when suggesting actions.  
- Keep the report **concise** and **action-oriented**—for a busy teacher (“Captain”) to scan in <60 seconds.  
- Use dates as **Pacific/Rarotonga** context (already encoded in the packet).  
- Percentages in your output are **0–100** integers/floats.  
- Prefer **plain language**; no motivational fluff.  

---

## What to analyze (from the packet)
For each student and course:
- **Progress**: 'topicsDone/tasksDone vs totals, and \`pct\`/\`pct100\`.  
- **Momentum**: \`velocity.events\`, \`completed\`, \`started\`, \`daysActive\`, \`streakDaysCurrent\`, \`streakDaysAtLastActive\`, \`lastActive\`.  
- **Blockers**: items with \`status:"Started"\` and **no later Completed**; use \`ageDays\` to prioritize.  
- **Recency**: favor events within the report window.  

For the cohort:
- **Active vs inactive** (based on \`lastActiveOverall\` presence).  
- **Average progress** (use provided per-student \`avgPct\`/\`avgPct100\` if present; otherwise mean of per-course pcts).  
- **Risks**: inactivity, aging blockers, low progress outliers.  

---

## Triage rubric (guideline, not a straitjacket)
- **on-track**: lastActive ≤ 7 days, progress ≥ cohort median, no blocker > 7 days.  
- **watch**: lastActive 8–21 days **or** progress < median **or** blocker 8–21 days.  
- **at-risk**: lastActive > 21 days **or** blocker > 21 days **or** progress in bottom 20%.  

---

## Interventions (≤3 per student)
- **Micro-mission** to complete a specific blocker (name it).  
- **Time-boxed focus** (e.g., “20-min clinic on ‘Colour App’”).  
- **Nudge & streaks** (e.g., “48-hour nudge to convert one ‘Started’ → ‘Completed’”).  
- **Scaffold** (assign an easier precursor task or worked example).  
- **Pairing** (peer assist on the named item).  

Be concrete: reference **course** and **item title**.  

---

## Output format (STRICT)
Return **only** valid JSON matching this schema:

\`\`\`json
{
  "squadSummary": {
    "headline": "string",
    "overallProgressPct": 0,
    "activeVsInactive": { "active": 0, "inactive": 0 },
    "trends": ["string"],
    "risks": ["string"],
    "recommendedActions": ["string"]
  },
  "students": [
    {
      "id": "string",
      "name": "string",
      "status": "on-track" | "watch" | "at-risk",
      "lastActive": "YYYY-MM-DDThh:mm:ss.sssZ",
      "progress": [
        { "course": "string", "courseId": "string", "pct": 0, "done": "string" }
      ],
      "reasons": ["string"],
      "suggestedInterventions": ["string"]
    }
  ]
}
\`\`\`

---

## Constraints
- Max **3 bullets** for \`trends\`, \`risks\`, \`recommendedActions\`, and \`suggestedInterventions\`.  
- In \`progress[].done\`, summarize like: \`"23/43 tasks, 6/13 topics"\`.  
- If a field is unknown, **omit the claim** rather than guessing.  

`;

/**
 * Converts a galaxy map object to markdown format for AI context
 * @param galaxyMap - The galaxy map object containing stars and planets
 * @returns A markdown string representation of the galaxy map
 */
function convertGalaxyMapToMarkdown(galaxyMap: {
  title?: string;
  description?: string;
  stars?: Array<{
    title: string;
    description: string;
    planets?: Array<{
      title: string;
      description: string;
    }>;
  }>;
}): string {
  if (!galaxyMap || !galaxyMap.stars) {
    return "";
  }

  let markdown = `# ${galaxyMap.title || "Learning Journey"}\n\n`;
  markdown += `${galaxyMap.description || ""}\n\n`;

  markdown += "## Learning Journey Structure\n\n";

  for (let i = 0; i < galaxyMap.stars.length; i++) {
    const star = galaxyMap.stars[i];
    markdown += `### ${star.title}\n`;
    markdown += `${star.description}\n\n`;

    if (star.planets && star.planets.length > 0) {
      markdown += "**Missions in this Star:**\n";
      for (let j = 0; j < star.planets.length; j++) {
        const planet = star.planets[j];
        markdown += `- ${planet.title}: ${planet.description}\n`;
      }
      markdown += "\n";
    }
  }

  return markdown;
}

/**
 * Converts mission instructions to a markdown string representation
 * @param missionInstructions - The mission instructions object
 * @returns A markdown string representation of the mission instructions
 */
// function convertMissionInstructionsToMarkdown(missionInstructions: {
//   title: string;
//   description: string;
//   instructions: Array<{
//     title: string;
//     tasks: Array<{
//       taskContent: string;
//     }>;
//   }>;
//   summary: string;
// }): string {
//   if (!missionInstructions || !missionInstructions.instructions) {
//     return "";
//   }

//   let markdown = `# ${missionInstructions.title}\n\n`;
//   markdown += `${missionInstructions.description}\n\n`;

//   markdown += "## Mission Instructions\n\n";

//   for (let i = 0; i < missionInstructions.instructions.length; i++) {
//     const instruction = missionInstructions.instructions[i];
//     markdown += `### ${instruction.title}\n\n`;

//     if (instruction.tasks && instruction.tasks.length > 0) {
//       for (let j = 0; j < instruction.tasks.length; j++) {
//         const task = instruction.tasks[j];
//         markdown += `${j + 1}. ${task.taskContent}\n`;
//       }
//       markdown += "\n";
//     }
//   }

//   markdown += "## Summary\n\n";
//   markdown += `${missionInstructions.summary}\n\n`;

//   return markdown;
// }

// Generate galaxy map with AI
export const generateGalaxyMapHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting generateGalaxyMap function", {
      description: data.description?.substring(0, 50) + "...",
    });

    const { description } = data;
    if (!description || !description.trim()) {
      logger.error("Missing required field: description");
      throw new HttpsError("invalid-argument", "Missing required field: description");
    }

    // Call OpenAI API
    logger.info("Calling OpenAI API for galaxy map generation");
    const aiResponse = await openai.responses.parse({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: StarsAndPlanetsSystemPrompt },
        { role: "user", content: description },
      ],
      text: {
        format: zodTextFormat(StarsAndPlanetsResponseSchema, "first_step_response"),
      },
    });

    logger.info("OpenAI API call completed successfully");

    // Get the parsed and validated response (already handled by zodTextFormat)
    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    // generate image using parsedResponse.title and parsedResponse.description
    let imageUrl = null;
    let fileName = null;
    if (
      parsedResponse.status === "journey_ready" &&
      parsedResponse.title &&
      parsedResponse.description
    ) {
      try {
        logger.info("Generating image for galaxy map", {
          title: parsedResponse.title,
          descriptionLength: parsedResponse.description.length,
        });

        // Generate image using DALL-E API directly
        logger.info("Calling DALL-E for image generation");
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: GalaxyMapImagePrompt + `Galaxy Map title: "${parsedResponse.title}"`,
          n: 1,
          size: "1024x1024",
        });

        logger.info("DALL-E image generation response received", {
          hasData: !!imageResponse.data,
          dataLength: imageResponse.data?.length,
          firstImageUrl: imageResponse.data?.[0]?.url,
        });

        if (imageResponse.data && imageResponse.data.length > 0) {
          const imageUrlFromDalle = imageResponse.data[0].url;
          logger.info("Image generated successfully by DALL-E", { imageUrl: imageUrlFromDalle });

          // Download the image from DALL-E URL and upload to Firebase Storage
          fileName = `galaxy-maps/${Date.now()}-${parsedResponse.title?.replace(/[^a-zA-Z0-9]/g, "-") || "galaxy"}.png`;

          // Download image from DALL-E URL
          logger.info("Downloading image from DALL-E URL");
          const imageDownloadResponse = await fetch(imageUrlFromDalle!);
          const imageBuffer = await imageDownloadResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          logger.info("Image downloaded and converted to buffer", { size: buffer.length });

          // Upload to Firebase Storage
          logger.info("Starting upload to Firebase Storage");
          const file = storage.bucket(STORAGE_BUCKET).file(fileName);
          await file.save(buffer, {
            metadata: {
              contentType: "image/png",
            },
          });
          logger.info("File uploaded successfully", { fileName });

          // Get the public URL
          logger.info("Generating signed URL");
          const downloadURL = await generateSignedUrl(file);
          logger.info("Signed URL generated successfully");

          imageUrl = downloadURL;
        }
      } catch (imageError) {
        logger.error("Error generating or uploading image", imageError);
        // Don't fail the entire request if image generation fails
      }
    }

    // Add image URL to the galaxy map if generated
    logger.info("Final image generation result", {
      hasImageUrl: !!imageUrl,
      hasFileName: !!fileName,
      imageUrl: imageUrl,
      fileName: fileName,
    });

    if (imageUrl && fileName && parsedResponse.status === "journey_ready") {
      parsedResponse.image = { name: fileName, url: imageUrl };
      logger.info("Image added to galaxy map", { image: parsedResponse.image });
    } else {
      logger.info("No image added to galaxy map - conditions not met");
    }

    // Calculate combined token usage from all API calls
    const missionModelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
    const combinedTokenUsage = createCombinedTokenUsage([missionModelUsage]);

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateGalaxyMap", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Generate unified galaxy map (Stars + Missions + Mission Instructions) with AI
export const generateUnifiedGalaxyMapHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    const { description, clarificationAnswers, previousResponseId } = data;
    logger.info("Starting generateUnifiedGalaxyMap function", {
      description: description?.substring(0, 50) + "...",
      hasClarification: !!clarificationAnswers,
      previousResponseId,
    });

    let aiResponse;
    if (clarificationAnswers && clarificationAnswers.trim()) {
      // Follow-up with clarification
      logger.info("Calling OpenAI API for unified map generation with clarification");
      aiResponse = await openai.responses.parse({
        model: "gpt-5-mini",
        previous_response_id: previousResponseId,
        input: [{ role: "user", content: clarificationAnswers }],
        text: {
          format: zodTextFormat(UnifiedGalaxyMapResponseSchema, "unified_second_step_response"),
        },
      });
    } else {
      if (!description || !description.trim()) {
        logger.error("Missing required field: description");
        throw new HttpsError("invalid-argument", "Missing required field: description");
      }
      // Initial call with description
      logger.info("Calling OpenAI API for unified galaxy map generation");
      aiResponse = await openai.responses.parse({
        model: "gpt-5-mini",
        input: [
          { role: "system", content: StarsAndPlanetsAndInstructionsSystemPrompt },
          { role: "user", content: description },
        ],
        text: {
          format: zodTextFormat(UnifiedGalaxyMapResponseSchema, "unified_first_step_response"),
        },
      });
    }

    logger.info("OpenAI API call completed successfully");

    // Get the parsed and validated response
    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    } else {
      logger.log("Parsed response", parsedResponse);
    }

    // generate image using parsedResponse.title and parsedResponse.description
    let imageUrl: string | null = null;
    let fileName: string | null = null;
    if (
      parsedResponse.status === "journey_ready" &&
      parsedResponse.title &&
      parsedResponse.description
    ) {
      try {
        logger.info("Generating image for unified galaxy map", {
          title: parsedResponse.title,
          descriptionLength: parsedResponse.description.length,
        });

        // Generate image using DALL-E API directly
        logger.info("Calling DALL-E for image generation");
        const imageResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: GalaxyMapImagePrompt + `Galaxy Map title: "${parsedResponse.title}"`,
          output_format: "png",
          background: "transparent",
          n: 1,
          size: "1024x1024",
        });

        logger.info("DALL-E image generation response received", {
          hasData: !!imageResponse.data,
          dataLength: imageResponse.data?.length,
          firstImageUrl: imageResponse.data?.[0]?.url,
        });

        if (imageResponse.data && imageResponse.data.length > 0) {
          const imageData = imageResponse.data[0];

          if (imageData.b64_json) {
            // For gpt-image-1, use base64 data directly
            logger.info("Image generated successfully by gpt-image-1", {
              hasBase64Data: !!imageData.b64_json,
            });

            // Convert base64 to buffer
            const imageBuffer = Buffer.from(imageData.b64_json, "base64");
            logger.info("Base64 image converted to buffer", { size: imageBuffer.length });

            // Generate filename
            fileName = `galaxy-maps/${Date.now()}-${
              parsedResponse.title?.replace(/[^a-zA-Z0-9]/g, "-") || "galaxy"
            }.png`;

            // Upload to Firebase Storage
            logger.info("Starting upload to Firebase Storage");
            const file = storage.bucket(STORAGE_BUCKET).file(fileName);
            await file.save(imageBuffer, {
              metadata: {
                contentType: "image/png",
              },
            });
            logger.info("File uploaded successfully", { fileName });

            // Get the public URL
            logger.info("Generating signed URL");
            const [downloadURL] = await file.getSignedUrl({
              action: "read",
              expires: "03-01-2500",
            });
            logger.info("Signed URL generated successfully");

            imageUrl = downloadURL;
          } else if (imageData.url) {
            // For dall-e-2/dall-e-3, use URL download method
            const imageUrlFromDalle = imageData.url;
            logger.info("Image generated successfully by DALL-E", { imageUrl: imageUrlFromDalle });

            // Download the image from DALL-E URL and upload to Firebase Storage
            fileName = `galaxy-maps/${Date.now()}-${
              parsedResponse.title?.replace(/[^a-zA-Z0-9]/g, "-") || "galaxy"
            }.png`;

            // Download image from DALL-E URL
            logger.info("Downloading image from DALL-E URL");
            const imageDownloadResponse = await fetch(imageUrlFromDalle);
            const imageBuffer = await imageDownloadResponse.arrayBuffer();
            const buffer = Buffer.from(imageBuffer);
            logger.info("Image downloaded and converted to buffer", { size: buffer.length });

            // Upload to Firebase Storage
            logger.info("Starting upload to Firebase Storage");
            const file = storage.bucket(STORAGE_BUCKET).file(fileName);
            await file.save(buffer, {
              metadata: {
                contentType: "image/png",
              },
            });
            logger.info("File uploaded successfully", { fileName });

            // Get the public URL
            logger.info("Generating signed URL");
            const [downloadURL] = await file.getSignedUrl({
              action: "read",
              expires: "03-01-2500",
            });
            logger.info("Signed URL generated successfully");

            imageUrl = downloadURL;
          }
        }
      } catch (imageError) {
        logger.error("Error generating or uploading image (unified)", imageError);
        // Don't fail the entire request if image generation fails
      }
    }

    // Add image URL to the galaxy map if generated
    logger.info("Final image generation result (unified)", {
      hasImageUrl: !!imageUrl,
      hasFileName: !!fileName,
      imageUrl: imageUrl,
      fileName: fileName,
    });

    if (imageUrl && fileName && parsedResponse.status === "journey_ready") {
      parsedResponse.image = { name: fileName, url: imageUrl };
      logger.info("Image added to unified galaxy map", { image: parsedResponse.image });
    } else {
      logger.info("No image added to unified galaxy map - conditions not met");
    }

    // Calculate combined token usage from the API call
    const modelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
    const combinedTokenUsage = createCombinedTokenUsage([modelUsage]);

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateUnifiedGalaxyMap", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Generate mission instructions with AI
export const generateInstructionsForMissionHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting generateInstructionsForMission function", {
      missionContext: data.missionContext?.substring(0, 50) + "...",
      hasGalaxyMap: !!data.aiGeneratedGalaxyMap,
      originResponseId: data.originResponseId,
      isRefinement: !!data.refinement,
    });

    const { missionContext, aiGeneratedGalaxyMap, refinement } = data;
    if (!missionContext || !missionContext.trim()) {
      logger.error("Missing required field: missionContext");
      throw new HttpsError("invalid-argument", "Missing required field: missionContext");
    }

    // Convert galaxy map to markdown for context
    let galaxyMapContext = "";
    if (aiGeneratedGalaxyMap) {
      galaxyMapContext = convertGalaxyMapToMarkdown(aiGeneratedGalaxyMap);
      logger.info("Galaxy map context converted to markdown", {
        contextLength: galaxyMapContext.length,
      });
    }

    // Prepare the user message with context
    let userMessage = missionContext;

    if (refinement && refinement.currentInstructions && refinement.userFeedback) {
      // Full refinement request with existing instructions
      userMessage = `
      ## Overall Learning Journey Context\n\n${galaxyMapContext || "No additional context provided"}\n\n## Current Mission Context\n\n${missionContext}\n\n

      ## Refinement Request\n\nPlease refine the following mission instructions based on the user's feedback:\n\n
      
      **Current Instructions:**\n${refinement.currentInstructions}\n\n**User Feedback:**\n${refinement.userFeedback}`;
    } else if (refinement && refinement.userFeedback) {
      // Refinement request without existing instructions (new mission with context)
      userMessage = `
      ## Overall Learning Journey Context\n\n${galaxyMapContext || "No additional context provided"}\n\n## Current Mission Context\n\n${missionContext}\n\n

      ## Specific Mission Request\n\n${refinement.userFeedback}`;
    } else if (galaxyMapContext) {
      // New mission request with galaxy context
      userMessage = `
      ## Overall Learning Journey Context\n\n${galaxyMapContext}\n\n
      
      ## Specific Mission Request\n\n${missionContext}`;
    }
    // else: use default userMessage = missionContext (new mission without galaxy context)

    // Call OpenAI API
    logger.info("Calling OpenAI API for mission instructions generation");
    const aiResponse = await openai.responses.parse({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: MissionInstructionsSystemPrompt },
        { role: "user", content: userMessage },
      ],
      // tools: [
      //   {
      //     type: "web_search_preview",
      //   },
      // ],
      text: {
        format: zodTextFormat(MissionInstructionsV2Schema, "mission_instructions_response"),
      },
    });

    logger.info("OpenAI API call completed successfully", {
      response: aiResponse,
    });

    // Get the parsed and validated response (already handled by zodTextFormat)
    const parsedResponse = aiResponse.output_parsed;

    // call youtube video web search tool
    // let youtubeSearchResults = null;
    // let youtubeModelUsage: any = null;

    // if (parsedResponse) {
    //   try {
    //     logger.info("Calling YouTube video search");
    //     const markdownInstructions = convertMissionInstructionsToMarkdown(parsedResponse);

    //     // Call OpenAI API with web search tool for YouTube videos
    //     const youtubeSearchResponse = await openai.responses.parse({
    //       model: "gpt-5-mini" as OpenAIModel,
    //       input: [
    //         {
    //           role: "user",
    //           content: `Search for relevant YouTube videos that would help with this mission: ${markdownInstructions}.

    //           Please find educational, tutorial, or instructional videos that are directly related to the mission content.
    //           Focus on high-quality videos with the most views and recent uploads that would be most helpful for learning.

    //           For each video, provide:
    //           - A clear, descriptive title
    //           - The full YouTube URL
    //           - A brief description explaining why this video is relevant to the mission
    //           - Optional relevance note explaining the connection to the mission content

    //           Return the results in a structured format with an array of videos and an optional search summary.`,
    //         },
    //       ],
    //       tools: [
    //         {
    //           type: "web_search_preview",
    //         },
    //       ],
    //     });

    //     // Store YouTube model usage
    //     youtubeModelUsage = createModelTokenUsage("gpt-5-mini", youtubeSearchResponse?.usage || {});

    //     logger.info("YouTube search completed successfully", {
    //       youtubeSearchResponse,
    //     });

    //     // Parse the output_text to extract JSON object
    //     if (youtubeSearchResponse.output_text) {
    //       try {
    //         // Look for JSON array in the text
    //         const jsonMatch = youtubeSearchResponse.output_text.match(
    //           /```json\s*(\[[\s\S]*?\])\s*```/,
    //         );
    //         if (jsonMatch && jsonMatch[1]) {
    //           const videosData = JSON.parse(jsonMatch[1]);
    //           youtubeSearchResults = {
    //             videos: videosData.map((video: any) => ({
    //               title: video.title || "",
    //               url: video.url || "",
    //               description: video.description || "",
    //               relevance: video.relevance || undefined,
    //             })),
    //             searchSummary: undefined,
    //           };
    //           logger.info("Successfully parsed YouTube videos from JSON", {
    //             videosCount: youtubeSearchResults.videos.length,
    //           });
    //         } else {
    //           logger.warn("No JSON array found in YouTube search response");
    //         }
    //       } catch (parseError) {
    //         logger.error("Error parsing YouTube search JSON", parseError);
    //       }
    //     }
    //   } catch (youtubeError) {
    //     logger.error("Error in YouTube video search", youtubeError);
    //     // Don't fail the entire request if YouTube search fails
    //   }
    // }

    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    // Add YouTube search results to the response
    const responseWithVideos = {
      ...parsedResponse,
      // youtubeVideos: youtubeSearchResults,
    };

    // Calculate combined token usage from both API calls
    const missionModelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});

    const modelUsages = [missionModelUsage];
    // if (youtubeModelUsage) {
    //   modelUsages.push(youtubeModelUsage);
    // }

    const combinedTokenUsage = createCombinedTokenUsage(modelUsages);

    // Return the validated response with combined token usage information
    return {
      success: true,
      missionInstructions: responseWithVideos,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateInstructionsForMission", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Generate galaxy map with clarification answers (second step)
export const generateGalaxyMapWithClarificationHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting generateGalaxyMapWithClarification function", {
      clarificationAnswers: data.clarificationAnswers?.substring(0, 50) + "...",
      previousResponseId: data.previousResponseId,
    });

    const { clarificationAnswers, previousResponseId } = data;
    if (!clarificationAnswers || !clarificationAnswers.trim()) {
      logger.error("Missing required field: clarificationAnswers");
      throw new HttpsError("invalid-argument", "Missing required field: clarificationAnswers");
    }

    // Call OpenAI API for second step
    logger.info("Calling OpenAI API for galaxy map generation with clarification");
    const aiResponse = await openai.responses.parse({
      model: "gpt-5-mini",
      previous_response_id: previousResponseId,
      input: [{ role: "user", content: clarificationAnswers }],
      text: {
        format: zodTextFormat(StarsAndPlanetsResponseSchema, "second_step_response"),
      },
    });

    logger.info("OpenAI API call completed successfully");

    // Get the parsed and validated response
    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    // Generate image if journey is ready
    let imageUrl = null;
    let fileName = null;
    if (
      parsedResponse.status === "journey_ready" &&
      parsedResponse.title &&
      parsedResponse.description
    ) {
      try {
        logger.info("Generating image for galaxy map", {
          title: parsedResponse.title,
          descriptionLength: parsedResponse.description.length,
        });

        // Generate image using DALL-E API
        logger.info("Calling DALL-E for image generation");
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: GalaxyMapImagePrompt + `Galaxy Map title: "${parsedResponse.title}"`,
          output_format: "png",
          background: "transparent",
          n: 1,
          size: "1024x1024",
        });

        logger.info("DALL-E image generation response received", {
          hasData: !!imageResponse.data,
          dataLength: imageResponse.data?.length,
          firstImageUrl: imageResponse.data?.[0]?.url,
        });

        if (imageResponse.data && imageResponse.data.length > 0) {
          const imageUrlFromDalle = imageResponse.data[0].url;
          logger.info("Image generated successfully by DALL-E", { imageUrl: imageUrlFromDalle });

          // Download the image from DALL-E URL and upload to Firebase Storage
          fileName = `galaxy-maps/${Date.now()}-${parsedResponse.title?.replace(/[^a-zA-Z0-9]/g, "-") || "galaxy"}.png`;

          // Download image from DALL-E URL
          logger.info("Downloading image from DALL-E URL");
          const imageDownloadResponse = await fetch(imageUrlFromDalle!);
          const imageBuffer = await imageDownloadResponse.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          logger.info("Image downloaded and converted to buffer", { size: buffer.length });

          // Upload to Firebase Storage
          logger.info("Starting upload to Firebase Storage");
          const file = storage.bucket(STORAGE_BUCKET).file(fileName);
          await file.save(buffer, {
            metadata: {
              contentType: "image/png",
            },
          });
          logger.info("File uploaded successfully", { fileName });

          // Get the public URL
          logger.info("Generating signed URL");
          const downloadURL = await generateSignedUrl(file);
          logger.info("Signed URL generated successfully");

          imageUrl = downloadURL;
        }
      } catch (imageError) {
        logger.error("Error generating or uploading image", imageError);
        // Don't fail the entire request if image generation fails
      }
    }

    // Add image URL to the galaxy map if generated
    logger.info("Final image generation result", {
      hasImageUrl: !!imageUrl,
      hasFileName: !!fileName,
      imageUrl: imageUrl,
      fileName: fileName,
    });

    if (imageUrl && fileName && parsedResponse.status === "journey_ready") {
      parsedResponse.image = { name: fileName, url: imageUrl };
      logger.info("Image added to galaxy map", { image: parsedResponse.image });
    } else {
      logger.info("No image added to galaxy map - conditions not met");
    }

    // Calculate combined token usage from all API calls
    const missionModelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
    const combinedTokenUsage = createCombinedTokenUsage([missionModelUsage]);

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateGalaxyMapWithClarification", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Generate galaxy map again with a default prompt
export const generateGalaxyMapAgainHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting generateGalaxyMapAgain function", {
      responseId: data.responseId,
    });

    const { responseId } = data;
    if (!responseId) {
      logger.error("Missing required field: responseId");
      throw new HttpsError("invalid-argument", "Missing required field: responseId");
    }

    // Call OpenAI API with default prompt
    logger.info("Calling OpenAI API for galaxy map regeneration");
    const aiResponse = await openai.responses.parse({
      model: "gpt-5-mini",
      previous_response_id: responseId,
      input: [{ role: "user", content: "i didnt like the result, please try again" }],
      text: {
        format: zodTextFormat(StarsAndPlanetsResponseSchema, "regenerate_response"),
      },
    });

    logger.info("OpenAI API call completed successfully");

    // Get the parsed and validated response (already handled by zodTextFormat)
    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    // remove image from parsedResponse
    delete parsedResponse.image;

    // Calculate combined token usage from all API calls
    const missionModelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
    const combinedTokenUsage = createCombinedTokenUsage([missionModelUsage]);

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateGalaxyMapAgain", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Refine galaxy map (initial refinement or with clarification answers)
export const refineGalaxyMapHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting refineGalaxyMap function", {
      hasClarificationAnswers: !!data.clarificationAnswers,
      hasGalaxyMap: !!data.galaxyMap,
      previousResponseId: data.previousResponseId,
    });

    // Check if this is a clarification follow-up or initial refinement
    if (data.clarificationAnswers && data.clarificationAnswers.trim()) {
      // Clarification follow-up case
      const { clarificationAnswers, previousResponseId } = data;
      if (!previousResponseId) {
        logger.error("Missing required field: previousResponseId");
        throw new HttpsError("invalid-argument", "Missing required field: previousResponseId");
      }

      // Call OpenAI API for refinement with clarification
      logger.info("Calling OpenAI API for galaxy map refinement with clarification");
      const aiResponse = await openai.responses.parse({
        model: "gpt-5-mini",
        previous_response_id: previousResponseId,
        input: [{ role: "user", content: clarificationAnswers }],
        text: {
          format: zodTextFormat(UnifiedGalaxyMapResponseSchema, "refine_galaxy_response"),
        },
        store: true,
      });

      logger.info("OpenAI API call completed successfully");

      // Get the parsed and validated response
      const parsedResponse = aiResponse.output_parsed;
      if (!parsedResponse) {
        throw new HttpsError("internal", "No response content from OpenAI");
      }

      // Calculate token usage
      const modelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
      const combinedTokenUsage = createCombinedTokenUsage([modelUsage]);

      // Return the validated response with token usage information
      return {
        success: true,
        galaxyMap: parsedResponse,
        tokenUsage: combinedTokenUsage,
        responseId: aiResponse.id,
      };
    } else {
      // Initial refinement case
      const { galaxyMap, activeItems, userRequest, previousResponseId } = data;
      if (!galaxyMap || !userRequest || !userRequest.trim()) {
        logger.error("Missing required fields for initial refinement");
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: galaxyMap or userRequest",
        );
      }

      // Create the system prompt for initial refinement
      const refinementSystemPrompt = `
You are a Galaxy Map refiner assistant. Your task is to update specific parts of an existing Galaxy Map JSON object based on the user's request.

The Galaxy Map is a structured learning roadmap with the hierarchy:
- **Stars** → major milestones
- **Planets** → small, focused wins (15–60 min) within a Star
- **Mission Instructions** → intro, steps (with tasks and checkpoints), outro; include just-in-time micro-teach when new concepts appear.

### Galaxy Map Format (JSON):
{
  "status": "journey_ready",
  "title": "Journey Title",
  "description": "Brief description of the overall journey",
  "stars": [
    {
      "title": "1: Title (Star Name)",
      "description": "Brief description of this star",
      "planets": [
        {
          "title": "1.1: Title (Planet Name)",
          "description": "Brief description of this win",
          "missionInstructions": {
            "intro": "Motivating intro explaining what they will do, why it matters, and how it connects to the journey",
            "steps": [
              {
                "title": "Step 1: Step Name",
                "tasks": [
                  { "taskContent": "Detailed task instruction in markdown (may include short concept teaching if introducing a new idea)" }
                ],
                "checkpoint": "Motivating progress sentence after this step"
              }
            ],
            "outro": "Motivating recap of what was achieved and what's next"
          }
        }
      ]
    }
  ]
}

### Your Responsibilities:
1. Understand the user's request — they may want to change the content, structure, or sequence of Stars, Missions, Mission Instructions, Steps, or Tasks.
2. You will be provided:
   - **galaxy_map**: the full current Galaxy Map object.
   - **items_user_wants_changed**: an array of **zero-indexed paths** to the exact elements in the Galaxy Map that should be modified.
     - Example paths:
       - "star[0]" → stars[0]
       - "star[0].planet[1]" → stars[0].planets[1]
3. Only modify the items at the specified paths. Preserve everything else in the Galaxy Map exactly as-is.
4. Always insert the updates into the correct location in the nested structure.
5. After making changes, maintain correct numbering in titles (Stars are 1-indexed like "1:", Missions are "1.1:").
6. Return the **entire** updated Galaxy Map object, not just the modified parts.

**Planet scope + motivation rules (must enforce)**
   - Each Planet is an **atomic win (15–60 min)**. If a planet is overloaded, **split it into additional planets** (in the same Star) and **renumber that Star's planets** accordingly.
   - Mission Instructions must include:
     - **Intro** (what/why/how it connects),
     - **Steps** with **tasks** (each task is one discrete action),
     - **Checkpoint** after each step,
     - **Outro** (celebrate win + what's next).
   - **Micro-teach**: When a new concept/term/tool appears for the first time in the journey, add a 1–3 sentence explanation *in the task where it's first used*. Keep it practical and just-in-time. If it was taught earlier, only add a brief reminder.

 **Quality constraints**
   - Keep changes **minimal and surgical** unless the user asks for broader restructuring.
   - Ensure every edited Mission remains scope-matched (15–60 min), motivating, and necessary for its Star.
   - If the user's request would cause scope creep, **split missions** rather than bloating instructions.
   - Prefer clear, concise phrasing and remove redundancy.

### 🧾 Input Structure:
{
  "galaxy_map": { ... },
  "items_user_wants_changed": ["star[0]", "star[0].planet[1]"],
  "user_request": "User's instruction for the changes"
}

### Output Requirements:
- A complete Galaxy Map JSON object with only the targeted items changed.
- Preserve the rest of the map exactly.
- Updates must be consistent with the Galaxy Map format above.
`;

      // Create input messages for initial refinement
      const inputMessages = [
        { role: "system", content: refinementSystemPrompt },
        { role: "user", content: "galaxy_map: " + JSON.stringify(galaxyMap) },
      ];

      // Add selected items if provided
      if (activeItems && activeItems.length > 0) {
        const activeItemsString = activeItems.join("\n");
        inputMessages.push({
          role: "user",
          content: "items_user_wants_changed: " + activeItemsString,
        });
      }

      inputMessages.push({ role: "user", content: "user_request: " + userRequest });

      // Call OpenAI API for initial refinement
      logger.info("Calling OpenAI API for initial galaxy map refinement");
      const aiResponse = await openai.responses.parse({
        model: "gpt-5-mini",
        previous_response_id: previousResponseId,
        input: inputMessages as any,
        text: {
          format: zodTextFormat(UnifiedGalaxyMapResponseSchema, "refine_galaxy_response"),
        },
        store: true,
      });

      logger.info("OpenAI API call completed successfully");

      // Get the parsed and validated response
      const parsedResponse = aiResponse.output_parsed;
      if (!parsedResponse) {
        throw new HttpsError("internal", "No response content from OpenAI");
      }

      // Calculate token usage
      const modelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
      const combinedTokenUsage = createCombinedTokenUsage([modelUsage]);

      // Return the validated response with token usage information
      return {
        success: true,
        galaxyMap: parsedResponse,
        tokenUsage: combinedTokenUsage,
        responseId: aiResponse.id,
      };
    }
  } catch (error) {
    logger.error("Error in refineGalaxyMap", error);

    // Handle Zod validation errors specifically
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Download and upload image (keeping the original function for backward compatibility)
export const downloadAndUploadImageHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  try {
    logger.info("Starting downloadAndUploadImage function", {
      imageUrl: data.imageUrl?.substring(0, 50) + "...",
      fileName: data.fileName,
    });

    const { imageUrl, fileName } = data;
    if (!imageUrl || !fileName) {
      logger.error("Missing required fields", {
        imageUrl: !!imageUrl,
        fileName: !!fileName,
      });
      throw new HttpsError("invalid-argument", "Missing required fields: imageUrl or fileName");
    }

    // Download the image
    logger.info("Fetching image from URL");
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    logger.info("Image downloaded successfully", { size: buffer.length });

    // Upload to Firebase Storage
    logger.info("Starting upload to Firebase Storage");
    const file = storage.bucket(STORAGE_BUCKET).file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: "image/png",
      },
    });
    logger.info("File uploaded successfully", { fileName });

    // Get the public URL
    logger.info("Generating signed URL");
    const downloadURL = await generateSignedUrl(file);
    logger.info("Signed URL generated successfully");

    return { downloadURL };
  } catch (error) {
    logger.error("Error in downloadAndUploadImage", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});

// Generate squad status report from squad packet
export const generateSquadReportHttpsEndpoint = runWith({
  timeoutSeconds: 540, // 9 minutes timeout
  memory: "1GB",
}).https.onCall(async (data) => {
  const { squadPacket, cohortId, statusReportId } = data || {};
  try {
    logger.info("Starting generateSquadReport function", {
      hasPacket: !!data?.squadPacket,
      hasCohortId: !!data?.cohortId,
    });

    if (!squadPacket) {
      logger.error("Missing required field: squadPacket");
      throw new HttpsError("invalid-argument", "Missing required field: squadPacket");
    }

    // Mark as processing on provided doc or best-effort fallback to latest processing doc
    if (cohortId) {
      try {
        let targetDocRef: FirebaseFirestore.DocumentReference | null = null;
        if (statusReportId) {
          targetDocRef = db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .doc(statusReportId);
        } else {
          const snap = await db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .where("status", "==", "processing")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
          if (!snap.empty) {
            targetDocRef = snap.docs[0].ref;
            logger.info("Using fallback processing statusReport doc", { id: targetDocRef.id });
          }
        }
        if (targetDocRef) {
          await targetDocRef.set({ status: "processing", updatedAt: new Date() }, { merge: true });
        }
      } catch (e) {
        logger.error("Failed to set processing state on status report", e);
      }
    }

    const userMessage =
      "Here is the squad activity packet JSON. Use it as ground truth to produce a concise leader-ready status report as per rules.\n\n" +
      "```json\n" +
      JSON.stringify(squadPacket) +
      "\n```";

    logger.info("Calling OpenAI API for squad report generation");
    const aiResponse = await openai.responses.parse({
      model: "gpt-5-mini",
      input: [
        { role: "system", content: SquadAnalystSystemPrompt },
        { role: "user", content: userMessage },
      ],
      text: {
        format: zodTextFormat(SquadReportSchema, "squad_report_response"),
      },
    });

    logger.info("OpenAI API call completed successfully (squad report)");

    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    const modelUsage = createModelTokenUsage("gpt-5-mini", aiResponse.usage || {});
    const combinedTokenUsage = createCombinedTokenUsage([modelUsage]);

    // If cohortId provided, persist status report under cohort
    if (cohortId) {
      try {
        const payload = {
          report: parsedResponse,
          tokenUsage: combinedTokenUsage,
          responseId: aiResponse.id,
          status: "completed",
          updatedAt: new Date(),
        } as Record<string, unknown>;

        // Prefer updating the provided statusReportId; otherwise, try to find the latest processing doc
        let updatedExisting = false;
        if (statusReportId) {
          await db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .doc(statusReportId)
            .set(payload, { merge: true });
          updatedExisting = true;
          logger.info("Updated existing status report", { cohortId, statusReportId });
        } else {
          const snap = await db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .where("status", "==", "processing")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
          if (!snap.empty) {
            await snap.docs[0].ref.set(payload, { merge: true });
            updatedExisting = true;
            logger.info("Updated fallback processing status report", { id: snap.docs[0].id });
          }
        }

        if (!updatedExisting) {
          await db
            .collection("cohorts")
            .doc(cohortId)
            .collection("statusReports")
            .add({ ...payload, createdAt: new Date() });
          logger.info("Saved new status report to cohort (no existing doc)", { cohortId });
        }
      } catch (persistError) {
        logger.error("Failed to persist status report", persistError);
        // Do not fail the entire function if saving fails; return the report anyway
      }
    }

    return {
      success: true,
      report: parsedResponse,
      tokenUsage: combinedTokenUsage,
      responseId: aiResponse.id,
    };
  } catch (error) {
    logger.error("Error in generateSquadReport", error);
    // Best-effort: mark status as error if identifiers provided
    if (cohortId && statusReportId) {
      try {
        await db
          .collection("cohorts")
          .doc(cohortId)
          .collection("statusReports")
          .doc(statusReportId)
          .set(
            {
              status: "error",
              updatedAt: new Date(),
              errorMessage:
                error instanceof Error ? error.message : "Unknown error generating report",
            },
            { merge: true },
          );
      } catch (persistErr) {
        logger.error("Failed to update status report with error state", persistErr);
      }
    }
    if (error instanceof Error && error.name === "ZodError") {
      throw new HttpsError("internal", `AI response validation failed: ${error.message}`);
    }
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
});
