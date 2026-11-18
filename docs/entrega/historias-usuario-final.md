# Sistema de Información 13 — Gestión de Donaciones y Voluntariado para una ONG

## Historias de usuario y especificaciones finales

*Pila tecnológica: Astro + React (islas) · Node.js/Express · PostgreSQL · Tailwind CSS*

Entregable 1. Recoge las ocho historias de usuario identificadas a partir de la descripción narrativa, con su especificación final (después de clarify, analyze y converge) y sus criterios de aceptación. Cada historia indica el integrante responsable y su revisor. La fuente de cada capítulo es `specs/spec-00N/spec.md` en el repositorio.

### Reparto de historias

| Spec | Historia | Responsable | Revisor |
|---|---|---|---|
| spec-001 | HU-01 — Donación puntual o alta como socio | Nada | Rubén |
| spec-002 | HU-02 — Historial de aportaciones del donante | Nada | Javi |
| spec-003 | HU-03 — Certificado fiscal anual de donaciones | Rubén | Nada |
| spec-004 | HU-04 — Informes de recaudación y voluntariado para la junta | Rubén | Nicole |
| spec-005 | HU-05 — Consulta e inscripción en actividades de voluntariado | Javi | Nicole |
| spec-006 | HU-06 — Calendario personal del voluntario | Javi | Nada |
| spec-007 | HU-07 — Gestión de actividades, plazas y lista de espera | Nicole | Javi |
| spec-008 | HU-08 — Registro de asistencia y acumulación de horas | Nicole | Rubén |

<div style="page-break-before:always"></div>

## spec-001 · HU-01 — Donación puntual o alta como socio

**Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva.

**Feature Branch**: `spec-001`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nada* · **Revisor**: *Rubén*

**Input**: Descripción del SI-13: "cualquier persona interesada en colaborar económicamente pueda hacer una donación puntual o convertirse en socio con una aportación periódica, formalizando el pago a través de una pasarela segura y recibiendo confirmación inmediata de que su colaboración se ha registrado."

### Clarifications

Las sesiones fechadas conservan la evolución de las decisiones. El estado vigente se recoge
en requisitos y dependencias; las referencias históricas a ajustes pendientes no sustituyen
la alineación documental actual de esta rama.

#### Session 2026-11-04

- Q: ¿Debe un socio poder modificar el importe de su cuota o darse de baja desde la aplicación en esta primera versión? (PA1.1) → A: No. Ambas operaciones quedan fuera de alcance en v1; Se mantienen el alta como socio y el registro de los cobros periódicos previstos en HU-01.
- Q: ¿Debe ser obligatorio tener una cuenta para hacer una donación puntual o darse de alta como socio? (PA1.2) → A: No. Ambas modalidades pueden completarse sin cuenta. Para consultar el historial es necesario iniciar sesión con una cuenta del mismo correo utilizado al donar; la coincidencia de correos no acredita por sí sola su titularidad. La comprobación previa a la vinculación se concreta en PA1.3.
- Q: ¿Cómo debe demostrar una persona que controla el correo utilizado al donar antes de vincular las aportaciones a su cuenta? (PA1.3) → A: Antes de vincular las aportaciones a una cuenta, debe abrirse un enlace de verificación enviado al correo utilizado al donar. La comprobación se limita al módulo de donaciones y a esa vinculación, sin cambiar el registro ni el inicio de sesión generales. Los ajustes comunes quedan identificados y sin realizar.
- Q: ¿Qué debe ocurrir si el cobro está confirmado pero falla el envío del correo de confirmación? (PA1.4) → A: Se conserva la aportación confirmada, se muestra el resumen y se avisa del fallo. Se permite reintentar únicamente el envío del correo, sin iniciar otro cobro ni crear otra aportación. El aviso no equivale a un envío satisfactorio.
- Q: ¿Qué debe ocurrir si alguien introduce un correo ya utilizado por un donante, pero con un NIF/NIE diferente? (PA1.5) → A: Se detiene la operación antes del pago y se pide revisar los datos, sin mostrar datos del donante existente, modificarlo ni mezclar aportaciones. El correo por sí solo no identifica al donante. El ajuste del modelo común queda identificado y sin realizar; actualmente solo establece como único el NIF/NIE.

#### Session 2026-11-04 — Ronda 2

- Q: ¿Qué debe hacerse si una nueva aportación usa un NIF/NIE ya registrado, pero otro correo o datos fiscales distintos? (PA1.6) → A: En v1, HU-01 no permite modificar el correo, nombre, apellidos ni dirección de un Donante existente. Si el mismo NIF/NIE se presenta con cambios reales, se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante. Las correcciones quedan fuera de v1; Se acepta que no puedan usarse datos nuevos mediante este flujo. Las diferencias meramente de formato deben distinguirse de los cambios reales; su tratamiento se concretará en plan.
- Q: ¿Cómo debe acceder una persona sin cuenta al resultado de su pago y al reintento del correo de confirmación? (PA1.7) → A: Únicamente desde la sesión vigente de la operación iniciada en ese navegador. La autorización se limita a esa operación y no permite consultar otras aportaciones ni el historial; conocer la referencia por sí solo no da acceso. Si se pierde o caduca esa sesión, recuperar el acceso directo sin cuenta queda fuera de v1. Esto no cancela el pago ni elimina la aportación: las notificaciones válidas de la pasarela siguen procesándose aunque se cierre el navegador o no se vuelva a la aplicación. Los mecanismos técnicos se concretarán en plan.
- Q: ¿Qué debe ocurrir con la suscripción y la información del próximo cobro si falla una cuota posterior al alta como socio? (PA1.8) → A: Se registra el fallo sin considerar pagada la cuota ni incrementar el total aportado. El fallo por sí solo no cancela la suscripción ni altera las aportaciones anteriores; Se informa del fallo. Debe procesarse una cancelación que comunique posteriormente la pasarela. Solo se muestra una fecha futura de cobro comunicada por ella; si no existe, se muestra «Pendiente de confirmación». La aplicación no inicia cobros adicionales por su cuenta. Los eventos concretos y su tratamiento técnico corresponden a plan.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Hacer una donación puntual (Priority: P1)

Como donante, quiero hacer una donación puntual pagando mediante una pasarela segura, para colaborar económicamente con la ONG y recibir confirmación inmediata de que mi aportación se ha registrado.

El donante indica el importe y, si quiere, un proyecto de destino; introduce sus datos fiscales, paga en la pasarela externa y ve una confirmación con el resumen de su aportación, que también recibe por correo. Puede completar la donación sin crear una cuenta ni iniciar sesión.

**Why this priority**: Es la entrada de todo el dinero del sistema. Sin aportaciones no hay historial (HU-02), certificado (HU-03) ni informes de recaudación (HU-04).

**Independent Test**: Se completa una donación puntual de 20 € al fondo general con un pago de prueba y se comprueba la pantalla de confirmación (importe, fecha, destino, referencia) y el correo.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario de donación, **When** elige «puntual», 20 €, sin proyecto, rellena datos válidos y la pasarela confirma el pago, **Then** ve una confirmación con 20,00 €, la fecha (dd/mm/aaaa), la modalidad, «fondo general» y un número de referencia.
2. **Given** un donante que elige el proyecto «Agua potable», **When** el pago se confirma, **Then** la aportación queda asociada a ese proyecto y la confirmación lo muestra.
3. **Given** un importe de 0 €, negativo, no numérico, inferior a 1,00 €, superior a 999.999,99 € o con más de 2 decimales, **When** el donante intenta continuar, **Then** el sistema no avanza a la pasarela y explica el motivo junto al campo.
4. **Given** un NIF/NIE con formato o letra de control inválidos, **When** el donante intenta continuar, **Then** el sistema lo rechaza y lo indica junto al campo.
5. **Given** un pago en curso, **When** la pasarela lo rechaza o el donante lo cancela, **Then** no queda ninguna aportación confirmada y se muestra un mensaje claro con el motivo y la opción de reintentar.
6. **Given** un pago confirmado y un servicio de correo disponible, **When** se envía correctamente la confirmación, **Then** el donante recibe un correo con los mismos datos que vio en pantalla; mostrar el resumen o un aviso no acredita por sí solo ese envío.
7. **Given** una persona sin cuenta ni sesión iniciada, **When** completa los datos válidos de una donación puntual y la pasarela confirma el cobro, **Then** puede finalizar la donación y recibir su confirmación sin registrarse.
8. **Given** una aportación cuyo cobro ha sido confirmado, **When** falla el envío del correo de confirmación, **Then** la aportación conserva el estado «confirmada», se muestra su resumen y un aviso de fallo con la opción de reintentar únicamente el correo; su envío queda pendiente.
9. **Given** una aportación confirmada cuyo correo no se ha enviado por un fallo y una autorización vigente para esa operación, **When** el donante reintenta el envío y este tiene éxito, **Then** recibe el mismo resumen de la aportación, se informa del envío satisfactorio y se conservan la referencia y la única aportación existente, sin iniciar otro cobro.
10. **Given** una aportación confirmada con el correo pendiente tras un fallo y una autorización vigente para esa operación, **When** el donante reintenta el envío y vuelve a fallar, **Then** se mantiene la aportación confirmada y el aviso de correo pendiente con la opción de reintentar mientras conserve la autorización; no se informa de un envío satisfactorio, no se inicia otro cobro ni se crea otra aportación.
11. **Given** una cuenta identificada cuyo correo coincide con el utilizado al donar, pero sin haber acreditado el acceso a ese buzón, **When** entra en «Vincular mis aportaciones a una cuenta» desde el formulario o resultado de donación y solicita el enlace en la página sin token, **Then** el sistema no establece el vínculo por la mera coincidencia del correo y exige su verificación mediante un enlace enviado a ese buzón.
12. **Given** una cuenta identificada con el mismo correo utilizado al donar, **When** solicita el enlace desde /donar/vincular, recibe el aviso genérico, acredita el acceso al buzón abriendo ese enlace y confirma explícitamente la vinculación, **Then** el sistema permite vincular al Donante correspondiente con esa cuenta; esta comprobación no se exige para completar una donación sin cuenta.
13. **Given** un correo ya utilizado por un Donante, **When** se solicita una donación puntual con ese correo y otro NIF/NIE, **Then** el sistema detiene la operación antes del pago y pide revisar los datos, sin mostrar datos del Donante existente, modificarlo ni mezclar sus aportaciones.
14. **Given** un Donante existente cuyo NIF/NIE, correo, nombre, apellidos y dirección coinciden con los de una nueva donación, distinguiendo diferencias meramente de formato de cambios reales, **When** se registra la nueva aportación, **Then** se asocia al mismo Donante sin duplicarlo ni sobrescribir sus datos; esto no acredita por sí solo la autorización para vincularlo con una cuenta.
15. **Given** un NIF/NIE ya registrado, **When** se intenta una nueva donación puntual con ese NIF/NIE y otro correo, **Then** se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los datos guardados, sobrescribirlos ni crear otro Donante.
16. **Given** un Donante existente, incluso con una cuenta identificada y vinculada, **When** se intenta una nueva donación puntual con el mismo NIF/NIE y cambios reales en nombre, apellidos o dirección, **Then** se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante; tener una cuenta vinculada no habilita la edición de esos datos desde HU-01.
17. **Given** datos válidos de un Donante existente que solo presentan diferencias de formato y son equivalentes tras distinguirlas de cambios reales, **When** se solicita otra donación, **Then** esas diferencias de formato no se consideran modificaciones de datos fiscales y se reutiliza al Donante sin sobrescribirlo ni duplicarlo; las reglas concretas para determinar esa equivalencia se definirán en plan.
18. **Given** una persona sin cuenta que conserva la sesión vigente de la operación iniciada en ese navegador, **When** consulta el resultado de esa operación, **Then** puede ver su estado y, si está confirmada, su resumen; si ha fallado el correo, puede reintentar únicamente su envío conforme a FR-012.
19. **Given** una persona que conoce la referencia de una aportación pero no conserva una sesión vigente autorizada para esa operación, **When** intenta consultar el resultado o reintentar su correo, **Then** se deniega el acceso sin mostrar datos ni enviar el correo y no se ofrece recuperación de ese acceso directo sin cuenta en v1.
20. **Given** una sesión vigente autorizada para una operación, **When** se intenta usarla para consultar otra aportación, reintentar el correo de otra operación o acceder al historial sin una cuenta identificada y vinculada, **Then** esa autorización no concede acceso a dichos recursos ni permite enviar el correo de otra operación.
21. **Given** una aportación iniciada cuyo pago todavía no se ha confirmado, **When** se cierra el navegador o se pierde o caduca la sesión y después llega una notificación válida de cobro de la pasarela, **Then** se procesa y confirma la aportación una sola vez sin exigir que el donante vuelva a la aplicación; la pérdida de sesión por sí sola no cancela el pago ni elimina la aportación.

