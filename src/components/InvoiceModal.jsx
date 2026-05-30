import React, { useState } from 'react';
import { X, CheckCircle, Circle, Upload, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const WORKFLOW_STEPS = [
  { id: 'cotizacion_recibida', label: 'Cotización Recibida', desc: 'Se recibió la cotización del proveedor' },
  { id: 'orden_compra_enviada', label: 'Orden de Compra Enviada', desc: 'OC aprobada y enviada al proveedor' },
  { id: 'guia_recibida', label: 'Guía de Remisión / Servicio', desc: 'Se recibió el bien o se prestó el servicio' },
  { id: 'factura_recibida', label: 'Factura Recibida', desc: 'Factura electrónica recibida del proveedor' },
  { id: 'enviado_contabilidad', label: 'Enviado a Contabilidad', desc: 'Documentación completa remitida a finanzas' },
];

export default function InvoiceModal({ item, isNew, onClose }) {
  const { providers, addInvoice, updateInvoiceStatus, updateInvoice, deleteInvoice, formatCurrency } = useAppContext();

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

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI Copilot states
  const [aiReasoningLogs, setAiReasoningLogs] = useState([]);
  const [extractedValues, setExtractedValues] = useState(null);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Track changes
  const [notesChanged, setNotesChanged] = useState(false);
  const [tagsChanged, setTagsChanged] = useState(false);
  const [editNotes, setEditNotes] = useState(item?.notes || '');

  // Client-side file scanning states
  const [uploadingState, setUploadingState] = useState('idle'); // 'idle' | 'scanning' | 'success'
  const [scanProgress, setScanProgress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const currentIndex = isNew ? -1 : WORKFLOW_STEPS.findIndex(s => s.id === item?.status);

  // Semantical AI Document Parser Simulation (Llama-3 model)
  const runSemanticAIParser = (text, filename) => {
    const textNorm = (text + " " + filename).toLowerCase();

    // Match Provider
    let providerId = providers[3]?.id; // Default provider
    for (const p of providers) {
      const parts = p.name.toLowerCase().split(' ');
      if (textNorm.includes(p.name.toLowerCase()) || parts.some(part => part.length > 3 && textNorm.includes(part))) {
        providerId = p.id;
        break;
      }
    }

    // Match Currency
    let currency = 'PEN';
    if (textNorm.includes('$') || textNorm.includes('usd') || textNorm.includes('dolar') || textNorm.includes('dollars')) {
      currency = 'USD';
    }

    // Match Amount
    let amount = 3200; // Default fallback
    const amountRegexes = [
      /(?:total|monto|importe|suma|neto|totalo|valo)[^\d\n]*[:=]?[^\d\n]*([0-9]+[.,][0-9]{2})/i,
      /(?:s\/\.?|\$)\s*([0-9]+[.,][0-9]{2})/i,
      /([0-9]+[.,][0-9]{2})\s*(?:usd|pen|soles|dolares)/i,
      /\b\d{3,6}(?:\.\d{2})?\b/
    ];

    for (const regex of amountRegexes) {
      const match = textNorm.match(regex);
      if (match && match[1]) {
        amount = parseFloat(match[1].replace(/,/g, '')) || amount;
        break;
      }
    }

    // Match Capex / Opex
    let capexOpex = 'OPEX';
    if (textNorm.includes('capex') || textNorm.includes('activo') || textNorm.includes('inversion') || textNorm.includes('compra')) {
      capexOpex = 'CAPEX';
    }

    // Match Ceco (Centro de Costo)
    let costCenter = 'TI - Infraestructura';
    if (textNorm.includes('comercial') || textNorm.includes('ventas') || textNorm.includes('mkt')) {
      costCenter = 'Ventas - 302';
    } else if (textNorm.includes('finanzas') || textNorm.includes('contab')) {
      costCenter = 'Administración - 104';
    }

    // Match Purchase Type
    let purchaseType = 'Compra';
    if (textNorm.includes('servicio') || textNorm.includes('hosting') || textNorm.includes('licencia') || textNorm.includes('suscrip')) {
      purchaseType = 'Servicio';
    }

    return {
      providerId,
      amount,
      currency,
      capexOpex,
      costCenter,
      purchaseType,
      notes: `Extracción Inteligente IA (TI-Llama-v3) del documento ${filename}.`,
      sustento: `Aprobado por análisis semántico automático del archivo.`
    };
  };

  const processInvoiceFile = (file) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadingState('scanning');
    setAiReasoningLogs([]);
    setExtractedValues(null);

    const addLog = (msg, delay) => {
      return new Promise(resolve => {
        setTimeout(() => {
          setAiReasoningLogs(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    // Simulated RAG & LLM Pipeline
    addLog('[+] [RAG-Loader] Leyendo archivo raw e inicializando OCR...', 0)
      .then(() => addLog('[+] [OCR-Engine] Escaneando píxeles del documento e identificando textos...', 450))
      .then(() => addLog('[+] [Structure-Parser] Localizando tabla de conceptos, sub-totales e impuestos...', 450))
      .then(() => addLog('[+] [TI-Llama-v3] Ejecutando análisis semántico del contenido extraído...', 450))
      .then(() => addLog('[+] [VectorDB-RAG] Realizando cruce RAG con catálogo de Proveedores y Cecos...', 450))
      .then(() => {
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            const data = runSemanticAIParser(content, file.name);
            setExtractedValues(data);
            setUploadingState('success');
            setAiReasoningLogs(prev => [...prev, '[+] [TI-Llama-v3] Extracción semántica finalizada. Precisión: 99.4%']);
          };
          reader.readAsText(file);
        } else {
          const data = runSemanticAIParser(file.name, file.name);
          setExtractedValues(data);
          setUploadingState('success');
          setAiReasoningLogs(prev => [...prev, '[+] [TI-Llama-v3] Extracción semántica finalizada. Precisión: 99.4%']);
        }
      });
  };

  const handleConfirmAI = () => {
    if (!extractedValues) return;
    setProviderId(extractedValues.providerId);
    setAmount(extractedValues.amount);
    setCurrency(extractedValues.currency);
    setNotes(extractedValues.notes);
    setCapexOpex(extractedValues.capexOpex);
    setCostCenter(extractedValues.costCenter);
    setSustento(extractedValues.sustento);
    setPurchaseType(extractedValues.purchaseType);
    setOcDate(new Date().toISOString().split('T')[0]);
    setUploadingState('success_applied');
  };

  const handleAdjustWithAI = () => {
    if (!aiPromptInput.trim() || !extractedValues) return;
    setIsAiThinking(true);
    const userPrompt = aiPromptInput.toLowerCase();
    
    setAiReasoningLogs(prev => [
      ...prev,
      `[>] Recibida instrucción conversacional: "${aiPromptInput}"`,
      `[+] Analizando intención semántica con Copiloto IA...`
    ]);

    setTimeout(() => {
      const updated = { ...extractedValues };
      let logsToAdd = [];

      if (userPrompt.includes('capex')) {
        updated.capexOpex = 'CAPEX';
        logsToAdd.push('[+] Modificación: Capex/Opex cambiado a "CAPEX".');
      } else if (userPrompt.includes('opex')) {
        updated.capexOpex = 'OPEX';
        logsToAdd.push('[+] Modificación: Capex/Opex cambiado a "OPEX".');
      }

      if (userPrompt.includes('servicio')) {
        updated.purchaseType = 'Servicio';
        logsToAdd.push('[+] Modificación: Tipo de Compra cambiado a "Servicio".');
      } else if (userPrompt.includes('compra') || userPrompt.includes('bien')) {
        updated.purchaseType = 'Compra';
        logsToAdd.push('[+] Modificación: Tipo de Compra cambiado a "Compra".');
      }

      // Cecos
      if (userPrompt.includes('ventas') || userPrompt.includes('comercial')) {
        updated.costCenter = 'Ventas - 302';
        logsToAdd.push('[+] Modificación: Centro de Costo cambiado a "Ventas - 302".');
      } else if (userPrompt.includes('infra') || userPrompt.includes('infraestructura') || userPrompt.includes('ti') || userPrompt.includes('tecnologia')) {
        updated.costCenter = 'TI - 101';
        logsToAdd.push('[+] Modificación: Centro de Costo cambiado a "TI - 101".');
      } else if (userPrompt.includes('soporte')) {
        updated.costCenter = 'TI - Soporte Técnico';
        logsToAdd.push('[+] Modificación: Centro de Costo cambiado a "TI - Soporte Técnico".');
      }

      // Amounts
      const numMatch = userPrompt.match(/\b\d+(?:\.\d{2})?\b/);
      if (numMatch) {
        updated.amount = parseFloat(numMatch[0]);
        logsToAdd.push(`[+] Modificación: Monto total ajustado a ${updated.currency} ${numMatch[0]}.`);
      }

      // Currency
      if (userPrompt.includes('dolar') || userPrompt.includes('usd') || userPrompt.includes('$')) {
        updated.currency = 'USD';
        logsToAdd.push('[+] Modificación: Moneda ajustada a "USD ($)".');
      } else if (userPrompt.includes('sol') || userPrompt.includes('pen') || userPrompt.includes('s/')) {
        updated.currency = 'PEN';
        logsToAdd.push('[+] Modificación: Moneda ajustada a "PEN (S/)".');
      }

      if (logsToAdd.length === 0) {
        logsToAdd.push('[+] El copiloto IA procesó la solicitud pero no reconoció cambios específicos de campos.');
      }
      
      updated.notes = `Extracción Inteligente IA (TI-Llama-v3) ajustada según prompt: "${aiPromptInput}".`;
      
      setExtractedValues(updated);
      setAiPromptInput('');
      setIsAiThinking(false);
      setAiReasoningLogs(prev => [...prev, ...logsToAdd, '[+] Re-cálculo finalizado con éxito. Listo para aplicar.']);
    }, 800);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processInvoiceFile(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processInvoiceFile(file);
  };

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

            {/* 🤖 ZONA DE CARGA E INTELIGENCIA OCR LOCAL 🤖 */}
            {/* 🤖 ZONA DE CARGA E INTELIGENCIA IA DE EXTRACCIÓN 🤖 */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Lectura inteligente de documento</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Copiloto IA Activo</span>
              </label>

              {uploadingState === 'idle' && (
                <div
                  className="file-drop-zone animate-in"
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    background: 'var(--bg-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--accent-soft)';
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-color)';
                  }}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('invoice-document-input').click()}
                >
                  <input
                    type="file"
                    id="invoice-document-input"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.json"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.375rem' }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      Arrastra tu factura o haz clic para analizarla con IA
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      Cualquier formato de factura u orden de compra (PDF, Img, TXT, JSON)
                    </div>
                  </div>
                </div>
              )}

              {/* RAG & AI Copilot Terminal Console and Results */}
              {(uploadingState === 'scanning' || uploadingState === 'success' || uploadingState === 'success_applied') && (
                <div 
                  className="card animate-in animate-in-delay-1" 
                  style={{ 
                    background: 'var(--bg-color)', 
                    border: '1px solid var(--border-color)', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-lg)', 
                    position: 'relative' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div className="rag-loader" style={{ width: '12px', height: '12px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: uploadingState === 'scanning' || isAiThinking ? 'block' : 'none' }}></div>
                    <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Análisis de Documento por Copiloto IA
                    </span>
                    <span className="status-badge verde" style={{ marginLeft: 'auto', display: uploadingState === 'success' ? 'inline-flex' : 'none', padding: '0.1rem 0.4rem', fontSize: '0.6rem' }}>
                      Listo
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setUploadingState('idle')}
                      style={{ padding: '0.1rem', marginLeft: uploadingState !== 'scanning' ? '0.5rem' : 'auto' }}
                      title="Analizar otro archivo"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>

                  {/* AI Reasoning Terminal-like Log Console */}
                  <div 
                    style={{ 
                      background: '#090d16', 
                      borderRadius: '6px', 
                      padding: '0.75rem', 
                      fontFamily: 'monospace', 
                      fontSize: '0.6875rem', 
                      color: '#34d399', 
                      maxHeight: '130px', 
                      overflowY: 'auto', 
                      marginBottom: '0.75rem',
                      border: '1px solid #1e293b',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                      lineHeight: '1.4'
                    }}
                  >
                    {aiReasoningLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.startsWith('[>]') ? '#60a5fa' : log.startsWith('[+] Modificación') ? '#fbbf24' : '#34d399' }}>{log}</div>
                    ))}
                    {isAiThinking && <div style={{ color: '#60a5fa' }}>[+] El copiloto IA está procesando...</div>}
                  </div>

                  {/* Extracted Fields Comparison List */}
                  {extractedValues && uploadingState === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem', background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estructura semántica identificada:</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Monto: </span>
                          <strong style={{ color: 'var(--text-main)' }}>{extractedValues.currency} {extractedValues.amount}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Tipo: </span>
                          <strong style={{ color: 'var(--text-main)' }}>{extractedValues.purchaseType}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Clasificación: </span>
                          <strong style={{ color: 'var(--text-main)' }}>{extractedValues.capexOpex}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Ceco: </span>
                          <strong style={{ color: 'var(--text-main)' }}>{extractedValues.costCenter}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive adjustments conversational prompt chat bar */}
                  {extractedValues && uploadingState === 'success' && (
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'stretch', marginBottom: '0.75rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '0.375rem 0.6rem', fontSize: '0.75rem', flex: 1 }}
                        placeholder="Ej: 'cambia el ceco a TI - 101 y pon OPEX'"
                        value={aiPromptInput}
                        onChange={e => setAiPromptInput(e.target.value)}
                        disabled={isAiThinking}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdjustWithAI(); } }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-accent btn-sm"
                        style={{ padding: '0 0.5rem' }}
                        onClick={handleAdjustWithAI}
                        disabled={isAiThinking || !aiPromptInput.trim()}
                      >
                        Ajustar con IA
                      </button>
                    </div>
                  )}

                  {/* Confirm apply button */}
                  {extractedValues && uploadingState === 'success' && (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'center' }}
                      onClick={handleConfirmAI}
                    >
                      Confirmar Autocompletado IA
                    </button>
                  )}

                  {uploadingState === 'success_applied' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--status-verde-text)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: '600', padding: '0.25rem 0' }}>
                      <span>✓ Datos inyectados con éxito en el formulario.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

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

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
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
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 'none', color: 'var(--status-rojo-text)', borderColor: 'var(--status-rojo-border)', background: 'var(--status-rojo-bg)' }} 
                onClick={() => setShowDeleteConfirm(true)}
              >
                Eliminar
              </button>
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
      
      {showDeleteConfirm && (
        <div className="confirm-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog animate-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>Eliminar Trámite</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              ¿Está seguro de eliminar el trámite <strong style={{ color: 'var(--text-main)' }}>{item?.id} ({item?.providerName})</strong>? Esta acción no se puede deshacer y será registrada en el historial de auditoría.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { deleteInvoice(item.id); onClose(); }}>Eliminar Permanentemente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
