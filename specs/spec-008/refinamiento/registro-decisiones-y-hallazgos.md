# Registro de decisiones y hallazgos — spec-008 (HU-08)

**Responsable**: Nicole · **Revisor**: Rubén · **Herramienta**: Spec Kit 1.0.4 (comandos `/speckit-*`) con Claude Code

## 1. Decisiones de clarify (enunciado §5.1)

Sesión del 04/11/2026, commit `a4eb2ca`. La diferencia entre la spec anterior y la revisada es
ese commit (`git show a4eb2ca -- specs/spec-008/spec.md`).

| # | Pregunta | Respuesta | Justificación | Criterios afectados |
|---|---|---|---|---|
| C1 | ¿Hay plazo para registrar o corregir la asistencia? (PA8.1) | Sin plazo | La narrativa no fija plazo; es lo más simple (principio I) y permite corregir errores siempre. Un informe de HU-04 se calcula en el momento, así que una corrección posterior no deja datos guardados incoherentes | FR-001 |
| C2 | ¿Asistencias parciales? (PA8.2) | No en v1: «asistió» suma la duración completa | Mantiene el registro rápido (SC-002: 20 personas en < 2 min) y evita un campo editable de horas | FR-003, SC-002 |
| C3 | ¿Qué coordinadores pueden registrar asistencia? | Cualquier coordinador, cualquier actividad | Coherente con spec-007 C1: quien puede gestionar una actividad puede pasarle lista | FR-008 |
| C4 | ¿Desde qué momento se registra? | Desde la hora de inicio, también en curso | Coherente con spec-007, donde una actividad cuenta como celebrada desde su inicio; permite pasar lista durante la actividad. Las horas son siempre fin − inicio, así que el momento no las cambia | FR-001, US1 |
| C5 | ¿Qué pasa si se cancela una inscripción con asistencia? | No puede ocurrir | spec-005 FR-009 solo permite cancelar hasta el inicio, y la asistencia solo se registra desde el inicio: los dos momentos no se solapan. No requiere acuerdo nuevo con Javi | FR-009 |

## 2. Hallazgos de analyze (enunciado §5.2)

| ID | Informe | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| U1 | analyze-1 | Alta | Con solo los ids de inscripción no se obtenían título ni fecha de la actividad | Sumar con los pares `{ inscripcionId, actividadId }` de `listarInscripcionesDeUsuario` | Nicole | Cerrado (`d7e9e61`) |
| I4 | analyze-1 | Alta | US1 no se podía comprobar en la aplicación sin `/mis-horas` (principio III) | Validar 1.2–1.4 con T015–T019; MVP = US1 + US2 | Nicole | Cerrado (`d7e9e61`) |
| I1–I3, I5–I9, U2–U6 | analyze-1 | Media/Baja | Forma del contrato, semilla sin listar, horas en SQL, «perfil» = `/mis-horas`, escenario de acceso ajeno, mensajes, datos de prueba | Aplicadas las 13 propuestas | Nicole | Cerrado (`d7e9e61`) |
| U7 | analyze-2 | Media | SC-002 no se podía cronometrar: no había actividad celebrada con 20 confirmados | Inserción temporal solo en desarrollo, descrita en el quickstart | Nicole | Cerrado (`8879578`); cronometrado en 40 s |
| I10 | analyze-2 | Media | ¿Se envía la lista entera o solo lo marcado? | Solo las filas marcadas; «Guardar» desactivado si no hay ninguna | Nicole | Cerrado (`8879578`) |
| U8–U10, I11, I12 | analyze-2 | Baja | Conversión de NUMERIC, nombres de funciones, terminología | Aplicadas | Nicole | Cerrado (`8879578`) |
| I13, I14 | analyze-3 | Baja | `[P]` en T019 y nota del checklist | Corregidos | Nicole | Cerrado (`f8d0367`); analyze-4 sin hallazgos |

Además, durante el plan se descartó una clave foránea condicional en `007_asistencias.sql` (bases con
estructuras distintas según el orden de las migraciones): se pidió adelantar la 006 de Javi (`c031d5f`).

## 3. Brechas de converge (enunciado §5.3)

| ID | Tipo | Origen | Tarea | Responsable · revisor | Prueba antes / después | Estado |
|---|---|---|---|---|---|---|
| F1 | Contradice | `modelo-datos.md` (reglas generales) | T023 | Nicole · Rubén | Antes: `asistencias` sin `creado_en`/`actualizado_en`. Después: columnas presentes en `ong` y `ong_test`; 111 pruebas | Cerrado (`7d050e7`) |
| F2 | Parcial | Constitución IV | T024 | Nicole · Rubén | Antes: mensajes de zod en inglés en el PUT. Después: 9 de 10 cuerpos inválidos en español | Cerrado (`7d050e7`) |
| F3 | Parcial | Constitución IV / T024 | T025 | Nicole · Rubén | Antes: «Expected object, received array». Después: «El cuerpo debe ser un objeto con asistencias.» | Cerrado (`825e66e`); converge-3 sin hallazgos |
