# Analyze 2 de spec-003 (HU-03), 08/11/2026

Correcciones de [analyze-1.md](analyze-1.md) y nueva ejecución de `/speckit-analyze` sobre los
artefactos corregidos. No se cambia `spec.md`.

## Decisiones sobre los hallazgos de analyze-1

| ID | Decisión | Cambios |
|---|---|---|
| T1 (HIGH) | Corregido. Dos bases en el mismo PostgreSQL desechable: `ong_test` (migrada) para todo salvo donaciones y `ong_test_hu01` (vacía) para las pruebas de HU-01. | tasks.md T023; quickstart.md «Preparación» |
| I1 (MEDIUM) | Corregido. Texto único: «No tienes aportaciones confirmadas en AAAA, así que no hay certificado de ese ejercicio.» | contrato (404); quickstart 1.7; tasks.md T010 y T014 |
| A1 (MEDIUM) | Corregido sin cambiar la spec: «en ese momento» = siguiente ejecución horaria (≤ 1 h) u orden manual; lo descartado es esperar al 1 de enero. Se mencionará en la PR. | research.md R3; quickstart, caso límite |
| C1 (MEDIUM) | Se mantiene como pendiente explícito: SC-001 depende de HU-02, que no está en `main`. | Sin cambios (ya en plan, quickstart y T024) |
| I2 (LOW) | Corregido. | plan.md «Cambios comunes» 6 |
| U1 (LOW) | Corregido. | tasks.md T013 |
| U2 (LOW) | Aceptado y documentado. | research.md R9 |

## Segunda ejecución

**Resultado: 0 CRITICAL, 0 HIGH, 1 MEDIUM (C1, aceptado), 0 LOW.** Cobertura 100 % de los 11 FR
vigentes y de SC-002. Los mensajes del contrato, quickstart y tareas coinciden; la validación de T023
es ejecutable con las pruebas de HU-01 tal como están; los cambios comunes del plan coinciden con los
de T009, T012, T017, T021 y T022. Sin conflictos con la constitución.

Se puede pasar a `/speckit-implement`.
