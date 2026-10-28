# Feature Specification: HU-07 — Gestión de actividades, plazas y lista de espera

**Feature Branch**: `spec-007`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante D* · **Revisor**: *Integrante C*

**Input**: Descripción del SI-13: "Quien coordina los proyectos de la organización, por su parte, es el encargado de crear y mantener las actividades disponibles, definiendo cuántas plazas tiene cada una y gestionando la correspondiente lista de espera cuando la demanda supera al aforo previsto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear, publicar, editar y cancelar actividades (Priority: P1)

Como coordinador de proyectos, quiero crear y mantener las actividades definiendo sus plazas, para organizar el voluntariado de cada proyecto.

**Why this priority**: Sin actividades no hay nada que consultar ni a lo que inscribirse (HU-05, HU-06, HU-08).

**Independent Test**: Un coordinador de prueba crea una actividad en borrador, comprueba que no aparece en el listado público, la publica y comprueba que sí aparece.

**Acceptance Scenarios**:

1. **Given** el formulario de nueva actividad con todos los campos válidos, **When** el coordinador la guarda, **Then** queda creada en estado «borrador».
2. **Given** un campo obligatorio vacío, plazas ≤ 0, fin anterior o igual al inicio o inicio en el pasado, **When** el coordinador intenta guardar, **Then** el sistema no la crea e indica el problema junto al campo.
3. **Given** una actividad en borrador, **When** el coordinador la publica, **Then** aparece en el listado público (HU-05); mientras está en borrador, no aparece.
4. **Given** 8 inscritos confirmados, **When** el coordinador intenta bajar las plazas a 6, **Then** el sistema lo impide y explica el motivo.
5. **Given** una actividad publicada, **When** el coordinador la cancela, **Then** inscritos y lista de espera reciben un aviso y la actividad deja de estar disponible.
6. **Given** una actividad, **When** el coordinador la abre, **Then** ve la lista de inscritos confirmados y la lista de espera en orden.
7. **Given** un usuario sin rol de coordinador, **When** intenta crear, editar o cancelar actividades, **Then** el sistema deniega el acceso.

---

### User Story 2 - Lista de espera automática (Priority: P1)

Como coordinador, quiero que, cuando la demanda supere el aforo, los interesados entren en una lista de espera por orden de llegada y ocupen automáticamente las plazas que se liberen.

**Why this priority**: Es parte central de la historia y lo usa HU-05.

**Independent Test**: Una actividad de 2 plazas recibe tres voluntarios; el tercero queda en lista de espera en la posición 1; uno de los dos primeros cancela y el tercero pasa a confirmado y recibe un aviso.

**Acceptance Scenarios**:

1. **Given** una actividad publicada de 10 plazas con 10 inscritos, **When** un undécimo voluntario se apunta, **Then** entra en la lista de espera en la posición 1.
2. **Given** una lista de espera con personas, **When** un inscrito cancela, **Then** la primera persona de la lista pasa automáticamente a confirmada y recibe un aviso por correo.
3. **Given** 10 plazas y 2 personas en espera, **When** el coordinador sube las plazas a 12, **Then** las dos pasan a confirmadas y reciben un aviso.
4. **Given** una persona en lista de espera que cancela, **When** se actualiza la lista, **Then** las siguientes avanzan una posición.

---

### Edge Cases

- Actividad ya celebrada o cancelada: no se puede editar ni volver a publicar.
- Se libera una plaza y la lista de espera está vacía: las plazas libres aumentan en una.
- Una actividad cancelada conserva sus inscripciones con estado «cancelada»; no se eliminan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El coordinador MUST poder crear, editar, publicar y cancelar actividades.
- **FR-002**: Cada Actividad MUST tener título, descripción, Proyecto, fecha y hora de inicio y fin, lugar, plazas (entero mayor que cero) y requisitos (texto, puede estar vacío).
- **FR-003**: El sistema MUST validar que el fin es posterior al inicio y que el inicio es posterior al momento actual.
- **FR-004**: Los estados de una Actividad MUST ser borrador, publicada o cancelada; solo las publicadas son visibles para los voluntarios.
- **FR-005**: Cuando una actividad publicada está completa, las nuevas solicitudes MUST entrar en una lista de espera por orden de llegada.
- **FR-006**: Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confirmar automáticamente a la primera persona de la lista de espera y avisarla por correo.
- **FR-007**: El sistema MUST NOT permitir reducir las plazas por debajo del número de inscritos confirmados.
- **FR-008**: Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera y MUST dejar de mostrarla como disponible.
- **FR-009**: El coordinador MUST poder consultar, en cada actividad, los inscritos confirmados y la lista de espera con su orden.
- **FR-010**: Solo los usuarios con rol coordinador MUST poder gestionar actividades; la comprobación se hace en el servidor.

### Key Entities

- **Actividad** *(dueño: spec-007)*: título, descripción, Proyecto, inicio, fin, lugar, plazas, requisitos, estado.
- **Inscripción** *(dueño: spec-005)*: se usa sin redefinirla, incluida su posición en la lista de espera.
- **Usuario** con rol coordinador *(común)*, **Proyecto** *(común)*.

## Dependencies

- **spec-005 / spec-006 (C)** consumen Actividad y sus estados; la Inscripción es de C, así que las reglas de lista de espera se acuerdan con C.
- **spec-004 (B)** usa Actividad para contar actividades celebradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un coordinador crea y publica una actividad en menos de 3 minutos.
- **SC-002**: El 100 % de las plazas liberadas se asignan a la lista de espera sin intervención manual.
- **SC-003**: En ninguna actividad hay más inscritos confirmados que plazas.

## Assumptions

- Una actividad «celebrada» es una actividad publicada cuya hora de inicio ya ha pasado; no es un estado aparte.

## Open Questions (para `/speckit-clarify`)

- **PA7.1**: ¿Puede un coordinador editar actividades de proyectos que no coordina?
- **PA7.2**: ¿Existe un plazo para aceptar la plaza liberada, o se confirma directamente?
