import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n=== Categorias existentes ===");
  const cats = await prisma.peopleSolicitud.groupBy({
    by: ['categoria'],
    _count: { id: true },
  });
  console.log(JSON.stringify(cats, null, 2));

  console.log("\n=== Beneficios por categoria adicionales ===");
  const benefs = await prisma.peopleSolicitud.groupBy({
    by: ['beneficioId', 'beneficioLabel'],
    where: { categoria: 'adicionales' },
    _count: { id: true },
  });
  console.log(JSON.stringify(benefs, null, 2));

  console.log("\n=== Registros auxilio_educativo ===");
  const regs = await prisma.peopleSolicitud.findMany({
    where: { beneficioId: 'auxilio_educativo' },
    select: { id: true, categoria: true, beneficioId: true, beneficioLabel: true, createdAt: true },
  });
  console.log(JSON.stringify(regs, null, 2));
}

main().finally(() => prisma.$disconnect());
