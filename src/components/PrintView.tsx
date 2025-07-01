import React from 'react';
import { useMindMapStore } from '../store/mindMapStore';
import MindMapNode from './MindMapNode';
import Connector from './Connector';
import { getVisibleNodes } from '../utils/treeUtils';

// This component is rendered conditionally/via portal for print
// It needs to render all nodes in their absolute positions without
// relying on canvasOffset/Scale directly as they are applied to the parent div
// For print, we essentially want a 1:1 render of the logical positions.
const PrintView: React.FC = () => {
  const { nodes, rootNodeId } = useMindMapStore();
  const visibleNodes = getVisibleNodes(nodes, rootNodeId);

  // Filter nodes that are actually rendered to determine connectors
  const renderedNodeIds = new Set(visibleNodes.map(node => node.id));
  const connectorsToRender = visibleNodes.flatMap(node =>
    node.children
      .filter(childId => renderedNodeIds.has(childId))
      .map(childId => ({ parent: node, child: nodes[childId] }))
  );

  // Determine the bounding box of all nodes to center the print view
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  visibleNodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Calculate an offset to center the content around (0,0) or some reference point
  // We'll set the origin of the print container so that nodes align correctly.
  // The goal is to make minX, minY effectively (0,0) in the print view.
  const offsetX = -minX + 50; // Add some padding
  const offsetY = -minY + 50; // Add some padding

  return (
    <div className="print-container hidden absolute w-full h-full overflow-hidden bg-white text-black"
         style={{
           // Apply a transform to shift content so it's visible in print
           // This moves everything by offsetX, offsetY pixels.
           transform: `translate(${offsetX}px, ${offsetY}px)`,
           // Adjust min-height/width to ensure the print canvas scales correctly
           minWidth: `${contentWidth + 100}px`, // content + padding
           minHeight: `${contentHeight + 100}px`, // content + padding
         }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connectorsToRender.map((conn, index) => (
          <Connector
            key={`${conn.parent.id}-${conn.child.id}`}
            parent={{ ...conn.parent, position: { x: conn.parent.position.x, y: conn.parent.position.y } }}
            child={{ ...conn.child, position: { x: conn.child.position.x, y: conn.child.position.y } }}
            canvasOffset={{ x: 0, y: 0 }} // No canvas offset for print
            canvasScale={1} // No canvas scale for print
          />
        ))}
      </svg>
      {visibleNodes.map((node) => (
        <MindMapNode
          key={node.id}
          node={{ ...node, position: { x: node.position.x, y: node.position.y } }}
          canvasOffset={{ x: 0, y: 0 }} // No canvas offset for print
          canvasScale={1} // No canvas scale for print
        />
      ))}
    </div>
  );
};

export default PrintView;