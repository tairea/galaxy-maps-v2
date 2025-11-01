// structure-context.ts
type MinimalStar = {
  id: string;
  order: number;
  title: string;
  description: string;
  planets?: Array<{ id: string; order: number; title: string; description: string }>;
};

type MinimalPlanet = {
  id: string;
  starId: string;
  order: number;
  title: string;
  description: string;
};

type Neighbors = Record<string, { prevTitle?: string; nextTitle?: string }>;

export function buildIndexes(map: any) {
  const starById = new Map<string, any>();
  const planetById = new Map<string, any>();
  const planetParentById = new Map<string, string>(); // planetId -> starId

  for (const star of map.stars ?? []) {
    starById.set(star.id, star);
    for (const planet of star.planets ?? []) {
      planetById.set(planet.id, planet);
      planetParentById.set(planet.id, star.id);
    }
  }
  return { starById, planetById, planetParentById };
}

export function minimalStar(star: any, withPlanets = false): MinimalStar {
  return {
    id: star.id,
    order: star.order ?? 0,
    title: star.title ?? "",
    description: star.description ?? "",
    planets: withPlanets
      ? (star.planets ?? []).map((p: any) => ({
          id: p.id,
          order: p.order ?? 0,
          title: p.title ?? "",
          description: p.description ?? "",
        }))
      : undefined,
  };
}

export function minimalPlanet(planet: any, starId: string): MinimalPlanet {
  return {
    id: planet.id,
    starId,
    order: planet.order ?? 0,
    title: planet.title ?? "",
    description: planet.description ?? "",
  };
}

export function computePlanetNeighbors(
  star: any,
  planetId: string,
): { prevTitle?: string; nextTitle?: string } {
  const arr = star.planets ?? [];
  const i = arr.findIndex((p: any) => p.id === planetId);
  if (i < 0) return {};
  return {
    prevTitle: arr[i - 1]?.title,
    nextTitle: arr[i + 1]?.title,
  };
}

/**
 * Hydrate the minimal payloads the Structure refiner needs based on selected targets.
 * - If starIds are present: return those stars (with planets list for reorders/moves).
 * - If planetIds are present: return their minimal planet rows + parent star rows (with planet lists).
 * - neighbors is computed only for planetIds (optional).
 */
export function collectStructureContextFromTargets(
  map: any,
  targets: { starIds?: string[]; planetIds?: string[] },
) {
  const { starById, planetById, planetParentById } = buildIndexes(map);

  const starsSet = new Set<string>();
  const planetsOut: MinimalPlanet[] = [];
  const neighbors: Neighbors = {};

  // Include selected stars
  for (const sid of targets.starIds ?? []) {
    if (starById.has(sid)) starsSet.add(sid);
  }

  // Include parent stars for selected planets, and collect the planets themselves
  for (const pid of targets.planetIds ?? []) {
    const starId = planetParentById.get(pid);
    const planet = planetById.get(pid);
    if (!starId || !planet) continue;
    starsSet.add(starId);
    planetsOut.push(minimalPlanet(planet, starId));
    // Optional neighbors, useful for move/rename
    const star = starById.get(starId);
    neighbors[pid] = computePlanetNeighbors(star, pid);
  }

  // Build minimal stars, including planets list so the model can reorder/move
  const starsOut: MinimalStar[] = [];
  for (const sid of starsSet) {
    const star = starById.get(sid);
    if (!star) continue;
    starsOut.push(minimalStar(star, /*withPlanets*/ true));
  }

  return { stars: starsOut, planets: planetsOut, neighbors };
}
