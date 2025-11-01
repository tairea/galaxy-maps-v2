import { runWith, logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v1/https";
// import { zodTextFormat } from "openai/helpers/zod";
import openai from "../openaiClient.js";
import { STRUCTURE_SYSTEM_PROMPT } from "./structure-constants.js";
import {
  StructureTargetsSchema,
  StructureCandidatesSchema,
  type StructureRefineResponse,
  StructureRefineResponseSchema,
} from "../schemas.js";
import { createModelTokenUsage, createCombinedTokenUsage, type OpenAIModel } from "../lib/utils.js";

const CLARIFICATION_MODEL: OpenAIModel = "gpt-5-mini";
const INITIAL_MODEL: OpenAIModel = "gpt-5";

// Manual JSON Schema for model formatting (kept permissive; we validate strictly afterwards)
const STRUCTURE_REFINE_TEXT_FORMAT = {
  type: "json_schema",
  name: "structure_refine_ops",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: ["journey_ready", "clarification_needed"] },
      selectedTargets: {
        type: "object",
        additionalProperties: false,
        properties: {
          starIds: { type: "array", items: { type: "string" } },
          planetIds: { type: "array", items: { type: "string" } },
        },
        required: ["starIds", "planetIds"],
      },
      suggestedTargets: {
        type: "object",
        additionalProperties: false,
        properties: {
          starIds: { type: "array", items: { type: "string" } },
          planetIds: { type: "array", items: { type: "string" } },
        },
        required: ["starIds", "planetIds"],
      },
      questions: { type: "array", items: { type: "string" } },
      ops: {
        type: "array",
        items: {
          anyOf: [
            // insert_star_after
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "insert_star_after" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" } },
                  required: ["starId"],
                },
                newStar: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    planets: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          missionInstructions: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                              intro: { type: "string" },
                              steps: {
                                type: "array",
                                items: {
                                  type: "object",
                                  additionalProperties: false,
                                  properties: {
                                    title: { type: "string" },
                                    tasks: {
                                      type: "array",
                                      items: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: { taskContent: { type: "string" } },
                                        required: ["taskContent"],
                                      },
                                    },
                                    checkpoint: { type: "string" },
                                  },
                                  required: ["title", "tasks", "checkpoint"],
                                },
                              },
                              outro: { type: "string" },
                            },
                            required: ["intro", "steps", "outro"],
                          },
                          missionInstructionsHtmlString: { type: "string" },
                        },
                        required: [
                          "title",
                          "description",
                          "missionInstructions",
                          "missionInstructionsHtmlString",
                        ],
                      },
                    },
                  },
                  required: ["title", "description", "planets"],
                },
              },
              required: ["op", "target", "newStar"],
            },
            // delete_star
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "delete_star" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" } },
                  required: ["starId"],
                },
              },
              required: ["op", "target"],
            },
            // move_star
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "move_star" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" } },
                  required: ["starId"],
                },
                position: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    beforeStarId: { type: "string" },
                    afterStarId: { type: "string" },
                  },
                  required: ["beforeStarId", "afterStarId"],
                },
              },
              required: ["op", "target", "position"],
            },
            // reorder_stars
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "reorder_stars" },
                orderedStarIds: { type: "array", items: { type: "string" } },
              },
              required: ["op", "orderedStarIds"],
            },
            // replace_star_fields
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "replace_star_fields" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" } },
                  required: ["starId"],
                },
                fields: {
                  type: "object",
                  additionalProperties: false,
                  properties: { title: { type: "string" }, description: { type: "string" } },
                  required: ["title", "description"],
                },
              },
              required: ["op", "target", "fields"],
            },
            // insert_planet_after
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "insert_planet_after" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" }, planetId: { type: "string" } },
                  required: ["starId", "planetId"],
                },
                newPlanet: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    missionInstructions: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        intro: { type: "string" },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                              title: { type: "string" },
                              tasks: {
                                type: "array",
                                items: {
                                  type: "object",
                                  additionalProperties: false,
                                  properties: { taskContent: { type: "string" } },
                                  required: ["taskContent"],
                                },
                              },
                              checkpoint: { type: "string" },
                            },
                            required: ["title", "tasks", "checkpoint"],
                          },
                        },
                        outro: { type: "string" },
                      },
                      required: ["intro", "steps", "outro"],
                    },
                    missionInstructionsHtmlString: { type: "string" },
                  },
                  required: [
                    "title",
                    "description",
                    "missionInstructions",
                    "missionInstructionsHtmlString",
                  ],
                },
              },
              required: ["op", "target", "newPlanet"],
            },
            // delete_planet
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "delete_planet" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" }, planetId: { type: "string" } },
                  required: ["starId", "planetId"],
                },
              },
              required: ["op", "target"],
            },
            // move_planet
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "move_planet" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" }, planetId: { type: "string" } },
                  required: ["starId", "planetId"],
                },
                position: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    beforePlanetId: { type: "string" },
                    afterPlanetId: { type: "string" },
                  },
                  required: ["beforePlanetId", "afterPlanetId"],
                },
              },
              required: ["op", "target", "position"],
            },
            // reorder_planets
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "reorder_planets" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" } },
                  required: ["starId"],
                },
                orderedPlanetIds: { type: "array", items: { type: "string" } },
              },
              required: ["op", "target", "orderedPlanetIds"],
            },
            // replace_planet_fields
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "replace_planet_fields" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" }, planetId: { type: "string" } },
                  required: ["starId", "planetId"],
                },
                fields: {
                  type: "object",
                  additionalProperties: false,
                  properties: { title: { type: "string" }, description: { type: "string" } },
                  required: ["title", "description"],
                },
              },
              required: ["op", "target", "fields"],
            },
            // split_planet
            {
              type: "object",
              additionalProperties: false,
              properties: {
                op: { type: "string", const: "split_planet" },
                target: {
                  type: "object",
                  additionalProperties: false,
                  properties: { starId: { type: "string" }, planetId: { type: "string" } },
                  required: ["starId", "planetId"],
                },
                newPlanets: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      missionInstructions: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          intro: { type: "string" },
                          steps: {
                            type: "array",
                            items: {
                              type: "object",
                              additionalProperties: false,
                              properties: {
                                title: { type: "string" },
                                tasks: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    additionalProperties: false,
                                    properties: { taskContent: { type: "string" } },
                                    required: ["taskContent"],
                                  },
                                },
                                checkpoint: { type: "string" },
                              },
                              required: ["title", "tasks", "checkpoint"],
                            },
                          },
                          outro: { type: "string" },
                        },
                        required: ["intro", "steps", "outro"],
                      },
                    },
                    required: ["title", "description", "missionInstructions"],
                  },
                },
              },
              required: ["op", "target", "newPlanets"],
            },
          ],
        },
      },
    },
    required: ["status", "selectedTargets", "suggestedTargets", "questions", "ops"],
  },
} as const;

