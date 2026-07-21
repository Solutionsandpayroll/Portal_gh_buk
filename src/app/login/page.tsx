'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
