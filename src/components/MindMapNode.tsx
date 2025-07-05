import React, { useRef, useEffect, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDraggable } from '@dnd-kit/core';
import NodeLabelForm from './ui/NodeLabelForm';
import type { MindMapNode as MindMapNodeType } from '../types';
import { useMindMapStore } from '../store/mindMapStore';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy,
  Star,
  Palette,
  MoreHorizontal,
  Move
} from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn, generateGradient } from '../lib/utils';
import ReactDOM from 'react-dom';

interface MindMapNodeProps {
  node: MindMapNodeType;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
}

// Utility to check if a DOMRect is visible in the viewport
function isRectVisible(rect) {
  return (
    rect.width > 0 && rect.height > 0 &&
    rect.bottom > 0 && rect.right > 0 &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth)
  );
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const lastReportedSizeRef = useRef<{ width: number; height: number } | null>(null);

  const isSelected = selectedNodeId === node.id;
  const isRoot = node.id === rootNodeId;
  const isEditing = editingNodeId === node.id;

  // DnD Kit: Make node draggable with advanced configuration
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { 
      nodeId: node.id,
      type: 'mind-map-node',
      node: node
    },
    disabled: isEditing,
  });

  // Generate consistent color based on node id
  const nodeGradient = generateGradient(node.id);
  const isStarred = node.metadata?.starred || false;

  // Advanced positioning with smooth transforms
  const zIndex = isDragging ? 1000 : isSelected ? 20 : 10;

  const nodeStyle = {
    left: node.position.x * canvasScale + canvasOffset.x + (transform?.x ?? 0),
    top: node.position.y * canvasScale + canvasOffset.y + (transform?.y ?? 0),
    zIndex,
    opacity: isDragging ? 0.3 : 1, // Make original node semi-transparent when dragging
    position: 'absolute' as const,
    transform: isDragging ? 'scale(0.95)' : 'scale(1)',
    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Enhanced node styling with modern design
  const getNodeClasses = () => {
    return cn(
      "mind-map-node relative flex flex-col items-center justify-center",
      "min-w-[140px] max-w-[90vw] md:min-w-[180px] md:max-w-[320px]",
      "whitespace-normal break-words select-none",
      "transition-all duration-300 ease-out",
      "rounded-2xl border-2",
      isRoot && "ring-2 ring-blue-500/20",
      isSelected && "ring-2 ring-blue-500 ring-offset-2",
      isDragging && "scale-105 shadow-2xl",
      isHovered && !isSelected && "ring-2 ring-gray-300/50"
    );
  };

  const getNodeBackground = () => {
    if (isRoot) {
      return "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200";
    }
    if (isSelected) {
      return "bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300";
    }
    return `bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300`;
  };

  // Start editing label
  const handleLabelDoubleClick = () => {
    setEditingNodeId(node.id);
  };

  // Save label with validation
  const handleLabelSave = async (label: string) => {
    if (label.trim() !== node.label.trim()) {
      setIsSaving(true);
      try {
        await updateNode(node.id, { label: label.trim() });
        toast.success('Node updated', {
          description: 'Node label has been updated successfully',
          icon: <Edit3 className="h-5 w-5" />,
          className: 'bg-white !text-gray-900',
        });
      } catch {
        toast.error('Failed to update node', {
          description: 'Could not update node label. Please try again.',
          icon: <Edit3 className="h-5 w-5" />,
          className: 'bg-white !text-gray-900',
        });
      }
      setIsSaving(false);
    }
    setEditingNodeId(null);
  };

  // Cancel editing
  const handleLabelCancel = () => {
    setEditingNodeId(null);
  };

  // Toggle star status
  const toggleStar = async () => {
    try {
      await updateNode(node.id, { 
        metadata: { 
          ...node.metadata, 
          starred: !isStarred 
        } 
      });
      toast.success(isStarred ? 'Removed from favorites' : 'Added to favorites', {
        icon: <Star className="h-5 w-5" />,
        className: 'bg-white !text-gray-900',
      });
    } catch {
      toast.error('Failed to update node', {
        description: 'Could not update star status.',
        icon: <Star className="h-5 w-5" />,
        className: 'bg-white !text-gray-900',
      });
    }
  };

  // Copy node to clipboard
  const copyNode = () => {
    navigator.clipboard.writeText(node.label);
    toast.success('Copied to clipboard', {
      description: 'Node content copied to clipboard',
      icon: <Copy className="h-5 w-5" />,
      className: 'bg-white !text-gray-900',
    });
  };

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  // Report actual node size to store for zoomToFit
  useEffect(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const lastReported = lastReportedSizeRef.current;
      
      if (
        !lastReported ||
        lastReported.width !== rect.width ||
        lastReported.height !== rect.height
      ) {
        const newSize = { width: rect.width, height: rect.height };
        lastReportedSizeRef.current = newSize;
        useMindMapStore.getState().setNodeSize(node.id, newSize);
      }
    }
  }, [node.label, canvasScale, node.id]); // Removed node.size from dependencies to prevent infinite loop

  // Helper to determine if menu should render above or below
  const [menuAbove, setMenuAbove] = useState(false);
  useEffect(() => {
    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    // If the node is too close to the bottom of the viewport, show menu above
    setMenuAbove(rect.bottom + 120 > window.innerHeight);
  }, [isSelected, nodeRef.current]);

  // Show action menu only if node is selected (clicked)
  const showActionMenu = isSelected;

  // Calculate menu position for portal
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!showActionMenu || !nodeRef.current) {
      setMenuPos(null);
      return;
    }
    const rect = nodeRef.current.getBoundingClientRect();
    if (!isRectVisible(rect)) {
      setMenuPos(null);
      return;
    }
    const menuHeight = 56; // Approximate height of the menu
    let top = menuAbove ? rect.top - menuHeight - 8 : rect.bottom + 8;
    let left = rect.left + rect.width / 2;
    setMenuPos({ top, left });
  }, [showActionMenu, menuAbove, nodeRef.current, node.position, canvasOffset, canvasScale, transform]);

  return (
    <motion.div
      ref={el => {
        nodeRef.current = el;
        setNodeRef(el);
      }}
      className={getNodeClasses()}
      style={{
        ...nodeStyle,
        width: 'clamp(120px, 30vw, 280px)',
        minHeight: 48,
        maxWidth: '85vw',
        boxSizing: 'border-box',
      }}
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
      }}
      onContextMenu={e => e.preventDefault()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isEditing ? 'Editing node label' : 'Mind map node'}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        duration: 0.2
      }}
    >
      {/* Dedicated Drag Handle (top-left corner, NOT the action menu) */}
      <div
        className="absolute top-2 left-2 z-20 w-6 h-6 flex items-center justify-center cursor-grab rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-300 shadow"
        {...listeners}
        {...attributes}
        aria-label="Drag node"
        onMouseDown={e => e.stopPropagation()} // Prevent drag from blocking other actions
        onTouchStart={e => e.stopPropagation()}
      >
        <Move className="h-4 w-4 text-blue-600" />
      </div>

      {/* Node Content (fully interactive) */}
      <div className={cn(
        "relative w-full h-full p-4 rounded-2xl",
        getNodeBackground(),
        "flex flex-col items-center justify-center gap-2"
      )}>
        {/* Star indicator (yellow dot if favorited) */}
        {isStarred && (
          <span
            className="absolute top-2 right-2 z-10 w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow"
            title="Favorited"
          />
        )}

        {/* Node Label */}
        {isEditing ? (
          <NodeLabelForm
            initialLabel={node.label}
            onSubmit={handleLabelSave}
            onCancel={handleLabelCancel}
            isSaving={isSaving}
          />
        ) : (
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.02 }}
          >
            <span
              className={cn(
                "mind-map-node-label text-center font-semibold cursor-pointer select-none",
                "leading-tight tracking-wide drop-shadow-sm",
                "px-4 py-2 rounded-xl",
                "bg-white border border-gray-200/50",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "min-w-[60px] max-w-[220px]",
                "text-gray-900",
                isRoot && "text-lg font-bold",
                !isRoot && "text-base"
              )}
              style={{
                wordBreak: 'break-word',
                fontSize: `clamp(0.875rem, ${1.2 * canvasScale}rem, 1.125rem)`,
                fontWeight: isRoot ? 700 : 600,
              }}
              onDoubleClick={handleLabelDoubleClick}
            >
              {node.label}
            </span>
          </motion.div>
        )}

        {/* Collapse indicator */}
        {node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              "bg-white border-2 border-gray-300 shadow-sm",
              "text-gray-600 text-xs font-bold"
            )}>
              {node.children.length}
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Action Menu (Portal, only one instance) */}
      {showActionMenu && menuPos && !(menuPos.top === 0 && menuPos.left === 0) && ReactDOM.createPortal(
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed z-[9999]"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            transform: 'translate(-50%, 0)',
            minWidth: 240,
            pointerEvents: 'auto',
          }}
        >
          <div className="flex flex-row gap-2 bg-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-200">
            
            {/* Add Child */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsAdding(true);
                    try {
                      await addNode(node.id);
                      toast.success('Child node added', {
                        className: 'bg-white !text-gray-900',
                      });
                    } catch {
                      toast.error('Failed to add child node', {
                        className: 'bg-white !text-gray-900',
                      });
                    }
                    setIsAdding(false);
                  }}
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </motion.div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Child Node</TooltipContent>
            </Tooltip>

            {/* Edit */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLabelDoubleClick();
                  }}
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Node</TooltipContent>
            </Tooltip>

            {/* Copy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyNode();
                  }}
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Node</TooltipContent>
            </Tooltip>

            {/* Star */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar();
                  }}
                  variant={isStarred ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                >
                  <Star className={cn("h-4 w-4", isStarred && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isStarred ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
            </Tooltip>

            {/* Collapse/Expand */}
            {node.children.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(node.id);
                    }}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8"
                  >
                    {node.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{node.collapsed ? "Expand Node" : "Collapse Node"}</TooltipContent>
              </Tooltip>
            )}

            {/* Delete (not for root) */}
            {!isRoot && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteNode(node.id);
                      toast.success('Node deleted', {
                        className: 'bg-white !text-gray-900',
                      });
                    }}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Node</TooltipContent>
              </Tooltip>
            )}
          </div>
        </motion.div>,
        document.body
      )}
    </motion.div>
  );
});

MindMapNode.displayName = 'MindMapNode';

export default MindMapNode;
