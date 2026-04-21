// =============================================================================
// MINDI — useGestures Hook (Phase 4)
// Implements the full gesture suite with keyboard fallbacks.
// All gestures are reversible and optional (Trust Covenant).
// ui-ux-pro-max: gesture-alternative — every gesture has visible keyboard alt.
// touch-action: manipulation to eliminate 300ms tap delay on mobile.
// =============================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { GESTURE_REGISTRY } from '../../../../shared/constants/phase4';

interface GestureHandlers {
  onSwipeDelegate?: (nodeId: string) => void;
  onHoldReflect?: (nodeId: string) => void;
  onTwoFingerRotate?: (angleDelta: number) => void;
  onDoubleTapExpand?: (nodeId: string) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  holdTimer: NodeJS.Timeout | null;
  touches: Touch[];
  initialPinchAngle: number | null;
}

const HOLD_THRESHOLD_MS = 500;
const SWIPE_THRESHOLD_PX = 80;
const DOUBLE_TAP_THRESHOLD_MS = 300;

export function useGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  handlers: GestureHandlers,
  nodeId: string
) {
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    holdTimer: null,
    touches: [],
    initialPinchAngle: null,
  });

  const lastTapRef = useRef<number>(0);

  const getTouchAngle = (t1: Touch, t2: Touch): number =>
    Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const state = touchState.current;
    state.touches = Array.from(e.touches);
    state.startX = e.touches[0].clientX;
    state.startY = e.touches[0].clientY;
    state.startTime = Date.now();

    // Two-finger rotate init
    if (e.touches.length === 2 && GESTURE_REGISTRY['two-finger-rotate'].enabled) {
      state.initialPinchAngle = getTouchAngle(e.touches[0], e.touches[1]);
    }

    // Hold-to-reflect
    if (e.touches.length === 1 && GESTURE_REGISTRY['hold-to-reflect'].enabled) {
      state.holdTimer = setTimeout(() => {
        handlers.onHoldReflect?.(nodeId);
        // Haptic feedback on mobile (Capacitor)
        if (typeof window !== 'undefined' && 'Capacitor' in window) {
          try {
            (window as unknown as { Capacitor: { Plugins: { Haptics: { impact: (o: object) => void } } } })
              .Capacitor.Plugins.Haptics?.impact({ style: 'medium' });
          } catch { /* non-Capacitor env */ }
        }
      }, HOLD_THRESHOLD_MS);
    }
  }, [handlers, nodeId]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const state = touchState.current;

    // Cancel hold if moving
    if (state.holdTimer) {
      clearTimeout(state.holdTimer);
      state.holdTimer = null;
    }

    // Two-finger rotate
    if (
      e.touches.length === 2 &&
      state.initialPinchAngle !== null &&
      GESTURE_REGISTRY['two-finger-rotate'].enabled
    ) {
      const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
      const delta = currentAngle - state.initialPinchAngle;
      handlers.onTwoFingerRotate?.(delta);
      state.initialPinchAngle = currentAngle;
    }
  }, [handlers]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const state = touchState.current;

    // Cancel hold timer
    if (state.holdTimer) {
      clearTimeout(state.holdTimer);
      state.holdTimer = null;
    }
    state.initialPinchAngle = null;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - state.startX;
    const deltaY = endY - state.startY;
    const elapsed = Date.now() - state.startTime;

    // Swipe-to-delegate: right swipe > 80px, mostly horizontal, quick
    if (
      deltaX > SWIPE_THRESHOLD_PX &&
      Math.abs(deltaY) < Math.abs(deltaX) * 0.5 &&
      elapsed < 400 &&
      GESTURE_REGISTRY['swipe-to-delegate'].enabled
    ) {
      handlers.onSwipeDelegate?.(nodeId);
      return;
    }

    // Double-tap-expand: two taps within 300ms
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS && elapsed < 200) {
      handlers.onDoubleTapExpand?.(nodeId);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [handlers, nodeId]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      if (touchState.current.holdTimer) clearTimeout(touchState.current.holdTimer);
    };
  }, [elementRef, onTouchStart, onTouchMove, onTouchEnd]);

  // Keyboard fallbacks — always provided (Trust Covenant)
  const handleKeyDown = useCallback((e: React.KeyboardEvent, targetNodeId: string) => {
    switch (e.key) {
      case 'd':
      case 'D':
        if (GESTURE_REGISTRY['swipe-to-delegate'].enabled) {
          e.preventDefault();
          handlers.onSwipeDelegate?.(targetNodeId);
        }
        break;
      case 'r':
      case 'R':
        if (GESTURE_REGISTRY['hold-to-reflect'].enabled) {
          e.preventDefault();
          handlers.onHoldReflect?.(targetNodeId);
        }
        break;
      case ' ':
        if (GESTURE_REGISTRY['double-tap-expand'].enabled) {
          e.preventDefault();
          handlers.onDoubleTapExpand?.(targetNodeId);
        }
        break;
    }
  }, [handlers]);

  return { handleKeyDown };
}
