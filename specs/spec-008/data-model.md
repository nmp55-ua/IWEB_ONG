# Data Model: HU-08 — Asistencia

Fuente común: [modelo-datos.md § asistencias](../modelo-datos.md#asistencias-spec-008). Aquí solo
se concreta la migración y las reglas de HU-08.

## `asistencias` (dueño: spec-008, migración `007_asistencias.sql`)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `inscripcion_id` | BIGINT → inscripciones | `NOT NULL`, `UNIQUE`; FK `ON DELETE RESTRICT` (research R2); la inscripción debe estar `confirmada` al guardar (FR-006, en el servicio) |
| `asistio` | BOOLEAN | `NOT NULL` |
| `horas` | NUMERIC(5,2) | `NOT NULL`, `CHECK (horas > 0)`; `fin − inicio` de la actividad al guardar (FR-003) |
| `registrada_por` | BIGINT → usuarios | `NOT NULL`, `ON DELETE RESTRICT`; coordinador que guardó por última vez |
| `fecha_registro` | TIMESTAMPTZ | `NOT NULL`; última modificación (`ahora()`) |

No hay `actividad_id`: se obtiene de la inscripción. Índice: el `UNIQUE` de `inscripcion_id`
basta para el upsert y para filtrar por los ids de un voluntario.

## Estados y transiciones

Una fila no existe (= «sin registrar») hasta el primer guardado.

```text
(sin registrar) ──guardar asistio=true──► asistió  ◄──corregir──►  no asistió ◄──guardar asistio=false── (sin registrar)
```

Nunca se borra la fila (principio VI); corregir solo cambia `asistio`, `registrada_por` y
`fecha_registro`.

## Precondiciones (servicio, no BD)

- Actividad `publicada` con `inicio <= ahora()` (FR-001), sin límite posterior (PA8.1).
- `inscripcionId` ∈ confirmadas de esa actividad (FR-006).
- Solo rol `coordinador` (FR-008).

## Derivados (no se guardan)

- **Total de horas** de un usuario = `SUM(horas)` de sus asistencias con `asistio = true` (SC-001).
- **Desglose**: una línea por asistencia con `asistio = true`: actividad (título), fecha de inicio,
  horas. Orden: fecha de inicio descendente.
- **Horas de la actividad** = `ROUND(EXTRACT(EPOCH FROM fin − inicio)/3600, 2)` (modelo-datos).

## Entidades que se usan sin redefinir

- `actividades` (spec-007): `estado`, `inicio`, `fin`, `titulo`.
- `inscripciones`, `voluntarios` (spec-005): solo vía `inscripciones.js` (research R3).
