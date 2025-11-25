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

// Schema for YouTube video search results
export const YouTubeVideoSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  relevance: z.string().optional(),
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
  // youtubeVideos: z.array(YouTubeVideoSchema).optional(),
  summary: z.string(),
});

// Type export for the new mission instructions format
export type MissionInstructionsV2 = z.infer<typeof MissionInstructionsV2Schema>;

// Type exports for YouTube search results
export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

/* ----------------------- Generate Unified Galaxy Map Schema ---------------------------- */

// Helpers
const cuid2 = /[a-z0-9]{24}/; // typical cuid2 length; adjust if your lib differs

// Leaf (keep unified client/server agreement: no ids/orders here)
export const UnifiedJourneyTaskSchema = z.object({
  taskContent: z.string().min(1),
});

export const UnifiedJourneyStepSchema = z.object({
  title: z.string().min(1),
  tasks: z.array(UnifiedJourneyTaskSchema).min(1),
  checkpoint: z.string().min(1),
});

export const UnifiedMissionInstructionsSchema = z.object({
  intro: z.string().min(1),
  steps: z.array(UnifiedJourneyStepSchema).min(1),
  outro: z.string().min(1),
});

// Mid-level (no ids/orders to match model output and client schema)
export const UnifiedJourneyPlanetsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  missionInstructions: UnifiedMissionInstructionsSchema,
});

export const UnifiedJourneyStarsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  planets: z.array(UnifiedJourneyPlanetsSchema).min(1),
});

// Top-level
export const UnifiedGalaxyMapResponseSchema = z
  .object({
    status: z.enum(["clarification_needed", "journey_ready"]),
    questions: z.array(z.string().min(1)).nullable(),

    title: z.string().nullable(),
    description: z.string().nullable(),
    stars: z.array(UnifiedJourneyStarsSchema).nullable(),

    image: z.object({ name: z.string(), url: z.string() }).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "clarification_needed")
        return Array.isArray(data.questions) && data.questions.length > 0;
      if (data.status === "journey_ready")
        return Boolean(data.title && data.description && data.stars && data.stars.length > 0);
      return false;
    },
    { message: "Invalid response structure based on status" },
  );

/* ----------------------- Types ---------------------------- */

export type UnifiedTask = z.infer<typeof UnifiedJourneyTaskSchema>;
export type UnifiedStep = z.infer<typeof UnifiedJourneyStepSchema>;
export type UnifiedMissionInstructions = z.infer<typeof UnifiedMissionInstructionsSchema>;
export type UnifiedPlanet = z.infer<typeof UnifiedJourneyPlanetsSchema>;
export type UnifiedStar = z.infer<typeof UnifiedJourneyStarsSchema>;
export type UnifiedGalaxyMapResponse = z.infer<typeof UnifiedGalaxyMapResponseSchema>;

/** 0–100 percentage (integer or float). Keep the model output in this scale. */
const Pct100 = z.number().min(0).max(100);

/** Up to 3 short bullets is ideal for readability. */
const ShortBullets = z.array(z.string().min(1)).max(3);

/** Student status categories for triage. */
export const StudentStatus = z.enum(["on-track", "watch", "at-risk"]);

/** Per-course progress line for a student (kept compact for UI). */
export const ProgressItemSchema = z
  .object({
    course: z.string().min(1), // e.g., "WEB DEV 1"
    courseId: z.string().min(1),
    pct: Pct100, // e.g., 54
    done: z.string().min(1), // e.g., "23/43 tasks, 6/13 topics"
  })
  .strict();

/** Top summary for coaches/captains. */
export const SquadSummarySchema = z
  .object({
    headline: z.string().min(1),
    overallProgressPct: Pct100, // overall 0–100
    activeVsInactive: z
      .object({
        active: z.number().int().nonnegative(),
        inactive: z.number().int().nonnegative(),
      })
      .strict(),
    trends: ShortBullets, // 0–3 bullets
    risks: ShortBullets, // 0–3 bullets
    recommendedActions: ShortBullets, // 0–3 bullets
  })
  .strict();

/** One student’s status block. */
export const StudentReportSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    status: StudentStatus,
    lastActive: z.string().datetime(), // ISO 8601
    progress: z.array(ProgressItemSchema).min(1),
    reasons: z.array(z.string().min(1)).max(5),
    suggestedInterventions: z.array(z.string().min(1)).max(3),
  })
  .strict();

/** Full AI response. */
export const SquadReportSchema = z
  .object({
    squadSummary: SquadSummarySchema,
    students: z.array(StudentReportSchema).min(1),
  })
  .strict();

/** Inferred TypeScript types */
export type SquadReport = z.infer<typeof SquadReportSchema>;
export type StudentReport = z.infer<typeof StudentReportSchema>;
export type ProgressItem = z.infer<typeof ProgressItemSchema>;

/* ---------------- Refine Structure (Stars & Planets Schema) ---------------- */

export type StructureRefineResponse = z.infer<typeof StructureRefineResponseSchema>;

// ---------- IDs ----------
const createStructureId = (prefix: string) =>
  z.string().regex(new RegExp("^" + prefix + "_" + cuid2.source + "$"));
const StarId = createStructureId("star");
const PlanetId = createStructureId("planet");

// ---------- Targets & Candidates ----------
export const StructureTargetsSchema = z.object({
  starIds: z.array(StarId).optional(),
  planetIds: z.array(PlanetId).optional(),
});

