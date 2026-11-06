# Data Model: HU-06

HU-06 no crea tablas, columnas ni migraciones. El calendario es una **vista** que se calcula en cada
petición a partir de lo que ya existe:

| Fuente | Dueño | Qué se usa |
|---|---|---|
| `inscripciones` | spec-005 | `id`, `actividad_id`, `estado` (`confirmada` o `en_espera`) y `fecha_inscripcion` (para la posición) |
| `voluntarios` | spec-005 | `usuario_id`, para llegar a las inscripciones del usuario de la sesión |
| `actividades` | spec-007 | a través de `obtener(id)` de su servicio: título, descripción, proyecto, `inicio`, `fin`, lugar, requisitos y estado |

Las definiciones de referencia están en [modelo-datos.md](../modelo-datos.md#inscripciones-spec-005)
y en el [data-model de spec-005](../spec-005/data-model.md).

## Entrada del calendario (derivada, no se guarda)

Una por cada inscripción activa del usuario cuya actividad cumple las reglas de abajo.

| Campo | De dónde sale |
|---|---|
| `id` | `inscripciones.id` (es el que usa la cancelación de HU-05) |
| `estado` | `confirmada` o `en_espera` |
| `posicion` | solo en `en_espera`: 1 + `en_espera` de la misma actividad que llegaron antes (desempate por `id`), como en spec-005; si no, `null` |
| `enCurso` | `actividad.inicio <= ahora()` |
| `actividad` | `id`, `titulo`, `descripcion`, `proyecto { id, nombre }`, `inicio`, `fin`, `lugar`, `requisitos` |

No se incluyen las plazas ni datos de otros voluntarios: el calendario no los necesita (principio V).

## Reglas de la vista

- Solo inscripciones del usuario de la sesión (`voluntarios.usuario_id = req.usuario.id`) en estado
  `confirmada` o `en_espera` (FR-002, FR-006). Las `cancelada` no salen, y al cancelar una actividad
  spec-007 cancela sus inscripciones, así que tampoco sale.
- La actividad tiene que estar `publicada` y no haber terminado: `fin > ahora()` (clarify Q3).
- Con `desde` y/o `hasta` (días de Madrid, ambos incluidos): `fin > inicioDia(desde)` e
  `inicio < inicioDia(hasta + 1 día)`, es decir, la actividad se solapa con el intervalo.
- Orden: `inicio` ascendente y, a igualdad, `id` de la inscripción.
- Un usuario con rol de voluntario pero sin perfil (nunca se ha inscrito) tiene el calendario vacío.

## Días de la vista mensual (en la interfaz)

- Un día es una fecha de calendario de `Europe/Madrid` (`aaaa-mm-dd`).
- Una actividad ocupa los días desde el de su `inicio` hasta el de `fin − 1 ms`, ambos incluidos.
- Las semanas van de lunes a domingo; el mes se pinta con las semanas completas que lo contienen y se
  pide al servidor con `desde` = primer lunes y `hasta` = último domingo.

## Validación de entrada (zod en `controlador.js`)

| Campo | Regla | Mensaje |
|---|---|---|
| `desde`, `hasta` | `aaaa-mm-dd` que exista, opcionales; `desde` ≤ `hasta` | «Fecha no válida.» / «La fecha «desde» no puede ser posterior a «hasta».» |
| cualquier otro parámetro | se descarta | — |
