# Feature Specification: HU-06 — Calendario personal del voluntario

**Feature Branch**: `spec-006`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Integrante C* · **Revisor**: *Integrante A*

**Input**: Descripción del SI-13: "Una vez inscrito en varias actividades, ese voluntario necesita también una manera sencilla de ver todo lo que tiene por delante: un calendario personal con sus próximas actividades, que le ayude a organizar su disponibilidad y a no olvidar ningún compromiso adquirido."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis próximas actividades en un calendario (Priority: P2)

Como voluntario, quiero ver en un calendario personal mis próximas actividades, para organizar mi disponibilidad y no olvidar ningún compromiso.

El voluntario tiene en su área personal una vista mensual y una vista de lista con las actividades futuras en las que está inscrito. Las actividades en lista de espera se distinguen de las confirmadas.

**Why this priority**: Mejora la organización del voluntario, pero requiere que existan inscripciones (HU-05).

**Independent Test**: Un voluntario de prueba inscrito en tres actividades futuras y en lista de espera de una cuarta abre su calendario y comprueba que ve las cuatro en sus fechas, con la cuarta marcada "en lista de espera".

**Acceptance Scenarios**:

1. **Given** un voluntario con tres inscripciones confirmadas en actividades futuras, **When** abre su calendario, **Then** ve las tres en su día y hora correctos.
2. **Given** una actividad ya celebrada, **When** el voluntario abre la vista de próximas actividades, **Then** no aparece.
3. **Given** una actividad en la que el voluntario está en lista de espera, **When** abre el calendario, **Then** aparece con la etiqueta "en lista de espera" y distinta visualmente de las confirmadas.
4. **Given** una actividad del calendario, **When** el voluntario la selecciona, **Then** ve su detalle (fecha, horario, lugar, requisitos) y la opción de cancelar.
5. **Given** que el voluntario cancela una inscripción, **When** vuelve al calendario, **Then** la actividad ya no aparece.
6. **Given** que el voluntario obtiene plaza desde la lista de espera, **When** abre el calendario, **Then** la actividad aparece como confirmada.
7. **Given** un voluntario sin actividades futuras, **When** abre el calendario, **Then** ve un mensaje con un enlace al listado de actividades.
8. **Given** un voluntario identificado, **When** intenta ver el calendario de otro voluntario, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Actividad cancelada por el coordinador: desaparece del calendario y se avisa al voluntario (HU-07).
- Actividad que dura varios días: se muestra en todos sus días.
- Dos actividades el mismo día: ambas se muestran sin superponerse de forma ilegible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer al voluntario una vista mensual y una vista de lista de sus próximas actividades.
- **FR-002**: El calendario MUST incluir solo actividades con fecha igual o posterior a hoy en las que el voluntario tiene inscripción confirmada o en lista de espera.
- **FR-003**: Las actividades en lista de espera MUST distinguirse visualmente y con texto de las confirmadas.
- **FR-004**: Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscripción con las reglas de HU5.
- **FR-005**: El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado en cuanto se producen.
- **FR-006**: Un voluntario MUST poder ver solo su propio calendario.

### Key Entities

- **Inscripción** (HU-05) y **Actividad** (HU-07).

## Success Criteria *(mandatory)*

- **SC-001**: El 100 % de las inscripciones activas futuras del voluntario aparecen en su calendario.
- **SC-002**: El voluntario identifica su siguiente actividad en menos de 10 segundos desde que abre el calendario.

## Assumptions

- Las horas se muestran en la zona horaria de España peninsular.

## Open Questions (para `/speckit.clarify`)

- **PA6.1**: ¿Se ofrece exportar el calendario a un fichero .ics? (Propuesta: fuera de alcance en v1.)
- **PA6.2**: ¿Se envía un recordatorio por correo el día antes de cada actividad?
