# Ficha de revisión técnica — HU-01

**Rama**: spec-001 · **Fecha de preparación**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Preparada para revisión. No consta revisión ni aprobación de Rubén o acuerdo colectivo.

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
| Ficha preparada por Nada           | Preparada.                                                  |
| Validación local de 004            | Resultados en el informe de T005; no equivale a aprobación. |
| Revisión de Rubén                  | Pendiente; no realizada por este bloque.                    |
| Acuerdo e incorporación compartida | Pendientes. No se realizan commit, push o merge.            |

## Ampliación operativa local — 2026-11-06

Se prepara `009_operativa_donaciones.sql` como propuesta local pendiente de coordinación,
sin reserva colectiva ni incorporación compartida. T006 y T007 permanecen pendientes.
El [LEEME de migraciones](../../../backend/src/db/migraciones/LEEME.md) registra esta condición.

T008–T013 añaden y validan las cuatro tablas técnicas del modelo, incluida solicitud_checkout,
sin alterar 004 ni depender de 006–008. T019 prepara fixtures, sesiones, conexiones y simulador
persistente para pruebas posteriores. La validación se conserva en
[validacion-local-01.md](validacion-local-01.md); no sustituye la revisión de Rubén ni acredita
rutas, reconciliación, reintentos de correo o integración real de Stripe.

## Preparación final de revisión — T081 · 2026-11-07

**Base comprobada:** rama spec-001, HEAD 9d86863; únicamente `.claude/launch.json`
sin seguimiento al comenzar. Se conserva junto con `.env` y los informes históricos.
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
[medición 2](medicion-puntual-02.md) conserva 61 s observados por Nada y 7/7 confirmaciones
recibidas por referencia del conjunto delimitado 30–36, según el guía. La medición 1 de
480,836 s sigue íntegra y fallida; no se promedian resultados ni se atribuyen nuevas capturas.

Las pruebas reales y simuladas mantienen sus límites: las renovaciones/fallos de cuota,
alta de socio sin cuenta y primer cobro sin retorno, y cancelación tras fallo no se
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
ni depender de 006–008. **T007 sigue pendiente**. La comprobación previa comunicada por Nada
no encontró 009 en las ramas publicadas consultadas; no es una reserva colectiva ni
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

Se consulta además la [preparación de converge](preparacion-converge-01.md), con definición
local, sintaxis y siguiente encargo exacto. La invocación no está registrada como herramienta
en esta sesión y puede seguirse el archivo local. La comprobación `-Json -PathsOnly`
resuelve specs/spec-001 sin persistir selección; los parámetros normales de requisitos se
verifican en el script. **Converge no se ejecuta ni se declara HU-01 terminada.**

T081 prepara una revisión trazable, no publicación o integración. Los commits identificados
se comprueban en el historial local; los documentos de este bloque siguen siendo cambios
locales hasta su registro e incorporación autorizados. No se envía ningún mensaje a Rubén.

### Comprobación documental de T081

- Once documentos revisados; enlaces locales sin destinos ausentes y siete rutas de
  donaciones contrastadas entre código, contrato y LEEME.
- Trece commits del resumen comprobados como antecesores de HEAD en el historial local;
  no se consultan remotos ni se acredita publicación con esa comprobación.
- Prettier y `git diff --check` correctos; índice sin modificaciones. Se corrigió un
  espacio final detectado en la actualización del plan, sin cambiar contenido funcional.
- Comparación SHA-256: `.env`, `.claude/launch.json`, HU-03 e informes históricos intactos,
  salvo la ampliación autorizada de esta ficha. Solo cambian los documentos del bloque.
- No se ejecutan suites, pagos, reenvíos, configuración, comunicaciones externas o
  escrituras de Git. Rama spec-001 y HEAD 9d86863 conservados.
