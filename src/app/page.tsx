'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import './Dashboard.css';

const Dashboard = () => {
  const { data: session } = useSession();
  const savedName = session?.user?.name || 'Usuario Corporativo';
  const rol = (session?.user as any)?.rol;

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const formularios = [
    {
      id: 1,
      title: 'Requisición de Personal',
      description: 'Solicitud formal para cubrir una nueva posición o reemplazo dentro de la organización',
      path: '/formulario-requisicion',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M17 11l2 2 4-4" />
        </svg>
      ),
      color: '#4f7cff',
      colorLight: '#eef2ff',
      tag: 'Form. 01',
      subOptions: null,
    },
    {
      id: 2,
      title: 'Gestión de Desempeño',
      description: 'Evaluación del desempeño del personal según nivel organizacional',
      path: null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      color: '#f59e0b',
      colorLight: '#fffbeb',
      tag: 'Form. 02',
      subOptions: [
        { label: 'Estratégico', path: '/formulario-desempeno/estrategico' },
        { label: 'Táctico', path: '/formulario-desempeno/tactico' },
        { label: 'Operativo', path: '/formulario-desempeno/operativo' },
      ],
    },
    {
      id: 3,
      title: 'Evaluación Anual',
      description: 'Evaluación anual de desempeño con registro en base de datos y cálculo automático de nota',
      path: '/evaluacion-anual',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      color: '#10b981',
      colorLight: '#f0fdf4',
      tag: 'Form. 03',
      subOptions: null,
    },
  ];

  const formulariosVisibles = rol === 'admin' ? formularios : formularios.filter(f => f.id !== 3);

  return (
    <div className="dashboard-root">

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <img src="/Logo syp.png" alt="Solutions & Payroll" className="navbar-logo" />
            <div className="navbar-brand-text">
              <span className="navbar-title">Solutions & Payroll</span>
              <span className="navbar-subtitle">Gestión Humana</span>
            </div>
          </div>
          <div className="navbar-right">
            <div className="navbar-user">
              <div className="navbar-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="navbar-username">{savedName}</span>
            </div>
            <button className="navbar-logout" onClick={handleLogout} title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-inner">
          <p className="hero-eyebrow">Portal de Gestión Humana</p>
          <h1 className="hero-title">
            Gestión <span className="hero-title-accent">Integral</span> de Personal
          </h1>
          <p className="hero-desc">
            Administra procesos, formularios y seguimiento del equipo humano desde un solo lugar.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Contenidos activos</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Digital</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Disponibilidad</span>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="#f1f5f9" />
          </svg>
        </div>
      </section>

      {/* Resultados (solo admin) */}
      {rol === 'admin' && (
        <section className="modules-section">
          <div className="section-label-row">
            <span className="section-label-pill section-label-pill--purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Resultados
            </span>
          </div>
          <div className="modules-header">
            <div>
              <h2 className="modules-title">Panel de Resultados</h2>
              <p className="modules-desc">Consulta todas las evaluaciones registradas en el sistema</p>
            </div>
          </div>
          <div className="modules-grid modules-grid--2col">
            <Link href="/resultados" className="module-card" style={{ animationDelay: '0s' }}>
              <div className="card-accent-bar" style={{ background: '#7c3aed' }} />
              <div className="card-top">
                <span className="card-tag">Admin</span>
                <div className="card-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <h3 className="card-title">Evaluación Anual 2026</h3>
                <p className="card-desc">Visualiza todas las evaluaciones de desempeño, notas, potencial y clasificación Nine Box de cada colaborador.</p>
              </div>
              <div className="card-footer">
                <span className="card-cta" style={{ color: '#7c3aed' }}>
                  Ver resultados
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Formularios */}
      <main className="modules-section">
        <div className="section-label-row">
          <span className="section-label-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Formularios
          </span>
        </div>
        <div className="modules-header">
          <div>
            <h2 className="modules-title">Formularios disponibles</h2>
            <p className="modules-desc">Selecciona un formulario para comenzar el proceso</p>
          </div>
        </div>
        <div className="modules-grid">
          {formulariosVisibles.map((form, i) => (
            form.subOptions ? (
              <div
                key={form.id}
                className="module-card module-card--sub"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="card-accent-bar" style={{ background: form.color }} />
                <div className="card-top">
                  <span className="card-tag">{form.tag}</span>
                  <div className="card-icon-wrap" style={{ background: form.colorLight, color: form.color }}>
                    <div className="card-icon">{form.icon}</div>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{form.title}</h3>
                  <p className="card-desc">{form.description}</p>
                </div>
                <div className="card-suboptions">
                  <span className="suboptions-label">Seleccionar nivel</span>
                  {form.subOptions.map((opt) => (
                    <Link
                      key={opt.label}
                      href={opt.path}
                      className="suboption-btn"
                    >
                      <span className="suboption-dot" style={{ background: form.color }} />
                      {opt.label}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={form.id}
                href={form.path!}
                className="module-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="card-accent-bar" style={{ background: form.color }} />
                <div className="card-top">
                  <span className="card-tag">{form.tag}</span>
                  <div className="card-icon-wrap" style={{ background: form.colorLight, color: form.color }}>
                    <div className="card-icon">{form.icon}</div>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{form.title}</h3>
                  <p className="card-desc">{form.description}</p>
                </div>
                <div className="card-footer" style={{ borderTopColor: form.colorLight }}>
                  <span className="card-cta" style={{ color: form.color }}>
                    Ingresar
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          ))}
        </div>
      </main>

      {/* Beneficios */}
      <section className="modules-section modules-section--alt">
        <div className="section-label-row">
          <span className="section-label-pill section-label-pill--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Bienestar &amp; Beneficios
          </span>
        </div>
        <div className="modules-header">
          <div>
            <h2 className="modules-title">Programa de Beneficios</h2>
            <p className="modules-desc">Bienestar y beneficios exclusivos para colaboradores de S&amp;P</p>
          </div>
        </div>
        <div className="benefits-grid">
          <Link href="/formulario-people" className="module-card benefit-card">
            <div className="card-accent-bar" style={{ background: '#10b981' }} />
            <div className="card-top">
              <span className="card-tag">Programa</span>
              <div className="card-icon-wrap" style={{ background: '#f0fdf4', color: '#10b981' }}>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">PEOPLE</h3>
              <p className="card-desc">
                Conecta contigo y con S&amp;P. Aquí encontrarás el panel central para solicitar y aprovechar tus beneficios del programa PEOPLE.
              </p>
            </div>
            <div className="card-footer" style={{ borderTopColor: '#f0fdf4' }}>
              <span className="card-cta" style={{ color: '#10b981' }}>
                Ingresar al programa
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          <div className="benefit-info-panel">
            <div className="benefit-info-item">
              <div className="benefit-info-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="benefit-info-label">Bienestar integral</p>
                <p className="benefit-info-sub">Salud, familia y desarrollo</p>
              </div>
            </div>
            <div className="benefit-info-item">
              <div className="benefit-info-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="benefit-info-label">Disponible 24/7</p>
                <p className="benefit-info-sub">Acceso en cualquier momento</p>
              </div>
            </div>
            <div className="benefit-info-item">
              <div className="benefit-info-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <p className="benefit-info-label">Beneficios exclusivos</p>
                <p className="benefit-info-sub">Diseñados para ti</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Corporativos */}
      <section className="modules-section">
        <div className="section-label-row">
          <span className="section-label-pill section-label-pill--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Recursos Corporativos
          </span>
        </div>
        <div className="modules-header">
          <div>
            <h2 className="modules-title">Formación y Desarrollo</h2>
            <p className="modules-desc">Accede a los recursos de formación y desarrollo de S&amp;P</p>
          </div>
        </div>
        <div className="modules-grid modules-grid--2col">
          <a
            href="https://app-induccion-syp.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="module-card"
            style={{ animationDelay: '0s' }}
          >
            <div className="card-accent-bar" style={{ background: '#3b82f6' }} />
            <div className="card-top">
              <span className="card-tag">Recurso</span>
              <div className="card-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">Inducción S&amp;P</h3>
              <p className="card-desc">
                Descubre la cultura, procesos y valores de Solutions &amp; Payroll en el programa de inducción corporativa.
              </p>
            </div>
            <div className="card-footer">
              <span className="card-cta" style={{ color: '#3b82f6' }}>
                Acceder
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="card-arrow">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </a>

          <div className="module-card module-card--soon" style={{ animationDelay: '0.08s' }}>
            <div className="card-accent-bar" style={{ background: '#a855f7' }} />
            <div className="card-top">
              <span className="card-tag card-tag--soon">Próximamente</span>
              <div className="card-icon-wrap" style={{ background: '#fdf4ff', color: '#a855f7' }}>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">Plataforma de Cursos</h3>
              <p className="card-desc">
                Accede al portal de formación y desarrollo profesional de S&amp;P. Explora los cursos disponibles para tu crecimiento.
              </p>
            </div>
            <div className="card-footer">
              <span className="card-cta" style={{ color: '#94a3b8' }}>
                Próximamente disponible
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>Solutions &amp; Payroll</h3>
            <p>Expertos en gestión empresarial y soluciones de nómina</p>
            <div className="footer-social">
              <a href="https://co.linkedin.com/company/solutionsandpayroll?trk=public_post_feed-actor-name" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
              <a href="https://www.facebook.com/SolutionsPayroll" target="_blank" rel="noopener noreferrer" className="social-link">Facebook</a>
              <a href="https://www.instagram.com/solutionsandpayroll_/" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
            </div>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Contacto</h4>
              <p>📧 automatizacion2@solutionsandpayroll.com</p>
              <p>📱 +57 300 123 4567</p>
              <p>📍 Bogotá, Colombia</p>
            </div>
            <div className="footer-col">
              <h4>Horario de Atención</h4>
              <p>Lun – Vie: 8:00 AM – 6:00 PM</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Solutions &amp; Payroll SAS — Todos los derechos reservados</p>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;
