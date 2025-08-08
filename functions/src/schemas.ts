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
    image: z
      .object({
        name: z.string(),
        url: z.string(),
      })
      .nullable()
      .optional(),
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

// Schema for course-to-galaxy conversion (without status/questions)
export const CourseToGalaxyMapSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  stars: z.array(JourneyStarsSchema).nullable(),
  image: z
    .object({
      name: z.string(),
      url: z.string(),
    })
    .nullable()
    .optional(),
});

// Type export for course-to-galaxy conversion
export type CourseToGalaxyMap = z.infer<typeof CourseToGalaxyMapSchema>;

// Schema for mission instructions
export const MissionInstructionsSchema = z.object({
  title: z.string(),
  description: z.string(),
  instructions: z.array(z.string()).min(1),
  learningObjectives: z.array(z.string()).min(1),
  estimatedDuration: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  prerequisites: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
});

// Type export for mission instructions
export type MissionInstructions = z.infer<typeof MissionInstructionsSchema>;

// Schema for mission task content
export const MissionTaskSchema = z.object({
  taskContent: z.string(),
});

// Schema for mission instruction step
export const MissionInstructionStepSchema = z.object({
  title: z.string(),
  tasks: z.array(MissionTaskSchema).min(1),
});

// Schema for the new mission instructions format
export const MissionInstructionsV2Schema = z.object({
  title: z.string(),
  description: z.string(),
  instructions: z.array(MissionInstructionStepSchema).min(1),
  summary: z.string(),
});

// Type export for the new mission instructions format
export type MissionInstructionsV2 = z.infer<typeof MissionInstructionsV2Schema>;

// Schema for YouTube video search results
export const YouTubeVideoSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  relevance: z.string().optional(),
});

export const YouTubeSearchResultsSchema = z.object({
  videos: z.array(YouTubeVideoSchema).min(1),
  searchSummary: z.string().optional(),
});

// Type exports for YouTube search results
export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;
export type YouTubeSearchResults = z.infer<typeof YouTubeSearchResultsSchema>;
