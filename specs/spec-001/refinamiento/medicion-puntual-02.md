# Medición puntual de T079 — ejecución 2 y balance T079–T080

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Registro:** 2026-11-07 · **Historia:** HU-01 · **Rama:** spec-001.

**Responsable:** Nada · **Revisor:** Rubén.

## Procedencia y medición

Se midió con cronómetro una duración de **1 minuto y 1 segundo
(61 segundos)**. El cronómetro comenzó antes de abrir el formulario y terminó al
ver la confirmación en la aplicación, siguiendo el procedimiento preparado.
Por tanto, esta ejecución cumple el límite de **menos de 180 segundos** de SC-001.
El comienzo anterior a la apertura no descuenta el acceso al formulario.

No se dispone de horas t0/t1 ni de una captura del cronómetro. No se inventan ni
se reconstruye la duración con las fechas de Stripe, PostgreSQL o correo. Es una
observación visual, no una medición realizada durante esta revisión documental.
Los 61 segundos acreditan esta ejecución, no una garantía universal de rendimiento.

La [ejecución 1](medicion-puntual-01.md), aportación 35, permanece íntegra:
**480,836 segundos, no cumple SC-001**, con todas sus esperas e incidencias.
La ejecución 2 es independiente; no sustituye, reinicia, corrige ni promedia
la primera medición.

## Operación y comprobaciones comunicadas en el registro de ejecución

Las consultas siguientes fueron realizadas en solo lectura sobre
PostgreSQL, Stripe y Mailpit. No se repiten en este registro.

| Dato                         | Evidencia comunicada                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Aportación                   | 36                                                                                                                            |
| Referencia                   | DON-a8fcdc66-4562-41b4-8133-6864d583f0e0                                                                                      |
| UUID                         | d7a55893-8401-4dbf-a837-2c70ea09e54a                                                                                          |
| Modalidad, importe y destino | Puntual, 20,00 €, EUR, fondo general                                                                                          |
| PaymentIntent                | pi_3UZ1OfE0jEvPnEcp0c6D19b3                                                                                                   |
| Stripe                       | Checkout complete/paid; livemode=false; 2000 céntimos; referencia coincidente. PaymentIntent succeeded y amount_received=2000 |
| PostgreSQL                   | Confirmada; fecha_cobro 2026-11-07T04:38:33Z; una aportación por ese pago y una operación                                     |
| Correo persistido            | Enviado, un intento; enviado_en 2026-11-07T04:38:35.483Z                                                                      |
| Recepción Mailpit            | Una coincidencia por referencia; mensaje eEG6FFzV22N4sePVh9nzzp                                                               |
| Texto del mensaje            | Referencia correcta, 20,00 €, 07/11/2026, donación puntual y fondo general                                                    |

La fecha de envío persistida no se presenta como hora exacta de recepción ni como
fin del cronómetro. No se atribuyen a esta ejecución capturas, códigos HTTP del
listener, horarios de inicio/fin o cotejos visuales adicionales no comunicados.

## Conjunto delimitado de confirmaciones recibidas

Se registra una nueva búsqueda conjunta por las siete referencias de las
aportaciones **30–36**, con **una confirmación recibida por cada referencia: 7/7**.
El inventario por referencia se conserva en la [matriz vigente](matriz-validacion-01.md).
La aportación 34 continúa incluida aunque su suscripción se cancelara: su cuota
inicial permanece confirmada.

Se excluyen semillas, avisos de fallo y correos de vinculación. Los fallos SMTP
simulados de G1–G3 no son mensajes recibidos ni aportaciones de este conjunto.
El 7/7 acredita SC-002 para el conjunto manual validado de T079, sin correos de
confirmación pendientes en ese conjunto; no constituye una auditoría global de
todas las filas o mensajes del entorno. No se repiten sus pagos ni envíos.

## Contraste de T079 y SC-001–SC-004

