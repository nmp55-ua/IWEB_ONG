# Segundo informe de analyze — HU-01

**Identificador**: analyze-2 · **Fecha**: 2026-11-06  
**Rama y funcionalidad**: `spec-001` · `specs/spec-001`  
**Referencia Git observada**: `bdd6476`, con documentación local pendiente de commit.  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Segundo diagnóstico documental, posterior a las correcciones de COV-001 y
UND-001. No acredita funcionamiento, pruebas superadas, revisión de Rubén o acuerdo colectivo.

## Resultado ejecutivo

Los identificadores **COV-001 y UND-001 quedan resueltos documentalmente** en el estado
revisado. Se conserva su gravedad inicial MEDIA para mantener la trazabilidad, sin
contabilizarlos como defectos activos. **No se detectan hallazgos nuevos** críticos, altos,
medios o bajos en este contraste.

La cobertura prevista pasa de 18 a **19 FR completos** y de 32 a **34 escenarios completos**;
los **4 SC** conservan comprobaciones previstas. Esta evaluación contrasta el contenido de
las tareas, contratos y casos; no se obtiene únicamente del número de filas en las matrices.
No se ha ejecutado ninguna prueba funcional ni se ha marcado una tarea.

La preparación temprana de 004, la revisión compartida, la coordinación de la migración
operativa y P-05 permanecen diferenciadas. Las pendientes de integración y comprobación
no se presentan como defectos ya observados ni como resultados satisfactorios.

## Procedimiento y alcance de solo lectura

Al no estar registrado /speckit-analyze en esta sesión, se sigue su
[definición local](../../../.claude/skills/speckit-analyze/SKILL.md): inventario semántico,
duplicaciones, ambigüedad, precisión, alineación constitucional, cobertura y dependencias.
La adaptación autorizada permite guardar únicamente este informe durante el segundo
analyze. Las correcciones y el registro de hallazgos se habían guardado antes de iniciarlo;
no se aplican correcciones durante el diagnóstico.

La resolución inicial sin selección explícita informa de que falta el contexto de
funcionalidad. Los scripts reales no deducen la carpeta a partir de la rama: usan
SPECIFY_FEATURE_DIRECTORY o .specify/feature.json. Se establece **solo en el proceso**
SPECIFY_FEATURE_DIRECTORY=specs/spec-001 y se comprueba la resolución mediante
check-prerequisites.ps1 -Json -PathsOnly y Get-FeaturePathsEnv -NoPersist. Ambos devuelven
la carpeta absoluta de HU-01; spec, plan, tasks y los seis documentos de diseño adicionales
existen. No se crea feature.json ni se altera configuración persistida. Se evita la variante
del chequeo que puede persistir selección; sus requisitos de existencia se comprueban
directamente. Se omiten los hooks opcionales de commit.

Se leen los documentos vigentes y se contrastan las interfaces existentes de pool,
pasarela, autenticación y migrador. Las comprobaciones de formato, enlaces, identificadores,
dependencias y conservación de archivos son estáticas. No se ejecutan aplicación,
compilación, instalaciones, servicios, SQL, pruebas, operaciones de Stripe o escrituras
de Git. No se leen valores de secretos. Los informes históricos se tratan como evidencia
de evolución, no como contratos vigentes que deban reescribirse.

## Fuentes y localización

Las ubicaciones siguientes corresponden al estado corregido leído en esta segunda
revisión. Las ubicaciones iniciales siguen en analyze-1 y no se sustituyen retrospectivamente.
Las rutas parten de `E:\asignaturas\IWeb\Practica grupal\IWEB_ONG`.

