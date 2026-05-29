import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, CalendarDays, FileText, Settings, ShieldCheck, LogOut, Inbox } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Inbox, label: 'Bandeja Operativa', perm: 'viewBandeja' },
  { to: '/dashboards', icon: LayoutDashboard, label: 'Dashboards', perm: 'viewDashboards' },
  { to: '/calendario', icon: CalendarDays, label: 'Pagos Recurrentes', perm: 'viewCalendario' },
  { to: '/historial', icon: FileText, label: 'Historial Facturas', perm: 'viewHistorial' },
];

export default function Sidebar() {
  const { logout, currentUser, userPermissions, profiles } = useAppContext();

  const userProfile = profiles.find(p => p.id === currentUser?.role);
  const profileName = userProfile ? userProfile.name : (currentUser?.role === 'admin' ? 'Administrador' : 'Visor');

  const visibleItems = NAV_ITEMS.filter(item => !item.perm || userPermissions[item.perm]);

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div className="sidebar-header">
        <ShieldCheck size={26} color="#ffffff" strokeWidth={2} />
        <h1>TI Control</h1>
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
