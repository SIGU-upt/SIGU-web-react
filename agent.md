# 🤖 agent.md — SIGU-web-react (Panel Administrativo / Consumidor)

> **LECTURA OBLIGATORIA ANTES DE CUALQUIER TRABAJO.** Lee este archivo y, como contexto, `../ARCHITECTURE.md` (norma maestra del ecosistema) y `../ARCHITECTURE_LOG.md` (decisiones vigentes).

## 1. Tu rol
Eres un agente ejecutor del **Panel Administrativo Web**. Esta aplicación es un **consumidor** de la API. **No define la estructura de datos**: si necesitas un dato o un formato distinto, se solicita al Backend mediante un ADR; no se inventan campos ni se fuerza al Backend a adaptarse a la UI.

## 2. Stack actual
React 19 + TypeScript + Vite 6 · React Router 7 · React Hook Form + Zod · Radix UI + Tailwind 4 · Recharts · XLSX (importación Excel) · estado local (`useState`), sin Redux/Zustand/React Query.

## 3. Objetivo funcional
Gestión administrativa masiva por autoridades y personal de oficina: creación de sedes, PNFs, trayectos; gestión de docentes y estudiantes; unidades curriculares; secciones; y reportes de auditoría de asistencia.

## 4. Estado actual (a 2026-06-27)
Maqueta de UI (~30 %). Login simulado (`localStorage.sigu_auth` booleano), datos mockeados, **sin cliente HTTP**. Pantallas `secciones`, `reportes` y `configuracion` declaradas pero sin implementar.

## 5. Contrato con la API (reglas para integrar)
- **Base URL** y token deben configurarse vía `.env` (Vite) — nunca hardcodear.
- **Autenticación:** el login real es `POST /api/v1/auth/login` con `{ ci, password }`. La cédula se normaliza a formato `V-XXXXXXXX`/`E-XXXXXXXX`. La respuesta entrega un JWT que debe guardarse (reemplazar el booleano `sigu_auth`) y enviarse en `Authorization: Bearer <token>`.
- **Convención de campos (ver ADR-004):** el contrato canónico de la API es **`camelCase`**. Alinéate a las claves que defina el Backend; no asumas `snake_case`.
- ⛔ **Pendientes de ratificación que te afectan:**
  - **ADR-001:** si se adopta `uuid` para las claves primarias, los tipos `id: number` deberán cambiar a `id: string`.
  - **ADR-003:** el estado de asistencia `"Justificado"` que hoy renderiza la UI **podría no existir** en la API (la norma maestra solo contempla `PRESENTE`/`RETARDO`, con `AUSENTE` inferido). No dependas de `Justificado` hasta que el ADR se resuelva.

## 6. Convenciones
- Idioma: código en inglés; textos de interfaz en **español formal** ("usted"/infinitivo, sin tuteo).
- Componentes `PascalCase`, archivos `kebab-case`.
- Ramas: `tipo/descripcion-corta`, máx. 3 palabras tras el prefijo. Commits semánticos con una línea en blanco entre título y cuerpo. **Prohibida la palabra "relax".**

## 7. Si necesitas un dato que la API no expone
No lo inventes en el cliente. Solicítalo al Arquitecto Líder para registrarlo como ADR y que el Backend lo provea.
