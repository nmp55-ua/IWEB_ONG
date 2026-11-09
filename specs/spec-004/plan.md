# Implementation Plan: HU-04 — Informes de recaudación y voluntariado para la junta

**Branch**: `spec-004` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Responsable**: *Rubén* · **Revisora**: *Nicole*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan no repite lo que allí se fija (pila, estructura, sesión, formato de la API y de
errores, pruebas). Solo añade lo propio de HU-04.

## Summary

El administrador elige un periodo (días de inicio y fin incluidos, en hora de Madrid), un
proyecto opcional y una agrupación opcional (mes, trimestre o año). Una única función del
servicio, `generarInforme(filtros)`, calcula en SQL:

- por proyecto y fondo general: lo recaudado (puntual, cuotas y total) y el número de
  aportaciones `confirmada` por `fecha_cobro`;
- por proyecto: las actividades celebradas, los voluntarios distintos y las horas, por el
  `inicio` de la actividad.

Usa `GROUPING SETS` para obtener a la vez las filas, los subtotales por periodo y el total, con
los voluntarios distintos contados por ámbito. Esa misma salida se muestra en `/informes` y se
exporta a CSV y PDF con los servicios comunes, así que las tres coinciden (FR-006, SC-003).

No hay tablas ni migraciones nuevas: todo vive en el módulo `certificados-informes`, que solo lee
tablas ajenas. La parte que lee `asistencias` (HU-08) se deja para cuando esa tabla llegue a
`main` ([research.md](research.md) R10).

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, `pdfkit` (vía `pdf.js`), CSV común (`csv.js`), PostgreSQL 16,
Astro 5 + React 19 + Tailwind 3. Pruebas: Vitest + Supertest (backend) y `node --test`
(funciones puras del frontend). No se añade ninguna dependencia.

**Performance Goals**: SC-002 (informe anual exportado en < 1 min): dos consultas agregadas por
informe; milisegundos con los volúmenes de una ONG (R11).

**Constraints**:
- importes exactos al céntimo y horas a la centésima (sumas en `NUMERIC`, transporte como texto);
- periodos en hora de Madrid;
- solo aportaciones `confirmada` por `fecha_cobro`;
- actividades `publicada` con `inicio <= ahora`;
- solo cifras agregadas (FR-009);
- no importar repositorios ni servicios de otros módulos.

**Scale/Scope**: 0 tablas, 4 rutas, 1 página.

No queda ningún NEEDS CLARIFICATION: la sesión de clarify de 2026-11-09 cerró PA4.1 y cuatro
decisiones de forma del informe. El resto se decide en [research.md](research.md).

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-04 |
|---|---|
| I. Simplicidad | Dos consultas con `GROUPING SETS` en lugar de calcular en JavaScript; sin tablas resumen, sin informes guardados; CSV y PDF con los servicios comunes. |
| II. Cero alcance fantasma | Solo FR-001…FR-009. No se ofrece «fondo general» como filtro, ni gráficos, ni informes guardados o programados, ni desgloses por persona. La ruta de proyectos del filtro (R7) solo existe porque un proyecto inactivo con datos debe poder filtrarse. |
| III. Verificable | Cada escenario tiene su paso en [quickstart.md](quickstart.md) con datos de [datos-prueba.sql](datos-prueba.sql) y cifras esperadas calculadas a mano. |
| IV. Español | Importes `1.234,50 €`, horas `3,5 h`, fechas dd/mm/aaaa, periodos de Madrid; interfaz, CSV y PDF en español. |
| V. Seguridad y datos | `requiereRol('administrador')` en las 4 rutas; ninguna consulta selecciona datos personales de donantes o voluntarios (FR-009, principio V «los informes muestran cifras agregadas»). |
| VI. Nada se borra | Solo lectura. Las asistencias corregidas a «no asistió» se excluyen por `asistio`, no se borran. |
| VII–IX. Pila y convenciones | Mismo módulo `certificados-informes` (reservado a spec-003 y spec-004) con sus cuatro capas; API camelCase, importes y horas como texto; componentes comunes `Tabla`, `Campo`, `Boton`, `Aviso`, `EstadoVacio`. |
| X–XII. Colaboración | Las tablas de HU-01, HU-05, HU-07 y HU-08 solo se **leen** con SQL propio. La dependencia de HU-08 se documenta (R10). Los cambios comunes se listan abajo para acordarlos antes. |

## Project Structure

### Documentation (this feature)

