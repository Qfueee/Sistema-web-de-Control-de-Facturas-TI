import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, FileText, ChevronLeft, ChevronRight, SlidersHorizontal, Download, RotateCcw } from 'lucide-react';
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
  
  // Basic search & filter state
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Advanced filters toggle and state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterCapexOpex, setFilterCapexOpex] = useState('');
  const [filterPurchaseType, setFilterPurchaseType] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState('');
  const [filterOcNumber, setFilterOcNumber] = useState('');
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState('');
  
  const [filterOcAmountMin, setFilterOcAmountMin] = useState('');
  const [filterOcAmountMax, setFilterOcAmountMax] = useState('');
  const [filterInvAmountMin, setFilterInvAmountMin] = useState('');
  const [filterInvAmountMax, setFilterInvAmountMax] = useState('');

  const [filterOcDateStart, setFilterOcDateStart] = useState('');
  const [filterOcDateEnd, setFilterOcDateEnd] = useState('');
  const [filterInvDateStart, setFilterInvDateStart] = useState('');
  const [filterInvDateEnd, setFilterInvDateEnd] = useState('');
  const [filterSentDateStart, setFilterSentDateStart] = useState('');
  const [filterSentDateEnd, setFilterSentDateEnd] = useState('');

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      // Basic Filters
      if (search) {
        const q = search.toLowerCase();
        if (!inv.providerName.toLowerCase().includes(q) && 
            !inv.id.toLowerCase().includes(q) && 
            !(inv.notes || '').toLowerCase().includes(q)) return false;
      }
      if (filterProvider && inv.provider_id !== filterProvider) return false;
      if (filterStatus && inv.status !== filterStatus) return false;

      // Advanced Filters (CAPEX / OPEX / Purchase Type / Ceco / OC Numbers)
      if (filterCapexOpex && inv.capexOpex !== filterCapexOpex) return false;
      if (filterPurchaseType && inv.purchaseType !== filterPurchaseType) return false;
      
      if (filterCostCenter && !(inv.costCenter || '').toLowerCase().includes(filterCostCenter.toLowerCase())) return false;
      if (filterOcNumber && !(inv.ocNumber || '').toLowerCase().includes(filterOcNumber.toLowerCase())) return false;
      if (filterInvoiceNumber && !(inv.invoiceNumber || '').toLowerCase().includes(filterInvoiceNumber.toLowerCase())) return false;

      // Amounts
      const ocAmt = Number(inv.ocAmount || 0);
      if (filterOcAmountMin && ocAmt < Number(filterOcAmountMin)) return false;
      if (filterOcAmountMax && ocAmt > Number(filterOcAmountMax)) return false;

      const invAmt = Number(inv.invoiceAmount || 0);
      if (filterInvAmountMin && invAmt < Number(filterInvAmountMin)) return false;
      if (filterInvAmountMax && invAmt > Number(filterInvAmountMax)) return false;

      // OC Date
      if (filterOcDateStart || filterOcDateEnd) {
        if (!inv.ocDate) return false;
        const ocD = new Date(inv.ocDate);
        if (filterOcDateStart && ocD < new Date(filterOcDateStart + 'T00:00:00')) return false;
        if (filterOcDateEnd && ocD > new Date(filterOcDateEnd + 'T23:59:59')) return false;
      }

      // Invoice Date
      if (filterInvDateStart || filterInvDateEnd) {
        if (!inv.invoiceDate) return false;
        const invD = new Date(inv.invoiceDate);
        if (filterInvDateStart && invD < new Date(filterInvDateStart + 'T00:00:00')) return false;
        if (filterInvDateEnd && invD > new Date(filterInvDateEnd + 'T23:59:59')) return false;
      }

      // Sent to Accounting Date
      if (filterSentDateStart || filterSentDateEnd) {
        if (!inv.accountingSentDate) return false;
        const sentD = new Date(inv.accountingSentDate);
        if (filterSentDateStart && sentD < new Date(filterSentDateStart + 'T00:00:00')) return false;
        if (filterSentDateEnd && sentD > new Date(filterSentDateEnd + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [
    invoices, search, filterProvider, filterStatus,
    filterCapexOpex, filterPurchaseType, filterCostCenter, filterOcNumber, filterInvoiceNumber,
    filterOcAmountMin, filterOcAmountMax, filterInvAmountMin, filterInvAmountMax,
    filterOcDateStart, filterOcDateEnd, filterInvDateStart, filterInvDateEnd, filterSentDateStart, filterSentDateEnd
  ]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusBadge = (status) => {
    if (status === 'enviado_contabilidad') return 'verde';
    if (status === 'factura_recibida' || status === 'guia_recibida') return 'rojo';
    return 'amarillo';
  };

  const clearFilters = () => {
    setFilterCapexOpex('');
    setFilterPurchaseType('');
    setFilterCostCenter('');
    setFilterOcNumber('');
    setFilterInvoiceNumber('');
    setFilterOcAmountMin('');
    setFilterOcAmountMax('');
    setFilterInvAmountMin('');
    setFilterInvAmountMax('');
    setFilterOcDateStart('');
    setFilterOcDateEnd('');
    setFilterInvDateStart('');
    setFilterInvDateEnd('');
    setFilterSentDateStart('');
    setFilterSentDateEnd('');
  };

  const exportToCSV = () => {
    // Columns
    const headers = [
      'ID', 'Proveedor', 'Tipo', 'Monto Inicial', 'Moneda', 'Estado', 'Fecha Ingreso',
      'Capex/Opex', 'Tipo Compra', 'Sustento', 'Nro OC', 'Centro Costo', 'Fecha OC', 'Monto OC',
      'Motivo', 'Nro Factura', 'Fecha Factura', 'Monto Factura', 'Fecha Envio Contabilidad', 'Notas'
    ];

    const rows = filtered.map(inv => [
      inv.id,
      inv.providerName,
      inv.type,
      inv.amount,
      inv.currency,
      STATUS_LABELS[inv.status] || inv.status,
      new Date(inv.date).toLocaleDateString('es-PE'),
      inv.capexOpex || '',
      inv.purchaseType || '',
      inv.sustento || '',
      inv.ocNumber || '',
      inv.costCenter || '',
      inv.ocDate ? new Date(inv.ocDate).toLocaleDateString('es-PE') : '',
      inv.ocAmount || '',
      inv.motivo || '',
      inv.invoiceNumber || '',
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('es-PE') : '',
      inv.invoiceAmount || '',
      inv.accountingSentDate ? new Date(inv.accountingSentDate).toLocaleDateString('es-PE') : '',
      (inv.notes || '').replace(/"/g, '""').replace(/\n/g, ' ') // Escape quotes and newlines
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Create download link with BOM for UTF-8 support in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_facturas_ti_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Historial de Facturas</h1>
          <p className="page-subtitle">Registro completo de todas las facturas del sistema con etiquetas de seguimiento.</p>
        </div>
      </div>

      {/* Filtros Básicos */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" className="filter-input"
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            placeholder="Buscar proveedor, ID o notas..."
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
        
        {/* Buttons */}
        <button 
          className={`btn ${showAdvanced ? 'btn-primary' : 'btn-outline'}`} 
          style={{ gap: '0.375rem' }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal size={14} /> Filtros Avanzados
        </button>

        <button 
          className="btn btn-outline" 
          style={{ gap: '0.375rem', color: 'var(--status-verde-text)', borderColor: 'var(--status-verde-border)', background: 'var(--status-verde-bg)' }}
          onClick={exportToCSV}
          disabled={filtered.length === 0}
        >
          <Download size={14} /> Exportar CSV
        </button>

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {filtered.length} registro{filtered.length !== 1 && 's'}
        </div>
      </div>

      {/* Panel de Filtros Avanzados */}
      {showAdvanced && (
        <div className="card animate-in" style={{ marginBottom: '1.25rem', padding: '1.25rem', border: '1px solid var(--border-color)', background: 'var(--surface-color)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)' }}>Filtros de Etiquetas y Fechas</h3>
            <button className="btn btn-ghost btn-sm" style={{ gap: '0.25rem', padding: '0.25rem' }} onClick={clearFilters}>
              <RotateCcw size={12} /> Limpiar Filtros
            </button>
          </div>
          
          <div className="grid-3" style={{ gap: '1.25rem' }}>
            {/* Col 1: Etiquetas */}
            <div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">CAPEX / OPEX</label>
                <select className="form-select" value={filterCapexOpex} onChange={e => { setFilterCapexOpex(e.target.value); setPage(1); }}>
                  <option value="">Todos</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="OPEX">OPEX</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Tipo de Compra</label>
                <select className="form-select" value={filterPurchaseType} onChange={e => { setFilterPurchaseType(e.target.value); setPage(1); }}>
                  <option value="">Todos</option>
                  <option value="Compra">Compra (Bien)</option>
                  <option value="Servicio">Servicio</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Centro de Costo</label>
                <input type="text" className="form-input" placeholder="Ej: Ventas - 302..." value={filterCostCenter} onChange={e => { setFilterCostCenter(e.target.value); setPage(1); }} />
              </div>
            </div>
            
            {/* Col 2: Números y Montos */}
            <div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Nro. OC / Nro. Factura</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" placeholder="Nro OC" value={filterOcNumber} onChange={e => { setFilterOcNumber(e.target.value); setPage(1); }} />
                  <input type="text" className="form-input" placeholder="Nro Factura" value={filterInvoiceNumber} onChange={e => { setFilterInvoiceNumber(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Monto OC (Rango)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" className="form-input" placeholder="Mínimo" value={filterOcAmountMin} onChange={e => { setFilterOcAmountMin(e.target.value); setPage(1); }} />
                  <input type="number" className="form-input" placeholder="Máximo" value={filterOcAmountMax} onChange={e => { setFilterOcAmountMax(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Monto Facturado (Rango)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" className="form-input" placeholder="Mínimo" value={filterInvAmountMin} onChange={e => { setFilterInvAmountMin(e.target.value); setPage(1); }} />
                  <input type="number" className="form-input" placeholder="Máximo" value={filterInvAmountMax} onChange={e => { setFilterInvAmountMax(e.target.value); setPage(1); }} />
                </div>
              </div>
            </div>
            
            {/* Col 3: Fechas */}
            <div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Fecha emisión OC (Rango)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterOcDateStart} onChange={e => { setFilterOcDateStart(e.target.value); setPage(1); }} />
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterOcDateEnd} onChange={e => { setFilterOcDateEnd(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Fecha Facturación (Rango)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterInvDateStart} onChange={e => { setFilterInvDateStart(e.target.value); setPage(1); }} />
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterInvDateEnd} onChange={e => { setFilterInvDateEnd(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Envío Contabilidad (Rango)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterSentDateStart} onChange={e => { setFilterSentDateStart(e.target.value); setPage(1); }} />
                  <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem' }} value={filterSentDateEnd} onChange={e => { setFilterSentDateEnd(e.target.value); setPage(1); }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <th>Etiquetas Clave</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
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
                  <td>
                    {item.type === 'ocasional' ? (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {item.capexOpex && (
                          <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', background: '#e2e8f0', color: '#1e293b', borderRadius: '4px', fontWeight: '700' }}>
                            {item.capexOpex}
                          </span>
                        )}
                        {item.purchaseType && (
                          <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontWeight: '700' }}>
                            {item.purchaseType}
                          </span>
                        )}
                        {item.costCenter && (
                          <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontWeight: '600' }}>
                            Ceco: {item.costCenter.split(' - ')[0]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
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
