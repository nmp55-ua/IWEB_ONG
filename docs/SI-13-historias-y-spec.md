# Sistema de Información 13 — Gestión de Donaciones y Voluntariado para una ONG

## 1. Historias de usuario y especificación (spec)

*Pila tecnológica propuesta: Astro + React (islas) · Node.js/Express · PostgreSQL · Tailwind CSS*

Este documento recoge las ocho historias de usuario identificadas a partir de la descripción narrativa del sistema, junto con su especificación funcional y sus criterios de aceptación. Siguiendo la regla de oro del Spec-Driven Development, la especificación describe **el qué y el porqué**; las decisiones técnicas (el cómo) se dejan para el plan.

Las reglas de negocio que la descripción narrativa no fija (porcentajes, plazos, límites…) se han decidido por el grupo y se marcan en la sección **Preguntas abiertas** de cada historia para revisarlas con `/speckit.clarify`.

### Actores identificados

| Actor | Descripción |
|---|---|
| Donante | Persona que colabora económicamente, con donaciones puntuales o como socio con cuota periódica. |
| Voluntario | Persona que dedica su tiempo apuntándose a actividades de la ONG. |
| Coordinador de proyectos | Crea y mantiene las actividades, sus plazas y listas de espera, y registra la asistencia. |
| Administrador de la ONG | Rinde cuentas ante la junta directiva mediante informes. |

### Equipo y reparto de historias

| Integrante | Historias asignadas | Bloque |
|---|---|---|
| *Nada* | HU-01, HU-02 | Donaciones: entrada y consulta del dinero |
| *Rubén* | HU-03, HU-04 | Documentos e informes: certificado fiscal e informes para la junta |
| *Javi* | HU-05, HU-06 | Experiencia del voluntario: inscripción y calendario |
| *Nicole* | HU-07, HU-08 | Gestión del coordinador: actividades, lista de espera y asistencia |

Cada integrante tiene dos historias que comparten datos y pantallas, de modo que puede llevar su bloque de principio a fin con pocas dependencias. Dependencias entre bloques: Rubén usa los datos de Nada (aportaciones) y de Nicole (horas); Javi usa las actividades de Nicole. Por eso conviene acordar pronto el modelo de *Aportación*, *Actividad* e *Inscripción*.

La especificación detallada de cada historia está en `specs/spec-00N/spec.md`.

---

## Historias de usuario

### Historia 1 — Donación puntual o alta como socio

**Responsable:** *Nada*

**Historia de usuario:** Como donante, quiero hacer una donación puntual o hacerme socio con una aportación periódica pagando mediante una pasarela segura, para colaborar económicamente con la ONG y recibir confirmación inmediata de que mi aportación se ha registrado.

**Especificación (spec)**

El donante elige entre dos modalidades: **donación puntual** (un único pago) o **socio** (aportación periódica con frecuencia mensual, trimestral o anual). En ambos casos indica el importe, que debe ser un número positivo en euros con un mínimo de 1,00 €, y puede elegir opcionalmente un proyecto concreto al que destinar su aportación; si no elige ninguno, la aportación se destina a «fondo general».

Para poder emitir más adelante el certificado fiscal (HU-03), el donante debe facilitar nombre y apellidos, NIF/NIE, correo electrónico y dirección postal. El NIF/NIE se valida en formato (letra de control incluida).

El pago se formaliza siempre a través de una pasarela de pago segura externa: el sistema de la ONG **nunca recibe ni almacena** los datos de la tarjeta. La aportación solo queda registrada como «confirmada» cuando la pasarela confirma el cobro; si el pago es rechazado o cancelado, no se registra ninguna donación confirmada y se informa al donante del motivo.

Tras un pago correcto, el donante ve en pantalla una confirmación con el importe, la fecha, la modalidad, el proyecto de destino y un número de referencia, y recibe ese mismo resumen por correo electrónico. En el caso de socio, la confirmación indica además la periodicidad y la fecha del próximo cobro.

**Criterios de aceptación**

