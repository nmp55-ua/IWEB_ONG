# Primer análisis de consistencia — HU-02

**Fecha**: 2026-11-10 · **Rama**: `spec-002` · **HEAD**: `453bfe8cf97fc756e29e911fae6072caee96041c`

**Responsable**: Nada · **Revisor**: Javi

**Resultado**: no se identifican hallazgos accionables en el contraste documental realizado. No se detectan incumplimientos de la constitución, requisitos sin desglose, contradicciones de diseño o dependencias que impidan ejecutar las tareas previstas.

Este resultado evalúa especificación, diseño y tareas antes de implementación. No acredita que HU-02 esté implementada, que sus pruebas hayan pasado, que el historial se presente en menos de dos segundos ni que Javi haya realizado su revisión.

## 1. Estado y alcance

Al inicio, la rama es `spec-002`, el índice está vacío y no existe `refinamiento/analyze-1.md`. Se conservan sin seleccionar los siete documentos nuevos pendientes de commit: plan, investigación, modelo de lectura, dos contratos, quickstart y tareas. La especificación y clarify están registrados en HEAD; no se repite ninguna fase anterior.

Se contrastan:

- [Especificación](../spec.md): una historia P1, ocho FR, nueve escenarios y tres SC.
- [Plan](../plan.md), [investigación](../research.md) y [modelo de lectura](../data-model.md).
- [Contrato HTTP](../contracts/api-historial.md) y [contrato de interfaz](../contracts/interfaz-historial.md).
- [Guía de validación](../quickstart.md) y [35 tareas](../tasks.md).
- [Constitución](../../../.specify/memory/constitution.md), [convenciones](../../../CONVENCIONES.md), [plan común](../../plan-comun.md) y [modelo común](../../modelo-datos.md).
- Decisiones conservadas en [clarify-1.md](clarify-1.md) y comprobaciones estáticas puntuales de las interfaces reutilizadas: autenticación y roles, repositorio de donaciones, servicios de fechas, cliente HTTP/formato de frontend y servicio/repositorio de HU-03.

Las ubicaciones de las tablas siguientes son relativas a `specs/spec-002/`, salvo indicación expresa. Las líneas se refieren a los documentos examinados en esta ejecución, incluidos los pendientes de commit.

## 2. Procedimiento aplicado

Se aplica directamente el [SKILL local de speckit-analyze](../../../.claude/skills/speckit-analyze/SKILL.md); Se aplica el procedimiento correspondiente del repositorio.

El procedimiento local prescribe un análisis sin escrituras. La única excepción es la creación de este informe, solicitada expresamente; los documentos analizados no se corrigen ni se marcan tareas.

Se inspecciona `check-prerequisites.ps1`: fuera de `PathsOnly` llama a la resolución de funcionalidad con persistencia. Para conservar la selección existente, se reproducen las comprobaciones necesarias en lectura mediante `Get-FeaturePathsEnv -NoPersist`, con `SPECIFY_FEATURE_DIRECTORY` y `SPECIFY_FEATURE` limitadas al proceso de la terminal. Se comprueba la existencia real de spec, plan y tasks y se confirma `FEATURE_DIR = specs/spec-002`. No se ejecuta el comando completo que podría escribir `feature.json` ni se presenta como ejecutado.

Los hooks `before_analyze` y `after_analyze` existentes son commits opcionales y se omiten. No se cambian ramas ni se ejecutan instalaciones, suites, servicios, consultas de base, operaciones Stripe o correo.

## 3. Hallazgos

| ID  | Categoría | Gravedad | Ubicación                        | Evidencia y conclusión                                                                                 | Recomendación                                                                    |
| --- | --------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| —   | —         | —        | Conjunto de documentos revisados | No se identifican hallazgos accionables. Las comprobaciones y su cobertura se detallan a continuación. | Conservar los documentos para revisión; no se propone una corrección automática. |

**Recuento**: 0 críticos, 0 altos, 0 medios y 0 bajos. No se asignan identificadores de defecto a futuras tareas de implementación, límites de esta fase o controles externos pendientes.

## 4. Contraste de los aspectos principales

