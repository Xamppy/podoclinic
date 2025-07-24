import React, { useState } from 'react';
import { getResponsiveClasses, getInteractionProps, supportsHover } from '../../utils/responsive';

/**
 * Componente de botón optimizado para interacciones táctiles
 */
const TouchButton = ({
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  preventDoubleClick = true,
  showRipple = true,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const [isPressed, setIsPressed] = useState(false);

  // Obtener clases responsivas
  const responsiveClasses = getResponsiveClasses('button', size);
  
  // Clases base para diferentes variantes con mejor soporte táctil
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 touch-feedback',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 touch-feedback',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 touch-feedback',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 touch-feedback',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 touch-feedback',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-feedback',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 touch-feedback',
  };

  // Clases de estado
  const stateClasses = {
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'cursor-wait',
    normal: 'cursor-pointer',
  };

  // Determinar estado actual
  const currentState = disabled ? 'disabled' : loading ? 'loading' : 'normal';
  
  // Clases finales con mejor soporte táctil
  const baseClasses = 'relative overflow-hidden rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 select-none touch-target-44';
  const hoverClasses = supportsHover() ? '' : 'active:scale-95';
  const touchClasses = 'touch-feedback ripple-container';
  const finalClasses = `${baseClasses} ${responsiveClasses} ${variantClasses[variant]} ${stateClasses[currentState]} ${hoverClasses} ${touchClasses} ${className}`;

  // Manejar props de interacción
  const interactionProps = getInteractionProps(onClick, { preventDoubleClick });

  // Crear efecto ripple
  const createRipple = (event) => {
    if (!showRipple || disabled || loading) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
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
    setIsPressed(true);
    createRipple(e);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleMouseDown = (e) => {
    if (e.pointerType !== 'touch') {
      setIsPressed(true);
      createRipple(e);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={finalClasses}
      disabled={disabled || loading}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      {...interactionProps}
      {...props}
    >
      {/* Contenido del botón */}
      <span className={`relative z-10 flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>

      {/* Indicador de loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

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
        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none" />
      )}
    </button>
  );
};

/**
 * Variantes específicas del botón
 */
export const PrimaryButton = (props) => (
  <TouchButton variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <TouchButton variant="secondary" {...props} />
);

export const DangerButton = (props) => (
  <TouchButton variant="danger" {...props} />
);

export const OutlineButton = (props) => (
  <TouchButton variant="outline" {...props} />
);

export const GhostButton = (props) => (
  <TouchButton variant="ghost" {...props} />
);

export default TouchButton;