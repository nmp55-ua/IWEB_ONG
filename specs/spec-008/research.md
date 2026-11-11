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

## R2. Migración `007_asistencias.sql` con clave foránea a `inscripciones`

- **Decision**: `007` crea `asistencias` con la FK `inscripcion_id → inscripciones(id)
  ON DELETE RESTRICT` siempre, sin comprobar si la tabla existe.
- **Rationale**: `006_voluntariado.sql` ya está en `main` y se aplica antes que `007`, de modo que
  `inscripciones` siempre existe al migrar. Es lo que fija modelo-datos.
- **Alternatives considered**: crear la FK solo si la tabla existe (innecesario con `006` en
  `main`); sin FK (rompe modelo-datos y principio VI).

## R3. Acceso a inscripciones desde `actividades`

- **Decision**: igual que spec-007 R3, el módulo nunca consulta `inscripciones` ni `voluntarios`
  con SQL propio. Usa estas funciones del servicio de voluntariado, que `inscripciones.js` ya
  reexporta de `voluntariado/servicio.js`:
  - `listarConfirmadasDeActividad(actividadId)` →
    `[{ inscripcionId, nombre, apellidos, correo }]`.
  - `listarInscripcionesDeUsuario(usuarioId)` → `[{ inscripcionId, actividadId }]` (cualquier
    estado; sin voluntario → `[]`).
- **Rationale**: plan-comun §1 (servicio, nunca repositorio de otro) y la petición de no tocar
  `modulos/voluntariado`. `asistencias` no tiene `actividad_id`, así que la consulta de horas recibe
  los pares `{ inscripcionId, actividadId }` de `listarInscripcionesDeUsuario` y con ellos enlaza
  `asistencias` y `actividades` (ambas de Nicole), sin consultar `inscripciones`.
- **Alternatives considered**: reutilizar `listarInscripcionesDeActividad` y filtrar
  `confirmadas` (válido para la pantalla, pero no sirve para `/yo/horas`); se mantiene una
  función propia para no depender de la forma de la lista de espera.

## R4. Un solo `PUT` con las filas marcadas

- **Decision**: `PUT /api/actividades/:id/asistencias` con
  `{ asistencias: [{ inscripcionId, asistio }] }` (1–500 filas, sin repetidos). Se envían solo
  las filas marcadas («asistió» o «no asistió»); las no enviadas no cambian. Todo en una
  transacción: si una fila no es válida no se guarda ninguna.
- **Rationale**: SC-002 (20 personas en < 2 min) con un solo botón; PUT es idempotente, que es
  justo el escenario 1.3. Es la ruta fijada en plan-comun §4.
- **Alternatives considered**: un `PATCH` por persona (20 peticiones y estados intermedios).

## R5. Cuándo es registrable y cuántas horas

- **Decision**: `registrable = estado = 'publicada' AND inicio <= ahora()`, sin límite posterior
  (Clarifications 2026-11-04). `horas = ROUND(EXTRACT(EPOCH FROM fin − inicio) / 3600, 2)`, calculado en SQL y
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
- **Rationale**: el perfil de voluntario de spec-005 existe en la API (`GET` y
  `PUT /api/yo/perfil-voluntario`), pero no tiene página propia en `frontend/src/pages`: solo se
  usa dentro de `FormInscripcion.jsx`, al inscribirse. Por eso las horas van en una página propia,
  que no toca su módulo. Ruta sin identificador (plan-comun §3), así que nadie puede pedir las
  horas de otro (escenario 2.3).
- **Alternatives considered**: mostrar las horas en el formulario de inscripción (no es donde el
  voluntario consulta su perfil); crear una página de perfil de voluntario (añade alcance que
  HU-08 no necesita). Si más adelante existe esa página, puede reutilizar `MisHoras.jsx`.
