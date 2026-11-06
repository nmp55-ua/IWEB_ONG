# Feature Specification: HU-01 — Donación puntual o alta como socio

**Feature Branch**: `spec-001`

**Created**: 2026-10-28

**Status**: Draft

**Responsable**: *Nada* · **Revisor**: *Rubén*

**Input**: Descripción del SI-13: "cualquier persona interesada en colaborar económicamente pueda hacer una donación puntual o convertirse en socio con una aportación periódica, formalizando el pago a través de una pasarela segura y recibiendo confirmación inmediata de que su colaboración se ha registrado."

## Clarifications

Las sesiones fechadas conservan la evolución de las decisiones. El estado vigente se recoge
en requisitos y dependencias; las referencias históricas a ajustes pendientes no sustituyen
la alineación documental actual de esta rama.

### Session 2026-11-04

- Q: ¿Debe un socio poder modificar el importe de su cuota o darse de baja desde la aplicación en esta primera versión? (PA1.1) → A: No. Ambas operaciones quedan fuera de alcance en v1; se mantienen el alta como socio y el registro de los cobros periódicos previstos en HU-01.
- Q: ¿Debe ser obligatorio tener una cuenta para hacer una donación puntual o darse de alta como socio? (PA1.2) → A: No. Ambas modalidades pueden completarse sin cuenta. Para consultar el historial es necesario iniciar sesión con una cuenta del mismo correo utilizado al donar; la coincidencia de correos no acredita por sí sola su titularidad. La comprobación previa a la vinculación se concreta en PA1.3.
- Q: ¿Cómo debe demostrar una persona que controla el correo utilizado al donar antes de vincular las aportaciones a su cuenta? (PA1.3) → A: Antes de vincular las aportaciones a una cuenta, debe abrirse un enlace de verificación enviado al correo utilizado al donar. La comprobación se limita al módulo de donaciones y a esa vinculación, sin cambiar el registro ni el inicio de sesión generales. Los ajustes comunes quedan identificados y sin realizar.
- Q: ¿Qué debe ocurrir si el cobro está confirmado pero falla el envío del correo de confirmación? (PA1.4) → A: Se conserva la aportación confirmada, se muestra el resumen y se avisa del fallo. Se permite reintentar únicamente el envío del correo, sin iniciar otro cobro ni crear otra aportación. El aviso no equivale a un envío satisfactorio.
- Q: ¿Qué debe ocurrir si alguien introduce un correo ya utilizado por un donante, pero con un NIF/NIE diferente? (PA1.5) → A: Se detiene la operación antes del pago y se pide revisar los datos, sin mostrar datos del donante existente, modificarlo ni mezclar aportaciones. El correo por sí solo no identifica al donante. El ajuste del modelo común queda identificado y sin realizar; actualmente solo establece como único el NIF/NIE.

### Session 2026-11-04 — Ronda 2

- Q: ¿Qué debe hacerse si una nueva aportación usa un NIF/NIE ya registrado, pero otro correo o datos fiscales distintos? (PA1.6) → A: En v1, HU-01 no permite modificar el correo, nombre, apellidos ni dirección de un Donante existente. Si el mismo NIF/NIE se presenta con cambios reales, se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante. Las correcciones quedan fuera de v1; se acepta que no puedan usarse datos nuevos mediante este flujo. Las diferencias meramente de formato deben distinguirse de los cambios reales; su tratamiento se concretará en plan.
- Q: ¿Cómo debe acceder una persona sin cuenta al resultado de su pago y al reintento del correo de confirmación? (PA1.7) → A: Únicamente desde la sesión vigente de la operación iniciada en ese navegador. La autorización se limita a esa operación y no permite consultar otras aportaciones ni el historial; conocer la referencia por sí solo no da acceso. Si se pierde o caduca esa sesión, recuperar el acceso directo sin cuenta queda fuera de v1. Esto no cancela el pago ni elimina la aportación: las notificaciones válidas de la pasarela siguen procesándose aunque se cierre el navegador o no se vuelva a la aplicación. Los mecanismos técnicos se concretarán en plan.
- Q: ¿Qué debe ocurrir con la suscripción y la información del próximo cobro si falla una cuota posterior al alta como socio? (PA1.8) → A: Se registra el fallo sin considerar pagada la cuota ni incrementar el total aportado. El fallo por sí solo no cancela la suscripción ni altera las aportaciones anteriores; se informa del fallo. Debe procesarse una cancelación que comunique posteriormente la pasarela. Solo se muestra una fecha futura de cobro comunicada por ella; si no existe, se muestra «Pendiente de confirmación». La aplicación no inicia cobros adicionales por su cuenta. Los eventos concretos y su tratamiento técnico corresponden a plan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hacer una donación puntual (Priority: P1)

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
19. **Given** una persona que conoce la referencia de una aportación pero no conserva una sesión vigente autorizada para esa operación, **When** intenta consultar el resultado o reintentar su correo, **Then** se deniega el acceso sin mostrar datos ni enviar el correo, y no se ofrece recuperación de ese acceso directo sin cuenta en v1.
20. **Given** una sesión vigente autorizada para una operación, **When** se intenta usarla para consultar otra aportación, reintentar el correo de otra operación o acceder al historial sin una cuenta identificada y vinculada, **Then** esa autorización no concede acceso a dichos recursos ni permite enviar el correo de otra operación.
21. **Given** una aportación iniciada cuyo pago todavía no se ha confirmado, **When** se cierra el navegador o se pierde o caduca la sesión y después llega una notificación válida de cobro de la pasarela, **Then** se procesa y confirma la aportación una sola vez sin exigir que el donante vuelva a la aplicación; la pérdida de sesión por sí sola no cancela el pago ni elimina la aportación.

