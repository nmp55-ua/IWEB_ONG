# Matriz vigente de validación y balance T079–T080 — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha**: 2026-11-07 · **Rama**: spec-001 · **Base de preparación**: 076e439 · **Base del cierre documental**: a7dda2b

**Responsable**: Nada · **Revisor**: Rubén.

**Estado**: G1–G3 comprobadas localmente, con API, PostgreSQL aislado e interfaz.
T079 y T080 completadas tras contrastar la segunda medición, los 34 escenarios y
SC-001–SC-004. Se comunica 61 s; Se acredita 7/7 correos en el conjunto 30–36.
La medición 1 de 480,836 s conserva su resultado fallido. El primer converge detectó
CONV-001/CONV-002, corregidos y verificados en T082–T083; CONV-003 se cerró con T084. [converge-3.md](converge-3.md) acredita el cierre técnico. Revisión/aprobación e integración siguen separadas de ese cierre.
Se conservan los cambios documentales previos, .env, los históricos.
La preparación inicial no ejecutó pruebas; los resultados posteriores se atribuyen a
sus fuentes y se añaden sin presentar simulaciones como integración real.

## Alcance, fuentes y lectura de la matriz

Esta es la matriz única vigente de evidencia para los 34 escenarios. Las matrices de
tasks.md y los informes de etapas anteriores se conservan como evidencia histórica y
fuentes, no como otro balance actual. P01–P21 son los escenarios numerados de User Story 1
y S01–S13 los de User Story 2 de [spec.md](../spec.md); la correspondencia FR procede de
[quickstart.md](../quickstart.md). No se modifica ningún criterio.

**A** identifica pruebas automatizadas existentes; **M**, recorridos manuales locales;
**R**, integración observada con Stripe en modo de pruebas. A incluye PostgreSQL real de
pruebas cuando así consta, pero pasarela y SMTP simulados. No demuestra recepción real
del correo ni una factura de Stripe. Los estados Cubierto indican el alcance de evidencia
descrito, no que todo el escenario se haya ejecutado con Stripe o en navegador.

Se revisaron el contenido y las aserciones relevantes de las pruebas, además de los
informes de ejecución. La última regresión de donaciones registrada es 367/367; Se comunicó su repetición. G1–G3 añade después una ejecución dirigida de 17/17,
sin repetir esa suite completa; no se toma el número de pruebas como
demostración suficiente de cada escenario. Los pendientes antiguos de T053 se contrastan
con las evidencias posteriores; por ejemplo, P02 y P21 ya tienen evidencia real.

