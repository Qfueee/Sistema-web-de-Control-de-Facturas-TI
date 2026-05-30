import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, RotateCcw, Trash2, Shield, Calendar, User, Info, ArrowLeftRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ACTION_BADGES = {
  'Inicio de Sesión': 'verde',
  'Cierre de Sesión': 'azul',
  'Creación de Compra': 'verde',
  'Modificación de Compra': 'amarillo',
  'Eliminación de Compra': 'rojo',
  'Limpieza de Historial': 'rojo',
};

export default function Auditoria() {
  const { auditLogs, clearAuditLogs, currentUser } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Filter logs based on search and action dropdown
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.email.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = filterAction ? log.action === filterAction : true;
      
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, search, filterAction]);

  // Paginated logs
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getBadgeClass = (action) => {
    return ACTION_BADGES[action] || 'azul';
  };

  const handleClearLogs = () => {
    clearAuditLogs();
    setShowConfirm(false);
    setPage(1);
  };

  return (
    <div className="auditoria-container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={28} color="var(--primary)" /> Auditoría del Sistema
          </h1>
          <p className="page-subtitle">Registro y trazabilidad en tiempo real de accesos, modificaciones y eliminaciones.</p>
        </div>
        {isAdmin && auditLogs.length > 0 && (
          <button 
            className="btn btn-outline" 
            style={{ color: 'var(--status-rojo-text)', borderColor: 'var(--status-rojo-border)', background: 'var(--status-rojo-bg)', gap: '0.375rem' }}
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={14} /> Limpiar Historial
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Buscar por usuario, correo o detalles..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select 
          className="filter-select" 
          value={filterAction} 
          onChange={e => { setFilterAction(e.target.value); setPage(1); }}
        >
          <option value="">Todos los eventos</option>
          <option value="Inicio de Sesión">Inicios de Sesión</option>
          <option value="Cierre de Sesión">Cierres de Sesión</option>
          <option value="Creación de Compra">Creación de Compra</option>
          <option value="Modificación de Compra">Modificación de Compra</option>
          <option value="Eliminación de Compra">Eliminación de Compra</option>
          <option value="Limpieza de Historial">Limpieza de Historial</option>
        </select>

        {/* Info label */}
        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          {filteredLogs.length} registro{filteredLogs.length !== 1 && 's'} encontrado{filteredLogs.length !== 1 && 's'}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={13} /> Fecha y Hora</div></th>
                <th style={{ width: '220px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><User size={13} /> Usuario</div></th>
                <th style={{ width: '180px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><ArrowLeftRight size={13} /> Acción</div></th>
                <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Info size={13} /> Detalle del Suceso</div></th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                      <Shield size={40} className="empty-state-icon" style={{ opacity: 0.3 }} />
                      <div className="empty-state-title">Sin registros</div>
                      <div className="empty-state-text">No se encontraron eventos en la auditoría con los filtros aplicados.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      {new Date(log.timestamp).toLocaleString('es-PE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{log.user}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{log.email}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: '500', lineHeight: '1.4' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1.25rem' }}>
          <button 
            className="pagination-btn" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p} 
              className={`pagination-btn ${p === page ? 'active' : ''}`} 
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button 
            className="pagination-btn" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Trash2 size={18} color="var(--status-rojo-text)" /> Confirmar Limpieza de Historial
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              ¿Está seguro de que desea limpiar todos los registros de auditoría? Esta acción es irreversible y quedará registrada en una nueva traza de seguridad.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleClearLogs}>Limpiar Todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
