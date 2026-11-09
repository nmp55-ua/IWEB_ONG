# Analyze 1 de spec-004 (HU-04), 09/11/2026

Revisión de coherencia entre [spec.md](../spec.md), [plan.md](../plan.md) y [tasks.md](../tasks.md)
(con research, data-model, contrato y quickstart) frente a la constitución 1.0.0.

## Hallazgos

| ID | Categoría | Severidad | Dónde | Resumen | Recomendación |
|---|---|---|---|---|---|
| A1 | Underspecification | MEDIUM | tasks T001 | La preparación de `informes.test.js` vacía `proyectos` y los usuarios de prueba con `TRUNCATE … CASCADE`. Son tablas comunes que ninguna otra prueba vacía; no hace falta, porque las filas sin datos no salen en el informe. | Vaciar solo `certificados_fiscales`, `inscripciones`, `actividades`, `aportaciones`, `suscripciones_socio`, `donantes` y `voluntarios` (como ya hacen otras pruebas). Crear proyectos y usuarios con nombres y correos únicos por prueba. |
| A2 | Coverage | MEDIUM | tasks T017, T021; spec SC-002 | SC-002 (informe anual exportado en < 1 min) solo se cronometra en T021, bloqueada por HU-08. | Cronometrar ya en T017 con el informe sin voluntariado y repetirlo en T021. |
| A3 | Inconsistency | LOW | plan, contrato; spec escenario 2 | La columna «Total recaudado» no aparece literalmente en el escenario 2. | Mantenerla: es «el dinero recaudado» de FR-003 (puntual + cuotas), justificada en research R8. Sin cambios. |
| A4 | Ambiguity | LOW | spec SC-001; research R5 | SC-001 pide horas «a la décima» y el cálculo es a la centésima, aunque se muestre con un decimal. | Compatible: el cálculo es más preciso que lo pedido. Sin cambios. |
| A5 | Inconsistency | LOW | spec escenario 1 (2026); quickstart (2023) | El quickstart usa 2023 en lugar de 2026. | Justificado en quickstart §0: las semillas generan fechas relativas a «hoy», que tocan 2025 y 2026. Sin cambios. |

## Cobertura

| Requisito | Tareas | Notas |
|---|---|---|
| FR-001 | T005, T006, T008, T009 | |
| FR-002 | T005, T006, T007, T008 | |
| FR-003 | T004, T005, T007 | |
| FR-004 | T004, T005, T007, T019, T020 | voluntarios y horas en la fase 6 (HU-08) |
| FR-005 | T005, T007 | |
| FR-006 | T011, T012, T013, T014 | |
| FR-007 | T002, T005, T007, T009, T011 | |
| FR-008 | T006, T007, T012, T013 | |
| FR-009 | T004, T007, T011, T020 | |
| SC-001 | T007, T020 | |
| SC-002 | T021 (A2: también T017) | |
| SC-003 | T011, T013 | |

Todas las tareas se corresponden con algún requisito, escenario, caso límite o cambio común.

**Constitución**: sin conflictos. El principio III (historia terminada solo con todos sus
criterios) queda cubierto porque la PR espera a la fase 6 (research R10). El V («informes con
cifras agregadas») lo cubre FR-009, con pruebas en las tres salidas.

## Métricas

- Requisitos: 9 FR y 3 SC; 21 tareas; cobertura del 100 %.
- Ambigüedades: 1 (LOW). Duplicados: 0.
- **Críticos: 0**.

## Acciones

Se corrigen A1 y A2 en `tasks.md`; A3–A5 se aceptan sin cambios. Se repite el analyze.
