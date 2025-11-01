import { z } from "zod";

/**
 * Prompt used by the structure refiner cloud function. Exposed here for tooling/tests.
 * The UI does not send this prompt directly.
 */
export const STRUCTURE_SYSTEM_PROMPT = `
You are the **Galaxy Map Structure Refiner**.

Return **only structure patch operations** that modify Stars and Planets topology or metadata.
Do NOT return full objects. Do NOT edit mission instructions content (intro/steps/tasks/checkpoints/outro or HTML) in this mode.

## Model
- Galaxy Map: Stars → Planets. (Mission text is edited in a different tool.)
- Every Star/Planet has a stable \`id\` and integer \`order\`. UI numbers are derived from order.

## Inputs you may receive
- \`user_request\`: what to change (may be broad).
- Either:
  - **Targets provided**: \`targets\` with starIds and/or planetIds (non-empty).
  - **No targets provided**: \`candidates\` containing a small list of star and planet summaries for you to choose from.
- Optional \`neighbors\`, and a \`styleGuide\`.

## Targeting rules
- If \`targets\` is non-empty: you MUST limit all edits to those IDs and their direct children:
  - If a **Star** is targeted: you may edit that Star and its **own planets** (insert/move/delete/reorder, rename).
  - If a **Planet** is targeted: you may edit only that Planet (title/description or position within its Star).
- If **no targets** are provided:
  - Choose the **minimum necessary** \`selectedTargets\` from \`candidates\` that satisfy the request.
  - If uncertain, return \`clarification_needed\` with 1–3 concise questions and (optionally) a \`suggestedTargets\` list.

## Planet scope
- Each Planet must remain an **atomic 15–60 minute** win.
- If a structural change would bloat scope, use \`split_planet\` with minimal placeholder missions (1 short step ok). Detailed text will be refined later in the Instructions tool.

## Allowed ops (only these)
- Star-level: \`insert_star_after\` | \`delete_star\` | \`move_star\` | \`reorder_stars\` | \`replace_star_fields\`
- Planet-level: \`insert_planet_after\` | \`delete_planet\` | \`move_planet\` | \`reorder_planets\` | \`replace_planet_fields\` | \`split_planet\`

## Output
Return JSON with:
- \`status\`: "journey_ready" OR "clarification_needed"
- If you selected targets (only when none were provided): \`selectedTargets\` with starIds and/or planetIds (non-empty).
- If clarification: \`questions\`: [≤3], and optionally \`suggestedTargets\`.
- If ready: \`ops\`: [structure ops], touching **only** the provided targets or your \`selectedTargets\`.

Return ONLY the JSON per the schema; no commentary.
`;

// ---------- ID helpers ----------
const cuid2 = /[a-z0-9]{24}/;
const Id = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_` + cuid2.source + `$`), {
    message: `${prefix} id must match ${prefix}_<cuid2>`,
  });

export const StarId = Id("star");
export const PlanetId = Id("planet");

// ---------- Targets & Candidates ----------
export const StructureTargetsSchema = z.object({
  starIds: z.array(StarId).min(1).optional(),
  planetIds: z.array(PlanetId).min(1).optional(),
});
export type StructureTargets = z.infer<typeof StructureTargetsSchema>;

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
export type StructureCandidates = z.infer<typeof StructureCandidatesSchema>;

// ---------- Minimal mission scaffolds (for split/insert) ----------
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

// ---------- Targets for ops ----------
const TargetStar = z.object({ starId: StarId });
const TargetPlanet = z.object({ starId: StarId, planetId: PlanetId });

// ---------- Field fragments ----------
const StarFields = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});
const PlanetFields = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

// ---------- Star ops ----------
const InsertStarAfterOp = z.object({
  op: z.literal("insert_star_after"),
  target: TargetStar,
  newStar: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    planets: z
      .array(
        z
          .object({
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
    .refine((pos) => !!pos.beforeStarId || !!pos.afterStarId, {
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
  target: TargetPlanet,
  newPlanet: z
    .object({
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
    .refine((pos) => !!pos.beforePlanetId || !!pos.afterPlanetId, {
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
  InsertStarAfterOp,
  DeleteStarOp,
  MoveStarOp,
  ReorderStarsOp,
  ReplaceStarFieldsOp,
  InsertPlanetAfterOp,
  DeletePlanetOp,
  MovePlanetOp,
  ReorderPlanetsOp,
  ReplacePlanetFieldsOp,
  SplitPlanetOp,
]);
export type StructurePatchOp = z.infer<typeof StructurePatchOpSchema>;

export const StructureRefineResponseSchema = z
  .object({
    status: z.enum(["journey_ready", "clarification_needed"]),
    selectedTargets: StructureTargetsSchema.optional(),
    suggestedTargets: StructureTargetsSchema.optional(),
    questions: z.array(z.string().min(1)).max(3).optional(),
    ops: z.array(StructurePatchOpSchema).optional(),
  })
  .refine(
    (response) => {
      if (response.status === "clarification_needed") {
        return !!response.questions && !response.ops;
      }
      if (response.status === "journey_ready") {
        return !!response.ops && response.ops.length > 0;
      }
      return false;
    },
    { message: "Return ops on journey_ready; return questions only on clarification_needed." },
  );

export type StructureRefineResponse = z.infer<typeof StructureRefineResponseSchema>;

export type StructureNeighbors = Record<string, { prevTitle?: string; nextTitle?: string }>;
