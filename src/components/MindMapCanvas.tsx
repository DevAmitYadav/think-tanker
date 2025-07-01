
// by Amit Yadav: Main MindMapCanvas component for rendering nodes and connectors
import React, { useRef, useEffect, memo } from 'react';
import { useMindMapStore } from '../store/mindMapStore';
import MindMapNode from './MindMapNode';
import Connector from './Connector';
import { getVisibleNodes } from '../utils/treeUtils';
import { usePointerDrag } from '../hooks/usePointerDrag';

// by Amit Yadav: Utility to check if event target is a mind map node
const isNodeElement = (target: EventTarget | null): boolean => {
  return !!(target instanceof Element && target.closest('.mind-map-node'));
};


const MindMapCanvas: React.FC = memo(() => {
  // by Amit Yadav: Zustand store selectors for performance
  const {
    nodes,
    rootNodeId,
    canvasOffset,
    canvasScale,
    panCanvas,
    setIsDraggingCanvas,
    setSelectedNodeId,
    isDraggingCanvas
  } = useMindMapStore();

  // by Amit Yadav: Get only visible nodes for rendering
  const visibleNodes = getVisibleNodes(nodes, rootNodeId);

  // by Amit Yadav: Only render connectors for visible nodes
  const renderedNodeIds = new Set(visibleNodes.map(node => node.id));
  const connectorsToRender = visibleNodes.flatMap(node =>
    node.children
      .filter(childId => renderedNodeIds.has(childId))
      .map(childId => ({ parent: node, child: nodes[childId] }))
  );

  // by Amit Yadav: Canvas drag and click logic
  const { pointerDown: canvasPointerDown } = usePointerDrag({
    onPointerDown: (e) => {
      // Only pan with right click or when not interacting with a node
      if (e.button === 2 || !isNodeElement(e.target)) {
        setIsDraggingCanvas(true);
        setSelectedNodeId(null);
      }
    },
    onDragMove: (_e, dx, dy) => {
      if (isDraggingCanvas) {
        panCanvas(dx, dy);
      }
    },
    onDragEnd: () => {
      setIsDraggingCanvas(false);
    },
    onClick: (e) => {
      if (!isNodeElement(e.target)) {
        setSelectedNodeId(null);
      }
    }
  });


  // by Amit Yadav: Handle zooming with mouse wheel, keeping zoom centered on pointer
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = 0.1;
    const oldScale = canvasScale;
    let newScale = oldScale;

    if (e.deltaY < 0) {
      newScale += scaleAmount;
    } else {
      newScale -= scaleAmount;
    }
    newScale = Math.max(0.2, Math.min(newScale, 3));

    // Center zoom on mouse pointer
    const mouseX = e.clientX - canvasOffset.x;
    const mouseY = e.clientY - canvasOffset.y;
    const newOffsetX = canvasOffset.x - (mouseX * (newScale - oldScale));
    const newOffsetY = canvasOffset.y - (mouseY * (newScale - oldScale));

    useMindMapStore.getState().setCanvasScale(newScale);
    useMindMapStore.getState().panCanvas(newOffsetX - canvasOffset.x, newOffsetY - canvasOffset.y);
  };


  // by Amit Yadav: Canvas ref and effect for context menu and cursor
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    // Disable context menu on right-click
    canvasElement.oncontextmenu = (e) => e.preventDefault();
    // Cursor feedback for pan/zoom
    const handleGlobalPointerMove = (event: MouseEvent) => {
      if (!canvasElement) return;
      const isOver = document.elementFromPoint(event.clientX, event.clientY) === canvasElement;
      if (isOver) {
        canvasElement.style.cursor = isDraggingCanvas ? 'grabbing' : 'grab';
      } else {
        canvasElement.style.cursor = 'default';
      }
    };
    document.addEventListener('pointermove', handleGlobalPointerMove);
    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      canvasElement.oncontextmenu = null;
    };
  }, [isDraggingCanvas]);

// by Amit Yadav: Render SVG connectors and node components
  // --- Advanced Features ---
  // Double-click to add node at position
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add if not clicking on a node
    if (!isNodeElement(e.target)) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Calculate position relative to canvas, unscaled
      const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      if (rootNodeId) {
        // Add as child of root, but pass position
        useMindMapStore.getState().addNodeAtPosition(rootNodeId, { x, y });
      } else {
        // Create root node at this position
        useMindMapStore.getState().addRootNodeAtPosition({ x, y });
      }
    }
  };

  // Zoom to fit all nodes
  const zoomToFit = () => {
    if (visibleNodes.length === 0) return;
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visibleNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    const width = maxX - minX + 160; // node width
    const height = maxY - minY + 40; // node height
    const container = canvasRef.current;
    if (!container) return;
    const cWidth = container.offsetWidth;
    const cHeight = container.offsetHeight;
    const scale = Math.min(cWidth / width, cHeight / height, 1);
    const offsetX = (cWidth - width * scale) / 2 - minX * scale;
    const offsetY = (cHeight - height * scale) / 2 - minY * scale;
    useMindMapStore.getState().setCanvasScale(scale);
    useMindMapStore.getState().panCanvas(offsetX - canvasOffset.x, offsetY - canvasOffset.y);
  };

  // --- UI ---
  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full overflow-hidden bg-gray-50 rounded-lg shadow-inner ${isDraggingCanvas ? 'pan-grabbing' : 'pan-grab'}`}
      onPointerDown={canvasPointerDown}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      tabIndex={0} // Accessibility: allow keyboard focus
      aria-label="Mind map canvas"
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 right-4 z-50 flex flex-col space-y-2 bg-white/90 p-2 rounded-lg shadow-lg border border-gray-200">
        <button
          onClick={zoomToFit}
          className="btn btn-secondary"
          title="Zoom to Fit"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.418-5v5h-.581M4 20v-5h.582m15.418 5v-5h-.581M9 15l3-3m0 0l3-3m-3 3V4m0 8v8" /></svg>
        </button>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connectorsToRender.map((conn) => (
          <Connector
            key={`${conn.parent.id}-${conn.child.id}`}
            parent={conn.parent}
            child={conn.child}
            canvasOffset={canvasOffset}
            canvasScale={canvasScale}
          />
        ))}
      </svg>
      {/* Mind map nodes */}
      {visibleNodes.map((node) => (
        <MindMapNode
          key={node.id}
          node={node}
          canvasOffset={canvasOffset}
          canvasScale={canvasScale}
        />
      ))}
    </div>
  );
});

export default MindMapCanvas;
