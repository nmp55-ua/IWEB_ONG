# Contrato API: asistencias y horas (spec-008)

Formato común (claves `camelCase`, fechas ISO con desfase de Madrid, errores
`{ error: { codigo, mensaje, campos? } }`): [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api).
`:id` solo numérico. Las horas viajan como número (`3.5`); la interfaz las muestra con
`formatearHoras` (`3,5 h`).

## `GET /api/actividades/:id/asistencias`

`requiereRol('coordinador')` → 401 / 403. Cualquier coordinador, cualquier actividad.

→ 200

```json
{
  "actividad": {
    "id": 12, "titulo": "Recogida de ropa", "estado": "publicada",
    "inicio": "2026-11-01T10:00:00+01:00", "fin": "2026-11-01T13:30:00+01:00",
    "horas": 3.5, "registrable": true
  },
  "datos": [
    { "inscripcionId": 40, "nombre": "Lucía", "apellidos": "Pérez", "correo": "voluntario@ong.test", "asistio": true },
    { "inscripcionId": 41, "nombre": "Mario", "apellidos": "Gil", "correo": "voluntario2@ong.test", "asistio": null }
  ],
  "total": 2
}
```

Solo inscripciones **confirmadas** (nunca en espera ni canceladas). `asistio: null` = sin
registrar. Si `registrable` es `false`, la interfaz muestra la lista en solo lectura con el motivo.

Errores: 404 `NO_ENCONTRADO`.

## `PUT /api/actividades/:id/asistencias`

`requiereRol('coordinador')` → 401 / 403.

Cuerpo:

```json
{ "asistencias": [ { "inscripcionId": 40, "asistio": true }, { "inscripcionId": 41, "asistio": false } ] }
```

- `asistencias`: 1–500 elementos; `inscripcionId` entero positivo sin repetir; `asistio` booleano.
- Upsert por inscripción; las no enviadas no cambian. Todo o nada (una transacción).
- Idempotente: repetir el mismo cuerpo no cambia ningún total.

→ 200 con el mismo cuerpo que el `GET` (estado tras guardar).

Errores:

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `DATOS_INVALIDOS` | Cuerpo mal formado, o algún `inscripcionId` no es una inscripción confirmada de esta actividad (`campos: { "asistencias.N": "…" }`) |
| 404 | `NO_ENCONTRADO` | La actividad no existe |
| 409 | `ASISTENCIA_NO_PERMITIDA` | Actividad en borrador, cancelada o que aún no ha comenzado; el mensaje dice cuál |

## `GET /api/yo/horas`

`requiereRol()` → 401 sin sesión. Sin parámetros: siempre las del usuario de la sesión (no hay
forma de pedir las de otro). Sin perfil de voluntario o sin asistencias → total 0 y lista vacía.

→ 200

```json
{
  "totalHoras": 5.5,
  "datos": [
    { "actividadId": 12, "titulo": "Recogida de ropa", "inicio": "2026-11-01T10:00:00+01:00", "horas": 3.5 },
    { "actividadId": 9, "titulo": "Banco de alimentos", "inicio": "2026-10-20T17:00:00+02:00", "horas": 2 }
  ],
  "total": 2
}
```

## Contrato con spec-005 (vía `modulos/actividades/inscripciones.js`)

| Función | Devuelve |
|---|---|
| `listarConfirmadasDeActividad(actividadId)` | `[{ inscripcionId, nombre, apellidos, correo }]` |
| `listarInscripcionesDeUsuario(usuarioId)` | `[{ inscripcionId, actividadId }]` (`[]` si no es voluntario) |

Más la regla FR-009: spec-005 rechaza cancelar una inscripción si la actividad ya ha comenzado.
