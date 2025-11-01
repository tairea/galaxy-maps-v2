import type { StructurePatchOp } from "./structure-refine-schemas";

export interface MissionTask {
  id?: string;
  order?: number;
  taskContent: string;
}

export interface MissionStep {
  id?: string;
  order?: number;
  title: string;
  checkpoint: string;
  tasks: MissionTask[];
}

export interface MissionInstructions {
  intro: string;
  steps: MissionStep[];
  outro: string;
}

export interface PlanetNode {
  id: string;
  order?: number;
  title: string;
  description?: string;
  missionInstructions?: MissionInstructions;
  missionInstructionsHtmlString?: string;
}

export interface StarNode {
  id: string;
  order?: number;
  title: string;
  description?: string;
  planets: PlanetNode[];
}

export interface GalaxyMapNode {
  stars: StarNode[];
  [key: string]: unknown;
}

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateCuidLike(): string {
  const length = 24;
  const chars = [] as string[];
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i += 1) {
      chars.push(alphabet[randomValues[i] % alphabet.length]);
    }
  } else {
    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * alphabet.length);
      chars.push(alphabet[index]);
    }
  }
  return chars.join("");
}

function createId(prefix: "star" | "planet" | "step" | "task") {
  return `${prefix}_${generateCuidLike()}`;
}

function safeClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function renumberStars(stars: StarNode[]) {
  stars.forEach((star, starIndex) => {
    star.order = starIndex;
    if (Array.isArray(star.planets)) {
      star.planets.forEach((planet, planetIndex) => {
        planet.order = planetIndex;
      });
    }
  });
}

function renumberPlanets(star: StarNode) {
  star.planets.forEach((planet, planetIndex) => {
    planet.order = planetIndex;
  });
}

function idifyMission(mission: MissionInstructions): MissionInstructions {
  const steps = (mission.steps || []).map((step, stepIndex) => ({
    ...step,
    id: step.id ?? createId("step"),
    order: stepIndex,
    tasks: (step.tasks || []).map((task, taskIndex) => ({
      ...task,
      id: task.id ?? createId("task"),
      order: taskIndex,
    })),
  }));

  return {
    intro: mission.intro,
    steps,
    outro: mission.outro,
  };
}

function toMinimalPlanet(planet: PlanetNode, override?: Partial<PlanetNode>): PlanetNode {
  const base: PlanetNode = {
    id: planet.id,
    order: planet.order,
    title: planet.title,
    description: planet.description,
    missionInstructions: planet.missionInstructions,
    missionInstructionsHtmlString: planet.missionInstructionsHtmlString,
  };
  return { ...base, ...override };
}

function buildNewStar(op: Extract<StructurePatchOp, { op: "insert_star_after" }>): StarNode {
  const star: StarNode = {
    id: createId("star"),
    order: 0,
    title: op.newStar.title,
    description: op.newStar.description,
    planets: op.newStar.planets.map((planet, index) => {
      const mission = planet.missionInstructions
        ? idifyMission(planet.missionInstructions)
        : undefined;
      return {
        id: createId("planet"),
        order: index,
        title: planet.title,
        description: planet.description,
        ...(mission ? { missionInstructions: mission } : {}),
        ...(planet.missionInstructionsHtmlString
          ? { missionInstructionsHtmlString: planet.missionInstructionsHtmlString }
          : {}),
      } satisfies PlanetNode;
    }),
  };

  return star;
}

function buildNewPlanet(op: Extract<StructurePatchOp, { op: "insert_planet_after" }>): PlanetNode {
  const mission = op.newPlanet.missionInstructions
    ? idifyMission(op.newPlanet.missionInstructions)
    : undefined;

  return {
    id: createId("planet"),
    order: 0,
    title: op.newPlanet.title,
    description: op.newPlanet.description,
    ...(mission ? { missionInstructions: mission } : {}),
    ...(op.newPlanet.missionInstructionsHtmlString
      ? { missionInstructionsHtmlString: op.newPlanet.missionInstructionsHtmlString }
      : {}),
  } satisfies PlanetNode;
}

function buildSplitPlanets(
  op: Extract<StructurePatchOp, { op: "split_planet" }>,
): PlanetNode[] {
  return op.newPlanets.map((planet, index) => ({
    id: createId("planet"),
    order: index,
    title: planet.title,
    description: planet.description,
    missionInstructions: idifyMission(planet.missionInstructions),
  }));
}

