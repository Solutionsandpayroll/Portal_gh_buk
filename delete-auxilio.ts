import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.peopleSolicitud.deleteMany({
    where: { beneficioId: 'auxilio_educativo' }
  });
  console.log(`Eliminadas: ${result.count} solicitudes de Auxilio Educativo`);
}

main().finally(() => prisma.$disconnect());
