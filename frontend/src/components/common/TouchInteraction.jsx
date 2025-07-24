import React, { useState, useRef, useEffect } from 'react';
import { useHorizontalSwipe, useLongPress } from '../../hooks/useSwipe';
import { getTouchTargetClasses, getTouchFeedbackClasses, isTouchDevice } from '../../utils/responsive';

/**
 * Componente wrapper para interacciones táctiles mejoradas
 */
const TouchInteraction = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  enableSwipe = false,
  enableLongPress = false,
  touchTargetSize = 'default',
  showRipple = true,
  className = '',
  disabled = false,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  const containerRef = useRef(null);

  // Configurar swipe horizontal si está habilitado
  const swipeRef = useHorizontalSwipe(
    enableSwipe ? onSwipeLeft : null,
    enableSwipe ? onSwipeRight : null,
    {
      threshold: 50,
      preventDefaultTouchmoveEvent: false,
    }
  );

  // Configurar long press si está habilitado
  const longPressProps = useLongPress(
    enableLongPress ? onLongPress : () => {},
    {
      threshold: 500,
      onStart: () => setIsPressed(true),
      onFinish: () => setIsPressed(false),
      onCancel: () => setIsPressed(false),
    }
  );

  // Combinar refs
  useEffect(() => {
    if (enableSwipe && swipeRef.current && containerRef.current) {
      containerRef.current = swipeRef.current;
    }
  }, [enableSwipe, swipeRef]);

  // Crear efecto ripple
  const createRipple = (event) => {
    if (!showRipple || disabled || !isTouchDevice()) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    // Remover ripple después de la animación
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Manejar eventos táctiles
  const handleTouchStart = (e) => {
    if (disabled) return;
    
    setIsPressed(true);
    createRipple(e.touches[0]);
    
    if (enableLongPress) {
      longPressProps.onTouchStart(e);
    }
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    if (enableLongPress) {
      longPressProps.onTouchEnd(e);
    }
  };

  const handleMouseDown = (e) => {
    if (disabled || e.pointerType === 'touch') return;
    
    setIsPressed(true);
    createRipple(e);
    
    if (enableLongPress) {
      longPressProps.onMouseDown(e);
    }
  };

  const handleMouseUp = (e) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    if (enableLongPress) {
      longPressProps.onMouseUp(e);
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    if (enableLongPress) {
      longPressProps.onMouseLeave(e);
    }
  };

  // Clases CSS
  const touchTargetClasses = getTouchTargetClasses(touchTargetSize);
  const feedbackClasses = getTouchFeedbackClasses();
  const baseClasses = 'relative select-none';
  const rippleClasses = showRipple ? 'overflow-hidden' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';
  
  const finalClasses = `${baseClasses} ${touchTargetClasses} ${feedbackClasses} ${rippleClasses} ${disabledClasses} ${className}`;

  return (
    <div
      ref={containerRef}
      className={finalClasses}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Contenido */}
      <div className={`relative z-10 ${isPressed ? 'opacity-90' : 'opacity-100'} transition-opacity duration-150`}>
        {children}
      </div>

      {/* Efectos ripple */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '600ms',
          }}
        />
      ))}

      {/* Overlay de presión para feedback visual */}
      {isPressed && (
        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none rounded-inherit" />
      )}

      {/* Indicador de swipe (opcional) */}
      {enableSwipe && isTouchDevice() && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-30">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente específico para navegación con swipe
 */
export const SwipeNavigation = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  showIndicators = true,
  className = '',
  ...props
}) => {
  return (
    <TouchInteraction
      enableSwipe={true}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      showRipple={false}
      className={`${className} ${showIndicators ? 'pb-4' : ''}`}
      {...props}
    >
      {children}
      {showIndicators && isTouchDevice() && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-50">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-gray-400">Desliza</span>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </TouchInteraction>
  );
};

/**
 * Componente específico para elementos con long press
 */
export const LongPressItem = ({
  children,
  onLongPress,
  onPress,
  className = '',
  ...props
}) => {
  return (
    <TouchInteraction
      enableLongPress={true}
      onLongPress={onLongPress}
      onClick={onPress}
      showRipple={true}
      className={className}
      {...props}
    >
      {children}
    </TouchInteraction>
  );
};

export default TouchInteraction;