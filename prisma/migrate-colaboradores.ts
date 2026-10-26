import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const nombres = [
  "Alba Luz Borja","Alba Suarez","Alejandro Echavarria","Alfonso Fonseca","Ana Maria Gutierrez","Brayan Pardo","Camila Herrera","Carolina Morales","Cristian Parada","Daniela Sandoval","Dayan Manjarres","Dayana Mejia","Deissy Preciado","Diana Mendez","Eduard Forero","Eduardo Castañeda","Erika Letrado","Fabian Morales","German Hincapie","Giovanna Guio","Heliana Ramirez","Ingrid Pineda","Jennifer Cervantes","Jhon Jairo Leon","Johana Arevalo","Juan David Urbina","Julieth Bonilla","Kevin Gonzalez","Lesly Madrid","Lina Chinome","Lina Guio","Lorena Garcia Navarro","Marco Castiblanco","Michael Pertuz","Michelle Sanchez","Nathalie Vaquiro","Nicolas Ballesteros","Oscar Cano","Paola Gonzalez","Paola Velasquez","Patricia Jimenez","Patricia Osorio","Ricardo Arambulo Polo","Rocio Guacaneme","Sandra Bello","Sharon Amaya","Simon Tschannen","Tatiana Chavarro","Tatiana Cumbe","Viviana Achury","Viviana Guzman","Viviana Martinez","William Romero","Yadira Pineda","Yeferson Pineda","Yenny Delgado","Yina Vega","Yuly Peña"
];

async function main() {
  let creados = 0;
  let omitidos = 0;
  for (const nombre of nombres) {
    const existente = await prisma.colaborador.findUnique({ where: { nombre } });
    if (existente) {
      omitidos++;
      continue;
    }
    await prisma.colaborador.create({ data: { nombre } });
    creados++;
  }
  console.log(`Creados: ${creados}, Omitidos (ya existían): ${omitidos}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
