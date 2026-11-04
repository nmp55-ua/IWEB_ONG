# Data Model: HU-07

La definición de referencia de `actividades` está en
[modelo-datos.md](../modelo-datos.md#actividades-spec-007). Aquí solo se concreta la migración
`005_actividades.sql` y las reglas que aplica el servicio.

## Tabla `actividades` (migración 005)

| Columna | Tipo SQL | Restricción en BD |
|---|---|---|
| `id` | `BIGSERIAL` | PK |
| `proyecto_id` | `BIGINT NOT NULL` | FK → `proyectos(id)` |
| `titulo` | `TEXT NOT NULL` | `CHECK (btrim(titulo) <> '')` |
| `descripcion` | `TEXT NOT NULL` | `CHECK (btrim(descripcion) <> '')` |
| `inicio` | `TIMESTAMPTZ NOT NULL` | — |
| `fin` | `TIMESTAMPTZ NOT NULL` | `CHECK (fin > inicio)` |
| `lugar` | `TEXT NOT NULL` | `CHECK (btrim(lugar) <> '')` |
| `plazas` | `INTEGER NOT NULL` | `CHECK (plazas > 0)` |
| `requisitos` | `TEXT NOT NULL DEFAULT ''` | — |
| `estado` | `TEXT NOT NULL DEFAULT 'borrador'` | `CHECK (estado IN ('borrador','publicada','cancelada'))` |
| `creada_por` | `BIGINT NOT NULL` | FK → `usuarios(id)` |
| `creado_en`, `actualizado_en` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | — |

Índice: `(estado, inicio)` para el listado público de spec-005 y el del coordinador.

**Solo en el servicio** (dependen de «ahora» o de otra tabla): `inicio > ahora()`, proyecto
`activo`, `plazas ≥ confirmadas`, transiciones permitidas.

## Estados

```text
borrador ──publicar──► publicada ──(inicio <= ahora)──► «celebrada» (derivado)
   │                       │
   └──cancelar──► cancelada ◄──cancelar (solo si no celebrada)
```

| Estado actual | Editar | Publicar | Cancelar |
|---|---|---|---|
| borrador | sí | sí, si inicio futuro y proyecto activo | sí (sin avisos) |
| publicada (no celebrada) | sí (avisos si cambian fecha/hora/lugar) | 409 | sí (avisos + inscripciones a `cancelada`) |
| celebrada | 409 | 409 | 409 |
| cancelada | 409 | 409 | 409 |

## Valores derivados que expone la API

- `plazasLibres = plazas − contarConfirmadas(id)`.
- `celebrada = estado = 'publicada' AND inicio <= ahora()`.
- `posicion` en la lista de espera: la calcula voluntariado (modelo-datos, inscripciones).

## Validación de entrada (zod, en `controlador.js`)

| Campo API | Regla | Mensaje |
|---|---|---|
| `titulo` | texto, recortado, no vacío | «Indica el título.» |
| `descripcion` | ídem | «Indica la descripción.» |
| `proyectoId` | entero > 0 | «Elige un proyecto.» |
| `inicio`, `fin` | ISO 8601 con desfase | «Indica la fecha y hora de inicio/fin.» |
| `lugar` | texto, no vacío | «Indica el lugar.» |
| `plazas` | entero > 0 | «Las plazas deben ser un número entero mayor que cero.» |
| `requisitos` | texto, opcional (`''`) | — |

Reglas cruzadas en el servicio, con `campos`: `fin` «El fin debe ser posterior al inicio.»;
`inicio` «El inicio debe ser posterior al momento actual.»; `proyectoId` «El proyecto no está
activo.»; `plazas` (409) «Hay N inscritos confirmados; no puedes dejar menos plazas.»
