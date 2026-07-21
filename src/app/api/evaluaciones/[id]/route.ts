import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id },
      include: {
        evaluador: { select: { name: true, email: true } },
        respuestas: {
          include: {
            competencia: { select: { id: true, tipo: true, nombre: true } },
          },
        },
      },
    })

    if (!evaluacion) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
    }

    return NextResponse.json(evaluacion)
  } catch (error) {
    console.error("evaluacion detail error", error)
    return NextResponse.json({ error: "Error al cargar la evaluación" }, { status: 500 })
  }
}
