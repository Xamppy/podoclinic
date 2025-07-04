import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 