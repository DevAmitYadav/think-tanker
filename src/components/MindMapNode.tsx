import React, { useRef, useEffect, memo } from 'react';
import NodeLabelForm from './ui/NodeLabelForm';
import type { MindMapNode as MindMapNodeType } from '../types';
import { useMindMapStore } from '../store/mindMapStore';
// import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/20/solid';

interface MindMapNodeProps {
  node: MindMapNodeType;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
}

const MindMapNode: React.FC<MindMapNodeProps> = memo(({ node, canvasOffset, canvasScale }) => {
  const {
    updateNode,
    addNode,
    deleteNode,
    toggleCollapse,
    setSelectedNodeId,
    selectedNodeId,
    rootNodeId,
    editingNodeId,
    setEditingNodeId
  } = useMindMapStore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);


  const isSelected = selectedNodeId === node.id;
  const isRoot = node.id === rootNodeId;
  const isEditing = editingNodeId === node.id;

  // Position the node on the canvas based on its stored position, offset, and scale
  const nodeStyle = {
    left: node.position.x * canvasScale + canvasOffset.x,
    top: node.position.y * canvasScale + canvasOffset.y,
    transform: `scale(${canvasScale})`, // Scale the node itself slightly for visual effect
    transformOrigin: 'top left', // Scale from top-left for consistent positioning
  };

  // by Amit Yadav: Start editing label
  const handleLabelDoubleClick = () => {
    setEditingNodeId(node.id);
  };

  // by Amit Yadav: Save label with validation
  const handleLabelSave = async (label: string) => {
    if (label.trim() !== node.label.trim()) {
      setIsSaving(true);
      try {
        await updateNode(node.id, { label: label.trim() });
      } catch {
        alert('Failed to update label.');
      }
      setIsSaving(false);
    }
    setEditingNodeId(null);
  };

  // by Amit Yadav: Cancel editing
  const handleLabelCancel = () => {
    setEditingNodeId(null);
  };


  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);


  // Remove drag and DnD logic for now. Only allow click/select/edit/delete.
  return (
    <div
      ref={nodeRef}
      className={`mind-map-node absolute bg-white shadow-lg rounded-lg px-4 py-2 flex flex-col justify-center items-center cursor-pointer min-w-[120px] max-w-[200px] whitespace-normal break-words transition-all duration-100 ease-out border-2 ${
        isSelected ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200'
      } z-10`}
      style={nodeStyle}
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
      }}
      onDoubleClick={e => {
        e.stopPropagation();
        handleLabelDoubleClick();
      }}
      onContextMenu={e => e.preventDefault()}
      aria-label={isEditing ? 'Editing node label' : 'Mind map node'}
    >
      {isEditing ? (
        <NodeLabelForm
          initialLabel={node.label}
          onSubmit={handleLabelSave}
          onCancel={handleLabelCancel}
          isSaving={isSaving}
        />
      ) : (
        <span
          className="mind-map-node-label text-center text-gray-800 text-sm font-medium py-1 px-2 cursor-text select-none"
          tabIndex={0}
          role="button"
          aria-label="Edit node label"
        >
          {node.label}
        </span>
      )}

      {isSelected && (
        <div className="absolute -bottom-8 flex space-x-1.5 bg-white p-1 rounded-md shadow-lg border border-gray-200 z-30">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setIsAdding(true);
              try {
                await addNode(node.id);
              } catch {
                alert('Failed to add child node.');
              }
              setIsAdding(false);
            }}
            className={`p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-150 ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Add Child Node"
            aria-label="Add Child Node"
            disabled={isAdding}
          >
            {isAdding ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </button>
          {!isRoot && ( // Don't allow deleting the root node directly
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // by Amit Yadav: Confirm before deleting
                if (window.confirm('Delete this node and all its children?')) {
                  await deleteNode(node.id);
                }
              }}
              className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-150"
              title="Delete Node"
              aria-label="Delete Node"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLabelDoubleClick();
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-150"
            title="Edit Label"
            aria-label="Edit Label"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-150"
              title={node.collapsed ? "Expand Node" : "Collapse Node"}
              aria-label={node.collapsed ? "Expand Node" : "Collapse Node"}
            >
              {node.collapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;
