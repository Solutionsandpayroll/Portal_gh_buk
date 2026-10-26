import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { auth } from '@/auth';
import type { ReactElement } from 'react';
import '../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../../Dashboard.css';

export const dynamic = 'force-dynamic';

const CATEGORIAS = [
  { key: 'dias_remunerados', label: 'Días Remunerados', icon: 'calendar' },
  { key: 'adicionales', label: 'Beneficios Adicionales', icon: 'gift' },
  { key: 'people', label: 'Programa PEOPLE', icon: 'people' },
];

const ICONOS: Record<string, ReactElement> = {
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export default async function ResultadosPeoplePage() {
  const session = await auth();
  const userName = session?.user?.name || 'Usuario Corporativo';

  const counts = await Promise.all(
    CATEGORIAS.map(async (cat) => {
      const count = await prisma.peopleSolicitud.count({ where: { categoria: cat.key } });
      return { ...cat, count };
    })
  );

  return (
    <div className="destr-page">
      <header className="destr-header">
        <div className="destr-header-inner">
          <div className="destr-header-brand">
            <img src="/Logo syp.png" alt="Solutions & Payroll" className="destr-logo" />
            <div className="destr-brand-text">
              <span className="destr-brand-name">Solutions & Payroll</span>
              <span className="destr-brand-sub">Gestión Humana</span>
            </div>
          </div>
          <div className="destr-header-right">
            <div className="destr-user">
              <div className="destr-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="destr-username">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="destr-hero">
        <div className="destr-hero-inner">
          <Link href="/" className="destr-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>
          <span className="destr-badge">Resultados</span>
          <h1>Programa PEOPLE</h1>
          <p>Consulta las solicitudes del programa PEOPLE por categoría</p>
        </div>
      </div>

      <main className="destr-main">
        <div className="modules-grid modules-grid--3col">
          {counts.map((cat) => (
            <Link
              key={cat.key}
              href={`/resultados/people/${cat.key}`}
              className="module-card"
            >
              <div className="card-accent-bar" style={{ background: '#10b981' }} />
              <div className="card-top">
                <span className="card-tag">Categoría</span>
                <div className="card-icon-wrap" style={{ background: '#f0fdf4', color: '#10b981' }}>
                  <div className="card-icon">{ICONOS[cat.icon]}</div>
                </div>
              </div>
              <div className="card-body">
                <h3 className="card-title">{cat.label}</h3>
                <p className="card-desc">{cat.count} solicitudes registradas</p>
              </div>
              <div className="card-footer">
                <span className="card-cta" style={{ color: '#10b981' }}>
                  Ver solicitudes
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>Solutions &amp; Payroll</h3>
            <p>Expertos en gestión empresarial y soluciones de nómina</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Contacto</h4>
              <p>📧 automatizacion2@solutionsandpayroll.com</p>
              <p>📍 Bogotá, Colombia</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Solutions &amp; Payroll SAS — Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
