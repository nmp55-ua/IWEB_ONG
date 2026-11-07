# Analyze 1 de spec-005 (HU-05), 04/11/2026

Informe inicial de `/speckit-analyze` (solo lectura) sobre `spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/`, `quickstart.md` y `tasks.md` del commit `d137a2d`, contrastados también
con plan-comun, modelo-datos, CONVENCIONES, spec-007 (contrato y código) y spec-008 (rama
`origin/spec-008`). Se guarda sin corregir nada; las decisiones están en [analyze-2.md](analyze-2.md).

**Resultado: 0 CRITICAL, 3 HIGH, 8 MEDIUM, 14 LOW.** Cobertura del 100 % (11 FR y 2 SC con tareas).
Los problemas están casi todos en la frontera con Nicole (semillas, concurrencia, propiedad de
ficheros y pruebas sin dueño). La migración `006_voluntariado.sql` coincide columna a columna con
`data-model.md` (tipos, NOT NULL, CHECK, FK RESTRICT y los dos índices).

## Hallazgos

| ID | Categoría | Gravedad | Ubicación | Resumen y evidencia | Recomendación |
|---|---|---|---|---|---|
| I1 | Inconsistencia con spec-008 | HIGH | quickstart.md L17 y L20-21; tasks.md T007; quickstart de spec-008 (Preparación 3 y escenario 1.2); plan-comun §8 L279-280 | Semillas incompatibles: spec-005 pone en «Recogida de ropa» a `voluntario@` y `voluntario3` y deja a `voluntario2` sin perfil para FR-011, pero spec-008 espera «2 confirmados (voluntario@ong.test, voluntario2@ong.test)» y marca a `voluntario2` como «asistió». Además, plan-comun pide una asistencia de `voluntario@` «en otra actividad celebrada, de 2 h» que nadie siembra (ni la actividad ni la inscripción), y spec-008 pide una «actividad con 20 confirmados» para su SC-002 que tampoco crea nadie. | Acordarlo con Nicole y decidir quién crea la actividad de 2 h; añadir a T007 la inscripción de `voluntario@` en ella y, si hace falta, la de 20 confirmados. |
| S1 | Subespecificación (concurrencia) | HIGH | plan.md, fila «cancelar»; tasks.md T017 | Para llamar a `bloquearActividad` primero hay que leer la inscripción. Si se decide el estado con esa lectura previa, una promoción simultánea (en espera → confirmada) haría cancelar sin promover a nadie, dejando una plaza libre con gente esperando, y una cancelación simultánea de la actividad devolvería 200 en vez de 409. Bloquear antes la inscripción invertiría el orden de bloqueo de spec-007 (actividad → inscripciones) y podría producir un interbloqueo. | Fijar el orden: leer sin bloqueo (dueño y `actividad_id`) → `bloquearActividad` → volver a leer con el mismo `cliente` y decidir sobre esa segunda lectura. |
| C1 | Constitución XII | HIGH | research.md R2; plan.md (Constitution Check); tasks.md T004 | `bloquearActividad` figura en research como «pendiente de su visto bueno», pero el plan y T004 la dan por acordada. T004 toca `actividades/servicio.js`, de Nicole (CONVENCIONES §2), y bloquea T006 y T008. | Visto bueno explícito de Nicole (o que la añada ella) y actualizar R2. |
| S2 | Subespecificación (transacción) | MEDIUM | tasks.md T004 y T006 | T004 dice «`aRecurso(fila, contarConfirmadas)`» sin indicar que `contarConfirmadas` recibe el `cliente`. Sin él, la cuenta no ve la cancelación aún sin COMMIT, `plazasLibres` sale 0 y no se promueve a nadie (falla el escenario 6). | Escribir `aRecurso(fila, await inscripciones.contarConfirmadas(id, cliente))`. |
| G1 | Cobertura entre módulos | MEDIUM | actividades/servicio.test.js L15-20 y L348-356; tasks.md T013, T021 y checkpoint de la fase 2 | Las tres `it.skip` de Nicole («requiere spec-005», entre ellas «bajar plazas e inscribirse a la vez», su SC-003) no se pueden activar en su fichero, que simula `inscripciones.js` con `vi.mock`. T013 solo prueba dos inscripciones simultáneas y el checkpoint «las pruebas de spec-007 siguen pasando con las funciones reales» es falso (siempre usan la simulación). | Llevar esas tres pruebas a `voluntariado/servicio.test.js` sin simulación (T014) y corregir el checkpoint. |
| D1 | Duplicación de responsabilidad | MEDIUM | tasks.md T006; tasks.md de spec-007 («sustituir el provisional»); plan.md de spec-008 | Tres ramas tocan `actividades/inscripciones.js`: spec-005 (T006), spec-007 y spec-008, que le añade dos provisionales. Habrá conflictos al fusionar. | Acordar que solo lo hace T006 y que spec-008 se queda con la versión que reexporta. |
| C2 | Constitución III | MEDIUM | quickstart.md 2.8 | Todas las ventanas de un navegador comparten la cookie `ong.sid`: al entrar como `voluntario2` en otra ventana se pierde la sesión de `voluntario@`, y la primera respondería `YA_INSCRITO`. | «En una ventana privada o en otro navegador». |
| C3 | Constitución III | MEDIUM | quickstart.md (Preparación) y 2.11 | «Se puede repetir desde cero» no vale para 2.11: el perfil creado no se borra, y la segunda vez ya no se piden los datos. | Hacer 2.11 con una cuenta nueva de `/registro`, o avisar. |
| C4 | Constitución III | MEDIUM | quickstart.md, Bordes | «Cancelar tras el inicio» necesita el id de la inscripción de `voluntario@` en Recogida de ropa, y ninguna ruta lo da (las celebradas no salen en disponibles). | Que las semillas impriman ese id, o explicar cómo obtenerlo. |
| I2 | Inconsistencia con spec-007 | MEDIUM | spec-007 FR-005 frente a FR-007 y Q3 de spec-005 | spec-007 dice «las nuevas solicitudes MUST entrar en una lista de espera»; spec-005, que «solo entra quien lo pide». Solo chocan en la carrera por la última plaza. | Sin reabrir Q3: pedir a Nicole que su FR-005 hable de «solicitudes de lista de espera», o anotarlo en Dependencies. |
| I3 | Proceso (Git) | MEDIUM | tasks.md T002; PR #2 | El PR #2 sale de `spec-005` y la rama local va 3 commits por delante; si se hace push, entran en el PR, que debía llevar solo T001–T002. | No hacer push hasta que se fusione el PR #2. |
| S3 | Subespecificación | LOW | tasks.md T005 | La posición solo se calcula en el listado de una actividad; el recurso Inscripción y `miInscripcion` también la necesitan. | Añadirla en «obtener por id» y en «activas de un voluntario». |
| S4 | Subespecificación | LOW | actividades/repositorio.js (`ORDER BY a.inicio DESC`); tasks.md T010 | `listar` ordena al revés y devuelve datos internos; T009 lo prueba pero T010 no dice que se reordena y se transforma. | Indicarlo en T010. |
| I4 | Texto | LOW | spec.md, quickstart 1.1 y T011 | «1 plaza libre de 10» en singular frente a «N plazas libres de M» en T011. | Contemplar el singular. |
| S5 | Caso límite | LOW | proyectos/rutas.js (`WHERE activo`); T011 | Una publicada de un proyecto ya inactivo sale en el listado, pero no se puede filtrar por ese proyecto. | Sacar las opciones de las actividades o anotarlo. |
| I5 | Formato de tasks | LOW | tasks.md T009, T013, T014 | Marcadas [P] y editan el mismo `servicio.test.js`. | Quitar el [P]. |
| S6 | Subespecificación | LOW | app.js; T007, T008 | Falta el `import` de `rutasVoluntariado`, y la semilla debe ir antes de `pool.end()`. | Decirlo en T007 y T008. |
| S7 | Subespecificación | LOW | research.md R5; T013 | Si zod valida antes que el rol, un donante con cuerpo inválido recibe 400 y no 403. | Que la prueba de 403 envíe un cuerpo válido. |
| I6 | Inconsistencia | LOW | data-model.md y migración (`now()`) frente a plan-comun §8 | Las fechas de inscripción, confirmación y cancelación usan `now()`, no `ahora()`. | Pasar `ahora()` o dejarlo escrito. |
| S8 | Caso límite | LOW | FR-002; T011 | Una actividad que cruza la medianoche se mostraría sin la fecha de fin. | Mostrarla cuando sea otro día. |
| C5 | Constitución XII | LOW | plan-comun §7 y §4 | Las firmas de plan-comun no llevan `cliente` ni retorno, y la tabla de rutas no tiene `GET /api/yo/perfil-voluntario`. | PR pequeño a plan-comun con acuerdo del grupo. |
| I7 | Calidad de la spec | LOW | spec.md (Dependencies); checklists/requirements.md | La spec nombra `promoverListaEspera` y `COMMIT`, y la nota del checklist sobre preguntas abiertas está obsoleta. | Aceptarlo como convención del grupo y actualizar la nota. |
| S9 | Importación circular | LOW | actividades/servicio.js; T004, T006 | Ciclo `actividades/servicio.js → inscripciones.js → voluntariado/servicio.js → voluntariado/actividades.js → actividades/servicio.js`; funciona si nada se usa a nivel de módulo. | Anotarlo en T004 y T006. |
| I8 | Orden del quickstart | LOW | quickstart.md, Bordes | Tras 2.8, Limpieza de playa está llena y el borde de solapes daría `PLAZAS_AGOTADAS`. | «Tras `npm run semillas`». |
| I9 | Estado entre specs | LOW | research R3 de spec-008 («Pendiente: acordar con Javi») | spec-005 ya incluye las dos funciones con la misma firma y retorno. | Avisar a Nicole. |

