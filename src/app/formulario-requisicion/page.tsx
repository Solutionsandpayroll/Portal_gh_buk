'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import './FormularioRequisicion.css';

interface FormData {
  fecha: string;
  areaSolicitante: string;
  cargoSolicitado: string;
  tipoSolicitud: 'nueva_posicion' | 'reemplazo' | '';
  salario: string;
  otrosPagos: string;
  otrosAuxilios: string;
  tipoContrato: 'indefinido' | 'fijo' | 'otro' | '';
  tipoContratoOtro: string;
  requierePrueba: 'si' | 'no' | '';
  observaciones: string;
}

const initialForm: FormData = {
  fecha: '',
  areaSolicitante: '',
  cargoSolicitado: '',
  tipoSolicitud: '',
  salario: '',
  otrosPagos: '',
  otrosAuxilios: '',
  tipoContrato: '',
  tipoContratoOtro: '',
  requierePrueba: '',
  observaciones: '',
};

const FormularioRequisicion = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario Corporativo';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const url = process.env.NEXT_PUBLIC_PA_REQUISICION_URL as string;

    const payload = {
      ...form,
      tipoContrato:
        form.tipoContrato === 'otro' && form.tipoContratoOtro.trim()
          ? form.tipoContratoOtro.trim()
          : form.tipoContrato,
      nombreUsuario: userName,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Error al enviar la requisición. Intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="req-page">
        <div className="req-success">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>Requisición enviada con éxito</h2>
          <p>Tu solicitud ha sido registrada correctamente en el sistema.</p>
          <div className="success-actions">
            <button className="btn-outline-req" onClick={() => { setForm(initialForm); setSubmitted(false); }}>
              Nueva requisición
            </button>
            <Link href="/" className="btn-primary-req">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="req-page">
      {/* Header — igual al navbar del Dashboard */}
      <header className="req-header">
        <div className="req-header-inner">
          <div className="req-header-brand">
            <img src="/Logo syp.png" alt="Solutions & Payroll" className="req-logo" />
            <div className="req-brand-text">
              <span className="req-brand-name">Solutions & Payroll</span>
              <span className="req-brand-sub">Gestión Humana</span>
            </div>
          </div>
          <div className="req-header-right">
            <div className="req-user">
              <div className="req-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="req-username">{userName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero del formulario */}
      <div className="req-hero">
        <div className="req-hero-inner">
          <Link href="/" className="req-back req-back--hero">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>
          <span className="req-badge">Form. 01</span>
          <h1>Requisición de Personal</h1>
          <p>Diligencia todos los campos para solicitar la apertura de un cargo</p>
        </div>
      </div>

      {/* Formulario */}
      <main className="req-main">
        <form className="req-form" onSubmit={handleSubmit}>

          {/* Sección 1: Información General */}
          <section className="form-section">
            <div className="form-section-header">
              <span className="section-number">01</span>
              <h2>Información General</h2>
            </div>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="fecha">Fecha <span className="required">*</span></label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="areaSolicitante">Área Solicitante <span className="required">*</span></label>
                <input
                  type="text"
                  id="areaSolicitante"
                  name="areaSolicitante"
                  placeholder="Ej. Tecnología, Finanzas..."
                  value={form.areaSolicitante}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cargoSolicitado">Cargo Solicitado <span className="required">*</span></label>
                <input
                  type="text"
                  id="cargoSolicitado"
                  name="cargoSolicitado"
                  placeholder="Nombre del cargo"
                  value={form.cargoSolicitado}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Solicitud <span className="required">*</span></label>
                <div className="radio-group">
                  <label className={`radio-option ${form.tipoSolicitud === 'nueva_posicion' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoSolicitud"
                      value="nueva_posicion"
                      checked={form.tipoSolicitud === 'nueva_posicion'}
                      onChange={handleChange}
                      required
                    />
                    Nueva posición
                  </label>
                  <label className={`radio-option ${form.tipoSolicitud === 'reemplazo' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoSolicitud"
                      value="reemplazo"
                      checked={form.tipoSolicitud === 'reemplazo'}
                      onChange={handleChange}
                    />
                    Reemplazo
                  </label>
                </div>
              </div>

            </div>
          </section>

          {/* Sección 2: Condiciones Económicas */}
          <section className="form-section">
            <div className="form-section-header">
              <span className="section-number">02</span>
              <h2>Condiciones Económicas</h2>
            </div>
            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="salario">Salario <span className="required">*</span></label>
                <input
                  type="text"
                  id="salario"
                  name="salario"
                  placeholder="Ej. $3.500.000"
                  value={form.salario}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="otrosPagos">Otros Pagos (KPIs)</label>
                <input
                  type="text"
                  id="otrosPagos"
                  name="otrosPagos"
                  placeholder="Bonos, comisiones, incentivos..."
                  value={form.otrosPagos}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="otrosAuxilios">Otros auxilios</label>
                <input
                  type="text"
                  id="otrosAuxilios"
                  name="otrosAuxilios"
                  placeholder="Ej. auxilio de transporte, alimentación..."
                  value={form.otrosAuxilios}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group form-group--full">
                <label>Tipo de Contrato <span className="required">*</span></label>
                <div className="radio-group">
                  <label className={`radio-option ${form.tipoContrato === 'indefinido' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoContrato"
                      value="indefinido"
                      checked={form.tipoContrato === 'indefinido'}
                      onChange={handleChange}
                      required
                    />
                    Indefinido
                  </label>
                  <label className={`radio-option ${form.tipoContrato === 'fijo' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoContrato"
                      value="fijo"
                      checked={form.tipoContrato === 'fijo'}
                      onChange={handleChange}
                    />
                    Fijo
                  </label>
                  <label className={`radio-option ${form.tipoContrato === 'otro' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoContrato"
                      value="otro"
                      checked={form.tipoContrato === 'otro'}
                      onChange={handleChange}
                    />
                    Otro
                  </label>
                </div>
                {form.tipoContrato === 'otro' && (
                  <div className="input-other-wrap">
                    <input
                      type="text"
                      name="tipoContratoOtro"
                      className="input-other"
                      placeholder="Especifica el tipo de contrato... (opcional)"
                      value={form.tipoContratoOtro}
                      onChange={handleChange}
                    />
                    <span className="input-other-hint">Si lo dejas vacío se enviará como "Otro"</span>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Sección 3: Perfil Requerido */}
          <section className="form-section">
            <div className="form-section-header">
              <span className="section-number">03</span>
              <h2>Perfil Requerido</h2>
            </div>
            <div className="form-grid">

              {/* Removed Nivel académico, Años experiencia, Experiencia específica y Conocimientos técnicos as requested */}

              <div className="form-group">
                <label>¿Requiere Prueba Técnica? <span className="required">*</span></label>
                <div className="radio-group">
                  <label className={`radio-option ${form.requierePrueba === 'si' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="requierePrueba"
                      value="si"
                      checked={form.requierePrueba === 'si'}
                      onChange={handleChange}
                      required
                    />
                    Sí
                  </label>
                  <label className={`radio-option ${form.requierePrueba === 'no' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="requierePrueba"
                      value="no"
                      checked={form.requierePrueba === 'no'}
                      onChange={handleChange}
                    />
                    No
                  </label>
                </div>
              </div>

            </div>
          </section>

          {/* Sección 4: Observaciones */}
          <section className="form-section">
            <div className="form-section-header">
              <span className="section-number">04</span>
              <h2>Observaciones</h2>
            </div>
            <div className="form-grid">
              <div className="form-group form-group--full">
                <label htmlFor="observaciones">Observaciones Adicionales</label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={4}
                  placeholder="Información adicional relevante para la requisición..."
                  value={form.observaciones}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Acciones */}
          {submitError && (
            <div className="req-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {submitError}
            </div>
          )}
          <div className="form-actions">
            <Link href="/" className="btn-outline-req">Cancelar</Link>
            <button type="submit" className="btn-primary-req" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="req-spinner" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Requisición
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

        </form>
      </main>

      {/* Footer simple */}
      <footer className="req-footer">
        <p>© 2026 Solutions & Payroll SAS — Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

export default FormularioRequisicion;
