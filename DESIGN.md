# Documentación de Diseño - SIGU (Sistema de Gestión Universitaria)

Este documento detalla los aspectos técnicos y visuales del diseño del front-end de SIGU, desarrollado con React, TypeScript y Tailwind CSS.

## 1. Identidad Visual

### Paleta de Colores
El sistema utiliza una paleta de colores profesional, inspirada en entornos académicos, con un fuerte énfasis en la legibilidad y la jerarquía visual.

| Color | Variable CSS | Hexadecimal | Uso |
| :--- | :--- | :--- | :--- |
| **Primario (Indigo)** | `--primary` | `#1A237E` | Barras de navegación, botones principales, títulos. |
| **Acento (Ámbar)** | `--accent` | `#FFC107` | Elementos de atención, botones secundarios, badges de advertencia. |
| **Fondo** | `--background` | `#F8F9FA` | Fondo general de la aplicación. |
| **Superficie (Card)** | `--card` | `#FFFFFF` | Paneles, tarjetas y contenedores de información. |
| **Éxito (Verde)** | `--success` | `#4CAF50` | Indicadores positivos, estados de "Presente". |
| **Error (Rojo)** | `--destructive` | `#EF5350` | Alertas, estados de "Ausente", botones de eliminación. |
| **Muted** | `--muted` | `#E8EAF6` | Fondos de inputs, elementos secundarios de la interfaz. |

### Tipografía
- **Sans-serif:** 'Inter', system-ui, sans-serif. Se utiliza para todo el cuerpo del texto y la mayoría de los títulos por su excelente legibilidad en pantallas.
- **Monoespaciada:** 'Geist Mono'. Reservada para datos específicos o elementos técnicos.

## 2. Arquitectura de Componentes

...

### Estándar de Tablas de Datos (Referencia: ProfessorsTable)
Para garantizar la consistencia, todas las vistas basadas en tablas deben seguir la estructura implementada en la tabla de Docentes:

1.  **Cabecera de Doble Nivel**:
    *   **Nivel Superior**: Título de la vista y descripción a la izquierda; botones de acción (Importación/Nuevo) a la derecha.
    *   **Nivel de Filtros**: Una fila con fondo `bg-muted/20` que contiene el buscador general y filtros específicos (ej. Documento). Los inputs deben tener fondo blanco (`bg-background`) y bordes visibles.
2.  **Cuerpo de Tabla**:
    *   Uso de `Avatar` para entidades personales.
    *   Uso de `Badge` para estados y etiquetas múltiples (como materias).
    *   Menú de acciones (`DropdownMenu`) en la última columna.
3.  **Pie de Página (Paginación Unificada)**:
    *   **Indicadores Estilizados**: Página actual y rango de resultados (ej. "1-10 de 20") encerrados en contenedores con borde y sombra.
    *   **Controles**: Navegación completa (Primero, Anterior, Números, Siguiente, Último).
    *   **Lógica**: 10 registros por página por defecto.

## 3. Estructura de Layout y Responsividad

El diseño sigue un patrón de **Dashboard Clásico** con adaptabilidad total:

- **Escritorio (lg+):** Sidebar fija a la izquierda (`w-64`), contenido principal con margen izquierdo para evitar solapamiento.
- **Móvil/Tablet (<lg):** Sidebar oculta, accesible mediante un menú hamburguesa que activa un componente `Sheet` (Drawer lateral).
- **Grid de Contenido:** Las tarjetas de estadísticas pasan de 1 columna (móvil) a 2 (tablet) y 4 (escritorio). La sección de analítica utiliza `grid-cols-5` en escritorio para equilibrar el gráfico (3 col) y la lista de riesgo (2 col).

## 4. Patrones de Diseño UX y Accesibilidad

### Experiencia de Usuario
- **Feedback de Estado:** Uso consistente de colores para indicar el estatus de asistencia (Verde: Presente, Rojo: Ausente, Amarillo: Justificado).
- **Visualización de Datos:** Empleo de gráficos de barras para comparar la asistencia entre unidades curriculares, con una línea de referencia clara en el 75% (umbral crítico).
- **Interactividad:** Modales (Dialogs) con pestañas (Tabs) para separar la entrada de datos de estudiantes y docentes, reduciendo la carga cognitiva.

### Accesibilidad (A11y)
- **Navegación por Teclado:** Gracias a Radix UI, todos los modales, dropdowns y tabs son navegables mediante teclado.
- **Contraste:** Se mantienen ratios de contraste elevados (AA/AAA) especialmente en el texto primario sobre fondo claro.
- **Anuncios de Estado:** Uso de Toasters (Sonner) para confirmar acciones exitosas o alertar sobre errores.

## 5. Gestión de Datos y Temas

- **Validación:** Implementación de esquemas con **Zod** y gestión de formularios con **React Hook Form** para asegurar la integridad de los datos antes del envío.
- **Modo Oscuro:** Soporte nativo para temas mediante `next-themes`. Las variables CSS cambian a valores OKLCH en modo oscuro para una apariencia moderna y descansada.
- **Utilidades:** Uso de la función `cn` (clsx + tailwind-merge) para la gestión dinámica de clases CSS sin conflictos.

## 6. Stack Tecnológico Principal

- **Framework:** React 19
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4
- **Iconografía:** Lucide React
- **Primitivas UI:** Radix UI
- **Gráficos:** Recharts
- **Gestión de Temas:** Next Themes
