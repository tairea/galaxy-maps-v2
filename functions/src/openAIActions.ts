import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
import { storage } from "./_shared.js";
import { STORAGE_BUCKET } from "./_constants.js";
import fetch from "node-fetch";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { StarsAndPlanetsResponseSchema } from "./schemas.js";
import functions from "firebase-functions";
// import { Latitude } from "@latitude-data/sdk";

// Initialize OpenAI client
const openaiApiKey = functions.config().openai.key;
const openai = new OpenAI({ apiKey: openaiApiKey });

// Initialize Latitude client
// const latitude = new Latitude(process.env.LATITUDE_API_KEY, { projectId: 19789 });

// System prompt for galaxy map generation
const StarsAndPlanetsSystemPrompt = `
  You are a journey path design assistant for a learning visualisation platform called Galaxy Maps, which helps users create structured, actionable paths toward reaching their destination. This destination might be personal, professional, educational, project-based, or creative.

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

### **Step 2: Design the Journey**
Once the goal is clear, break the journey into a logical sequence of:

Stars → major phases or themes (themes) needed to successfully complete the journey

Planets → key tasks that must be completed within each Star (tasks)


Respond in this format:

{
  "status": "journey_steps_ready",
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
### **Step 3: Follow These Journey Design Instructions**
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

// Download and upload image
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
