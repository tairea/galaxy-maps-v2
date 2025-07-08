import { z } from "zod";

// Schema for gathering context questions
export const GatheringContextSchema = z.object({
  status: z.literal("gathering_context"),
  questions: z.array(z.string()).min(1),
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
export type GatheringContextResponse = z.infer<typeof GatheringContextSchema>;
export type JourneyReadyResponse = z.infer<typeof JourneyReadySchema>;
export type GalaxyCreationResponse = z.infer<typeof GalaxyCreationResponseSchema>;
