# Feature Specification: HU-08 — Registro de asistencia y acumulación de horas

**Feature Branch**: `spec-008`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Rubén*

**Input**: Descripción del SI-13: "Ese mismo coordinador necesita, además, registrar quién ha asistido realmente a cada actividad, de forma que las horas de voluntariado dedicadas por cada persona se vayan acumulando automáticamente en su perfil, como reconocimiento a su compromiso continuado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar la asistencia (Priority: P1)

Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente.

Una vez iniciada o terminada la actividad, el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió», y puede corregirlo.

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
3. **Given** un voluntario identificado, **When** intenta ver las horas de otro voluntario, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Actividad cancelada: no admite registro de asistencia.
- Actividad que cruza la medianoche: las horas se calculan correctamente (22:00 a 01:00 = 3 h).
- Una corrección cambia el estado de la Asistencia; el registro no se elimina.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades ya iniciadas o terminadas y no canceladas.
- **FR-002**: El coordinador MUST poder marcar cada inscrito confirmado como «asistió» o «no asistió», y corregirlo.
- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio.
- **FR-004**: Marcar «asistió» MUST sumar las horas al total del voluntario; cambiar a «no asistió» MUST restarlas.
- **FR-005**: Una misma asistencia MUST NOT sumar horas más de una vez.
- **FR-006**: El sistema MUST NOT permitir registrar asistencia de una persona sin inscripción confirmada en la actividad.
- **FR-007**: El voluntario MUST ver en su perfil su total de horas y el desglose por actividad; solo el suyo.
- **FR-008**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias; la comprobación se hace en el servidor.

### Key Entities

- **Asistencia** *(dueño: spec-008)*: Inscripción, asistió (sí / no), horas, fecha de registro, Usuario coordinador que la registra.
- **Inscripción**, **Voluntario** *(dueño: spec-005)*, **Actividad** *(dueño: spec-007)*: se usan sin redefinirlas.

## Dependencies

- **spec-005 (C)**: Inscripción confirmada y Voluntario.
- **spec-004 (B)** consume Asistencia para las horas de voluntariado del informe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El total de horas del perfil coincide siempre con la suma de sus asistencias marcadas como «asistió».
- **SC-002**: El coordinador registra la asistencia de una actividad de 20 personas en menos de 2 minutos.

## Assumptions

- Las horas se muestran con un decimal (3,5 h).

## Open Questions (para `/speckit-clarify`)

- **PA8.1**: ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia?
- **PA8.2**: ¿Se pueden registrar asistencias parciales (por ejemplo, llegó una hora tarde)? (Propuesta: no en v1.)
