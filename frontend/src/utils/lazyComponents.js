import { lazy, Suspense } from 'react';

// Lazy loading para componentes no críticos
export const LazyResponsiveTable = lazy(() => import('../components/common/ResponsiveTable'));
export const LazyTouchModal = lazy(() => import('../components/common/TouchModal'));
export const LazyTouchInteraction = lazy(() => import('../components/common/TouchInteraction'));
export const LazyCalendarioCitas = lazy(() => import('../components/citas/CalendarioCitas'));

// Componente de loading para lazy components
export const ResponsiveLoader = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

// HOC para lazy loading con responsive loader
export const withResponsiveLazy = (LazyComponent, loaderClassName = 'h-32') => {
  return (props) => (
    <Suspense fallback={<ResponsiveLoader className={loaderClassName} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};