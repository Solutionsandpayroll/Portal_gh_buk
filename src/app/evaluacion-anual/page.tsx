'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PersonSelector from '@/components/PersonSelector';
import { guardarEvaluacion } from './actions';
import '../formulario-desempeno/FormularioDesempenoEstrategico.css';
import './EvaluacionAnual.css';

type Score = 1 | 2 | 3 | 4 | 5 | null;

interface CompetenciaData {
  id: string;
  tipo: string;
  nombre: string;
}

interface RespuestaState {
  competenciaId: string;
  puntuacion: Score;
}

const PASOS = ['Datos', 'Transversales', 'Operativo', 'Táctico', 'Estratégico', 'Potencial'];

const TIPO_TITULO: Record<string, string> = {
  transversal: 'Competencias Transversales',
  operativo: 'Competencias Nivel Operativo',
  tactico: 'Competencias Nivel Táctico',
  estrategico: 'Competencias Nivel Estratégico',
  potencial: 'Evaluación de Potencial',
};

const criterios: { valor: number; label: string }[] = [
  { valor: 5, label: 'SOBRESALIENTE' },
  { valor: 4, label: 'SUPERA' },
  { valor: 3, label: 'CUMPLE' },
  { valor: 2, label: 'LIMITADA' },
  { valor: 1, label: 'NO CUMPLE' },
];

