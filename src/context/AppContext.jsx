import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

// ═══ DATOS INICIALES ═══
const INITIAL_USERS = [
  { id: '1', name: 'Admin TI', email: 'admin@casaideas.com', password: 'admin', role: 'admin' },
  { id: '2', name: 'Visor TI', email: 'visor@casaideas.com', password: 'visor', role: 'viewer' }
];

const INITIAL_PROVIDERS = [
  { id: '1', name: 'Ricoh del Perú', type: 'fijo', ruc: '20507540393' },
  { id: '2', name: 'Claro Empresas', type: 'fijo', ruc: '20100017491' },
  { id: '3', name: 'AWS Hosting', type: 'fijo', ruc: 'N/A' },
  { id: '4', name: 'Lenovo Laptops', type: 'ocasional', ruc: '20543254798' },
  { id: '5', name: 'Digiflow', type: 'fijo', ruc: '20602734521' },
  { id: '6', name: 'Microsoft Ireland', type: 'ocasional', ruc: 'N/A' },
  { id: '7', name: 'TP-Link Perú', type: 'ocasional', ruc: '20556127042' }
];

const now = new Date();
const daysAgo = (d) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString();

const INITIAL_INVOICES = [
  { 
    id: 'TR-001', 
    provider_id: '4', 
    providerName: 'Lenovo Laptops', 
    amount: 8200, 
    currency: 'PEN', 
    status: 'cotizacion_recibida', 
    date: daysAgo(12), 
    type: 'ocasional', 
    notes: '3 laptops ThinkPad E14 para área comercial',
    capexOpex: 'CAPEX',
    purchaseType: 'Compra',
    sustento: 'Renovación de equipos comerciales Q2',
    ocNumber: 'OC-2026-089',
    costCenter: 'Ventas - 302',
    ocDate: daysAgo(12),
    ocAmount: 8200,
    motivo: 'Laptops antiguas lentas',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: 0,
    accountingSentDate: ''
  },
  { id: 'TR-002', provider_id: '2', providerName: 'Claro Empresas', amount: 4500, currency: 'PEN', status: 'guia_recibida', date: daysAgo(5), type: 'recurrente', notes: 'Enlace dedicado 200Mbps sede principal' },
  { id: 'TR-003', provider_id: '1', providerName: 'Ricoh del Perú', amount: 1800, currency: 'PEN', status: 'enviado_contabilidad', date: daysAgo(22), type: 'recurrente', notes: 'Mantenimiento impresoras Q2-2026' },
  { 
    id: 'TR-004', 
    provider_id: '6', 
    providerName: 'Microsoft Ireland', 
    amount: 2400, 
    currency: 'USD', 
    status: 'factura_recibida', 
    date: daysAgo(3), 
    type: 'ocasional', 
    notes: '50 licencias Microsoft 365 Business',
    capexOpex: 'OPEX',
    purchaseType: 'Servicio',
    sustento: 'Suscripción anual licencias M365',
    ocNumber: 'OC-2026-075',
    costCenter: 'TI - 101',
    ocDate: daysAgo(15),
    ocAmount: 2400,
    motivo: 'Licencias necesarias para nuevos colaboradores',
    invoiceNumber: 'FC-998822',
    invoiceDate: daysAgo(3),
    invoiceAmount: 2400,
    accountingSentDate: ''
  },
  { id: 'TR-005', provider_id: '5', providerName: 'Digiflow', amount: 950, currency: 'PEN', status: 'orden_compra_enviada', date: daysAgo(8), type: 'recurrente', notes: 'Servicio firma digital mensual' },
  { 
    id: 'TR-006', 
    provider_id: '7', 
    providerName: 'TP-Link Perú', 
    amount: 3200, 
    currency: 'PEN', 
    status: 'cotizacion_recibida', 
    date: daysAgo(1), 
    type: 'ocasional', 
    notes: '10 Access Points EAP245 para tiendas',
    capexOpex: 'CAPEX',
    purchaseType: 'Compra',
    sustento: 'Proyecto de mejora Wifi tiendas Lima',
    ocNumber: 'OC-2026-092',
    costCenter: 'Operaciones - 204',
    ocDate: daysAgo(1),
    ocAmount: 3200,
    motivo: 'Mejorar cobertura en tiendas de alta afluencia',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: 0,
    accountingSentDate: ''
  },
  { id: 'TR-007', provider_id: '3', providerName: 'AWS Hosting', amount: 1250, currency: 'USD', status: 'enviado_contabilidad', date: daysAgo(30), type: 'recurrente', notes: 'EC2 + RDS + S3 abril 2026' },
  { id: 'TR-008', provider_id: '1', providerName: 'Ricoh del Perú', amount: 650, currency: 'PEN', status: 'guia_recibida', date: daysAgo(6), type: 'recurrente', notes: 'Tóners y repuestos impresora MPC3503' },
];

