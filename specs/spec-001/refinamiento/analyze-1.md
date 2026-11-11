# Primer informe de analyze — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Identificador**: analyze-1 · **Fecha**: 2026-11-06  
**Rama y funcionalidad**: `spec-001` · `specs/spec-001`  
**Referencia Git observada**: `bdd6476`, con documentación local pendiente de commit.  
**Responsable**: Nada · **Revisor**: Rubén  
**Estado**: Diagnóstico inicial conservado antes de correcciones. No acredita implementación,
pruebas funcionales, revisión de Rubén o acuerdo colectivo.

## Resultado ejecutivo

Se identifican **2 hallazgos documentales de gravedad media**, sin hallazgos críticos,
altos o bajos. Ambos se refieren a precisión/cobertura del diseño y del desglose; no son
fallos observados de código en ejecución.

La matriz nominal incluye los 19 FR, 4 SC y 34 escenarios. El contraste de acciones,
resultados esperados y comprobaciones encuentra **18 FR con cobertura prevista completa
y 1 parcial en el recorrido web**, **4 SC con verificación prevista** y **32 escenarios
con cobertura prevista completa y 2 parciales en interfaz**. No hay requisitos sin tarea;
tener tarea no equivale a haber demostrado el resultado.

No se detectan ciclos o referencias de dependencia inexistentes entre las 81 tareas.
Las 9 marcas [P] no presentan colisión de archivos en las ventanas declaradas.
La revisión de Rubén, la coordinación de la ampliación y P-05 permanecen como trabajo
futuro explícito, no como defectos por no haberse ejecutado todavía.

## Alcance y adaptación del procedimiento

Se siguió la definición local de [speckit-analyze](../../../.claude/skills/speckit-analyze/SKILL.md).
 Se aplicaron inventario semántico,
detección de duplicaciones/ambigüedad/inconsistencia, revisión constitucional, cobertura
y dependencias. La autorización de esta fase limita la escritura a este informe; la
especificación, plan, tareas y fuentes comunes se conservan intactos.

La selección se resolvió con check-prerequisites en modo PathsOnly y con
Get-FeaturePathsEnv -NoPersist. Se comprobó la existencia de spec, plan, tasks y documentos
de diseño sin usar la variante que puede persistir feature.json. No se cambió la selección
guardada, la rama o la configuración. Los hooks opcionales de commit se omitieron.

La revisión es estática y documental. No se ejecutaron npm, Docker, migraciones, pruebas,
instalaciones, operaciones de Stripe o acciones de Git que escriban. No se inspeccionaron
secretos. La versión de Stripe citada por el diseño es una referencia documental; no se
certifica aquí una instalación, cuenta o endpoint externos.

Se comprobó antes de escribir que analyze-1.md no existía. Los informes anteriores de
clarify conservan su carácter histórico; sus estados anteriores no se contabilizan como
contradicciones del estado vigente.

## Fuentes y localización

Las líneas indicadas corresponden a los archivos reales leídos en este análisis, antes
de cualquier corrección. Las rutas se resuelven desde
`E:\asignaturas\IWeb\Practica grupal\IWEB_ONG`.

| Fuente | Líneas |
|---|---:|
| [specs/spec-001/spec.md](../spec.md) | 184 |
| [specs/spec-001/plan.md](../plan.md) | 199 |
| [specs/spec-001/tasks.md](../tasks.md) | 576 |
| [specs/spec-001/research.md](../research.md) | 185 |
| [specs/spec-001/data-model.md](../data-model.md) | 67 |
| [specs/spec-001/contracts/api-donaciones.md](../contracts/api-donaciones.md) | 166 |
| [specs/spec-001/contracts/pasarela-stripe.md](../contracts/pasarela-stripe.md) | 196 |
| [specs/spec-001/contracts/cambios-comunes.md](../contracts/cambios-comunes.md) | 126 |
| [specs/spec-001/quickstart.md](../quickstart.md) | 355 |
| [.specify/memory/constitution.md](../../../.specify/memory/constitution.md) | 94 |
| [CONVENCIONES.md](../../../CONVENCIONES.md) | 138 |
| [specs/plan-comun.md](../../plan-comun.md) | 416 |
| [specs/modelo-datos.md](../../modelo-datos.md) | 389 |

## Hallazgos

Los identificadores se conservan en revisiones posteriores para registrar su resolución,
sin renumerar los hallazgos de este primer informe.

