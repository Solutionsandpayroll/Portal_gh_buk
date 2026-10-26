import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id },
      include: {
        evaluador: { select: { name: true } },
        respuestas: {
          include: {
            competencia: { select: { id: true, tipo: true, nombre: true } },
          },
        },
      },
    })

    if (!evaluacion) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
    }

    const tipoLabel: Record<string, string> = {
      estrategico: "Estratégico",
      tactico: "Táctico",
      operativo: "Operativo",
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Portal Gestión Humana"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Evaluación")

    // Encabezados
    const headers = [
      { key: "label", header: "Campo", width: 25 },
      { key: "value", header: "Valor", width: 40 },
    ]
    sheet.columns = headers

    // Datos generales
    const dataRows = [
      { label: "Evaluado", value: evaluacion.evaluadoNombre },
      { label: "Evaluador", value: evaluacion.evaluador.name },
      { label: "Nivel", value: tipoLabel[evaluacion.tipo] || evaluacion.tipo },
      { label: "Periodo", value: evaluacion.periodo },
      { label: "Fecha", value: new Date(evaluacion.createdAt).toLocaleDateString("es-CO") },
    ]

    dataRows.forEach((row) => {
      const r = sheet.addRow(row)
      r.font = { bold: true }
    })

    // Separador
    sheet.addRow({ label: "", value: "" })

    // Encabezados competencias
    sheet.addRow({ label: "Competencia", value: "" }).font = { bold: true }

    const compHeader = sheet.addRow({ label: "Nombre", value: "Tipo", puntuacion: "Puntuación" })
    compHeader.font = { bold: true }
    compHeader.alignment = { horizontal: "left" }

    sheet.columns = [
      { key: "label", header: "Campo", width: 25 },
      { key: "value", header: "Valor", width: 20 },
      { key: "puntuacion", header: "", width: 15 },
    ]

    for (const r of evaluacion.respuestas) {
      sheet.addRow({ label: r.competencia.nombre, value: r.competencia.tipo, puntuacion: r.puntuacion })
    }

    // Separador
    sheet.addRow({ label: "", value: "", puntuacion: "" })

    // Calcular Desempeño del Cargo
    let desempenoCargo: number | null = null
    if (evaluacion.calidad !== null && evaluacion.cantidadProductividad !== null && evaluacion.tiempoOportunidad !== null) {
      desempenoCargo = (evaluacion.calidad + evaluacion.cantidadProductividad + evaluacion.tiempoOportunidad) / 3
    }

    // Calcular Competencias (promedio ponderado transversal + nivel)
    const PESOS: Record<string, { transversal: number; nivel: number }> = {
      operativo: { transversal: 0.4, nivel: 0.6 },
      tactico: { transversal: 0.4, nivel: 0.6 },
      estrategico: { transversal: 0.3, nivel: 0.7 },
    }
    const nivelesUnicos = [...new Set(evaluacion.respuestas.map(r => r.nivel).filter(n => n !== 'potencial' && n !== ''))]
    const nivel = nivelesUnicos[0] || ''
    const peso = PESOS[nivel] || { transversal: 0.4, nivel: 0.6 }

    const transv = evaluacion.respuestas.filter(r => r.competencia.tipo === 'transversal')
    const niv = evaluacion.respuestas.filter(r => r.competencia.tipo === nivel)
    const promTrans = transv.length > 0 ? transv.reduce((s, r) => s + r.puntuacion, 0) / transv.length : 0
    const promNiv = niv.length > 0 ? niv.reduce((s, r) => s + r.puntuacion, 0) / niv.length : 0
    const notaCompetencias = (promTrans * peso.transversal) + (promNiv * peso.nivel)

    // Métricas adicionales
    if (desempenoCargo !== null) {
      const row = sheet.addRow({ label: "Desempeño del Cargo", value: "", puntuacion: desempenoCargo.toFixed(2) })
      row.font = { bold: true }
    }

    if (notaCompetencias > 0) {
      const row = sheet.addRow({ label: "Competencias", value: "", puntuacion: notaCompetencias.toFixed(2) })
      row.font = { bold: true }
    }

    if (evaluacion.notaPotencial !== null && Number(evaluacion.notaPotencial) > 0) {
      const row = sheet.addRow({ label: "Nota Potencial", value: "", puntuacion: Number(evaluacion.notaPotencial).toFixed(2) })
      row.font = { bold: true }
    }

    // Nota final
    const notaRow = sheet.addRow({
      label: "Nota Final",
      value: "",
      puntuacion: evaluacion.notaFinal ? Number(evaluacion.notaFinal).toFixed(1) : "—",
    })
    notaRow.font = { bold: true, size: 14 }
    notaRow.alignment = { horizontal: "left" }

    // Estilos
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { ...cell.alignment, vertical: "middle" }
      })
    })

    // Guardar
    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `Evaluacion_${evaluacion.evaluadoNombre.replace(/\s+/g, "_")}_${evaluacion.periodo}.xlsx`

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error("export error", error)
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 })
  }
}
