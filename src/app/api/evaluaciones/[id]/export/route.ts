import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

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

    const rows = [
      ["Evaluado", evaluacion.evaluadoNombre],
      ["Evaluador", evaluacion.evaluador.name],
      ["Nivel", tipoLabel[evaluacion.tipo] || evaluacion.tipo],
      ["Periodo", evaluacion.periodo],
      ["Fecha", new Date(evaluacion.createdAt).toLocaleDateString("es-CO")],
      [],
      ["Competencia", "Tipo", "Puntuación"],
    ]

    for (const r of evaluacion.respuestas) {
      rows.push([r.competencia.nombre, r.competencia.tipo, String(r.puntuacion)])
    }

    rows.push([])
    rows.push(["Nota Final", "", String(evaluacion.notaFinal ? Number(evaluacion.notaFinal).toFixed(1) : "—")])

    const colLetters = ["A", "B", "C"]
    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane yOffset="1" xSplit="0" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="3" width="15" customWidth="1"/></cols>
<sheetData>`

    for (let r = 0; r < rows.length; r++) {
      const rowNum = r + 1
      sheetXml += `<row r="${rowNum}">`
      for (let c = 0; c < rows[r].length; c++) {
        const cell = colLetters[c] + rowNum
        const value = rows[r][c]
        sheetXml += `<c r="${cell}" t="inlineStr"><is><t xml:space="preserve">${escXml(value)}</t></is></c>`
      }
      sheetXml += "</row>"
    }

    sheetXml += "</sheetData></worksheet>"

    const zip = new JSZip()
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`)
    zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
    zip.folder("xl")!.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Evaluación" sheetId="1" r:id="rId1"/></sheets></workbook>`)
    zip.folder("xl")!.folder("_rels")!.file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)
    zip.folder("xl")!.folder("worksheets")!.file("sheet1.xml", sheetXml)
    zip.file("xl/sharedStrings.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0" uniqueCount="0"/>`)
    zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`)

    const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" })
    const fileName = `Evaluacion_${evaluacion.evaluadoNombre.replace(/\s+/g, "_")}_${evaluacion.periodo}.xlsx`

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
