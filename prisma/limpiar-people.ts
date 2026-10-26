import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const antesSol = await prisma.peopleSolicitud.count();
  const antesCampos = await prisma.peopleSolicitudCampo.count();
  console.log(`Antes: ${antesSol} solicitudes, ${antesCampos} campos`);

  // Borrar campos primero por seguridad, luego solicitudes
  await prisma.peopleSolicitudCampo.deleteMany({});
  const borradas = await prisma.peopleSolicitud.deleteMany({});

  const despuesSol = await prisma.peopleSolicitud.count();
  const despuesCampos = await prisma.peopleSolicitudCampo.count();
  console.log(`Borradas: ${borradas.count} solicitudes`);
  console.log(`Después: ${despuesSol} solicitudes, ${despuesCampos} campos`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
