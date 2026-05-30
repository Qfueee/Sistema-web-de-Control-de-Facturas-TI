import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContextProvider, useAppContext } from './context/AppContext';

import Sidebar from './components/Sidebar';
import BandejaOperativa from './components/BandejaOperativa';
import DashboardCharts from './components/DashboardCharts';
import BillingCalendar from './components/BillingCalendar';
import Historial from './components/Historial';
import Configuracion from './components/Configuracion';
import Login from './components/Login';
import AICopilot from './components/AICopilot';
import Auditoria from './components/Auditoria';

function AppLayout() {
  const { currentUser, userPermissions } = useAppContext();

  if (!currentUser) {
    return <Login />;
  }

  // Componente protector de rutas
  const ProtectedRoute = ({ element, perm }) => {
    if (!userPermissions[perm]) {
      if (userPermissions.viewBandeja) return <Navigate to="/" replace />;
      if (userPermissions.viewDashboards) return <Navigate to="/dashboards" replace />;
      if (userPermissions.viewCalendario) return <Navigate to="/calendario" replace />;
      if (userPermissions.viewHistorial) return <Navigate to="/historial" replace />;
      if (userPermissions.viewConfiguracion) return <Navigate to="/configuracion" replace />;
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--status-rojo-text)' }}>Acceso Denegado</h2>
          <p style={{ color: 'var(--text-muted)' }}>No tienes permisos habilitados para ver este módulo. Por favor, contacta a tu administrador.</p>
        </div>
      );
    }
    return element;
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<BandejaOperativa />} perm="viewBandeja" />} />
            <Route path="/dashboards" element={<ProtectedRoute element={<DashboardCharts />} perm="viewDashboards" />} />
            <Route path="/calendario" element={<ProtectedRoute element={<BillingCalendar />} perm="viewCalendario" />} />
            <Route path="/historial" element={<ProtectedRoute element={<Historial />} perm="viewHistorial" />} />
            <Route path="/configuracion" element={<ProtectedRoute element={<Configuracion />} perm="viewConfiguracion" />} />
            <Route path="/auditoria" element={<ProtectedRoute element={<Auditoria />} perm="viewAuditoria" />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <AICopilot />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <AppLayout />
    </AppContextProvider>
  );
}
