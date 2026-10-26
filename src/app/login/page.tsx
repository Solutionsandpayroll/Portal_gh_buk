'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('microsoft-entra-id', { callbackUrl: '/' });
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError('');
    const res = await signIn('admin', {
      username: adminUser,
      password: adminPass,
      redirect: false,
    });
    if (res?.error) {
      setError('Usuario o contraseña incorrectos.');
      setAdminLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="login-root">
      <div className="login-bg-grid" />
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />

      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="/Logo syp1.png" alt="Solutions & Payroll" className="login-logo" />
        </div>

        <div className="login-header">
          <span className="login-eyebrow">Portal de Gestión Humana</span>
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">Acceso exclusivo para colaboradores de Solutions &amp; Payroll</p>
        </div>

        <div className="login-form">
          {error && (
            <div className="login-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button type="button" className="login-submit login-submit--ms" onClick={handleSignIn} disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M2 3h9v9H2V3m9 19H2v-9h9v9M21 3v9h-9V3h9m0 19h-9v-9h9v9Z" />
                </svg>
                Iniciar sesión con Microsoft
              </>
            )}
          </button>

          {!showAdmin && (
            <button
              type="button"
              className="login-submit login-submit--admin"
              onClick={() => { setShowAdmin(true); setError(''); }}
              style={{
                marginTop: '0.75rem',
                background: 'transparent',
                border: '1.5px solid #7c3aed',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Iniciar como administrador
            </button>
          )}

          {showAdmin && (
            <form onSubmit={handleAdminSignIn} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Usuario"
                value={adminUser}
                onChange={e => setAdminUser(e.target.value)}
                required
                autoComplete="username"
                style={{
                  padding: '0.7rem 0.9rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  padding: '0.7rem 0.9rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={adminLoading}
                style={{
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: adminLoading ? 0.6 : 1,
                }}
              >
                {adminLoading ? <span className="login-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Acceder
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdmin(false); setError(''); setAdminUser(''); setAdminPass(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
            </form>
          )}

          <p className="login-footer-note">
            Usa tu cuenta corporativa de Solutions &amp; Payroll
          </p>
        </div>

        <p className="login-footer-note">
          ¿Problemas para ingresar? Contacta al área de Automatización.
        </p>
      </div>
    </div>
  );
};

export default Login;
