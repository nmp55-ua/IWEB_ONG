# Feature Specification: HU-07 — Gestión de actividades, plazas y lista de espera

**Feature Branch**: `spec-007`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Javi*

**Input**: Descripción del SI-13: "Quien coordina los proyectos de la organización, por su parte, es el encargado de crear y mantener las actividades disponibles, definiendo cuántas plazas tiene cada una y gestionando la correspondiente lista de espera cuando la demanda supera al aforo previsto."

## Clarifications

### Session 2026-10-28

- Q: ¿Puede un coordinador gestionar cualquier actividad o solo las de los proyectos que coordina? → A: Cualquier coordinador gestiona cualquier actividad de cualquier proyecto (no hay vínculo coordinador–proyecto).
- Q: Al liberarse una plaza, ¿se confirma directamente o hay plazo para aceptarla? → A: Confirmación directa con aviso por correo; si no puede asistir, la persona cancela y la plaza pasa a la siguiente. *(Confirmado con Javi, dueño de Inscripción en spec-005.)*
- Q: ¿Qué se puede editar de una actividad publicada? → A: Todo, respetando FR-003 y FR-007; si cambian fecha, hora o lugar se avisa por correo a inscritos y lista de espera. Una publicada no vuelve a borrador.
- Q: ¿Se puede cancelar una actividad ya celebrada y cómo se descarta un borrador? → A: Una celebrada no se puede cancelar ni editar; un borrador se descarta cancelándolo (sin avisos); nunca se borra físicamente.
- Q: ¿Qué se exige del proyecto y la fecha al crear, editar y publicar? → A: Proyecto activo e inicio futuro en las tres operaciones; desactivar un proyecto no afecta a sus actividades ya publicadas.

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

- Actividad ya celebrada (inicio pasado) o cancelada: no se puede editar, cancelar ni volver a publicar; el sistema lo rechaza explicando el motivo.
- Un borrador que no se quiere se descarta cancelándolo (sin avisos, porque no tiene inscritos); las actividades nunca se borran físicamente.
- Se libera una plaza y la lista de espera está vacía: las plazas libres aumentan en una.
- Una actividad cancelada conserva sus inscripciones con estado «cancelada»; no se eliminan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El coordinador MUST poder crear, editar, publicar y cancelar actividades.
- **FR-002**: Cada Actividad MUST tener título, descripción, Proyecto, fecha y hora de inicio y fin, lugar, plazas (entero mayor que cero) y requisitos (texto, puede estar vacío).
- **FR-003**: Al crear, editar y publicar, el sistema MUST validar que el fin es posterior al inicio, que el inicio es posterior al momento actual y que el Proyecto está activo; un borrador cuyo inicio ya ha pasado no se puede publicar. Desactivar un proyecto no afecta a sus actividades ya publicadas.
- **FR-004**: Los estados de una Actividad MUST ser borrador, publicada o cancelada; solo las publicadas son visibles para los voluntarios.
- **FR-005**: Cuando una actividad publicada está completa, las nuevas solicitudes MUST entrar en una lista de espera por orden de llegada.
- **FR-006**: Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confirmar automáticamente y de inmediato a la primera persona de la lista de espera (sin plazo de aceptación ni estado intermedio) y avisarla por correo; si no puede asistir, cancela ella misma su inscripción y la plaza pasa a la siguiente.
- **FR-007**: El sistema MUST NOT permitir reducir las plazas por debajo del número de inscritos confirmados.
- **FR-008**: Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera y MUST dejar de mostrarla como disponible.
- **FR-009**: El coordinador MUST poder consultar, en cada actividad, los inscritos confirmados y la lista de espera con su orden.
- **FR-010**: Solo los usuarios con rol coordinador MUST poder gestionar actividades; cualquier coordinador puede gestionar cualquier actividad de cualquier proyecto, sin vínculo coordinador–proyecto. La comprobación se hace en el servidor.
- **FR-011**: Una actividad publicada MUST poder editarse en todos sus campos (con las validaciones de FR-003 y FR-007); si cambian la fecha, la hora o el lugar, el sistema MUST avisar por correo a inscritos confirmados y lista de espera. Una actividad publicada MUST NOT volver a borrador.

### Key Entities

- **Actividad** *(dueño: spec-007)*: título, descripción, Proyecto, inicio, fin, lugar, plazas, requisitos, estado.
- **Inscripción** *(dueño: spec-005)*: se usa sin redefinirla, incluida su posición en la lista de espera.
- **Usuario** con rol coordinador *(común)*, **Proyecto** *(común)*.

## Dependencies

- **spec-005 / spec-006 (C)** consumen Actividad y sus estados; la Inscripción es de C, así que las reglas de lista de espera se acuerdan con C.
- **Promoción al cancelar un voluntario** *(acordado con Javi)*: la cancelación de una inscripción en spec-005 llama a `promoverListaEspera`, que devuelve las inscripciones promovidas; el correo «plaza confirmada» sale siempre de una única función `avisarPlazaConfirmada` de spec-007, que también usa spec-005.
- **spec-004 (B)** usa Actividad para contar actividades celebradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un coordinador crea y publica una actividad en menos de 3 minutos.
- **SC-002**: El 100 % de las plazas liberadas se asignan a la lista de espera sin intervención manual.
- **SC-003**: En ninguna actividad hay más inscritos confirmados que plazas.

## Assumptions

- Una actividad «celebrada» es una actividad publicada cuya hora de inicio ya ha pasado; no es un estado aparte.

## Open Questions (para `/speckit-clarify`)

- ~~PA7.1~~: resuelta (ver Clarifications).
- ~~PA7.2~~: resuelta (ver Clarifications).
