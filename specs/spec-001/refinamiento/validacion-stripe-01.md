# Validación real de Stripe — donación puntual

**Historia**: HU-01 · **Rama**: spec-001 · **Fecha**: 2026-11-07

**Responsable**: Nada · **Revisor**: Rubén (pendiente).

## Alcance y procedencia

Registro documental de T076–T077. Estado inicial comprobado: spec-001, HEAD 5eb2e1d,
con T073–T074 ya registradas y los cambios locales de compatibilidad conservados. Se
mantienen .env y .claude/launch.json. Este encargo no ejecuta pagos, reenvíos, cambios de
configuración, commits o cambios de rama.

Se distinguen tres fuentes: observaciones de Nada en navegador y correo; actuaciones y
consultas comunicadas por el chat guía; y consultas actuales de solo lectura de esta
revisión. Las afirmaciones del guía se conservan con esa atribución, sin presentarlas
como comandos ejecutados aquí.

## Operación y secuencia real comunicada

| Dato                      | Valor                                    |
| ------------------------- | ---------------------------------------- |
| Referencia original       | DON-47619c0b-0cb7-4149-9a80-29e2b133829c |
| Aportación                | 30                                       |
| Importe y destino         | 15,75 € · Agua potable                   |
| PaymentIntent             | pi_3UYy99E0jEvPnEcp0mfeZQbE              |
| Fecha de cobro persistida | 2026-11-07T01:10:19.000Z                 |

1. Según el guía y Nada, Stripe confirmó el mismo Checkout en modo de pruebas: complete,
   paid, 1575 céntimos, EUR. No se sustituyó la operación ni se repitió el pago.
2. El backend estaba apagado cuando se intentó la primera entrega. El listener mostró
   Connection refused y el frontend mostró errores de conexión. Fue una indisponibilidad
   de la aplicación; no un rechazo del pago por Stripe.
3. Tras arrancar el backend, el guía ejecutó stripe events resend para los eventos
   originales, utilizando internamente la clave local. Ambos comandos terminaron
   correctamente y la persistencia posterior refleja procesamiento sin incidencia.
   No hay captura de los códigos HTTP del reenvío; no se infiere ni registra uno concreto.
4. El guía observó correo enviado con un intento y encontró un único mensaje de esa
   referencia en Mailpit. Nada lo abrió y comprobó importe, destino y referencia.
5. En el navegador de Nada no se transfirió el permiso invitado de la sesión original
   de Claude. Nada observó el aviso genérico de falta de permiso, sin que esto implicara
   que el pago hubiera fallado.
6. Nada creó la cuenta de validación, solicitó el vínculo, recibió su correo en Mailpit,
   abrió el enlace y confirmó. Observó «vinculación completada». No se reproduce el token
   ni su enlace. Con esa cuenta y sesión, consultó la referencia original y vio estado
   confirmado, 15,75 €, Agua potable y correo enviado.

| Evento original              | Tipo                       | Versión comunicada por el guía | Estado persistido contrastado |
| ---------------------------- | -------------------------- | ------------------------------ | ----------------------------- |
| evt_3UYy99E0jEvPnEcp0NoohXWh | payment_intent.succeeded   | 2026-10-28.endive              | procesado; error_codigo null  |
| evt_1UYy9AE0jEvPnEcpp8aea5Kd | checkout.session.completed | 2026-10-28.endive              | procesado; error_codigo null  |