- Un donante puede completar una donación puntual de 20 € al fondo general y ve una pantalla de confirmación con importe, fecha y número de referencia.
- Un donante puede darse de alta como socio con 10 €/mes y la confirmación muestra la periodicidad y la fecha del próximo cobro.
- No se admite un importe de 0 €, negativo, no numérico o inferior a 1,00 €; el sistema explica el motivo.
- No se admite un NIF/NIE con formato o letra de control inválidos.
- Si la pasarela rechaza o el donante cancela el pago, no queda registrada ninguna donación confirmada y se muestra un mensaje claro.
- Tras un pago correcto, el donante recibe un correo de confirmación con los mismos datos que vio en pantalla.
- En ningún momento se guardan en el sistema los datos de la tarjeta.

**Preguntas abiertas (clarify)**

- PA1.1 ¿Puede un socio modificar el importe o darse de baja desde la aplicación? (Propuesta: fuera de alcance en v1.)
- PA1.2 ¿Se permite donar sin crear cuenta? (Propuesta: sí, pero el historial HU-02 solo está disponible para quien tenga cuenta con el mismo correo.)

---

### Historia 2 — Historial de aportaciones del donante

**Responsable:** *Nada*

**Historia de usuario:** Como donante, quiero consultar el historial completo de mis aportaciones agrupado por año y viendo a qué proyecto se destinó cada una, para tener constancia de mi implicación con la causa.

**Especificación (spec)**

Desde su área personal, el donante identificado ve **todas** sus aportaciones confirmadas (puntuales y cuotas de socio), ordenadas de la más reciente a la más antigua y **agrupadas por año natural**. Cada aportación muestra fecha, importe, modalidad (puntual / cuota de socio) y proyecto de destino, o «fondo general» si no tenía uno asignado.

Para cada año se muestra el total aportado. El donante puede filtrar por un año concreto. Solo aparecen aportaciones confirmadas por la pasarela; los pagos rechazados o cancelados no forman parte del historial.

Un donante solo puede ver sus propias aportaciones, nunca las de otra persona.

**Criterios de aceptación**

- Un donante con aportaciones en 2025 y 2026 las ve separadas en dos bloques por año, cada uno con su total.
- Cada aportación muestra fecha, importe, modalidad y proyecto de destino (o «fondo general»).
- Los pagos rechazados o cancelados no aparecen en el historial.
- Filtrar por un año muestra solo las aportaciones de ese año.
- Un donante sin aportaciones ve un mensaje claro («Todavía no has realizado ninguna aportación»), no una pantalla vacía.
- Un donante no puede acceder al historial de otro donante, aunque conozca su identificador.

**Preguntas abiertas (clarify)**

- PA2.1 Si el administrador reasigna una donación a otro proyecto, ¿el historial muestra el proyecto actual o el original?

---

### Historia 3 — Certificado fiscal anual de donaciones

**Responsable:** *Rubén*

**Historia de usuario:** Como donante, quiero descargar al comienzo de cada año un certificado fiscal con el total que aporté el año anterior, para usarlo en mi declaración de impuestos.

**Especificación (spec)**

A partir del **1 de enero** de cada año, el sistema genera automáticamente, para cada donante que haya realizado al menos una aportación confirmada durante el año anterior, un certificado fiscal de ese ejercicio. El donante no tiene que solicitarlo: lo encuentra en su área personal, listo para descargar en PDF.

El certificado incluye: datos de la ONG (nombre y CIF), datos del donante (nombre, apellidos y NIF/NIE), ejercicio fiscal, **importe total** aportado en ese ejercicio (suma de todas las aportaciones confirmadas entre el 1 de enero y el 31 de diciembre), fecha de emisión y un código de verificación único.

Solo se genera certificado para donantes con NIF/NIE registrado y con un total mayor que cero. El donante puede descargar también los certificados de ejercicios anteriores que ya se generaron.

**Criterios de aceptación**

