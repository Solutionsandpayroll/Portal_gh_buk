# Portal de Gestión Humana — Solutions & Payroll

Portal web interno para la gestión de procesos de Recursos Humanos. Centraliza formularios, evaluaciones de desempeño, beneficios PEOPLE y seguimiento del talento.

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Next.js (App Router) | 16 |
| React | 19 |
| TypeScript | 5 |
| Auth.js (NextAuth v5) | 5 |
| Prisma | 7 |
| NEON (PostgreSQL serverless) | — |
| Microsoft Entra ID (Azure AD) | OAuth 2.0 |
| Microsoft Graph API | v1.0 |
| Power Automate | HTTP triggers |
| JSZip | 3 |
| Tailwind CSS | 4 |

## Requisitos previos

- Node.js 22+
- Cuenta en [NEON](https://neon.tech) para la base de datos
- App Registration en Microsoft Entra ID (Azure Portal)
- Flows de Power Automate configurados

## Variables de entorno

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
# Base de datos NEON
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Auth.js (NextAuth v5)
# Generar con: npx auth secret
AUTH_SECRET=<clave-secreta-aleatoria>

# Microsoft Entra ID (Azure AD) — Login corporativo
AUTH_MICROSOFT_ENTRA_ID_ID=<application-client-id>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<client-secret>
AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0

# Power Automate — URLs de los flows
NEXT_PUBLIC_PA_REQUISICION_URL=<url-flow-requisicion>
NEXT_PUBLIC_PA_DESEMPENO_ESTRATEGICO_URL=<url-flow-desempeno>
NEXT_PUBLIC_PA_PEOPLE_URL=<url-flow-people>

# Microsoft Graph API — Calendario y Teams
TENANT_ID=<tenant-id>
CLIENT_ID=<application-client-id>
CLIENT_SECRET=<client-secret>
ENCARGADO_EMAIL=<email-encargado-people-cuidado>
```

### Descripción de cada variable

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | String de conexión a NEON (PostgreSQL). Formato: `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | Clave para firmar cookies de sesión. Generar con `npx auth secret` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | ID de la aplicación registrada en Azure (mismo que `CLIENT_ID`) |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Secreto de la aplicación en Azure (mismo que `CLIENT_SECRET`) |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | URL del tenant de Entra. Sin barra final |
| `NEXT_PUBLIC_PA_REQUISICION_URL` | URL del flow de Power Automate para requisiciones de personal |
| `NEXT_PUBLIC_PA_DESEMPENO_ESTRATEGICO_URL` | URL del flow para los 3 formularios de desempeño (Estratégico/Táctico/Operativo) |
| `NEXT_PUBLIC_PA_PEOPLE_URL` | URL del flow para el formulario de beneficios PEOPLE |
| `TENANT_ID` | ID del tenant de Microsoft Entra |
| `CLIENT_ID` | ID de la aplicación (client credentials para MS Graph) |
| `CLIENT_SECRET` | Secreto de la aplicación (client credentials para MS Graph) |
| `ENCARGADO_EMAIL` | Correo del encargado de People Cuidado (para agendar reuniones en Teams) |

## Instalación y primer uso

```bash
# Instalar dependencias
npm install

# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas en NEON
npm run db:push

# Sembrar las competencias (16 competencias de desempeño y potencial)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

### Configurar usuario admin

Para acceder al panel de resultados (admin), actualizar el rol en la tabla `users` de NEON:

```sql
UPDATE users SET rol = 'admin' WHERE email = 'tu-correo@empresa.com';
```

Luego cerrar sesión y volver a iniciar para que el token refleje el nuevo rol.

## Rutas de la aplicación

### Páginas públicas

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión con cuenta corporativa Microsoft Entra |

### Páginas protegidas

| Ruta | Descripción |
|---|---|
| `/` | Dashboard principal con acceso a todos los módulos |
| `/formulario-requisicion` | Form. 01 — Requisición de personal. Envía a Power Automate |
| `/formulario-desempeno/estrategico` | Form. 02 — Evaluación de desempeño nivel estratégico. Genera Excel y envía a Power Automate |
| `/formulario-desempeno/tactico` | Form. 02 — Evaluación nivel táctico |
| `/formulario-desempeno/operativo` | Form. 02 — Evaluación nivel operativo |
| `/formulario-people` | Programa PEOPLE — Selección de beneficios, agendamiento de citas Teams (People Cuidado) |
| `/evaluacion-anual` | **Evaluación Anual 2026** — Wizard de 6 pasos con competencias de desempeño, potencial y Nine Box. Guarda en DB |
| `/mis-evaluaciones` | Historial de evaluaciones realizadas por el usuario autenticado |
| `/evaluacion/[id]` | Detalle de una evaluación con puntuaciones, comportamientos observables y exportación Excel |
| `/resultados` | **Solo admin** — Tabla con todas las evaluaciones del sistema, filtro por año |

### API Routes

| Ruta | Método | Descripción |
|---|---|---|
| `/api/auth/*` | — | Manejo de autenticación (Auth.js) |
| `/api/login` | POST | Login legacy con contraseña compartida (JWT) |
| `/api/availability` | GET | Disponibilidad en calendario Outlook vía MS Graph |
| `/api/appointments` | POST | Crear reunión de Teams vía MS Graph |
| `/api/competencias` | GET | Lista de competencias (filtro opcional `?tipo=`) |
| `/api/usuarios` | GET | Lista de usuarios registrados en DB |
| `/api/evaluaciones` | GET | Evaluaciones del usuario autenticado |
| `/api/evaluaciones/[id]` | GET | Detalle de una evaluación |
| `/api/evaluaciones/[id]/export` | GET | Exportar evaluación a Excel |
| `/api/admin/evaluaciones` | GET | **Solo admin** — Todas las evaluaciones |

## Evaluación Anual 2026

El formulario de evaluación anual es un wizard de 6 pasos que evalúa todas las competencias del colaborador:

1. **Datos** — Evaluador, persona evaluada, periodo, fecha
2. **Transversales** — 4 competencias (Integridad, Calidad, Cliente, Cambio)
3. **Nivel Operativo** — 3 competencias (Logro, Aprendizaje, Colaboración)
4. **Nivel Táctico** — 2 competencias (Liderazgo, Pensamiento Analítico)
5. **Nivel Estratégico** — 2 competencias (Desarrollo de Equipos, Pensamiento Estratégico)
6. **Potencial** — 5 competencias + Nota Desempeño, Nota Potencial y Nine Box

Cada competencia muestra 5 tarjetas de puntuación con el comportamiento observable correspondiente, según la metodología BARS del documento de diseño.

### Clasificación Nine Box

| Rango Potencial | Categoría |
|---|---|
| 4.0 – 5.0 | Alto Potencial |
| 3.0 – 3.99 | Potencial Medio |
| < 3.0 | Potencial Bajo |

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Iniciar en producción
npm run lint       # Ejecutar ESLint
npm run db:push    # Sincronizar schema de Prisma con NEON
npm run db:seed    # Sembrar competencias en la base de datos
```