| ID | Categoría | Gravedad | Ubicación | Evidencia y efecto | Recomendación |
|---|---|---|---|---|---|
| COV-001 | Cobertura del recorrido web | MEDIA | tasks.md:251–277 y 501; api-donaciones.md:38–39, 140–153; quickstart.md:262–263 | T043 define la solicitud del enlace en la API; T049 describe la página con un token ya recibido. No queda explícito el estado/acción de interfaz que solicita ese enlace. La matriz de FR-013/P11/P12 no cierra ese paso. | Precisar una entrada web alcanzable y un estado sin token que invoque la solicitud, con su comprobación positiva y negativa, sin depender de HU-02. |
| UND-001 | Recuperación insuficientemente especificada | MEDIA | modelo-datos.md:205–223; api-donaciones.md:81–102; tasks.md:195–221 | La operación pasa a incierta antes del HTTP; el mismo estado puede quedar tras error o caída. Se exige 409 mientras la llamada está activa y se permite repetir tras error, pero no se fija qué acredita esa diferencia y la recuperación después de reinicio. | Precisar alcance/vida del bloqueo de solicitud y la condición de reanudación; añadir casos observables para solicitud simultánea, error y reinicio, manteniendo la misma clave y el límite de incertidumbre. |

### COV-001 — Solicitud del enlace desde la interfaz no explicitada

**Evidencia concreta**:

- [Contrato API](../contracts/api-donaciones.md), líneas 38–39 y 140–148: existen dos operaciones
  distintas, solicitar el correo y consumir su token. La página descrita recibe
  `/donar/vincular#token=...`.
- [Tareas](../tasks.md), líneas 251–257: T043/T044 implementan esos dos endpoints y sus
  controles de cuenta/rol/consumo.
- En las líneas 275–277, T049 se centra en retirar el fragmento, guardar el token durante
  el login y confirmarlo. No describe solicitar el enlace cuando aún no existe token.
  T045/T047/T051 describen formulario, resultado y entrada pública a donar, sin añadir
  esa acción de solicitud.
- [Quickstart](../quickstart.md), línea 263: P12 comienza por solicitar el enlace, sin indicar
  cómo se hace desde una interfaz prevista. La matriz de tareas, líneas 501 y 536–537,
  enlaza tareas de servidor/consumo, pero no aporta ese paso web.

**Impacto y límite del hallazgo**: los controles que impiden vincular solo por correo sí
tienen diseño y tareas. No se diagnostica acceso indebido ni ausencia total de FR-013.
Sin concretar este paso se podrían completar literalmente las tareas descritas y disponer
solo de un endpoint invocable externamente, sin un recorrido web completo para P11/P12.
Por eso la cobertura se clasifica parcial en interfaz, no nula en seguridad.

**Recomendación**: especificar dónde se ofrece la solicitud y qué muestra la página de
vínculo sin token a una cuenta identificada, cómo llama al endpoint y qué aviso no enumerativo
presenta. Añadir una comprobación visible que recorra solicitud → correo → confirmación,
además de los controles negativos ya previstos. Puede ampliarse la tarea de interfaz
existente; no exige edición de perfil, verificación global del registro o implementación
del historial. No se decide aquí una nueva ubicación ni se modifica ninguna tarea.

### UND-001 — Arbitraje de la creación incierta y su reanudación

**Evidencia concreta**:

- [Modelo común](../../modelo-datos.md), líneas 205–210: se almacenan UUID, aportación,
  huella, ID/URL de Checkout y estado. La auditoría general también está prevista.
- Líneas 218–223: preparada pasa a incierta **antes** de la llamada externa; una respuesta
  identificada permite pasar a checkout_creado. Se indica que durante la llamada se
  devuelve operación en curso y que tras un error puede repetirse la misma clave.
- [Contrato API](../contracts/api-donaciones.md), líneas 82–97: la repetición se serializa
  por clave, con 409 OPERACION_EN_CURSO y 503 para resultado incierto.
- [Tareas](../tasks.md), T029 y T034/T035, líneas 195–221: se prevén timeout, clave estable,
  conservación y no recreación después de 24 horas; no se fija el criterio que distingue
  una llamada todavía activa de otra interrumpida cuyo estado sigue siendo incierta.

**Caso documental a completar**: un proceso persiste incierta y se interrumpe antes de
guardar el resultado; otro intento autorizado encuentra esa misma fila. El contrato no
debe dejar a la implementación la elección implícita entre rechazar indefinidamente con
409 o reanudar sin una regla de arbitraje identificada. La mención general a serializar
por UUID no precisa si el bloqueo sobrevive a la transacción previa, se mantiene durante
HTTP o qué condición permite recuperarlo tras una caída.

