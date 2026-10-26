'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { beneficios, categoriaTitulo, type Categoria } from '../beneficios-data';
import '../../formulario-requisicion/FormularioRequisicion.css';
import '../FormularioPeople.css';

export default function CategoriaBenefitsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const categoriaKey = params.categoria as Categoria;
  const titulo = categoriaTitulo[categoriaKey] || categoriaKey;
  const catBenefits = beneficios.filter(b => b.categoria === categoriaKey);

  if (!categoriaTitulo[categoriaKey]) {
    return (
      <div className="req-page">
        <div className="destr-success">
          <h2>Categoría no encontrada</h2>
          <Link href="/formulario-people" className="btn-primary-req">Volver a categorías</Link>
        </div>
      </div>
    );
  }

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
          <Link href="/formulario-people" className="req-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Volver a categorías</Link>
          <span className="req-badge">{titulo}</span>
          <h1>{titulo}</h1>
          <p>Elige el beneficio que deseas solicitar</p>
        </div>
      </div>

      <main className="req-main">
        <div className="form-section">
          <div className="form-grid">
            {catBenefits.map(b => (
              <button key={b.id} type="button" className="people-benefit-btn" onClick={() => router.push(`/formulario-people/${categoriaKey}/${b.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%', padding: '1.25rem 1.5rem', background: '#fff', border: '2px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
              >
                <div className="people-benefit-left">
                  <span className="people-benefit-name">{b.label}</span>
                  {b.detalle && <span className="people-benefit-detail">{b.detalle}</span>}
                </div>
                <div className="people-benefit-right">
                  {b.dias && <span className="people-benefit-dias">{b.dias}</span>}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="req-footer"><p>© 2026 Solutions & Payroll SAS — Todos los derechos reservados</p></footer>
    </div>
  );
}
