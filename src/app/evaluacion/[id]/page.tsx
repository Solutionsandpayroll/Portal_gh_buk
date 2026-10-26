'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BarraHorizontal } from '@/components/GraficaBarras';
import '../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../../evaluacion-anual/EvaluacionAnual.css';
import './EvaluacionDetalle.css';

interface RespuestaDetalle {
  id: string;
  puntuacion: number;
  nivel: string;
  competencia: {
    id: string;
    tipo: string;
    nombre: string;
  };
}

interface EvaluacionDetalle {
  id: string;
  evaluadoNombre: string;
  tipo: string;
  cargo: string | null;
  periodo: string;
  calidad: number | null;
  cantidadProductividad: number | null;
  tiempoOportunidad: number | null;
  notaFinal: number | null;
  notaPotencial: number | null;
  categoriaNineBox: string | null;
  feedback: string | null;
  estado: string;
  createdAt: string;
  evaluador: {
    name: string;
    email: string;
  };
  respuestas: RespuestaDetalle[];
}

const TIPO_LABEL: Record<string, string> = {
  estrategico: 'Estratégico',
  tactico: 'Táctico',
  operativo: 'Operativo',
  general: 'General',
};

const NIVELES = ['operativo', 'tactico', 'estrategico'];

const criterios = [
  { valor: 5, label: 'SOBRESALIENTE' },
  { valor: 4, label: 'SUPERIOR' },
  { valor: 3, label: 'ESPERADO' },
  { valor: 2, label: 'BAJO' },
  { valor: 1, label: 'MUY BAJO' },
];