const INITIAL_RECURRENTS = [
  { id: '1', day: 5, provider_id: '2', providerName: 'Claro Empresas', amount: 4500, currency: 'PEN', description: 'Enlace dedicado + telefonía' },
  { id: '2', day: 15, provider_id: '1', providerName: 'Ricoh del Perú', amount: 1800, currency: 'PEN', description: 'Servicio de impresión' },
  { id: '3', day: 20, provider_id: '3', providerName: 'AWS Hosting', amount: 1250, currency: 'USD', description: 'Cloud hosting mensual' },
  { id: '4', day: 10, provider_id: '5', providerName: 'Digiflow', amount: 950, currency: 'PEN', description: 'Firma digital corporativa' },
];

const INITIAL_PROFILES = [
  {
    id: 'admin',
    name: 'Administrador',
    permissions: {
      viewBandeja: true,
      viewDashboards: true,
      viewCalendario: true,
      viewHistorial: true,
      viewConfiguracion: true,
      manageUsers: true,
      viewAuditoria: true
    }
  },
  {
    id: 'viewer',
    name: 'Visor',
    permissions: {
      viewBandeja: true,
      viewDashboards: true,
      viewCalendario: true,
      viewHistorial: true,
      viewConfiguracion: false,
      manageUsers: false,
      viewAuditoria: false
    }
  }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-1', timestamp: daysAgo(15), user: 'Sistema', email: 'sistema@casaideas.com', action: 'Inicialización', details: 'Base de datos de auditoría inicializada correctamente.' },
  { id: 'log-2', timestamp: daysAgo(12), user: 'Admin TI', email: 'admin@casaideas.com', action: 'Creación de Compra', details: 'Se creó el trámite TR-001 (Lenovo Laptops) por S/ 8,200.00' },
  { id: 'log-3', timestamp: daysAgo(5), user: 'Admin TI', email: 'admin@casaideas.com', action: 'Cambio de Estado', details: 'Se actualizó el estado del trámite TR-002 a Guía Remisión' }
];