| Aspecto                               | Ubicación y evidencia concreta                                                                                  | Evaluación documental                                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propiedad y autorización              | `spec.md:63`, contrato HTTP §Autorización; T005/T008–T010/T025                                                  | La cuenta procede de `req.usuario.id` y el Donante se resuelve por `usuario_id` persistido. Se excluyen correo coincidente, identificadores del cliente y permiso invitado. El middleware existente carga solo usuarios activos y distingue 401/403. Se prevén pruebas de servidor y sesiones separadas en navegador.         |
| Privacidad de la respuesta            | Contrato HTTP §Autorización/Errores, `data-model.md:39–41`; T005/T010                                           | Proyección sin datos fiscales, contacto ni identificadores Stripe. Cabeceras privadas antes de autorización, incluidos errores propios de la ruta. Un 200 sin vínculo no consulta aportaciones por correo ni declara su existencia.                                                                                           |
| Tres estados vacíos                   | `spec.md:38–41,64`, contrato HTTP §Respuestas 200 sin filas, contrato de interfaz §Estados; T006/T009/T018/T026 | `hayAportaciones` null/false/true distingue ausencia de vínculo, historial vinculado vacío y año sin resultados. El texto exacto y los enlaces están definidos; no se solicita ni confirma un vínculo automáticamente.                                                                                                        |
| Lectura consistente                   | `plan.md:43–52`, `research.md:17–23`, `data-model.md:43–55`; T007–T009/T012                                     | Vínculo, resúmenes y detalle usan una transacción de solo lectura REPEATABLE READ, configurada antes de leer. La prueba prevista confirma entre consultas con dos conexiones y comprueba la siguiente lectura, rollback y liberación. No se mantiene una transacción durante efectos externos.                                |
| Selección, orden y fechas             | `spec.md:57–62`, modelo de lectura §Lecturas e invariantes; T006/T008/T009/T028                                 | Solo confirmadas, año por fecha_cobro en Madrid, filtro semiabierto mediante rangoAnio y desempate por ID numérico en SQL. BIGINT se conserva como texto. Se incluye el límite UTC/Madrid y el Proyecto inactivo sin ocultar su aportación.                                                                                   |
| Exactitud monetaria                   | `research.md:35–43`, `data-model.md:57–63`, contrato de interfaz §Presentación exacta; T006/T008/T015/T016/T028 | SUM(NUMERIC) textual, sin aplicar el máximo individual a una suma. Pruebas concretas para 1.999.999,98 €, suma de grupos frente a SUM independiente y formato anual sin Number/parseFloat; el servicio común permanece intacto.                                                                                               |
| Paridad fiscal                        | `spec.md:75`, `research.md:61–67`, `data-model.md:77–81`; T013/T014                                             | Comparación con el certificado persistido después de reconciliar un ejercicio cerrado, antes y después de una confirmación tardía sintética. Se inyectan conexión/transacción, reloj y correo de prueba; no se modifica HU-03 ni se regenera desde GET. El código existente usa el mismo estado y rango de fecha de cobro.    |
| Interfaz y acceso visible             | Contrato de interfaz §Entrada y estructura/Filtro; T017–T020/T025–T028                                          | Menú reservado, página directa, cliente común, estados de carga/error, campos, filtro y descarte de respuestas antiguas tienen implementación y comprobación previstas. No se confunde un build o una prueba de API con recorrido visible.                                                                                    |
| Medición de extremo a extremo         | `spec.md:42,82`, `research.md:69–77`, `quickstart.md:165–174`; T023/T029/T030                                   | Inicio en navegación del documento, cuenta previamente identificada/vinculada; fin tras 60 filas, cinco grupos y totales correctos presentados. Incluye recursos, hidratación, fetch y presentación; Se conservan duración, recuentos, captura y traza. No se sustituye por latencia SQL/API ni se ocultan intentos fallidos. |
| Soporte y límites de prueba           | Quickstart §Preparación segura/Banco de navegador; T002–T004/T021–T024                                          | Base exclusiva y esquemas propios del soporte existente, configuración sintética en hijos antes de importar pools, login real y MemoryStore. El banco contempla proxy para el build, porque el proxy de Vite no se presupone en producción. No requiere pagos reales para validar esta consulta.                              |
| Conservación de HU-01 y otros módulos | `plan.md:86,103–109`; T007/T010/T013/T020/T031                                                                  | El GET no cobra, vincula, envía correo ni genera certificados. Router ya registrado, sin cambios de app.js/webhook. El ajuste compartido se limita al enlace reservado del menú. Las pruebas fiscales no autorizan editar archivos de Rubén.                                                                                  |

La referencia a `NUMERIC(15,2)` de HU-03 describe su capacidad existente; no introduce un límite de historial. Un eventual volumen que desbordase ese almacenamiento se reconoce en investigación como asunto separado y no se presenta como un cambio necesario para los criterios actuales de HU-02.

