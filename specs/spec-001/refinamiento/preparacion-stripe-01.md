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