<div style="page-break-before:always"></div>

#### User Story 2 - Hacerse socio con aportación periódica (Priority: P1)

Como donante, quiero hacerme socio con una aportación mensual, trimestral o anual, para colaborar de forma continuada. Puedo completar el alta sin crear una cuenta ni iniciar sesión.

**Why this priority**: Es la otra modalidad de entrada de dinero y comparte casi todo el flujo con la donación puntual.

**Independent Test**: Se da de alta un socio con 10 €/mes con un pago de prueba y se comprueba que la confirmación muestra la periodicidad y la fecha del próximo cobro.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario, **When** elige «socio», 10 € mensuales y la pasarela confirma el primer cobro, **Then** la confirmación muestra 10,00 €, la periodicidad «mensual» y la fecha del próximo cobro.
2. **Given** un socio dado de alta, **When** la pasarela notifica un cobro periódico posterior, **Then** se registra como una nueva aportación confirmada de modalidad «cuota de socio».
3. **Given** un alta como socio, **When** la pasarela rechaza el primer cobro, **Then** no queda ninguna suscripción activa ni aportación confirmada.
4. **Given** una persona sin cuenta ni sesión iniciada, **When** completa los datos válidos del alta como socio y la pasarela confirma el primer cobro, **Then** puede finalizar el alta y recibir su confirmación sin registrarse.
5. **Given** un alta como socio con el primer cobro confirmado, **When** falla el envío del correo de confirmación, **Then** se mantienen la suscripción activa y la aportación confirmada, se muestran el resumen, la periodicidad y el próximo cobro y se avisa del correo pendiente con la opción de reintentar exclusivamente su envío.
6. **Given** una cuota de socio confirmada cuyo correo ha fallado y una autorización vigente para esa operación, **When** se reintenta su envío, **Then** se informa de su resultado real y se conserva la cuota ya registrada, sin crear otra aportación ni suscripción ni iniciar otro cobro; si falla de nuevo, el correo sigue pendiente. La autorización sin cuenta del alta no concede por sí sola acceso a cuotas posteriores, que son otras operaciones.
7. **Given** un correo ya utilizado por un Donante, **When** se solicita un alta de socio con ese correo y otro NIF/NIE, **Then** el sistema detiene la operación antes del pago y pide revisar los datos, sin mostrar datos del Donante existente, modificarlo ni mezclar sus aportaciones.
8. **Given** un Donante existente, **When** se solicita un alta de socio con el mismo NIF/NIE y cambios reales en correo, nombre, apellidos o dirección, **Then** se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante; las correcciones quedan fuera de v1.
9. **Given** un alta como socio iniciada cuyo primer cobro está pendiente, **When** se pierde la sesión o no se vuelve a la aplicación y llega una notificación válida del primer cobro confirmado, **Then** se registra la aportación y se activa la suscripción conforme a las reglas del alta, sin depender del retorno del navegador ni de su sesión; el acceso directo sin cuenta sigue sujeto a FR-016.
10. **Given** una suscripción activa con aportaciones anteriores confirmadas, **When** la pasarela comunica válidamente el fallo de una cuota posterior al alta, **Then** se registra e informa el fallo sin considerar pagada esa cuota ni incrementar el total aportado, se conservan intactas las aportaciones anteriores y el fallo por sí solo no cancela la suscripción ni provoca un cobro adicional iniciado por la aplicación.
11. **Given** una cuota posterior fallida y una fecha futura de cobro comunicada por la pasarela, **When** se muestra la información del próximo cobro, **Then** aparece únicamente esa fecha comunicada, sin calcular o inventar otra fecha por la aplicación.
12. **Given** una cuota posterior fallida sin fecha futura de cobro comunicada por la pasarela, **When** se muestra la información del próximo cobro, **Then** aparece «Pendiente de confirmación»; una fecha ya pasada no se presenta como próximo cobro.
13. **Given** una suscripción que permaneció activa tras el fallo de una cuota, **When** la pasarela comunica posteriormente una cancelación válida, **Then** el sistema procesa la cancelación y muestra la suscripción cancelada, sin modificar ni eliminar las aportaciones anteriores y sin iniciar un cobro adicional por su cuenta; la exclusión de la baja desde la aplicación no permite ignorar esa notificación.

<div style="page-break-before:always"></div>

#### Edge Cases

- El donante cierra la ventana durante el pago o pierde la sesión: esto no cancela el pago ni elimina la aportación. La aportación queda «pendiente» hasta que la pasarela comunique un resultado válido; Se procesa esa notificación aunque el donante no vuelva a la aplicación. Perder la sesión impide recuperar el acceso directo sin cuenta en v1, pero no detiene ese procesamiento.
- La pasarela notifica dos veces el mismo pago: la aportación se registra una sola vez.
- El proyecto elegido deja de estar activo mientras el donante rellena el formulario: se le avisa y se le ofrece el fondo general.
- Un Donante existente vuelve a aportar: se reutiliza si sus datos coinciden, distinguiendo diferencias meramente de formato de cambios reales, sin sobrescribirlos ni duplicarlo. Si el correo corresponde a otro NIF/NIE, se aplica FR-014; si el mismo NIF/NIE se presenta con cambios reales de correo o datos fiscales, se aplica FR-015. En v1 no existe autorización para corregir esos datos desde HU-01, tampoco por tener una cuenta vinculada.
- El correo falla después de confirmarse un cobro, puntual o de socio: el pago conserva su estado y referencia; el correo sigue pendiente hasta un envío satisfactorio. Reintentar el correo, aunque vuelva a fallar, no repite el cobro ni crea otra aportación.
- Falla una cuota posterior al alta: se registra e informa el fallo, sin contarla como pagada, incrementar el total ni alterar aportaciones anteriores. El fallo no cancela por sí solo la suscripción, pero una cancelación posterior comunicada válidamente por la pasarela sí debe procesarse. Sin fecha futura comunicada, el próximo cobro se muestra como «Pendiente de confirmación»; la aplicación no inicia cobros adicionales.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST ofrecer dos modalidades: donación puntual y socio con periodicidad mensual, trimestral o anual.
- **FR-002**: El sistema MUST exigir un importe en EUR entre 1,00 € y 999.999,99 €, ambos incluidos, con un máximo de 2 decimales. Este máximo es un límite elegido para la aplicación.
- **FR-003**: El sistema MUST permitir elegir opcionalmente un Proyecto activo como destino; si no se elige, el destino es «fondo general».
- **FR-004**: El sistema MUST pedir nombre y apellidos, NIF/NIE, correo electrónico y dirección postal (solo estos datos) y MUST validar el formato del NIF/NIE (incluida la letra de control) y del correo.
- **FR-005**: El pago MUST realizarse exclusivamente con tarjeta mediante Stripe Checkout alojado, en EUR; el sistema MUST NOT recibir ni almacenar datos de tarjeta.
- **FR-006**: Una Aportación MUST quedar «confirmada» solo cuando la pasarela confirma el cobro; en otro caso queda «pendiente», «rechazada» o «cancelada». Las aportaciones cambian de estado, nunca se eliminan.
- **FR-007**: Tras la confirmación del cobro, el sistema MUST mostrar y enviar por correo un resumen con importe, fecha, modalidad, destino y un número de referencia único. Si falla el envío, MUST conservar la aportación confirmada y mostrar el resumen y un aviso de correo pendiente. Para una persona sin cuenta, la consulta del resumen y del aviso requiere la autorización de FR-016; el procesamiento del pago y el envío de confirmación no dependen de conservar esa sesión. Mostrar el resumen o el aviso MUST NOT considerarse un envío satisfactorio ni dar por cumplida la obligación de enviar el correo.
- **FR-008**: Para socios, el sistema MUST registrar una SuscripcionSocio con importe y periodicidad y MUST mostrar la fecha del próximo cobro conforme a FR-019 cuando haya fallado una cuota posterior al alta. Modificar el importe de la cuota y darse de baja desde la aplicación quedan fuera de alcance en v1; Se mantienen el alta y el registro de los cobros periódicos de FR-009. Excluir la baja desde la aplicación MUST NOT impedir procesar una cancelación válida comunicada por la pasarela.
- **FR-009**: Cada cobro periódico confirmado por la pasarela MUST registrarse como una nueva Aportación de modalidad «cuota de socio».
- **FR-010**: Una misma notificación de pago MUST NOT registrar dos aportaciones.
- **FR-011**: El sistema MUST permitir completar tanto una donación puntual como un alta de socio sin crear una cuenta ni iniciar sesión. La consulta del historial (HU-02) requiere iniciar sesión con una cuenta del mismo correo utilizado al donar; la coincidencia de correos por sí sola MUST NOT considerarse prueba de titularidad para vincular aportaciones.
- **FR-012**: Cuando falle el correo de confirmación de una aportación, puntual o cuota de socio, el sistema MUST permitir reintentar exclusivamente el envío del mismo resumen de la aportación a quien tenga autorización vigente para esa operación; para una persona sin cuenta se aplica FR-016. El reintento MUST NOT iniciar otro cobro ni crear otra aportación o suscripción; MUST conservar el estado confirmado, la referencia y los datos del pago. Solo un envío satisfactorio permite informar de éxito; si vuelve a fallar, el correo MUST seguir pendiente y poder reintentarse mientras se conserve la autorización exigida.
- **FR-013**: El flujo de donaciones MUST ofrecer una entrada visible a la página de vinculación desde el formulario y su resultado, con solicitud autenticada del enlace sin depender de HU-02. Antes de vincular un Donante y sus aportaciones a una cuenta con el mismo correo utilizado al donar, el sistema MUST exigir que se acredite el acceso a ese buzón mediante un enlace de verificación enviado a dicho correo. La comprobación se limita a la vinculación dentro del módulo de donaciones; MUST NOT convertirse en condición general para registrarse, iniciar sesión o completar una donación puntual o un alta de socio sin cuenta.
- **FR-014**: Si el correo facilitado para una donación puntual o un alta de socio ya corresponde a un Donante con otro NIF/NIE, el sistema MUST detener la operación antes de iniciar el pago y pedir revisar los datos. MUST NOT mostrar datos del Donante existente, modificarlo ni mezclar sus aportaciones. El correo por sí solo MUST NOT identificar al Donante.
- **FR-015**: En v1, HU-01 MUST NOT permitir modificar el correo, nombre, apellidos ni dirección de un Donante existente, tanto sin cuenta como con una cuenta identificada o vinculada. Si el mismo NIF/NIE se presenta con cambios reales en esos datos al donar o hacerse socio, el sistema MUST detener la operación antes del pago y pedir revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante. Las correcciones quedan fuera de v1. Las diferencias meramente de formato MUST distinguirse de los cambios reales; el tratamiento concreto de equivalencias se definirá en plan.
- **FR-016**: Una persona sin cuenta MUST poder consultar el resultado de su pago y reintentar el correo de confirmación únicamente desde la sesión vigente de la operación iniciada en ese navegador. La autorización MUST limitarse a esa operación: MUST NOT permitir consultar otras aportaciones ni el historial. Conocer la referencia por sí solo MUST NOT conceder acceso. Si la sesión se pierde o caduca, recuperar ese acceso directo sin cuenta queda fuera de v1; los intentos de consulta o reintento sin autorización MUST denegarse sin mostrar datos ni enviar correos.
- **FR-017**: La pérdida o caducidad de la sesión, el cierre del navegador o la ausencia de retorno a la aplicación MUST NOT cancelar por sí solos el pago ni eliminar la aportación. El sistema MUST seguir procesando las notificaciones válidas de la pasarela conforme a las reglas de estado e idempotencia, aunque no exista una sesión vigente del donante. El procesamiento de la pasarela MUST ser independiente de la autorización del navegador para consultar una operación o reintentar su correo.
- **FR-018**: Si falla una cuota posterior al alta como socio, el sistema MUST registrar e informar el fallo, sin considerar pagada esa cuota ni incrementar el total aportado. MUST conservar intactas las aportaciones anteriores. El fallo por sí solo MUST NOT cancelar la suscripción; mientras no exista una cancelación válida, se mantiene activa. Si la pasarela comunica posteriormente una cancelación válida, el sistema MUST procesarla y reflejarla sin alterar las aportaciones anteriores. La aplicación MUST NOT iniciar cobros adicionales por su cuenta a causa del fallo.
- **FR-019**: Tras el fallo de una cuota posterior al alta, el sistema MUST mostrar como próximo cobro únicamente una fecha futura comunicada por la pasarela. Si no existe tal fecha, MUST mostrar «Pendiente de confirmación». MUST NOT inventar ni calcular una nueva fecha de cobro por su cuenta, ni presentar como futura una fecha ya pasada.

