import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReservaCliente from '../pages/ReservaCliente';

const PublicRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/public/reservar" replace />} />
        <Route path="/reservar" element={<ReservaCliente />} />
      </Routes>
    </>
  );
};

export default PublicRoutes; 