# Implementation Plan: HU-07 — Gestión de actividades, plazas y lista de espera

**Branch**: `spec-007` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Responsable**: *Nicole* · **Revisor**: *Javi*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan **no repite** lo que allí se fija (pila, estructura, autenticación, formato de la API y
de errores, correo, pruebas, semillas). Solo añade lo propio de HU-07.

## Summary

El coordinador crea actividades en borrador, las publica, las edita y las cancela desde
`/coordinacion/actividades`. El módulo `backend/src/modulos/actividades/` (dueño de la tabla
`actividades`, migración `005_actividades.sql`) aplica las reglas: validaciones de FR-002/FR-003,
transiciones de estado, plazas ≥ confirmados (FR-007) y avisos por correo. La lista de espera
(FR-005/FR-006) se apoya en el servicio de `voluntariado` (dueño de `inscripciones`), a través de
los contratos entre módulos ya acordados en plan-comun §7, más dos funciones de solo lectura que
se piden a Javi (ver [research.md](research.md) R3).

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, PostgreSQL 16, Astro 5 + React 19 + Tailwind 3,
Vitest + Supertest. No se añade ninguna dependencia.

**Performance Goals**: SC-001 (crear y publicar en < 3 min): un formulario y un botón.
**Constraints**: hora peninsular; «ahora» siempre de `servicios-comunes/fechas.js`
(`AHORA_SIMULADO` en pruebas).
**Scale/Scope**: 3 páginas, 5 rutas, 1 tabla.

No queda ningún NEEDS CLARIFICATION: PA7.1 y PA7.2 se resolvieron en `/speckit-clarify`.

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-07 |
|---|---|
| I. Simplicidad | Promoción inmediata sin plazos ni temporizadores (PA7.2); cualquier coordinador gestiona cualquier actividad (PA7.1), sin tabla nueva. `plazasLibres` derivado. |
| II. Cero alcance fantasma | Solo FR-001…FR-011; sin duplicar actividades, sin plantillas, sin borrar. |
| III. Verificable | Cada escenario tiene un paso en [quickstart.md](quickstart.md). |
| IV. Español | Mensajes de error y correos en español; fechas con `formatearFecha`. |
| V. Seguridad | `requiereRol('coordinador')` en todas las rutas; la lista de inscritos solo la ve el coordinador. |
| VI. Nada se borra | No hay `DELETE`; descartar = cancelar; las inscripciones pasan a `cancelada`. |
| VIII. Una sola aplicación | Usa `Layout`, componentes comunes, `lib/api.js`, `ErrorApi`, `correo.js`, `transaccion()`. No toca `inscripciones` directamente. |
| XII. Cambios comunes con acuerdo | Las dos funciones nuevas del servicio de voluntariado y el correo de «cambio de fecha o lugar» se acuerdan con Javi y con el grupo (R3, R5). |

## Project Structure

### Documentation (this feature)

```text
specs/spec-007/
├── spec.md
├── plan.md              ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api-actividades.md
└── tasks.md             ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/src/
├── db/migraciones/005_actividades.sql
├── db/semillas/                    ← añadir las actividades de prueba de plan-comun §8
└── modulos/actividades/
    ├── rutas.js                    ← requiereRol('coordinador'); :id solo numérico
    ├── controlador.js              ← esquemas zod de creación y edición
    ├── servicio.js                 ← reglas (abajo)
    ├── repositorio.js              ← SQL de actividades
    ├── inscripciones.js            ← único punto de acceso al servicio de voluntariado (provisional hasta spec-005)
    └── servicio.test.js
backend/src/app.js                  ← descomentar api.use(rutasActividades)

frontend/src/
├── pages/coordinacion/actividades/index.astro      ← listado de todas (todos los estados)
├── pages/coordinacion/actividades/nueva.astro      ← formulario de alta
├── pages/coordinacion/actividades/[id].astro       ← detalle: editar, publicar, cancelar, inscritos y espera
├── components/actividades/ListaActividades.jsx
├── components/actividades/FormActividad.jsx        ← alta y edición (mismo componente)
├── components/actividades/fechasFormulario.js      ← localAIsoMadrid / isoALocalMadrid (datetime-local ↔ ISO de Madrid)
├── components/actividades/DetalleActividad.jsx     ← botones de estado + tablas de inscritos y espera
├── components/actividades/estados.js               ← textoEstado (incluida «Celebrada») y esEditable, comunes a lista y detalle
└── components/comunes/Menu.jsx                     ← descomentar el enlace «Gestionar actividades»
```

