import { create } from 'zustand';
import type { MindMapNode, NodeId, MindMapState, SyncStatus } from '../types';
import { generateId } from '../utils/uuid';
import { calculateNewChildPosition, getDescendantIds } from '../utils/treeUtils';
import { doc, setDoc, onSnapshot, getFirestore } from 'firebase/firestore';
import { app } from '../api/firebaseService'; // Import Firebase app

const db = getFirestore(app);
const MIND_MAP_COLLECTION = 'mindMaps';
const CURRENT_MAP_DOC_ID = 'defaultMap'; // Using a fixed ID for simplicity

interface MindMapActions {
  addRootNode: () => Promise<void>;
  addRootNodeAtPosition: (pos: { x: number; y: number }) => Promise<void>;
  addNode: (parentId: NodeId) => Promise<void>;
  addNodeAtPosition: (parentId: NodeId, pos: { x: number; y: number }) => Promise<void>;
  updateNode: (nodeId: NodeId, updates: Partial<MindMapNode>) => Promise<void>;
  deleteNode: (nodeId: NodeId) => Promise<void>;
  toggleCollapse: (nodeId: NodeId) => Promise<void>;
  setSelectedNodeId: (nodeId: NodeId | null) => void;
  setNodesFromFirebase: (nodes: Record<NodeId, MindMapNode>, rootNodeId: NodeId | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  resetMap: () => Promise<void>;
  panCanvas: (dx: number, dy: number) => void;
  setCanvasScale: (scale: number) => void;
  setIsDraggingCanvas: (isDragging: boolean) => void;
}

export const useMindMapStore = create<MindMapState & MindMapActions>((set, get) => ({
  nodes: {},
  rootNodeId: null,
  selectedNodeId: null,
  syncStatus: 'initial_load',
  isDraggingCanvas: false,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,

  // --- Actions ---

  addRootNode: async () => {
  },

  addRootNodeAtPosition: async (pos: { x: number; y: number }) => {
    const store = get();
    if (store.rootNodeId) return; // Only one root node

    const rootId = generateId();
    const rootNode: MindMapNode = {
      id: rootId,
      label: 'Root Node',
      parentId: null,
      children: [],
      position: pos,
      collapsed: false,
    };

    set(state => ({
      nodes: { ...state.nodes, [rootId]: rootNode },
      rootNodeId: rootId,
      selectedNodeId: rootId,
    }));
    await store.updateNode(rootId, {}); // Persist to Firebase
    const { rootNodeId, updateNode } = get();
    if (rootNodeId) return; // Only one root node

    const newId = generateId();
    const newNode: MindMapNode = {
      id: newId,
      label: 'Root Node',
      parentId: null,
      children: [],
      position: { x: 0, y: 0 }, // Center of the initial view
      collapsed: false,
    };

    set(state => ({
      nodes: { ...state.nodes, [newId]: newNode },
      rootNodeId: newId,
      selectedNodeId: newId,
    }));
    await updateNode(newId, {}); // Persist to Firebase
  },

  addNode: async (parentId: NodeId) => {
    const store = get();
    const parent = store.nodes[parentId];
    if (!parent) return;

    const siblingCount = parent.children.length;
    const newPosition = calculateNewChildPosition(parent, siblingCount);
    const childId = generateId();
    const childNode: MindMapNode = {
      id: childId,
      label: 'New Node',
      parentId: parentId,
      children: [],
      position: newPosition,
      collapsed: false,
    };

    set(state => ({
      nodes: {
        ...state.nodes,
        [childId]: childNode,
        [parentId]: {
          ...state.nodes[parentId],
          children: [...state.nodes[parentId].children, childId],
        },
      },
      selectedNodeId: childId,
    }));
    await store.updateNode(childId, {}); // Persist new node
    await store.updateNode(parentId, {}); // Persist parent's children array update
  },

  addNodeAtPosition: async (parentId: NodeId, pos: { x: number; y: number }) => {
    const store = get();
    const parent = store.nodes[parentId];
    if (!parent) return;

    const childId = generateId();
    const childNode: MindMapNode = {
      id: childId,
      label: 'New Node',
      parentId: parentId,
      children: [],
      position: pos,
      collapsed: false,
    };

    set(state => ({
      nodes: {
        ...state.nodes,
        [childId]: childNode,
        [parentId]: {
          ...state.nodes[parentId],
          children: [...state.nodes[parentId].children, childId],
        },
      },
      selectedNodeId: childId,
    }));
    await store.updateNode(childId, {}); // Persist new node
    await store.updateNode(parentId, {}); // Persist parent's children array update
    const { nodes, updateNode } = get();
    const parentNode = nodes[parentId];
    if (!parentNode) return;

    const newId = generateId();
    const newPosition = calculateNewChildPosition(parentNode, parentNode.children.length);

    const newNode: MindMapNode = {
      id: newId,
      label: 'New Node',
      parentId: parentId,
      children: [],
      position: newPosition,
      collapsed: false,
    };

    set(state => ({
      nodes: {
        ...state.nodes,
        [newId]: newNode,
        [parentId]: {
          ...state.nodes[parentId],
          children: [...state.nodes[parentId].children, newId],
        },
      },
      selectedNodeId: newId,
    }));
    await updateNode(newId, {}); // Persist new node
    await updateNode(parentId, {}); // Persist parent's children array update
  },

  updateNode: async (nodeId: NodeId, updates: Partial<MindMapNode>) => {
    const { nodes, setSyncStatus } = get();
    const existingNode = nodes[nodeId];
    if (!existingNode) return;

    const updatedNode = { ...existingNode, ...updates };

    set(state => ({
      nodes: { ...state.nodes, [nodeId]: updatedNode },
    }));

    setSyncStatus('syncing');
    try {
      // Create a copy of the current nodes state to persist
      const currentNodes = get().nodes;
      const rootNodeId = get().rootNodeId;
      await setDoc(doc(db, MIND_MAP_COLLECTION, CURRENT_MAP_DOC_ID), {
        nodes: currentNodes,
        rootNodeId: rootNodeId,
      }, { merge: true }); // Merge ensures other fields (if any) are not overwritten
      setSyncStatus('online');
    } catch (error) {
      console.error('Error updating node in Firebase:', error);
      setSyncStatus('error');
    }
  },

  deleteNode: async (nodeId: NodeId) => {
    const { nodes, rootNodeId, setSyncStatus } = get();
    if (!nodes[nodeId]) return;
    if (nodeId === rootNodeId) {
      // Handle root node deletion: clear entire map
      await get().resetMap();
      return;
    }

    const parentId = nodes[nodeId].parentId;
    const descendantsToDelete = getDescendantIds(nodes, nodeId);

    set(state => {
      const newNodes = { ...state.nodes };
      descendantsToDelete.forEach(id => delete newNodes[id]);

      if (parentId && newNodes[parentId]) {
        newNodes[parentId].children = newNodes[parentId].children.filter(
          (childId) => childId !== nodeId
        );
      }
      return {
        nodes: newNodes,
        selectedNodeId: null, // Clear selection after deletion
      };
    });

    setSyncStatus('syncing');
    try {
      const currentNodes = get().nodes;
      const currentRootNodeId = get().rootNodeId;
      await setDoc(doc(db, MIND_MAP_COLLECTION, CURRENT_MAP_DOC_ID), {
        nodes: currentNodes,
        rootNodeId: currentRootNodeId,
      });
      setSyncStatus('online');
    } catch (error) {
      console.error('Error deleting node(s) in Firebase:', error);
      setSyncStatus('error');
    }
  },

  toggleCollapse: async (nodeId: NodeId) => {
    const { nodes, updateNode } = get();
    const node = nodes[nodeId];
    if (node) {
      await updateNode(nodeId, { collapsed: !node.collapsed });
    }
  },

  setSelectedNodeId: (nodeId: NodeId | null) => set({ selectedNodeId: nodeId }),

  setNodesFromFirebase: (nodes: Record<NodeId, MindMapNode>, rootNodeId: NodeId | null) => {
    set({ nodes, rootNodeId });
  },

  setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),

  resetMap: async () => {
    set({ nodes: {}, rootNodeId: null, selectedNodeId: null });
    get().setSyncStatus('syncing');
    try {
      await setDoc(doc(db, MIND_MAP_COLLECTION, CURRENT_MAP_DOC_ID), {
        nodes: {},
        rootNodeId: null,
      });
      get().setSyncStatus('online');
    } catch (error) {
      console.error('Error resetting map in Firebase:', error);
      get().setSyncStatus('error');
    }
  },

  panCanvas: (dx: number, dy: number) => {
    set(state => ({
      canvasOffset: {
        x: state.canvasOffset.x + dx,
        y: state.canvasOffset.y + dy,
      },
    }));
  },

  setCanvasScale: (scale: number) => {
    set({ canvasScale: scale });
  },
  
  setIsDraggingCanvas: (isDragging: boolean) => set({ isDraggingCanvas: isDragging }),
}));