---

### User Story 2 - Hacerse socio con aportación periódica (Priority: P1)

Como donante, quiero hacerme socio con una aportación mensual, trimestral o anual, para colaborar de forma continuada. Puedo completar el alta sin crear una cuenta ni iniciar sesión.

**Why this priority**: Es la otra modalidad de entrada de dinero y comparte casi todo el flujo con la donación puntual.

**Independent Test**: Se da de alta un socio con 10 €/mes con un pago de prueba y se comprueba que la confirmación muestra la periodicidad y la fecha del próximo cobro.

**Acceptance Scenarios**:

1. **Given** un donante en el formulario, **When** elige «socio», 10 € mensuales y la pasarela confirma el primer cobro, **Then** la confirmación muestra 10,00 €, la periodicidad «mensual» y la fecha del próximo cobro.
2. **Given** un socio dado de alta, **When** la pasarela notifica un cobro periódico posterior, **Then** se registra como una nueva aportación confirmada de modalidad «cuota de socio».
3. **Given** un alta como socio, **When** la pasarela rechaza el primer cobro, **Then** no queda ninguna suscripción activa ni aportación confirmada.
4. **Given** una persona sin cuenta ni sesión iniciada, **When** completa los datos válidos del alta como socio y la pasarela confirma el primer cobro, **Then** puede finalizar el alta y recibir su confirmación sin registrarse.
5. **Given** un alta como socio con el primer cobro confirmado, **When** falla el envío del correo de confirmación, **Then** se mantienen la suscripción activa y la aportación confirmada, se muestran el resumen, la periodicidad y el próximo cobro, y se avisa del correo pendiente con la opción de reintentar exclusivamente su envío.
6. **Given** una cuota de socio confirmada cuyo correo ha fallado y una autorización vigente para esa operación, **When** se reintenta su envío, **Then** se informa de su resultado real y se conserva la cuota ya registrada, sin crear otra aportación ni suscripción ni iniciar otro cobro; si falla de nuevo, el correo sigue pendiente. La autorización sin cuenta del alta no concede por sí sola acceso a cuotas posteriores, que son otras operaciones.
7. **Given** un correo ya utilizado por un Donante, **When** se solicita un alta de socio con ese correo y otro NIF/NIE, **Then** el sistema detiene la operación antes del pago y pide revisar los datos, sin mostrar datos del Donante existente, modificarlo ni mezclar sus aportaciones.
8. **Given** un Donante existente, **When** se solicita un alta de socio con el mismo NIF/NIE y cambios reales en correo, nombre, apellidos o dirección, **Then** se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los guardados, sobrescribirlos ni crear otro Donante; las correcciones quedan fuera de v1.
9. **Given** un alta como socio iniciada cuyo primer cobro está pendiente, **When** se pierde la sesión o no se vuelve a la aplicación y llega una notificación válida del primer cobro confirmado, **Then** se registra la aportación y se activa la suscripción conforme a las reglas del alta, sin depender del retorno del navegador ni de su sesión; el acceso directo sin cuenta sigue sujeto a FR-016.
10. **Given** una suscripción activa con aportaciones anteriores confirmadas, **When** la pasarela comunica válidamente el fallo de una cuota posterior al alta, **Then** se registra e informa el fallo sin considerar pagada esa cuota ni incrementar el total aportado, se conservan intactas las aportaciones anteriores y el fallo por sí solo no cancela la suscripción ni provoca un cobro adicional iniciado por la aplicación.
11. **Given** una cuota posterior fallida y una fecha futura de cobro comunicada por la pasarela, **When** se muestra la información del próximo cobro, **Then** aparece únicamente esa fecha comunicada, sin calcular o inventar otra fecha por la aplicación.
12. **Given** una cuota posterior fallida sin fecha futura de cobro comunicada por la pasarela, **When** se muestra la información del próximo cobro, **Then** aparece «Pendiente de confirmación»; una fecha ya pasada no se presenta como próximo cobro.
13. **Given** una suscripción que permaneció activa tras el fallo de una cuota, **When** la pasarela comunica posteriormente una cancelación válida, **Then** el sistema procesa la cancelación y muestra la suscripción cancelada, sin modificar ni eliminar las aportaciones anteriores y sin iniciar un cobro adicional por su cuenta; la exclusión de la baja desde la aplicación no permite ignorar esa notificación.

