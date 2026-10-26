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
  { tipo: "transversal", nombre: "ORIENTACIÓN AL CLIENTE" },
  { tipo: "transversal", nombre: "ADAPTACIÓN AL CAMBIO" },
  { tipo: "estrategico", nombre: "DESARROLLO DE EQUIPOS DE ALTO DESEMPEÑO" },
  { tipo: "estrategico", nombre: "PENSAMIENTO ESTRATÉGICO" },
  { tipo: "tactico", nombre: "LIDERAZGO" },
  { tipo: "tactico", nombre: "PENSAMIENTO ANALÍTICO" },
  { tipo: "operativo", nombre: "ORIENTACIÓN AL LOGRO" },
  { tipo: "operativo", nombre: "CAPACIDAD DE APRENDIZAJE" },
  { tipo: "operativo", nombre: "TRABAJO COLABORATIVO" },
  { tipo: "potencial", nombre: "AGILIDAD DE APRENDIZAJE" },
  { tipo: "potencial", nombre: "GESTIÓN DE LA COMPLEJIDAD Y ADAPTACIÓN" },
  { tipo: "potencial", nombre: "CAPACIDAD PARA ASUMIR MAYOR RESPONSABILIDAD" },
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
