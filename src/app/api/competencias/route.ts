import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")

  try {
    const where = tipo ? { tipo } : {}
    const competencias = await prisma.competencia.findMany({
      where,
      orderBy: { tipo: "asc" },
    })
    return NextResponse.json(competencias)
  } catch (error) {
    console.error("competencias error", error)
    return NextResponse.json({ error: "Error al cargar competencias" }, { status: 500 })
  }
}
