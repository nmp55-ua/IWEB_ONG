He contrastado la implementación de spec-008 con la spec, el plan y las tareas, y quedan 2 cosas por hacer. Las he añadido a [tasks.md](specs/spec-008/tasks.md) como Phase 6: Convergence, sin tocar código ni hacer commit.

| ID | Tipo | Severidad | Origen | Problema | Tarea |
|----|------|-----------|--------|----------|-------|
| F1 | contradicts | ALTA | `modelo-datos.md` «Reglas generales» y `CONVENCIONES.md:74` | Confirmado: las dos normas exigen `creado_en` y `actualizado_en` en todas las tablas, y `007_asistencias.sql` no tiene ninguna. La sección de `asistencias` del modelo y `data-model.md` de spec-008 tampoco las listan, así que el error ya venía de la documentación. | T023 |
| F2 | partial | BAJA | Constitución IV | En `controlador.js`, `.int()`, `.positive()` y `.strict()` del `PUT` de asistencias no llevan mensaje propio, así que devuelven en `campos` el texto por defecto de zod, en inglés. La pantalla no lo muestra porque solo enseña el mensaje general, pero la API sí lo devuelve. | T024 |

**Sobre T023:** `007` todavía no está en `main`, así que según `LEEME.md` se puede editar en lugar de crear una migración `009`. A cambio, como ya está aplicada, hay que recrear las bases locales `ong` y `ong_test` para volver a aplicarla. T023 también incluye añadir las dos columnas a `data-model.md` de spec-008. Tú decides si corregir además la sección de `asistencias` de `modelo-datos.md`; es un documento común, así que conviene avisar al grupo.

**Sin hallazgos:**
- **Criterios de aceptación:** los de las dos historias se cumplen.
- **Errores:** 400, 404 y 409 con sus mensajes, la regla de FR-006 y que no se guarde ninguna fila si una no es válida.
- **Permisos:** 401 y 403 en las rutas de coordinador, 401 en `/api/yo/horas`, y las horas siempre se toman de la sesión, nunca de un parámetro.

**Lo que he revisado:**
- **Requisitos:** 9 FR, 2 SC y 9 escenarios de aceptación.
- **Plan:** sus decisiones de diseño (horas en SQL, pares para sumar, `PUT` con las filas marcadas, `rutasYo.js`, semillas).
- **Constitución:** 9 principios.

T022 sigue abierta solo por el cronometrado de SC-002, que haces tú, así que no la he duplicado.

## Extension Hooks

**Optional Hook**: git
Command: `/speckit-git-commit`
Description: Auto-commit after converge

Prompt: Commit convergence changes?
To execute: `/speckit-git-commit`
