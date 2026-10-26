import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { entraidSub: session.user.id },
  })
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get("periodo")

  try {
    const baseWhere: any = {}
    if (periodo) baseWhere.periodo = periodo

    // Evaluaciones recibidas: donde el usuario es el evaluado (por ID)
    const recibidas = await prisma.evaluacion.findMany({
      where: { ...baseWhere, evaluadoId: user.id },
      orderBy: { createdAt: "desc" },
      include: { evaluador: { select: { name: true } } },
    })

    // Evaluaciones enviadas: donde el usuario es el evaluador
    const enviadas = await prisma.evaluacion.findMany({
      where: { ...baseWhere, evaluadorId: user.id },
      orderBy: { createdAt: "desc" },
      include: { evaluador: { select: { name: true } } },
    })

    return NextResponse.json({ recibidas, enviadas })
  } catch (error) {
    console.error("mis-resultados error", error)
    return NextResponse.json({ error: "Error al cargar evaluaciones" }, { status: 500 })
  }
}
