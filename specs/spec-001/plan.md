# Plan técnico de HU-01 — Donación puntual y alta como socio

**Rama**: `spec-001` · **Fecha**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Diseño definido y documentación común alineada en spec-001. P-04 incorporado;
revisión de Rubén pendiente. No acredita acuerdo colectivo, código o pruebas ejecutadas.  
**Especificación vigente**: [spec.md](spec.md) · **Investigación**: [research.md](research.md)

## Resumen

HU-01 permite donar y hacerse socio sin cuenta mediante Stripe Checkout. La confirmación
depende de notificaciones firmadas y de la comprobación del estado actual en Stripe. Una
aportación representa un cobro, no cada intento ni cada evento recibido. La primera cuota
reutiliza la aportación pendiente del alta; las siguientes se identifican por factura.

Se conserva la arquitectura del [plan común](../plan-comun.md). Este documento añade
únicamente los flujos de donaciones, su seguridad, sus contratos y su validación prevista.
V1 usa exclusivamente tarjeta, EUR y entre 1,00 € y 999.999,99 €, ambos incluidos, con máximo
dos decimales. El máximo es una elección de la aplicación.
El historial, los certificados y los informes consumen datos de HU-01, pero no se implementan
como parte de esta historia. No hay edición de datos fiscales, cuota o baja desde la aplicación.

## Contexto técnico

| Aspecto | Base comprobada y decisión |
|---|---|
| Lenguaje | JavaScript con módulos ES; Node.js 22. Se ha comprobado Node.js 22.20.0 en el entorno. |
| Interfaz | Astro SSR, React 19 y Tailwind 3; reutilización de `Layout.astro`, componentes comunes, `lib/api.js` y `lib/formato.js`. |
| Servidor | Express 4, `zod`, `pg`, sesiones comunes, `ErrorApi` y envoltura `asincrono`. |
| Persistencia | PostgreSQL 16. Entidades del [modelo común](../modelo-datos.md); definición única alineada en el modelo común y uso descrito en [data-model.md](data-model.md). |
| Stripe | `backend/package.json`: `^17.5.0`; lockfile: **17.7.0**. No hay instalación local de Stripe. La referencia de diseño es API **2025-02-24.acacia**. |
| Correo | `enviarCorreo({ para, asunto, texto })` devuelve un booleano; no conserva estado ni acredita recepción final. |
| Pruebas | Vitest y Supertest previstos, PostgreSQL de pruebas y comprobación manual con Stripe de prueba y Mailpit. No se han ejecutado. |
| Objetivos | Donación habitual en menos de tres minutos; importes exactos, interfaz española, fechas de Madrid y correo verificable según SC-002. |
| Volumen | ONG pequeña. Procesamiento síncrono y acotado de notificaciones, sin nueva cola ni servicios independientes. |

## Comprobación de la constitución

| Principios | Aplicación al diseño | Resultado de revisión documental |
|---|---|---|
| I–II: simplicidad y alcance | SQL directo, servicios existentes, sin edición de perfil, pagos propios, reembolsos ni funcionalidades de HU-02. | Compatible con el alcance. |
| III–IV: verificabilidad y presentación | Matriz P01–P21/S01–S13 en [quickstart.md](quickstart.md); euros exactos y `Europe/Madrid`. | Casos previstos, sin ejecución. |
| V–VI: seguridad e historial | Checkout alojado, vínculo acreditado, autorización por operación, registros conservados y confirmación de cobro no reversible por un evento antiguo. | Diseño alineado con el modelo común; persistencia por implementar. |
| VII–IX: pila y reutilización | Se mantienen módulos, capas, errores y entidades comunes. Stripe solo se usa desde su envoltura; correo compatible por opciones propias de HU-01. | Diseño compatible; implementación pendiente. |
| X–XI: autoría y revisión | Nada responsable y Rubén revisor; rama `spec-001`. | Revisión de Rubén no realizada. |
| XII: cambios compartidos | P-01–P-03 alineados documentalmente y P-04 fijado en esta rama. P-05 es preparación de entorno. | Revisión de Rubén e incorporación compartida pendientes; no se acredita acuerdo colectivo. |

## Documentación de la fase

```text
specs/spec-001/
  plan.md
  research.md
  data-model.md
  contracts/api-donaciones.md
  contracts/pasarela-stripe.md
  contracts/cambios-comunes.md
  quickstart.md
```

El estado vigente lo fijan `spec.md` y el plan común alineado. Los informes
[clarify-1](refinamiento/clarify-1.md), [clarify-2](refinamiento/clarify-2.md) y
[clarify-3](refinamiento/clarify-3.md) conservan el recorrido metodológico; sus estados
anteriores no reabren decisiones posteriores. Las ocho respuestas siguen vigentes.

## Estructura prevista del código

Los siguientes son destinos de implementación, no archivos generados por esta fase:

