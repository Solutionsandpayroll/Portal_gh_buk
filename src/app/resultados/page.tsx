'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GestionHumanaGraficas } from '@/components/GestionHumanaGraficas';
import '../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../mis-evaluaciones/MisEvaluaciones.css';

interface RespuestaEval {
  puntuacion: number;
  competencia: { nombre: string; tipo: string };
}

interface EvalItem {
  id: string;
  evaluadoNombre: string;
  tipo: string;
  periodo: string;
  calidad: number | null;
  cantidadProductividad: number | null;
  tiempoOportunidad: number | null;
  notaFinal: number | null;
  notaPotencial: number | null;
  categoriaNineBox: string | null;
  estado: string;
  createdAt: string;
  evaluador: { name: string };
  respuestas: RespuestaEval[];
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
  const [tabActiva, setTabActiva] = useState<'descendente' | 'ascendente'>('descendente');
  const [mostrarGraficas, setMostrarGraficas] = useState(false);
  const [misRecibidas, setMisRecibidas] = useState<EvalItem[]>([]);
  const [misEnviadas, setMisEnviadas] = useState<EvalItem[]>([]);
  const [tabEmpleado, setTabEmpleado] = useState<'recibidas' | 'enviadas'>('recibidas');

  const evaluacionesFiltradas = evaluaciones.filter(eva => eva.tipo === tabActiva);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (rol === undefined) return;
    setLoading(true);
    if (rol === 'admin') {
      const url = periodoFiltro ? `/api/admin/evaluaciones?periodo=${periodoFiltro}` : '/api/admin/evaluaciones';
      fetch(url).then(r => r.json()).then(data => { if (Array.isArray(data)) setEvaluaciones(data); else setEvaluaciones([]); }).catch(() => setEvaluaciones([])).finally(() => setLoading(false));
    } else {
      const url = periodoFiltro ? `/api/resultados/mis-evaluaciones?periodo=${periodoFiltro}` : '/api/resultados/mis-evaluaciones';
      fetch(url).then(r => r.json()).then(data => {
        setMisRecibidas(Array.isArray(data.recibidas) ? data.recibidas : []);
        setMisEnviadas(Array.isArray(data.enviadas) ? data.enviadas : []);
      }).catch(() => { setMisRecibidas([]); setMisEnviadas([]); }).finally(() => setLoading(false));
    }
  }, [periodoFiltro, rol]);

  const periodosUnicos = [...new Set([
    ...evaluaciones.map(e => e.periodo),
    ...misRecibidas.map(e => e.periodo),
    ...misEnviadas.map(e => e.periodo),
  ])].sort().reverse();

  // Datos para gráficas (solo descendentes con datos completos)
  const evaluacionesDescendentes = evaluaciones.filter(e => e.tipo === 'descendente' && e.notaFinal !== null && e.notaPotencial !== null);

  // 1. Promedio por Nivel (basado en evaluador - asumiendo que el evaluador indica el nivel)
  const promedioPorNivel = () => {
    const niveles = ['operativo', 'tactico', 'estrategico'];
    return niveles.map(nivel => {
      const evalsNivel = evaluacionesDescendentes.filter(e => e.tipo === nivel);
      const promedio = evalsNivel.length > 0
        ? evalsNivel.reduce((sum, e) => sum + Number(e.notaFinal), 0) / evalsNivel.length
        : 0;
      return { nivel, promedio, cantidad: evalsNivel.length };
    });
  };

  // 2. Distribución Nine Box
  const distribucionNineBox = () => {
    const categorias = {
      'Alto Potencial / Alto Desempeño': 0,
      'Alto Potencial / Medio Desempeño': 0,
      'Alto Potencial / Bajo Desempeño': 0,
      'Medio Potencial / Alto Desempeño': 0,
      'Medio Potencial / Medio Desempeño': 0,
      'Medio Potencial / Bajo Desempeño': 0,
      'Bajo Potencial / Alto Desempeño': 0,
      'Bajo Potencial / Medio Desempeño': 0,
      'Bajo Potencial / Bajo Desempeño': 0,
    };
    
    evaluacionesDescendentes.forEach(e => {
      if (e.categoriaNineBox && categorias[e.categoriaNineBox as keyof typeof categorias] !== undefined) {
        categorias[e.categoriaNineBox as keyof typeof categorias]++;
      }
    });
    
    return Object.entries(categorias).map(([categoria, cantidad]) => ({ categoria, cantidad }));
  };

  // 3. Evolución temporal
  const evolucionTemporal = () => {
    return periodosUnicos.map(periodo => {
      const evalsPeriodo = evaluacionesDescendentes.filter(e => e.periodo === periodo);
      const promedio = evalsPeriodo.length > 0
        ? evalsPeriodo.reduce((sum, e) => sum + Number(e.notaFinal), 0) / evalsPeriodo.length
        : 0;
      return { periodo, promedio, cantidad: evalsPeriodo.length };
    }).reverse();
  };

  // 4. Datos para matriz Nine Box
  const datosNineBox = () => {
    return evaluacionesDescendentes.map(e => ({
      nombre: e.evaluadoNombre,
      desempeno: Number(e.notaFinal),
      potencial: Number(e.notaPotencial),
    }));
  };

  const esAdmin = rol === 'admin';

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
          <span className="destr-badge">{esAdmin ? 'Admin' : 'Mis resultados'}</span>
          <h1>Resultados — Evaluación Anual</h1>
          <p>{esAdmin ? 'Todas las evaluaciones registradas en el sistema' : 'Evaluaciones en las que participas'}</p>
        </div>
      </div>

      <main className="destr-main">
        {esAdmin ? (
        <>
        {/* Tabs */}
        <div className="me-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn-tab${tabActiva === 'descendente' ? ' btn-tab--active' : ''}`}
              onClick={() => setTabActiva('descendente')}
            >
              Descendente (Jefe → Colaborador)
            </button>
            <button
              className={`btn-tab${tabActiva === 'ascendente' ? ' btn-tab--active' : ''}`}
              onClick={() => setTabActiva('ascendente')}
            >
              Ascendente (Colaborador → Jefe)
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="me-filter">
              <label className="me-filter-label">Filtrar por año:</label>
              <select className="me-filter-select" value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)}>
                <option value="">Todos</option>
                {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="me-filter-label">{evaluacionesFiltradas.length} evaluaciones</span>
              {evaluacionesDescendentes.length > 0 && (
                <button
                  className={`btn-tab${mostrarGraficas ? ' btn-tab--active' : ''}`}
                  onClick={() => setMostrarGraficas(!mostrarGraficas)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  {mostrarGraficas ? 'Ver Tabla' : 'Ver Gráficas'}
                </button>
              )}
              {evaluacionesFiltradas.length > 0 && (
                <a
                  href={`/api/admin/evaluaciones/export?tipo=${tabActiva}${periodoFiltro ? `&periodo=${periodoFiltro}` : ''}`}
                  className="me-export-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Exportar Excel
                </a>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="me-loading">Cargando...</div>
        ) : mostrarGraficas && evaluacionesDescendentes.length > 0 ? (
          <div style={{ marginTop: '2rem' }}>
            <GestionHumanaGraficas evaluaciones={evaluacionesDescendentes} />
          </div>
        ) : evaluacionesFiltradas.length === 0 ? (
          <div className="me-empty"><h3>No hay evaluaciones</h3><p>Aún no se ha registrado ninguna evaluación {tabActiva === 'descendente' ? 'descendente' : 'ascendente'}.</p></div>
        ) : tabActiva === 'descendente' ? (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Evaluado</th>
                  <th style={{ textAlign: 'center' }}>Evaluador</th>
                  <th style={{ textAlign: 'center' }}>Periodo</th>
                  <th style={{ textAlign: 'center' }}>Resultado Global</th>
                  <th style={{ textAlign: 'center' }}>Nine Box</th>
                  <th style={{ textAlign: 'center' }}>Fecha</th>
                  <th style={{ textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {evaluacionesFiltradas.map(eva => (
                  <tr key={eva.id}>
                    <td className="me-td-name" style={{ textAlign: 'center' }}>{eva.evaluadoNombre}</td>
                    <td style={{ textAlign: 'center' }}>{eva.evaluador.name}</td>
                    <td style={{ textAlign: 'center' }}>{eva.periodo}</td>
                    <td style={{ textAlign: 'center' }}><span className="me-nota">{eva.notaFinal !== null ? Number(eva.notaFinal).toFixed(1) : '—'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`ea-nine-box-value ea-nine-box--${eva.categoriaNineBox?.includes('Alto') ? 'alto' : eva.categoriaNineBox?.includes('Medio') ? 'medio' : 'bajo'}`}>
                        {eva.categoriaNineBox?.split(' / ').map((part, i) => (
                          <span key={i}>{part}{i === 0 && <br />}</span>
                        )) || '—'}
                      </span>
                    </td>
                    <td className="me-td-date" style={{ textAlign: 'center' }}>{new Date(eva.createdAt).toLocaleDateString('es-CO')}</td>
                    <td style={{ textAlign: 'center' }}><Link href={`/evaluacion/${eva.id}`} className="me-ver-btn">Ver<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="me-table-wrap">
            <table className="me-table">
              <thead>
                <tr>
                  <th>Evaluado</th>
                  <th>Evaluador</th>
                  <th>Periodo</th>
                  <th>Competencias</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {evaluacionesFiltradas.map(eva => (
                  <tr key={eva.id}>
                    <td className="me-td-name">{eva.evaluadoNombre}</td>
                    <td>{eva.evaluador.name}</td>
                    <td>{eva.periodo}</td>
                    <td><span className="me-nota">{eva.notaFinal !== null ? Number(eva.notaFinal).toFixed(1) : '—'}</span></td>
                    <td className="me-td-date">{new Date(eva.createdAt).toLocaleDateString('es-CO')}</td>
                    <td><Link href={`/evaluacion/${eva.id}`} className="me-ver-btn">Ver<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        ) : (
          <>
            {/* Vista de empleado: pestañas Recibidas / Enviadas */}
            <div className="me-toolbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn-tab${tabEmpleado === 'recibidas' ? ' btn-tab--active' : ''}`}
                  onClick={() => setTabEmpleado('recibidas')}
                >
                  Recibidas ({misRecibidas.length})
                </button>
                <button
                  className={`btn-tab${tabEmpleado === 'enviadas' ? ' btn-tab--active' : ''}`}
                  onClick={() => setTabEmpleado('enviadas')}
                >
                  Enviadas ({misEnviadas.length})
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="me-filter">
                  <label className="me-filter-label">Filtrar por año:</label>
                  <select className="me-filter-select" value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)}>
                    <option value="">Todos</option>
                    {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <span className="me-filter-label">
                  {(tabEmpleado === 'recibidas' ? misRecibidas : misEnviadas).length} evaluaciones
                </span>
              </div>
            </div>

            {loading ? (
              <div className="me-loading">Cargando...</div>
            ) : (tabEmpleado === 'recibidas' ? misRecibidas : misEnviadas).length === 0 ? (
              <div className="me-empty"><h3>No hay evaluaciones</h3><p>No tienes evaluaciones {tabEmpleado === 'recibidas' ? 'recibidas' : 'enviadas'} registradas.</p></div>
            ) : (
              <div className="me-table-wrap">
                <table className="me-table">
                  <thead>
                    <tr>
                      <th>Evaluado</th>
                      <th>Evaluador</th>
                      <th>Periodo</th>
                      <th>Resultado Global</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tabEmpleado === 'recibidas' ? misRecibidas : misEnviadas).map(eva => (
                      <tr key={eva.id}>
                        <td className="me-td-name">{eva.evaluadoNombre}</td>
                        <td>{eva.evaluador.name}</td>
                        <td>{eva.periodo}</td>
                        <td><span className="me-nota">{eva.notaFinal !== null ? Number(eva.notaFinal).toFixed(1) : '—'}</span></td>
                        <td className="me-td-date">{new Date(eva.createdAt).toLocaleDateString('es-CO')}</td>
                        <td><Link href={`/evaluacion/${eva.id}`} className="me-ver-btn">Ver<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
