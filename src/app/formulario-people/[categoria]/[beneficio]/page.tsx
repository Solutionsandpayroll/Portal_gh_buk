'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CalendarioSelector from '@/components/CalendarioSelector';
import { beneficios, categoriaTitulo, type Categoria } from '../../beneficios-data';
import '../../../formulario-requisicion/FormularioRequisicion.css';
import '../../../formulario-desempeno/FormularioDesempenoEstrategico.css';
import '../../FormularioPeople.css';

interface FormFieldData {
  id: string
  beneficioId: string
  label: string
  name: string
  type: string
  required: boolean
  placeholder: string | null
  options: string | null
  orden: number
  columnSpan: number
}

export default function BeneficioFormPage() {
  const { data: session } = useSession();
  const params = useParams();
  const userName = session?.user?.name || 'Usuario Corporativo';
  const rol = (session?.user as any)?.rol;
  const categoriaKey = params.categoria as Categoria;
  const beneficioId = params.beneficio as string;
  const benefit = beneficios.find(b => b.id === beneficioId && b.categoria === categoriaKey);

  const [customFields, setCustomFields] = useState<FormFieldData[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editData, setEditData] = useState({ label: '', type: 'text', placeholder: '', options: '' });
  const [fechaPeopleCuidado, setFechaPeopleCuidado] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  const startEdit = (f: FormFieldData) => {
    setEditingField(f.id);
    setEditData({ label: f.label, type: f.type, placeholder: f.placeholder || '', options: f.options || '' });
  };

  const saveFieldEdit = async (id: string) => {
    try {
      await fetch('/api/form-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editData }),
      });
      setEditingField(null);
      loadFields();
    } catch {}
  };
  const [newField, setNewField] = useState({ label: '', name: '', type: 'text', required: false, placeholder: '', options: '' });

  const [fechasSolicitud, setFechasSolicitud] = useState<string[]>([]);
  const [correoContacto, setCorreoContacto] = useState('');
  const [encargadoEmail, setEncargadoEmail] = useState('');
  const [slotsDisponibles, setSlotsDisponibles] = useState<Array<{ start: string; end: string }>>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState(60);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [citaCreada, setCitaCreada] = useState<{ eventId: string; teamsMeetingUrl: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPeopleCuidado = beneficioId === 'people_cuidado';
  const esDiaRemunerado = categoriaKey === 'dias_remunerados';

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); loadFields(); }, []);
  useEffect(() => { console.log('[DEBUG] fechaPeopleCuidado:', fechaPeopleCuidado, 'isPeopleCuidado:', isPeopleCuidado); if (isPeopleCuidado && fechaPeopleCuidado) fetchDisponibilidad(); }, [fechaPeopleCuidado, isPeopleCuidado]);

  const loadFields = async () => {
    try {
      const r = await fetch(`/api/form-fields?beneficioId=${beneficioId}`);
      const data = await r.json();
      const fields: FormFieldData[] = Array.isArray(data) ? data : [];
      setCustomFields(fields);
    } catch {}
  };

  const updateRequired = async (id: string, required: boolean) => {
    await fetch('/api/form-fields', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, required }) });
    loadFields();
  };

  const isSistemaField = (id: string) => id.startsWith('sistema_');

  const getSystemFields = (): FormFieldData[] => {
    const sistema: FormFieldData[] = [];
    sistema.push({ id: 'sistema_nombre', beneficioId, label: 'Nombre', name: 'nombre', type: 'text', required: true, placeholder: null, options: null, orden: -5, columnSpan: 1 });
    if (esDiaRemunerado) {
      sistema.push({ id: 'sistema_fecha', beneficioId, label: 'Fecha de solicitud', name: 'fechaSolicitud', type: 'date', required: true, placeholder: null, options: null, orden: -1, columnSpan: 2 });
    }
    if (isPeopleCuidado) {
      sistema.push(
        { id: 'sistema_fecha_pc', beneficioId, label: 'Fecha para la cita', name: 'fechaCita', type: 'date', required: true, placeholder: null, options: null, orden: -4, columnSpan: 2 },
        { id: 'sistema_correo', beneficioId, label: 'Correo de contacto', name: 'correoContacto', type: 'email', required: true, placeholder: 'tu-correo@empresa.com', options: null, orden: -3, columnSpan: 1 },
        { id: 'sistema_duracion', beneficioId, label: 'Duración (minutos)', name: 'duracionMinutos', type: 'select', required: false, placeholder: null, options: '30\n60\n90', orden: -2, columnSpan: 1 },
      );
    }
    return sistema;
  };

  const addField = async () => {
    if (!newField.label || !newField.name) return;
    try {
      const r = await fetch('/api/form-fields', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newField, beneficioId, orden: customFields.length }),
      });
      if (r.ok) { loadFields(); setNewField({ label: '', name: '', type: 'text', required: false, placeholder: '', options: '' }); }
    } catch {}
  };

  const removeField = async (id: string) => {
    try { await fetch(`/api/form-fields?id=${id}`, { method: 'DELETE' }); loadFields(); } catch {}
  };

  const moveField = async (id: string, direction: -1 | 1) => {
    const idx = customFields.findIndex(f => f.id === id);
    if (idx === -1) return;
    const other = customFields[idx + direction];
    if (!other) return;
    await fetch('/api/form-fields', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, orden: other.orden }) });
    await fetch('/api/form-fields', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, orden: customFields[idx].orden }) });
    loadFields();
  };

  const updateSpan = async (id: string, span: number) => {
    await fetch('/api/form-fields', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, columnSpan: span }) });
    loadFields();
  };

  const fetchDisponibilidad = async () => {
    if (!fechaPeopleCuidado) return;
    setCargandoDisponibilidad(true);
    try {
      const start = fechaPeopleCuidado + 'T00:00';
      const end = fechaPeopleCuidado + 'T23:59';
      const url = `/api/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const r = await fetch(url);
      const data = await r.json();
      setEncargadoEmail(data.encargadoEmail || '');
      setSlotsDisponibles(data.available || []);
    } catch (err: any) {
      console.error('[DEBUG] fetchDisponibilidad error:', err);
      setSlotsDisponibles([]);
    } finally {
      setCargandoDisponibilidad(false);
    }
  };

  const agendarCita = async () => {
    if (!slotSeleccionado || !correoContacto.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const [fecha, hora] = slotSeleccionado.split('T');
      const r = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: userName, correo: correoContacto.trim(), fecha, hora: hora.slice(0, 5), duracionMinutos }),
      });
      if (!r.ok) throw new Error(await r.json().then(d => d.error).catch(() => 'Error'));
      const data = await r.json();
      setCitaCreada({ eventId: data.eventId, teamsMeetingUrl: data.teamsMeetingUrl });

      // Subir PDF y guardar en BD
      const adjuntoUrl = beneficioId === 'auxilio_educativo' ? await subirPdfGuardado() : null;
      await guardarSolicitudBD(adjuntoUrl);
      await enviarAPowerAutomateSinCita();
      setSubmitted(true);
    } catch (err) { setSubmitError(err instanceof Error ? err.message : 'Error al agendar'); }
    finally { setIsSubmitting(false); }
  };

  const subirPdf = async (file: File) => {
    setPdfFile(file);
  };

  const subirPdfGuardado = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      const r = await fetch("/api/people/upload", {
        method: "POST",
        body: formData,
      });
      if (!r.ok) throw new Error("Error al subir archivo");
      const data = await r.json();
      return data.url;
    } catch (err) {
      console.error("Error subiendo PDF:", err);
      return null;
    } finally {
      setPdfUploading(false);
    }
  };

  const guardarSolicitudBD = async (adjuntoUrl?: string | null) => {
    const session = await fetch('/api/auth/session');
    const userData = await session.json();

    const campos = Object.entries(formValues)
      .filter(([key]) => !['nombre', 'observaciones', 'correoContacto', 'duracionMinutos', 'fechaCita', 'horaSesion'].includes(key))
      .map(([nombre, valor]) => ({ nombre, valor: String(valor || '') }));

    try {
      await fetch('/api/people/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: categoriaKey,
          beneficioId,
          beneficioLabel: benefit?.label || beneficioId,
          nombre: userName,
          observaciones: formValues.observaciones || null,
          correoContacto: correoContacto || null,
          duracionMinutos: isPeopleCuidado ? duracionMinutos : null,
          fechas: fechasSolicitud,
          fechaCita: isPeopleCuidado ? fechaPeopleCuidado : (esDiaRemunerado ? fechasSolicitud[0] : null),
          horaSesion: slotSeleccionado ? (slotSeleccionado.split('T')[1] || '').slice(0, 5) : null,
          eventId: citaCreada?.eventId || null,
          teamsMeetingUrl: citaCreada?.teamsMeetingUrl || null,
          adjuntoUrl: adjuntoUrl ?? null,
          adjuntoName: pdfFile?.name || null,
          campos,
        }),
      });
    } catch (err) {
      console.error("Error guardando solicitud BD:", err);
    }
  };

  const enviarAPowerAutomate = async () => {
    setIsSubmitting(true); setSubmitError(null);
    if (!benefit) return;

    const adjuntoUrl = beneficioId === 'auxilio_educativo' ? await subirPdfGuardado() : null;
    await guardarSolicitudBD(adjuntoUrl);

    const label = benefit.detalle ? `${benefit.label}: ${benefit.detalle}` : benefit.label;
    const fechaPrincipal = isPeopleCuidado && fechaPeopleCuidado ? fechaPeopleCuidado : (esDiaRemunerado ? fechasSolicitud[0] : '');
    const horaSesion = isPeopleCuidado && slotSeleccionado ? (slotSeleccionado.split('T')[1] || '').slice(0, 5) : '';
    const sinFecha = 'Para este beneficio no es necesario una fecha';

    try {
      const url = process.env.NEXT_PUBLIC_PA_PEOPLE_URL as string;
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreUsuario: userName, beneficioSeleccionado: label,
          fechaSolicitud: fechaPrincipal || sinFecha, fechaSolicitud2: fechasSolicitud[1] || '',
          correoContacto: correoContacto.trim() || 'No aplica', encargadoEmail,
          fechaSesion: isPeopleCuidado ? fechaPrincipal : '', horaSesion,
          duracionMinutos: isPeopleCuidado ? duracionMinutos : 0,
          eventId: citaCreada?.eventId || '', teamsMeetingUrl: citaCreada?.teamsMeetingUrl || '',
          ...formValues,
        }),
      });
      if (!r.ok) throw new Error(`Error del servidor: ${r.status}`);
      setSubmitted(true);
    } catch (err) { setSubmitError(err instanceof Error ? err.message : 'Error al enviar'); }
    finally { setIsSubmitting(false); }
  };

  const enviarAPowerAutomateSinCita = async () => {
    if (!benefit) return;

    const label = benefit.detalle ? `${benefit.label}: ${benefit.detalle}` : benefit.label;
    const fechaPrincipal = fechaPeopleCuidado;
    const horaSesion = slotSeleccionado ? (slotSeleccionado.split('T')[1] || '').slice(0, 5) : '';
    const sinFecha = 'Para este beneficio no es necesario una fecha';

    try {
      const url = process.env.NEXT_PUBLIC_PA_PEOPLE_URL as string;
      await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreUsuario: userName, beneficioSeleccionado: label,
          fechaSolicitud: fechaPrincipal || sinFecha, fechaSolicitud2: '',
          correoContacto: correoContacto.trim() || 'No aplica', encargadoEmail,
          fechaSesion: fechaPrincipal, horaSesion,
          duracionMinutos: duracionMinutos,
          eventId: citaCreada?.eventId || '', teamsMeetingUrl: citaCreada?.teamsMeetingUrl || '',
          ...formValues,
        }),
      });
    } catch (err) {
      console.error('Error enviando a Power Automate:', err);
    }
  };

  const renderField = (f: FormFieldData, readonly = false) => {
    const val = formValues[f.name] || '';
    if (readonly || f.type === 'textarea') {
      return <textarea className="field-input" rows={3} value={val} onChange={e => setFormValues(p => ({ ...p, [f.name]: e.target.value }))} placeholder={f.placeholder || ''} required={f.required} />;
    }
    if (f.type === 'select') {
      const opts = (f.options || '').split('\n').map(o => o.trim()).filter(Boolean);
      return (
        <select className="field-input" value={val} onChange={e => setFormValues(p => ({ ...p, [f.name]: e.target.value }))} required={f.required}>
          <option value="">Seleccionar...</option>
          {opts.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
        </select>
      );
    }
    return <input type={f.type} className="field-input" value={val} onChange={e => setFormValues(p => ({ ...p, [f.name]: e.target.value }))} placeholder={f.placeholder || ''} required={f.required} />;
  };

  if (!benefit) {
    return (
      <div className="req-page">
        <div className="destr-success"><h2>Beneficio no encontrado</h2><Link href="/formulario-people" className="btn-primary-req">Volver</Link></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="req-page">
        <div className="req-success">
          <div className="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg></div>
          <h2>Solicitud enviada con éxito</h2>
          <p>Tu solicitud ha sido registrada correctamente.</p>
          {citaCreada?.teamsMeetingUrl && (
            <div className="people-meeting-link"><span>Enlace de Teams:</span><a href={citaCreada.teamsMeetingUrl} target="_blank" rel="noopener noreferrer">{citaCreada.teamsMeetingUrl}</a></div>
          )}
          <div className="success-actions">
            <button className="btn-outline-req" onClick={() => { setFormValues({}); setFechasSolicitud([]); setSubmitted(false); }}>Nueva solicitud</button>
            <Link href="/" className="btn-primary-req">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="req-page">
      <header className="req-header">
        <div className="req-header-inner">
          <div className="req-header-brand"><img src="/Logo syp.png" alt="Solutions & Payroll" className="req-logo" /><div className="req-brand-text"><span className="req-brand-name">Solutions & Payroll</span><span className="req-brand-sub">Gestión Humana</span></div></div>
          <div className="req-header-right"><div className="req-user"><div className="req-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span className="req-username">{userName}</span></div></div>
        </div>
      </header>

      <div className="req-hero">
        <div className="req-hero-inner">
          <Link href={`/formulario-people/${categoriaKey}`} className="req-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Volver a {categoriaTitulo[categoriaKey]}</Link>
          <span className="req-badge">{categoriaTitulo[categoriaKey]}</span>
          <h1>{benefit.label}</h1>
          <p>Completa los datos para enviar tu solicitud</p>
        </div>
      </div>

      <main className="req-main">
          {/* Admin: field editor */}
        {editing && rol === 'admin' && (
          <section className="form-section" style={{ marginBottom: '1.5rem' }}>
            <div className="section-header"><h2 className="section-title">Campos actuales</h2></div>
            <div className="form-grid">
              {getSystemFields().map((f) => (
                <div key={f.id} className="form-group form-group--full" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', background: '#f8fafc', borderRadius: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', padding: '0.2rem 0.4rem', background: '#e2e8f0', borderRadius: 4 }}>SISTEMA</span>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}><strong>{f.label}</strong> ({f.type}{f.required ? ', req' : ''})</span>
                </div>
              ))}
              {customFields.map((f, i) => (
                <div key={f.id} className="form-group form-group--full" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
                  {editingField === f.id ? (
                    <>
                      <input className="field-input" style={{ flex: '1 1 120px', fontSize: '0.8rem' }} value={editData.label} onChange={e => setEditData(p => ({ ...p, label: e.target.value }))} placeholder="Label" />
                      <select className="field-input" style={{ flex: '0 0 90px', fontSize: '0.8rem' }} value={editData.type} onChange={e => setEditData(p => ({ ...p, type: e.target.value }))}>
                        <option value="text">Texto</option><option value="email">Email</option><option value="number">Número</option><option value="date">Fecha</option><option value="textarea">Área texto</option><option value="select">Selección</option>
                      </select>
                      <input className="field-input" style={{ flex: '1 1 100px', fontSize: '0.8rem' }} value={editData.placeholder} onChange={e => setEditData(p => ({ ...p, placeholder: e.target.value }))} placeholder="Placeholder" />
                      {editData.type === 'select' && <textarea className="field-input" style={{ flex: '1 1 100%', fontSize: '0.8rem' }} rows={2} value={editData.options} onChange={e => setEditData(p => ({ ...p, options: e.target.value }))} placeholder="Opciones (una por línea)" />}
                      <button type="button" onClick={() => saveFieldEdit(f.id)} style={{ padding: '0.3rem 0.6rem', border: '1px solid #10b981', borderRadius: 6, background: '#fff', color: '#10b981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>✓</button>
                      <button type="button" onClick={() => setEditingField(null)} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => moveField(f.id, -1)} disabled={i === 0} style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '0.8rem' }}>▲</button>
                      <button type="button" onClick={() => moveField(f.id, 1)} disabled={i === customFields.length - 1} style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: i === customFields.length - 1 ? 'not-allowed' : 'pointer', opacity: i === customFields.length - 1 ? 0.3 : 1, fontSize: '0.8rem' }}>▼</button>
                      <button type="button" onClick={() => updateSpan(f.id, f.columnSpan === 2 ? 1 : 2)} style={{ padding: '0.2rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, background: f.columnSpan === 2 ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#4f7cff' }}>{f.columnSpan === 2 ? '½' : '≡'} {f.columnSpan} col</button>
                      <span style={{ flex: 1, fontSize: '0.85rem' }}><strong>{f.label}</strong> ({f.type}{f.required ? ', req' : ''}{f.type === 'select' && f.options ? `, ${f.options.split('\n').filter(Boolean).length} opciones` : ''})</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: f.required ? '#10b981' : '#94a3b8', cursor: 'pointer' }}>
                        <input type="checkbox" checked={f.required} onChange={e => updateRequired(f.id, e.target.checked)} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                        Req
                      </label>
                      <button type="button" onClick={() => startEdit(f)} style={{ padding: '0.3rem 0.7rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#4f7cff', cursor: 'pointer', fontSize: '0.75rem' }}>✎</button>
                      <button type="button" onClick={() => removeField(f.id)} style={{ padding: '0.3rem 0.7rem', border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                    </>
                  )}
                </div>
              ))}
              {customFields.length === 0 && <p style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', gridColumn: '1 / -1' }}>No hay campos personalizados. Agrega uno abajo.</p>}
            </div>
            <div className="section-header" style={{ marginTop: '1rem' }}><h2 className="section-title">Agregar campo</h2></div>
            <div className="form-grid" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: '1 1 150px' }}><label className="field-label">Label</label><input className="field-input" value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} placeholder="Ej: Departamento" /></div>
              <div className="form-group" style={{ flex: '1 1 130px' }}><label className="field-label">Name (ID)</label><input className="field-input" value={newField.name} onChange={e => setNewField(p => ({ ...p, name: e.target.value }))} placeholder="departamento" /></div>
              <div className="form-group" style={{ flex: '0 0 100px' }}><label className="field-label">Tipo</label><select className="field-input" value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}><option value="text">Texto</option><option value="email">Email</option><option value="number">Número</option><option value="date">Fecha</option><option value="textarea">Área texto</option><option value="select">Selección</option></select></div>
              <div className="form-group" style={{ flex: '0 0 70px' }}><label className="field-label">Placeholder</label><input className="field-input" value={newField.placeholder} onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))} /></div>
              {newField.type === 'select' && (
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="field-label">Opciones (una por línea)</label>
                  <textarea className="field-input" rows={2} value={newField.options} onChange={e => setNewField(p => ({ ...p, options: e.target.value }))} placeholder={"Opción 1\nOpción 2\nOpción 3"} />
                </div>
              )}
              <div className="form-group" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.3rem', paddingTop: '1.2rem' }}><input type="checkbox" id="req" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} /><label htmlFor="req" className="field-label">Requerido</label></div>
              <button type="button" className="btn-primary-req" onClick={addField} style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>Agregar</button>
            </div>
          </section>
        )}

        <form className="req-form" onSubmit={e => { e.preventDefault(); if (isPeopleCuidado && !citaCreada) agendarCita(); else if (isPeopleCuidado && citaCreada) { guardarSolicitudBD(); enviarAPowerAutomateSinCita(); setSubmitted(true); } else enviarAPowerAutomate(); }}>
          <section className="form-section">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Datos de la solicitud</h2>
              {rol === 'admin' && (
                <button type="button" className={editing ? 'btn-primary-req' : 'btn-outline-req'} onClick={() => setEditing(!editing)} style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', marginLeft: 'auto' }}>
                  {editing ? 'Finalizar' : 'Editar'}
                </button>
              )}
            </div>
             <div className="form-grid">
                {/* Nombre del solicitante */}
                <div className="form-group">
                  <label className="field-label">Nombre <span className="required">*</span></label>
                  <input type="text" className="field-input" value={userName} readOnly style={{ background: '#f8fafc', cursor: 'default' }} />
                </div>

                {/* Subida de PDF - solo para Auxilio Educativo */}
                {beneficioId === 'auxilio_educativo' && (
                  <div className="form-group form-group--full">
                    <label className="field-label">Archivo PDF <span className="required">*</span></label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="field-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirPdf(file);
                      }}
                      required
                    />
                    {pdfFile && (
                      <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
                        Archivo seleccionado: {pdfFile.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Campos dinámicos */}
               {customFields.map(f => (
                 <div key={f.id} className={`form-group${f.columnSpan === 2 ? ' form-group--full' : ''}`}>
                   <label className="field-label">{f.label}{f.required ? <span className="required">*</span> : ''}</label>
                   {renderField(f)}
                 </div>
               ))}
               {esDiaRemunerado && (
                <div className="form-group form-group--full"><label className="field-label">Fecha de solicitud <span className="required">*</span></label><CalendarioSelector value={fechasSolicitud} onChange={setFechasSolicitud} max={benefit?.dias?.startsWith('2') ? 2 : 1} /></div>
              )}
              {isPeopleCuidado && (
                <>
                  <div className="form-group form-group--full">
                    <label className="field-label">Fecha para la cita <span className="required">*</span></label>
                    <input type="date" className="field-input" value={fechaPeopleCuidado} onChange={e => { setFechaPeopleCuidado(e.target.value); setSlotSeleccionado(''); }} required />
                  </div>
                  {fechaPeopleCuidado && (
                    <>
                      <div className="form-group"><label className="field-label">Correo de contacto <span className="required">*</span></label><input type="email" className="field-input" value={correoContacto} onChange={e => setCorreoContacto(e.target.value)} placeholder="tu-correo@empresa.com" required /></div>
                      <div className="form-group"><label className="field-label">Duración (minutos)</label><select className="field-input" value={duracionMinutos} onChange={e => setDuracionMinutos(Number(e.target.value))}><option value={30}>30 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select></div>
                      <div className="form-group form-group--full">
                        <label className="field-label">Horarios disponibles</label>
                        {cargandoDisponibilidad ? <p className="people-loading">Consultando disponibilidad...</p> : slotsDisponibles.length === 0 ? <p className="people-loading">No hay horarios disponibles para esta fecha.</p> : (
                          <div className="people-slots-grid">
                            {slotsDisponibles.map(s => {
                              const hora = s.start.split('T')[1]?.slice(0, 5);
                              return (
                                <button
                                  key={s.start}
                                  type="button"
                                  className={`people-slot-btn${slotSeleccionado === s.start ? ' selected' : ''}`}
                                  onClick={() => setSlotSeleccionado(s.start)}
                                >
                                  {hora}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {citaCreada && <div className="form-group form-group--full"><div className="people-cita-confirm"><span>✓ Cita agendada</span></div></div>}
                </>
              )}
              {!isPeopleCuidado && customFields.length === 0 && <div className="form-group"><label className="field-label">Correo de contacto</label><input type="email" className="field-input" value={correoContacto} onChange={e => setCorreoContacto(e.target.value)} placeholder="tu-correo@empresa.com" /></div>}
            </div>
          </section>

          {submitError && <div className="req-error-banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>{submitError}</div>}
          <div className="form-actions">
            <Link href={`/formulario-people/${categoriaKey}`} className="btn-outline-req">Cancelar</Link>
            {isPeopleCuidado && !citaCreada ? (
              <button type="submit" className="btn-primary-req" disabled={isSubmitting || !slotSeleccionado || !correoContacto.trim()}>{isSubmitting ? <><span className="req-spinner"/>Agendando...</> : 'Agendar cita'}</button>
            ) : (
              <button type="submit" className="btn-primary-req" disabled={isSubmitting}>{isSubmitting ? <><span className="req-spinner"/>Enviando...</> : 'Enviar solicitud'}</button>
            )}
          </div>
        </form>
      </main>
      <footer className="req-footer"><p>© 2026 Solutions & Payroll SAS — Todos los derechos reservados</p></footer>
    </div>
  );
}