const comportamientos: Record<string, Record<number, string>> = {
  'ACTÚA CON INTEGRIDAD': { 5: 'Actúa como referente de integridad. Promueve activamente el cumplimiento de normas y valores organizacionales, influyendo positivamente en otros colaboradores.', 4: 'Demuestra un comportamiento ético consistente, cumple rigurosamente las normas y promueve buenas prácticas dentro de su equipo.', 3: 'Cumple las normas, políticas y lineamientos de la organización de manera adecuada y consistente.', 2: 'Presenta incumplimientos ocasionales o requiere recordatorios frecuentes sobre normas, procedimientos o compromisos adquiridos.', 1: 'Incumple normas, políticas o compromisos de manera recurrente, generando riesgos para la organización.' },
  'ORIENTACIÓN AL CLIENTE': { 5: 'Supera constantemente las expectativas del cliente, anticipa necesidades y genera experiencias altamente satisfactorias.', 4: 'Brinda soluciones oportunas y efectivas, demostrando una orientación al servicio superior a la esperada.', 3: 'Atiende adecuadamente los requerimientos del cliente, cumpliendo los tiempos y estándares establecidos.', 2: 'Atiende los requerimientos de manera parcial o presenta demoras que afectan la experiencia del cliente.', 1: 'Presenta dificultades recurrentes para atender las necesidades del cliente, generando insatisfacción o reprocesos.' },
  'ADAPTACIÓN AL CAMBIO': { 5: 'Lidera y promueve el cambio, ayudando a otros a adaptarse y generando mejoras para la organización.', 4: 'Se adapta rápidamente a nuevas condiciones y mantiene un alto nivel de desempeño ante los cambios.', 3: 'Se ajusta adecuadamente a cambios en procesos, prioridades o entorno, manteniendo los resultados esperados.', 2: 'Requiere tiempo adicional o acompañamiento para adaptarse a los cambios, afectando parcialmente su desempeño.', 1: 'Muestra resistencia frecuente al cambio, afectando el cumplimiento de objetivos o la dinámica del equipo.' },
  'ORIENTACIÓN AL LOGRO': { 5: 'Supera consistentemente las metas asignadas, prioriza adecuadamente y responde de manera sobresaliente ante situaciones de alta exigencia.', 4: 'Cumple y frecuentemente supera los objetivos establecidos, manteniendo altos niveles de productividad y efectividad.', 3: 'Cumple los objetivos y responsabilidades asignadas dentro de los tiempos y estándares esperados.', 2: 'Cumple parcialmente los objetivos o requiere seguimiento frecuente para alcanzar los resultados esperados.', 1: 'No logra los objetivos establecidos y presenta dificultades recurrentes para gestionar prioridades y responder a las exigencias del cargo.' },
  'CAPACIDAD DE APRENDIZAJE': { 5: 'Busca activamente nuevas oportunidades de aprendizaje y comparte conocimientos que fortalecen al equipo.', 4: 'Aprende rápidamente y aplica nuevos conocimientos de manera efectiva, mejorando su desempeño.', 3: 'Adquiere y aplica los conocimientos necesarios para desempeñar adecuadamente sus funciones.', 2: 'Requiere acompañamiento frecuente para adquirir o aplicar nuevos conocimientos.', 1: 'Presenta resistencia o dificultades significativas para aprender y aplicar nuevos conocimientos requeridos por el cargo.' },
  'TRABAJO COLABORATIVO': { 5: 'Promueve activamente la colaboración entre áreas, genera sinergias y es reconocido como facilitador del trabajo en equipo.', 4: 'Colabora de manera proactiva, comparte información y contribuye positivamente al logro de objetivos comunes.', 3: 'Mantiene relaciones adecuadas de trabajo y colabora cuando es requerido para alcanzar los objetivos del equipo.', 2: 'Colabora de manera limitada o presenta dificultades ocasionales para trabajar con otros.', 1: 'Presenta dificultades frecuentes para trabajar de manera colaborativa, comparte información de forma limitada y muestra poca disposición para coordinarse con otros, lo que afecta el cumplimiento de los objetivos del equipo.' },
  'LIDERAZGO': { 5: 'Inspira y moviliza al equipo de manera sobresaliente. Desarrolla personas, genera compromiso y logra resultados sostenibles a través de otros.', 4: 'Dirige efectivamente al equipo, realiza seguimiento constante, brinda orientación y favorece el desarrollo de los colaboradores.', 3: 'Gestiona adecuadamente al equipo, asigna responsabilidades y realiza seguimiento para el cumplimiento de objetivos.', 2: 'Presenta dificultades ocasionales para dirigir, orientar o desarrollar a los integrantes del equipo.', 1: 'Presenta dificultades recurrentes para liderar personas, gestionar el desempeño o generar compromiso en el equipo.' },
  'PENSAMIENTO ANALÍTICO': { 5: 'Analiza información compleja, identifica causas raíz, anticipa riesgos y desarrolla soluciones de alto impacto para la organización.', 4: 'Analiza información de manera estructurada, identifica problemas relevantes y propone soluciones efectivas de forma consistente.', 3: 'Analiza adecuadamente la información disponible y resuelve los problemas habituales de su gestión.', 2: 'Requiere apoyo frecuente para analizar situaciones o identificar alternativas de solución.', 1: 'Presenta dificultades recurrentes para analizar información, identificar problemas o tomar decisiones efectivas.' },
  'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO': { 5: 'Desarrolla equipos altamente comprometidos y autónomos. Identifica y potencia el talento, promueve sucesiones y genera resultados sostenibles a través del equipo.', 4: 'Establece objetivos claros, delega efectivamente y promueve el desarrollo continuo de los colaboradores.', 3: 'Dirige adecuadamente al equipo, realiza seguimiento al desempeño y brinda orientación cuando es necesario.', 2: 'Presenta dificultades para delegar, desarrollar o alinear al equipo hacia los objetivos establecidos.', 1: 'No desarrolla a las personas, genera dependencia excesiva o presenta problemas recurrentes en la gestión del equipo.' },
  'PENSAMIENTO ESTRATÉGICO': { 5: 'Anticipa tendencias, identifica oportunidades de alto impacto y toma decisiones que generan ventajas competitivas para la organización.', 4: 'Analiza información de manera integral, identifica riesgos y oportunidades relevantes y propone acciones alineadas al negocio.', 3: 'Comprende adecuadamente el contexto de la organización y toma decisiones coherentes con los objetivos estratégicos.', 2: 'Analiza parcialmente la información disponible y presenta dificultades para anticipar riesgos o impactos de sus decisiones.', 1: 'Se enfoca únicamente en la operación inmediata y toma decisiones sin considerar el contexto o los objetivos estratégicos de la organización.' },
  'AGILIDAD DE APRENDIZAJE': { 5: 'Aprende con rapidez, busca activamente nuevos aprendizajes, incorpora retroalimentación y aplica lo aprendido con éxito en situaciones nuevas o de mayor complejidad.', 4: 'Aprende rápidamente, incorpora nuevos conocimientos y los aplica efectivamente ante situaciones diferentes a las habituales.', 3: 'Adquiere los conocimientos necesarios y los aplica adecuadamente cuando enfrenta nuevas situaciones o responsabilidades.', 2: 'Requiere acompañamiento frecuente para incorporar nuevos conocimientos y trasladarlos a situaciones diferentes.', 1: 'Presenta dificultades recurrentes para incorporar aprendizajes o aplicarlos frente a situaciones nuevas.' },
  'GESTIÓN DE LA COMPLEJIDAD Y ADAPTACIÓN': { 5: 'Se desenvuelve con efectividad ante escenarios de alta incertidumbre y complejidad, analiza situaciones de manera integral, anticipa riesgos y cambios y genera soluciones o mejoras de alto impacto.', 4: 'Se adapta rápidamente a cambios y nuevos retos, analiza situaciones de manera estructurada, identifica alternativas y responde efectivamente aun cuando aumenta la complejidad.', 3: 'Se adapta adecuadamente a cambios y situaciones nuevas, analiza los problemas habituales y encuentra soluciones apropiadas dentro de su contexto de trabajo.', 2: 'Requiere tiempo y acompañamiento para adaptarse a cambios o situaciones poco conocidas y para analizar problemas que presentan mayor complejidad.', 1: 'Presenta dificultades frecuentes para adaptarse a cambios o situaciones nuevas y para analizar y resolver problemas cuando las condiciones se apartan de lo habitual.' },
  'CAPACIDAD PARA ASUMIR MAYOR RESPONSABILIDAD': { 5: 'Demuestra capacidad para asumir responsabilidades significativamente mayores, gestionando con autonomía situaciones de alta complejidad y generando impacto más allá de su responsabilidad actual.', 4: 'Evidencia condiciones claras para asumir responsabilidades de mayor alcance o complejidad en el corto o mediano plazo, con un nivel de autonomía creciente.', 3: 'Demuestra condiciones para ampliar progresivamente su nivel de responsabilidad, alcance o complejidad, con el desarrollo y acompañamiento correspondiente.', 2: 'Requiere fortalecimiento y desarrollo adicional antes de asumir responsabilidades de mayor alcance o complejidad.', 1: 'Presenta dificultades para asumir mayores niveles de autonomía, responsabilidad o complejidad, incluso cuando cuenta con las condiciones y acompañamiento requeridos para desarrollarlos.' },
};

