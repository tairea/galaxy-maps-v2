/**
 * Performance testing utilities for course analysis
 */

/**
 * Analyze a specific course's performance characteristics
 * @param {string} courseId - The course ID to analyze
 * @param {Map} courseNodesMap - Map of course nodes
 * @param {Map} courseEdgesMap - Map of course edges
 * @returns {Object} Performance analysis results
 */
export function analyzeCoursePerformance(courseId, courseNodesMap, courseEdgesMap) {
  const nodes = courseNodesMap.get(courseId);
  const edges = courseEdgesMap.get(courseId);

  if (!nodes || !edges) {
    return { error: `No data found for course: ${courseId}` };
  }

  const startTime = performance.now();

  // Basic metrics
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Boundary calculations
  const boundaries = calculateBoundaries(nodes);

  // Complexity analysis
  const complexity = analyzeComplexity(nodes, edges, boundaries);

  // Performance indicators
  const performance = calculatePerformanceIndicators(nodes, edges, boundaries);

  const analysisTime = performance.now() - startTime;

  return {
    courseId,
    nodeCount,
    edgeCount,
    boundaries,
    complexity,
    performance,
    analysisTime: analysisTime.toFixed(2),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate course boundaries
 */
function calculateBoundaries(nodes) {
  const xCoords = nodes.map((n) => n.x).filter((x) => x != null && !isNaN(x));
  const yCoords = nodes.map((n) => n.y).filter((y) => y != null && !isNaN(y));

  if (xCoords.length === 0 || yCoords.length === 0) {
    return { width: 0, height: 0, area: 0 };
  }

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;

  return { width, height, area, minX, maxX, minY, maxY };
}

/**
 * Analyze course complexity
 */
function analyzeComplexity(nodes, edges, boundaries) {
  // Node density
  const density = boundaries.area > 0 ? nodes.length / boundaries.area : 0;

  // Prerequisites complexity
  const nodesWithPrereqs = nodes.filter((n) => n.prerequisites && n.prerequisites.length > 0);
  const avgPrereqs =
    nodesWithPrereqs.length > 0
      ? nodesWithPrereqs.reduce((sum, n) => sum + n.prerequisites.length, 0) /
        nodesWithPrereqs.length
      : 0;

  // Edge density
  const edgeDensity = edges.length / Math.max(nodes.length, 1);

  // Coordinate spread
  const xSpread = boundaries.maxX - boundaries.minX;
  const ySpread = boundaries.maxY - boundaries.minY;

  return {
    density,
    avgPrereqs,
    edgeDensity,
    xSpread,
    ySpread,
    complexityScore: calculateComplexityScore(nodes, edges, boundaries),
  };
}

/**
 * Calculate complexity score
 */
function calculateComplexityScore(nodes, edges, boundaries) {
  let score = 0;

  // Base complexity from counts
  score += nodes.length * 0.1;
  score += edges.length * 0.05;

  // Boundary size penalty
  if (boundaries.width > 1000 || boundaries.height > 1000) {
    score += (boundaries.width + boundaries.height) * 0.001;
  }

  // Density penalty
  if (boundaries.area > 0) {
    const density = nodes.length / boundaries.area;
    if (density > 0.01) {
      score += density * 100;
    }
  }

  // Prerequisites complexity
  const nodesWithPrereqs = nodes.filter((n) => n.prerequisites && n.prerequisites.length > 0);
  score += nodesWithPrereqs.length * 0.2;

  return score;
}

/**
 * Calculate performance indicators
 */
function calculatePerformanceIndicators(nodes, edges, boundaries) {
  const indicators = {};

  // Large boundary warning
  if (boundaries.area > 1000000) {
    // 1M square units
    indicators.largeBoundary = {
      level: "warning",
      message: `Large boundary area (${boundaries.area.toFixed(0)}) may cause slow rendering`,
    };
  }

  // High node count warning
  if (nodes.length > 100) {
    indicators.highNodeCount = {
      level: "warning",
      message: `High node count (${nodes.length}) may impact performance`,
    };
  }

  // High edge density warning
  const edgeDensity = edges.length / Math.max(nodes.length, 1);
  if (edgeDensity > 2) {
    indicators.highEdgeDensity = {
      level: "warning",
      message: `High edge density (${edgeDensity.toFixed(2)}) may cause layout issues`,
    };
  }

  // Coordinate range issues
  if (boundaries.width > 2000 || boundaries.height > 2000) {
    indicators.largeCoordinateRange = {
      level: "warning",
      message: `Large coordinate range (${boundaries.width.toFixed(
        0,
      )} x ${boundaries.height.toFixed(0)}) may cause zoom issues`,
    };
  }

  // Node density issues
  if (boundaries.area > 0) {
    const density = nodes.length / boundaries.area;
    if (density > 0.05) {
      indicators.highNodeDensity = {
        level: "warning",
        message: `High node density (${density.toFixed(
          4,
        )}) may cause overlapping and performance issues`,
      };
    }
  }

  return indicators;
}

/**
 * Compare two courses for performance differences
 */
export function compareCourses(courseId1, courseId2, courseNodesMap, courseEdgesMap) {
  const course1 = analyzeCoursePerformance(courseId1, courseNodesMap, courseEdgesMap);
  const course2 = analyzeCoursePerformance(courseId2, courseNodesMap, courseEdgesMap);

  if (course1.error || course2.error) {
    return { error: "Could not analyze one or both courses" };
  }

  const differences = {};

  // Node count difference
  const nodeDiff = course1.nodeCount - course2.nodeCount;
  if (Math.abs(nodeDiff) > 10) {
    differences.nodeCount = {
      difference: nodeDiff,
      impact: nodeDiff > 0 ? "negative" : "positive",
      message: `Course 1 has ${Math.abs(nodeDiff)} more nodes than Course 2`,
    };
  }

  // Edge count difference
  const edgeDiff = course1.edgeCount - course2.edgeCount;
  if (Math.abs(edgeDiff) > 10) {
    differences.edgeCount = {
      difference: edgeDiff,
      impact: edgeDiff > 0 ? "negative" : "positive",
      message: `Course 1 has ${Math.abs(edgeDiff)} more edges than Course 2`,
    };
  }

  // Boundary area difference
  const areaDiff = course1.boundaries.area - course2.boundaries.area;
  if (Math.abs(areaDiff) > 100000) {
    differences.boundaryArea = {
      difference: areaDiff,
      impact: areaDiff > 0 ? "negative" : "positive",
      message: `Course 1 has ${(areaDiff / 1000000).toFixed(2)}M more boundary area than Course 2`,
    };
  }

  // Complexity score difference
  const complexityDiff = course1.complexity.complexityScore - course2.complexity.complexityScore;
  if (Math.abs(complexityDiff) > 5) {
    differences.complexity = {
      difference: complexityDiff,
      impact: complexityDiff > 0 ? "negative" : "positive",
      message: `Course 1 has ${complexityDiff.toFixed(2)} higher complexity score than Course 2`,
    };
  }

  return {
    course1,
    course2,
    differences,
    summary: generateComparisonSummary(differences),
  };
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(differences) {
  const negativeImpacts = Object.values(differences).filter((d) => d.impact === "negative");
  const positiveImpacts = Object.values(differences).filter((d) => d.impact === "positive");

  if (negativeImpacts.length === 0) {
    return "No performance issues detected";
  }

  const issues = negativeImpacts.map((d) => d.message);
  return `Performance issues detected: ${issues.join("; ")}`;
}

/**
 * Test performance of zoom operations
 */
export async function testZoomPerformance(networkRef, nodes, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    // Perform zoom operation
    networkRef.fit({
      nodes: nodes.map((n) => n.id),
      animation: {
        duration: 800,
        easingFunction: "easeInOutQuad",
      },
    });

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 850));

    const endTime = performance.now();
    const duration = endTime - startTime;

    results.push({
      iteration: i + 1,
      duration: duration.toFixed(2),
      timestamp: new Date().toISOString(),
    });
  }

  const avgDuration = results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length;
  const minDuration = Math.min(...results.map((r) => parseFloat(r.duration)));
  const maxDuration = Math.max(...results.map((r) => parseFloat(r.duration)));

  return {
    results,
    summary: {
      average: avgDuration.toFixed(2),
      minimum: minDuration.toFixed(2),
      maximum: maxDuration.toFixed(2),
      variance: (maxDuration - minDuration).toFixed(2),
    },
  };
}
