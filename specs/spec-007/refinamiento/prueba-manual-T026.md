# Prueba manual de spec-007 (T026)

**Fecha:** 04/11/2026 · **Responsable:** Nicole · **Rama:** `spec-007` (commit `0608f90`)
**Entorno:** desarrollo local (Docker: PostgreSQL + Mailpit), datos de `npm run semillas`.
**Usuario:** `coordinador@ong.test`

| # | Comprobación | Criterio | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|
| 1 | Crear una actividad nueva y publicarla, cronometrando desde «Nueva actividad» hasta «Actividad publicada» | SC-001, US1 escenarios 1 y 3 | Menos de 3 minutos | 1 min 30 s; la actividad queda en borrador y después publicada | ✅ |
| 2 | Cancelar una actividad publicada | US1 escenario 5, FR-008 | Pide confirmación y queda «Cancelada» | Pide confirmación y queda «Cancelada» | ✅ |
| 3 | Intentar editar o cancelar «Recogida de ropa» (ya celebrada) | Edge Cases, Clarifications Q4 | No se puede editar ni cancelar | No aparecen las opciones de editar ni cancelar | ✅ |
| 4 | Bajar las plazas por debajo de los inscritos confirmados | US1 escenario 4, FR-007 | Se rechaza y explica el motivo | 06/11/2026, por API tras integrar spec-005: «Limpieza de playa» (9 confirmados) a 5 plazas → 400 `PLAZAS_MENOR_QUE_INSCRITOS`, «Hay 9 inscritos confirmados; no puedes dejar menos plazas.» | ✅ |
| 5 | Motivo concreto al fallar «Publicar» con el proyecto inactivo | T027, FR-003 | Muestra «El proyecto no está activo.» | Con «Agua potable» desactivado en la base de datos, al publicar «Taller de reciclaje» aparece «El proyecto no está activo.»; el desplegable lo muestra como «Agua potable (inactivo)». Proyecto reactivado después | ✅ |
| 6 | Una actividad publicada aparece en el listado público y una cancelada no | US1 escenarios 3 y 5 | Solo publicadas futuras | 06/11/2026, con `GET /api/actividades/disponibles`: salen «Reparto de alimentos» y «Limpieza de playa»; no salen las canceladas, el borrador ni la celebrada. Comprobado por API, no en la página `/actividades` | ✅ |
| 7 | T023: un voluntario confirmado cancela con lista de espera | US2 escenarios 2 y 4, FR-006 | Pasa a confirmada la primera en espera y recibe correo; las plazas libres no cambian | 06/11/2026: `voluntario3` cancela en «Reparto de alimentos» → `voluntario5` queda confirmada, Mailpit recibe «Plaza confirmada: «Reparto de alimentos»» y sigue 0/2 | ✅ |
| 8 | Cancelar una inscripción de una actividad ya empezada | spec-005 FR-009 | Se rechaza | `voluntario@ong.test` en «Recogida de ropa» → 409 `INSCRIPCION_NO_CANCELABLE` | ✅ |

**Conclusión:** SC-001 cumplido (1 min 30 s < 3 min) y motivo de T027 correcto. Tras integrar spec-005, también pasan los puntos 4, 6, 7 y 8, y las pruebas automáticas dan 88 correctas y 3 saltadas (las `it.skip` de spec-007, cubiertas ahora por las de spec-005).
