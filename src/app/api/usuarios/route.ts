import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(users.map((u) => u.name))
  } catch (error) {
    console.error("usuarios error", error)
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 })
  }
}