La tabla eventos_pasarela no conserva api_version: la versión se atribuye a la comprobación
del guía, no a una lectura de esa columna. La ruta actual verifica la firma sobre el cuerpo
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
| T076: versión y firma/eventos                                         | Cubierto para los avisos reenviados al listener local | El guía comunica endive; ruta con firma obligatoria y ambos eventos procesados. No se atribuye una versión a un endpoint permanente no inspeccionado                                                                  |
| T076: conectividad y destino                                          | Fallo inicial y recuperación acreditados              | Connection refused comunicado; comandos de reenvío correctos y persistencia posterior. Sin captura de códigos HTTP                                                                                                    |
| T076: recuperación/cancelación configuradas                           | Cubierto mediante capturas de Nada                    | Smart Retries activado, hasta 8 reintentos en 2 semanas; al agotarlos, cancelar la suscripción y dejar la factura como vencida. Véase el cierre posterior de T076                                                     |
| T077: pago de tarjeta alojado en Stripe, importe, moneda y referencia | Cubierto                                              | Snapshot card/eur/1575, Checkout paid y PaymentIntent succeeded con pertenencia correcta                                                                                                                              |
| T077: único registro y mensaje recibido en Mailpit                    | Cubierto para esta ejecución                          | Unicidad local actual; un intento de correo; búsqueda con una coincidencia y revisión visual de Nada                                                                                                                  |
| T077: resultado y privacidad                                          | Cubierto                                              | Nada observa denegación invitada y resultado confirmado tras vincular la cuenta; consultas actuales corroboran el vínculo                                                                                             |
| T077: retorno desde Checkout                                          | Cubierto; observado por Nada y el guía                | Retorno automático a /donar/resultado con la referencia original; captura del error y registro de la página y ECONNREFUSED en el frontend por backend apagado.                                                        |
| T077: cierre del navegador sin condicionar el webhook                 | Cubierto por la prueba adicional P21 de 1,23 €        | Aportación 31 pendiente antes del cierre y antes de la primera entrega; confirmación con páginas de aplicación/Checkout cerradas, correo en Mailpit y reentrega sin duplicados; atribución y horas en el cierre final |

**Balance vigente tras la prueba adicional P21: T076 y T077 completadas en su alcance.**
La aportación 31 de 1,23 € acredita ahora la primera transición local desde pendiente,
con las páginas de aplicación y Checkout cerradas, y la reentrega del mismo evento sin
duplicados. La prueba anterior de 15,75 € conserva su alcance propio: su cierre de navegador
solo acreditaba una reentrega posterior. El cierre final y sus limitaciones se documentan
más adelante; los relatos parciales anteriores se conservan como evolución.

T078 y las demás tareas no se marcan por extensión. T006, T007, converge y coordinación
de 009 siguen pendientes. Se conserva la revisión de Rubén como pendiente.

## Regresión simulada, separada de la evidencia real

El guía comunicó haber revisado la compatibilidad y repetido la suite completa sobre
ong_test_hu01: 367/367 aprobadas. Es una observación del guía, distinta tanto de su reenvío
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

Comprobación documental final: Prettier y git diff --check correctos. El contraste de
huellas conserva .env, .claude/launch.json, la compatibilidad y todos los demás informes.
El contenido previo de preparacion-stripe-01.md permanece íntegro; solo se añade el
apartado posterior. Las marcas de T076–T078 y de las demás tareas pendientes no cambian.
HEAD sigue en 5eb2e1d y el índice de Git está intacto.

## Aclaración posterior: retorno observado — 2026-11-07

Nada y el guía observaron el retorno automático después de pulsar «Pagar» en el Checkout original de 15,75 € a `/donar/resultado?ref=DON-47619c0b-0cb7-4149-9a80-29e2b133829c`. La captura compartida mostraba esa dirección y «Ha ocurrido un error inesperado». La terminal del frontend registró la página de resultado y errores ECONNREFUSED al consultar el backend, que estaba apagado. Se acredita el retorno y se distingue del fallo posterior de conexión; esta evidencia no procede de una nueva ejecución documental.

Quedan pendientes la configuración de recuperación/cancelación de cuotas (T076) y la prueba expresa de cierre del navegador sin condicionar el webhook, además de la dependencia de T076 (T077). La ausencia de captura de códigos HTTP del reenvío es una limitación del registro, no un criterio adicional pendiente. Se conservan los hechos y comprobaciones anteriores; no se repiten pagos, reenvíos ni pruebas.

## Actualización posterior: configuración de T076 acreditada — 2026-11-07