| Fuente | Archivo o informe                                                                                               | Evidencia identificable                                                                                                                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1     | [normalizacion.test.js](../../../backend/src/modulos/donaciones/normalizacion.test.js)                          | Grupos de importes FR-002/P03, NIF/NIE FR-004/P04 y equivalencias de datos FR-015/P17                                                                                                        |
| A2     | [servicio.test.js](../../../backend/src/modulos/donaciones/servicio.test.js)                                    | Reutilización sin sobrescritura, conflicto previo a Stripe, altas por periodicidad y S07/S08                                                                                                 |
| A3     | [rutas.test.js](../../../backend/src/modulos/donaciones/rutas.test.js)                                          | Contexto/creación privada, resultado y correo, solicitud/confirmación de vínculo, S04/S05 y permisos de ciclos S06                                                                           |
| A4     | [eventos.test.js](../../../backend/src/modulos/donaciones/eventos.test.js)                                      | Confirmación única, rechazo→éxito, cancelación y expiración canónicas, reentregas y rollback                                                                                                 |
| A5     | [autorizacion.test.js](../../../backend/src/modulos/donaciones/autorizacion.test.js)                            | Permiso absoluto por operación, sesiones A/B, caducidad y propiedad con vínculo                                                                                                              |
| A6     | [confirmaciones.test.js](../../../backend/src/modulos/donaciones/confirmaciones.test.js)                        | Envío true/false, dos fallos conservando resumen, reserva y protección de intento antiguo                                                                                                    |
| A7     | [cuotas.test.js](../../../backend/src/modulos/donaciones/cuotas.test.js)                                        | Casos nominales S01/S09 y pruebas nombradas S02, S03, S10, S11, S12, S13; desorden y previsión                                                                                               |
| A8     | [textoCorreo.test.js](../../../backend/src/modulos/donaciones/textoCorreo.test.js)                              | Contenido de confirmación puntual, cuota y fallo; fechas, importes y periodicidad                                                                                                            |
| A9     | [pasarela.test.js](../../../backend/src/modulos/donaciones/pasarela.test.js)                                    | Constructor y proyecciones acacia, firma sintética, card/EUR y recurrencias; sin red real                                                                                                    |
| M1     | [validacion-local-01.md](validacion-local-01.md), «Frontend de donación puntual, vínculo y semillas», T045–T053 | Acceso público, 0,99/campos vacíos, UUID estable, resultados propios/ajenos, vínculo y reintento recibido en Mailpit                                                                         |
| M2     | [validacion-local-01.md](validacion-local-01.md), «Alta y cuotas de socio», T054–T072                           | Formulario de socio, alta sin pasarela configurada y presentación de cuotas sintéticas, rechazo, previsión desconocida y cancelación                                                         |
| R1     | [validacion-stripe-01.md](validacion-stripe-01.md), operación 30, T077                                          | 15,75 €, Agua potable, Checkout y eventos originales, correo abierto durante la prueba, retorno automático, permiso invitado original y posterior vínculo                                             |
| R2     | Mismo informe, «Cierre final de T077», operación 31                                                             | P21 adicional de 1,23 €: estado local pendiente, páginas cerradas, primera confirmación y reentrega sin duplicados                                                                           |
| R3     | Mismo informe, «Bloque real de socios», operaciones de alta de aportaciones 32–34, T078                         | Tres periodicidades, primeras facturas, correos en Mailpit, reentregas y cancelación anual tras alta satisfactoria                                                                           |
| A10    | [validacion-local.test.js](../../../backend/src/modulos/donaciones/validacion-local.test.js)                    | Seis pruebas G1–G3 con PostgreSQL aislado: cancel_url, recuperación, tres cambios de identidad, segundo fallo HTTP y socio activo                                                            |
| M3     | [validacion-local-g1-g3-01.md](validacion-local-g1-g3-01.md) y sus capturas/balance                             | Navegador de pruebas sobre Astro y backend reales del banco aislado; Stripe y SMTP simulados; sin cambios financieros ni del Donante                                                          |
| R4     | [medicion-puntual-01.md](medicion-puntual-01.md), aportación 35; ejecución del registro previo                             | Puntual de 20 €, confirmada y correo recibido; 480,836 s, no cumple SC-001. Conjunto delimitado 30–35: 6/6 recibidos por referencia                                                          |
| R5     | [medicion-puntual-02.md](medicion-puntual-02.md), aportación 36 y cierre T079–T080                              | Medición con cronómetro de 61 s hasta confirmación; sin t0/t1 ni captura disponibles. Registro de comprobación: pago, importe, unicidad y recepción; conjunto 30–36, 7/7                                                |
| A11    | [validacion-converge-01.md](validacion-converge-01.md), confirmaciones/rutas/cuotas/textoCorreo y eventos       | Cuatro regresiones iniciales fallidas; 83/83 y 21/21 posteriores en ejecuciones separadas. Carrera terminal y contexto histórico corregidos, solo PostgreSQL aislado/Stripe y SMTP simulados |

Los importes de ejemplo 20 € o 10 €/mes no obligan por sí solos a repetir pagos ya
acreditados con otros importes válidos. La ejecución cronometrada R4 usa 20 € y
complementa P01/P06; su duración fallida no se presenta como SC-001 satisfecho.
R5 añade otra puntual independiente de 20 €, con 61 s medidos con cronómetro; los dos
resultados se conservan sin reconstruir cronómetros ni descontar esperas.

## Matriz única de escenarios

La última columna remite a comprobaciones adicionales agrupadas al final. Un guion significa
que no se exige otra prueba para el alcance funcional descrito; una ausencia de Stripe se
conserva como limitación, sin convertirla automáticamente en un pago pendiente.

