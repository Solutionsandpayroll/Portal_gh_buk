"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

interface RespuestaItem {
  competenciaId: string
  puntuacion: number
  nivel: string
}

const PESOS: Record<string, { transversal: number; nivel: number }> = {
  operativo: { transversal: 0.4, nivel: 0.6 },
  tactico: { transversal: 0.4, nivel: 0.6 },
  estrategico: { transversal: 0.3, nivel: 0.7 },
}

function calcNineBox(notaFinal: number, notaPotencial: number): string {
  const clasificar = (nota: number): string => {
    if (nota >= 4.0) return "Alto"
    if (nota >= 3.0) return "Medio"
    return "Bajo"
  }
  
  const desempeno = clasificar(notaFinal)
  const potencial = clasificar(notaPotencial)
  
  return `${potencial} Potencial / ${desempeno} Desempeño`
}

export async function guardarEvaluacion(data: {
  evaluadoNombre: string
  cargo: string
  periodo: string
  feedback: string
  respuestas: RespuestaItem[]
  respuestasPotencial: RespuestaItem[]
  calidad: number | null
  cantidadProductividad: number | null
  tiempoOportunidad: number | null
  tipoEvaluacion: 'descendente' | 'ascendente'
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const evaluador = await prisma.user.findUnique({ where: { entraidSub: session.user.id } })
  if (!evaluador) throw new Error("Usuario evaluador no encontrado")

  // Buscar al usuario evaluado por nombre para vincular su ID
  const evaluadoUser = await prisma.user.findFirst({
    where: { name: data.evaluadoNombre },
  })

  const todas = [...data.respuestas, ...data.respuestasPotencial]
  const todosIds = [...new Set(todas.map(r => r.competenciaId))]
  const comps = await prisma.competencia.findMany({ where: { id: { in: todosIds } } })
  const tipoMap = new Map(comps.map(c => [c.id, c.tipo]))

  const nivelesUnicos = [...new Set(data.respuestas.map(r => r.nivel).filter(n => n !== 'potencial'))]
  const nivel = nivelesUnicos[0] || ''
  const peso = PESOS[nivel] || { transversal: 0.4, nivel: 0.6 }

  const trans = data.respuestas.filter(r => tipoMap.get(r.competenciaId) === 'transversal')
  const niv = data.respuestas.filter(r => tipoMap.get(r.competenciaId) === nivel)
  const promTrans = trans.length > 0 ? trans.reduce((s, r) => s + r.puntuacion, 0) / trans.length : 0
  const promNiv = niv.length > 0 ? niv.reduce((s, r) => s + r.puntuacion, 0) / niv.length : 0
  const notaCompetencias = (promTrans * peso.transversal) + (promNiv * peso.nivel)

  let notaDesempenoCargo: number | null = null
  let notaFinal: number
  let notaPotencial = 0
  let categoriaNineBox: string | null = null

  if (data.tipoEvaluacion === 'descendente') {
    const tieneDesempenoCargo = data.calidad !== null && data.cantidadProductividad !== null && data.tiempoOportunidad !== null
    notaDesempenoCargo = tieneDesempenoCargo
      ? (data.calidad! + data.cantidadProductividad! + data.tiempoOportunidad!) / 3
      : null

    notaFinal = notaDesempenoCargo !== null
      ? (notaDesempenoCargo * 0.6) + (notaCompetencias * 0.4)
      : notaCompetencias

    notaPotencial = data.respuestasPotencial.length > 0
      ? data.respuestasPotencial.reduce((s, r) => s + r.puntuacion, 0) / data.respuestasPotencial.length
      : 0

    categoriaNineBox = calcNineBox(notaFinal, notaPotencial)
  } else {
    notaFinal = notaCompetencias
  }

  const evaluacion = await prisma.evaluacion.create({
    data: {
      evaluadorId: evaluador.id,
      evaluadoId: evaluadoUser?.id || null,
      evaluadoNombre: data.evaluadoNombre,
      tipo: data.tipoEvaluacion,
      cargo: data.cargo,
      periodo: data.periodo,
      calidad: data.tipoEvaluacion === 'descendente' ? data.calidad : null,
      cantidadProductividad: data.tipoEvaluacion === 'descendente' ? data.cantidadProductividad : null,
      tiempoOportunidad: data.tipoEvaluacion === 'descendente' ? data.tiempoOportunidad : null,
      notaFinal,
      notaPotencial: data.tipoEvaluacion === 'descendente' ? notaPotencial : null,
      categoriaNineBox: data.tipoEvaluacion === 'descendente' ? categoriaNineBox : null,
      feedback: data.feedback,
      estado: "completada",
      respuestas: { create: todas.map(r => ({ competenciaId: r.competenciaId, puntuacion: r.puntuacion, nivel: r.nivel })) },
    },
  })

  return {
    id: evaluacion.id,
    notaFinal: Number(notaFinal.toFixed(2)),
    notaPotencial: data.tipoEvaluacion === 'descendente' ? Number(notaPotencial.toFixed(2)) : 0,
    categoriaNineBox: data.tipoEvaluacion === 'descendente' ? categoriaNineBox : null,
    notaDesempenoCargo: data.tipoEvaluacion === 'descendente' && notaDesempenoCargo !== null ? Number(notaDesempenoCargo.toFixed(2)) : undefined,
    notaCompetencias: Number(notaCompetencias.toFixed(2)),
    tipoEvaluacion: data.tipoEvaluacion,
  }
}
