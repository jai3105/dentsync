import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './constants';
import { useAppContext } from './contexts/AppContext';

import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import FinancialsPage from './pages/FinancialsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoutes: React.FC = () => {
    const { state } = useAppContext();
    if (state.isAuthLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-light-bg"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div></div>;
    }
    return state.isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const { state } = useAppContext();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={state.isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <LoginPage />} />
        
        <Route element={<ProtectedRoutes />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.PATIENTS} element={<PatientsPage />} />
              <Route path={`${ROUTES.PATIENTS}/:patientId`} element={<PatientsPage />} />
              <Route path={`${ROUTES.PATIENTS}/:patientId/:tab`} element={<PatientsPage />} />
              <Route path={ROUTES.APPOINTMENTS} element={<AppointmentsPage />} />
              <Route path={ROUTES.FINANCIALS} element={<FinancialsPage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;