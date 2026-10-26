const { PrismaClient } = require('./src/generated/prisma/client.ts');
const p = new PrismaClient();
(async () => {
  const r = await p.peopleSolicitud.findMany({
    where: { beneficioId: 'auxilio_educativo' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, beneficioLabel: true, createdAt: true, adjuntoUrl: true, adjuntoName: true }
  });
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
})();
