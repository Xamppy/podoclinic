// Utilidades para accesibilidad responsiva

// Gestión de foco para componentes responsivos
export const manageFocus = {
  // Elementos focusables
  getFocusableElements: (container) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])'
    ].join(', ');
    
    return container.querySelectorAll(focusableSelectors);
  },

  // Trap focus dentro de un modal
  trapFocus: (container) => {
    const focusableElements = manageFocus.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus primer elemento
    if (firstElement) {
      firstElement.focus();
    }

    // Retornar función de cleanup
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restaurar foco anterior
  restoreFocus: (previousElement) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }
};

// Anuncios para lectores de pantalla
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remover después de que se haya anunciado
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Verificar contraste de colores
export const checkColorContrast = (foreground, background) => {
  // Función simplificada para verificar contraste
  // En producción, usar una librería como 'color-contrast-checker'
  const getLuminance = (color) => {
    // Convertir hex a RGB y calcular luminancia
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    passAA: ratio >= 4.5,
    passAAA: ratio >= 7
  };
};

// Navegación por teclado
export const keyboardNavigation = {
  // Manejar Escape para cerrar modales
  handleEscape: (callback) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        callback();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  },

  // Manejar Enter/Space para activar elementos
  handleActivation: (element, callback) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }
};

// Detectar si el usuario prefiere movimiento reducido
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Detectar si el usuario usa navegación por teclado
export const detectKeyboardUser = () => {
  let isKeyboardUser = false;
  
  const handleFirstTab = (e) => {
    if (e.key === 'Tab') {
      isKeyboardUser = true;
      document.body.classList.add('keyboard-user');
      document.removeEventListener('keydown', handleFirstTab);
    }
  };
  
  const handleMouseDown = () => {
    isKeyboardUser = false;
    document.body.classList.remove('keyboard-user');
  };
  
  document.addEventListener('keydown', handleFirstTab);
  document.addEventListener('mousedown', handleMouseDown);
  
  return () => {
    document.removeEventListener('keydown', handleFirstTab);
    document.removeEventListener('mousedown', handleMouseDown);
  };
};