```text
backend/src/modulos/donaciones/
  rutas.js  controlador.js  servicio.js  repositorio.js
  normalizacion.js  autorizacion.js  confirmaciones.js
  servicio.test.js  rutas.test.js  pasarela.test.js
frontend/src/pages/donar/
  index.astro  resultado.astro  vincular.astro
frontend/src/components/donaciones/
  FormDonacion.jsx  ResultadoDonacion.jsx  VincularDonante.jsx
backend/src/db/migraciones/004_donaciones.sql
backend/src/db/semillas/donaciones.js
```

`rutas.js` registra los contratos de [API](contracts/api-donaciones.md). El controlador
valida con zod; el servicio aplica identidad, permisos, estados y transacciones; el
repositorio contiene SQL parametrizado. Los ayudantes propios no duplican servicios comunes.
La integración futura del router afecta a `backend/src/app.js` y está recogida en P-02.

## Flujos de aplicación

### Preparar y pagar una aportación

1. El formulario obtiene contexto y token CSRF de sesión. Valida importe y datos sin pedir
   tarjeta, contraseña ni información adicional del donante.
2. El servidor normaliza y compara los datos según R-03 de [research.md](research.md).
   Serializa las altas por NIF/NIE y correo; rechaza conflictos antes de preparar Checkout.
3. En transacción crea o reutiliza al Donante sin sobrescribir datos, y crea aportación,
   operación y, si procede, suscripción pendiente. La envoltura prepara una sola vez
   solicitud_checkout y se guarda inmutable con la huella. Fondo general es proyecto_id NULL.
4. Guarda y confirma la sesión de navegador con el permiso de esa operación antes de
   responder y antes de retener la conexión de creación. El navegador conserva solo UUID
   en sessionStorage, no datos fiscales; el DTO corto autorizado reanuda la solicitud
   original. Una recarga no rota automáticamente esa clave ni reenvía correo de vínculo.
