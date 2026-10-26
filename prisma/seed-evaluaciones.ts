import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const nombresEvaluados = [
  'Carlos Andrés Martínez',
  'María Fernanda López',
  'Juan David Rodríguez',
  'Ana María González',
  'Luis Fernando Pérez',
  'Carmen Rosa Hernández',
  'Pedro José Ramírez',
  'Isabella Cristina Torres',
  'Diego Alejandro Vargas',
  'Sofía Isabel Morales',
  'Andrés Felipe Castro',
  'Valentina Rojas',
  'Santiago Mejía',
  'Laura Camila Díaz',
  'Mateo Restrepo',
  'Daniela Ospina',
  'Nicolás Gómez',
  'Mariana Jiménez',
  'Sebastián Herrera',
  'Paula Andrea Mendoza',
  'Samuel Ríos',
  'Catalina Guerrero',
  'Alejandro Silva',
  'Natalia Vargas',
  'Daniel Esteban Cruz',
  'Gabriela Delgado',
  'Tomás Vélez',
  'Luciana Acosta',
  'Emilio Paredes',
  'Victoria Salazar',
  'Ricardo Montoya',
  'Camila Fuentes',
  'Javier Ortega',
  'Valeria Cárdenas',
  'Martín Espinoza',
  'Renata Medina',
  'Felipe Aguilar',
  'Antonella Reyes',
  'Hugo Cabrera',
  'Emilia Navarro',
  'Ignacio Molina',
  'Romina Suárez',
  'Maximiliano Bravo',
  'Florencia Luna',
  'Benjamín Vega',
  'Agustina Campos',
  'Thiago Rivera',
  'Julieta Flores',
  'Joaquín Peña',
  'Miranda Rojas',
  'Matías Sandoval',
  'Ximena Contreras',
  'Lucas Vidal',
  'Bianca Herrera',
  'Adrián Ponce',
  'Carolina Escobar',
  'Cristian Parada',
  'Andrea Milena Sánchez',
  'Fabio Augusto Martínez',
  'Lina Marcela Rodríguez'
];

const evaluadores = [
  { nombre: 'Cristian Parada', email: 'cristian.parada@solutionspayroll.com' },
  { nombre: 'Andrea Sánchez', email: 'andrea.sanchez@solutionspayroll.com' },
  { nombre: 'Fabio Martínez', email: 'fabio.martinez@solutionspayroll.com' },
  { nombre: 'Lina Rodríguez', email: 'lina.rodriguez@solutionspayroll.com' }
];

const periodos = ['2024', '2025', '2026'];

function generarNota(): number {
  // Distribución: 10% muy bajas (1-2), 20% bajas (2-3), 40% medias (3-4), 25% altas (4-4.5), 5% sobresalientes (4.5-5)
  const random = Math.random();
  if (random < 0.10) return Math.floor(1 + Math.random());
  if (random < 0.30) return Math.floor(2 + Math.random());
  if (random < 0.70) return Math.floor(3 + Math.random());
  if (random < 0.95) return Math.floor(4 + Math.random() * 0.5);
  return 5;
}

function calcularNineBox(desempeno: number, potencial: number): string {
  const clasificar = (nota: number) => nota >= 4 ? 'Alto' : nota >= 3 ? 'Medio' : 'Bajo';
  const dep = clasificar(desempeno);
  const pot = clasificar(potencial);
  return `${pot} Potencial / ${dep} Desempeño`;
}

async function main() {
  console.log('🌱 Generando 60 evaluaciones de prueba...\n');

  // Asegurar que existan los evaluadores
  for (const ev of evaluadores) {
    await prisma.user.upsert({
      where: { entraidSub: ev.email },
      update: {},
      create: {
        entraidSub: ev.email,
        email: ev.email,
        name: ev.nombre,
        rol: 'admin'
      }
    });
  }

  const evaluadoresDB = await prisma.user.findMany({
    where: { email: { in: evaluadores.map(e => e.email) } }
  });

  let evaluacionesCreadas = 0;

  for (let i = 0; i < 60; i++) {
    const evaluadoNombre = nombresEvaluados[i % nombresEvaluados.length];
    const evaluador = evaluadoresDB[i % evaluadoresDB.length];
    const periodo = periodos[i % periodos.length];
    
    // Generar notas
    const calidad = generarNota();
    const cantidadProductividad = generarNota();
    const tiempoOportunidad = generarNota();
    
    const notaDesempenoCargo = (calidad + cantidadProductividad + tiempoOportunidad) / 3;
    const notaCompetencias = generarNota();
    const notaFinal = (notaDesempenoCargo * 0.6) + (notaCompetencias * 0.4);
    const notaPotencial = generarNota();
    const categoriaNineBox = calcularNineBox(notaFinal, notaPotencial);

    await prisma.evaluacion.create({
      data: {
        tipo: 'descendente',
        evaluadoNombre,
        evaluadorId: evaluador.id,
        periodo,
        calidad,
        cantidadProductividad,
        tiempoOportunidad,
        notaFinal,
        notaPotencial,
        categoriaNineBox,
        feedback: 'Evaluación de prueba generada automáticamente para testing de gráficas.'
      }
    });

    evaluacionesCreadas++;
    
    if ((i + 1) % 10 === 0) {
      console.log(`✓ ${evaluacionesCreadas} evaluaciones creadas...`);
    }
  }

  console.log(`\n✅ Total: ${evaluacionesCreadas} evaluaciones descendentes creadas`);
  console.log(`📊 Periodos: ${periodos.join(', ')}`);
  console.log(`👥 Evaluadores: ${evaluadores.map(e => e.nombre).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
