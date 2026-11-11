T023 y T024 se cumplen, pero queda un hueco pequeño en T024 y lo he añadido a [tasks.md](specs/spec-008/tasks.md) como T025, en la Phase 7: Convergence. No he tocado código y `tasks.md` está sin commit.

| ID | Tipo | Severidad | Origen | Problema | Tarea |
|----|------|-----------|--------|----------|-------|
| F3 | partial | BAJA | Constitución IV / T024 | Si el cuerpo del `PUT` de asistencias no es un objeto (por ejemplo, un array JSON), la API devuelve el texto de zod en inglés «Expected object, received array». La pantalla no envía nunca ese cuerpo, así que solo ocurre con peticiones hechas a mano. | T025 |

**T023 comprobado:**
- `007_asistencias.sql` tiene `creado_en` y `actualizado_en` con `DEFAULT now()`.
- El upsert pone `actualizado_en = now()` al corregir.
- Las dos bases, `ong` y `ong_test`, tienen las columnas nuevas.

**T024 comprobado:** he pasado al esquema real del `PUT` 10 cuerpos no válidos. En 9 sale un mensaje en español: lista ausente o no válida, inscripción decimal, negativa, ausente o en texto, `asistio` ausente y claves sobrantes en la fila o en el cuerpo. El único en inglés es el del cuerpo que no es un objeto, que es T025.

**Sin hallazgos nuevos:** los criterios de aceptación de las dos historias, los errores 400, 404 y 409, los permisos 401 y 403, y el uso de la sesión en `/api/yo/horas` siguen como en la revisión anterior.

T022 sigue abierta solo por tu cronometrado de SC-002.

## Extension Hooks

**Optional Hook**: git
Command: `/speckit-git-commit`
Description: Auto-commit after converge

Prompt: Commit convergence changes?
To execute: `/speckit-git-commit`
