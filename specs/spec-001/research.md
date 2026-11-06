# Investigación técnica de HU-01

**Fecha de consulta**: 2026-11-06 · **Rama**: `spec-001`  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Diseño definido y documentación común alineada en spec-001; revisión de Rubén
pendiente. Código, migraciones y entorno sin modificar.

## R-01 — Versión efectiva de referencia

El manifiesto declara `stripe: ^17.5.0`, el lockfile fija **17.7.0** y no existe
`backend/node_modules/stripe/package.json`. Por tanto, no se acredita una versión instalada.
Node.js sí devuelve **22.20.0**. No se instalaron paquetes ni se consultaron secretos.

La fuente del SDK 17.7.0 fija [API 2025-02-24.acacia](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/src/apiVersion.ts).
El diseño usa esa versión explícita en el cliente y en el endpoint de notificaciones.
No combina los campos de Acacia con el esquema de versiones posteriores. La cuenta y su
endpoint no se han inspeccionado; configurar y comprobar esta coincidencia es P-05.

**Alternativa descartada**: diseñar contra la API más reciente o afirmar que el rango del
manifiesto demuestra instalación. El lockfile y los contratos del SDK son evidencias distintas.

## R-02 — Cobro estable, no fila por intento

Se define una fila de aportación por PaymentIntent puntual y por Invoice de socio.
Los identificadores de notificación solo deduplican entregas; no identifican el dinero.
Stripe permite entregas duplicadas y sin orden garantizado; se recuperan objetos actuales
para reconciliar. No se usa `event.created` como número de versión, pues varios eventos
pueden compartir instante. [Documentación oficial de webhooks](https://docs.stripe.com/webhooks#event-ordering).

Para una cuota, `invoice.paid` es el único disparador de registro de éxito; Checkout no
añade otra primera cuota. El recurso actual debe confirmar pago real y su correspondencia
con importe y moneda, no basta recibir el nombre del evento. El [objeto Invoice de Acacia](https://docs.stripe.com/api/invoices/object?api-version=2025-02-24.acacia)
incluye `subscription`, `payment_intent`, `billing_reason`, `paid`, `paid_out_of_band`,
`amount_paid` y `status_transitions.paid_at`. Un pago manual marcado fuera de Stripe no se
acepta como cobro por pasarela; se registra incidencia sin convertirlo en aportación confirmada.

**Decisión P-01**: el modelo común queda alineado para permitir que una aportación no confirmada
pase a confirmada cuando el recurso actual pruebe el cobro, conservando la misma fila,
identificador de pago y referencia. `confirmada` no vuelve a otro estado en v1. La
excepción comprende `rechazada → confirmada` y la recuperación de una cancelación local
si el cobro real la contradice. La definición única está en el modelo
común. La revisión de Rubén sigue pendiente antes de incorporar los cambios compartidos. No se crea una aportación compensatoria ni se
edita un importe ya confirmado.

Para el primer cobro fallido de un alta se conserva la suscripción pendiente,
sin activarla; se cancela si la pasarela confirma un cierre definitivo. Evita cancelar
irreversiblemente el alta por un rechazo recuperable. Sustituye la transición anterior
del primer rechazo, ahora alineada en P-01. Un cobro tardío no reactiva una suscripción
que la pasarela mantiene cancelada.

**Alternativas descartadas**: sumar tanto Checkout como Invoice; insertar una aportación
por evento; ordenar únicamente por fecha de notificación; confirmar por retorno del navegador.

Para la fecha puntual se adopta `event.created` del evento firmado de éxito, después de
validar el PaymentIntent actual. No se inventa un campo succeeded_at ni se usa la fecha de
creación de un intento que pudo necesitar autenticación posterior. En cuotas se dispone de
paid_at de Invoice. La elección de fuente y su efecto sobre cortes fiscales se incluye en
P-01 para revisión de Rubén; las fechas ya confirmadas no cambian al repetir eventos.

## R-03 — Normalización, importe e identidad

| Dato | Representación y comparación de v1 |
|---|---|
| Correo | NFC, recorte exterior y minúsculas; formato validado. No eliminar puntos, etiquetas `+` ni alterar el dominio por reglas particulares de proveedores. |
| NIF/NIE | NFC, mayúsculas y retirada de espacios y guiones de presentación; validar el resultado completo y su letra. No aceptar otros identificadores como equivalentes. |
| Nombre, apellidos y dirección | NFC, recorte y colapso de espacios; comparación sin distinguir mayúsculas. Se conservan tildes y puntuación: no traducir ni abreviar direcciones. |
| Importe | Reutilizar `aCentimos` y `centimosATexto`; rechazar exponente, separadores de miles, signo negativo y más de dos decimales. Validar entero seguro e intervalo incluido de 100 a 99.999.999 céntimos. |

Los datos canónicos se guardan al crear al Donante; nunca se reescriben por otra donación.
Se bloquean de forma ordenada las claves de NIF/NIE y correo durante la creación para
resolver carreras sin añadir una unicidad SQL de correo. La unicidad de NIF/NIE sigue
siendo una defensa de la base de datos. La comparación se hace antes de crear Checkout.
Los conflictos devuelven el mismo mensaje genérico, sin identificar el campo guardado.

El algoritmo de letra es el publicado por el [Ministerio del Interior](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/calculo-del-digito-de-control-del-nif-nie/index.html):
resto módulo 23; para NIE se convierte el prefijo X/Y/Z a 0/1/2. Ejemplo sintético válido:
`12345678Z`. La comprobación de formato no acredita identidad ni titularidad del correo.

**Decisión P-04**: importe de **1,00 € a 999.999,99 €**, ambos incluidos, con máximo dos
decimales, exclusivamente tarjeta mediante Stripe Checkout y moneda EUR. Es el límite
elegido para esta aplicación, no un máximo universal de Stripe. El
[contrato PaymentIntent de Acacia](https://docs.stripe.com/api/payment_intents/object?api-version=2025-02-24.acacia)
se utiliza para verificar unidad menor, moneda e importe recibido; no define el alcance
funcional de la ONG. Se descartan otros medios, monedas y cargos fraccionados para superar
el máximo. No se introducen promociones, impuestos o pruebas gratuitas. FR-002 y FR-005
quedan alineados; NUMERIC(10,2) se conserva y el máximo no limita totales acumulados.

## R-04 — Correlación, exclusión y recuperación de creación

**Decisión UND-001**: se usa una exclusión consultiva de sesión de PostgreSQL por UUID
de solicitud, sobre una conexión dedicada durante el envío, con transacciones cortas
antes y después. La preparación conserva la exclusión transaccional por UUID y guarda
el permiso de navegador antes de adquirir esa conexión. Ninguna transacción permanece
abierta durante HTTP. El propietario real es la conexión, no el estado incierta.

Se libera en finally y se destruye el cliente si no se puede acreditar su desbloqueo.
Un reinicio no permite saltarse la exclusión: solo reanuda quien pueda adquirirla,
releer y conservar permiso, instantánea y clave. El fin de conexión libera el bloqueo;
mientras aún permanezca, otra petición informa en curso. Se descartan una nueva tabla
de bloqueos o un lease/propietario persistido para creación.
[Semántica de PostgreSQL](https://www.postgresql.org/docs/16/explicit-locking.html#ADVISORY-LOCKS)
y [liberación del pool](https://node-postgres.com/apis/pool#releasing-clients).

**Plazo**: ventana local fija de 23 horas desde creado_en, comprobada con reloj real de
base de datos y sin renovación. Es una elección conservadora con margen frente a la
retención mínima de 24 horas de la [idempotencia de Stripe](https://docs.stripe.com/api/idempotent_requests?lang=node).
Se descartan actualizado_en o un plazo desde cada reintento: permitirían prolongar la
recreación de una solicitud más allá de la conservación de la clave. Vencido el plazo,
sin ID conocido, se requiere revisión; no se inventa otro cobro, estado financiero o
resultado de pasarela. Una Session conocida se consulta/reutiliza, no se vuelve a crear.

**Cuerpo inmutable**: se justifica añadir únicamente solicitud_checkout JSONB al registro
operativo existente. La huella de entrada detecta modificaciones, pero no reconstruye el
cuerpo exacto si cambian una descripción o las URL tras un reinicio. La instantánea se
prepara una vez en la envoltura y se reenvía igual; no contiene datos fiscales adicionales,
tarjeta, sesión o secretos. No se deriva otra clave para compensar un timeout.
El DTO corto de reanudación referencia esa solicitud, requiere permiso y no admite
otro cuerpo de pasarela; el navegador conserva solo su UUID, no datos fiscales.

La referencia se propaga a Session y a payment_intent_data.metadata o
subscription_data.metadata según modalidad; no se supone propagación desde Session.
[Metadatos indirectos](https://docs.stripe.com/metadata#set-metadata-indirectly).
El protocolo completo se define en [pasarela-stripe.md](contracts/pasarela-stripe.md#exclusión-y-reanudación-de-la-creación);
el modelo común conserva la única definición del campo nuevo. P-01/P-02 requieren la
revisión de Rubén antes de su incorporación; no se han creado SQL o funciones.

## R-05 — Sesión de operación y vínculo con cuenta

**Decisión COV-001**: formulario y resultado ofrecen /donar/vincular. Sin token se entra
con FormEntrar existente y se solicita explícitamente el enlace desde la página. El 202
muestra el mismo aviso genérico, exista o no un Donante elegible; no acredita un envío o
vínculo. Con token se confirma por POST y no se reemite automáticamente. Se descarta
depender de HU-02 o cambiar registro/login para iniciar ese recorrido.

El permiso de operación se conserva en `req.session.donaciones`, separado de `usuarioId`.
Tiene límite absoluto de ocho horas desde su creación y está ligado a referencias concretas.
Se guarda la sesión antes de la redirección. El permiso no se transmite en la URL. Los
POST de navegador exigen token CSRF de sesión y origen permitido; el webhook usa firma,
no sesión ni CSRF. El servicio comprueba propiedad también cuando existe cuenta vinculada.

El enlace de vínculo usa 32 bytes aleatorios, hash SHA-256, cuenta y Donante fijados,
treinta minutos de duración y consumo único transaccional. El token va en fragmento de
URL y se retira de la barra al cargar; un POST explícito confirma el vínculo para evitar
que un lector automático de correo lo consuma. No cambia la autenticación común.

**Límite existente**: el registro común reserva un correo antes de acreditarlo. El vínculo
impide leer aportaciones con un correo ajeno, pero no resuelve que una cuenta precreada
pueda impedir registrar otra con ese correo. Recuperar cuentas o cambiar roles queda fuera
de HU-01; no se atribuye a este enlace una garantía de recuperación que no proporciona.

## R-06 — Próximo cobro y cancelación

En situación ordinaria se toma la fecha de `Subscription.current_period_end`, cuando hay
cobro automático, sin cancelación programada y el instante es futuro. Es el fin del periodo
comunicado por Stripe, no una suma local de meses. El [objeto Subscription de Acacia](https://docs.stripe.com/api/subscriptions/object?api-version=2025-02-24.acacia)
describe ese periodo y la facturación automática al finalizarlo.

Después de un fallo solo se usa `Invoice.next_payment_attempt` de la factura pendiente
vigente, si es futuro; nunca el fin de periodo como sustituto de una fecha de reintento.
Si falta, la API devuelve `null` y la interfaz muestra «Pendiente de confirmación».
También se escucha `invoice.updated`: la documentación explica que ciertas automatizaciones
actualizan ahí la fecha. La aplicación no solicita cobrar de nuevo.
[Reintentos gestionados por Stripe](https://docs.stripe.com/billing/revenue-recovery/smart-retries#webhook-events).

Se conserva en el modelo común el instante externo en `pasarela_proximo_cobro_en`. La DATE
común se mantiene como proyección de Madrid; el instante permite ocultar una previsión ya
vencida incluso dentro del mismo día, sin esperar otra notificación. Es parte del diseño P-01 alineado en esta rama.

Los estados externos `past_due` o `unpaid` no cancelan por sí solos una suscripción local
ya activada. Se consulta el estado actual y se refleja la cancelación definitiva, aunque
lleguen después eventos antiguos de pago. Las aportaciones confirmadas permanecen.

## R-07 — Correo recuperable sin cambiar el pago

Se conserva por aportación el resumen de confirmación y su estado de correo,
con exclusión mutua temporal de envío. La primera transición efectiva a confirmada crea
ese registro una sola vez. Tras el commit se llama a `enviarCorreo`; un fallo persiste
como fallido y no revierte el cobro. Un evento repetido puede recuperar un envío pendiente
tras caída del proceso, pero no repetir un envío marcado como satisfactorio.

Un fallo SMTP ya atendido con respuesta 200 no obliga a Stripe a reenviar el evento. Si no
hay una nueva entrega, el reintento depende del acceso autorizado previsto en FR-012.
Sin sesión invitada y sin cuenta vinculada no se ofrece recuperación directa; el correo
puede seguir pendiente y SC-002 no puede declararse cumplido. No se añade un envío en segundo
plano ni se usa la pasarela como planificador de correo.

P-03 añade un segundo argumento opcional a enviarCorreo: HU-01 solicita 3 s de conexión,
3 s de saludo y 5 s de inactividad. Se mantiene el retorno booleano y la llamada existente
sin opciones conserva el transporte de los otros módulos. Se descarta un cambio global
de sus tiempos. Donaciones renueva su reserva mientras envía y guarda por número de intento;
los tiempos de cada fase no se confunden con una garantía de duración total. Los nombres de opciones
están documentados por [Nodemailer](https://nodemailer.com/smtp#connection-options).
El envío ocurre fuera de las transacciones de negocio. No se añade un trabajador ni una cola.

**Límite**: SMTP no garantiza exactamente una entrega si el proceso cae tras aceptar el
servidor el mensaje y antes de guardar el éxito local. Puede repetirse el mismo mensaje
al recuperar una reserva vencida; nunca el cobro ni la aportación. No se ofrece una garantía
de entrega única inexistente. SC-002 conserva su exigencia de recepción comprobada y no
se cumple mientras haya correos pendientes.

PA1.8 se informa mediante un aviso de fallo de cuota posterior, independiente del mensaje
de confirmación. Ambos se deduplican por aportación y tipo. Si la cuota acaba pagándose,
se conserva el aviso histórico y se emite su confirmación, sin sobrescribir el primer resumen.

## R-08 — Estado de la investigación

Las fuentes son oficiales y se consultaron con la versión de API explícita para los
objetos de pago. El catálogo de eventos se contrastó con el [SDK 17.7.0](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/Events.d.ts).
Las decisiones P-01–P-04 y la preparación de entorno P-05 están desarrolladas en [cambios comunes](contracts/cambios-comunes.md).
La documentación común queda alineada y la revisión de Rubén sigue pendiente. No se ha
validado una cuenta Stripe, una migración o una prueba funcional. P-05 no impide diseñar
ni desglosar HU-01; se completa antes de las pruebas reales de Stripe.
