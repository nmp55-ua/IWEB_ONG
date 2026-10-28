# Feature Specification: HU-06 — Calendario personal del voluntario

**Feature Branch**: `spec-006`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante C* · **Revisor**: *Integrante A*

**Input**: Descripción del SI-13: "Una vez inscrito en varias actividades, ese voluntario necesita también una manera sencilla de ver todo lo que tiene por delante: un calendario personal con sus próximas actividades, que le ayude a organizar su disponibilidad y a no olvidar ningún compromiso adquirido."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis próximas actividades (Priority: P1)

Como voluntario, quiero ver en un calendario personal mis próximas actividades, para organizar mi disponibilidad y no olvidar ningún compromiso.

El voluntario tiene en su área personal una vista mensual y una vista de lista con las actividades de hoy en adelante en las que tiene inscripción confirmada; las que están en lista de espera se muestran diferenciadas con la etiqueta «en lista de espera».

**Why this priority**: Es el núcleo de la historia; requiere inscripciones (HU-05).

**Independent Test**: Un voluntario de prueba con tres inscripciones confirmadas en actividades futuras y en lista de espera de una cuarta abre su calendario y ve las cuatro en sus fechas, con la cuarta etiquetada «en lista de espera».

**Acceptance Scenarios**:

1. **Given** un voluntario con tres inscripciones confirmadas en actividades futuras, **When** abre su calendario, **Then** ve las tres en su día y hora correctos (hora peninsular), en la vista mensual y en la de lista.
2. **Given** una actividad ya celebrada, **When** el voluntario abre la vista de próximas actividades, **Then** no aparece.
3. **Given** una actividad en la que el voluntario está en lista de espera, **When** abre el calendario, **Then** aparece con la etiqueta «en lista de espera», diferenciada de las confirmadas.
4. **Given** un voluntario sin actividades futuras, **When** abre el calendario, **Then** ve un mensaje claro con un enlace al listado de actividades disponibles.
5. **Given** un voluntario identificado, **When** intenta ver el calendario de otro voluntario, **Then** el sistema deniega el acceso.

---

### User Story 2 - Gestionar una actividad desde el calendario (Priority: P2)

Como voluntario, quiero abrir una actividad del calendario para ver su detalle y cancelar mi inscripción si lo necesito.

**Why this priority**: Mejora la comodidad, pero reutiliza la cancelación de HU-05.

**Independent Test**: Desde el calendario se abre una actividad confirmada, se cancela la inscripción y la actividad desaparece sin recargar manualmente.

**Acceptance Scenarios**:

1. **Given** una actividad del calendario, **When** el voluntario la selecciona, **Then** ve su fecha, horario, lugar y requisitos y la opción de cancelar.
2. **Given** que el voluntario cancela una inscripción desde el detalle, **When** se completa la cancelación, **Then** la actividad desaparece del calendario sin recargar manualmente.
3. **Given** que el voluntario sale de la lista de espera y obtiene plaza (HU-07), **When** abre el calendario, **Then** la actividad aparece como confirmada.

---

### Edge Cases

- Actividad cancelada por el coordinador: desaparece del calendario (el aviso lo envía HU-07).
- Actividad que dura varios días: se muestra en todos sus días.
- Dos actividades el mismo día: ambas se muestran de forma legible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer al voluntario una vista mensual y una vista de lista de sus próximas actividades.
- **FR-002**: El calendario MUST incluir solo actividades con fecha igual o posterior a hoy en las que el voluntario tiene una Inscripción confirmada o en lista de espera; las canceladas no aparecen.
- **FR-003**: Las actividades en lista de espera MUST distinguirse visualmente y con la etiqueta «en lista de espera».
- **FR-004**: Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscripción con las reglas de HU-05.
- **FR-005**: El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado sin que el voluntario tenga que recargar manualmente.
- **FR-006**: Un voluntario MUST poder ver solo su propio calendario; la comprobación se hace en el servidor.

### Key Entities

- **Inscripción**, **Voluntario** *(dueño: spec-005)* y **Actividad** *(dueño: spec-007)*: se usan sin redefinirlas. El calendario es una vista, no una entidad nueva.

## Dependencies

- **spec-005 (C, misma persona)**: inscripción y cancelación.
- **spec-007 (D)**: estados de Actividad y paso automático de lista de espera a confirmada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las inscripciones activas futuras del voluntario aparecen en su calendario.
- **SC-002**: El voluntario identifica su siguiente actividad en menos de 10 segundos desde que abre el calendario.

## Assumptions

- Las fechas se muestran en dd/mm/aaaa y las horas en hora peninsular española.

## Open Questions (para `/speckit-clarify`)

- **PA6.1**: ¿Se ofrece exportar el calendario (por ejemplo, a un fichero .ics)? (Propuesta: fuera de alcance en v1.)
