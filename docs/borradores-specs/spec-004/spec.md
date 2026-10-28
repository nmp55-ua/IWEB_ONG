# Feature Specification: HU-04 — Informes de recaudación y voluntariado para la junta

**Feature Branch**: `spec-004`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nicole*

**Input**: Descripción del SI-13: "quien lleva la administración de la ONG necesita poder rendir cuentas ante la junta directiva, para lo cual requiere informes que muestren, agrupado por proyecto y por periodo, tanto el dinero recaudado como el volumen de voluntariado generado, en un formato que se pueda exportar y presentar con facilidad."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generar y exportar informes para la junta (Priority: P2)

Como administrador de la ONG, quiero obtener informes del dinero recaudado y del voluntariado generado, agrupados por proyecto y por periodo, y exportarlos, para rendir cuentas ante la junta directiva.

El administrador elige un periodo y, opcionalmente, un proyecto y una agrupación temporal (mes, trimestre o año). El informe muestra por proyecto el dinero recaudado y el voluntariado generado, con una fila de totales, y se puede exportar a CSV y PDF.

**Why this priority**: Es la visión agregada de todo el sistema. Necesita que existan aportaciones (HU-01) y asistencias registradas (HU-08), así que se construye después.

**Independent Test**: Con datos de prueba conocidos (aportaciones y asistencias en dos proyectos durante 2026), se genera el informe del año y se comprueban las cifras por proyecto, los totales y que el CSV contiene lo mismo que la pantalla.

**Acceptance Scenarios**:

1. **Given** aportaciones confirmadas en 2026 en los proyectos A y B, **When** el administrador pide el informe del 1/1/2026 al 31/12/2026, **Then** ve una fila para A, otra para B, otra para "fondo general" y una fila de totales.
2. **Given** cada fila de proyecto, **When** se muestra, **Then** incluye recaudación por donaciones puntuales, por cuotas de socio, número de aportaciones, número de actividades celebradas, voluntarios distintos que asistieron y horas de voluntariado.
3. **Given** el filtro de proyecto A, **When** se genera el informe, **Then** solo aparecen las cifras de A.
4. **Given** la agrupación por trimestre, **When** se genera el informe de 2026, **Then** aparece una fila por trimestre.
5. **Given** un informe en pantalla, **When** se exporta a CSV o PDF, **Then** el fichero contiene la misma información.
6. **Given** un periodo sin datos, **When** se genera el informe, **Then** se muestra un informe vacío con un mensaje claro, no un error.
7. **Given** una fecha de fin anterior a la de inicio, **When** se pide el informe, **Then** el sistema no lo genera y explica el motivo.
8. **Given** un usuario sin rol de administrador, **When** intenta acceder a los informes, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Aportaciones pendientes o rechazadas: no cuentan.
- Asistencias corregidas a "no asistió" (HU-08): sus horas no cuentan.
- Proyecto desactivado: sigue apareciendo si tiene datos en el periodo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir elegir un periodo (fecha de inicio y fin), un proyecto opcional y una agrupación opcional por mes, trimestre o año.
- **FR-002**: El dinero recaudado MUST calcularse con las aportaciones confirmadas cuya fecha de cobro está dentro del periodo, separando donaciones puntuales y cuotas de socio.
- **FR-003**: El voluntariado MUST calcularse con las asistencias registradas de actividades celebradas dentro del periodo: número de actividades, voluntarios distintos y horas totales.
- **FR-004**: El informe MUST incluir una fila por proyecto, una de "fondo general" y una de totales.
- **FR-005**: El informe MUST poder exportarse a CSV y a PDF con el mismo contenido que la pantalla.
- **FR-006**: El informe MUST mostrar solo cifras agregadas, sin datos personales de donantes ni voluntarios.
- **FR-007**: Solo los usuarios con rol administrador MUST poder acceder a los informes.

### Key Entities

- **Aportación** (HU-01), **Actividad** (HU-07), **Asistencia** (HU-08), **Proyecto**.

## Success Criteria *(mandatory)*

- **SC-001**: Los totales del informe coinciden al céntimo y a la hora con la suma de los datos de origen.
- **SC-002**: El administrador obtiene el informe anual exportado en menos de 1 minuto.

## Assumptions

- Las horas de voluntariado se toman de HU-08; si no hay asistencia registrada, la actividad cuenta como celebrada pero con 0 horas.

## Open Questions (para `/speckit.clarify`)

- **PA4.1**: ¿Debe incluirse alguna gráfica en el PDF o basta con tablas?