- Un donante que aportó 50 € en marzo y 30 € en noviembre de 2025 encuentra a partir del 1 de enero de 2026 un certificado del ejercicio 2025 por un total de **80,00 €**.
- Una aportación del 1 de enero de 2026 no se suma al certificado de 2025.
- El certificado descargado contiene los datos de la ONG, los datos del donante, el ejercicio, el total, la fecha de emisión y el código de verificación.
- Un donante sin aportaciones confirmadas en el ejercicio anterior no tiene certificado de ese ejercicio y ve un mensaje explicativo.
- Antes del 1 de enero no se puede descargar el certificado del año en curso.
- Un donante solo puede descargar sus propios certificados.

**Preguntas abiertas (clarify)**

- PA3.1 Si se corrige una donación de un ejercicio después de emitir su certificado, ¿se regenera el certificado o se emite uno rectificativo?
- PA3.2 ¿Se avisa al donante por correo cuando su certificado está disponible?

---

### Historia 4 — Informes de recaudación y voluntariado para la junta

**Responsable:** *Rubén*

**Historia de usuario:** Como administrador de la ONG, quiero obtener informes del dinero recaudado y del voluntariado generado, agrupados por proyecto y por periodo, y exportarlos, para rendir cuentas ante la junta directiva.

**Especificación (spec)**

El administrador elige un **periodo** (fecha de inicio y fin) y, opcionalmente, un **proyecto**. El informe muestra, por cada proyecto (y una fila para «fondo general»):

- **Dinero recaudado:** suma de las aportaciones confirmadas en el periodo (por fecha de cobro), separando donaciones puntuales y cuotas de socio, y número de aportaciones.
- **Voluntariado generado:** número de actividades celebradas, número de voluntarios distintos que asistieron y total de horas de voluntariado (solo asistencias registradas en HU-08).

El informe incluye una fila de **totales**. Puede agruparse además por **mes**, **trimestre** o **año** dentro del periodo elegido. El informe se puede **exportar a CSV** (para analizarlo en otras herramientas) y a **PDF** (para presentarlo), con exactamente la misma información que se muestra en pantalla.

**Criterios de aceptación**

- El informe solo cuenta aportaciones confirmadas cuya fecha de cobro está dentro del periodo elegido.
- Filtrando por un proyecto, solo aparecen las cifras de ese proyecto.
- Sin filtro de proyecto, aparece una fila por proyecto, una fila de «fondo general» y una fila de totales.
- Las horas de voluntariado coinciden con la suma de las asistencias registradas en el periodo.
- Agrupar por trimestre muestra una fila por cada trimestre del periodo.
- Las exportaciones CSV y PDF contienen la misma información que la pantalla.
- Un periodo sin datos muestra un informe vacío con un mensaje claro, no un error.
- Una fecha de fin anterior a la de inicio no se acepta.
- Solo los usuarios con rol de administrador pueden acceder a los informes.

**Preguntas abiertas (clarify)**

- PA4.1 ¿Los informes deben incluir datos personales de donantes o solo cifras agregadas? (Propuesta: solo agregadas, por protección de datos.)

---

### Historia 5 — Consulta e inscripción en actividades de voluntariado

**Responsable:** *Javi*

**Historia de usuario:** Como voluntario, quiero consultar las actividades disponibles y apuntarme a las que me interesen viendo cuántas plazas quedan libres y qué requisitos se piden, para colaborar con mi tiempo en las que encajen conmigo.

**Especificación (spec)**

Cualquier persona puede ver el listado de actividades **futuras y publicadas**. Cada actividad muestra título, descripción, fecha y hora de inicio y fin, lugar, proyecto al que pertenece, **plazas libres / plazas totales** y los **requisitos** de participación (por ejemplo, mayoría de edad, carné de conducir o formación previa). El listado se puede filtrar por proyecto y por fecha.

Para inscribirse hace falta estar identificado como voluntario. Al inscribirse, el voluntario debe confirmar expresamente que cumple los requisitos de la actividad. Si quedan plazas libres, la inscripción queda **confirmada** y las plazas libres disminuyen en una. Si la actividad está completa, el voluntario puede apuntarse a la **lista de espera** (gestionada en HU-07).

