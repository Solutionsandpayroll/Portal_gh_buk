'use client';

import { useRouter } from 'next/navigation';

interface FiltroActividadProps {
  actividades: string[];
  actividadSeleccionada?: string;
}

export default function FiltroActividad({ actividades, actividadSeleccionada }: FiltroActividadProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const url = new URL(window.location.href);
    if (val) url.searchParams.set('actividad', val);
    else url.searchParams.delete('actividad');
    router.push(url.toString());
  };

  return (
    <div style={{
      marginBottom: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px 16px 0 0',
      borderBottom: 'none',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      position: 'relative',
      top: '1px',
    }}>
      <label htmlFor="filtro-actividad" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
        Filtrar por actividad:
      </label>
      <select
        id="filtro-actividad"
        defaultValue={actividadSeleccionada || ''}
        onChange={handleChange}
        style={{
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '0.85rem',
          background: '#fff',
          color: '#0f172a',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.2s',
          minWidth: '220px',
        }}
        onFocus={(e) => e.target.style.borderColor = '#4f7cff'}
        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
      >
        <option value="">Todas las actividades</option>
        {actividades.map(act => <option key={act} value={act}>{act}</option>)}
      </select>
    </div>
  );
}
