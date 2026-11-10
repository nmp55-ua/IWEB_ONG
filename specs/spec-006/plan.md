# Implementation Plan: HU-06 — Calendario personal del voluntario

**Branch**: `spec-006` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Responsable**: *Javi* · **Revisora**: *Nada*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan no repite lo que allí se fija (pila, estructura, sesión, formato de la API y de
errores, pruebas, semillas). Solo añade lo propio de HU-06.

## Summary

El voluntario abre *Mi calendario* (`/mi-calendario`) y ve primero la lista de sus actividades que
aún no han terminado, por fecha, con las de lista de espera etiquetadas; a un clic tiene la vista
mensual. Al elegir una actividad ve su detalle y, si todavía no ha empezado, puede cancelar o salir
de la lista de espera con la cancelación de HU-05. Los datos salen de una sola ruta nueva,
`GET /api/yo/calendario?desde&hasta`, que solo da las inscripciones del usuario de la sesión. No hay
tablas ni migraciones nuevas: el calendario es una vista sobre `inscripciones` (spec-005) y
`actividades` (spec-007), y a las actividades se llega a través de su servicio
([research.md](research.md) R2).

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, PostgreSQL 16, Astro 5 + React 19 + Tailwind 3,
Vitest + Supertest. No se añade ninguna dependencia (ni librería de calendario: research R6).

**Performance Goals**: SC-002 (la siguiente actividad en menos de 10 s): la lista se abre primero
y empieza por la siguiente.
**Constraints**: hora peninsular (`Europe/Madrid`) en el filtro del servidor, en el reparto por días
de la vista mensual y en lo que se muestra. Qué sale y si se puede cancelar lo decide el servidor con
«ahora» de `servicios-comunes/fechas.js`; el navegador solo usa su reloj para elegir el mes que se abre,
el día que se marca como hoy y hasta dónde se puede retroceder (research R6).
**Scale/Scope**: 1 página, 1 ruta, 0 tablas, 0 funciones nuevas para otros módulos.

No queda ningún NEEDS CLARIFICATION: PA6.1 y las otras tres preguntas se resolvieron en
`/speckit-clarify` ([refinamiento/clarify-1.md](refinamiento/clarify-1.md)).

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-06 |
|---|---|
| I. Simplicidad | Una ruta y una vista sin tablas; sin librería de calendario, sin consultas periódicas ni avisos desde el servidor (clarify Q2); sin exportar (PA6.1). |
| II. Cero alcance fantasma | Solo FR-001…FR-006. La posición en la lista de espera ya la da HU-05 (su escenario 3); no se añaden recordatorios ni .ics. |
| III. Verificable | Cada escenario y caso límite tiene un paso en [quickstart.md](quickstart.md), con semillas preparadas para ello (research R7); el de una actividad en curso, con `AHORA_SIMULADO`. |
| IV. Español | Fechas dd/mm/aaaa y horas con `formatearFecha` y `formatearHora`; semana de lunes a domingo; días de Madrid. |
| V. Seguridad y datos | Ruta personal `/yo/...` con `requiereRol('voluntario')`; el servicio busca a partir de `req.usuario.id` y no acepta el identificador de nadie; la respuesta no lleva datos de otros voluntarios. |
| VI. Nada se borra | Cancelar desde el calendario es la cancelación de HU-05 (cambio de estado). |
| VIII. Una sola aplicación | `Layout`, `Menu`, componentes comunes, `lib/api.js`, `lib/formato.js`; reutiliza `CancelarInscripcion.jsx`, `listarActivasDeUsuario` y la validación de días de HU-05. |
| XII. Cambios comunes con acuerdo | Solo se tocan dos cosas compartidas: la línea de `Menu.jsx` reservada para spec-006 y los datos de prueba, con 4 actividades nuevas en `semillas/voluntariado.js` (de Javi). Se avisa al grupo, porque otras specs usan las actividades de prueba, y en especial a Nicole, que es la dueña de `actividades` (research R7, T013). |

## Project Structure

### Documentation (this feature)

