# Converge 2 de spec-004 (HU-04), 11/11/2026

Comparación del código actual con [spec.md](../spec.md), [plan.md](../plan.md) y [tasks.md](../tasks.md),
tras completar la fase 6 con HU-08 integrada en `main`.

## Resultado: ✅ Converged, sin trabajo nuevo que añadir

| Elemento | Estado | Dónde |
|---|---|---|
| FR-001 Periodo, proyecto y agrupación | Cumple | `controlador.js` (zod), `servicio.generarInforme`, `Informes.jsx` |
| FR-002 Fin anterior al inicio | Cumple | `PERIODO_NO_VALIDO` en el servicio y en `validarPeriodo` del frontend |
| FR-003 Dinero | Cumple | `recaudacionInforme`: confirmadas por `fecha_cobro` |
| FR-004 Voluntariado | **Cumple** | `voluntariadoInforme`: actividades celebradas, `count(DISTINCT voluntario_id)` y `sum(horas)` de asistencias con `asistio`, por ámbito; columnas «Voluntarios» y «Horas» en pantalla, CSV y PDF |
| FR-005 Filas, subtotales y total | Cumple | `GROUPING SETS`; voluntarios distintos en subtotales y total (prueba «clarify 3») |
| FR-006 CSV y PDF iguales a la pantalla | Cumple | Prueba SC-003 y quickstart 2.9–2.10 |
| FR-007 Informe vacío | Cumple | `vacio: true`, `MENSAJE_INFORME_VACIO` |
| FR-008 Solo administración | Cumple | `requiereRol('administrador')` en las 4 rutas |
| FR-009 Solo cifras agregadas | Cumple | Ninguna consulta selecciona columnas personales; pruebas de donantes y voluntarios en las tres salidas |
| SC-001 Cuadre | Cumple | Dinero, actividades y horas a la centésima (escenario 6) |
| SC-002 < 1 min | Cumple en la API (0,09 s) | El recorrido en la página queda para la revisión a mano |
| SC-003 Exportaciones = pantalla | Cumple | `informes.test.js`, «exportación» |
| Casos límite | Cumplen | Incluidas asistencias corregidas, celebrada sin asistencias y asistencias de actividades canceladas, futuras o fuera del periodo |
| Decisiones del plan (R1–R11) | Cumplen | R10 marcada como resuelta |
| Constitución | Sin conflictos | Principio III: todos los criterios cumplidos; queda la revisión a mano en el navegador |

No hay código no pedido. `tasks.md` no recibe tareas nuevas.

**Siguiente paso**: abrir la PR de HU-04 para Nicole.
