# Preparación de Stripe — compatibilidad de avisos

**Historia**: HU-01 · **Rama**: spec-001 · **Fecha**: 2026-11-07

**Responsable**: Nada · **Revisor**: Rubén (pendiente).

## Estado inicial y perímetro

HEAD 5eb2e1d, con T073–T074 registradas. El único archivo local sin seguimiento era
.claude/launch.json; se conserva, al igual que .env. No se ejecutan pagos, reenvíos de
eventos, cambios de cuenta o configuración. No se consulta ni modifica la base de desarrollo
ni la operación DON-47619c0b-0cb7-4149-9a80-29e2b133829c. Su estado pendiente de 15,75 €,
destino Agua potable y Checkout abierto procede del contexto aportado; no se presenta
como una nueva comprobación de Stripe. No se crea otra operación para sustituirla.

## Decisión y contraste oficial

Se conservan SDK 17.7.0 y cliente con API explícita 2025-02-24.acacia, timeout de 3000 ms
y cero reintentos automáticos. npm ls stripe --depth=0 confirma 17.7.0; el archivo instalado
stripe/cjs/apiVersion.js contiene 2025-02-24.acacia. Los tipos de Invoice del paquete
conservan subscription; el adaptador consulta Invoice con payment_intent expandido.
No se cambian dependencias ni el adaptador común.

