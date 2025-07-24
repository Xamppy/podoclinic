import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce, throttle, memoizeBreakpoint } from '../utils/performanceOptimization';

// Hook para optimizar el rendimiento de componentes responsivos
export const useResponsivePerformance = (options = {}) => {
  const {
    debounceDelay = 150,
    throttleLimit = 100,
    enablePerformanceMonitoring = false
  } = options;

  const [breakpoint, setBreakpoint] = useState('lg');
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });
  const performanceRef = useRef({ renders: 0, lastRender: Date.now() });

  // Función optimizada para actualizar breakpoint
  const updateBreakpoint = useCallback(
    debounce((width) => {
      const newBreakpoint = memoizeBreakpoint(width);
      setBreakpoint(newBreakpoint);
    }, debounceDelay),
    [debounceDelay]
  );

  // Función optimizada para actualizar tamaño de ventana
  const updateWindowSize = useCallback(
    throttle(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      updateBreakpoint(width);
    }, throttleLimit),
    [throttleLimit, updateBreakpoint]
  );

  useEffect(() => {
    // Inicializar valores
    updateWindowSize();

    // Agregar listener optimizado
    window.addEventListener('resize', updateWindowSize, { passive: true });

    return () => {
      window.removeEventListener('resize', updateWindowSize);
    };
  }, [updateWindowSize]);

  // Monitoreo de rendimiento
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceRef.current.renders++;
      const now = Date.now();
      const timeSinceLastRender = now - performanceRef.current.lastRender;
      
      if (timeSinceLastRender < 16 && performanceRef.current.renders > 1) {
        console.warn('Responsive component re-rendering too frequently:', {
          renders: performanceRef.current.renders,
          timeSinceLastRender
        });
      }
      
      performanceRef.current.lastRender = now;
    }
  });

  // Utilidades de breakpoint
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';

  return {
    breakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    performanceStats: performanceRef.current
  };
};

// Hook para lazy loading de componentes
export const useLazyComponent = (shouldLoad = true, delay = 0) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (shouldLoad && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [shouldLoad, isLoaded, delay]);

  return isLoaded;
};

// Hook para optimizar re-renders en listas responsivas
export const useResponsiveList = (items, itemsPerPage = { mobile: 5, tablet: 10, desktop: 20 }) => {
  const { isMobile, isTablet, isDesktop } = useResponsivePerformance();
  const [currentPage, setCurrentPage] = useState(1);

  const getItemsPerPage = useCallback(() => {
    if (isMobile) return itemsPerPage.mobile;
    if (isTablet) return itemsPerPage.tablet;
    if (isDesktop) return itemsPerPage.desktop;
    return itemsPerPage.desktop;
  }, [isMobile, isTablet, isDesktop, itemsPerPage]);

  const paginatedItems = useCallback(() => {
    const perPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, getItemsPerPage]);

  const totalPages = Math.ceil(items.length / getItemsPerPage());

  return {
    items: paginatedItems(),
    currentPage,
    totalPages,
    setCurrentPage,
    itemsPerPage: getItemsPerPage()
  };
};

// Hook para optimizar animaciones responsivas
export const useResponsiveAnimation = (animationConfig = {}) => {
  const { isMobile } = useResponsivePerformance();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addListener(handleChange);

    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const shouldAnimate = !prefersReducedMotion && (!isMobile || animationConfig.enableOnMobile);

  return {
    shouldAnimate,
    animationClass: shouldAnimate ? animationConfig.className || 'transition-all duration-300' : '',
    prefersReducedMotion
  };
};