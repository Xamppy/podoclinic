import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WhatsAppProvider } from './context/WhatsAppContext';
import { detectKeyboardUser } from './utils/accessibility';

// Import responsive styles
import './styles/responsive.css';

// Layouts
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import AdminCitasPage from './pages/AdminCitasPage';
import FichaClinicaPage from './pages/FichaClinicaPage';
import InventarioPage from './pages/InventarioPage';
import RespaldoPage from './pages/RespaldoPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoutes from './routes/PublicRoutes';

const App = () => {
  // Detectar usuarios de teclado para mejorar accesibilidad
  useEffect(() => {
    const cleanup = detectKeyboardUser();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <WhatsAppProvider>
        <Router>
          {/* Skip to main content link for accessibility */}
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          <Routes>
            {/* Ruta raíz redirige a app/login */}
            <Route path="/" element={<Navigate to="/app/login" replace />} />
            
            {/* Compatibilidad con rutas antiguas - redirigir /admin/* a /app/* */}
            <Route path="/admin/login" element={<Navigate to="/app/login" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/admin/pacientes" element={<Navigate to="/app/pacientes" replace />} />
            <Route path="/admin/citas" element={<Navigate to="/app/citas" replace />} />
            <Route path="/admin/fichas-clinicas" element={<Navigate to="/app/fichas-clinicas" replace />} />
            <Route path="/admin/inventario" element={<Navigate to="/app/inventario" replace />} />
            <Route path="/admin/respaldo" element={<Navigate to="/app/respaldo" replace />} />
            
            {/* Rutas públicas */}
            <Route path="/public/*" element={<PublicRoutes />} />
            
            {/* Rutas protegidas de la aplicación */}
            <Route path="/app/login" element={<LoginPage />} />
            
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/app/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/pacientes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PacientesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/citas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminCitasPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/fichas-clinicas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FichaClinicaPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/inventario"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventarioPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/app/respaldo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RespaldoPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </WhatsAppProvider>
    </AuthProvider>
  );
};

export default App;