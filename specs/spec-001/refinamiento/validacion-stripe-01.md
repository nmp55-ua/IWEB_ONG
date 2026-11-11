# Validación real de Stripe — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Historia**: HU-01 · **Rama**: spec-001 · **Fecha**: 2026-11-07

**Responsable**: Nada · **Revisor**: Rubén.

## Alcance y procedencia

Registro documental de T076–T077. Estado inicial comprobado: spec-001, HEAD 5eb2e1d,
con T073–T074 ya registradas y los cambios locales de compatibilidad conservados. Se conserva .env. Este encargo no ejecuta pagos, reenvíos, cambios de
configuración, commits o cambios de rama.

Se distinguen observaciones de navegador y correo, actuaciones recogidas en el registro previo y consultas de solo lectura de esta revisión. Las evidencias comunicadas no se presentan como una nueva ejecución de los comandos.

## Operación y secuencia real comunicada

| Dato                      | Valor                                    |
| ------------------------- | ---------------------------------------- |
| Referencia original       | DON-47619c0b-0cb7-4149-9a80-29e2b133829c |
| Aportación                | 30                                       |
| Importe y destino         | 15,75 € · Agua potable                   |
| PaymentIntent             | pi_3UYy99E0jEvPnEcp0mfeZQbE              |
| Fecha de cobro persistida | 2026-11-07T01:10:19.000Z                 |

1. Según el registro de la prueba, Stripe confirmó el mismo Checkout en modo de pruebas: complete,
   paid, 1575 céntimos, EUR. No se sustituyó la operación ni se repitió el pago.
2. El backend estaba apagado cuando se intentó la primera entrega. El listener mostró
   Connection refused y el frontend mostró errores de conexión. Fue una indisponibilidad
   de la aplicación; no un rechazo del pago por Stripe.
3. Tras arrancar el backend, se ejecutó stripe events resend para los eventos
   originales, utilizando internamente la clave local. Ambos comandos terminaron
   correctamente y la persistencia posterior refleja procesamiento sin incidencia.
   No hay captura de los códigos HTTP del reenvío; no se infiere ni registra uno concreto.
4. Se observó correo enviado con un intento y encontró un único mensaje de esa
   referencia en Mailpit. Se abrió y se comprobó importe, destino y referencia.
5. En el navegador de prueba no se transfirió el permiso invitado de la sesión original
   de la prueba inicial. Se observó el aviso genérico de falta de permiso, sin que esto implicara
   que el pago hubiera fallado.
6. Nada creó la cuenta de validación, solicitó el vínculo, recibió su correo en Mailpit,
   abrió el enlace y confirmó. Observó «vinculación completada». No se reproduce el token
   ni su enlace. Con esa cuenta y sesión, consultó la referencia original y vio estado
   confirmado, 15,75 €, Agua potable y correo enviado.

| Evento original              | Tipo                       | Versión comunicada en el registro de ejecución | Estado persistido contrastado |
| ---------------------------- | -------------------------- | ------------------------------ | ----------------------------- |
| evt_3UYy99E0jEvPnEcp0NoohXWh | payment_intent.succeeded   | 2026-10-28.endive              | procesado; error_codigo null  |
| evt_1UYy9AE0jEvPnEcpp8aea5Kd | checkout.session.completed | 2026-10-28.endive              | procesado; error_codigo null  |

La tabla eventos_pasarela no conserva api_version: la versión se atribuye a la comprobación
del registro previo, no a una lectura de esa columna. La ruta actual verifica la firma sobre el cuerpo
crudo antes de reconciliar y no requiere sesión. El procesamiento persistido es coherente
con ese recorrido; no sustituye a una captura de la entrega HTTP.

## Consultas propias actuales, exclusivamente de lectura

Desde backend, scripts temporales por entrada estándar ejecutados con
`node --env-file=../.env --input-type=module`. No se guardan scripts con credenciales ni se
imprime la conexión. Las consultas PostgreSQL usan BEGIN READ ONLY, límite de cinco segundos
y COMMIT; no se ejecutan INSERT, UPDATE, DELETE, migraciones o semillas. Esta vez se consulta
la operación real existente en la conexión local, no se ejecutan pruebas sobre ella.

| Comprobación                                         | Resultado observado en esta revisión                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Aportación por referencia                            | id 30; confirmada; importe 15.75; Agua potable; PaymentIntent y fecha de cobro de la tabla anterior                                      |
| Unicidad local                                       | Una aportación para la referencia, una para ese PaymentIntent y una operación asociada                                                   |
| Eventos                                              | Los dos ID indicados están procesados, sin error_codigo                                                                                  |
| Confirmación por correo                              | Un registro de tipo confirmacion; enviado; intentos=1; enviado_en=2026-11-07T01:16:20.923Z; resumen con referencia, 15.75 y Agua potable |
| Vínculo                                              | Donante vinculado a la cuenta de validación activa con rol donante; una verificación consumida para ese vínculo                          |
| Instantánea de Checkout                              | payment_method_types=[card]; moneda eur; unit_amount=1575                                                                                |
| GET Checkout existente, por el adaptador acacia      | complete, paid, mode=payment, livemode=false; referencia, módulo y PaymentIntent correctos                                               |
| GET PaymentIntent existente, por el adaptador acacia | succeeded; amount=1575; amount_received=1575; currency=eur; livemode=false; invoice=null; referencia y módulo correctos                  |
| GET búsqueda de Mailpit por referencia               | count=1, messages_count=1 y una coincidencia devuelta                                                                                    |

