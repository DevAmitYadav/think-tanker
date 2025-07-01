// by Amit Yadav: Connector component for rendering edges between nodes
import React, { memo } from 'react';
import type { MindMapNode } from '../types';
import { getNodeDimensions } from '../utils/treeUtils';

interface ConnectorProps {
  parent: MindMapNode;
  child: MindMapNode;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
}

const Connector: React.FC<ConnectorProps> = memo(({ parent, child, canvasOffset, canvasScale }) => {
  const parentDims = getNodeDimensions(parent.id);
  const childDims = getNodeDimensions(child.id);

  // Calculate scaled and offset coordinates for parent and child
  const pX = parent.position.x * canvasScale + canvasOffset.x;
  const pY = parent.position.y * canvasScale + canvasOffset.y;
  const cX = child.position.x * canvasScale + canvasOffset.x;
  const cY = child.position.y * canvasScale + canvasOffset.y;

  // Determine start and end points for the line
  const startX = pX + parentDims.width * canvasScale / 2;
  const startY = pY + parentDims.height * canvasScale / 2;
  const endX = cX - childDims.width * canvasScale / 2;
  const endY = cY + childDims.height * canvasScale / 2;

  // Bezier curve for a visually appealing connector
  const midX = (startX + endX) / 2;
  const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <path
      d={pathData}
      stroke="#a0a0a0"
      strokeWidth={2}
      fill="none"
      className="mind-map-connector transition-all duration-100 ease-out"
      style={{ transitionProperty: 'd' }}
    />
  );
});

export default Connector;