#### Key Entities

- **Donante** *(dueño: spec-001)*: persona que aporta dinero. Nombre, apellidos, NIF/NIE, correo, dirección postal. Puede estar ligado a un Usuario con rol donante tras acreditar el acceso al correo según FR-013.
- **Aportación** *(dueño: spec-001)*: Donante, importe, fecha de cobro, modalidad (puntual / cuota de socio), estado (pendiente / confirmada / rechazada / cancelada), referencia, Proyecto de destino (opcional = fondo general), SuscripcionSocio de origen (si es cuota).
- **SuscripcionSocio** *(dueño: spec-001)*: Donante, importe, periodicidad, fecha de alta, fecha del próximo cobro, estado.
- **Proyecto** *(común)*: nombre, descripción, activo / inactivo.

### Dependencies

- **Base común**: Usuario, roles, sesiones y Proyecto existentes; no se cambia registro o login.
- **Modelo único P-01**: [modelo-datos.md](../../specs/spec-001/../modelo-datos.md) define Donante, Aportación,
  SuscripcionSocio y soporte técnico. Se confirma el mismo pago recuperado sin duplicar,
  conservando las aportaciones ya confirmadas; primer rechazo recuperable no activa ni
  cancela definitivamente el alta. La representación de próxima fecha desconocida es NULL.
- **Identidad y acceso (PA1.2, PA1.3, PA1.5–PA1.7)**: comparación normalizada sin sobrescribir,
  conflictos antes del pago y vínculo por enlace limitado a donaciones. Permiso de sesión
  por operación y caducidad absoluta de ocho horas, sin acceso por referencia sola. El
  [plan común](../../specs/spec-001/../plan-comun.md) y los [contratos](../../specs/spec-001/contracts/api-donaciones.md) precisan los mecanismos.
- **Correo (PA1.4; P-03)**: persistencia de resumen/resultado y reintento autorizado sin
  repetir dinero. La ampliación opcional de enviarCorreo conserva el comportamiento de
  los otros módulos. Un aviso o aceptación SMTP no prueba recepción del mensaje.
- **Pasarela (PA1.8; P-02)**: el [contrato Stripe](../../specs/spec-001/contracts/pasarela-stripe.md) define eventos,
  pertenencia, deduplicación, previsión futura y cancelación canónica. Webhooks independientes
  del navegador. La preparación P-05 y las comprobaciones T075–T076 constan en
  [preparacion-stripe-01.md](../../specs/spec-001/refinamiento/preparacion-stripe-01.md); los recorridos reales
  de pruebas y sus límites se documentan en [validacion-stripe-01.md](../../specs/spec-001/refinamiento/validacion-stripe-01.md).
- **Alcance v1 P-04**: tarjeta, EUR y rango incluido de FR-002; límite propio de la aplicación,
  sin atribuirlo como máximo universal de la pasarela.
- **HU-02, HU-03 y HU-04** consumen los datos comunes. La alineación documental se prepara
  en spec-001 con Nada responsable y Rubén revisor. Revisión e incorporación compartida
  pendientes; Se conserva la decisión incorporada en PR #4. La estrategia conserva 004 como entrega
  temprana y coordina después el número de la ampliación técnica, sin reservar 009.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: Un donante completa una donación puntual en menos de 3 minutos desde que entra en el formulario.
- **SC-002**: El 100 % de las aportaciones confirmadas deben tener su correo de confirmación enviado satisfactoriamente, en el intento inicial o tras un reintento, con evidencia del correo recibido en el buzón destinatario de pruebas. Un intento fallido, el resumen en pantalla o un aviso no cuentan como envío satisfactorio. Mientras haya correos pendientes por fallos de envío, este criterio no se considera cumplido, aunque sus aportaciones estén confirmadas.
- **SC-003**: En ningún dato guardado por la ONG aparece un número de tarjeta.
- **SC-004**: El importe mostrado en la confirmación coincide al céntimo con el cobrado por la pasarela.

### Assumptions

- Durante el desarrollo se usa la pasarela en modo de pruebas.
- Los cobros periódicos posteriores al primero los realiza la pasarela y se registran al notificarse.
- Las fechas y horas se muestran en hora peninsular española.
- Limitación de v1 aceptada en PA1.6: una persona cuyos datos hayan cambiado no podrá utilizar sus nuevos datos mediante este flujo; la corrección del Donante existente queda fuera de HU-01 en esta versión.
- Limitación de v1 aceptada en PA1.7: si se pierde o caduca la sesión autorizada de la operación, no se recupera su acceso directo sin cuenta. Esto no cancela el pago, no elimina la aportación ni impide procesar notificaciones válidas de la pasarela; tampoco acredita un envío satisfactorio de correo que siga pendiente.

### Open Questions (para `/speckit-clarify`)

No quedan preguntas funcionales PA1.1–PA1.8 pendientes ni se abre otra ronda. El límite y
medio de pago de v1 quedan fijados en FR-002 y FR-005. La normalización, seguridad, estados,
correo y eventos se definen en el [plan](../../specs/spec-001/plan.md) y sus contratos, alineados con los documentos
comunes. La implementación local y la validación realizada constan en la
[matriz vigente](../../specs/spec-001/refinamiento/matriz-validacion-01.md), con sus fuentes y límites.
El [ajuste de flujo](../../specs/spec-001/refinamiento/ajuste-flujo-01.md) mantiene los controles de incorporación pendientes
antes de main: revisión/aprobación de Rubén y control actualizado de la elección local de
009. Las evidencias de esta rama no acreditan publicación ni incorporación compartida.

<div style="page-break-before:always"></div>

## spec-002 · HU-02 — Historial de aportaciones del donante

**Feature Branch**: `spec-002`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nada* · **Revisor**: *Javi*

**Input**: Descripción del SI-13: "Ese mismo donante querrá, con el paso del tiempo, poder consultar el historial completo de sus aportaciones, viendo año a año qué ha donado y, cuando corresponda, a qué proyecto concreto se destinó ese dinero, como constancia tangible de su implicación con la causa."

### Clarifications

#### Session 2026-11-10

- Q: ¿Qué debe mostrar el historial cuando la cuenta de donante todavía no tiene un vínculo verificado con sus aportaciones? (PA2.2) → A: Mostrar una explicación y un enlace a `/donar/vincular`, sin mostrar aportaciones ni afirmar si existen. Para cuentas vinculadas, distinguir historial vacío de año sin resultados: en el primer caso, mensaje y enlace para donar; en el segundo, aviso del año sin aportaciones y opción de quitar el filtro.
- Q: ¿Entre qué momentos debe medirse el límite de dos segundos para mostrar cinco años de cuotas mensuales? (PA2.3) → A: Desde que una cuenta ya identificada y vinculada abre el historial hasta que se muestran las 60 cuotas, los grupos anuales y sus totales. Se incluyen la obtención de datos y su presentación; Se excluyen login y vinculación previos.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Consultar mi historial de aportaciones (Priority: P1)

