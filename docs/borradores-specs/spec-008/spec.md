# Feature Specification: HU-08 — Registro de asistencia y acumulación de horas

**Feature Branch**: `spec-008`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Javi*

**Input**: Descripción del SI-13: "Ese mismo coordinador necesita, además, registrar quién ha asistido realmente a cada actividad, de forma que las horas de voluntariado dedicadas por cada persona se vayan acumulando automáticamente en su perfil, como reconocimiento a su compromiso continuado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar asistencia y acumular horas (Priority: P2)

Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente en su perfil como reconocimiento a su compromiso.

Una vez iniciada o terminada la actividad, el coordinador marca a cada inscrito confirmado como "asistió" o "no asistió". Las horas de la actividad se suman al perfil de quien asistió. El voluntario ve su total de horas y el desglose.

**Why this priority**: Cierra el ciclo del voluntariado y alimenta los informes (HU-04). Requiere actividades (HU-07) e inscripciones (HU-05).

**Independent Test**: Con una actividad de prueba de 10:00 a 13:30 ya celebrada y dos inscritos, el coordinador marca a uno como asistente; su perfil pasa a mostrar 3,5 horas más y el otro no cambia.

**Acceptance Scenarios**:

1. **Given** una actividad que todavía no ha comenzado, **When** el coordinador intenta registrar asistencia, **Then** el sistema no lo permite.
2. **Given** una actividad de 10:00 a 13:30 ya celebrada, **When** el coordinador marca a un voluntario como asistente, **Then** se suman 3,5 horas a su total.
3. **Given** una asistencia ya registrada, **When** el coordinador vuelve a guardar sin cambios, **Then** las horas no se duplican.
4. **Given** un voluntario marcado como asistente por error, **When** el coordinador lo cambia a "no asistió", **Then** se restan las 3,5 horas.
5. **Given** la lista de asistencia, **When** el coordinador la abre, **Then** solo aparecen los voluntarios con inscripción confirmada, no los de lista de espera.
6. **Given** un voluntario con asistencias registradas, **When** abre su perfil, **Then** ve su total de horas y el desglose por actividad con fecha y horas.
7. **Given** un usuario sin rol de coordinador, **When** intenta registrar o corregir asistencias, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Actividad cancelada: no admite registro de asistencia.
- Actividad con horario que cruza la medianoche: las horas se calculan correctamente (22:00 a 01:00 = 3 h).
- Voluntario dado de baja: sus horas acumuladas se conservan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades ya iniciadas o terminadas y no canceladas.
- **FR-002**: El coordinador MUST poder marcar cada inscrito confirmado como "asistió" o "no asistió".
- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio, en horas con un decimal.
- **FR-004**: Marcar "asistió" MUST sumar las horas al total del voluntario; cambiar a "no asistió" MUST restarlas.
- **FR-005**: Una misma asistencia MUST NOT sumar horas más de una vez.
- **FR-006**: El voluntario MUST ver en su perfil el total de horas y el desglose por actividad.
- **FR-007**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias.

### Key Entities

- **Asistencia**: inscripción, asistió (sí/no), horas, fecha de registro, coordinador que la registra.
- **Inscripción** (HU-05), **Actividad** (HU-07), **Voluntario** (HU-05).

## Success Criteria *(mandatory)*

- **SC-001**: El total de horas del perfil coincide siempre con la suma de sus asistencias registradas.
- **SC-002**: El coordinador registra la asistencia de una actividad de 20 personas en menos de 2 minutos.

## Assumptions

- No se registran asistencias parciales en v1: se cuentan las horas completas de la actividad.

## Open Questions (para `/speckit.clarify`)

- **PA8.1**: ¿Hay un plazo máximo después de la actividad para registrar o corregir la asistencia?
- **PA8.2**: ¿Se admiten asistencias parciales (llegó tarde, se fue antes)?
