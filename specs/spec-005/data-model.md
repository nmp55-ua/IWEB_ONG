# Data Model: HU-05

La definición de referencia está en [modelo-datos.md](../modelo-datos.md#voluntarios-spec-005).
Aquí se concreta la migración `006_voluntariado.sql` y las reglas que aplica el servicio.

## Tabla `voluntarios` (migración 006)

| Columna | Tipo SQL | Restricción en BD |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `usuario_id` | `BIGINT NOT NULL` | `UNIQUE`, FK → `usuarios(id)` `ON DELETE RESTRICT` |
| `nombre`, `apellidos`, `correo`, `telefono` | `TEXT NOT NULL` | `CHECK (btrim(…) <> '')` |
| `creado_en`, `actualizado_en` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | — |

## Tabla `inscripciones` (migración 006)

| Columna | Tipo SQL | Restricción en BD |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `voluntario_id` | `BIGINT NOT NULL` | FK → `voluntarios(id)` `ON DELETE RESTRICT` |
| `actividad_id` | `BIGINT NOT NULL` | FK → `actividades(id)` `ON DELETE RESTRICT` |
| `estado` | `TEXT NOT NULL` | `CHECK (estado IN ('confirmada','en_espera','cancelada'))` |
| `acepta_requisitos` | `BOOLEAN NOT NULL` | `CHECK (acepta_requisitos)` |
| `fecha_inscripcion` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | orden de llegada |
| `fecha_confirmacion` | `TIMESTAMPTZ` | obligatoria si `estado = 'confirmada'` |
| `fecha_cancelacion` | `TIMESTAMPTZ` | obligatoria si `estado = 'cancelada'` |
| `creado_en`, `actualizado_en` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | — |

Índices:
- Único parcial `(voluntario_id, actividad_id) WHERE estado IN ('confirmada','en_espera')`:
  una sola inscripción activa por actividad; tras cancelar se puede volver a apuntar (FR-008).
- `(actividad_id, estado, fecha_inscripcion)`: confirmadas, lista de espera e inscritos.

## Estados y transiciones

```text
(alta) ──hay plaza──────────────► confirmada ──cancela el voluntario──┐
   │                                   ▲                              ├─► cancelada
   └──sin plaza y lo pide──► en_espera ┘ (se libera una plaza, HU-07) │
                                 └──cancela el voluntario o se ───────┘
                                    cancela la actividad (HU-07)
```

- `confirmada` y `en_espera` son **activas**. `cancelada` es final; no se borra nada.
- Al pasar a `confirmada` se rellena `fecha_confirmacion`; al pasar a `cancelada`,
  `fecha_cancelacion`. Estas tres fechas son de registro (cuándo pasó), así que se guardan con
  `now()` de la base de datos. Las reglas que dependen del momento actual (inicio futuro, actividad
  celebrada) usan `ahora()` de `fechas.js`.
- El voluntario solo cancela antes del `inicio` de la actividad (FR-009).

## Valores derivados (no se guardan)

- `confirmadas` = inscripciones `confirmada` de la actividad.
- `plazasLibres` = `plazas − confirmadas` (lo calcula `aRecurso` de spec-007 con
  `contarConfirmadas`).
- `posicion` de una `en_espera` = 1 + número de `en_espera` de la misma actividad con
  `fecha_inscripcion` anterior (desempate por `id`). Al salir alguien, las de detrás avanzan
  solas.

## Validación de entrada (zod en `controlador.js`)

| Campo | Regla | Mensaje |
|---|---|---|
| `aceptaRequisitos` | tiene que ser `true` | «Confirma que cumples los requisitos de la actividad.» |
| `listaEspera` | booleano, opcional (`false`) | — |
| `nombre` | texto no vacío | «Indica tu nombre.» |
| `apellidos` | texto no vacío | «Indica tus apellidos.» |
| `correo` | correo válido | «Introduce un correo válido.» |
| `telefono` | 9 a 15 cifras, con `+` y espacios opcionales | «Introduce un teléfono válido.» |
| `proyectoId` (filtro) | entero positivo, opcional | «Proyecto no válido.» |
| `desde`, `hasta` (filtro) | `aaaa-mm-dd`, opcionales; `desde` ≤ `hasta` | «Fecha no válida.» / «La fecha "desde" no puede ser posterior a "hasta".» |
