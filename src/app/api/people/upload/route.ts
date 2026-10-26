import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    // Validar tipo
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no puede superar 5MB" }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `auxilio_educativo_${session.user.id}_${timestamp}.pdf`;

    // Subir a Vercel Blob Storage
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: `/api/people/download?filename=${encodeURIComponent(filename)}`,
      name: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error subiendo archivo:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
