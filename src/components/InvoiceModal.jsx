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

  const [providerId, setProviderId] = useState(item?.provider_id || '');
  const [amount, setAmount] = useState(item?.amount || '');
  const [currency, setCurrency] = useState(item?.currency || 'PEN');
  const [type, setType] = useState(item?.type || 'ocasional');
  const [notes, setNotes] = useState(item?.notes || '');

  // Occasional purchase tags
  const [capexOpex, setCapexOpex] = useState(item?.capexOpex || 'CAPEX');
  const [purchaseType, setPurchaseType] = useState(item?.purchaseType || 'Compra');
  const [sustento, setSustento] = useState(item?.sustento || '');
  const [ocNumber, setOcNumber] = useState(item?.ocNumber || '');
  const [costCenter, setCostCenter] = useState(item?.costCenter || '');
  const [ocDate, setOcDate] = useState(item?.ocDate ? item.ocDate.split('T')[0] : '');
  const [ocAmount, setOcAmount] = useState(item?.ocAmount || '');
  const [motivo, setMotivo] = useState(item?.motivo || '');
  const [invoiceNumber, setInvoiceNumber] = useState(item?.invoiceNumber || '');
  const [invoiceDate, setInvoiceDate] = useState(item?.invoiceDate ? item.invoiceDate.split('T')[0] : '');
  const [invoiceAmount, setInvoiceAmount] = useState(item?.invoiceAmount || '');
  const [accountingSentDate, setAccountingSentDate] = useState(item?.accountingSentDate ? item.accountingSentDate.split('T')[0] : '');

  // Track changes
  const [notesChanged, setNotesChanged] = useState(false);
  const [tagsChanged, setTagsChanged] = useState(false);
  const [editNotes, setEditNotes] = useState(item?.notes || '');

  const currentIndex = isNew ? -1 : WORKFLOW_STEPS.findIndex(s => s.id === item?.status);

  const handleCreate = () => {
    if (!providerId || !amount) return;
    addInvoice({ 
      provider_id: providerId, 
      amount: Number(amount), 
      currency, 
      type, 
      notes,
      // tags
      capexOpex: type === 'ocasional' ? capexOpex : '',
      purchaseType: type === 'ocasional' ? purchaseType : '',
      sustento: type === 'ocasional' ? sustento : '',
      ocNumber: type === 'ocasional' ? ocNumber : '',
      costCenter: type === 'ocasional' ? costCenter : '',
      ocDate: type === 'ocasional' && ocDate ? new Date(ocDate).toISOString() : '',
      ocAmount: type === 'ocasional' && ocAmount ? Number(ocAmount) : 0,
      motivo: type === 'ocasional' ? motivo : '',
      invoiceNumber: '',
      invoiceDate: '',
      invoiceAmount: 0,
      accountingSentDate: ''
    });
    onClose();
  };

  const handleAdvance = () => {
    let extraData = {};
    if (item.type === 'ocasional') {
      const nextStep = WORKFLOW_STEPS[currentIndex + 1]?.id;
      const todayStr = new Date().toISOString().split('T')[0];
      
      let tempOcDate = ocDate;
      let tempInvoiceDate = invoiceDate;
      let tempAccountingSentDate = accountingSentDate;

      if (nextStep === 'orden_compra_enviada' && !ocDate) {
        extraData.ocDate = new Date().toISOString();
        tempOcDate = todayStr;
        setOcDate(todayStr);
      }
      if (nextStep === 'factura_recibida' && !invoiceDate) {
        extraData.invoiceDate = new Date().toISOString();
        tempInvoiceDate = todayStr;
        setInvoiceDate(todayStr);
      }
      if (nextStep === 'enviado_contabilidad' && !accountingSentDate) {
        extraData.accountingSentDate = new Date().toISOString();
        tempAccountingSentDate = todayStr;
        setAccountingSentDate(todayStr);
      }

      // Save all current local fields on advance
      extraData = {
        ...extraData,
        capexOpex,
        purchaseType,
        sustento,
        ocNumber,
        costCenter,
        ocDate: tempOcDate ? new Date(tempOcDate).toISOString() : '',
        ocAmount: ocAmount ? Number(ocAmount) : 0,
        motivo,
        invoiceNumber,
        invoiceDate: tempInvoiceDate ? new Date(tempInvoiceDate).toISOString() : '',
        invoiceAmount: invoiceAmount ? Number(invoiceAmount) : 0,
        accountingSentDate: tempAccountingSentDate ? new Date(tempAccountingSentDate).toISOString() : ''
      };
    }

    if (notesChanged) {
      extraData.notes = editNotes;
      setNotesChanged(false);
    }

    if (Object.keys(extraData).length > 0) {
      updateInvoice(item.id, extraData);
    }

    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      updateInvoiceStatus(item.id, WORKFLOW_STEPS[currentIndex + 1].id);
      onClose();
    }
  };

  const handleRevert = () => {
    let extraData = {};
    if (notesChanged) {
      extraData.notes = editNotes;
      setNotesChanged(false);
    }
    if (tagsChanged && item.type === 'ocasional') {
      extraData = {
        ...extraData,
        capexOpex,
        purchaseType,
        sustento,
        ocNumber,
        costCenter,
        ocDate: ocDate ? new Date(ocDate).toISOString() : '',
        ocAmount: ocAmount ? Number(ocAmount) : 0,
        motivo,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : '',
        invoiceAmount: invoiceAmount ? Number(invoiceAmount) : 0,
        accountingSentDate: accountingSentDate ? new Date(accountingSentDate).toISOString() : ''
      };
      setTagsChanged(false);
    }

    if (Object.keys(extraData).length > 0) {
      updateInvoice(item.id, extraData);
    }

    if (currentIndex > 0) {
      updateInvoiceStatus(item.id, WORKFLOW_STEPS[currentIndex - 1].id);
      onClose();
    }
  };

  const handleSaveNotes = () => {
    updateInvoice(item.id, { notes: editNotes });
    setNotesChanged(false);
  };

  const handleSaveTags = () => {
    updateInvoice(item.id, {
      capexOpex,
      purchaseType,
      sustento,
      ocNumber,
      costCenter,
      ocDate: ocDate ? new Date(ocDate).toISOString() : '',
      ocAmount: ocAmount ? Number(ocAmount) : 0,
      motivo,
      invoiceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : '',
      invoiceAmount: invoiceAmount ? Number(invoiceAmount) : 0,
      accountingSentDate: accountingSentDate ? new Date(accountingSentDate).toISOString() : ''
    });
    setTagsChanged(false);
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
                <label className="form-label">Monto inicial aproximado</label>
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
              <label className="form-label">Tipo de Trámite</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="ocasional">Ocasional (Compra única con etiquetas)</option>
                <option value="recurrente">Recurrente (Mensual/fijo)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notas / Observaciones iniciales</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descripción breve del trámite..." />
            </div>

            {/* Ocasional tags in creation */}
            {type === 'ocasional' && (
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Datos iniciales de la Compra Ocasional
                </div>
                
                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Capex / Opex</label>
                    <select className="form-select" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={capexOpex} onChange={e => setCapexOpex(e.target.value)}>
                      <option value="CAPEX">CAPEX</option>
                      <option value="OPEX">OPEX</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Tipo Compra</label>
                    <select className="form-select" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={purchaseType} onChange={e => setPurchaseType(e.target.value)}>
                      <option value="Compra">Compra</option>
                      <option value="Servicio">Servicio</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Nro. OC (Opcional)</label>
                    <input type="text" className="form-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={ocNumber} onChange={e => setOcNumber(e.target.value)} placeholder="OC-XXXX" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Centro de Costo</label>
                    <input type="text" className="form-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={costCenter} onChange={e => setCostCenter(e.target.value)} placeholder="Ceco-XXX" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Monto OC (Opcional)</label>
                    <input type="number" className="form-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={ocAmount} onChange={e => setOcAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Fecha emisión OC</label>
                    <input type="date" className="form-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={ocDate} onChange={e => setOcDate(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Sustento de compra</label>
                  <input type="text" className="form-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} value={sustento} onChange={e => setSustento(e.target.value)} placeholder="Justificación comercial/TI..." />
                </div>
                
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Motivo detallado</label>
                  <textarea className="form-textarea" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', minHeight: '50px' }} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Detallar motivo..." />
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
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

            {/* Occasional purchase tracking tags section */}
            {item.type === 'ocasional' && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)' }}>Etiquetas de Compra Ocasional</h4>
                  {tagsChanged && (
                    <button className="btn btn-primary btn-sm animate-in" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleSaveTags}>
                      Guardar Etiquetas
                    </button>
                  )}
                </div>
                
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Capex / Opex</label>
                    <select className="form-select" value={capexOpex} onChange={e => { setCapexOpex(e.target.value); setTagsChanged(true); }}>
                      <option value="CAPEX">CAPEX</option>
                      <option value="OPEX">OPEX</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo Compra</label>
                    <select className="form-select" value={purchaseType} onChange={e => { setPurchaseType(e.target.value); setTagsChanged(true); }}>
                      <option value="Compra">Compra</option>
                      <option value="Servicio">Servicio</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Nro. OC</label>
                    <input type="text" className="form-input" value={ocNumber} onChange={e => { setOcNumber(e.target.value); setTagsChanged(true); }} placeholder="OC-XXXX" />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Centro de Costo</label>
                    <input type="text" className="form-input" value={costCenter} onChange={e => { setCostCenter(e.target.value); setTagsChanged(true); }} placeholder="Ceco-XXX" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Monto OC</label>
                    <input type="number" className="form-input" value={ocAmount} onChange={e => { setOcAmount(e.target.value); setTagsChanged(true); }} placeholder="0.00" />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Fecha OC</label>
                    <input type="date" className="form-input" value={ocDate} onChange={e => { setOcDate(e.target.value); setTagsChanged(true); }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Sustento de compra</label>
                  <input type="text" className="form-input" value={sustento} onChange={e => { setSustento(e.target.value); setTagsChanged(true); }} placeholder="Sustento comercial/TI..." />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Motivo</label>
                  <textarea className="form-textarea" style={{ minHeight: '50px', fontSize: '0.8125rem' }} value={motivo} onChange={e => { setMotivo(e.target.value); setTagsChanged(true); }} placeholder="Motivo de la compra..." />
                </div>

                {/* Billing and Accounting Sub-Card */}
                <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginTop: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Datos de Facturación / Contabilidad
                  </div>
                  
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Nro. Factura</label>
                      <input type="text" className="form-input" style={{ padding: '0.375rem 0.5rem' }} value={invoiceNumber} onChange={e => { setInvoiceNumber(e.target.value); setTagsChanged(true); }} placeholder="FC-XXXX" />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Monto Facturado</label>
                      <input type="number" className="form-input" style={{ padding: '0.375rem 0.5rem' }} value={invoiceAmount} onChange={e => { setInvoiceAmount(e.target.value); setTagsChanged(true); }} placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Fecha Facturación</label>
                      <input type="date" className="form-input" style={{ padding: '0.375rem 0.5rem' }} value={invoiceDate} onChange={e => { setInvoiceDate(e.target.value); setTagsChanged(true); }} />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Enviado a Contabilidad</label>
                      <input type="date" className="form-input" style={{ padding: '0.375rem 0.5rem' }} value={accountingSentDate} onChange={e => { setAccountingSentDate(e.target.value); setTagsChanged(true); }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
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
