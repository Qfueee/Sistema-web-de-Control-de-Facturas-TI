import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Clock, CheckCircle2, CalendarDays, SlidersHorizontal, X } from 'lucide-react';

const STATUS_LABELS = {
  cotizacion_recibida: 'Cotización',
  orden_compra_enviada: 'Orden Compra',
  guia_recibida: 'Guía Remisión',
  factura_recibida: 'Factura',
  enviado_contabilidad: 'Contabilizado',
};

const PIE_COLORS = ['#dc2626', '#d97706', '#2563eb', '#7c3aed', '#16a34a'];

export default function DashboardCharts() {
  const { invoices, recurrents, formatCurrency } = useAppContext();
  
  // Configuración de visualización de Widgets
  const [showConfig, setShowConfig] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const s = localStorage.getItem('ci_dashboard_widgets');
    return s ? JSON.parse(s) : [
      'kpi_grid',
      'chart_provider',
      'chart_status',
      'chart_capex_opex',
      'chart_cost_center',
      'chart_purchase_type',
      'table_recent_movements'
    ];
  });

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev => {
      const next = prev.includes(widgetId)
        ? prev.filter(w => w !== widgetId)
        : [...prev, widgetId];
      localStorage.setItem('ci_dashboard_widgets', JSON.stringify(next));
      return next;
    });
  };

  // KPIs
  const activeInvoices = invoices.filter(i => i.status !== 'enviado_contabilidad');
  const completedInvoices = invoices.filter(i => i.status === 'enviado_contabilidad');
  const criticalInvoices = invoices.filter(i => i.status === 'factura_recibida' || i.status === 'guia_recibida');

  const parseAmount = (a) => typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]/g, '')) || 0 : Number(a) || 0;

  const totalPendiente = activeInvoices
    .filter(i => (i.currency || 'PEN') === 'PEN')
    .reduce((sum, i) => sum + parseAmount(i.amount), 0);

  const nextRecurrent = recurrents.length > 0
    ? recurrents.reduce((closest, r) => {
        const today = new Date().getDate();
        const diff = r.day >= today ? r.day - today : 30 - today + r.day;
        const closestDiff = closest.day >= today ? closest.day - today : 30 - today + closest.day;
        return diff < closestDiff ? r : closest;
      })
    : null;

  // Gráfico: Embudo por estado
  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  // Gráfico: Gasto por proveedor (PEN)
  const providerTotals = {};
  invoices.forEach(inv => {
    if ((inv.currency || 'PEN') === 'PEN') {
      providerTotals[inv.providerName] = (providerTotals[inv.providerName] || 0) + parseAmount(inv.amount);
    }
  });
  const providerData = Object.entries(providerTotals)
    .map(([name, total]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Gráfico: Distribución por estado (Pie)
  const pieData = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({ name: label, value: statusCounts[key] || 0 }))
    .filter(d => d.value > 0);

  // ═══ NUEVOS CÁLCULOS BASADOS EN ETIQUETAS DE COMPRA OCASIONAL ═══

  // 1. Gasto CAPEX vs OPEX (Equivalente PEN, usando tasa genérica 3.75 para USD)
  const capexOpexTotals = { CAPEX: 0, OPEX: 0 };
  invoices.forEach(inv => {
    if (inv.capexOpex) {
      const isUSD = (inv.currency || 'PEN') === 'USD';
      const amountPEN = parseAmount(inv.amount) * (isUSD ? 3.75 : 1);
      const key = inv.capexOpex.toUpperCase();
      if (capexOpexTotals[key] !== undefined) {
        capexOpexTotals[key] += amountPEN;
      }
    }
  });
  const capexOpexData = Object.entries(capexOpexTotals)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  // 2. Gasto por Centro de Costo (CECO - Equivalente PEN)
  const costCenterTotals = {};
  invoices.forEach(inv => {
    if (inv.costCenter) {
      const isUSD = (inv.currency || 'PEN') === 'USD';
      const amountPEN = parseAmount(inv.amount) * (isUSD ? 3.75 : 1);
      const name = inv.costCenter;
      costCenterTotals[name] = (costCenterTotals[name] || 0) + amountPEN;
    }
  });
  const costCenterData = Object.entries(costCenterTotals)
    .map(([name, total]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, total }))
    .sort((a, b) => b.total - a.total);

  // 3. Gasto por Tipo de Compra (Compra vs Servicio - Equivalente PEN)
  const purchaseTypeTotals = { Compra: 0, Servicio: 0 };
  invoices.forEach(inv => {
    if (inv.purchaseType) {
      const isUSD = (inv.currency || 'PEN') === 'USD';
      const amountPEN = parseAmount(inv.amount) * (isUSD ? 3.75 : 1);
      const key = inv.purchaseType; // 'Compra' o 'Servicio'
      if (purchaseTypeTotals[key] !== undefined) {
        purchaseTypeTotals[key] += amountPEN;
      }
    }
  });
  const purchaseTypeData = Object.entries(purchaseTypeTotals)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div className="dashboard">
      <div className="page-header flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Dashboards</h1>
          <p className="page-subtitle">Métricas ejecutivas del ciclo de facturación TI.</p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={() => setShowConfig(!showConfig)} 
          style={{ gap: '0.375rem', fontWeight: '600' }}
        >
          <SlidersHorizontal size={14} /> Personalizar
        </button>
      </div>

      {/* Selector de Personalización */}
      {showConfig && (
        <div className="card animate-in" style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--accent)', padding: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--primary)' }}>Personalizar Panel de Control</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfig(false)}><X size={16} /></button>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Active o desactive las tarjetas y gráficos a visualizar en tiempo real. Sus preferencias se guardarán localmente.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { id: 'kpi_grid', label: 'Indicadores Clave (KPIs)' },
              { id: 'chart_provider', label: 'Gasto por Proveedor' },
              { id: 'chart_status', label: 'Distribución por Estado' },
              { id: 'chart_capex_opex', label: 'Gasto CAPEX vs OPEX' },
              { id: 'chart_purchase_type', label: 'Compra vs Servicio' },
              { id: 'chart_cost_center', label: 'Gasto por Centro de Costo' },
              { id: 'table_recent_movements', label: 'Últimos Movimientos' }
            ].map(w => (
              <label 
                key={w.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8125rem', 
                  cursor: 'pointer', 
                  background: 'var(--surface-color)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: activeWidgets.includes(w.id) ? '1px solid var(--accent)' : '1px solid var(--border-color)', 
                  fontWeight: '600',
                  color: activeWidgets.includes(w.id) ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={activeWidgets.includes(w.id)}
                  onChange={() => toggleWidget(w.id)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                {w.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {activeWidgets.includes('kpi_grid') && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card rojo animate-in">
            <div>
              <div className="kpi-label">Acción Crítica</div>
              <div className="kpi-value">{criticalInvoices.length}</div>
              <div className="kpi-sub">facturas por enviar</div>
            </div>
            <div className="kpi-icon rojo"><AlertTriangle size={22} /></div>
          </div>

          <div className="kpi-card amarillo animate-in animate-in-delay-1">
            <div>
              <div className="kpi-label">Trámites Activos</div>
              <div className="kpi-value">{activeInvoices.length}</div>
              <div className="kpi-sub">en proceso</div>
            </div>
            <div className="kpi-icon amarillo"><Clock size={22} /></div>
          </div>

          <div className="kpi-card verde animate-in animate-in-delay-2">
            <div>
              <div className="kpi-label">Total Pendiente</div>
              <div className="kpi-value" style={{ fontSize: '1.375rem' }}>{formatCurrency(totalPendiente)}</div>
              <div className="kpi-sub">en soles</div>
            </div>
            <div className="kpi-icon verde"><CheckCircle2 size={22} /></div>
          </div>

          <div className="kpi-card azul animate-in animate-in-delay-3">
            <div>
              <div className="kpi-label">Próximo Recurrente</div>
              <div className="kpi-value">{nextRecurrent ? `Día ${nextRecurrent.day}` : '—'}</div>
              <div className="kpi-sub">{nextRecurrent ? nextRecurrent.providerName : 'Sin datos'}</div>
            </div>
            <div className="kpi-icon azul"><CalendarDays size={22} /></div>
          </div>
        </div>
      )}

      {/* Gráficos dinámicos */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>
        {activeWidgets.includes('chart_provider') && (
          <div className="card animate-in" style={{ height: '380px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Gasto por Proveedor (PEN)
            </h3>
            <ResponsiveContainer width="100%" height="82%">
              <BarChart data={providerData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `S/ ${(v / 1000).toFixed(1)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(val) => [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Total']} />
                <Bar dataKey="total" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeWidgets.includes('chart_status') && (
          <div className="card animate-in" style={{ height: '380px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Distribución por Estado
            </h3>
            <ResponsiveContainer width="100%" height="82%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico CAPEX vs OPEX */}
        {activeWidgets.includes('chart_capex_opex') && (
          <div className="card animate-in" style={{ height: '380px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: '700' }}>Gasto CAPEX vs OPEX (Equivalente PEN)</h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '500' }}>Ocasional (1 USD = 3.75 PEN)</span>
            </div>
            {capexOpexData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Sin etiquetas CAPEX/OPEX registradas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="82%">
                <PieChart>
                  <Pie
                    data={capexOpexData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                  >
                    {capexOpexData.map((_, i) => (
                      <Cell key={i} fill={['#06b6d4', '#8b5cf6'][i % 2]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Monto']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Gráfico Compra vs Servicio */}
        {activeWidgets.includes('chart_purchase_type') && (
          <div className="card animate-in" style={{ height: '380px' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: '700' }}>Compra vs Servicio (Equivalente PEN)</h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '500' }}>Ocasional (1 USD = 3.75 PEN)</span>
            </div>
            {purchaseTypeData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Sin etiquetas de tipo de compra registradas.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="82%">
                <PieChart>
                  <Pie
                    data={purchaseTypeData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                  >
                    {purchaseTypeData.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#ec4899'][i % 2]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Monto']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Gráfico Centro de Costo (Ceco) */}
        {activeWidgets.includes('chart_cost_center') && (
          <div className="card animate-in" style={{ height: '400px', gridColumn: 'span 2' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: '700' }}>Gasto por Centro de Costo (Ceco Equivalente PEN)</h3>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '500' }}>Ocasional (1 USD = 3.75 PEN)</span>
            </div>
            {costCenterData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Sin centros de costo registrados en trámites ocasionales.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="82%">
                <BarChart data={costCenterData} margin={{ left: 10, right: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-10} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `S/ ${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(val) => [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'Total']} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Tabla de movimientos recientes */}
      {activeWidgets.includes('table_recent_movements') && (
        <div className="card animate-in animate-in-delay-4" style={{ marginTop: '1.25rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem 0' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700' }}>Últimos Movimientos</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '600' }}>{inv.id}</td>
                    <td>{inv.providerName}</td>
                    <td style={{ fontWeight: '500' }}>{formatCurrency(inv.amount, inv.currency)}</td>
                    <td>
                      <span className={`status-badge ${inv.status === 'enviado_contabilidad' ? 'verde' : inv.status === 'factura_recibida' || inv.status === 'guia_recibida' ? 'rojo' : 'amarillo'}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
