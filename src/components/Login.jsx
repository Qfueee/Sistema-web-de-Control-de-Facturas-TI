import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (!login(email, password)) {
        setError('Credenciales incorrectas. Verifique su correo y contraseña.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="login-container">
      {/* Panel izquierdo: Branding */}
      <div className="login-brand">
        <ShieldCheck size={56} strokeWidth={1.5} style={{ marginBottom: '1.5rem', zIndex: 1 }} />
        <h1>TI Control</h1>
        <p>Sistema de seguimiento y control de facturación para el área de Tecnología</p>
        <div style={{ zIndex: 1, marginTop: '3rem', opacity: 0.5, fontSize: '0.8125rem' }}>
          DH Empresas Perú S.A.
        </div>
      </div>

      {/* Panel derecho: Formulario */}
      <div className="login-form-side">
        <div className="login-form-card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
            Bienvenido
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
            Ingrese sus credenciales para acceder al sistema
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'var(--status-rojo-bg)',
                color: 'var(--status-rojo-text)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
                fontWeight: '500',
                border: '1px solid var(--status-rojo-border)'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@casaideas.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar al Sistema'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{
            marginTop: '2.5rem',
            padding: '1rem',
            background: 'var(--bg-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontWeight: '600', marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>Cuentas de prueba</p>
            <p>admin@casaideas.com / admin</p>
            <p>visor@casaideas.com / visor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
