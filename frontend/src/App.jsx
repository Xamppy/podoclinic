import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WhatsAppProvider } from './context/WhatsAppContext';

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
  return (
    <AuthProvider>
      <WhatsAppProvider>
        <Router>
          <Routes>
            {/* Ruta raíz redirige a admin/login */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            
            {/* Rutas públicas */}
            <Route path="/public/*" element={<PublicRoutes />} />
            
            {/* Rutas protegidas del admin */}
            <Route path="/admin/login" element={<LoginPage />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/admin/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/pacientes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PacientesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/citas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminCitasPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/fichas-clinicas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FichaClinicaPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/inventario"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventarioPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/respaldo"
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