import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/pacientes', label: 'Pacientes', icon: '👥' },
    { path: '/app/citas', label: 'Citas', icon: '📅' },
    { path: '/app/fichas-clinicas', label: 'Fichas Clínicas', icon: '📋' },
    { path: '/app/inventario', label: 'Inventario', icon: '📦' },
    { path: '/app/respaldo', label: 'Respaldo', icon: '💾' },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-6 flex flex-col items-center">
        {/* Logo */}
        <img 
          src={`${process.env.PUBLIC_URL}/logo-podoclinic.png`}
                      alt="Logo Podología Clínica Esmeralda" 
          className="w-55 h-auto mb-1"
        />
        <h1 className="text-2xl font-bold text-white text-center mb-2">Podología Clínica Esmeralda</h1>
        <p className="text-gray-400 text-sm text-center">Panel de Administración</p>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 