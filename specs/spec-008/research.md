# Research: HU-08 — Registro de asistencia y acumulación de horas

Las decisiones técnicas generales están en [plan-comun.md](../plan-comun.md#decisiones-técnicas-research).
Aquí solo las propias de HU-08.

## R1. Total de horas derivado, una fila por inscripción

- **Decision**: `asistencias.inscripcion_id` es único; guardar es un upsert
  (`INSERT … ON CONFLICT (inscripcion_id) DO UPDATE`). El total es
  `SUM(horas) WHERE asistio = true`; no se guarda en ningún perfil.
- **Rationale**: es lo que fija modelo-datos. Repetir el guardado no duplica (FR-005) y pasar a
  «no asistió» resta solo (FR-004), así SC-001 se cumple por construcción.
- **Alternatives considered**: contador `horas_totales` en `voluntarios` (se descuadra y es tabla
  de Javi).

## R2. Migración `007_asistencias.sql` antes de que exista `inscripciones`

- **Decision**: `007` crea `asistencias` y añade la FK `inscripcion_id → inscripciones(id)
  ON DELETE RESTRICT` **solo si** la tabla `inscripciones` ya existe (bloque `DO` con
  `to_regclass('inscripciones')`). Cuando `006` esté en `main`, una base nueva aplica `006`
  antes que `007` y la FK se crea siempre; las bases de desarrollo creadas antes se rehacen
  (`docker compose down -v`, `migrar`, `semillas`).
- **Rationale**: spec-005 aún no ha empezado. Con la FK obligatoria, `migrar.js` se pararía en
  `007` y bloquearía la rama. La base de pruebas se crea desde cero, así que en CI y en la
  entrega la FK siempre existe.
- **Alternatives considered**: FK fija (bloquea hasta spec-005); sin FK nunca (rompe
  modelo-datos y principio VI); pedir el número `009` para la FK (dos migraciones para una tabla).

## R3. Acceso a inscripciones desde `actividades`

- **Decision**: igual que spec-007 R3, el módulo nunca consulta `inscripciones` ni `voluntarios`
  con SQL propio. Se añaden a `inscripciones.js` (provisional hasta spec-005, luego reexporta de
  `voluntariado/servicio.js`):
  - `listarConfirmadasDeActividad(actividadId)` →
    `[{ inscripcionId, nombre, apellidos, correo }]`.
  - `listarInscripcionesDeUsuario(usuarioId)` → `[{ inscripcionId, actividadId }]` (cualquier
    estado; sin voluntario → `[]`).
  La provisional devuelve `[]` como las de spec-007; para las pruebas se sustituye con
  `vi.mock`.
- **Rationale**: plan-comun §1 (servicio, nunca repositorio de otro) y la petición de no tocar
  `modulos/voluntariado`. La consulta de horas une `asistencias` y `actividades` (ambas de
  Nicole) filtrando por los ids recibidos.
- **Alternatives considered**: reutilizar `listarInscripcionesDeActividad` y filtrar
  `confirmadas` (válido para la pantalla, pero no sirve para `/yo/horas`); se mantiene una
  función propia para no depender de la forma de la lista de espera.
- **Pendiente**: acordar las dos funciones con Javi.

## R4. Un solo `PUT` con la lista completa

- **Decision**: `PUT /api/actividades/:id/asistencias` con
  `{ asistencias: [{ inscripcionId, asistio }] }` (1–500 filas, sin repetidos). Todo en una
  transacción: si una fila no es válida no se guarda ninguna.
- **Rationale**: SC-002 (20 personas en < 2 min) con un solo botón; PUT es idempotente, que es
  justo el escenario 1.3. Es la ruta fijada en plan-comun §4.
- **Alternatives considered**: un `PATCH` por persona (20 peticiones y estados intermedios).

## R5. Cuándo es registrable y cuántas horas

- **Decision**: `registrable = estado = 'publicada' AND inicio <= ahora()`, sin límite posterior
  (PA8.1). `horas = ROUND(EXTRACT(EPOCH FROM fin − inicio) / 3600, 2)`, calculado en SQL y
  copiado a la fila al guardar. Las actividades celebradas no se pueden editar (spec-007), así
  que las horas copiadas no se desfasan.
- **Rationale**: `fin − inicio` sobre `TIMESTAMPTZ` resuelve la medianoche (22:00–01:00 = 3 h) y
  los cambios de hora sin casos especiales.
- **Alternatives considered**: calcular en JavaScript (riesgo de redondeo y zona horaria).

## R6. Inscripción cancelada con asistencia (FR-009)

- **Decision**: la regla vive en spec-005: su cancelación por el voluntario se rechaza si
  `inicio <= ahora()`. La cancelación de la actividad (spec-007) ya no es posible una vez
  celebrada. Así una asistencia nunca apunta a una inscripción cancelada. HU-08 además solo
  acepta inscripciones confirmadas al guardar (FR-006).
- **Rationale**: Clarifications 2026-11-04; coincide con la transición de modelo-datos
  («el voluntario antes del inicio»).
- **Ya cubierto**: spec-005 FR-009 solo permite cancelar «hasta el inicio de la actividad»; Javi lo implementa en su servicio. Se comprueba al integrar (como T023 de spec-007).

## R7. Dónde ve el voluntario sus horas

- **Decision**: página `/mis-horas` con enlace «Mis horas» en el menú para el rol `voluntario`.
  `GET /api/yo/horas` solo exige sesión; un usuario sin perfil de voluntario recibe 0 h.
- **Rationale**: el «perfil» de voluntario es de spec-005 (`PUT /api/yo/perfil-voluntario`) y no
  existe aún; una página propia no toca su módulo. Ruta sin identificador (plan-comun §3), así
  que nadie puede pedir las horas de otro (escenario 2.3).
- **Alternatives considered**: incrustar el bloque en la página de perfil de spec-005 (se puede
  hacer después reutilizando `MisHoras.jsx`).
