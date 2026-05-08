import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Clock, CheckCircle2, CalendarDays } from 'lucide-react';

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

  const funnelData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    cantidad: statusCounts[key] || 0,
  }));

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

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboards</h1>
        <p className="page-subtitle">Métricas ejecutivas del ciclo de facturación TI.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
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

      {/* Gráficos */}
      <div className="grid-2">
        <div className="card animate-in animate-in-delay-2" style={{ height: '380px' }}>
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

        <div className="card animate-in animate-in-delay-3" style={{ height: '380px' }}>
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
      </div>

      {/* Tabla de movimientos recientes */}
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
    </div>
  );
}
