import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { storage } from "./_shared.js";
import { STORAGE_BUCKET } from "./_constants.js";
import fetch from "node-fetch";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema, MissionInstructionsV2Schema } from "./schemas.js";
import functions from "firebase-functions";
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
Once the goal is clear, break the journey into a logical sequence of:

Stars → major phases or **themes** needed to successfully complete the journey

Planets → key **tasks** that must be completed within each Star


Respond in this format:

{
  "status": "journey_ready",
  "title": "Journey Title",
  "description": "Brief description of the overall journey",
  "stars": [
    {
      "title": "1: Title (Theme Name)",
      "description": "Brief description of this theme",
      "planets": [
        {
          "title": "1.1: Title (Task Name)",
          "description": "Brief description of this task",
        },
        ...
      ]
    },
    ...
  ]
}
### **Step 3: Follow These Roadmap Design Instructions**
- Each Star is a major checkpoint or theme required to successfully complete the journey.

- Each Planet under a Star is a key task or milestone that must be actioned to completed the Star and to move forward.

- Each Planet must be:

  - Concrete: a specific action the user must take.

  - Essential: contributes directly to completing its Star.

  - Sequential: logically follows from the previous step (where applicable).

- Think of Stars as "mini goals" and Planets as "the exact steps needed to reach that mini goal."

⚠️ Only include Planets that are required to complete the Star. If a Planet could be skipped without affecting the Star's outcome, it should not be included.

✅ Planet Validation Checklist
Before finalizing each Star's Planets, verify:
- ✅ Are the Planets actionable (can someone do this)?
- ✅ Are they required to achieve the Star outcome?
- ✅ Are they logically ordered (progressive or scaffolded)?
- ✅ Together, do they fully complete the Star?

### **Step 4: Refine the Journey**

After generating the journey, review it for:

- ✅ Logical progression from one Star to the next.
- ✅ Logical progression from one Planet to the next.
- ✅ Clear, actionable Planets that contribute to each Star.
`;

// System prompt for mission instructions generation
const MissionInstructionsSystemPrompt =
  `
  You are a mission design assistant for a roadmap visualisation platform called Galaxy Maps. Your role is to create detailed, actionable mission instructions that help users achieve specific learning objectives.

  You will receive:
  1. A description of what the specific mission should accomplish
  2. Context about the overall roadmap (called a Galaxy Map) that the mission is part of
  3. Optionally, existing mission instructions to refine based on user feedback

  ### **Step 1: Understand the Context**
  - Review the overall roadmap structure to understand the broader context
  - Identify where this specific mission fits within the roadmap
  - Consider how this mission builds upon previous missions and prepares for future ones
  - Identify where this specific mission fits within the overall roadmap
  - Do not create instructions that do not pertain to this specific mission
  - Stay focused on achieving this specific mission only. Do not create instruction that might be covered by future missions

  ### **Step 2: Create or Refine Mission Instructions**
  If this is a NEW mission request:
  - Create comprehensive instructions that include:
    - **Instructions**: Step-by-step actionable instructions
    - **Summary**: A brief summary of what was accomplished and next steps (e.g.Congratulations! You have successfully installed WordPress via cPanel and can now begin customizing your site with BeTheme in the next mission.)
  
  If this is a REFINEMENT request:
  - Review the current instructions and user feedback
  - Make targeted improvements based on the feedback
  - Preserve the overall structure and intent of the original instructions
  - Only modify what needs to be changed based on the feedback
  - Ensure the refined instructions maintain the same level of detail and clarity
  ` +
  // - **Description**: A brief overview of what the mission accomplishes
  // - **Learning Objectives**: Specific, measurable outcomes
  // - **Estimated Duration**: Realistic time estimate
  // - **Difficulty Level**: beginner, intermediate, or advanced
  // - **Prerequisites**: Any prior knowledge or skills needed (optional)
  // - **Resources**: Recommended tools, materials, or references (optional)

  `

  ### **Step 3: Follow These Mission Design Principles**
  - Each instruction should be specific and actionable
  - Instructions should build progressively toward the mission
  - Make instructions engaging and motivating
  - When refining, maintain consistency with the original style and tone
  - Focus on the specific feedback provided rather than rewriting everything

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
    "summary": "A summary at the end of the mission"
  }
  `;
// - Include clear Mission success criteria where possible
// - Consider different learning styles and provide multiple approaches when relevant
// - Ensure the mission fits naturally within the broader learning journey
// - Consider the difficulty progression from previous to future missions
// - Include safety considerations if applicable
// - Provide context for why each step matters
// `;

// ### **Step 4: Validate the Mission**
// Before finalizing, verify:
// - ✅ Are all instructions actionable and clear?
// - ✅ Do the learning objectives align with the mission description?
// - ✅ Does this mission fit well within the broader learning journey?
// - ✅ Is the difficulty level appropriate for the target audience?
// - ✅ Is the estimated duration realistic?
// - ✅ Are prerequisites clearly identified?
// - ✅ Are necessary resources listed?
// - ✅ Does this mission build upon previous missions appropriately?
// `;

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
      model: "gpt-4o-mini",
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

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: {
        input_tokens: aiResponse.usage?.input_tokens || 0,
        output_tokens: aiResponse.usage?.output_tokens || 0,
        total_tokens: aiResponse.usage?.total_tokens || 0,
      },
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
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: MissionInstructionsSystemPrompt },
        { role: "user", content: userMessage },
      ],
      text: {
        format: zodTextFormat(MissionInstructionsV2Schema, "mission_instructions_response"),
      },
    });

    logger.info("OpenAI API call completed successfully");

    // Get the parsed and validated response (already handled by zodTextFormat)
    const parsedResponse = aiResponse.output_parsed;
    if (!parsedResponse) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }

    // Return the validated response with token usage information
    return {
      success: true,
      missionInstructions: parsedResponse,
      tokenUsage: {
        input_tokens: aiResponse.usage?.input_tokens || 0,
        output_tokens: aiResponse.usage?.output_tokens || 0,
        total_tokens: aiResponse.usage?.total_tokens || 0,
      },
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
      model: "gpt-4o-mini",
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

    // Return the validated response with token usage information
    return {
      success: true,
      galaxyMap: parsedResponse,
      tokenUsage: {
        input_tokens: aiResponse.usage?.input_tokens || 0,
        output_tokens: aiResponse.usage?.output_tokens || 0,
        total_tokens: aiResponse.usage?.total_tokens || 0,
      },
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
