# Contrato API: calendario del voluntario (spec-006)

Formato común (claves `camelCase`, fechas ISO con desfase de Madrid, errores
`{ error: { codigo, mensaje, campos? } }`): [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api).

## Recurso

**EntradaCalendario**:

```json
{
  "id": 31,
  "estado": "en_espera",
  "posicion": 1,
  "enCurso": false,
  "actividad": {
    "id": 12, "titulo": "Visita a la depuradora", "descripcion": "…",
    "proyecto": { "id": 1, "nombre": "Agua potable" },
    "inicio": "2026-11-18T11:00:00+01:00", "fin": "2026-11-18T13:00:00+01:00",
    "lugar": "Depuradora municipal", "requisitos": ""
  }
}
```

- `id` es el de la inscripción: es el que usa `PATCH /api/yo/inscripciones/:id` (HU-05).
- `posicion` solo en `en_espera`; si no, `null`.
- `enCurso` es `true` si la actividad ya ha empezado y aún no ha terminado; entonces no se puede cancelar.

## `GET /api/yo/calendario?desde=&hasta=` — voluntario

Las inscripciones `confirmada` y `en_espera` del usuario de la sesión en actividades publicadas que aún
no han terminado, por `inicio` ascendente (FR-002). `desde`/`hasta`: `aaaa-mm-dd`, días de Madrid
incluidos; con ellos, solo las actividades que se solapan con el intervalo (research R3). Cualquier otro
parámetro se ignora: no hay forma de pedir el calendario de otra persona (FR-006).

→ 200 `{ "datos": [EntradaCalendario], "total": n }` (sin inscripciones o sin perfil: `datos: []`).

| Caso | HTTP | `codigo` |
|---|---|---|
| Sin sesión | 401 | `NO_IDENTIFICADO` |
| Sin rol voluntario | 403 | `SIN_PERMISO` |
| `desde` o `hasta` mal escritas o imposibles | 400 | `DATOS_INVALIDOS` (`campos.desde` / `campos.hasta`: «Fecha no válida.») |
| `desde` posterior a `hasta` | 400 | `DATOS_INVALIDOS` (`campos.hasta`) |

## Rutas de HU-05 que usa el calendario

- `PATCH /api/yo/inscripciones/:id` con `{ "accion": "cancelar" }`: cancelar o salir de la lista de
  espera, con sus reglas y errores ([contrato de spec-005](../../spec-005/contracts/api-voluntariado.md#patch-apiyoinscripcionesid--voluntario)).
  Con el `id` de una inscripción de otro voluntario → 404.

## Lo que spec-006 usa de `actividades`

A través de `modulos/voluntariado/actividades.js`: `obtener(id)` → recurso `Actividad` de spec-007
(ya existe; solo se añade a la reexportación).
