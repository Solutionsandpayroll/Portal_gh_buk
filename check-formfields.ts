import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.formField.count();
  console.log('Campos de formulario definidos (form_fields):', total);
  const porBeneficio = await prisma.formField.groupBy({ by: ['beneficioId'], _count: { id: true } });
  console.table(porBeneficio.map(x => ({ beneficio: x.beneficioId, campos: x._count.id })));
}
main().finally(() => prisma.$disconnect());
