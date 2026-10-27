import React, { useCallback, useRef, useState } from 'react';

export interface UseLongPressOptions {
  threshold?: number;
  delay?: number;
  onStart?: (event: React.TouchEvent | React.MouseEvent) => void;
  onFinish?: (event: React.TouchEvent | React.MouseEvent) => void;
  onCancel?: () => void;
  onLongPress?: (event?: React.TouchEvent | React.MouseEvent) => void;
  vibrate?: boolean | number;
  vibrateMs?: number;
}

export type UseLongPressCallback = (event: React.TouchEvent | React.MouseEvent) => void;

export function useLongPress(
  callbackOrOptions: UseLongPressCallback | UseLongPressOptions,
  optionsArg?: UseLongPressOptions
) {
  let callback: UseLongPressCallback = () => {};
  let options: UseLongPressOptions = {};

  if (typeof callbackOrOptions === 'function') {
    callback = callbackOrOptions;
    options = optionsArg || {};
  } else if (callbackOrOptions && typeof callbackOrOptions === 'object') {
    options = callbackOrOptions;
    if (callbackOrOptions.onLongPress) {
      callback = callbackOrOptions.onLongPress as UseLongPressCallback;
    }
  }

  const {
    threshold = options.delay ?? 450,
    onStart,
    onFinish,
    onCancel,
    vibrate = options.vibrateMs ?? 40,
  } = options;

  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const resetTriggeredTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (resetTriggeredTimerRef.current) {
        clearTimeout(resetTriggeredTimerRef.current);
        resetTriggeredTimerRef.current = null;
      }
      isLongPressTriggeredRef.current = false;
      setIsPressing(true);

      if ('touches' in event && event.touches.length > 0) {
        startPosRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if ('clientX' in event) {
        startPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }

      if (onStart) onStart(event);

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        setIsPressing(false);
        if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(typeof vibrate === 'number' ? vibrate : 40);
          } catch {}
        }
        callback(event);
        if (onFinish) onFinish(event);
      }, threshold);
    },
    [callback, threshold, onStart, onFinish, vibrate]
  );

  const clear = useCallback(
    (shouldTriggerCancel: boolean = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
      startPosRef.current = null;
      if (shouldTriggerCancel && onCancel && !isLongPressTriggeredRef.current) {
        onCancel();
      }
      // Keep isLongPressTriggered true for 300ms to block phantom click handlers
      if (isLongPressTriggeredRef.current) {
        resetTriggeredTimerRef.current = setTimeout(() => {
          isLongPressTriggeredRef.current = false;
        }, 300);
      }
    },
    [onCancel]
  );

  const move = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (!startPosRef.current) return;
      let currentX = 0;
      let currentY = 0;

      if ('touches' in event && event.touches.length > 0) {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
      } else if ('clientX' in event) {
        currentX = event.clientX;
        currentY = event.clientY;
      }

      const diffX = Math.abs(currentX - startPosRef.current.x);
      const diffY = Math.abs(currentY - startPosRef.current.y);

      // If moved more than 10px, user is scrolling or dragging, cancel long press
      if (diffX > 10 || diffY > 10) {
        clear(true);
      }
    },
    [clear]
  );

  const handlers = {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: () => clear(false),
    onTouchCancel: () => clear(true),
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: () => clear(false),
    onMouseLeave: () => clear(true),
  };

  return {
    ...handlers,
    handlers,
    isPressing,
    isLongPressTriggered: () => isLongPressTriggeredRef.current,
  };
}