| Caso | Criterio y fuente normativa                                                                          | Evidencia existente                                                                                                                                                                                                                     | Resultado y límites                                                                                                                                                                                                                                                                                               | Adicional exigida identificada                                                             |
| ---- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| P01  | US1.1; FR-001/002/005–007: confirmación puntual con importe, fecha, modalidad, fondo y referencia    | A3 creación/resultado; A4 «confirma una vez…»; A8 resumen; R2 y resultado de Nada; R4 puntual de 20 €; R5 puntual 36 de 20 €                                                                                                            | Cubierto A/M/R. R4 conserva 480,836 s, no cumple SC-001; R5 registra 61 s medidos con cronómetro hasta confirmación, sin t0/t1 ni captura disponibles.                                                                                                                                                               | —; T079 cerrada con R5, sin garantía universal de duración                                 |
| P02  | US1.2; FR-003/007: destino elegido en aportación y confirmación                                      | A2 proyecto activo; A8 destino; R1, 15,75 € a Agua potable y correo comprobado durante la prueba                                                                                                                                                 | Cubierto. El pendiente de proyecto de T053 fue resuelto por R1                                                                                                                                                                                                                                                    | —                                                                                          |
| P03  | US1.3; FR-002: importe inválido no avanza y error junto al campo                                     | A1 importes; A2 límites de socio; A3 validación; M1 0,99/campos vacíos sin petición                                                                                                                                                     | Cubierto por validación automatizada y muestra visible local; incluye rango, coma/punto y rechazo sin redondeo. No hace falta cobrar los extremos en Stripe                                                                                                                                                       | —                                                                                          |
| P04  | US1.4; FR-004: NIF/NIE inválido y aviso de campo                                                     | A1 grupos de NIF/NIE y datos; M1 validaciones visibles del formulario                                                                                                                                                                   | Cubierto en A para formato/letra y campos de error; M local de validaciones. No se declara recorrido Stripe con NIF inválido, que debe detenerse antes                                                                                                                                                            | —                                                                                          |
| P05  | US1.5; FR-006: rechazo/cancelación sin confirmada, motivo y reintento                                | A4 estados; A2 recuperación; A10 y M3 rechazo/cancel_url/recuperación                                                                                                                                                                   | Cubierto localmente: motivo y reintento visibles, retorno pendiente inalterado y recuperación de la misma referencia/URL sin otra llamada Checkout. Sin nuevo pago Stripe.                                                                                                                                        | —                                                                                          |
| P06  | US1.6; FR-007: correo recibido con datos de la confirmación                                          | A8 contenido; M1 correo local de reintento; R1 correo abierto y comparación de importe/destino/referencia; R2/R3 recepción por Mailpit; R4 texto del mensaje contrastado en el registro de ejecución; R5 texto del mensaje 36 y nueva búsqueda conjunta | Cubierto en el conjunto delimitado 30–36: 7/7 recibidos por referencia según el registro de ejecución. No es auditoría global ni apertura visual de todos los mensajes.                                                                                                                                                            | —; recepción contrastada separadamente del cronómetro                                      |
| P07  | US1.7; FR-011: donación sin cuenta                                                                   | A3 agente invitado; M1 formulario público; R1 permiso invitado original anterior a la creación de cuenta                                                                                                                                | Cubierto. No se confunde R2, consultada con cuenta vinculada, con una nueva prueba invitada                                                                                                                                                                                                                       | —                                                                                          |
| P08  | US1.8; FR-007/012: fallo de correo conserva cobro y muestra aviso/reintento                          | A3/A4 fallo SMTP; M1 reintento; A10/M3 confirmada con correo fallido                                                                                                                                                                    | Cubierto localmente: resumen, aviso y reintento visibles; confirmación y pago persistidos. SMTP simulado no acredita recepción.                                                                                                                                                                                   | —                                                                                          |
| P09  | US1.9; FR-012: reintento satisfactorio del mismo resumen, sin cobro ni duplicado                     | A3 resultado/correo; A6 resumen; M1 reintento con mensaje en Mailpit y aportación conservada; A11 correcciones posteriores al primer converge                                                                                           | Cubierto en A y M. M usa una aportación sintética, no un segundo pago Stripe CONV-001 reproducida y corregida: la carrera terminal devuelve enviado, con reserva viva 409, sin SMTP o dinero duplicados.                                                                                                          | —                                                                                          |
| P10  | US1.10; FR-012: segundo fallo mantiene aviso, permite repetir y no afirma éxito                      | A6 fallo repetido; A10 segundo fallo por HTTP; M3 botón y aviso tras pulsarlo                                                                                                                                                           | Cubierto localmente: segundo intento fallido persistido, aviso y botón conservados, sin éxito falso ni nuevas aportaciones/operaciones o llamadas Checkout.                                                                                                                                                       | —                                                                                          |
| P11  | US1.11; FR-011/013: entradas visibles, solicitud sin vínculo por coincidencia de correo              | A3/M1/R1 solicitud y verificación; M3 navegación desde formulario y resultado                                                                                                                                                           | Cubierto: ambas entradas visibles llegan a /donar/vincular sin token. Navegación con cero solicitudes de enlace; no se repite el circuito de verificación ya acreditado.                                                                                                                                          | —                                                                                          |
| P12  | US1.12; FR-013: solicitud→correo→confirmación expresa y vínculo                                      | A3 y A2 tokens/cuenta/uso único; M1 fragmento/POST/reuso; R1 vínculo y acceso posterior de Nada                                                                                                                                         | Cubierto A/M/R. Otra cuenta y vencimiento se acreditan en A; no se exige volver a esperar o consumir enlaces en Stripe                                                                                                                                                                                            | —                                                                                          |
| P13  | US1.13; FR-014: correo con otro NIF se detiene sin exponer o mezclar                                 | A2 «reutiliza formatos…», carreras de identidad; T074 datos/errores                                                                                                                                                                     | Cubierto en backend/PG con red simulada y error genérico; no se presenta como intento de cobro real                                                                                                                                                                                                               | —                                                                                          |
| P14  | US1.14; FR-015: otra aportación reutiliza el Donante sin actualizarlo                                | A2 reutilización y altas concurrentes, comparación de fila completa                                                                                                                                                                     | Cubierto A: nuevas operaciones con mismo Donante e inmutabilidad comprobadas. No basta el recuento agregado de donantes para atribuir reutilización real                                                                                                                                                          | —                                                                                          |
| P15  | US1.15; FR-015: mismo NIF con otro correo se rechaza                                                 | A2 «reutiliza formatos…», cambio de correo, sin nueva llamada a Stripe                                                                                                                                                                  | Cubierto A. Es un control anterior al pago; no requiere integración Stripe para demostrar el rechazo                                                                                                                                                                                                              | —                                                                                          |
| P16  | US1.16; FR-015: cambios de nombre/apellidos/dirección se rechazan incluso con cuenta vinculada       | A1/A2 equivalencias/inmutabilidad; A10 y M3 cuenta vinculada, tres campos                                                                                                                                                               | Cubierto localmente: nombre, apellidos y dirección se rechazan individualmente con 409 y aviso genérico; Donante y operaciones conservados, sin otra llamada Checkout.                                                                                                                                            | —                                                                                          |
| P17  | US1.17; FR-015: equivalencias de formato no alteran datos                                            | A1 equivalencias NFC/espacios/mayúsculas y diferencias reales; A2 fila idéntica tras reutilizar                                                                                                                                         | Cubierto A en normalización y persistencia; preserva tildes, puntuación y correo. No requiere otro pago de prueba                                                                                                                                                                                                 | —                                                                                          |
| P18  | US1.18; FR-012/016: invitado accede solo a su operación y reintenta con permiso                      | A3 agente invitado y correo; A5 permiso/propiedad; M1 propios/ajenos y reintento                                                                                                                                                        | Cubierto A y M complementarios; el reintento M de fixture no se presenta como pago invitado real                                                                                                                                                                                                                  | —                                                                                          |
| P19  | US1.19; FR-016: referencia sin permiso no autoriza ni recupera datos                                 | A5 cookie/correo/UUID/caducidad; A3 404 uniforme; M1 ajena; R1 denegación en otro navegador                                                                                                                                             | Cubierto A/M/R. Caducidad exacta de ocho horas se demuestra en A, no en una espera real                                                                                                                                                                                                                           | —                                                                                          |
| P20  | US1.20; FR-016: sesión A no ve/reintenta B ni obtiene historial                                      | A5 sesiones A/B, referencias y cuotas posteriores; A3/A5 denegaciones; M1 propios/ajenos                                                                                                                                                | Cubierto A/M para separación por operación. No implica implementación de HU-02                                                                                                                                                                                                                                    | —                                                                                          |
| P21  | US1.21; FR-010/017: primera confirmación posterior al cierre sin sesión necesaria                    | A3 webhook sin cookie; A4 idempotencia; R2 primera transición y segunda entrega                                                                                                                                                         | Cubierto real en T077. Se cerraron páginas de la aplicación e integrado; no todos los procesos Firefox. R1 solo aportaba reentrega y no se usa como primera transición                                                                                                                                            | —; no repetir P21                                                                          |
| S01  | US2.1; FR-001/008: primer cobro, periodicidad y próxima cuota                                        | A2 tres recurrencias; A7 «S01/S09…»; A8; M2 presentación; R3 altas 32–34                                                                                                                                                                | Cubierto A/M/R con 1,11/1,22/1,33 €, fechas y tres periodicidades. Anual posteriormente cancelada: no sobrescribir la previsión inicial histórica                                                                                                                                                                 | —                                                                                          |
| S02  | US2.2; FR-009/010: ciclo posterior crea nueva cuota confirmada una vez                               | A7 «S02: una factura de ciclo…», desorden y recuperación inicial; A3 S06 ciclo                                                                                                                                                          | Cubierto A con PostgreSQL y recursos canónicos simulados. No hay renovación real ni factura subscription_cycle real de este bloque                                                                                                                                                                                | — para el balance; prueba real de ciclo solo si se decide ampliar integración, no fingirla |
| S03  | US2.3; FR-006/008: primer fallo sin alta activa ni confirmada                                        | A7 «S03: el primer cobro fallido…» y cierre definitivo                                                                                                                                                                                  | Cubierto A; las tres altas R3 fueron satisfactorias. El escenario no exige por sí solo ejecutar un rechazo real de tarjeta                                                                                                                                                                                        | —; mantener límite de simulación                                                           |
| S04  | US2.4; FR-011: alta sin cuenta y confirmación                                                        | A2 altas sin cuenta; A3 «S04/S05…» sin usuario, primera factura y respuesta; M1 acceso público/M2 formulario                                                                                                                            | Cubierto por integración HTTP local y forma visible compartida; no consta alta Stripe real sin cuenta. No se infiere de R3 ni se exige repetir esas altas                                                                                                                                                         | —; conservar explícito el alcance local                                                    |
| S05  | US2.5; FR-007/008/012: fallo de correo mantiene alta activa, resumen, periodicidad/previsión y aviso | A3 alta con SMTP fallido; A10/M3 resumen de cuota y suscripción                                                                                                                                                                         | Cubierto localmente: cuota confirmada, socio activo, periodicidad mensual y previsión visibles junto al aviso y reintento. No es otro fallo real de Stripe/SMTP.                                                                                                                                                  | —                                                                                          |
| S06  | US2.6; FR-012/016: reintento de cuota solo reenvía y permiso inicial no autoriza ciclos              | A3 «S06…» exige propietario, deniega invitado del alta y conserva recuentos; M1 botón común y correo recibido; A11 correcciones posteriores al primer converge                                                                          | Cubierto A para cuotas y permisos; M del componente de reintento, sin atribuir una cuota automática real. El fallo repetido visible queda acreditado en G3/P10, sin cobrar otra cuota CONV-001 reproducida y corregida: la carrera terminal devuelve enviado, con reserva viva 409, sin SMTP o dinero duplicados. | — adicional específica; no repetir la separación de permisos ya probada                    |
| S07  | US2.7; FR-014: conflicto de correo/NIF antes de alta                                                 | A2 «S07/S08…» comprueba cero suscripciones/aportaciones nuevas y Stripe sin llamadas                                                                                                                                                    | Cubierto A/PG y error genérico. No se requiere pasar por Checkout para demostrar que se impide llegar a él                                                                                                                                                                                                        | —                                                                                          |
| S08  | US2.8; FR-015: datos reales distintos no actualizan el Donante en alta                               | A2 S07/S08 prueba correo/nombre/apellidos/dirección y comparación de fila; equivalencias aparte                                                                                                                                         | Cubierto A para alta; no se usa como sustituto de la condición puntual con cuenta vinculada de P16                                                                                                                                                                                                                | —                                                                                          |
| S09  | US2.9; FR-010/017: primer cobro de socio sin retorno activa una sola alta                            | A7 «S01/S09…» sin navegador, factura antes/después de Checkout; A3 webhook y deduplicación                                                                                                                                              | Cubierto A de servicio/PG sin autorización de navegador. No se observó ese recorrido real de socio; P21 puntual no lo demuestra por extensión                                                                                                                                                                     | — para este balance; no imponer otra alta Stripe por defecto                               |
| S10  | US2.10; FR-018: fallo posterior no suma ni cancela ni ordena cobro                                   | A7 «S10…» y fallo→éxito de la misma factura; A8 aviso; M2 cuota rechazada y aviso; A11 correcciones posteriores al primer converge                                                                                                      | Cubierto en A y presentación local; no hay cuota posterior fallida real de R3. El aviso simulado no se cuenta como correo confirmado de SC-002 CONV-002 reproducida y corregida: el aviso recuperado distingue intento/previsión históricos; conserva resumen y no afirma impago o próximo cobro actuales.        | —; conservar límite de integración                                                         |
| S11  | US2.11; FR-019: tras fallo, solo próxima fecha futura comunicada                                     | A7 «S11…» y factura antigua; M2 formato de próxima fecha; A11 correcciones posteriores al primer converge                                                                                                                               | Cubierto A para invoice.updated y previsión canónica simulada. Las fechas ordinarias de R3 no prueban un reintento tras fallo CONV-002 reproducida y corregida: el aviso recuperado distingue intento/previsión históricos; conserva resumen y no afirma impago o próximo cobro actuales.                         | —; no calcular una fecha para sustituir la ausente                                         |
| S12  | US2.12; FR-019: sin previsión válida, Pendiente de confirmación                                      | A7 «S12…» nula/pasada y vencimiento sin webhook; M2 cuota rechazada sin previsión; A11 correcciones posteriores al primer converge                                                                                                      | Cubierto A/M. No se afirma haber esperado una fecha Stripe real hasta su vencimiento CONV-002 reproducida y corregida: el aviso recuperado distingue intento/previsión históricos; conserva resumen y no afirma impago o próximo cobro actuales.                                                                  | —                                                                                          |
| S13  | US2.13; FR-008/018: cancelación después de fallo conserva pagos                                      | A7 «S13…» fallo→cancelación→evento antiguo; M2 cancelada; R3 cancelación tras alta pagada; A11 correcciones posteriores al primer converge                                                                                              | Cubierto A de la secuencia exigida y R de cancelación comunicada en otro contexto. R3 no es S13 completo con Stripe; no hay fallo previo real CONV-002 reproducida y corregida: el aviso recuperado distingue intento/previsión históricos; conserva resumen y no afirma impago o próximo cobro actuales.         | — para el balance; registrar esa secuencia como simulada, no repetir la cancelación anual  |