/**
 * Prepares the payload for the structure refiner call, validating inputs and
 * falling back to candidate selection when explicit targets are absent.
 */
function buildStructureRefinePayload(data: Record<string, unknown>) {
  const {
    userRequest,
    targets,
    candidates,
    stars,
    planets,
    neighbors,
    styleGuide,
    previousResponseId,
  } = data as any;

  const previousResponseIdStr =
    typeof previousResponseId === "string" ? previousResponseId : undefined;

  if (!userRequest || !String(userRequest).trim()) {
    throw new HttpsError("invalid-argument", "Missing required field: userRequest");
  }

  const trimmedRequest = String(userRequest).trim();

  if (targets) StructureTargetsSchema.parse(targets);
  if (candidates) StructureCandidatesSchema.parse(candidates);

  const hasTargets =
    !!targets &&
    ((targets.starIds && targets.starIds.length > 0) ||
      (targets.planetIds && targets.planetIds.length > 0));

  if (!hasTargets) {
    const hasCandidates =
      !!candidates &&
      ((candidates.stars && candidates.stars.length > 0) ||
        (candidates.planets && candidates.planets.length > 0));

    if (!hasCandidates) {
      throw new HttpsError(
        "invalid-argument",
        "Provide either non-empty targets or a candidates list when no selection is made.",
      );
    }
  }

  const payload = {
    user_request: trimmedRequest,
    mode: hasTargets ? "locked_targets" : "auto_select",
    targets: hasTargets ? targets : undefined,
    candidates: !hasTargets ? candidates : undefined,
    stars: Array.isArray(stars) ? stars : [],
    planets: Array.isArray(planets) ? planets : [],
    neighbors: neighbors || {},
    styleGuide: styleGuide || [],
  };

  return { payload, previousResponseId: previousResponseIdStr };
}

