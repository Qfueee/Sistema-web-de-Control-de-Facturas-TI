import React, { useState } from 'react';
import { X, CheckCircle, Circle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const WORKFLOW_STEPS = [
  { id: 'cotizacion_recibida', label: 'Cotización Recibida', desc: 'Se recibió la cotización del proveedor' },
  { id: 'orden_compra_enviada', label: 'Orden de Compra Enviada', desc: 'OC aprobada y enviada al proveedor' },
  { id: 'guia_recibida', label: 'Guía de Remisión / Servicio', desc: 'Se recibió el bien o se prestó el servicio' },
  { id: 'factura_recibida', label: 'Factura Recibida', desc: 'Factura electrónica recibida del proveedor' },
  { id: 'enviado_contabilidad', label: 'Enviado a Contabilidad', desc: 'Documentación completa remitida a finanzas' },
];

export default function InvoiceModal({ item, isNew, onClose }) {
  const { providers, addInvoice, updateInvoiceStatus, updateInvoice, formatCurrency } = useAppContext();

  const [providerId, setProviderId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [type, setType] = useState('ocasional');
  const [notes, setNotes] = useState('');

  // Edición de notas en detalle
  const [editNotes, setEditNotes] = useState(item?.notes || '');
  const [notesChanged, setNotesChanged] = useState(false);

  const currentIndex = isNew ? -1 : WORKFLOW_STEPS.findIndex(s => s.id === item?.status);

  const handleCreate = () => {
    if (!providerId || !amount) return;
    addInvoice({ provider_id: providerId, amount: Number(amount), currency, type, notes });
    onClose();
  };

  const handleAdvance = () => {
    if (notesChanged) updateInvoice(item.id, { notes: editNotes });
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      updateInvoiceStatus(item.id, WORKFLOW_STEPS[currentIndex + 1].id);
      onClose();
    }
  };

  const handleRevert = () => {
    if (notesChanged) updateInvoice(item.id, { notes: editNotes });
    if (currentIndex > 0) {
      updateInvoiceStatus(item.id, WORKFLOW_STEPS[currentIndex - 1].id);
      onClose();
    }
  };

  const handleSaveNotes = () => {
    updateInvoice(item.id, { notes: editNotes });
    setNotesChanged(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-over" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {isNew ? 'Nuevo Trámite' : 'Detalle de Trámite'}
          </h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={22} /></button>
        </div>

        {isNew ? (
          /* ═══ FORMULARIO CREACIÓN ═══ */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select className="form-select" value={providerId} onChange={e => setProviderId(e.target.value)}>
                <option value="">Seleccione un proveedor</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="PEN">PEN (S/)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="ocasional">Ocasional</option>
                <option value="recurrente">Recurrente</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notas / Observaciones</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descripción breve del trámite..." />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Crear Trámite</button>
            </div>
          </div>
        ) : (
          /* ═══ DETALLE + WORKFLOW ═══ */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Info del trámite */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.id} · {item.type === 'recurrente' ? 'Recurrente' : 'Ocasional'}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>{item.providerName}</h3>
              <p style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: '0.375rem' }}>
                {formatCurrency(item.amount, item.currency)}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Ingresado: {new Date(item.date).toLocaleDateString('es-PE')}
              </p>
            </div>

            {/* Workflow Stepper */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Progreso del Trámite</label>
              <div className="workflow-stepper" style={{ marginTop: '0.75rem' }}>
                {WORKFLOW_STEPS.map((step, index) => {
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  return (
                    <div key={step.id} className={`workflow-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="workflow-dot">
                        {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                      </div>
                      <div>
                        <div className="workflow-label">{step.label}</div>
                        {isCurrent && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{step.desc}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea
                className="form-textarea"
                value={editNotes}
                onChange={e => { setEditNotes(e.target.value); setNotesChanged(true); }}
                placeholder="Agregar observaciones..."
              />
              {notesChanged && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }} onClick={handleSaveNotes}>
                  Guardar notas
                </button>
              )}
            </div>

            {/* Acciones */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleRevert} disabled={currentIndex === 0}>
                Retroceder
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleAdvance}
                disabled={currentIndex === WORKFLOW_STEPS.length - 1}
              >
                {currentIndex === WORKFLOW_STEPS.length - 2 ? 'Enviar a Contabilidad' : 'Avanzar Estado'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
