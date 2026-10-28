# Feature Specification: HU-03 — Certificado fiscal anual de donaciones

**Feature Branch**: `spec-003`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nada*

**Input**: Descripción del SI-13: "Cada comienzo de año trae consigo una necesidad muy concreta para quien ha donado: disponer de un certificado fiscal que recoja el total aportado durante el ejercicio anterior, generado automáticamente y listo para descargar, de forma que pueda utilizarlo en su declaración de impuestos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descargar mi certificado fiscal (Priority: P1)

Como donante, quiero descargar al comienzo de cada año un certificado fiscal con el total que aporté el año anterior, para usarlo en mi declaración de impuestos.

A partir del 1 de enero, el sistema genera automáticamente el certificado del ejercicio anterior para cada donante con aportaciones confirmadas en ese ejercicio. El donante lo encuentra en su área personal y lo descarga en PDF sin tener que pedirlo.

**Why this priority**: Es la necesidad anual más concreta del donante y tiene consecuencias fiscales: el total debe ser exacto.

**Independent Test**: Con un donante de prueba con aportaciones de 50 € (marzo de 2025) y 30 € (noviembre de 2025), y con la fecha del sistema en el 1 de enero de 2026, se comprueba que puede descargar un certificado de 2025 por 80,00 €.

**Acceptance Scenarios**:

1. **Given** un donante con aportaciones confirmadas de 50 € y 30 € en 2025, **When** a partir del 01/01/2026 entra en su área personal, **Then** encuentra el certificado del ejercicio 2025 por un total de 80,00 €.
2. **Given** una aportación del 01/01/2026, **When** se genera el certificado de 2025, **Then** esa aportación no se incluye.
3. **Given** un certificado descargado, **When** se abre el PDF, **Then** contiene nombre y CIF de la ONG, nombre, apellidos y NIF/NIE del donante, ejercicio, importe total, fecha de emisión y un código de verificación único.
4. **Given** un donante sin aportaciones confirmadas en 2025, **When** busca el certificado de 2025, **Then** ve un mensaje que explica que no tiene aportaciones en ese ejercicio.
5. **Given** la fecha actual 15/10/2026, **When** el donante busca el certificado de 2026, **Then** no está disponible y se le indica que se generará a partir del 01/01/2027.
6. **Given** certificados de 2024 y 2025 ya generados, **When** el donante entra en su área personal, **Then** puede descargar ambos.
7. **Given** un donante identificado, **When** intenta descargar el certificado de otro donante, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Donante sin NIF/NIE registrado: no se genera certificado y se le indica que complete sus datos.
- Aportaciones pendientes, rechazadas o canceladas: no suman al total.
- Un mismo certificado se descarga varias veces: siempre tiene el mismo código y los mismos datos.
- Aportación del 31/12 a las 23:59 (hora peninsular): cuenta en ese ejercicio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST generar automáticamente, a partir del 1 de enero, un CertificadoFiscal del ejercicio anterior para cada Donante con NIF/NIE registrado y un total mayor que cero en ese ejercicio.
- **FR-002**: El total del certificado MUST ser la suma, al céntimo, de las aportaciones confirmadas con fecha de cobro entre el 1 de enero y el 31 de diciembre del ejercicio (hora peninsular).
- **FR-003**: El certificado MUST incluir datos de la ONG (nombre, CIF), datos del donante (nombre, apellidos, NIF/NIE), ejercicio, total, fecha de emisión y código de verificación único.
- **FR-004**: El certificado MUST poder descargarse en PDF desde el área personal del donante.
- **FR-005**: El sistema MUST conservar y permitir descargar los certificados de ejercicios anteriores ya generados.
- **FR-006**: El sistema MUST NOT ofrecer el certificado del ejercicio en curso.
- **FR-007**: Un donante MUST poder descargar solo sus propios certificados; la comprobación se hace en el servidor.

### Key Entities

- **CertificadoFiscal** *(dueño: spec-003)*: Donante, ejercicio, importe total, fecha de emisión, código de verificación.
- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Datos de la ONG** (nombre, CIF): configuración del sistema, no una entidad nueva.

## Dependencies

- **spec-001 (A)**: necesita Donante con NIF/NIE y Aportación con estado y fecha de cobro. Mientras no exista, se trabaja con datos de prueba.
- **spec-002 (A)**: el total del certificado debe coincidir con el total anual del historial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El total de cada certificado coincide al céntimo con el total del mismo año en el historial (HU-02).
- **SC-002**: El 1 de enero, el 100 % de los donantes con aportaciones del ejercicio anterior y NIF/NIE tienen su certificado disponible.

## Assumptions

- El certificado es informativo; la presentación del modelo 182 ante Hacienda queda fuera de alcance.

## Open Questions (para `/speckit-clarify`)

- **PA3.1**: Si se corrige una donación de un ejercicio después de emitir su certificado, ¿se regenera el certificado o se emite uno rectificativo?
- **PA3.2**: ¿Se avisa al donante por correo cuando su certificado está disponible?
