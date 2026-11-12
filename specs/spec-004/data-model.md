# Data Model: HU-04 — Informes de recaudación y voluntariado

HU-04 **no crea tablas ni migraciones**: el informe es un cálculo, no una entidad (spec, «Key
Entities»). Solo lee tablas definidas en [modelo-datos.md](../modelo-datos.md) y no escribe en
ninguna.

## Tablas que se leen

| Tabla (dueño) | Columnas | Para qué |
|---|---|---|
| `proyectos` (común) | `id`, `nombre`, `activo` | nombre de la fila y lista del filtro (R7) |
| `aportaciones` (spec-001) | `proyecto_id`, `modalidad`, `importe`, `estado`, `fecha_cobro` | dinero: solo `estado = 'confirmada'` con `fecha_cobro` en el rango; `proyecto_id NULL` = fondo general; `modalidad` separa `puntual` de `cuota_socio` |
| `actividades` (spec-007) | `id`, `proyecto_id`, `inicio`, `estado` | celebrada = `publicada` con `inicio <= ahora`; cuenta en el periodo de su `inicio` |
| `inscripciones` (spec-005) | `id`, `actividad_id`, `voluntario_id` | une la asistencia con la actividad y la persona |
| `asistencias` (spec-008, migración `007`, **aún no en main**) | `inscripcion_id`, `asistio`, `horas` | voluntarios distintos y horas, solo con `asistio = true` |

No se lee ninguna columna personal (`donantes.*`, `voluntarios.*`, `usuarios.*`): FR-009.

## Informe (calculado, no se guarda)

Lo devuelve `servicio.generarInforme(filtros)` y es la única fuente de la pantalla, el CSV y el
PDF (R2). Forma detallada en [contracts/api-informes.md](contracts/api-informes.md).

**Filtros**

| Campo | Tipo | Regla |
|---|---|---|
| `desde` | fecha `AAAA-MM-DD` | obligatoria |
| `hasta` | fecha `AAAA-MM-DD` | obligatoria; `hasta >= desde` (FR-002) |
| `proyecto` | `{ id, nombre }` o `null` | si se filtra, debe existir |
| `agrupacion` | `mes`, `trimestre`, `anio` o `null` | — |

**Fila**

| Campo | Tipo | Cálculo |
|---|---|---|
| `tipo` | `proyecto`, `fondoGeneral`, `subtotal`, `total` | nivel de `GROUPING SETS` (R3) |
| `periodo` | `{ etiqueta, desde, hasta }` o `null` | `date_trunc` en hora de Madrid, recortado al rango (R4) |
| `proyecto` | `{ id, nombre }` o `null` | `null` en fondo general, subtotal y total |
| `recaudadoPuntual` | NUMERIC → texto | `sum(importe)` de confirmadas `puntual` |
| `recaudadoCuotas` | NUMERIC → texto | `sum(importe)` de confirmadas `cuota_socio` |
| `recaudadoTotal` | NUMERIC → texto | `sum(importe)` de confirmadas |
| `aportaciones` | entero | `count(*)` de confirmadas |
| `actividades` | entero | `count(DISTINCT)` de celebradas |
| `voluntarios` | entero | `count(DISTINCT voluntario_id)` con `asistio`, en el ámbito de la fila (no suma de filas) |
| `horas` | NUMERIC → texto | `sum(horas)` con `asistio` |

**Reglas de las filas**

- Una fila de proyecto o de fondo general existe solo si tiene alguna aportación confirmada o
  alguna actividad celebrada en su periodo. Un subtotal existe solo si su periodo tiene filas
  (FR-007, clarify, pregunta 4).
- Sin agrupación no hay subtotales. Con filtro de proyecto solo hay filas de ese proyecto, sus
  subtotales y el total.
- Orden: periodo ascendente; dentro de cada uno, proyectos por nombre, «Fondo general» y el
  subtotal; al final, la fila de totales. Si no hay filas, `vacio: true`, sin fila de totales.
- Comprobación de cuadre (SC-001): en dinero, aportaciones, actividades y horas, el total es la
  suma de las filas de proyecto y fondo general, y cada subtotal es la suma de las filas de su
  periodo. En voluntarios, total ≤ suma de filas.
