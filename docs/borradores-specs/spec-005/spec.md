# Feature Specification: HU-05 — Consulta e inscripción en actividades de voluntariado

**Feature Branch**: `spec-005`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Integrante C* · **Revisor**: *Integrante D*

**Input**: Descripción del SI-13: "cualquier persona interesada en el voluntariado debe poder consultar las actividades disponibles y apuntarse a las que le interesen, viendo con claridad cuántas plazas quedan libres en cada una y qué requisitos concretos se piden para participar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar actividades e inscribirme (Priority: P1)

Como voluntario, quiero consultar las actividades disponibles y apuntarme a las que me interesen viendo cuántas plazas quedan libres y qué requisitos se piden, para colaborar con mi tiempo en las que encajen conmigo.

**Why this priority**: Es el punto de entrada del voluntariado. Sin inscripciones no hay calendario (HU-06) ni asistencia (HU-08).

**Independent Test**: Con una actividad publicada de 10 plazas y 9 inscritos, un voluntario de prueba ve "1 plaza libre de 10", se inscribe confirmando los requisitos y la actividad pasa a "0 plazas libres".

**Acceptance Scenarios**:

1. **Given** actividades futuras publicadas, **When** cualquier persona abre el listado, **Then** ve de cada una título, fecha y horario, lugar, proyecto, plazas libres / totales y requisitos.
2. **Given** una actividad ya celebrada o en borrador, **When** se abre el listado, **Then** no aparece.
3. **Given** filtros por proyecto y por fecha, **When** el usuario los aplica, **Then** el listado se reduce a las actividades que cumplen ambos.
4. **Given** una actividad con plazas libres, **When** un voluntario identificado se inscribe y confirma que cumple los requisitos, **Then** su inscripción queda confirmada y las plazas libres bajan en una.
5. **Given** el formulario de inscripción, **When** el voluntario no marca que cumple los requisitos, **Then** no puede completar la inscripción.
6. **Given** una actividad sin plazas libres, **When** el voluntario la abre, **Then** no se ofrece inscripción directa sino "Apuntarme a la lista de espera" (gestionada en HU-07).
7. **Given** un voluntario ya inscrito, **When** intenta inscribirse de nuevo en la misma actividad, **Then** el sistema lo impide y lo indica.
8. **Given** un voluntario inscrito, **When** cancela su inscripción antes del inicio, **Then** la plaza queda libre y las plazas libres suben en una.
9. **Given** un usuario no identificado, **When** pulsa "Inscribirme", **Then** se le pide identificarse o registrarse como voluntario.

---

### Edge Cases

- Dos voluntarios intentan ocupar la última plaza a la vez: solo uno la obtiene; el otro pasa a la oferta de lista de espera.
- Cancelación una vez iniciada la actividad: no se permite.
- Actividad cancelada por el coordinador: desaparece del listado y las inscripciones quedan anuladas (HU-07).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar públicamente las actividades publicadas cuya fecha de inicio es futura.
- **FR-002**: Cada actividad MUST mostrar título, descripción, fecha y horario, lugar, proyecto, plazas libres / totales y requisitos.
- **FR-003**: El listado MUST poder filtrarse por proyecto y por rango de fechas.
- **FR-004**: Inscribirse MUST requerir estar identificado como voluntario y confirmar expresamente que se cumplen los requisitos.
- **FR-005**: Si hay plazas libres, la inscripción MUST quedar confirmada y las plazas libres MUST disminuir en una.
- **FR-006**: El número de inscripciones confirmadas MUST NOT superar las plazas de la actividad, ni siquiera con peticiones simultáneas.
- **FR-007**: Si no hay plazas, el sistema MUST ofrecer la lista de espera en lugar de la inscripción.
- **FR-008**: Un voluntario MUST NOT tener dos inscripciones activas en la misma actividad.
- **FR-009**: Un voluntario MUST poder cancelar su inscripción hasta el inicio de la actividad.

### Key Entities

- **Voluntario**: nombre, apellidos, correo, teléfono, fecha de nacimiento.
- **Actividad**: definida en HU7.
- **Inscripción**: voluntario, actividad, estado (confirmada / en lista de espera / cancelada), fecha de inscripción.

## Success Criteria *(mandatory)*

- **SC-001**: Un voluntario encuentra una actividad y se inscribe en menos de 2 minutos.
- **SC-002**: En ninguna actividad hay más inscritos confirmados que plazas.

## Assumptions

- El cumplimiento de requisitos es una declaración del voluntario; el sistema no lo verifica.

## Open Questions (para `/speckit.clarify`)

- **PA5.1**: ¿Se comprueba automáticamente algún requisito, como la mayoría de edad?
- **PA5.2**: ¿Se permite inscribirse en dos actividades que se solapan en horario?
