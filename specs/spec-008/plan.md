# Implementation Plan: HU-08 — Registro de asistencia y acumulación de horas

**Branch**: `spec-008` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Responsable**: *Nicole* · **Revisor**: *Rubén*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan **no repite** lo que allí se fija (pila, estructura, autenticación, formato de la API y
de errores, pruebas, semillas). Solo añade lo propio de HU-08.

## Summary

El coordinador abre la pantalla de asistencia de una actividad publicada ya iniciada
(`/coordinacion/actividades/:id/asistencia`), marca a cada inscrito confirmado como «asistió» o
«no asistió» y guarda la lista entera de una vez (`PUT /api/actividades/:id/asistencias`). El
voluntario ve su total y el desglose por actividad en `/mis-horas` (`GET /api/yo/horas`).
Todo vive en el módulo `backend/src/modulos/actividades/`, dueño de la nueva tabla `asistencias`
(migración `007_asistencias.sql`). Una fila por inscripción (único), horas copiadas de la
actividad al registrar y total **derivado** con `SUM(horas) WHERE asistio`, así que repetir el
guardado no duplica y corregir resta sola (FR-004, FR-005, SC-001). Las inscripciones se leen
solo a través de `modulos/actividades/inscripciones.js`, que reexporta el servicio de voluntariado; no se toca
`modulos/voluntariado`.

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, PostgreSQL 16, Astro 5 + React 19 + Tailwind 3,
Vitest + Supertest. No se añade ninguna dependencia.

**Performance Goals**: SC-002 (20 personas en < 2 min): una sola tabla con un interruptor por
fila, «Marcar todos como asistentes» y un único botón «Guardar».
**Constraints**: «ahora» siempre de `servicios-comunes/fechas.js` (`AHORA_SIMULADO` en pruebas);
horas con un decimal en la interfaz (`formatearHoras`).
**Scale/Scope**: 2 páginas, 3 rutas, 1 tabla.

No queda ningún NEEDS CLARIFICATION: PA8.1, PA8.2, quién registra, desde cuándo y la regla de
cancelación se resolvieron en `/speckit-clarify` (sesión 2026-11-04). Las decisiones técnicas
están en [research.md](research.md).

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-08 |
|---|---|
| I. Simplicidad | Sin plazo (PA8.1), sin horas parciales (PA8.2), cualquier coordinador; total derivado, sin contadores. Un único `PUT` con la lista completa. |
| II. Cero alcance fantasma | Solo FR-001…FR-009; sin certificados de horas, sin exportar, sin notificaciones. |
| III. Verificable | Cada escenario tiene un paso en [quickstart.md](quickstart.md); reglas de horas en `servicio.test.js`. |
| IV. Español | Mensajes en español; fechas dd/mm/aaaa con `formatearFecha`; horas `3,5 h`. |
| V. Seguridad | `requiereRol('coordinador')` en las rutas de actividad; `/api/yo/horas` usa solo `req.usuario.id` (FR-007, escenario 2.3). |
| VI. Nada se borra | No hay `DELETE`; corregir cambia `asistio` (edge case de la spec). FK `ON DELETE RESTRICT`. |
| VIII. Una sola aplicación | `Layout`, `Tabla`, `Boton`, `Aviso`, `EstadoVacio`, `lib/api.js`, `transaccion()`, `ErrorApi`. Inscripciones solo vía `inscripciones.js`. |
| XII. Cambios comunes con acuerdo | No cambia nada común: usa las funciones de lectura que ya expone el servicio de voluntariado y la regla FR-009 de spec-005 (research R3, R6). |

## Project Structure

### Documentation (this feature)

