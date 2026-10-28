# Feature Specification: HU-01 — Donación puntual o alta como socio

**Feature Branch**: `spec-001`

**Created**: 2026-10-14

**Status**: Draft

**Responsable**: *Integrante A* · **Revisor**: *Integrante B*

**Input**: Descripción del SI-13: "cualquier persona interesada en colaborar económicamente pueda hacer una donación puntual o convertirse en socio con una aportación periódica, formalizando el pago a través de una pasarela segura y recibiendo confirmación inmediata de que su colaboración se ha registrado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hacer una donación o hacerse socio (Priority: P1)

Como donante, quiero hacer una donación puntual o hacerme socio con una aportación periódica pagando mediante una pasarela segura, para colaborar económicamente con la ONG y recibir confirmación inmediata de que mi aportación se ha registrado.

El donante elige la modalidad (puntual o socio con periodicidad mensual, trimestral o anual), el importe y, opcionalmente, un proyecto de destino. Introduce sus datos fiscales, paga en la pasarela externa y ve una confirmación con el resumen de su aportación.

**Why this priority**: Es la entrada de todos los datos económicos del sistema. Sin donaciones registradas no hay historial (HU-02), certificado (HU-03) ni informes de recaudación (HU-04).

**Independent Test**: Se completa una donación puntual de 20 € al fondo general con un pago de prueba y se comprueba que aparece la pantalla de confirmación con importe, fecha y referencia, y que llega el correo.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario de donación, **When** elige "puntual", 20 €, sin proyecto, rellena datos válidos y la pasarela confirma el pago, **Then** ve una confirmación con 20,00 €, la fecha, "fondo general" y un número de referencia.
2. **Given** un donante en el formulario, **When** elige "socio", 10 € mensuales y la pasarela confirma, **Then** la confirmación muestra la periodicidad "mensual" y la fecha del próximo cobro.
3. **Given** un donante que elige el proyecto "Agua potable", **When** el pago se confirma, **Then** la aportación queda asociada a ese proyecto.
4. **Given** un importe de 0 €, negativo, no numérico o inferior a 1,00 €, **When** el donante intenta continuar, **Then** el sistema no avanza a la pasarela y explica el motivo.
5. **Given** un NIF/NIE con letra de control incorrecta, **When** el donante intenta continuar, **Then** el sistema lo rechaza y lo indica junto al campo.
6. **Given** un pago en curso, **When** la pasarela lo rechaza o el donante lo cancela, **Then** no queda ninguna donación confirmada y se muestra un mensaje claro con la opción de reintentar.
7. **Given** un pago confirmado, **When** termina el proceso, **Then** el donante recibe un correo con los mismos datos de la confirmación.

---

### Edge Cases

- El donante cierra la ventana durante el pago: la aportación queda "pendiente" y solo pasa a "confirmada" si la pasarela notifica el cobro.
- La pasarela notifica dos veces el mismo pago: la aportación se registra una sola vez.
- El proyecto elegido se desactiva mientras el donante rellena el formulario: se le avisa y se le ofrece el fondo general.
- Importes con más de 2 decimales (10,555 €): no se admiten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer dos modalidades: donación puntual y socio con periodicidad mensual, trimestral o anual.
- **FR-002**: El sistema MUST exigir un importe en euros, positivo, con un máximo de 2 decimales y mínimo de 1,00 €.
- **FR-003**: El sistema MUST permitir elegir opcionalmente un proyecto activo como destino; si no se elige, el destino es "fondo general".
- **FR-004**: El sistema MUST pedir nombre y apellidos, NIF/NIE, correo electrónico y dirección postal, y MUST validar el formato del NIF/NIE y del correo.
- **FR-005**: El pago MUST realizarse en una pasarela de pago externa; el sistema MUST NOT recibir ni almacenar datos de tarjeta.
- **FR-006**: Una aportación MUST quedar "confirmada" solo cuando la pasarela confirma el cobro; en otro caso queda "pendiente", "rechazada" o "cancelada".
- **FR-007**: Tras la confirmación, el sistema MUST mostrar y enviar por correo un resumen con importe, fecha, modalidad, destino y número de referencia único.
- **FR-008**: Para socios, el sistema MUST registrar la periodicidad y mostrar la fecha del próximo cobro.
- **FR-009**: Una misma notificación de pago MUST NOT registrar dos aportaciones.

### Key Entities

- **Donante**: persona que aporta dinero. Nombre, apellidos, NIF/NIE, correo, dirección.
- **Aportación**: importe, fecha de cobro, modalidad (puntual / cuota de socio), estado, referencia, proyecto de destino (opcional).
- **Suscripción de socio**: donante, importe, periodicidad, fecha de alta, fecha del próximo cobro, estado.
- **Proyecto**: nombre, descripción, activo/inactivo (compartido con HU-04, HU-07).

## Success Criteria *(mandatory)*

- **SC-001**: Un donante completa una donación puntual en menos de 3 minutos desde que entra en el formulario.
- **SC-002**: El 100 % de las aportaciones confirmadas tienen correo de confirmación enviado.
- **SC-003**: Ninguna tabla ni registro del sistema contiene números de tarjeta.

## Assumptions

- Se usa la pasarela en modo de pruebas durante el desarrollo.
- Los cobros periódicos posteriores al primero los gestiona la pasarela y se registran como nuevas aportaciones al notificarse.

## Open Questions (para `/speckit.clarify`)

- **PA1.1**: ¿Puede un socio modificar su cuota o darse de baja desde la aplicación? (Propuesta: fuera de alcance en v1.)
- **PA1.2**: ¿Se puede donar sin cuenta? (Propuesta: sí; el historial de HU-02 se asocia por correo electrónico al crear la cuenta.)
