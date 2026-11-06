# Feature Specification: HU-08 — Registro de asistencia y acumulación de horas

**Feature Branch**: `spec-008`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Rubén*

**Input**: Descripción del SI-13: "Ese mismo coordinador necesita, además, registrar quién ha asistido realmente a cada actividad, de forma que las horas de voluntariado dedicadas por cada persona se vayan acumulando automáticamente en su perfil, como reconocimiento a su compromiso continuado."

## Clarifications

### Session 2026-11-04

- Q: ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia? → A: Sin plazo; se puede registrar y corregir en cualquier momento.
- Q: ¿Se pueden registrar asistencias parciales? → A: No en v1; «asistió» suma siempre la duración completa de la actividad.
- Q: ¿Qué coordinadores pueden registrar o corregir la asistencia? → A: Cualquier usuario con rol coordinador, en cualquier actividad.
- Q: ¿Desde qué momento se puede registrar la asistencia? → A: Desde la hora de inicio, incluida la actividad en curso.
- Q: ¿Qué pasa si una inscripción con asistencia se cancela? → A: Desde la hora de inicio de la actividad la inscripción no se puede cancelar (ya lo exige spec-005 FR-009: solo se cancela hasta el inicio; como la asistencia se registra desde el inicio, nunca se solapan).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar la asistencia (Priority: P1)

Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente.

Desde la hora de inicio de la actividad (también mientras está en curso), el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió», y puede corregirlo.

**Why this priority**: Cierra el ciclo del voluntariado y alimenta los informes (HU-04).

**Independent Test**: Con una actividad de prueba de 10:00 a 13:30 ya celebrada y dos inscritos confirmados, el coordinador marca a uno como asistente; su total sube 3,5 horas y el del otro no cambia.

**Acceptance Scenarios**:

1. **Given** una actividad que todavía no ha comenzado, **When** el coordinador intenta registrar asistencia, **Then** el sistema no lo permite.
2. **Given** una actividad de 10:00 a 13:30 ya celebrada, **When** el coordinador marca a un voluntario como asistente, **Then** se suman 3,5 horas a su total.
3. **Given** una asistencia ya registrada, **When** el coordinador vuelve a guardarla sin cambios, **Then** las horas no se duplican.
4. **Given** un voluntario marcado como asistente por error, **When** el coordinador lo cambia a «no asistió», **Then** se restan las 3,5 horas.
5. **Given** la lista de asistencia, **When** el coordinador la abre, **Then** solo aparecen los voluntarios con inscripción confirmada, no los de lista de espera ni los cancelados.
6. **Given** un usuario sin rol de coordinador, **When** intenta registrar o corregir asistencias, **Then** el sistema deniega el acceso.

---

### User Story 2 - Ver mis horas acumuladas (Priority: P2)

Como voluntario, quiero ver en mi perfil el total de horas acumuladas y el detalle por actividad, como reconocimiento a mi compromiso.

**Why this priority**: Depende de que existan asistencias registradas.

**Independent Test**: Un voluntario de prueba con dos asistencias (3,5 h y 2 h) abre su perfil y ve 5,5 horas y el desglose de las dos actividades.

**Acceptance Scenarios**:

1. **Given** un voluntario con asistencias registradas, **When** abre su perfil, **Then** ve su total de horas y el desglose por actividad con fecha (dd/mm/aaaa) y horas de cada una.
2. **Given** un voluntario sin asistencias, **When** abre su perfil, **Then** ve 0 horas y un mensaje claro.
3. **Given** un voluntario identificado, **When** consulta sus horas, **Then** solo puede ver las suyas y la aplicación no ofrece forma de pedir las de otro.

---

### Edge Cases

- Actividad cancelada: no admite registro de asistencia.
- Actividad que cruza la medianoche: las horas se calculan correctamente (22:00 a 01:00 = 3 h).
- Inscripción de una actividad ya iniciada: no se puede cancelar, así que una Asistencia nunca queda colgando de una inscripción cancelada.
- Una corrección cambia el estado de la Asistencia; el registro no se elimina.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades publicadas (no canceladas) cuya hora de inicio ya ha pasado, incluidas las que están en curso, sin plazo máximo posterior para registrar o corregir.
- **FR-002**: El coordinador MUST poder marcar cada inscrito confirmado como «asistió» o «no asistió», y corregirlo.
- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio; en v1 no hay asistencias parciales: «asistió» suma siempre la duración completa y el coordinador no edita las horas.
- **FR-004**: Marcar «asistió» MUST sumar las horas al total del voluntario; cambiar a «no asistió» MUST restarlas.
- **FR-005**: Una misma asistencia MUST NOT sumar horas más de una vez.
- **FR-006**: El sistema MUST NOT permitir registrar asistencia de una persona sin inscripción confirmada en la actividad.
- **FR-007**: El voluntario MUST ver en su perfil (la página `/mis-horas`) su total de horas y el desglose por actividad; solo el suyo.
- **FR-008**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias, y cualquiera de ellos puede hacerlo en cualquier actividad (no solo quien la creó); la comprobación se hace en el servidor.
- **FR-009**: Desde la hora de inicio de la actividad, una Inscripción confirmada MUST NOT poder cancelarse (ya cubierto por spec-005 FR-009, que solo permite cancelar hasta el inicio).

### Key Entities

- **Asistencia** *(dueño: spec-008)*: Inscripción, asistió (sí / no), horas, fecha de registro, Usuario coordinador que la registra.
- **Inscripción**, **Voluntario** *(dueño: spec-005)*, **Actividad** *(dueño: spec-007)*: se usan sin redefinirlas.

## Dependencies

- **spec-005 (Javi)**: Inscripción confirmada y Voluntario. FR-009 de spec-008 ya lo cubre spec-005 FR-009 (cancelar solo hasta el inicio de la actividad), así que no hace falta un acuerdo nuevo.
- **spec-004 (Rubén)** consume Asistencia para las horas de voluntariado del informe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El total de horas del perfil coincide siempre con la suma de sus asistencias marcadas como «asistió».
- **SC-002**: El coordinador registra la asistencia de una actividad de 20 personas en menos de 2 minutos.

## Assumptions

- Las horas se guardan con 2 decimales y se muestran con 1 (3,5 h). Por el redondeo de la interfaz, la suma de los valores mostrados puede no coincidir exactamente con el total mostrado (1,75 h + 1,75 h se ve como 1,8 h + 1,8 h, con un total de 3,5 h); SC-001 se refiere a los valores guardados.
- «Su perfil», en esta historia, es la página `/mis-horas`.