export function applyStructureOps(map: GalaxyMapNode, ops: StructurePatchOp[]): GalaxyMapNode {
  const draft = safeClone(map);
  const stars = draft.stars || [];

  const findStarIndex = (id: string) => stars.findIndex((star) => star.id === id);
  const requireStar = (id: string) => {
    const starIndex = findStarIndex(id);
    return starIndex >= 0 ? { star: stars[starIndex], starIndex } : null;
  };

  const renumberAllStars = () => renumberStars(stars);

  for (const op of ops) {
    switch (op.op) {
      case "insert_star_after": {
        const idx = findStarIndex(op.target.starId);
        if (idx < 0) break;
        const newStar = buildNewStar(op);
        stars.splice(idx + 1, 0, newStar);
        renumberAllStars();
        break;
      }
      case "delete_star": {
        const idx = findStarIndex(op.target.starId);
        if (idx >= 0) {
          stars.splice(idx, 1);
          renumberAllStars();
        }
        break;
      }
      case "move_star": {
        const idx = findStarIndex(op.target.starId);
        if (idx < 0) break;
        const [star] = stars.splice(idx, 1);
        let insertAt = stars.length;
        if (op.position.beforeStarId) {
          const beforeIdx = findStarIndex(op.position.beforeStarId);
          if (beforeIdx >= 0) insertAt = beforeIdx;
        } else if (op.position.afterStarId) {
          const afterIdx = findStarIndex(op.position.afterStarId);
          if (afterIdx >= 0) insertAt = afterIdx + 1;
        }
        stars.splice(insertAt, 0, star);
        renumberAllStars();
        break;
      }
      case "reorder_stars": {
        const existing = new Map(stars.map((star) => [star.id, star] as const));
        const reordered: StarNode[] = [];
        op.orderedStarIds.forEach((id) => {
          const star = existing.get(id);
          if (star) reordered.push(star);
        });
        stars.splice(0, stars.length, ...reordered);
        renumberAllStars();
        break;
      }
      case "replace_star_fields": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        Object.assign(record.star, op.fields);
        break;
      }
      case "insert_planet_after": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const planetIndex = star.planets.findIndex((planet) => planet.id === op.target.planetId);
        if (planetIndex < 0) break;
        const newPlanet = buildNewPlanet(op);
        star.planets.splice(planetIndex + 1, 0, newPlanet);
        renumberPlanets(star);
        break;
      }
      case "delete_planet": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const idx = star.planets.findIndex((planet) => planet.id === op.target.planetId);
        if (idx >= 0) {
          star.planets.splice(idx, 1);
          renumberPlanets(star);
        }
        break;
      }
      case "move_planet": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const idx = star.planets.findIndex((planet) => planet.id === op.target.planetId);
        if (idx < 0) break;
        const [planet] = star.planets.splice(idx, 1);
        let insertAt = star.planets.length;
        if (op.position.beforePlanetId) {
          const beforeIdx = star.planets.findIndex((p) => p.id === op.position.beforePlanetId);
          if (beforeIdx >= 0) insertAt = beforeIdx;
        } else if (op.position.afterPlanetId) {
          const afterIdx = star.planets.findIndex((p) => p.id === op.position.afterPlanetId);
          if (afterIdx >= 0) insertAt = afterIdx + 1;
        }
        star.planets.splice(insertAt, 0, planet);
        renumberPlanets(star);
        break;
      }
      case "reorder_planets": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const existing = new Map(star.planets.map((planet) => [planet.id, planet] as const));
        const reordered: PlanetNode[] = [];
        op.orderedPlanetIds.forEach((id) => {
          const planet = existing.get(id);
          if (planet) reordered.push(planet);
        });
        star.planets.splice(0, star.planets.length, ...reordered);
        renumberPlanets(star);
        break;
      }
      case "replace_planet_fields": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const planet = star.planets.find((p) => p.id === op.target.planetId);
        if (planet) {
          Object.assign(planet, op.fields);
        }
        break;
      }
      case "split_planet": {
        const record = requireStar(op.target.starId);
        if (!record) break;
        const { star } = record;
        const idx = star.planets.findIndex((planet) => planet.id === op.target.planetId);
        if (idx < 0) break;
        const replacements = buildSplitPlanets(op);
        star.planets.splice(idx, 1, ...replacements);
        renumberPlanets(star);
        break;
      }
      default: {
        const exhaustive: never = op;
        console.warn("Unhandled structure op", exhaustive);
      }
    }
  }

  return draft;
}

export function cloneGalaxyMap(map: GalaxyMapNode): GalaxyMapNode {
  return safeClone(map);
}

export function captureStarSnapshot(star: StarNode): PlanetNode[] {
  return star.planets.map((planet) => toMinimalPlanet(planet));
}

// TODO: validate the updated draft against canonical Zod schemas before persisting upstream.
