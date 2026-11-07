# Plan técnico de HU-01 — Donación puntual y alta como socio

**Rama**: `spec-001` · **Fecha**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Implementación, validación y preparación de revisión documentadas; correcciones
T082–T083 verificadas. T006 prepara el paquete y T007 acredita la elección local de 009.
Revisión/aprobación y conflictos de integración permanecen como controles externos de la PR.
Cierre técnico pendiente del converge posterior; no acredita incorporación compartida.

**Especificación vigente**: [spec.md](spec.md) · **Investigación**: [research.md](research.md)

## Resumen

HU-01 permite donar y hacerse socio sin cuenta mediante Stripe Checkout. La confirmación
depende de notificaciones firmadas y de la comprobación del estado actual en Stripe. Una
aportación representa un cobro, no cada intento ni cada evento recibido. La primera cuota
reutiliza la aportación pendiente del alta; las siguientes se identifican por factura.

Se conserva la arquitectura del [plan común](../plan-comun.md). Este documento añade
únicamente los flujos de donaciones, su seguridad, sus contratos y su validación.
V1 usa exclusivamente tarjeta, EUR y entre 1,00 € y 999.999,99 €, ambos incluidos, con máximo
dos decimales. El máximo es una elección de la aplicación.
El historial, los certificados y los informes consumen datos de HU-01, pero no se implementan
como parte de esta historia. No hay edición de datos fiscales, cuota o baja desde la aplicación.

## Contexto técnico

| Aspecto      | Base comprobada y decisión                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lenguaje     | JavaScript con módulos ES; Node.js 22. Se ha comprobado Node.js 22.20.0 en el entorno.                                                                                                                                                               |
| Interfaz     | Astro SSR, React 19 y Tailwind 3; reutilización de `Layout.astro`, componentes comunes, `lib/api.js` y `lib/formato.js`.                                                                                                                             |
| Servidor     | Express 4, `zod`, `pg`, sesiones comunes, `ErrorApi` y envoltura `asincrono`.                                                                                                                                                                        |
| Persistencia | PostgreSQL 16. Entidades del [modelo común](../modelo-datos.md); definición única alineada en el modelo común y uso descrito en [data-model.md](data-model.md).                                                                                      |
| Stripe       | SDK instalado **17.7.0**; cliente con API **2025-02-24.acacia**, timeout 3000 ms y cero reintentos automáticos. Avisos snapshot acacia y **2026-10-28.endive** según compatibilidad limitada del contrato; recursos canónicos consultados en acacia. |
| Correo       | `enviarCorreo({ para, asunto, texto }, opciones)` devuelve booleano y conserva las llamadas de un argumento. HU-01 selecciona tiempos 3000/3000/5000 ms, persiste el envío en su módulo y exige recepción observada para SC-002.                     |
| Pruebas      | Vitest/Supertest y PostgreSQL aislado, pasarela/SMTP simulados y recorridos de navegador. Stripe de pruebas y Mailpit acreditados para puntuales, altas, reentregas y cancelación; límites por escenario en la matriz. No se repiten en T081.        |
| Objetivos    | Donación habitual en menos de tres minutos; importes exactos, interfaz española, fechas de Madrid y correo verificable según SC-002.                                                                                                                 |
| Volumen      | ONG pequeña. Procesamiento síncrono y acotado de notificaciones, sin nueva cola ni servicios independientes.                                                                                                                                         |

## Comprobación de la constitución

| Principios                             | Aplicación al diseño                                                                                                                                 | Resultado de revisión documental                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| I–II: simplicidad y alcance            | SQL directo, servicios existentes, sin edición de perfil, pagos propios, reembolsos ni funcionalidades de HU-02.                                     | Compatible con el alcance.                                                                                          |
| III–IV: verificabilidad y presentación | Matriz P01–P21/S01–S13 y SC-001–SC-004 en [matriz de validación](refinamiento/matriz-validacion-01.md); euros exactos y `Europe/Madrid`.             | Balance T080 documentado; evidencia real y simulada diferenciadas, sin declarar converge.                           |
| V–VI: seguridad e historial            | Checkout alojado, vínculo acreditado, autorización por operación, registros conservados y confirmación de cobro no reversible por un evento antiguo. | Persistencia implementada y comprobaciones de seguridad T074 documentadas; observaciones para revisión conservadas. |
| VII–IX: pila y reutilización           | Se mantienen módulos, capas, errores y entidades comunes. Stripe solo se usa desde su envoltura; correo compatible por opciones propias de HU-01.    | Implementado en esta rama; revisión e incorporación compartida pendientes.                                          |
| X–XI: autoría y revisión               | Nada responsable y Rubén revisor; rama `spec-001`.                                                                                                   | Revisión de Rubén no realizada.                                                                                     |
| XII: cambios compartidos               | P-01–P-03 alineados documentalmente y P-04 fijado en esta rama. P-05 es preparación de entorno.                                                      | Revisión de Rubén e incorporación compartida pendientes; no se acredita acuerdo colectivo.                          |

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

