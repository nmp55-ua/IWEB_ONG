# Feature Specification: HU-03 — Certificado fiscal anual de donaciones

**Feature Branch**: `spec-003`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nada*

**Input**: Descripción del SI-13: "Cada comienzo de año trae consigo una necesidad muy concreta para quien ha donado: disponer de un certificado fiscal que recoja el total aportado durante el ejercicio anterior, generado automáticamente y listo para descargar, de forma que pueda utilizarlo en su declaración de impuestos."

## Clarifications

### Session 2026-11-04

- Q: Si se corrige una aportación de un ejercicio después de emitir su certificado, ¿qué pasa con el certificado? (PA3.1) → A: Se regenera el mismo certificado: se recalcula el total, se actualiza la fecha de emisión y se crea un código de verificación nuevo, con lo que el código anterior deja de ser válido. Se mantiene un único certificado por donante y ejercicio. *(Precisada en la sesión 2026-11-08: el motivo es una confirmación tardía, no una corrección.)*
- Q: Cuando el certificado de un donante está disponible (nuevo o regenerado), ¿se le avisa por correo? (PA3.2) → A: Sí, se envía un correo al emitir o regenerar un certificado, con enlace al área personal y sin el PDF adjunto.
- Q: Si un donante no tenía NIF/NIE el 1 de enero y lo añade más tarde, ¿se genera entonces su certificado del año anterior? → A: Sí, automáticamente: al registrar el NIF/NIE se generan los certificados que le falten de ejercicios cerrados y se le envía el correo de aviso. *(Sustituida en la sesión 2026-11-08: HU-01 exige NIF/NIE.)*
- Q: ¿Debe haber una página pública donde un tercero compruebe con el código de verificación si un certificado es auténtico y sigue siendo válido? → A: Sí: página pública sin login; con un código válido muestra ejercicio, importe, fecha de emisión y NIF/NIE enmascarado; un código antiguo o inexistente aparece como "no válido".
- Q: Si un donante ha donado sin crear una cuenta de usuario, ¿se genera también su certificado y cómo accede a él? → A: Se genera igualmente; el correo de aviso le invita a crear una cuenta con ese mismo correo y, al hacerlo, se enlaza automáticamente y ve sus certificados. *(Sustituida en la sesión 2026-11-08: el vínculo es el verificado de HU-01.)*

### Session 2026-11-08

- Q: ¿Qué se hace con el donante sin NIF/NIE, si HU-01 exige un NIF/NIE válido en cada donación y no permite añadirlo ni cambiarlo después? → A: Se elimina el caso: todo Donante tiene NIF/NIE porque lo garantiza HU-01 (`004_donaciones`); se quitan FR-010, el escenario 10 y el caso límite correspondiente.
- Q: ¿Qué pasa con un certificado ya emitido si después se confirma un cobro de ese mismo ejercicio (p. ej., pago del 31/12 confirmado el 2 de enero)? → A: Se regenera el mismo certificado con el nuevo total, nueva fecha de emisión y código nuevo; el código anterior deja de ser válido y se envía el correo de aviso. HU-01 no corrige ni anula aportaciones confirmadas, así que la confirmación tardía es el único motivo de cambio del total.
- Q: ¿Cómo accede a sus certificados un donante que donó sin cuenta, si en HU-01 tener el mismo correo no da acceso y el vínculo solo se crea con el enlace verificado de `/donar/vincular`? → A: El certificado se genera igualmente; el correo le invita a crear una cuenta de donante (o entrar con la suya) y vincularla desde `/donar/vincular`. Una vez vinculada, ve todos sus certificados. HU-03 no crea vínculos ni usa la coincidencia de correo como autorización.

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
8. **Given** un certificado de 2025 por 80,00 € ya emitido, **When** el 02/01/2026 se confirma una aportación de 20 € con fecha de cobro del 31/12/2025 y el total pasa a 100,00 €, **Then** el certificado de 2025 se regenera por 100,00 € con nueva fecha de emisión y un código de verificación nuevo, el código anterior deja de ser válido y el donante sigue teniendo un único certificado de 2025.
9. **Given** un donante con correo registrado, **When** se emite o se regenera su certificado de un ejercicio, **Then** recibe un correo que le avisa de que está disponible, con enlace a su área personal y sin el PDF adjunto.
10. **Given** el código de verificación actual de un certificado, **When** cualquier persona, sin iniciar sesión, lo introduce en la página pública de verificación, **Then** ve que es válido junto con el ejercicio, el importe, la fecha de emisión y el NIF/NIE enmascarado (p. ej. `***4567*`).
11. **Given** el código anterior de un certificado regenerado, o un código inexistente, **When** se introduce en la página de verificación, **Then** aparece como "no válido" sin mostrar ningún dato.
12. **Given** un donante con aportaciones confirmadas en 2025 y sin cuenta de usuario, **When** se generan los certificados de 2025, **Then** se genera también el suyo y recibe un correo que le invita a crear una cuenta de donante y vincularla desde `/donar/vincular`; tras completar el vínculo verificado, ve su certificado de 2025 en su área personal.

