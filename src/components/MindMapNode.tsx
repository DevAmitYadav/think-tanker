import React, { useRef, useEffect, memo } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
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

  // DnD Kit: Make node draggable (must use isEditing after declaration)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { nodeId: node.id },
    disabled: isEditing, // Don't allow drag while editing
  });

  // Position the node on the canvas based on its stored position, offset, and scale
  const nodeStyle = {
    left: node.position.x + (transform?.x ?? 0),
    top: node.position.y + (transform?.y ?? 0),
    minWidth: 200,
    minHeight: 70,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    border: isSelected ? '2.5px solid #2563eb' : '2px solid #cbd5e1',
    zIndex: isDragging ? 50 : isSelected ? 20 : 10,
    fontFamily: 'Inter, Open Sans, Roboto, sans-serif',
    boxShadow: isDragging
      ? '0 12px 36px 0 rgba(37,99,235,0.22)'
      : isSelected
      ? '0 8px 32px 0 rgba(37,99,235,0.18)'
      : '0 4px 24px 0 rgba(30,41,59,0.10)',
    transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
    padding: '24px 20px 18px 20px',
    margin: '12px 18px',
    overflow: 'visible',
    opacity: isDragging ? 0.92 : 1,
    position: 'absolute' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    boxSizing: 'border-box',
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
        toast.success('Node renamed', {
          description: 'Node label updated.',
          position: 'top-right',
          duration: 3000,
          className: 'bg-white text-blue-700 font-semibold rounded-lg shadow-lg border border-blue-200 z-[99999]',
          style: { fontSize: 16, padding: '16px 24px', minWidth: 220, top: 24, right: 24, maxWidth: '90vw' }
        });
      } catch {
        toast.error('Failed to update label.', {
          description: 'Could not update node label.',
          position: 'top-right',
          duration: 3000,
          className: 'bg-white text-red-700 font-semibold rounded-lg shadow-lg border border-red-200 z-[99999]',
          style: { fontSize: 16, padding: '16px 24px', minWidth: 220, top: 24, right: 24, maxWidth: '90vw' }
        });
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
    <motion.div
      ref={el => {
        nodeRef.current = el;
        setNodeRef(el);
      }}
      className={`mind-map-node absolute flex flex-col justify-center items-center min-w-[140px] max-w-[90vw] md:min-w-[180px] md:max-w-[320px] whitespace-normal break-words select-none`}
      style={{
        ...nodeStyle,
        width: 'clamp(140px, 40vw, 320px)',
        minHeight: 60,
        maxWidth: '90vw',
        boxSizing: 'border-box',
      }}
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ boxShadow: '0 8px 32px 0 rgba(37,99,235,0.22)', scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Drag handle overlay: only this area is draggable, not label or buttons */}
      <div
        className="absolute inset-0 z-0 cursor-grab rounded-2xl"
        style={{ pointerEvents: isEditing ? 'none' : 'auto' }}
        {...listeners}
        {...attributes}
        tabIndex={-1}
        aria-label="Drag node"
      />
      {isEditing ? (
        <NodeLabelForm
          initialLabel={node.label}
          onSubmit={handleLabelSave}
          onCancel={handleLabelCancel}
          isSaving={isSaving}
        />
      ) : (
        <motion.span
          className="mind-map-node-label text-center text-slate-900 dark:text-slate-100 text-lg font-semibold cursor-text select-none leading-snug tracking-wide drop-shadow-sm"
          tabIndex={0}
          role="button"
          aria-label="Edit node label"
          style={{
            wordBreak: 'break-word',
            textShadow: '0 1px 2px #fff, 0 0px 8px #e0e7ff',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.92)',
            boxShadow: '0 2px 12px 0 rgba(80,120,255,0.10)',
            padding: '12px 24px',
            margin: '0 0 10px 0',
            minWidth: 120,
            maxWidth: 260,
            display: 'inline-block',
            fontFamily: 'Inter, Open Sans, Roboto, sans-serif',
            fontSize: 20,
            letterSpacing: 0.2,
          }}
          whileHover={{ background: 'rgba(255,255,255,1)', scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          {node.label}
        </motion.span>
      )}

      {isSelected && (
        <motion.div
          className="absolute left-1/2 -bottom-14 -translate-x-1/2 flex flex-row gap-3 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-30 backdrop-blur-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
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
            className={`p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-all duration-150 ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Add Child Node"
            aria-label="Add Child Node"
            disabled={isAdding}
            style={{ boxShadow: '0 1px 4px 0 rgba(37,99,235,0.08)' }}
          >
            {isAdding ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </button>
          {!isRoot && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await deleteNode(node.id);
                toast.success('Node deleted', {
                  description: 'Node and its children were deleted.',
                  position: 'top-right',
                  duration: 2200,
                  className: 'sonner-toast sonner-toast-red sonner-toast-sm',
                });
              }}
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/60 transition-all duration-150"
              title="Delete Node"
              aria-label="Delete Node"
              style={{ boxShadow: '0 1px 4px 0 rgba(239,68,68,0.08)' }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLabelDoubleClick();
            }}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/60 transition-all duration-150"
            title="Edit Label"
            aria-label="Edit Label"
            style={{ boxShadow: '0 1px 4px 0 rgba(71,85,105,0.08)' }}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/60 transition-all duration-150"
              title={node.collapsed ? "Expand Node" : "Collapse Node"}
              aria-label={node.collapsed ? "Expand Node" : "Collapse Node"}
              style={{ boxShadow: '0 1px 4px 0 rgba(71,85,105,0.08)' }}
            >
              {node.collapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;
