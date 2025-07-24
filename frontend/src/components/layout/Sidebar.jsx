import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { useHorizontalSwipe } from '../../hooks/useSwipe';
import { getTouchTargetClasses } from '../../utils/responsive';
import { useResponsivePerformance } from '../../hooks/useResponsivePerformance';
import ResponsiveImage from '../common/ResponsiveImage';

const Sidebar = memo(({ isOpen, onClose }) => {
  const { isMobile } = useResponsivePerformance();
  const menuItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/pacientes', label: 'Pacientes', icon: '👥' },
    { path: '/app/citas', label: 'Citas', icon: '📅' },
    { path: '/app/fichas-clinicas', label: 'Fichas Clínicas', icon: '📋' },
    { path: '/app/inventario', label: 'Inventario', icon: '📦' },
    { path: '/app/respaldo', label: 'Respaldo', icon: '💾' },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (onClose) {
      onClose();
    }
  };

  // Configurar swipe para cerrar sidebar en móvil
  const swipeRef = useHorizontalSwipe(
    () => {
      // Swipe left to close sidebar
      if (isOpen && onClose) {
        onClose();
      }
    },
    null, // No action for swipe right
    {
      threshold: 50,
      preventDefaultTouchmoveEvent: false,
    }
  );

  return (
    <nav 
      ref={swipeRef}
      className={`
        bg-gray-800 text-white w-64 min-h-screen p-4 
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
      aria-label="Navegación principal"
    >
      {/* Close button for mobile */}
      <div className="flex justify-end lg:hidden mb-4">
        <button
          onClick={onClose}
          className={`p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white touch-feedback ${getTouchTargetClasses()}`}
          aria-label="Cerrar menú"
        >
          <span className="sr-only">Cerrar menú</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Swipe indicator for mobile - solo mostrar en móvil */}
      {isMobile && (
        <div className="mb-2 text-center">
          <div className="inline-flex items-center text-xs text-gray-400 opacity-60">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Desliza para cerrar
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col items-center">
        {/* Logo optimizado */}
        <ResponsiveImage
          src={`${process.env.PUBLIC_URL}/logo-podoclinic.png`}
          alt="Logo Podología Clínica Esmeralda"
          className="w-32 sm:w-40 lg:w-55 h-auto mb-1"
          loading="eager"
          sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 220px"
        />
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-center mb-2">
          <span className="hidden sm:inline">Podología Clínica Esmeralda</span>
          <span className="sm:hidden">Podoclinic</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm text-center">Panel de Administración</p>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors touch-feedback ${getTouchTargetClasses()} ${isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm sm:text-base">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 