Balance actualizado: **34 filas con cobertura en el alcance declarado; los seis huecos
locales iniciales quedan comprobados en A10/M3**. No se transforma evidencia simulada en
integración Stripe. R5 completa SC-001 para una ejecución y acredita 7/7 del conjunto
manual; la dependencia T079 de T080 queda satisfecha. El cierre del balance conserva
las limitaciones de cada fuente y no declara convergencia.

## Comprobaciones G1–G3 ejecutadas y preparación histórica

### G1 — Resultado rechazado y retorno cancel_url (P05)

**Resultado posterior:** A10/M3 acredita los controles siguientes; capturas y balance en
[validacion-local-g1-g3-01.md](validacion-local-g1-g3-01.md). Se conserva debajo el alcance preparado.

En un entorno local aislado con una operación sintética propia, comprobar la pantalla
de rechazo, motivo y opción de recuperar el mismo Checkout; probar también el resultado
con cancelado=1 y verificar por lectura que ese parámetro no cancela ni confirma dinero.
La transición por rechazo/expiración ya está probada en A4 y no se repite con Stripe.
No se modifica una aportación real ni se necesita otra tarjeta rechazada real. Si se
elige automatizar la parte de URL, identificar una aserción concreta de estado inalterado,
no sustituirla por otra referencia general a la matriz antigua.