**Impacto y límite del hallazgo**: la unicidad de negocio y la clave Stripe estable sí
están previstas. No se afirma que se produzcan cargos duplicados. Falta precisión del
protocolo local de recuperación y de su resultado comprobable, no una nueva decisión
funcional sobre permitir otro cobro.

**Recomendación**: documentar el mecanismo de exclusión por solicitud y sus momentos de
adquisición/liberación y cómo se vuelve a intentar tras error o reinicio dentro del plazo
permitido. No se presupone que haga falta otra tabla o columna. Completar T029/T035 con
casos que demuestren 409 durante una creación activa, reanudación de la interrumpida y
una sola operación/Checkout con la misma clave. Todo cambio de estructura, si resultara
necesario, requeriría su propuesta explícita y la revisión común correspondiente.

## Criterio de cobertura efectiva

- **Nominal**: aparece una fila de matriz con referencias existentes.
- **Prevista completa**: el contenido de las tareas cubre la acción/invariante, su resultado
  y una comprobación observable coherente con la especificación. Sigue sin ser una prueba
  escrita, ejecutada o aprobada.
- **Parcial UI**: los controles o endpoints están cubiertos, pero falta explicitar un paso
  necesario del recorrido web. No se compensa citando una revisión final genérica.
- Los hallazgos de precisión del protocolo se registran aparte: no convierten en inexistentes
  las tareas de estados o las garantías de idempotencia que sí están descritas.

### Requisitos funcionales

| Requisito | Cobertura evaluada | Implementación/soporte previsto | Comprobación prevista | Justificación semántica |
|---|---|---|---|---|
| FR-001 | Prevista completa | T015, T036, T059–T060, T069 | T029, T054 | Dos modalidades y tres periodicidades; sin nueva funcionalidad de HU-02. |
| FR-002 | Prevista completa | T004, T021, T036, T060 | T020, T029, T054 | Extremos incluidos, céntimos, coma/punto, rechazo sin redondeo y repetición para socio. |
| FR-003 | Prevista completa | T034–T035, T045 | T029, T053 | Proyecto activo, destino NULL y nueva elección si se desactiva; no reasignación silenciosa. |
| FR-004 | Prevista completa | T021, T033, T036, T045 | T020, T029 | Datos mínimos, control NIF/NIE y validación de entrada antes de la pasarela. |
| FR-005 | Prevista completa | T015–T016, T036, T045 | T014, T074, T077 | Checkout alojado card/EUR y proyecciones sin tarjeta; auditoría prevista, no realizada. |
| FR-006 | Prevista completa en criterios | T004, T038–T039, T062 | T003, T030, T054–T055 | Estados y recuperación del mismo pago descritos. UND-001 afecta a la reanudación de creación incierta. |
| FR-007 | Prevista completa | T025–T026, T040, T047, T070 | T024, T031, T077, T079 | Resumen persistido, pago separado de correo y recepción final comprobable en Mailpit. |
| FR-008 | Prevista completa | T058–T059, T062, T066, T069–T070 | T054, T056, T078 | Alta pendiente/activa/cancelada, rechazo recuperable y cierre definitivo; sin edición o baja local. |
| FR-009 | Prevista completa | T063–T064 | T055, T072 | Una cuota por factura de ciclo; primera factura se reconcilia aparte. |
| FR-010 | Prevista completa en criterios | T034, T037–T038, T061, T063–T064 | T003, T029–T030, T055 | Evento y negocio tienen claves distintas; carreras/desorden explícitos. La incertidumbre de creación conserva UND-001. |
| FR-011 | Prevista completa en control de acceso | T023, T035–T036, T043, T059 | T022, T029, T031, T054 | Ambas modalidades sin cuenta; correo coincidente no vincula. El recorrido web de solicitud se contabiliza en FR-013. |
| FR-012 | Prevista completa | T026, T041, T047, T070 | T024, T031, T057, T079 | Reintento autorizado del mismo mensaje, lease e intento; sin pagos, altas o aportaciones nuevas. |
| FR-013 | Parcial en recorrido web | T042–T044, T049 | T022, T031, T074 | Emisión/consumo y controles de servidor definidos; falta concretar el estado UI que solicita el enlace: COV-001. |
| FR-014 | Prevista completa | T032–T033, T059 | T028, T054 | Correo con otro NIF se rechaza antes de Stripe sin mostrar ni mezclar datos; Se contempla concurrencia. |
| FR-015 | Prevista completa | T021, T032–T033, T059 | T020, T028, T054 | Datos reales distintos se rechazan aun con cuenta vinculada; formato equivalente reutiliza sin sobrescribir. |
| FR-016 | Prevista completa | T023, T040–T041, T068 | T022, T031, T057 | Permiso por operación, ocho horas, 404 genérico y denegación de otras operaciones/cuotas; cuenta vinculada como vía separada. |
| FR-017 | Prevista completa | T037–T039, T061–T062 | T030, T055, T077 | Webhook firmado sin cookie, rollback/reentrega y procesamiento sin retorno de navegador. |
| FR-018 | Prevista completa | T065–T066, T068, T070 | T055–T056, T072, T078 | Fallo no suma/cancela por sí solo; aviso separado, cancelación canónica y preservación de anteriores. |
| FR-019 | Prevista completa | T067–T068, T070 | T056, T072 | Última factura, previsión futura o NULL; vencimiento intradía e invoice.updated, sin cálculo local. |

