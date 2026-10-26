import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"
import { createCanvas } from "canvas"

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Función para generar gráfica de Matriz Nine Box
function generarMatrizNineBox(datos: { nombre: string; desempeno: number; potencial: number }[]): Buffer {
  const canvas = createCanvas(500, 500)
  const ctx = canvas.getContext("2d")

  // Fondo
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 500, 500)

  // Título
  ctx.fillStyle = "#1e293b"
  ctx.font = "bold 18px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Matriz Nine Box - Distribución de Talento", 250, 25)

  // Área de la matriz
  const startX = 80
  const startY = 60
  const cellSize = 120

  // Dibujar cuadrícula
  ctx.strokeStyle = "#cbd5e1"
  ctx.lineWidth = 2
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(startX + i * cellSize, startY)
    ctx.lineTo(startX + i * cellSize, startY + 3 * cellSize)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(startX, startY + i * cellSize)
    ctx.lineTo(startX + 3 * cellSize, startY + i * cellSize)
    ctx.stroke()
  }

  // Etiquetas eje X
  ctx.fillStyle = "#64748b"
  ctx.font = "12px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Bajo", startX + cellSize * 0.5, startY + 3 * cellSize + 20)
  ctx.fillText("Medio", startX + cellSize * 1.5, startY + 3 * cellSize + 20)
  ctx.fillText("Alto", startX + cellSize * 2.5, startY + 3 * cellSize + 20)
  ctx.fillStyle = "#334155"
  ctx.font = "bold 14px Arial"
  ctx.fillText("Desempeño →", startX + 1.5 * cellSize, startY + 3 * cellSize + 45)

  // Etiquetas eje Y
  ctx.fillStyle = "#64748b"
  ctx.font = "12px Arial"
  ctx.textAlign = "right"
  ctx.fillText("Alto", startX - 10, startY + cellSize * 0.5 + 5)
  ctx.fillText("Medio", startX - 10, startY + cellSize * 1.5 + 5)
  ctx.fillText("Bajo", startX - 10, startY + cellSize * 2.5 + 5)
  ctx.save()
  ctx.translate(25, startY + 1.5 * cellSize)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = "#334155"
  ctx.font = "bold 14px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Potencial →", 0, 0)
  ctx.restore()

  // Dibujar puntos
  const clasificar = (nota: number) => (nota >= 4 ? "Alto" : nota >= 3 ? "Medio" : "Bajo")

  datos.forEach((colab, idx) => {
    const posDesempeno = clasificar(colab.desempeno)
    const posPotencial = clasificar(colab.potencial)

    const baseX = posDesempeno === "Bajo" ? 0.5 : posDesempeno === "Medio" ? 1.5 : 2.5
    const baseY = posPotencial === "Alto" ? 0.5 : posPotencial === "Medio" ? 1.5 : 2.5

    // Jitter
    const jitterX = Math.sin(idx * 7.3) * 0.3 + Math.cos(idx * 3.1) * 0.1
    const jitterY = Math.cos(idx * 5.7) * 0.3 + Math.sin(idx * 2.3) * 0.1

    const x = startX + (baseX + jitterX) * cellSize
    const y = startY + (baseY + jitterY) * cellSize

    const color =
      posPotencial === "Alto" && posDesempeno === "Alto"
        ? "#10b981"
        : posPotencial === "Bajo" && posDesempeno === "Bajo"
        ? "#ef4444"
        : "#f59e0b"

    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.75
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  return canvas.toBuffer("image/png")
}

// Función para generar gráfica de Distribución Nine Box (Pie Chart)
function generarDistribucionNineBox(datos: { nombre: string; desempeno: number; potencial: number }[]): Buffer {
  const canvas = createCanvas(700, 600)
  const ctx = canvas.getContext("2d")

  // Fondo
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 700, 600)

  // Título
  ctx.fillStyle = "#1e293b"
  ctx.font = "bold 20px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Distribución Nine Box", 350, 30)

  // Contar categorías
  const categorias: Record<string, number> = {}
  const clasificar = (nota: number) => (nota >= 4 ? "Alto" : nota >= 3 ? "Medio" : "Bajo")

  datos.forEach((colab) => {
    const cat = `${clasificar(colab.potencial)} Potencial / ${clasificar(colab.desempeno)} Desempeño`
    categorias[cat] = (categorias[cat] || 0) + 1
  })

  const total = datos.length
  const colores = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#ef4444"]

  // Dibujar pie chart (más pequeño y centrado a la izquierda)
  const centerX = 200
  const centerY = 320
  const radius = 130
  let startAngle = -Math.PI / 2

  Object.entries(categorias).forEach(([categoria, cantidad], idx) => {
    const angle = (cantidad / total) * 2 * Math.PI
    const endAngle = startAngle + angle

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = colores[idx % colores.length]
    ctx.globalAlpha = 0.8
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.globalAlpha = 1

    startAngle = endAngle
  })

  // Leyenda (lado derecho, con más espacio)
  ctx.font = "12px Arial"
  ctx.textAlign = "left"
  let legendY = 80

  Object.entries(categorias).forEach(([categoria, cantidad], idx) => {
    const porcentaje = ((cantidad / total) * 100).toFixed(1)

    ctx.fillStyle = colores[idx % colores.length]
    ctx.fillRect(400, legendY, 15, 15)

    ctx.fillStyle = "#334155"
    ctx.font = "12px Arial"
    ctx.fillText(`${categoria}`, 425, legendY + 12)
    ctx.fillText(`${cantidad} (${porcentaje}%)`, 425, legendY + 28)

    legendY += 50
  })

  return canvas.toBuffer("image/png")
}