### G2 — Navegación del vínculo e identidad con cuenta vinculada (P11/P16)

**Resultado posterior:** dos entradas recorridas sin solicitar enlace; tres rechazos HTTP
con aviso visible y Donante conservado, A10/M3. El texto siguiente conserva el alcance preparado.

- Abrir «Vincular mis aportaciones» desde formulario y desde un resultado autorizado;
  comprobar que ambas entradas llegan a la página sin token. No volver a solicitar un
  enlace ni consumir uno para repetir el vínculo ya acreditado en M1/R1.
- Con una cuenta de pruebas ya vinculada y su Donante inmutable, intentar por separado
  cambios reales de nombre, apellidos y dirección en la modalidad puntual. Acreditar
  rechazo previo a Checkout, mensaje genérico y fila conservada; no pagar. Una prueba
  automatizada dirigida con ese contexto también sirve para la condición de P16 que
  no identifica la prueba actual. No se modifica código en esta preparación.

### G3 — Avisos de correo en interfaz (P08/P10/S05)

**Resultado posterior:** A10/M3 acredita aviso puntual, segundo fallo HTTP y alta activa
con resumen/periodicidad/previsión. Persistencia y ausencia de nuevas llamadas Checkout
contrastadas conjuntamente; SMTP simulado. El texto siguiente conserva el alcance preparado.

