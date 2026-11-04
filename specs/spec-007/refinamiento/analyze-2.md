## Segundo análisis de spec-007

He revisado `spec.md`, `plan.md` y `tasks.md` tal como están ahora, sin commit, incluidos tus cambios de «acordado con Javi». Es solo lectura: no he cambiado nada. Los hallazgos de la primera ronda (H1–H3, M2–M4, L1–L3) están resueltos, y no hay problemas críticos ni importantes.

| ID | Gravedad | Dónde | Problema | Propuesta |
|---|---|---|---|---|
| M1 | Media | `contracts/api-actividades.md` (líneas 74–77 y 83); `research.md` R3 (línea 32) | spec, plan y tasks ya dicen «acordado con Javi», pero el contrato sigue con «a acordar con Javi» en 5 sitios y research.md con «Pendiente de acuerdo». | Cambiarlos a «acordado con Javi». |
| L1 | Menor | `plan.md` (árbol de ficheros) / T017 | T017 crea `components/actividades/fechasFormulario.js`, que no aparece en el árbol de ficheros del plan. | Añadirlo al árbol. |
| L2 | Menor | T004 / T022 | Dependencia circular entre módulos: `actividades/inscripciones.js` reexporta el servicio de voluntariado, que a su vez importará `avisarPlazaConfirmada` de `actividades/servicio.js`. Con módulos ES funciona, porque las funciones solo se llaman en tiempo de petición, pero conviene saberlo. | Anotarlo en T022: no usar esas importaciones a nivel de módulo, solo dentro de funciones. |

Además, el M1 del primer análisis («las plazas libres suben en una» en spec-005) sigue abierto. Es de spec-005, así que lo comunicas tú a Javi y queda fuera de spec-007.

### Cobertura

| Requisito | ¿Tiene tarea? | Tareas |
|---|---|---|
| FR-001 | Sí | T009–T020 |
| FR-002 | Sí | T001, T015, T017 |
| FR-003 | Sí | T006, T009, T011, T012 |
| FR-004 | Sí | T001, T012, T013 |
| FR-005 | Lo hace spec-005 | — |
| FR-006 | Sí | T022, T023, T021 |
| FR-007 | Sí | T011, T008 |
| FR-008 | Sí | T013, T026 |
| FR-009 | Sí | T014, T019 |
| FR-010 | Sí | T007, T008 |
| FR-011 | Sí | T011, T019, T024 |
| SC-001 | Sí | T026 |
| SC-002 / SC-003 | Sí | T021 |

**Tareas sin requisito que las justifique:** ninguna.

**Constitución:** no hay incumplimientos. Con el provisional fuera del módulo de Javi, ya no hay choque con CONVENCIONES.

**Cifras:**

| Medida | Valor |
|---|---|
| Requisitos | 14 (11 FR y 3 SC) |
| Tareas | 26 |
| Cobertura | 13 de 13 propios (FR-005 lo hace spec-005) |
| Ambigüedades | 0 |
| Duplicados | 0 |
| Críticos | 0 |

### Siguientes pasos

Puedes pasar a `/speckit-implement`. M1 es una corrección de texto de un minuto, y L1 y L2 son opcionales.