const comportamientos: Record<string, Record<number, string>> = {
  'ACTÚA CON INTEGRIDAD': {
    5: 'Actúa como referente de integridad. Promueve activamente el cumplimiento de normas y valores organizacionales, influyendo positivamente en otros colaboradores.',
    4: 'Demuestra un comportamiento ético consistente, cumple rigurosamente las normas y promueve buenas prácticas dentro de su equipo.',
    3: 'Cumple las normas, políticas y lineamientos de la organización de manera adecuada y consistente.',
    2: 'Presenta incumplimientos ocasionales o requiere recordatorios frecuentes sobre normas, procedimientos o compromisos adquiridos.',
    1: 'Incumple normas, políticas o compromisos de manera recurrente, generando riesgos para la organización.',
  },
  'CALIDAD DE TRABAJO': {
    5: 'Entrega resultados excepcionales, mejora continuamente los procesos y se convierte en referente de calidad para otros colaboradores.',
    4: 'Entrega trabajos de alta calidad, con mínimos errores y escasa necesidad de supervisión o corrección.',
    3: 'Entrega trabajos con la calidad esperada, cumpliendo los estándares y requisitos establecidos.',
    2: 'Presenta errores recurrentes o incumplimientos parciales que requieren seguimiento o correcciones frecuentes.',
    1: 'Presenta errores frecuentes que afectan significativamente la calidad, oportunidad o confiabilidad de los resultados.',
  },
  'ORIENTACIÓN AL CLIENTE': {
    5: 'Supera constantemente las expectativas del cliente, anticipa necesidades y genera experiencias altamente satisfactorias.',
    4: 'Brinda soluciones oportunas y efectivas, demostrando una orientación al servicio superior a la esperada.',
    3: 'Atiende adecuadamente los requerimientos del cliente, cumpliendo los tiempos y estándares establecidos.',
    2: 'Atiende los requerimientos de manera parcial o presenta demoras que afectan la experiencia del cliente.',
    1: 'Presenta dificultades recurrentes para atender las necesidades del cliente, generando insatisfacción o reprocesos.',
  },
  'ADAPTACIÓN AL CAMBIO': {
    5: 'Lidera y promueve el cambio, ayudando a otros a adaptarse y generando mejoras para la organización.',
    4: 'Se adapta rápidamente a nuevas condiciones y mantiene un alto nivel de desempeño ante los cambios.',
    3: 'Se ajusta adecuadamente a cambios en procesos, prioridades o entorno, manteniendo los resultados esperados.',
    2: 'Requiere tiempo adicional o acompañamiento para adaptarse a los cambios, afectando parcialmente su desempeño.',
    1: 'Muestra resistencia frecuente al cambio, afectando el cumplimiento de objetivos o la dinámica del equipo.',
  },
  'ORIENTACIÓN AL LOGRO': {
    5: 'Supera consistentemente las metas asignadas, prioriza adecuadamente y responde de manera sobresaliente ante situaciones de alta exigencia.',
    4: 'Cumple y frecuentemente supera los objetivos establecidos, manteniendo altos niveles de productividad y efectividad.',
    3: 'Cumple los objetivos y responsabilidades asignadas dentro de los tiempos y estándares esperados.',
    2: 'Cumple parcialmente los objetivos o requiere seguimiento frecuente para alcanzar los resultados esperados.',
    1: 'No logra los objetivos establecidos y presenta dificultades recurrentes para gestionar prioridades y responder a las exigencias del cargo.',
  },
  'CAPACIDAD DE APRENDIZAJE': {
    5: 'Busca activamente nuevas oportunidades de aprendizaje y comparte conocimientos que fortalecen al equipo.',
    4: 'Aprende rápidamente y aplica nuevos conocimientos de manera efectiva, mejorando su desempeño.',
    3: 'Adquiere y aplica los conocimientos necesarios para desempeñar adecuadamente sus funciones.',
    2: 'Requiere acompañamiento frecuente para adquirir o aplicar nuevos conocimientos.',
    1: 'Presenta resistencia o dificultades significativas para aprender y aplicar nuevos conocimientos requeridos por el cargo.',
  },
  'TRABAJO COLABORATIVO': {
    5: 'Promueve activamente la colaboración entre áreas, genera sinergias y es reconocido como facilitador del trabajo en equipo.',
    4: 'Colabora de manera proactiva, comparte información y contribuye positivamente al logro de objetivos comunes.',
    3: 'Mantiene relaciones adecuadas de trabajo y colabora cuando es requerido para alcanzar los objetivos del equipo.',
    2: 'Colabora de manera limitada o presenta dificultades ocasionales para trabajar con otros.',
    1: 'Presenta dificultades recurrentes para colaborar con otros, afectando el logro de objetivos del equipo.',
  },
  'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO': {
    5: 'Desarrolla equipos altamente comprometidos y autónomos. Identifica y potencia el talento, promueve sucesiones y genera resultados sostenibles a través del equipo.',
    4: 'Establece objetivos claros, delega efectivamente y promueve el desarrollo continuo de los colaboradores.',
    3: 'Dirige adecuadamente al equipo, realiza seguimiento al desempeño y brinda orientación cuando es necesario.',
    2: 'Presenta dificultades para delegar, desarrollar o alinear al equipo hacia los objetivos establecidos.',
    1: 'No desarrolla a las personas, genera dependencia excesiva o presenta problemas recurrentes en la gestión del equipo.',
  },
  'PENSAMIENTO ESTRATÉGICO': {
    5: 'Anticipa tendencias, identifica oportunidades de alto impacto y toma decisiones que generan ventajas competitivas para la organización.',
    4: 'Analiza información de manera integral, identifica riesgos y oportunidades relevantes y propone acciones alineadas al negocio.',
    3: 'Comprende adecuadamente el contexto de la organización y toma decisiones coherentes con los objetivos estratégicos.',
    2: 'Analiza parcialmente la información disponible y presenta dificultades para anticipar riesgos o impactos de sus decisiones.',
    1: 'Se enfoca únicamente en la operación inmediata y toma decisiones sin considerar el contexto o los objetivos estratégicos de la organización.',
  },
  'LIDERAZGO': {
    5: 'Inspira y moviliza al equipo de manera sobresaliente. Desarrolla personas, genera compromiso y logra resultados sostenibles a través de otros.',
    4: 'Dirige efectivamente al equipo, realiza seguimiento constante, brinda orientación y favorece el desarrollo de los colaboradores.',
    3: 'Gestiona adecuadamente al equipo, asigna responsabilidades y realiza seguimiento para el cumplimiento de objetivos.',
    2: 'Presenta dificultades ocasionales para dirigir, orientar o desarrollar a los integrantes del equipo.',
    1: 'Presenta dificultades recurrentes para liderar personas, gestionar el desempeño o generar compromiso en el equipo.',
  },
  'PENSAMIENTO ANALÍTICO': {
    5: 'Analiza información compleja, identifica causas raíz, anticipa riesgos y desarrolla soluciones de alto impacto para la organización.',
    4: 'Analiza información de manera estructurada, identifica problemas relevantes y propone soluciones efectivas de forma consistente.',
    3: 'Analiza adecuadamente la información disponible y resuelve los problemas habituales de su gestión.',
    2: 'Requiere apoyo frecuente para analizar situaciones o identificar alternativas de solución.',
    1: 'Presenta dificultades recurrentes para analizar información, identificar problemas o tomar decisiones efectivas.',
  },
  'CAPACIDAD DE APRENDIZAJE (LEARNING AGILITY)': {
    5: 'Aprende con gran rapidez, busca activamente nuevos conocimientos y los aplica exitosamente en contextos diferentes.',
    4: 'Aprende rápidamente y aplica lo aprendido de forma efectiva en su trabajo.',
    3: 'Aprende los conocimientos requeridos dentro de los tiempos esperados.',
    2: 'Requiere acompañamiento frecuente para adquirir y aplicar nuevos conocimientos.',
    1: 'Presenta dificultades significativas para aprender o aplicar nuevos conocimientos.',
  },
  'ADAPTABILIDAD Y MANEJO DE LA INCERTIDUMBRE': {
    5: 'Busca activamente desafíos nuevos y se adapta con facilidad a contextos cambiantes.',
    4: 'Se adapta rápidamente a cambios y nuevos retos manteniendo un desempeño sólido.',
    3: 'Se adapta adecuadamente a los cambios esperados.',
    2: 'Requiere tiempo considerable para ajustarse a nuevas situaciones.',
    1: 'Presenta resistencia frecuente al cambio y afecta su efectividad.',
  },
  'CAPACIDAD PARA ASUMIR MAYORES RESPONSABILIDADES': {
    5: 'Ya asume con éxito responsabilidades significativamente superiores a su posición actual.',
    4: 'Demuestra estar preparado para asumir funciones de mayor complejidad en el corto plazo.',
    3: 'Cumple adecuadamente las responsabilidades actuales y muestra potencial de crecimiento gradual.',
    2: 'Requiere fortalecimiento antes de asumir mayores responsabilidades.',
    1: 'Actualmente presenta dificultades para gestionar las responsabilidades de su cargo.',
  },
  'INFLUENCIA Y LIDERAZGO POTENCIAL': {
    5: 'Es referente natural para otros y genera influencia positiva más allá de su área de trabajo.',
    4: 'Influye positivamente en compañeros y facilita el logro de objetivos comunes.',
    3: 'Mantiene relaciones efectivas y genera colaboración cuando es necesario.',
    2: 'Su capacidad de influencia es limitada o inconsistente.',
    1: 'Presenta dificultades para generar credibilidad o colaboración.',
  },
  'PENSAMIENTO ANALÍTICO Y RESOLUCIÓN DE PROBLEMAS': {
    5: 'Analiza escenarios complejos, anticipa riesgos y genera soluciones innovadoras de alto impacto.',
    4: 'Identifica causas, evalúa alternativas y propone soluciones efectivas de manera consistente.',
    3: 'Analiza adecuadamente los problemas habituales y propone soluciones apropiadas.',
    2: 'Requiere apoyo frecuente para analizar problemas o tomar decisiones.',
    1: 'Presenta dificultades recurrentes para analizar situaciones y resolver problemas.',
  },
};

