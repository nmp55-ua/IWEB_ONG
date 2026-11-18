# Matriz de trazabilidad — SI-13 Donaciones y Voluntariado

> **Borrador para revisar.** Generado el 17/11/2026 a partir de `main` (`470b1e1`): requisitos de
> cada `spec.md`; tareas según la tabla de cobertura del último analyze de cada spec (o, si no la
> tiene, las tareas de `tasks.md` que citan el requisito); pruebas automáticas que lo nombran; y
> pasos del `quickstart.md`. Cada responsable revisa sus filas, completa las celdas «⚠ completar»
> y otra persona revisa (enunciado §5.2, punto 5). No sustituye a las matrices detalladas de cada spec.

## Resumen por historia

| Spec | Historia | Responsable | Revisor | PR | Revisión registrada | Requisitos | Con tareas | Con prueba (automática o manual) |
|---|---|---|---|---|---|---|---|---|
| spec-001 | HU-01 Donación puntual o alta como socio | Nada | Rubén | #4 | sin revisión registrada | 23 | 23 | 23 |
| spec-002 | HU-02 Historial de aportaciones | Nada | Javi | #6 | aprobado | 11 | 11 | 11 |
| spec-003 | HU-03 Certificado fiscal anual | Rubén | Nada | #5 | aprobado | 14 | 13 | 11 |
| spec-004 | HU-04 Informes para la junta | Rubén | Nicole | #8 | aprobado | 12 | 12 | 6 |
| spec-005 | HU-05 Consulta e inscripción en actividades | Javi | Nicole | #2 | aprobado | 13 | 13 | 12 |
| spec-006 | HU-06 Calendario del voluntario | Javi | Nada | #3 | aprobado | 8 | 8 | 8 |
| spec-007 | HU-07 Gestión de actividades y lista de espera | Nicole | Javi | #1 | aprobado | 14 | 14 | 14 |
| spec-008 | HU-08 Asistencia y horas de voluntariado | Nicole | Rubén | #7 | sin revisión registrada | 11 | 11 | 11 |

Las celdas «⚠ completar» no significan que falte la funcionalidad: indican que ninguna tarea o
prueba **nombra** ese requisito. El responsable debe enlazar la tarea o prueba que lo cubre
(o la comprobación manual) o justificar que no aplica.

## spec-001 · HU-01 Donación puntual o alta como socio

**Responsable**: Nada · **Revisor**: Rubén · **PR**: #4

