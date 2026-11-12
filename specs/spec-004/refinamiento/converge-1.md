# Converge 1 de spec-004 (HU-04), 09/11/2026

Comparación del código actual con [spec.md](../spec.md), [plan.md](../plan.md) y [tasks.md](../tasks.md),
tras implementar las fases 1–5.

## Resultado: ✅ sin trabajo nuevo que añadir

| Elemento | Estado | Dónde |
|---|---|---|
| FR-001 Periodo, proyecto y agrupación | Cumple | `controlador.js` (zod), `servicio.generarInforme`, `Informes.jsx` |
| FR-002 Fin anterior al inicio | Cumple | `PERIODO_NO_VALIDO` en el servicio y en `validarPeriodo` del frontend |
| FR-003 Dinero | Cumple | `recaudacionInforme`: confirmadas por `fecha_cobro`; puntual, cuotas y número de aportaciones |
| FR-004 Voluntariado | Parcial, **ya planificado** | Las actividades celebradas se cuentan. Los voluntarios y las horas son las tareas T019–T020 de la fase 6, bloqueada por HU-08. No se añaden tareas nuevas |
| FR-005 Filas, subtotales y total | Cumple | `GROUPING SETS`, unión y orden en el servicio |
| FR-006 CSV y PDF iguales a la pantalla | Cumple | `csvInforme` y `definicionPdfInforme` sobre la misma salida; prueba SC-003 |
| FR-007 Informe vacío | Cumple | `vacio: true`, `MENSAJE_INFORME_VACIO`, `EstadoVacio` |
| FR-008 Solo administración | Cumple | `requiereRol('administrador')` en las 4 rutas; enlace del menú solo para ese rol |
| FR-009 Solo cifras agregadas | Cumple | Ninguna consulta de HU-04 lee `donantes`, `voluntarios` ni `usuarios`; pruebas en el JSON, el CSV y el PDF |
| SC-001 Cuadre | Cumple (dinero, aportaciones, actividades) | Prueba de cuadre de subtotales y total; las horas, en T020 |
| SC-002 < 1 min | Cumple en la API (0,06 s) | El recorrido en la página, en T021 y en la revisión a mano |
| SC-003 Exportaciones = pantalla | Cumple | `informes.test.js`, «exportación» |
| Casos límite | Cumplen los que no dependen de HU-08 | Proyecto inactivo, celebrada sin asistencias, cancelada, actividad que cruza de año. Las asistencias corregidas, en T020 |
| Decisiones del plan (R1–R11) | Cumplen | Incluido el cambio de `pdf.js` aprobado, anotado en el plan y en T011 |
| Constitución | Sin conflictos | Principio III: la PR espera a la fase 6 |

No hay código no pedido: la ruta `GET /api/informes/proyectos` está en el contrato y en R7.

**Siguiente paso**: esperar a que HU-08 llegue a `main` y ejecutar la fase 6 (T018–T021).
`tasks.md` no cambia.
