import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  const rol = (session?.user as any)?.rol
  if (rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get("periodo")

  try {
    const where: any = {}
    if (periodo) where.periodo = periodo

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        evaluador: { select: { name: true } },
      },
    })

    return NextResponse.json(evaluaciones)
  } catch (error) {
    console.error("admin evaluaciones error", error)
    return NextResponse.json({ error: "Error al cargar evaluaciones" }, { status: 500 })
  }
}