Los GET de Stripe reutilizan obtenerSesionPago y obtenerPago, con la configuración acacia
existente. No crean ni confirman pagos. Los GET de Mailpit solo consultan los resultados de
búsqueda; la apertura y comprobación visual del contenido se atribuye a Nada. El campo total
de la búsqueda vale 2 y no se interpreta como dos mensajes para esta referencia: los
contadores de coincidencias y la lista devuelta valen 1. Ningún resultado incluye cookies,
secretos, tokens o URL completa de Checkout.

## Contraste de criterios y estado de tareas

| Tarea y criterio exacto                                               | Cobertura                                             | Evidencia y limitación                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T076: cuenta y credenciales de pruebas                                | Cubierto para el circuito puntual                     | GET actuales de los recursos originales, en modo de pruebas; sin exponer claves                                                                                                                                       |
| T076: versión y firma/eventos                                         | Cubierto para los avisos reenviados al listener local | se registra la versión endive; ruta con firma obligatoria y ambos eventos procesados. No se atribuye una versión a un endpoint permanente no inspeccionado                                                                  |
| T076: conectividad y destino                                          | Fallo inicial y recuperación acreditados              | Connection refused comunicado; comandos de reenvío correctos y persistencia posterior. Sin captura de códigos HTTP                                                                                                    |
| T076: recuperación/cancelación configuradas                           | Cubierto mediante configuración observada y descrita                    | Smart Retries activado, hasta 8 reintentos en 2 semanas; al agotarlos, cancelar la suscripción y dejar la factura como vencida. Véase el cierre posterior de T076                                                     |
| T077: pago de tarjeta alojado en Stripe, importe, moneda y referencia | Cubierto                                              | Snapshot card/eur/1575, Checkout paid y PaymentIntent succeeded con pertenencia correcta                                                                                                                              |
| T077: único registro y mensaje recibido en Mailpit                    | Cubierto para esta ejecución                          | Unicidad local actual; un intento de correo; búsqueda con una coincidencia y revisión visual                                                                                                                  |
| T077: resultado y privacidad                                          | Cubierto                                              | Se observa denegación invitada y resultado confirmado tras vincular la cuenta; consultas actuales corroboran el vínculo                                                                                             |
| T077: retorno desde Checkout                                          | Cubierto; observado durante la prueba                | Retorno automático a /donar/resultado con la referencia original; captura del error y registro de la página y ECONNREFUSED en el frontend por backend apagado.                                                        |
| T077: cierre del navegador sin condicionar el webhook                 | Cubierto por la prueba adicional P21 de 1,23 €        | Aportación 31 pendiente antes del cierre y antes de la primera entrega; confirmación con páginas de aplicación/Checkout cerradas, correo en Mailpit y reentrega sin duplicados; atribución y horas en el cierre final |

**Balance vigente tras la prueba adicional P21: T076 y T077 completadas en su alcance.**
La aportación 31 de 1,23 € acredita ahora la primera transición local desde pendiente,
con las páginas de aplicación y Checkout cerradas y la reentrega del mismo evento sin
duplicados. La prueba anterior de 15,75 € conserva su alcance propio: su cierre de navegador
solo acreditaba una reentrega posterior. El cierre final y sus limitaciones se documentan
más adelante; los relatos parciales anteriores se conservan como evolución.

T078 y las demás tareas no se marcan por extensión. T006, T007, converge y coordinación
de 009 siguen pendientes. Se conserva la revisión de Rubén como pendiente.

## Regresión simulada, separada de la evidencia real

Se registraron la revisión de compatibilidad y la repetición de la suite completa sobre
ong_test_hu01: 367/367 aprobadas. Es una observación del registro previo, distinta tanto de su reenvío
real como de las consultas actuales. La ejecución previa propia con el mismo resultado
figura en [preparacion-stripe-01.md](preparacion-stripe-01.md). Esta revisión documental no
repite la suite ni atribuye a mocks recepción real, configuración de cuotas o idempotencia
de Stripe.

## Archivos y parada

Se actualizan únicamente tasks.md y se añaden estas evidencias a preparacion-stripe-01.md
y al presente informe. Se mantienen el relato anterior, los cambios de compatibilidad y
todos los históricos. Los siguientes pasos requieren revisar los criterios pendientes;
la donación original ya está pagada y no debe sustituirse por otra para este registro.
Sin git add, commit, push, merge, cambio de rama, pagos o reenvíos adicionales.

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

## Aclaración posterior: retorno observado — 2026-11-07

Se observó el retorno automático después de pulsar «Pagar» en el Checkout original de 15,75 € a `/donar/resultado?ref=DON-47619c0b-0cb7-4149-9a80-29e2b133829c`. La captura compartida mostraba esa dirección y «Ha ocurrido un error inesperado». La terminal del frontend registró la página de resultado y errores ECONNREFUSED al consultar el backend, que estaba apagado. Se acredita el retorno y se distingue del fallo posterior de conexión; esta evidencia no procede de una nueva ejecución documental.

