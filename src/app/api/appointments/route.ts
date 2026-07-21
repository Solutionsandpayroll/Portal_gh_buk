import { NextResponse } from "next/server"
import { createAppointment } from "@/lib/calendarService"

export async function POST(request: Request) {
  try {
    const { nombre, correo, fecha, hora, duracionMinutos } = (await request.json()) ?? {}

    if (!nombre || !correo || !fecha || !hora) {
      return NextResponse.json(
        { error: "Campos obligatorios: nombre, correo, fecha, hora" },
        { status: 400 }
      )
    }

    const duration = Number(duracionMinutos || 60)
    if (!Number.isFinite(duration) || duration <= 0 || duration > 240) {
      return NextResponse.json(
        { error: "duracionMinutos debe estar entre 1 y 240." },
        { status: 400 }
      )
    }

    const result = await createAppointment({
      nombre: String(nombre),
      correo: String(correo),
      fecha: String(fecha),
      hora: String(hora),
      duracionMinutos: duration,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error?.code === "SLOT_TAKEN") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error("appointments error", error)
    return NextResponse.json({ error: "No fue posible crear la cita." }, { status: 500 })
  }
}
