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
