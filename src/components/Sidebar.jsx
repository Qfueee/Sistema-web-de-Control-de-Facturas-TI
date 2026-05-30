import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, CalendarDays, FileText, Settings, ShieldCheck, LogOut, Inbox, Shield, Sun, Moon } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Inbox, label: 'Bandeja Operativa', perm: 'viewBandeja' },
  { to: '/dashboards', icon: LayoutDashboard, label: 'Dashboards', perm: 'viewDashboards' },
  { to: '/calendario', icon: CalendarDays, label: 'Pagos Recurrentes', perm: 'viewCalendario' },
  { to: '/historial', icon: FileText, label: 'Historial Facturas', perm: 'viewHistorial' },
  { to: '/auditoria', icon: Shield, label: 'Auditoría', perm: 'viewAuditoria' },
];

export default function Sidebar() {
  const { logout, currentUser, userPermissions, profiles } = useAppContext();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('ci_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('ci_dark_mode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const userProfile = profiles.find(p => p.id === currentUser?.role);
  const profileName = userProfile ? userProfile.name : (currentUser?.role === 'admin' ? 'Administrador' : 'Visor');

  const visibleItems = NAV_ITEMS.filter(item => !item.perm || userPermissions[item.perm]);

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={26} color="#ffffff" strokeWidth={2} />
          <h1>TI Control</h1>
        </div>
        <button 
          onClick={toggleDarkMode} 
          className="btn btn-ghost btn-sm" 
          style={{ color: '#ffffff', padding: '0.25rem', display: 'flex', alignItems: 'center', background: 'none' }}
          title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="sidebar-divider" />

      {/* Navegación */}
      <nav className="nav-links">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-name">{currentUser?.name}</div>
          <div className="sidebar-user-role">{profileName}</div>
        </div>

        {userPermissions.viewConfiguracion && (
          <NavLink
            to="/configuracion"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            Configuración
          </NavLink>
        )}

        <button
          onClick={logout}
          className="nav-item"
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(252,165,165,0.8)' }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