La [documentación de versiones](https://docs.stripe.com/api/versioning) identifica
2026-10-28.endive y distingue la versión de las consultas de la de los webhooks. La
[configuración de stripe-node](https://docs.stripe.com/sdks/set-version) permite fijar
apiVersion para las respuestas de recursos. El [objeto Event](https://docs.stripe.com/api/events/object)
conserva la versión con la que se generó data; consultar el recurso por ID es distinto de
recuperar y reinterpretar ese mismo evento. No se modifica api_version ni el cuerpo firmado.

La [consulta actual de Invoice](https://docs.stripe.com/api/invoices/retrieve), cuyo ejemplo
fija Stripe-Version: 2026-10-28.endive, y el [objeto Invoice](https://docs.stripe.com/api/invoices/object)
muestran parent en vez de subscription superior. El [cambio de Basil](https://docs.stripe.com/changelog/basil/2025-03-31/adds-new-parent-field-to-invoicing-objects)
documenta parent.subscription_details.subscription y su discriminador parent.type. Las
URLs de referencia con el parámetro explícito api-version=endive no resultaron accesibles
en la herramienta de consulta; se contrastaron la referencia actual, su ejemplo versionado
y el cambio oficial, sin atribuir al SDK antiguo tipos endive.

Se admite únicamente el sobre de avisos snapshot acacia y 2026-10-28.endive, con los tipos
de evento ya utilizados. Se consumen ID de evento/recurso, tipo, fecha y modo; los datos
financieros proceden de las consultas acacia. Las versiones no enumeradas y los avisos sin
identificador siguen rechazados. Los tipos no utilizados no aplican transiciones.

Para facturas, una consulta canónica preliminar identifica sub:<id>. Se vuelve a consultar
bajo exclusión, fuera de transacción, y se comprueba que la factura y su suscripción siguen
siendo las mismas. El repositorio usa también la factura canónica. Un fallo o discrepancia
produce 503 sin evento procesado; una factura canónica sin suscripción se ignora, sin usar
subscription o parent del evento como sustitutos. Se añade esa consulta preliminar acotada;
la resolución de PaymentIntent sigue siendo la propia del adaptador existente.

Se mantienen firma sobre cuerpo crudo, modo, pertenencia, importes, exclusión por conexión,
transacciones cortas, deduplicación y correo independiente. La documentación y las pruebas
respaldan esta compatibilidad limitada; no demuestran todavía que esta cuenta devuelva
todos los recursos reales esperados bajo acacia. Esa comprobación queda en T076–T078.
Contrato vigente: [pasarela-stripe.md](../contracts/pasarela-stripe.md).

## Validación ejecutada

Desde la raíz: `npm ls stripe --depth=0 --prefix backend`, código 0, stripe@17.7.0.
Desde backend, DATABASE_URL y TEST_DATABASE_URL se seleccionan en memoria para ong_test_hu01,
sin imprimir secretos ni sobrescribir .env. El soporte comprueba base y search_path y crea
y elimina exclusivamente sus esquemas. Stripe y SMTP están simulados; no hay consultas de
red a Stripe. Las firmas usan el SDK y secretos sintéticos.

```powershell
npm test -- src/modulos/donaciones/eventos.test.js src/modulos/donaciones/cuotas.test.js --no-file-parallelism
npm test -- src/modulos/donaciones/eventos.test.js src/modulos/donaciones/cuotas.test.js src/modulos/donaciones/pasarela.test.js --no-file-parallelism
npm test -- src/modulos/donaciones --no-file-parallelism
```

- Antes de implementar: 5 fallos y 46 pruebas aprobadas; se reproducen el rechazo de endive
  y la dependencia incorrecta de subscription en el evento.
- Regresión dirigida tras el cambio: 94 pruebas aprobadas, código 0.
- Regresión completa: 11 archivos y **367 pruebas aprobadas**, código 0, duración 37,97 s.
  Incluye firma de ambas versiones, preservación del evento, versión desconocida, modo
  incompatible, falta de ID, consulta preliminar fallida, factura incompatible, cambio de
  suscripción bajo exclusión, ausencia de suscripción, primera cuota concurrente, avisos de
  factura sin subscription/parent y cancelación endive. Conserva las regresiones existentes
  de dinero, acceso, correo e idempotencia simulada.

Prettier 3.6.2 se comprueba solo en los archivos modificados y este informe; el formato
adicional del repositorio no altera otras reglas. No se ejecuta la suite de otros módulos
ni se utiliza la base de desarrollo. Los informes históricos permanecen intactos.
Comprobaciones finales de formato y `git diff --check`: código 0. Las huellas de .env y
.claude/launch.json coinciden con las iniciales; se conservan los trece informes anteriores
y el índice de Git sigue intacto. Solo cambia la marca de T075.

## Tareas y revisión pendiente

T075 queda completada para comprobación de SDK, configuración y compatibilidad documental
y local. T076–T078 permanecen pendientes. Ready, según el estado aportado del listener,
no acredita recepción ni aceptación de un evento firmado. Falta comprobar el destino,
entrega, respuesta y consultas reales de la cuenta; después, con autorización, continuar
la operación existente y verificar pago, única aportación y recepción efectiva del correo,
y finalmente las pruebas de socios. No se afirma idempotencia real de Stripe con mocks.
T006 y T007 siguen pendientes y 009 continúa provisional. Sin git add, commit, push, merge
o cambio de rama. La compatibilidad queda preparada para revisión.

## Evidencia real posterior — T076 · 2026-11-07

Este apartado actualiza el estado posterior a la preparación anterior, que se conserva
como evidencia histórica. El guía y Nada comunicaron la confirmación del Checkout original
y la recuperación de los dos eventos endive tras arrancar el backend. La primera entrega
había fallado por Connection refused; no era un rechazo financiero. Los dos comandos
stripe events resend terminaron correctamente según el guía. No se dispone de captura de
los códigos HTTP del listener y no se les atribuye un valor concreto.

La revisión documental actual añade comprobaciones propias de solo lectura: con el cliente
acacia se consultaron el Checkout ya existente y su PaymentIntent, ambos en modo de pruebas,
con importe y pertenencia correctos. PostgreSQL conserva los dos eventos procesados sin
incidencia y la aportación original confirmada. Esto aporta evidencia real para recursos
puntuales de esta cuenta; no acredita todavía la forma ni la configuración de suscripciones
y facturas reales. Los detalles, atribución y resultados están en
[validacion-stripe-01.md](validacion-stripe-01.md).

T076 continúa **parcial y sin marcar**: está acreditado el funcionamiento del circuito
puntual, pero falta la comprobación de recuperación/cancelación configuradas que exige su
criterio. El reenvío manual de eventos demuestra recuperación de la entrega; no demuestra
la configuración de recuperación de cuotas. Tampoco se infiere la versión de un endpoint
permanente de la cuenta a partir del listener local. T077 conserva su evidencia parcial;
T078, T006, T007, converge y la coordinación de 009 siguen pendientes.

La repetición de la suite 367/367 sobre ong_test_hu01 fue comunicada por el guía y se
registra aparte de las pruebas reales. En esta revisión no se ejecutó la suite, ni pagos,
reenvíos o cambios de configuración. Se conservan .env, .claude/launch.json y el resto de
los cambios de compatibilidad; no hay acciones de Git de escritura.

## Aclaración posterior del retorno — 2026-11-07

Nada y el guía acreditan el retorno automático del Checkout original a la página de resultado con la misma referencia. El error visible y ECONNREFUSED del frontend correspondieron al backend apagado, no a la ausencia de retorno. Véase la aclaración en [validacion-stripe-01.md](validacion-stripe-01.md). Se conserva el registro anterior. T076 sigue pendiente de comprobar la configuración de recuperación/cancelación de cuotas; T077, de la prueba explícita de cierre del navegador y del cierre de T076. No se ejecutan pagos, reenvíos o pruebas adicionales ni se inventan respuestas HTTP.

## Cierre de configuración de T076 mediante capturas — 2026-11-07

Este apartado completa la comprobación que faltaba y actualiza los estados parciales
anteriores, conservados como evolución. Nada navegó por el panel y aportó tres capturas;
la revisión actual lee sus valores, sin acceso directo adicional al panel ni cambios de
configuración. Las imágenes se conservan sin editar en capturas/.

| Evidencia aportada por Nada                                           | Configuración visible                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Entorno](capturas/t076-01-entorno-pruebas.png)                       | Entorno de prueba, Practica IWEB ONG, Recuperación de ingresos → Reintentos                                                                                                                                              |
| [Política para tarjetas](capturas/t076-02-smart-retries.png)          | Pagos con tarjeta activados; Smart Retries seleccionado; hasta 8 reintentos en 2 semanas; reintentos personalizados sin seleccionar                                                                                      |
| [Acciones tras el fallo](capturas/t076-03-agotamiento-reintentos.png) | Suscripción activa cuando su factura más reciente se ha cobrado; el primer fallo de renovación deja la suscripción como vencida; al fallar todos los reintentos, cancelar la suscripción y dejar la factura como vencida |

Se transcriben las etiquetas visibles, sin deducir de ellas una fecha concreta de próximo
cobro ni un estado de una suscripción particular. La configuración de reintentos y su
acción final se consulta en el panel según la [documentación oficial de Stripe](https://docs.stripe.com/billing/revenue-recovery/smart-retries).
No se usa el valor por defecto publicado por Stripe como prueba del valor de esta cuenta:
la evidencia son las capturas aportadas.

La acción final observada es coherente con HU-01: un fallo por sí solo no cancela, pero una
cancelación posterior comunicada por la pasarela debe reflejarse. El plazo de dos semanas
no sustituye la previsión concreta de Invoice.next_payment_attempt. No se han provocado
fallos, agotado reintentos ni ejecutado una cancelación para comprobar su funcionamiento.

Con esta inspección y las comprobaciones reales de cuenta, modo, versión de los avisos,
firma obligatoria, conectividad y procesamiento ya registradas, **T076 queda completada**
para el listener local de pruebas. No se acredita un endpoint permanente ni se requiere
una captura adicional de códigos HTTP para cerrar este criterio. Esa ausencia sigue
siendo únicamente una limitación documental, sin inventar respuestas.

T077 conserva como único pendiente la prueba explícita de cierre del navegador sin
condicionar el webhook; su dependencia de T076 queda resuelta. T078, T006, T007, converge
y la coordinación de 009 siguen pendientes. No se ejecutan pruebas nuevas, pagos,
reenvíos, cambios de ajustes o acciones de Git de escritura.

## Comprobación posterior de T077: alcance de la reentrega — 2026-11-07

Nada y el guía aportaron evidencia de cierre del navegador y páginas de la aplicación,
ausencia de procesos de los navegadores comprobados, reenvío autorizado de un único evento
original y recepción y aceptación por el listener con HTTP 200, sin duplicados. El guía
contrastó los registros y Mailpit antes y después, todavía con el navegador cerrado;
Nada confirmó después el resultado correcto al reabrir la aplicación. El detalle y la
atribución están en [validacion-stripe-01.md](validacion-stripe-01.md).

T076 sigue completada. La comprobación adicional cubre una **reentrega de un pago ya
confirmado** con navegador cerrado, sin demostrar que la primera confirmación ocurriera
en esas condiciones. Aunque la formulación de T077 sobre el cierre es general, su origen
P21 exige una aportación aún no confirmada y la llegada posterior de la notificación;
quickstart concreta el cierre antes del pago. Por ello T077 sigue parcial, pendiente de
acreditar ese recorrido real, sin modificar el criterio ni volver a pagar la operación
original. Los estados anteriores se conservan como evolución documental.

La respuesta 200 está observada en las líneas nuevas aportadas por Nada y se limita a
esta reentrega. No se atribuye a los reenvíos anteriores sin captura HTTP. Se conserva el
fallo inicial por backend apagado y su recuperación, además de pago, correo, retorno y
acceso verificado ya acreditados. No se realizan nuevos pagos, reenvíos o ajustes en esta
revisión documental. T078 y siguientes y las demás revisiones pendientes no cambian.

## Preparación documental de la prueba adicional P21 — 2026-11-07

Tras revisión del procedimiento, se aclara [quickstart.md](../quickstart.md#procedimiento-adicional-p21--preparación-revisada-sin-ejecutar):
el escenario puntual 21 de spec.md exige una aportación aún sin confirmar localmente al
cerrar el navegador y la llegada posterior de la notificación. La expresión previa de la
guía «antes del pago» se sustituye por el orden verificable: pago correcto en Stripe,
aportación local pendiente acreditada, cierre y primera confirmación local tras el webhook.
No se modifica el criterio funcional ni se convierte en primera confirmación la reentrega
ya observada. La nueva operación prevista de 1,23 € es independiente de la donación de 15,75 €.

La preparación prescribe el mismo valor STRIPE_SECRET_KEY de .env mediante --api-key en
ambos listeners y events resend, sin depender del login de la CLI. Se excluye del proceso
hijo una posible STRIPE_API_KEY heredada, que prevalecería sobre ese argumento según la
ayuda instalada. La salida de cada listener se captura; su secreto se compara en memoria
con STRIPE_WEBHOOK_SECRET y solo se comunica coincidencia o desajuste. Un desajuste o una
comparación no fiable detienen la prueba, sin actualizar .env ni eludir la firma del backend.

Se conservan los controles de primera transición con navegador cerrado, reentrega sin
duplicados, recepción en Mailpit y consulta autorizada posterior. Node 22.20.0 y la
disponibilidad de node:util.parseEnv se comprobaron localmente; la lectura de secretos,
los arranques/cambios de listener y la comprobación real de su secreto no se ejecutan en
esta fase. No se crea ninguna operación, paga, reenvía o cambia configuración. T077 sigue
parcial y sin marcar; T076 completada y el resto de pendientes conservan su estado.

## Evidencia posterior de ejecución y cierre de T077/P21 — 2026-11-07

La prueba adicional preparada se ejecutó, según las evidencias comunicadas por Nada y
el guía, con la aportación 31, operación 4, referencia DON-868afebb-090a-492e-9966-ab31b6bad6bf,
importe 1,23 € EUR y fondo general. La donación anterior de 15,75 € permanece independiente
y conserva su relato de fallo inicial por backend apagado, recuperación y reentrega.

El listener observó sin forwarding durante el pago único de Nada. El guía confirmó por
GET de Stripe el pago de pruebas y por lecturas de PostgreSQL el estado local pendiente,
sin fecha/pago local, correo o evento, antes del cierre y justo antes de la primera entrega
a las 02:53:15.438Z. Se cerraron las páginas de aplicación/Checkout y todas las pestañas del
integrado, incluida Mailpit. Firefox mantuvo páginas ajenas: no se afirma que sus procesos
estuvieran terminados. Backend y demás servicios siguieron activos.

Con la misma clave de .env, el secreto del listener con forwarding coincidió con el
configurado, según la comprobación del guía sin exponer valores. Se reenvió únicamente el
evento auténtico nuevo evt_3UYzXwE0jEvPnEcp1ECh1dn8, payment_intent.succeeded, API endive.
Nada aportó recepción a las 03:53:16 y respuesta 200 a las 03:53:18 locales. Sin reabrir
páginas, el guía comprobó a las 02:53:20.900Z la primera transición a confirmada, unicidad
local, evento procesado y correo enviado con un intento y recibido en Mailpit. Tras otra
entrega del mismo evento con 200 a las 03:56:10 locales, los recuentos y el envío se conservaron.
Nada reabrió el resultado con cuenta vinculada y confirmó sus datos.

El [cierre detallado](validacion-stripe-01.md#cierre-final-de-t077-primera-confirmación-de-la-prueba-adicional-p21--2026-11-07)
contrasta el escenario 21 y el procedimiento aclarado; **T077 se marca completada** con
T076 ya resuelta. Ahora se acredita una primera transición desde pendiente, distinta de
la reentrega sobre la aportación anterior ya confirmada. Los apartados de preparación y
estados parciales anteriores se conservan como evolución y no se presentan como el balance vigente.

No se afirma inspección visual del nuevo correo, cierre completo de Firefox o duración
inferior a tres minutos. La recepción del correo se acredita por Mailpit y las consultas
del guía. T078 y siguientes, T006, T007, converge y coordinación de 009 siguen pendientes.
Esta revisión solo actualiza documentación: no ejecuta suites, consultas externas, pagos,
reenvíos, configuración o acciones de Git de escritura; conserva secretos e históricos.

## Evidencia posterior de socios — T078 · 2026-11-07

Nada realizó las altas mensual de 1,11 €, trimestral de 1,22 € y anual de 1,33 €, EUR y fondo
general, en Stripe de pruebas. El guía contrastó con PostgreSQL, consultas Stripe acacia y
Mailpit las facturas iniciales pagadas, relaciones correctas, fechas de alta/cobro iguales
a paid_at, suscripciones inicialmente activas y una cuota, operación y confirmación por alta.
Nada aportó primeras entregas y reentregas de invoice.paid con HTTP 200. Los recuentos, fechas
y envíos se conservaron tras las reentregas. Estos casos aportan evidencia de recursos reales
de suscripciones y facturas iniciales con el adaptador acacia, sin generalizar a todos los
recorridos de Billing o a la estructura completa de eventos endive.

Nada canceló solo la anual inmediatamente y sin reembolso desde el panel de pruebas.
El customer.subscription.deleted obtuvo 200 según las líneas aportadas; el guía contrastó
canceled en Stripe, cancelada localmente, previsión nula, aportación confirmada intacta,
ausencia de factura adicional, amount_refunded=0 y confirmación original conservada. Nada
comprobó el resultado anual. Mensual y trimestral no se cancelaron.

El [bloque detallado](validacion-stripe-01.md#bloque-real-de-socios--cierre-de-t078-y-evidencia-parcial-de-t079t080--2026-11-07)
registra identificadores, horas, fechas, fuentes y límites. **T078 queda completada para
altas, primeras facturas, reentregas y cancelación comunicada**, distinguiendo esos resultados
de ciclos y fallos simulados, tal como exige su comprobación. No se declara ejecución real
de renovación, primer fallo, fallos posteriores, alta sin cuenta o activación sin retorno;
la cancelación tras alta satisfactoria no equivale a S13 completo después de un fallo.

El inventario de tres nuevas confirmaciones recibidas en Mailpit se incorpora a la evidencia
parcial de T079–T080, sin atribuir inspección visual de sus contenidos ni cobertura global de
SC-002. T079 sigue pendiente por falta de medición de la donación puntual de SC-001, y T080
por el balance completo de 34 escenarios. T006, T007, converge y coordinación de 009 siguen
pendientes. Los estados previos de este informe se conservan como evolución.

Esta revisión es documental: no repite las acciones de Nada ni las consultas del guía, no
ejecuta suites ni acciones externas y no modifica secretos, código o configuración. No se
realizan acciones de Git de escritura; la rama y los commits anteriores se conservan.
