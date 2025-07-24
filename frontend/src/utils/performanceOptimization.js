// Utilidades para optimización de rendimiento responsivo

// Debounce para resize events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle para scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer para lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Preload de imágenes críticas
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Optimización de re-renders con memoización
export const memoizeBreakpoint = (() => {
  let cachedBreakpoint = null;
  let cachedWidth = null;

  return (width) => {
    if (width === cachedWidth) {
      return cachedBreakpoint;
    }

    cachedWidth = width;
    
    if (width < 640) {
      cachedBreakpoint = 'xs';
    } else if (width < 768) {
      cachedBreakpoint = 'sm';
    } else if (width < 1024) {
      cachedBreakpoint = 'md';
    } else if (width < 1280) {
      cachedBreakpoint = 'lg';
    } else {
      cachedBreakpoint = 'xl';
    }

    return cachedBreakpoint;
  };
})();

// Optimización de media queries
export const createOptimizedMediaQuery = (query) => {
  let mediaQuery = null;
  let listeners = [];

  const getMediaQuery = () => {
    if (!mediaQuery) {
      mediaQuery = window.matchMedia(query);
    }
    return mediaQuery;
  };

  return {
    matches: () => getMediaQuery().matches,
    addListener: (callback) => {
      const mq = getMediaQuery();
      listeners.push(callback);
      mq.addListener(callback);
      return () => {
        mq.removeListener(callback);
        listeners = listeners.filter(l => l !== callback);
      };
    },
    cleanup: () => {
      const mq = getMediaQuery();
      listeners.forEach(listener => mq.removeListener(listener));
      listeners = [];
    }
  };
};

// Performance monitoring
export const measureResponsivePerformance = (componentName, operation) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();
      
      if (end - start > 16) { // Más de un frame (16ms)
        console.warn(`${componentName}.${operation} took ${end - start}ms`);
      }
      
      return result;
    };

    return descriptor;
  };
};