'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import JSZip from 'jszip';
import '../FormularioDesempenoEstrategico.css';
import '../../evaluacion-anual/EvaluacionAnual.css';
import PersonSelector from '@/components/PersonSelector';
import AgregarColaborador from '@/components/AgregarColaborador';

/* ── Tipos ── */
type Score = 1 | 2 | 3 | 4 | 5 | null;

interface FormData {
  nombreEvaluado: string;
  nombreEvaluador: string;
  areaTrabajo: string;
  cargoActual: string;
  fecha: string;
  proposito: 'periodo_prueba' | 'ascenso' | 'seguimiento_desempeno' | 'otro_caso' | '';
  /* Transversales */
  integridadScore: Score;
  clienteScore: Score;
  cambioScore: Score;
  /* Nivel Estratégico */
  equiposScore: Score;
  pensamientoScore: Score;
  /* Desempeño del Cargo */
  calidadScore: Score;
  cantidadScore: Score;
  tiempoScore: Score;
}

const initialForm: FormData = {
  nombreEvaluado: '',
  nombreEvaluador: '',
  areaTrabajo: '',
  cargoActual: '',
  fecha: '',
  proposito: '',
  integridadScore: null,
  clienteScore: null,
  cambioScore: null,
  equiposScore: null,
  pensamientoScore: null,
  calidadScore: null,
  cantidadScore: null,
  tiempoScore: null,
};

/* ── Criterios de calificación ── */
const criterios = [
  { valor: 5, label: 'SOBRESALIENTE' },
  { valor: 4, label: 'SUPERIOR' },
  { valor: 3, label: 'ESPERADO' },
  { valor: 2, label: 'BAJO' },
  { valor: 1, label: 'MUY BAJO' },
];

/* ── Datos de competencias ── */
const transversales = [
  {
    key: 'integridadScore' as keyof FormData,
    nombre: 'ACTÚA CON INTEGRIDAD',
    descripcion:
      'Capacidad para actuar con honestidad, ética y coherencia, respetando normas y valores organizacionales en todas sus decisiones y acciones.',
    pregunta:
      '¿En qué medida la persona actúa con honestidad, coherencia y respeto por las normas de la empresa en su trabajo diario?',
  },
  {
    key: 'clienteScore' as keyof FormData,
    nombre: 'ORIENTACIÓN AL CLIENTE',
    descripcion:
      'Capacidad para comprender las necesidades del cliente y brindar soluciones oportunas, efectivas y con enfoque en el servicio.',
    pregunta:
      '¿En qué medida la persona comprende las necesidades del cliente y brinda soluciones oportunas y de calidad?',
  },
  {
    key: 'cambioScore' as keyof FormData,
    nombre: 'ADAPTACIÓN AL CAMBIO',
    descripcion:
      'Capacidad para ajustarse de manera ágil y positiva a cambios en procesos, prioridades o entorno, manteniendo su desempeño.',
    pregunta:
      '¿En qué medida la persona se adapta a cambios en procesos, prioridades o entornos de trabajo sin afectar su desempeño?',
  },
];

const nivelEstrategico = [
  {
    key: 'equiposScore' as keyof FormData,
    nombre: 'DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO',
    descripcion:
      'Capacidad para desarrollar y potenciar el equipo, estableciendo objetivos claros, prioridades y promoviendo el empoderamiento para el logro de resultados.',
    pregunta:
      '¿En qué medida la persona desarrolla a su equipo, establece objetivos claros y fomenta el empoderamiento para lograr resultados?',
  },
  {
    key: 'pensamientoScore' as keyof FormData,
    nombre: 'PENSAMIENTO ESTRATÉGICO',
    descripcion:
      'Capacidad para comprender el entorno, identificar oportunidades y riesgos, y tomar decisiones alineadas a la estrategia del negocio.',
    pregunta:
      '¿En qué medida la persona analiza el entorno, identifica oportunidades o riesgos y toma decisiones alineadas a la estrategia del negocio?',
  },
];

