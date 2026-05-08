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

function AppLayout() {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<BandejaOperativa />} />
            <Route path="/dashboards" element={<DashboardCharts />} />
            <Route path="/calendario" element={<BillingCalendar />} />
            <Route path="/historial" element={<Historial />} />
            
            {/* Solo Admin puede ver configuración completa, pero la vista es la misma para simplificar */}
            <Route path="/configuracion" element={<Configuracion />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
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
