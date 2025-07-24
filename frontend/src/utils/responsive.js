/**
 * Utilidades responsivas para la aplicación Podoclinic
 */
import { useState, useEffect } from 'react';

// Breakpoints de Tailwind CSS
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook personalizado para detectar el tamaño de pantalla actual
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState('sm');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setScreenSize('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setScreenSize('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setScreenSize('lg');
      } else if (width >= BREAKPOINTS.md) {
        setScreenSize('md');
      } else if (width >= BREAKPOINTS.sm) {
        setScreenSize('sm');
      } else if (width >= BREAKPOINTS.xs) {
        setScreenSize('xs');
      } else {
        setScreenSize('mobile');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

/**
 * Función para verificar si estamos en móvil
 */
export const isMobile = () => {
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Función para verificar si estamos en tablet
 */
export const isTablet = () => {
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Función para verificar si estamos en desktop
 */
export const isDesktop = () => {
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Función para obtener clases responsivas basadas en el tipo de componente
 */
export const getResponsiveClasses = (component, variant = 'default') => {
  const classes = {
    // Clases para botones
    button: {
      default: 'min-h-[44px] px-4 py-2 text-base sm:text-sm',
      large: 'min-h-[48px] px-6 py-3 text-lg sm:text-base',
      small: 'min-h-[40px] px-3 py-1.5 text-sm',
    },
    
    // Clases para inputs
    input: {
      default: 'min-h-[44px] px-3 py-2 text-base',
      large: 'min-h-[48px] px-4 py-3 text-lg',
      small: 'min-h-[40px] px-2 py-1.5 text-sm',
    },
    
    // Clases para modales
    modal: {
      default: 'w-full max-w-full sm:max-w-2xl min-h-[calc(100vh-1rem)] sm:min-h-0',
      large: 'w-full max-w-full sm:max-w-4xl min-h-[calc(100vh-1rem)] sm:min-h-0',
      small: 'w-full max-w-full sm:max-w-md min-h-[calc(100vh-1rem)] sm:min-h-0',
    },
    
    // Clases para contenedores
    container: {
      default: 'px-3 sm:px-6 lg:px-8',
      tight: 'px-2 sm:px-4 lg:px-6',
      wide: 'px-4 sm:px-8 lg:px-12',
    },
    
    // Clases para grids
    grid: {
      default: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
      two: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
      three: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
      four: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
    },
    
    // Clases para texto
    text: {
      heading: 'text-xl sm:text-2xl lg:text-3xl',
      subheading: 'text-lg sm:text-xl lg:text-2xl',
      body: 'text-sm sm:text-base',
      small: 'text-xs sm:text-sm',
    },
    
    // Clases para espaciado
    spacing: {
      section: 'py-4 sm:py-6 lg:py-8',
      element: 'mb-3 sm:mb-4 lg:mb-6',
      tight: 'py-2 sm:py-3 lg:py-4',
    },
  };

  return classes[component]?.[variant] || '';
};

/**
 * Función para manejar el cierre de modales en móvil
 */
export const handleMobileModalClose = (callback) => {
  // En móvil, agregar un pequeño delay para evitar clicks accidentales
  if (isMobile()) {
    setTimeout(callback, 100);
  } else {
    callback();
  }
};

/**
 * Función para obtener el número de columnas óptimo para una tabla/grid
 */
export const getOptimalColumns = (totalItems, screenSize) => {
  const columnMap = {
    mobile: 1,
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4,
  };
  
  return Math.min(columnMap[screenSize] || 1, totalItems);
};

/**
 * Función para formatear texto responsivo (truncar en móvil)
 */
export const formatResponsiveText = (text, maxLengthMobile = 50, maxLengthDesktop = 100) => {
  const maxLength = isMobile() ? maxLengthMobile : maxLengthDesktop;
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Función para obtener el tamaño de imagen responsivo
 */
export const getResponsiveImageSize = (baseSize = 'md') => {
  const sizes = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-16 sm:h-16',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  };
  
  return sizes[baseSize] || sizes.md;
};

/**
 * Constantes para animaciones responsivas
 */
export const RESPONSIVE_ANIMATIONS = {
  // Duraciones más cortas en móvil para mejor UX
  duration: {
    fast: isMobile() ? 'duration-150' : 'duration-200',
    normal: isMobile() ? 'duration-200' : 'duration-300',
    slow: isMobile() ? 'duration-300' : 'duration-500',
  },
  
  // Transiciones suaves
  transition: 'transition-all ease-in-out',
  
  // Transformaciones
  scale: {
    hover: 'hover:scale-105',
    active: 'active:scale-95',
  },
};

/**
 * Función para manejar eventos touch vs mouse
 */
export const getInteractionProps = (onClick, options = {}) => {
  const { preventDoubleClick = true, delay = 300 } = options;
  
  if (!preventDoubleClick) {
    return { onClick };
  }
  
  let lastClick = 0;
  
  return {
    onClick: (e) => {
      const now = Date.now();
      if (now - lastClick < delay) {
        e.preventDefault();
        return;
      }
      lastClick = now;
      onClick(e);
    },
  };
};

/**
 * Hook para manejar orientación de dispositivo
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};

/**
 * Función para detectar si el dispositivo soporta hover
 */
export const supportsHover = () => {
  return window.matchMedia('(hover: hover)').matches;
};

/**
 * Función para obtener clases de hover condicionales
 */
export const getHoverClasses = (hoverClasses) => {
  return supportsHover() ? hoverClasses : '';
};

/**
 * Función para obtener clases de touch target mínimo
 */
export const getTouchTargetClasses = (size = 'default') => {
  const sizes = {
    small: 'min-h-[40px] min-w-[40px]',
    default: 'min-h-[44px] min-w-[44px]',
    large: 'min-h-[48px] min-w-[48px]',
  };
  
  return sizes[size] || sizes.default;
};

/**
 * Función para obtener clases de estados de loading para touch
 */
export const getTouchLoadingClasses = (loading = false) => {
  return loading ? 'cursor-wait opacity-75 pointer-events-none' : '';
};

/**
 * Función para obtener clases de feedback visual para touch
 */
export const getTouchFeedbackClasses = () => {
  return 'active:scale-95 transition-transform duration-150 ease-in-out';
};

/**
 * Función para obtener clases de ripple effect
 */
export const getRippleClasses = () => {
  return 'relative overflow-hidden';
};

/**
 * Función para detectar si es un dispositivo táctil
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
};

/**
 * Función para obtener clases específicas para dispositivos táctiles
 */
export const getTouchDeviceClasses = () => {
  return isTouchDevice() ? 'touch-device' : 'mouse-device';
};