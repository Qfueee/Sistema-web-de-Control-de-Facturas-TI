import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Send, X, MessageSquare, RotateCcw, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MONTHS_MAP = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const SUGGESTIONS = [
  "¿Qué órdenes de compra están abiertas?",
  "¿Cuál es la diferencia entre CAPEX y OPEX en monto?",
  "¿Cuáles son nuestros pagos recurrentes fijos?",
  "¿Qué trámites tenemos registrados en mayo?"
];

export default function AICopilot() {
  const { invoices, providers, recurrents, formatCurrency } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "¡Hola! Soy tu **Asistente Inteligente de Facturación TI** ¿En qué puedo ayudarte hoy :)?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ragStatus, setRagStatus] = useState('');

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Remove accents and normalize query
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?.,!]/g, "");
  };

  // Local RAG engine
  const processQuery = (rawQuery) => {
    const q = normalizeText(rawQuery);

    // 1. SCOPE VALIDATION (Check if the question is related to TI invoices/financials/providers)
    const financialKeywords = [
      'factura', 'compra', 'orden', 'oc', 'pago', 'costo', 'ceco', 'centro de costo',
      'proveedor', 'capex', 'opex', 'gasto', 'recurrente', 'tramite', 'presupuesto',
      'dolar', 'sol', 'dinero', 'moneda', 'cuenta', 'limite', 'contrato', 'finanzas',
      'contabilidad', 'contabilizado'
    ];

    // Compiling provider names as keywords
    const providerNames = providers.map(p => normalizeText(p.name));
    const isProviderMentioned = providerNames.some(name => q.includes(name) || name.split(' ').some(part => part.length > 3 && q.includes(part)));
    const hasFinancialKeyword = financialKeywords.some(keyword => q.includes(keyword));

    if (!hasFinancialKeyword && !isProviderMentioned && !q.includes('resumen') && !q.includes('hola') && !q.includes('ayuda')) {
      return {
        ragMessage: "Búsqueda RAG finalizada: Consulta fuera de ámbito.",
        response: "Hola. Soy el **Asistente Inteligente de Facturación TI**.\n\nEstoy entrenado *exclusivamente* para responder consultas sobre los trámites, facturas, presupuestos **CAPEX/OPEX**, centros de costo y proveedores registrados en esta plataforma.\n\nPor favor, realiza una pregunta relacionada con la facturación de TI (por ejemplo: *'¿Cuántas compras CAPEX tenemos?'* o *'¿Cuál es el estado de Ricoh?'*)."
      };
    }

    // 2. INTENT CLASSIFICATION & DATA RETRIEVAL (RAG)

    // A. Recurrent payments intent
    if (q.includes('recurrente') || q.includes('fijo') || q.includes('mensual') || q.includes('servicios fijos')) {
      const activeRecurrents = recurrents;
      const totalRecurrentPEN = activeRecurrents.filter(r => r.currency === 'PEN').reduce((sum, r) => sum + Number(r.amount), 0);
      const totalRecurrentUSD = activeRecurrents.filter(r => r.currency === 'USD').reduce((sum, r) => sum + Number(r.amount), 0);

      let breakdown = activeRecurrents.map(r => `*   **${r.providerName}**: ${formatCurrency(r.amount, r.currency)} (Día ${r.day}) - *${r.description || ''}*`).join('\n');

      return {
        ragMessage: `RAG: Recuperados ${activeRecurrents.length} pagos recurrentes fijos.`,
        response: `Contamos con **${activeRecurrents.length} servicios recurrentes fijos** registrados mensualmente para el área de TI:\n\n${breakdown}\n\n**Monto Total Fijo Estimado al Mes**:\n*   Soles: **${formatCurrency(totalRecurrentPEN, 'PEN')}**\n*   Dólares: **${formatCurrency(totalRecurrentUSD, 'USD')}**`
      };
    }

    // B. Month-specific query intent
    let matchedMonth = null;
    let matchedMonthNum = null;
    for (const [monthName, index] of Object.entries(MONTHS_MAP)) {
      if (q.includes(monthName)) {
        matchedMonth = monthName;
        matchedMonthNum = index;
        break;
      }
    }

    if (matchedMonth !== null) {
      const matches = invoices.filter(inv => {
        const dateObj = new Date(inv.date);
        const ocDateObj = inv.ocDate ? new Date(inv.ocDate) : null;
        const invDateObj = inv.invoiceDate ? new Date(inv.invoiceDate) : null;

        return dateObj.getMonth() === matchedMonthNum ||
          (ocDateObj && ocDateObj.getMonth() === matchedMonthNum) ||
          (invDateObj && invDateObj.getMonth() === matchedMonthNum);
      });

      const capexInMonth = matches.filter(inv => inv.capexOpex === 'CAPEX');
      const opexInMonth = matches.filter(inv => inv.capexOpex === 'OPEX');

      const sumPEN = matches.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
      const sumUSD = matches.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);

      const itemsList = matches.map(inv => `*   **${inv.id}** (${inv.providerName}): ${formatCurrency(inv.amount, inv.currency)} - *${STATUS_LABELS_SHORT[inv.status] || inv.status}*`).join('\n');

      if (matches.length === 0) {
        return {
          ragMessage: `RAG: 0 registros encontrados para el mes de ${matchedMonth}.`,
          response: `No he encontrado ninguna facturación o trámite registrado específicamente para el mes de **${matchedMonth.toUpperCase()}**.`
        };
      }

      return {
        ragMessage: `RAG: Recuperadas ${matches.length} facturas para el mes de ${matchedMonth}.`,
        response: `En el mes de **${matchedMonth.charAt(0).toUpperCase() + matchedMonth.slice(1)}** registramos **${matches.length} trámites** de facturación TI:\n\n${itemsList}\n\n**Resumen Financiero del Mes**:\n*   Cantidad CAPEX: **${capexInMonth.length}** | Cantidad OPEX: **${opexInMonth.length}**\n*   Total Soles del mes: **${formatCurrency(sumPEN, 'PEN')}**\n*   Total Dólares del mes: **${formatCurrency(sumUSD, 'USD')}**`
      };
    }

    // C. Provider-specific intent
    let matchedProvider = null;
    for (const p of providers) {
      const pNameNorm = normalizeText(p.name);
      if (q.includes(pNameNorm) || pNameNorm.split(' ').some(part => part.length > 3 && q.includes(part))) {
        matchedProvider = p;
        break;
      }
    }

    if (matchedProvider) {
      const provInvoices = invoices.filter(inv => inv.provider_id === matchedProvider.id);
      const pendingInvoices = provInvoices.filter(inv => inv.status !== 'enviado_contabilidad');

      const sumPEN = provInvoices.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
      const sumUSD = provInvoices.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);

      let pendingList = pendingInvoices.map(inv => `*   **${inv.id}**: ${formatCurrency(inv.amount, inv.currency)} - Estado actual: *${STATUS_LABELS_SHORT[inv.status] || inv.status}*`).join('\n');

      return {
        ragMessage: `RAG: Recuperados ${provInvoices.length} trámites para ${matchedProvider.name}.`,
        response: `Para el proveedor **${matchedProvider.name}** (RUC: ${matchedProvider.ruc || 'N/A'}), tenemos **${provInvoices.length} trámites registrados** en el sistema:\n\n**Monto Acumulado (Histórico)**:\n*   Soles (PEN): **${formatCurrency(sumPEN, 'PEN')}**\n*   Dólares (USD): **${formatCurrency(sumUSD, 'USD')}**\n\n**Trámites Pendientes de Pago (${pendingInvoices.length})**:\n${pendingInvoices.length > 0 ? pendingList : '*¡Todo está al día! No hay pagos pendientes para este proveedor.*'}`
      };
    }

    // D. CAPEX / OPEX statistics intent
    if (q.includes('capex') || q.includes('opex')) {
      const isCapex = q.includes('capex');
      const isOpex = q.includes('opex');

      let responseText = '';
      let ragLog = '';

      if (isCapex && !isOpex) {
        const capexItems = invoices.filter(inv => inv.capexOpex === 'CAPEX');
        const sumPEN = capexItems.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const sumUSD = capexItems.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const list = capexItems.map(inv => `*   **${inv.id}** (${inv.providerName}): ${formatCurrency(inv.amount, inv.currency)} - *${STATUS_LABELS_SHORT[inv.status] || inv.status}*`).join('\n');

        ragLog = `RAG: ${capexItems.length} registros CAPEX recuperados.`;
        responseText = `Hemos registrado **${capexItems.length} compras de tipo CAPEX (Inversión en activos)** en la plataforma:\n\n${list}\n\n**Total Acumulado en CAPEX**:\n*   Soles: **${formatCurrency(sumPEN, 'PEN')}**\n*   Dólares: **${formatCurrency(sumUSD, 'USD')}**`;
      } else if (isOpex && !isCapex) {
        const opexItems = invoices.filter(inv => inv.capexOpex === 'OPEX');
        const sumPEN = opexItems.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const sumUSD = opexItems.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const list = opexItems.map(inv => `*   **${inv.id}** (${inv.providerName}): ${formatCurrency(inv.amount, inv.currency)} - *${STATUS_LABELS_SHORT[inv.status] || inv.status}*`).join('\n');

        ragLog = `RAG: ${opexItems.length} registros OPEX recuperados.`;
        responseText = `Hemos registrado **${opexItems.length} compras de tipo OPEX (Gasto operativo/corriente)** en la plataforma:\n\n${list}\n\n**Total Acumulado en OPEX**:\n*   Soles: **${formatCurrency(sumPEN, 'PEN')}**\n*   Dólares: **${formatCurrency(sumUSD, 'USD')}**`;
      } else {
        // Both CAPEX and OPEX compared
        const capexItems = invoices.filter(inv => inv.capexOpex === 'CAPEX');
        const opexItems = invoices.filter(inv => inv.capexOpex === 'OPEX');

        const capexPEN = capexItems.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const capexUSD = capexItems.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);

        const opexPEN = opexItems.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const opexUSD = opexItems.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);

        ragLog = `RAG: Comparación CAPEX vs OPEX calculada.`;
        responseText = `**Comparativa de Presupuesto TI (CAPEX vs OPEX)**:\n\n*   **CAPEX** (Inversión de Activos): **${capexItems.length} trámites**\n    *   Soles: **${formatCurrency(capexPEN, 'PEN')}**\n    *   Dólares: **${formatCurrency(capexUSD, 'USD')}**\n\n*   **OPEX** (Gasto Operativo): **${opexItems.length} trámites**\n    *   Soles: **${formatCurrency(opexPEN, 'PEN')}**\n    *   Dólares: **${formatCurrency(opexUSD, 'USD')}**\n\n**Diferencia Absoluta**:\n*   Soles: **${formatCurrency(Math.abs(capexPEN - opexPEN), 'PEN')}**\n*   Dólares: **${formatCurrency(Math.abs(capexUSD - opexUSD), 'USD')}**`;
      }

      return { ragMessage: ragLog, response: responseText };
    }

    // E. Open / Pending Orders (cuantas ordenes abiertas, tramites activos)
    if (q.includes('abierta') || q.includes('pendiente') || q.includes('activo') || q.includes('curso') || q.includes('progreso') || q.includes('abiertas') || q.includes('sin pagar')) {
      const activeInvoices = invoices.filter(inv => inv.status !== 'enviado_contabilidad');

      const coti = activeInvoices.filter(i => i.status === 'cotizacion_recibida').length;
      const oc = activeInvoices.filter(i => i.status === 'orden_compra_enviada').length;
      const guia = activeInvoices.filter(i => i.status === 'guia_recibida').length;
      const fact = activeInvoices.filter(i => i.status === 'factura_recibida').length;

      const topThree = activeInvoices.slice(0, 3).map(i => `*   **${i.id}** (${i.providerName}): ${formatCurrency(i.amount, i.currency)} - *${STATUS_LABELS_SHORT[i.status] || i.status}*`).join('\n');

      return {
        ragMessage: `RAG: ${activeInvoices.length} trámites activos recuperados.`,
        response: `Actualmente tenemos **${activeInvoices.length} órdenes y trámites abiertos** en la plataforma (que requieren seguimiento):\n\n**Desglose por Estado del Workflow**:\n*   Cotización Recibida: **${coti}**\n*   Orden de Compra Enviada: **${oc}**\n*   Guía de Remisión/Servicio: **${guia}**\n*   Factura Recibida: **${fact}**\n\n**Trámites más recientes**:\n${topThree}\n\n*Puedes ver el detalle completo en la **Bandeja Operativa**.*`
      };
    }

    // F. General totals
    if (q.includes('total') || q.includes('gasto') || q.includes('gastado') || q.includes('suma')) {
      const totalPEN = invoices.filter(inv => inv.currency === 'PEN').reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalUSD = invoices.filter(inv => inv.currency === 'USD').reduce((sum, inv) => sum + Number(inv.amount), 0);

      const recurrenteCount = invoices.filter(inv => inv.type === 'recurrente').length;
      const ocasionalCount = invoices.filter(inv => inv.type === 'ocasional').length;

      return {
        ragMessage: `RAG: Total general calculado sobre ${invoices.length} facturas.`,
        response: `El **gasto total registrado** en la plataforma TI asciende a:\n\n*   Soles (PEN): **${formatCurrency(totalPEN, 'PEN')}**\n*   Dólares (USD): **${formatCurrency(totalUSD, 'USD')}**\n\n**Composición de Compras**:\n*   Trámites Recurrentes: **${recurrenteCount}**\n*   Trámites Ocasionales: **${ocasionalCount}**\n\n*Nota: Estos montos corresponden al acumulado de todas las facturas en el sistema.*`
      };
    }

    // G. Fallback welcome / help response
    return {
      ragMessage: "RAG: Consulta no clasificada. Retornando ayuda.",
      response: `Entiendo tu interés, pero no logré asociar tu consulta con un reporte específico. \n\nComo tu **Asistente de RAG TI**, puedo darte respuestas exactas sobre:\n*   **Presupuesto**: *'¿Cuánto gastamos en CAPEX?'* o *'¿Diferencia entre CAPEX y OPEX?'*\n*   **Flujo de Trabajo**: *'¿Cuántas facturas están abiertas?'* o *'¿Qué órdenes de compra tenemos?'*\n*   **Tiempos**: *'¿Qué compras hubo en mayo?'* o *'¿Qué trámites registramos en agosto?'*\n*   **Proveedores**: *'¿Cuál es el saldo con Lenovo?'* o *'¿Qué trámites tiene Claro?'*\n\nPor favor re-formula tu pregunta con palabras clave financieras.`
    };
  };

  const handleSend = (textToSend = input) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setRagStatus('Buscando en base de datos local...');

    // Simulate RAG delay
    setTimeout(() => {
      const ragResult = processQuery(textToSend);
      setRagStatus(ragResult.ragMessage);

      // Simulate typing delay
      setTimeout(() => {
        const botMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: ragResult.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setRagStatus('');
      }, 800);
    }, 500);
  };

  const handleSuggestion = (suggestion) => {
    handleSend(suggestion);
  };

  // Helper formatting for short status labels
  const STATUS_LABELS_SHORT = {
    cotizacion_recibida: 'Cotización',
    orden_compra_enviada: 'Orden OC',
    guia_recibida: 'Guía',
    factura_recibida: 'Factura',
    enviado_contabilidad: 'Contabilizado',
  };

  return (
    <>
      {/* Botón activador flotante */}
      <button
        className={`ai-chat-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Copilot Inteligente RAG TI"
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} className="glow-icon" />}
        {!isOpen && <span className="trigger-pulse" />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="ai-chat-window animate-in">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="ai-chat-avatar">
                <Bot size={16} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: '#fff', lineHeight: 1.2 }}>TI Copilot</div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="online-indicator" /> Conectado a la base local
                </div>
              </div>
            </div>

            <button className="btn btn-ghost" style={{ padding: '0.25rem', color: 'white' }} onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* RAG Status Bar */}
          {ragStatus && (
            <div className="ai-rag-status animate-in">
              <span className="rag-loader" /> {ragStatus}
            </div>
          )}

          {/* Messages area */}
          <div className="ai-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-message-bubble ${msg.sender}`}>
                <div className="message-content">
                  {/* Parse basic markdown bullet points and bolding */}
                  {msg.text.split('\n').map((line, idx) => {
                    let formattedLine = line;

                    // Bold matching **text**
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    let parts = [];
                    let lastIndex = 0;
                    let match;

                    while ((match = boldRegex.exec(line)) !== null) {
                      parts.push(formattedLine.substring(lastIndex, match.index));
                      parts.push(<strong key={match.index}>{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    parts.push(formattedLine.substring(lastIndex));

                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('*');
                    const isSubBullet = line.trim().startsWith('    *');

                    if (isBullet) {
                      return (
                        <div key={idx} style={{ paddingLeft: isSubBullet ? '1.5rem' : '0.5rem', textIndent: '-0.5rem', marginBottom: '0.25rem' }}>
                          • {parts.length > 0 ? parts : line.replace(/^\*\s*/, '')}
                        </div>
                      );
                    }

                    return (
                      <p key={idx} style={{ marginBottom: line.trim() === '' ? '0.5rem' : '0.25rem', minHeight: '0.5rem' }}>
                        {parts.length > 0 ? parts : line}
                      </p>
                    );
                  })}
                </div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-message-bubble bot typing">
                <div className="ai-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions panel when chat is empty or fresh */}
          {messages.length === 1 && (
            <div className="ai-suggestions-panel">
              <div style={{ fontSize: '0.6875rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <HelpCircle size={10} /> Consultas de ejemplo:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} className="ai-suggestion-chip" onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input form */}
          <form
            className="ai-chat-input-form"
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Pregunta a la IA sobre facturas..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!input.trim() || isTyping}
            >
              <Send size={14} color="white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
