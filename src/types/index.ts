export type NodeId = string;

export interface MindMapNode {
  id: NodeId;
  label: string;
  parentId: NodeId | null;
  children: NodeId[]; // Array of child IDs
  position: { x: number; y: number }; // Absolute position on the canvas
  collapsed: boolean;
  size?: { width: number; height: number }; // Actual rendered size (optional)
  metadata?: { starred?: boolean };
}

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error' | 'initial_load' | 'synced';

export interface MindMapState {
  nodes: Record<NodeId, MindMapNode>;
  rootNodeId: NodeId | null;
  selectedNodeId: NodeId | null;
  syncStatus: SyncStatus;
  isDraggingCanvas: boolean; // For canvas pan/zoom
  canvasOffset: { x: number; y: number };
  canvasScale: number;
}