/**
 * Normalises the OpenAI response and computes token usage metadata.
 */
function formatStructureResponse(
  aiResponse: any,
  model: OpenAIModel,
): {
  result: StructureRefineResponse;
  usage: ReturnType<typeof createCombinedTokenUsage>;
} {
  const parsedRaw = aiResponse.output_parsed as unknown;
  let parsed: StructureRefineResponse;
  if (parsedRaw == null) {
    // Fallback: return a clarification request instead of failing the request
    try {
      const fallback = {
        status: "clarification_needed" as const,
        questions: [
          "I couldn’t generate structured refinement steps this time. Please clarify the exact changes (add/move/delete/replace) and the specific stars/planets to act on.",
        ],
      };
      parsed = StructureRefineResponseSchema.parse(fallback);
    } catch (_) {
      throw new HttpsError("internal", "No response content from OpenAI");
    }
  } else {
    parsed = StructureRefineResponseSchema.parse(parsedRaw);
  }

  const usage = createCombinedTokenUsage([createModelTokenUsage(model, aiResponse.usage || {})]);

  return { result: parsed, usage };
}

export const refineStructureHttpsEndpoint = runWith({
  timeoutSeconds: 540,
  memory: "1GB",
}).https.onCall(async (data: Record<string, unknown>) => {
  try {
    logger.info("Starting refineStructure function", {
      hasClarificationAnswers: !!data?.clarificationAnswers,
      previousResponseId: data?.previousResponseId,
    });

    if (data?.clarificationAnswers && String(data.clarificationAnswers).trim()) {
      const clarificationAnswers = String(data.clarificationAnswers).trim();
      const previousResponseId =
        typeof data.previousResponseId === "string" ? data.previousResponseId : undefined;

      if (!previousResponseId) {
        logger.error("Missing required field: previousResponseId (clarification)");
        throw new HttpsError("invalid-argument", "Missing required field: previousResponseId");
      }

      logger.info("Calling OpenAI for structure refinement clarification");
      const clarRequest: any = {
        model: CLARIFICATION_MODEL,
        input: [{ role: "user", content: clarificationAnswers }],
        text: { format: STRUCTURE_REFINE_TEXT_FORMAT },
        max_output_tokens: 900,
        store: true,
      };

      if (previousResponseId) {
        clarRequest.previous_response_id = previousResponseId;
      }

      const aiResponse = await openai.responses.parse(clarRequest);

      const { result, usage } = formatStructureResponse(aiResponse, CLARIFICATION_MODEL);

      const responseForClient = {
        success: true,
        status: result.status,
        questions: null as string[] | null,
        suggestedTargets: result.suggestedTargets ?? null,
        selectedTargets: result.selectedTargets ?? null,
        ops: null as unknown[] | null,
        tokenUsage: usage,
        responseId: aiResponse.id,
      };

      if (result.status === "clarification_needed") {
        responseForClient.questions = result.questions;
      } else {
        responseForClient.ops = result.ops;
      }

      return responseForClient;
    }

    const { payload, previousResponseId } = buildStructureRefinePayload(data || {});

    logger.info("Payload:", payload);

    logger.info("Calling OpenAI for structure refinement (initial)");
    const initialRequest: any = {
      model: INITIAL_MODEL,
      input: [
        { role: "system", content: STRUCTURE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      text: { format: STRUCTURE_REFINE_TEXT_FORMAT },
      max_output_tokens: 1200,
      store: true,
    };

    if (previousResponseId) {
      initialRequest.previous_response_id = previousResponseId;
    }

    const aiResponse = await openai.responses.parse(initialRequest);

    logger.info("AI Response:", aiResponse);

    const { result, usage } = formatStructureResponse(aiResponse, INITIAL_MODEL);

    const responseForClient = {
      success: true,
      status: result.status,
      questions: null as string[] | null,
      suggestedTargets: result.suggestedTargets ?? null,
      selectedTargets: result.selectedTargets ?? null,
      ops: null as unknown[] | null,
      tokenUsage: usage,
      responseId: aiResponse.id,
    };

    if (result.status === "clarification_needed") {
      responseForClient.questions = result.questions;
    } else {
      responseForClient.ops = result.ops;
    }

    return responseForClient;
  } catch (error) {
    logger.error("Error in refineStructure", error);

    if (error instanceof HttpsError) {
      throw error;
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
