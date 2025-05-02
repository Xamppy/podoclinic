import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Verificar si el token es válido
          const response = await api.get('/usuarios/me/');
          setCurrentUser(response.data);
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          // Si el token no es válido, limpiar el localStorage
          localStorage.removeItem('authToken');
          setCurrentUser(null);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
    try {
      const response = await api.post('/usuarios/auth/login/', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      setCurrentUser(user);
      setError(null);
      
      return user;
    } catch (error) {
      setError('Credenciales inválidas');
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};