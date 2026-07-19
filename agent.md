# 🤖 agent.md — SIGU-web-react (Panel Administrativo / Consumidor)

> **LECTURA OBLIGATORIA ANTES DE CUALQUIER TRABAJO.** Lee este archivo y, como contexto, `../ARCHITECTURE.md` (norma maestra del ecosistema) y `../ARCHITECTURE_LOG.md` (decisiones vigentes).

## 1. Tu rol
Eres un agente ejecutor del **Panel Administrativo Web**. Esta aplicación es un **consumidor** de la API. **No define la estructura de datos**: si necesitas un dato o un formato distinto, se solicita al Backend mediante un ADR; no se inventan campos ni se fuerza al Backend a adaptarse a la UI.

## 2. Stack actual
React 19 + TypeScript + Vite 6 · React Router 7 · React Hook Form + Zod · Radix UI + Tailwind 4 · Recharts · XLSX (importación/exportación Excel) · Axios (`src/config/api.ts`, interceptor JWT + manejo de 401) · `@tanstack/react-query` (provider montado en `main.tsx`; la mayoría de páginas aún consume datos vía `useState`/llamadas directas a `api`, no `useQuery`).

## 3. Objetivo funcional
Gestión administrativa masiva por autoridades y personal de oficina: creación de sedes, PNFs, trayectos; gestión de docentes y estudiantes; unidades curriculares; secciones; y reportes de auditoría de asistencia.

## 4. Estado actual
Login real contra `POST /api/v1/auth/login` vía `AuthContext` (`src/contexts/AuthContext.tsx`): decodifica el JWT, persiste `sigu_token`/`sigu_user` en `localStorage`, hidrata `GET /users/me`. `PrivateRoute` (`src/components/auth/PrivateRoute.tsx`) ya soporta gating por rol (`allowedRoles`). Páginas implementadas: login, dashboard, docentes, estudiantes, unidades curriculares, secciones, reportes, configuración. Antes de asumir que una pantalla sigue usando datos mock, revisar el archivo directamente — el frontend avanza más rápido de lo que este documento se actualiza.

## 5. Contrato con la API (reglas para integrar)
- **Base URL**: `VITE_API_URL` en `.env` (Vite) — nunca hardcodear.
- **Autenticación:** `POST /api/v1/auth/login` con `{ ci, password }`. La cédula se normaliza a formato `V-XXXXXXXX`/`E-XXXXXXXX`. El JWT se guarda en `localStorage` (`sigu_token`) y se envía en `Authorization: Bearer <token>` vía interceptor de Axios.
- **Convención de campos (ver ADR-004):** el contrato canónico de la API es **`camelCase`**. Alinéate a las claves que defina el Backend; no asumas `snake_case`.
- **Claves primarias:** `uuid` (string) — ADR-001 ya está `ACEPTADA`, no `PROPUESTA`.
- **Estados de asistencia:** `PRESENTE`, `RETARDO`, `JUSTIFICADO` (persistidos) y `AUSENTE` (inferido, no persistido) — ADR-003 ya está `ACEPTADA`. `Justificado` es válido en la UI.

## 6. Convenciones
- Idioma: código en inglés; textos de interfaz en **español formal** ("usted"/infinitivo, sin tuteo).
- Componentes `PascalCase`, archivos `kebab-case`.
- Ramas: `tipo/descripcion-corta`, máx. 3 palabras tras el prefijo. Commits semánticos con una línea en blanco entre título y cuerpo. **Prohibida la palabra "relax".**

## 7. Si necesitas un dato que la API no expone
No lo inventes en el cliente. Solicítalo al Arquitecto Líder para registrarlo como ADR y que el Backend lo provea.
