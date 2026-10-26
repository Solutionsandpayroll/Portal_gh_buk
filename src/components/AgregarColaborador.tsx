'use client';

import { useState } from 'react';

interface Props {
  onAdded: (nombre: string) => void;
}

export default function AgregarColaborador({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar');
      }
      const creado = await r.json();
      onAdded(creado.nombre);
      setNombre('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(''); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#f0fdf4',
          border: '1.5px solid #10b981',
          color: '#059669',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '0.4rem 0.85rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar nueva persona
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Agregar nueva persona
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              El nombre quedará disponible para seleccionar en los formularios.
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                placeholder="Ej: Juan Pérez"
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  marginBottom: '1.25rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setNombre(''); setError(''); }}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={loading || !nombre.trim()}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.55rem 1.2rem',
                    borderRadius: '8px',
                    cursor: loading || !nombre.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !nombre.trim() ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
