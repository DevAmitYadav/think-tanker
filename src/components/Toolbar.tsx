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

  // by Amit Yadav: Print handler
  const handlePrint = () => {
    window.print();
  };

  // by Amit Yadav: Reset view handler
  const handleResetView = () => {
    setCanvasScale(1);
    panCanvas(-useMindMapStore.getState().canvasOffset.x, -useMindMapStore.getState().canvasOffset.y);
    // by Amit Yadav: Optionally center root node if it exists (future enhancement)
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