### Criterios de éxito

Se incluyen los cuatro criterios solicitados, también los que necesitan medición posterior.
No se descarta SC-001 por ser un resultado de uso ni se confunde su medición con una prueba unitaria.

| Criterio | Cobertura evaluada | Tareas concretas | Evidencia necesaria |
|---|---|---|---|
| SC-001 | Prevista completa | T045–T047; T079 | Cronometraje desde formulario a confirmación, inferior a tres minutos; no se sustituye por que el frontend compile. |
| SC-002 | Prevista completa | T024–T026, T041; T077, T079 | Exige mensaje recibido por cada referencia confirmada de la ejecución, incluido reintento. Booleano, aviso y mocks no acreditan recepción. |
| SC-003 | Prevista completa | T014–T016, T045; T074 | Auditoría de payloads/base/sesión/logs/evidencias sin tarjeta o tokens en claro; no solo revisión visual del formulario. |
| SC-004 | Prevista completa | T020–T021, T030, T038, T055, T062–T063; T077–T079 | Comparación al céntimo entre recursos canónicos, base, pantalla y mensaje; cardinalidad y sumas tras duplicados. |

### Escenarios P01–P21 y S01–S13

Los alias son los de quickstart: US1 y US2 pertenecen ambos a HU-01. La cobertura indicada
se refiere al trabajo previsto; **ninguno de los 34 escenarios se ha ejecutado en esta fase**.

| Escenario | Cobertura evaluada | Tareas contrastadas | Resultado que debe comprobarse |
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
| P11 | Parcial UI | T023, T043–T044; T022, T031 | Negación de vínculo automático cubierta. Exigir/verificar desde la web no tiene punto de solicitud explicitado: COV-001. |
| P12 | Parcial UI | T042–T044, T049; T031, T052 | Consumo seguro cubierto; la prueba web parte de un enlace que falta poder solicitar explícitamente: COV-001. |
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

## Estados, idempotencia, permisos y correo

| Aspecto | Contraste y conclusión documental |
|---|---|
| Pago rechazado que se confirma | Modelo común, líneas 169–184, permite conservar fila y referencia; T030/T038 cubren mismo PaymentIntent, éxito posterior y fallo antiguo. No se añade una aportación para eludir UNIQUE. |
| Primera cuota | T061/T062 no contabilizan por Checkout; factura inicial reutiliza el alta. T055 prueba ambos órdenes con Invoice. |
| Ciclos y desorden | T063/T064 cubren factura por ciclo y recuperación de la inicial desde Session si llega antes el ciclo. La pertenencia/importe/moneda se comprueban antes de sumar. |
| Evento frente a dinero | T037 y T063 separan evento único, PaymentIntent único e Invoice única; rollback/reentrega y carreras están descritos. UND-001 conserva una reserva sobre creación incierta, no sobre esas claves. |
| Suscripción | Pendiente tras primer fallo recuperable, activa solo tras cobro y cancelada terminal ante cierre canónico. T066 preserva anteriores y evita reactivar por eventos antiguos. No se agrega baja local. |
| Fecha futura | Instante y DATE de Madrid, última factura, vencimiento intradía y NULL previstos en T056/T067/T068. Contrato distingue previsión ordinaria de reintento y considera cancelación programada; no se identifica una contradicción formal que requiera otro hallazgo. |
| Invitado | T022/T023/T031/T040/T041/T057 prueban permiso por operación, caducidad, rechazo por referencia sola y separación de cuotas futuras. Webhook no exige navegador o sesión. |
| Vínculo | Hash, treinta minutos, cuenta/Donante fijados y consumo único están cubiertos en T042–T044. COV-001 se limita al inicio del recorrido web. |
| Correo | T024–T026 y T041 separan resumen/lease/resultado del dinero; un intento antiguo no publica éxito y no se llama a Stripe para reenviar. No se promete entrega física exactamente una vez. |
| Recepción y limitación aceptada | T077/T079 exigen Mailpit. Si SMTP falla y se pierde acceso invitado sin cuenta vinculada, el correo puede seguir pendiente; está declarado en plan/research y SC-002 no se considera cumplido. No se inventa una cola obligatoria. |

