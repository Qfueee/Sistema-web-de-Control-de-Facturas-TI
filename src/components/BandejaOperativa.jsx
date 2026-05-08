import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, ArrowRight, Search, Inbox } from 'lucide-react';
import InvoiceModal from './InvoiceModal';

const STATUS_LABELS = {
  cotizacion_recibida: 'Cotización',
  orden_compra_enviada: 'Orden Compra',
  guia_recibida: 'Guía Remisión',
  factura_recibida: 'Factura',
};

export default function BandejaOperativa() {
  const { invoices, providers, formatCurrency } = useAppContext();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterType, setFilterType] = useState('');

  const activeInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'enviado_contabilidad')
      .filter(inv => {
        if (search) {
          const q = search.toLowerCase();
          if (!inv.providerName.toLowerCase().includes(q) && !inv.id.toLowerCase().includes(q)) return false;
        }
        if (filterProvider && inv.provider_id !== filterProvider) return false;
        if (filterType && inv.type !== filterType) return false;
        return true;
      });
  }, [invoices, search, filterProvider, filterType]);

  const getElapsedInfo = (dateString) => {
    if (!dateString) return { days: 0, colorClass: 'var(--status-verde-text)' };
    const days = differenceInDays(new Date(), parseISO(dateString));
    let colorClass = 'var(--status-verde-text)';
    if (days > 3) colorClass = 'var(--status-amarillo-text)';
    if (days > 7) colorClass = 'orange';
    if (days > 14) colorClass = 'var(--status-rojo-text)';
    return { days, colorClass };
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Bandeja Operativa</h1>
          <p className="page-subtitle">Trámites activos que requieren seguimiento del área TI.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={16} /> Nuevo Trámite
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="filter-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Buscar por proveedor o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterProvider} onChange={e => setFilterProvider(e.target.value)}>
          <option value="">Todos los proveedores</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="recurrente">Recurrente</option>
          <option value="ocasional">Ocasional</option>
        </select>
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
                <th>Estado Actual</th>
                <th>Antigüedad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {activeInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <Inbox size={40} className="empty-state-icon" />
                      <div className="empty-state-title">Sin trámites pendientes</div>
                      <div className="empty-state-text">Todo está al día. ¡Buen trabajo!</div>
                    </div>
                  </td>
                </tr>
              ) : activeInvoices.map(item => {
                const elapsed = getElapsedInfo(item.date);
                return (
                  <tr key={item.id} onClick={() => setSelectedItem(item)}>
                    <td style={{ fontWeight: '600' }}>{item.id}</td>
                    <td style={{ fontWeight: '500' }}>{item.providerName}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(item.amount, item.currency)}</td>
                    <td>
                      <span className={`status-badge ${item.type === 'recurrente' ? 'azul' : 'amarillo'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{STATUS_LABELS[item.status] || item.status}</td>
                    <td style={{ fontWeight: '700', color: elapsed.colorClass }}>
                      {elapsed.days} día{elapsed.days !== 1 && 's'}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setSelectedItem(item); }}>
                        Gestionar <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
