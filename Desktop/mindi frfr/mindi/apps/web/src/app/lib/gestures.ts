// =============================================================================
// MINDI Phase 1 — Gesture Utilities (Web)
// Drag-to-Connect + Pinch-to-Drill
// Every gesture has a keyboard fallback (Trust Covenant + accessibility)
// =============================================================================
'use client';

import { useCallback, useRef, useEffect } from 'react';

export interface DragConnectState {
  isDragging: boolean;
  sourceNodeId: string | null;
}

export interface PinchState {
  isPinching: boolean;
  initialDistance: number | null;
  scale: number;
}

function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Utility exported for graph-specific modules that need a simple point distance
export function getPinchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Drag-to-Connect ──────────────────────────────────────────────────────────

export function useDragToConnect(
  onConnect: (sourceId: string, targetId: string) => void
) {
  const sourceRef = useRef<string | null>(null);

  const startDrag = useCallback((nodeId: string) => {
    sourceRef.current = nodeId;
  }, []);

  const endDrag = useCallback((targetNodeId: string) => {
    if (sourceRef.current && sourceRef.current !== targetNodeId) {
      onConnect(sourceRef.current, targetNodeId);
    }
    sourceRef.current = null;
  }, [onConnect]);

  const cancelDrag = useCallback(() => { sourceRef.current = null; }, []);

  // Keyboard fallback: press C on source, then Enter on target
  const handleKeyboardConnect = useCallback(
    (e: React.KeyboardEvent, nodeId: string) => {
      if (e.key === 'c' || e.key === 'C') {
        sourceRef.current = nodeId;
        e.currentTarget.setAttribute('data-connecting', 'true');
      } else if (e.key === 'Enter' && sourceRef.current) {
        endDrag(nodeId);
        document.querySelectorAll('[data-connecting]').forEach(el =>
          el.removeAttribute('data-connecting')
        );
      }
    },
    [endDrag]
  );

  return { startDrag, endDrag, cancelDrag, handleKeyboardConnect };
}

// ── Pinch-to-Drill ───────────────────────────────────────────────────────────

export function usePinchToDrill(
  containerRef: React.RefObject<HTMLElement | null>,
  onDrill: (nodeId: string) => void
) {
  const pinchRef = useRef<{ initialDist: number; nodeId: string | null }>({
    initialDist: 0,
    nodeId: null,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current.initialDist = getTouchDistance(e.touches[0], e.touches[1]);
        // Find nearest node to pinch center
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const nodeEl = document.elementFromPoint(cx, cy)?.closest('[data-node-id]');
        pinchRef.current.nodeId = nodeEl?.getAttribute('data-node-id') ?? null;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 2 && pinchRef.current.nodeId) {
        const endDist = getTouchDistance(e.changedTouches[0], e.changedTouches[1]);
        // Pinch-in (scale < 0.7) = drill into node
        const scale = endDist / (pinchRef.current.initialDist || 1);
        if (scale < 0.7) {
          onDrill(pinchRef.current.nodeId);
        }
        pinchRef.current.nodeId = null;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, onDrill]);
}
