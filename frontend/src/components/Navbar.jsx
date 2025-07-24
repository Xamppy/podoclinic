import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTouchTargetClasses } from '../utils/responsive';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar menú al presionar Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-lg" ref={navRef}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                to="/" 
                className={`text-lg sm:text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center touch-feedback ${getTouchTargetClasses()}`}
              >
                <span className="hidden sm:inline">Podología Clínica Esmeralda</span>
                <span className="sm:hidden">Podoclinic</span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/public/reservar"
                className={`border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-all duration-200 touch-feedback ${getTouchTargetClasses()}`}
              >
                Reservar Cita
              </Link>
            </div>
          </div>
          
          {/* Logo al final del navbar - Solo en desktop */}
          <div className="hidden md:flex md:items-center ml-4">
            <img 
              src={`${process.env.PUBLIC_URL}/logo-podoclinic.png`}
              alt="Logo Podología Clínica Esmeralda" 
              className="h-10 w-auto"
            />
          </div>
          
          {/* Hamburger button para móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200 touch-feedback ${getTouchTargetClasses()}`}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span className="sr-only">{isOpen ? "Cerrar" : "Abrir"} menú principal</span>
              <div className="relative w-6 h-6">
                <svg 
                  className={`absolute inset-0 h-6 w-6 transform transition-all duration-300 ${isOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg 
                  className={`absolute inset-0 h-6 w-6 transform transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil con animación suave */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
          <Link
            to="/public/reservar"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center border-l-4 border-transparent hover:border-blue-500 touch-feedback ${getTouchTargetClasses()}`}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Reservar Cita
            </span>
          </Link>
          
          {/* Información de contacto en móvil */}
          <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2">
            <p className="font-medium text-gray-700 mb-1">Contacto</p>
            <p>📞 Teléfono: +56 9 XXXX XXXX</p>
            <p>📍 Villa El Bosque, La Cruz</p>
          </div>
          
          {/* Logo en modo móvil */}
          <div className="flex justify-center py-4 border-t border-gray-200">
            <img 
              src={`${process.env.PUBLIC_URL}/logo-podoclinic.png`}
              alt="Logo Podología Clínica Esmeralda" 
              className="h-12 w-auto opacity-80"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 