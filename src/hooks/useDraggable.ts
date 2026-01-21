import { useState, useCallback } from 'react';

export function useDraggable(leadId: number) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{ startX: number; startY: number } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.DragEvent).clientX;
      clientY = (e as React.DragEvent).clientY;
    }

    setDragData({ startX: clientX, startY: clientY });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragData(null);
  }, []);

  const shouldStartDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragData) return true;

    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = Math.abs(clientX - dragData.startX);
    const deltaY = Math.abs(clientY - dragData.startY);

    return deltaX > 5 || deltaY > 5;
  }, [dragData]);

  const attributes = isDragging
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData('leadId', leadId.toString());
          e.dataTransfer.effectAllowed = 'move';
        },
        onDragEnd: handleDragEnd,
        onTouchStart: handleDragStart,
        onTouchEnd: handleDragEnd,
      }
    : {};

  const listeners = isDragging
    ? {}
    : {
        onMouseDown: handleDragStart,
        onMouseUp: handleDragEnd,
        onTouchStartCapture: handleDragStart,
        onTouchEndCapture: handleDragEnd,
      };

  return {
    attributes,
    listeners,
    setNodeRef: (node: HTMLDivElement | null) => {
      if (node && isDragging) {
        node.draggable = true;
      }
    },
    isDragging,
    isDraggable: !isDragging,
    shouldStartDrag,
  };
}
