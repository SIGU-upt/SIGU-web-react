# 📋 INTEGRACION.md — SIGU Web React (Panel Administrativo)

> **Propósito:** Guía de integración para convertir el prototipo de UI (~30%) en un panel administrativo funcional conectado a la API SIGU.

---

## 1. ESTADO ACTUAL (auditoría 2026-07-04)

| Capa | Estado |
|---|---|
| UI / Layout | ✅ Pulida — sidebar, topbar, responsive, dark mode, 60+ shadcn/ui primitives |
| Páginas implementadas | ✅ 5 rutas: Login, Dashboard, Docentes, Estudiantes, Unidades Curriculares |
| Páginas fantasma | ❌ 3 enlaces en sidebar sin ruta ni página: `/secciones`, `/reportes`, `/configuracion` |
| Cliente HTTP | ❌ No existe (sin axios ni fetch) |
| Autenticación | ❌ `localStorage.sigu_auth` booleano (login simulado) |
| Datos | ❌ 100% mockeados (arrays hardcodeados en cada página) |
| Servicios | ❌ No existe capa `services/` ni `api/` |
| State management | ❌ Solo `useState` local en páginas |
| Roles / RBAC | ❌ No implementado |
| Formularios | ⚠️ `react-hook-form` + `zod` instalados pero apenas usados |

---

## 2. LO QUE FALTA (checklist de integración)

### 2.1 🔴 Bloqueante — Infraestructura base

- [ ] **Cliente HTTP**: instalar `axios` o configurar `fetch` wrapper con interceptor para JWT
- [ ] **Variables de entorno**: `.env` con `VITE_API_URL=http://localhost:3000/api/v1`
- [ ] **Auth service**: reemplazar `localStorage.sigu_auth` booleano por JWT real
  - `POST /api/v1/auth/login` con `{ ci, password }`
  - Normalizar cédula `V-XXXXXXXX` / `E-XXXXXXXX` antes de enviar
  - Guardar `accessToken` en localStorage
  - Interceptor: añadir `Authorization: Bearer <token>` a toda request
  - Redirect a `/login` si `401`
- [ ] **User context**: contexto React que almacene datos del usuario (`GET /users/me`), rol y permisos
- [ ] **Protección de rutas**: `PrivateRoute` que valide rol antes de renderizar

### 2.2 🔴 Bloqueante — Migrar mock → API real

| Página actual | Endpoint(s) a consumir | Cambios necesarios |
|---|---|---|
| Login | `POST /api/v1/auth/login` | Reemplazar simulación por llamada real |
| Dashboard | `GET /reportes/*` (futuro) | Placeholder hasta tener métricas reales |
| Docentes | `GET /users?role=DOCENTE&q=` | Reemplazar `initialData` mock |
| Estudiantes | `GET /users?role=ALUMNO&q=` | Reemplazar `initialData` mock |
| UC | `GET /unidades-curriculares?q=` | Reemplazar `initialData` mock |

- [ ] **CRUD completo** en cada página: crear (`POST`), editar (`PATCH`), eliminar (`DELETE`)
- [ ] **Modales de creación**: los botones "Nuevo X" + `AddUserModal` deben hacer `POST`
- [ ] **Tablas**: `onClick` de acciones (Ver Detalles, Editar, Eliminar) funcionales
- [ ] **Importación Excel**: convertir a llamada API real (no solo append a estado local)
- [ ] **Filtros de búsqueda**: usar `?q=texto` en todas las listas
- [ ] **Paginación**: si la API lo soporta en futuro, sino client-side

### 2.3 🟡 Importante — Páginas faltantes

- [ ] **`/secciones`**: `GET /secciones?q=&sedePnfId=&trayectoId=` + CRUD
- [ ] **`/reportes`**: integrar `GET /reports/clase/:id` y `GET /reports/alumno/:id`
- [ ] **`/configuracion`**: gestión de sedes, PNFs, trayectos, UC
  - `GET /sedes`, `POST /sedes`, etc.
  - `GET /pnfs`, `POST /pnfs`, etc.
  - `GET /trayectos?pnfId=`, `POST /trayectos`, etc.
  - `GET /tramos?trayectoId=`, `POST /tramos`, etc.