Un voluntario no puede inscribirse dos veces en la misma actividad, ni inscribirse en una actividad ya celebrada. Puede cancelar su inscripción hasta el inicio de la actividad; al hacerlo, la plaza queda libre.

**Criterios de aceptación**

- El listado muestra para cada actividad futura sus plazas libres y totales y sus requisitos.
- Las actividades ya celebradas no aparecen en el listado de disponibles.
- Inscribirse en una actividad con plazas libres confirma la inscripción y reduce en una las plazas libres.
- No se puede completar la inscripción sin confirmar que se cumplen los requisitos.
- En una actividad sin plazas libres no se ofrece inscripción directa, sino apuntarse a la lista de espera.
- Un voluntario no puede inscribirse dos veces en la misma actividad; el sistema lo indica.
- Si un voluntario cancela su inscripción antes del inicio, las plazas libres aumentan en una.
- Un usuario no identificado puede ver el listado, pero al intentar inscribirse se le pide identificarse.

**Preguntas abiertas (clarify)**

- PA5.1 ¿El sistema debe comprobar algún requisito automáticamente (por ejemplo, la edad a partir de la fecha de nacimiento) o basta con la declaración del voluntario?
- PA5.2 ¿Se permite inscribirse en dos actividades que se solapan en el horario?

---

### Historia 6 — Calendario personal del voluntario

**Responsable:** *Javi*

**Historia de usuario:** Como voluntario, quiero ver en un calendario personal mis próximas actividades, para organizar mi disponibilidad y no olvidar ningún compromiso.

**Especificación (spec)**

Desde su área personal, el voluntario dispone de un calendario con **vista mensual** y una **vista de lista** de próximas actividades. En él aparecen únicamente las actividades en las que tiene una **inscripción confirmada** y cuya fecha es igual o posterior a hoy. Las actividades en las que está en lista de espera se muestran diferenciadas visualmente con la etiqueta «en lista de espera».

Al seleccionar una actividad, el voluntario ve su detalle (fecha, horario, lugar, requisitos) y puede cancelar su inscripción desde ahí (con las reglas de HU-05). El calendario se actualiza inmediatamente cuando el voluntario se inscribe, cancela o pasa de la lista de espera a plaza confirmada.

**Criterios de aceptación**

- Un voluntario inscrito en tres actividades futuras las ve las tres en su calendario, en su fecha correcta.
- Las actividades ya pasadas no aparecen en la vista de próximas actividades.
- Las actividades en lista de espera aparecen con la etiqueta «en lista de espera», diferenciadas de las confirmadas.
- Tras cancelar una inscripción, la actividad desaparece del calendario sin necesidad de recargar manualmente.
- Cuando un voluntario sale de la lista de espera y obtiene plaza, la actividad pasa a mostrarse como confirmada.
- Un voluntario sin actividades futuras ve un mensaje claro con un enlace al listado de actividades disponibles.
- Un voluntario solo ve su propio calendario.

**Preguntas abiertas (clarify)**

- PA6.1 ¿Se ofrece exportar el calendario (por ejemplo, a un fichero .ics)? (Propuesta: fuera de alcance en v1.)

---

### Historia 7 — Gestión de actividades, plazas y lista de espera

**Responsable:** *Nicole*

**Historia de usuario:** Como coordinador de proyectos, quiero crear y mantener las actividades definiendo sus plazas y gestionando la lista de espera cuando la demanda supera el aforo, para organizar el voluntariado de cada proyecto.

**Especificación (spec)**

El coordinador puede **crear, editar y cancelar** actividades. Cada actividad requiere: título, descripción, proyecto al que pertenece, fecha y hora de inicio y fin (el fin debe ser posterior al inicio, y el inicio posterior al momento actual), lugar, número de plazas (entero mayor que cero) y requisitos de participación (texto, puede estar vacío). Una actividad puede estar en estado **borrador** (no visible para voluntarios), **publicada** o **cancelada**.

