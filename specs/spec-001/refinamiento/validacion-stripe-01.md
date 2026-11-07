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

| Tarea y criterio exacto                                               | Cobertura                                             | Evidencia y limitación                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T076: cuenta y credenciales de pruebas                                | Cubierto para el circuito puntual                     | GET actuales de los recursos originales, en modo de pruebas; sin exponer claves                                                                                                                                                          |
| T076: versión y firma/eventos                                         | Cubierto para los avisos reenviados al listener local | El guía comunica endive; ruta con firma obligatoria y ambos eventos procesados. No se atribuye una versión a un endpoint permanente no inspeccionado                                                                                     |
| T076: conectividad y destino                                          | Fallo inicial y recuperación acreditados              | Connection refused comunicado; comandos de reenvío correctos y persistencia posterior. Sin captura de códigos HTTP                                                                                                                       |
| T076: recuperación/cancelación configuradas                           | Cubierto mediante capturas de Nada                    | Smart Retries activado, hasta 8 reintentos en 2 semanas; al agotarlos, cancelar la suscripción y dejar la factura como vencida. Véase el cierre posterior de T076                                                                        |
| T077: pago de tarjeta alojado en Stripe, importe, moneda y referencia | Cubierto                                              | Snapshot card/eur/1575, Checkout paid y PaymentIntent succeeded con pertenencia correcta                                                                                                                                                 |
| T077: único registro y mensaje recibido en Mailpit                    | Cubierto para esta ejecución                          | Unicidad local actual; un intento de correo; búsqueda con una coincidencia y revisión visual de Nada                                                                                                                                     |
| T077: resultado y privacidad                                          | Cubierto                                              | Nada observa denegación invitada y resultado confirmado tras vincular la cuenta; consultas actuales corroboran el vínculo                                                                                                                |
| T077: retorno desde Checkout                                          | Cubierto; observado por Nada y el guía                | Retorno automático a /donar/resultado con la referencia original; captura del error y registro de la página y ECONNREFUSED en el frontend por backend apagado.                                                                           |
| T077: cierre del navegador sin condicionar el webhook                 | Acreditado para una reentrega; P21 real parcial       | Nada confirma el cierre; guía comprueba ausencia de procesos y unicidad antes/después; líneas nuevas del listener muestran recepción y HTTP 200. La aportación ya estaba confirmada, por lo que no acredita la primera transición de P21 |

**Balance vigente tras la comprobación de reentrega: T076 completada y T077 parcial.**
Se acredita recepción y aceptación de una reentrega con el navegador cerrado, manteniendo
la unicidad. El escenario P21 de origen exige notificar después del cierre una aportación
aún no confirmada; ese recorrido real no queda demostrado por una reentrega posterior.
No se modifica el criterio ni se atribuye esa condición a la primera confirmación. El pago,
correo, retorno y consulta tras vínculo ya están acreditados y no se repiten.

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
