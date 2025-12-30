/**
 * Markdown Galaxy Utilities
 * Helper functions for the markdown galaxy editor
 */

import type { ParsedGalaxyMap } from './markdownGalaxyParser';

/**
 * Export markdown to a downloadable file
 */
export function exportMarkdownFile(markdown: string, filename: string = 'galaxy-map.md'): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy markdown to clipboard
 */
export async function copyMarkdownToClipboard(markdown: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate markdown from parsed galaxy map structure
 * (for import existing galaxy feature)
 */
export function galaxyMapToMarkdown(parsedMap: ParsedGalaxyMap): string {
  const lines: string[] = [];
  const { hierarchy } = parsedMap;

  function processNode(node: any, indent: number = 0) {
    const spaces = '    '.repeat(indent);
    lines.push(`${spaces}- ${node.label}`);

    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        processNode(child, indent + 1);
      });
    }
  }

  hierarchy.forEach(node => processNode(node));

  return lines.join('\n');
}

/**
 * Check if physics has stabilized based on stabilization event
 */
export function isPhysicsStabilized(iterations: number, maxIterations: number = 100): boolean {
  return iterations >= maxIterations;
}

/**
 * Extract node positions from vis-network
 */
export function captureNodePositions(
  network: any
): Record<string, { x: number; y: number }> {
  if (!network || typeof network.getPositions !== 'function') {
    console.error('Invalid network instance');
    return {};
  }

  try {
    const positions = network.getPositions();
    return positions;
  } catch (error) {
    console.error('Failed to capture node positions:', error);
    return {};
  }
}

/**
 * Format markdown example for help documentation
 */
export const MARKDOWN_EXAMPLE = `- Getting setup
        - Getting started intro
    - IDE
        - what is an IDE
        - download vs code
    - Github
        - what is version control
        - create a Github account
- HTML
        - HTML intro
    - Syntax
        - Angle brackets
        - Boilerplate
    - Tags
        - Headings
        - Paragraph
        - Image
- CSS
        - CSS intro
    - Syntax
        - Curly braces
    - Color
        - hex
    - Font
        - font-size
        - font-family
        - google fonts
    - Background
        - background-color
        - background-image`;

/**
 * Markdown syntax help content
 */
export const MARKDOWN_HELP = {
  title: 'Markdown Galaxy Map Syntax',
  description:
    'Create galaxy maps using a simple markdown bullet list hierarchy. The indentation level determines the type of node.',
  levels: [
    {
      name: 'Level 1: Sequential Nodes',
      description: 'Top-level topics that connect sequentially (one flows to the next)',
      syntax: '- Node Name',
      example: '- Getting setup\n- HTML\n- CSS',
      indent: '0 spaces',
    },
    {
      name: 'Level 2: Branching Nodes',
      description: 'Sub-topics that branch from the parent node',
      syntax: '    - Branch Name',
      example: '    - IDE\n    - Github',
      indent: '4 spaces',
    },
    {
      name: 'Level 3: Planets/Missions',
      description: 'Specific tasks or missions that orbit a node',
      syntax: '        - Mission Name',
      example: '        - what is an IDE\n        - download vs code',
      indent: '8 spaces',
    },
  ],
  tips: [
    'Use consistent indentation (4 spaces per level)',
    'Start bullet points with "-" or "*"',
    'Keep labels concise and descriptive',
    'The first node is automatically marked as the introduction',
    'Planets (level 3) orbit their parent nodes in the visualization',
  ],
};

/**
 * Validate galaxy map structure before saving
 */
export interface SaveValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBeforeSave(
  parsedMap: ParsedGalaxyMap,
  positions: Record<string, { x: number; y: number }>,
  galaxyTitle: string
): SaveValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if galaxy has a title
  if (!galaxyTitle || galaxyTitle.trim().length === 0) {
    errors.push('Galaxy must have a title before saving');
  }

  // Check if there are any nodes
  if (parsedMap.nodes.length === 0) {
    errors.push('Galaxy must have at least one node');
  }

  // Check if positions have been captured
  const nodeIds = parsedMap.nodes.map(n => n.id);
  const missingPositions = nodeIds.filter(id => !positions[id]);
  if (missingPositions.length > 0) {
    errors.push('Some nodes are missing positions. Wait for physics to stabilize.');
  }

  // Validate positions are valid numbers
  Object.entries(positions).forEach(([id, pos]) => {
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || isNaN(pos.x) || isNaN(pos.y)) {
      errors.push(`Invalid position for node ${id}`);
    }
  });

  // Warnings
  if (parsedMap.nodes.length > 50) {
    warnings.push('Large galaxy map (50+ nodes) may impact performance');
  }

  if (parsedMap.planets.length === 0) {
    warnings.push('No missions/tasks defined. Consider adding level 3 items.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format timestamp for file naming
 */
export function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').split('T')[0];
}
