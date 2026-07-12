# 🌐 PLAN_REACT.md — SIGU Panel Web (React)

> **Objetivo:** Panel administrativo para SUPERADMIN, RECTOR, COORDINADOR, ANALISTA.
> **Prioridad:** Funcionalidad > Diseño. Que se vea decente, no perfecto.
> **API base:** `http://localhost:3000/api/v1`
> **Estilos:** Tailwind CSS (rápido, sin diseñar desde cero)

---

## 1. Setup Inicial

```bash
npm create vite@latest SIGU-web-react -- --template react-ts
cd SIGU-web-react
npm install
npm install axios react-router-dom @tanstack/react-table tailwindcss @tailwindcss/vite
npm install lucide-react   # iconos (opcional)
npm install file-saver     # para descargar Excel
npm install @types/file-saver -D
```

### Estructura de carpetas

```
src/
├── main.tsx
├── App.tsx                  # Router
├── index.css                # Tailwind
├── config/
│   └── api.ts               # axios instance + interceptors
├── hooks/
│   ├── useAuth.ts           # login, logout, token
│   └── useApi.ts            # fetch genérico con loading/error
├── components/
│   ├── Layout.tsx            # sidebar + header + outlet
│   ├── Sidebar.tsx           # navegación por rol
│   ├── DataTable.tsx         # tabla reutilizable con paginación
│   ├── LoadingSpinner.tsx
│   └── ErrorAlert.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── users/
│   │   ├── UsersPage.tsx     # tabla con filtros
│   │   └── UserForm.tsx      # crear/editar usuario
│   ├── academic/
│   │   ├── SedesPage.tsx
│   │   ├── PnfsPage.tsx
│   │   ├── TrayectosPage.tsx
│   │   └── PeriodosPage.tsx
│   ├── enrollment/
│   │   ├── ClasesPage.tsx     # tabla con horarios
│   │   ├── ClaseForm.tsx      # crear/editar clase
│   │   ├── InscripcionesPage.tsx
│   │   └── CohortesPage.tsx
│   ├── attendance/
│   │   └── JustificarPage.tsx
│   ├── reports/
│   │   ├── ReporteClasePage.tsx
│   │   └── ReporteAlumnoPage.tsx
│   └── security/
│       └── SecurityLogsPage.tsx
└── types/
    └── index.ts              # interfaces: User, Clase, etc.
```

---

## 2. Configuración Base