## Dependencias, tamaño y archivos de tareas

Se analizaron las **81 descripciones, sus orígenes, comprobaciones y 97 relaciones de
dependencia**, no solo las matrices. Los identificadores son T001–T081, consecutivos y
sin repeticiones; las 81 casillas están sin marcar. No hay dependencia a una tarea
inexistente, a una tarea posterior o un ciclo. Todas tienen un origen explícito y una
comprobación; no se identifican tareas huérfanas de justificación.

| Grupo | Tareas | Revisión |
|---|---:|---|
| Preparación/004 | 6 | Prueba primero, SQL de dominio y validación dirigida; revisión antes de incorporación. |
| Fundamentos | 21 | Modelo operativo, envolturas, fixtures, normalización, autorización y correo antes de las modalidades. |
| US1 | 26 | Pruebas, servidor e interfaz. Recorrido del enlace necesita COV-001. |
| US2 | 19 | Depende del cierre local de US1 y modifica varios de sus mismos archivos; no se presenta como historia paralela independiente. |
| Validación final | 9 | Regresión/seguridad, P-05, Stripe real, medición y revisión. |

**Paralelo**: T014/T017/T019/T020 comparten la barrera T013, pero escriben pruebas de
envoltura, correo, soporte y normalización diferentes. T045/T047/T049 parten de T044 con
archivos de interfaz distintos. T069/T070 parten de T068 con formulario y resultado
separados. No se detecta colisión de escritura entre esas tareas en sus ventanas declaradas.
Las suites de integración se encadenan y la prohibición de ejecutarlas simultáneamente
sobre la misma base se documenta en tasks.md, líneas 451–455.

**Tamaño**: la mayoría de tareas se limita a un comportamiento y a una capa. T040 es una
sección vertical de un endpoint; T081 cita seis archivos porque es una revisión documental
transversal. Ese número por sí solo no demuestra tamaño incorrecto o falta de verificabilidad.
No se inventa una estimación de horas ni un defecto por ausencia de una estimación no exigida.

**Archivos previstos**: los tests adicionales y el soporte están dentro del módulo y usan
la pila prevista; no añaden una historia o una dependencia funcional ajena. El nombre físico
de la migración operativa se difiere de forma controlada a T007 y queda registrado antes
de T009–T012; no se trata como una reserva de 009 ni como un archivo ya existente.

## Entrega temprana, revisión y entornos

- T003/T004/T005 preparan y validan 004 con sus tres tablas de dominio. T006 exige evidencia
  de revisión de Rubén y coordinación común antes de incorporación; no hay commit/merge
  automático ni atribución de acuerdo colectivo.
- La validación temprana no usa el preflight completo de quickstart B, que exige tablas
  operativas. La diferencia está advertida en tasks.md, líneas 40–43 y 462–469. La prueba
  dirigida de migraciones evita que la ampliación bloquee a Rubén.
- T007 coordina el siguiente número libre desde 009; T008–T013 prueban/aplican la ampliación
  sin reescribir 004 publicada ni depender de 006–008. La coordinación sigue pendiente,
  pero está asignada y no es por sí misma un defecto documental.
- T053/T072/T073 verifican localmente con pasarela simulada y base exclusiva; T075/T076
  preparan P-05; T077/T078 se reservan para Stripe real de pruebas. No se confunde una
  respuesta simulada con un pago externo observado.
- La falta actual de SQL, implementación, instalación o cuenta comprobada es trabajo futuro
  previsto, no un hallazgo de ausencia de funcionalidad en esta fase de documentación.
- Los tres casos omitidos de HU-07/HU-05 están identificados como dependencia ajena en la
  guía y en T073. No se convierten en defectos de HU-01 ni se autoriza su modificación.