```text
specs/spec-006/
├── spec.md
├── plan.md              ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api-calendario.md
├── refinamiento/        ← clarify, analyze, prueba manual, converge
└── tasks.md             ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/src/
├── db/semillas/voluntariado.js            ← + 4 actividades de prueba de HU-06 y sus inscripciones (R7)
└── modulos/voluntariado/
    ├── actividades.js                     ← + reexportar obtener del servicio de actividades (R2)
    ├── repositorio.js                     ← sin cambios (listarActivasDeUsuario ya da la posición)
    ├── servicio.js                        ← + calendario(usuario, { desde, hasta })
    ├── controlador.js                     ← + esquema de desde/hasta y controlador calendario
    ├── rutas.js                           ← + GET /yo/calendario con requiereRol('voluntario')
    └── calendario.test.js                 ← pruebas de HU-06

frontend/src/
├── pages/mi-calendario.astro
├── components/voluntariado/CalendarioVoluntario.jsx  ← carga, pestañas Lista / Mes y actualización (R5)
├── components/voluntariado/ListaCalendario.jsx       ← vista de lista
├── components/voluntariado/MesCalendario.jsx         ← cuadrícula del mes y actividades del día elegido
├── components/voluntariado/ActividadCalendario.jsx   ← resumen, detalle y cancelar (reutiliza CancelarInscripcion)
├── components/voluntariado/fechas.js                 ← días de Madrid, semanas del mes y horario
├── components/voluntariado/TarjetaActividad.jsx      ← importa horario() de fechas.js en vez de tenerlo dentro
└── components/comunes/Menu.jsx                       ← descomentar el enlace «Mi calendario»
```

**Structure Decision**: aplicación web de plan-comun §1; todo dentro del módulo `voluntariado`.
Fuera de él solo cambian la línea del enlace en `Menu.jsx` (ya reservada para spec-006), los datos de
prueba comunes (desde el fichero de semillas de Javi) y el texto del quickstart de spec-005, que es de
Javi (research R7).

## Reglas de `servicio.js`

| Operación | Reglas | Error |
|---|---|---|
| `calendario(usuario, { desde, hasta })` | Las inscripciones `confirmada` y `en_espera` del usuario de la sesión (`listarActivasDeUsuario(usuario.id)`, con su posición). De cada una, la actividad con `obtener(id)` del servicio de `actividades`. Se queda con las publicadas cuyo `fin > ahora()` (FR-002, clarify Q3). Con `desde`/`hasta` (días de Madrid, ambos incluidos), solo las que se solapan con ese intervalo: `fin > inicio de desde` e `inicio < inicio del día siguiente a hasta` (R3). Orden por `inicio` y, a igualdad, por id de inscripción. `enCurso = inicio <= ahora()`. Sin perfil de voluntario, lista vacía. | 401 · 403 · 400 `DATOS_INVALIDOS` |

Cancelar desde el calendario usa `PATCH /api/yo/inscripciones/:id` de HU-05 sin cambios: solo la
propia (404 si no), solo antes del inicio (409), promoción de la lista de espera y su correo.

## Dependencias

- **spec-005 (Javi)**: `inscripciones`, `voluntarios`, `listarActivasDeUsuario` (con `posicion`),
  la ruta de cancelar y `CancelarInscripcion.jsx`, que se hizo para que la reutilizara HU-06.
- **spec-007 (Nicole)**: Actividad y sus estados; `obtener(id)`, que ya existe en
  `modulos/actividades/servicio.js` y se reexporta desde `voluntariado/actividades.js` sin tocar su
  código. Al cancelar una actividad sus inscripciones pasan a `cancelada`
  (`cancelarInscripcionesDeActividad`), así que desaparece del calendario sin hacer nada más; la
  promoción desde la lista de espera también es suya (PA7.2).
- **Semillas (Nicole)**: hacen falta 4 actividades publicadas más (R7). Se crean en
  `semillas/voluntariado.js`, sin tocar `semillas/actividades.js`; se le avisa por si prefiere
  tenerlas en el suyo.
- **spec-008 (Nicole)**: no le afecta; las inscripciones de Recogida de ropa no cambian.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
