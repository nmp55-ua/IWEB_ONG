## Contraste de la implementación de spec-007

He comparado el código con `spec.md`, `plan.md` y `tasks.md`, sobre todo los criterios de aceptación, los casos de error y los permisos. La implementación cumple la spec salvo 3 diferencias pequeñas, ninguna crítica ni importante. Las he añadido como tareas nuevas al final de `tasks.md`, y no he cambiado ni el código ni la spec.

| ID | Tipo | Gravedad | Origen | Qué he visto | Qué falta |
|---|---|---|---|---|---|
| F1 | Parcial | Media | FR-003, US1/AC2 | Si «Publicar» falla (por ejemplo, un borrador con el inicio pasado o un proyecto inactivo), `DetalleActividad.jsx` solo muestra «Revisa los datos marcados.». Pero la publicación no pasa por el formulario, así que no hay nada marcado. | Mostrar el motivo concreto en el aviso (T027). |
| F2 | Parcial | Menor | Plan (pruebas), plan-comun §8 | `quickstart.md` dice `npm test`, pero `servicio.test.js` se salta todas sus pruebas si no se define `TEST_DATABASE_URL`. | Documentar en el quickstart cómo crear y usar `ong_test` (T028). |
| F3 | No pedido | Menor | Plan (estructura de ficheros) | `components/actividades/estados.js` existe pero no aparece en el árbol de ficheros del plan. | Añadirlo al plan o integrarlo en los componentes (T029). |

**Lo que he comprobado sin encontrar diferencias:**
- **Permisos:** las 5 rutas exigen el rol de coordinador (401 sin sesión, 403 sin rol) y `:id` solo admite dígitos.
- **Criterios de aceptación y requisitos:** los 7 escenarios de US1, los de US2 que se pueden probar sin spec-005, los casos límite y FR-001 a FR-011.
- **Casos de error:** cada 400, 404 y 409 tiene su código y su mensaje en español.
- **Constitución:** principios IV, V, VI y VIII sin incumplimientos.

**Cifras:**

| Medida | Valor |
|---|---|
| Requisitos y criterios revisados | 25 (11 FR, 3 SC, 11 escenarios) |
| Decisiones del plan revisadas | 7 |
| Principios de la constitución revisados | 12 |
| Diferencias por tipo | 2 parciales, 1 no pedida |
| Diferencias por gravedad | 1 media, 2 menores |

**Lo que he añadido a `tasks.md`:** una «Phase 6: Convergence» con T027–T029, sin tocar ni renumerar las tareas existentes. Siguen abiertas T002, T023 y T026, que dependen de ti o de Javi. No he hecho commit.

**Siguiente paso:** `/speckit-implement` para la fase 6; después, un nuevo contraste debería salir limpio. ¿Las implemento?
