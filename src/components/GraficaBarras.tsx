interface BarraHorizontalProps {
  nombre: string;
  valor: number;
  maxValor?: number;
  color?: string;
}

export function BarraHorizontal({ nombre, valor, maxValor = 5, color = '#4f7cff' }: BarraHorizontalProps) {
  const porcentaje = (valor / maxValor) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', minWidth: '140px', textAlign: 'right' }}>
        {nombre}
      </span>
      <div style={{ flex: 1, height: '24px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${porcentaje}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '0.5rem',
          transition: 'width 0.5s ease',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
            {valor.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface GraficaBarrasProps {
  titulo: string;
  datos: { nombre: string; valor: number }[];
  color?: string;
}

export function GraficaBarras({ titulo, datos, color = '#4f7cff' }: GraficaBarrasProps) {
  if (datos.length === 0) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>{titulo}</h4>
      {datos.map((d, i) => (
        <BarraHorizontal key={i} nombre={d.nombre} valor={d.valor} color={color} />
      ))}
    </div>
  );
}
