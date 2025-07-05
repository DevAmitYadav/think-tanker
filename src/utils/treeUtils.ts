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
export const calculateNewChildPosition = (parentNode: MindMapNode, _siblingCount: number, siblings: MindMapNode[] = []): { x: number; y: number } => {
  const offsetX = 180;
  const minOffsetY = 80;

  // Find the lowest y among siblings, or use parent y if no siblings
  let baseY = parentNode.position.y;
  if (siblings.length > 0) {
    baseY = Math.max(...siblings.map(s => s.position.y));
  }
  return {
    x: parentNode.position.x + offsetX,
    y: baseY + minOffsetY,
  };
};

/**
 * Helper to get node dimensions dynamically (approximate for layout)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNodeDimensions = (_nodeId: NodeId): { width: number; height: number } => {
  // These should match the actual CSS minWidth/minHeight of .mind-map-node
  return { width: 180, height: 60 };
};