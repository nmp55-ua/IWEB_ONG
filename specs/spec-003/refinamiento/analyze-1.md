# Analyze 1 de spec-003 (HU-03), 08/11/2026

Informe de `/speckit-analyze` (solo lectura) sobre `spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/api-certificados.md`, `quickstart.md`, `datos-prueba.sql` y `tasks.md`
del commit `c347468`, contrastados con la constitución, CONVENCIONES, plan-comun, modelo-datos, el
[resumen técnico de HU-01](../../spec-001/refinamiento/resumen-tecnico-hu03-01.md), `004_donaciones.sql`,
las semillas y las pruebas existentes del backend. Las correcciones van en [analyze-2.md](analyze-2.md).

**Resultado: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 3 LOW.** Cobertura del 100 % de los FR vigentes (11; FR-010
eliminado) y de SC-002; SC-001 depende de HU-02.

## Hallazgos

| ID | Categoría | Gravedad | Ubicación | Resumen y evidencia | Recomendación |
|---|---|---|---|---|---|
| T1 | Subespecificación (validación) | HIGH | tasks.md T023; quickstart.md «Preparación»; `donaciones/migraciones.test.js` L40-47, `servicio.test.js`, `registro.test.js` | T023 pide «backend `npm test` con `DATABASE_URL` y `TEST_DATABASE_URL` a una base `ong_test`». Las pruebas con base de datos de HU-01 **fallan** (no se saltan) si la base no es `ong_test_hu01` y además comprueban que no cambian las tablas de `public`. Con una sola base `ong_test`, «todas las pruebas» nunca pueden pasar a la vez. | En T023 y el quickstart: dos ejecuciones en el mismo PostgreSQL desechable — `ong_test` migrada para todo salvo `modulos/donaciones/` y `ong_test_hu01` vacía para `modulos/donaciones/` — y registrar ambas. |
| I1 | Inconsistencia (textos) | MEDIUM | contracts/api-certificados.md L33; quickstart.md 1.4 y 1.7; tasks.md T010/T014 | El mensaje del ejercicio sin aportaciones aparece con tres redacciones: «No hay certificado de 2025: no tienes aportaciones confirmadas en ese ejercicio.» (contrato), «No tienes aportaciones confirmadas en 2023, así que no hay certificado de ese ejercicio.» (quickstart 1.4) y «No hay certificado de 2024…» (1.7). | Fijar una sola: «No tienes aportaciones confirmadas en AAAA, así que no hay certificado de ese ejercicio.» en contrato, quickstart, servicio y frontend. |
| A1 | Ambigüedad (plazo) | MEDIUM | spec.md caso límite «Confirmación tardía… se emite en ese momento»; research R3 | La tarea horaria emite o regenera en la siguiente ejecución (hasta 1 h después de la confirmación). La spec dice «en ese momento». FR-008 no fija plazo y el caso límite contrapone «ahora» a «esperar al 1 de enero siguiente», pero no está escrito. | Dejar escrito en research R3 y en el quickstart que «en ese momento» se cumple en la siguiente ejecución horaria (≤ 1 h) o al lanzar la orden; mencionarlo en la PR para Nada. No cambia la spec. |
| C1 | Cobertura (criterio de éxito) | MEDIUM | spec.md SC-001; plan.md «Dependencias»; tasks.md T024 | SC-001 compara con el historial de HU-02, que no está en `main`. Ninguna tarea puede acreditarlo hoy. | Mantenerlo como pendiente explícito (T024 y la PR); las pruebas ya usan la misma regla que HU-01 documenta para el historial. No bloquea. |
| I2 | Inconsistencia (cambios comunes) | LOW | plan.md «Cambios comunes»; tasks.md T022 | T022 actualiza `backend/src/modulos/LEEME.md`, que no está en la lista de cambios comunes del plan. | Añadirlo al punto 6 del plan. |
| U1 | Subespecificación (pruebas) | LOW | tasks.md T013; research R11 | Las pruebas de la API usan la instancia por defecto del servicio, cuyo «ahora» sale de `AHORA_SIMULADO` leído al importar `config.js`; T013 no lo dice y el escenario 5 depende de ello. | En T013: fijar `AHORA_SIMULADO` antes de importar la app (como `calendario.test.js`) y preparar los certificados con el servicio inyectado. |
| U2 | Subespecificación (interfaz) | LOW | research R9; tasks.md T014 | Entre una confirmación tardía de un ejercicio sin certificado y la siguiente ejecución, «Consultar un ejercicio» diría «no tienes aportaciones» aunque ya las haya. | Aceptarlo (≤ 1 h, ver A1) y anotarlo en R9. |

## Cobertura

| Requisito | Tareas | Notas |
|---|---|---|
| FR-001 | T005, T007, T008, T021 | Emisión de ejercicios cerrados; tarea horaria |
| FR-002 | T004, T005, T008 | Confirmadas, `fecha_cobro`, `rangoAnio`, suma `NUMERIC` |
| FR-003 | T002, T003, T010 | Definición del PDF |
| FR-004 | T010, T011, T016 | Descarga |
| FR-005 | T013, T016 | Varios ejercicios |
| FR-006 | T005, T010, T013, T014 | 409 y mensaje del ejercicio en curso |
| FR-007 | T010, T011, T013 | Rutas `/yo`, 404 |
| FR-008 | T005, T008 | Regeneración y emisión tardía |
| FR-009 | T002, T005, T008 | Correo, fallo registrado |
| FR-011 | T018, T019, T020 | Verificación pública |
| FR-012 | T010, T013, T016 | Vínculo verificado, sin acceso por correo |
| SC-001 | T024 | Pendiente de HU-02 |
| SC-002 | T008, T024 | |

**Constitución**: sin conflictos. VI (nada se borra) no aplica a la fila regenerada: la clarify fija un
único certificado por Donante y ejercicio, y el principio enumera aportaciones, inscripciones y
asistencias. XII: todos los cambios comunes están identificados y condicionados a aprobación.

**Tareas sin requisito**: ninguna (T001 y T009 son infraestructura de FR-001; T022–T024, documentación y
validación).

**Métricas**: 11 FR vigentes + 2 SC · 24 tareas · cobertura 100 % de FR · 1 ambigüedad · 0 duplicados ·
0 CRITICAL.
