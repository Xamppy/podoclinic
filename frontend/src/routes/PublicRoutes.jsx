import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReservaCliente from '../pages/ReservaCliente';

const PublicRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<div>Página de Inicio</div>} />
        <Route path="/servicios" element={<div>Página de Servicios</div>} />
        <Route path="/reservar" element={<ReservaCliente />} />
        <Route path="/contacto" element={<div>Página de Contacto</div>} />
      </Routes>
    </>
  );
};

export default PublicRoutes; 