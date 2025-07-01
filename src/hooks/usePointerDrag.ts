import { useRef, useCallback, useState, useEffect } from 'react';

interface DragCallbacks {
  onPointerDown?: (event: React.PointerEvent<HTMLElement>, startX: number, startY: number) => void;
  onDragStart?: (event: React.PointerEvent<HTMLElement>, initialX: number, initialY: number) => void;
  onDragMove?: (event: React.PointerEvent<HTMLElement>, dx: number, dy: number, initialX: number, initialY: number) => void;
  onDragEnd?: (event: React.PointerEvent<HTMLElement>, finalX: number, finalY: number, initialX: number, initialY: number) => void;
  onClick?: (event: React.PointerEvent<HTMLElement>) => void;
}

const DRAG_THRESHOLD_PX = 5; // Minimum movement before a drag is initiated

/**
 * A custom hook for implementing flexible drag-and-drop behavior using Pointer Events.
 * It differentiates between click and drag actions.
 * @param callbacks - An object containing optional callback functions for different drag states.
 * @returns An object with `isDragging` state and `pointerDown` handler to attach to an element.
 */
export const usePointerDrag = (callbacks: DragCallbacks) => {
  const isDraggingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const initialClientPos = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement | null>(null);
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false); // State for visual feedback

  const handlePointerMove = useCallback((event: PointerEvent) => {
    // Prevent text selection during drag
    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - initialClientPos.current.x;
    const dy = event.clientY - initialClientPos.current.y;

    if (!isDraggingRef.current) {
      // Check if threshold is met to start dragging
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        isDraggingRef.current = true;
        setIsCurrentlyDragging(true);
        callbacks.onDragStart?.(event as any, startPos.current.x, startPos.current.y);
      }
    }

    if (isDraggingRef.current) {
      callbacks.onDragMove?.(event as any, dx, dy, startPos.current.x, startPos.current.y);
    }
  }, [callbacks]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    // Prevent text selection during drag
    event.preventDefault();
    event.stopPropagation();

    if (elementRef.current) {
      elementRef.current.releasePointerCapture(event.pointerId);
    }

    if (isDraggingRef.current) {
      callbacks.onDragEnd?.(event as any, startPos.current.x + (event.clientX - initialClientPos.current.x), startPos.current.y + (event.clientY - initialClientPos.current.y), startPos.current.x, startPos.current.y);
    } else {
      // Only trigger click if no drag occurred
      callbacks.onClick?.(event as any);
    }

    isDraggingRef.current = false;
    setIsCurrentlyDragging(false);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }, [callbacks, handlePointerMove]);


  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    // Only allow left mouse button (or touch) for dragging
    if (event.button !== 0) return;

    // Prevent default browser drag behavior
    event.preventDefault();
    event.stopPropagation();

    elementRef.current = event.currentTarget;
    elementRef.current.setPointerCapture(event.pointerId);

    initialClientPos.current = { x: event.clientX, y: event.clientY };
    isDraggingRef.current = false; // Reset drag state on new pointer down

    callbacks.onPointerDown?.(event, event.currentTarget.offsetLeft, event.currentTarget.offsetTop);

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [callbacks, handlePointerMove, handlePointerUp]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return { isDragging: isCurrentlyDragging, pointerDown: handlePointerDown };
};
