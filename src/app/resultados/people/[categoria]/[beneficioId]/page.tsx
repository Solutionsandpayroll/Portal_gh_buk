import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import FiltroActividad from '@/components/FiltroActividad';
import '../../../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../../../../mis-evaluaciones/MisEvaluaciones.css';
import '../../../../Dashboard.css';

export const dynamic = 'force-dynamic';

export default async function PeopleBeneficioPage({ params, searchParams }: { params: Promise<{ categoria: string; beneficioId: string }>; searchParams: Promise<{ actividad?: string }> }) {
  const { categoria, beneficioId } = await params;
  const { actividad } = await searchParams;

  const where: any = { categoria, beneficioId };
  if (actividad) {
    where.campos = { some: { nombre: 'Actividades', valor: actividad } };
  }

  const solicitudes = await prisma.peopleSolicitud.findMany({
    where,
    include: { campos: true },
    orderBy: { createdAt: 'desc' },
  });

  // Obtener valores únicos de actividad para el filtro
  const actividadesUnicas = beneficioId === 'people_valores'
    ? [...new Set(solicitudes.flatMap(s => s.campos.filter(c => c.nombre === 'Actividades').map(c => c.valor)))]
    : [];

  // Detectar si hay fechas, correo, duracion o hora en las solicitudes
  const tieneFechas = solicitudes.some(s => s.fechas.length > 0 || s.fechaCita);
  const tieneCorreo = solicitudes.some(s => s.correoContacto);
  const tieneDuracion = solicitudes.some(s => s.duracionMinutos);
  const tieneHora = solicitudes.some(s => s.horaSesion);
  const tieneAdjunto = solicitudes.some(s => s.adjuntoUrl);

  const getDownloadUrl = (adjuntoUrl: string) => {
    const match = adjuntoUrl.match(/filename=([^&]+)/);
    if (match) {
      return `/api/people/download?filename=${decodeURIComponent(match[1])}`;
    }
    return adjuntoUrl;
  };

  console.log("[FILTRO] beneficioId:", beneficioId, "actividadesUnicas:", actividadesUnicas, "solicitudes:", solicitudes.length);

  if (solicitudes.length === 0) {
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
          </div>
        </header>
        <main className="destr-main">
          <div className="me-empty"><h3>No hay solicitudes</h3></div>
        </main>
      </div>
    );
  }

  // Obtener todos los nombres de campos dinámicos únicos
  const campoNames = [...new Set(solicitudes.flatMap(s => s.campos.map(c => c.nombre)))];

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
        </div>
      </header>

      <div className="destr-hero">
        <div className="destr-hero-inner">
          <Link href={`/resultados/people/${categoria}`} className="destr-back">← Volver</Link>
          <span className="destr-badge">Admin</span>
          <h1>{solicitudes[0]?.beneficioLabel || beneficioId}</h1>
          <p>{solicitudes.length} solicitudes registradas</p>
        </div>
      </div>

      {beneficioId === 'people_valores' && actividadesUnicas.length > 0 && (
        <FiltroActividad actividades={actividadesUnicas} actividadSeleccionada={actividad} />
      )}

      <main className="destr-main">
        <div className="me-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="me-table" style={{ minWidth: '800px' }}>
             <thead>
               <tr>
                 <th>Fecha solicitud</th>
                 <th>Nombre</th>
                 {tieneCorreo && <th>Correo</th>}
                 {tieneDuracion && <th>Duración</th>}
                 {tieneHora && <th>Hora</th>}
                 {tieneFechas && <th>Fecha(s) seleccionada(s)</th>}
                 {tieneAdjunto && <th>Archivo PDF</th>}
                 {campoNames.map(name => <th key={name}>{name}</th>)}
                 <th>Estado</th>
               </tr>
             </thead>
             <tbody>
               {solicitudes.map(s => (
                 <tr key={s.id}>
                   <td className="me-td-date">{new Date(s.createdAt).toLocaleDateString('es-CO')}</td>
                   <td>{s.nombre || '—'}</td>
                   {tieneCorreo && <td>{s.correoContacto || '—'}</td>}
                   {tieneDuracion && <td>{s.duracionMinutos ? `${s.duracionMinutos} min` : '—'}</td>}
                   {tieneHora && <td>{s.horaSesion || '—'}</td>}
                   {tieneFechas && <td>
                     {s.fechas.length > 0
                       ? s.fechas.map(f => {
                           const parts = f.split('-');
                           return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : f;
                         }).join(', ')
                       : s.fechaCita || '—'}
                   </td>}
                    {tieneAdjunto && <td>
                      {s.adjuntoUrl ? (
                        <a href={getDownloadUrl(s.adjuntoUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </a>
                      ) : '—'}
                    </td>}
                   {campoNames.map(name => {
                     const campo = s.campos.find(c => c.nombre === name);
                     return <td key={name}>{campo?.valor || '—'}</td>;
                   })}
                   <td>
                     <span style={{
                       padding: '0.2rem 0.6rem',
                       borderRadius: '6px',
                       fontSize: '0.72rem',
                       fontWeight: 700,
                       textTransform: 'uppercase',
                       background: s.estado === 'pendiente' ? '#fef3c7' : '#d1fae5',
                       color: s.estado === 'pendiente' ? '#92400e' : '#065f46',
                     }}>
                       {s.estado}
                     </span>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
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