Nada aportó capturas del mismo entorno de pruebas de Practica IWEB ONG. Muestran
Smart Retries activado, hasta ocho reintentos en dos semanas; el primer fallo de renovación
deja la suscripción como vencida. Al agotarse los reintentos está seleccionado cancelar la
suscripción y dejar la factura como vencida. La lectura procede de las imágenes aportadas,
no de una nueva consulta directa al panel por el agente. Las capturas y la transcripción
completa se conservan en el [cierre de preparación](preparacion-stripe-01.md#cierre-de-configuración-de-t076-mediante-capturas--2026-11-07).

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
actuaciones que se describen a continuación fueron realizadas por Nada y el guía; esta
revisión registra y contrasta sus evidencias, sin ejecutar pagos, reenvíos o consultas
adicionales a Stripe o a la base de datos.

### Procedimiento y atribución

1. Nada confirmó que cerró el navegador y las páginas de la aplicación, manteniendo Docker,
   backend y stripe listen activos. El guía comunicó que no encontró procesos Firefox,
   Chrome, Edge, Brave u Opera. La revisión documental no ejecutó esa inspección de procesos.
2. Antes del reenvío, el guía verificó por consultas de solo lectura la aportación 30
   confirmada, referencia DON-47619c0b-0cb7-4149-9a80-29e2b133829c, importe 15,75 € y
   PaymentIntent pi_3UYy99E0jEvPnEcp0mfeZQbE. Había una aportación para esa referencia y pago,
   una operación asociada, confirmación enviada con un intento y una coincidencia en Mailpit.
3. Con el navegador cerrado y autorización de Nada, el guía solicitó mediante stripe events
   resend únicamente el evento original evt_3UYy99E0jEvPnEcp0NoohXWh. El comando terminó
   correctamente, según el guía. No se creó una operación, evento sintético o pago.
4. Nada aportó las siguientes líneas nuevas del listener, en hora local. Se transcriben
   como evidencia comunicada por Nada, sin presentarlas como observación directa del agente:

```text
2026-11-07 03:03:55 --> payment_intent.succeeded [evt_3UYy99E0jEvPnEcp0NoohXWh]
2026-11-07 03:03:56 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYy99E0jEvPnEcp0NoohXWh]
```

El guía registró la hora del comando como 2026-11-07T02:03:55.668Z, coherente con la hora
local de las líneas y el desfase +01:00 de Europe/Madrid en esa fecha. La respuesta 200 se
atribuye **solo a esta reentrega**. No completa retrospectivamente los códigos HTTP que no
se capturaron en la recuperación anterior ni borra el Connection refused inicial.

5. Antes de reabrir el navegador, el guía repitió las consultas de solo lectura. Comunicó
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
Las consultas del guía y las líneas de Nada no se presentan como pruebas ejecutadas aquí.
No se repiten suites, pagos, reenvíos, cambios de configuración ni acciones de Git de escritura.

## Aclaración posterior del procedimiento P21 — 2026-11-07

Se contrasta de nuevo el escenario puntual 21 y se conserva spec.md intacto. La indicación
«cerrar antes del pago» citada en el contraste anterior correspondía al texto de quickstart
en aquella revisión. El [procedimiento vigente](../quickstart.md#procedimiento-adicional-p21--preparación-revisada-sin-ejecutar)
aclara ahora que Nada completará el pago en Stripe con la entrega retenida; deberá constar
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
T077 continúa parcial y sin marcar, y las demás tareas no se completan por extensión.

## Cierre final de T077: primera confirmación de la prueba adicional P21 — 2026-11-07

Este apartado registra la ejecución posterior del procedimiento aclarado en
[quickstart.md](../quickstart.md#procedimiento-adicional-p21--preparación-revisada-sin-ejecutar).
La preparación descrita allí no era evidencia de ejecución; los resultados reales son los
comunicados por Nada y el guía que se recogen a continuación. No se modifica spec.md ni la
operación anterior de 15,75 €, y se conservan sus fallos, recuperación y reentregas históricas.

### Identificación independiente

| Dato                                  | Prueba adicional P21                                    |
| ------------------------------------- | ------------------------------------------------------- |
| Aportación / operación                | 31 / 4                                                  |
| Referencia                            | DON-868afebb-090a-492e-9966-ab31b6bad6bf                |
| UUID de solicitud                     | 8d26aeaa-1cfb-4f1d-9146-a41beea14e02                    |
| Importe, moneda y destino             | 1,23 € · EUR · fondo general                            |
| PaymentIntent                         | pi_3UYzXwE0jEvPnEcp18Nr4OIV                             |
| Evento auténtico                      | evt_3UYzXwE0jEvPnEcp1ECh1dn8 · payment_intent.succeeded |
| API del evento comunicada por el guía | 2026-10-28.endive                                       |

### Secuencia observada y atribución

1. Nada creó la nueva operación mediante el formulario real y pagó una sola vez en
   Checkout de pruebas. El guía mantuvo un listener de observación sin forwarding con
   la misma clave de .env. Su GET de Stripe confirmó Checkout complete/paid, 123 céntimos,
   EUR, livemode=false y referencia coincidente. No se reutilizó el pago de 15,75 €.
2. El guía comprobó por lectura de PostgreSQL, antes del cierre, aportación pendiente,
   fecha_cobro y pago local nulos, y ausencia de correo y evento de esa operación. Nada
   observó el resultado pendiente en pantalla. Se distingue pago completado en Stripe
   de confirmación local, todavía no producida.
3. Nada cerró las páginas de aplicación y Checkout. El guía comprobó con la herramienta de
   navegador que el integrado no tenía pestañas abiertas y cerró también la única pestaña
   restante de Mailpit. Firefox conservaba otras páginas ajenas; Nada confirmó que no
   quedaban páginas de la aplicación en Firefox. **No se afirma cierre total de Firefox ni
   ausencia de todos sus procesos.** El cliente de la aplicación permaneció cerrado durante
   la primera confirmación y las comprobaciones posteriores indicadas.
4. Se activó el listener con forwarding y la misma clave de .env. Según la comprobación
   del guía, su secreto coincidía con el configurado, sin exponer valores. Backend y demás
   servicios continuaron activos. No se desactivó la verificación de firma.
5. Justo antes de reenviar únicamente el evento auténtico nuevo, a las
   **2026-11-07T02:53:15.438Z**, el guía verificó de nuevo que la aportación seguía pendiente,
   sin fecha de cobro, pago local, correo ni evento de esa operación. Esta comprobación
   acredita que no había adelantado la confirmación otra entrega.

Nada aportó estas líneas de la primera entrega al backend, en hora local Europe/Madrid:

```text
2026-11-07 03:53:16 --> payment_intent.succeeded [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
2026-11-07 03:53:18 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
```

6. Sin reabrir páginas, el guía comprobó a las **2026-11-07T02:53:20.900Z**:

| Comprobación del guía tras la primera entrega | Resultado comunicado                                     |
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

7. El guía reenvió una vez el **mismo evento**, sin otro pago. Nada aportó:

```text
2026-11-07 03:56:10 --> payment_intent.succeeded [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
2026-11-07 03:56:10 <-- [200] POST http://localhost:3000/api/pasarela/webhook [evt_3UYzXwE0jEvPnEcp1ECh1dn8]
```

Las consultas posteriores del guía conservaron una aportación, una operación, correo
enviado con un intento, la misma fecha de envío y una coincidencia en Mailpit. No se
interpreta el segundo 200 como un nuevo cobro ni como otro correo. No se atribuye a esta
comprobación una garantía universal de entrega física única del correo.

8. Nada reabrió el resultado con su cuenta vinculada y comprobó visualmente: confirmada,
   1,23 €, fondo general y correo enviado. La recepción del nuevo mensaje queda acreditada
   por Mailpit y las consultas del guía; **no consta inspección visual del contenido de
   ese nuevo correo**. La apertura visual del correo anterior de 15,75 € sigue registrada
   únicamente para aquella operación.

### Contraste final y límites del cierre

| Criterio de T077/P21                                      | Evidencia que lo cubre                                                                                                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pago de pruebas correcto y aportación local aún pendiente | Formulario y pago de Nada; GET de Stripe del guía; lecturas locales antes del cierre y justo antes de la entrega; pantalla pendiente observada por Nada                            |
| Primera confirmación posterior al cierre del cliente      | Páginas de aplicación/Checkout cerradas, integrado sin pestañas y Firefox solo con páginas ajenas; primera entrega con 200 y transición pendiente → confirmada sin reabrir páginas |
| Reentrega válida sin duplicados                           | Mismo evento entregado otra vez con 200; recuentos y envío conservados según consultas del guía                                                                                    |
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
estado, Mailpit y control de entrega proceden del guía según el encargo. Las comprobaciones
propias de esta revisión se limitan a rama/HEAD/estado local, lectura y contraste de los
documentos y revisión de formato y alcance. No se repiten suites ni consultas externas,
pagos, reenvíos o cambios de configuración. El estado inicial era spec-001, HEAD 789e154,
con los tres documentos de preparación modificados y .claude/launch.json sin seguimiento.