El fin de medición basado en dos requestAnimationFrame se documenta como aproximación conservadora de presentación, complementada con inspección visual y traza; no se afirma que el callback por sí solo demuestre cada píxel. La evidencia definitiva sigue pendiente de ejecución.

## 5. Cobertura de requisitos y criterios de éxito

Se revisa el contenido de las tareas, no solo las referencias de las matrices.

| Clave  | ¿Tiene tareas suficientes en el diseño? | Implementación y comprobación previstas | Observación                                                                                                   |
| ------ | --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| FR-001 | Sí                                      | T006/T008–T011/T017/T026/T029           | Puntuales y cuotas confirmadas; caso superior a 60 sin truncamiento y control visible.                        |
| FR-002 | Sí                                      | T006/T008/T009/T011/T017/T028           | Madrid, orden descendente y desempate de BIGINT sin pérdida.                                                  |
| FR-003 | Sí                                      | T006–T009/T011–T016/T017/T028           | Sumas exactas, instantánea, representación y contraste fiscal.                                                |
| FR-004 | Sí                                      | T006/T008/T009/T011/T017/T026/T028      | Fecha, importe, modalidad y destino/fondo general.                                                            |
| FR-005 | Sí                                      | T006/T008–T011/T019/T027                | Validación de año, aplicar/quitar, vacío filtrado y respuestas fuera de orden.                                |
| FR-006 | Sí                                      | T006/T008/T009/T011/T026                | Los tres estados no confirmados quedan excluidos sin ocultar cuotas válidas de socios cancelados.             |
| FR-007 | Sí                                      | T005/T008–T012/T018/T025                | Propiedad en servidor y comprobación visible con cuentas distintas; sin autorización por correo o referencia. |
| FR-008 | Sí                                      | T005/T006/T009/T011/T018/T019/T026/T027 | Tres estados distintos, avisos/enlaces y ausencia de verificación automática.                                 |
| SC-001 | Sí                                      | T006/T011/T012/T014/T016/T028/T029      | Sumas anuales y global independiente al céntimo; paridad fiscal solo tras reconciliar.                        |
| SC-002 | Sí                                      | T003/T017/T021–T024/T029/T030           | Fixtures y observador específicos; medición completa en navegador con umbral estricto <2.000 ms.              |
| SC-003 | Sí                                      | T005/T011/T025                          | Denegaciones del servidor y navegación por sesiones separadas.                                                |

**Cobertura documental de FR**: 8/8. **Cobertura documental de SC**: 3/3. Ninguna de estas proporciones equivale a pruebas aprobadas.

## 6. Cobertura de los nueve escenarios

E1–E9 son las etiquetas de trazabilidad de `tasks.md` para los escenarios numerados de `spec.md`, sin sustituirlos.

| Escenario                                            | Evidencia futura exigida y tareas concretas                                    | Balance documental                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| E1 — dos años y totales 20/80                        | T006/T011: datos; T026: grupos y totales visibles                              | Cubierto en diseño.                        |
| E2 — campos de cada aportación                       | T006/T011: DTO; T026/T028: campos, fechas y destinos visibles                  | Cubierto en diseño.                        |
| E3 — exclusión de estados no confirmados             | T006/T011 y T026 con mezcla controlada                                         | Cubierto en diseño.                        |
| E4 — filtro 2025                                     | T006/T011 y T027, incluida retirada del filtro                                 | Cubierto en diseño.                        |
| E5 — historial vinculado vacío                       | T006/T011 y T026, texto exacto y enlace para donar                             | Cubierto en diseño.                        |
| E6 — denegación de historial ajeno                   | T005/T011 y T025, aunque se conozcan identificadores                           | Cubierto en diseño.                        |
| E7 — falta de vínculo                                | T005/T006/T011 y T026, datos/red/persistencia y pantalla sin efecto automático | Cubierto en diseño.                        |
| E8 — año sin resultados                              | T006/T011 y T026/T027, aviso específico y quitar filtro                        | Cubierto en diseño.                        |
| E9 — 60 cuotas y cinco años en menos de dos segundos | T029: conjunto correcto; T030: duración y presentación con captura/traza       | Cubierto en diseño; medición no realizada. |

**Cobertura documental de escenarios**: 9/9; **escenarios acreditados mediante ejecución en este analyze**: 0/9.

## 7. Dependencias, tamaño, rutas y paralelo

