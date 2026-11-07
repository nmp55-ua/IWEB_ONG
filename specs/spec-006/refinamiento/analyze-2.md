# Registro de hallazgos del analyze 1 de spec-006, 06/11/2026

Qué se ha decidido con cada hallazgo de [analyze-1.md](analyze-1.md). Responsable de todos: Javi.
«Coordinación» = se habla con el grupo o con Nicole (T013) y queda pendiente de su respuesta.

| ID | Historia / criterio | Gravedad | Decisión | Dónde | Estado |
|---|---|---|---|---|---|
| I1 | FR-005 · escenario 2.3 | HIGH | Se escucha también `focus` en `window`, con la misma recarga, y no se repite si la última petición salió hace menos de 2 s (al volver pueden llegar `focus` y `visibilitychange` seguidos). El quickstart dice «volver a la ventana» y que basta con pulsar en ella. | research R5, T011, quickstart 2.3 y casos límite | Hecho |
| C1 | Principio III · caso «en curso» | MEDIUM | Se añade el paso con `AHORA_SIMULADO` (segundo día de Jornadas a las 10:00) y el back-end reiniciado; la prueba automática se mantiene. | quickstart (casos límite), plan (Constitution Check III), T014 | Hecho |
| C2 | Principio III · escenarios 1.1 y 1.4, SC-001 | MEDIUM | Se avisa en «Preparación» de que las semillas no tocan las actividades creadas a mano en los quickstarts de HU-05 y HU-07, y de cómo dejarlo limpio. No se cambia la semilla para que cancele inscripciones ajenas: borraría el trabajo de otras pruebas sin avisar. | quickstart (Preparación), research R7 («Límite») | Hecho |
| G1 | FR-004 · escenario 2.1 | MEDIUM | Paso 2.4 nuevo: tras `npm run semillas`, salir de la lista de espera desde el detalle. R5 recoge los dos avisos, igual que T011. | quickstart 2.4, research R5 | Hecho |
| S1 | FR-001 · CONVENCIONES §6 | MEDIUM | `EstadoVacio` para el día sin actividades y para el mes sin ninguna desde hoy; la pestaña *Mes* sigue con el calendario vacío. En los días de continuación, «hasta hh:mm» el último y «todo el día» los de en medio. Los días de otro mes que completan las semanas salen en gris y con sus actividades, porque se pide el intervalo de las semanas completas. | research R6, T007 | Hecho |
| A1 | SC-002 | LOW | «Siguiente» va en la primera confirmada que no ha empezado; si no hay ninguna, no se marca nada. | research R4, T007, quickstart (SC-002 y «En curso») | Hecho |
| A2 | Escenario 1.5 | LOW | El escenario habla de cancelar una inscripción ajena (no hay ruta para «verla»), y el paso 1.5 usa números cualquiera, porque se ignoran. | spec (escenario 1.5), clarify-1 (otros cambios), quickstart 1.5 | Hecho |
| I2 | Escenarios 1.1 y 2.1 | LOW | La tabla de R7 da lugar, plazas y requisitos de cada actividad, y la descripción común; el ejemplo del contrato pone los requisitos de Visita. | research R7, contrato, T002 | Hecho |
| I3 | Quickstart de spec-007 | LOW | Se pide a Nicole que sus pasos 1.6 y 2.3 nombren Reparto de alimentos. | T013; coordinación | Pendiente de Nicole |
| I4 | Plan, Constraints | LOW | El plan y R6 dicen qué decide el navegador con su reloj (mes que se abre, hoy, límite de «‹») y qué decide el servidor (qué sale y si se cancela). | plan (Constraints), research R6 («Reloj») | Hecho |
| I5 | Coordinación con spec-008 | LOW | En T013 entran lo pendiente de la T021 de spec-005 (inscripciones de prueba de spec-008) y dónde va su línea «Mis horas» en `Menu.jsx`. | T013; coordinación | Pendiente de Nicole |
| I6 | Documentación | LOW | T001 y T005 actualizan los comentarios de `actividades.js` y `rutas.js`. Se pide a Nicole que su contrato recoja `listar`, `bloquearActividad` y `obtener`. | T001, T005, T013; coordinación | Hecho en tasks · contrato de spec-007 pendiente de Nicole |
| C3 | Principio XII · CONVENCIONES §2 | LOW | Se corrige la frase del plan: se tocan dos cosas compartidas (la línea reservada de `Menu.jsx` y los datos de prueba). Se avisa al grupo, no solo a Nicole, y se propone completar la lista de semillas de plan-comun §8. | plan (Constitution Check XII, Structure Decision), research R7, T013; coordinación | Hecho en spec-006 · resto pendiente del grupo |
| D1 | Principio VIII | LOW | `enMadrid` propio en las semillas, que corrige el cambio de hora (el de Nicole no se exporta y tiene ese fallo; se le avisa). `diaMadrid` propio de una línea: `isoALocalMadrid` es de un componente del módulo de Nicole, y lo compartido iría en `lib/`, que no merece tocarse por una línea. | research R6 («Ayudantes») y R7, T002, T003, T013 | Hecho |
| S2 | — | LOW | Se fija `onCancelada(entrada)` en T006 y T007 y se ordena T010 → T011. | tasks | Hecho |
| S3 | — | LOW | Se acepta para la v1 y se corrige el motivo de R2: cuentan también las inscripciones de actividades celebradas, que siguen confirmadas. | research R2 | Hecho |

Ningún hallazgo era un falso positivo.