export const StructureCandidatesSchema = z.object({
  stars: z
    .array(
      z.object({
        id: StarId,
        title: z.string(),
        description: z.string().optional(),
        order: z.number().int().nonnegative().optional(),
      }),
    )
    .max(12)
    .optional(),
  planets: z
    .array(
      z.object({
        id: PlanetId,
        starId: StarId,
        title: z.string(),
        description: z.string().optional(),
        order: z.number().int().nonnegative().optional(),
      }),
    )
    .max(20)
    .optional(),
});

// ---------- Field fragments ----------
const StarFields = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const PlanetFields = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

// Minimal mission (for new/split planets only; keep it tiny but valid)
const MinimalTask = z.object({ taskContent: z.string().min(1) });
const MinimalStep = z.object({
  title: z.string().min(1),
  tasks: z.array(MinimalTask).min(1),
  checkpoint: z.string().min(1),
});
const MinimalMission = z.object({
  intro: z.string().min(1),
  steps: z.array(MinimalStep).min(1),
  outro: z.string().min(1),
});

// ---------- Targets (for ops) ----------
const TargetStar = z.object({ starId: StarId });
const TargetPlanet = z.object({ starId: StarId, planetId: PlanetId });

// ---------- Star ops ----------
const InsertStarAfterOp = z.object({
  op: z.literal("insert_star_after"),
  target: TargetStar, // insert AFTER this star
  newStar: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    planets: z
      .array(
        z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          missionInstructions: MinimalMission.optional(),
          missionInstructionsHtmlString: z.string().min(1).optional(),
        }),
      )
      .min(1),
  }),
});

const DeleteStarOp = z.object({
  op: z.literal("delete_star"),
  target: TargetStar,
});

const MoveStarOp = z.object({
  op: z.literal("move_star"),
  target: TargetStar,
  position: z
    .object({
      beforeStarId: StarId.optional(),
      afterStarId: StarId.optional(),
    })
    .refine((p) => !!p.beforeStarId || !!p.afterStarId, {
      message: "Provide beforeStarId or afterStarId",
    }),
});

const ReorderStarsOp = z.object({
  op: z.literal("reorder_stars"),
  orderedStarIds: z.array(StarId).min(1),
});

const ReplaceStarFieldsOp = z.object({
  op: z.literal("replace_star_fields"),
  target: TargetStar,
  fields: StarFields,
});

// ---------- Planet ops ----------
const InsertPlanetAfterOp = z.object({
  op: z.literal("insert_planet_after"),
  target: TargetPlanet, // insert AFTER this planet in same star
  newPlanet: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    missionInstructions: MinimalMission.optional(),
    missionInstructionsHtmlString: z.string().min(1).optional(),
  }),
});

const DeletePlanetOp = z.object({
  op: z.literal("delete_planet"),
  target: TargetPlanet,
});

const MovePlanetOp = z.object({
  op: z.literal("move_planet"),
  target: TargetPlanet,
  position: z
    .object({
      beforePlanetId: PlanetId.optional(),
      afterPlanetId: PlanetId.optional(),
    })
    .refine((p) => !!p.beforePlanetId || !!p.afterPlanetId, {
      message: "Provide beforePlanetId or afterPlanetId",
    }),
});

const ReorderPlanetsOp = z.object({
  op: z.literal("reorder_planets"),
  target: TargetStar,
  orderedPlanetIds: z.array(PlanetId).min(1),
});

const ReplacePlanetFieldsOp = z.object({
  op: z.literal("replace_planet_fields"),
  target: TargetPlanet,
  fields: PlanetFields,
});

const SplitPlanetOp = z.object({
  op: z.literal("split_planet"),
  target: TargetPlanet,
  newPlanets: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        missionInstructions: MinimalMission,
      }),
    )
    .min(2),
});

// ---------- Union + Response ----------
export const StructurePatchOpSchema = z.discriminatedUnion("op", [
  // Star
  InsertStarAfterOp,
  DeleteStarOp,
  MoveStarOp,
  ReorderStarsOp,
  ReplaceStarFieldsOp,
  // Planet
  InsertPlanetAfterOp,
  DeletePlanetOp,
  MovePlanetOp,
  ReorderPlanetsOp,
  ReplacePlanetFieldsOp,
  SplitPlanetOp,
]);
export type StructurePatchOp = z.infer<typeof StructurePatchOpSchema>;

const StructureRefineResponseClarification = z.object({
  status: z.literal("clarification_needed"),
  questions: z.array(z.string().min(1)).min(1).max(3),
  suggestedTargets: StructureTargetsSchema.optional(),
  selectedTargets: StructureTargetsSchema.optional(),
});

const StructureRefineResponseReady = z.object({
  status: z.literal("journey_ready"),
  ops: z.array(StructurePatchOpSchema).min(1),
  // If caller provided no targets, the model may include what it acted on
  selectedTargets: StructureTargetsSchema.optional(),
  suggestedTargets: StructureTargetsSchema.optional(),
});

export const StructureRefineResponseSchema = z.discriminatedUnion("status", [
  StructureRefineResponseClarification,
  StructureRefineResponseReady,
]);

// A permissive schema for model response_format that avoids unions/refines.
// We still validate strictly with StructureRefineResponseSchema after parsing.
export const StructureRefineResponseAIFriendlySchema = z.object({
  status: z.enum(["journey_ready", "clarification_needed"]),
  selectedTargets: StructureTargetsSchema.optional(),
  suggestedTargets: StructureTargetsSchema.optional(),
  questions: z.array(z.string()).optional(),
  ops: z.array(StructurePatchOpSchema).optional(),
});