// ═══ PROVIDER ═══
export const AppContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const [users, setUsers] = useState(() => {
    const s = localStorage.getItem('ci_users');
    return s ? JSON.parse(s) : INITIAL_USERS;
  });
  const [providers, setProviders] = useState(() => {
    const s = localStorage.getItem('ci_providers');
    return s ? JSON.parse(s) : INITIAL_PROVIDERS;
  });
  const [invoices, setInvoices] = useState(() => {
    const s = localStorage.getItem('ci_invoices');
    return s ? JSON.parse(s) : INITIAL_INVOICES;
  });
  const [recurrents, setRecurrents] = useState(() => {
    const s = localStorage.getItem('ci_recurrents');
    return s ? JSON.parse(s) : INITIAL_RECURRENTS;
  });
  const [profiles, setProfiles] = useState(() => {
    const s = localStorage.getItem('ci_profiles');
    return s ? JSON.parse(s) : INITIAL_PROFILES;
  });
  const [auditLogs, setAuditLogs] = useState(() => {
    const s = localStorage.getItem('ci_audit_logs');
    return s ? JSON.parse(s) : INITIAL_AUDIT_LOGS;
  });

  // Pagos recurrentes marcados como pagados: { 'YYYY-MM-recurrentId': true }
  const [paidRecurrents, setPaidRecurrents] = useState(() => {
    const s = localStorage.getItem('ci_paid_recurrents');
    return s ? JSON.parse(s) : {};
  });

  useEffect(() => { localStorage.setItem('ci_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('ci_providers', JSON.stringify(providers)); }, [providers]);
  useEffect(() => { localStorage.setItem('ci_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('ci_recurrents', JSON.stringify(recurrents)); }, [recurrents]);
  useEffect(() => { localStorage.setItem('ci_paid_recurrents', JSON.stringify(paidRecurrents)); }, [paidRecurrents]);
  useEffect(() => { localStorage.setItem('ci_profiles', JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => { localStorage.setItem('ci_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Permisos dinámicos
  const userPermissions = profiles.find(p => p.id === currentUser?.role)?.permissions || {};

  // Sanitización de Datos (Prevención XSS)
  const sanitizeInput = (text) => {
    if (typeof text !== 'string') return text;
    // Remueve etiquetas HTML y scripts maliciosos de manera preventiva
    return text.replace(/<[^>]*>/g, '').trim();
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    Object.entries(obj).forEach(([key, val]) => {
      sanitized[key] = (typeof val === 'string') ? sanitizeInput(val) : val;
    });
    return sanitized;
  };

  // Auditoría
  const addAuditLog = (action, details, userOverride = null) => {
    const activeUser = userOverride || currentUser;
    setAuditLogs(prev => [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user: activeUser ? activeUser.name : 'Sistema',
        email: activeUser ? activeUser.email : 'sistema@casaideas.com',
        action: sanitizeInput(action),
        details: sanitizeInput(details)
      },
      ...prev
    ]);
  };

  const clearAuditLogs = () => {
    if (currentUser?.role === 'admin') {
      setAuditLogs([]);
      addAuditLog('Limpieza de Historial', 'El administrador limpió el historial de auditoría.');
    }
  };

  // Auth
  const login = (email, password) => {
    const sanitizedEmail = sanitizeInput(email);
    const user = users.find(u => u.email === sanitizedEmail && u.password === password);
    if (user) {
      setCurrentUser(user);
      addAuditLog('Inicio de Sesión', 'Usuario inició sesión exitosamente.', user);
      return true;
    }
    return false;
  };
  const logout = () => {
    addAuditLog('Cierre de Sesión', 'Usuario cerró sesión.');
    setCurrentUser(null);
  };

  // Invoices
  const nextId = () => {
    const nums = invoices.map(i => parseInt(i.id.replace('TR-', '')) || 0);
    return `TR-${(Math.max(0, ...nums) + 1).toString().padStart(3, '0')}`;
  };

  const addInvoice = (invoice) => {
    const cleanInvoice = sanitizeObject(invoice);
    const provider = providers.find(p => p.id === cleanInvoice.provider_id);
    const id = nextId();
    const pName = provider ? provider.name : 'Desconocido';
    setInvoices(prev => [{
      ...cleanInvoice,
      id,
      date: new Date().toISOString(),
      providerName: pName,
      status: 'cotizacion_recibida',
      currency: cleanInvoice.currency || 'PEN',
      notes: cleanInvoice.notes || ''
    }, ...prev]);
    addAuditLog('Creación de Compra', `Se creó el trámite ${id} (${pName}) por un monto de ${formatCurrency(cleanInvoice.amount, cleanInvoice.currency)}`);
  };

  const updateInvoiceStatus = (id, newStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    const labels = {
      cotizacion_recibida: 'Cotización',
      orden_compra_enviada: 'Orden Compra',
      guia_recibida: 'Guía Remisión',
      factura_recibida: 'Factura',
      enviado_contabilidad: 'Contabilizado',
    };
    addAuditLog('Cambio de Estado', `Se actualizó el estado del trámite ${id} a "${labels[newStatus] || newStatus}"`);
  };

  const updateInvoice = (id, data) => {
    const cleanData = sanitizeObject(data);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...cleanData } : inv));
    addAuditLog('Modificación de Compra', `Se actualizaron datos del trámite ${id}: ${Object.keys(cleanData).join(', ')}`);
  };

  const deleteInvoice = (id) => {
    const inv = invoices.find(i => i.id === id);
    const pName = inv ? inv.providerName : '';
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    addAuditLog('Eliminación de Compra', `Se eliminó el trámite ${id} ${pName ? `(${pName})` : ''}`);
  };

  // Providers
  const addProvider = (p) => {
    const cleanP = sanitizeObject(p);
    setProviders(prev => [...prev, { ...cleanP, id: uuidv4() }]);
  };
  const updateProvider = (id, data) => {
    const cleanData = sanitizeObject(data);
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...cleanData } : p));
  };
  const deleteProvider = (id) => setProviders(prev => prev.filter(p => p.id !== id));

  // Users
  const addUser = (u) => {
    const cleanU = sanitizeObject(u);
    setUsers(prev => [...prev, { ...cleanU, id: uuidv4() }]);
  };
  const updateUser = (id, data) => {
    const cleanData = sanitizeObject(data);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...cleanData } : u));
  };
  const deleteUser = (id) => setUsers(prev => prev.filter(u => u.id !== id));

  // Recurrents
  const addRecurrent = (item) => {
    const cleanItem = sanitizeObject(item);
    setRecurrents(prev => [...prev, { ...cleanItem, id: uuidv4() }]);
  };
  const updateRecurrent = (id, data) => {
    const cleanData = sanitizeObject(data);
    setRecurrents(prev => prev.map(r => r.id === id ? { ...r, ...cleanData } : r));
  };
  const deleteRecurrent = (id) => setRecurrents(prev => prev.filter(r => r.id !== id));

  // Profiles
  const updateProfilePermissions = (profileId, newPermissions) => {
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, permissions: { ...p.permissions, ...newPermissions } } : p));
  };
  const addProfile = (p) => {
    const cleanP = sanitizeObject(p);
    setProfiles(prev => [...prev, { ...cleanP, id: uuidv4() }]);
  };
  const deleteProfile = (id) => setProfiles(prev => prev.filter(p => p.id !== id));

  // Paid recurrents: marcar/desmarcar un pago recurrente como pagado en un mes
  const getRecurrentPaidKey = (recurrentId, year, month) => `${year}-${String(month + 1).padStart(2, '0')}-${recurrentId}`;
  const isRecurrentPaid = (recurrentId, year, month) => !!paidRecurrents[getRecurrentPaidKey(recurrentId, year, month)];
  const toggleRecurrentPaid = (recurrentId, year, month) => {
    const key = getRecurrentPaidKey(recurrentId, year, month);
    setPaidRecurrents(prev => {
      const updated = { ...prev };
      if (updated[key]) { delete updated[key]; } else { updated[key] = true; }
      return updated;
    });
  };

  // Utilidad de formato — soporta tanto números como strings legacy ("S/ 8,200.00")
  const formatCurrency = (amount, currency = 'PEN') => {
    const symbol = currency === 'USD' ? '$ ' : 'S/ ';
    let num = amount;
    if (typeof amount === 'string') {
      num = parseFloat(amount.replace(/[^0-9.-]/g, '')) || 0;
    }
    return symbol + Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Reset data
  const resetData = () => {
    localStorage.removeItem('ci_users');
    localStorage.removeItem('ci_providers');
    localStorage.removeItem('ci_invoices');
    localStorage.removeItem('ci_recurrents');
    localStorage.removeItem('ci_paid_recurrents');
    localStorage.removeItem('ci_profiles');
    localStorage.removeItem('ci_audit_logs');
    setUsers(INITIAL_USERS);
    setProviders(INITIAL_PROVIDERS);
    setInvoices(INITIAL_INVOICES);
    setRecurrents(INITIAL_RECURRENTS);
    setPaidRecurrents({});
    setProfiles(INITIAL_PROFILES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      users, addUser, updateUser, deleteUser,
      providers, addProvider, updateProvider, deleteProvider,
      invoices, addInvoice, updateInvoiceStatus, updateInvoice, deleteInvoice,
      recurrents, addRecurrent, updateRecurrent, deleteRecurrent,
      paidRecurrents, isRecurrentPaid, toggleRecurrentPaid,
      profiles, updateProfilePermissions, addProfile, deleteProfile, userPermissions,
      auditLogs, addAuditLog, clearAuditLogs,
      formatCurrency, resetData
    }}>
      {children}
    </AppContext.Provider>
  );
};
