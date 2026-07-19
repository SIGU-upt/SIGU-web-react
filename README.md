# SIGU — Panel Web React (Panel Administrativo)

Panel administrativo del Sistema de Información para la Gestión Universitaria (SIGU) de la UPT José Félix Ribas, Núcleo Socopó. Consumidor de la API `SIGU-api-nest`: gestión de sedes, PNFs, trayectos, docentes, estudiantes, unidades curriculares, secciones y reportes de auditoría de asistencia.

## Stack

- **React 19** + TypeScript + **Vite 6**
- **React Router 7**
- **Axios** (`src/config/api.ts`) — interceptor JWT + manejo global de `401`
- **React Hook Form** + **Zod** para formularios y validación
- **Radix UI** + **Tailwind CSS 4** (shadcn/ui) para componentes
- **Recharts** para gráficos, **XLSX** para importación/exportación Excel
- **`@tanstack/react-query`** — provider montado en `main.tsx` (adopción incremental por página)

## Quickstart

### 1. Variables de entorno
Copiar `.env` (o crear uno) con:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

Requiere `SIGU-api-nest` corriendo (ver `../SIGU-api-nest/README.md`) para autenticación y datos reales.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite (HMR) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run preview` | Sirve el build de producción localmente |

## Estructura

```
src/
├── components/
│   ├── auth/          # PrivateRoute (gating por rol)
│   ├── dashboard/      # Tarjetas, tablas y modales del dashboard
│   ├── forms/           # Modales de creación/edición/eliminación
│   ├── layout/           # Sidebar, top bar
│   ├── tables/            # Tablas por entidad (docentes, estudiantes, UC)
│   └── ui/                 # Primitivas shadcn/ui (Radix + Tailwind)
├── config/
│   ├── api.ts          # Instancia Axios + interceptores
│   └── routes/          # Definición de rutas
├── contexts/AuthContext.tsx  # Sesión JWT (login/logout, decodificación, /users/me)
├── layouts/dashboard-layout.tsx
├── pages/               # Una carpeta por sección: auth, dashboard, professors,
│                         # students, curriculum-units, secciones, reportes, configuracion
└── types/index.ts       # Tipos compartidos (User, Role, etc.)
```

## Documentación relacionada

- `../ARCHITECTURE.md` — Norma maestra del ecosistema
- `../ARCHITECTURE_LOG.md` — Decisiones arquitectónicas (ADR)
- `../PERMISOS.md` — Matriz de permisos por rol
- `./agent.md` — Guía operativa para desarrolladores del panel
- `./DESIGN.md` — Sistema de diseño (colores, tipografía, patrones de componentes)
- `./INTEGRACION.md` — Estado de integración con la API (auditoría, puede quedar desactualizada respecto al código)

## Convenciones

- Código en inglés, UI/errores en español formal ("usted"/infinitivo)
- Contrato JSON de la API en `camelCase` (ADR-004), claves primarias UUID (ADR-001)
- Componentes `PascalCase`, archivos `kebab-case`
