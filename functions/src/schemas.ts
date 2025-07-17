import { z } from "zod";

// Schema for journey missions
export const JourneyMissionsSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Schema for journey planets
export const JourneyPlanetsSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Schema for journey stars
export const JourneyStarsSchema = z.object({
  title: z.string(),
  description: z.string(),
  planets: z.array(JourneyPlanetsSchema).min(1),
});

// Combined schema for all possible responses
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
export type StarsAndPlanetsResponse = z.infer<typeof StarsAndPlanetsResponseSchema>;