const definiciones: Record<string, { descripcion: string; pregunta: string }> = {
  'ACTÚA CON INTEGRIDAD': { descripcion: 'Capacidad para actuar con honestidad, ética y coherencia, respetando normas y valores organizacionales en todas sus decisiones y acciones.', pregunta: '¿En qué medida la persona actúa con honestidad, coherencia y respeto por las normas de la empresa en su trabajo diario?' },
  'CALIDAD DE TRABAJO': { descripcion: 'Capacidad para ejecutar sus funciones con precisión, orden y cumplimiento de estándares, asegurando resultados confiables y oportunos.', pregunta: '¿En qué medida la persona entrega su trabajo con precisión, orden y cumplimiento de los estándares establecidos?' },
  'ORIENTACIÓN AL CLIENTE': { descripcion: 'Capacidad para comprender las necesidades del cliente y brindar soluciones oportunas, efectivas y con enfoque en el servicio.', pregunta: '¿En qué medida la persona comprende las necesidades del cliente y brinda soluciones oportunas y de calidad?' },
  'ADAPTACIÓN AL CAMBIO': { descripcion: 'Capacidad para ajustarse de manera ágil y positiva a cambios en procesos, prioridades o entorno, manteniendo su desempeño.', pregunta: '¿En qué medida la persona se adapta a cambios en procesos, prioridades o entornos de trabajo sin afectar su desempeño?' },
  'ORIENTACIÓN AL LOGRO': { descripcion: 'Capacidad para actuar con sentido de urgencia, responder a las exigencias del entorno y alcanzar resultados de manera efectiva.', pregunta: '¿En qué medida la persona actúa con sentido de urgencia y logra resultados en situaciones de alta exigencia?' },
  'CAPACIDAD DE APRENDIZAJE': { descripcion: 'Capacidad para adquirir, asimilar y aplicar nuevos conocimientos de manera efectiva en su trabajo.', pregunta: '¿En qué medida la persona aprende y aplica nuevos conocimientos para mejorar su desempeño?' },
  'TRABAJO COLABORATIVO': { descripcion: 'Capacidad para relacionarse efectivamente con otros, generando colaboración y redes de trabajo que faciliten el logro de objetivos.', pregunta: '¿En qué medida la persona colabora con otros y construye relaciones que favorecen el logro de objetivos?' },
  'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO': { descripcion: 'Capacidad para desarrollar y potenciar el equipo, estableciendo objetivos claros, prioridades y promoviendo el empoderamiento para el logro de resultados.', pregunta: '¿En qué medida la persona desarrolla a su equipo, establece objetivos claros y fomenta el empoderamiento para lograr resultados?' },
  'PENSAMIENTO ESTRATÉGICO': { descripcion: 'Capacidad para comprender el entorno, identificar oportunidades y riesgos, y tomar decisiones alineadas a la estrategia del negocio.', pregunta: '¿En qué medida la persona analiza el entorno, identifica oportunidades o riesgos y toma decisiones alineadas a la estrategia del negocio?' },
  'LIDERAZGO': { descripcion: 'Capacidad para dirigir, influir y desarrollar equipos para el logro de objetivos.', pregunta: '¿En qué medida esta persona demuestra capacidad de liderazgo en la dirección, seguimiento y desarrollo de su equipo?' },
  'PENSAMIENTO ANALÍTICO': { descripcion: 'Capacidad para analizar información, identificar problemas y tomar decisiones basadas en datos.', pregunta: '¿En qué medida la persona analiza información, identifica problemas y propone soluciones efectivas?' },
  'CAPACIDAD DE APRENDIZAJE (LEARNING AGILITY)': { descripcion: 'Capacidad para adquirir rápidamente nuevos conocimientos, adaptarse a situaciones desconocidas y aplicar lo aprendido con efectividad.', pregunta: '¿En qué medida la persona aprende rápidamente y aplica nuevos conocimientos para enfrentar desafíos cada vez más complejos?' },
  'ADAPTABILIDAD Y MANEJO DE LA INCERTIDUMBRE': { descripcion: 'Capacidad para responder positivamente a cambios, ambigüedad y nuevos retos.', pregunta: '¿En qué medida la persona se adapta a situaciones nuevas o inciertas manteniendo su efectividad?' },
  'CAPACIDAD PARA ASUMIR MAYORES RESPONSABILIDADES': { descripcion: 'Capacidad para gestionar retos de mayor complejidad, alcance o impacto organizacional.', pregunta: '¿En qué medida la persona demuestra capacidad para asumir responsabilidades superiores a las de su cargo actual?' },
  'INFLUENCIA Y LIDERAZGO POTENCIAL': { descripcion: 'Capacidad para generar credibilidad, movilizar a otros e impactar positivamente en su entorno.', pregunta: '¿En qué medida la persona influye positivamente en otros y demuestra características de liderazgo?' },
  'PENSAMIENTO ANALÍTICO Y RESOLUCIÓN DE PROBLEMAS': { descripcion: 'Capacidad para analizar situaciones, identificar causas y generar soluciones efectivas.', pregunta: '¿En qué medida la persona analiza situaciones complejas y propone soluciones efectivas?' },
};

