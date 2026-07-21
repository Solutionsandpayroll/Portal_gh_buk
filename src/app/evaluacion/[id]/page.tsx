'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import '../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import './EvaluacionDetalle.css';

interface RespuestaDetalle {
  id: string;
  puntuacion: number;
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
  periodo: string;
  notaFinal: number | null;
  notaPotencial: number | null;
  categoriaNineBox: string | null;
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
  { valor: 4, label: 'SUPERA' },
  { valor: 3, label: 'CUMPLE' },
  { valor: 2, label: 'LIMITADA' },
  { valor: 1, label: 'NO CUMPLE' },
];

const comportamientos: Record<string, Record<number, string>> = {
  'ACTÚA CON INTEGRIDAD': { 5: 'Actúa como referente de integridad. Promueve activamente el cumplimiento de normas y valores organizacionales, influyendo positivamente en otros colaboradores.', 4: 'Demuestra un comportamiento ético consistente, cumple rigurosamente las normas y promueve buenas prácticas dentro de su equipo.', 3: 'Cumple las normas, políticas y lineamientos de la organización de manera adecuada y consistente.', 2: 'Presenta incumplimientos ocasionales o requiere recordatorios frecuentes sobre normas, procedimientos o compromisos adquiridos.', 1: 'Incumple normas, políticas o compromisos de manera recurrente, generando riesgos para la organización.' },
  'CALIDAD DE TRABAJO': { 5: 'Entrega resultados excepcionales, mejora continuamente los procesos y se convierte en referente de calidad para otros colaboradores.', 4: 'Entrega trabajos de alta calidad, con mínimos errores y escasa necesidad de supervisión o corrección.', 3: 'Entrega trabajos con la calidad esperada, cumpliendo los estándares y requisitos establecidos.', 2: 'Presenta errores recurrentes o incumplimientos parciales que requieren seguimiento o correcciones frecuentes.', 1: 'Presenta errores frecuentes que afectan significativamente la calidad, oportunidad o confiabilidad de los resultados.' },
  'ORIENTACIÓN AL CLIENTE': { 5: 'Supera constantemente las expectativas del cliente, anticipa necesidades y genera experiencias altamente satisfactorias.', 4: 'Brinda soluciones oportunas y efectivas, demostrando una orientación al servicio superior a la esperada.', 3: 'Atiende adecuadamente los requerimientos del cliente, cumpliendo los tiempos y estándares establecidos.', 2: 'Atiende los requerimientos de manera parcial o presenta demoras que afectan la experiencia del cliente.', 1: 'Presenta dificultades recurrentes para atender las necesidades del cliente, generando insatisfacción o reprocesos.' },
  'ADAPTACIÓN AL CAMBIO': { 5: 'Lidera y promueve el cambio, ayudando a otros a adaptarse y generando mejoras para la organización.', 4: 'Se adapta rápidamente a nuevas condiciones y mantiene un alto nivel de desempeño ante los cambios.', 3: 'Se ajusta adecuadamente a cambios en procesos, prioridades o entorno, manteniendo los resultados esperados.', 2: 'Requiere tiempo adicional o acompañamiento para adaptarse a los cambios, afectando parcialmente su desempeño.', 1: 'Muestra resistencia frecuente al cambio, afectando el cumplimiento de objetivos o la dinámica del equipo.' },
  'ORIENTACIÓN AL LOGRO': { 5: 'Supera consistentemente las metas asignadas, prioriza adecuadamente y responde de manera sobresaliente ante situaciones de alta exigencia.', 4: 'Cumple y frecuentemente supera los objetivos establecidos, manteniendo altos niveles de productividad y efectividad.', 3: 'Cumple los objetivos y responsabilidades asignadas dentro de los tiempos y estándares esperados.', 2: 'Cumple parcialmente los objetivos o requiere seguimiento frecuente para alcanzar los resultados esperados.', 1: 'No logra los objetivos establecidos y presenta dificultades recurrentes para gestionar prioridades y responder a las exigencias del cargo.' },
  'CAPACIDAD DE APRENDIZAJE': { 5: 'Busca activamente nuevas oportunidades de aprendizaje y comparte conocimientos que fortalecen al equipo.', 4: 'Aprende rápidamente y aplica nuevos conocimientos de manera efectiva, mejorando su desempeño.', 3: 'Adquiere y aplica los conocimientos necesarios para desempeñar adecuadamente sus funciones.', 2: 'Requiere acompañamiento frecuente para adquirir o aplicar nuevos conocimientos.', 1: 'Presenta resistencia o dificultades significativas para aprender y aplicar nuevos conocimientos requeridos por el cargo.' },
  'TRABAJO COLABORATIVO': { 5: 'Promueve activamente la colaboración entre áreas, genera sinergias y es reconocido como facilitador del trabajo en equipo.', 4: 'Colabora de manera proactiva, comparte información y contribuye positivamente al logro de objetivos comunes.', 3: 'Mantiene relaciones adecuadas de trabajo y colabora cuando es requerido para alcanzar los objetivos del equipo.', 2: 'Colabora de manera limitada o presenta dificultades ocasionales para trabajar con otros.', 1: 'Presenta dificultades recurrentes para colaborar con otros, afectando el logro de objetivos del equipo.' },
  'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO': { 5: 'Desarrolla equipos altamente comprometidos y autónomos. Identifica y potencia el talento, promueve sucesiones y genera resultados sostenibles a través del equipo.', 4: 'Establece objetivos claros, delega efectivamente y promueve el desarrollo continuo de los colaboradores.', 3: 'Dirige adecuadamente al equipo, realiza seguimiento al desempeño y brinda orientación cuando es necesario.', 2: 'Presenta dificultades para delegar, desarrollar o alinear al equipo hacia los objetivos establecidos.', 1: 'No desarrolla a las personas, genera dependencia excesiva o presenta problemas recurrentes en la gestión del equipo.' },
  'PENSAMIENTO ESTRATÉGICO': { 5: 'Anticipa tendencias, identifica oportunidades de alto impacto y toma decisiones que generan ventajas competitivas para la organización.', 4: 'Analiza información de manera integral, identifica riesgos y oportunidades relevantes y propone acciones alineadas al negocio.', 3: 'Comprende adecuadamente el contexto de la organización y toma decisiones coherentes con los objetivos estratégicos.', 2: 'Analiza parcialmente la información disponible y presenta dificultades para anticipar riesgos o impactos de sus decisiones.', 1: 'Se enfoca únicamente en la operación inmediata y toma decisiones sin considerar el contexto o los objetivos estratégicos de la organización.' },
  'LIDERAZGO': { 5: 'Inspira y moviliza al equipo de manera sobresaliente. Desarrolla personas, genera compromiso y logra resultados sostenibles a través de otros.', 4: 'Dirige efectivamente al equipo, realiza seguimiento constante, brinda orientación y favorece el desarrollo de los colaboradores.', 3: 'Gestiona adecuadamente al equipo, asigna responsabilidades y realiza seguimiento para el cumplimiento de objetivos.', 2: 'Presenta dificultades ocasionales para dirigir, orientar o desarrollar a los integrantes del equipo.', 1: 'Presenta dificultades recurrentes para liderar personas, gestionar el desempeño o generar compromiso en el equipo.' },
  'PENSAMIENTO ANALÍTICO': { 5: 'Analiza información compleja, identifica causas raíz, anticipa riesgos y desarrolla soluciones de alto impacto para la organización.', 4: 'Analiza información de manera estructurada, identifica problemas relevantes y propone soluciones efectivas de forma consistente.', 3: 'Analiza adecuadamente la información disponible y resuelve los problemas habituales de su gestión.', 2: 'Requiere apoyo frecuente para analizar situaciones o identificar alternativas de solución.', 1: 'Presenta dificultades recurrentes para analizar información, identificar problemas o tomar decisiones efectivas.' },
  'CAPACIDAD DE APRENDIZAJE (LEARNING AGILITY)': { 5: 'Aprende con gran rapidez, busca activamente nuevos conocimientos y los aplica exitosamente en contextos diferentes.', 4: 'Aprende rápidamente y aplica lo aprendido de forma efectiva en su trabajo.', 3: 'Aprende los conocimientos requeridos dentro de los tiempos esperados.', 2: 'Requiere acompañamiento frecuente para adquirir y aplicar nuevos conocimientos.', 1: 'Presenta dificultades significativas para aprender o aplicar nuevos conocimientos.' },
  'ADAPTABILIDAD Y MANEJO DE LA INCERTIDUMBRE': { 5: 'Busca activamente desafíos nuevos y se adapta con facilidad a contextos cambiantes.', 4: 'Se adapta rápidamente a cambios y nuevos retos manteniendo un desempeño sólido.', 3: 'Se adapta adecuadamente a los cambios esperados.', 2: 'Requiere tiempo considerable para ajustarse a nuevas situaciones.', 1: 'Presenta resistencia frecuente al cambio y afecta su efectividad.' },
  'CAPACIDAD PARA ASUMIR MAYORES RESPONSABILIDADES': { 5: 'Ya asume con éxito responsabilidades significativamente superiores a su posición actual.', 4: 'Demuestra estar preparado para asumir funciones de mayor complejidad en el corto plazo.', 3: 'Cumple adecuadamente las responsabilidades actuales y muestra potencial de crecimiento gradual.', 2: 'Requiere fortalecimiento antes de asumir mayores responsabilidades.', 1: 'Actualmente presenta dificultades para gestionar las responsabilidades de su cargo.' },
  'INFLUENCIA Y LIDERAZGO POTENCIAL': { 5: 'Es referente natural para otros y genera influencia positiva más allá de su área de trabajo.', 4: 'Influye positivamente en compañeros y facilita el logro de objetivos comunes.', 3: 'Mantiene relaciones efectivas y genera colaboración cuando es necesario.', 2: 'Su capacidad de influencia es limitada o inconsistente.', 1: 'Presenta dificultades para generar credibilidad o colaboración.' },
  'PENSAMIENTO ANALÍTICO Y RESOLUCIÓN DE PROBLEMAS': { 5: 'Analiza escenarios complejos, anticipa riesgos y genera soluciones innovadoras de alto impacto.', 4: 'Identifica causas, evalúa alternativas y propone soluciones efectivas de manera consistente.', 3: 'Analiza adecuadamente los problemas habituales y propone soluciones apropiadas.', 2: 'Requiere apoyo frecuente para analizar problemas o tomar decisiones.', 1: 'Presenta dificultades recurrentes para analizar situaciones y resolver problemas.' },
};

