# Feature Specification: HU-02 — Historial de aportaciones del donante

**Feature Branch**: `spec-002`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante A* · **Revisor**: *Integrante C*

**Input**: Descripción del SI-13: "Ese mismo donante querrá, con el paso del tiempo, poder consultar el historial completo de sus aportaciones, viendo año a año qué ha donado y, cuando corresponda, a qué proyecto concreto se destinó ese dinero, como constancia tangible de su implicación con la causa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar mi historial de aportaciones (Priority: P1)

Como donante, quiero consultar el historial completo de mis aportaciones agrupado por año y viendo a qué proyecto se destinó cada una, para tener constancia de mi implicación con la causa.

Desde su área personal, el donante identificado ve todas sus aportaciones confirmadas (puntuales y cuotas de socio), de la más reciente a la más antigua, agrupadas por año natural y con el total de cada año.

**Why this priority**: Es la forma en que el donante comprueba que su dinero ha llegado y a dónde.

**Independent Test**: Con un donante de prueba que tiene aportaciones en 2025 y 2026, se entra en su área personal y se comprueban los dos bloques por año, sus totales y el destino de cada aportación.

**Acceptance Scenarios**:

1. **Given** un donante con 2 aportaciones confirmadas en 2025 (50 € y 30 €) y 1 en 2026 (20 €), **When** abre su historial, **Then** ve un bloque 2026 con total 20,00 € y un bloque 2025 con total 80,00 €, en ese orden.
2. **Given** cada aportación del historial, **When** se muestra, **Then** incluye fecha (dd/mm/aaaa), importe, modalidad (puntual / cuota de socio) y proyecto de destino o «fondo general».
3. **Given** un pago pendiente, rechazado o cancelado, **When** el donante abre su historial, **Then** ese pago no aparece.
4. **Given** el filtro de año, **When** el donante elige 2025, **Then** solo ve las aportaciones de 2025.
5. **Given** un donante sin aportaciones confirmadas, **When** abre su historial, **Then** ve el mensaje «Todavía no has realizado ninguna aportación» y un enlace para donar.
6. **Given** un donante identificado, **When** intenta acceder al historial de otro donante, aunque conozca su identificador, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Aportación del 31/12 a las 23:59 (hora peninsular): se agrupa en ese año según su fecha de cobro.
- Aportaciones «pendientes» de confirmación: no se muestran hasta que se confirman.
- Usuario con rol donante sin Donante asociado (nunca ha donado con ese correo): ve el mensaje de historial vacío.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar al donante identificado todas sus aportaciones confirmadas, puntuales y cuotas de socio.
- **FR-002**: Las aportaciones MUST agruparse por año natural según la fecha de cobro y ordenarse de la más reciente a la más antigua.
- **FR-003**: Cada grupo anual MUST mostrar el total aportado ese año, en euros con 2 decimales.
- **FR-004**: Cada aportación MUST mostrar fecha, importe, modalidad y proyecto de destino o «fondo general».
- **FR-005**: El sistema MUST permitir filtrar por un año concreto.
- **FR-006**: El sistema MUST NOT mostrar aportaciones pendientes, rechazadas o canceladas.
- **FR-007**: Un donante MUST poder ver solo sus propias aportaciones; la comprobación se hace en el servidor.
- **FR-008**: Si no hay aportaciones, el sistema MUST mostrar un mensaje explicativo con un enlace para donar.

### Key Entities

- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Proyecto** *(común)*.
- **Usuario** con rol donante *(común)*: se relaciona con su Donante por el correo electrónico.

## Dependencies

- **spec-001 (A, misma persona)**: genera las aportaciones que se muestran.
- **spec-003 (B)**: el total anual de este historial debe coincidir con el total del CertificadoFiscal del mismo ejercicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La suma de los totales anuales coincide al céntimo con la suma de las aportaciones confirmadas del donante.
- **SC-002**: El historial de un donante con 5 años de cuotas mensuales se muestra en menos de 2 segundos.
- **SC-003**: Ningún intento de ver el historial de otra persona tiene éxito.

## Assumptions

- El donante accede con una cuenta asociada al correo con el que donó (ver PA1.2 en spec-001).

## Open Questions (para `/speckit-clarify`)

- **PA2.1**: Si el administrador reasigna una donación a otro proyecto, ¿el historial muestra el proyecto actual o el original?
