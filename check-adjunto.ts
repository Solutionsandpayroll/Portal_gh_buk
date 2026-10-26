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
    where: { beneficioId: 'auxilio_educativo' },
    select: { id: true, adjuntoUrl: true, adjuntoName: true }
  });
  console.log(JSON.stringify(regs, null, 2));
}

main().finally(() => prisma.$disconnect());