- Los ciclos reales no disponibles se conservan como comprobación pendiente en T078/T080;
  no se exige inventar una factura o usar un evento ajeno. La cobertura local de S02/S10–S13
  no prueba que esa integración externa se haya realizado.

## Alineación con la constitución

No se identifica una vulneración documental demostrada de un MUST constitucional que
justifique gravedad crítica.

| Principios | Evaluación |
|---|---|
| I–II | Se mantiene la arquitectura y el alcance decidido. Las cuatro tablas técnicas tienen función documentada; no se propone funcionalidad extra por este análisis. |
| III | Hay criterios observables y tareas de evidencia; COV-001 señala un paso web por concretar. Nadie acredita la historia terminada o probada por existir una matriz. |
| IV | EUR, dos decimales, fechas de Madrid y mensajes españoles presentes en tareas y contratos. |
| V–VI | Hosted Checkout, control en servidor, vínculo acreditado e historial financiero conservado; sin borrado o reenvío que repita dinero. Evaluación de diseño, no certificación del código. |
| VII–IX | Pila común y modelo único; data-model.md lo referencia sin otra definición de entidades. Se mantienen errores y componentes compartidos. |
| X–XII | Nada/Rubén y spec-001 identificados. Revisión/incorporación común siguen pendientes y tienen tareas de control; no se presupone acuerdo colectivo. |

Las repeticiones entre FR-007/FR-012, FR-008/FR-018 y FR-011/FR-013 describen obligaciones
diferentes: confirmación/reintento, alta/fallo posterior y acceso/prueba de vínculo. No se
cuentan como duplicación defectuosa. Las sesiones de clarify fechadas conservan evidencia,
no requisitos alternativos vigentes.

## Métricas

| Métrica | Resultado |
|---|---:|
| Fuentes de requisitos/diseño contrastadas | 13 |
| FR inventariados | 19 |
| SC inventariados | 4 |
| Escenarios de aceptación inventariados | 34 (21 P + 13 S) |
| Filas de trazabilidad nominal | 57 |
| Cobertura nominal FR / SC / escenarios | 19/19 · 4/4 · 34/34 (100 %) |
| Cobertura sustantiva prevista completa de FR | 18/19 (94,74 %) |
| FR con cobertura parcial en interfaz | 1: FR-013 |
| SC con comprobación específica prevista | 4/4 (100 %) |
| Escenarios con cobertura sustantiva prevista completa | 32/34 (94,12 %) |
| Escenarios parciales en interfaz | 2: P11, P12 |
| Requisitos o escenarios sin ninguna tarea asociada | 0 |
| Tareas totales / sin marcar | 81 / 81 |
| Tareas sin origen explícito | 0 |
| Dependencias examinadas | 97 |
| Dependencias inexistentes / ciclos | 0 / 0 |
| Marcas [P] / colisiones de archivos detectadas en sus ventanas | 9 / 0 |
| Hallazgos críticos / altos / medios / bajos | 0 / 0 / 2 / 0 |
| Hallazgos de cobertura / insuficiencia de diseño | 1 / 1 |
| Ambigüedades contabilizadas | 1 (UND-001) |
| Duplicaciones defectuosas contabilizadas | 0 |
| Pruebas funcionales ejecutadas en esta fase | 0 |
| Escenarios aprobados por ejecución en esta fase | 0 |

La precisión de cobertura mide el contenido documental revisado, no código escrito,
porcentaje de tests verdes, recepción de mensajes o conformidad de la pasarela.

## Siguientes pasos propuestos

1. Revisar COV-001 y UND-001, sin atribuirles resolución por este primer diagnóstico.
2. En un encargo posterior de corrección, explicitar el inicio web de la verificación y
   el protocolo de recuperación de la creación incierta, ajustando solo los documentos
   afectados y sus casos. No es necesario regenerar specify o repetir las decisiones
   funcionales PA1.1–PA1.8 para concretar estos dos puntos.
3. Repetir el contraste tras las correcciones y conservar este informe como evidencia
   inicial. No se recomienda tratar la matriz nominal como autorización para implementar.
4. Mantener revisión de Rubén y coordinación de migraciones como controles futuros; P-05
   se realiza antes de Stripe real y no se certifica ahora.

**Cierre de la fase**: informe inicial guardado; ninguna corrección aplicada. Se detiene
para revisión, sin ejecutar implement, instalaciones, pruebas, commits, push o cambios de rama.
