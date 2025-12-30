/**
 * Markdown Galaxy Parser
 *
 * Parses markdown bullet lists into galaxy map structure:
 * - Level 1 (no indent = 0 spaces): Sequential connecting nodes
 * - Level 2 (one indent = 4 spaces): Connect to closest level 1 node above them
 * - Level 3 (two indents = 8 spaces): Planets/missions orbiting closest level 1 or 2 node above them
 */

export interface ParsedNode {
  id: string;
  label: string;
  level: number;
  parentId: string | null;
  order: number;
  children: ParsedNode[];
}

export interface ParsedPlanet {
  id: string;
  name: string;
  topicId: string;
  order: number;
}

export interface ParsedGalaxyMap {
  nodes: Array<{
    id: string;
    label: string;
    group?: string;
    color?: string;
    size?: number;
    shape?: string;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    color?: object;
  }>;
  planets: ParsedPlanet[];
  hierarchy: ParsedNode[];
}

/**
 * Generate a unique ID for nodes/planets
 */
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Detect indentation level of a line
 * Returns 1, 2, or 3 for the three hierarchy levels
 * Level 1: 0 spaces (no indent, just `- ` or `* `)
 * Level 2: 2 spaces (one indent)
 * Level 3: 4+ spaces (two indents - planets)
 */
function getIndentLevel(line: string): number {
  const trimmed = line.trimStart();
  const spaces = line.length - trimmed.length;

  // Level 1: 0 spaces (no indent)
  if (spaces === 0) return 1;
  // Level 2: 2 spaces (one indent)
  if (spaces === 2) return 2;
  // Level 3: 4+ spaces (two indents - these become planets)
  return 3;
}

/**
 * Extract label text from bullet point line
 */
function extractLabel(line: string): string {
  return line
    .trim()
    .replace(/^[-*]\s*/, "")
    .trim();
}

/**
 * Parse markdown text into hierarchical structure
 * Level 1: Sequential connecting nodes
 * Level 2: Connect to closest level 1 node above them
 * Level 3: Planets that orbit closest level 1 or 2 node above them
 */
export function parseMarkdownToHierarchy(markdown: string): ParsedNode[] {
  const lines = markdown.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && (trimmed.startsWith("-") || trimmed.startsWith("*"));
  });

  const hierarchy: ParsedNode[] = [];
  const allNodes: ParsedNode[] = []; // Keep track of all nodes in order
  let level1Order = 0;
  let level2Order = 0;
  let level3Order = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const spaces = line.length - trimmed.length;
    const level = getIndentLevel(line);
    const label = extractLabel(line);

    if (!label) continue;

    // Log node information for debugging
    console.log(
      `[Parser] Node added - Label: "${label}", Spaces: ${spaces}, Level: ${level}, Raw line: "${line}"`,
    );

    const node: ParsedNode = {
      id: generateId(`node_l${level}`),
      label,
      level,
      parentId: null,
      order: 0,
      children: [],
    };

    if (level === 1) {
      // Level 1: Sequential connecting nodes
      node.order = level1Order++;
      level2Order = 0; // Reset child counters
      level3Order = 0;
      hierarchy.push(node);
      allNodes.push(node);
    } else if (level === 2) {
      // Level 2: Connect to closest level 1 node above them in the list
      node.order = level2Order++;
      level3Order = 0; // Reset planet counter

      // Find the closest level 1 node above this one in the list
      let parent: ParsedNode | null = null;
      for (let i = allNodes.length - 1; i >= 0; i--) {
        if (allNodes[i].level === 1) {
          parent = allNodes[i];
          break;
        }
      }

      if (parent) {
        node.parentId = parent.id;
        parent.children.push(node);
      }
      allNodes.push(node);
    } else if (level === 3) {
      // Level 3: Planets that orbit closest level 1 or 2 node above them
      node.order = level3Order++;

      // Find the closest level 1 or 2 node above this one in the list
      let parent: ParsedNode | null = null;
      for (let i = allNodes.length - 1; i >= 0; i--) {
        if (allNodes[i].level === 1 || allNodes[i].level === 2) {
          parent = allNodes[i];
          break;
        }
      }

      if (parent) {
        node.parentId = parent.id;
        parent.children.push(node);
      }
      allNodes.push(node);
    }
  }

  return hierarchy;
}

