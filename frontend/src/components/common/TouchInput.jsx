import React, { useState, useRef, useEffect } from 'react';
import { getResponsiveClasses } from '../../utils/responsive';

/**
 * Componente de input optimizado para dispositivos táctiles
 */
const TouchInput = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  required = false,
  size = 'default',
  className = '',
  autoFocus = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputRef = useRef(null);

  // Obtener clases responsivas
  const responsiveClasses = getResponsiveClasses('input', size);

  // Actualizar estado cuando cambia el valor
  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  // Auto focus si es necesario
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Manejar focus
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  // Manejar blur
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Manejar cambio de valor
  const handleChange = (e) => {
    setHasValue(Boolean(e.target.value));
    if (onChange) {
      onChange(e);
    }
  };

  // Clases del contenedor
  const containerClasses = `relative ${className}`;

  // Clases del input
  const inputClasses = `
    ${responsiveClasses}
    w-full
    border-2
    rounded-md
    transition-all
    duration-200
    focus:outline-none
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
      : isFocused 
        ? 'border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
        : 'border-gray-300 hover:border-gray-400'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}
    ${label ? 'pt-6 pb-2' : ''}
  `;

  // Clases del label
  const labelClasses = `
    absolute
    left-3
    transition-all
    duration-200
    pointer-events-none
    ${isFocused || hasValue
      ? 'top-1 text-xs text-blue-600 font-medium'
      : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
    }
    ${error ? 'text-red-600' : ''}
  `;

  return (
    <div className={containerClasses}>
      {/* Input field */}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={label ? '' : placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...props}
      />

      {/* Floating label */}
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Focus indicator para accesibilidad */}
      {isFocused && (
        <div className="absolute inset-0 rounded-md ring-2 ring-blue-500 ring-opacity-50 pointer-events-none" />
      )}
    </div>
  );
};

/**
 * Componente de textarea touch-friendly
 */
export const TouchTextarea = ({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  autoResize = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const textareaRef = useRef(null);

  // Actualizar estado cuando cambia el valor
  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  // Auto resize si está habilitado
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);

  // Manejar focus
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  // Manejar blur
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Manejar cambio de valor
  const handleChange = (e) => {
    setHasValue(Boolean(e.target.value));
    if (onChange) {
      onChange(e);
    }
  };

  // Clases del contenedor
  const containerClasses = `relative ${className}`;

  // Clases del textarea
  const textareaClasses = `
    w-full
    min-h-[44px]
    px-3
    py-2
    text-base
    border-2
    rounded-md
    transition-all
    duration-200
    focus:outline-none
    resize-y
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
      : isFocused 
        ? 'border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
        : 'border-gray-300 hover:border-gray-400'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}
    ${label ? 'pt-6 pb-2' : ''}
    ${autoResize ? 'resize-none overflow-hidden' : ''}
  `;

  // Clases del label
  const labelClasses = `
    absolute
    left-3
    transition-all
    duration-200
    pointer-events-none
    ${isFocused || hasValue
      ? 'top-1 text-xs text-blue-600 font-medium'
      : 'top-3 text-base text-gray-500'
    }
    ${error ? 'text-red-600' : ''}
  `;

  return (
    <div className={containerClasses}>
      {/* Textarea field */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={label ? '' : placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />

      {/* Floating label */}
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Focus indicator para accesibilidad */}
      {isFocused && (
        <div className="absolute inset-0 rounded-md ring-2 ring-blue-500 ring-opacity-50 pointer-events-none" />
      )}
    </div>
  );
};

export default TouchInput;