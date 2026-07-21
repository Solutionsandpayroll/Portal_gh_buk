'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import '../formulario-desempeno/FormularioDesempenoEstrategico.css';
import './MisEvaluaciones.css';

interface EvaluacionItem {
  id: string;
  evaluadoNombre: string;
  tipo: string;
  periodo: string;
  notaFinal: number | null;
  estado: string;
  createdAt: string;
}

const TIPO_LABEL: Record<string, string> = {
  estrategico: 'Estratégico',
  tactico: 'Táctico',
  operativo: 'Operativo',
};

export default function MisEvaluacionesPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = periodoFiltro
      ? `/api/evaluaciones?periodo=${periodoFiltro}`
      : '/api/evaluaciones';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvaluaciones(data);
        else setEvaluaciones([]);
      })
      .catch(() => setEvaluaciones([]))
      .finally(() => setLoading(false));
  }, [periodoFiltro]);

  const periodosUnicos = [...new Set(evaluaciones.map((e) => e.periodo))].sort().reverse();

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
          <span className="destr-badge">Historial</span>
          <h1>Mis Evaluaciones</h1>
          <p>Historial de evaluaciones anuales realizadas</p>
        </div>
      </div>

      <main className="destr-main">
        <div className="me-toolbar">
          <div className="me-filter">
            <label className="me-filter-label">Filtrar por año:</label>
            <select
              className="me-filter-select"
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {periodosUnicos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Link href="/evaluacion-anual" className="me-new-btn">
            Nueva Evaluación
          </Link>
        </div>

        {loading ? (
          <div className="me-loading">Cargando evaluaciones...</div>
        ) : evaluaciones.length === 0 ? (
          <div className="me-empty">
            <div className="me-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3>No hay evaluaciones</h3>
            <p>Aún no has realizado ninguna evaluación anual.</p>
            <Link href="/evaluacion-anual" className="btn-primary-destr">Crear primera evaluación</Link>
          </div>
        ) : (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
                  <th>Evaluado</th>
                  <th>Nivel</th>
                  <th>Periodo</th>
                  <th>Nota</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluaciones.map((eva) => (
                  <tr key={eva.id}>
                    <td className="me-td-name">{eva.evaluadoNombre}</td>
                    <td>
                      <span className={`me-badge me-badge--${eva.tipo}`}>
                        {TIPO_LABEL[eva.tipo] || eva.tipo}
                      </span>
                    </td>
                    <td>{eva.periodo}</td>
                    <td>
                      <span className="me-nota">
                        {eva.notaFinal !== null ? Number(eva.notaFinal).toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="me-td-date">
                      {new Date(eva.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      <Link href={`/evaluacion/${eva.id}`} className="me-ver-btn">
                        Ver detalle
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
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