const desempenoCargoComportamientos: Record<string, Record<number, string>> = {
  'CALIDAD': {
    5: 'Mantiene de manera consistente un nivel excepcional de calidad, anticipa y previene errores y contribuye a mejorar los estándares o la calidad de los procesos.',
    4: 'Mantiene consistentemente un nivel de calidad superior al esperado, presenta pocos errores y requiere mínimas correcciones en sus entregables.',
    3: 'Ejecuta sus responsabilidades de acuerdo con los estándares definidos para el cargo, manteniendo un nivel de calidad y precisión acorde con lo esperado.',
    2: 'Cumple parcialmente los estándares de calidad; presenta errores recurrentes y requiere correcciones o seguimiento para alcanzar el resultado esperado.',
    1: 'Presenta errores frecuentes o incumplimientos que afectan significativamente la calidad de los resultados y requiere seguimiento y corrección constante.',
  },
  'CANTIDAD / PRODUCTIVIDAD': {
    5: 'Supera consistentemente el volumen de trabajo esperado, optimiza su capacidad de producción y genera resultados significativamente superiores a los requeridos para su cargo.',
    4: 'Supera de manera frecuente el volumen de trabajo esperado, manteniendo un nivel adecuado de calidad en sus resultados.',
    3: 'Cumple de manera consistente con el volumen de trabajo establecido para su cargo y atiende las responsabilidades asignadas dentro del nivel esperado.',
    2: 'Alcanza parcialmente el volumen de trabajo esperado y requiere seguimiento para cumplir con las responsabilidades asignadas.',
    1: 'Produce un volumen de trabajo significativamente inferior al esperado y presenta incumplimientos frecuentes frente a las responsabilidades asignadas.',
  },
  'TIEMPO / OPORTUNIDAD': {
    5: 'Cumple consistentemente antes de los plazos establecidos, anticipa necesidades y contribuye a optimizar los tiempos de ejecución o respuesta del proceso.',
    4: 'Cumple regularmente los plazos establecidos y, cuando las condiciones lo permiten, anticipa entregas o responde oportunamente a requerimientos prioritarios.',
    3: 'Cumple de manera consistente con los tiempos y plazos establecidos para sus responsabilidades y entregables.',
    2: 'Cumple parcialmente los tiempos establecidos y presenta retrasos recurrentes que requieren seguimiento o intervención.',
    1: 'Incumple frecuentemente los plazos establecidos y sus retrasos afectan el desarrollo de actividades, procesos o resultados del equipo.',
  },
};