Completar solo la evidencia visible que falta: puntual confirmada con correo fallido,
un nuevo reintento HTTP fallido sobre la misma aportación confirmada que mantiene
aviso/opción sin éxito falso y alta activa con
correo fallido junto a periodicidad y previsión. Se propone un entorno aislado con datos
sintéticos y respuestas API/SMTP controladas, expresamente etiquetado como local; si no
existe esa instrumentación, debe prepararse y revisarse antes de usarla. No se detiene
el SMTP compartido ni se fuerza a fallido el correo de una operación Stripe ya confirmada.
No se exige otro pago ni se repite el reintento satisfactorio recibido de M1/P09.

### T079 — Una puntual cronometrada y su correo

**Resultado posterior:** [medición 1](medicion-puntual-01.md), aportación 35,
`DON-0b914a77-2050-4429-ba19-19f16f62507c`, 20 €, 480,836 segundos: **SC-001 no cumple**.
El pago y correo están acreditados; no se repiten. **Medición 2:** R5, aportación 36,
`DON-a8fcdc66-4562-41b4-8133-6864d583f0e0`, otros 20 €, **61 s medidos con cronómetro**:
satisface SC-001 en esa ejecución. Sin horas t0/t1 o captura comunicadas; no se deducen
del pago. Se conservan ambos intentos y no se autoriza otra operación automática.

El párrafo siguiente conserva la propuesta inicial, anterior a las dos mediciones:

Es la única nueva operación Stripe propuesta por este bloque, sujeta a revisión y ejecución
acompañada. También permite tomar una captura completa de P01 y cotejar P06/SC-004, sin
volver a ejecutar donaciones, reentregas o cancelaciones anteriores. No se fija aún un
ID o referencia que no existe. Un fallo de infraestructura no se oculta del tiempo medido.

## Conjunto manual validado para SC-002

El conjunto documental vigente contiene exclusivamente las aportaciones reales de pruebas
**30, 31, 32, 33, 34, 35 y 36**. R4 incorpora la puntual 35 confirmada con duración
no satisfactoria para SC-001; R5 incorpora la puntual 36 confirmada, con medición de
61 s aportada durante la prueba. Se excluyen semillas sin Stripe, correos ficticios marcados enviados,
avisos fallo_cuota y correos de vínculo. La aportación anual 34 sigue incluida aunque su
suscripción esté cancelada: el cobro permanece confirmado.