| Fuente | Líneas |
|---|---:|
| [specs/spec-001/spec.md](../spec.md) | 184 |
| [specs/spec-001/plan.md](../plan.md) | 216 |
| [specs/spec-001/tasks.md](../tasks.md) | 580 |
| [specs/spec-001/research.md](../research.md) | 212 |
| [specs/spec-001/data-model.md](../data-model.md) | 74 |
| [specs/spec-001/contracts/api-donaciones.md](../contracts/api-donaciones.md) | 213 |
| [specs/spec-001/contracts/pasarela-stripe.md](../contracts/pasarela-stripe.md) | 277 |
| [specs/spec-001/contracts/cambios-comunes.md](../contracts/cambios-comunes.md) | 135 |
| [specs/spec-001/quickstart.md](../quickstart.md) | 379 |
| [.specify/memory/constitution.md](../../../.specify/memory/constitution.md) | 94 |
| [CONVENCIONES.md](../../../CONVENCIONES.md) | 138 |
| [specs/plan-comun.md](../../plan-comun.md) | 433 |
| [specs/modelo-datos.md](../../modelo-datos.md) | 415 |
| [specs/spec-001/refinamiento/registro-hallazgos.md](registro-hallazgos.md) | 66 |
| [specs/spec-001/refinamiento/analyze-1.md](analyze-1.md) | 367 |

También se contrastan, sin modificarlos, backend/src/db/pool.js,
backend/src/db/migrar.js, backend/src/servicios-comunes/pasarela.js,
frontend/src/components/auth/FormEntrar.jsx, frontend/src/pages/registro.astro,
backend/package.json y los LEEME de módulos y migraciones. El pool exportado permite
retener un cliente sin ampliar el contrato común de conexión; FormEntrar ya admite volverA.
El migrador registra nombres aplicados, por lo que 004 puede incorporarse después de 005.
La propuesta de ampliar la envoltura se identifica como trabajo futuro, no como función
ya presente.

## Seguimiento de los hallazgos iniciales

| ID | Gravedad inicial | Ubicación vigente y evidencia | Resultado de la segunda revisión | Recomendación y límite |
|---|---|---|---|---|
| COV-001 | MEDIA | spec.md:57–58,122; plan.md:138–143; api-donaciones.md:158–204; tasks.md:207–209,255–281,291–293,505,540–541; quickstart.md:262–263 | Resuelto documentalmente. Se concreta la entrada desde ambas páginas, estado sin token, solicitud autenticada, aviso genérico, recepción y confirmación, con tareas y comprobaciones visibles. | Implementar y verificar en la fase autorizada; mantener pendiente la revisión de Rubén. No se acredita envío, vínculo o interfaz operativa. |
| UND-001 | MEDIA | modelo-datos.md:199–249; pasarela-stripe.md:48–122; api-donaciones.md:81–119,135; tasks.md:108–114,132–138,152–154,199–201,219–229; quickstart.md:325–347 | Resuelto documentalmente. La conexión acredita actividad, se precisan adquisición/liberación y reanudación, cuerpo inmutable y plazo fijo; se prevén concurrencia, timeout, caída y reinicio. | Revisar P-01/P-02 antes de incorporar; implementar y probar con PostgreSQL y simulador persistente. No se acredita ausencia real de duplicados o fugas de conexión. |

El [registro de hallazgos](registro-hallazgos.md) conserva evidencia, decisión, historia y
criterios, documentos afectados, responsable, revisor y estado. Los mismos ID se mantienen;
no se renumeran como hallazgos nuevos.

### COV-001: comprobación del recorrido completo

- /donar y /donar/resultado ofrecen «Vincular mis aportaciones a una cuenta» hacia
  /donar/vincular, con independencia de HU-02 o del permiso sobre otra operación.
- Sin token se reutiliza FormEntrar con volverA=/donar/vincular. La cuenta donante
  obtiene contexto/CSRF y solicita el enlace con un botón explícito. No se modifica el
  registro, inicio de sesión o asignación de roles.
- El POST no acepta un correo objetivo arbitrario. El 202 y su texto genérico son
  iguales con/sin Donante elegible, incluido fallo SMTP individual. No prueban envío,
  titularidad o vínculo; la indisponibilidad común no revela la búsqueda individual.
