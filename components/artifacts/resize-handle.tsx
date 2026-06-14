"use client";

import React, { useRef, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onResize: (width: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  onDragStart,
  onDragEnd,
  minWidth = 300,
  maxWidth = 1200,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX; // Inverted because we're resizing from right
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minWidth, maxWidth, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    startXRef.current = e.clientX;
    
    // Get current width from the parent pane
    const pane = handleRef.current?.parentElement;
    if (pane) {
      startWidthRef.current = pane.offsetWidth;
    }
  };

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize group hover:w-2 transition-all",
        "bg-border hover:bg-primary/50",
        isDragging && "bg-primary w-2",
        className
      )}
      style={{ zIndex: 10 }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
};

