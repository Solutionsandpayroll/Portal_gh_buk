'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CalendarioSelector from '@/components/CalendarioSelector';
import PersonSelector from '@/components/PersonSelector';
import './FormularioPeople.css';

/* ── Tipos ── */
type Categoria = 'dias_remunerados' | 'adicionales' | 'people';

interface Beneficio {
  id: string;
  label: string;
  detalle?: string;
  dias?: string;
  categoria: Categoria;
}

/* ── Catálogo de beneficios ── */
const beneficios: Beneficio[] = [
  /* Días remunerados */
  { id: 'cumpleanos',    label: 'Día libre por cumpleaños',           dias: '1 día',  categoria: 'dias_remunerados' },
  { id: 'grado',         label: 'Día libre por grado',                dias: '1 día',  categoria: 'dias_remunerados' },
  { id: 'matrimonio',    label: 'Días libres por matrimonio',          dias: '2 días', categoria: 'dias_remunerados' },
  { id: 'luto_mascota',  label: 'Días por calamidad / luto mascota',  dias: '2 días', categoria: 'dias_remunerados' },
  /* Beneficios adicionales */
  { id: 'poliza',             label: 'Póliza de vida',                           detalle: 'A partir del 3er mes de antigüedad',      categoria: 'adicionales' },
  { id: 'auxilio_educativo',  label: 'Auxilio educativo Formación y Desarrollo', detalle: 'Alineación con el negocio',               categoria: 'adicionales' },
  { id: 'quinquenios',        label: 'Quinquenios',                                                                                  categoria: 'adicionales' },
  /* PEOPLE */
  { id: 'people_lab',      label: 'People Lab',      detalle: 'Participa en propuestas para el diseño de las iniciativas de bienestar',          categoria: 'people' },
  { id: 'people_conexion', label: 'People Conexión', detalle: 'Espacios de conexión entre equipos',                                              categoria: 'people' },
  { id: 'people_impacto',  label: 'People Impacto',  detalle: 'Jornadas Sociales',                                                               categoria: 'people' },
  { id: 'people_star',     label: 'People Star',     detalle: 'Reconocimiento personal / Reconocimiento equipos',                                categoria: 'people' },
  { id: 'people_valores',  label: 'People Valores',  detalle: 'Actividades experiencias compartidas / Torneo valores',                           categoria: 'people' },
  { id: 'people_cuidado',  label: 'People Cuidado',  detalle: 'Sesión acompañamiento Duelo / Sesión acompañamiento procesos individuales',       categoria: 'people' },
];

const categorias: { key: Categoria; titulo: string; descripcion?: string }[] = [
  {
    key: 'dias_remunerados',
    titulo: 'Días Remunerados',
    descripcion: 'Con previa autorización del jefe directo. Selecciona el beneficio a redimir.',
  },
  {
    key: 'adicionales',
    titulo: 'Beneficios Adicionales',
  },
  {
    key: 'people',
    titulo: 'Programa PEOPLE',
  },
];

