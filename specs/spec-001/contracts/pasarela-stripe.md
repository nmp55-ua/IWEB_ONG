# Contrato de pasarela y reconciliación — HU-01

**Responsable**: Nada · **Revisor**: Rubén · **Fecha**: 2026-11-06  
**Estado**: Diseño P-01/P-02 definido en esta rama; revisión de Rubén pendiente. P-05 es
preparación del entorno antes de pruebas reales; integración sin ejecutar.

## Versión y perímetro

Referencia: SDK fijado en lockfile **17.7.0**, API **2025-02-24.acacia**. El paquete no está
instalado en este entorno. Tanto el cliente como el endpoint deben usar esa versión antes
de probar los contratos. Se conserva `backend/src/servicios-comunes/pasarela.js` como único
importador de Stripe. El módulo de donaciones no accede directamente al SDK.

Fuentes de campos: [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object?api-version=2025-02-24.acacia),
[PaymentIntent](https://docs.stripe.com/api/payment_intents/object?api-version=2025-02-24.acacia),
[Invoice](https://docs.stripe.com/api/invoices/object?api-version=2025-02-24.acacia),
[Subscription](https://docs.stripe.com/api/subscriptions/object?api-version=2025-02-24.acacia)
y [tipos Invoice del SDK fijado](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Invoices.d.ts).
La forma de Acacia usa `Invoice.subscription`, `Invoice.payment_intent` y
`Subscription.current_period_end`; no se mezclan estructuras de versiones posteriores.

## Creación y correlación

El diseño conserva crearSesionPago y su salida id/url. prepararSesionPago construye, sin
red, el cuerpo efectivo; el módulo lo guarda en solicitud_checkout antes del primer envío.
HU-01 llama a crearSesionPago con claveIdempotencia y solicitudCheckout persistida; la
envoltura envía ese cuerpo sin recalcular URL, descripción o metadatos. Igualdad de cuerpo
significa mismos parámetros/valores y orden de arrays; no exige orden de claves de objetos JSON. Los consumidores
anteriores sin instantánea conservan la construcción compatible mediante el mismo preparador. Se conservan EUR, una línea, cantidad 1 y recurrencias
mensual (month/1), trimestral (month/3) y anual (year/1). P-04 fija exclusivamente
`payment_method_types: ['card']` e importe de aplicación entre 100 y 99999999 céntimos,
ambos incluidos, máximo dos decimales. No es un máximo universal atribuido a Stripe. No se habilitan descuentos,
impuestos automáticos, pruebas gratuitas o prorrateos desde esta aplicación.

La referencia local aparece en `client_reference_id` y `metadata.referencia` de Session.
Además, se propaga explícitamente a `payment_intent_data.metadata` para puntual o
`subscription_data.metadata` para socio, con `metadata.modulo = 'donaciones'`. La referencia
de un alta identifica la aportación inicial; no se reutiliza como referencia de cada cuota.
No se correlaciona por correo. [Parámetros oficiales del SDK](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Checkout/SessionsResource.d.ts).

La operación local existe antes de la llamada. La clave hu01:<solicitud_id> va como opción
de petición, no como metadato. El protocolo mantiene referencia, huella y cuerpo efectivo,
sin regenerar la solicitud tras timeout o reinicio. La ventana local es de 23 horas desde
creado_en y no se renueva. Se adopta una hora de margen frente a la retención mínima de
24 horas descrita para estas claves, no una nueva garantía de Stripe.
[Contrato de idempotencia](https://docs.stripe.com/api/idempotent_requests?lang=node).

## Exclusión y reanudación de la creación

Este protocolo se aplica a puntual y al Checkout del alta. No sustituye los bloqueos
transaccionales pi/sub usados al reconciliar notificaciones.

1. **Preparación corta**: validar entrada, origen y CSRF. Si ya existe operación por UUID,
   comprobar autorización y huella cuando hay cuerpo completo. Antes de intentar exclusión,
   sin Session conocida y con plazo vencido responder revisión, aunque otro proceso conserve
   el bloqueo; no informar de una creación activa indefinidamente. Para alta local nueva,
   serializar la preparación con
   pg_try_advisory_xact_lock por solicitud; si está ocupada, responder operación en curso
   sin crear otra fila. La clave es el entero de 64 bits con signo obtenido de los primeros
   ocho bytes de SHA-256 de hu01:checkout:<UUID canónico>. UUID se valida y se representa en
   minúsculas con guiones como solicitud_id de PostgreSQL, nunca con el texto bruto recibido.
   Esa misma representación forma hu01:<solicitud_id> para Stripe, en las dos fases.
   En transacción se crea/reutiliza la operación, se compara la huella del cuerpo cuando
   se reenvía completo y se guarda solicitud_checkout mediante el preparador común.
   No se vuelve a construir la instantánea de una operación existente.
2. **Autorización antes del envío**: hacer commit y devolver la conexión de preparación;
   guardar la sesión y su permiso antes de adquirir la conexión de creación. Si falla ese
   guardado, no se llama a Stripe. Una repetición exige permiso de esa operación o cuenta
   propia vinculada; UUID o referencia solos no conceden acceso. La ventana de 23 horas
   no amplía las ocho horas del permiso invitado.
3. **Adquisición de creación**: obtener un cliente propio del pool y ejecutar una sola vez
   pg_try_advisory_lock con la clave anterior. Si devuelve false, liberar ese cliente y
   responder 409 OPERACION_EN_CURSO a una petición autorizada; no esperar ni llamar a Stripe.
   Se releen operación, autorización, estado, huella e ID externo después de adquirirlo.
   Si ya se conoce Session, solo se consulta/reutiliza; si está cerrada, no se reabre.
4. **Envío permitido**: sin Session conocida, exigir reloj real de PostgreSQL anterior a
   creado_en + 23 horas, tanto al decidir como inmediatamente antes de enviar. No se usa
   actualizado_en ni AHORA_SIMULADO para ampliar esa fecha. Persistir incierta con commit
   antes de HTTP; enviar exactamente solicitud_checkout con la misma clave de idempotencia.
   No se mantiene transacción SQL durante la llamada; timeout 3000 ms, cero reintentos
   automáticos del SDK. La exclusión sigue ligada a la conexión.
5. **Resultado**: con respuesta identificada, una transacción corta en ese mismo cliente
   guarda ID/URL y estado sin degradar confirmado o reabrir cerrada. Un error o timeout
   conserva incierta, el cuerpo y la clave; no prueba que Stripe no haya creado Session.
   No se cobra, cancela o crea otra operación para compensar el error.
6. **Liberación**: en finally, terminar/rollback cualquier transacción corta, ejecutar
   pg_advisory_unlock una vez por la adquisición y solo después devolver el cliente.
   Si no puede acreditarse la liberación o la conexión está dañada, usar release(true)
   para destruirla, sin devolver al pool una sesión con bloqueo pendiente.
   Durante este tramo las consultas usan ese cliente: no se pide otro con consulta,
   transaccion o guardado de sesión. Así no se retiene todo el pool esperando otra conexión.
7. **Error o reinicio**: no se toma incierta como prueba de actividad. El nuevo proceso
   solo reanuda si puede adquirir el bloqueo. PostgreSQL lo libera al terminar la conexión
   del proceso caído; mientras aún permanezca, responde en curso y no lo fuerza otro proceso.
   Al readquirir, releer, comprobar permiso y plazo y repetir la misma instantánea/clave.
   Si se perdió la conexión durante HTTP, no se vuelve a enviar ni se escribe como dueño
   usando otro cliente sin readquirir; una respuesta desconocida sigue siendo incierta.
8. **Vencimiento**: sin ID conocido, al alcanzar creado_en + 23 horas se responde
   409 OPERACION_REQUIERE_REVISION. No hay más POST de creación para recuperar esa operación
   ni renovación con otra clave/cuerpo. El saldo y estado financiero no se inventan:
   la revisión manual debe acreditar su resultado antes de decidir un cierre. Si se
   conoce Session, su consulta y su URL todavía válida no crean otro Checkout y no
   renuevan una ventana de creación ya vencida.

La aplicación conserva la clave de solicitud en sessionStorage por operación, sin guardar
allí datos fiscales. Puede reanudar mediante el DTO corto autorizado definido en el contrato
API, que referencia la solicitud original sin aportar otra. No ofrece un botón de reiniciar
el pago con otro UUID para resolver incertidumbre. Una sesión perdida no se recupera
por conocer esa clave; se mantiene PA1.7.

**Necesidad de datos**: se añade solo solicitud_checkout JSONB al registro operativo ya
previsto. La huella anterior no permite reconstruir después de un reinicio el cuerpo exacto
si cambia una URL o descripción. Se descartan otra tabla de bloqueos, propietario persistido
y lease renovable de creación: la conexión PostgreSQL identifica actividad. creado_en ya
proporciona el ancla inmutable de plazo. El esquema canónico sigue en el modelo común.

El comportamiento del bloqueo de sesión está descrito por
[PostgreSQL 16](https://www.postgresql.org/docs/16/explicit-locking.html#ADVISORY-LOCKS)
y sus [funciones consultivas](https://www.postgresql.org/docs/16/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS).
La destrucción del cliente se apoya en la interfaz de
[node-postgres](https://node-postgres.com/apis/pool#releasing-clients).
Estas fuentes justifican el diseño; no acreditan su implementación o prueba local.

## Eventos utilizados

Todos los nombres se contrastaron con el [catálogo del SDK 17.7.0](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Events.d.ts).
No es necesario suscribir todos los eventos de Stripe.

| Evento | Uso propuesto y condición |
|---|---|
| `checkout.session.completed` | Guardar correlación de Session, PaymentIntent o Subscription. No insertar una segunda aportación ni confirmar una cuota. |
| `checkout.session.expired` | Cerrar Checkout solo si su estado actual está expirado y no hay prueba de cobro. Un retorno a cancel_url no equivale a este evento. |
| `payment_intent.succeeded` | Confirmar puntual tras consultar el PaymentIntent actual. Si pertenece a una factura, no contabilizarlo aquí. |
| `payment_intent.payment_failed` | Registrar rechazo puntual recuperable si el estado actual sigue sin cobro. No deshacer una confirmación. |
| `payment_intent.canceled` | Registrar cancelación puntual acreditada por el recurso actual, sin borrar. |
| `invoice.paid` | Única ruta de éxito para cuotas: validar factura y pago actual, enlazar primera cuota o crear/reutilizar cuota posterior. |
| `invoice.payment_failed` | Registrar rechazo de la misma factura, avisar del fallo posterior al alta y actualizar previsión, sin sumar ni ordenar otro cobro. |
| `invoice.updated` | Actualizar información de factura pendiente y próxima fecha; no añadir una aportación confirmada por sí solo. |
| `customer.subscription.updated` | Leer estado actual, previsión y cancelación definitiva. No activar antes de acreditar primer cobro. |
| `customer.subscription.deleted` | Reflejar cancelación definitiva validada y conservar cobros anteriores. |

Los eventos de otros métodos de pago asíncronos quedan fuera del alcance de tarjeta de P-04. Un evento ajeno
a estas operaciones se ignora de forma registrada. Si se amplían métodos en otra versión,
se debe revisar el contrato; no se presupone soporte de pagos asíncronos.

## Verificación del dinero

### Puntual

Se recupera PaymentIntent. Debe corresponder a la referencia
local y no a una factura; moneda EUR, importe solicitado y recibido iguales al importe
local y estado `succeeded`, con captura automática de Checkout. Para puntual se adopta como
`fecha_cobro` el instante de creación en Stripe del evento válido `payment_intent.succeeded`
(`event.created`), convertido desde segundos. Representa la notificación de la transición
al éxito en la pasarela; no la llegada HTTP ni la creación de un intento previo. No se
recuperan detalles de tarjeta o se expande Charge para obtener la fecha. La fuente del
timestamp es el [contrato Event del SDK](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Events.d.ts).
Usarlo como instante de confirmación no implica usarlo para ordenar estados. Una vez fijado
en una aportación confirmada no se cambia por otra entrega.

Un fallo con `requires_payment_method` permite volver al mismo Checkout abierto. Si el
mismo PaymentIntent termina en éxito, `rechazada → confirmada` se aplica sobre la misma
aportación. Si un evento antiguo de fallo llega después, el recurso actual no autoriza
rechazarla. P-01 alinea estas transiciones en el modelo común de esta rama; su
implementación y revisión de Rubén siguen pendientes.
Un evento de fallo que ya encuentra el pago satisfecho no registra otro rechazo: la
confirmación puntual se realiza por la ruta del evento de éxito, con su instante acreditado.

### Cuotas

Se recuperan Invoice y su Subscription actual. Se comprueba pertenencia al módulo, estado
pagado, `paid_out_of_band = false`, EUR, `amount_paid` igual a la cuota y PaymentIntent
satisfactorio con el importe recibido esperado. Una factura de importe cero, liquidada
con saldo, marcada pagada fuera de pasarela o con una discrepancia no acredita el cobro
previsto: se registra incidencia y no se inventa una aportación pagada. El diseño v1 no
gestiona créditos, fraccionamientos o ajustes de factura.

El PaymentIntent debe ser el señalado por la factura y su relación `invoice` debe coincidir
con ella. La Subscription debe corresponder a la suscripción local y a la referencia del
alta; una coincidencia de importe sin esas relaciones no acredita pertenencia.

- `billing_reason = 'subscription_create'`: `Subscription.metadata.referencia` localiza
  la aportación pendiente del alta; se le asignan factura, pago y suscripción externa.
- `billing_reason = 'subscription_cycle'`: se busca por `pasarela_factura_id`; si no existe,
  se crea una sola cuota del mismo Donante, destino e importe de la suscripción.
- Otros motivos, como cambios de suscripción o facturación manual, se registran como
  incidencia de alcance. No se procesan como una cuota ordinaria silenciosamente.

`status_transitions.paid_at` fija el instante de la cuota confirmada. La primera cuota activa
el alta, salvo cancelación definitiva actual. Una confirmación tardía de una factura de
suscripción cancelada registra el dinero, pero no reactiva el alta. Si una cuota rechazada
termina pagada, se actualiza la misma fila por factura y PaymentIntent, sin duplicar la suma.
El PaymentIntent conocido no se sustituye por otro identificador sin revisar la incidencia.

Si una factura de ciclo llega antes de la notificación de la primera cuota y esta aún no
consta confirmada, se recupera la factura inicial mediante `Checkout Session.invoice` de
la operación del alta. Si falta el ID de Session por una respuesta incierta, se consulta
Session por `subscription`, con límite 2 y comprobación de referencia; se exige una única
coincidencia. Estos campos y filtro existen en los
[tipos Session](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Checkout/Sessions.d.ts)
y [parámetros de listado](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Checkout/SessionsResource.d.ts).
Se valida la factura inicial con las mismas reglas de dinero y se reconcilia antes de la
cuota de ciclo, en la misma transacción y bajo el bloqueo de suscripción. La fecha de alta
procede de la primera factura, no de la cuota que se notificó antes. No se presupone pagada
por recibir un ciclo posterior. Si no se puede demostrar esa relación, rollback ante fallo
transitorio o incidencia ante discrepancia permanente; no se crea otra primera cuota.
El evento de la factura inicial, cuando llegue, encuentra ya su fila y correo únicos.

## Entregas duplicadas, concurrencia y desorden

Stripe no garantiza orden y puede entregar varias notificaciones del mismo hecho.
[Guía oficial de webhooks](https://docs.stripe.com/webhooks#handle-duplicate-events).
El diseño reconcilia el recurso actual, sin reproducir ciegamente snapshots:

1. Verificar firma con el cuerpo crudo y secreto del endpoint. Comprobar versión y modo de
   pruebas en el entorno de pruebas. En producción se exige coherencia de `livemode` con
   las credenciales configuradas; no se mezclan datos de prueba y reales.
2. Identificar la clave de serialización por pago puntual o suscripción. Las consultas
   preliminares solo identifican; no deciden estados. Un evento ajeno se ignora sin crear datos.
3. En una conexión dedicada de PostgreSQL, adquirir un bloqueo consultivo de sesión por
   `pi:<id>`, `checkout:<id>` o `sub:<id>` y comprobar el identificador de evento. Con la
   exclusión mantenida por esa conexión y FUERA de cualquier transacción SQL, recuperar de
   Stripe los recursos canónicos actuales. Después, en la misma conexión, abrir una
   transacción corta que aplica el resultado (paso 4) y registra el evento de forma
   idempotente; en los pagos, además, vuelve a comprobar el evento dentro de esa
   transacción. La exclusión se libera al terminar. Si la conexión falla durante la consulta, no se aplica
   nada y se descarta la conexión.
4. Correlacionar y verificar importe, moneda, factura y pertenencia. Aplicar una transición
   válida y las restricciones únicas. Insertar el registro de evento y, si corresponde, la
   notificación de correo, atómicamente con el cambio financiero.
5. Hacer commit. Intentar fuera de la transacción el correo pendiente mediante su reserva.
   Responder 200 aunque falle SMTP; el cobro no depende del resultado del correo.

Un evento repetido ya procesado no repite el cambio financiero; puede recuperar una
notificación pendiente o una reserva vencida tras caída. Diferentes event IDs del mismo
pago tampoco crean filas nuevas: lo impiden pago/factura únicos y la reconciliación.
No se compara solo `event.created` para decidir cuál manda.

| Orden o carrera | Resultado exigido |
|---|---|
| Invoice antes de Checkout completado | Subscription.metadata permite asociar la primera cuota ya existente. |
| Checkout antes de Invoice | Solo se correlaciona; Invoice confirma una vez. |
| Primer fallo → éxito del mismo pago | Misma fila, referencia y única suma; P-01 permite la transición. |
| Ciclo posterior pagado antes del aviso de primera cuota | Recuperar y verificar la factura inicial, reutilizar la aportación del alta y registrar cada factura una vez. |
| Éxito → evento de fallo antiguo | Se conserva confirmada; el estado canónico y la inmutabilidad impiden retroceder. |
| Dos entregas simultáneas | Exclusión mutua, evento único y claves de negocio únicas. |
| Cancelación definitiva → evento de cuota antiguo | Se conserva cancelada; una cuota realmente cobrada se conserva sin reactivar. |
| Fallo antiguo recibido cuando la factura ya está pagada | No se registra un nuevo rechazo ni aviso; la ruta invoice.paid confirma o ya lo hizo. |

No hay cola adicional. La consulta externa bajo bloqueo es una concesión para un volumen
pequeño; P-02 fija timeout de 3 s y cero reintentos automáticos por llamada. Se limita a
Session, Invoice, PaymentIntent y Subscription necesarias, sin consultas ilimitadas. La
recuperación inicial puede requerir una Session y una factura adicionales; el listado
de Session no pagina automáticamente. Si se agota el tiempo o falla la base, rollback y 503 para reentrega. Una discrepancia permanente
se guarda como incidencia y devuelve 200 sin confirmar; exige investigación, no reintentos
de cargo. No se afirma que el reintento de Stripe dure indefinidamente ni que sustituya una
operación de recuperación ante una indisponibilidad prolongada.

## Próxima fecha y cancelación

Se lee la Subscription canónica; `canceled` e `incomplete_expired` son cierre definitivo.
`past_due` o `unpaid` tras un alta pagada no cancelan por sí solos el estado local. Una
cancelación programada no es una cancelación efectiva antes de su fecha.
Con cierre definitivo, la próxima fecha es null aunque una factura conserve una previsión
anterior. Una cancelación programada tampoco permite anunciar un cobro en o después de su
fecha: se comprueban cancel_at_period_end y cancel_at antes de elegir la previsión.

Sin fallo pendiente, solo se usa `current_period_end` futuro, con cobro automático y sin
cancelación programada. Tras fallo de la última factura pendiente, únicamente
`next_payment_attempt` futuro; si falta o ha pasado, null y «Pendiente de confirmación».
Se convierte el instante a fecha de Madrid usando los servicios comunes. No se suma un mes
localmente. `invoice.updated` refresca esa previsión porque las automatizaciones pueden
publicarla después del evento de fallo. [Reintentos de Stripe](https://docs.stripe.com/billing/revenue-recovery/smart-retries#webhook-events).

Se consulta la última factura de la suscripción para esa previsión: un fallo antiguo de
otra factura no reemplaza el próximo cobro vigente. El modelo común conserva el instante
externo junto con su DATE de Madrid; la consulta devuelve null en cuanto el instante haya
vencido, aunque no haya llegado una nueva notificación.

El fallo posterior genera aviso de correo deduplicado según el [modelo común](../../modelo-datos.md)
y se muestra a la cuenta vinculada que consulte esa cuota. No concede a la sesión inicial
acceso a cuotas posteriores. Solo se consulta o crea Checkout: no se invoca `invoices.pay`,
confirmación manual de PaymentIntent, cobros adicionales o cancelación de suscripciones.
