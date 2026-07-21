import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get("periodo")

  try {
    const user = await prisma.user.findUnique({
      where: { entraidSub: session.user.id },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const where: any = { evaluadorId: user.id }
    if (periodo) where.periodo = periodo

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(evaluaciones)
  } catch (error) {
    console.error("evaluaciones error", error)
    return NextResponse.json({ error: "Error al cargar evaluaciones" }, { status: 500 })
  }
}