const desempenoCargo = [
  {
    key: 'calidadScore' as keyof FormData,
    nombre: 'CALIDAD',
    descripcion:
      'Evalúa el nivel de precisión, efectividad, cumplimiento de estándares y ausencia de errores en la ejecución de las responsabilidades y entregables asignados.',
    pregunta:
      '¿En qué medida la persona cumple con los estándares de calidad esperados en sus entregables?',
    comportamientos: {
      5: 'Entrega sin errores relevantes, con alto cumplimiento de estándares y mejoras visibles.',
      4: 'Entrega con precisión y muy bajo reproceso; cumple estándares de forma consistente.',
      3: 'Cumple estándares básicos de calidad; los ajustes requeridos son menores.',
      2: 'Presenta errores o reprocesos frecuentes que requieren acompañamiento.',
      1: 'No cumple los estándares mínimos de calidad y requiere reproceso significativo.',
    },
  },
  {
    key: 'cantidadScore' as keyof FormData,
    nombre: 'CANTIDAD / PRODUCTIVIDAD',
    descripcion:
      'Evalúa el nivel de cumplimiento del volumen de trabajo, actividades, productos, servicios o entregables esperados de acuerdo con las responsabilidades definidas para el cargo.',
    pregunta:
      '¿En qué medida la persona cumple con el volumen de trabajo y los entregables esperados para su cargo?',
    comportamientos: {
      5: 'Supera de forma consistente el volumen esperado sin afectar la calidad.',
      4: 'Cumple y en ocasiones supera el volumen esperado, manteniendo orden y prioridades.',
      3: 'Cumple el volumen esperado de tareas de acuerdo con su rol y recursos disponibles.',
      2: 'Entrega un volumen inferior al esperado o requiere seguimiento frecuente para cerrar tareas.',
      1: 'No alcanza el volumen mínimo esperado, aun con orientación o seguimiento.',
    },
  },
  {
    key: 'tiempoScore' as keyof FormData,
    nombre: 'TIEMPO / OPORTUNIDAD',
    descripcion:
      'Evalúa el nivel de cumplimiento de los plazos, cronogramas, tiempos de respuesta y fechas establecidas para la ejecución de las responsabilidades y entrega de resultados.',
    pregunta:
      '¿En qué medida la persona cumple con los plazos y tiempos establecidos para sus responsabilidades?',
    comportamientos: {
      5: 'Entrega antes o dentro de los plazos, anticipando riesgos y priorizando adecuadamente.',
      4: 'Cumple plazos de forma consistente y comunica oportunamente posibles desviaciones.',
      3: 'Entrega dentro de los tiempos definidos, con seguimiento normal del líder.',
      2: 'Presenta retrasos recurrentes o dificultad para priorizar, afectando la oportunidad.',
      1: 'No cumple plazos críticos y afecta la continuidad o el resultado del proceso.',
    },
  },
];

/* ── Componente de fila de competencia ── */
interface CompetenciaRowProps {
  nombre: string;
  descripcion: string;
  pregunta: string;
  valor: Score;
  onChange: (v: Score) => void;
}

const CompetenciaRow = ({ nombre, descripcion, pregunta, valor, onChange }: CompetenciaRowProps) => (
  <div className="competencia-row">
    <div className="competencia-info">
      <span className="competencia-nombre">{nombre}</span>
      <p className="competencia-desc">{descripcion}</p>
      <span className="competencia-pregunta-label">Pregunta</span>
      <p className="competencia-pregunta">{pregunta}</p>
    </div>
    <div className="competencia-score">
      <span className="score-label">Calificación</span>
      <div className="score-pills">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`score-pill${valor === n ? ' score-pill--active' : ''}`}
            onClick={() => onChange(n as Score)}
            title={criterios.find((c) => c.valor === n)?.label}
          >
            {n}
          </button>
        ))}
      </div>
      {valor !== null && (
        <span className="score-selected-label">
          {criterios.find((c) => c.valor === valor)?.label}
        </span>
      )}
    </div>
  </div>
);

/* ── Componente de fila para Desempeño del Cargo (tarjetas con descripción) ── */
interface DesempenoCargoRowProps {
  nombre: string;
  descripcion: string;
  pregunta: string;
  valor: Score;
  comportamientos: Record<number, string>;
  onChange: (v: Score) => void;
}

