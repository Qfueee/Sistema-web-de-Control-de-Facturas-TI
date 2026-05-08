import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import InvoiceModal from './InvoiceModal';

const STATUS_LABELS = {
  cotizacion_recibida: 'Cotización',
  orden_compra_enviada: 'Orden Compra',
  guia_recibida: 'Guía Remisión',
  factura_recibida: 'Factura',
  enviado_contabilidad: 'Contabilizado',
};

const ITEMS_PER_PAGE = 8;

export default function Historial() {
  const { invoices, providers, formatCurrency } = useAppContext();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (search) {
        const q = search.toLowerCase();
        if (!inv.providerName.toLowerCase().includes(q) && !inv.id.toLowerCase().includes(q) && !(inv.notes || '').toLowerCase().includes(q)) return false;
      }
      if (filterProvider && inv.provider_id !== filterProvider) return false;
      if (filterStatus && inv.status !== filterStatus) return false;
      return true;
    });
  }, [invoices, search, filterProvider, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusBadge = (status) => {
    if (status === 'enviado_contabilidad') return 'verde';
    if (status === 'factura_recibida' || status === 'guia_recibida') return 'rojo';
    return 'amarillo';
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Historial de Facturas</h1>
          <p className="page-subtitle">Registro completo de todas las facturas del sistema.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" className="filter-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Buscar por proveedor, ID o notas..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={filterProvider} onChange={e => { setFilterProvider(e.target.value); setPage(1); }}>
          <option value="">Todos los proveedores</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {filtered.length} registro{filtered.length !== 1 && 's'}
        </div>
      </div>

      {/* Tabla */}
      <div className="card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Proveedor</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Fecha Ingreso</th>
                <th>Estado</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <FileText size={40} className="empty-state-icon" />
                      <div className="empty-state-title">Sin resultados</div>
                      <div className="empty-state-text">No se encontraron facturas con los filtros aplicados.</div>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(item => (
                <tr key={item.id} onClick={() => setSelectedItem(item)} style={{ opacity: item.status === 'enviado_contabilidad' ? 0.7 : 1 }}>
                  <td style={{ fontWeight: '600' }}>{item.id}</td>
                  <td style={{ fontWeight: '500' }}>{item.providerName}</td>
                  <td style={{ fontWeight: '600' }}>{formatCurrency(item.amount, item.currency)}</td>
                  <td>
                    <span className={`status-badge ${item.type === 'recurrente' ? 'azul' : 'amarillo'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>{new Date(item.date).toLocaleDateString('es-PE')}</td>
                  <td><span className={`status-badge ${getStatusBadge(item.status)}`}>{STATUS_LABELS[item.status]}</span></td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {item.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {(selectedItem || isCreating) && (
        <InvoiceModal
          item={selectedItem}
          isNew={isCreating}
          onClose={() => { setSelectedItem(null); setIsCreating(false); }}
        />
      )}
    </div>
  );
}
