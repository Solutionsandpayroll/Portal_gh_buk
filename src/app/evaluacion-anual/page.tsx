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
  competenciaId: string
  puntuacion: Score
  nivel: string
}

const PASOS_DESCENDENTE = ['Datos', 'Desempeño del Cargo', 'Competencias', 'Potencial', 'Retroalimentación'];
const PASOS_ASCENDENTE = ['Datos', 'Competencias', 'Retroalimentación'];

const CARGOS: { value: string; label: string; nivel: string }[] = [
  { value: 'auxiliar',    label: 'Auxiliares',    nivel: 'operativo' },
  { value: 'asistente',   label: 'Asistentes',   nivel: 'operativo' },
  { value: 'analista',    label: 'Analistas',    nivel: 'operativo' },
  { value: 'tecnico',     label: 'Técnicos',     nivel: 'operativo' },
  { value: 'profesional', label: 'Profesionales', nivel: 'tactico' },
  { value: 'lider',       label: 'Líderes',      nivel: 'tactico' },
  { value: 'gerente',     label: 'Gerentes',     nivel: 'estrategico' },
  { value: 'director',    label: 'Directores',   nivel: 'estrategico' },
];

const TIPO_TITULO: Record<string, string> = {
  transversal: 'Competencias Transversales',
  operativo: 'Competencias Nivel Operativo',
  tactico: 'Competencias Nivel Táctico',
  estrategico: 'Competencias Nivel Estratégico',
  potencial: 'Evaluación de Potencial',
};

const criterios: { valor: number; label: string }[] = [
  { valor: 5, label: 'SOBRESALIENTE' },
  { valor: 4, label: 'SUPERIOR' },
  { valor: 3, label: 'ESPERADO' },
  { valor: 2, label: 'BAJO' },
  { valor: 1, label: 'MUY BAJO' },
];