function calcNineBoxLabel(nota: number): string {
  if (nota >= 4.0) return 'Alto Potencial';
  if (nota >= 3.0) return 'Potencial Medio';
  return 'Potencial Bajo';
}

function CompetenciaRow({ nombre, valor, onChange, descripcion, pregunta }: {
  nombre: string; valor: Score; onChange: (v: Score) => void; descripcion: string; pregunta: string;
}) {
  const comps = comportamientos[nombre] || {};
  return (
    <div className="competencia-row">
      <div className="competencia-info">
        <span className="competencia-nombre">{nombre}</span>
        <p className="competencia-desc">{descripcion}</p>
        <span className="competencia-pregunta-label">Pregunta</span>
        <p className="competencia-pregunta">{pregunta}</p>
      </div>
      <div className="competencia-score">
        <span className="score-label">Calificación</span>
        <div className="ea-score-grid">
          {criterios.map(c => (
            <button key={c.valor} type="button" className={`ea-score-card${valor === c.valor ? ' ea-score-card--active' : ''}`} onClick={() => onChange(c.valor as Score)}>
              <div className="ea-score-card-header"><span className="ea-score-card-num">{c.valor}</span><span className="ea-score-card-label">{c.label}</span></div>
              <p className="ea-score-card-desc">{comps[c.valor] || ''}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EvaluacionAnualPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';

  const [paso, setPaso] = useState(1);
  const [evaluado, setEvaluado] = useState('');
  const [fecha, setFecha] = useState('');
  const [periodo, setPeriodo] = useState(String(new Date().getFullYear()));
  const [todasRespuestas, setTodasRespuestas] = useState<RespuestaState[]>([]);
  const [todasCompetencias, setTodasCompetencias] = useState<CompetenciaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ notaFinal: number; notaPotencial: number; categoriaNineBox: string } | null>(null);
  const [usuariosDB, setUsuariosDB] = useState<string[]>([]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); fetch('/api/usuarios').then(r => r.json()).then(d => { if (Array.isArray(d)) setUsuariosDB(d); }).catch(() => {}); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/competencias')
      .then(r => r.json())
      .then((data: CompetenciaData[]) => {
        setTodasCompetencias(data);
        setTodasRespuestas(data.map(c => ({ competenciaId: c.id, puntuacion: null })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setPunt = (id: string) => (v: Score) => setTodasRespuestas(prev => prev.map(r => r.competenciaId === id ? { ...r, puntuacion: v } : r));

  const respuestasDesempeno = todasRespuestas.filter(r => {
    const comp = todasCompetencias.find(c => c.id === r.competenciaId);
    return comp && comp.tipo !== 'potencial';
  });
  const respuestasPotencial = todasRespuestas.filter(r => {
    const comp = todasCompetencias.find(c => c.id === r.competenciaId);
    return comp && comp.tipo === 'potencial';
  });

  const notaDesempeno = useMemo(() => {
    const scored = respuestasDesempeno.filter(r => r.puntuacion !== null) as { puntuacion: number }[];
    return scored.length > 0 ? scored.reduce((s, r) => s + r.puntuacion, 0) / scored.length : null;
  }, [respuestasDesempeno]);

  const notaPotencial = useMemo(() => {
    const scored = respuestasPotencial.filter(r => r.puntuacion !== null) as { puntuacion: number }[];
    return scored.length > 0 ? scored.reduce((s, r) => s + r.puntuacion, 0) / scored.length : null;
  }, [respuestasPotencial]);

  const categoriaNineBox = notaPotencial !== null ? calcNineBoxLabel(notaPotencial) : null;

  const puedeAvanzar = evaluado && fecha && periodo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    const cDes = respuestasDesempeno.filter(r => r.puntuacion !== null) as { competenciaId: string; puntuacion: number }[];
    const cPot = respuestasPotencial.filter(r => r.puntuacion !== null) as { competenciaId: string; puntuacion: number }[];
    try {
      const result = await guardarEvaluacion({ evaluadoNombre: evaluado, periodo, respuestasDesempeno: cDes, respuestasPotencial: cPot });
      setResultado(result); setSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setSubmitError(err instanceof Error ? err.message : 'Error al guardar.'); }
    finally { setIsSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="destr-page">
        <div className="destr-success">
          <div className="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg></div>
          <h2>Evaluación guardada con éxito</h2>
          <p>La evaluación de desempeño 2026 ha sido registrada correctamente.</p>
          {resultado && (
            <div className="ea-resultados">
              <div className="ea-nota-final-big"><span className="ea-nota-label">Nota Desempeño</span><span className="ea-nota-value">{resultado.notaFinal.toFixed(1)}</span></div>
              <div className="ea-nota-final-big"><span className="ea-nota-label">Nota Potencial</span><span className="ea-nota-value">{resultado.notaPotencial.toFixed(1)}</span></div>
              <div className="ea-nine-box-badge"><span className="ea-nine-box-label">Nine Box</span><span className={`ea-nine-box-value ea-nine-box--${resultado.categoriaNineBox === 'Alto Potencial' ? 'alto' : resultado.categoriaNineBox === 'Potencial Medio' ? 'medio' : 'bajo'}`}>{resultado.categoriaNineBox}</span></div>
            </div>
          )}
          <div className="success-actions">
            <button className="btn-outline-destr" onClick={() => { setEvaluado(''); setFecha(''); setTodasRespuestas([]); setPaso(1); setSubmitted(false); setSubmitError(null); setResultado(null); }}>Nueva evaluación</button>
            <Link href="/" className="btn-primary-destr">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  const tiposPasos = [null, 'transversal', 'operativo', 'tactico', 'estrategico', 'potencial'] as const;

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
          <span className="destr-badge">Evaluación 2026</span>
          <h1>Evaluación de Desempeño</h1>
          <p>Evalúa todas las competencias del colaborador en cada nivel</p>
        </div>
      </div>

      <main className="destr-main">
        <div className="ea-steps">
          {PASOS.map((label, i) => (
            <div key={i} className={`ea-step${paso === i + 1 ? ' ea-step--active' : ''}${paso > i + 1 ? ' ea-step--done' : ''}`}>
              <div className="ea-step-circle">{paso > i + 1 ? '✓' : i + 1}</div>
              <span className="ea-step-label">{label}</span>
            </div>
          ))}
        </div>

        <form className="destr-form" onSubmit={handleSubmit}>

          {paso === 1 && (
            <section className="form-section">
              <div className="section-header"><h2 className="section-title">Datos de la Evaluación</h2></div>
              <div className="fields-grid fields-grid--2">
                <div className="field-group"><label className="field-label">Evaluador</label><input type="text" className="field-input" value={userName} disabled /></div>
                <div className="field-group"><label className="field-label">Persona Evaluada <span className="required">*</span></label><PersonSelector value={evaluado} onChange={setEvaluado} placeholder="Nombre completo" required options={usuariosDB.length > 0 ? usuariosDB : undefined} /></div>
                <div className="field-group"><label className="field-label">Periodo <span className="required">*</span></label><input type="number" className="field-input" min={2020} max={2100} value={periodo} onChange={e => setPeriodo(e.target.value)} required /></div>
                <div className="field-group"><label className="field-label">Fecha <span className="required">*</span></label><input type="date" className="field-input" value={fecha} onChange={e => setFecha(e.target.value)} required /></div>
              </div>
            </section>
          )}

          {paso >= 2 && paso <= 6 && (
            <section className="form-section form-section--competencias">
              <div className="section-header"><h2 className="section-title">{TIPO_TITULO[tiposPasos[paso] as string]}</h2><p className="section-subtitle">Selecciona una opción por competencia</p></div>
              {loading ? <div className="ea-loading">Cargando...</div> : (
                <div className="competencias-group">
                  <div className="competencias-list">
                    {todasCompetencias.filter(c => c.tipo === tiposPasos[paso]).map(comp => {
                      const d = definiciones[comp.nombre] || { descripcion: '', pregunta: '' };
                      const r = todasRespuestas.find(rr => rr.competenciaId === comp.id);
                      return <CompetenciaRow key={comp.id} nombre={comp.nombre} descripcion={d.descripcion} pregunta={d.pregunta} valor={r?.puntuacion ?? null} onChange={(setPunt(comp.id))} />;
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {paso === 6 && (notaDesempeno !== null || notaPotencial !== null) && (
            <div className="ea-resumen">
              {notaDesempeno !== null && <div className="ea-nota-final"><span className="ea-nota-label">Desempeño</span><span className="ea-nota-value">{notaDesempeno.toFixed(1)}</span></div>}
              {notaPotencial !== null && <div className="ea-nota-final"><span className="ea-nota-label">Potencial</span><span className="ea-nota-value">{notaPotencial.toFixed(1)}</span>{categoriaNineBox && <span className={`ea-nine-box-preview ea-nine-box--${categoriaNineBox === 'Alto Potencial' ? 'alto' : categoriaNineBox === 'Potencial Medio' ? 'medio' : 'bajo'}`}>{categoriaNineBox}</span>}</div>}
            </div>
          )}

          {submitError && <div className="destr-error-banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{submitError}</div>}

          <div className="form-actions">
            {paso > 1 && <button type="button" className="btn-cancel" onClick={() => setPaso(p => p - 1)}>← Anterior</button>}
            <Link href="/" className="btn-cancel">Cancelar</Link>
            {paso < 6 ? (
              <button type="button" className="btn-submit" onClick={() => setPaso(p => p + 1)} disabled={!puedeAvanzar && paso === 1}>
                Siguiente →
              </button>
            ) : (
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="destr-spinner" />Guardando...</> : 'Guardar Evaluación'}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