const DesempenoCargoRow = ({ nombre, descripcion, pregunta, valor, comportamientos, onChange }: DesempenoCargoRowProps) => (
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
        {criterios.map((c) => (
          <button
            key={c.valor}
            type="button"
            className={`ea-score-card${valor === c.valor ? ' ea-score-card--active' : ''}`}
            onClick={() => onChange(c.valor as Score)}
          >
            <div className="ea-score-card-header">
              <span className="ea-score-card-num">{c.valor}</span>
              <span className="ea-score-card-label">{c.label}</span>
            </div>
            <p className="ea-score-card-desc">{comportamientos[c.valor] || ''}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ── Helpers para parchear celdas en el XML del xlsx ── */
function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function colToNum(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}

function patchCell(xml: string, ref: string, value: string | number): string {
  const cellXml = typeof value === 'number'
    ? (open: string) => `${open}><v>${value}</v></c>`
    : (open: string) => `${open} t="inlineStr"><is><t xml:space="preserve">${escXml(String(value))}</t></is></c>`;

  // ── Intentar sobreescribir celda existente ──
  const needle = ` r="${ref}"`;
  let searchPos = 0;
  while (true) {
    const found = xml.indexOf(needle, searchPos);
    if (found === -1) break;
    let start = found;
    while (start > 0 && xml[start] !== '<') start--;
    if (xml.slice(start, start + 3) !== '<c ') { searchPos = found + 1; continue; }
    const gtPos = xml.indexOf('>', start);
    if (gtPos === -1) return xml;
    const selfClose = xml[gtPos - 1] === '/';
    const openNoGt = xml.slice(start, selfClose ? gtPos - 1 : gtPos).replace(/\s+t="[^"]*"/, '');
    const end = selfClose ? gtPos + 1 : xml.indexOf('</c>', gtPos) + 4;
    if (!selfClose && end < 4) return xml;
    return xml.slice(0, start) + cellXml(openNoGt) + xml.slice(end);
  }

  // ── Celda no existe: insertar en posición ordenada dentro de su fila ──
  const rowNum = ref.match(/\d+/)?.[0];
  if (!rowNum) return xml;
  const rowTag = `<row r="${rowNum}"`;
  const rowStart = xml.indexOf(rowTag);
  if (rowStart === -1) return xml;
  const rowClose = xml.indexOf('</row>', rowStart);
  if (rowClose === -1) return xml;

  const targetColNum = colToNum(ref.replace(/\d+/g, ''));
  const rowSlice = xml.slice(rowStart, rowClose);

  // Buscar la primera celda cuya columna sea > targetCol → insertar antes de ella
  let insertPos = rowClose; // por defecto, al final de la fila
  const re = / r="([A-Z]+)\d+"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rowSlice)) !== null) {
    if (colToNum(m[1]) > targetColNum) {
      // Retroceder hasta el '<c' que contiene este atributo r
      let p = rowStart + m.index;
      while (p > rowStart && xml[p] !== '<') p--;
      if (xml.slice(p, p + 3) === '<c ') { insertPos = p; break; }
    }
  }

  return xml.slice(0, insertPos) + cellXml(`<c r="${ref}"`) + xml.slice(insertPos);
}

/* ── Página principal ── */
const propositoLabel: Record<string, string> = {
  periodo_prueba: 'Período de prueba',
  ascenso: 'Ascenso',
  seguimiento_desempeno: 'Seguimiento por desempeño',
  otro_caso: 'Otro — caso especial',
};

const FormularioDesempenoEstrategico = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<string[]>([]);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const rol = (session?.user as any)?.rol;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetch('/api/colaboradores')
      .then(r => r.json())
      .then((data: { nombre: string }[]) => {
        if (Array.isArray(data)) setColaboradores(data.map(c => c.nombre));
      })
      .catch(() => {});
  }, []);

  const handleColaboradorAgregado = (nombre: string) => {
    setColaboradores(prev => Array.from(new Set([...prev, nombre])).sort());
  };

  const setField = (field: keyof FormData, value: string | Score) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Descargar la plantilla Excel desde /public
      const res = await fetch('/template-estrategico.xlsx');
      if (!res.ok) throw new Error('No se pudo cargar la plantilla Excel.');

      // 2. Abrir como ZIP — solo modificamos xl/worksheets/sheet1.xml
      //    Todos los demás archivos (gráficas, estilos, imágenes) quedan intactos
      const zip = await JSZip.loadAsync(await res.arrayBuffer());
      const wsEntry = zip.file('xl/worksheets/sheet1.xml');
      if (!wsEntry) throw new Error('Plantilla inválida: no se encontró la hoja.');

      let wsXml = await wsEntry.async('string');

      const cellMap: Record<string, string | number> = {
        F7:  form.nombreEvaluado,
        F8:  form.nombreEvaluador,
        F9:  form.areaTrabajo,
        M7:  form.fecha,
        M8:  form.cargoActual,
        M9:  propositoLabel[form.proposito] ?? form.proposito,
        N24: form.integridadScore   ?? 0,
        N25: form.clienteScore      ?? 0,
        N26: form.cambioScore       ?? 0,
        N32: form.equiposScore      ?? 0,
        N33: form.pensamientoScore  ?? 0,
        N34: form.calidadScore       ?? 0,
        N39: form.cantidadScore      ?? 0,
        N44: form.tiempoScore        ?? 0,
      };

      for (const [ref, value] of Object.entries(cellMap)) {
        wsXml = patchCell(wsXml, ref, value);
      }

      // Forzar orientación horizontal para la conversión a PDF
      if (/<pageSetup\b/.test(wsXml)) {
        wsXml = wsXml.replace(/<pageSetup\b([^/]*)(\/?>)/, (_m, attrs, close) => {
          const cleaned = attrs.replace(/\s+orientation="[^"]*"/, '');
          return `<pageSetup${cleaned} orientation="landscape"${close}`;
        });
      } else {
        const insertBefore = wsXml.includes('</sheetData>') ? '</sheetData>' : '</worksheet>';
        wsXml = wsXml.replace(insertBefore, `${insertBefore}<pageSetup orientation="landscape"/>`);
      }

      zip.file('xl/worksheets/sheet1.xml', wsXml);

      // Forzar recálculo de fórmulas al abrir (fullCalcOnLoad)
      const wbEntry = zip.file('xl/workbook.xml');
      if (wbEntry) {
        let wbXml = await wbEntry.async('string');
        // Si ya existe <calcPr>, añadir el atributo; si no, insertar el elemento
        if (/<calcPr\b/.test(wbXml)) {
          wbXml = wbXml.replace(/<calcPr\b([^/]*)(\/?>)/, (_m, attrs, close) => {
            const cleaned = attrs.replace(/\s+fullCalcOnLoad="[^"]*"/, '');
            return `<calcPr${cleaned} fullCalcOnLoad="1"${close}`;
          });
        } else {
          wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
        }
        zip.file('xl/workbook.xml', wbXml);
      }

      // 3. Reempaquetar y convertir a base64
      const buffer = await zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      // 4. Construir nombre de archivo con evaluado + fecha
      const fechaSlug = form.fecha.replace(/-/g, '');
      const nombreSlug = form.nombreEvaluado.replace(/\s+/g, '_');
      const nombreArchivo = `Evaluacion_Estrategico_${nombreSlug}_${fechaSlug}.xlsx`;

      // 5. Enviar a Power Automate
      const url = process.env.NEXT_PUBLIC_PA_DESEMPENO_ESTRATEGICO_URL as string;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreArchivo,
          contenidoBase64: base64,
          carpetaDestino: 'Evaluaciones/Estrategico',
        }),
      });

      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Error al enviar la evaluación. Intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="destr-page">
        <div className="destr-success">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>Evaluación enviada con éxito</h2>
          <p>La evaluación de desempeño estratégico ha sido registrada correctamente.</p>
          <div className="success-actions">
            <button
              className="btn-outline-destr"
              onClick={() => { setForm(initialForm); setSubmitted(false); setSubmitError(null); }}
            >
              Nueva evaluación
            </button>
            <Link href="/" className="btn-primary-destr">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="destr-page">
      {/* Header */}
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

      {/* Hero */}
      <div className="destr-hero">
        <div className="destr-hero-inner">
          <Link href="/" className="destr-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>
          <span className="destr-badge">Form. 02 — Estratégico</span>
          <h1>Gestión de Desempeño</h1>
          <p>Evaluación de competencias estratégicas y transversales del colaborador</p>
        </div>
      </div>

      {/* Formulario */}
      <main className="destr-main">
        <form className="destr-form" onSubmit={handleSubmit}>

          {/* ── Sección 1: Datos generales ── */}
          <section className="form-section">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 className="section-title">Datos del Evaluado</h2>
              {rol === 'admin' && <AgregarColaborador onAdded={handleColaboradorAgregado} />}
            </div>
            <div className="fields-grid fields-grid--2">
              <div className="field-group">
                <label className="field-label">Nombre del Evaluado <span className="required">*</span></label>
                <PersonSelector
                  value={form.nombreEvaluado}
                  onChange={(v) => setField('nombreEvaluado', v)}
                  placeholder="Nombre completo"
                  required
                  options={colaboradores.length > 0 ? colaboradores : undefined}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Nombre del Evaluador <span className="required">*</span></label>
                <PersonSelector
                  value={form.nombreEvaluador}
                  onChange={(v) => setField('nombreEvaluador', v)}
                  placeholder="Nombre completo"
                  required
                  options={colaboradores.length > 0 ? colaboradores : undefined}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Área de Trabajo <span className="required">*</span></label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Área o departamento"
                  value={form.areaTrabajo}
                  onChange={(e) => setField('areaTrabajo', e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Cargo Actual del Evaluado <span className="required">*</span></label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Cargo del evaluado"
                  value={form.cargoActual}
                  onChange={(e) => setField('cargoActual', e.target.value)}
                  required
                />
              </div>
              
              <div className="field-group">
                <label className="field-label">Fecha <span className="required">*</span></label>
                <input
                  type="date"
                  className="field-input"
                  value={form.fecha}
                  onChange={(e) => setField('fecha', e.target.value)}
                  required
                />
              </div>

              <div className="field-group field-group--full">
                <label className="field-label">Propósito de la Evaluación <span className="required">*</span></label>
                <div className="radio-group">
                  {[
                    { value: 'periodo_prueba',        label: 'Período de prueba' },
                    { value: 'ascenso',               label: 'Ascenso' },
                    { value: 'seguimiento_desempeno', label: 'Seguimiento por desempeño' },
                    { value: 'otro_caso',             label: 'Otro — caso especial' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`radio-option${form.proposito === opt.value ? ' selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="proposito"
                        value={opt.value}
                        checked={form.proposito === opt.value}
                        onChange={(e) => setField('proposito', e.target.value)}
                        required
                      />
                      {opt.label}
                    </label>
                  ))}
                  </div>
                </div>
              </div>
            </section>

          {/* ── Bloque informativo ── */}
          <div className="info-block">
            <div className="info-block-objetivo">
              <h3 className="info-block-title">Objetivo de la Evaluación</h3>
              <p>
                Evaluar la contribución del empleado alineado a la planeación estratégica de la
                organización, como instrumento base para el crecimiento, mejoramiento, desarrollo y
                reconocimiento del colaborador. Evalúa en el marco de Gestión del Desempeño: periodo
                de prueba, ascenso, cambios de rol, entre otros aplicables.
              </p>
            </div>
            <div className="info-block-right">
              <div className="info-tipo">
                <span className="info-tipo-label">Tipo de Evaluación</span>
                <span className="info-tipo-value">90°</span>
              </div>
              <div className="criterios-grid">
                {criterios.map((c) => (
                  <div key={c.valor} className="criterio-item">
                    <span className="criterio-num">{c.valor}</span>
                    <span className="criterio-desc">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sección 2: Competencias Transversales ── */}
          <section className="form-section form-section--competencias">
            <div className="section-header">
              <h2 className="section-title">Competencias Transversales, por Nivel de Cargo y Desempeño</h2>
              <p className="section-subtitle">Calificación</p>
            </div>

            <div className="competencias-group">
              <h3 className="competencias-group-title">Transversales</h3>
              <div className="competencias-list">
                {transversales.map((comp) => (
                  <CompetenciaRow
                    key={comp.key}
                    nombre={comp.nombre}
                    descripcion={comp.descripcion}
                    pregunta={comp.pregunta}
                    valor={form[comp.key] as Score}
                    onChange={(v) => setField(comp.key, v)}
                  />
                ))}
              </div>
            </div>

            <div className="competencias-group">
              <h3 className="competencias-group-title competencias-group-title--estrategico">
                Nivel Estratégico
              </h3>
              <div className="competencias-list">
                {nivelEstrategico.map((comp) => (
                  <CompetenciaRow
                    key={comp.key}
                    nombre={comp.nombre}
                    descripcion={comp.descripcion}
                    pregunta={comp.pregunta}
                    valor={form[comp.key] as Score}
                    onChange={(v) => setField(comp.key, v)}
                  />
                ))}
              </div>
            </div>

            <div className="competencias-group">
              <h3 className="competencias-group-title competencias-group-title--estrategico">
                Desempeño del Cargo
              </h3>
              <div className="competencias-list">
                {desempenoCargo.map((comp) => (
                  <DesempenoCargoRow
                    key={comp.key}
                    nombre={comp.nombre}
                    descripcion={comp.descripcion}
                    pregunta={comp.pregunta}
                    comportamientos={comp.comportamientos}
                    valor={form[comp.key] as Score}
                    onChange={(v) => setField(comp.key, v)}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── Acciones ── */}
          {submitError && (
            <div className="destr-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {submitError}
            </div>
          )}
          <div className="form-actions">
            <Link href="/" className="btn-cancel">Cancelar</Link>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="destr-spinner" />Enviando...</>
              ) : (
                'Enviar Evaluación'
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default FormularioDesempenoEstrategico;
