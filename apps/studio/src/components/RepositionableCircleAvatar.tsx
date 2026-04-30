'use client';

import { useState, useRef, useEffect } from 'react';

interface RepositionableCircleAvatarProps {
  src: string;
  position: string;
  onPositionChange: (position: string) => void;
  size?: number;
  disabled?: boolean;
}

export function RepositionableCircleAvatar({
  src,
  position,
  onPositionChange,
  size = 120,
  disabled = false,
}: RepositionableCircleAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // State for UI
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [_hasChanges, setHasChanges] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [currentPos, setCurrentPos] = useState({ x: 50, y: 50 });

  // Saved values
  const [savedPos, setSavedPos] = useState({ x: 50, y: 50 });
  const [savedZoom, setSavedZoom] = useState(1);

  // Drag tracking - store initial mouse position and image position
  const dragStartMouseX = useRef(0);
  const dragStartMouseY = useRef(0);
  const dragStartPosX = useRef(0);
  const dragStartPosY = useRef(0);

  // Parse position string like "50% 50% 1.5" into x, y, zoom
  const parsePosition = (pos: string): { x: number; y: number; zoom: number } => {
    const parts = pos.split(' ').map((p) => parseFloat(p.replace('%', '')));
    return {
      x: parts[0] ?? 50,
      y: parts[1] ?? 50,
      zoom: parts[2] ?? 1
    };
  };

  // Initialize from prop
  useEffect(() => {
    const parsed = parsePosition(position);
    setCurrentPos({ x: parsed.x, y: parsed.y });
    setSavedPos({ x: parsed.x, y: parsed.y });
    setCurrentZoom(parsed.zoom);
    setSavedZoom(parsed.zoom);
    setHasChanges(false);
    setIsEditing(false);
  }, [position]);

  // Lock page scroll when editing
  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditing]);

  // Check if there are unsaved changes
  const checkChanges = (posX: number, posY: number, zoom: number) => {
    const changed =
      Math.abs(posX - savedPos.x) > 0.5 ||
      Math.abs(posY - savedPos.y) > 0.5 ||
      Math.abs(zoom - savedZoom) > 0.05;
    setHasChanges(changed);
    if (changed) {
      setIsEditing(true);
    }
  };

  // Mouse down - start drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    dragStartMouseX.current = e.clientX;
    dragStartMouseY.current = e.clientY;
    dragStartPosX.current = currentPos.x;
    dragStartPosY.current = currentPos.y;

    setIsDragging(true);
    setIsEditing(true);
  };

  // Global mouse move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current.getBoundingClientRect();
      const sensitivityX = 1; // Slower horizontal movement
      const sensitivityY = 2; // Normal vertical movement

      // Calculate how much the mouse moved
      const mouseDeltaX = e.clientX - dragStartMouseX.current;
      const mouseDeltaY = e.clientY - dragStartMouseY.current;

      // Convert to percentage of container and apply sensitivity (different for X and Y)
      const percentDeltaX = (mouseDeltaX / rect.width) * 100 * sensitivityX;
      const percentDeltaY = (mouseDeltaY / rect.height) * 100 * sensitivityY;

      // Invert and add to starting position (moving mouse right moves image left, showing right side)
      const newX = Math.max(0, Math.min(100, dragStartPosX.current - percentDeltaX));
      const newY = Math.max(0, Math.min(100, dragStartPosY.current - percentDeltaY));

      setCurrentPos({ x: newX, y: newY });
      checkChanges(newX, newY, currentZoom);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // Use capture phase to ensure we get events
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDragging, currentZoom, savedPos.x, savedPos.y, savedZoom]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    setIsEditing(true);

    const zoomSpeed = e.shiftKey ? 0.02 : 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.max(0.5, Math.min(3, currentZoom + delta));

    setCurrentZoom(newZoom);
    checkChanges(currentPos.x, currentPos.y, newZoom);
  };

  // Save
  const handleSave = () => {
    setSavedPos({ ...currentPos });
    setSavedZoom(currentZoom);
    onPositionChange(`${Math.round(currentPos.x)}% ${Math.round(currentPos.y)}% ${currentZoom.toFixed(2)}`);
    setHasChanges(false);
    setIsEditing(false);
  };

  // Reset
  const handleReset = () => {
    setCurrentPos({ ...savedPos });
    setCurrentZoom(savedZoom);
    setHasChanges(false);
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
            border: isEditing ? '2px solid var(--foreground)' : '1px solid var(--border)',
            backgroundColor: 'var(--muted)',
            position: 'relative',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <img
            src={src}
            alt="Avatar"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${currentPos.x}% ${currentPos.y}%`,
              transform: `scale(${currentZoom})`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
        {!disabled && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            {!isEditing && (
              <div
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'none',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                }}
              >
                Drag · Scroll · ⇧ Fine
              </div>
            )}
            {isEditing && (
              <div
                style={{
                  color: 'var(--foreground)',
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '0.25rem 0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0',
                }}
              >
                {Math.round(currentZoom * 100)}%
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '0',
              border: '1px solid var(--foreground)',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '0',
              border: '1px solid var(--muted-foreground)',
              backgroundColor: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--muted-foreground)'}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
