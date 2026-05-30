import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, Plus, Edit2, Check, X, RefreshCw, ShieldAlert, Key } from 'lucide-react';

export default function Configuracion() {
  const { 
    users, addUser, deleteUser, 
    providers, addProvider, updateProvider, deleteProvider, 
    currentUser, resetData,
    profiles, updateProfilePermissions, userPermissions
  } = useAppContext();

  // Permissions check
  const canManageUsers = !!userPermissions.manageUsers;
  const canManageProviders = currentUser?.role === 'admin' || userPermissions.viewConfiguracion; // View config permission implies viewing providers
  const isAdmin = currentUser?.role === 'admin';

  // Provider form
  const [newPName, setNewPName] = useState('');
  const [newPType, setNewPType] = useState('fijo');
  const [newPRuc, setNewPRuc] = useState('');

  // User form
  const [newUName, setNewUName] = useState('');
  const [newUEmail, setNewUEmail] = useState('');
  const [newUPass, setNewUPass] = useState('');
  const [newURole, setNewURole] = useState(profiles[1]?.id || 'viewer'); // defaults to viewer profile

  // Inline edit
  const [editingProvider, setEditingProvider] = useState(null);
  const [editPName, setEditPName] = useState('');
  const [editPType, setEditPType] = useState('');

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'provider'|'user', id, name }

  // Reset safety check
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetVerificationText, setResetVerificationText] = useState('');

  const handleAddProvider = (e) => {
    e.preventDefault();
    if (!newPName) return;
    addProvider({ name: newPName, type: newPType, ruc: newPRuc || 'N/A' });
    setNewPName(''); setNewPRuc('');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUName || !newUEmail || !newUPass) return;
    addUser({ name: newUName, email: newUEmail, password: newUPass, role: newURole });
    setNewUName(''); setNewUEmail(''); setNewUPass('');
  };

  const startEditProvider = (p) => {
    setEditingProvider(p.id);
    setEditPName(p.name);
    setEditPType(p.type);
  };

  const saveEditProvider = (id) => {
    updateProvider(id, { name: editPName, type: editPType });
    setEditingProvider(null);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'provider') deleteProvider(deleteConfirm.id);
    if (deleteConfirm.type === 'user') deleteUser(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Administra el catálogo de proveedores, los usuarios del sistema y sus perfiles de seguridad.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-outline" onClick={() => setShowResetConfirm(true)} style={{ gap: '0.375rem' }}>
            <RefreshCw size={14} /> Resetear Datos
          </button>
        )}
      </div>

      <div className="grid-2">
        {/* ═══ PROVEEDORES ═══ */}
        <div className="card animate-in">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Catálogo de Proveedores</h3>

          {isAdmin && (
            <form onSubmit={handleAddProvider} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input type="text" className="form-input" style={{ flex: 2, minWidth: '150px' }} placeholder="Nombre del proveedor" value={newPName} onChange={e => setNewPName(e.target.value)} />
              <input type="text" className="form-input" style={{ flex: 1, minWidth: '100px' }} placeholder="RUC" value={newPRuc} onChange={e => setNewPRuc(e.target.value)} />
              <select className="form-select" style={{ width: '100px' }} value={newPType} onChange={e => setNewPType(e.target.value)}>
                <option value="fijo">Fijo</option>
                <option value="ocasional">Ocasional</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm"><Plus size={16} /></button>
            </form>
          )}

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Tipo</th>
                  {isAdmin && <th style={{ width: '80px' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id}>
                    <td>
                      {editingProvider === p.id ? (
                        <input type="text" className="form-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }} value={editPName} onChange={e => setEditPName(e.target.value)} />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '600' }}>{p.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>RUC: {p.ruc || 'N/A'}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingProvider === p.id ? (
                        <select className="form-select" style={{ padding: '0.25rem', fontSize: '0.75rem' }} value={editPType} onChange={e => setEditPType(e.target.value)}>
                          <option value="fijo">Fijo</option>
                          <option value="ocasional">Ocasional</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${p.type === 'fijo' ? 'verde' : 'amarillo'}`}>{p.type}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {editingProvider === p.id ? (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => saveEditProvider(p.id)}><Check size={14} color="var(--status-verde-text)" /></button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingProvider(null)}><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => startEditProvider(p)}><Edit2 size={14} /></button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'provider', id: p.id, name: p.name })}><Trash2 size={14} color="var(--status-rojo-text)" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ USUARIOS ═══ */}
        <div className="card animate-in animate-in-delay-1">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Gestión de Usuarios</h3>
            {!canManageUsers && (
              <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-amarillo-text)', background: 'var(--status-amarillo-bg)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--status-amarillo-border)', fontWeight: '600' }}>
                <ShieldAlert size={12} /> Solo Lectura
              </span>
            )}
          </div>

          {canManageUsers ? (
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="form-input" placeholder="Nombre" value={newUName} onChange={e => setNewUName(e.target.value)} />
                <input type="email" className="form-input" placeholder="Correo" value={newUEmail} onChange={e => setNewUEmail(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="password" className="form-input" placeholder="Contraseña" value={newUPass} onChange={e => setNewUPass(e.target.value)} />
                <select className="form-select" value={newURole} onChange={e => setNewURole(e.target.value)}>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">Agregar</button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Tu perfil actual no cuenta con permisos para crear, editar o eliminar usuarios del sistema.
            </div>
          )}

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol / Perfil</th>
                  {canManageUsers && <th style={{ width: '50px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const uProfile = profiles.find(p => p.id === u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{u.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${u.role === 'admin' ? 'azul' : 'verde'}`}>
                          {uProfile ? uProfile.name : u.role}
                        </span>
                      </td>
                      {canManageUsers && (
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'user', id: u.id, name: u.name })} disabled={u.id === currentUser?.id}>
                            <Trash2 size={14} color={u.id === currentUser?.id ? 'var(--text-muted)' : 'var(--status-rojo-text)'} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ MATRIZ DE PERMISOS POR PERFIL ═══ */}
        <div className="card animate-in animate-in-delay-2" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={16} color="var(--accent)" /> Matriz de Permisos por Perfil
            </h3>
            {!canManageUsers && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo Lectura</span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Define qué módulos de la aplicación puede visualizar cada perfil y si tiene la capacidad de administrar cuentas de usuario.
          </p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Perfil / Rol</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Bandeja Operativa</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Dashboards</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Pagos Recurrentes</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Historial Facturas</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Configuración</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Gestionar Usuarios</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: '400' }}>ID: {p.id}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewBandeja} 
                        onChange={e => updateProfilePermissions(p.id, { viewBandeja: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewDashboards} 
                        onChange={e => updateProfilePermissions(p.id, { viewDashboards: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewCalendario} 
                        onChange={e => updateProfilePermissions(p.id, { viewCalendario: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewHistorial} 
                        onChange={e => updateProfilePermissions(p.id, { viewHistorial: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewConfiguracion} 
                        onChange={e => updateProfilePermissions(p.id, { viewConfiguracion: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.manageUsers} 
                        onChange={e => updateProfilePermissions(p.id, { manageUsers: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!p.permissions.viewAuditoria} 
                        onChange={e => updateProfilePermissions(p.id, { viewAuditoria: e.target.checked })}
                        disabled={!canManageUsers || p.id === 'admin'}
                        style={{ width: '16px', height: '16px', cursor: canManageUsers && p.id !== 'admin' ? 'pointer' : 'default' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {deleteConfirm && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>Confirmar Eliminación</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              ¿Está seguro de eliminar <strong style={{ color: 'var(--text-main)' }}>{deleteConfirm.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación para reseteo completo de datos */}
      {showResetConfirm && (
        <div className="confirm-overlay" onClick={() => { setShowResetConfirm(false); setResetVerificationText(''); }}>
          <div className="confirm-dialog animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-rojo-text)' }}>
              <RefreshCw size={18} className="rag-loader" style={{ animationDuration: '3s' }} /> Restablecer Base de Datos
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              Esta acción eliminará todos los trámites, facturas, proveedores, usuarios adicionales y logs de auditoría permanentemente. Esta acción no se puede deshacer.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600' }}>
              Para confirmar el restablecimiento completo, escribe <strong style={{ color: 'var(--text-main)' }}>RESET</strong> a continuación:
            </p>
            
            <input 
              type="text" 
              className="form-input" 
              style={{ marginBottom: '1.5rem', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.1em', fontWeight: '700' }}
              placeholder="Escribe RESET aquí..."
              value={resetVerificationText}
              onChange={e => setResetVerificationText(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setShowResetConfirm(false); setResetVerificationText(''); }}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                disabled={resetVerificationText.toUpperCase() !== 'RESET'}
                onClick={() => {
                  resetData();
                  setShowResetConfirm(false);
                  setResetVerificationText('');
                }}
                style={{ 
                  background: resetVerificationText.toUpperCase() === 'RESET' ? 'var(--status-rojo-text)' : 'var(--text-muted)',
                  color: 'white',
                  cursor: resetVerificationText.toUpperCase() === 'RESET' ? 'pointer' : 'default'
                }}
              >
                Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
