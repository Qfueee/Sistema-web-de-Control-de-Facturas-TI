import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

export default function Login() {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security variables
  const canvasRef = useRef(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Generate dynamic 4-character CAPTCHA drawn on canvas
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background color based on dark mode class on body
      const isDark = document.body.classList.contains('dark');
      ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Noise lines for security
      ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // Styled, rotated characters with random colors
      ctx.font = 'bold 26px monospace';
      ctx.textBaseline = 'middle';
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
      
      for (let i = 0; i < code.length; i++) {
        const char = code.charAt(i);
        ctx.save();
        // Translate to space characters nicely
        ctx.translate(18 + i * 28, canvas.height / 2);
        // Add random slight rotations
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillText(char, -8, 2);
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    // Generate captcha on initial render and when theme changes
    generateCaptcha();
    
    // Listen to body dark-mode toggling to repaint CAPTCHA colors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          generateCaptcha();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Rate limiting account locking countdown
  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setLockUntil(0);
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check account locking
    if (lockUntil && Date.now() < lockUntil) {
      setError(`Cuenta bloqueada temporalmente. Intente en ${secondsLeft} segundos.`);
      setLoading(false);
      return;
    }

    // Verify CAPTCHA code
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('El código de seguridad (CAPTCHA) ingresado es incorrecto.');
      setCaptchaInput('');
      generateCaptcha();
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (login(email, password)) {
        setFailedAttempts(0);
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        
        if (nextAttempts >= 3) {
          setLockUntil(Date.now() + 30000); // 30 seconds lock
          setError('Demasiados intentos fallidos. Acceso bloqueado por 30 segundos.');
        } else {
          setError(`Credenciales incorrectas. Le quedan ${3 - nextAttempts} intento${(3 - nextAttempts) !== 1 ? 's' : ''}.`);
        }
        
        // Refresh CAPTCHA on failed attempt
        setCaptchaInput('');
        generateCaptcha();
      }
      setLoading(false);
    }, 450);
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
                disabled={lockUntil > 0}
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
                disabled={lockUntil > 0}
              />
            </div>

            {/* CAPTCHA Visual Securizado */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Código de Seguridad (CAPTCHA)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', marginTop: '0.375rem' }}>
                <canvas 
                  ref={canvasRef} 
                  width={140} 
                  height={38} 
                  style={{ 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-xs)'
                  }} 
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={generateCaptcha}
                  style={{ padding: '0 0.75rem' }}
                  title="Recargar CAPTCHA"
                  disabled={lockUntil > 0}
                >
                  <RefreshCw size={14} />
                </button>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '750', textAlign: 'center' }}
                  maxLength={4}
                  placeholder="Código"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  required
                  disabled={lockUntil > 0}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || lockUntil > 0}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}
            >
              {lockUntil > 0 
                ? `Bloqueado (${secondsLeft}s)` 
                : loading 
                  ? 'Ingresando...' 
                  : 'Ingresar al Sistema'} 
              {!(lockUntil > 0) && <ArrowRight size={16} />}
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