/* ── Componente ── */
const FormularioPeople = () => {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const router = useRouter();

  const [seleccion, setSeleccion] = useState<string>('');
  const [fechasSolicitud, setFechasSolicitud] = useState<string[]>([]);
  const [correoContacto, setCorreoContacto] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState(60);
  const [encargadoEmail, setEncargadoEmail] = useState('');
  const [slotsDisponibles, setSlotsDisponibles] = useState<Array<{ start: string; end: string }>>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<{ eventId: string; teamsMeetingUrl: string; fecha: string; hora: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const beneficioSeleccionado = beneficios.find((b) => b.id === seleccion);
  const isPeopleCuidado = seleccion === 'people_cuidado';
  const esDiaRemunerado = beneficioSeleccionado?.categoria === 'dias_remunerados';
  const requiereDias = ['matrimonio', 'luto_mascota'].includes(seleccion) ? 2 : 1;

  const formatearHora = (isoDateTime: string) => {
    const dt = new Date(isoDateTime);
    return dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleSeleccionBeneficio = (id: string) => {
    setSeleccion(id);
    setFechasSolicitud([]);
    setFechaCita('');
    setSlotSeleccionado('');
    setSlotsDisponibles([]);
    setMeetingInfo(null);
    setSubmitError(null);
  };

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!isPeopleCuidado || !fechaCita) return;
      setCargandoDisponibilidad(true);
      setSubmitError(null);
      setSlotSeleccionado('');
      try {
        const start = `${fechaCita}T00:00:00`;
        const end = `${fechaCita}T23:59:59`;
        const response = await fetch(`/api/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`No fue posible consultar disponibilidad (${response.status}).`);
        }
        const data = await response.json();
        setEncargadoEmail(data.encargadoEmail || '');
        setSlotsDisponibles(Array.isArray(data.available) ? data.available : []);
      } catch (err) {
        setSlotsDisponibles([]);
        setSubmitError(err instanceof Error ? err.message : 'Error consultando disponibilidad.');
      } finally {
        setCargandoDisponibilidad(false);
      }
    };

    fetchDisponibilidad();
  }, [isPeopleCuidado, fechaCita]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccion) return;
    setIsSubmitting(true);
    setSubmitError(null);

    if (esDiaRemunerado && fechasSolicitud.length < requiereDias) {
      setSubmitError(
        requiereDias === 2
          ? 'Este beneficio requiere 2 días. Por favor selecciona un segundo día en el calendario.'
          : 'Selecciona una fecha antes de continuar.'
      );
      setIsSubmitting(false);
      return;
    }

    if (isPeopleCuidado) {
      if (!correoContacto.trim()) {
        setSubmitError('Ingresa un correo para agendar la sesión de People Cuidado.');
        setIsSubmitting(false);
        return;
      }
      if (!slotSeleccionado) {
        setSubmitError('Selecciona un horario disponible para agendar la sesión.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let citaCreada: { eventId: string; teamsMeetingUrl: string; fecha: string; hora: string } | null = null;
      if (isPeopleCuidado) {
        const [fecha, horaSeg] = slotSeleccionado.split('T');
        const hora = (horaSeg || '').slice(0, 5);
        const citaResp = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: userName,
            correo: correoContacto.trim(),
            fecha,
            hora,
            duracionMinutos,
          }),
        });

        if (!citaResp.ok) {
          const errData = await citaResp.json().catch(() => ({}));
          throw new Error(errData?.error || `No fue posible crear la cita (${citaResp.status}).`);
        }

        citaCreada = await citaResp.json();
        setMeetingInfo(citaCreada);
      }

      const label = beneficioSeleccionado
        ? beneficioSeleccionado.dias
          ? `${beneficioSeleccionado.label} (${beneficioSeleccionado.dias})`
          : beneficioSeleccionado.detalle
            ? `${beneficioSeleccionado.label}: ${beneficioSeleccionado.detalle}`
            : beneficioSeleccionado.label
        : seleccion;

      const url = process.env.NEXT_PUBLIC_PA_PEOPLE_URL as string;
      const fechaPrincipal = isPeopleCuidado && slotSeleccionado
        ? slotSeleccionado.split('T')[0]
        : (esDiaRemunerado ? fechasSolicitud[0] : '');
      const horaSesion = isPeopleCuidado && slotSeleccionado
        ? (slotSeleccionado.split('T')[1] || '').slice(0, 5)
        : '';

      const sinFecha = 'Para este beneficio no es necesario una fecha';
      const payload = {
        nombreUsuario: userName,
        beneficioSeleccionado: label,
        fechaSolicitud: fechaPrincipal || sinFecha,
        fechaSolicitud2: fechasSolicitud[1] || '',
        correoContacto: correoContacto.trim() || 'No aplica',
        encargadoEmail,
        fechaSesion: isPeopleCuidado ? fechaPrincipal : '',
        horaSesion,
        duracionMinutos: isPeopleCuidado ? duracionMinutos : 0,
        eventId: citaCreada?.eventId || '',
        teamsMeetingUrl: citaCreada?.teamsMeetingUrl || '',
      };
      console.log('Enviando a Power Automate:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Pantalla de éxito ── */
  if (submitted) {
    return (
      <div className="people-page">
        <div className="people-success">
          <div className="people-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>¡Solicitud enviada!</h2>
          <p>
            Tu solicitud del beneficio <strong>{beneficioSeleccionado?.label}</strong>{' '}
            {esDiaRemunerado && fechasSolicitud.length > 0 && (
              fechasSolicitud.length === 2
                ? <>para los días <strong>{fechasSolicitud[0].split('-').reverse().join('/')}</strong> y <strong>{fechasSolicitud[1].split('-').reverse().join('/')}</strong></>
                : <>para el día <strong>{fechasSolicitud[0]?.split('-').reverse().join('/')}</strong></>
            )}{' '}
            {isPeopleCuidado && meetingInfo?.fecha && meetingInfo?.hora && (
              <>ha quedado agendada para el <strong>{meetingInfo.fecha}</strong> a las <strong>{meetingInfo.hora}</strong>. </>
            )}
            ha sido registrada correctamente. El equipo de Gestión Humana la procesará pronto.
          </p>
          {meetingInfo?.teamsMeetingUrl && (
            <p>
              Tu reunión de Teams fue creada correctamente:{' '}
              <a href={meetingInfo.teamsMeetingUrl} target="_blank" rel="noreferrer">
                Unirme a la reunión
              </a>
            </p>
          )}
          <div className="people-success-actions">
            <button
              className="people-btn-outline"
              onClick={() => { setSeleccion(''); setFechasSolicitud([]); setSubmitted(false); setSubmitError(null); }}
            >
              Nueva solicitud
            </button>
            <Link href="/" className="people-btn-primary">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="people-page">

      {/* Header */}
      <header className="people-header">
        <div className="people-header-inner">
          <div className="people-header-brand">
            <img src="/Logo syp.png" alt="Solutions & Payroll" className="people-logo" />
            <div className="people-brand-text">
              <span className="people-brand-name">Solutions & Payroll</span>
              <span className="people-brand-sub">Gestión Humana</span>
            </div>
          </div>
          <div className="people-header-right">
            <div className="people-user">
              <div className="people-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="people-username">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="people-hero">
        <div className="people-hero-inner">
          <Link href="/" className="people-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>
          <div>
            <span className="people-badge">Beneficios</span>
          </div>
          <h1>Programa PEOPLE</h1>
          <p>Conecta contigo y con S&amp;P. Selecciona el beneficio que deseas solicitar.</p>
        </div>
      </div>

      {/* Formulario */}
      <main className="people-main">
        <form className="people-form" onSubmit={handleSubmit}>

          {categorias.map((cat, idx) => {
            const items = beneficios.filter((b) => b.categoria === cat.key);
            return (
              <Fragment key={cat.key}>
                <section className="people-section">
                  <div className="people-section-header">
                    <h2 className="people-section-title">{cat.titulo}</h2>
                    {cat.descripcion && (
                      <p className="people-section-desc">{cat.descripcion}</p>
                    )}
                  </div>
                  <div className="people-beneficios-list">
                    {items.map((b) => (
                      <label
                        key={b.id}
                        className={`people-beneficio-card${seleccion === b.id ? ' selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="beneficio"
                          value={b.id}
                          checked={seleccion === b.id}
                          onChange={() => handleSeleccionBeneficio(b.id)}
                          className="people-radio-input"
                        />
                        <div className="people-beneficio-radio">
                          <div className="people-radio-dot" />
                        </div>
                        <div className="people-beneficio-content">
                          <span className="people-beneficio-label">{b.label}</span>
                          {b.dias && (
                            <span className="people-beneficio-badge people-beneficio-badge--dias">{b.dias}</span>
                          )}
                          {b.detalle && (
                            <span className="people-beneficio-detalle">{b.detalle}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Calendario: aparece justo debajo de Días Remunerados */}
                {idx === 0 && (
                  <section className="people-fecha-section">
                    <div className="people-fecha-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <div>
                        <h2 className="people-fecha-title">Fecha de solicitud</h2>
                        <p className="people-fecha-desc">
                          {requiereDias === 2
                            ? 'Este beneficio requiere 2 días. Selecciona ambas fechas en el calendario.'
                            : 'Selecciona el día en que deseas hacer uso del beneficio.'}
                        </p>
                      </div>
                    </div>
                    <CalendarioSelector
                      value={fechasSolicitud}
                      onChange={setFechasSolicitud}
                      max={requiereDias}
                    />
                  </section>
                )}
              </Fragment>
            );
          })}

          {isPeopleCuidado && (
            <section className="people-cuidado-section">
              <div className="people-cuidado-header">
                <h2 className="people-section-title">Agenda tu sesión con el encargado</h2>
                <p className="people-section-desc">
                  Selecciona fecha y horario disponible para agendar automáticamente la reunión de Teams.
                </p>
              </div>

              <div className="people-cuidado-grid">
                <label className="people-cuidado-field">
                  <span>Correo de contacto</span>
                  <input
                    type="email"
                    value={correoContacto}
                    onChange={(e) => setCorreoContacto(e.target.value)}
                    placeholder="tu.correo@empresa.com"
                    required={isPeopleCuidado}
                  />
                </label>

                <label className="people-cuidado-field">
                  <span>Fecha de la sesión</span>
                  <input
                    type="date"
                    value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)}
                    required={isPeopleCuidado}
                  />
                </label>

                <label className="people-cuidado-field">
                  <span>Duración</span>
                  <select
                    value={duracionMinutos}
                    onChange={(e) => setDuracionMinutos(Number(e.target.value))}
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </label>

                <div className="people-cuidado-encargado">
                  Encargado asignado: <strong>{encargadoEmail || 'Consultando...'}</strong>
                </div>
              </div>

              <div className="people-cuidado-slots">
                <h3>Horarios disponibles</h3>
                {cargandoDisponibilidad && <p>Consultando disponibilidad...</p>}
                {!cargandoDisponibilidad && fechaCita && slotsDisponibles.length === 0 && (
                  <p>No hay horarios disponibles para la fecha seleccionada.</p>
                )}
                <div className="people-slots-grid">
                  {slotsDisponibles.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      className={`people-slot-btn${slotSeleccionado === slot.start ? ' selected' : ''}`}
                      onClick={() => setSlotSeleccionado(slot.start)}
                    >
                      {formatearHora(slot.start)} - {formatearHora(slot.end)}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Acciones */}
          {submitError && (
            <div className="people-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {submitError}
            </div>
          )}
          <div className="people-actions">
            <Link href="/" className="people-btn-cancel">Cancelar</Link>
            <button
              type="submit"
              className="people-btn-submit"
              disabled={
                !seleccion ||
                isSubmitting ||
                (esDiaRemunerado && fechasSolicitud.length === 0) ||
                (isPeopleCuidado && (!fechaCita || !slotSeleccionado || !correoContacto.trim()))
              }
            >
              {isSubmitting
                ? (<><span className="people-spinner" />Enviando...</>)
                : 'Solicitar beneficio'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default FormularioPeople;
