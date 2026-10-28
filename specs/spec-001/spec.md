# Feature Specification: HU-01 — Donación puntual o alta como socio

**Feature Branch**: `spec-001`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Integrante A* · **Revisor**: *Integrante B*

**Input**: Descripción del SI-13: "cualquier persona interesada en colaborar económicamente pueda hacer una donación puntual o convertirse en socio con una aportación periódica, formalizando el pago a través de una pasarela segura y recibiendo confirmación inmediata de que su colaboración se ha registrado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hacer una donación puntual (Priority: P1)

Como donante, quiero hacer una donación puntual pagando mediante una pasarela segura, para colaborar económicamente con la ONG y recibir confirmación inmediata de que mi aportación se ha registrado.

El donante indica el importe y, si quiere, un proyecto de destino; introduce sus datos fiscales, paga en la pasarela externa y ve una confirmación con el resumen de su aportación, que también recibe por correo.

**Why this priority**: Es la entrada de todo el dinero del sistema. Sin aportaciones no hay historial (HU-02), certificado (HU-03) ni informes de recaudación (HU-04).

**Independent Test**: Se completa una donación puntual de 20 € al fondo general con un pago de prueba y se comprueba la pantalla de confirmación (importe, fecha, destino, referencia) y el correo.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario de donación, **When** elige «puntual», 20 €, sin proyecto, rellena datos válidos y la pasarela confirma el pago, **Then** ve una confirmación con 20,00 €, la fecha (dd/mm/aaaa), la modalidad, «fondo general» y un número de referencia.
2. **Given** un donante que elige el proyecto «Agua potable», **When** el pago se confirma, **Then** la aportación queda asociada a ese proyecto y la confirmación lo muestra.
3. **Given** un importe de 0 €, negativo, no numérico, inferior a 1,00 € o con más de 2 decimales, **When** el donante intenta continuar, **Then** el sistema no avanza a la pasarela y explica el motivo junto al campo.
4. **Given** un NIF/NIE con formato o letra de control inválidos, **When** el donante intenta continuar, **Then** el sistema lo rechaza y lo indica junto al campo.
5. **Given** un pago en curso, **When** la pasarela lo rechaza o el donante lo cancela, **Then** no queda ninguna aportación confirmada y se muestra un mensaje claro con el motivo y la opción de reintentar.
6. **Given** un pago confirmado, **When** termina el proceso, **Then** el donante recibe un correo con los mismos datos que vio en pantalla.

---

### User Story 2 - Hacerse socio con aportación periódica (Priority: P1)

Como donante, quiero hacerme socio con una aportación mensual, trimestral o anual, para colaborar de forma continuada.

**Why this priority**: Es la otra modalidad de entrada de dinero y comparte casi todo el flujo con la donación puntual.

**Independent Test**: Se da de alta un socio con 10 €/mes con un pago de prueba y se comprueba que la confirmación muestra la periodicidad y la fecha del próximo cobro.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario, **When** elige «socio», 10 € mensuales y la pasarela confirma el primer cobro, **Then** la confirmación muestra 10,00 €, la periodicidad «mensual» y la fecha del próximo cobro.
2. **Given** un socio dado de alta, **When** la pasarela notifica un cobro periódico posterior, **Then** se registra como una nueva aportación confirmada de modalidad «cuota de socio».
3. **Given** un alta como socio, **When** la pasarela rechaza el primer cobro, **Then** no queda ninguna suscripción activa ni aportación confirmada.

---

### Edge Cases

- El donante cierra la ventana durante el pago: la aportación queda «pendiente» y solo pasa a «confirmada» si la pasarela notifica el cobro.
- La pasarela notifica dos veces el mismo pago: la aportación se registra una sola vez.
- El proyecto elegido deja de estar activo mientras el donante rellena el formulario: se le avisa y se le ofrece el fondo general.
- Un donante que ya existe (mismo NIF/NIE o correo) vuelve a donar: la aportación se asocia al mismo Donante, sin duplicarlo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer dos modalidades: donación puntual y socio con periodicidad mensual, trimestral o anual.
- **FR-002**: El sistema MUST exigir un importe en euros, positivo, con un máximo de 2 decimales y un mínimo de 1,00 €.
- **FR-003**: El sistema MUST permitir elegir opcionalmente un Proyecto activo como destino; si no se elige, el destino es «fondo general».
- **FR-004**: El sistema MUST pedir nombre y apellidos, NIF/NIE, correo electrónico y dirección postal (solo estos datos), y MUST validar el formato del NIF/NIE (incluida la letra de control) y del correo.
- **FR-005**: El pago MUST realizarse en una pasarela de pago externa; el sistema MUST NOT recibir ni almacenar datos de tarjeta.
- **FR-006**: Una Aportación MUST quedar «confirmada» solo cuando la pasarela confirma el cobro; en otro caso queda «pendiente», «rechazada» o «cancelada». Las aportaciones cambian de estado, nunca se eliminan.
- **FR-007**: Tras la confirmación, el sistema MUST mostrar y enviar por correo un resumen con importe, fecha, modalidad, destino y un número de referencia único.
- **FR-008**: Para socios, el sistema MUST registrar una SuscripcionSocio con importe y periodicidad, y MUST mostrar la fecha del próximo cobro.
- **FR-009**: Cada cobro periódico confirmado por la pasarela MUST registrarse como una nueva Aportación de modalidad «cuota de socio».
- **FR-010**: Una misma notificación de pago MUST NOT registrar dos aportaciones.

### Key Entities

- **Donante** *(dueño: spec-001)*: persona que aporta dinero. Nombre, apellidos, NIF/NIE, correo, dirección postal. Puede estar ligado a un Usuario con rol donante.
- **Aportación** *(dueño: spec-001)*: Donante, importe, fecha de cobro, modalidad (puntual / cuota de socio), estado (pendiente / confirmada / rechazada / cancelada), referencia, Proyecto de destino (opcional = fondo general), SuscripcionSocio de origen (si es cuota).
- **SuscripcionSocio** *(dueño: spec-001)*: Donante, importe, periodicidad, fecha de alta, fecha del próximo cobro, estado.
- **Proyecto** *(común)*: nombre, descripción, activo / inactivo.

## Dependencies

- **Base común**: entidades Usuario (con rol) y Proyecto, inicio de sesión.
- **spec-002 (A)**, **spec-003 (B)** y **spec-004 (B)** consumen Donante, Aportación y SuscripcionSocio: cualquier cambio en estas entidades se acuerda con B.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un donante completa una donación puntual en menos de 3 minutos desde que entra en el formulario.
- **SC-002**: El 100 % de las aportaciones confirmadas generan su correo de confirmación.
- **SC-003**: En ningún dato guardado por la ONG aparece un número de tarjeta.
- **SC-004**: El importe mostrado en la confirmación coincide al céntimo con el cobrado por la pasarela.

## Assumptions

- Durante el desarrollo se usa la pasarela en modo de pruebas.
- Los cobros periódicos posteriores al primero los realiza la pasarela y se registran al notificarse.
- Las fechas y horas se muestran en hora peninsular española.

## Open Questions (para `/speckit-clarify`)

- **PA1.1**: ¿Puede un socio modificar el importe o darse de baja desde la aplicación? (Propuesta: fuera de alcance en v1.)
- **PA1.2**: ¿Se permite donar sin crear cuenta? (Propuesta: sí, pero el historial de HU-02 solo está disponible para quien tenga cuenta con el mismo correo.)
