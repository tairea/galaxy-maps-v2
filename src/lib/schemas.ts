import { z } from "zod";

// Schema for stars list response with journey metadata (first step)
// export const StarsListSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   stars: z.array(z.string()).min(1),
// });

// Schema for gathering context questions
// export const GatheringContextSchema = z.object({
//   status: z.literal("clarification_needed"),
//   questions: z.array(z.string()).min(1),
// });

// Schema for first step response (either stars list or gathering context)
// This needs to be a single object schema for zodTextFormat compatibility
export const FirstStepResponseSchema = z
  .object({
    // Optional fields for stars list response
    status: z.enum(["clarification_needed", "journey_ready"]).nullable(),
    questions: z.array(z.string()).nullable(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    stars: z.array(z.string()).nullable(),
  })
  // .refine(
  //   (data) => {
  //     // Must have gathering context fields OR journey_ready
  //     const hasClarificationNeeded =
  //       data.status === "clarification_needed" && data.questions && data.questions.length > 0;
  //     const hasJourneyStepsReady =
  //       data.status === "journey_ready" &&
  //       data.title &&
  //       data.description &&
  //       data.stars &&
  //       data.stars.length > 0;

  //     return hasClarificationNeeded || hasJourneyStepsReady;
  //   },
  //   {
  //     message:
  //       "Response must contain either clarification_needed data, or journey_ready data",
  //   },
  // );
  .refine(
    (data) => {
      if (data.status === "clarification_needed") {
        return data.questions && data.questions.length > 0;
      } else if (data.status === "journey_ready") {
        return data.title && data.description && data.stars && data.stars.length > 0;
      }
      return false;
    },
    {
      message: "Invalid response structure based on status",
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
// export const JourneyStepSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   actions: z
//     .array(
//       z.object({
//         title: z.string(),
//         description: z.string(),
//       }),
//     )
//     .min(1),
// });

// Schema for journey missions
export const JourneyMissionsSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Schema for journey planets
export const JourneyPlanetsSchema = z.object({
  title: z.string(),
  description: z.string(),
  missions: z.array(JourneyMissionsSchema).min(1),
});

// Schema for journey stars
export const JourneyStarsSchema = z.object({
  title: z.string(),
  description: z.string(),
  planets: z.array(JourneyPlanetsSchema).min(1),
});

// Combined schema for all possible responses (works with zodTextFormat)
export const StarsAndPlanetsResponseSchema = z
  .object({
    status: z.enum(["clarification_needed", "journey_ready"]),
    questions: z.array(z.string()).nullable(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    stars: z.array(JourneyStarsSchema).nullable(),
  })
  .refine(
    (data) => {
      if (data.status === "clarification_needed") {
        return data.questions && data.questions.length > 0;
      } else if (data.status === "journey_ready") {
        return data.title && data.description && data.stars && data.stars.length > 0;
      }
      return false;
    },
    {
      message: "Invalid response structure based on status",
    },
  );

// Type exports for TypeScript
// export type StarsListResponse = z.infer<typeof StarsListSchema>;
// export type GatheringContextResponse = z.infer<typeof GatheringContextSchema>;
export type FirstStepResponse = z.infer<typeof FirstStepResponseSchema>;
export type StarsPlanetsResponse = z.infer<typeof StarsPlanetsSchema>;
export type MissionsResponse = z.infer<typeof MissionsSchema>;
// export type JourneyReadyResponse = z.infer<typeof JourneyReadySchema>;
// export type GalaxyCreationResponse = z.infer<typeof GalaxyCreationResponseSchema>;