5. Fuera de la transacción y después del guardado de sesión, obtiene exclusión de sesión
   PostgreSQL por UUID en una conexión propia. Un intento activo devuelve 409; tras error
   o reinicio solo reanuda quien readquiere la exclusión, conserva permiso y usa la misma
   instantánea/clave. Guarda ID/URL antes de desbloquear; finally libera o destruye el
   cliente. Dentro del tramo no solicita otra conexión del pool.
   La ventana no renovable termina en creado_en + 23 horas, con reloj real de PostgreSQL.
   Sin ID conocido, al vencer se requiere revisión y no otro cobro. Con Session conocida
   solo se consulta/reutiliza. El [protocolo](contracts/pasarela-stripe.md#exclusión-y-reanudación-de-la-creación)
   es la definición única del arbitraje, fuera de transacción SQL durante HTTP.
6. El navegador vuelve a la ruta de resultado. `cancelado=1` solo informa de la navegación:
   no demuestra cancelación del cobro y no modifica el estado financiero.

El proyecto debe estar activo al aceptar la solicitud. Si no lo está, se devuelve conflicto
y se ofrece elegir fondo general; no se cambia el destino sin una nueva elección expresa.
Una desactivación posterior no reasigna un pago ya iniciado.

### Registrar cobros y fallos

El [contrato de Stripe](contracts/pasarela-stripe.md) define recursos, eventos y algoritmo.
Puntuales se identifican por PaymentIntent; cuotas por Invoice, conservando además el
PaymentIntent cuando existe. Checkout enlaza la operación, pero **no confirma la primera cuota**.

Una notificación antigua no deshace un cobro confirmado. Antes de decidir se consulta el
recurso actual, con exclusión mutua por pago o suscripción. El intento rechazado que después
se cobra actualiza la misma aportación y conserva referencia; P-01 alinea expresamente esas
transiciones en el modelo común de esta rama. No se resuelve creando una segunda aportación.

El primer cobro confirmado activa el alta solo si no existe una cancelación definitiva de
pasarela. Una factura antigua pagada después de una cancelación se registra como aportación,
pero no reactiva una suscripción cancelada. Las cuotas posteriores fallidas no suman ni
cancelan por sí solas; se procesa una cancelación válida posterior. No se llama a operaciones
de pago, reintento de cargo o cancelación desde la aplicación.

### Consultar, vincular y reintentar correo

Formulario y resultado muestran «Vincular mis aportaciones a una cuenta» hacia
/donar/vincular, sin depender de HU-02. Sin token, la página reutiliza FormEntrar y permite
a la cuenta donante solicitar el enlace por POST; 202 muestra el aviso genérico, sin afirmar
existencia, envío o vínculo. Con token se confirma por POST y no se reemite automáticamente.
El recorrido solicitud → correo → confirmación y la navegación desde ambas entradas se
comprueban en P11/P12 y T031/T045/T047/T049/T052.

- El permiso de navegador contiene únicamente referencias de operaciones iniciadas en esa
  sesión y su vencimiento absoluto de ocho horas. La cookie común sigue con su configuración
  existente. Perder la sesión no habilita recuperación directa sin cuenta.
- Una cuenta identificada con rol donante y vínculo previamente acreditado puede autorizar
  una consulta de su propia aportación. No se crea el endpoint del historial.
- El vínculo requiere enlace aleatorio de un solo uso, asociado a cuenta y Donante, con
  treinta minutos de vigencia. El acceso GET a la página no lo consume: se confirma por POST.
  El registro y el inicio de sesión no cambian ni asignan roles nuevos.
- El correo se prepara al confirmar y se intenta después del commit. El estado de envío es
  independiente del pago. El reintento autorizado reutiliza el mismo resumen y no llama a Stripe.
  Una reserva renovable por intento serializa los reintentos de envío. Los fallos siguen visibles.
- Una cuota posterior fallida genera un aviso de correo deduplicado y queda consultable
  por su cuenta vinculada. La sesión de invitado del alta no autoriza esa cuota posterior.

El inicio de sesión común regenera la sesión y puede perder el permiso directo de invitado;
se aplica la limitación de PA1.7. El vínculo acreditado permite el acceso personal posterior.
No se añade recuperación de cuenta ni edición de perfil para compensarlo.

## Preparación temprana de la migración compartida

La estrategia definida en el [plan común](../plan-comun.md) y en
[P-01](contracts/cambios-comunes.md#p-01--persistencia-y-transiciones) mantiene dos entregas.
Primero, 004_donaciones.sql con las tres entidades de dominio completas, claves de pago y
factura, previsión temporal, auditoría e índice financiero. La revisión pequeña de Rubén
comprueba el contrato de consulta y las secuencias 001–003 → 004 y 001–003/005 → 004. Permite
consumir aportaciones confirmadas antes de tener la interfaz o el procesamiento Stripe.

Después se incorporan las cuatro tablas operativas en una nueva migración dependiente
solo de 004. Se coordinará el siguiente número libre desde 009 al preparar la entrega;
**009 no está reservado**. No se modifica 004 publicada ni se espera a 006–008. No se crea
SQL en esta fase; la numeración de esa ampliación es coordinación futura de integración.

## Validación prevista

[quickstart.md](quickstart.md) relaciona todos los escenarios con sus entradas, resultados y
comprobaciones. Incluye rechazos, correos, límites de sesión, vínculo, concurrencia y cambios
de orden de eventos. Las pruebas de estados usan recursos canónicos simulados con los
campos de la versión fijada; una permutación de snapshots antiguos no sustituye simular el
estado actual consultado a la pasarela. Las pruebas reales de Checkout son manuales en modo
de pruebas. No se somete la pasarela externa a pruebas de carga.

SC-002 exige observar el mensaje en Mailpit; una respuesta booleana o un aviso de pantalla
no demuestran recepción. Las pruebas financieras comprueban cardinalidad y sumas, no solo
el texto de respuesta. No se ha ejecutado ni aprobado ninguna prueba funcional.

## Estado del diseño y revisión pendiente

P-01 centraliza datos y transiciones en el modelo común. P-02 fija funciones compatibles de
pasarela; P-03 añade opciones de correo solo para HU-01, conservando las llamadas ajenas.
P-04 fija tarjeta, EUR y rango de importe propio de la aplicación. No quedan decisiones de
diseño identificadas sin resolver que impidan preparar el desglose en tareas.

La revisión de Rubén y la incorporación de los cambios comunes siguen pendientes, según la
constitución; el estado de esta rama no acredita un acuerdo colectivo. La implementación
de funciones, migraciones, semillas y pruebas es trabajo posterior. P-05 prepara instalación,
cuenta y webhooks antes de las pruebas reales de Stripe; no condiciona las pruebas locales
con la pasarela simulada ni se presenta como una configuración ya comprobada.

Límites conocidos: no se recupera acceso directo invitado perdido; el enlace de donaciones
no recupera cuentas reservadas con correo ajeno; SMTP puede duplicar un mensaje tras una
caída y un correo fallido sin reintento autorizado puede seguir pendiente. En ese caso
SC-002 no se cumple. Ninguno se presenta como resultado satisfactorio de pruebas.

## Evidencia metodológica de preparación

Se utilizó la estructura de `.specify/templates/plan-template.md` y la definición local de
`speckit-plan`. Se comprobó la resolución de `specs/spec-001` mediante
`check-prerequisites.ps1 -Json -PathsOnly`, sin persistir selección fuera de la historia.
`setup-plan.ps1` no se ejecutó porque también escribe el estado de selección; se reprodujo
la lectura de plantilla y preparación documental dentro del alcance de esta fase.
Se preservaron los informes históricos. Los hooks opcionales de commit no se ejecutaron.
La comprobación final de enlaces y alcance es documental, no una ejecución de la aplicación.
