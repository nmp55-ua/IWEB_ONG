# Contrato API: actividades (spec-007)

Formato común (claves `camelCase`, fechas ISO con desfase de Madrid, errores
`{ error: { codigo, mensaje, campos? } }`): [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api).

**Todas** las rutas: `requiereRol('coordinador')` → 401 sin sesión, 403 sin rol. `:id` solo
numérico. Cualquier coordinador accede a cualquier actividad (PA7.1).

## Recurso `Actividad`

```json
{
  "id": 12, "titulo": "Reparto de alimentos", "descripcion": "…",
  "proyecto": { "id": 2, "nombre": "Comedor social" },
  "inicio": "2026-11-15T10:00:00+01:00", "fin": "2026-11-15T13:30:00+01:00",
  "lugar": "Calle Mayor 3", "plazas": 10, "plazasLibres": 1, "requisitos": "",
  "estado": "publicada", "celebrada": false,
  "creadoEn": "2026-10-28T09:00:00+01:00", "actualizadoEn": "2026-10-28T09:00:00+01:00"
}
```

## `GET /api/actividades?estado=&proyectoId=`

Listado del coordinador: todas las actividades (cualquier estado), ordenadas por `inicio`
descendente. `estado` opcional (`borrador|publicada|cancelada`).
→ 200 `{ "datos": [Actividad], "total": n }`

## `POST /api/actividades`

Cuerpo: `{ titulo, descripcion, proyectoId, inicio, fin, lugar, plazas, requisitos? }`
→ 201 `Actividad` con `estado: "borrador"` · 400 `DATOS_INVALIDOS` con `campos`.

## `GET /api/actividades/:id`

→ 200 `Actividad` · 404 `NO_ENCONTRADO`.

## `PATCH /api/actividades/:id`

Una de estas dos formas:

- **Editar**: cualquier subconjunto de los campos de `POST` (sin `accion`).
- **Cambio de estado**: `{ "accion": "publicar" }` o `{ "accion": "cancelar" }`.

→ 200 `Actividad` actualizada.

| Caso | HTTP | `codigo` |
|---|---|---|
| Campos inválidos, fin ≤ inicio, inicio pasado, proyecto inactivo | 400 | `DATOS_INVALIDOS` (con `campos`) |
| Editar una cancelada o celebrada | 409 | `ACTIVIDAD_NO_EDITABLE` |
| Plazas por debajo de los confirmados | 409 | `PLAZAS_MENOR_QUE_INSCRITOS` (con `campos.plazas`) |
| Publicar algo que no es borrador; cancelar una cancelada o celebrada | 409 | `TRANSICION_NO_PERMITIDA` |
| `accion` desconocida, o `accion` junto con campos | 400 | `DATOS_INVALIDOS` |
| No existe | 404 | `NO_ENCONTRADO` |

Efectos secundarios (tras el `COMMIT`, sin deshacer si falla el correo):
- subir plazas en una publicada → promoción de la lista de espera + correo «plaza confirmada»;
- cambiar `inicio`, `fin` o `lugar` en una publicada → correo a confirmados y en espera;
- cancelar una publicada → inscripciones activas a `cancelada` + correo «actividad cancelada».

## `GET /api/actividades/:id/inscripciones`

```json
{
  "confirmadas": [{ "inscripcionId": 5, "nombre": "Ana", "apellidos": "López", "correo": "…", "telefono": "…", "fechaConfirmacion": "…" }],
  "enEspera":    [{ "inscripcionId": 9, "posicion": 1, "nombre": "…", "apellidos": "…", "correo": "…", "telefono": "…", "fechaInscripcion": "…" }]
}
```
→ 200 · 404. Solo inscripciones `confirmada` y `en_espera`; `enEspera` ordenada por `posicion`.

## Contrato con el servicio de voluntariado (spec-005)

| Función | Usa | Estado |
|---|---|---|
| `promoverListaEspera(actividadId, cliente)` → inscripciones promovidas `[{ inscripcionId, nombre, correo }]` | subir plazas (spec-007) y cancelar un voluntario (spec-005) | plan-comun §7; retorno **acordado con Javi** |
| `cancelarInscripcionesDeActividad(actividadId, cliente)` → inscripciones canceladas `[{ inscripcionId, nombre, correo, estadoAnterior }]` | cancelar | plan-comun §7; retorno **acordado con Javi** |
| `contarConfirmadas(actividadId, cliente)` → número | FR-007, `plazasLibres` | **acordado con Javi** |
| `listarInscripcionesDeActividad(actividadId)` → `{ confirmadas, enEspera }` | FR-009, avisos | **acordado con Javi** |

`actividades` accede a estas funciones solo a través de `modulos/actividades/inscripciones.js`.

En sentido contrario, spec-007 expone `avisarPlazaConfirmada(inscripcion, actividad)` en
`modulos/actividades/servicio.js`: spec-005 la llama tras el `COMMIT` de una cancelación para
cada inscripción devuelta por `promoverListaEspera` (**acordado con Javi**).
