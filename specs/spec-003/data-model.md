# Data Model: HU-03 — Certificado fiscal anual de donaciones

Definición única en [modelo-datos.md](../modelo-datos.md#certificados_fiscales-spec-003). Aquí solo
se concreta la migración `008_certificados.sql` y las reglas que aplica el servicio.

## certificados_fiscales (spec-003, migración 008)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio, `ON DELETE RESTRICT` |
| `ejercicio` | INTEGER | obligatorio, `CHECK (ejercicio BETWEEN 2000 AND 9999)`; menor que el año en curso (lo comprueba el servicio, no es una restricción inmutable) |
| `importe_total` | NUMERIC(10,2) | obligatorio, `CHECK (importe_total > 0)` |
| `fecha_emision` | DATE | obligatoria; día de Madrid de la emisión o de la última regeneración |
| `codigo_verificacion` | TEXT | obligatorio, `UNIQUE`, `CHECK` de formato `^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$` |
| `creado_en` | TIMESTAMPTZ | `DEFAULT now()` |
| `actualizado_en` | TIMESTAMPTZ | `DEFAULT now()`; se actualiza al regenerar |

Único: `(donante_id, ejercicio)` — como máximo un certificado por Donante y ejercicio (FR-008).

## Ciclo de vida

```text
(sin certificado) ──emitir: total > 0 en un ejercicio cerrado──► vigente
vigente ──regenerar: el total actual difiere del guardado──► vigente (mismo id; total, fecha y código nuevos)
```

No hay estados guardados ni borrado. Un código que ya no está en la tabla es «no válido».

## Valores derivados (no se guardan)

- **Total del ejercicio** de un Donante: `SUM(aportaciones.importe)` con `estado = 'confirmada'` y
  `fecha_cobro ∈ [rangoAnio(ejercicio).desde, rangoAnio(ejercicio).hasta)`.
- **Ejercicio en curso**: `anioEnMadrid(ahora())`.
- **NIF/NIE enmascarado**: `***` + últimos 4 dígitos + `*` (research R5).
- **PDF**: se genera en cada descarga con los datos de la fila y del Donante (research R7).

## Tablas de otros módulos que se leen (sin modificarlas)

| Tabla (dueño) | Columnas | Uso |
|---|---|---|
| `donantes` (spec-001) | `id`, `usuario_id`, `nombre`, `apellidos`, `nif_nie`, `correo` | Datos del certificado, destinatario del correo y propiedad (`usuario_id`). |
| `aportaciones` (spec-001) | `donante_id`, `importe`, `estado`, `fecha_cobro` | Total del ejercicio. |