/**
 * Convert hierarchy to vis-network format
 * Level 1 nodes maintain sequential connections regardless of level 2 nodes
 */
export function hierarchyToVisNetwork(hierarchy: ParsedNode[]): ParsedGalaxyMap {
  const nodes: ParsedGalaxyMap["nodes"] = [];
  const edges: ParsedGalaxyMap["edges"] = [];
  const planets: ParsedPlanet[] = [];
  let previousLevel1: string | null = null;

  // Collect all nodes in order (flatten hierarchy while preserving order)
  const allNodesInOrder: ParsedNode[] = [];

  function collectNodes(node: ParsedNode) {
    allNodesInOrder.push(node);
    node.children.forEach((child) => collectNodes(child));
  }

  hierarchy.forEach((node) => collectNodes(node));

  // First pass: Process all level 1 nodes in order to establish sequential connections
  allNodesInOrder.forEach((node) => {
    if (node.level === 1) {
      // Create vis-network node for level 1
      const visNode: ParsedGalaxyMap["nodes"][0] = {
        id: node.id,
        label: node.label,
        group: node.order === 0 ? "introduction" : "default",
        color: node.order === 0 ? "#00E676" : undefined,
        size: 7,
        shape: "dot",
      };
      nodes.push(visNode);

      // Level 1: Sequential connection to previous level 1 node
      if (previousLevel1 !== null) {
        edges.push({
          id: generateId("edge"),
          from: previousLevel1,
          to: node.id,
        });
      }
      previousLevel1 = node.id;
    }
  });

  // Second pass: Process level 2 nodes and connect them to their parents
  allNodesInOrder.forEach((node) => {
    if (node.level === 2) {
      // Create vis-network node for level 2
      const visNode: ParsedGalaxyMap["nodes"][0] = {
        id: node.id,
        label: node.label,
        group: "default",
        size: 7,
        shape: "dot",
      };
      nodes.push(visNode);

      // Level 2: Connect to parent (closest level 1 node above)
      if (node.parentId) {
        edges.push({
          id: generateId("edge"),
          from: node.parentId,
          to: node.id,
        });
      }
    }
  });

  // Third pass: Process level 3 nodes (planets)
  allNodesInOrder.forEach((node) => {
    if (node.level === 3) {
      // Level 3: This is a planet - don't create a vis-network node
      planets.push({
        id: node.id,
        name: node.label,
        topicId: node.parentId || "",
        order: node.order,
      });
    }
  });

  return {
    nodes,
    edges,
    planets,
    hierarchy,
  };
}

/**
 * Main parse function
 */
export function parseMarkdownToGalaxyMap(markdown: string): ParsedGalaxyMap {
  const hierarchy = parseMarkdownToHierarchy(markdown);
  return hierarchyToVisNetwork(hierarchy);
}

/**
 * Validate markdown structure
 */
export interface ValidationError {
  line: number;
  message: string;
  severity: "error" | "warning";
}

export function validateMarkdown(markdown: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = markdown.split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.length === 0) return;

    // Check if it starts with bullet
    if (!trimmed.startsWith("-") && !trimmed.startsWith("*")) {
      if (trimmed.length > 0) {
        errors.push({
          line: index + 1,
          message: 'Line must start with "-" or "*" for bullet points',
          severity: "error",
        });
      }
      return;
    }

    // Check indentation
    const level = getIndentLevel(line);
    if (level > 3) {
      errors.push({
        line: index + 1,
        message: "Maximum indentation is 12 spaces (3 levels)",
        severity: "warning",
      });
    }

    // Check for label
    const label = extractLabel(line);
    if (!label) {
      errors.push({
        line: index + 1,
        message: "Bullet point must have a label",
        severity: "error",
      });
    }
  });

  return errors;
}
