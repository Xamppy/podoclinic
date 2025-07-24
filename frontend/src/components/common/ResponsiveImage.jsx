import React, { useState, useEffect, useRef } from 'react';
import { createIntersectionObserver, preloadImage } from '../../utils/performanceOptimization';

const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '', 
  sizes = '100vw',
  loading = 'lazy',
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = createIntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observerRef.current.observe(imgRef.current);
    } else {
      setIsInView(true);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]);

  useEffect(() => {
    if (isInView && src && !isLoaded && !hasError) {
      preloadImage(src)
        .then(() => {
          setIsLoaded(true);
          onLoad();
        })
        .catch(() => {
          setHasError(true);
          onError();
        });
    }
  }, [isInView, src, isLoaded, hasError, onLoad, onError]);

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  };

  const renderError = () => (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500">
        <svg 
          className="w-8 h-8 mx-auto mb-2" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <p className="text-sm">Error al cargar imagen</p>
      </div>
    </div>
  );

  if (hasError) {
    return renderError();
  }

  if (!isInView || !isLoaded) {
    return (
      <div ref={imgRef} className={className}>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      sizes={sizes}
      onLoad={() => {
        setIsLoaded(true);
        onLoad();
      }}
      onError={() => {
        setHasError(true);
        onError();
      }}
      {...props}
    />
  );
};

export default ResponsiveImage;