import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Edit2, AlertTriangle, X, Plus, CheckCircle, Circle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function BillingCalendar() {
  const { recurrents, updateRecurrent, addRecurrent, deleteRecurrent, providers, formatCurrency, isRecurrentPaid, toggleRecurrentPaid, paidRecurrents } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formDay, setFormDay] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('PEN');
  const [formDesc, setFormDesc] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const viewYear = currentMonth.getFullYear();
  const viewMonth = currentMonth.getMonth(); // 0-indexed

  // Celdas vacías al inicio (Lunes = 0)
  const startDow = getDay(monthStart);
  const emptyBefore = startDow === 0 ? 6 : startDow - 1;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const openEdit = (item, e) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setIsAdding(false);
    setFormDay(item.day);
    setFormProvider(item.provider_id);
    setFormAmount(item.amount || '');
    setFormCurrency(item.currency || 'PEN');
    setFormDesc(item.description || '');
  };

  const openAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
    setFormDay('');
    setFormProvider('');
    setFormAmount('');
    setFormCurrency('PEN');
    setFormDesc('');
  };

  const handleSave = () => {
    const prov = providers.find(p => p.id === formProvider);
    const data = {
      day: parseInt(formDay),
      provider_id: formProvider,
      providerName: prov ? prov.name : 'Desconocido',
      amount: Number(formAmount) || 0,
      currency: formCurrency,
      description: formDesc,
    };
    if (isAdding) {
      addRecurrent(data);
    } else {
      updateRecurrent(editingItem.id, data);
    }
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      deleteRecurrent(editingItem.id);
      setEditingItem(null);
    }
  };

  const closeModal = () => { setEditingItem(null); setIsAdding(false); };

  // Resumen mensual
  // 1. Filtrar los pendientes (no pagados en el mes actual)
  const pendingRecurrents = recurrents.filter(r => !isRecurrentPaid(r.id, viewYear, viewMonth));
  const pendingPEN = pendingRecurrents.filter(r => r.currency !== 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);
  const pendingUSD = pendingRecurrents.filter(r => r.currency === 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);

  // 2. Filtrar los completados (pagados en el mes actual)
  const paidRecurrentsList = recurrents.filter(r => isRecurrentPaid(r.id, viewYear, viewMonth));
  const paidPEN = paidRecurrentsList.filter(r => r.currency !== 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);
  const paidUSD = paidRecurrentsList.filter(r => r.currency === 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);

  // 3. Totales generales programados
  const scheduledPEN = recurrents.filter(r => r.currency !== 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);
  const scheduledUSD = recurrents.filter(r => r.currency === 'USD').reduce((s, r) => s + Number(r.amount || 0), 0);

  const paidCount = paidRecurrentsList.length;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Pagos Recurrentes</h1>
          <p className="page-subtitle">Previsión mensual de facturación fija (Enlaces, Telefonía, Impresión).</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Agregar Recurrente
        </button>
      </div>

      <div className="calendar-wrapper">
        {/* Calendario */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Navegación de meses */}
          <div className="flex-between" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'capitalize' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <button className="btn btn-ghost" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Encabezados */}
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="calendar-header-cell">{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div className="calendar-grid">
            {Array.from({ length: emptyBefore }).map((_, i) => (
              <div key={`e-${i}`} className="calendar-cell empty" />
            ))}

            {days.map(day => {
              const dayNum = day.getDate();
              const bills = recurrents.filter(b => b.day === dayNum);
              const isPast = day < todayDate;
              const isTodayCell = isToday(day);

              return (
                <div key={day.toString()} className={`calendar-cell ${isTodayCell ? 'today' : ''}`}>
                  <span className="calendar-day-num">{dayNum}</span>

                  <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {bills.map(bill => {
                      const paid = isRecurrentPaid(bill.id, viewYear, viewMonth);
                      return (
                        <div
                          key={bill.id}
                          className={`calendar-event ${paid ? 'paid' : isPast ? 'overdue' : 'pending'}`}
                          onClick={(e) => openEdit(bill, e)}
                          title={paid ? 'Pagado' : isPast ? 'Vencido — clic para gestionar' : 'Pendiente — clic para gestionar'}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {bill.providerName}
                          </span>
                          {paid ? (
                            <CheckCircle size={11} />
                          ) : isPast ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <Edit2 size={10} opacity={0.5} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Resumen */}
        <div className="calendar-summary">
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--primary)' }}>Resumen Mensual</h3>
            
            {/* Total Pendiente (Lo que falta pagar) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--status-amarillo-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pendiente de Pago
              </div>
              <div style={{ fontSize: '1.625rem', fontWeight: '850', color: 'var(--text-main)', marginTop: '0.125rem' }}>
                {formatCurrency(pendingPEN)}
              </div>
              {pendingUSD > 0 && (
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  + {formatCurrency(pendingUSD, 'USD')}
                </div>
              )}
            </div>

            <div className="sidebar-divider" style={{ margin: '0.75rem 0', opacity: 0.3 }} />

            {/* Sub-totales adicionales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.625rem', color: 'var(--status-verde-text)', fontWeight: '700', textTransform: 'uppercase' }}>Pagado</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.125rem' }}>
                  {formatCurrency(paidPEN)}
                </div>
                {paidUSD > 0 && (
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {formatCurrency(paidUSD, 'USD')}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Programado</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.125rem' }}>
                  {formatCurrency(scheduledPEN)}
                </div>
                {scheduledUSD > 0 && (
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {formatCurrency(scheduledUSD, 'USD')}
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.875rem', fontWeight: '500' }}>
              {recurrents.length} pagos programados · {paidCount} pagados
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.75rem' }}>Pagos del Mes</h3>
            {recurrents
              .sort((a, b) => a.day - b.day)
              .map(r => {
                const paid = isRecurrentPaid(r.id, viewYear, viewMonth);
                return (
                  <div key={r.id} className="calendar-summary-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <button
                        onClick={() => toggleRecurrentPaid(r.id, viewYear, viewMonth)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        title={paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                      >
                        {paid ? (
                          <CheckCircle size={18} color="var(--status-verde-text)" />
                        ) : (
                          <Circle size={18} color="var(--text-muted)" />
                        )}
                      </button>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.8125rem', textDecoration: paid ? 'line-through' : 'none', color: paid ? 'var(--text-muted)' : 'var(--text-main)' }}>
                          {r.providerName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Día {r.day}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: paid ? 'var(--status-verde-text)' : 'var(--text-main)' }}>
                      {formatCurrency(r.amount, r.currency)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Modal Editar / Agregar */}
      {(editingItem || isAdding) && (
        <div className="overlay" onClick={closeModal}>
          <div className="slide-over" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {isAdding ? 'Nuevo Pago Recurrente' : 'Gestionar Recurrente'}
              </h2>
              <button className="btn btn-ghost" onClick={closeModal}><X size={22} /></button>
            </div>

            {/* Botón de marcar como pagado (solo en edición) */}
            {editingItem && (
              <div style={{ marginBottom: '1.5rem' }}>
                {(() => {
                  const paid = isRecurrentPaid(editingItem.id, viewYear, viewMonth);
                  return (
                    <button
                      className={`btn ${paid ? 'btn-outline' : 'btn-accent'}`}
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
                      onClick={() => toggleRecurrentPaid(editingItem.id, viewYear, viewMonth)}
                    >
                      {paid ? (
                        <><CheckCircle size={18} /> Pagado — Desmarcar</>
                      ) : (
                        <><Circle size={18} /> Marcar como Pagado</>
                      )}
                    </button>
                  );
                })()}
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.375rem' }}>
                  Para {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Día del Mes</label>
              <input type="number" min="1" max="31" className="form-input" value={formDay} onChange={e => setFormDay(e.target.value)} placeholder="Ej: 15" />
            </div>

            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select className="form-select" value={formProvider} onChange={e => setFormProvider(e.target.value)}>
                <option value="">Seleccione...</option>
                {providers.filter(p => p.type === 'fijo').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input type="number" className="form-input" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={formCurrency} onChange={e => setFormCurrency(e.target.value)}>
                  <option value="PEN">PEN (S/)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Concepto del pago" />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              {!isAdding && (
                <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ padding: '0.625rem' }}>
                  Eliminar
                </button>
              )}
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }} onClick={handleSave}>
                {isAdding ? 'Agregar' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