## Cobertura

| Requisito | ¿Tarea? | Tareas | Notas |
|---|---|---|---|
| FR-001 | Sí | T009, T010, T011, T012 | |
| FR-002 | Sí | T009, T010, T011 | I4, S8 |
| FR-003 | Sí | T009, T010, T011 | S5 |
| FR-004 | Sí | T013, T015, T016, T018, T019 | S7 |
| FR-005 | Sí | T013, T016 | |
| FR-006 | Sí | T004, T013, T016 | «Bajar plazas a la vez» sin dueño (G1) |
| FR-007 | Sí | T013, T016, T018, T019 | I2 |
| FR-008 | Sí | T013, T016 | |
| FR-009 | Sí | T006, T014, T017, T019 | S1, S2 |
| FR-010 | Sí | T013 | |
| FR-011 | Sí | T005, T013, T015, T018 | C3 |
| SC-001 | Sí | T022 | Manual |
| SC-002 | Sí | T013, T014 | |

Los 6 casos límite tienen tarea y paso en el quickstart. Tareas sin requisito: T003, T004, T007, T020
y T021, de infraestructura o coordinación y justificadas en el plan; no hay alcance fantasma.

**Métricas**: 13 requisitos · 22 tareas (2 hechas) · cobertura 100 % · 9 subespecificaciones ·
1 duplicación · 0 CRITICAL.
