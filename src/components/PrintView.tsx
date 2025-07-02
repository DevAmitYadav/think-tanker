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
    <div className="print-container relative w-full h-full bg-white text-black print:block hidden"
         style={{
           transform: `translate(${offsetX}px, ${offsetY}px)`,
           minWidth: `${contentWidth + 100}px`,
           minHeight: `${contentHeight + 100}px`,
           overflow: 'visible',
         }}>
      <svg
        className="print-svg block w-full h-full"
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 2 }}
      >
        {connectorsToRender.map((conn) => (
          <Connector
            key={`${conn.parent.id}-${conn.child.id}`}
            parent={{ ...conn.parent, position: { x: conn.parent.position.x, y: conn.parent.position.y } }}
            child={{ ...conn.child, position: { x: conn.child.position.x, y: conn.child.position.y } }}
            canvasOffset={{ x: 0, y: 0 }}
            canvasScale={1}
            forceSolidColor={true}
          />
        ))}
      </svg>
      {visibleNodes.map((node) => (
        <MindMapNode
          key={node.id}
          node={{ ...node, position: { x: node.position.x, y: node.position.y } }}
          canvasOffset={{ x: 0, y: 0 }}
          canvasScale={1}
        />
      ))}
    </div>
  );
};

export default PrintView;