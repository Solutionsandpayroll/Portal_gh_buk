import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      categoria,
      beneficioId,
      beneficioLabel,
      nombre,
      observaciones,
      correoContacto,
      duracionMinutos,
      fechas,
      fechaCita,
      horaSesion,
      eventId,
      teamsMeetingUrl,
      adjuntoUrl,
      adjuntoName,
      usuarioId,
      campos,
    } = body;

    if (!categoria || !beneficioId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const solicitud = await prisma.peopleSolicitud.create({
      data: {
        categoria,
        beneficioId,
        beneficioLabel,
        nombre: nombre || null,
        observaciones: observaciones || null,
        correoContacto: correoContacto || null,
        duracionMinutos: duracionMinutos || null,
        fechas: fechas || [],
        fechaCita: fechaCita || null,
        horaSesion: horaSesion || null,
        eventId: eventId || null,
        teamsMeetingUrl: teamsMeetingUrl || null,
        adjuntoUrl: adjuntoUrl || null,
        adjuntoName: adjuntoName || null,
        usuarioId: usuarioId || session?.user?.id || null,
        estado: "pendiente",
        campos: {
          create: (campos || []).map((c: { nombre: string; valor: string }) => ({
            nombre: c.nombre,
            valor: c.valor,
          })),
        },
      },
    });

    return NextResponse.json(solicitud, { status: 201 });
  } catch (error: any) {
    console.error("people solicitud POST error:", error);
    return NextResponse.json({ error: error?.message || "Error al guardar" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const beneficioId = searchParams.get("beneficioId");

    const where: any = {};
    if (categoria) where.categoria = categoria;
    if (beneficioId) where.beneficioId = beneficioId;

    const solicitudes = await prisma.peopleSolicitud.findMany({
      where,
      include: { campos: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(solicitudes);
  } catch (error: any) {
    console.error("people solicitud GET error:", error);
    return NextResponse.json({ error: error?.message || "Error al consultar" }, { status: 500 });
  }
}
