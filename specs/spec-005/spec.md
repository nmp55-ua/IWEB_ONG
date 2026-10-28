# Feature Specification: HU-05 — Consulta e inscripción en actividades de voluntariado

**Feature Branch**: `spec-005`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante C* · **Revisor**: *Integrante D*

**Input**: Descripción del SI-13: "cualquier persona interesada en el voluntariado debe poder consultar las actividades disponibles y apuntarse a las que le interesen, viendo con claridad cuántas plazas quedan libres en cada una y qué requisitos concretos se piden para participar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar las actividades disponibles (Priority: P1)

Como cualquier persona interesada, quiero ver las actividades futuras y publicadas con sus plazas libres y requisitos, para decidir en cuáles participar.

**Why this priority**: Es el punto de entrada del voluntariado y no necesita identificarse.

**Independent Test**: Con actividades de prueba (futuras publicadas, una en borrador y una ya celebrada), un usuario no identificado abre el listado y solo ve las futuras publicadas, con plazas y requisitos.

**Acceptance Scenarios**:

1. **Given** actividades futuras publicadas, **When** cualquier persona abre el listado, **Then** ve de cada una título, descripción, fecha y horario de inicio y fin, lugar, proyecto, plazas libres / plazas totales y requisitos.
2. **Given** una actividad ya celebrada, en borrador o cancelada, **When** se abre el listado, **Then** no aparece.
3. **Given** los filtros por proyecto y por fecha, **When** el usuario los aplica, **Then** el listado se reduce a las actividades que cumplen ambos.

---

### User Story 2 - Inscribirme y cancelar mi inscripción (Priority: P1)

Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus requisitos, y poder cancelar si no puedo ir, para colaborar con mi tiempo.

**Why this priority**: Sin inscripciones no hay calendario (HU-06) ni asistencia (HU-08).

**Independent Test**: Con una actividad de 10 plazas y 9 inscritos, un voluntario de prueba ve «1 plaza libre de 10», se inscribe confirmando los requisitos y la actividad pasa a «0 plazas libres de 10»; al cancelar vuelve a «1».

**Acceptance Scenarios**:

1. **Given** una actividad con plazas libres, **When** un voluntario identificado se inscribe y confirma que cumple los requisitos, **Then** su inscripción queda confirmada y las plazas libres bajan en una.
2. **Given** el formulario de inscripción, **When** el voluntario no confirma que cumple los requisitos, **Then** no puede completar la inscripción.
3. **Given** una actividad sin plazas libres, **When** el voluntario la abre, **Then** no se ofrece inscripción directa sino «Apuntarme a la lista de espera» (gestionada en HU-07).
4. **Given** un voluntario ya inscrito o en lista de espera, **When** intenta inscribirse de nuevo en la misma actividad, **Then** el sistema lo impide y lo indica.
5. **Given** un voluntario inscrito, **When** cancela su inscripción antes del inicio, **Then** la plaza queda libre y las plazas libres suben en una.
6. **Given** un usuario no identificado, **When** pulsa «Inscribirme», **Then** se le pide identificarse.

---

### Edge Cases

- Dos voluntarios intentan ocupar la última plaza a la vez: solo uno la obtiene; al otro se le ofrece la lista de espera.
- Cancelación una vez iniciada la actividad: no se permite.
- Actividad ya celebrada: no admite inscripción.
- Actividad cancelada por el coordinador: desaparece del listado y sus inscripciones quedan canceladas (HU-07).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar a cualquier persona las actividades publicadas cuya fecha de inicio es futura.
- **FR-002**: Cada actividad MUST mostrar título, descripción, fecha y horario de inicio y fin, lugar, proyecto, plazas libres / plazas totales y requisitos.
- **FR-003**: El listado MUST poder filtrarse por proyecto y por fecha.
- **FR-004**: Inscribirse MUST requerir estar identificado como voluntario y confirmar expresamente que se cumplen los requisitos.
- **FR-005**: Si hay plazas libres, la Inscripción MUST quedar confirmada y las plazas libres MUST disminuir en una.
- **FR-006**: El número de inscripciones confirmadas MUST NOT superar las plazas de la actividad, ni siquiera con peticiones simultáneas.
- **FR-007**: Si no hay plazas libres, el sistema MUST ofrecer la lista de espera en lugar de la inscripción directa.
- **FR-008**: Un voluntario MUST NOT tener dos inscripciones activas (confirmada o en lista de espera) en la misma actividad, ni inscribirse en una actividad ya celebrada.
- **FR-009**: Un voluntario MUST poder cancelar su inscripción hasta el inicio de la actividad; la Inscripción pasa a «cancelada», no se elimina.

### Key Entities

- **Voluntario** *(dueño: spec-005)*: nombre, apellidos, correo y teléfono, ligado a un Usuario con rol voluntario.
- **Inscripción** *(dueño: spec-005)*: Voluntario, Actividad, estado (confirmada / en lista de espera / cancelada), fecha de inscripción, posición en la lista de espera cuando corresponde.
- **Actividad** *(dueño: spec-007)*, **Proyecto** *(común)*: se usan sin redefinirlas.

## Dependencies

- **spec-007 (D)**: define Actividad, sus estados y la lista de espera; la inscripción en lista de espera y el paso automático a confirmada se rigen por sus reglas.
- **spec-006 (C, misma persona)** y **spec-008 (D)** consumen Inscripción.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un voluntario encuentra una actividad y se inscribe en menos de 2 minutos.
- **SC-002**: En ninguna actividad hay más inscritos confirmados que plazas.

## Assumptions

- El cumplimiento de requisitos es una declaración del voluntario (pendiente de PA5.1).
- Los datos del Voluntario se limitan a los imprescindibles para contactar con él.

## Open Questions (para `/speckit-clarify`)

- **PA5.1**: ¿El sistema debe comprobar algún requisito automáticamente (por ejemplo, la edad a partir de la fecha de nacimiento) o basta con la declaración del voluntario?
- **PA5.2**: ¿Se permite inscribirse en dos actividades que se solapan en el horario?
