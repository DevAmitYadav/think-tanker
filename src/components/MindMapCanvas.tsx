// by Amit Yadav: Main MindMapCanvas component for rendering nodes and connectors
import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMindMapStore } from '../store/mindMapStore';
import MindMapNode from './MindMapNode';
import Connector from './Connector';
import { getVisibleNodes } from '../utils/treeUtils';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  MousePointer2,
  Hand,
  Grid3X3
} from 'lucide-react';
import { cn } from '../lib/utils';

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
    isDraggingCanvas,
    setCanvasScale,
    panCanvas
  } = useMindMapStore();

  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // by Amit Yadav: Get only visible nodes for rendering
  const visibleNodes = getVisibleNodes(nodes, rootNodeId);

  // by Amit Yadav: Only render connectors for visible nodes
  const renderedNodeIds = new Set(visibleNodes.map(node => node.id));
  const connectorsToRender = visibleNodes.flatMap(node =>
    node.children
      .filter(childId => renderedNodeIds.has(childId))
      .map(childId => ({ parent: node, child: nodes[childId] }))
  );

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveNodeId(event.active.id as string);
    console.log('Drag start', event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveNodeId(null);
    const { active, delta } = event;
    if (!active || !delta) return;
    const nodeId = String(active.id);
    const node = nodes[nodeId];
    if (!node) return;
    const newX = node.position.x + delta.x / canvasScale;
    const newY = node.position.y + delta.y / canvasScale;
    useMindMapStore.getState().updateNode(nodeId, { position: { x: newX, y: newY } });
    console.log('Drag end', nodeId, { x: newX, y: newY });
  }, [nodes, canvasScale]);

  // Enhanced zooming with mouse wheel, keeping zoom centered on pointer
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = 0.1;
    const oldScale = canvasScale;
    let newScale = oldScale;

    if (e.deltaY < 0) {
      newScale += scaleAmount;
    } else {
      newScale -= scaleAmount;
    }
    newScale = Math.max(0.1, Math.min(newScale, 5));

    // Center zoom on mouse pointer
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvasOffset.x;
    const mouseY = e.clientY - rect.top - canvasOffset.y;
    const newOffsetX = canvasOffset.x - (mouseX * (newScale - oldScale));
    const newOffsetY = canvasOffset.y - (mouseY * (newScale - oldScale));

    setCanvasScale(newScale);
    panCanvas(newOffsetX - canvasOffset.x, newOffsetY - canvasOffset.y);
  }, [canvasScale, canvasOffset, setCanvasScale, panCanvas]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left click
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      useMindMapStore.getState().setIsDraggingCanvas(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      panCanvas(deltaX, deltaY);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint, panCanvas]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    useMindMapStore.getState().setIsDraggingCanvas(false);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(canvasScale + 0.2, 5);
    setCanvasScale(newScale);
  }, [canvasScale, setCanvasScale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(canvasScale - 0.2, 0.1);
    setCanvasScale(newScale);
  }, [canvasScale, setCanvasScale]);

  // Zoom to fit all nodes
  const zoomToFit = useCallback(() => {
    // Defer calculation to next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (visibleNodes.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let missingSizes = 0;
      visibleNodes.forEach(node => {
        const width = node.size?.width;
        const height = node.size?.height;
        if (width == null || height == null) {
          missingSizes++;
          console.warn('Node missing size for zoomToFit:', node.id, node.label);
        }
        const w = width ?? 220;
        const h = height ?? 90;
        const nodeLeft = node.position.x;
        const nodeTop = node.position.y;
        const nodeRight = node.position.x + w;
        const nodeBottom = node.position.y + h;
        minX = Math.min(minX, nodeLeft);
        minY = Math.min(minY, nodeTop);
        maxX = Math.max(maxX, nodeRight);
        maxY = Math.max(maxY, nodeBottom);
      });
      const margin = 32;
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;
      const width = maxX - minX;
      const height = maxY - minY;
      const container = canvasRef.current;
      if (!container) return;
      const cWidth = container.offsetWidth;
      const cHeight = container.offsetHeight;
      console.log('ZoomToFit bounds:', { minX, minY, maxX, maxY, width, height });
      console.log('Canvas size:', { cWidth, cHeight });
      if (missingSizes > 0) {
        console.warn('Some nodes are missing size info. Zoom may be imperfect.');
      }
      if (width === 0 || height === 0) return;
      const scale = Math.min(cWidth / width, cHeight / height, 1);
      const offsetX = (cWidth - width * scale) / 2 - minX * scale;
      const offsetY = (cHeight - height * scale) / 2 - minY * scale;
      setCanvasScale(scale);
      panCanvas(offsetX - canvasOffset.x, offsetY - canvasOffset.y);
    });
  }, [visibleNodes, setCanvasScale, panCanvas, canvasOffset]);

  // Reset view
  const resetView = useCallback(() => {
    setCanvasScale(1);
    panCanvas(0 - canvasOffset.x, 0 - canvasOffset.y);
  }, [setCanvasScale, panCanvas, canvasOffset]);

  // by Amit Yadav: Canvas ref and effect for context menu and cursor
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    // Disable context menu on right-click
    canvasElement.oncontextmenu = (e) => e.preventDefault();
    // Global mouse up handler for panning
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      useMindMapStore.getState().setIsDraggingCanvas(false);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      canvasElement.oncontextmenu = null;
    };
  }, []);

  // Calculate zoom percentage
  const zoomPercentage = Math.round(canvasScale * 100);

  // --- UI ---
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        ref={canvasRef}
        className={cn(
          "mindmap-canvas relative w-full h-full min-h-[60vh] min-w-[90vw] max-w-full max-h-full overflow-auto",
          "bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200",
          "transition-all duration-300 ease-in-out",
          isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          boxSizing: 'border-box',
          backgroundImage: showGrid
            ? "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"%23e5e7eb\" stroke-width=\"0.5\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100%25\" height=\"100%25\" fill=\"url(%23grid)\"/%3E%3C/svg%3E')"
            : undefined,
        }}
        onClick={e => {
          // Only clear selection if the click is NOT on a node or interactive element
          if (!isNodeElement(e.target)) {
            useMindMapStore.getState().setSelectedNodeId(null);
          }
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        aria-label="Mind map canvas"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Enhanced Floating Toolbar */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 z-50 flex flex-col space-y-2"
        >
          <div className="bg-white/90 p-3 rounded-xl shadow-lg border border-gray-200 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleZoomIn}
                  variant="outline"
                  size="icon"
                  disabled={canvasScale >= 5}
                  className="w-10 h-10"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleZoomOut}
                  variant="outline"
                  size="icon"
                  disabled={canvasScale <= 0.1}
                  className="w-10 h-10"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={zoomToFit}
                  variant="outline"
                  size="icon"
                  className="w-10 h-10"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom to Fit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={resetView}
                  variant="outline"
                  size="icon"
                  className="w-10 h-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowGrid(!showGrid)}
                  variant={showGrid ? "default" : "outline"}
                  size="icon"
                  className="w-10 h-10"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showGrid ? "Hide Grid" : "Show Grid"}</TooltipContent>
            </Tooltip>
          </div>

          {/* Zoom Level Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-center"
          >
            <span className="text-sm font-medium text-gray-700">{zoomPercentage}%</span>
          </motion.div>
        </motion.div>

        {/* Canvas Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 z-40 bg-white/90 px-4 py-2 rounded-lg shadow-lg border border-gray-200"
        >
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MousePointer2 className="h-4 w-4" />
              <span>Drag nodes</span>
            </div>
            <div className="flex items-center space-x-1">
              <Hand className="h-4 w-4" />
              <span>Alt+Click to pan</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Scroll to zoom</span>
            </div>
          </div>
        </motion.div>

        {/* SVG Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="mindmap-connector-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <AnimatePresence>
            {connectorsToRender.map((conn) => (
              <motion.g
                key={`${conn.parent.id}-${conn.child.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Connector
                  parent={conn.parent}
                  child={conn.child}
                  canvasOffset={canvasOffset}
                  canvasScale={canvasScale}
                />
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>

        {/* Mind map nodes */}
        <AnimatePresence>
          {visibleNodes.map((node) => (
            <MindMapNode
              key={node.id}
              node={node}
              canvasOffset={canvasOffset}
              canvasScale={canvasScale}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <DragOverlay>
        {activeNodeId ? null : null}
      </DragOverlay>
    </DndContext>
  );
});

MindMapCanvas.displayName = 'MindMapCanvas';

export default MindMapCanvas;
