import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const colaboradores = await prisma.colaborador.findMany({
      orderBy: { nombre: "asc" },
    })
    return NextResponse.json(colaboradores)
  } catch (error) {
    console.error("colaboradores GET error", error)
    return NextResponse.json({ error: "Error al cargar colaboradores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const rol = (session?.user as any)?.rol
    if (rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { nombre } = await request.json()

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    const limpio = nombre.trim()

    // Verificar si ya existe
    const existente = await prisma.colaborador.findUnique({ where: { nombre: limpio } })
    if (existente) {
      return NextResponse.json({ error: "Ya existe un colaborador con ese nombre" }, { status: 409 })
    }

    const colaborador = await prisma.colaborador.create({
      data: { nombre: limpio },
    })

    return NextResponse.json(colaborador, { status: 201 })
  } catch (error: any) {
    console.error("colaboradores POST error", error)
    return NextResponse.json({ error: error?.message || "Error al crear colaborador" }, { status: 500 })
  }
}