Como donante, quiero consultar el historial completo de mis aportaciones agrupado por año y viendo a qué proyecto se destinó cada una, para tener constancia de mi implicación con la causa.

Desde su área personal, el donante identificado y vinculado mediante la verificación de HU-01 ve todas sus aportaciones confirmadas (puntuales y cuotas de socio), de la más reciente a la más antigua, agrupadas por año natural según su fecha de cobro en Europe/Madrid y con el total de cada año. Sin vínculo, la página explica que debe vincular y ofrece el enlace correspondiente, sin consultar aportaciones por coincidencia de correo ni afirmar si existen.

**Why this priority**: Es la forma en que el donante comprueba que su dinero ha llegado y a dónde.

**Independent Test**: Con un donante de prueba que tiene aportaciones en 2025 y 2026, se entra en su área personal y se comprueban los dos bloques por año, sus totales y el destino de cada aportación.

**Acceptance Scenarios**:

1. **Given** un donante con 2 aportaciones confirmadas en 2025 (50 € y 30 €) y 1 en 2026 (20 €), **When** abre su historial, **Then** ve un bloque 2026 con total 20,00 € y un bloque 2025 con total 80,00 €, en ese orden.
2. **Given** cada aportación del historial, **When** se muestra, **Then** incluye fecha (dd/mm/aaaa), importe, modalidad (puntual / cuota de socio) y proyecto de destino o «fondo general».
3. **Given** un pago pendiente, rechazado o cancelado, **When** el donante abre su historial, **Then** ese pago no aparece.
4. **Given** el filtro de año, **When** el donante elige 2025, **Then** solo ve las aportaciones de 2025.
5. **Given** un donante con cuenta vinculada y sin aportaciones confirmadas en ningún año, **When** abre su historial, **Then** ve el mensaje «Todavía no has realizado ninguna aportación» y un enlace para donar.
6. **Given** un donante identificado, **When** intenta acceder al historial de otro donante, aunque conozca su identificador, **Then** el sistema deniega el acceso.
7. **Given** una cuenta identificada con rol donante pero sin vínculo verificado, **When** abre la página del historial, **Then** ve una explicación y un enlace a `/donar/vincular`, sin aportaciones ni afirmaciones sobre si existen; la coincidencia del correo no concede acceso ni inicia la verificación automáticamente.
8. **Given** una cuenta vinculada con aportaciones confirmadas en otros años, **When** filtra por un año sin aportaciones confirmadas, **Then** ve un aviso de que no hay aportaciones en ese año y la opción de quitar el filtro, sin presentar su historial completo como vacío.
9. **Given** una cuenta ya identificada y vinculada cuyo Donante tiene 60 cuotas mensuales confirmadas repartidas en cinco años, **When** abre el historial completo, **Then** se muestran las 60 cuotas, los grupos anuales y sus totales en menos de 2 segundos desde esa apertura; la medición incluye obtener y presentar los datos, pero no el login ni la vinculación previos.

<div style="page-break-before:always"></div>

#### Edge Cases

- Aportación del 31/12 a las 23:59 (hora peninsular): se agrupa en ese año según su fecha de cobro.
- Aportaciones «pendientes» de confirmación: no se muestran hasta que se confirman.
- Cuenta con rol donante sin vínculo verificado: se explica cómo vincular desde `/donar/vincular`, sin deducir por ello que nunca ha donado ni revelar aportaciones por coincidencia de correo.
- Historial vinculado sin confirmadas y año filtrado sin resultados son estados distintos; solo el primer caso usa el mensaje de historial vacío con enlace para donar.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST mostrar al donante identificado y con vínculo verificado todas sus aportaciones confirmadas, puntuales y cuotas de socio.
- **FR-002**: Las aportaciones MUST agruparse por año natural según la fecha de cobro en Europe/Madrid y ordenarse de la más reciente a la más antigua.
- **FR-003**: Cada grupo anual MUST mostrar el total aportado ese año, en euros con 2 decimales.
- **FR-004**: Cada aportación MUST mostrar fecha, importe, modalidad y proyecto de destino o «fondo general».
- **FR-005**: El sistema MUST permitir filtrar por un año concreto.
- **FR-006**: El sistema MUST NOT mostrar aportaciones pendientes, rechazadas o canceladas.
- **FR-007**: Un donante MUST poder ver solo las aportaciones del Donante vinculado mediante la verificación de HU-01 a su cuenta autenticada; la comprobación se hace en el servidor. Coincidir en correo o conservar el permiso invitado de una operación MUST NOT conceder acceso al historial.
- **FR-008**: Sin vínculo verificado, la página del historial MUST mostrar una explicación y un enlace a `/donar/vincular`, sin mostrar aportaciones ni afirmar si existen. Con vínculo pero sin aportaciones confirmadas en ningún año, MUST mostrar «Todavía no has realizado ninguna aportación» y un enlace para donar. Si hay aportaciones confirmadas en otros años pero no en el año filtrado, MUST mostrar un aviso referido a ese año y permitir quitar el filtro, sin presentar el historial completo como vacío. Entrar en la página sin vínculo MUST NOT solicitar un enlace ni vincular automáticamente.

#### Key Entities

- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Proyecto** *(común)*.
- **Usuario** con rol donante *(común)*: accede al Donante vinculado a su cuenta tras la verificación de HU-01; la coincidencia de correo por sí sola no establece esa relación ni autoriza la consulta.

### Dependencies

- **spec-001 (Nada)**: genera las aportaciones y proporciona el vínculo verificado de la cuenta con el Donante. Se reutiliza `/donar/vincular`; no se cambia registro, login ni la verificación. Las aportaciones confirmadas conservan su destino y datos; HU-02 solo consulta, sin reasignar proyectos, editar datos fiscales o corregir cobros.
- **spec-003 (Rubén)**: el total anual usa las mismas aportaciones confirmadas y fecha de cobro en Europe/Madrid, con sumas exactas. HU-03 reconcilia certificados de ejercicios cerrados tras confirmaciones tardías; HU-02 no añade una regeneración síncrona al consultar. El contraste con el certificado debe considerar que esa reconciliación se haya realizado para las mismas aportaciones confirmadas.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: La suma de los totales anuales coincide al céntimo con la suma de las aportaciones confirmadas del donante.
- **SC-002**: Para un Donante con 60 cuotas mensuales confirmadas repartidas en cinco años, el tiempo desde que su cuenta ya identificada y vinculada abre el historial completo hasta que se muestran las 60 cuotas, los grupos anuales y sus totales MUST ser inferior a 2 segundos. La medición incluye obtener y presentar los datos; excluye el login y la vinculación previos. Las 60 cuotas definen el caso de comprobación, no un límite del historial.
- **SC-003**: Ningún intento de ver el historial de otra persona tiene éxito.

### Assumptions

- El donante accede con una cuenta y un vínculo verificado conforme a PA1.2/PA1.3 de HU-01. El correo coincidente no sustituye la acreditación del acceso al buzón ni el vínculo persistido.

### Open Questions (para `/speckit-clarify`)

No quedan preguntas funcionales bloqueantes identificadas en esta ronda. La revisión de Javi y las fases posteriores no se dan por realizadas.

- **PA2.1 — alineación con el alcance vigente**: La pregunta original presuponía reasignar una aportación confirmada. HU-01 mantiene inmutables esas aportaciones; HU-02 muestra el destino asociado y no incorpora reasignación ni correcciones. No se reabre esa decisión común ni se añade otra definición de las entidades.
- **PA2.2 — resuelta**: Se distinguen cuenta sin vínculo, historial vinculado vacío y año sin resultados conforme a FR-008.
- **PA2.3 — resuelta**: El umbral de SC-002 se mide desde la apertura del historial por una cuenta ya identificada y vinculada hasta mostrar las 60 cuotas, grupos y totales; excluye login y vinculación previos.

<div style="page-break-before:always"></div>

## spec-003 · HU-03 — Certificado fiscal anual de donaciones

**Feature Branch**: `spec-003`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nada*

**Input**: Descripción del SI-13: "Cada comienzo de año trae consigo una necesidad muy concreta para quien ha donado: disponer de un certificado fiscal que recoja el total aportado durante el ejercicio anterior, generado automáticamente y listo para descargar, de forma que pueda utilizarlo en su declaración de impuestos."

### Clarifications

#### Session 2026-11-04

- Q: Si se corrige una aportación de un ejercicio después de emitir su certificado, ¿qué pasa con el certificado? (PA3.1) → A: Se regenera el mismo certificado: se recalcula el total, se actualiza la fecha de emisión y se crea un código de verificación nuevo, con lo que el código anterior deja de ser válido. Se mantiene un único certificado por donante y ejercicio. *(Precisada en la sesión 2026-11-08: el motivo es una confirmación tardía, no una corrección.)*
- Q: Cuando el certificado de un donante está disponible (nuevo o regenerado), ¿se le avisa por correo? (PA3.2) → A: Sí, se envía un correo al emitir o regenerar un certificado, con enlace al área personal y sin el PDF adjunto.
- Q: Si un donante no tenía NIF/NIE el 1 de enero y lo añade más tarde, ¿se genera entonces su certificado del año anterior? → A: Sí, automáticamente: al registrar el NIF/NIE se generan los certificados que le falten de ejercicios cerrados y se le envía el correo de aviso. *(Sustituida en la sesión 2026-11-08: HU-01 exige NIF/NIE.)*
- Q: ¿Debe haber una página pública donde un tercero compruebe con el código de verificación si un certificado es auténtico y sigue siendo válido? → A: Sí: página pública sin login; con un código válido muestra ejercicio, importe, fecha de emisión y NIF/NIE enmascarado; un código antiguo o inexistente aparece como "no válido".
- Q: Si un donante ha donado sin crear una cuenta de usuario, ¿se genera también su certificado y cómo accede a él? → A: Se genera igualmente; el correo de aviso le invita a crear una cuenta con ese mismo correo y, al hacerlo, se enlaza automáticamente y ve sus certificados. *(Sustituida en la sesión 2026-11-08: el vínculo es el verificado de HU-01.)*

#### Session 2026-11-08