- Con token se retira el fragmento, se conserva temporalmente en la pestaña y se exige
  la cuenta solicitante y una confirmación POST. GET no solicita, reemite o consume.
  Caducidad/uso permiten volver a solicitar mediante una acción explícita.
- T045/T047 concretan las entradas; T049 el estado inicial y el consumo; T031/T043
  los contratos y controles; T052 recorre P11/P12 mediante Mailpit. No se sustituye
  este recorrido por una llamada externa al endpoint o por una revisión final genérica.

Estas acciones y resultados cierran el paso de interfaz ausente en el primer informe.
La restricción de acceso por correo probado permanece en el servidor.

### UND-001: comprobación del protocolo de creación

| Aspecto | Definición contrastada | Comprobación futura |
|---|---|---|
| Actividad | UUID canónico produce la misma clave consultiva y clave Stripe; incierta no equivale a proceso vivo. | T029: concurrencia y UUID equivalentes en mayúsculas/minúsculas. |
| Preparación | Bloqueo transaccional corto, creación atómica y snapshot una sola vez; commit antes de HTTP. | T008/T009 y T029/T034: una operación, referencia y cuerpo. |
| Adquisición | Permiso guardado antes de retener cliente; pg_try_advisory_lock en ese cliente. False implica 409 y ningún envío nuevo. | T019/T029: dos conexiones, una creación activa y segunda denegada. |
| Tramo protegido | Se releen permiso, estado e ID. SQL usa el mismo cliente y HTTP queda fuera de transacción. No se pide otra conexión al pool. | T029/T034/T035: carreras, agotamiento controlado y respuesta tardía. |
| Liberación | Finally termina transacción corta y desbloquea antes de release; release(true) destruye cliente si no se acredita liberación. | T029: error/timeout, pérdida de conexión y ausencia de lock devuelto al pool. |
| Reinicio | La conexión caída pierde el bloqueo al terminar. Solo quien readquiere puede releer y reanudar con permiso/plazo, sin forzar una conexión aún viva. | T019/T029: dos procesos, misma base/secreto y simulador que conserva la respuesta por clave. |
| Cuerpo y clave | Snapshot persistido interno, misma operación/referencia y clave hu01:UUID; DTO corto autorizado sin datos fiscales en sessionStorage. | T014/T029/T045/T047: reinicio y cambio de configuración no recalculan parámetros ni autorizan por UUID. |
| Plazo fijo | 23 horas desde creado_en, reloj real de PostgreSQL, sin renovación por actualizado_en/error/reintento. No amplía las ocho horas de invitado. | T029 y quickstart: justo antes/al alcanzar el límite, permiso vencido y cero nuevas creaciones de recuperación. |
| Resultado desconocido vencido | Revisión requerida sin inventar estado financiero ni usar otro UUID/cuerpo/cobro. Con Session conocida solo consulta/reutilización. | T029/T036/T047: códigos 409/503 y presentación sin reinicio automático. |
| Ambas modalidades | T059 usa el mismo protocolo para alta y primera cuota; cuotas de ciclo conservan deduplicación por factura. | T054/T055 y regresión T072; no se confunde creación de Checkout con confirmación de dinero. |

