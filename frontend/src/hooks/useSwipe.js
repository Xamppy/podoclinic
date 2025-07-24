import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para manejar gestos de swipe en dispositivos táctiles
 */
export const useSwipe = (options = {}) => {
  const {
    threshold = 50, // Distancia mínima para considerar un swipe
    preventDefaultTouchmoveEvent = false,
    delta = 10, // Diferencia mínima entre touchstart y touchend
  } = options;

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const elementRef = useRef(null);

  // Detectar dirección del swipe
  const getSwipeDirection = () => {
    if (!touchStart || !touchEnd) return null;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    // Determinar si es un swipe horizontal o vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Swipe horizontal
      if (isLeftSwipe) return 'left';
      if (isRightSwipe) return 'right';
    } else {
      // Swipe vertical
      if (isUpSwipe) return 'up';
      if (isDownSwipe) return 'down';
    }

    return null;
  };

  // Manejar inicio del touch
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  // Manejar movimiento del touch
  const onTouchMove = (e) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
  };

  // Manejar fin del touch
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    
    setTouchEnd({
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    });
  };

  // Configurar event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [preventDefaultTouchmoveEvent]);

  return {
    elementRef,
    swipeDirection: getSwipeDirection(),
    touchStart,
    touchEnd,
    isSwipeActive: touchStart && !touchEnd,
  };
};

/**
 * Hook específico para swipe horizontal (útil para carruseles, navegación)
 */
export const useHorizontalSwipe = (onSwipeLeft, onSwipeRight, options = {}) => {
  const { elementRef, swipeDirection } = useSwipe(options);

  useEffect(() => {
    if (swipeDirection === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (swipeDirection === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  }, [swipeDirection, onSwipeLeft, onSwipeRight]);

  return elementRef;
};

/**
 * Hook específico para swipe vertical (útil para pull-to-refresh, scroll)
 */
export const useVerticalSwipe = (onSwipeUp, onSwipeDown, options = {}) => {
  const { elementRef, swipeDirection } = useSwipe(options);

  useEffect(() => {
    if (swipeDirection === 'up' && onSwipeUp) {
      onSwipeUp();
    } else if (swipeDirection === 'down' && onSwipeDown) {
      onSwipeDown();
    }
  }, [swipeDirection, onSwipeUp, onSwipeDown]);

  return elementRef;
};

/**
 * Hook para detectar long press (presión prolongada)
 */
export const useLongPress = (callback, options = {}) => {
  const { threshold = 500, onStart, onFinish, onCancel } = options;
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef();
  const target = useRef();

  const start = useCallback((event) => {
    if (onStart) {
      onStart(event);
    }
    
    target.current = event.target;
    timeout.current = setTimeout(() => {
      callback(event);
      setLongPressTriggered(true);
    }, threshold);
  }, [callback, threshold, onStart]);

  const clear = useCallback((event, shouldTriggerOnFinish = true) => {
    timeout.current && clearTimeout(timeout.current);
    shouldTriggerOnFinish && longPressTriggered && onFinish && onFinish(event);
    setLongPressTriggered(false);
  }, [longPressTriggered, onFinish]);

  const cancel = useCallback((event) => {
    clear(event, false);
    onCancel && onCancel(event);
  }, [clear, onCancel]);

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => cancel(e),
    onTouchEnd: (e) => clear(e),
    onTouchCancel: (e) => cancel(e),
  };
};

export default useSwipe;