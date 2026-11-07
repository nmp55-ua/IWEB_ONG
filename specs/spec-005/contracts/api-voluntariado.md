# Contrato API: voluntariado (spec-005)

Formato común (claves `camelCase`, fechas ISO con desfase de Madrid, errores
`{ error: { codigo, mensaje, campos? } }`): [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api).
`:id` solo numérico.

## Recursos

**ActividadDisponible** (sin datos internos del coordinador):

```json
{
  "id": 12, "titulo": "Limpieza de playa", "descripcion": "…",
  "proyecto": { "id": 1, "nombre": "Agua potable" },
  "inicio": "2026-11-18T10:00:00+01:00", "fin": "2026-11-18T13:00:00+01:00",
  "lugar": "Playa de San Juan", "plazas": 10, "plazasLibres": 1, "requisitos": "Traer guantes.",
  "miInscripcion": { "id": 31, "estado": "en_espera", "posicion": 2 }
}
```

`miInscripcion` es la inscripción activa del usuario identificado en esa actividad, o `null`
(también sin sesión o sin perfil de voluntario).

**Inscripción**:

```json
{
  "id": 31, "actividadId": 12, "estado": "en_espera", "posicion": 2,
  "fechaInscripcion": "…", "fechaConfirmacion": null, "fechaCancelacion": null
}
```

`posicion` solo en `en_espera`; si no, `null`.

**Voluntario**: `{ "nombre": "Marta", "apellidos": "Ruiz", "correo": "…", "telefono": "600 000 000" }`

## `GET /api/actividades/disponibles?proyectoId=&desde=&hasta=` — público

Publicadas con inicio futuro (FR-001), por `inicio` ascendente. `desde`/`hasta`: `aaaa-mm-dd`,
días de Madrid incluidos (research R8).
→ 200 `{ "datos": [ActividadDisponible], "total": n }` · 400 `DATOS_INVALIDOS` con `campos`.

## `GET /api/yo/perfil-voluntario` · `PUT /api/yo/perfil-voluntario`

`PUT` cuerpo: `{ nombre, apellidos, correo, telefono }` (crea o actualiza).
→ 200 `Voluntario` · 401 `NO_IDENTIFICADO` · 403 `SIN_PERMISO` (sin rol voluntario) ·
404 `NO_ENCONTRADO` (`GET` sin perfil todavía) · 400 `DATOS_INVALIDOS` con `campos`.

## `POST /api/actividades/:id/inscripciones` — voluntario

Cuerpo: `{ "aceptaRequisitos": true, "listaEspera": false }`.
→ 201 `Inscripción` (`confirmada`, o `en_espera` si no hay plaza y `listaEspera: true`).

| Caso | HTTP | `codigo` |
|---|---|---|
| Sin sesión | 401 | `NO_IDENTIFICADO` |
| Sin rol voluntario | 403 | `SIN_PERMISO` («Necesitas una cuenta de voluntario para inscribirte en actividades.») |
| Sin perfil de voluntario | 409 | `PERFIL_INCOMPLETO` |
| `aceptaRequisitos` distinto de `true` | 400 | `DATOS_INVALIDOS` (`campos.aceptaRequisitos`) |
| No existe, en borrador o cancelada | 404 | `NO_ENCONTRADO` |
| Ya empezada o celebrada | 409 | `ACTIVIDAD_CELEBRADA` |
| Ya tiene una inscripción activa en ella | 409 | `YA_INSCRITO` |
| Sin plazas y sin `listaEspera` | 409 | `PLAZAS_AGOTADAS` |

## `PATCH /api/yo/inscripciones/:id` — voluntario

Cuerpo: `{ "accion": "cancelar" }`. → 200 `Inscripción` con `estado: "cancelada"`.

| Caso | HTTP | `codigo` |
|---|---|---|
| Sin sesión / sin rol | 401 / 403 | `NO_IDENTIFICADO` / `SIN_PERMISO` |
| No existe o no es suya | 404 | `NO_ENCONTRADO` |
| Ya cancelada, o la actividad ya ha empezado | 409 | `INSCRIPCION_NO_CANCELABLE` |
| `accion` distinta de `cancelar` | 400 | `DATOS_INVALIDOS` |

Efecto secundario: si estaba `confirmada`, en la misma transacción se promueve la lista de
espera y, tras el `COMMIT`, cada persona promovida recibe el correo de `avisarPlazaConfirmada`
(spec-007). Si el correo falla, no se deshace nada.

## Funciones para el módulo `actividades`

Exportadas por `modulos/voluntariado/servicio.js`. `actividades` las usa solo a través de
`modulos/actividades/inscripciones.js`, que las reexporta. `cliente` es opcional: si se pasa, la
consulta va dentro de la transacción de quien llama.

| Función | Devuelve | La usa |
|---|---|---|
| `contarConfirmadas(actividadId, cliente)` | número | spec-007 (FR-007, `plazasLibres`) |
| `listarInscripcionesDeActividad(actividadId)` | `{ confirmadas: [{ inscripcionId, nombre, apellidos, correo, telefono, fechaConfirmacion }], enEspera: [{ inscripcionId, posicion, nombre, apellidos, correo, telefono, fechaInscripcion }] }` | spec-007 (FR-009, avisos) |
| `promoverListaEspera(actividadId, cliente)` | promovidas `[{ inscripcionId, nombre, correo }]`: confirma, por orden de llegada, tantas en espera como plazas libres haya | spec-007 (subir plazas) y la cancelación de spec-005 |
| `cancelarInscripcionesDeActividad(actividadId, cliente)` | canceladas `[{ inscripcionId, nombre, correo, estadoAnterior }]` | spec-007 (cancelar actividad) |
| `listarConfirmadasDeActividad(actividadId)` | `[{ inscripcionId, nombre, apellidos, correo }]` | spec-008 |
| `listarInscripcionesDeUsuario(usuarioId)` | `[{ inscripcionId, actividadId }]` en cualquier estado; sin perfil → `[]` | spec-008 |

## Lo que spec-005 usa de `actividades`

A través de `modulos/voluntariado/actividades.js`: `listar({ estado, proyectoId })`,
`avisarPlazaConfirmada(inscripcion, actividad)` y `bloquearActividad(id, cliente)` → recurso
`Actividad` con la fila bloqueada hasta el final de la transacción, o `null` (nueva, research R2).
