import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const beneficioId = searchParams.get("beneficioId")
  if (!beneficioId) return NextResponse.json({ error: "beneficioId requerido" }, { status: 400 })

  const fields = await prisma.formField.findMany({
    where: { beneficioId },
    orderBy: { orden: "asc" },
  })
  return NextResponse.json(fields)
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if ((session?.user as any)?.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const body = await request.json()
    const { beneficioId, label, name, type, required, placeholder, options, orden } = body
    if (!beneficioId || !label || !name) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

    const field = await prisma.formField.create({
      data: { beneficioId, label, name, type: type || "text", required: !!required, placeholder: placeholder || "", options: options || null, orden: orden || 0 },
    })
    return NextResponse.json(field, { status: 201 })
  } catch (error: any) {
    console.error("form-fields POST error:", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if ((session?.user as any)?.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  await prisma.formField.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  const session = await auth()
  if ((session?.user as any)?.rol !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const body = await request.json()
  const { id, orden, columnSpan, label, type, required, placeholder, options } = body
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const data: any = {}
  if (typeof orden === 'number') data.orden = orden
  if (typeof columnSpan === 'number') data.columnSpan = columnSpan
  if (typeof label === 'string') data.label = label
  if (typeof type === 'string') data.type = type
  if (typeof required === 'boolean') data.required = required
  if (typeof placeholder === 'string') data.placeholder = placeholder
  if (typeof options === 'string') data.options = options

  const field = await prisma.formField.update({ where: { id }, data })
  return NextResponse.json(field)
}
