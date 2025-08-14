import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { storage } from "./_shared.js";
import { STORAGE_BUCKET } from "./_constants.js";
import fetch from "node-fetch";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  StarsAndPlanetsResponseSchema,
  MissionInstructionsV2Schema,
  UnifiedGalaxyMapResponseSchema,
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
     - Include a **micro-teach** (1–3 sentences) before the action:  
       - *What is it?*  
       - *Why are we using it right now?*  
     - Keep explanations short, clear, and directly tied to the action.  
     - If the concept was already taught earlier in the journey, only give a brief reminder.  
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
  "title": "Journey Title",
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
          prompt: `Generate an image that symbolizes "${parsedResponse.title}": ${parsedResponse.description || ""}.`,
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
          const [downloadURL] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
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
          model: "dall-e-3",
          prompt: `Generate an image that symbolizes "${parsedResponse.title}": ${
            parsedResponse.description || ""
          }.`,
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
          fileName = `galaxy-maps/${Date.now()}-${
            parsedResponse.title?.replace(/[^a-zA-Z0-9]/g, "-") || "galaxy"
          }.png`;

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
          const [downloadURL] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
          logger.info("Signed URL generated successfully");

          imageUrl = downloadURL;
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
          prompt: `Generate an image that symbolizes "${parsedResponse.title}": ${parsedResponse.description || ""}.`,
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
          const [downloadURL] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
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
    const [downloadURL] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });
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