---

### Edge Cases

- Aportaciones pendientes, rechazadas o canceladas: no suman al total.
- Un mismo certificado se descarga varias veces: siempre tiene el mismo código y los mismos datos.
- Confirmación tardía de un cobro de un ejercicio cerrado en el que el Donante aún no tenía certificado: se emite en ese momento y se envía el correo de aviso.
- Una aportación que pasa a rechazada o cancelada nunca estuvo confirmada: no cambia el total ni regenera el certificado.
- Falla el envío del correo de aviso: el certificado queda emitido igualmente y el error se registra.
- Aportación del 31/12 a las 23:59 (hora peninsular): cuenta en ese ejercicio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST generar automáticamente, a partir del 1 de enero, un CertificadoFiscal del ejercicio anterior para cada Donante con un total mayor que cero en ese ejercicio. Todo Donante tiene NIF/NIE válido porque HU-01 lo exige al donar; HU-03 no ofrece ningún flujo para añadirlo ni cambiarlo.
- **FR-002**: El total del certificado MUST ser la suma, al céntimo, de las aportaciones confirmadas con fecha de cobro entre el 1 de enero y el 31 de diciembre del ejercicio (hora peninsular).
- **FR-003**: El certificado MUST incluir datos de la ONG (nombre, CIF), datos del donante (nombre, apellidos, NIF/NIE), ejercicio, total, fecha de emisión y código de verificación único.
- **FR-004**: El certificado MUST poder descargarse en PDF desde el área personal del donante.
- **FR-005**: El sistema MUST conservar y permitir descargar los certificados de ejercicios anteriores ya generados.
- **FR-006**: El sistema MUST NOT ofrecer el certificado del ejercicio en curso.
- **FR-007**: Un donante MUST poder descargar solo sus propios certificados; la comprobación se hace en el servidor.
- **FR-008**: Si después de emitir el certificado de un ejercicio cerrado se confirma una aportación con fecha de cobro en ese ejercicio (confirmación tardía), el sistema MUST regenerar ese mismo certificado con el nuevo total, nueva fecha de emisión y un código de verificación nuevo; el código anterior deja de ser válido. Si el Donante aún no tenía certificado de ese ejercicio, se emite. Por cada Donante y ejercicio hay como máximo un certificado. HU-01 no corrige ni anula aportaciones confirmadas, por lo que HU-03 no contempla otras correcciones.
- **FR-009**: Al emitir o regenerar un certificado, el sistema MUST enviar al Donante un correo que avise de que está disponible, con enlace a su área personal y sin el PDF adjunto. Si el Donante no tiene cuenta de usuario vinculada, el correo le invita a crear una cuenta de donante (o entrar con la suya) y vincularla desde `/donar/vincular`. Si el envío falla, el certificado se mantiene y el error se registra.
- **FR-010**: *(Eliminado en la sesión 2026-11-08: HU-01 exige NIF/NIE, no puede existir un Donante sin él.)*
- **FR-011**: El sistema MUST ofrecer una página pública, sin inicio de sesión, donde se introduce un código de verificación. Si corresponde a un certificado actual, muestra "válido", ejercicio, importe total, fecha de emisión y NIF/NIE enmascarado (solo los 4 últimos dígitos visibles); MUST NOT mostrar nombre completo, correo ni dirección. Cualquier otro código se muestra como "no válido" sin datos.
- **FR-012**: El certificado MUST generarse aunque el Donante no tenga cuenta de usuario vinculada. El acceso desde el área personal exige el vínculo verificado de HU-01 (`donantes.usuario_id` igual a la cuenta autenticada); una vez vinculada, la cuenta ve todos los certificados ya generados. La coincidencia de correo MUST NOT conceder acceso y HU-03 no crea vínculos.

### Key Entities

- **CertificadoFiscal** *(dueño: spec-003)*: Donante, ejercicio, importe total, fecha de emisión, código de verificación. Uno por Donante y ejercicio; al regenerarse se actualizan total, fecha de emisión y código.
- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Datos de la ONG** (nombre, CIF): configuración del sistema, no una entidad nueva.

## Dependencies

- **spec-001 (A)**: necesita Donante con NIF/NIE y Aportación con estado y fecha de cobro, además del vínculo verificado cuenta–Donante (`/donar/vincular`). Ya integrada en `main` (PR #4).
- **spec-002 (A)**: el total del certificado debe coincidir con el total anual del historial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El total de cada certificado coincide al céntimo con el total del mismo año en el historial (HU-02).
- **SC-002**: El 1 de enero, el 100 % de los donantes con aportaciones confirmadas del ejercicio anterior tienen su certificado disponible.

## Assumptions

- El certificado es informativo; la presentación del modelo 182 ante Hacienda queda fuera de alcance.
