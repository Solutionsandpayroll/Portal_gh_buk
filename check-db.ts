import { PrismaClient } from './src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const result = await prisma.peopleSolicitud.findMany({
    where: { beneficioId: 'auxilio_educativo' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
};

main();
