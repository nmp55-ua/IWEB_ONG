# Ficha de revisión técnica — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Rama**: spec-001 · **Fecha de preparación**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado en la fecha de preparación**: preparada para revisión.

## Alcance del incremento

T001–T005 preparan y validan la entrega temprana de
`backend/src/db/migraciones/004_donaciones.sql`. Incluye únicamente donantes,
suscripciones_socio y aportaciones. No incorpora tablas operativas, rutas, pantallas,
procesamiento de pagos, semillas o cambios de los servicios comunes.

La definición única es el [modelo común](../../modelo-datos.md), apartados donantes,
suscripciones_socio y aportaciones. El [plan común](../../plan-comun.md) y el
[plan de HU-01](../plan.md#preparación-temprana-de-la-migración-compartida) definen la
incorporación en dos entregas. La revisión se realiza antes de cualquier incorporación
compartida; T006 permanece pendiente.

## Contrato que debe revisar Rubén

| Aspecto            | Contrato propuesto y comprobación prevista                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad          | Donante con NIF/NIE único y Usuario opcional único. No existe UNIQUE de correo. La verificación por enlace y los conflictos funcionales no se implementan en 004.                       |
| Dinero             | NUMERIC(10,2), límite individual incluido de 1,00–999.999,99 EUR; no se limita la suma de varias aportaciones.                                                                          |
| Estados            | Aportación pendiente/confirmada/rechazada/cancelada; suscripción pendiente/activa/cancelada. Las transiciones y la inmutabilidad financiera se aplicarán en el servicio posterior.      |
| Cobros             | PaymentIntent único nullable; Invoice única nullable para cuotas; referencia única. La primera cuota y sus reentregas reutilizarán la misma aportación.                                 |
| Fechas             | fecha_cobro obligatoria al confirmar; fecha_alta puede faltar antes del primer cobro. Previsión con instante y DATE de Madrid, nullable; el servicio comprobará si sigue siendo futura. |
| Destino y relación | Proyecto opcional, NULL significa fondo general. Cuota vinculada a suscripción; puntual sin esa relación ni factura.                                                                    |
| Conservación       | Auditoría creado_en/actualizado_en e índice (donante_id, estado, fecha_cobro). FK con ON DELETE RESTRICT. No se generan borrados ni se modifica una migración existente.                |
| Consumo            | HU-02, HU-03 y HU-04 leerán solo confirmadas y usarán fecha_cobro para sus periodos. La entrega no implementa esas historias ni altera sus reglas.                                      |

## P-01–P-03 y límites de esta revisión

| Propuesta          | Fuente vigente                                                                                                           | Alcance de T001–T005                                                                                                             | Revisión e incorporación                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| P-01: persistencia | [Cambios comunes](../contracts/cambios-comunes.md#p-01--persistencia-y-transiciones), [uso del modelo](../data-model.md) | Tres tablas de dominio en 004, con pruebas aisladas. Las cuatro tablas técnicas y solicitud_checkout quedan para otra migración. | Revisión de Rubén y coordinación común pendientes. 009 no está reservado. |
| P-02: pasarela     | [Contrato Stripe](../contracts/pasarela-stripe.md), [API](../contracts/api-donaciones.md)                                | Sin cambios de envoltura, cliente, eventos, exclusión o rutas. Se revisa la compatibilidad del dominio con esos contratos.       | Preparador y consultas son trabajo posterior; no se atribuye aprobación.  |
| P-03: correo       | [Cambios comunes](../contracts/cambios-comunes.md#p-03--correo-compatible-y-recuperación)                                | Sin cambios SMTP, reservas, reintentos o notificaciones.                                                                         | Ampliación compatible pendiente de revisión e implementación.             |

PA1.1–PA1.8 y P-04 se mantienen. P-05 corresponde a la preparación anterior a Stripe real;
no se necesitan cuenta, credenciales o webhooks para validar 004.

## Evidencias previstas para T005

La [validación de 004](validacion-004-01.md) recogerá los resultados reales de:

1. 001–003 → 004 y 001–003/005 → 004, en esquemas nuevos dentro de ong_test_hu01.
2. Columnas, auditoría, nulabilidad, FK, estados, importes, unicidad y ausencia de UNIQUE de correo.
3. Migrador existente: incorporación por nombres pendientes y segunda ejecución sin reaplicar 004.
4. Conservación del esquema público, otras bases, archivos previos, lockfiles e informes históricos.

La ficha y una prueba superada no sustituyen la revisión humana. El resultado de T006,
las observaciones y la aprobación se registrarán únicamente cuando se produzcan.

## Estado de revisión

| Control                            | Estado                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| Ficha preparada durante la prueba           | Preparada.                                                  |
| Validación local de 004            | Resultados en el informe de T005; no equivale a aprobación. |
| Revisión de Rubén                  | Pendiente; no realizada por este bloque.                    |
| Acuerdo e incorporación compartida | Pendientes. No se realizan commit, push o merge.            |

## Ampliación operativa local — 2026-11-06

Se prepara `009_operativa_donaciones.sql` como propuesta local pendiente de coordinación,
como elección de numeración de HU-01 ni incorporación compartida. T006 y T007 permanecen pendientes.
El [LEEME de migraciones](../../../backend/src/db/migraciones/LEEME.md) registra esta condición.

T008–T013 añaden y validan las cuatro tablas técnicas del modelo, incluida solicitud_checkout,
sin alterar 004 ni depender de 006–008. T019 prepara fixtures, sesiones, conexiones y simulador
persistente para pruebas posteriores. La validación se conserva en
[validacion-local-01.md](validacion-local-01.md); no sustituye la revisión de Rubén ni acredita
rutas, reconciliación, reintentos de correo o integración real de Stripe.

## Preparación final de revisión — T081 · 2026-11-07

**Base comprobada:** rama spec-001, HEAD 9d86863; Se conservó la configuración local.
Los apartados anteriores describen la preparación original de 004 y la ampliación
operativa en sus fechas; no se sustituyen. Este apartado fija el estado de revisión actual.

### Implementación y documentación vigentes

Donación puntual, alta y cuotas de socio, rutas privadas, interfaz, vínculo por enlace,
normalización, exclusión de creación, conciliación de eventos y correo recuperable están
implementados en esta rama. La ampliación de Stripe mantiene las consultas canónicas
acacia y admite de forma limitada avisos acacia/endive; el correo conserva compatibilidad
con sus llamadas previas y opciones de tiempos propias de HU-01. Se mantienen los límites
de v1: sin historial, certificados, edición fiscal, devoluciones, cambios de cuota o baja
desde la aplicación.

README y LEEME de módulos/migraciones se contrastan con rutas, registro raw antes de JSON,
configuración, scripts npm, Docker y SQL existentes. El plan y las cabeceras/estados de
contratos se actualizan donde aún presentaban esa implementación como futura. No se
cambian contratos funcionales, modelo común, código o migraciones de este bloque.

La [matriz vigente](matriz-validacion-01.md) contiene P01–P21/S01–S13, G1–G3 y el contraste
de SC-001–SC-004. T079–T080 ya constan completadas en 9d86863; no se repiten. La
[medición 2](medicion-puntual-02.md) conserva 61 s medidos con cronómetro y 7/7 confirmaciones
recibidas por referencia del conjunto delimitado 30–36, según el registro de ejecución. La medición 1 de
480,836 s sigue íntegra y fallida; no se promedian resultados ni se atribuyen nuevas capturas.

Las pruebas reales y simuladas mantienen sus límites: las renovaciones/fallos de cuota,
alta de socio sin cuenta y primer cobro sin retorno y cancelación tras fallo no se
presentan como recorridos completos de Stripe real. G1–G3 acredita interfaz y persistencia
local, no otra facturación. Se conservan también las observaciones de T074 sobre registros
comunes de SMTP y errores inesperados; no se corrigen ni se ocultan como pruebas nuevas.

### Material preparado para Rubén, sin envío

El [resumen técnico HU-01 → HU-03](resumen-tecnico-hu03-01.md) identifica commits reales,
campos y reglas de consulta del dominio, vínculo verificado, NIF/NIE obligatorio,
inmutabilidad financiera, suma por fecha_cobro y rangos anuales Europe/Madrid.
Conserva las preguntas de integración sobre ausencia de NIF, correcciones y PA3.1 de HU-03,
sin inventar requisitos o acuerdos. La spec local de HU-03 se consulta, no se modifica.

004 existe y fue validada en 5291d31. **T006 sigue pendiente de la revisión real de Rubén**,
incluidos contrato de dominio y cambios comunes P-01–P-03. Puede acreditarse mediante
la revisión de la PR, con observaciones y evidencias efectivas, sin fingir una revisión previa.

009 existe y se validó localmente como `009_operativa_donaciones.sql`, sin modificar 004
ni depender de 006–008. **T007 sigue pendiente**. La comprobación previa aportada durante la prueba
no encontró 009 en las ramas publicadas consultadas; no modifica
descarta trabajo sin publicar. La coordinación debe considerar los nombres registrados
por el migrador y los entornos donde ya se aplicó. No se renombra ni reaplica SQL aquí.

### Contraste del criterio de T081

| Comprobación                     | Resultado                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Dependencia T080                 | Completada y documentada; sin repetir pruebas.                                                         |
| Rutas, comandos y funcionamiento | Documentación contrastada con archivos actuales; diferencias documentales corregidas.                  |
| Evidencias y límites             | Fuentes identificadas en matriz e informes; históricos conservados y sin resultados nuevos atribuidos. |
| Material de revisión             | Ficha y resumen técnico preparados, sin enviarlos ni atribuir aprobación.                              |
| Alcance de la tarea              | T081 exige preparar la revisión, no recibirla. Se marca por esa preparación; T006 permanece abierta.   |

Se aplica el procedimiento Spec Kit del repositorio correspondiente a esta fase. Se mantienen el alcance y los resultados descritos en el informe.

T081 prepara una revisión trazable, no publicación o integración. Los commits identificados
se comprueban en el historial local; los documentos de este bloque siguen siendo cambios
locales hasta su registro e incorporación autorizados. No se envía ningún mensaje a Rubén.

### Comprobación documental de T081

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

## Paquete completo y ajuste de flujo — 2026-11-07

**Base de esta entrega:** 47e3ea1 en spec-001. El primer converge y las notas anteriores
se conservan con sus estados históricos. [converge-1.md](converge-1.md) permanece íntegro;
los cambios locales pendientes al comenzar no se descartan ni se repiten sus commits.

El [ajuste de flujo documentado](ajuste-flujo-01.md) separa el trabajo técnico
de los controles antes de main. **T006 prepara ahora el paquete completo**, sin exigir
recibir antes aprobación; **T007 comprueba y registra la elección local de 009**, como elección de numeración de HU-01. Sus significados anteriores y estados pendientes quedan trazados en
ese registro y en los informes históricos, sin presentar la revisión como realizada.

### Contenido disponible para la revisión de Rubén

| Parte del paquete                           | Archivos y evidencia                                                                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dominio de 004                              | Migración intacta; modelo único y validacion-004-01.md con las dos secuencias, restricciones y migrador por nombre.                                |
| P-01–P-03                                   | Contratos HTTP, pasarela y cambios comunes; plan, uso del modelo y pruebas de compatibilidad. Sin acuerdo colectivo atribuido.                     |
| Implementación                              | Módulo donaciones, páginas/componentes y entradas comunes identificadas en el plan; commits locales reales en resumen-tecnico-hu03-01.md.          |
| Correcciones posteriores al primer converge | CONV-001/CONV-002, cuatro fallos iniciales reproducidos, corrección mínima y regresiones en validacion-converge-01.md.                             |
| Validación funcional y límites              | Matriz de 34 escenarios, Stripe real de pruebas frente a simulación, mediciones 1/2 y conjunto 7/7 delimitado conservados.                         |
| Consumo desde HU-03                         | Resumen de campos, fechas Europe/Madrid, inmutabilidad, vínculo verificado y preguntas de NIF/correcciones/regeneración sin requisitos inventados. |
| Numeración y controles de PR                | Consulta de nueve ramas/seis commits y elección local de 009, los controles de incorporación pendientes en ajuste-flujo-01.md y LEEME.                              |

La regresión del bloque corregido da **83/83** en cuatro archivos y **21/21** de eventos
puntuales en otra ejecución justificada por reutilizar el servicio de correo. No se
presentan como una suite global nueva ni sustituyen pruebas reales. Se conserva el
aviso de fallo como información histórica; no se suprime ni se cambia el resumen guardado.

T006 se completa por tener este paquete preparado. T007 se completa por la comprobación
actual y elección documentada; ninguna de ellas acredita aprobación o coordinación
colectiva consumadas. Las consultas publicadas no contienen el HEAD local ni prueban
publicación de las correcciones. No se envía este material ni se abre una PR aquí.

### Controles externos que siguen pendientes

- **el control de revisión:** revisión y aprobación reales de Rubén del paquete completo y resolución
  de observaciones, incluidos 004/P-01–P-03 y la coordinación común aplicable.
- **el control de integración:** explicación de la elección de 009 en la PR y resolución de conflictos
  antes de main; considerar los nombres aplicados en los entornos existentes antes
  de cualquier renombrado. No se cambia SQL o su registro en esta entrega.

No bloquean el cierre técnico ni preparar/abrir la PR. Sí condicionan main. El cierre técnico está acreditado posteriormente en [converge-3.md](converge-3.md), registrado en 9468636; la revisión externa y la incorporación siguen pendientes. Los apartados anteriores conservan los antecedentes fechados de la preparación.


## Revisión de entrega registrada sobre 9468636

La revisión de entrega del 2026-11-07 examinó 93 archivos de diferencia y 81 textos, con comprobación de sintaxis de 29 archivos JS. La regresión aislada terminó con 393/393 pruebas aprobadas en 13 archivos, sin omisiones (50,12 s), y build correcto. Incluyó donaciones y correo, sin ejecutar pagos ni envíos reales. Esta ejecución es anterior a la integración de main y se conserva separada de las validaciones posteriores.