Matriz detallada del responsable: [`specs/spec-001/refinamiento/matriz-validacion-01.md`](../../specs/spec-001/refinamiento/matriz-validacion-01.md).

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST ofrecer dos modalidades: donación puntual y socio con periodicidad mensual, tri… | T015, T036, T059–T060, T069 | A2 (modalidades) / A9 (Checkout y periodicidades) / R3 | sí | Revisado por Nada |
| FR-002 | El sistema MUST exigir un importe en EUR entre 1,00 € y 999.999,99 €, ambos incluidos, con un m… | T004, T021, T036, T060 | `normalizacion.test.js` | sí | Revisado por Nada |
| FR-003 | El sistema MUST permitir elegir opcionalmente un Proyecto activo como destino; si no se elige, … | T034–T035, T045 | A2 (proyecto activo/fondo general) / R1 | sí | Revisado por Nada |
| FR-004 | El sistema MUST pedir nombre y apellidos, NIF/NIE, correo electrónico y dirección postal (solo … | T021, T033, T036, T045 | `normalizacion.test.js` | sí | Revisado por Nada |
| FR-005 | El pago MUST realizarse exclusivamente con tarjeta mediante Stripe Checkout alojado, en EUR; el… | T015–T016, T036, T045 | A9 (tarjeta, EUR y Checkout) / R1 | sí | Revisado por Nada |
| FR-006 | Una Aportación MUST quedar «confirmada» solo cuando la pasarela confirma el cobro; en otro caso… | T004, T038–T039, T062 | A4 (confirmación canónica e idempotencia) / A7 (facturas) / R2 | sí | Revisado por Nada |
| FR-007 | Tras la confirmación del cobro, el sistema MUST mostrar y enviar por correo un resumen con impo… | T025–T026, T040, T047, T070 | A3/A6/A8 (resultado, reserva y texto del correo) / R1/R5 | sí | Revisado por Nada |
| FR-008 | Para socios, el sistema MUST registrar una SuscripcionSocio con importe y periodicidad y MUST m… | T058–T059, T062, T066, T069–T070 | A2/A7 (alta y periodicidades) / R3 | sí | Revisado por Nada |
| FR-009 | Cada cobro periódico confirmado por la pasarela MUST registrarse como una nueva Aportación de m… | T063–T064 | A7 (S02: cuota de ciclo única por factura) | sí | Revisado por Nada |
| FR-010 | Una misma notificación de pago MUST NOT registrar dos aportaciones. | T015, T034–T035, T037–T038, T061, T063–T064 | A4/A7 (reentregas e idempotencia de pagos/facturas) / R2/R3 | sí | Revisado por Nada |
| FR-011 | El sistema MUST permitir completar tanto una donación puntual como un alta de socio sin crear u… | T023, T035–T036, T043, T059 | A2/A3 (donación sin cuenta) / M1/R1 | sí | Revisado por Nada |
| FR-012 | Cuando falle el correo de confirmación de una aportación, puntual o cuota de socio, el sistema … | T026, T041, T047, T070 | A3/A6/A10 (fallo SMTP, aviso y reintento sin nuevo cobro) / M1/M3 | sí | Revisado por Nada |
| FR-013 | El flujo de donaciones MUST ofrecer una entrada visible a la página de vinculación desde el for… | T042–T045, T047, T049 | A3 (solicitud y consumo del vínculo) / M1/M3/R1 | sí | Revisado por Nada |
| FR-014 | Si el correo facilitado para una donación puntual o un alta de socio ya corresponde a un Donant… | T032–T033, T059 | A2/A10 (conflicto de identidad antes del pago) | sí | Revisado por Nada |
| FR-015 | En v1, HU-01 MUST NOT permitir modificar el correo, nombre, apellidos ni dirección de un Donant… | T021, T032–T033, T059 | `normalizacion.test.js` (equivalencias) / `servicio.test.js` (conflicto antes de Stripe) / A10-M3 (nombre, apellidos y dirección con cuenta vinculada) | sí | Revisado por Nada |
| FR-016 | Una persona sin cuenta MUST poder consultar el resultado de su pago y reintentar el correo de c… | T023, T040–T041, T068 | A3/A5 (permiso por operación y propiedad) / M1/R1 | sí | Revisado por Nada |
| FR-017 | La pérdida o caducidad de la sesión, el cierre del navegador o la ausencia de retorno a la apli… | T037–T039, T061–T062 | A3/A4 (webhook firmado, sin sesión e idempotente) / R2 | sí | Revisado por Nada |
| FR-018 | Si falla una cuota posterior al alta como socio, el sistema MUST registrar e informar el fallo,… | T065–T066, T068, T070 | A7/A8/A11 (fallo de cuota y aviso histórico) / M2 | sí | Revisado por Nada |
| FR-019 | Tras el fallo de una cuota posterior al alta, el sistema MUST mostrar como próximo cobro únicam… | T067–T068, T070 | A7 (previsión futura, vencida/nula y cancelación) / M2 | sí | Revisado por Nada |
| SC-001 | Un donante completa una donación puntual en menos de 3 minutos desde que entra en el formulario… | T045–T047; T079 | R5: 61 s con cronómetro (< 180 s; sin t0/t1 ni captura disponibles); R4 fallida (480,836 s) conservada, no promediada | sí | Revisado por Nada |
| SC-002 | El 100 % de las aportaciones confirmadas deben tener su correo de confirmación enviado satisfac… | T024–T026, T041; T077, T079 | R1-R5: 7/7 del conjunto delimitado de aportaciones 30-36; no acredita el 100 % global | sí | Revisado por Nada |
| SC-003 | En ningún dato guardado por la ONG aparece un número de tarjeta. | T014–T016, T045; T074 | A9 (proyecciones sin tarjeta) / T074 (inspección de datos persistidos) | sí | Revisado por Nada |
| SC-004 | El importe mostrado en la confirmación coincide al céntimo con el cobrado por la pasarela. | T020–T021, T030, T038, T055, T062–T063; T077–T079 | A1/A9 y cotejos reales de R1/R3/R5; importes exactos al céntimo | sí | Revisado por Nada |

## spec-002 · HU-02 Historial de aportaciones

**Responsable**: Nada · **Revisor**: Javi · **PR**: #6

Matriz detallada del responsable: [`specs/spec-002/refinamiento/matriz-validacion-01.md`](../../specs/spec-002/refinamiento/matriz-validacion-01.md).

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST mostrar al donante identificado y con vínculo verificado todas sus aportaciones… | T006/T008–T011/T017/T026/T029 | `donaciones/historial.test.js` (puntuales y cuotas; 60 y 61 sin cortar) | sí | Revisado por Nada · revisado (Javi) |
| FR-002 | Las aportaciones MUST agruparse por año natural según la fecha de cobro en Europe/Madrid y orde… | T006/T008/T009/T011/T017/T028 | `donaciones/historial.test.js` (agrupa por año en Madrid; de más reciente a más antigua) | sí | Revisado por Nada · revisado (Javi) |
| FR-003 | Cada grupo anual MUST mostrar el total aportado ese año, en euros con 2 decimales. | T006–T009/T011–T016/T017/T028 | `donaciones/historial.test.js` (totales anuales al céntimo) y `frontend/…/donaciones/historial.test.js` (2 decimales) | sí | Revisado por Nada · revisado (Javi) |
| FR-004 | Cada aportación MUST mostrar fecha, importe, modalidad y proyecto de destino o «fondo general». | T006/T008/T009/T011/T017/T026/T028 | `donaciones/historial.test.js` (fecha, importe, modalidad y proyecto o «fondo general») | sí | Revisado por Nada · revisado (Javi) |
| FR-005 | El sistema MUST permitir filtrar por un año concreto. | T006/T008–T011/T019/T027 | `donaciones/historial.test.js` (filtro por año; año no válido → 400) y `frontend/…/donaciones/historial.test.js`; manual T027 (`validacion-interfaz-01.md`) | sí | Revisado por Nada · revisado (Javi) |
| FR-006 | El sistema MUST NOT mostrar aportaciones pendientes, rechazadas o canceladas. | T006/T008/T009/T011/T026 | `donaciones/historial.test.js` (excluye pendientes, rechazadas y canceladas) | sí | Revisado por Nada · revisado (Javi) |
| FR-007 | Un donante MUST poder ver solo las aportaciones del Donante vinculado mediante la verificación … | T005/T008–T012/T018/T025 | `donaciones/historial.test.js` (dos cuentas; ni el correo coincidente ni el permiso invitado dan acceso) | sí | Revisado por Nada · revisado (Javi) |
| FR-008 | Sin vínculo verificado, la página del historial MUST mostrar una explicación y un enlace a /don… | T005/T006/T009/T011/T018/T019/T026/T027 | `donaciones/historial.test.js` (sin vínculo, vacío y año sin resultados); manual: textos y enlace a /donar/vincular (`validacion-interfaz-01.md`, T026) | sí | Revisado por Nada · revisado (Javi): la pantalla solo se comprueba a mano |
| SC-001 | La suma de los totales anuales coincide al céntimo con la suma de las aportaciones confirmadas … | T006/T011/T012/T014/T016/T028/T029 | `donaciones/historial.test.js` (suma de totales = suma en la base, al céntimo; cuadra con el certificado) | sí | Revisado por Nada · revisado (Javi) |
| SC-002 | Para un Donante con 60 cuotas mensuales confirmadas repartidas en cinco años, el tiempo desde q… | T003/T017/T021–T024/T029/T030 | Manual: 638,20 ms con 60 cuotas y 5 grupos (`refinamiento/cierre-t030-01.md`, T030) | sí | Revisado por Nada · revisado (Javi) |
| SC-003 | Ningún intento de ver el historial de otra persona tiene éxito. | T005/T011/T025 | `donaciones/historial.test.js` (sin sesión, otro rol, otra cuenta, permiso invitado); recorrido R3 | sí | Revisado por Nada · revisado (Javi) |

## spec-003 · HU-03 Certificado fiscal anual

**Responsable**: Rubén · **Revisor**: Nada · **PR**: #5

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST generar automáticamente, a partir del 1 de enero, un CertificadoFiscal del ejer… | T005, T007, T008, T021 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-002 | El total del certificado MUST ser la suma, al céntimo, de las aportaciones confirmadas con fech… | T004, T005, T008 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-003 | El certificado MUST incluir datos de la ONG (nombre, CIF), datos del donante (nombre, apellidos… | T002, T003, T010 | `certificados.test.js`, `textos.test.js` | — | Por revisar (Rubén) |
| FR-004 | El certificado MUST poder descargarse en PDF desde el área personal del donante. | T010, T011, T016 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-005 | El sistema MUST conservar y permitir descargar los certificados de ejercicios anteriores ya gen… | T013, T016 | ⚠ completar | — | Por revisar (Rubén) |
| FR-006 | El sistema MUST NOT ofrecer el certificado del ejercicio en curso. | T005, T010, T013, T014 | `certificados.test.js`, `textos.test.js` | — | Por revisar (Rubén) |
| FR-007 | Un donante MUST poder descargar solo sus propios certificados; la comprobación se hace en el se… | T010, T011, T013 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-008 | Si después de emitir el certificado de un ejercicio cerrado se confirma una aportación con fech… | T005, T008 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-009 | Al emitir o regenerar un certificado, el sistema MUST enviar al Donante un correo que avise de … | T002, T005, T008 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-010 | (Eliminado en la sesión 2026-11-08: HU-01 exige NIF/NIE, no puede existir un Donante sin él.) | ⚠ completar | ⚠ completar | — | Por revisar (Rubén) |
| FR-011 | El sistema MUST ofrecer una página pública, sin inicio de sesión, donde se introduce un código … | T018, T019, T020 | `certificados.test.js` | — | Por revisar (Rubén) |
| FR-012 | El certificado MUST generarse aunque el Donante no tenga cuenta de usuario vinculada. El acceso… | T010, T013, T016 | `certificados.test.js` | — | Por revisar (Rubén) |
| SC-001 | El total de cada certificado coincide al céntimo con el total del mismo año en el historial (HU… | T024 | ⚠ completar | sí | Por revisar (Rubén) |
| SC-002 | El 1 de enero, el 100 % de los donantes con aportaciones confirmadas del ejercicio anterior tie… | T008, T024 | `certificados.test.js` | sí | Por revisar (Rubén) |

## spec-004 · HU-04 Informes para la junta

**Responsable**: Rubén · **Revisor**: Nicole · **PR**: #8

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST permitir elegir un periodo (fecha de inicio y fin), un Proyecto opcional y una … | T005, T006, T008, T009 | ⚠ completar | — | Por revisar (Rubén) |
| FR-002 | El sistema MUST rechazar un periodo cuya fecha de fin sea anterior a la de inicio. El periodo i… | T005, T006, T007, T008 | ⚠ completar | — | Por revisar (Rubén) |
| FR-003 | El dinero recaudado MUST calcularse con las aportaciones confirmadas cuya fecha de cobro está d… | T004, T005, T007 | ⚠ completar | — | Por revisar (Rubén) |
| FR-004 | El voluntariado MUST calcularse con las asistencias registradas (con asistencia) de actividades… | T004, T005, T007, T019, T020 | `informes.test.js` | — | Por revisar (Rubén) |
| FR-005 | Sin filtro de proyecto, el informe MUST incluir una fila por proyecto, una de «fondo general» y… | T005, T007 | ⚠ completar | — | Por revisar (Rubén) |
| FR-006 | El informe MUST poder exportarse a CSV y a PDF con exactamente la misma información que la pant… | T011, T012, T013, T014 | `informes.test.js` | — | Por revisar (Rubén) |
| FR-007 | Un periodo sin datos MUST mostrar un informe vacío con un mensaje explicativo. Las filas de pro… | T002, T005, T007, T009, T011 | ⚠ completar | — | Por revisar (Rubén) |
| FR-008 | Solo los usuarios con rol administrador MUST poder acceder a los informes; la comprobación se h… | T006, T007, T012, T013 | `informes.test.js` | — | Por revisar (Rubén) |
| FR-009 | El informe y sus exportaciones MUST contener solo cifras agregadas: ningún nombre, correo, NIF/… | T004, T007, T011, T020 | `informes.test.js` | sí | Por revisar (Rubén) |
| SC-001 | Los totales del informe coinciden al céntimo (dinero) y a la décima de hora (voluntariado) con … | T007, T020 | `informes.test.js` | — | Por revisar (Rubén) |
| SC-002 | El administrador obtiene el informe anual exportado en menos de 1 minuto. | T021 (A2: también T017) | ⚠ completar | sí | Por revisar (Rubén) |
| SC-003 | Las exportaciones CSV y PDF coinciden al 100 % con la pantalla. | T011, T013 | `informes.test.js` | — | Por revisar (Rubén) |

## spec-005 · HU-05 Consulta e inscripción en actividades

**Responsable**: Javi · **Revisor**: Nicole · **PR**: #2

**Revisión cruzada (Nicole, 17/11/2026):** las tareas citadas existen y están cerradas en `tasks.md`; cada requisito se nombra en `voluntariado/servicio.test.js`, que pasa entero (34 pruebas). En la aplicación, por API con usuarios de prueba, se comprobaron FR-003, FR-004, FR-006 (concurrencia en la última plaza) y FR-008; FR-007 y FR-009 quedan cubiertos por el recorrido R2. Sin incidencias. La actividad de prueba se canceló después.

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST mostrar a cualquier persona las actividades publicadas cuya fecha de inicio es … | T009, T010, T011, T012 | `servicio.test.js` | — | Revisado por Javi y por Nicole |
| FR-002 | Cada actividad MUST mostrar título, descripción, fecha y horario de inicio y fin, lugar, proyec… | T009, T010, T011 | `servicio.test.js` | — | Revisado por Javi y por Nicole |
| FR-003 | El listado MUST poder filtrarse por proyecto y por fecha. | T009, T010, T011 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole: filtro por proyecto y fecha, y fecha imposible → 400 |
| FR-004 | Inscribirse MUST requerir estar identificado con el rol de voluntario y confirmar expresamente … | T013, T015, T016, T018, T019 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole: sin aceptar requisitos → 400 con el mensaje junto al campo |
| FR-005 | Si hay plazas libres, la Inscripción MUST quedar confirmada y las plazas libres MUST disminuir … | T013, T016 | `servicio.test.js` | — | Revisado por Javi y por Nicole |
| FR-006 | El número de inscripciones confirmadas MUST NOT superar las plazas de la actividad, ni siquiera… | T004, T013, T016 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole: dos inscripciones simultáneas a la última plaza → una 201 y otra 409, 1 confirmada en BD |
| FR-007 | Si no hay plazas libres, el sistema MUST ofrecer la lista de espera en lugar de la inscripción … | T013, T016, T018, T019 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole en el recorrido R2 (409 y lista de espera) |
| FR-008 | Un voluntario MUST NOT tener dos inscripciones activas (confirmada o en lista de espera) en la … | T013, T016 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole: segunda inscripción → 409 «Ya estás inscrito o en la lista de espera de esta actividad.» |
| FR-009 | Un voluntario MUST poder cancelar su inscripción, confirmada o en lista de espera, hasta el ini… | T006, T014, T017, T019 | `servicio.test.js` | — | Revisado por Javi y por Nicole; comprobado por Nicole en R2 (cancelar antes del inicio) y por API (actividad empezada → 409) |
| FR-010 | El sistema MUST permitir inscribirse en actividades cuyos horarios se solapan; no comprueba sol… | T013 | `servicio.test.js` | sí | Revisado por Javi y por Nicole |
| FR-011 | La primera vez que un voluntario se inscribe, MUST indicar su nombre, apellidos, correo y teléf… | T005, T013, T015, T018 | `servicio.test.js` | — | Revisado por Javi y por Nicole |
| SC-001 | Un voluntario encuentra una actividad y se inscribe en menos de 2 minutos. | T022 | Manual: 10 s cronometrados (17/11, `refinamiento/prueba-manual.md`) | sí | Revisado por Javi y por Nicole |
| SC-002 | En ninguna actividad hay más inscritos confirmados que plazas. | T013, T014 | `servicio.test.js` | sí | Revisado por Javi y por Nicole |

## spec-006 · HU-06 Calendario del voluntario

**Responsable**: Javi · **Revisor**: Nada · **PR**: #3

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST ofrecer al voluntario una vista de lista, que es la que se abre primero, y una … | T003, T006, T007, T008 | Manual: lista al abrir y vista *Mes* (`prueba-manual.md` 1.1 y 1.4; foco al cambiar de mes en `converge-2.md`, T015) | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| FR-002 | El calendario MUST incluir solo actividades que aún no han terminado en las que el voluntario t… | T002, T004, T005 | `calendario.test.js` | — | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| FR-003 | Las actividades en lista de espera MUST distinguirse visualmente y con la etiqueta «en lista de… | T004, T006, T007 | `calendario.test.js` (estado y posición en espera); manual: estilo y etiqueta (`prueba-manual.md` 1.3) | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| FR-004 | Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscrip… | T009, T010 | `calendario.test.js` (cancelar, 404 de otro y 409 en curso); manual: detalle (`prueba-manual.md` 2.1 y 2.2) | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| FR-005 | El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado sin que el volunta… | T009, T011 | `calendario.test.js` (2.2 y 2.3) y `vuelta.test.js`; manual: cambio de pestaña y de ventana (`revision-pr-3.md`, T026) | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| FR-006 | Un voluntario MUST poder ver solo su propio calendario; la comprobación se hace en el servidor … | T004, T005, T009 | `calendario.test.js` | — | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| SC-001 | El 100 % de las inscripciones activas del voluntario en actividades que aún no han terminado ap… | T004, T014 | `calendario.test.js` | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |
| SC-002 | El voluntario identifica su siguiente actividad en menos de 10 segundos desde que abre el calen… | T007, T014 | Manual: menos de 5 s (`revision-pr-3.md`, T026) | sí | Revisado por Javi y Nada; revisión técnica documentada en [revision-pr-3.md](../../specs/spec-006/refinamiento/revision-pr-3.md); PR #3 aprobado por Nada en GitHub (18/11/2026) |

## spec-007 · HU-07 Gestión de actividades y lista de espera

**Responsable**: Nicole · **Revisor**: Javi · **PR**: #1

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El coordinador MUST poder crear, editar, publicar y cancelar actividades. | T009–T020 | `servicio.test.js` (crear, publicar, editar, cancelar); prueba manual T026 | — | Revisado por Nicole y por Javi |
| FR-002 | Cada Actividad MUST tener título, descripción, Proyecto, fecha y hora de inicio y fin, lugar, p… | T001, T015, T017 | `servicio.test.js` | — | Revisado por Nicole y por Javi |
| FR-003 | Al crear, editar y publicar, el sistema MUST validar que el fin es posterior al inicio, que el … | T006, T009, T011, T012 | `actividades/servicio.test.js` (crear y publicar: fin, inicio pasado, proyecto inactivo); manual T026 punto 5 | — | Revisado por Nicole y por Javi; parcial: validar al editar no tiene prueba propia |
| FR-004 | Los estados de una Actividad MUST ser borrador, publicada o cancelada; solo las publicadas son … | T001, T012, T013 | `actividades/servicio.test.js` (borrador → publicada, cancelar) y `voluntariado/servicio.test.js` (solo las publicadas son visibles); manual T026 puntos 2 y 6 | — | Revisado por Nicole y por Javi |
| FR-005 | Cuando una actividad publicada está completa, las nuevas solicitudes MUST entrar en una lista d… | spec-005 T013, T016 | `voluntariado/servicio.test.js` (completa → en espera, posiciones 1 y 2); recorrido R2 | — | Revisado por Nicole y por Javi |
| FR-006 | Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confir… | T021, T022, T023 | `actividades/servicio.test.js` (subir plazas) y `voluntariado/servicio.test.js` (cancelar con espera, un único correo; subir plazas con inscripciones reales); recorrido R2 | — | Revisado por Nicole y por Javi |
| FR-007 | El sistema MUST NOT permitir reducir las plazas por debajo del número de inscritos confirmados. | T008, T011 | `actividades/servicio.test.js` (409 al bajar plazas) y `voluntariado/servicio.test.js` (bajar plazas a la vez que una inscripción) | — | Revisado por Nicole y por Javi |
| FR-008 | Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera y MUST dejar de… | T013, T026 | `actividades/servicio.test.js` (cancelar avisa a cada afectado) y `voluntariado/servicio.test.js` (inscripciones canceladas; deja de estar disponible) | sí | Revisado por Nicole y por Javi |
| FR-009 | El coordinador MUST poder consultar, en cada actividad, los inscritos confirmados y la lista de… | T014, T019 | `actividades/servicio.test.js` y `voluntariado/servicio.test.js` (confirmados y espera con posición) | — | Revisado por Nicole y por Javi |
| FR-010 | Solo los usuarios con rol coordinador MUST poder gestionar actividades; cualquier coordinador p… | T007, T008 | `actividades/servicio.test.js` (401 sin sesión y 403 como voluntario en las 5 rutas) | — | Revisado por Nicole y por Javi; parcial: no se prueba con un segundo coordinador |
| FR-011 | Una actividad publicada MUST poder editarse en todos sus campos (con las validaciones de FR-003… | T011, T019, T024 | `actividades/servicio.test.js` (cambiar el lugar avisa; la descripción no; cancelada o celebrada no se edita) | sí | Revisado por Nicole y por Javi; parcial: el aviso por cambio de fecha u hora no tiene prueba |
| SC-001 | Un coordinador crea y publica una actividad en menos de 3 minutos. | T026 | Manual: 1 min 30 s (`refinamiento/prueba-manual-T026.md`) | sí | Revisado por Nicole y por Javi |
| SC-002 | El 100 % de las plazas liberadas se asignan a la lista de espera sin intervención manual. | T021; spec-005 T014 | `voluntariado/servicio.test.js` (cancelar con espera, subir plazas, orden de llegada); recorrido R2 | sí | Revisado por Nicole y por Javi |
| SC-003 | En ninguna actividad hay más inscritos confirmados que plazas. | T021; spec-005 T014 | `voluntariado/servicio.test.js` (bajar plazas e inscribirse a la vez, 5 vueltas) | sí | Revisado por Nicole y por Javi |

## spec-008 · HU-08 Asistencia y horas de voluntariado

**Responsable**: Nicole · **Revisor**: Rubén · **PR**: #7

| Requisito | Descripción | Tareas | Prueba (automática o manual) | Quickstart | Estado |
|---|---|---|---|---|---|
| FR-001 | El sistema MUST permitir registrar asistencia solo en actividades publicadas (no canceladas) cu… | T004, T005, T007, T010 | `asistencias.test.js` | sí | Revisado por Nicole; falta revisor (Rubén) |
| FR-002 | El coordinador MUST poder marcar cada inscrito confirmado como «asistió» o «no asistió», y corr… | T006–T012 | `asistencias.test.js` («horas»: repetir y corregir); quickstart 1.2–1.4 | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-003 | Las horas de una actividad MUST ser la diferencia entre su fin y su inicio; en v1 no hay asiste… | T003, T005, T006, T007 | `asistencias.test.js` | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-004 | Marcar «asistió» MUST sumar las horas al total del voluntario; cambiar a «no asistió» MUST rest… | T003, T005, T014 | `asistencias.test.js` | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-005 | Una misma asistencia MUST NOT sumar horas más de una vez. | T001, T003, T005 | `asistencias.test.js` | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-006 | El sistema MUST NOT permitir registrar asistencia de una persona sin inscripción confirmada en … | T005, T007 | `asistencias.test.js` | sí | Revisado por Nicole; falta revisor (Rubén) |
| FR-007 | El voluntario MUST ver en su perfil (la página /mis-horas) su total de horas y el desglose por … | T013–T019 | `asistencias.test.js` | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-008 | Solo los usuarios con rol coordinador MUST poder registrar o corregir asistencias, y cualquiera… | T005, T009, T010, T013, T017 | `asistencias.test.js` | — | Revisado por Nicole; falta revisor (Rubén) |
| FR-009 | Desde la hora de inicio de la actividad, una Inscripción confirmada MUST NOT poder cancelarse (… | T022 (solo verificación; el código ya existe en spec-005) | `voluntariado/servicio.test.js` (spec-005 FR-009); comprobado por API (prueba manual T026 de spec-007, punto 8) | sí | Revisado por Nicole; falta revisor (Rubén) |
| SC-001 | El total de horas del perfil coincide siempre con la suma de sus asistencias marcadas como «asi… | T013, T014, T022 | `asistencias.test.js` | sí | Revisado por Nicole; falta revisor (Rubén) |
| SC-002 | El coordinador registra la asistencia de una actividad de 20 personas en menos de 2 minutos. | T010, T022 | Manual: 40 s con 20 confirmados (quickstart, T022) | sí | Revisado por Nicole; falta revisor (Rubén) |

## Recorridos completos entre historias (enunciado §5.4)

Propuesta: al menos un recorrido satisfactorio y otro con error, permiso o estado, que conecten
historias de distintas personas. Rellenar al ejecutarlos.

| # | Recorrido | Historias | Precondiciones y datos | Pasos | Resultado esperado | Resultado observado | Versión |
|---|---|---|---|---|---|---|---|
| R1 | Satisfactorio: de la actividad a las horas y al informe | HU-07 → HU-05 → HU-06 → HU-08 → HU-04 | `npm run semillas`; coordinador@, voluntario2@ (0 h al empezar), admin@. Reloj simulado (`AHORA_SIMULADO=2026-11-18T12:30:00+01:00`) para el paso 4 | 1) Coordinador crea y publica «R1 Limpieza del parque» (Comedor social, 18/11/2026 10:00–12:00, 5 plazas); 2) voluntario2 se inscribe; 3) la ve en Mi calendario; 4) con la actividad ya celebrada, el coordinador marca «asistió» y guarda; 5) voluntario2 abre Mis horas; 6) admin saca el informe del 01/11 al 30/11 | Plazas 4 de 5 tras inscribirse; aparece en el calendario el 18/11; 2 h en Mis horas; el informe suma esas 2 h en Comedor social | ✅ 17/11/2026 (Nicole, en la aplicación): todo como se esperaba. Plazas 4/5; calendario el 18/11; asistencia guardada (2,00 h); Mis horas: total 2 h con el desglose de R1; informe de noviembre (comprobado en pantalla como admin@): Comedor social 3 actividades, 2 voluntarios, 4,00 h (2 h de R1 + 2 h de «Banco de alimentos» de las semillas) y fila de totales igual. Incidencia: la primera vez no se guardó la asistencia porque la página estaba abierta antes de mover el reloj; al recargar apareció «Registrar asistencia» | `main` `470b1e1` |
| R2 | Estado: lista de espera y plaza liberada | HU-07 → HU-05 | `npm run semillas`; coordinador@, voluntario2@ y voluntario3@; Mailpit vacío al empezar | 1) El coordinador crea y publica «R2 Reparto de mantas» (Comedor social, 20/11/2026 17:00–19:00, 1 plaza); 2) voluntario2 se inscribe; 3) voluntario3 intenta inscribirse y después pide la lista de espera; 4) voluntario2 cancela antes del inicio; 5) el coordinador consulta inscritos y espera; 6) se revisa Mailpit | 3) Sin plazas: se rechaza y ofrece la lista de espera; voluntario3 queda 1.º en espera. 4–5) voluntario3 pasa a confirmado y la espera queda vacía; las plazas libres siguen en 0. 6) Un único correo «Plaza confirmada» a voluntario3 | ✅ 17/11/2026 (realizado por API con los usuarios de prueba, no en el navegador): 3) 409 `PLAZAS_AGOTADAS` «Ya no quedan plazas libres en esta actividad. Puedes apuntarte a la lista de espera.», luego `en_espera`, posición 1; 4) 200 `cancelada`; 5) confirmadas: voluntario3, espera vacía, 0 de 1 plazas libres; 6) un correo a voluntario3, asunto «Plaza confirmada: «R2 Reparto de mantas»», con fecha, horario y lugar correctos | `main` `470b1e1` |
| R3 | Permiso: datos ajenos | HU-02 → HU-03 | `npm run semillas`: donante2@ vinculado a su Donante (6 aportaciones confirmadas, certificado 2025); donante@ sin vincular aunque su correo coincide con otro Donante; voluntario@ sin rol donante | 1) donante2 consulta historial, certificados y el PDF de 2025; 2) donante@ consulta lo mismo; 3) donante@ pide el PDF de 2025 y prueba a pasar `usuarioId`/`donanteId` de otro; 4) voluntario@ y una petición sin sesión piden el historial; 5) verificación pública del código del certificado | Cada cuenta ve solo lo suyo; la no vinculada, vacío; lo ajeno no se revela; sin rol, 403; sin sesión, 401 | ✅ 17/11/2026 (por API con los usuarios de prueba): 1) donante2: 2026 = 145,00 € (5) y 2025 = 60,00 € (1); certificado 2025 por 60,00 €, cuadra con el historial; PDF 200 con CIF, NIF, ejercicio, total y código; 2) donante@: `vinculado:false`, sin años ni certificados; 3) PDF de 2025 → 404 `CERTIFICADO_NO_DISPONIBLE`; parámetros de otro usuario → 400 `DATOS_INVALIDOS`, sin datos; 4) voluntario@ → 403 `SIN_PERMISO`; sin sesión → 401 `NO_IDENTIFICADO`; 5) código válido → `valido:true` con el NIF enmascarado; código inventado → `valido:false`. Páginas `/mis-aportaciones` y `/mis-certificados` cargan (200); su contenido no se revisó en el navegador | `main` `470b1e1` |
| R4 | Satisfactorio con pago: donación a certificado | HU-01 → HU-02 → HU-03 | Cuenta propia de Stripe en modo de prueba (claves solo en `.env`), Stripe CLI 1.55.11 con listener reenviando a la API (secreto comprobado: coincide con `.env`); donante2@ vinculado, 145,00 € en 2026 antes de empezar | 1) donante2 dona 20 € puntual a Comedor social desde `/donar`; 2) paga en Stripe Checkout (entorno de prueba) con la tarjeta 4242 4242 4242 4242; 3) consulta `/mis-aportaciones`; 4) con el reloj simulado en 01/01/2027 se ejecuta `npm run certificados -- --ejercicio 2026`; 5) consulta `/mis-certificados` | Donación confirmada por la notificación de Stripe; aparece en el historial; el certificado de 2026 suma esa donación | ✅ 17/11/2026 (Nicole, en su ordenador con su cuenta de pruebas): 2) «¡Gracias! Tu donación está confirmada», 20,00 €, Comedor social, y correo de resumen aceptado; 3) historial: nueva fila del 17/11/2026 y total de 2026 de 145,00 € a 165,00 €; 4) «Ejercicio 2026: 2 emitidos»; 5) certificado 2026 de 165,00 € con código de verificación, igual al total del historial. Después se devolvió el reloj a la hora real | `main` `470b1e1` |

