## Segundo contraste de spec-007

✅ **Ya no hay diferencias:** la implementación cumple la spec, el plan y las tareas. No he modificado `tasks.md` ni el código.

**F1, F2 y F3 del primer contraste, resueltos:**
- **F1 (T027):** si «Publicar» falla, `DetalleActividad.jsx` muestra el motivo concreto de cada campo.
- **F2 (T028):** `quickstart.md` explica cómo crear, migrar y usar `ong_test` con `TEST_DATABASE_URL`.
- **F3 (T029):** `estados.js` aparece en el árbol de ficheros de `plan.md`.

**Pruebas:** 54 pasan y 3 se saltan; son las que necesitan la tabla `inscripciones` de spec-005.

**Cifras:**

| Medida | Valor |
|---|---|
| Requisitos y criterios revisados | 25 (11 FR, 3 SC, 11 escenarios) |
| Decisiones del plan revisadas | 7 |
| Principios de la constitución revisados | 12 |
| Diferencias | 0 |

**Tareas que siguen abiertas:** T002 (PR de la migración a `main`), T023 (comprobar con Javi) y T026 (recorrido manual del quickstart). Ya estaban en `tasks.md` y no dependen del código.

**Siguiente paso:** no hace falta otra vuelta de `/speckit-implement`. Lo que queda es revisión: recorrer el quickstart a mano (T026), subir la rama y abrir los PR (el de la migración, T002, y el de la spec completa), y cerrar T023 con Javi cuando llegue spec-005.