Cuando una actividad publicada está completa, los nuevos interesados entran en una **lista de espera por orden de llegada (FIFO)**. Si se libera una plaza (por cancelación de un inscrito o porque el coordinador aumenta el aforo), la primera persona de la lista pasa **automáticamente** a inscripción confirmada y recibe un aviso por correo.

El coordinador no puede reducir las plazas por debajo del número de inscritos confirmados. Si cancela una actividad, todos los inscritos y las personas en lista de espera reciben un aviso y la actividad deja de aparecer como disponible. El coordinador puede consultar en cada actividad la lista de inscritos confirmados y la lista de espera con su orden.

**Criterios de aceptación**

- El coordinador puede crear una actividad con todos los campos obligatorios; si falta alguno o las fechas son incoherentes, el sistema lo indica y no la crea.
- Una actividad en borrador no aparece en el listado público; al publicarla, sí.
- Con una actividad de 10 plazas y 10 inscritos, la undécima persona entra en la lista de espera en la posición 1.
- Si un inscrito cancela, la primera persona de la lista de espera pasa automáticamente a confirmada y recibe un aviso.
- Si el coordinador aumenta las plazas de 10 a 12, las dos primeras personas de la lista de espera pasan a confirmadas.
- No se pueden reducir las plazas por debajo del número de inscritos confirmados; el sistema explica el motivo.
- Al cancelar una actividad, inscritos y lista de espera reciben un aviso y la actividad deja de estar disponible.
- Solo los usuarios con rol de coordinador pueden crear, editar o cancelar actividades.

**Preguntas abiertas (clarify)**

- PA7.1 ¿Puede un coordinador editar actividades de proyectos que no coordina?
- PA7.2 ¿Existe un plazo para aceptar la plaza liberada, o se confirma directamente?

---

### Historia 8 — Registro de asistencia y acumulación de horas

**Responsable:** *Nicole*

**Historia de usuario:** Como coordinador de proyectos, quiero registrar quién ha asistido realmente a cada actividad, para que las horas de voluntariado de cada persona se acumulen automáticamente en su perfil como reconocimiento a su compromiso.

**Especificación (spec)**

Una vez que la actividad ha **comenzado o terminado**, el coordinador accede a la lista de inscritos confirmados y marca a cada uno como **asistió** o **no asistió**. No se puede registrar asistencia de una actividad futura ni de una persona que no estaba inscrita con plaza confirmada.

Las horas de cada actividad son la diferencia entre su hora de fin y su hora de inicio. Al marcar a un voluntario como asistente, esas horas se suman **automáticamente** a su total acumulado; si el coordinador corrige un error y lo marca como no asistente, las horas se restan. Una misma asistencia nunca suma horas dos veces.

En su perfil, el voluntario ve su **total de horas acumuladas** y el detalle de las actividades a las que asistió, con fecha y horas de cada una.

**Criterios de aceptación**

- No se puede registrar asistencia en una actividad que todavía no ha comenzado.
- Marcar como asistente a un voluntario en una actividad de 10:00 a 13:30 suma 3,5 horas a su perfil.
- Volver a guardar la misma asistencia no duplica las horas.
- Corregir una asistencia a «no asistió» resta las horas que se habían sumado.
- Solo aparecen para marcar los voluntarios con inscripción confirmada (no los de lista de espera).
- El voluntario ve en su perfil su total de horas y el desglose por actividad.
- Solo los coordinadores pueden registrar o corregir asistencias.

**Preguntas abiertas (clarify)**

- PA8.1 ¿Hay un plazo máximo tras la actividad para registrar o corregir la asistencia?
- PA8.2 ¿Se pueden registrar asistencias parciales (por ejemplo, llegó una hora tarde)? (Propuesta: no en v1.)

---

## 2. Fuera de alcance (v1)

- Gestión de devoluciones o reembolsos de donaciones.
- Modificación o baja de la cuota de socio desde la aplicación (pendiente de PA1.1).
- Presentación telemática del modelo 182 ante Hacienda.
- Chat o mensajería interna entre coordinadores y voluntarios.
- Exportación del calendario a aplicaciones externas (pendiente de PA6.1).