const comportamientos: Record<string, Record<number, string>> = {
  'ACTÚA CON INTEGRIDAD': {
    5: 'Actúa como referente de integridad. Promueve activamente el cumplimiento de normas y valores organizacionales, influyendo positivamente en otros colaboradores.',
    4: 'Demuestra un comportamiento ético consistente, cumple rigurosamente las normas y promueve buenas prácticas dentro de su equipo.',
    3: 'Cumple las normas, políticas y lineamientos de la organización de manera adecuada y consistente.',
    2: 'Presenta incumplimientos ocasionales o requiere recordatorios frecuentes sobre normas, procedimientos o compromisos adquiridos.',
    1: 'Incumple normas, políticas o compromisos de manera recurrente, generando riesgos para la organización.',
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
    1: 'Presenta dificultades frecuentes para trabajar de manera colaborativa, comparte información de forma limitada y muestra poca disposición para coordinarse con otros, lo que afecta el cumplimiento de los objetivos del equipo.',
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
  'AGILIDAD DE APRENDIZAJE': {
    5: 'Aprende con rapidez, busca activamente nuevos aprendizajes, incorpora retroalimentación y aplica lo aprendido con éxito en situaciones nuevas o de mayor complejidad.',
    4: 'Aprende rápidamente, incorpora nuevos conocimientos y los aplica efectivamente ante situaciones diferentes a las habituales.',
    3: 'Adquiere los conocimientos necesarios y los aplica adecuadamente cuando enfrenta nuevas situaciones o responsabilidades.',
    2: 'Requiere acompañamiento frecuente para incorporar nuevos conocimientos y trasladarlos a situaciones diferentes.',
    1: 'Presenta dificultades recurrentes para incorporar aprendizajes o aplicarlos frente a situaciones nuevas.',
  },
  'GESTIÓN DE LA COMPLEJIDAD Y ADAPTACIÓN': {
    5: 'Se desenvuelve con efectividad ante escenarios de alta incertidumbre y complejidad, analiza situaciones de manera integral, anticipa riesgos y cambios y genera soluciones o mejoras de alto impacto.',
    4: 'Se adapta rápidamente a cambios y nuevos retos, analiza situaciones de manera estructurada, identifica alternativas y responde efectivamente aun cuando aumenta la complejidad.',
    3: 'Se adapta adecuadamente a cambios y situaciones nuevas, analiza los problemas habituales y encuentra soluciones apropiadas dentro de su contexto de trabajo.',
    2: 'Requiere tiempo y acompañamiento para adaptarse a cambios o situaciones poco conocidas y para analizar problemas que presentan mayor complejidad.',
    1: 'Presenta dificultades frecuentes para adaptarse a cambios o situaciones nuevas y para analizar y resolver problemas cuando las condiciones se apartan de lo habitual.',
  },
  'CAPACIDAD PARA ASUMIR MAYOR RESPONSABILIDAD': {
    5: 'Demuestra capacidad para asumir responsabilidades significativamente mayores, gestionando con autonomía situaciones de alta complejidad y generando impacto más allá de su responsabilidad actual.',
    4: 'Evidencia condiciones claras para asumir responsabilidades de mayor alcance o complejidad en el corto o mediano plazo, con un nivel de autonomía creciente.',
    3: 'Demuestra condiciones para ampliar progresivamente su nivel de responsabilidad, alcance o complejidad, con el desarrollo y acompañamiento correspondiente.',
    2: 'Requiere fortalecimiento y desarrollo adicional antes de asumir responsabilidades de mayor alcance o complejidad.',
    1: 'Presenta dificultades para asumir mayores niveles de autonomía, responsabilidad o complejidad, incluso cuando cuenta con las condiciones y acompañamiento requeridos para desarrollarlos.',
  },
};

const desempenoCargo = [
  {
    key: 'calidad' as const,
    nombre: 'CALIDAD',
    descripcion: 'Evalúa el nivel de precisión, efectividad, cumplimiento de estándares y ausencia de errores en la ejecución de las responsabilidades y entregables asignados.',
    pregunta: '¿En qué medida la persona cumple con los estándares de calidad, precisión y efectividad en sus entregables?',
    comportamientos: {
      5: 'Mantiene de manera consistente un nivel excepcional de calidad, anticipa y previene errores y contribuye a mejorar los estándares o la calidad de los procesos.',
      4: 'Mantiene consistentemente un nivel de calidad superior al esperado, presenta pocos errores y requiere mínimas correcciones en sus entregables.',
      3: 'Ejecuta sus responsabilidades de acuerdo con los estándares definidos para el cargo, manteniendo un nivel de calidad y precisión acorde con lo esperado.',
      2: 'Cumple parcialmente los estándares de calidad; presenta errores recurrentes y requiere correcciones o seguimiento para alcanzar el resultado esperado.',
      1: 'Presenta errores frecuentes o incumplimientos que afectan significativamente la calidad de los resultados y requiere seguimiento y corrección constante.',
    },
  },
  {
    key: 'cantidadProductividad' as const,
    nombre: 'CANTIDAD / PRODUCTIVIDAD',
    descripcion: 'Evalúa el nivel de cumplimiento del volumen de trabajo, actividades, productos, servicios o entregables esperados de acuerdo con las responsabilidades y estándares definidos para el cargo.',
    pregunta: '¿En qué medida la persona cumple con el volumen de trabajo y los entregables esperados para su cargo?',
    comportamientos: {
      5: 'Supera consistentemente el volumen de trabajo esperado, optimiza su capacidad de producción y genera resultados significativamente superiores a los requeridos para su cargo.',
      4: 'Supera de manera frecuente el volumen de trabajo esperado, manteniendo un nivel adecuado de calidad en sus resultados.',
      3: 'Cumple de manera consistente con el volumen de trabajo establecido para su cargo y atiende las responsabilidades asignadas dentro del nivel esperado.',
      2: 'Alcanza parcialmente el volumen de trabajo esperado y requiere seguimiento para cumplir con las responsabilidades asignadas.',
      1: 'Produce un volumen de trabajo significativamente inferior al esperado y presenta incumplimientos frecuentes frente a las responsabilidades asignadas.',
    },
  },
  {
    key: 'tiempoOportunidad' as const,
    nombre: 'TIEMPO / OPORTUNIDAD',
    descripcion: 'Evalúa el nivel de cumplimiento de los plazos, cronogramas, tiempos de respuesta y fechas establecidas para la ejecución de las responsabilidades y entrega de resultados.',
    pregunta: '¿En qué medida la persona cumple con los plazos y tiempos establecidos para sus responsabilidades?',
    comportamientos: {
      5: 'Cumple consistentemente antes de los plazos establecidos, anticipa necesidades y contribuye a optimizar los tiempos de ejecución o respuesta del proceso.',
      4: 'Cumple regularmente los plazos establecidos y, cuando las condiciones lo permiten, anticipa entregas o responde oportunamente a requerimientos prioritarios.',
      3: 'Cumple de manera consistente con los tiempos y plazos establecidos para sus responsabilidades y entregables.',
      2: 'Cumple parcialmente los tiempos establecidos y presenta retrasos recurrentes que requieren seguimiento o intervención.',
      1: 'Incumple frecuentemente los plazos establecidos y sus retrasos afectan el desarrollo de actividades, procesos o resultados del equipo.',
    },
  },
];

const definiciones: Record<string, { descripcion: string; pregunta: string }> = {
  'ACTÚA CON INTEGRIDAD': { descripcion: 'Capacidad para actuar con honestidad, ética y coherencia, respetando normas y valores organizacionales en todas sus decisiones y acciones.', pregunta: '¿En qué medida la persona actúa con honestidad, coherencia y respeto por las normas de la empresa en su trabajo diario?' },
  'ORIENTACIÓN AL CLIENTE': { descripcion: 'Capacidad para comprender y atender las necesidades de clientes internos y externos, brindando soluciones oportunas, efectivas y alineadas con los estándares de servicio de la organización.', pregunta: '¿En qué medida la persona comprende y atiende las necesidades de los clientes internos y externos?' },
  'ADAPTACIÓN AL CAMBIO': { descripcion: 'Capacidad para ajustarse de manera ágil y positiva a cambios en procesos, prioridades o entorno, manteniendo su desempeño.', pregunta: '¿En qué medida la persona se ajusta de manera ágil y positiva a los cambios en procesos, prioridades o entorno?' },
  'ORIENTACIÓN AL LOGRO': { descripcion: 'Capacidad para actuar con sentido de urgencia, responder a las exigencias del entorno y alcanzar resultados de manera efectiva.', pregunta: '¿En qué medida la persona actúa con sentido de urgencia y alcanza resultados de manera efectiva?' },
  'CAPACIDAD DE APRENDIZAJE': { descripcion: 'Capacidad para adquirir, asimilar y aplicar nuevos conocimientos de manera efectiva en su trabajo.', pregunta: '¿En qué medida la persona adquiere, asimilar y aplica nuevos conocimientos de manera efectiva en su trabajo?' },
  'TRABAJO COLABORATIVO': { descripcion: 'Capacidad para relacionarse efectivamente con otros, generando colaboración y redes de trabajo que faciliten el logro de objetivos.', pregunta: '¿En qué medida la persona se relaciona efectivamente con otros, generando colaboración y redes de trabajo?' },
  'LIDERAZGO': { descripcion: 'Capacidad para dirigir, influir y desarrollar equipos para el logro de objetivos.', pregunta: '¿En qué medida la persona dirige, influye y desarrolla equipos para el logro de objetivos?' },
  'PENSAMIENTO ANALÍTICO': { descripcion: 'Capacidad para analizar información, identificar problemas y tomar decisiones basadas en datos.', pregunta: '¿En qué medida la persona analiza información, identifica problemas y toma decisiones basadas en datos?' },
  'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO': { descripcion: 'Capacidad para desarrollar y potenciar el equipo, estableciendo objetivos claros, prioridades y promoviendo el empoderamiento para el logro de resultados.', pregunta: '¿En qué medida la persona desarrolla y potencia su equipo, estableciendo objetivos claros y promoviendo el empoderamiento?' },
  'PENSAMIENTO ESTRATÉGICO': { descripcion: 'Capacidad para comprender el entorno, identificar oportunidades y riesgos, y tomar decisiones alineadas a la estrategia del negocio.', pregunta: '¿En qué medida la persona comprende el entorno, identifica oportunidades y riesgos, y toma decisiones alineadas a la estrategia?' },
  'AGILIDAD DE APRENDIZAJE': { descripcion: 'Capacidad para aprender de nuevas experiencias, incorporar conocimientos y retroalimentación, y aplicar lo aprendido en situaciones diferentes o de mayor complejidad ante nuevos desafíos.', pregunta: '¿En qué medida la persona aprende de nuevas experiencias y aplica lo aprendido en situaciones diferentes o de mayor complejidad?' },
  'GESTIÓN DE LA COMPLEJIDAD Y ADAPTACIÓN': { descripcion: 'Capacidad para mantener la efectividad y capacidad de respuesta ante situaciones nuevas, ambiguas, cambiantes o de creciente complejidad, analizando situaciones y generando respuestas apropiadas.', pregunta: '¿En qué medida la persona mantiene su efectividad ante situaciones nuevas, ambiguas o de creciente complejidad?' },
  'CAPACIDAD PARA ASUMIR MAYOR RESPONSABILIDAD': { descripcion: 'Capacidad demostrada para asumir progresivamente mayores niveles de responsabilidad, autonomía, complejidad o impacto en el futuro.', pregunta: '¿En qué medida la persona demuestra capacidad para asumir progresivamente mayores niveles de responsabilidad?' },
};

function calcNineBoxLabel(notaFinal: number, notaPotencial: number): string {
  const clasificar = (nota: number): string => {
    if (nota >= 4.0) return 'Alto';
    if (nota >= 3.0) return 'Medio';
    return 'Bajo';
  };
  
  const desempeno = clasificar(notaFinal);
  const potencial = clasificar(notaPotencial);
  
  return `${potencial} Potencial / ${desempeno} Desempeño`;
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

export default function EvaluacionAnualPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';

  const [paso, setPaso] = useState(1);
  const [tipoEvaluacion, setTipoEvaluacion] = useState<'descendente' | 'ascendente'>('descendente');
  const [evaluado, setEvaluado] = useState('');
  const [cargo, setCargo] = useState('');
  const [fecha, setFecha] = useState('');
  const [feedback, setFeedback] = useState('');
  const [periodo, setPeriodo] = useState(String(new Date().getFullYear()));
  const [calidad, setCalidad] = useState<Score>(null);
  const [cantidadProductividad, setCantidadProductividad] = useState<Score>(null);
  const [tiempoOportunidad, setTiempoOportunidad] = useState<Score>(null);
  const [todasRespuestas, setTodasRespuestas] = useState<RespuestaState[]>([]);
  const [todasCompetencias, setTodasCompetencias] = useState<CompetenciaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    notaFinal: number;
    notaPotencial: number;
    categoriaNineBox: string | null;
    notaDesempenoCargo?: number;
    notaCompetencias?: number;
    tipoEvaluacion: 'descendente' | 'ascendente';
  } | null>(null);
  const [usuariosDB, setUsuariosDB] = useState<string[]>([]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); fetch('/api/usuarios').then(r => r.json()).then(d => { if (Array.isArray(d)) setUsuariosDB(d); }).catch(() => {}); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/competencias')
      .then(r => r.json())
      .then((data: CompetenciaData[]) => setTodasCompetencias(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cargoData = CARGOS.find(c => c.value === cargo);
    const nivel = cargoData?.nivel || '';
    if (!nivel || todasCompetencias.length === 0) return;
    const transversales = todasCompetencias.filter(c => c.tipo === 'transversal');
    const nivelComps = todasCompetencias.filter(c => c.tipo === nivel);
    const potencial = todasCompetencias.filter(c => c.tipo === 'potencial');
    
    const respuestas: RespuestaState[] = [
      ...transversales.map(c => ({ competenciaId: c.id, puntuacion: null as Score, nivel })),
      ...nivelComps.map(c => ({ competenciaId: c.id, puntuacion: null as Score, nivel })),
    ];
    
    if (tipoEvaluacion === 'descendente') {
      respuestas.push(...potencial.map(c => ({ competenciaId: c.id, puntuacion: null as Score, nivel: 'potencial' })));
    }
    
    setTodasRespuestas(respuestas);
  }, [cargo, todasCompetencias, tipoEvaluacion]);

  const setPunt = (id: string, nivel: string) => (v: Score) => setTodasRespuestas(prev => prev.map(r => r.competenciaId === id && r.nivel === nivel ? { ...r, puntuacion: v } : r));

  const respuestasDesempeno = todasRespuestas.filter(r => r.nivel !== 'potencial');
  const respuestasPotencial = todasRespuestas.filter(r => r.nivel === 'potencial');

  const PESOS_VAL: Record<string, { transversal: number; nivel: number }> = {
    operativo: { transversal: 0.4, nivel: 0.6 },
    tactico: { transversal: 0.4, nivel: 0.6 },
    estrategico: { transversal: 0.3, nivel: 0.7 },
  };
  const cargoNivel = CARGOS.find(c => c.value === cargo)?.nivel || '';
  const peso = PESOS_VAL[cargoNivel] || { transversal: 0.5, nivel: 0.5 };

  const notaCompetencias = useMemo(() => {
    const trans = respuestasDesempeno.filter(r => r.puntuacion !== null && r.nivel === cargoNivel && todasCompetencias.find(c => c.id === r.competenciaId)?.tipo === 'transversal') as { puntuacion: number }[];
    const niv = respuestasDesempeno.filter(r => r.puntuacion !== null && r.nivel === cargoNivel && todasCompetencias.find(c => c.id === r.competenciaId)?.tipo !== 'transversal') as { puntuacion: number }[];
    const promTrans = trans.length > 0 ? trans.reduce((s, r) => s + r.puntuacion, 0) / trans.length : 0;
    const promNiv = niv.length > 0 ? niv.reduce((s, r) => s + r.puntuacion, 0) / niv.length : 0;
    return (trans.length > 0 || niv.length > 0) ? (promTrans * peso.transversal) + (promNiv * peso.nivel) : null;
  }, [respuestasDesempeno, cargoNivel, peso, todasCompetencias]);

  const notaDesempenoCargo = useMemo(() => {
    if (calidad === null || cantidadProductividad === null || tiempoOportunidad === null) return null;
    return (calidad + cantidadProductividad + tiempoOportunidad) / 3;
  }, [calidad, cantidadProductividad, tiempoOportunidad]);

  const resultadoGlobal = useMemo(() => {
    if (notaDesempenoCargo === null || notaCompetencias === null) return null;
    return (notaDesempenoCargo * 0.6) + (notaCompetencias * 0.4);
  }, [notaDesempenoCargo, notaCompetencias]);

  const notaPotencial = useMemo(() => {
    const scored = respuestasPotencial.filter(r => r.puntuacion !== null) as { puntuacion: number }[];
    return scored.length > 0 ? scored.reduce((s, r) => s + r.puntuacion, 0) / scored.length : null;
  }, [respuestasPotencial]);

  const categoriaNineBox = (resultadoGlobal !== null && notaPotencial !== null) ? calcNineBoxLabel(resultadoGlobal, notaPotencial) : null;

  const puedeAvanzar = evaluado && cargo && fecha && periodo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    const cDes = respuestasDesempeno.filter(r => r.puntuacion !== null).map(r => ({ competenciaId: r.competenciaId, puntuacion: r.puntuacion!, nivel: r.nivel }));
    const cPot = tipoEvaluacion === 'descendente' 
      ? respuestasPotencial.filter(r => r.puntuacion !== null).map(r => ({ competenciaId: r.competenciaId, puntuacion: r.puntuacion!, nivel: r.nivel }))
      : [];
    try {
      const result = await guardarEvaluacion({
        evaluadoNombre: evaluado,
        cargo,
        periodo,
        feedback,
        respuestas: cDes,
        respuestasPotencial: cPot,
        calidad: tipoEvaluacion === 'descendente' ? calidad : null,
        cantidadProductividad: tipoEvaluacion === 'descendente' ? cantidadProductividad : null,
        tiempoOportunidad: tipoEvaluacion === 'descendente' ? tiempoOportunidad : null,
        tipoEvaluacion,
      });
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
            <div className="ea-resultados-container">
              <div className="ea-notas-compactas">
                {resultado.tipoEvaluacion === 'descendente' && resultado.notaDesempenoCargo !== undefined && (
                  <div className="ea-nota-compacta">
                    <span className="ea-nota-compacta-label">Desempeño</span>
                    <span className="ea-nota-compacta-value">{resultado.notaDesempenoCargo.toFixed(1)}</span>
                  </div>
                )}
                {resultado.notaCompetencias !== undefined && (
                  <div className="ea-nota-compacta">
                    <span className="ea-nota-compacta-label">Competencias</span>
                    <span className="ea-nota-compacta-value">{resultado.notaCompetencias.toFixed(1)}</span>
                  </div>
                )}
                {resultado.tipoEvaluacion === 'descendente' && (
                  <>
                    <div className="ea-nota-compacta ea-nota-compacta--highlight">
                      <span className="ea-nota-compacta-label">Resultado Global</span>
                      <span className="ea-nota-compacta-value">{resultado.notaFinal.toFixed(1)}</span>
                    </div>
                    <div className="ea-nota-compacta">
                      <span className="ea-nota-compacta-label">Potencial</span>
                      <span className="ea-nota-compacta-value">{resultado.notaPotencial.toFixed(1)}</span>
                    </div>
                    {resultado.categoriaNineBox && (
                      <div className="ea-nota-compacta">
                        <span className="ea-nota-compacta-label">Nine Box</span>
                        <span className={`ea-nine-box-value ea-nine-box--${resultado.categoriaNineBox.includes('Alto') ? 'alto' : resultado.categoriaNineBox.includes('Medio') ? 'medio' : 'bajo'}`}>
                          {resultado.categoriaNineBox}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {resultado.tipoEvaluacion === 'descendente' && resultado.categoriaNineBox && (
                <div className="ea-matrix-side">
                  <NineBoxMatrix desempeno={resultado.notaFinal} potencial={resultado.notaPotencial} />
                </div>
              )}
            </div>
          )}
          <div className="success-actions">
            <button className="btn-outline-destr" onClick={() => { setEvaluado(''); setCargo(''); setFecha(''); setFeedback(''); setTodasRespuestas([]); setPaso(1); setSubmitted(false); setSubmitError(null); setResultado(null); }}>Nueva evaluación</button>
            <Link href="/" className="btn-primary-destr">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

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
          {(tipoEvaluacion === 'descendente' ? PASOS_DESCENDENTE : PASOS_ASCENDENTE).map((label, i) => (
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
                <div className="field-group field-group--full">
                  <label className="field-label">Tipo de Evaluación <span className="required">*</span></label>
                  <div className="radio-group">
                    <label className={`radio-option${tipoEvaluacion === 'descendente' ? ' selected' : ''}`}>
                      <input type="radio" name="tipoEvaluacion" value="descendente" checked={tipoEvaluacion === 'descendente'} onChange={() => setTipoEvaluacion('descendente')} />
                      Descendente (Jefe → Colaborador)
                    </label>
                    <label className={`radio-option${tipoEvaluacion === 'ascendente' ? ' selected' : ''}`}>
                      <input type="radio" name="tipoEvaluacion" value="ascendente" checked={tipoEvaluacion === 'ascendente'} onChange={() => setTipoEvaluacion('ascendente')} />
                      Ascendente (Colaborador → Jefe)
                    </label>
                  </div>
                  <p className="field-hint">
                    {tipoEvaluacion === 'descendente' 
                      ? 'Evalúa competencias, desempeño del cargo y potencial. Genera resultado global y Nine Box.'
                      : 'Solo evalúa competencias transversales y de nivel. Es informativa, no genera resultado global.'}
                  </p>
                </div>
                <div className="field-group"><label className="field-label">Evaluador</label><input type="text" className="field-input" value={userName} disabled /></div>
                <div className="field-group"><label className="field-label">Persona Evaluada <span className="required">*</span></label><PersonSelector value={evaluado} onChange={setEvaluado} placeholder="Nombre completo" required options={usuariosDB.length > 0 ? usuariosDB : undefined} /></div>
                <div className="field-group"><label className="field-label">Cargo del Evaluado <span className="required">*</span></label><select className="field-input" value={cargo} onChange={e => setCargo(e.target.value)} required><option value="">Seleccionar cargo...</option>{CARGOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div className="field-group"><label className="field-label">Periodo <span className="required">*</span></label><input type="number" className="field-input" min={2020} max={2100} value={periodo} onChange={e => setPeriodo(e.target.value)} required /></div>
                <div className="field-group"><label className="field-label">Fecha <span className="required">*</span></label><input type="date" className="field-input" value={fecha} onChange={e => setFecha(e.target.value)} required /></div>
              </div>
            </section>
          )}

          {/* Desempeño del Cargo - solo descendente, paso 2 */}
          {paso === 2 && tipoEvaluacion === 'descendente' && (
            <section className="form-section form-section--competencias">
              <div className="section-header"><h2 className="section-title">Desempeño en el Cargo</h2><p className="section-subtitle">Evalúa el cumplimiento de las responsabilidades del cargo</p></div>
              <div className="competencias-group">
                <div className="competencias-list">
                  {desempenoCargo.map((dim) => {
                    const valor = dim.key === 'calidad' ? calidad : dim.key === 'cantidadProductividad' ? cantidadProductividad : tiempoOportunidad;
                    const onChange = dim.key === 'calidad' ? setCalidad : dim.key === 'cantidadProductividad' ? setCantidadProductividad : setTiempoOportunidad;
                    return (
                      <div key={dim.key} className="competencia-row">
                        <div className="competencia-info">
                          <span className="competencia-nombre">{dim.nombre}</span>
                          <p className="competencia-desc">{dim.descripcion}</p>
                          <span className="competencia-pregunta-label">Pregunta</span>
                          <p className="competencia-pregunta">{dim.pregunta}</p>
                        </div>
                        <div className="competencia-score">
                          <span className="score-label">Calificación</span>
                          <div className="ea-score-grid">
                            {criterios.map(c => (
                              <button key={c.valor} type="button" className={`ea-score-card${valor === c.valor ? ' ea-score-card--active' : ''}`} onClick={() => onChange(c.valor as Score)}>
                                <div className="ea-score-card-header"><span className="ea-score-card-num">{c.valor}</span><span className="ea-score-card-label">{c.label}</span></div>
                                <p className="ea-score-card-desc">{dim.comportamientos[c.valor as 1|2|3|4|5] || ''}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Competencias - descendente paso 3, ascendente paso 2 */}
          {cargoNivel && (
            ((paso === 3 && tipoEvaluacion === 'descendente') || (paso === 2 && tipoEvaluacion === 'ascendente')) && (
              <section className="form-section form-section--competencias">
                <div className="section-header"><h2 className="section-title">{TIPO_TITULO[cargoNivel] || cargoNivel}</h2><p className="section-subtitle">Selecciona una opción por competencia</p></div>
                {loading ? <div className="ea-loading">Cargando...</div> : (
                  <>
                    <div className="competencias-group">
                      <h3 className="competencias-group-title">Transversales</h3>
                      <div className="competencias-list">
                        {todasCompetencias.filter(c => c.tipo === 'transversal').map(comp => {
                          const d = definiciones[comp.nombre] || { descripcion: '', pregunta: '' };
                          const r = todasRespuestas.find(rr => rr.competenciaId === comp.id && rr.nivel === cargoNivel);
                          return <CompetenciaRow key={`${comp.id}-${cargoNivel}`} nombre={comp.nombre} descripcion={d.descripcion} pregunta={d.pregunta} valor={r?.puntuacion ?? null} onChange={(setPunt(comp.id, cargoNivel))} />;
                        })}
                      </div>
                    </div>
                    <div className="competencias-group">
                      <h3 className="competencias-group-title competencias-group-title--estrategico">Nivel {TIPO_TITULO[cargoNivel] || cargoNivel}</h3>
                      <div className="competencias-list">
                        {todasCompetencias.filter(c => c.tipo === cargoNivel).map(comp => {
                          const d = definiciones[comp.nombre] || { descripcion: '', pregunta: '' };
                          const r = todasRespuestas.find(rr => rr.competenciaId === comp.id && rr.nivel === cargoNivel);
                          return <CompetenciaRow key={`${comp.id}-${cargoNivel}`} nombre={comp.nombre} descripcion={d.descripcion} pregunta={d.pregunta} valor={r?.puntuacion ?? null} onChange={(setPunt(comp.id, cargoNivel))} />;
                        })}
                      </div>
                    </div>
                  </>
                )}
              </section>
            )
          )}

          {/* Potencial - solo descendente, paso 4 */}
          {paso === 4 && tipoEvaluacion === 'descendente' && (
            <section className="form-section form-section--competencias">
              <div className="section-header"><h2 className="section-title">{TIPO_TITULO.potencial}</h2><p className="section-subtitle">Selecciona una opción por competencia</p></div>
              <div className="competencias-group">
                <div className="competencias-list">
                  {todasCompetencias.filter(c => c.tipo === 'potencial').map(comp => {
                    const d = definiciones[comp.nombre] || { descripcion: '', pregunta: '' };
                    const r = todasRespuestas.find(rr => rr.competenciaId === comp.id && rr.nivel === 'potencial');
                    return <CompetenciaRow key={comp.id} nombre={comp.nombre} descripcion={d.descripcion} pregunta={d.pregunta} valor={r?.puntuacion ?? null} onChange={(setPunt(comp.id, 'potencial'))} />;
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Retroalimentación y Feedforward - descendente paso 5, ascendente paso 3 */}
          {((paso === 5 && tipoEvaluacion === 'descendente') || (paso === 3 && tipoEvaluacion === 'ascendente')) && (
            <section className="form-section">
              <div className="section-header"><h2 className="section-title">Retroalimentación y Feedforward</h2></div>
              <div className="form-grid">
                <div className="form-group form-group--full">
                  <label className="field-label">Comentarios y retroalimentación</label>
                  <textarea className="field-input" rows={6} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Resumen de la retroalimentación: fortalezas identificadas, áreas de mejora, compromisos de desarrollo y acciones futuras acordadas con el evaluado..." style={{ width: '100%', maxWidth: '100%' }} />
                </div>
              </div>
            </section>
          )}

          {/* Resumen - último paso según tipo */}
          {((paso === 5 && tipoEvaluacion === 'descendente') || (paso === 3 && tipoEvaluacion === 'ascendente')) && (resultadoGlobal !== null || notaCompetencias !== null || notaPotencial !== null) && (
            <div className="ea-resumen">
              {tipoEvaluacion === 'descendente' && notaDesempenoCargo !== null && (
                <div className="ea-nota-final">
                  <span className="ea-nota-label">Desempeño del Cargo</span>
                  <span className="ea-nota-value">{notaDesempenoCargo.toFixed(1)}</span>
                </div>
              )}
              {notaCompetencias !== null && (
                <div className="ea-nota-final">
                  <span className="ea-nota-label">Competencias</span>
                  <span className="ea-nota-value">{notaCompetencias.toFixed(1)}</span>
                </div>
              )}
              {tipoEvaluacion === 'descendente' && resultadoGlobal !== null && (
                <div className="ea-nota-final ea-nota-final--highlight">
                  <span className="ea-nota-label">Resultado Global</span>
                  <span className="ea-nota-value">{resultadoGlobal.toFixed(1)}</span>
                </div>
              )}
              {tipoEvaluacion === 'descendente' && notaPotencial !== null && (
                <div className="ea-nota-final">
                  <span className="ea-nota-label">Potencial</span>
                  <span className="ea-nota-value">{notaPotencial.toFixed(1)}</span>
                  {categoriaNineBox && <span className={`ea-nine-box-preview ea-nine-box--${categoriaNineBox.includes('Alto') ? 'alto' : categoriaNineBox.includes('Medio') ? 'medio' : 'bajo'}`}>{categoriaNineBox}</span>}
                </div>
              )}
            </div>
          )}

          {submitError && <div className="destr-error-banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{submitError}</div>}

          <div className="form-actions">
            {paso > 1 && <button type="button" className="btn-cancel" onClick={() => setPaso(p => p - 1)}>← Anterior</button>}
            <Link href="/" className="btn-cancel">Cancelar</Link>
            {paso < (tipoEvaluacion === 'descendente' ? 5 : 3) ? (
              <button type="button" className="btn-submit" onClick={(e) => { e.preventDefault(); setPaso(p => p + 1); }} disabled={!puedeAvanzar && paso === 1}>
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
