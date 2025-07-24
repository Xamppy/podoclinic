import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVerticalSwipe } from '../../hooks/useSwipe';
import { isMobile, handleMobileModalClose } from '../../utils/responsive';
import { manageFocus, keyboardNavigation, announceToScreenReader } from '../../utils/accessibility';
import TouchButton from './TouchButton';

/**
 * Modal optimizado para dispositivos táctiles
 */
const TouchModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnSwipeDown = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  // Configurar swipe down para cerrar en móvil
  const swipeRef = useVerticalSwipe(
    null, // No action for swipe up
    closeOnSwipeDown && isMobile() ? onClose : null,
    {
      threshold: 100,
      preventDefaultTouchmoveEvent: false,
    }
  );

  // Gestión de accesibilidad y foco
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement;
    let cleanupFocus = null;
    let cleanupEscape = null;

    // Anunciar apertura del modal
    announceToScreenReader(`Modal abierto: ${title || 'Diálogo'}`);

    // Configurar trap de foco
    if (modalRef.current) {
      cleanupFocus = manageFocus.trapFocus(modalRef.current);
    }

    // Manejar tecla Escape
    cleanupEscape = keyboardNavigation.handleEscape(onClose);

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';

    return () => {
      // Cleanup
      if (cleanupFocus) cleanupFocus();
      if (cleanupEscape) cleanupEscape();

      document.body.style.overflow = 'unset';

      // Restaurar foco anterior
      manageFocus.restoreFocus(previousActiveElement);

      // Anunciar cierre del modal
      announceToScreenReader('Modal cerrado');
    };
  }, [isOpen, onClose, title]);

  // Manejar click en backdrop
  const handleBackdropClick = (event) => {
    if (closeOnBackdropClick && event.target === backdropRef.current) {
      onClose();
    }
  };

  // Enfocar el modal cuando se abre
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clases de tamaño
  const sizeClasses = {
    small: 'w-full max-w-md',
    default: 'w-full max-w-2xl',
    large: 'w-full max-w-4xl',
    fullscreen: 'w-full h-full max-w-none',
  };

  // Clases responsivas
  const responsiveClasses = isMobile()
    ? 'min-h-screen sm:min-h-0 sm:my-8 rounded-none sm:rounded-lg'
    : 'my-8 rounded-lg';

  const modalContent = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
        <div
          ref={(el) => {
            modalRef.current = el;
            if (swipeRef) swipeRef.current = el;
          }}
          className={`
            relative bg-white shadow-xl transform transition-all
            ${sizeClasses[size]}
            ${responsiveClasses}
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby="modal-content"
          tabIndex={-1}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg sm:text-xl font-semibold text-gray-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <TouchButton
                  variant="ghost"
                  size="small"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 ml-auto"
                  aria-label="Cerrar modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </TouchButton>
              )}
            </div>
          )}

          {/* Swipe indicator for mobile */}
          {closeOnSwipeDown && isMobile() && (
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-12 h-1 bg-gray-300 rounded-full opacity-60"></div>
            </div>
          )}

          {/* Content */}
          <div
            id="modal-content"
            className="p-4 sm:p-6 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * Modal de confirmación optimizado para touch
 */
export const TouchConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'danger',
  isLoading = false,
  ...props
}) => {
  return (
    <TouchModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnBackdropClick={!isLoading}
      closeOnSwipeDown={!isLoading}
      {...props}
    >
      <div className="space-y-4">
        {message && (
          <p className="text-gray-600 text-base leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
          <TouchButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {cancelText}
          </TouchButton>
          <TouchButton
            variant={confirmVariant}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {confirmText}
          </TouchButton>
        </div>
      </div>
    </TouchModal>
  );
};

/**
 * Modal de formulario optimizado para touch
 */
export const TouchFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  isLoading = false,
  canSubmit = true,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && canSubmit && !isLoading) {
      onSubmit(e);
    }
  };

  return (
    <TouchModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeOnBackdropClick={!isLoading}
      closeOnSwipeDown={!isLoading}
      {...props}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {children}
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          <TouchButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {cancelText}
          </TouchButton>
          <TouchButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading || !canSubmit}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {submitText}
          </TouchButton>
        </div>
      </form>
    </TouchModal>
  );
};

export default TouchModal;