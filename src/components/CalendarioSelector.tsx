'use client';

import { useState } from 'react';
import './CalendarioSelector.css';

interface Props {
  value: string[];
  onChange: (dates: string[]) => void;
  max?: number;
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const toYMD = (d: Date) => d.toISOString().split('T')[0];
const formatDMY = (ymd: string) => ymd.split('-').reverse().join('/');

const CalendarioSelector = ({ value, onChange, max = 1 }: Props) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [vista, setVista] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );

  const year  = vista.getFullYear();
  const month = vista.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  const offsetInicio = (primerDia.getDay() + 6) % 7;

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    celdas.push(new Date(year, month, d));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  const irAtras    = () => setVista(new Date(year, month - 1, 1));
  const irAdelante = () => setVista(new Date(year, month + 1, 1));

  const handleClick = (ymd: string) => {
    if (value.includes(ymd)) {
      onChange(value.filter((d) => d !== ymd));
    } else if (value.length < max) {
      onChange([...value, ymd]);
    } else {
      onChange([...value.slice(1), ymd]);
    }
  };

  return (
    <div className="cal-root">
      {max > 1 && (
        <div className="cal-hint">
          Selecciona <strong>{max} días</strong> — {value.length} de {max} elegidos
        </div>
      )}

      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={irAtras} aria-label="Mes anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="cal-titulo">{MESES[month]} {year}</span>
        <button type="button" className="cal-nav-btn" onClick={irAdelante} aria-label="Mes siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="cal-grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}

        {celdas.map((dia, i) => {
          if (!dia) return <div key={`v-${i}`} className="cal-celda cal-vacia" />;

          const ymd       = toYMD(dia);
          const esPasado  = dia < hoy;
          const esHoy     = ymd === toYMD(hoy);
          const idxSel    = value.indexOf(ymd);
          const esSel     = idxSel !== -1;
          const esWeekend = dia.getDay() === 0 || dia.getDay() === 6;

          const clases = [
            'cal-celda',
            'cal-dia',
            esPasado  ? 'cal-pasado'       : '',
            esHoy     ? 'cal-hoy'          : '',
            esSel     ? 'cal-seleccionado' : '',
            esWeekend ? 'cal-weekend'      : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={ymd}
              type="button"
              className={clases}
              disabled={esPasado}
              onClick={() => handleClick(ymd)}
              aria-label={`${dia.getDate()} de ${MESES[month]}`}
              aria-pressed={esSel}
            >
              {dia.getDate()}
              {max > 1 && esSel && (
                <span className="cal-numero-sel">{idxSel + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="cal-badge-sel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {value.length === 1 ? (
            <>Día seleccionado: <strong>{formatDMY(value[0])}</strong></>
          ) : (
            <>Días seleccionados: <strong>{formatDMY(value[0])}</strong> y <strong>{formatDMY(value[1])}</strong></>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarioSelector;