```text
specs/spec-008/
├── spec.md
├── plan.md              ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api-asistencias.md
└── tasks.md             ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/src/
├── db/migraciones/007_asistencias.sql        ← tabla asistencias (research R2)
├── db/semillas/asistencias.js                ← asistencia de 2 h de voluntario@ong.test
├── db/semillas/index.js                      ← llamar a sembrarAsistencias tras las inscripciones
└── modulos/actividades/
    ├── rutas.js                  ← + GET/PUT /actividades/:id(\d+)/asistencias (coordinador)
    ├── rutasYo.js                ← GET /yo/horas (requiereRol(): cualquier usuario identificado)
    ├── controlador.js            ← + esquema zod del PUT y respuestas de asistencias y horas
    ├── asistencias.js            ← servicio de asistencia (reglas abajo); separado de servicio.js
    ├── repositorio.js            ← + SQL de asistencias (upsert, listar, sumar)
    └── asistencias.test.js
backend/src/app.js                ← api.use(rutasYoActividades)

frontend/src/
├── pages/coordinacion/actividades/[id]/asistencia.astro   ← pantalla de asistencia
├── pages/mis-horas.astro                                  ← horas del voluntario
├── components/actividades/ListaAsistencia.jsx             ← tabla con interruptores y Guardar
├── components/actividades/MisHoras.jsx                    ← total + desglose
├── components/actividades/DetalleActividad.jsx            ← + enlace «Registrar asistencia» si celebrada
└── components/comunes/Menu.jsx                            ← + { rol: 'voluntario', href: '/mis-horas', texto: 'Mis horas' }
```

**Structure Decision**: aplicación web de plan-comun §1; todo dentro del módulo `actividades`
(Nicole, spec-007 y spec-008), sin tocar `modulos/voluntariado`.

## Reglas de `asistencias.js`

| Operación | Reglas | Error |
|---|---|---|
| `obtenerAsistencia(actividadId)` | Actividad existe. Devuelve la actividad (con `horas` derivadas y `registrable`) y una fila por inscripción **confirmada** (`listarConfirmadasDeActividad`) con `asistio: true / false / null` (null = sin registrar). Nunca en espera ni canceladas (escenario 1.5). | 404 `NO_ENCONTRADO` |
| `guardarAsistencia(actividadId, filas, usuario)` | En `transaccion()` con `SELECT … FROM actividades WHERE id=$1 FOR UPDATE`. Actividad `publicada` y `inicio <= ahora()` (FR-001; borrador, cancelada o futura → error). Cada `inscripcionId` debe estar entre las confirmadas de **esa** actividad (FR-006). `horas = (fin − inicio)` redondeado a 2 decimales (FR-003, cruza medianoche sin caso especial). Upsert por `inscripcion_id`: inserta o actualiza `asistio`, `horas`, `registrada_por = usuario.id`, `fecha_registro = ahora()`. Inscripciones no enviadas no cambian. | 409 `ASISTENCIA_NO_PERMITIDA` · 400 `DATOS_INVALIDOS` (con `campos`) · 404 |
| `horasDeUsuario(usuarioId)` | `listarInscripcionesDeUsuario(usuarioId)` → ids; `SUM(horas)` y desglose de las asistencias con `asistio = true` de esas inscripciones, unidas a `actividades` (título, inicio). Sin perfil de voluntario o sin asistencias → `{ total: 0, datos: [] }` (escenario 2.2). | — |

Sin plazo posterior (PA8.1): no se compara con `fin`. `registrable = estado = 'publicada' && inicio <= ahora()`.

## Dependencias

- **spec-007 (Nicole, en `main`)**: tabla `actividades`, `servicio.obtener`, derivado `celebrada`
  y `inscripciones.js` como único acceso a inscripciones.
- **spec-005 (Javi, en `main`)**:
  - Migración `006_voluntariado.sql` (tablas `voluntarios` e `inscripciones`), necesaria para la
    FK de `007` (research R2).
  - Dos funciones de solo lectura de su servicio, que `inscripciones.js` ya reexporta:
    `listarConfirmadasDeActividad(actividadId)` y `listarInscripcionesDeUsuario(usuarioId)`
    (research R3).
  - **FR-009** *(ya en spec-005 FR-009)*: no permitir cancelar una inscripción confirmada desde la hora de inicio de la
    actividad (research R6). Ya encaja con «el voluntario cancela antes del inicio» de
    modelo-datos.
  - Semilla con las 2 inscripciones confirmadas de «Recogida de ropa», la actividad celebrada de
    10:00–13:30.
- **spec-004 (Rubén)** solo **lee** `asistencias` (`SUM(horas) WHERE asistio`) para el informe.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
