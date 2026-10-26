export type Categoria = 'dias_remunerados' | 'adicionales' | 'people'

export interface Beneficio {
  id: string
  label: string
  detalle?: string
  dias?: string
  categoria: Categoria
}

export const beneficios: Beneficio[] = [
  { id: 'cumpleanos',    label: 'Día libre por cumpleaños',           dias: '1 día',  categoria: 'dias_remunerados' },
  { id: 'grado',         label: 'Día libre por grado',                dias: '1 día',  categoria: 'dias_remunerados' },
  { id: 'matrimonio',    label: 'Días libres por matrimonio',          dias: '2 días', categoria: 'dias_remunerados' },
  { id: 'luto_mascota',  label: 'Días por calamidad / luto mascota',  dias: '2 días', categoria: 'dias_remunerados' },
  { id: 'poliza',             label: 'Póliza de vida',                           detalle: 'A partir del 3er mes de antigüedad',      categoria: 'adicionales' },
  { id: 'auxilio_educativo',  label: 'Auxilio educativo Formación y Desarrollo', detalle: 'Alineación con el negocio',               categoria: 'adicionales' },
  { id: 'quinquenios',        label: 'Quinquenios',                                                                                  categoria: 'adicionales' },
  { id: 'people_lab',      label: 'People Lab',      detalle: 'Participa en propuestas para el diseño de las iniciativas de bienestar',          categoria: 'people' },
  { id: 'people_conexion', label: 'People Conexión', detalle: 'Espacios de conexión entre equipos',                                              categoria: 'people' },
  { id: 'people_impacto',  label: 'People Impacto',  detalle: 'Jornadas Sociales',                                                               categoria: 'people' },
  { id: 'people_star',     label: 'People Star',     detalle: 'Reconocimiento personal / Reconocimiento equipos',                                categoria: 'people' },
  { id: 'people_valores',  label: 'People Valores',  detalle: 'Actividades experiencias compartidas / Torneo valores',                           categoria: 'people' },
  { id: 'people_cuidado',  label: 'People Cuidado',  detalle: 'Sesión acompañamiento Duelo / Sesión acompañamiento procesos individuales',       categoria: 'people' },
]

export const categorias: { key: Categoria; titulo: string }[] = [
  { key: 'dias_remunerados', titulo: 'Días Remunerados' },
  { key: 'adicionales', titulo: 'Beneficios Adicionales' },
  { key: 'people', titulo: 'Programa PEOPLE' },
]

export const categoriaTitulo: Record<Categoria, string> = {
  dias_remunerados: 'Días Remunerados',
  adicionales: 'Beneficios Adicionales',
  people: 'Programa PEOPLE',
}
