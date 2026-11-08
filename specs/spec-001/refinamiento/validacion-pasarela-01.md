# Validación del adaptador Stripe — HU-01

**Fecha**: 2026-11-06 · **Rama**: spec-001 · **HEAD inicial**: e1a155a  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance**: T014–T016. Adaptador y pruebas aisladas.  
**Resultado**: 36 pruebas aprobadas tras la revisión. Ampliación preparada en esta rama para revisión;
no acredita acuerdo colectivo, aprobación de Rubén, integración o idempotencia real.
T006 permanece pendiente.

## Estado y método

La carpeta está limpia al comenzar. No existen pasarela.test.js ni este informe.
Se sigue el procedimiento local de speckit-implement, limitado al bloque; no se repiten
fases cerradas. La selección specs/spec-001 se comprueba con
check-prerequisites.ps1 -Json -PathsOnly y variable de proceso, sin persistir feature.json.
La checklist conserva 16 elementos completados. Se omiten los hooks opcionales de commit.

Fuentes: [plan común §5.1](../../plan-comun.md#51-contrato-de-la-envoltura-de-stripe),
[P-02](../contracts/cambios-comunes.md#p-02--pasarela-e-integración),
[contrato Stripe](../contracts/pasarela-stripe.md), [plan](../plan.md) y [tareas](../tasks.md).
La mención histórica a la ausencia de instalación en los documentos de planificación
no sustituye la comprobación local actual: el SDK instalado es 17.7.0.

## Contraste con SDK instalado

| Fuente local de stripe               | Elementos contrastados                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| package.json y cjs/apiVersion.js     | Versión 17.7.0 y API 2025-02-24.acacia.                                                                                                    |
| types/lib.d.ts                       | apiVersion, timeout, maxNetworkRetries y páginas data/has_more.                                                                            |
| types/Checkout/SessionsResource.d.ts | Parámetros de creación, metadatos indirectos, tarjeta, recurrencias y filtro subscription del listado.                                     |
| types/Checkout/Sessions.d.ts         | Referencias nullable/expandibles, estado, modo, factura, URL, expires_at y livemode.                                                       |
| types/PaymentIntents.d.ts            | amount, amount_received, currency, status, invoice, metadata y livemode.                                                                   |
| types/Invoices.d.ts                  | payment_intent expandible, subscription, paid_out_of_band, amount_paid, billing_reason, status_transitions.paid_at y next_payment_attempt. |
| types/Subscriptions.d.ts             | latest_invoice, current_period_end, collection_method y campos de cancelación.                                                             |

Se contrasta la presencia de 39 campos de recursos, sin ausencias. Los tipos admiten
referencias como identificador, objeto expandido o null según el campo. No se utilizan
campos de versiones posteriores ni se actualizan dependencias. Esta comprobación local
no acredita la versión o configuración de una cuenta/endpoint real.

## Dependencia y ejecución

T014 pasa de T013 a T002: el constructor, las firmas locales y las peticiones simuladas
no necesitan tablas operativas. T015 sigue dependiendo de T014 y T016 de T015.
Las demás dependencias y los 81 identificadores se conservan. tasks.md actualiza
justificación, diagrama, ventana de paralelo, comando dirigido y progreso.
Este adelanto no completa la revisión humana de T006.

## Implementación

Archivo: [pasarela.js](../../../backend/src/servicios-comunes/pasarela.js).

- prepararSesionPago construye el cuerpo sin crear cliente ni hacer red. Usa la URL de
  configuración vigente, una línea de cantidad 1, tarjeta/EUR y las recurrencias
  month/1, month/3 y year/1. Cada cuerpo tiene objetos nuevos.
- Referencia y módulo donaciones prevalecen sobre metadatos arbitrarios. Se propagan
  a Session y a payment_intent_data o subscription_data según modalidad. Se rechazan
  claves conocidas de datos fiscales/personales; los metadatos no son un canal de datos fiscales.
- crearSesionPago conserva argumentos anteriores y salida { id, url }. Si recibe
  solicitudCheckout, la pasa directamente al SDK sin reconstruirla, incluso si cambian
  URL o descripción. claveIdempotencia se pasa como idempotencyKey de la petición.
  El constructor común sirve a la llamada compatible sin instantánea. La obligación
  de HU-01 de aportar instantánea y clave sigue correspondiendo a su futura orquestación.
- Cliente con API 2025-02-24.acacia, timeout 3000 ms y maxNetworkRetries 0. Los errores
  externos se presentan como ErrorApi 503 sin devolver el mensaje privado del SDK.
  La falta de clave conserva PASARELA_NO_CONFIGURADA.
- verificarEvento conserva cuerpo crudo/firma y retorno del evento verificado; firma
  inválida o cuerpo alterado producen FIRMA_INVALIDA, estado 400. No reconcilia el evento.

### Proyecciones

Se seleccionan explícitamente los campos de §5.1, sin copiar respuestas completas.
Los metadatos proyectados contienen solo referencia y modulo; referencias expandidas
se convierten a ID. False, cero y timestamps en segundos no se convierten en fechas
ni se sustituyen por otro estado; los campos desconocidos opcionales se representan con null.

| Consulta                   | Resultado                                                                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| obtenerSesionPago          | Proyección de Session, incluidas referencias de pago, factura y suscripción.                                                                                                                                    |
| obtenerPago                | Proyección PaymentIntent sin métodos de pago, tarjeta o cargos expandidos.                                                                                                                                      |
| obtenerFactura             | Solicita expand de payment_intent y devuelve su proyección, con solo paid_at dentro de status_transitions. Si llega un ID pese a expand, hace una recuperación adicional acotada del pago; null permanece null. |
| obtenerSuscripcion         | Proyección Subscription con latest_invoice como ID y campos canónicos de previsión/cancelación.                                                                                                                 |
| obtenerSesionDeSuscripcion | Una página { data, has_more }, con Session proyectadas, subscription y limit: 2. No pagina automáticamente ni decide coincidencia única. Esa decisión corresponde al servicio posterior.                        |

La función de firma conserva deliberadamente el evento íntegro de su interfaz anterior;
no se presenta como una proyección de recurso ni se registra su contenido. La exclusión
de datos de tarjeta se comprueba en las consultas proyectadas, no mediante una modificación
silenciosa del evento firmado.

## Pruebas y resultados reales

Archivo: [pasarela.test.js](../../../backend/src/modulos/donaciones/pasarela.test.js).

El mock utiliza el constructor real de Stripe 17.7.0 y sustituye los seis métodos que
realizan peticiones: create/retrieve/list de Session y retrieve de PaymentIntent, Invoice
y Subscription. La configuración, las claves y los recursos son sintéticos.
Los métodos de firma permanecen reales; se generan y verifican cabeceras localmente.
No se carga .env ni se contacta Stripe.

Se comprueban cuerpos completos, propagación y protección de metadatos, recurrencias,
ausencia de cliente en el preparador, argumentos anteriores, salida mínima,
configuración del SDK, conservación por identidad de instantánea y clave,
firmas válidas/inválidas, campos y valores proyectados, nulls, referencias expandidas,
recuperación acotada del pago, listado vacío/ambiguo y errores de cada método.
La selección de campos evita devolver extras personales o de tarjeta incluidos en los fixtures.

Desde PowerShell en backend:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm test -- src/modulos/donaciones/pasarela.test.js
```

| Ejecución                              | Inicio mostrado por Vitest | Código | Resultado                                                                                                                 |
| -------------------------------------- | -------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------- |
| Antes de implementar                   | 19:28:07                   |      1 | 22 fallidos y 3 aprobados de 25. Faltan funciones/garantías del adaptador; las firmas reales pasan. Duración 1,94 s.      |
| Primera ejecución tras implementar     | 19:29:02                   |      1 | 24 aprobados y 1 fallido de 25. El fixture esperaba metadata en Invoice, fuera de la proyección pactada. Duración 1,68 s. |
| Fixture corregido y cobertura ampliada | 19:30:06                   |      0 | 35 aprobados, 0 fallidos, 0 omitidos. Duración 1,67 s, 652 ms de pruebas.                                                 |

La corrección del fixture elimina esa expectativa ajena al contrato, no una protección.
Se añaden diez casos para valores de negocio, recursos null, pago no expandido y metadatos
personales, sin retirar los casos anteriores. Vitest utilizado: 2.1.9.

## Comprobación adicional durante la revisión

Se reproduce un objeto de recurrencia compartido entre sesiones: al cambiar interval_count
a 99 en un cuerpo mensual, el siguiente cuerpo también recibe 99. Se devuelve una copia
de la recurrencia y se añade una prueba de regresión. No cambian las periodicidades previstas.

La suite dirigida posterior termina con código 0: 36 pruebas aprobadas, ninguna fallida
u omitida, inicio 19:36:50 y duración 1,68 s. Se conservan los resultados anteriores.
La comprobación sigue siendo local, con firmas sintéticas y red simulada.

## Formato y conservación

Se utiliza Prettier 3.6.2 disponible en caché, con la configuración común,
sin instalación ni cambios de lockfiles. Desde la raíz:

```powershell
$hu01Prettier = 'C:\Users\Nada\AppData\Local\npm-cache\_npx\83e71da30ae7cab2\node_modules\prettier\bin\prettier.cjs'
node $hu01Prettier --config .prettierrc.json --write backend/src/servicios-comunes/pasarela.js backend/src/modulos/donaciones/pasarela.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-pasarela-01.md
node $hu01Prettier --config .prettierrc.json --check backend/src/servicios-comunes/pasarela.js backend/src/modulos/donaciones/pasarela.test.js specs/spec-001/tasks.md specs/spec-001/refinamiento/validacion-pasarela-01.md
```

Comprobación final: código 0, All matched files use Prettier code style.
Se comprueban rutas, dependencias, alcance y huellas de los archivos anteriores;
solo cambian los cuatro archivos autorizados. Los informes históricos, secretos,
migraciones y archivos de compañeros se conservan.

## Límites y parada

Las simulaciones acreditan la construcción y transmisión de argumentos, no la
idempotencia, aceptación de Checkout, disponibilidad, tiempos de red o cobros reales
de Stripe. No se ha configurado una cuenta o webhook. P-05 y la integración real siguen
pendientes. Tampoco se ejecutan pruebas de otras tareas, migraciones o instalaciones.

No se implementan persistencia, exclusión PostgreSQL, reconciliación, rutas, pagos
adicionales, cancelaciones o reintentos de cobro. Solo se marcan T014–T016 como
recién completadas. T006 permanece pendiente y la ampliación se conserva para revisión,
sin atribuir acuerdo colectivo o aprobación de Rubén.
Se detiene el bloque, sin git add, commit, push, merge o cambio de rama.
