# Prueba manual de spec-007 (T026)

**Fecha:** 04/11/2026 · **Responsable:** Nicole · **Rama:** `spec-007` (commit `0608f90`)
**Entorno:** desarrollo local (Docker: PostgreSQL + Mailpit), datos de `npm run semillas`.
**Usuario:** `coordinador@ong.test`

| # | Comprobación | Criterio | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|
| 1 | Crear una actividad nueva y publicarla, cronometrando desde «Nueva actividad» hasta «Actividad publicada» | SC-001, US1 escenarios 1 y 3 | Menos de 3 minutos | 1 min 30 s; la actividad queda en borrador y después publicada | ✅ |
| 2 | Cancelar una actividad publicada | US1 escenario 5, FR-008 | Pide confirmación y queda «Cancelada» | Pide confirmación y queda «Cancelada» | ✅ |
| 3 | Intentar editar o cancelar «Recogida de ropa» (ya celebrada) | Edge Cases, Clarifications Q4 | No se puede editar ni cancelar | No aparecen las opciones de editar ni cancelar | ✅ |
| 4 | Bajar las plazas por debajo de los inscritos confirmados | US1 escenario 4, FR-007 | Se rechaza y explica el motivo | No probado: necesita inscripciones, que crea spec-005 (Javi). Cubierto por las pruebas automáticas del servicio | ⏳ Integración |
| 5 | Motivo concreto al fallar «Publicar» con el proyecto inactivo | T027, FR-003 | Muestra «El proyecto no está activo.» | No probado a mano: desactivar un proyecto no se puede hacer desde la web | ⏳ |
| 6 | Una actividad publicada aparece en `/actividades` y una cancelada desaparece | US1 escenarios 3 y 5 | — | Pendiente: la página `/actividades` es de spec-005 | ⏳ Integración |

**Conclusión:** SC-001 cumplido (1 min 30 s < 3 min). Los puntos 4 y 6 se comprobarán al integrar spec-005, junto con T023.