- Q: ¿Qué se hace con el donante sin NIF/NIE, si HU-01 exige un NIF/NIE válido en cada donación y no permite añadirlo ni cambiarlo después? → A: Se elimina el caso: todo Donante tiene NIF/NIE porque lo garantiza HU-01 (`004_donaciones`); se quitan FR-010, el escenario 10 y el caso límite correspondiente.
- Q: ¿Qué pasa con un certificado ya emitido si después se confirma un cobro de ese mismo ejercicio (p. ej., pago del 31/12 confirmado el 2 de enero)? → A: Se regenera el mismo certificado con el nuevo total, nueva fecha de emisión y código nuevo; el código anterior deja de ser válido y se envía el correo de aviso. HU-01 no corrige ni anula aportaciones confirmadas, así que la confirmación tardía es el único motivo de cambio del total.
- Q: ¿Cómo accede a sus certificados un donante que donó sin cuenta, si en HU-01 tener el mismo correo no da acceso y el vínculo solo se crea con el enlace verificado de `/donar/vincular`? → A: El certificado se genera igualmente; el correo le invita a crear una cuenta de donante (o entrar con la suya) y vincularla desde `/donar/vincular`. Una vez vinculada, ve todos sus certificados. HU-03 no crea vínculos ni usa la coincidencia de correo como autorización.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Descargar mi certificado fiscal (Priority: P1)

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

<div style="page-break-before:always"></div>

#### Edge Cases

- Aportaciones pendientes, rechazadas o canceladas: no suman al total.
- Un mismo certificado se descarga varias veces: siempre tiene el mismo código y los mismos datos.
- Confirmación tardía de un cobro de un ejercicio cerrado en el que el Donante aún no tenía certificado: se emite en ese momento y se envía el correo de aviso.
- Una aportación que pasa a rechazada o cancelada nunca estuvo confirmada: no cambia el total ni regenera el certificado.
- Falla el envío del correo de aviso: el certificado queda emitido igualmente y el error se registra.
- Aportación del 31/12 a las 23:59 (hora peninsular): cuenta en ese ejercicio.

### Requirements *(mandatory)*

#### Functional Requirements

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

#### Key Entities

- **CertificadoFiscal** *(dueño: spec-003)*: Donante, ejercicio, importe total, fecha de emisión, código de verificación. Uno por Donante y ejercicio; al regenerarse se actualizan total, fecha de emisión y código.
- **Donante**, **Aportación** *(dueño: spec-001)*: se usan sin redefinirlas.
- **Datos de la ONG** (nombre, CIF): configuración del sistema, no una entidad nueva.

### Dependencies

