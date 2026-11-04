# Implementation Plan: HU-05 — Consulta e inscripción en actividades de voluntariado

**Branch**: `spec-005` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Responsable**: *Javi* · **Revisor**: *Nicole*

**Base común**: [plan-comun.md](../plan-comun.md) · [modelo-datos.md](../modelo-datos.md).
Este plan no repite lo que allí se fija (pila, estructura, sesión, formato de la API y de
errores, correo, pruebas, semillas). Solo añade lo propio de HU-05.

## Summary

Cualquiera ve en `/actividades` las actividades publicadas y futuras, con plazas libres y
requisitos, y las filtra por proyecto y fechas. Un voluntario se inscribe confirmando los
requisitos (la primera vez deja sus datos de contacto), entra en la lista de espera si lo pide
cuando no hay plazas y cancela su inscripción hasta el inicio. El módulo
`backend/src/modulos/voluntariado/` es dueño de `voluntarios` e `inscripciones` (migración
`006_voluntariado.sql`) y ofrece a `actividades` las seis funciones acordadas con Nicole. A las
actividades accede solo a través del servicio de `actividades` ([research.md](research.md) R2).

## Technical Context

Todo según [plan-comun.md](../plan-comun.md#technical-context): JavaScript ES modules en
Node.js 22, Express 4 + `pg` + `zod`, PostgreSQL 16, Astro 5 + React 19 + Tailwind 3,
Vitest + Supertest. No se añade ninguna dependencia.

**Performance Goals**: SC-001 (encontrar e inscribirse en < 2 min): una página con filtros y una
ventana de inscripción.
**Constraints**: aforo garantizado con peticiones simultáneas (FR-006, SC-002); «ahora» siempre
de `servicios-comunes/fechas.js`.
**Scale/Scope**: 1 página, 5 rutas, 2 tablas, 6 funciones para otros módulos.

No queda ningún NEEDS CLARIFICATION: PA5.1, PA5.2 y las otras dos preguntas se resolvieron en
`/speckit-clarify` ([refinamiento/clarify-1.md](refinamiento/clarify-1.md)).

## Constitution Check

*Antes del diseño y revisado tras él: todo cumple.*

| Principio | Cómo lo cumple HU-05 |
|---|---|
| I. Simplicidad | Sin comprobación de requisitos ni de solapes (PA5.1, PA5.2); `posicion` y `plazasLibres` derivados; el aforo, con el bloqueo de fila de plan-comun. |
| II. Cero alcance fantasma | Solo FR-001…FR-011. Sin detalle público aparte, sin avisos propios por correo, sin exportar. |
| III. Verificable | Cada escenario tiene un paso en [quickstart.md](quickstart.md). |
| IV. Español | Mensajes en español; fechas con `formatearFecha` y `formatearHora`. |
| V. Seguridad y datos | Inscribirse exige sesión y rol voluntario, comprobado en el servidor; cancelar solo las propias (404 si no es suya); del voluntario solo se piden los datos de contacto. |
| VI. Nada se borra | Cancelar cambia el estado a `cancelada`; no hay `DELETE`. |
| VIII. Una sola aplicación | `Layout`, componentes comunes, `lib/api.js`, `ErrorApi`, `transaccion()`; avisos de plaza con `avisarPlazaConfirmada` de spec-007. |
| XII. Cambios comunes con acuerdo | `bloquearActividad` en el servicio de `actividades` y `vitest.config.js` se acuerdan con Nicole y con el grupo (R2, R7). |

## Project Structure

### Documentation (this feature)

```text
specs/spec-005/
├── spec.md
├── plan.md              ← este fichero
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api-voluntariado.md
├── refinamiento/        ← clarify, analyze, converge
└── tasks.md             ← lo crea /speckit-tasks
```

### Source Code (solo lo que añade esta spec)

```text
backend/
├── vitest.config.js                ← ficheros de prueba en serie (comparten la base de pruebas, R7)
└── src/
    ├── db/migraciones/006_voluntariado.sql
    ├── db/semillas/voluntariado.js ← voluntarios e inscripciones de prueba de plan-comun §8
    ├── modulos/voluntariado/
    │   ├── rutas.js                ← rutas de HU-05; :id solo numérico
    │   ├── controlador.js          ← esquemas zod y forma de las respuestas
    │   ├── servicio.js             ← reglas (abajo) y funciones para actividades
    │   ├── repositorio.js          ← SQL de voluntarios e inscripciones
    │   ├── actividades.js          ← único punto de acceso al servicio de actividades
    │   └── servicio.test.js
    ├── modulos/actividades/inscripciones.js ← pasa a solo reexportar desde ../voluntariado/servicio.js
    ├── modulos/actividades/servicio.js      ← + bloquearActividad(id, cliente) (acordado con Nicole, R2)
    └── app.js                      ← descomentar api.use(rutasVoluntariado)

frontend/src/
├── pages/actividades/index.astro
├── components/voluntariado/ActividadesDisponibles.jsx  ← filtros y tarjetas
├── components/voluntariado/TarjetaActividad.jsx        ← datos, plazas y botón según el estado
├── components/voluntariado/FormInscripcion.jsx         ← requisitos, datos de contacto y lista de espera
├── components/voluntariado/CancelarInscripcion.jsx     ← confirmación (la reutiliza HU-06)
└── components/comunes/Menu.jsx                         ← descomentar el enlace «Actividades»
```

**Structure Decision**: aplicación web de plan-comun §1; todo dentro del módulo `voluntariado`,
salvo las tres líneas de `bloquearActividad` en el servicio de `actividades`.

## Reglas de `servicio.js`

| Operación | Reglas | Error |
|---|---|---|
| `listarDisponibles({ proyectoId, desde, hasta }, usuario)` | Publicadas con `inicio > ahora()` (FR-001); `desde`/`hasta` son días de Madrid, ambos incluidos; orden por `inicio`. Si el usuario tiene perfil de voluntario, cada actividad lleva `miInscripcion` (su inscripción activa o `null`). | 400 `DATOS_INVALIDOS` |
| `obtenerPerfil(usuario)` / `guardarPerfil(usuario, datos)` | Solo rol voluntario. `guardar` crea o actualiza el Voluntario del usuario (FR-011). | 403 `SIN_PERMISO` · 404 · 400 |
| `inscribir(actividadId, { aceptaRequisitos, listaEspera }, usuario)` | Rol voluntario (FR-004, con su mensaje) y perfil hecho. En `transaccion()`: `bloquearActividad`; tiene que ser publicada y no celebrada (FR-008); sin otra inscripción activa (FR-008); si `confirmadas < plazas` → `confirmada` (FR-005); si no, `en_espera` solo con `listaEspera: true` (FR-007) y si no, 409. | 403 · 409 `PERFIL_INCOMPLETO` · 400 · 404 · 409 `ACTIVIDAD_CELEBRADA` · 409 `YA_INSCRITO` · 409 `PLAZAS_AGOTADAS` |
| `cancelar(inscripcionId, usuario)` | Solo la propia (si no, 404); estado `confirmada` o `en_espera`; antes del inicio. En `transaccion()`: `bloquearActividad`, pasar a `cancelada`; si estaba confirmada, `promoverListaEspera`. Tras el `COMMIT`, `avisarPlazaConfirmada` por cada promovida (FR-009, acuerdo T023). | 404 · 409 `INSCRIPCION_NO_CANCELABLE` |
| Funciones para `actividades` | Las del [contrato](contracts/api-voluntariado.md#funciones-para-el-módulo-actividades). Las que escriben reciben el `cliente` de la transacción de quien llama. | — |

El aforo se garantiza como dice plan-comun: toda operación que cambia confirmadas o plazas
bloquea antes la fila de la actividad (`SELECT … FOR UPDATE`), así que inscribir, cancelar,
editar plazas y cancelar la actividad se ejecutan de una en una por actividad.

## Dependencias

- **spec-007 (Nicole)**: Actividad y sus estados. `voluntariado` solo la usa a través de
  `modulos/voluntariado/actividades.js`, que reexporta `listar`, `bloquearActividad` y
  `avisarPlazaConfirmada` de `modulos/actividades/servicio.js`. `bloquearActividad` es nueva
  (R2). Tras esta spec, `actividades/inscripciones.js` deja de ser provisional y solo reexporta.
- **spec-007, T023** *(acordado con Nicole)*: la cancelación de un voluntario promueve la lista
  de espera en la misma transacción y avisa con `avisarPlazaConfirmada`.
- **spec-008 (Nicole)**: `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario`
  (su research R3, pedidas el 04/11). La migración 006 va antes a `main` en un PR propio
  (PR #2), porque `asistencias` tiene una FK a `inscripciones`.
- **spec-006 (Javi)**: usa las inscripciones y reutiliza `CancelarInscripcion.jsx`.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
