## Informe de análisis de spec-008 (segunda pasada)

No hay problemas críticos ni altos, y los 15 hallazgos del primer análisis están resueltos en los documentos. Esta pasada encuentra 7 hallazgos nuevos y menores (2 medios y 5 bajos). No he modificado ningún fichero. Tampoco he usado el script de prerrequisitos: he leído directamente `specs/spec-008`.

| ID | Categoría | Severidad | Ubicación | Problema | Recomendación |
|----|-----------|-----------|-----------|----------|---------------|
| U7 | Infraespecificación | MEDIA | `spec.md:98` (SC-002), `quickstart.md:33`, T022 | Ninguna semilla ni tarea prepara una actividad celebrada con 20 confirmados. Tampoco se puede crear desde la aplicación, porque el inicio debe ser futuro. Así, SC-002 no se puede cronometrar tal como está escrito. | Añadir a T022 y al quickstart cómo preparar esos datos, por ejemplo una inserción temporal solo en la base de desarrollo. |
| I10 | Inconsistencia | MEDIA | `plan.md:15` y research R4 frente a T010 y `plan.md:104` | El plan y R4 dicen que se guarda la «lista entera», pero T010 envía solo las filas marcadas y el plan admite que las no enviadas no cambien. Además, el `PUT` exige al menos 1 fila: pulsar «Guardar» sin marcar nada daría un 400 que ninguna tarea trata. | Decidir que se envían las filas marcadas, ajustar el texto del plan y R4, y desactivar «Guardar» en T010 si no hay ninguna. |
| U8 | Infraespecificación | BAJA | T006, T014, T015 frente al contrato | PostgreSQL devuelve `NUMERIC` y `SUM` como texto, y `SUM` da `null` si no hay filas. El contrato pide números y un total de 0. Solo `horasDeActividad` (T003) indica la conversión a número. | Indicar la conversión y el `COALESCE(…, 0)` en T006 y T014. |
| U9 | Infraespecificación | BAJA | T007 | T007 dice «upsert con `horas`», pero no menciona que salen de `horasDeActividad`; solo lo hacen T003 y T004. | Nombrar la función en T006 y T007. |
| I11 | Terminología | BAJA | `plan.md:46,107`, T004 frente a `spec.md` | El plan y las tareas citan PA8.1 y PA8.2, que ya no aparecen en la spec porque se quitó Open Questions. | Sustituirlas por «Clarifications 2026-11-04» o por FR-001 y FR-003. |
| I12 | Terminología | BAJA | `plan.md:90`, `quickstart.md:26` frente a T010 y el contrato | «Interruptores» frente a «control asistió / no asistió». Además, un interruptor no representa bien el estado «sin registrar» (`asistio: null`). | Usar «control» en todos los documentos, con los tres estados visibles. |
| U10 | Infraespecificación | BAJA | `quickstart.md:40` | La prueba 2.2 no dice con qué usuario se hace. | Indicar `voluntario2@ong.test` después de 1.4, cuando su total vuelve a 0, o un voluntario de la semilla sin asistencias. |

### Cobertura

| Requisito | ¿Tiene tarea? | Tareas | Notas |
|---|---|---|---|
| FR-001 | Sí | T004, T005, T007, T010 | |
| FR-002 | Sí | T006–T012 | Ver I10 e I12 |
| FR-003 | Sí | T003, T005, T007 | Ver U9 |
| FR-004 | Sí | T003, T005, T014 | |
| FR-005 | Sí | T001, T003, T005 | |
| FR-006 | Sí | T005, T007 | |
| FR-007 | Sí | T013–T019 | Ver U8 |
| FR-008 | Sí | T005, T009, T010, T013, T017 | |
| FR-009 | Sí | T022 | Solo verificación; el código ya existe en spec-005 |
| SC-001 | Sí | T013, T022 | |
| SC-002 | Sí | T010, T022 | Ver U7 |

**Constitución:** no hay conflictos. U7 afecta al principio III (comprobable usando la aplicación), pero se resuelve preparando los datos; la pantalla no tiene que cambiar.

**Tareas sin requisito asociado:** ninguna. T020 sirve para validar US2, y T002 y T021 son de soporte.

**Métricas:**
- **Requisitos:** 11 (9 FR y 2 SC).
- **Tareas:** 22.
- **Cobertura:** 100 %.
- **Hallazgos:** 7 (2 medios y 5 bajos).
- **Ambigüedades:** 0.
- **Duplicaciones:** 0.
- **Críticos:** 0.

### Siguientes pasos

Ya puedes ejecutar `/speckit-implement`, porque nada de esto lo bloquea. Antes recomiendo resolver U7 e I10, que son ediciones pequeñas en `tasks.md`, `plan.md`, `research.md` y `quickstart.md`. Los hallazgos bajos también se pueden resolver durante la implementación.

## Extension Hooks

**Optional Hook**: git
Command: `/speckit-git-commit`
Description: Auto-commit after analysis

Prompt: Commit analysis results?
To execute: `/speckit-git-commit`