### axios instance (`src/config/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Router (`src/App.tsx`)

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<Layout />}>   {/* protegido */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/sedes" element={<SedesPage />} />
      <Route path="/pnfs" element={<PnfsPage />} />
      <Route path="/trayectos" element={<TrayectosPage />} />
      <Route path="/periodos" element={<PeriodosPage />} />
      <Route path="/clases" element={<ClasesPage />} />
      <Route path="/inscripciones" element={<InscripcionesPage />} />
      <Route path="/cohortes" element={<CohortesPage />} />
      <Route path="/reportes/clase" element={<ReporteClasePage />} />
      <Route path="/reportes/alumno" element={<ReporteAlumnoPage />} />
      <Route path="/security-logs" element={<SecurityLogsPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 3. Pantallas (12)

### 3.1. LoginPage

- Campos: CI + Contraseña
- Llama `POST /auth/login`
- Guarda token en `localStorage`
- Redirige al Dashboard

### 3.2. Layout (Sidebar + Header)

- **Sidebar:** navegación según rol (JWT payload tiene `role`)
- SUPERADMIN ve todo
- RECTOR ve: Dashboard, Usuarios, Sedes, Clases, Reportes
- COORDINADOR ve: Dashboard, Usuarios (solo DOCENTE/ALUMNO), Períodos, Clases, Inscripciones, Cohortes, Reportes
- **Header:** nombre del usuario (`GET /users/me`), botón cerrar sesión

### 3.3. DashboardPage

- 5 tarjetas con números grandes: Total Usuarios, Docentes, Alumnos, Clases, Inscripciones
- Llama `GET /dashboard`
- Nombre de la sede visible (contexto del usuario)

### 3.4. UsersPage

- **Tabla paginada** con columnas: CI, Nombres, Apellidos, Email, Rol, Acciones
- **Filtros:** Rol (dropdown), Trayecto (dropdown), Búsqueda (input), Sin cohorte (checkbox)
- **Paginación:** usa `?page=1&limit=20` y los `meta` de la respuesta
- **Acciones:** Botón "+ Nuevo" (abre modal/form), Editar (ícono lápiz), Eliminar (solo SUPERADMIN)
- **Crear/Editar:** formulario con todos los campos del DTO, incluyendo sede/sedePnf según el rol

### 3.5. ClasesPage

- **Tabla** con columnas: UC, Docente, Sección, Día, Horario, Aula, Grupo, Acciones
- **Filtros:** Trayecto (dropdown), Día (dropdown), Sede-PNF (dropdown)
- **Botón "+ Nueva clase"** → formulario con:
  - Select UC (filtrable por trayecto: `GET /unidades-curriculares?trayectoId=`)
  - Select Docente (`GET /users?role=DOCENTE&sedePnfId=`)
  - Select Sección
  - Día, Hora inicio, Hora fin, Aula, Grupo, Tramo
- **Botón "Suspender"** en cada fila → modal con fecha + motivo
- **Botón "Ver alumnos"** → `GET /inscripciones?claseId=`

### 3.6. InscripcionesPage

- **Tabla** con columnas: Alumno, CI, Clase (UC), Docente, Sección
- **Filtros:** Alumno (búsqueda), Clase, Período
- **Botón "+ Inscribir"** → modal con:
  - Select Alumno
  - Select Clase(s) — multi-select para batch
  - Select Período
  - Botón "Individual" (`POST /inscripciones`)
  - Botón "Batch" (`POST /inscripciones/batch`)
- **Botón "Masiva"** → modal con:
  - Select Trayecto, Sede-PNF, Período
  - Multi-select Clases
  - Botón "Inscribir cohorte" (`POST /inscripciones/masiva`)
- **Botón "Importar Excel"** → subir archivo `.xlsx` (`POST /import/inscripciones`)

### 3.7. CohortesPage

- **Tabla** con columnas: Alumno, Trayecto, Período, Activa
- **Filtros:** Trayecto, Período
- **Botón "+ Asignar cohorte"** → modal con Alumno, Trayecto, Período
- **Botón "Promover"** → seleccionar alumnos, elegir trayecto destino, confirmar
- **Botón "Historial"** en cada alumno → `GET /cohortes/historial/:alumnoId`

### 3.8. PeriodosPage

- **Tabla** con columnas: Nombre, Sede-PNF, Inicio, Fin, Activo
- **Botón "+ Nuevo período"** → formulario
- **Botón "Cerrar"** en período activo → `PATCH /periodos/:id/cerrar`

### 3.9. ReporteClasePage

- **Select Clase** (buscar por nombre UC o docente)
- **Input Fecha** (default: hoy)
- **Tabla** con columnas: CI, Nombres, Apellidos, Estado (coloreado: verde=PRESENTE, rojo=AUSENTE, amarillo=JUSTIFICADO)
- **Botón "Exportar Excel"** → descarga archivo de `GET /export/clase/:id?fecha=`

### 3.10. ReporteAlumnoPage

- **Select Alumno** (buscar por CI o nombre)
- **Tarjeta resumen:** porcentaje global, umbral, barra de progreso
- **Tabla** por clase: UC, Grupo, Asistencias/Sesiones, Porcentaje, Estado
- **Botón "Exportar Excel"** → `GET /export/alumno/:id`

### 3.11. SecurityLogsPage (SUPERADMIN)

- **Tabla** con columnas: Fecha, Usuario, Acción, Detalle, IP
- **Filtros:** Acción (dropdown: LOGIN_FALLIDO, REGISTRO_ASISTENCIA, etc.), Usuario, Fecha desde/hasta
- Solo lectura, sin acciones

### 3.12. SedesPage / PnfsPage / TrayectosPage (CRUD simple)

- Tabla + formulario modal para crear/editar
- Eliminar con confirmación (soft delete)

---

## 4. Componentes Reutilizables

### DataTable

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}
```

- Usa `@tanstack/react-table` para ordenamiento y renderizado
- Paginación: botones "Anterior" / "Siguiente" + "Página X de Y"
- Loading state: spinner overlay

### Layout

```
┌──────────────────────────────────────────┐
│  Header: [Usuario] [Cerrar sesión]       │
├──────────┬───────────────────────────────┤
│ Sidebar  │                               │
│          │     <Outlet />                 │
│ Dashboard│                               │
│ Usuarios │     Contenido de la página     │
│ Clases   │                               │
│ ...      │                               │
└──────────┴───────────────────────────────┘
```

---

## 5. Flujo de Export Excel

```typescript
// En un botón "Exportar"
const handleExport = async () => {
  const response = await api.get(`/export/clase/${claseId}`, {
    params: { fecha },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `asistencia_${fecha}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

## 6. Flujo de Import Excel

```typescript
const handleImport = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import/inscripciones', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // response.data: { creados, actualizados, cohortesAsignadas, inscripcionesCreadas, errores[] }
  // Mostrar resumen en un modal
};
```

---

## 7. Notas Importantes

- **Autenticación:** el token JWT expira en 8h. El interceptor redirige al login si recibe 401.
- **Roles:** el sidebar oculta/muestra secciones según `role` del JWT decodificado.
- **Paginación:** users y attendance devuelven `{ data, meta }`. Los demás endpoints aún devuelven arrays planos (sin paginación). Envolver en `{ data: [...], meta: { total: array.length } }` en el front si es necesario.
- **Errores:** mostrar `error.response.data.message` en un toast/alert (viene en español).
- **Filtros:** usar `@tanstack/react-table` para filtrado client-side cuando el dataset es pequeño, y filtros server-side (query params) para datasets grandes.
- **Excel:** instalar `file-saver` para la descarga de blobs.

---

**Fin de PLAN_REACT.md**
