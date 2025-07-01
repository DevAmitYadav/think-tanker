import type { NodeId, MindMapNode } from '../types';

/**
 * Returns a list of all visible nodes (not under a collapsed parent).
 */
export const getVisibleNodes = (nodes: Record<NodeId, MindMapNode>, rootId: NodeId | null): MindMapNode[] => {
  if (!rootId || !nodes[rootId]) {
    return [];
  }

  const visibleNodes: MindMapNode[] = [];
  const queue: NodeId[] = [rootId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes[nodeId];

    if (node) {
      visibleNodes.push(node);

      if (!node.collapsed) {
        // Add children to queue if not collapsed
        node.children.forEach(childId => {
          if (nodes[childId]) {
            queue.push(childId);
          }
        });
      }
    }
  }
  return visibleNodes;
};

/**
 * Returns a list of all node IDs under a given parent (including parent itself), recursively.
 */
export const getDescendantIds = (nodes: Record<NodeId, MindMapNode>, startingNodeId: NodeId): NodeId[] => {
  const descendants: NodeId[] = [startingNodeId];
  const queue: NodeId[] = [...nodes[startingNodeId]?.children || []];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (nodes[currentId]) {
      descendants.push(currentId);
      queue.push(...nodes[currentId].children);
    }
  }
  return descendants;
};

/**
 * Calculates a reasonable initial position for a new child node relative to its parent.
 */
export const calculateNewChildPosition = (parentNode: MindMapNode, siblingCount: number): { x: number; y: number } => {
  const offsetX = 150; // Horizontal offset from parent
  const offsetY = 50;  // Vertical spacing for children

  // Simple layout: position children to the right, stacked vertically
  return {
    x: parentNode.position.x + offsetX,
    y: parentNode.position.y + (siblingCount * offsetY) - (siblingCount / 2 * offsetY), // Center around parent Y
  };
};

/**
 * Helper to get node dimensions dynamically (approximate for layout)
 */
export const getNodeDimensions = (nodeId: NodeId): { width: number; height: number } => {
  // In a real app, you might measure this from the DOM or set fixed sizes
  // For simplicity, let's assume average dimensions.
  // These should ideally match the actual CSS dimensions of .mind-map-node
  return { width: 160, height: 40 };
};