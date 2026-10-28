# Feature Specification: HU-03 — Certificado fiscal anual de donaciones

**Feature Branch**: `spec-003`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nada*

**Input**: Descripción del SI-13: "Cada comienzo de año trae consigo una necesidad muy concreta para quien ha donado: disponer de un certificado fiscal que recoja el total aportado durante el ejercicio anterior, generado automáticamente y listo para descargar, de forma que pueda utilizarlo en su declaración de impuestos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descargar mi certificado fiscal (Priority: P1)

Como donante, quiero descargar al comienzo de cada año un certificado fiscal con el total que aporté el año anterior, para usarlo en mi declaración de impuestos.

A partir del 1 de enero, el sistema genera automáticamente el certificado del ejercicio anterior para cada donante con aportaciones confirmadas en ese ejercicio. El donante lo encuentra en su área personal y lo descarga en PDF sin tener que pedirlo.

**Why this priority**: Es la necesidad anual más concreta del donante y tiene consecuencias fiscales: el total debe ser exacto.

**Independent Test**: Con un donante de prueba con aportaciones de 50 € (marzo 2025) y 30 € (noviembre 2025), se simula la fecha 1 de enero de 2026 y se comprueba que puede descargar un certificado de 2025 por 80,00 €.

**Acceptance Scenarios**:

1. **Given** un donante con aportaciones confirmadas de 50 € y 30 € en 2025, **When** a partir del 1 de enero de 2026 entra en su área personal, **Then** encuentra el certificado del ejercicio 2025 por un total de 80,00 €.
2. **Given** una aportación del 1 de enero de 2026, **When** se genera el certificado de 2025, **Then** esa aportación no se incluye.
3. **Given** un certificado descargado, **When** se abre el PDF, **Then** contiene nombre y CIF de la ONG, nombre, apellidos y NIF/NIE del donante, ejercicio, importe total, fecha de emisión y un código de verificación único.
4. **Given** un donante sin aportaciones confirmadas en 2025, **When** busca el certificado de 2025, **Then** ve un mensaje que explica que no tiene aportaciones en ese ejercicio.
5. **Given** la fecha actual 15 de octubre de 2026, **When** el donante busca el certificado de 2026, **Then** no está disponible y se le indica que se generará a partir del 1 de enero de 2027.
6. **Given** certificados de 2024 y 2025 ya generados, **When** el donante entra en su área personal, **Then** puede descargar ambos.
7. **Given** un donante identificado, **When** intenta descargar el certificado de otro donante, **Then** el sistema deniega el acceso.

---

### Edge Cases

- Donante sin NIF/NIE registrado: no se genera certificado y se le pide completar sus datos.
- Aportaciones rechazadas o pendientes: no suman al total.
- Un mismo certificado se descarga varias veces: siempre tiene el mismo código y los mismos datos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST generar automáticamente, a partir del 1 de enero, un certificado del ejercicio anterior para cada donante con al menos una aportación confirmada en ese ejercicio y NIF/NIE registrado.
- **FR-002**: El total del certificado MUST ser la suma de las aportaciones confirmadas con fecha de cobro entre el 1 de enero y el 31 de diciembre del ejercicio.
- **FR-003**: El certificado MUST incluir datos de la ONG (nombre, CIF), datos del donante (nombre, apellidos, NIF/NIE), ejercicio, total, fecha de emisión y código de verificación único.
- **FR-004**: El certificado MUST poder descargarse en PDF desde el área personal.
- **FR-005**: El sistema MUST conservar y permitir descargar los certificados de ejercicios anteriores.
- **FR-006**: El sistema MUST NOT ofrecer el certificado del ejercicio en curso.
- **FR-007**: Un donante MUST poder descargar solo sus propios certificados.

### Key Entities

- **Certificado fiscal**: donante, ejercicio, importe total, fecha de emisión, código de verificación.
- **Donante** y **Aportación**: definidas en HU1.
- **Datos de la ONG**: nombre, CIF, dirección (configuración del sistema).

## Success Criteria *(mandatory)*

- **SC-001**: El total de cada certificado coincide al céntimo con la suma del año en el historial de HU2.
- **SC-002**: El 1 de enero, el 100 % de los donantes con aportaciones del ejercicio anterior tienen su certificado disponible.

## Assumptions

- El formato del certificado es informativo; la presentación del modelo 182 ante Hacienda queda fuera de alcance.

## Open Questions (para `/speckit.clarify`)

- **PA3.1**: Si se corrige una aportación de un ejercicio con certificado ya emitido, ¿se regenera o se emite uno rectificativo?
- **PA3.2**: ¿Se avisa por correo cuando el certificado está disponible?