| Aportación   | Referencia y tipo del mensaje                          | Envío persistido y correspondencia recibida                                                                                   | Fuente                                          |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 30 · 15,75 € | DON-47619c0b-0cb7-4149-9a80-29e2b133829c; confirmacion | enviado_en 2026-11-07T01:16:20.923Z, un intento; una coincidencia Mailpit y apertura/comprobación de Nada                     | R1 y sus consultas posteriores ya documentadas  |
| 31 · 1,23 €  | DON-868afebb-090a-492e-9966-ab31b6bad6bf; confirmacion | enviado_en 2026-11-07T02:53:18.133Z, un intento; una coincidencia Mailpit                                                     | R2; no consta apertura visual del nuevo mensaje |
| 32 · 1,11 €  | DON-d929b6c6-a2bf-4c52-97ee-cf74a4897f96; confirmacion | enviado_en 2026-11-07T03:19:57.149Z, un intento; una coincidencia Mailpit tras reentrega                                      | R3/registro                                         |
| 33 · 1,22 €  | DON-8de7cf59-b711-4ffe-928c-a839d9345f63; confirmacion | enviado_en 2026-11-07T03:24:46.929Z, un intento; una coincidencia Mailpit tras reentrega                                      | R3/registro                                         |
| 34 · 1,33 €  | DON-6bb1aa78-1c3a-46a5-8647-a7bf9a5a2e57; confirmacion | enviado_en 2026-11-07T03:26:00.466Z, un intento; una coincidencia Mailpit tras reentrega/cancelación                          | R3/registro                                         |
| 35 · 20,00 € | DON-0b914a77-2050-4429-ba19-19f16f62507c; confirmacion | enviado_en 2026-11-07T04:06:23.974Z; una coincidencia Mailpit, mensaje jDYvMfFNJdVfBXv6hz6vrr y texto contrastado             | R4/registro; medición 480,836 s no cumple SC-001    |
| 36 · 20,00 € | DON-a8fcdc66-4562-41b4-8133-6864d583f0e0; confirmacion | enviado_en 2026-11-07T04:38:35.483Z, un intento; una coincidencia Mailpit, mensaje eEG6FFzV22N4sePVh9nzzp y texto contrastado | R5/registro; cronómetro 61 s observado con cronómetro     |

La identificación histórica del mensaje es por referencia y correspondencia de envío;
no se inventan IDs de Mailpit que no se guardaron. Los cinco antecedentes se conservan; posteriormente se buscó cada una de las seis
referencias de 30–35 y, tras R5, las siete de 30–36, con una coincidencia por referencia.
R4 y R5 registran además ID y texto de los mensajes 35 y 36. No se presenta la fecha persistida de envío como hora exacta de recepción.
No se repiten pagos ni envíos para obtener otra captura.

El numerador es el número de referencias confirmadas de este conjunto con su confirmación
recibida acreditada y el denominador el de referencias confirmadas incluidas. Una respuesta
SMTP true, un aviso de pantalla o correo enviado sin prueba de recepción no incrementan el
numerador. El resultado acreditado en el registro de ejecución es **7/7 para este conjunto delimitado**,
no el 100 % global de toda la base. Si se añade otra aportación
manual confirmada durante el bloque, debe incorporarse al conjunto, no excluirse silenciosamente.
Los contadores de coincidencias Mailpit se toman de la búsqueda por referencia, no del total
de mensajes del buzón. La recepción 7/7, junto con los 61 s observados de R5 y el contraste de importes,
respalda el cierre de T079. La medición R4 conserva su resultado no satisfactorio.

## Procedimiento conservado de la puntual cronometrada

La primera ejecución consta en R4, no satisfactoria para SC-001; la segunda, en R5,
con 61 s medidos con cronómetro. Se conserva el procedimiento como referencia histórica;
no se rellenan retrospectivamente horas o capturas ausentes. Este bloque documental
no ejecuta otro pago.

1. **Antes de medir**, se comprueba en lectura rama/servicios (frontend, backend,
   PostgreSQL, Mailpit), la misma cuenta de Stripe de pruebas y credenciales de .env.
   Verifica el listener con forwarding continuo y filtro completo del contrato:
   checkout.session.completed, checkout.session.expired, payment_intent.succeeded,
   payment_intent.payment_failed, payment_intent.canceled, invoice.paid,
   invoice.payment_failed, invoice.updated, customer.subscription.updated y
   customer.subscription.deleted. Todos los comandos usan internamente --api-key desde
   STRIPE_SECRET_KEY; Se excluye STRIPE_API_KEY heredada y se compara el secreto con el
   configurado sin mostrarlo, conforme al protocolo ya revisado. Si hay desajuste, no se
   crea la operación ni se modifica .env. No se inicia ni cambia el listener en esta preparación.
2. Fijar **20,00 €, EUR y fondo general**, datos sintéticos válidos y perfil de navegador
   normal. Confirmar antes si se utilizará invitado o cuenta vinculada; conservar esa
   atribución. Preparar los datos sin rellenar anticipadamente el formulario medido.
   Se realiza el pago; no se reutilizan UUID, referencias o Checkout anteriores.
3. Iniciar un cronómetro observable al entrar en /donar (**t0**, antes de introducir datos),
   registrando también la hora UTC y el método de medición. Se completa el formulario,
   Checkout de pruebas y retorno normal sin retener eventos, cerrar el cliente, detener
   servicios o introducir pausas de prueba. Se recoge IDs en paralelo sin detener
   el recorrido. P21 no se repite aquí.
