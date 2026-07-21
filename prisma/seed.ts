import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const competencias = [
  { tipo: "transversal", nombre: "ACTÚA CON INTEGRIDAD" },
  { tipo: "transversal", nombre: "CALIDAD DE TRABAJO" },
  { tipo: "transversal", nombre: "ORIENTACIÓN AL CLIENTE" },
  { tipo: "transversal", nombre: "ADAPTACIÓN AL CAMBIO" },
  { tipo: "estrategico", nombre: "DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO" },
  { tipo: "estrategico", nombre: "PENSAMIENTO ESTRATÉGICO" },
  { tipo: "tactico", nombre: "LIDERAZGO" },
  { tipo: "tactico", nombre: "PENSAMIENTO ANALÍTICO" },
  { tipo: "operativo", nombre: "ORIENTACIÓN AL LOGRO" },
  { tipo: "operativo", nombre: "CAPACIDAD DE APRENDIZAJE" },
  { tipo: "operativo", nombre: "TRABAJO COLABORATIVO" },
  { tipo: "potencial", nombre: "CAPACIDAD DE APRENDIZAJE (LEARNING AGILITY)" },
  { tipo: "potencial", nombre: "ADAPTABILIDAD Y MANEJO DE LA INCERTIDUMBRE" },
  { tipo: "potencial", nombre: "CAPACIDAD PARA ASUMIR MAYORES RESPONSABILIDADES" },
  { tipo: "potencial", nombre: "INFLUENCIA Y LIDERAZGO POTENCIAL" },
  { tipo: "potencial", nombre: "PENSAMIENTO ANALÍTICO Y RESOLUCIÓN DE PROBLEMAS" },
]

async function main() {
  console.log("Sembrando competencias...")

  for (const comp of competencias) {
    await prisma.competencia.upsert({
      where: { id: `${comp.tipo}-${comp.nombre.replace(/\s+/g, "-").toLowerCase()}` },
      update: { tipo: comp.tipo, nombre: comp.nombre },
      create: {
        id: `${comp.tipo}-${comp.nombre.replace(/\s+/g, "-").toLowerCase()}`,
        tipo: comp.tipo,
        nombre: comp.nombre,
      },
    })
  }

  const count = await prisma.competencia.count()
  console.log(`Competencias sembradas: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