// --- Firebase Listener Integration & Offline Fallback ---
let unsubscribe: (() => void) | null = null;

export function saveToLocalStorage() {
  const { nodes, rootNodeId } = useMindMapStore.getState();
  try {
    localStorage.setItem('mindMapNodes', JSON.stringify(nodes));
    localStorage.setItem('mindMapRootNodeId', JSON.stringify(rootNodeId));
  } catch (e) {
    console.error('Failed to save mind map to localStorage:', e);
  }
}

export function loadFromLocalStorage() {
  try {
    const nodes = JSON.parse(localStorage.getItem('mindMapNodes') ?? '{}');
    const rootNodeId = JSON.parse(localStorage.getItem('mindMapRootNodeId') ?? 'null');
    useMindMapStore.getState().setNodesFromFirebase(nodes, rootNodeId);
    useMindMapStore.getState().setSyncStatus('offline');
  } catch (e) {
    console.error('Failed to load mind map from localStorage:', e);
  }
}

export const startFirebaseListener = () => {
  if (unsubscribe) {
    unsubscribe(); // Clean up existing listener if any
  }

  const mapDocRef = doc(db, MIND_MAP_COLLECTION, CURRENT_MAP_DOC_ID);

  unsubscribe = onSnapshot(mapDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        useMindMapStore.getState().setNodesFromFirebase(data.nodes || {}, data.rootNodeId || null);
        useMindMapStore.getState().setSyncStatus('online');
      } else {
        // Document doesn't exist, initialize an empty map
        useMindMapStore.getState().setNodesFromFirebase({}, null);
        useMindMapStore.getState().setSyncStatus('online');
      }
    },
    (error) => {
      console.error('Firebase snapshot error:', error);
      // Fallback to offline mode
      loadFromLocalStorage();
      useMindMapStore.getState().setSyncStatus('offline');
    }
  );

  // Set up online/offline status listeners
  window.addEventListener('online', () => useMindMapStore.getState().setSyncStatus('online'));
  window.addEventListener('offline', () => {
    useMindMapStore.getState().setSyncStatus('offline');
    saveToLocalStorage();
  });
};

export const stopFirebaseListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};