```text
specs/spec-004/
├── spec.md
├── plan.md                        ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── datos-prueba.sql               ← datos sintéticos de 2023 (aportaciones, actividades, inscripciones)
├── datos-prueba-asistencias.sql   ← asistencias de esos datos (necesita 007 de HU-08)
├── contracts/api-informes.md
├── refinamiento/                  ← analyze, converge
└── tasks.md                       ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/src/modulos/certificados-informes/
├── rutas.js              ← + 4 rutas /informes… con requiereRol('administrador')
├── controlador.js        ← + zod de los filtros; JSON, CSV y PDF de la misma llamada al servicio
├── servicio.js           ← + generarInforme y listarProyectosInforme (reglas de abajo)
├── repositorio.js        ← + recaudacionInforme, voluntariadoInforme, proyectoPorId, todosLosProyectos
├── textos.js             ← + etiquetas de periodo, filas CSV y definición del PDF del informe
├── textos.test.js        ← + pruebas sin base de datos del formato del informe
└── informes.test.js      ← pruebas con base de datos (TEST_DATABASE_URL)

frontend/src/
├── pages/informes.astro
├── components/certificados-informes/Informes.jsx       ← formulario, tabla y botones de exportar
├── components/certificados-informes/informes.js        ← validación del periodo, URL de exportación, filas para la Tabla
├── components/certificados-informes/informes.test.js   ← node --test
└── components/comunes/Menu.jsx                         ← descomentar «Informes» (hueco reservado)
```

**Structure Decision**: aplicación web de plan-comun §1. HU-04 comparte módulo con HU-03 (del
mismo responsable), así que amplía sus cuatro capas en lugar de crear otro módulo. `app.js` no
cambia: `rutasCertificadosInformes` ya está registrado. Las pruebas con base de datos van en un
fichero propio, para no mezclarlas con las del certificado.

## Reglas de `servicio.js`

| Operación | Reglas | Error |
|---|---|---|
| `generarInforme({ desde, hasta, proyectoId, agrupacion })` | `hasta < desde` → error. Si hay `proyectoId`, el proyecto debe existir. Rango `[inicioDia(desde), inicioDia(hasta+1))`. Dinero: confirmadas por `fecha_cobro`; voluntariado: celebradas (`publicada`, `inicio <= ahora()`) por `inicio`. Cada consulta con `GROUPING SETS ((periodo, proyecto), (periodo), ())`. Une ambas por nivel, periodo y proyecto, rellena ceros, omite filas sin datos, quita subtotales si no se agrupa, ordena (R6) y pone etiquetas y límites de periodo (R4). Devuelve `{ filtros, filas, vacio }`. | 400 `PERIODO_NO_VALIDO` · 404 `PROYECTO_NO_ENCONTRADO` |
| `listarProyectosInforme()` | Todos los proyectos, activos e inactivos, por nombre (R7). | — |

El controlador valida el formato (400 `DATOS_INVALIDOS`) y, para `/csv` y `/pdf`, pasa la salida de
`generarInforme` a `csvInforme` o `definicionPdfInforme` de `textos.js`. Las 4 rutas llevan
`requiereRol('administrador')` (401 · 403).

## Dependencias

- **spec-001 (Nada), integrada en main**: `aportaciones` (`proyecto_id`, `modalidad`,
  `importe`, `estado`, `fecha_cobro`). Misma regla que HU-02 y HU-03: confirmadas por
  `fecha_cobro`. No se importa su repositorio.
- **spec-007 (Nicole), integrada en main**: `actividades` (`proyecto_id`, `inicio`, `estado`).
- **spec-005 (Javi), integrada en main**: `inscripciones` (`actividad_id`, `voluntario_id`).
- **spec-008 (Nicole), aún no en main**: `asistencias` (`inscripcion_id`, `asistio`, `horas`,
  migración `007_asistencias.sql`). Bloquea las columnas «Voluntarios» y «Horas» y el escenario 6.
  Las tareas que la necesitan van en una fase propia. Cuando HU-08 esté en `main`, se hace `merge`
  de `main` en `spec-004` y se completan. La PR de HU-04 se abre después (R10).
- **Servicios comunes**: `fechas.js` (`ahora`, `inicioDia`, `ZONA`), `csv.js` (`generarCsv`),
  `pdf.js` (`generarPdf`). Se usan sin cambios.

## Cambios comunes

Se proponen al grupo y se muestran a Rubén antes de hacerlos (principio XII):

1. `frontend/src/components/comunes/Menu.jsx`: descomentar el enlace «Informes» reservado para
   spec-004 (`rol: 'administrador'`).
2. `specs/plan-comun.md` §4 (rutas por módulo): la fila de certificados-informes (004) añade
   `GET /api/informes/proyectos`; y en «Preguntas abiertas», PA4.1 pasa a resuelta.
3. `backend/src/modulos/LEEME.md`: sección de HU-04 con las rutas del módulo.

No se tocan `app.js`, `servicios-comunes/`, las semillas ni ninguna migración.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