- Se verifican 35 IDs únicos y consecutivos T001–T035, todas las casillas sin marcar. Las referencias a tareas corresponden a IDs existentes.
- Cada tarea declara origen, dependencia y comprobación. Todas sus dependencias explícitas remiten a tareas anteriores; no hay ciclos.
- T005–T007 escriben las pruebas antes del backend T008–T010. T015 precede al formato de T016. El contraste fiscal T013/T014 depende del backend comprobado, sin forzar cambios de HU-03.
- T017 depende de T011 y T016; puede avanzar mientras se completa T012 o el contraste fiscal. T021 espera T014 y T020; T025 espera la preparación del banco; T030 espera el control del conjunto de T029. Las tareas finales no sustituyen esas verificaciones.
- Los bloques A–H contienen 2/2/8/2/6/4/6/5 tareas, respectivamente. Cada tarea mantiene un objetivo delimitado de preparación, prueba, implementación o comprobación. Los grupos de casos T006 y T027 son cohesivos y tienen comprobaciones explícitas; no se identifica una división obligatoria ausente que impida ejecutarlos.
- Solo T015 y T016 llevan `[P]`. La explicación aclara que son secuenciales entre sí y paralelizables con backend por trabajar en otros archivos; no autoriza suites simultáneas sobre la base ni modificaciones concurrentes del mismo archivo.
- Los archivos de producción y banco previstos aparecen en el plan. Los informes, README y LEEME añadidos en la fase final sirven a evidencia y documentación; no introducen otra funcionalidad o entidad.
- La ausencia actual de `historial.test.js`, la nueva isla o el banco ejecutable corresponde al trabajo previsto. Los comandos futuros se identifican como tales; no se contabiliza esa ausencia como defecto de la fase de diseño.

## 8. Constitución y tareas sin correspondencia

No se identifican conflictos con los doce principios de la constitución. El diseño conserva la pila, los componentes comunes, la definición única de entidades, los datos confirmados, la exactitud y los permisos de servidor. Las dependencias con HU-01 y HU-03 están documentadas; la revisión de Javi permanece separada del trabajo técnico.

No se identifican tareas sin correspondencia. T001–T004 preparan el entorno de los criterios; T005–T030 implementan o comprueban US1; T031–T035 cubren regresión, documentación y revisión exigidas por la constitución. El ajuste del menú no redefine roles ni contratos comunes. No se propone una excepción constitucional.

## 9. Comprobaciones realizadas y métricas

### Comprobaciones ejecutadas en esta fase

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

El formato del informe y la conservación final se comprueban como verificación documental. No se ejecuta ninguna prueba de aplicación, build, migración, benchmark o consulta a PostgreSQL, Stripe o SMTP.

| Métrica                                                    | Resultado                                            |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| Historias en la especificación                             | 1, prioridad P1                                      |
| FR / SC analizados                                         | 8 / 3; 11 obligaciones identificadas por ID          |
| Escenarios de aceptación                                   | 9                                                    |
| Tareas                                                     | 35: 2 preparación, 2 fundamentos, 26 US1 y 5 finales |
| Tareas marcadas completadas                                | 0                                                    |
| Cobertura documental FR / SC / escenarios                  | 8/8, 3/3 y 9/9: 100 % en cada conjunto               |
| Requisitos sin tareas / tareas sin correspondencia         | 0 / 0                                                |
| Dependencias futuras, ciclos o IDs inexistentes detectados | 0                                                    |
| Ambigüedades accionables / duplicaciones conflictivas      | 0 / 0                                                |
| Hallazgos críticos / altos / medios / bajos                | 0 / 0 / 0 / 0                                        |
| Pruebas funcionales o mediciones ejecutadas en analyze     | 0                                                    |

## 10. Límites y siguiente paso

El análisis no demuestra el comportamiento de una implementación todavía pendiente. Permanecen por ejecutar, como trabajo normal de las tareas, las pruebas aisladas de autorización/concurrencia, el contraste fiscal con los servicios reales sobre fixtures, los recorridos visibles y la medición de SC-002. El rendimiento del índice existente deberá observarse durante esa validación; no se justifica una migración anticipada sin evidencia.

No hay correcciones documentales propuestas ni decisiones funcionales nuevas que resolver como resultado de este informe. El siguiente paso es revisar el diagnóstico y seleccionar un bloque de implementación, comenzando por la preparación T001–T004 cuando se encargue. No se ejecuta ese bloque en este analyze.

La incorporación se gestiona mediante el PR correspondiente. La única escritura autorizada de esta fase es `specs/spec-002/refinamiento/analyze-1.md`; todos los documentos analizados e históricos se conservan.