export default function EvaluacionDetallePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const params = useParams();
  const id = params.id as string;

  const [evaluacion, setEvaluacion] = useState<EvaluacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="destr-page">
        <div className="destr-main">
          <div className="me-loading">Cargando evaluación...</div>
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
          <Link href="/mis-evaluaciones" className="destr-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al historial
          </Link>
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
            <div className="ed-dato">
              <span className="ed-dato-label">Nota Desempeño</span>
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
              <span className={`ea-nine-box-value ea-nine-box--${evaluacion.categoriaNineBox === 'Alto Potencial' ? 'alto' : evaluacion.categoriaNineBox === 'Potencial Medio' ? 'medio' : 'bajo'}`}>
                {evaluacion.categoriaNineBox || '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Competencias de Desempeño */}
        <section className="form-section form-section--competencias">
          <div className="section-header">
            <h2 className="section-title">Competencias de Desempeño</h2>
            <p className="section-subtitle">Calificación</p>
          </div>

          {desempenoRespuestas.filter((r) => r.competencia.tipo === 'transversal').length > 0 && (
            <div className="competencias-group">
              <h3 className="competencias-group-title">Transversales</h3>
              <div className="competencias-list">
                {desempenoRespuestas
                  .filter((r) => r.competencia.tipo === 'transversal')
                  .map((resp) => (
                    <div key={resp.id} className="competencia-row">
                      <div className="competencia-info">
                        <span className="competencia-nombre">{resp.competencia.nombre}</span>
                      </div>
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
          )}

          {desempenoRespuestas.filter((r) => r.competencia.tipo !== 'transversal').length > 0 && (
            <>
              {evaluacion.tipo === 'general' ? (
                NIVELES.map(nivel =>
                  desempenoRespuestas.filter((r) => r.competencia.tipo === nivel).length > 0 ? (
                    <div key={nivel} className="competencias-group">
                      <h3 className="competencias-group-title competencias-group-title--estrategico">Nivel {TIPO_LABEL[nivel]}</h3>
                      <div className="competencias-list">
                        {desempenoRespuestas.filter((r) => r.competencia.tipo === nivel).map((resp) => (
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
                  ) : null
                )
              ) : (
                desempenoRespuestas.filter((r) => r.competencia.tipo === evaluacion.tipo).length > 0 && (
                  <div className="competencias-group">
                    <h3 className="competencias-group-title competencias-group-title--estrategico">Nivel {TIPO_LABEL[evaluacion.tipo]}</h3>
                    <div className="competencias-list">
                      {desempenoRespuestas.filter((r) => r.competencia.tipo === evaluacion.tipo).map((resp) => (
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
                )
              )}
            </>
          )}
        </section>

        {/* Evaluación de Potencial */}
        {potencialRespuestas.length > 0 && (
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

        {/* Acciones */}
        <div className="form-actions">
          <Link href="/mis-evaluaciones" className="btn-cancel">Volver al historial</Link>
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