La ventana de 23 horas es una decisión local conservadora, con margen respecto de la
[retención mínima de claves descrita por Stripe](https://docs.stripe.com/api/idempotent_requests?lang=node).
No es una garantía de recuperación automática ni prolonga la vigencia de autorización.
El [bloqueo consultivo de PostgreSQL](https://www.postgresql.org/docs/16/explicit-locking.html#ADVISORY-LOCKS)
y [release del cliente](https://node-postgres.com/apis/pool#releasing-clients) sustentan
el diseño; su documentación no demuestra una prueba local.

Se justifica **una sola columna adicional**, operaciones_pago.solicitud_checkout JSONB
no nula e inmutable: una huella no reconstruye las URL o descripciones originales después
de un reinicio/cambio de configuración. La definición única está en el modelo común.
No se añaden tabla de locks, propietario persistido o lease de creación; creado_en ya
ancla el plazo. El campo pertenece a la ampliación operativa, no a 004. El preparador
puro y el argumento opcional de la envoltura preservan llamadas anteriores; su aplicación
y la revisión de Rubén siguen pendientes. No se persisten respuestas/eventos completos
ni datos de tarjeta, fiscales innecesarios, sesión o secretos en esa instantánea.

## Hallazgos activos o nuevos

No se identifican hallazgos documentales activos en el alcance contrastado. No se
reabre clarify, se modifica una decisión funcional o se corrige un documento durante
este segundo analyze. La ausencia de un hallazgo documental no acredita implementación,
validación, integración compartida o convergencia de HU-01.

## Cobertura efectiva prevista

«Prevista completa» exige tarea de acción/invariante y comprobación observable coherentes
con el contrato. Sigue sin significar prueba escrita, ejecutada o aprobada. Los IDs P/S
son los escenarios numerados de US1/US2 de **HU-01**; US2 no es HU-02.

### Requisitos funcionales

| Requisito | Cobertura evaluada | Implementación/soporte previsto | Comprobación prevista | Justificación semántica |
|---|---|---|---|---|
| FR-001 | Prevista completa | T015, T036, T059–T060, T069 | T029, T054 | Dos modalidades y tres periodicidades; sin nueva funcionalidad de HU-02. |
| FR-002 | Prevista completa | T004, T021, T036, T060 | T020, T029, T054 | Extremos incluidos, céntimos, coma/punto, rechazo sin redondeo y repetición para socio. |
| FR-003 | Prevista completa | T034–T035, T045 | T029, T053 | Proyecto activo, destino NULL y nueva elección si se desactiva; no reasignación silenciosa. |
| FR-004 | Prevista completa | T021, T033, T036, T045 | T020, T029 | Datos mínimos, control NIF/NIE y validación de entrada antes de la pasarela. |
| FR-005 | Prevista completa | T015–T016, T036, T045 | T014, T074, T077 | Checkout alojado card/EUR y proyecciones sin tarjeta; auditoría prevista, no realizada. |
| FR-006 | Prevista completa | T004, T038–T039, T062 | T003, T030, T054–T055 | Estados y recuperación del mismo pago; la preparación incierta tiene ahora arbitraje, liberación y plazo explícitos. |
| FR-007 | Prevista completa | T025–T026, T040, T047, T070 | T024, T031, T077, T079 | Resumen persistido, pago separado de correo y recepción final comprobable en Mailpit. |
| FR-008 | Prevista completa | T058–T059, T062, T066, T069–T070 | T054, T056, T078 | Alta pendiente/activa/cancelada, rechazo recuperable y cierre definitivo; sin edición o baja local. |
| FR-009 | Prevista completa | T063–T064 | T055, T072 | Una cuota por factura de ciclo; primera factura se reconcilia aparte. |
| FR-010 | Prevista completa | T015, T034–T035, T037–T038, T061, T063–T064 | T003, T014, T029–T030, T055 | UUID/cuerpo/clave estables, exclusión y ventana fija; evento y dinero deduplicados por separado. |
| FR-011 | Prevista completa | T023, T035–T036, T043, T059 | T022, T029, T031, T054 | Puntual y socio sin cuenta; correo coincidente no autoriza. La entrada web de vinculación queda cubierta junto a FR-013. |
| FR-012 | Prevista completa | T026, T041, T047, T070 | T024, T031, T057, T079 | Reintento autorizado del mismo mensaje, lease e intento; sin pagos, altas o aportaciones nuevas. |
| FR-013 | Prevista completa | T042–T045, T047, T049 | T022, T031, T052, T074 | Entradas desde formulario/resultado, página sin token, solicitud, aviso genérico y confirmación; controles negativos y recorrido visible explícitos. |
| FR-014 | Prevista completa | T032–T033, T059 | T028, T054 | Correo con otro NIF se rechaza antes de Stripe sin mostrar ni mezclar datos; se contempla concurrencia. |
| FR-015 | Prevista completa | T021, T032–T033, T059 | T020, T028, T054 | Datos reales distintos se rechazan aun con cuenta vinculada; formato equivalente reutiliza sin sobrescribir. |
| FR-016 | Prevista completa | T023, T040–T041, T068 | T022, T031, T057 | Permiso por operación, ocho horas, 404 genérico y denegación de otras operaciones/cuotas; cuenta vinculada como vía separada. |
| FR-017 | Prevista completa | T037–T039, T061–T062 | T030, T055, T077 | Webhook firmado sin cookie, rollback/reentrega y procesamiento sin retorno de navegador. |
| FR-018 | Prevista completa | T065–T066, T068, T070 | T055–T056, T072, T078 | Fallo no suma/cancela por sí solo; aviso separado, cancelación canónica y preservación de anteriores. |
| FR-019 | Prevista completa | T067–T068, T070 | T056, T072 | Última factura, previsión futura o NULL; vencimiento intradía e invoice.updated, sin cálculo local. |

### Criterios de éxito

| Criterio | Cobertura evaluada | Tareas y comprobación | Evidencia prevista |
|---|---|---|---|
| SC-001 | Prevista completa | T045–T047; T079 | Cronometraje desde formulario a confirmación, inferior a tres minutos; no se sustituye por que el frontend compile. |
| SC-002 | Prevista completa | T024–T026, T041; T077, T079 | Exige mensaje recibido por cada referencia confirmada de la ejecución, incluido reintento. Booleano, aviso y mocks no acreditan recepción. |
| SC-003 | Prevista completa | T014–T016, T045; T074 | Auditoría de payloads/base/sesión/logs/evidencias sin tarjeta o tokens en claro; no solo revisión visual del formulario. |
| SC-004 | Prevista completa | T020–T021, T030, T038, T055, T062–T063; T077–T079 | Comparación al céntimo entre recursos canónicos, base, pantalla y mensaje; cardinalidad y sumas tras duplicados. |

### Escenarios

| Escenario | Cobertura evaluada | Implementación y comprobación | Resultado observable previsto |
|---|---|---|---|
| P01 | Completa prevista | T035–T040, T045–T048; T029–T030, T077 | 20 €, fondo general, fecha/modalidad/referencia; una confirmada. |
| P02 | Completa prevista | T034–T035, T040, T045; T029, T077 | Mismo proyecto activo en persistencia, pantalla y correo. |
| P03 | Completa prevista | T021, T036, T045; T020, T029, T052 | Fuera de rango o tres decimales: error de campo, sin Checkout; extremos también para socio. |
| P04 | Completa prevista | T021, T036, T045; T020, T029 | NIF/NIE inválido y controles de entrada antes de pago. |
| P05 | Completa prevista | T038–T039, T047; T030, T077 | Rechazo/cierre acreditado sin confirmada, retorno no equivale a cancelación y reintento del contrato. |
| P06 | Completa prevista | T026, T047; T024, T077, T079 | Mismo resumen recibido; no basta éxito simulado de SMTP. |
| P07 | Completa prevista | T035–T036, T046, T051; T029, T077 | Donación puntual sin cuenta. |
| P08 | Completa prevista | T026, T040, T047; T024, T031 | Fallo de correo conserva pago, resumen y aviso. |
| P09 | Completa prevista | T026, T041, T047; T024, T031, T079 | Reintento satisfactorio mantiene referencia y una sola aportación, sin Stripe. |
| P10 | Completa prevista | T026, T041, T047; T024, T031 | Reintento fallido conserva pendiente y opción autorizada, sin éxito ficticio. |
| P11 | Completa prevista | T023, T043–T045, T047, T049; T022, T031, T052 | Entrada desde ambas páginas, acceso existente, solicitud explícita sin vínculo por mera coincidencia; 202 genérico. |
| P12 | Completa prevista | T042–T045, T047, T049; T031, T052 | Solicitud → Mailpit → apertura → confirmación por la misma cuenta; token ajeno/vencido/usado y GET sin efectos. |
| P13 | Completa prevista | T032–T033; T028 | Otro NIF con correo existente: no hay pago, datos revelados o mezcla. |
| P14 | Completa prevista | T021, T032–T033; T028 | Reutilización de Donante sin actualización o duplicado. |
| P15 | Completa prevista | T032–T033; T028 | Mismo NIF con otro correo: conflicto previo al pago. |
| P16 | Completa prevista | T032–T033; T028 | Cambio real fiscal rechazado también con cuenta vinculada. |
| P17 | Completa prevista | T021, T032–T033; T020, T028 | NFC, espacios y mayúsculas equivalentes; tildes/contenido real no se borran. |
| P18 | Completa prevista | T023, T040–T041; T022, T031 | Resultado/reenvío para la operación de la sesión vigente. |
| P19 | Completa prevista | T023, T040–T041; T022, T031 | Referencia sola, pérdida o caducidad no autorizan ni recuperan. |
| P20 | Completa prevista | T023, T040–T041; T022, T031 | Permiso A no accede o envía correo de B ni abre historial invitado. |
| P21 | Completa prevista | T037–T039; T030, T077 | Cierre de navegador y notificación válida posterior: una sola confirmada. |
| S01 | Completa prevista | T059–T062, T067, T069–T070; T054–T055, T078 | Primera cuota de 10 €, tres periodicidades, alta y previsión de pasarela. |
| S02 | Completa prevista | T063–T064; T055, T072 | Ciclo nuevo suma una vez; desorden con primera factura también se contempla. |
| S03 | Completa prevista | T059, T062; T054–T055 | Primer fallo no activa ni confirma; pendiente recuperable frente a cierre definitivo. |
| S04 | Completa prevista | T059–T060, T069; T054, T078 | Alta sin cuenta. |
| S05 | Completa prevista | T026, T062, T070; T024, T057 | Fallo de correo no desactiva alta pagada ni borra resumen/previsión. |
| S06 | Completa prevista | T023, T041, T068, T070; T057 | Reenvío propio no cobra ni crea alta; permiso invitado del alta no autoriza otra cuota. |
| S07 | Completa prevista | T033, T059; T054 | Correo/NIF incompatible en alta detenido antes de Stripe. |
| S08 | Completa prevista | T021, T033, T059; T054 | Cambio real fiscal del Donante existente rechazado en alta. |
| S09 | Completa prevista | T039, T061–T062, T064; T055 | Primera factura sin sesión/retorno, activación y registro idempotentes. |
| S10 | Completa prevista | T065, T070; T056, T072 | Fallo posterior, aviso, suma anterior y alta activa, sin cargo propio. |
| S11 | Completa prevista | T067–T068, T070; T056 | Fecha futura de última factura y actualización por invoice.updated. |
| S12 | Completa prevista | T067–T068, T070; T056 | Ausencia o vencimiento, incluido intradía, produce Pendiente de confirmación. |
| S13 | Completa prevista | T066–T068, T070; T056, T078 | Cancelación canónica terminal, previsión nula y anteriores conservadas. |

Los 34 casos tienen soporte específico. T080 consolida el balance, pero no se utiliza
como sustituto de las pruebas de identidad, acceso, correo, dinero y recurrencia.
P11/P12 pasan de cobertura parcial UI a completa prevista por los cambios concretos
de T045/T047/T049/T052 y del contrato. SC-001 y SC-002 requieren medición y recepción
efectivas; no se consideran cumplidos por tener tareas o usar recursos simulados.

## Dependencias, tamaño, rutas y paralelo

| Grupo | Tareas | Cantidad |
|---|---|---:|
| Preparación y 004 | T001–T006 | 6 |
| Fundamentos | T007–T027 | 21 |
| US1: puntual | T028–T053 | 26 |
| US2: alta y cuotas | T054–T072 | 19 |
| Validación final | T073–T081 | 9 |
| Total | T001–T081 | 81 |

Se comprueban 81 ID únicos y consecutivos, **81 casillas sin marcar**, origen,
ruta y resultado comprobable por tarea. El grafo tiene **97 dependencias**, sin ciclos
ni referencias inexistentes. No hay tareas huérfanas: preparación/revisión/entorno
se vinculan a constitución o plan y las funcionales a requisitos/escenarios.

Las **9 marcas [P]** se mantienen en T014/T017/T019/T020, T045/T047/T049 y T069/T070.
Las tres ventanas declaradas no comparten archivos de escritura entre sus ramas.
Los casos de concurrencia se provocan dentro de pruebas controladas; no se ordena
ejecutar suites simultáneas sobre la base exclusiva. US2 espera US1 porque reutiliza
y cambia sus mismos archivos.

Las ampliaciones mantienen unidades por contrato o componente. T029 reúne la prueba del
protocolo de una creación y T049 sus estados de interfaz; las acciones de persistencia,
orquestación, rutas y componentes siguen separadas. Las rutas futuras se señalan como
destinos de implementación. La única ruta numérica condicionada es la ampliación
operativa: T007 registra el fichero exacto en LEEME y T009–T012 trabajan secuencialmente
en él. No se presenta un directorio como una reserva inexistente de 009.

## Coherencia transversal y constitución

| Área | Resultado del contraste |
|---|---|
| Modelo y estados | Definición única en modelo-datos; data-model describe uso. Rechazo→éxito conserva aportación y referencia, confirmada no retrocede, alta pendiente no se activa sin primer cobro. |
| Idempotencia | Bloqueo de creación distinto de bloqueo de reconciliación; evento, PaymentIntent e Invoice tienen claves distintas. La primera cuota no se cuenta por Checkout y por factura. |
| Permisos | Mismo correo/UUID/referencia no conceden acceso; ocho horas por operación y cuenta vinculada como vía separada. Webhook independiente del navegador; cuotas futuras no heredan permiso del alta. |
| Correo | Reintento del resumen no llama a Stripe. Estado/reserva por intento independiente del pago, fallo no equivale a envío y aceptación SMTP no acredita recepción. |
| Próxima cuota y cancelación | Solo previsión futura de recursos actuales, null al vencer, fallo no cancela por sí solo y cancelación definitiva sí se procesa sin borrar aportaciones. |
| Entrega 004 | T001–T006 conservan validación aislada de ambas secuencias y revisión antes de incorporación; no esperan UI, P-05 o nueva columna operativa. |
| Ampliación operativa | Cuatro tablas después de 004, número libre coordinado desde 009; 009 no está reservado. Snapshot justificado sin modificar SQL existente. |
| Pruebas locales y Stripe real | T002/T013/T019 y T053/T072/T073 preceden P-05. T075/T076 preparan entorno; T077–T080 distinguen hechos reales, simulación y casos no realizados. |
| Constitución I–IX | Alcance limitado a HU-01, comprobación visible, español/euros/Madrid, seguridad en servidor, conservación de historial y reutilización de pila/componentes. |
| Constitución X–XII | Nada responsable, Rubén revisor; incorporación común y acuerdo exigible siguen pendientes. La rama documental no se presenta como aprobación colectiva. |

No se identifica un conflicto constitucional nuevo. Las diferencias entre funciones
existentes y ampliaciones propuestas están declaradas y asociadas a tareas, no se
tratan como implementación ya disponible.

## Comprobaciones y conservación de evidencias

Se comprueban **69 enlaces Markdown locales** y sus anclas en los 12 documentos
corregidos o creados antes del segundo analyze: no hay destinos o anclas inexistentes.
Los bloques de código están equilibrados. Las matrices contienen 19 FR, 4 SC y 34
escenarios, con referencias de tarea existentes. Estas comprobaciones son de documentación,
no pruebas de la aplicación.

Las huellas se comparan con las capturadas al inicio del encargo:

| Informe histórico | SHA-256 | Conservación |
|---|---|---|
| analyze-1.md | `ac2b0c787587d70de37d183ecedbd25e5f07efb4f65167cd983caca9335a5110` | Idéntico al inicio del encargo. |
| clarify-1.md | `3166079e88d90856531d1cffc0a319419ec67d11f7f1c87d33e699e6f793757c` | Idéntico al inicio del encargo. |
| clarify-2.md | `5f2c88c63d8d413b75088aec359538ceba58001d8b619c082195ac63fe33b2d7` | Idéntico al inicio del encargo. |
| clarify-3.md | `adc08d0c2c62508f8eac912614d05345627452fba4c9b14d9628598ab20401de` | Idéntico al inicio del encargo. |

Al iniciar el segundo diagnóstico se fija una segunda instantánea de archivos. Durante
la lectura no cambia ningún archivo. La única escritura de esta fase es analyze-2.md,
comprobado inexistente antes de crearlo. El alcance completo del encargo modifica 11
documentos de diseño/especificación/matrices y crea registro-hallazgos.md y este informe.
No se alteran código, configuración, migraciones ni documentos de otras historias.

## Métricas

| Métrica | Primer analyze | Segundo analyze |
|---|---:|---:|
| FR en matriz nominal | 19/19 | 19/19 |
| FR con cobertura prevista completa | 18/19 | 19/19 |
| FR con cobertura parcial UI | 1 | 0 |
| SC con comprobación prevista | 4/4 | 4/4 |
| Escenarios en matriz nominal | 34/34 | 34/34 |
| Escenarios con cobertura prevista completa | 32/34 | 34/34 |
| Escenarios con cobertura parcial UI | 2 | 0 |
| Tareas / sin marcar | 81/81 | 81/81 |
| Dependencias / ciclos | 97/0 | 97/0 |
| Marcas [P] / colisiones en ventanas declaradas | 9/0 | 9/0 |
| Hallazgos activos: crítica / alta / media / baja | 0/0/2/0 | 0/0/0/0 |
| Hallazgos iniciales resueltos documentalmente | 0 | 2 |
| Hallazgos nuevos | 2 iniciales | 0 |
| Ambigüedades activas / duplicaciones activas detectadas | 1/0 | 0/0 |
| Requisitos sin tarea / tareas sin origen | 0/0 | 0/0 |
| Pruebas funcionales ejecutadas en el analyze | 0 | 0 |

La cobertura nominal y prevista es del 100 % en los tres inventarios; el resultado
**probado** no se determina porque las pruebas no se han ejecutado. Los dos hallazgos
iniciales mantienen MEDIA como gravedad histórica, no se borran ni se rebajan para cerrar
el registro.

## Pendientes y límite del resultado

- Revisión de Rubén y coordinación/acuerdo común exigible antes de incorporar 004 y
  P-01/P-02/P-03. El snapshot y el preparador puro se incluyen expresamente en esa revisión.
- Coordinación del nombre de la migración operativa en T007, sin reservar 009.
- Implementación, SQL y validaciones futuras descritas en tareas, todavía sin ejecutar.
- Preparación P-05 antes de Stripe real: cuenta, credenciales, versión efectiva y endpoint
  siguen sin comprobarse. Una prueba local no sustituye el ciclo real pendiente.
- Se conservan las limitaciones de acceso invitado perdido, correo pendiente y posible
  duplicación física de correo tras caída; no se extienden a duplicación de dinero ni se
  presentan como SC-002 satisfecho.

No quedan bloqueos documentales identificados de COV-001/UND-001 en este diagnóstico.
Los pendientes anteriores son controles de revisión y trabajo futuro, sin atribuirles
ejecución. **La fase termina en este informe para revisión**: no se avanza a implement
o converge, ni se aplican correcciones nuevas automáticamente.
