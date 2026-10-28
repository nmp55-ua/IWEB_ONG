# Feature Specification: HU-07 — Gestión de actividades, plazas y lista de espera

**Feature Branch**: `spec-007`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Integrante D* · **Revisor**: *Integrante C*

**Input**: Descripción del SI-13: "Quien coordina los proyectos de la organización, por su parte, es el encargado de crear y mantener las actividades disponibles, definiendo cuántas plazas tiene cada una y gestionando la correspondiente lista de espera cuando la demanda supera al aforo previsto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y mantener actividades (Priority: P1)

Como coordinador de proyectos, quiero crear y mantener las actividades definiendo sus plazas y gestionando la lista de espera cuando la demanda supera el aforo, para organizar el voluntariado de cada proyecto.

**Why this priority**: Sin actividades no hay nada que consultar ni a lo que inscribirse (HU-05, HU-06, HU-08).

**Independent Test**: Un coordinador de prueba crea una actividad de 2 plazas y la publica; tres voluntarios se inscriben; el tercero queda en lista de espera; uno de los dos primeros cancela y el tercero pasa a confirmado y recibe un aviso.

**Acceptance Scenarios**:

1. **Given** el formulario de nueva actividad con todos los campos válidos, **When** el coordinador la guarda, **Then** queda creada en estado "borrador".
2. **Given** un campo obligatorio vacío, plazas ≤ 0, fin anterior al inicio o inicio en el pasado, **When** el coordinador intenta guardar, **Then** el sistema no la crea e indica el problema.
3. **Given** una actividad en borrador, **When** el coordinador la publica, **Then** aparece en el listado público (HU-05).
4. **Given** una actividad publicada de 10 plazas con 10 inscritos, **When** un undécimo voluntario se apunta, **Then** entra en la lista de espera en la posición 1.
5. **Given** una lista de espera con personas, **When** un inscrito cancela, **Then** la primera persona de la lista pasa automáticamente a confirmada y recibe un aviso por correo.
6. **Given** 10 plazas y 2 personas en espera, **When** el coordinador sube el aforo a 12, **Then** ambas pasan a confirmadas.
7. **Given** 8 inscritos confirmados, **When** el coordinador intenta bajar las plazas a 6, **Then** el sistema lo impide y explica el motivo.
8. **Given** una actividad publicada, **When** el coordinador la cancela, **Then** inscritos y lista de espera reciben un aviso y la actividad deja de estar disponible.
9. **Given** una actividad, **When** el coordinador la abre, **Then** ve la lista de inscritos confirmados y la lista de espera en orden.
10. **Given** un usuario sin rol de coordinador, **When** intenta crear, editar o cancelar actividades, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Un voluntario en lista de espera cancela: el resto de la lista avanza una posición.
- Edición de fecha u horario de una actividad con inscritos: se avisa a los inscritos del cambio.
- Actividad ya celebrada: no se puede editar ni cancelar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El coordinador MUST poder crear, editar, publicar y cancelar actividades.
- **FR-002**: Cada actividad MUST tener título, descripción, proyecto, fecha y hora de inicio y fin, lugar, plazas (entero > 0) y requisitos (texto, opcional).
- **FR-003**: El sistema MUST validar que el fin es posterior al inicio y que el inicio es posterior al momento actual.
- **FR-004**: Los estados de una actividad MUST ser borrador, publicada, cancelada o celebrada; solo las publicadas son visibles para voluntarios.
- **FR-005**: Cuando una actividad está completa, las nuevas solicitudes MUST entrar en una lista de espera por orden de llegada.
- **FR-006**: Al liberarse una plaza, el sistema MUST confirmar automáticamente a la primera persona de la lista y avisarla por correo.
- **FR-007**: El sistema MUST NOT permitir reducir las plazas por debajo de los inscritos confirmados.
- **FR-008**: Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera.
- **FR-009**: Solo los usuarios con rol coordinador MUST poder gestionar actividades.

### Key Entities

- **Actividad**: título, descripción, proyecto, inicio, fin, lugar, plazas, requisitos, estado.
- **Inscripción** (HU-05): con posición en lista de espera cuando corresponde.
- **Coordinador**: usuario con rol coordinador.
- **Proyecto**: compartido con HU-01, HU4.

## Success Criteria *(mandatory)*

- **SC-001**: Un coordinador crea y publica una actividad en menos de 3 minutos.
- **SC-002**: El 100 % de las plazas liberadas se asignan a la lista de espera sin intervención manual.

## Assumptions

- La plaza liberada se confirma directamente, sin plazo de aceptación.

## Open Questions (para `/speckit.clarify`)

- **PA7.1**: ¿Puede un coordinador gestionar actividades de proyectos que no coordina?
- **PA7.2**: ¿Debe existir un plazo para aceptar la plaza liberada antes de pasarla al siguiente?
