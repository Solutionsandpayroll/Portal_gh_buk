"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

interface RespuestaItem {
  competenciaId: string
  puntuacion: number
}

function calcNineBox(notaPotencial: number): string {
  if (notaPotencial >= 4.0) return "Alto Potencial"
  if (notaPotencial >= 3.0) return "Potencial Medio"
  return "Potencial Bajo"
}

export async function guardarEvaluacion(data: {
  evaluadoNombre: string
  periodo: string
  respuestasDesempeno: RespuestaItem[]
  respuestasPotencial: RespuestaItem[]
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const evaluador = await prisma.user.findUnique({
    where: { entraidSub: session.user.id },
  })
  if (!evaluador) {
    throw new Error("Usuario evaluador no encontrado")
  }

  const notaFinal = data.respuestasDesempeno.length > 0
    ? data.respuestasDesempeno.reduce((s, r) => s + r.puntuacion, 0) / data.respuestasDesempeno.length
    : 0

  const notaPotencial = data.respuestasPotencial.length > 0
    ? data.respuestasPotencial.reduce((s, r) => s + r.puntuacion, 0) / data.respuestasPotencial.length
    : 0

  const categoriaNineBox = calcNineBox(notaPotencial)
  const todasRespuestas = [...data.respuestasDesempeno, ...data.respuestasPotencial]

  const evaluacion = await prisma.evaluacion.create({
    data: {
      evaluadorId: evaluador.id,
      evaluadoNombre: data.evaluadoNombre,
      tipo: "general",
      periodo: data.periodo,
      notaFinal,
      notaPotencial,
      categoriaNineBox,
      estado: "completada",
      respuestas: {
        create: todasRespuestas.map((r) => ({
          competenciaId: r.competenciaId,
          puntuacion: r.puntuacion,
        })),
      },
    },
  })

  return {
    id: evaluacion.id,
    notaFinal: Number(notaFinal.toFixed(2)),
    notaPotencial: Number(notaPotencial.toFixed(2)),
    categoriaNineBox,
  }
}