---

### Edge Cases

- El donante cierra la ventana durante el pago o pierde la sesión: esto no cancela el pago ni elimina la aportación. La aportación queda «pendiente» hasta que la pasarela comunique un resultado válido; se procesa esa notificación aunque el donante no vuelva a la aplicación. Perder la sesión impide recuperar el acceso directo sin cuenta en v1, pero no detiene ese procesamiento.
- La pasarela notifica dos veces el mismo pago: la aportación se registra una sola vez.
- El proyecto elegido deja de estar activo mientras el donante rellena el formulario: se le avisa y se le ofrece el fondo general.
- Un Donante existente vuelve a aportar: se reutiliza si sus datos coinciden, distinguiendo diferencias meramente de formato de cambios reales, sin sobrescribirlos ni duplicarlo. Si el correo corresponde a otro NIF/NIE, se aplica FR-014; si el mismo NIF/NIE se presenta con cambios reales de correo o datos fiscales, se aplica FR-015. En v1 no existe autorización para corregir esos datos desde HU-01, tampoco por tener una cuenta vinculada.
- El correo falla después de confirmarse un cobro, puntual o de socio: el pago conserva su estado y referencia; el correo sigue pendiente hasta un envío satisfactorio. Reintentar el correo, aunque vuelva a fallar, no repite el cobro ni crea otra aportación.
- Falla una cuota posterior al alta: se registra e informa el fallo, sin contarla como pagada, incrementar el total ni alterar aportaciones anteriores. El fallo no cancela por sí solo la suscripción, pero una cancelación posterior comunicada válidamente por la pasarela sí debe procesarse. Sin fecha futura comunicada, el próximo cobro se muestra como «Pendiente de confirmación»; la aplicación no inicia cobros adicionales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer dos modalidades: donación puntual y socio con periodicidad mensual, trimestral o anual.
- **FR-002**: El sistema MUST exigir un importe en EUR entre 1,00 € y 999.999,99 €, ambos incluidos, con un máximo de 2 decimales. Este máximo es un límite elegido para la aplicación.
- **FR-003**: El sistema MUST permitir elegir opcionalmente un Proyecto activo como destino; si no se elige, el destino es «fondo general».
- **FR-004**: El sistema MUST pedir nombre y apellidos, NIF/NIE, correo electrónico y dirección postal (solo estos datos), y MUST validar el formato del NIF/NIE (incluida la letra de control) y del correo.
- **FR-005**: El pago MUST realizarse exclusivamente con tarjeta mediante Stripe Checkout alojado, en EUR; el sistema MUST NOT recibir ni almacenar datos de tarjeta.
- **FR-006**: Una Aportación MUST quedar «confirmada» solo cuando la pasarela confirma el cobro; en otro caso queda «pendiente», «rechazada» o «cancelada». Las aportaciones cambian de estado, nunca se eliminan.
- **FR-007**: Tras la confirmación del cobro, el sistema MUST mostrar y enviar por correo un resumen con importe, fecha, modalidad, destino y un número de referencia único. Si falla el envío, MUST conservar la aportación confirmada y mostrar el resumen y un aviso de correo pendiente. Para una persona sin cuenta, la consulta del resumen y del aviso requiere la autorización de FR-016; el procesamiento del pago y el envío de confirmación no dependen de conservar esa sesión. Mostrar el resumen o el aviso MUST NOT considerarse un envío satisfactorio ni dar por cumplida la obligación de enviar el correo.
- **FR-008**: Para socios, el sistema MUST registrar una SuscripcionSocio con importe y periodicidad, y MUST mostrar la fecha del próximo cobro conforme a FR-019 cuando haya fallado una cuota posterior al alta. Modificar el importe de la cuota y darse de baja desde la aplicación quedan fuera de alcance en v1; se mantienen el alta y el registro de los cobros periódicos de FR-009. Excluir la baja desde la aplicación MUST NOT impedir procesar una cancelación válida comunicada por la pasarela.
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

### Key Entities

