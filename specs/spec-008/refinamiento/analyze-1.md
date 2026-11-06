## Informe de análisis de spec-008

No hay problemas críticos y todos los requisitos tienen tareas. Conviene resolver antes de implementar los dos hallazgos de severidad alta (U1 e I4). No he modificado ningún fichero. Tampoco he usado el script de prerrequisitos: he leído directamente `specs/spec-008`.

| ID | Categoría | Severidad | Ubicación | Problema | Recomendación |
|----|-----------|-----------|-----------|----------|---------------|
| U1 | Infraespecificación | ALTA | `tasks.md` T014, `plan.md:104`, research R3 | `asistencias` no tiene `actividad_id`, y `actividades` tampoco se puede unir sin pasar por `inscripciones`, que el módulo no puede consultar. Con `sumarHorasDeInscripciones(inscripcionIds)`, solo con ids, no se puede obtener el título ni la fecha. | Pasar los pares `{ inscripcionId, actividadId }` que ya devuelve `listarInscripcionesDeUsuario`, y ajustar el plan y R3. |
| I4 | Inconsistencia | ALTA | `tasks.md` US1 y orden de fases, `quickstart.md` 1.2–1.4 | El MVP es solo US1, pero en la aplicación el total solo se ve en `/mis-horas` (US2). La prueba independiente de `tasks.md` recurre a `SUM(horas)`, y el principio III exige comprobarlo sin leer código. | Mostrar el efecto en la pantalla de US1, o declarar que 1.2–1.4 se validan tras T015–T019 y ampliar el MVP. |
| I1 | Inconsistencia | MEDIA | `plan.md:104` frente al contrato y T015 | **Tu diferencia 1.** El plan dice `{ total: 0, datos: [] }`, pero el contrato define `{ totalHoras, datos, total }`, donde `total` es el número de filas. Si se sigue el plan, `total` se confundiría con las horas. | Corregir el plan con la forma del contrato. |
| I2 | Inconsistencia | MEDIA | `plan.md:75-76` frente a T020 | **Tu diferencia 2.** T020 modifica `semillas/actividades.js`, que no aparece en la estructura del plan. | Añadirlo al plan. |
| U2 | Infraespecificación | MEDIA | `spec.md:52`, `quickstart.md` 2.1, T020, T022 | **Tu diferencia 3.** La semilla solo da 2 h a `voluntario@ong.test`, y 1.2–1.4 trabajan con `voluntario2`. Por tanto, nadie llega a las 5,5 h de la prueba, y el «p. ej. 5,5 h» oculta ese paso. | Añadir a 2.1 un paso previo: marcar a `voluntario@ong.test` como asistente en «Recogida de ropa». No sembrarlo, para no alterar 1.2–1.4. |
| I3 | Inconsistencia | MEDIA | research R5 frente a T004 | R5 calcula las horas en SQL y descarta JavaScript. T004 las calcula en una ayuda de `asistencias.js` y no indica cómo. | Decidir una opción. Lo más simple es calcularlas en el SQL del upsert o de la lectura, como dice R5. |
| I5 | Inconsistencia | MEDIA | `spec.md:48-57` y FR-007 frente a `plan.md` y research R7 | La spec dice «en su perfil», pero la decisión es `/mis-horas`, porque no hay página de perfil. | Añadir a la spec una aclaración de que el perfil, en este caso, es `/mis-horas`. |
| I6 | Inconsistencia | MEDIA | `spec.md:58` frente al contrato, T013 y `quickstart.md` 2.3 | La spec dice que se «deniega el acceso», pero el diseño no permite pedir las horas de otro: el parámetro se ignora y no hay denegación que comprobar. | Reformular 2.3: «solo puede ver las suyas; la aplicación no ofrece forma de pedir las de otro». |
| I7 | Inconsistencia | BAJA | `plan.md:48` frente a T005 | El plan cita `servicio.test.js`; las pruebas están en `asistencias.test.js`. | Corregir el plan. |
| I8 | Inconsistencia | BAJA | `quickstart.md` 1.1 frente a T012 | El paso abre «Registrar asistencia» en una actividad futura, pero el enlace solo aparece si está celebrada. | Dejar solo la URL directa en 1.1. |
| U3 | Ambigüedad | BAJA | `spec.md:102`, SC-001, `formato.js:32` | Se guardan 2 decimales y se muestra 1. Dos actividades de 1,75 h se ven como 1,8 + 1,8, con un total de 3,5, y SC-001 parece no cuadrar. | Aceptarlo y anotarlo en la spec. |
| U4 | Infraespecificación | BAJA | T020 | La actividad nueva no tiene título ni datos concretos; solo se ve «Banco de alimentos» como ejemplo en el contrato. | Fijar título y horario en T020. |
| U5 | Infraespecificación | BAJA | T002, T021 | T002 solo migra la base de desarrollo; las pruebas necesitan `007` también en `ong_test`. | Indicarlo en T021. |
| U6 | Infraespecificación | BAJA | `quickstart.md` 1.6, T010, T011 | El quickstart espera «Página sin acceso», pero ninguna tarea dice qué muestra la página ante un 403. | Indicar en T010 que muestre un `Aviso` de permiso. |
| I9 | Terminología | BAJA | `spec.md:91` | Queda «spec-004 (B)», mientras que spec-005 ya usa el nombre «(Javi)». | Cambiarlo a «(Rubén)». |

**Lo que he comprobado en el código y no da problemas:**
- La cancelación de FR-009 ya se rechaza en `voluntariado/servicio.js:158`.
- La nueva clave foránea no rompe la limpieza de las pruebas existentes, porque usan `TRUNCATE … CASCADE` y no se ejecutan en paralelo.

### Cobertura

| Requisito | ¿Tiene tarea? | Tareas | Notas |
|---|---|---|---|
| FR-001 | Sí | T004, T005, T007, T010 | |
| FR-002 | Sí | T006–T012 | |
| FR-003 | Sí | T004, T005 | Ver I3 |
| FR-004 | Sí | T003, T005, T014 | |
| FR-005 | Sí | T001, T003, T005 | |
| FR-006 | Sí | T005, T007 | |
| FR-007 | Sí | T013–T019 | Ver U1, I5 e I6 |
| FR-008 | Sí | T005, T009, T013, T017 | |
| FR-009 | Sí | T022 | Solo verificación; el código ya existe |
| SC-001 | Sí | T013, T022 | Ver U3 |
| SC-002 | Sí | T010, T022 | |

**Constitución:** no hay conflictos directos. I4 roza el principio III, pero solo si US1 se da por terminada antes de que exista `/mis-horas`.

**Tareas sin requisito asociado:** ninguna. T020 (la semilla) sirve para validar US2, y T002 y T021 son de soporte.

**Métricas:**
- **Requisitos:** 11 (9 FR y 2 SC).
- **Tareas:** 22.
- **Cobertura:** 100 %.
- **Hallazgos:** 15 (2 altos, 6 medios y 7 bajos).
- **Ambigüedades:** 1.
- **Duplicaciones:** 0.
- **Críticos:** 0.

### Siguientes pasos

No hay ningún bloqueo formal para ejecutar `/speckit-implement`, pero recomiendo resolver antes U1 e I4, porque cambian el diseño y el MVP. Los demás hallazgos son ediciones pequeñas en `spec.md`, `plan.md`, `tasks.md`, `research.md` y `quickstart.md`.

## Extension Hooks

**Optional Hook**: git
Command: `/speckit-git-commit`
Description: Auto-commit after analysis

Prompt: Commit analysis results?
To execute: `/speckit-git-commit`
