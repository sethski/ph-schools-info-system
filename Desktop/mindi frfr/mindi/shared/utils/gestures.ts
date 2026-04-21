// =============================================================================
// MINDI Phase 1 — Shared Utils: Gesture Utilities
// Drag-to-Connect and Pinch-to-Drill (web only)
// Every gesture has a keyboard fallback (Trust Covenant)
// =============================================================================

export const GESTURE_CONFIG = {
  DRAG_TO_CONNECT: {
    description: 'Drag from one node to another to create a connection',
    keyboardFallback: 'Select source node → press C → select target node',
    enabled: true,
  },
  PINCH_TO_DRILL: {
    description: 'Pinch in on a node to drill into its details',
    keyboardFallback: 'Focus node → press Enter to open drill-down',
    enabled: true,
  },
} as const;

// Touch state for gesture detection
export interface TouchGestureState {
  startDistance: number | null;   // For pinch
  startX: number;
  startY: number;
  isDragging: boolean;
  sourceNodeId: string | null;
}

// Calculate pinch distance between two touch points
export function getPinchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