// Función para generar gráfica de Evolución Temporal
function generarEvolucionTemporal(periodos: string[], promedios: number[]): Buffer {
  const canvas = createCanvas(500, 350)
  const ctx = canvas.getContext("2d")

  // Fondo
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 500, 350)

  // Título
  ctx.fillStyle = "#1e293b"
  ctx.font = "bold 18px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Evolución Temporal - Promedio General", 250, 25)

  // Área del gráfico
  const startX = 60
  const startY = 50
  const width = 400
  const height = 240

  // Ejes
  ctx.strokeStyle = "#cbd5e1"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(startX, startY + height)
  ctx.lineTo(startX + width, startY + height)
  ctx.stroke()

  // Líneas de referencia
  ctx.strokeStyle = "#e2e8f0"
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  for (let i = 0; i <= 5; i++) {
    const y = startY + height - (i / 5) * height
    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.lineTo(startX + width, y)
    ctx.stroke()

    ctx.fillStyle = "#94a3b8"
    ctx.font = "10px Arial"
    ctx.textAlign = "right"
    ctx.fillText(i.toString(), startX - 10, y + 3)
  }

  ctx.setLineDash([])

  // Dibujar línea de evolución
  if (promedios.length > 0) {
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 3
    ctx.beginPath()

    promedios.forEach((promedio, idx) => {
      const x = startX + (idx / Math.max(promedios.length - 1, 1)) * width
      const y = startY + height - (promedio / 5) * height

      if (idx === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Dibujar puntos
    promedios.forEach((promedio, idx) => {
      const x = startX + (idx / Math.max(promedios.length - 1, 1)) * width
      const y = startY + height - (promedio / 5) * height

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "#3b82f6"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Etiquetas de periodo
      ctx.fillStyle = "#64748b"
      ctx.font = "11px Arial"
      ctx.textAlign = "center"
      ctx.fillText(periodos[idx], x, startY + height + 18)

      // Valores
      ctx.fillStyle = "#334155"
      ctx.font = "bold 10px Arial"
      ctx.fillText(promedio.toFixed(1), x, y - 12)
    })
  }

  return canvas.toBuffer("image/png")
}

export async function GET(request: Request) {
  const session = await auth()
  const rol = (session?.user as any)?.rol
  if (rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "descendente"
    const periodo = searchParams.get("periodo") || ""

    const where: any = { tipo }
    if (periodo) {
      where.periodo = periodo
    }

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      include: {
        evaluador: { select: { name: true } },
        respuestas: {
          include: {
            competencia: { select: { id: true, nombre: true, tipo: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Obtener todas las competencias de la base de datos
    const todasCompetencias = await prisma.competencia.findMany()
    
    // Organizar competencias por tipo
    const transversales = todasCompetencias.filter(c => c.tipo === 'transversal')
    const operativas = todasCompetencias.filter(c => c.tipo === 'operativo')
    const tacticas = todasCompetencias.filter(c => c.tipo === 'tactico')
    const estrategicas = todasCompetencias.filter(c => c.tipo === 'estrategico')
    const potencial = todasCompetencias.filter(c => c.tipo === 'potencial')

    const tipoLabel = tipo === "descendente" ? "Descendente" : "Ascendente"
    const periodoLabel = periodo || "Todos"

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Portal Gestión Humana"
    workbook.created = new Date()

    // Hoja 1: Tabla de datos
    const worksheet = workbook.addWorksheet("Resultados")

    if (tipo === "descendente") {
      // Construir columnas en el orden correcto
      const allColumns = [
        { header: "Evaluado", key: "evaluado", width: 30 },
        { header: "Evaluador", key: "evaluador", width: 25 },
        { header: "Cargo", key: "cargo", width: 15 },
        { header: "Periodo", key: "periodo", width: 12 },
        { header: "Fecha", key: "fecha", width: 12 },
        // Desempeño del Cargo
        { header: "Calidad", key: "calidad", width: 12 },
        { header: "Cantidad/Productividad", key: "cantidad", width: 18 },
        { header: "Tiempo/Oportunidad", key: "tiempo", width: 18 },
        { header: "Promedio Desempeño Cargo", key: "promDesempeno", width: 20 },
        // Competencias Transversales
        ...transversales.map(c => ({ header: c.nombre, key: `trans_${c.id}`, width: 20 })),
        // Competencias Operativas
        ...operativas.map(c => ({ header: c.nombre, key: `op_${c.id}`, width: 20 })),
        // Competencias Tácticas
        ...tacticas.map(c => ({ header: c.nombre, key: `tac_${c.id}`, width: 20 })),
        // Competencias Estratégicas
        ...estrategicas.map(c => ({ header: c.nombre, key: `est_${c.id}`, width: 20 })),
        // Resultado Global
        { header: "Resultado Global", key: "resultadoGlobal", width: 18 },
        // Competencias de Potencial
        ...potencial.map(c => ({ header: c.nombre, key: `pot_${c.id}`, width: 20 })),
        // Nota Potencial y Nine Box
        { header: "Nota Potencial", key: "potencial", width: 15 },
        { header: "Nine Box", key: "ninebox", width: 25 },
      ]

      worksheet.columns = allColumns

      // Agregar filas de datos
      evaluaciones.forEach((ev) => {
        // Calcular promedios
        const respuestasCompetencias = ev.respuestas.filter(r => r.competencia.tipo !== 'potencial')
        const promCompetencias = respuestasCompetencias.length > 0
          ? respuestasCompetencias.reduce((sum, r) => sum + r.puntuacion, 0) / respuestasCompetencias.length
          : null

        // Calcular promedio desempeño cargo
        let promDesempeno = null
        if (ev.calidad !== null && ev.cantidadProductividad !== null && ev.tiempoOportunidad !== null) {
          promDesempeno = (ev.calidad + ev.cantidadProductividad + ev.tiempoOportunidad) / 3
        }

        // Calcular resultado global
        let resultadoGlobal = null
        if (promDesempeno !== null && promCompetencias !== null) {
          resultadoGlobal = (promDesempeno * 0.6) + (promCompetencias * 0.4)
        }

        const rowData: any = {
          evaluado: ev.evaluadoNombre,
          evaluador: ev.evaluador.name,
          cargo: ev.cargo || "—",
          periodo: ev.periodo,
          fecha: new Date(ev.createdAt).toLocaleDateString("es-CO"),
          calidad: ev.calidad ?? "—",
          cantidad: ev.cantidadProductividad ?? "—",
          tiempo: ev.tiempoOportunidad ?? "—",
          promDesempeno: promDesempeno !== null ? promDesempeno.toFixed(1) : "—",
          resultadoGlobal: resultadoGlobal !== null ? resultadoGlobal.toFixed(1) : (ev.notaFinal ? Number(ev.notaFinal).toFixed(1) : "—"),
          potencial: ev.notaPotencial ? Number(ev.notaPotencial).toFixed(1) : "—",
          ninebox: ev.categoriaNineBox || "—",
        }

        // Inicializar todas las competencias con "-"
        transversales.forEach(c => { rowData[`trans_${c.id}`] = "-" })
        operativas.forEach(c => { rowData[`op_${c.id}`] = "-" })
        tacticas.forEach(c => { rowData[`tac_${c.id}`] = "-" })
        estrategicas.forEach(c => { rowData[`est_${c.id}`] = "-" })
        potencial.forEach(c => { rowData[`pot_${c.id}`] = "-" })

        // Agregar puntuaciones de competencias evaluadas
        ev.respuestas.forEach(r => {
          const tipo = r.competencia.tipo
          if (tipo === 'transversal') {
            rowData[`trans_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'operativo') {
            rowData[`op_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'tactico') {
            rowData[`tac_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'estrategico') {
            rowData[`est_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'potencial') {
            rowData[`pot_${r.competencia.id}`] = r.puntuacion
          }
        })

        worksheet.addRow(rowData)
      })
    } else {
      // Construir columnas para ascendente
      const allColumns = [
        { header: "Evaluado", key: "evaluado", width: 30 },
        { header: "Evaluador", key: "evaluador", width: 25 },
        { header: "Cargo", key: "cargo", width: 15 },
        { header: "Periodo", key: "periodo", width: 12 },
        { header: "Fecha", key: "fecha", width: 12 },
        // Competencias Transversales
        ...transversales.map(c => ({ header: c.nombre, key: `trans_${c.id}`, width: 20 })),
        // Competencias Operativas
        ...operativas.map(c => ({ header: c.nombre, key: `op_${c.id}`, width: 20 })),
        // Competencias Tácticas
        ...tacticas.map(c => ({ header: c.nombre, key: `tac_${c.id}`, width: 20 })),
        // Competencias Estratégicas
        ...estrategicas.map(c => ({ header: c.nombre, key: `est_${c.id}`, width: 20 })),
      ]

      worksheet.columns = allColumns

      // Agregar filas de datos
      evaluaciones.forEach((ev) => {
        const rowData: any = {
          evaluado: ev.evaluadoNombre,
          evaluador: ev.evaluador.name,
          cargo: ev.cargo || "—",
          periodo: ev.periodo,
          fecha: new Date(ev.createdAt).toLocaleDateString("es-CO"),
        }

        // Inicializar todas las competencias con "-"
        transversales.forEach(c => { rowData[`trans_${c.id}`] = "-" })
        operativas.forEach(c => { rowData[`op_${c.id}`] = "-" })
        tacticas.forEach(c => { rowData[`tac_${c.id}`] = "-" })
        estrategicas.forEach(c => { rowData[`est_${c.id}`] = "-" })

        // Agregar puntuaciones de competencias evaluadas
        ev.respuestas.forEach(r => {
          const tipo = r.competencia.tipo
          if (tipo === 'transversal') {
            rowData[`trans_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'operativo') {
            rowData[`op_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'tactico') {
            rowData[`tac_${r.competencia.id}`] = r.puntuacion
          } else if (tipo === 'estrategico') {
            rowData[`est_${r.competencia.id}`] = r.puntuacion
          }
        })

        worksheet.addRow(rowData)
      })
    }

    // Estilo de encabezado
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    }

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const fileName = `Resultados_${tipoLabel}_${periodoLabel}.xlsx`

    return new NextResponse(buffer, {
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
