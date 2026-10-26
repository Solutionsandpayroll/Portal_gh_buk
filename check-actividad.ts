import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const regs = await prisma.peopleSolicitud.findMany({
    where: { beneficioId: 'people_valores' },
    include: { campos: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`Total registros: ${regs.length}`);
  regs.forEach((r, i) => {
    console.log(`\n--- Registro ${i + 1} (${r.beneficioLabel}) ---`);
    console.log('Campos:', r.campos.map(c => `${c.nombre}=${c.valor}`).join(', ') || '(ninguno)');
  });
}

main().finally(() => prisma.$disconnect());