- **Donante** *(dueño: spec-001)*: persona que aporta dinero. Nombre, apellidos, NIF/NIE, correo, dirección postal. Puede estar ligado a un Usuario con rol donante tras acreditar el acceso al correo según FR-013.
- **Aportación** *(dueño: spec-001)*: Donante, importe, fecha de cobro, modalidad (puntual / cuota de socio), estado (pendiente / confirmada / rechazada / cancelada), referencia, Proyecto de destino (opcional = fondo general), SuscripcionSocio de origen (si es cuota).
- **SuscripcionSocio** *(dueño: spec-001)*: Donante, importe, periodicidad, fecha de alta, fecha del próximo cobro, estado.
- **Proyecto** *(común)*: nombre, descripción, activo / inactivo.

## Dependencies

- **Base común**: Usuario, roles, sesiones y Proyecto existentes; no se cambia registro o login.
- **Modelo único P-01**: [modelo-datos.md](../modelo-datos.md) define Donante, Aportación,
  SuscripcionSocio y soporte técnico. Se confirma el mismo pago recuperado sin duplicar,
  conservando las aportaciones ya confirmadas; primer rechazo recuperable no activa ni
  cancela definitivamente el alta. La representación de próxima fecha desconocida es NULL.
- **Identidad y acceso (PA1.2, PA1.3, PA1.5–PA1.7)**: comparación normalizada sin sobrescribir,
  conflictos antes del pago y vínculo por enlace limitado a donaciones. Permiso de sesión
  por operación y caducidad absoluta de ocho horas, sin acceso por referencia sola. El
  [plan común](../plan-comun.md) y los [contratos](contracts/api-donaciones.md) precisan los mecanismos.
- **Correo (PA1.4; P-03)**: persistencia de resumen/resultado y reintento autorizado sin
  repetir dinero. La ampliación opcional de enviarCorreo conserva el comportamiento de
  los otros módulos. Un aviso o aceptación SMTP no prueba recepción del mensaje.
- **Pasarela (PA1.8; P-02)**: el [contrato Stripe](contracts/pasarela-stripe.md) define eventos,
  pertenencia, deduplicación, previsión futura y cancelación canónica. Webhooks independientes
  del navegador. P-05 es preparación del entorno antes de pruebas reales, aún sin comprobar.
- **Alcance v1 P-04**: tarjeta, EUR y rango incluido de FR-002; límite propio de la aplicación,
  sin atribuirlo como máximo universal de la pasarela.
- **HU-02, HU-03 y HU-04** consumen los datos comunes. La alineación documental se prepara
  en spec-001 con Nada responsable y Rubén revisor. Revisión e incorporación compartida
  pendientes; no se atribuye acuerdo colectivo. La estrategia conserva 004 como entrega
  temprana y coordina después el número de la ampliación técnica, sin reservar 009.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un donante completa una donación puntual en menos de 3 minutos desde que entra en el formulario.
- **SC-002**: El 100 % de las aportaciones confirmadas deben tener su correo de confirmación enviado satisfactoriamente, en el intento inicial o tras un reintento, con evidencia del correo recibido en el buzón destinatario de pruebas. Un intento fallido, el resumen en pantalla o un aviso no cuentan como envío satisfactorio. Mientras haya correos pendientes por fallos de envío, este criterio no se considera cumplido, aunque sus aportaciones estén confirmadas.
- **SC-003**: En ningún dato guardado por la ONG aparece un número de tarjeta.
- **SC-004**: El importe mostrado en la confirmación coincide al céntimo con el cobrado por la pasarela.

## Assumptions

- Durante el desarrollo se usa la pasarela en modo de pruebas.
- Los cobros periódicos posteriores al primero los realiza la pasarela y se registran al notificarse.
- Las fechas y horas se muestran en hora peninsular española.
- Limitación de v1 aceptada en PA1.6: una persona cuyos datos hayan cambiado no podrá utilizar sus nuevos datos mediante este flujo; la corrección del Donante existente queda fuera de HU-01 en esta versión.
- Limitación de v1 aceptada en PA1.7: si se pierde o caduca la sesión autorizada de la operación, no se recupera su acceso directo sin cuenta. Esto no cancela el pago, no elimina la aportación ni impide procesar notificaciones válidas de la pasarela; tampoco acredita un envío satisfactorio de correo que siga pendiente.

## Open Questions (para `/speckit-clarify`)

No quedan preguntas funcionales PA1.1–PA1.8 pendientes ni se abre otra ronda. El límite y
medio de pago de v1 quedan fijados en FR-002 y FR-005. La normalización, seguridad, estados,
correo y eventos se definen en el [plan](plan.md) y sus contratos, alineados con los documentos
comunes. Quedan la revisión de Rubén y el trabajo futuro de implementación y preparación
para pruebas, sin atribuir acuerdo colectivo ni resultados de ejecución.
