import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ICONS, ROUTES } from '../constants';
import { auth } from '../services/firebase';
import { LogOut } from 'lucide-react';

const navItems = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: ICONS.dashboard },
  { path: ROUTES.PATIENTS, label: 'Patients', icon: ICONS.patients },
  { path: ROUTES.APPOINTMENTS, label: 'Appointments', icon: ICONS.appointments },
  { path: ROUTES.FINANCIALS, label: 'Financials', icon: ICONS.financials },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: ICONS.settings },
];

const Sidebar: React.FC = () => {
  const { state } = useAppContext();
  return (
    <div className="flex h-full flex-col bg-white text-dark-text">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200">
        <div className="h-10 w-10 flex-shrink-0 bg-primary-50 rounded-lg flex items-center justify-center">
            {state.clinicLogo ? (
                <img src={state.clinicLogo} alt={`${state.clinicName} logo`} className="h-full w-full object-contain rounded-lg p-1" />
            ) : (
                <div className="text-primary-700">{ICONS.clinic}</div>
            )}
        </div>
        <span className="text-xl font-bold text-primary-700 truncate">{state.clinicName}</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const Header: React.FC = () => {
    const { state } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="flex h-16 items-center justify-end px-6 bg-white rounded-t-xl border-b border-slate-200">
            {state.user && (
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">{state.user.displayName}</p>
                        <p className="text-xs text-slate-500">{state.user.email}</p>
                    </div>
                    <img src={state.user.photoURL || undefined} alt="User" className="h-10 w-10 rounded-full" />
                    <button onClick={handleLogout} className="p-2 rounded-full text-slate-500 hover:bg-slate-100" title="Logout">
                      <LogOut size={20} />
                    </button>
                </div>
            )}
        </header>
    );
};


const Layout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-light-bg p-4">
      <div className="grid h-full max-h-[calc(100vh-2rem)] w-full grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr] gap-4">
        <div className="hidden md:flex flex-col bg-white rounded-xl shadow-lg">
          <Sidebar />
        </div>
        <div className="flex flex-col rounded-xl shadow-lg overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;