### 2.4 🟡 Importante — Roles y RBAC

- [ ] Mostrar/ocultar secciones según rol (`ANALISTA`, `RECTOR`, `COORDINADOR`)
- [ ] Deshabilitar botones de crear/editar/eliminar para ANALISTA (solo GET)
- [ ] Filtro automático por jurisdicción: COORDINADOR solo ve su `sedePnfId`
- [ ] RECTOR solo ve su sede

### 2.5 🟢 Deseable — UX y calidad

- [ ] **React Query / TanStack Query**: caché, refetch, estados de loading/error
- [ ] **Manejo de errores**: toasts con mensajes de la API en español formal
- [ ] **Skeleton loaders** mientras cargan datos
- [ ] **Tests**: Vitest + React Testing Library
- [ ] **Exportar**: CSV/Excel de tablas con datos reales

---

## 3. CONTRATO DE API (referencia rápida)

| Concepto | Detalle |
|---|---|
| Base URL | `http://localhost:3000/api/v1` (configurable por `.env`) |
| Auth | `Authorization: Bearer <jwt>` en todas las requests |
| Formato | `camelCase` en JSON, `snake_case` en DB (ADR-004) |
| IDs | UUID v4 (string) |
| Roles | `SUPERADMIN`, `RECTOR`, `ANALISTA`, `COORDINADOR`, `DOCENTE`, `ALUMNO`, `VIGILANTE` |
| Errores | `{ statusCode, message, timestamp, path }` |

### Endpoints clave

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Login por cédula + contraseña |
| `GET` | `/users/me` | Todos | Perfil propio |
| `GET` | `/users?q=&role=&sedeId=` | SUPERADMIN, RECTOR, ANALISTA, COORDINADOR | Listar usuarios |
| `POST` | `/users` | SUPERADMIN, RECTOR, COORDINADOR | Crear usuario |
| `GET` | `/sedes?q=` | Todos autenticados | Listar sedes |
| `GET` | `/pnfs?q=` | Todos autenticados | Listar PNFs |
| `GET` | `/sede-pnf?sedeId=&pnfId=` | Todos autenticados | Listar asociaciones |
| `GET` | `/trayectos?pnfId=&q=` | Todos autenticados | Listar trayectos |
| `GET` | `/tramos?trayectoId=` | Todos autenticados | Listar tramos |
| `GET` | `/unidades-curriculares?trayectoId=&q=` | Todos autenticados | Listar UC |
| `GET` | `/secciones?sedePnfId=&trayectoId=&q=` | Todos autenticados | Listar secciones |
| `GET` | `/clases?docenteId=&seccionId=&ucId=&q=` | Todos autenticados | Listar clases |
| `GET` | `/inscripciones?claseId=&alumnoId=` | Todos autenticados (ALUMNO ve sus propias) | Listar inscripciones |
| `GET` | `/reports/clase/:id` | RECTOR, ANALISTA, COORDINADOR, DOCENTE | Reporte de clase |
| `GET` | `/reports/alumno/:id` | RECTOR, ANALISTA, COORDINADOR, DOCENTE, ALUMNO | Reporte de alumno |
| `GET` | `/health` | Público | Health check |

---

## 4. FLUJO OFFLINE (panel web)

El panel administrativo **no requiere modo offline**. Es una aplicación de oficina usada por personal administrativo con acceso a internet. Si no hay conectividad en la oficina, el sistema simplemente no está disponible.

La responsabilidad offline recae en la **app móvil Flutter** (docentes y alumnos en el aula).

---

## 5. CONVENCIONES PARA EL DESARROLLADOR FRONTEND

- **Idioma**: código en inglés, UI en español formal ("usted"/infinitivo, sin tuteo)
- **Componentes**: `PascalCase`, archivos `kebab-case`
- **Ramas**: `tipo/descripcion-corta` (máx. 3 palabras)
- **Commits**: semánticos, una línea en blanco entre título y cuerpo
- **Prohibido**: palabra "relax", tipo `any`
- **Prohibido**: inventar campos que la API no expone — si falta algo, abrir ADR
