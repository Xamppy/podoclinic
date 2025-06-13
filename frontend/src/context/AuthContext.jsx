import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);

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
      const { access, refresh, user } = response.data;
      
      // Guardar ambos tokens
      localStorage.setItem('authToken', access);
      localStorage.setItem('refreshToken', refresh);
      setCurrentUser(user);
      setError(null);
      
      return user;
    } catch (error) {
      setError('Credenciales inválidas');
      throw error;
    }
  };

  // Función para renovar token automáticamente
  const refreshTokenAutomatically = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;

      const response = await api.post('/usuarios/auth/refresh/', {
        refresh: refreshToken
      });

      const { access, refresh } = response.data;
      localStorage.setItem('authToken', access);
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
      }
      
      console.log('Token renovado automáticamente');
    } catch (error) {
      console.error('Error al renovar token automáticamente:', error);
      // Si falla la renovación automática, cerrar sesión
      logout();
    }
  };

  // Configurar renovación automática de tokens
  useEffect(() => {
    if (currentUser) {
      // Renovar token cada 7 horas (antes de que expire en 8 horas)
      refreshIntervalRef.current = setInterval(refreshTokenAutomatically, 7 * 60 * 60 * 1000);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [currentUser]);

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    
    // Limpiar el intervalo de renovación
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
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