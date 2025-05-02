import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import CitasPage from './pages/CitasPage';
import FichaClinicaPage from './pages/FichaClinicaPage';
import InventarioPage from './pages/InventarioPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Layout>
                  <PacientesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/citas"
            element={
              <ProtectedRoute>
                <Layout>
                  <CitasPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/fichas-clinicas"
            element={
              <ProtectedRoute>
                <Layout>
                  <FichaClinicaPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;