4. Parar el cronómetro cuando Nada ve el resultado propio **confirmado** (**t1**), no en el
   clic Pagar, creación del evento, pantalla de Stripe o estado pendiente. Conservar
   duración observada, t0/t1, referencia e imagen del resultado. Se exige menos de 180 s;
   si no se logra o se pierde la medición, registrar el resultado real, sin reconstruirlo
   con fecha_cobro/enviado_en ni excluir retrasos. No repetir otro pago automáticamente.
5. Se contrasta por lectura modo de pruebas, EUR/2000 céntimos, referencia, un pago,
   una aportación/operación y confirmación persistida. Nada coteja importe, fecha, modalidad,
   fondo general y referencia visibles; los registros del webhook se conservan sin claves.
   Una captura de Stripe paid no sustituye a t1 ni a la autorización del resultado.
6. Registrar aparte la llegada del correo (**tc**), sin sumarla o restarla artificialmente
   del cronómetro del resultado. Verificar en Mailpit el mensaje nuevo y su correspondencia
   de datos; añadir la referencia y evidencia al conjunto SC-002. Si queda pendiente o
   falla, documentarlo: no declarar recepción ni SC-002 completo. Un eventual reintento
   requiere el flujo autorizado existente y no otro pago; no se ejecuta por adelantado.
7. Consolidar un único registro: actor/fuente, t0/t1/duración/tc, referencia/UUID/IDs,
   importe/moneda/destino, estado/persistencia, correo y observaciones. No guardar tarjeta,
   claves, cookies, tokens, payloads completos o URL privada de Checkout. Revisar G1–G3 y
   el conjunto de referencias incluidas antes de decidir sobre T079/T080. Semillas y pruebas
   simuladas se mantienen separadas de esta ejecución real.

SC-001 exige una **puntual** desde la entrada al formulario: los tiempos de las altas R3
o los timestamps de los pagos anteriores no sirven. Una medición satisfactoria acredita
esa ejecución, no una garantía universal de menos de tres minutos. El balance de escenarios
y el inventario acotado no deben presentarse como auditoría global o convergencia.

## Contraste conjunto de SC-001–SC-004

| Criterio | Evidencia que respalda el balance                                                                                         | Alcance y límites                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| SC-001   | R5: 61 s medidos con cronómetro desde antes de abrir formulario hasta resultado confirmado                                   | Satisfecho para esa ejecución. Sin t0/t1 ni captura comunicados; R4 fallida permanece intacta, sin promedios ni reconstrucción.                  |
| SC-002   | R1–R5 y nueva búsqueda del registro previo: una confirmación recibida por cada referencia 30–36, 7/7                                 | Conjunto manual delimitado, sin pendientes de confirmación en él. Excluye semillas, avisos y vínculos; no es auditoría global.                   |
| SC-003   | [validacion-local-01.md](validacion-local-01.md), T074, datos persistidos/sesión/registros; A9 proyecciones del adaptador | Evidencia existente sin tarjeta en datos de la ONG; no se repite la inspección. Observaciones sobre registros comunes conservadas para revisión. |
| SC-004   | R1/R3, cotejo de importes visibles y pasarela; R5, EUR/2000 céntimos, base 20,00 € y texto del correo; A1/A8/A9           | Coincidencia al céntimo respaldada. No se inventa otra captura o cotejo visual de 36 ni se usan floats o timestamps para medir duración.         |

El [informe de medición 2 y cierre](medicion-puntual-02.md) contrasta las comprobaciones
exactas de T079 y T080. Se conserva la atribución observación y consulta registradas; esta revisión solo consulta
Git y documentos locales, sin nuevas pruebas funcionales o consultas externas.

## Estado de revisión

**T079 y T080 completadas en su alcance de validación.** La dependencia T079 queda
satisfecha; 34 escenarios con fuentes identificadas, G1–G3 cerradas mediante interfaz
y persistencia y cuatro criterios SC contrastados. La ejecución local G1–G3 conserva
17/17 pruebas dirigidas aprobadas; no se repite. Las operaciones 30–36, los informes
históricos y la medición fallida R4 se conservan íntegros.

No quedan huecos adicionales exigidos por este balance. Renovaciones y fallos de
cuotas, alta sin cuenta y ausencia de retorno de socio que no se ejecutaron con Stripe
real permanecen explícitamente limitados a su evidencia local/simulada; S13 real no se
deduce de la cancelación anual tras alta pagada. No se exigen pagos adicionales por
defecto ni se presenta aprobación colectiva.

**Actualización del flujo y correcciones:** T081 ya preparó la revisión; T006 completa el
paquete técnico y T007 registra la comprobación actual de nueve ramas y elección local
de 009, según el [ajuste documentado](ajuste-flujo-01.md). No acreditan aprobación
. T082–T083 tienen reproducción y regresión en A11; el primer informe
[converge-1.md](converge-1.md) se conserva íntegro. **Cierre técnico acreditado en [converge-3.md](converge-3.md)**. los controles de incorporación siguen pendientes antes de main; el cierre técnico no acredita revisión externa ni incorporación.
