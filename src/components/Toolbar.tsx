// by Amit Yadav: Toolbar for mind map actions, refactored for UI consistency
import React, { memo } from 'react';
import { useMindMapStore } from '../store/mindMapStore';
import { PlusCircleIcon, PrinterIcon, TrashIcon, HomeIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

const Toolbar: React.FC = memo(() => {
  const {
    rootNodeId,
    addRootNode,
    addNode,
    selectedNodeId,
    resetMap,
    setCanvasScale,
    panCanvas,
    // nodes // by Amit Yadav: removed unused variable
  } = useMindMapStore();

  // by Amit Yadav: Print handler (shows print view only for print)
  const handlePrint = () => {
    window.print();
  };

  // by Amit Yadav: Reset view handler (zoom to fit all nodes)
  const handleResetView = () => {
    const { nodes, canvasOffset } = useMindMapStore.getState();
    const visibleNodes = Object.values(nodes).filter(n => n && (!n.parentId || nodes[n.parentId]));
    if (visibleNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visibleNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    const width = maxX - minX + 160;
    const height = maxY - minY + 40;
    const cWidth = window.innerWidth;
    const cHeight = 1200; // or get from container
    const scale = Math.min(cWidth / width, cHeight / height, 1);
    const offsetX = (cWidth - width * scale) / 2 - minX * scale;
    const offsetY = (cHeight - height * scale) / 2 - minY * scale;
    setCanvasScale(scale);
    panCanvas(offsetX - canvasOffset.x, offsetY - canvasOffset.y);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex space-x-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
      {!rootNodeId && (
        <Button onClick={addRootNode} variant="primary" icon={<PlusCircleIcon className="h-5 w-5" />} title="Create Root Node">
          Root
        </Button>
      )}
      {rootNodeId && (
        <>
          <Button
            onClick={() => selectedNodeId && addNode(selectedNodeId)}
            disabled={!selectedNodeId}
            variant="secondary"
            icon={<PlusCircleIcon className="h-5 w-5" />}
            title="Add Child Node"
          >
            Child
          </Button>
          <Button
            onClick={handleResetView}
            variant="secondary"
            icon={<HomeIcon className="h-5 w-5" />}
            title="Reset View"
          >
            Reset View
          </Button>
          <Button
            onClick={handlePrint}
            variant="secondary"
            icon={<PrinterIcon className="h-5 w-5" />}
            title="Print Map"
          >
            Print
          </Button>
          <Button
            onClick={resetMap}
            variant="danger"
            icon={<TrashIcon className="h-5 w-5" />}
            title="Clear All Nodes"
          >
            Clear All
          </Button>
        </>
      )}
    </div>
  );
});

export default Toolbar;

