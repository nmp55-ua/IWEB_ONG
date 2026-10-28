# Feature Specification: HU-04 — Informes de recaudación y voluntariado para la junta

**Feature Branch**: `spec-004`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante B* · **Revisor**: *Integrante D*

**Input**: Descripción del SI-13: "quien lleva la administración de la ONG necesita poder rendir cuentas ante la junta directiva, para lo cual requiere informes que muestren, agrupado por proyecto y por periodo, tanto el dinero recaudado como el volumen de voluntariado generado, en un formato que se pueda exportar y presentar con facilidad."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar el informe por proyecto y periodo (Priority: P1)

Como administrador de la ONG, quiero obtener informes del dinero recaudado y del voluntariado generado, agrupados por proyecto y por periodo, para rendir cuentas ante la junta directiva.

El administrador elige un periodo y, opcionalmente, un proyecto y una agrupación temporal (mes, trimestre o año). El informe muestra por proyecto el dinero recaudado y el voluntariado generado, con una fila de totales.

**Why this priority**: Es la visión agregada del sistema para la junta. Necesita aportaciones (HU-01) y asistencias (HU-08); mientras no existan se prueba con datos de prueba.

**Independent Test**: Con datos de prueba conocidos (aportaciones y asistencias en dos proyectos durante 2026), se genera el informe del año y se comprueban las cifras por proyecto y los totales.

**Acceptance Scenarios**:

1. **Given** aportaciones confirmadas en 2026 en los proyectos A y B y en el fondo general, **When** el administrador pide el informe del 01/01/2026 al 31/12/2026 sin filtro de proyecto, **Then** ve una fila para A, otra para B, otra para «fondo general» y una fila de totales.
2. **Given** cada fila de proyecto, **When** se muestra, **Then** incluye lo recaudado por donaciones puntuales, por cuotas de socio, número de aportaciones, número de actividades celebradas, voluntarios distintos que asistieron y horas de voluntariado.
3. **Given** el filtro del proyecto A, **When** se genera el informe, **Then** solo aparecen las cifras de A.
4. **Given** la agrupación por trimestre, **When** se genera el informe de 2026, **Then** aparece una fila por cada trimestre del periodo.
5. **Given** aportaciones fuera del periodo o no confirmadas, **When** se genera el informe, **Then** no se cuentan.
6. **Given** asistencias registradas en el periodo, **When** se genera el informe, **Then** las horas coinciden con la suma de esas asistencias.
7. **Given** un periodo sin datos, **When** se genera el informe, **Then** se muestra un informe vacío con un mensaje claro, no un error.
8. **Given** una fecha de fin anterior a la de inicio, **When** se pide el informe, **Then** el sistema no lo genera y explica el motivo.
9. **Given** un usuario sin rol de administrador, **When** intenta acceder a los informes, **Then** el sistema deniega el acceso.

---

### User Story 2 - Exportar el informe (Priority: P2)

Como administrador, quiero exportar el informe a CSV y a PDF, para analizarlo en otras herramientas y presentarlo a la junta.

**Why this priority**: Aporta valor una vez que el informe en pantalla es correcto.

**Independent Test**: Con el informe de 2026 en pantalla, se exporta a CSV y a PDF y se comprueba que ambos contienen exactamente las mismas filas y cifras.

**Acceptance Scenarios**:

1. **Given** un informe en pantalla, **When** se exporta a CSV, **Then** el fichero contiene las mismas filas, columnas y cifras.
2. **Given** un informe en pantalla, **When** se exporta a PDF, **Then** el documento contiene la misma información, con el periodo y los filtros aplicados.

---

### Edge Cases

- Asistencias corregidas a «no asistió» (HU-08): sus horas no cuentan.
- Proyecto inactivo: sigue apareciendo si tiene datos en el periodo.
- Actividad celebrada sin ninguna asistencia registrada: cuenta como celebrada con 0 horas.
- Actividad cancelada: no cuenta como celebrada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir elegir un periodo (fecha de inicio y fin), un Proyecto opcional y una agrupación opcional por mes, trimestre o año.
- **FR-002**: El sistema MUST rechazar un periodo cuya fecha de fin sea anterior a la de inicio.
- **FR-003**: El dinero recaudado MUST calcularse con las aportaciones confirmadas cuya fecha de cobro está dentro del periodo, separando donaciones puntuales y cuotas de socio, e indicando el número de aportaciones.
- **FR-004**: El voluntariado MUST calcularse con las asistencias registradas de actividades celebradas dentro del periodo: número de actividades celebradas, voluntarios distintos que asistieron y horas totales.
- **FR-005**: Sin filtro de proyecto, el informe MUST incluir una fila por proyecto, una de «fondo general» y una de totales.
- **FR-006**: El informe MUST poder exportarse a CSV y a PDF con exactamente la misma información que la pantalla.
- **FR-007**: Un periodo sin datos MUST mostrar un informe vacío con un mensaje explicativo.
- **FR-008**: Solo los usuarios con rol administrador MUST poder acceder a los informes; la comprobación se hace en el servidor.

### Key Entities

- **Aportación** *(dueño: spec-001)*, **Actividad** *(dueño: spec-007)*, **Asistencia** *(dueño: spec-008)*, **Proyecto** *(común)*: se usan sin redefinirlas. El informe es un cálculo, no una entidad nueva.

## Dependencies

- **spec-001 (A)**: Aportación con estado, modalidad, fecha de cobro y proyecto.
- **spec-007 / spec-008 (D)**: Actividad con estado y fechas; Asistencia con horas. Mientras no existan, se trabaja con datos de prueba.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los totales del informe coinciden al céntimo (dinero) y a la décima de hora (voluntariado) con la suma de los datos de origen.
- **SC-002**: El administrador obtiene el informe anual exportado en menos de 1 minuto.
- **SC-003**: Las exportaciones CSV y PDF coinciden al 100 % con la pantalla.

## Assumptions

- Las cifras de dinero se muestran en euros con 2 decimales; las fechas, en dd/mm/aaaa y hora peninsular.

## Open Questions (para `/speckit-clarify`)

- **PA4.1**: ¿Los informes deben incluir datos personales de donantes o solo cifras agregadas? (Propuesta: solo agregadas, por protección de datos.)
