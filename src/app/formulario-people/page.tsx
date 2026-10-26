'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { categorias } from './beneficios-data';
import '../formulario-requisicion/FormularioRequisicion.css';
import './FormularioPeople.css';

const catIcons: Record<string, React.ReactNode> = {
  dias_remunerados: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
  adicionales: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>),
  people: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
};

export default function PeopleCategoriasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || 'Usuario Corporativo';

  return (
    <div className="req-page">
      <header className="req-header">
        <div className="req-header-inner">
          <div className="req-header-brand"><img src="/Logo syp.png" alt="Solutions & Payroll" className="req-logo" /><div className="req-brand-text"><span className="req-brand-name">Solutions & Payroll</span><span className="req-brand-sub">Gestión Humana</span></div></div>
          <div className="req-header-right"><div className="req-user"><div className="req-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span className="req-username">{userName}</span></div></div>
        </div>
      </header>

      <div className="req-hero">
        <div className="req-hero-inner">
          <Link href="/" className="req-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Volver al inicio</Link>
          <span className="req-badge">Beneficios</span>
          <h1>Programa PEOPLE</h1>
          <p>Selecciona una categoría de beneficios</p>
        </div>
      </div>

      <main className="req-main">
        <div className="people-category-grid">
          {categorias.map(cat => (
            <button key={cat.key} type="button" className="people-category-card" onClick={() => router.push(`/formulario-people/${cat.key}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '3rem 2rem', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s', width: '100%' }}
            >
              <span style={{ color: '#10b981', display: 'flex' }}>{catIcons[cat.key]}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{cat.titulo}</h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Ingresar →</span>
            </button>
          ))}
        </div>
      </main>

      <footer className="req-footer"><p>© 2026 Solutions & Payroll SAS — Todos los derechos reservados</p></footer>
    </div>
  );
}
