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

const Connector: React.FC<ConnectorProps & { forceSolidColor?: boolean }> = memo(({ parent, child, canvasOffset, canvasScale, forceSolidColor }) => {
  const parentDims = getNodeDimensions(parent.id);
  const childDims = getNodeDimensions(child.id);

  // Calculate scaled and offset coordinates for parent and child
  const pX = parent.position.x * canvasScale + canvasOffset.x;
  const pY = parent.position.y * canvasScale + canvasOffset.y;
  const cX = child.position.x * canvasScale + canvasOffset.x;
  const cY = child.position.y * canvasScale + canvasOffset.y;

  // Connect from right edge of parent to left edge of child, both vertically centered
  const startX = pX + parentDims.width * canvasScale;
  const startY = pY + (parentDims.height * canvasScale) / 2;
  const endX = cX;
  const endY = cY + (childDims.height * canvasScale) / 2;

  // Modern mind map connector: smooth, thick, colored, with shadow and rounded ends
  // Use a more visually balanced Bezier curve (horizontal offset for control points)
  const dx = Math.max(Math.abs(endX - startX) * 0.4, 60); // curve strength
  const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

  return (
    <path
      d={pathData}
      stroke={forceSolidColor ? '#2563eb' : 'url(#mindmap-connector-gradient)'}
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
      filter={forceSolidColor ? 'none' : 'drop-shadow(0px 2px 8px #818cf888)'}
      className="mind-map-connector"
      style={{ transitionProperty: 'd' }}
    />
  );
});

export default Connector;