## Estructura implementada del código

Archivos principales existentes en esta rama; pruebas y soporte adicionales se identifican
en tasks.md y la matriz de validación:

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
backend/src/db/migraciones/009_operativa_donaciones.sql (provisional)
backend/src/db/semillas/donaciones.js
```

`rutas.js` registra los contratos de [API](contracts/api-donaciones.md). El controlador
valida con zod; el servicio aplica identidad, permisos, estados y transacciones; el
repositorio contiene SQL parametrizado. Los ayudantes propios no duplican servicios comunes.
El router ya está registrado en `backend/src/app.js`, con raw antes de JSON y sin sesión
en el webhook, según P-02. No se alteran autenticación, roles ni cookies comunes.

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

Las cuatro tablas operativas ya están implementadas y validadas en
`009_operativa_donaciones.sql`, dependiente solo de 004 y su base común, sin esperar
006–008. **009 no está reservado colectivamente**: T007 registra su elección para esta
rama tras comprobar las nueve cabezas publicadas. La comprobación y alcance constan en
[ajuste-flujo-01.md](refinamiento/ajuste-flujo-01.md). Antes de main se resolverán los
conflictos de numeración, considerando entornos ya migrados; la ausencia publicada no
descarta trabajo sin publicar. 004 se conserva intacta; su creación y
validación constan en el commit local 5291d31, sin atribuir publicación o aprobación.

## Validación y evidencias vigentes

[quickstart.md](quickstart.md) relaciona todos los escenarios con sus entradas, resultados y
comprobaciones. Incluye rechazos, correos, límites de sesión, vínculo, concurrencia y cambios
de orden de eventos. Las pruebas de estados usan recursos canónicos simulados con los
campos de la versión fijada; una permutación de snapshots antiguos no sustituye simular el
estado actual consultado a la pasarela. Las pruebas reales de Checkout son manuales en modo
de pruebas. No se somete la pasarela externa a pruebas de carga.

SC-002 exige observar el mensaje en Mailpit; una respuesta booleana o un aviso de pantalla
no demuestran recepción. Las pruebas financieras comprueban cardinalidad y sumas, no solo
el texto de respuesta. Las ejecuciones y límites constan en la
[matriz vigente](refinamiento/matriz-validacion-01.md) y sus fuentes: regresión del módulo
367/367, comprobación dirigida G1–G3 de 17/17 y pruebas reales comunicadas de Stripe.
No se suman suites de fechas diferentes como una nueva ejecución conjunta.
La [medición 2](refinamiento/medicion-puntual-02.md) registra 61 s observados por Nada y
7/7 confirmaciones recibidas del conjunto 30–36, según el guía. Se conserva la medición 1
fallida de 480,836 s. T079–T080 están documentadas; la revisión de Rubén no se ha realizado.

## Estado del diseño y revisión pendiente

P-01 centraliza datos y transiciones en el modelo común. P-02 fija funciones compatibles de
pasarela; P-03 añade opciones de correo solo para HU-01, conservando las llamadas ajenas.
P-04 fija tarjeta, EUR y rango de importe propio de la aplicación. No quedan decisiones de
diseño identificadas sin resolver que impidan preparar el desglose en tareas.

La revisión de Rubén y la incorporación de los cambios comunes siguen pendientes, según la
constitución; el estado de esta rama no acredita un acuerdo colectivo. Funciones,
migraciones, semillas y pruebas están implementadas en spec-001. P-05 conserva la
preparación y las comprobaciones de T075–T076 en
[preparacion-stripe-01.md](refinamiento/preparacion-stripe-01.md); T077–T078 y los informes
de medición acreditan los recorridos reales realizados, sin afirmar los ciclos o fallos
reales no ejecutados. Este plan actualizado no ejecuta pruebas ni modifica configuración.

El [ajuste autorizado por Nada](refinamiento/ajuste-flujo-01.md) separa preparación técnica
y controles de incorporación: T006/T007 no incluyen aprobación ni reserva colectiva.
Rubén revisará el paquete completo en la PR antes de main; esto no bloquea terminar el
desarrollo, preparar/abrir la PR o ejecutar el próximo converge autorizado. PR-R01/PR-R02
siguen pendientes. Las [correcciones T082–T083](refinamiento/validacion-converge-01.md)
resuelven los dos hallazgos del primer diagnóstico sin modificarlo; no sustituyen el
converge posterior ni declaran cierre técnico.

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