## Registro mínimo (enunciado §5.4)

| Historia y criterio | Hallazgo o decisión | Comando | Documentos o código afectados | Tarea y commit | Prueba y resultado | Responsable | Revisor | Estado |
|---|---|---|---|---|---|---|---|---|
| HU-07 FR-006 | Promoción al cancelar un voluntario acordada con spec-005 | analyze-1 (H1) | spec, plan, tasks, contrato | T023 · `ff7a202` | Cancelación real: entra la primera en espera y llega el correo | Nicole | Javi | Cerrado |
| HU-07 FR-003 | Motivo concreto al fallar «Publicar» | converge-1 (F1) | `DetalleActividad.jsx` | T027 · `4d923cf` | Proyecto inactivo → «El proyecto no está activo.» | Nicole | Javi | Cerrado |
| HU-08 modelo de datos | `asistencias` sin `creado_en`/`actualizado_en` | converge-1 (F1) | `007_asistencias.sql`, modelo-datos | T023 · `7d050e7` | Columnas presentes; 111 pruebas | Nicole | Rubén | Cerrado |
| HU-08 SC-002 | 20 personas en < 2 min | quickstart | — | T022 · `1180fac` | 40 s | Nicole | Rubén | Cerrado |
| HU-05 FR-009 | Orden de bloqueo al cancelar con lista de espera: leer, `bloquearActividad` y volver a leer | analyze-1 (S1) | plan, tasks, `voluntariado/servicio.js` | T017 · `c7f701f`, `55ba4c6` | Pruebas de concurrencia de `servicio.test.js` (última plaza y bajar plazas a la vez) | Javi | Nicole | Cerrado |
| HU-05 FR-002 | La tarjeta seguía diciendo «1 plaza libre» tras un 409 `PLAZAS_AGOTADAS` | prueba manual (2.8) | `TarjetaActividad.jsx`, `ActividadesDisponibles.jsx` | T027 · `8b027c5` | Al cerrar la ventana el listado se recarga | Javi | Nicole | Cerrado |
| HU-06 FR-001 | El foco se perdía al cambiar de mes en la vista mensual | converge-1 (F1) | `CalendarioVoluntario.jsx`, `MesCalendario.jsx` | T015 · `aa6788b` | El foco sigue en «‹»/«›» y se anuncia el mes (`converge-2.md`) | Javi | Nada | Cerrado |
| HU-06 FR-005 | No recargaba al volver justo después de otra carga | revisión del PR #3 | `CalendarioVoluntario.jsx`, `vuelta.js` | T025 · `80878c2` | `vuelta.test.js` y cambio real de pestaña y de ventana (T026) | Javi | Nada | Cerrado |
| HU-06 SC-002 | Cronometrar con una persona | quickstart | — | T026 · `67c7bd1` | Menos de 5 s (< 10 s) | Javi | Nada | Cerrado |
| … | (cada responsable añade sus filas) | | | | | | | |


## Observaciones del revisor (Javi, 17/11/2026) sobre HU-02 y HU-07

- **HU-07**: en `actividades/servicio.test.js` siguen tres `it.skip` «requiere spec-005» (SC-002, US2
  escenario 4 y SC-003). Lo cubren las pruebas con inscripciones reales de `voluntariado/servicio.test.js`,
  así que en la matriz se citan esas. Se pueden borrar o dejar con un comentario que lo diga.
- **HU-07**: las pruebas de `actividades/servicio.test.js` simulan las inscripciones; por eso en cada
  fila se indica el módulo. Probados solo en parte: FR-003 (validar al editar), FR-010 (otro
  coordinador) y FR-011 (aviso por cambio de fecha u hora). El código lo hace, pero no hay prueba.
- **HU-07**: `prueba-manual-T026.md`, punto 4, anota un 400 para `PLAZAS_MENOR_QUE_INSCRITOS`; el
  código y las pruebas dan 409.
- **HU-02**: FR-008 se prueba en la API; los textos de la pantalla y el enlace a /donar/vincular solo a
  mano (T026). `validacion-interfaz-01.md` aún dice que SC-002 está pendiente; lo supera
  `cierre-t030-01.md`.
