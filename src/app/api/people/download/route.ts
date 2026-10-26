import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { head } from "@vercel/blob";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename requerido" }, { status: 400 });
    }

    // Verificar que el archivo existe
    const blob = await head(filename);

    if (!blob) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // La downloadUrl ya incluye un token firmado temporal, no necesita headers adicionales
    const response = await fetch(blob.downloadUrl);

    if (!response.ok) {
      throw new Error(`Error descargando: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error descargando archivo:", error);
    return NextResponse.json({ error: "Error al descargar" }, { status: 500 });
  }
}