**Structure Decision**: aplicación web de plan-comun §1; todo dentro del módulo `actividades`.

## Reglas de `servicio.js`

| Operación | Reglas | Error |
|---|---|---|
| `crear(datos, usuario)` | FR-002; `fin > inicio`; `inicio > ahora()`; proyecto existe y `activo`. Estado `borrador`, `creada_por = usuario.id`. | 400 `DATOS_INVALIDOS` con `campos` |
| `editar(id, cambios)` | No `cancelada` ni celebrada (`inicio <= ahora()`). Mismas validaciones sobre el resultado final. Si `plazas` < confirmados → FR-007. Si suben plazas y está publicada → `promoverListaEspera(id)`. Si es publicada y cambian `inicio`, `fin` o `lugar` → correo a confirmados y en espera (FR-011). | 409 `ACTIVIDAD_NO_EDITABLE` · 409 `PLAZAS_MENOR_QUE_INSCRITOS` · 400 |
| `publicar(id)` | Solo desde `borrador`; vuelve a validar inicio futuro y proyecto activo (FR-003). | 409 `TRANSICION_NO_PERMITIDA` · 400 `DATOS_INVALIDOS` |
| `cancelar(id)` | Desde `borrador` o `publicada` no celebrada. Si era publicada: `cancelarInscripcionesDeActividad(id)` + correo a los afectados (FR-008). Borrador: sin avisos. | 409 `TRANSICION_NO_PERMITIDA` |
| `obtener(id)` / `listar(filtros)` | Cualquier coordinador, cualquier actividad (PA7.1). Devuelve `plazasLibres` y `celebrada` derivados. | 404 `NO_ENCONTRADO` |
| `listarInscripciones(id)` | Confirmados y lista de espera con posición (FR-009), vía `inscripciones.js`. | 404 |
| `avisarPlazaConfirmada(inscripcion, actividad)` | Único correo «plaza confirmada» (título, fecha dd/mm/aaaa, hora y lugar). Lo usan `editar` al subir plazas y spec-005 al cancelar un voluntario. | — (si falla, se registra) |

Toda operación que cambia plazas o estado se hace en `transaccion()` con
`SELECT … FROM actividades WHERE id = $1 FOR UPDATE` (plan-comun, decisión de bloqueo), y los
correos se envían **después** del `COMMIT`; si fallan, se registra y no se deshace nada.

No hay transición `publicada → borrador`: `PATCH { accion: 'borrador' }` no existe.

## Dependencias

- **spec-005 (Javi)** *(acordado con Javi)*: `promoverListaEspera(actividadId,
  cliente)` → inscripciones promovidas y `cancelarInscripcionesDeActividad(actividadId,
  cliente)` → inscripciones canceladas (plan-comun §7, con valor de retorno), y, nuevas,
  `contarConfirmadas(actividadId, cliente)` y `listarInscripcionesDeActividad(actividadId)`.
  `actividades` solo las usa a través de `modulos/actividades/inscripciones.js`, que mientras
  spec-005 no exista contiene una versión provisional y después solo las reexporta desde
  `modulos/voluntariado/servicio.js`. No se crea nada dentro del módulo de Javi (R3).
- **Cancelación de un voluntario (spec-005)**: llama a `promoverListaEspera` y, tras su
  `COMMIT`, a `avisarPlazaConfirmada` de spec-007 para cada promovida, de modo que el correo
  «plaza confirmada» sale de una única función.
- **Migración 005** se sube a `main` en un PR pequeño en cuanto esté (plan-comun §7), porque
  `006_voluntariado.sql` tiene una FK a `actividades`.
- **spec-004 / spec-008** solo leen `actividades` y el derivado «celebrada».

## Complexity Tracking

Sin violaciones de la constitución que justificar.
