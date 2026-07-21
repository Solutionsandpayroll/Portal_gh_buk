import { NextResponse } from "next/server"
import { getScheduleForRange } from "@/lib/calendarService"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json({ error: "Query params start y end son obligatorios." }, { status: 400 })
  }

  try {
    const data = await getScheduleForRange(start, end)
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("availability error", error)
    return NextResponse.json({ error: "No fue posible consultar disponibilidad." }, { status: 500 })
  }
}