| Criterio | Evidencia y alcance                                                                                                                                                                                                                                      | Resultado para el balance                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SC-001   | Tiempo medido con cronómetro desde antes de abrir el formulario hasta confirmación en la aplicación: 61 s. La ejecución 1 fallida se conserva separadamente.                                                                                            | Satisfecho en la ejecución 2, con la procedencia y limitaciones indicadas.                                                                                         |
| SC-002   | Registro de comprobación: 7/7 referencias confirmadas de 30–36 con recepción en Mailpit; mensaje y texto de 36 identificados. No basta el estado enviado ni un aviso de pantalla.                                                                                            | Satisfecho en el conjunto manual delimitado; sin extrapolación global.                                                                                             |
| SC-003   | [Validación local](validacion-local-01.md), «Datos persistidos, sesión y registros (T074)» y A9 de la matriz: Checkout alojado, instantáneas sin tarjeta, esquema/sesión revisados y proyecciones del adaptador sin datos de tarjeta.                   | Evidencia previa conservada. No se repite la inspección ni se afirma una auditoría nueva. Las observaciones sobre registros comunes siguen para revisión de Rubén. |
| SC-004   | R1/R3 de la matriz: importes visibles comprobados visualmente y pagos contrastados en el registro de ejecución. En 36, se contrasta EUR/2000 céntimos, importe local 20,00 € y mismo importe en el texto recibido. A1/A8/A9 cubren conversión, resumen y proyecciones. | Coincidencia al céntimo respaldada por las evidencias anteriores y el nuevo contraste. No se inventa una captura o comparación visual adicional de 36.             |

**T079 completada:** T078 ya estaba completada; existe duración satisfactoria
observada, contraste de importes y recepción para todas las referencias del
conjunto manual validado. P08–P10, S05 y S06 se apoyan además en sus evidencias
locales ya identificadas; no se fuerzan nuevos fallos en las operaciones reales.

## Contraste de T080

Se revisa la [matriz única](matriz-validacion-01.md) de **P01–P21 y S01–S13**,
con criterio/fuente, evidencia, resultado, límites y comprobación adicional por fila.
No se cambian requisitos ni se toma una referencia a la matriz como prueba aislada:
se conserva su enlace a los informes y aserciones identificables.

- G1/P05: rechazo, motivo/reintento y retorno cancel_url sin transición financiera.
- G2/P11/P16: ambas entradas al vínculo sin envío automático y tres rechazos de
  identidad con cuenta vinculada, sin sobrescritura ni acceso a Stripe.
- G3/P08/P10/S05: avisos de correo en puntual y socio activo, segundo fallo HTTP,
  resumen y opción de repetir conservados, sin nuevo cobro ni éxito falso.

Estos huecos se cerraron en la [validación G1–G3](validacion-local-g1-g3-01.md),
con 17/17 pruebas dirigidas y observación del navegador contrastada con PostgreSQL.
No se repiten aquí. Los otros 28 escenarios conservan las fuentes y límites de
la matriz; la medición 2 completa el pendiente de SC-001 del balance.

**T080 completada para el balance de validación:** T079 queda satisfecha y los
34 escenarios disponen de evidencia en su alcance declarado, junto al contraste
de SC-001–SC-004. Se mantienen explícitos los recorridos sin prueba real de Stripe:
renovación, primer cobro fallido, fallos posteriores, alta de socio sin cuenta,
primer cobro de socio sin retorno y cancelación posterior a un fallo. Sus
comprobaciones locales/simuladas no se convierten en integración real ni obligan
por defecto a repetir pagos. La cancelación anual tras alta pagada no se usa
como demostración real de S13 después de un fallo.

Este cierre no acredita convergencia ni aprobación de Rubén. **T081, T006, T007,
converge y coordinación de 009 permanecen pendientes.**

## Alcance de esta revisión documental

Se comprueban rama, HEAD inicial a7dda2b, estado y documentación local. Al comenzar,
se conserva `.env` y
los históricos. Las observaciones registradas y consultas del registro previo se registran como
fuentes comunicadas, sin presentarlas como ejecuciones propias de esta revisión.
No se realizan nuevas consultas externas, pruebas funcionales, pagos, reenvíos,
cambios de configuración o escrituras de Git.
