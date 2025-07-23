import { useRef, useCallback, useEffect } from 'react';

export interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  swipeThreshold?: number;
  doubleTapDelay?: number;
  longPressDelay?: number;
}

export interface GestureState {
  isSwipingLeft: boolean;
  isSwipingRight: boolean;
  isLongPressing: boolean;
}

export const useGestures = (config: GestureConfig) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const gestureStateRef = useRef<GestureState>({
    isSwipingLeft: false,
    isSwipingRight: false,
    isLongPressing: false
  });

  const {
    onSwipeLeft,
    onSwipeRight,
    onDoubleTap,
    onLongPress,
    disabled = false,
    swipeThreshold = 80,
    doubleTapDelay = 300,
    longPressDelay = 500
  } = config;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        gestureStateRef.current.isLongPressing = true;
        onLongPress();
      }, longPressDelay);
    }
  }, [disabled, onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if finger moves too much
    if (Math.abs(deltaX) > 20 || deltaY > 20) {
      clearLongPressTimer();
      gestureStateRef.current.isLongPressing = false;
    }

    // Update swipe state
    if (Math.abs(deltaX) > 20 && deltaY < 50) {
      gestureStateRef.current.isSwipingLeft = deltaX < 0;
      gestureStateRef.current.isSwipingRight = deltaX > 0;
    } else {
      gestureStateRef.current.isSwipingLeft = false;
      gestureStateRef.current.isSwipingRight = false;
    }
  }, [disabled, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    clearLongPressTimer();

    // Reset gesture states
    gestureStateRef.current.isSwipingLeft = false;
    gestureStateRef.current.isSwipingRight = false;
    gestureStateRef.current.isLongPressing = false;

    // Handle swipe gestures
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < 100 && deltaTime < 500) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
      touchStartRef.current = null;
      return;
    }

    // Handle double tap
    if (onDoubleTap && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20 && deltaTime < 200) {
      const now = Date.now();
      if (now - lastTapRef.current < doubleTapDelay) {
        onDoubleTap();
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapRef.current = now;
      }
    }

    touchStartRef.current = null;
  }, [disabled, clearLongPressTimer, swipeThreshold, onSwipeLeft, onSwipeRight, onDoubleTap, doubleTapDelay]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    gestureHandlers,
    gestureState: gestureStateRef.current
  };
};