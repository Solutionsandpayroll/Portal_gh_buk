import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const competenciasAEliminar = [
  "CALIDAD DE TRABAJO",
  "CAPACIDAD DE APRENDIZAJE (LEARNING AGILITY)",
  "ADAPTABILIDAD Y MANEJO DE LA INCERTIDUMBRE",
  "CAPACIDAD PARA ASUMIR MAYORES RESPONSABILIDADES",
  "INFLUENCIA Y LIDERAZGO POTENCIAL",
  "PENSAMIENTO ANALÍTICO Y RESOLUCIÓN DE PROBLEMAS",
]

async function main() {
  console.log("Limpiando competencias obsoletas...")

  for (const nombre of competenciasAEliminar) {
    const competencia = await prisma.competencia.findFirst({
      where: { nombre },
    })

    if (competencia) {
      const respuestasCount = await prisma.respuesta.count({
        where: { competenciaId: competencia.id },
      })

      if (respuestasCount > 0) {
        console.log(`⚠️  "${nombre}" tiene ${respuestasCount} respuestas asociadas. Eliminando respuestas primero...`)
        await prisma.respuesta.deleteMany({
          where: { competenciaId: competencia.id },
        })
      }

      await prisma.competencia.delete({
        where: { id: competencia.id },
      })
      console.log(`✅ Eliminada: "${nombre}"`)
    } else {
      console.log(`⏭️  "${nombre}" no existe, saltando...`)
    }
  }

  const count = await prisma.competencia.count()
  console.log(`\nCompetencias restantes: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