function NineBoxMatrix({ desempeno, potencial }: { desempeno: number; potencial: number }) {
  const clasificar = (nota: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (nota >= 4.0) return 'Alto';
    if (nota >= 3.0) return 'Medio';
    return 'Bajo';
  };
  
  const posDesempeno = clasificar(desempeno);
  const posPotencial = clasificar(potencial);
  
  const matrix = [
    ['Alto Potencial / Bajo Desempeño', 'Alto Potencial / Medio Desempeño', 'Alto Potencial / Alto Desempeño'],
    ['Medio Potencial / Bajo Desempeño', 'Medio Potencial / Medio Desempeño', 'Medio Potencial / Alto Desempeño'],
    ['Bajo Potencial / Bajo Desempeño', 'Bajo Potencial / Medio Desempeño', 'Bajo Potencial / Alto Desempeño'],
  ];
  
  const getPosition = (): [number, number] => {
    const rowMap = { 'Alto': 0, 'Medio': 1, 'Bajo': 2 };
    const colMap = { 'Bajo': 0, 'Medio': 1, 'Alto': 2 };
    return [rowMap[posPotencial], colMap[posDesempeno]];
  };
  
  const [activeRow, activeCol] = getPosition();
  
  return (
    <div className="ea-nine-box-matrix">
      <div className="ea-nine-box-title">Matriz Nine Box</div>
      <div className="ea-nine-box-container">
        <div className="ea-nine-box-axis-y">
          <span className="ea-nine-box-axis-label">← Potencial →</span>
        </div>
        <div className="ea-nine-box-grid-wrapper">
          <div className="ea-nine-box-grid">
            {matrix.map((row, rowIdx) => (
              <div key={rowIdx} className="ea-nine-box-row">
                {row.map((cell, colIdx) => (
                  <div
                    key={colIdx}
                    className={`ea-nine-box-cell ${rowIdx === activeRow && colIdx === activeCol ? 'ea-nine-box-cell--active' : ''}`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="ea-nine-box-axis-x">
            <span className="ea-nine-box-axis-label">← Desempeño →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EvaluacionDetallePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evaluacion, setEvaluacion] = useState<EvaluacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'cargo' | 'competencias' | 'potencial'>('cargo');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/evaluaciones/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setEvaluacion(data);
      })
      .catch(() => setError('Error al cargar la evaluación'))
      .finally(() => setLoading(false));
  }, [id]);

  const sortedRespuestas = evaluacion?.respuestas
    ? [...evaluacion.respuestas].sort((a, b) => {
        if (a.competencia.tipo === b.competencia.tipo) return 0;
        if (a.competencia.tipo === 'transversal') return -1;
        if (b.competencia.tipo === 'transversal') return 1;
        if (a.competencia.tipo === 'potencial') return 1;
        if (b.competencia.tipo === 'potencial') return -1;
        return 0;
      })
    : [];

  const desempenoRespuestas = sortedRespuestas.filter((r) => r.competencia.tipo !== 'potencial');
  const potencialRespuestas = sortedRespuestas.filter((r) => r.competencia.tipo === 'potencial');

  // Calcular nota de competencias
  const notaCompetencias = desempenoRespuestas.length > 0
    ? desempenoRespuestas.reduce((sum, r) => sum + r.puntuacion, 0) / desempenoRespuestas.length
    : null;

  const RESP_TIPO = ({ resp, showLabel = true }: { resp: RespuestaDetalle, showLabel?: boolean }) => (
    <div key={resp.id} className="competencia-row">
      <div className="competencia-info"><span className="competencia-nombre">{resp.competencia.nombre}</span></div>
      <div className="competencia-score">
        {showLabel && <span className="score-label">Calificación</span>}
        <div className="score-pills">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`score-pill score-pill--readonly${resp.puntuacion === n ? ' score-pill--active' : ''}`}>{n}</span>
          ))}
        </div>
        <span className="score-selected-label">{criterios.find((c) => c.valor === resp.puntuacion)?.label}</span>
        {comportamientos[resp.competencia.nombre]?.[resp.puntuacion] && (
          <p className="ea-comportamiento-text-detalle">{comportamientos[resp.competencia.nombre][resp.puntuacion]}</p>
        )}
      </div>
    </div>
  );

  const NIVELES_DETALLE = ['operativo', 'tactico', 'estrategico'];

  if (loading) {
    return (
      <div className="destr-page">
        <div className="ed-loading-overlay">
          <div className="ed-loading-spinner"></div>
          <p className="ed-loading-text">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluacion) {
    return (
      <div className="destr-page">
        <div className="destr-main">
          <div className="me-empty">
            <h3>{error || 'Evaluación no encontrada'}</h3>
            <Link href="/mis-evaluaciones" className="btn-primary-destr">Volver al historial</Link>
          </div>
        </div>
      </div>
    );
  }

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
          <button type="button" onClick={() => router.back()} className="destr-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver
          </button>
          <span className="destr-badge">{TIPO_LABEL[evaluacion.tipo] || evaluacion.tipo}</span>
          <h1>Detalle de Evaluación</h1>
          <p>{evaluacion.evaluadoNombre} — Periodo {evaluacion.periodo}</p>
        </div>
      </div>

      <main className="destr-main">
        {/* Resumen */}
        <section className="form-section">
          <div className="section-header">
            <h2 className="section-title">Resumen</h2>
          </div>
          <div className="ed-grid-resumen">
            <div className="ed-dato">
              <span className="ed-dato-label">Evaluado</span>
              <span className="ed-dato-value">{evaluacion.evaluadoNombre}</span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Evaluador</span>
              <span className="ed-dato-value">{evaluacion.evaluador.name}</span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Nivel</span>
              <span className="ed-dato-value">{TIPO_LABEL[evaluacion.tipo] || evaluacion.tipo}</span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Periodo</span>
              <span className="ed-dato-value">{evaluacion.periodo}</span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Fecha</span>
              <span className="ed-dato-value">{new Date(evaluacion.createdAt).toLocaleDateString('es-CO')}</span>
            </div>
            {evaluacion.calidad !== null && evaluacion.cantidadProductividad !== null && evaluacion.tiempoOportunidad !== null && (
              <div className="ed-dato">
                <span className="ed-dato-label">Desempeño del Cargo</span>
                <span className="ed-dato-value ed-dato-nota">
                  {((evaluacion.calidad + evaluacion.cantidadProductividad + evaluacion.tiempoOportunidad) / 3).toFixed(1)}
                </span>
              </div>
            )}
            {notaCompetencias !== null && (
              <div className="ed-dato">
                <span className="ed-dato-label">Competencias</span>
                <span className="ed-dato-value ed-dato-nota">
                  {notaCompetencias.toFixed(1)}
                </span>
              </div>
            )}
            <div className="ed-dato">
              <span className="ed-dato-label">Resultado Global</span>
              <span className="ed-dato-value ed-dato-nota">
                {evaluacion.notaFinal !== null ? Number(evaluacion.notaFinal).toFixed(1) : '—'}
              </span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Nota Potencial</span>
              <span className="ed-dato-value ed-dato-nota">
                {evaluacion.notaPotencial !== null ? Number(evaluacion.notaPotencial).toFixed(1) : '—'}
              </span>
            </div>
            <div className="ed-dato">
              <span className="ed-dato-label">Nine Box</span>
              <span className={`ea-nine-box-value ea-nine-box--${evaluacion.categoriaNineBox?.includes('Alto') ? 'alto' : evaluacion.categoriaNineBox?.includes('Medio') ? 'medio' : 'bajo'}`}>
                {evaluacion.categoriaNineBox || '—'}
              </span>
            </div>
          </div>
        </section>

         {/* Gráficas de Resultados */}
         {(desempenoRespuestas.length > 0 || evaluacion.calidad !== null) && (
           <section className="form-section">
             <div className="section-header">
               <h2 className="section-title">Resultados de la Evaluación</h2>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
               {/* Resultado Global */}
               {evaluacion.notaFinal !== null && (
                 <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resultado Global</span>
                   <div style={{ fontSize: '3rem', fontWeight: 800, color: '#1e3a8a', margin: '0.5rem 0' }}>{Number(evaluacion.notaFinal).toFixed(2)}</div>
                   <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                     <span>Competencias: <strong>{notaCompetencias?.toFixed(2) || '—'}</strong></span>
                      <span>Desempeño: <strong>{(evaluacion.calidad !== null && evaluacion.cantidadProductividad !== null && evaluacion.tiempoOportunidad !== null) ? ((evaluacion.calidad + evaluacion.cantidadProductividad + evaluacion.tiempoOportunidad) / 3).toFixed(2) : '—'}</strong></span>
                   </div>
                 </div>
               )}

               {/* Competencias Transversales */}
               {(() => {
                 const transversales = desempenoRespuestas.filter(r => r.competencia.tipo === 'transversal');
                 if (transversales.length === 0) return null;
                 return (
                   <div style={{ padding: '1rem' }}>
                     <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Competencias Transversales</h4>
                     {transversales.map((r, i) => (
                       <BarraHorizontal key={i} nombre={r.competencia.nombre} valor={r.puntuacion} color="#4f7cff" />
                     ))}
                   </div>
                 );
               })()}

               {/* Competencias del Nivel */}
               {(() => {
                 const nivel = desempenoRespuestas.filter(r => r.competencia.tipo !== 'transversal' && r.competencia.tipo !== 'potencial');
                 if (nivel.length === 0) return null;
                 return (
                   <div style={{ padding: '1rem' }}>
                     <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Competencias del Nivel ({TIPO_LABEL[evaluacion.tipo] || evaluacion.tipo})</h4>
                     {nivel.map((r, i) => (
                       <BarraHorizontal key={i} nombre={r.competencia.nombre} valor={r.puntuacion} color="#f59e0b" />
                     ))}
                   </div>
                 );
               })()}

               {/* Desempeño del Cargo */}
               {(evaluacion.calidad !== null || evaluacion.cantidadProductividad !== null || evaluacion.tiempoOportunidad !== null) && (
                 <div style={{ padding: '1rem' }}>
                   <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Desempeño del Cargo</h4>
                   {evaluacion.calidad !== null && <BarraHorizontal nombre="Calidad" valor={evaluacion.calidad} color="#10b981" />}
                   {evaluacion.cantidadProductividad !== null && <BarraHorizontal nombre="Cantidad/Productividad" valor={evaluacion.cantidadProductividad} color="#10b981" />}
                   {evaluacion.tiempoOportunidad !== null && <BarraHorizontal nombre="Tiempo/Oportunidad" valor={evaluacion.tiempoOportunidad} color="#10b981" />}
                 </div>
               )}
             </div>
           </section>
         )}

         {/* Nine Box Matrix */}
         {evaluacion.notaFinal !== null && evaluacion.notaPotencial !== null && (
           <section className="form-section">
             <NineBoxMatrix desempeno={Number(evaluacion.notaFinal)} potencial={Number(evaluacion.notaPotencial)} />
           </section>
         )}

        {/* Tabs para secciones de evaluación */}
        {(evaluacion.calidad !== null || evaluacion.cantidadProductividad !== null || evaluacion.tiempoOportunidad !== null || desempenoRespuestas.length > 0 || potencialRespuestas.length > 0) && (
          <div className="ed-tabs">
            {(evaluacion.calidad !== null || evaluacion.cantidadProductividad !== null || evaluacion.tiempoOportunidad !== null) && (
              <button
                className={`ed-tab${tabActiva === 'cargo' ? ' ed-tab--active' : ''}`}
                onClick={() => setTabActiva('cargo')}
              >
                Desempeño en el Cargo
              </button>
            )}
            {desempenoRespuestas.length > 0 && (
              <button
                className={`ed-tab${tabActiva === 'competencias' ? ' ed-tab--active' : ''}`}
                onClick={() => setTabActiva('competencias')}
              >
                Competencias de Desempeño
              </button>
            )}
            {potencialRespuestas.length > 0 && (
              <button
                className={`ed-tab${tabActiva === 'potencial' ? ' ed-tab--active' : ''}`}
                onClick={() => setTabActiva('potencial')}
              >
                Evaluación de Potencial
              </button>
            )}
          </div>
        )}

        {/* Desempeño en el Cargo */}
        {tabActiva === 'cargo' && (evaluacion.calidad !== null || evaluacion.cantidadProductividad !== null || evaluacion.tiempoOportunidad !== null) && (
          <section className="form-section form-section--competencias">
            <div className="section-header">
              <h2 className="section-title">Desempeño en el Cargo</h2>
              <p className="section-subtitle">Calificación</p>
            </div>
            <div className="competencias-group">
              <div className="competencias-list">
                {evaluacion.calidad !== null && (
                  <div className="competencia-row">
                    <div className="competencia-info"><span className="competencia-nombre">CALIDAD</span></div>
                    <div className="competencia-score">
                      <span className="score-label">Calificación</span>
                      <div className="score-pills">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`score-pill score-pill--readonly${evaluacion.calidad === n ? ' score-pill--active' : ''}`}>{n}</span>
                        ))}
                      </div>
                      <span className="score-selected-label">{criterios.find((c) => c.valor === evaluacion.calidad)?.label}</span>
                      {desempenoCargoComportamientos['CALIDAD']?.[evaluacion.calidad] && (
                        <p className="ea-comportamiento-text-detalle">{desempenoCargoComportamientos['CALIDAD'][evaluacion.calidad]}</p>
                      )}
                    </div>
                  </div>
                )}
                {evaluacion.cantidadProductividad !== null && (
                  <div className="competencia-row">
                    <div className="competencia-info"><span className="competencia-nombre">CANTIDAD / PRODUCTIVIDAD</span></div>
                    <div className="competencia-score">
                      <span className="score-label">Calificación</span>
                      <div className="score-pills">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`score-pill score-pill--readonly${evaluacion.cantidadProductividad === n ? ' score-pill--active' : ''}`}>{n}</span>
                        ))}
                      </div>
                      <span className="score-selected-label">{criterios.find((c) => c.valor === evaluacion.cantidadProductividad)?.label}</span>
                      {desempenoCargoComportamientos['CANTIDAD / PRODUCTIVIDAD']?.[evaluacion.cantidadProductividad] && (
                        <p className="ea-comportamiento-text-detalle">{desempenoCargoComportamientos['CANTIDAD / PRODUCTIVIDAD'][evaluacion.cantidadProductividad]}</p>
                      )}
                    </div>
                  </div>
                )}
                {evaluacion.tiempoOportunidad !== null && (
                  <div className="competencia-row">
                    <div className="competencia-info"><span className="competencia-nombre">TIEMPO / OPORTUNIDAD</span></div>
                    <div className="competencia-score">
                      <span className="score-label">Calificación</span>
                      <div className="score-pills">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`score-pill score-pill--readonly${evaluacion.tiempoOportunidad === n ? ' score-pill--active' : ''}`}>{n}</span>
                        ))}
                      </div>
                      <span className="score-selected-label">{criterios.find((c) => c.valor === evaluacion.tiempoOportunidad)?.label}</span>
                      {desempenoCargoComportamientos['TIEMPO / OPORTUNIDAD']?.[evaluacion.tiempoOportunidad] && (
                        <p className="ea-comportamiento-text-detalle">{desempenoCargoComportamientos['TIEMPO / OPORTUNIDAD'][evaluacion.tiempoOportunidad]}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Competencias de Desempeño */}
        {tabActiva === 'competencias' && desempenoRespuestas.length > 0 && (
          <section className="form-section form-section--competencias">
            <div className="section-header">
              <h2 className="section-title">Competencias de Desempeño</h2>
              <p className="section-subtitle">Calificación</p>
            </div>

            {NIVELES_DETALLE.map(nivel => {
              const transNivel = desempenoRespuestas.filter(r => r.competencia.tipo === 'transversal' && r.nivel === nivel);
              const nivelNivel = desempenoRespuestas.filter(r => r.competencia.tipo === nivel);
              if (transNivel.length === 0 && nivelNivel.length === 0) return null;
              return (
                <div key={nivel}>
                  <div className="competencias-group">
                    <h3 className="competencias-group-title">Transversales — {TIPO_LABEL[nivel] || nivel}</h3>
                    <div className="competencias-list">
                      {transNivel.map(resp => <RESP_TIPO key={resp.id} resp={resp} />)}
                    </div>
                  </div>
                  {nivelNivel.length > 0 && (
                    <div className="competencias-group">
                      <h3 className="competencias-group-title competencias-group-title--estrategico">Nivel {TIPO_LABEL[nivel] || nivel}</h3>
                      <div className="competencias-list">
                        {nivelNivel.map(resp => <RESP_TIPO key={resp.id} resp={resp} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Evaluación de Potencial */}
        {tabActiva === 'potencial' && potencialRespuestas.length > 0 && (
          <section className="form-section form-section--competencias">
            <div className="section-header">
              <h2 className="section-title">Evaluación de Potencial</h2>
              <p className="section-subtitle">Calificación</p>
            </div>
            <div className="competencias-group">
              <div className="competencias-list">
                {potencialRespuestas.map((resp) => (
                  <div key={resp.id} className="competencia-row">
                    <div className="competencia-info"><span className="competencia-nombre">{resp.competencia.nombre}</span></div>
                    <div className="competencia-score">
                      <span className="score-label">Calificación</span>
                      <div className="score-pills">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`score-pill score-pill--readonly${resp.puntuacion === n ? ' score-pill--active' : ''}`}>{n}</span>
                        ))}
                      </div>
                      <span className="score-selected-label">{criterios.find((c) => c.valor === resp.puntuacion)?.label}</span>
                      {comportamientos[resp.competencia.nombre]?.[resp.puntuacion] && (
                        <p className="ea-comportamiento-text-detalle">{comportamientos[resp.competencia.nombre][resp.puntuacion]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Retroalimentación */}
        {evaluacion.feedback && (
          <section className="form-section">
            <div className="section-header"><h2 className="section-title">Retroalimentación y Feedforward</h2></div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{evaluacion.feedback}</p>
            </div>
          </section>
        )}

        {/* Acciones */}
        <div className="form-actions">
          <button type="button" onClick={() => router.back()} className="btn-cancel">Volver</button>
          <a
            href={`/api/evaluaciones/${evaluacion.id}/export`}
            className="btn-submit"
            style={{ textDecoration: 'none' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Excel
          </a>
        </div>
      </main>
    </div>
  );
}
