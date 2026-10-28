# Feature Specification: HU-02 — Historial de aportaciones del donante

**Feature Branch**: `spec-002`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Integrante A* · **Revisor**: *Integrante B*

**Input**: Descripción del SI-13: "Ese mismo donante querrá, con el paso del tiempo, poder consultar el historial completo de sus aportaciones, viendo año a año qué ha donado y, cuando corresponda, a qué proyecto concreto se destinó ese dinero, como constancia tangible de su implicación con la causa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mi historial de aportaciones (Priority: P1)

Como donante, quiero consultar el historial completo de mis aportaciones agrupado por año y viendo a qué proyecto se destinó cada una, para tener constancia de mi implicación con la causa.

Desde su área personal, el donante ve todas sus aportaciones confirmadas, de la más reciente a la más antigua, agrupadas por año natural y con el total de cada año.

**Why this priority**: Es la forma en que el donante comprueba que su dinero ha llegado y a dónde. Depende de los datos que genera HU1.

**Independent Test**: Con un donante de prueba que tiene aportaciones en 2025 y 2026, se entra en su área personal y se comprueban los dos bloques por año, sus totales y el destino de cada aportación.

**Acceptance Scenarios**:

1. **Given** un donante con 2 aportaciones en 2025 (50 € y 30 €) y 1 en 2026 (20 €), **When** abre su historial, **Then** ve un bloque 2026 con total 20,00 € y un bloque 2025 con total 80,00 €, en ese orden.
2. **Given** una aportación sin proyecto, **When** se muestra en el historial, **Then** aparece con destino "fondo general".
3. **Given** cada aportación del historial, **When** se muestra, **Then** incluye fecha, importe, modalidad (puntual / cuota de socio) y destino.
4. **Given** un pago rechazado o cancelado, **When** el donante abre su historial, **Then** ese pago no aparece.
5. **Given** el filtro de año, **When** el donante elige 2025, **Then** solo ve las aportaciones de 2025.
6. **Given** un donante sin aportaciones, **When** abre su historial, **Then** ve el mensaje "Todavía no has realizado ninguna aportación" y un enlace para donar.
7. **Given** un donante identificado, **When** intenta acceder al historial de otro donante (por ejemplo, cambiando el identificador en la dirección), **Then** el sistema deniega el acceso.

---

### Edge Cases

- Aportación del 31 de diciembre a las 23:59: se agrupa en ese año según la fecha de cobro.
- Donante con muchas aportaciones (socio mensual durante años): el historial se pagina o se pliega por año.
- Aportaciones "pendientes" de confirmación: no se muestran hasta que se confirman.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar al donante identificado todas sus aportaciones confirmadas.
- **FR-002**: Las aportaciones MUST agruparse por año natural según la fecha de cobro y ordenarse de la más reciente a la más antigua.
- **FR-003**: Cada grupo anual MUST mostrar el total aportado ese año.
- **FR-004**: Cada aportación MUST mostrar fecha, importe, modalidad y proyecto de destino o "fondo general".
- **FR-005**: El sistema MUST permitir filtrar por año.
- **FR-006**: El sistema MUST NOT mostrar aportaciones pendientes, rechazadas o canceladas.
- **FR-007**: Un donante MUST poder ver solo sus propias aportaciones.
- **FR-008**: Si no hay aportaciones, el sistema MUST mostrar un mensaje explicativo.

### Key Entities

- **Donante** y **Aportación**: definidas en HU1.
- **Proyecto**: compartido con HU-01, HU-04 y HU7.

## Success Criteria *(mandatory)*

- **SC-001**: La suma de los totales anuales coincide al céntimo con la suma de las aportaciones confirmadas del donante.
- **SC-002**: El historial se muestra en menos de 2 segundos para un donante con 5 años de cuotas mensuales.

## Assumptions

- El donante accede con una cuenta asociada al correo con el que donó.

## Open Questions (para `/speckit.clarify`)

- **PA2.1**: Si el administrador reasigna una aportación a otro proyecto, ¿el historial muestra el proyecto actual o el original?
