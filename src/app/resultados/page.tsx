'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import '../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../mis-evaluaciones/MisEvaluaciones.css';

interface EvalItem {
  id: string;
  evaluadoNombre: string;
  tipo: string;
  periodo: string;
  notaFinal: number | null;
  notaPotencial: number | null;
  categoriaNineBox: string | null;
  estado: string;
  createdAt: string;
  evaluador: { name: string };
}

const TIPO_LABEL: Record<string, string> = {
  estrategico: 'Estratégico', tactico: 'Táctico', operativo: 'Operativo', general: 'General',
};

export default function ResultadosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const rol = (session?.user as any)?.rol;

  const [evaluaciones, setEvaluaciones] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState('');

  useEffect(() => {
    if (rol !== 'admin') { router.push('/'); return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [rol, router]);

  useEffect(() => {
    if (rol !== 'admin') return;
    setLoading(true);
    const url = periodoFiltro ? `/api/admin/evaluaciones?periodo=${periodoFiltro}` : '/api/admin/evaluaciones';
    fetch(url).then(r => r.json()).then(data => { if (Array.isArray(data)) setEvaluaciones(data); else setEvaluaciones([]); }).catch(() => setEvaluaciones([])).finally(() => setLoading(false));
  }, [periodoFiltro, rol]);

  const periodosUnicos = [...new Set(evaluaciones.map(e => e.periodo))].sort().reverse();

  if (rol !== 'admin') return null;

  return (
    <div className="destr-page">
      <header className="destr-header">
        <div className="destr-header-inner">
          <div className="destr-header-brand"><img src="/Logo syp.png" alt="Solutions & Payroll" className="destr-logo" /><div className="destr-brand-text"><span className="destr-brand-name">Solutions & Payroll</span><span className="destr-brand-sub">Gestión Humana</span></div></div>
          <div className="destr-header-right"><div className="destr-user"><div className="destr-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div><span className="destr-username">{userName}</span></div></div>
        </div>
      </header>

      <div className="destr-hero">
        <div className="destr-hero-inner">
          <Link href="/" className="destr-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>Volver al inicio</Link>
          <span className="destr-badge">Admin</span>
          <h1>Resultados — Evaluación Anual</h1>
          <p>Todas las evaluaciones registradas en el sistema</p>
        </div>
      </div>

      <main className="destr-main">
        <div className="me-toolbar">
          <div className="me-filter">
            <label className="me-filter-label">Filtrar por año:</label>
            <select className="me-filter-select" value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <span className="me-filter-label">{evaluaciones.length} evaluaciones</span>
        </div>

        {loading ? <div className="me-loading">Cargando...</div> : evaluaciones.length === 0 ? (
          <div className="me-empty"><h3>No hay evaluaciones</h3><p>Aún no se ha registrado ninguna evaluación.</p></div>
        ) : (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
                  <th>Evaluado</th>
                  <th>Evaluador</th>
                  <th>Periodo</th>
                  <th>Desempeño</th>
                  <th>Potencial</th>
                  <th>Nine Box</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones.map(eva => (
                  <tr key={eva.id}>
                    <td className="me-td-name">{eva.evaluadoNombre}</td>
                    <td>{eva.evaluador.name}</td>
                    <td>{eva.periodo}</td>
                    <td><span className="me-nota">{eva.notaFinal !== null ? Number(eva.notaFinal).toFixed(1) : '—'}</span></td>
                    <td><span className="me-nota">{eva.notaPotencial !== null ? Number(eva.notaPotencial).toFixed(1) : '—'}</span></td>
                    <td>
                      <span className={`ea-nine-box-value ea-nine-box--${eva.categoriaNineBox === 'Alto Potencial' ? 'alto' : eva.categoriaNineBox === 'Potencial Medio' ? 'medio' : 'bajo'}`}>
                        {eva.categoriaNineBox || '—'}
                      </span>
                    </td>
                    <td className="me-td-date">{new Date(eva.createdAt).toLocaleDateString('es-CO')}</td>
                    <td><Link href={`/evaluacion/${eva.id}`} className="me-ver-btn">Ver<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