Quedan pendientes la configuración de recuperación/cancelación de cuotas (T076) y la prueba expresa de cierre del navegador sin condicionar el webhook, además de la dependencia de T076 (T077). La ausencia de captura de códigos HTTP del reenvío es una limitación del registro, no un criterio adicional pendiente. Se conservan los hechos y comprobaciones anteriores; no se repiten pagos, reenvíos ni pruebas.

## Actualización posterior: configuración de T076 acreditada — 2026-11-07

Se aportaron capturas del mismo entorno de pruebas de Practica IWEB ONG. Muestran
Smart Retries activado, hasta ocho reintentos en dos semanas; el primer fallo de renovación
deja la suscripción como vencida. Al agotarse los reintentos está seleccionado cancelar la
suscripción y dejar la factura como vencida. La lectura procede de las imágenes aportadas,
no de una nueva consulta directa al panel en esta comprobación. Las descripciones de configuración y su transcripción
se conservan en el [cierre de preparación](preparacion-stripe-01.md#cierre-de-configuración-de-t076-mediante-capturas--2026-11-07).

Esta evidencia cubre el criterio de configuración pendiente y permite marcar T076, junto
con las comprobaciones previas registradas. Los párrafos anteriores que describían T076
pendiente reflejan su estado antes de recibir estas capturas. No se han cambiado ajustes,
repetido pagos, reenviado eventos ni comprobado un ciclo o una cancelación real por extensión.

**T077 sigue sin marcar únicamente por la prueba explícita de cierre del navegador sin
condicionar el webhook.** El pago original, importe/moneda/referencia, unicidad local,
ambos eventos originales procesados, recepción del correo, retorno automático y consulta
confirmada tras vínculo verificado conservan su evidencia. No se necesita repetirlos.
La falta de captura HTTP del reenvío sigue siendo una limitación documental, no otra prueba
pendiente. T078 y las demás tareas pendientes no cambian. No hay commits ni cambios de rama.

## Comprobación posterior: reentrega con navegador cerrado — 2026-11-07

Esta evidencia complementa las etapas anteriores sin cambiar el relato de la primera
entrega fallida por backend apagado y su recuperación. T076 continúa completada. Las
actuaciones que se describen a continuación fueron registradas durante la prueba; esta
revisión registra y contrasta sus evidencias, sin ejecutar pagos, reenvíos o consultas
adicionales a Stripe o a la base de datos.

### Procedimiento y atribución

1. Se confirmó el cierre del navegador y las páginas de la aplicación, manteniendo Docker,
   backend y stripe listen activos. Se comunicó que no se encontraron procesos Firefox,
   Chrome, Edge, Brave u Opera. La revisión documental no ejecutó esa inspección de procesos.
2. Antes del reenvío, se verificó por consultas de solo lectura la aportación 30
   confirmada, referencia DON-47619c0b-0cb7-4149-9a80-29e2b133829c, importe 15,75 € y
   PaymentIntent pi_3UYy99E0jEvPnEcp0mfeZQbE. Había una aportación para esa referencia y pago,
   una operación asociada, confirmación enviada con un intento y una coincidencia en Mailpit.
3. Con el navegador cerrado y autorización para la prueba, se solicitó mediante stripe events
   resend únicamente el evento original evt_3UYy99E0jEvPnEcp0NoohXWh. El comando terminó
   correctamente, según el registro de ejecución. No se creó una operación, evento sintético o pago.
4. Se aportaron las siguientes líneas nuevas del listener, en hora local. Se transcriben
   como evidencia aportada durante la prueba, sin presentarlas como observación directa de esta comprobación:

```text
2026-11-07 03:03:55 --> payment_intent.succeeded [evt_3UYy99E0jEvPnEcp0NoohXWh]
2026-11-07 03:03:56 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYy99E0jEvPnEcp0NoohXWh]
```

Se registró la hora del comando como 2026-11-07T02:03:55.668Z, coherente con la hora
local de las líneas y el desfase +01:00 de Europe/Madrid en esa fecha. La respuesta 200 se
atribuye **solo a esta reentrega**. No completa retrospectivamente los códigos HTTP que no
se capturaron en la recuperación anterior ni borra el Connection refused inicial.

5. Antes de reabrir el navegador, se repitieron las consultas de solo lectura. Comunicó
   que permanecían la misma aportación confirmada, referencia, importe y PaymentIntent,
   una aportación y una operación; correo enviado con un intento y la misma fecha de envío,
   y una coincidencia en Mailpit. Se acredita ausencia de duplicados para esta reentrega,
   sin elevarlo a una garantía universal de entrega única de correo.
6. Nada reabrió la aplicación y confirmó que la referencia original muestra confirmada,
   15,75 €, Agua potable y correo enviado. Se conserva la evidencia anterior de acceso
   tras vinculación verificada; no se repite el pago ni el vínculo.

### Contraste del alcance de T077 y P21

T077 exige «se comprueba retorno y cierre de navegador sin condicionar el webhook» y
remite, entre otros, a P21. La recepción y aceptación de una reentrega con el navegador
cerrado quedan acreditadas por los pasos anteriores, junto con la comprobación de
unicidad. No hay que inventar códigos HTTP ni inferir la entrega solo del éxito del comando.

Sin embargo, el [escenario puntual 21 de spec.md](../spec.md) parte de una aportación cuyo
pago todavía no se ha confirmado y recibe después del cierre una notificación válida
que confirma la aportación una sola vez. [Quickstart, P21](../quickstart.md), especifica
cerrar el navegador antes del pago y entregar después el webhook firmado dos veces.
En esta prueba la aportación ya estaba confirmada antes de cerrar el navegador: no se
ejercita de nuevo la transición inicial desde pendiente.

Por esa diferencia explícita de trazabilidad, **T077 permanece parcial y sin marcar**.
La prueba general de recepción con navegador cerrado está acreditada; falta evidencia
real del recorrido inicial exigido por P21. No se redefine P21, no se exige repetir el
pago original y no se programa otra prueba dentro de este encargo. Las comprobaciones
automatizadas y la evidencia real anterior se mantienen, sin confundir sus alcances.

El pago original, importe/moneda/referencia, unicidad local, ambos eventos originales
procesados, recepción del correo, retorno automático y consulta confirmada tras vínculo
verificado siguen acreditados. T078 y siguientes, T006, T007, converge y coordinación de
009 permanecen pendientes; no se completan por extensión.

### Comprobaciones propias de esta revisión

Se comprobó spec-001 y HEAD 5eb2e1d, el estado local, el texto de T077 y su origen P21,
el escenario 21 de spec.md y las referencias del contrato HTTP a independencia del navegador.
Se actualiza el balance vigente y se añade este relato sin eliminar las etapas anteriores.
Las consultas del registro previo y las líneas de Nada no se presentan como pruebas ejecutadas aquí.
No se repiten suites, pagos, reenvíos, cambios de configuración ni acciones de Git de escritura.

## Aclaración posterior del procedimiento P21 — 2026-11-07

Se contrasta de nuevo el escenario puntual 21 y se conserva spec.md intacto. La indicación
«cerrar antes del pago» citada en el contraste anterior correspondía al texto de quickstart
en aquella revisión. El [procedimiento vigente](../quickstart.md#procedimiento-adicional-p21--preparación-revisada-sin-ejecutar)
aclara ahora que Se completará el pago en Stripe con la entrega retenida; deberá constar
todavía pendiente en la aplicación al cerrar el navegador, antes de su primera notificación
válida. La aclaración resuelve el orden de ejecución sin modificar el criterio funcional.

La prueba adicional prevista de 1,23 € no está ejecutada y no altera la operación original
de 15,75 €, su correo o su vínculo. Ambos listeners y el reenvío quedan definidos con la
misma STRIPE_SECRET_KEY de .env mediante --api-key y con verificación del secreto sin
mostrar valores; un desajuste detendrá la prueba sin sobrescribir .env. No se atribuye a
esta preparación una comprobación real de firma ni nuevos resultados de pago o entrega.
Los puntos de control incluyen primera confirmación local con navegador cerrado, segunda
entrega sin duplicados, correo recibido y consulta con sesión o vínculo válidos. Se mantiene
la caducidad absoluta del permiso invitado; no se promete acceso por referencia o correo.
T077 continúa parcial y sin marcar y las demás tareas no se completan por extensión.

## Cierre final de T077: primera confirmación de la prueba adicional P21 — 2026-11-07

Este apartado registra la ejecución posterior del procedimiento aclarado en
[quickstart.md](../quickstart.md#procedimiento-adicional-p21--preparación-revisada-sin-ejecutar).
La preparación descrita allí no era evidencia de ejecución; los resultados reales son los
comunicados por las observaciones de prueba que se recogen a continuación. No se modifica spec.md ni la
operación anterior de 15,75 € y se conservan sus fallos, recuperación y reentregas históricas.

### Identificación independiente

| Dato                                  | Prueba adicional P21                                    |
| ------------------------------------- | ------------------------------------------------------- |
| Aportación / operación                | 31 / 4                                                  |
| Referencia                            | DON-868afebb-090a-492e-9966-ab31b6bad6bf                |
| UUID de solicitud                     | 8d26aeaa-1cfb-4f1d-9146-a41beea14e02                    |
| Importe, moneda y destino             | 1,23 € · EUR · fondo general                            |
| PaymentIntent                         | pi_3UYzXwE0jEvPnEcp18Nr4OIV                             |
| Evento auténtico                      | evt_3UYzXwE0jEvPnEcp1ECh1dn8 · payment_intent.succeeded |
| API del evento comunicada en el registro de ejecución | 2026-10-28.endive                                       |

### Secuencia observada y atribución

1. Nada creó la nueva operación mediante el formulario real y pagó una sola vez en
   Checkout de pruebas. Se mantuvo un listener de observación sin forwarding con
   la misma clave de .env. Su GET de Stripe confirmó Checkout complete/paid, 123 céntimos,
   EUR, livemode=false y referencia coincidente. No se reutilizó el pago de 15,75 €.
2. Se comprobó por lectura de PostgreSQL, antes del cierre, aportación pendiente,
   fecha_cobro y pago local nulos y ausencia de correo y evento de esa operación. Nada
   observó el resultado pendiente en pantalla. Se distingue pago completado en Stripe
   de confirmación local, todavía no producida.
3. Se cerraron las páginas de aplicación y Checkout. Se comprobó con la herramienta de
   navegador que el integrado no tenía pestañas abiertas y cerró también la única pestaña
   restante de Mailpit. Firefox conservaba otras páginas ajenas; Se confirmó que no
   quedaban páginas de la aplicación en Firefox. **No se afirma cierre total de Firefox ni
   ausencia de todos sus procesos.** El cliente de la aplicación permaneció cerrado durante
   la primera confirmación y las comprobaciones posteriores indicadas.
4. Se activó el listener con forwarding y la misma clave de .env. Según la comprobación
   del registro previo, su secreto coincidía con el configurado, sin exponer valores. Backend y demás
   servicios continuaron activos. No se desactivó la verificación de firma.
5. Justo antes de reenviar únicamente el evento auténtico nuevo, a las
   **2026-11-07T02:53:15.438Z**, se verificó de nuevo que la aportación seguía pendiente,
   sin fecha de cobro, pago local, correo ni evento de esa operación. Esta comprobación
   acredita que no había adelantado la confirmación otra entrega.

Se aportaron estas líneas de la primera entrega al backend, en hora local Europe/Madrid:

```text
2026-11-07 03:53:16 --> payment_intent.succeeded [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
2026-11-07 03:53:18 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
```

6. Sin reabrir páginas, se comprobó a las **2026-11-07T02:53:20.900Z**:

| Comprobación del registro previo tras la primera entrega | Resultado comunicado                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| Estado local                                  | confirmada; mismo importe y PaymentIntent                |
| fecha_cobro                                   | 2026-11-07T02:40:00.000Z                                 |
| Unicidad                                      | Una aportación por referencia y por pago; una operación  |
| Evento                                        | procesado, sin error                                     |
| Confirmación de correo                        | enviado, un intento; enviado_en=2026-11-07T02:53:18.133Z |
| Recepción en Mailpit                          | Una coincidencia de esa referencia                       |

La fecha_cobro anterior al cierre no significa que el backend hubiera confirmado antes:
el [contrato de pasarela](../contracts/pasarela-stripe.md#puntual) toma esa fecha del evento
de éxito en Stripe, no del instante de persistencia local. La transición local queda
acotada por la lectura pendiente de las 02:53:15.438Z y la confirmada de las 02:53:20.900Z.
Las horas locales de las líneas corresponden a UTC+01:00; las terminadas en Z son UTC.

7. Se reenvió una vez el **mismo evento**, sin otro pago. Se aportaron:

```text
2026-11-07 03:56:10 --> payment_intent.succeeded [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
2026-11-07 03:56:10 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
```

Las consultas posteriores del registro previo conservaron una aportación, una operación, correo
enviado con un intento, la misma fecha de envío y una coincidencia en Mailpit. No se
interpreta el segundo 200 como un nuevo cobro ni como otro correo. No se atribuye a esta
comprobación una garantía universal de entrega física única del correo.

8. Nada reabrió el resultado con su cuenta vinculada y comprobó visualmente: confirmada,
   1,23 €, fondo general y correo enviado. La recepción del nuevo mensaje queda acreditada
   por Mailpit y las consultas del registro previo; **no consta inspección visual del contenido de
   ese nuevo correo**. La apertura visual del correo anterior de 15,75 € sigue registrada
   únicamente para aquella operación.

### Contraste final y límites del cierre

| Criterio de T077/P21                                      | Evidencia que lo cubre                                                                                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pago de pruebas correcto y aportación local aún pendiente | Formulario y pago de Nada; GET de Stripe del registro previo; lecturas locales antes del cierre y justo antes de la entrega; pantalla pendiente observada durante la prueba                            |
| Primera confirmación posterior al cierre del cliente      | Páginas de aplicación/Checkout cerradas, integrado sin pestañas y Firefox solo con páginas ajenas; primera entrega con 200 y transición pendiente → confirmada sin reabrir páginas |
| Reentrega válida sin duplicados                           | Mismo evento entregado otra vez con 200; recuentos y envío conservados según consultas del registro previo                                                                                    |
| Correo recibido                                           | Registro enviado con un intento y una coincidencia de la referencia en Mailpit                                                                                                     |
| Resultado autorizado                                      | Nada reabrió con cuenta vinculada y observó los datos correctos                                                                                                                    |
| Retorno y evidencias anteriores de T077                   | Se conservan el retorno automático, pago y correo de la operación original y la verificación del vínculo, sin atribuirle una primera confirmación con navegador cerrado            |

Con T076 ya completada y este contraste frente al escenario 21 de spec.md y el
procedimiento aclarado de quickstart, **T077 queda completada en el alcance observado**.
La condición funcional es procesar la primera confirmación sin depender de una página
abierta o del retorno del donante; no se añade el requisito de terminar procesos de
Firefox que mantienen únicamente páginas ajenas. No se cambia el criterio ni se altera
ningún estado para fabricar la transición.

No se ha medido una duración inferior a tres minutos; SC-001 y T079 no se cierran por esta
prueba. Tampoco se completan T078 y siguientes, T006, T007, converge o coordinación de 009.
Los apartados anteriores con T077 parcial reflejan la evidencia disponible en cada etapa;
este apartado fija el resultado posterior, sin borrar sus limitaciones históricas.

Las observaciones de interfaz y líneas del listener proceden de Nada; GET, consultas de
estado, Mailpit y control de entrega proceden del registro previo según el encargo. Las comprobaciones
propias de esta revisión se limitan a rama/HEAD/estado local, lectura y contraste de los
documentos y revisión de formato y alcance. No se repiten suites ni consultas externas,
pagos, reenvíos o cambios de configuración. El estado inicial era spec-001, HEAD 789e154,
con los tres documentos de preparación modificados y  sin seguimiento.

## Bloque real de socios — cierre de T078 y evidencia parcial de T079–T080 · 2026-11-07

Estado inicial de esta revisión: spec-001, HEAD cbafeef, únicamente  sin
seguimiento. Se ejecutaron las altas y la cancelación descritas; Se contrastó por
lectura PostgreSQL, Stripe con API acacia y Mailpit. Se comunicó las confirmaciones en
pantalla y aportó las líneas del listener. La revisión actual no repite esos comandos o
consultas: contrasta las evidencias comunicadas con T078, contratos y escenarios y actualiza
documentación. No se modifican las donaciones puntuales anteriores de 15,75 € y 1,23 €.

### Tres altas independientes y primeras facturas

Todas son cuotas iniciales en EUR, fondo general y modo de pruebas. Se comunicó las tres
confirmaciones en pantalla; Se comunicó la aportación de una captura mensual. No se añaden
archivos de capturas que no se hayan recibido en este bloque documental ni se afirma que
esta revisión haya inspeccionado directamente esas pantallas.

| Campo                          | Mensual                                  | Trimestral                               | Anual                                    |
| ------------------------------ | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| Aportación / suscripción local | 32 / 6                                   | 33 / 7                                   | 34 / 8                                   |
| Referencia                     | DON-d929b6c6-a2bf-4c52-97ee-cf74a4897f96 | DON-8de7cf59-b711-4ffe-928c-a839d9345f63 | DON-6bb1aa78-1c3a-46a5-8647-a7bf9a5a2e57 |
| Importe                        | 1,11 € / 111 céntimos                    | 1,22 € / 122 céntimos                    | 1,33 € / 133 céntimos                    |
| Recurrencia Stripe             | month/1                                  | month/3                                  | year/1                                   |
| Subscription                   | sub_1UZ0AVE0jEvPnEcpnf7HDK6Z             | sub_1UZ0FBE0jEvPnEcp6b0LR1Lz             | sub_1UZ0GNE0jEvPnEcprIex4dBv             |
| Invoice                        | in_1UZ0AVE0jEvPnEcp9bcmLuB6              | in_1UZ0FBE0jEvPnEcpeCf8NPDx              | in_1UZ0GNE0jEvPnEcpCZc6CYqs              |
| PaymentIntent                  | pi_3UZ0AVE0jEvPnEcp0UyLkLmV              | pi_3UZ0FBE0jEvPnEcp1gRP4vHz              | pi_3UZ0GOE0jEvPnEcp00xJzrxw              |
| Alta y cobro locales (UTC)     | 2026-11-07T03:19:53Z                     | 2026-11-07T03:24:43Z                     | 2026-11-07T03:25:57Z                     |
| Próximo cobro local inicial    | 2026-12-07                               | 2027-02-07                               | 2027-11-07                               |
| Correo enviado_en (UTC)        | 2026-11-07T03:19:57.149Z                 | 2026-11-07T03:24:46.929Z                 | 2026-11-07T03:26:00.466Z                 |

Se comprobó en las tres altas: Invoice paid, billing_reason=subscription_create,
amount_paid=111/122/133, relación factura–suscripción–PaymentIntent correcta y pago succeeded.
Las fechas locales de alta y cobro coinciden con Invoice.status_transitions.paid_at.
Las suscripciones quedaron inicialmente activas; Se conserva una cuota inicial y una
operación por alta. Cada confirmación tiene estado enviado, un intento y una coincidencia
de su referencia en Mailpit. La próxima fecha anual de la tabla es la previsión inicial;
queda anulada después de la cancelación descrita abajo, sin reescribir la historia del alta.

Se acredita la consulta acacia de estas tres facturas iniciales reales y sus relaciones;
no se generaliza la compatibilidad a todas las situaciones futuras de Billing o de endive.
No se atribuye una versión concreta a los eventos de este bloque que no haya sido comunicada.

### Primeras entregas y reentregas de invoice.paid

Se solicitó una reentrega de cada evento original. Se aportaron los registros siguientes,
todos del 2026-11-07, hora local Europe/Madrid (UTC+01:00):

| Modalidad y evento                        | Primera recepción / respuesta | Reentrega / respuesta         |
| ----------------------------------------- | ----------------------------- | ----------------------------- |
| Mensual · evt_1UZ0AYE0jEvPnEcpyqRpQKNJ    | 04:19:54 / 200 a las 04:19:57 | 04:27:07 / 200 a las 04:27:08 |
| Trimestral · evt_1UZ0FEE0jEvPnEcpe5GxUCsZ | 04:24:44 / 200 a las 04:24:46 | 04:27:09 / 200 a las 04:27:09 |
| Anual · evt_1UZ0GQE0jEvPnEcpr4PltHwa      | 04:25:58 / 200 a las 04:26:00 | 04:27:10 / 200 a las 04:27:10 |

Las consultas posteriores del registro previo conservaron una cuota y operación por alta, importes
y fechas originales, el mismo correo enviado con un intento y fecha de envío inalterada,
y una coincidencia de cada referencia en Mailpit. No se crearon otros pagos. Se acredita
idempotencia observada en estas reentregas, no una garantía universal de Stripe o SMTP.

### Cancelación de la suscripción anual tras un alta satisfactoria

Se canceló únicamente sub_1UZ0GNE0jEvPnEcprIex4dBv desde Stripe de pruebas, seleccionando
cancelación inmediata y sin reembolso. Se comunicó que aportó capturas de opciones y resultado.
El evento original customer.subscription.deleted fue evt_1UZ0NwE0jEvPnEcpbCbnlNy7; las líneas
del listener aportadas durante la prueba muestran recepción a las 04:33:44 y HTTP 200 a las 04:33:48
locales del 2026-11-07.

se contrastó:

- Stripe: canceled, livemode=false y canceled_at=ended_at=1794022424.
- Suscripción local 8: cancelada, fecha_proximo_cobro y pasarela_proximo_cobro_en nulas.
- Aportación 34: confirmada, 1,33 €, mismo pago, factura y fecha de cobro.
- Una única factura inicial pagada en Stripe; ninguna factura adicional y amount_refunded=0.
- Confirmación original conservada con un intento y una coincidencia en Mailpit.
- Mensual y trimestral no se cancelaron.

Se abrió el resultado anual; la captura comunicada muestra suscripción cancelada, ausencia
de próximo cobro y aviso de conservación de cuotas cobradas. La cancelación no borra la cuota
confirmada ni autoriza a modificar su resumen histórico.

Este recorrido es **cancelación tras alta pagada satisfactoriamente**. No se presenta como
cancelación después de una cuota fallida, ni como agotamiento real de Smart Retries, ni como
comprobación completa de S13. La configuración de recuperación/cancelación observada en
T076 tampoco sustituye la ejecución de esas secuencias.

### Contraste de T078 y balance real/simulado para T080

T078 pide «altas con periodicidades admitidas, primera factura, reentrega firmada y cancelación
comunicada desde la pasarela de pruebas». Su comprobación exige ausencia de duplicados y
distinguir lo real de ciclos/fallos cubiertos solo con simulación, sin inventar facturas.
Las tres altas, sus primeras facturas y reentregas y la cancelación anual cubren ese bloque;
**T078 queda completada en ese alcance**. Esto no equivale a ejecutar todos sus escenarios
de origen íntegramente con Stripe: se conserva el balance pendiente siguiente.

| Escenario o recorrido                                   | Evidencia real de este bloque                                                    | Límite y seguimiento                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| S01: alta, primera cuota y tres periodicidades          | Tres altas y facturas iniciales, fechas, estado y previsión inicial contrastados | Importes de prueba 1,11/1,22/1,33 €; no se declara una renovación                                                      |
| S02: renovación                                         | No realizada                                                                     | Requiere otra factura real subscription_cycle; existe cobertura simulada en cuotas.test.js                             |
| S03: primer cobro fallido                               | No realizado                                                                     | Las tres altas aquí fueron satisfactorias; la evidencia previa es simulada                                             |
| S04: alta sin cuenta                                    | No acreditada por los datos de este bloque                                       | No se infiere ausencia de cuenta de que el formulario permita invitados; requiere evidencia del recorrido              |
| S05–S06: fallo y reintento del correo de socio          | No realizados aquí                                                               | En estos casos el primer envío fue satisfactorio; Se conservan las pruebas locales, sin atribuir un fallo SMTP real    |
| S07–S08: conflictos de identidad                        | Sin nueva evidencia de Stripe en este bloque                                     | Su balance local y documental se revisará en T080; estas altas no prueban conflictos                                   |
| S09: primer cobro sin retorno/cierre del cliente        | No acreditado para socios                                                        | P21 puntual no acredita automáticamente la activación de un alta de socio en esas condiciones                          |
| S10: fallo de cuota posterior                           | No realizado                                                                     | Requiere ciclo fallido real; cobertura simulada previa, no otra primera factura                                        |
| S11–S12: próxima cuota tras fallo, fecha ausente/pasada | No realizados                                                                    | Las fechas iniciales normales y su anulación por cancelación no sustituyen esas condiciones; cobertura simulada previa |
| S13: cancelación posterior a fallo                      | Solo observada la cancelación tras un alta satisfactoria                         | Falta el fallo previo y la secuencia completa; cobertura simulada de esa secuencia en cuotas.test.js                   |

No se cambia el estado de T080: exige el balance completo de P01–P21/S01–S13, con entradas,
observado y fuentes. Esta tabla aporta únicamente la parte de socios y sus límites.

### Inventario de correos aprovechable para T079/SC-002

En el bloque actual hay **tres referencias nuevas confirmadas y tres correspondencias de
recepción en Mailpit**, una por referencia según las consultas del registro previo. Se conservan tras
reentregas y cancelación. Correo enviado con un intento y una coincidencia no se confunde con
un aviso de fallo o un enlace de vinculación.

| Aportación y referencia                       | Evidencia de confirmación recibida       | Momento y fuente                                                                |
| --------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| 30 · DON-47619c0b-0cb7-4149-9a80-29e2b133829c | Registrada en el bloque puntual anterior | Consulta de Mailpit y apertura visual de Nada en aquella prueba; no reconsultada ahora |
| 31 · DON-868afebb-090a-492e-9966-ab31b6bad6bf | Registrada en P21                        | Consulta de Mailpit en aquella prueba; no reconsultada ahora                           |
| 32 · DON-d929b6c6-a2bf-4c52-97ee-cf74a4897f96 | enviado, un intento, una coincidencia    | Registro, bloque actual y contraste tras la reentrega                               |
| 33 · DON-8de7cf59-b711-4ffe-928c-a839d9345f63 | enviado, un intento, una coincidencia    | Registro, bloque actual y contraste tras la reentrega                               |
| 34 · DON-6bb1aa78-1c3a-46a5-8647-a7bf9a5a2e57 | enviado, un intento, una coincidencia    | Registro, bloque actual, reentrega y cancelación                                    |

Es un inventario acumulado de referencias identificadas y comprobaciones en momentos
distintos, no una auditoría global de todas las aportaciones confirmadas de la base. No se
declara por ello cobertura global de SC-002 ni se afirma inspección visual del contenido de
los tres correos nuevos. La cancelación no elimina la aportación 34 del conjunto confirmado.

**T079 sigue pendiente**: no se cronometró una donación puntual desde la entrada al formulario,
como exige SC-001. Las horas de pago, correo y listener no permiten reconstruir esa duración;
tampoco la duración de un alta de socio la sustituye. Los importes contrastados aportan
evidencia al céntimo para estos casos, sin afirmar todas las comprobaciones de SC-004 o del
conjunto manual aún no revisadas. No se marca T079 ni T080 por extensión.

### Revisión documental y parada

Se conservan las evidencias anteriores y sus límites como evolución. Las actuaciones de
Las observaciones y consultas registradas no se presentan como ejecuciones de esta revisión. Aquí solo
se comprueban rama/HEAD/estado, documentos y formato. No se repiten suites o consultas
externas, ni se ejecutan altas, pagos, cancelaciones, reenvíos, configuración o Git de escritura.
T006, T007, T079 y siguientes, converge y coordinación de 009 permanecen pendientes; Se conserva
la revisión de Rubén sin atribuir aprobación colectiva.

## Segunda medición puntual y cierre T079–T080 · 2026-11-07

Actualización posterior a los bloques anteriores, sobre spec-001 y HEAD inicial
a7dda2b. Se conserva íntegra la [medición 1](medicion-puntual-01.md): 480,836 s,
no satisface SC-001. La [medición 2](medicion-puntual-02.md) es independiente y
registra **61 segundos medidos con cronómetro**, con cronómetro iniciado antes de
abrir el formulario y detenido al ver la confirmación en la aplicación. No se
dispone de t0/t1 ni captura; no se reconstruyen con fechas del pago. Satisface
SC-001 para esa ejecución, sin garantía universal.

Se comunican comprobaciones de solo lectura de la aportación **36**, puntual
de **20,00 €, EUR, fondo general**, referencia
`DON-a8fcdc66-4562-41b4-8133-6864d583f0e0`, UUID
`d7a55893-8401-4dbf-a837-2c70ea09e54a`, PaymentIntent
`pi_3UZ1OfE0jEvPnEcp0c6D19b3`: Checkout complete/paid, livemode=false,
2000 céntimos y referencia coincidente; PaymentIntent succeeded y
amount_received=2000. En PostgreSQL: confirmada, fecha_cobro
2026-11-07T04:38:33Z, una aportación por el pago y una operación.

Correo enviado con un intento, enviado_en 2026-11-07T04:38:35.483Z. El registro previo
identifica una coincidencia Mailpit, mensaje `eEG6FFzV22N4sePVh9nzzp`, cuyo texto
contiene referencia, 20,00 €, 07/11/2026, donación puntual y fondo general.
Su nueva búsqueda conjunta acredita **7/7 confirmaciones recibidas por referencia
para las aportaciones 30–36**, excluyendo semillas, avisos y vínculos. No es una
auditoría global; la fecha persistida de envío no es una hora exacta de recepción.

**T079 completada**, tras contrastar duración, importes y recepción del conjunto
manual delimitado. **T080 completada para el balance de validación**, con la
[matriz de 34 escenarios](matriz-validacion-01.md), G1–G3 acreditadas y
SC-001–SC-004 respaldados según el alcance de sus fuentes. Se conservan las
limitaciones reales y los recorridos de socio que solo cuentan con evidencia
local/simulada; no se declaran por extensión como ejecutados con Stripe.

Las observaciones registradas y consultas del registro previo no se atribuyen a esta revisión,
que es únicamente documental. No se repiten consultas externas, suites, pagos,
envíos o reentregas. No se modifican configuración ni datos. **T081, T006, T007,
converge y coordinación de 009 permanecen pendientes**; no se presenta aprobación
de Rubén ni convergencia. Los apartados anteriores conservan su estado histórico.