- **spec-001 (A)**: necesita Donante con NIF/NIE y Aportación con estado y fecha de cobro, además del vínculo verificado cuenta–Donante (`/donar/vincular`). Ya integrada en `main` (PR #4).
- **spec-002 (A)**: el total del certificado debe coincidir con el total anual del historial.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: El total de cada certificado coincide al céntimo con el total del mismo año en el historial (HU-02).
- **SC-002**: El 1 de enero, el 100 % de los donantes con aportaciones confirmadas del ejercicio anterior tienen su certificado disponible.

### Assumptions

- El certificado es informativo; la presentación del modelo 182 ante Hacienda queda fuera de alcance.

<div style="page-break-before:always"></div>

## spec-004 · HU-04 — Informes de recaudación y voluntariado para la junta

**Feature Branch**: `spec-004`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Rubén* · **Revisor**: *Nicole*

**Input**: Descripción del SI-13: "quien lleva la administración de la ONG necesita poder rendir cuentas ante la junta directiva, para lo cual requiere informes que muestren, agrupado por proyecto y por periodo, tanto el dinero recaudado como el volumen de voluntariado generado, en un formato que se pueda exportar y presentar con facilidad."

### Clarifications

#### Session 2026-11-09

- Q: ¿El informe muestra solo cifras agregadas o puede incluir datos personales de donantes o voluntarios (nombre, correo, NIF/NIE)? → A: Solo cifras agregadas: ningún nombre, correo, NIF/NIE ni dirección de donantes o voluntarios, ni en pantalla ni en CSV o PDF (PA4.1).
- Q: Con agrupación por mes, trimestre o año, ¿qué filas tiene el informe? → A: Una fila por cada periodo y proyecto (incluido «fondo general»), una fila de subtotal por periodo y una fila de totales al final.
- Q: En subtotales y totales, ¿cómo se cuentan los voluntarios distintos? → A: Personas distintas en todo el ámbito de esa fila (periodo o informe completo), no la suma de filas; el resto de cifras sí se suman.
- Q: ¿Aparecen con ceros los proyectos o periodos sin ningún dato? → A: No: solo aparecen las filas de proyecto y periodo con algún dato; si no queda ninguna, informe vacío con su mensaje.
- Q: ¿Qué fecha decide en qué periodo cuenta una actividad con sus asistentes y horas? → A: Su inicio en hora de Madrid; la actividad entera cuenta en el periodo donde empieza; el periodo va de las 00:00 del día de inicio al final del día de fin, ambos incluidos; solo cuentan las celebradas (publicadas y ya empezadas).

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Consultar el informe por proyecto y periodo (Priority: P1)

Como administrador de la ONG, quiero obtener informes del dinero recaudado y del voluntariado generado, agrupados por proyecto y por periodo, para rendir cuentas ante la junta directiva.

El administrador elige un periodo y, opcionalmente, un proyecto y una agrupación temporal (mes, trimestre o año). El informe muestra por proyecto el dinero recaudado y el voluntariado generado, con una fila de totales.

**Why this priority**: Es la visión agregada del sistema para la junta. Necesita aportaciones (HU-01) y asistencias (HU-08); mientras no existan se prueba con datos de prueba.

**Independent Test**: Con datos de prueba conocidos (aportaciones y asistencias en dos proyectos durante 2026), se genera el informe del año y se comprueban las cifras por proyecto y los totales.

**Acceptance Scenarios**:

1. **Given** aportaciones confirmadas en 2026 en los proyectos A y B y en el fondo general, **When** el administrador pide el informe del 01/01/2026 al 31/12/2026 sin filtro de proyecto, **Then** ve una fila para A, otra para B, otra para «fondo general» y una fila de totales.
2. **Given** cada fila de proyecto, **When** se muestra, **Then** incluye lo recaudado por donaciones puntuales, por cuotas de socio, número de aportaciones, número de actividades celebradas, voluntarios distintos que asistieron y horas de voluntariado.
3. **Given** el filtro del proyecto A, **When** se genera el informe, **Then** solo aparecen las cifras de A.
4. **Given** la agrupación por trimestre, **When** se genera el informe de 2026, **Then** aparece, dentro de cada trimestre del periodo, una fila por proyecto (y «fondo general»), una fila de subtotal del trimestre y, al final, la fila de totales.
5. **Given** aportaciones fuera del periodo o no confirmadas, **When** se genera el informe, **Then** no se cuentan.
6. **Given** asistencias registradas en el periodo, **When** se genera el informe, **Then** las horas coinciden con la suma de esas asistencias.
7. **Given** un periodo sin datos, **When** se genera el informe, **Then** se muestra un informe vacío con un mensaje claro, no un error.
8. **Given** una fecha de fin anterior a la de inicio, **When** se pide el informe, **Then** el sistema no lo genera y explica el motivo.
9. **Given** un usuario sin rol de administrador, **When** intenta acceder a los informes, **Then** el sistema deniega el acceso.

<div style="page-break-before:always"></div>

#### User Story 2 - Exportar el informe (Priority: P2)

Como administrador, quiero exportar el informe a CSV y a PDF, para analizarlo en otras herramientas y presentarlo a la junta.

**Why this priority**: Aporta valor una vez que el informe en pantalla es correcto.

**Independent Test**: Con el informe de 2026 en pantalla, se exporta a CSV y a PDF y se comprueba que ambos contienen exactamente las mismas filas y cifras.

**Acceptance Scenarios**:

1. **Given** un informe en pantalla, **When** se exporta a CSV, **Then** el fichero contiene las mismas filas, columnas y cifras.
2. **Given** un informe en pantalla, **When** se exporta a PDF, **Then** el documento contiene la misma información, con el periodo y los filtros aplicados.

<div style="page-break-before:always"></div>

#### Edge Cases

- Asistencias corregidas a «no asistió» (HU-08): sus horas no cuentan.
- Proyecto inactivo: sigue apareciendo si tiene datos en el periodo.
- Proyecto activo sin aportaciones ni actividades en el periodo: no aparece.
- Actividad celebrada sin ninguna asistencia registrada: cuenta como celebrada con 0 horas.
- Actividad cancelada: no cuenta como celebrada.
- Actividad que empieza el 31/12 y termina el 01/01: cuenta entera en el año (mes, trimestre) en que empieza.
- Un voluntario que asistió en los proyectos A y B cuenta 1 en cada fila y 1 (no 2) en la fila de totales.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST permitir elegir un periodo (fecha de inicio y fin), un Proyecto opcional y una agrupación opcional por mes, trimestre o año.
- **FR-002**: El sistema MUST rechazar un periodo cuya fecha de fin sea anterior a la de inicio. El periodo incluye completos el día de inicio y el de fin (de las 00:00 del primero al final del segundo, en hora de Madrid).
- **FR-003**: El dinero recaudado MUST calcularse con las aportaciones confirmadas cuya fecha de cobro está dentro del periodo, separando donaciones puntuales y cuotas de socio, e indicando el número de aportaciones.
- **FR-004**: El voluntariado MUST calcularse con las asistencias registradas (con asistencia) de actividades celebradas (publicadas y con inicio ya pasado) cuyo **inicio**, en hora de Madrid, cae dentro del periodo; la actividad entera, con todos sus asistentes y horas, cuenta en el periodo (y el mes, trimestre o año) donde empieza: número de actividades celebradas, voluntarios distintos que asistieron y horas totales. En las filas de subtotal y de totales, los voluntarios distintos MUST contarse como personas distintas en todo el ámbito de la fila (no como suma de filas, porque una persona puede asistir en varios proyectos o periodos); el resto de cifras son la suma de sus filas.
- **FR-005**: Sin filtro de proyecto, el informe MUST incluir una fila por proyecto, una de «fondo general» y una de totales. Con agrupación temporal, MUST haber una fila por cada periodo y proyecto (incluido «fondo general»), una fila de subtotal por periodo y la fila de totales al final.
- **FR-006**: El informe MUST poder exportarse a CSV y a PDF con exactamente la misma información que la pantalla.
- **FR-007**: Un periodo sin datos MUST mostrar un informe vacío con un mensaje explicativo. Las filas de proyecto (o de proyecto y periodo) sin ninguna aportación ni actividad celebrada MUST omitirse; tampoco aparece el subtotal de un periodo sin filas.
- **FR-008**: Solo los usuarios con rol administrador MUST poder acceder a los informes; la comprobación se hace en el servidor.
- **FR-009**: El informe y sus exportaciones MUST contener solo cifras agregadas: ningún nombre, correo, NIF/NIE ni dirección de donantes o voluntarios (PA4.1).

#### Key Entities

- **Aportación** *(dueño: spec-001)*, **Actividad** *(dueño: spec-007)*, **Asistencia** *(dueño: spec-008)*, **Proyecto** *(común)*: se usan sin redefinirlas. El informe es un cálculo, no una entidad nueva.

### Dependencies

- **spec-001 (A)**: Aportación con estado, modalidad, fecha de cobro y proyecto.
- **spec-007 / spec-008 (D)**: Actividad con estado y fechas; Asistencia con horas. Mientras no existan, se trabaja con datos de prueba.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: Los totales del informe coinciden al céntimo (dinero) y a la décima de hora (voluntariado) con la suma de los datos de origen.
- **SC-002**: El administrador obtiene el informe anual exportado en menos de 1 minuto.
- **SC-003**: Las exportaciones CSV y PDF coinciden al 100 % con la pantalla.

### Assumptions

- Las cifras de dinero se muestran en euros con 2 decimales; las fechas, en dd/mm/aaaa y hora peninsular.

### Open Questions (para `/speckit-clarify`)

- ~~**PA4.1**~~: resuelta en Clarifications (solo cifras agregadas, FR-009).

<div style="page-break-before:always"></div>

## spec-005 · HU-05 — Consulta e inscripción en actividades de voluntariado

**Feature Branch**: `spec-005`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Javi* · **Revisor**: *Nicole*

**Input**: Descripción del SI-13: "cualquier persona interesada en el voluntariado debe poder consultar las actividades disponibles y apuntarse a las que le interesen, viendo con claridad cuántas plazas quedan libres en cada una y qué requisitos concretos se piden para participar."

### Clarifications

#### Session 2026-11-04

- Q: ¿Basta con que el voluntario declare que cumple los requisitos o el sistema debe comprobar alguno automáticamente (por ejemplo, la edad)? → A: Basta con la declaración; el sistema no comprueba ningún requisito ni pide la fecha de nacimiento.
- Q: ¿Se permite inscribirse en dos actividades que se solapan en el horario? → A: Sí; el sistema no comprueba solapes.
- Q: Si al confirmar la inscripción otra persona acaba de ocupar la última plaza, ¿qué hace el sistema? → A: No inscribe, indica que ya no quedan plazas y ofrece apuntarse a la lista de espera; nadie entra en la lista de espera sin pedirlo.
- Q: ¿Qué pasa si un usuario identificado sin el rol de voluntario (por ejemplo, solo donante) intenta inscribirse? → A: Se le deniega con un aviso de que necesita una cuenta de voluntario; no se le añade el rol.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Consultar las actividades disponibles (Priority: P1)

Como cualquier persona interesada, quiero ver las actividades futuras y publicadas con sus plazas libres y requisitos, para decidir en cuáles participar.

**Why this priority**: Es el punto de entrada del voluntariado y no necesita identificarse.

**Independent Test**: Con actividades de prueba (futuras publicadas, una en borrador y una ya celebrada), un usuario no identificado abre el listado y solo ve las futuras publicadas, con plazas y requisitos.

**Acceptance Scenarios**:

1. **Given** actividades futuras publicadas, **When** cualquier persona abre el listado, **Then** ve de cada una título, descripción, fecha y horario de inicio y fin, lugar, proyecto, plazas libres / plazas totales y requisitos.
2. **Given** una actividad ya celebrada, en borrador o cancelada, **When** se abre el listado, **Then** no aparece.
3. **Given** los filtros por proyecto y por fecha, **When** el usuario los aplica, **Then** el listado se reduce a las actividades que cumplen ambos.

<div style="page-break-before:always"></div>

#### User Story 2 - Inscribirme y cancelar mi inscripción (Priority: P1)

Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus requisitos, y poder cancelar si no puedo ir, para colaborar con mi tiempo.

**Why this priority**: Sin inscripciones no hay calendario (HU-06) ni asistencia (HU-08).

**Independent Test**: Con una actividad de 10 plazas y 9 inscritos, un voluntario de prueba ve «1 plaza libre de 10», se inscribe confirmando los requisitos y la actividad pasa a «0 plazas libres de 10»; al cancelar vuelve a «1».

**Acceptance Scenarios**:

1. **Given** una actividad con plazas libres, **When** un voluntario identificado se inscribe y confirma que cumple los requisitos, **Then** su inscripción queda confirmada y las plazas libres bajan en una.
2. **Given** el formulario de inscripción, **When** el voluntario no confirma que cumple los requisitos, **Then** no puede completar la inscripción.
3. **Given** una actividad sin plazas libres, **When** el voluntario la abre, **Then** no se ofrece inscripción directa sino «Apuntarme a la lista de espera»; si la acepta confirmando los requisitos, queda en lista de espera y ve su posición (las reglas de la lista son de HU-07).
4. **Given** un voluntario ya inscrito o en lista de espera, **When** intenta inscribirse de nuevo en la misma actividad, **Then** el sistema lo impide y lo indica.
5. **Given** un voluntario inscrito y la lista de espera vacía, **When** cancela su inscripción antes del inicio, **Then** la plaza queda libre y las plazas libres suben en una.
6. **Given** un voluntario inscrito y personas en la lista de espera, **When** cancela su inscripción antes del inicio, **Then** su plaza pasa a la primera persona de la lista, que recibe el aviso de HU-07, y las plazas libres no cambian.
7. **Given** un voluntario en lista de espera, **When** cancela antes del inicio, **Then** sale de la lista y las personas que iban detrás avanzan una posición.
8. **Given** una actividad con una plaza libre, **When** otra persona la ocupa mientras el voluntario confirma su inscripción, **Then** el sistema no lo inscribe, le indica que ya no quedan plazas y le ofrece apuntarse a la lista de espera.
9. **Given** un usuario no identificado, **When** pulsa «Inscribirme», **Then** se le pide identificarse.
10. **Given** un usuario identificado sin el rol de voluntario, **When** intenta inscribirse, **Then** el sistema se lo deniega y le indica que necesita una cuenta de voluntario.
11. **Given** un voluntario que se inscribe por primera vez, **When** confirma la inscripción, **Then** se le piden nombre, apellidos, correo y teléfono de contacto, que se guardan para las siguientes.

<div style="page-break-before:always"></div>

#### Edge Cases

- Dos voluntarios intentan ocupar la última plaza a la vez: solo uno la obtiene; al otro se le indica que no quedan plazas y se le ofrece la lista de espera.
- Cancelación una vez iniciada la actividad: no se permite.
- Actividad ya celebrada: no admite inscripción.
- Actividad cancelada por el coordinador: desaparece del listado y sus inscripciones quedan canceladas (HU-07).
- Actividades que se solapan en el horario: el voluntario puede inscribirse en todas.
- Tras cancelar, el voluntario puede volver a inscribirse en la misma actividad si sigue abierta.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST mostrar a cualquier persona las actividades publicadas cuya fecha de inicio es futura.
- **FR-002**: Cada actividad MUST mostrar título, descripción, fecha y horario de inicio y fin, lugar, proyecto, plazas libres / plazas totales y requisitos.
- **FR-003**: El listado MUST poder filtrarse por proyecto y por fecha.
- **FR-004**: Inscribirse MUST requerir estar identificado con el rol de voluntario y confirmar expresamente que se cumplen los requisitos. El cumplimiento es una declaración del voluntario: el sistema no comprueba ningún requisito. A un usuario identificado sin ese rol se le deniega con un aviso de que necesita una cuenta de voluntario.
- **FR-005**: Si hay plazas libres, la Inscripción MUST quedar confirmada y las plazas libres MUST disminuir en una.
- **FR-006**: El número de inscripciones confirmadas MUST NOT superar las plazas de la actividad, ni siquiera con peticiones simultáneas.
- **FR-007**: Si no hay plazas libres, el sistema MUST ofrecer la lista de espera en lugar de la inscripción directa, y solo entra en ella quien lo pide. Si la última plaza se ocupa mientras el voluntario confirma, el sistema MUST rechazar la inscripción indicando que no quedan plazas y ofrecer la lista de espera.
- **FR-008**: Un voluntario MUST NOT tener dos inscripciones activas (confirmada o en lista de espera) en la misma actividad, ni inscribirse en una actividad ya celebrada.
- **FR-009**: Un voluntario MUST poder cancelar su inscripción, confirmada o en lista de espera, hasta el inicio de la actividad; la Inscripción pasa a «cancelada», no se elimina. Si estaba confirmada y hay lista de espera, la plaza pasa a la primera persona de la lista (regla de HU-07) y las plazas libres no cambian; si no hay nadie esperando, suben en una.
- **FR-010**: El sistema MUST permitir inscribirse en actividades cuyos horarios se solapan; no comprueba solapes.
- **FR-011**: La primera vez que un voluntario se inscribe, MUST indicar su nombre, apellidos, correo y teléfono de contacto; se guardan y se reutilizan en las siguientes inscripciones.

#### Key Entities

- **Voluntario** *(dueño: spec-005)*: nombre, apellidos, correo y teléfono, ligado a un Usuario con rol voluntario.
- **Inscripción** *(dueño: spec-005)*: Voluntario, Actividad, estado (confirmada / en lista de espera / cancelada), fecha de inscripción, posición en la lista de espera cuando corresponde.
- **Actividad** *(dueño: spec-007)*, **Proyecto** *(común)*: se usan sin redefinirlas.

### Dependencies

- **spec-007 (D)**: define Actividad, sus estados y la lista de espera; la inscripción en lista de espera y el paso automático a confirmada se rigen por sus reglas. Su FR-005 («las nuevas solicitudes MUST entrar en una lista de espera») se aplica a quien pide la lista de espera: según la Q3 del clarify, nadie entra en ella sin pedirlo.
- **Cancelación con lista de espera** *(acordado con Nicole, T023 de spec-007)*: al cancelar una inscripción confirmada, spec-005 llama a `promoverListaEspera` dentro de la misma transacción y, después del `COMMIT`, a `avisarPlazaConfirmada` de spec-007 para cada inscripción promovida. spec-005 no envía un correo propio.
- **Funciones que spec-005 ofrece a `actividades`**: `contarConfirmadas`, `listarInscripcionesDeActividad`, `promoverListaEspera` y `cancelarInscripcionesDeActividad` (spec-007), y `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario` (spec-008).
- **spec-006 (C, misma persona)** y **spec-008 (D)** consumen Inscripción.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: Un voluntario encuentra una actividad y se inscribe en menos de 2 minutos.
- **SC-002**: En ninguna actividad hay más inscritos confirmados que plazas.

### Assumptions

- El cumplimiento de requisitos es una declaración del voluntario (PA5.1).
- Los datos del Voluntario se limitan a los imprescindibles para contactar con él.
- Una persona que quiera ser donante y voluntaria elige los dos roles al crear su cuenta.

### Open Questions (para `/speckit-clarify`)

- ~~PA5.1~~: resuelta (ver Clarifications).
- ~~PA5.2~~: resuelta (ver Clarifications).

<div style="page-break-before:always"></div>

## spec-006 · HU-06 — Calendario personal del voluntario

**Feature Branch**: `spec-006`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Javi* · **Revisor**: *Nada*

**Input**: Descripción del SI-13: "Una vez inscrito en varias actividades, ese voluntario necesita también una manera sencilla de ver todo lo que tiene por delante: un calendario personal con sus próximas actividades, que le ayude a organizar su disponibilidad y a no olvidar ningún compromiso adquirido."

### Clarifications

#### Session 2026-11-06

- Q: ¿El calendario permite exportar las actividades a otro calendario con un fichero .ics? → A: No; queda fuera de la v1.
- Q: ¿Cuándo se actualiza el calendario sin que el voluntario recargue la página? → A: Al abrir la página, después de cada acción del voluntario en el calendario y cada vez que vuelve a la pestaña; no hay consultas periódicas ni avisos desde el servidor.
- Q: ¿Qué actividades cuentan como «próximas»? → A: Las que aún no han terminado: una de hoy deja de salir al terminar y una de varios días ya empezada sigue saliendo hasta que acaba, sin opción de cancelar.
- Q: ¿Qué vista ve primero el voluntario? → A: La lista, ordenada por fecha; la vista mensual está a un clic.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Ver mis próximas actividades (Priority: P1)

Como voluntario, quiero ver en un calendario personal mis próximas actividades, para organizar mi disponibilidad y no olvidar ningún compromiso.

El voluntario tiene en su área personal una vista de lista, que es la que ve primero, y una vista mensual con las actividades que aún no han terminado en las que tiene inscripción confirmada; las que están en lista de espera se muestran diferenciadas con la etiqueta «en lista de espera».

**Why this priority**: Es el núcleo de la historia; requiere inscripciones (HU-05).

**Independent Test**: Un voluntario de prueba con tres inscripciones confirmadas en actividades futuras y en lista de espera de una cuarta abre su calendario y ve las cuatro en sus fechas, con la cuarta etiquetada «en lista de espera».

**Acceptance Scenarios**:

1. **Given** un voluntario con tres inscripciones confirmadas en actividades futuras, **When** abre su calendario, **Then** ve las tres en su día y hora correctos (hora peninsular), en la vista de lista (la primera es la siguiente) y en la mensual.
2. **Given** una actividad ya terminada, **When** el voluntario abre su calendario, **Then** no aparece.
3. **Given** una actividad en la que el voluntario está en lista de espera, **When** abre el calendario, **Then** aparece con la etiqueta «en lista de espera», diferenciada de las confirmadas.
4. **Given** un voluntario sin actividades por delante, **When** abre el calendario, **Then** ve un mensaje claro con un enlace al listado de actividades disponibles.
5. **Given** un voluntario identificado, **When** intenta ver el calendario de otro voluntario o cancelar una de sus inscripciones, **Then** el sistema no se lo permite: solo le da el suyo.

<div style="page-break-before:always"></div>

#### User Story 2 - Gestionar una actividad desde el calendario (Priority: P2)

Como voluntario, quiero abrir una actividad del calendario para ver su detalle y cancelar mi inscripción si lo necesito.

**Why this priority**: Mejora la comodidad, pero reutiliza la cancelación de HU-05.

**Independent Test**: Desde el calendario se abre una actividad confirmada, se cancela la inscripción y la actividad desaparece sin recargar manualmente.

**Acceptance Scenarios**:

1. **Given** una actividad del calendario, **When** el voluntario la selecciona, **Then** ve su fecha, horario, lugar y requisitos y la opción de cancelar (o de salir de la lista de espera).
2. **Given** que el voluntario cancela una inscripción desde el detalle, **When** se completa la cancelación, **Then** la actividad desaparece del calendario sin recargar manualmente.
3. **Given** que el voluntario sale de la lista de espera y obtiene plaza (HU-07), **When** abre el calendario o vuelve a su pestaña, **Then** la actividad aparece como confirmada.

<div style="page-break-before:always"></div>

#### Edge Cases

- Actividad cancelada por el coordinador: desaparece del calendario al abrirlo o al volver a la pestaña (el aviso lo envía HU-07).
- Actividad que dura varios días: se muestra en todos sus días en la vista mensual y una sola vez en la lista, con sus fechas de inicio y fin.
- Actividad de varios días ya empezada: sigue en el calendario hasta que termina, sin opción de cancelar (HU-05 solo deja cancelar hasta el inicio).
- Dos actividades el mismo día: ambas se muestran de forma legible.
- El coordinador cambia la fecha o el lugar (HU-07): el calendario muestra los nuevos al abrirlo o al volver a la pestaña.
- Usuario identificado sin el rol de voluntario: no tiene calendario; el servidor se lo deniega con un aviso.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST ofrecer al voluntario una vista de lista, que es la que se abre primero, y una vista mensual de sus próximas actividades.
- **FR-002**: El calendario MUST incluir solo actividades que aún no han terminado en las que el voluntario tiene una Inscripción confirmada o en lista de espera; las inscripciones canceladas no aparecen.
- **FR-003**: Las actividades en lista de espera MUST distinguirse visualmente y con la etiqueta «en lista de espera».
- **FR-004**: Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscripción o salir de la lista de espera con las reglas de HU-05 (solo antes del inicio).
- **FR-005**: El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado sin que el voluntario tenga que recargar manualmente: se actualiza al abrir la página, después de cada acción del voluntario en el calendario y cada vez que vuelve a la pestaña.
- **FR-006**: Un voluntario MUST poder ver solo su propio calendario; la comprobación se hace en el servidor y no hay forma de pedir el de otra persona.

#### Key Entities

- **Inscripción**, **Voluntario** *(dueño: spec-005)* y **Actividad** *(dueño: spec-007)*: se usan sin redefinirlas. El calendario es una vista, no una entidad nueva.

### Dependencies

- **spec-005 (C, misma persona)**: inscripción y cancelación.
- **spec-007 (D)**: estados de Actividad y paso automático de lista de espera a confirmada.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: El 100 % de las inscripciones activas del voluntario en actividades que aún no han terminado aparecen en su calendario.
- **SC-002**: El voluntario identifica su siguiente actividad en menos de 10 segundos desde que abre el calendario.

### Assumptions

- Las fechas se muestran en dd/mm/aaaa y las horas en hora peninsular española.
- Exportar el calendario (.ics) o recibir recordatorios por correo quedan fuera de la v1.

### Open Questions (para `/speckit-clarify`)

- ~~PA6.1~~: resuelta (ver Clarifications).

<div style="page-break-before:always"></div>

## spec-007 · HU-07 — Gestión de actividades, plazas y lista de espera

**Feature Branch**: `spec-007`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Javi*

**Input**: Descripción del SI-13: "Quien coordina los proyectos de la organización, por su parte, es el encargado de crear y mantener las actividades disponibles, definiendo cuántas plazas tiene cada una y gestionando la correspondiente lista de espera cuando la demanda supera al aforo previsto."

### Clarifications

#### Session 2026-10-28

- Q: ¿Puede un coordinador gestionar cualquier actividad o solo las de los proyectos que coordina? → A: Cualquier coordinador gestiona cualquier actividad de cualquier proyecto (no hay vínculo coordinador–proyecto).
- Q: Al liberarse una plaza, ¿se confirma directamente o hay plazo para aceptarla? → A: Confirmación directa con aviso por correo; si no puede asistir, la persona cancela y la plaza pasa a la siguiente. *(Confirmado con Javi, dueño de Inscripción en spec-005.)*
- Q: ¿Qué se puede editar de una actividad publicada? → A: Todo, respetando FR-003 y FR-007; si cambian fecha, hora o lugar se avisa por correo a inscritos y lista de espera. Una publicada no vuelve a borrador.
- Q: ¿Se puede cancelar una actividad ya celebrada y cómo se descarta un borrador? → A: Una celebrada no se puede cancelar ni editar; un borrador se descarta cancelándolo (sin avisos); nunca se borra físicamente.
- Q: ¿Qué se exige del proyecto y la fecha al crear, editar y publicar? → A: Proyecto activo e inicio futuro en las tres operaciones; desactivar un proyecto no afecta a sus actividades ya publicadas.

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Crear, publicar, editar y cancelar actividades (Priority: P1)

Como coordinador de proyectos, quiero crear y mantener las actividades definiendo sus plazas, para organizar el voluntariado de cada proyecto.

**Why this priority**: Sin actividades no hay nada que consultar ni a lo que inscribirse (HU-05, HU-06, HU-08).

**Independent Test**: Un coordinador de prueba crea una actividad en borrador, comprueba que no aparece en el listado público, la publica y comprueba que sí aparece.

**Acceptance Scenarios**:

1. **Given** el formulario de nueva actividad con todos los campos válidos, **When** el coordinador la guarda, **Then** queda creada en estado «borrador».
2. **Given** un campo obligatorio vacío, plazas ≤ 0, fin anterior o igual al inicio o inicio en el pasado, **When** el coordinador intenta guardar, **Then** el sistema no la crea e indica el problema junto al campo.
3. **Given** una actividad en borrador, **When** el coordinador la publica, **Then** aparece en el listado público (HU-05); mientras está en borrador, no aparece.
4. **Given** 8 inscritos confirmados, **When** el coordinador intenta bajar las plazas a 6, **Then** el sistema lo impide y explica el motivo.
5. **Given** una actividad publicada, **When** el coordinador la cancela, **Then** inscritos y lista de espera reciben un aviso y la actividad deja de estar disponible.
6. **Given** una actividad, **When** el coordinador la abre, **Then** ve la lista de inscritos confirmados y la lista de espera en orden.
7. **Given** un usuario sin rol de coordinador, **When** intenta crear, editar o cancelar actividades, **Then** el sistema deniega el acceso.

<div style="page-break-before:always"></div>

#### User Story 2 - Lista de espera automática (Priority: P1)

Como coordinador, quiero que, cuando la demanda supere el aforo, los interesados entren en una lista de espera por orden de llegada y ocupen automáticamente las plazas que se liberen.

**Why this priority**: Es parte central de la historia y lo usa HU-05.

**Independent Test**: Una actividad de 2 plazas recibe tres voluntarios; el tercero queda en lista de espera en la posición 1; uno de los dos primeros cancela y el tercero pasa a confirmado y recibe un aviso.

**Acceptance Scenarios**:

1. **Given** una actividad publicada de 10 plazas con 10 inscritos, **When** un undécimo voluntario se apunta, **Then** entra en la lista de espera en la posición 1.
2. **Given** una lista de espera con personas, **When** un inscrito cancela, **Then** la primera persona de la lista pasa automáticamente a confirmada y recibe un aviso por correo.
3. **Given** 10 plazas y 2 personas en espera, **When** el coordinador sube las plazas a 12, **Then** las dos pasan a confirmadas y reciben un aviso.
4. **Given** una persona en lista de espera que cancela, **When** se actualiza la lista, **Then** las siguientes avanzan una posición.

<div style="page-break-before:always"></div>

#### Edge Cases

- Actividad ya celebrada (inicio pasado) o cancelada: no se puede editar, cancelar ni volver a publicar; el sistema lo rechaza explicando el motivo.
- Un borrador que no se quiere se descarta cancelándolo (sin avisos, porque no tiene inscritos); las actividades nunca se borran físicamente.
- Se libera una plaza y la lista de espera está vacía: las plazas libres aumentan en una.
- Una actividad cancelada conserva sus inscripciones con estado «cancelada»; no se eliminan.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El coordinador MUST poder crear, editar, publicar y cancelar actividades.
- **FR-002**: Cada Actividad MUST tener título, descripción, Proyecto, fecha y hora de inicio y fin, lugar, plazas (entero mayor que cero) y requisitos (texto, puede estar vacío).
- **FR-003**: Al crear, editar y publicar, el sistema MUST validar que el fin es posterior al inicio, que el inicio es posterior al momento actual y que el Proyecto está activo; un borrador cuyo inicio ya ha pasado no se puede publicar. Desactivar un proyecto no afecta a sus actividades ya publicadas.
- **FR-004**: Los estados de una Actividad MUST ser borrador, publicada o cancelada; solo las publicadas son visibles para los voluntarios.
- **FR-005**: Cuando una actividad publicada está completa, las nuevas solicitudes MUST entrar en una lista de espera por orden de llegada.
- **FR-006**: Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confirmar automáticamente y de inmediato a la primera persona de la lista de espera (sin plazo de aceptación ni estado intermedio) y avisarla por correo; si no puede asistir, cancela ella misma su inscripción y la plaza pasa a la siguiente.
- **FR-007**: El sistema MUST NOT permitir reducir las plazas por debajo del número de inscritos confirmados.
- **FR-008**: Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera y MUST dejar de mostrarla como disponible.
- **FR-009**: El coordinador MUST poder consultar, en cada actividad, los inscritos confirmados y la lista de espera con su orden.
- **FR-010**: Solo los usuarios con rol coordinador MUST poder gestionar actividades; cualquier coordinador puede gestionar cualquier actividad de cualquier proyecto, sin vínculo coordinador–proyecto. La comprobación se hace en el servidor.
- **FR-011**: Una actividad publicada MUST poder editarse en todos sus campos (con las validaciones de FR-003 y FR-007); si cambian la fecha, la hora o el lugar, el sistema MUST avisar por correo a inscritos confirmados y lista de espera. Una actividad publicada MUST NOT volver a borrador.

#### Key Entities

- **Actividad** *(dueño: spec-007)*: título, descripción, Proyecto, inicio, fin, lugar, plazas, requisitos, estado.
- **Inscripción** *(dueño: spec-005)*: se usa sin redefinirla, incluida su posición en la lista de espera.
- **Usuario** con rol coordinador *(común)*, **Proyecto** *(común)*.

### Dependencies

- **spec-005 / spec-006 (C)** consumen Actividad y sus estados; la Inscripción es de C, así que las reglas de lista de espera se acuerdan con C.
- **Promoción al cancelar un voluntario** *(acordado con Javi)*: la cancelación de una inscripción en spec-005 llama a `promoverListaEspera`, que devuelve las inscripciones promovidas; el correo «plaza confirmada» sale siempre de una única función `avisarPlazaConfirmada` de spec-007, que también usa spec-005.
- **spec-004 (B)** usa Actividad para contar actividades celebradas.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: Un coordinador crea y publica una actividad en menos de 3 minutos.
- **SC-002**: El 100 % de las plazas liberadas se asignan a la lista de espera sin intervención manual.
- **SC-003**: En ninguna actividad hay más inscritos confirmados que plazas.

### Assumptions

- Una actividad «celebrada» es una actividad publicada cuya hora de inicio ya ha pasado; no es un estado aparte.

### Open Questions (para `/speckit-clarify`)

- ~~PA7.1~~: resuelta (ver Clarifications).
- ~~PA7.2~~: resuelta (ver Clarifications).

<div style="page-break-before:always"></div>

## spec-008 · HU-08 — Registro de asistencia y acumulación de horas

**Feature Branch**: `spec-008`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nicole* · **Revisor**: *Rubén*

**Input**: Descripción del SI-13: "Ese mismo coordinador necesita, además, registrar quién ha asistido realmente a cada actividad, de forma que las horas de voluntariado dedicadas por cada persona se vayan acumulando automáticamente en su perfil, como reconocimiento a su compromiso continuado."

### Clarifications

#### Session 2026-11-04

- Q: ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia? → A: Sin plazo; se puede registrar y corregir en cualquier momento.
- Q: ¿Se pueden registrar asistencias parciales? → A: No en v1; «asistió» suma siempre la duración completa de la actividad.
- Q: ¿Qué coordinadores pueden registrar o corregir la asistencia? → A: Cualquier usuario con rol coordinador, en cualquier actividad.
- Q: ¿Desde qué momento se puede registrar la asistencia? → A: Desde la hora de inicio, incluida la actividad en curso.
- Q: ¿Qué pasa si una inscripción con asistencia se cancela? → A: Desde la hora de inicio de la actividad la inscripción no se puede cancelar (ya lo exige spec-005 FR-009: solo se cancela hasta el inicio; como la asistencia se registra desde el inicio, nunca se solapan).

### User Scenarios & Testing *(mandatory)*

#### User Story 1 - Registrar la asistencia (Priority: P1)

Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente.

Desde la hora de inicio de la actividad (también mientras está en curso), el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió», y puede corregirlo.

**Why this priority**: Cierra el ciclo del voluntariado y alimenta los informes (HU-04).

**Independent Test**: Con una actividad de prueba de 10:00 a 13:30 ya celebrada y dos inscritos confirmados, el coordinador marca a uno como asistente; su total sube 3,5 horas y el del otro no cambia.

**Acceptance Scenarios**:

1. **Given** una actividad que todavía no ha comenzado, **When** el coordinador intenta registrar asistencia, **Then** el sistema no lo permite.
2. **Given** una actividad de 10:00 a 13:30 ya celebrada, **When** el coordinador marca a un voluntario como asistente, **Then** se suman 3,5 horas a su total.
3. **Given** una asistencia ya registrada, **When** el coordinador vuelve a guardarla sin cambios, **Then** las horas no se duplican.
4. **Given** un voluntario marcado como asistente por error, **When** el coordinador lo cambia a «no asistió», **Then** se restan las 3,5 horas.
5. **Given** la lista de asistencia, **When** el coordinador la abre, **Then** solo aparecen los voluntarios con inscripción confirmada, no los de lista de espera ni los cancelados.
6. **Given** un usuario sin rol de coordinador, **When** intenta registrar o corregir asistencias, **Then** el sistema deniega el acceso.

<div style="page-break-before:always"></div>

#### User Story 2 - Ver mis horas acumuladas (Priority: P2)

Como voluntario, quiero ver en mi perfil el total de horas acumuladas y el detalle por actividad, como reconocimiento a mi compromiso.

**Why this priority**: Depende de que existan asistencias registradas.

**Independent Test**: Un voluntario de prueba con dos asistencias (3,5 h y 2 h) abre su perfil y ve 5,5 horas y el desglose de las dos actividades.

**Acceptance Scenarios**:

1. **Given** un voluntario con asistencias registradas, **When** abre su perfil, **Then** ve su total de horas y el desglose por actividad con fecha (dd/mm/aaaa) y horas de cada una.
2. **Given** un voluntario sin asistencias, **When** abre su perfil, **Then** ve 0 horas y un mensaje claro.
3. **Given** un voluntario identificado, **When** consulta sus horas, **Then** solo puede ver las suyas y la aplicación no ofrece forma de pedir las de otro.

<div style="page-break-before:always"></div>

#### Edge Cases

- Actividad cancelada: no admite registro de asistencia.
- Actividad que cruza la medianoche: las horas se calculan correctamente (22:00 a 01:00 = 3 h).
- Inscripción de una actividad ya iniciada: no se puede cancelar, así que una Asistencia nunca queda colgando de una inscripción cancelada.
- Una corrección cambia el estado de la Asistencia; el registro no se elimina.

### Requirements *(mandatory)*

#### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar asistencia solo en actividades publicadas (no canceladas) cuya hora de inicio ya ha pasado, incluidas las que están en curso, sin plazo máximo posterior para registrar o corregir.
- **FR-002**: El coordinador MUST poder marcar cada inscrito confirmado como «asistió» o «no asistió», y corregirlo.
- **FR-003**: Las horas de una actividad MUST ser la diferencia entre su fin y su inicio; en v1 no hay asistencias parciales: «asistió» suma siempre la duración completa y el coordinador no edita las horas.
- **FR-004**: Marcar «asistió» MUST sumar las horas al total del voluntario; cambiar a «no asistió» MUST restarlas.
- **FR-005**: Una misma asistencia MUST NOT sumar horas más de una vez.
- **FR-006**: El sistema MUST NOT permitir registrar asistencia de una persona sin inscripción confirmada en la actividad.
- **FR-007**: El voluntario MUST ver en su perfil (la página `/mis-horas`) su total de horas y el desglose por actividad; solo el suyo.
- **FR-008**: Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias, y cualquiera de ellos puede hacerlo en cualquier actividad (no solo quien la creó); la comprobación se hace en el servidor.
- **FR-009**: Desde la hora de inicio de la actividad, una Inscripción confirmada MUST NOT poder cancelarse (ya cubierto por spec-005 FR-009, que solo permite cancelar hasta el inicio).

#### Key Entities

- **Asistencia** *(dueño: spec-008)*: Inscripción, asistió (sí / no), horas, fecha de registro, Usuario coordinador que la registra.
- **Inscripción**, **Voluntario** *(dueño: spec-005)*, **Actividad** *(dueño: spec-007)*: se usan sin redefinirlas.

### Dependencies

- **spec-005 (Javi)**: Inscripción confirmada y Voluntario. FR-009 de spec-008 ya lo cubre spec-005 FR-009 (cancelar solo hasta el inicio de la actividad), así que no hace falta un acuerdo nuevo.
- **spec-004 (Rubén)** consume Asistencia para las horas de voluntariado del informe.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: El total de horas del perfil coincide siempre con la suma de sus asistencias marcadas como «asistió».
- **SC-002**: El coordinador registra la asistencia de una actividad de 20 personas en menos de 2 minutos.

### Assumptions

- Las horas se guardan con 2 decimales y se muestran con 1 (3,5 h). Por el redondeo de la interfaz, la suma de los valores mostrados puede no coincidir exactamente con el total mostrado (1,75 h + 1,75 h se ve como 1,8 h + 1,8 h, con un total de 3,5 h); SC-001 se refiere a los valores guardados.
- «Su perfil», en esta historia, es la página `/mis-horas`.

