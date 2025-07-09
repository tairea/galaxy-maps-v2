import { z } from "zod";

// Schema for stars list response with journey metadata (first step)
export const StarsListSchema = z.object({
  title: z.string(),
  description: z.string(),
  stars: z.array(z.string()).min(1),
});

// Schema for gathering context questions
export const GatheringContextSchema = z.object({
  status: z.literal("gathering_context"),
  questions: z.array(z.string()).min(1),
});

// Schema for first step response (either stars list or gathering context)
// This needs to be a single object schema for zodTextFormat compatibility
export const FirstStepResponseSchema = z
  .object({
    // Optional fields for stars list response
    title: z.string().nullable(),
    description: z.string().nullable(),
    stars: z.array(z.string()).nullable(),

    // Optional fields for gathering context response
    status: z.literal("gathering_context").nullable(),
    questions: z.array(z.string()).nullable(),
  })
  .refine(
    (data) => {
      // Must have either stars list fields OR gathering context fields
      const hasStarsList = data.title && data.description && data.stars && data.stars.length > 0;
      const hasGatheringContext =
        data.status === "gathering_context" && data.questions && data.questions.length > 0;

      return hasStarsList || hasGatheringContext;
    },
    {
      message: "Response must contain either stars list data or gathering context data",
    },
  );

// Schema for star with planets breakdown
export const StarsPlanetsSchema = z.object({
  star: z.string(),
  description: z.string(),
  planets: z.array(z.string()).min(1),
});

// Schema for planet with missions breakdown
export const MissionsSchema = z.object({
  planet: z.string(),
  description: z.string(),
  missions: z.array(z.string()).min(1),
});

// Schema for journey step actions
export const JourneyStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  actions: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
});

// Schema for journey milestones
export const JourneyMilestoneSchema = z.object({
  title: z.string(),
  description: z.string(),
  steps: z.array(JourneyStepSchema).min(1),
});

// Schema for complete journey ready response
export const JourneyReadySchema = z.object({
  status: z.literal("journey_ready"),
  journeyTitle: z.string(),
  journeyDescription: z.string(),
  milestones: z.array(JourneyMilestoneSchema).min(1),
});

// Combined schema for all possible responses (works with zodTextFormat)
export const GalaxyCreationResponseSchema = z
  .object({
    status: z.enum(["gathering_context", "journey_ready"]),
    questions: z.array(z.string()).nullable(),
    journeyTitle: z.string().nullable(),
    journeyDescription: z.string().nullable(),
    milestones: z.array(JourneyMilestoneSchema).nullable(),
  })
  .refine(
    (data) => {
      if (data.status === "gathering_context") {
        return data.questions && data.questions.length > 0;
      } else if (data.status === "journey_ready") {
        return (
          data.journeyTitle &&
          data.journeyDescription &&
          data.milestones &&
          data.milestones.length > 0
        );
      }
      return false;
    },
    {
      message: "Invalid response structure based on status",
    },
  );

// Type exports for TypeScript
export type StarsListResponse = z.infer<typeof StarsListSchema>;
export type GatheringContextResponse = z.infer<typeof GatheringContextSchema>;
export type FirstStepResponse = z.infer<typeof FirstStepResponseSchema>;
export type StarsPlanetsResponse = z.infer<typeof StarsPlanetsSchema>;
export type MissionsResponse = z.infer<typeof MissionsSchema>;
export type JourneyReadyResponse = z.infer<typeof JourneyReadySchema>;
export type GalaxyCreationResponse = z.infer<typeof GalaxyCreationResponseSchema>;
