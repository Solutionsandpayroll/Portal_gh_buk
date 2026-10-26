import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { auth } from '@/auth';
import '../../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../../../Dashboard.css';

export const dynamic = 'force-dynamic';

export default async function PeopleCategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const session = await auth();
  const userName = session?.user?.name || 'Usuario Corporativo';

  const CATEGORIAS: Record<string, string> = {
    dias_remunerados: 'Días Remunerados',
    beneficios_adicionales: 'Beneficios Adicionales',
    people: 'Programa PEOPLE',
  };

  const categoriaLabel = CATEGORIAS[categoria] || categoria;

  const beneficios = await prisma.peopleSolicitud.groupBy({
    by: ['beneficioId', 'beneficioLabel'],
    where: { categoria },
    _count: { id: true },
    orderBy: { beneficioLabel: 'asc' },
  });

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
          <Link href="/resultados/people" className="destr-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver a PEOPLE
          </Link>
          <span className="destr-badge">Categoría</span>
          <h1>{categoriaLabel}</h1>
          <p>Selecciona un formulario para ver sus solicitudes</p>
        </div>
      </div>

      <main className="destr-main">
        {beneficios.length === 0 ? (
          <div className="me-empty"><h3>No hay solicitudes</h3><p>Aún no se han registrado solicitudes en esta categoría.</p></div>
        ) : (
          <div className="modules-grid modules-grid--3col">
            {beneficios.map((b) => (
              <Link
                key={b.beneficioId}
                href={`/resultados/people/${categoria}/${b.beneficioId}`}
                className="module-card"
              >
                <div className="card-accent-bar" style={{ background: '#10b981' }} />
                <div className="card-top">
                  <span className="card-tag">Formulario</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{b.beneficioLabel}</h3>
                  <p className="card-desc">{b._count.id} solicitudes</p>
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
        )}
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
