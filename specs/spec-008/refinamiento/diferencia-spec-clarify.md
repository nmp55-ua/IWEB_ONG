# Diferencia entre la especificación anterior y la revisada — spec-008

Versión anterior: `spec.md` tras el `specify` conjunto y el reparto (commit `a6eadf5`, 28/10/2026).
Versión revisada: `spec.md` tras `clarify` (commit `a4eb2ca`, 04/11/2026).

Se obtiene con `git diff a6eadf5 a4eb2ca -- specs/spec-008/spec.md`. Las líneas que empiezan por «-»
son de la versión anterior y las que empiezan por «+», de la revisada. Las decisiones que explican
cada cambio, con su justificación, están en los informes de `clarify` de esta carpeta.

```diff
@@ -10,13 +10,23 @@
 
 **Input**: Descripción del SI-13: "Ese mismo coordinador necesita, además, registrar quién ha asistido realmente a cada actividad, de forma que las horas de voluntariado dedicadas por cada persona se vayan acumulando automáticamente en su perfil, como reconocimiento a su compromiso continuado."
 
+## Clarifications
+
+### Session 2026-11-04
+
+- Q: ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia? → A: Sin plazo; se puede registrar y corregir en cualquier momento.
+- Q: ¿Se pueden registrar asistencias parciales? → A: No en v1; «asistió» suma siempre la duración completa de la actividad.
+- Q: ¿Qué coordinadores pueden registrar o corregir la asistencia? → A: Cualquier usuario con rol coordinador, en cualquier actividad.
+- Q: ¿Desde qué momento se puede registrar la asistencia? → A: Desde la hora de inicio, incluida la actividad en curso.
+- Q: ¿Qué pasa si una inscripción con asistencia se cancela? → A: Desde la hora de inicio de la actividad la inscripción no se puede cancelar (ya lo exige spec-005 FR-009: solo se cancela hasta el inicio; como la asistencia se registra desde el inicio, nunca se solapan).
+
 ## User Scenarios & Testing *(mandatory)*
 
 ### User Story 1 - Registrar la asistencia (Priority: P1)
 
 Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente.
 
-Una vez iniciada o terminada la actividad, el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió», y puede corregirlo.
+Desde la hora de inicio de la actividad (también mientras está en curso), el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió», y puede corregirlo.
 
 **Why this priority**: Cierra el ciclo del voluntariado y alimenta los informes (HU-04).
 
@@ -53,20 +63,22 @@ Como voluntario, quiero ver en mi perfil el total de horas acumuladas y el detal
 
 - Actividad cancelada: no admite registro de asistencia.
 - Actividad que cruza la medianoche: las horas se calculan correctamente (22:00 a 01:00 = 3 h).
+- Inscripción de una actividad ya iniciada: no se puede cancelar, así que una Asistencia nunca queda colgando de una inscripción cancelada.
 - Una corrección cambia el estado de la Asistencia; el registro no se elimina.
 
 ## Requirements *(mandatory)*
 
 ### Functional Requirements
 
-- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades ya iniciadas o terminadas y no canceladas.
+- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades publicadas (no canceladas) cuya hora de inicio ya ha pasado, incluidas las que están en curso, sin plazo máximo posterior para registrar o corregir.
 - **FR-002**: El coordinador MUST poder marcar cada inscrito confirmado como «asistió» o «no asistió», y corregirlo.
-- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio.
+- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio; en v1 no hay asistencias parciales: «asistió» suma siempre la duración completa y el coordinador no edita las horas.
 - **FR-004**: Marcar «asistió» MUST sumar las horas al total del voluntario; cambiar a «no asistió» MUST restarlas.
 - **FR-005**: Una misma asistencia MUST NOT sumar horas más de una vez.
 - **FR-006**: El sistema MUST NOT permitir registrar asistencia de una persona sin inscripción confirmada en la actividad.
 - **FR-007**: El voluntario MUST ver en su perfil su total de horas y el desglose por actividad; solo el suyo.
-- **FR-008**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias; la comprobación se hace en el servidor.
+- **FR-008**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias, y cualquiera de ellos puede hacerlo en cualquier actividad (no solo quien la creó); la comprobación se hace en el servidor.
+- **FR-009**: Desde la hora de inicio de la actividad, una Inscripción confirmada MUST NOT poder cancelarse (ya cubierto por spec-005 FR-009, que solo permite cancelar hasta el inicio).
 
 ### Key Entities
 
@@ -75,7 +87,7 @@ Como voluntario, quiero ver en mi perfil el total de horas acumuladas y el detal
 
 ## Dependencies
 
-- **spec-005 (C)**: Inscripción confirmada y Voluntario.
+- **spec-005 (Javi)**: Inscripción confirmada y Voluntario. FR-009 de spec-008 ya lo cubre spec-005 FR-009 (cancelar solo hasta el inicio de la actividad), así que no hace falta un acuerdo nuevo.
 - **spec-004 (B)** consume Asistencia para las horas de voluntariado del informe.
 
 ## Success Criteria *(mandatory)*
@@ -88,8 +100,3 @@ Como voluntario, quiero ver en mi perfil el total de horas acumuladas y el detal
 ## Assumptions
 
 - Las horas se muestran con un decimal (3,5 h).
-
-## Open Questions (para `/speckit-clarify`)
-
-- **PA8.1**: ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia?
-- **PA8.2**: ¿Se pueden registrar asistencias parciales (por ejemplo, llegó una hora tarde)? (Propuesta: no en v1.)
```
