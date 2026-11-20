# Analyze final de spec-005 (HU-05), 20/11/2026

Segunda pasada de `/speckit-analyze` (solo lectura), después de cerrar todos los hallazgos de
[analyze-1.md](analyze-1.md) (estado y evidencia en [registro-hallazgos.md](registro-hallazgos.md)), del
converge ([converge-1.md](converge-1.md), [converge-2.md](converge-2.md)) y de la
[prueba manual](prueba-manual.md).

- **Commit analizado**: `a560889` (rama `entrega-documentacion`). Los documentos de spec-005 no tienen
  cambios sin commit, salvo este informe y el renombrado del registro.
- **Documentos**: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`,
  `contracts/api-voluntariado.md`, `quickstart.md` y `checklists/requirements.md`.
- **Contrastados con**: `.specify/memory/constitution.md` (1.0.0), `specs/plan-comun.md`,
  `specs/modelo-datos.md`, el contrato y las semillas de spec-007 y spec-008, y el código actual:
  `backend/src/modulos/voluntariado/` (rutas, controlador, servicio, repositorio y `actividades.js`),
  `actividades/inscripciones.js`, `bloquearActividad` en `actividades/servicio.js`, la migración
  `006_voluntariado.sql`, `db/semillas/` y `frontend/src/components/voluntariado/`.
- **Pruebas**: no se han vuelto a ejecutar en esta pasada (la base de pruebas no estaba arrancada). Se
  toma la regresión del mismo commit, `docs/entrega/regresion/backend.txt` (20/11/2026, 20:22):
  `voluntariado/servicio.test.js` 34 pruebas en verde; en total, 232 pasan y 3 se saltan (las `it.skip`
  de `actividades/servicio.test.js`, ver G1).

**Resultado: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 8 LOW.** Cobertura del 100 %: los 11 FR y los 2 SC tienen
tarea y prueba (automática o manual). No queda ninguna contradicción crítica ni alta. El código coincide
con el plan y el contrato en reglas, códigos de error, mensajes y orden de bloqueo; la migración 006
sigue igual que `data-model.md` y que `modelo-datos.md`. Los hallazgos son documentación desfasada
respecto a lo que pasó después del 04/11 y dos flecos en ficheros de Nicole.

Respecto al analyze 1: de 25 hallazgos (3 HIGH, 8 MEDIUM, 14 LOW) a 9 (0 HIGH, 1 MEDIUM, 8 LOW). Ninguno
de los nueve repite uno del analyze 1; cuatro son restos de hallazgos ya cerrados (I1 viene de C1, I3 de I3, y G1 e
I4 de G1).

## Hallazgos

| ID | Categoría | Gravedad | Ubicación | Resumen y evidencia | Recomendación |
|---|---|---|---|---|---|
| I1 | Inconsistencia entre specs (principio XII) | MEDIUM | `specs/spec-007/contracts/api-actividades.md` L70-83; `backend/src/modulos/actividades/servicio.js` L113-116; plan-comun §7; contrato de spec-005, «Lo que spec-005 usa de `actividades`» | El contrato de spec-007 solo nombra `avisarPlazaConfirmada` como función que usa `voluntariado`. No recoge `bloquearActividad(id, cliente)`, aunque está en su servicio desde `55ba4c6`, Nicole la aprobó en el PR #2 y plan-comun §7 y el contrato de spec-005 la describen. Tampoco nombra `listar` y `obtener`. Se pasó a Nicole el 17/11 (cierre de la T013 de spec-006). No es CRITICAL: el acuerdo existe y está en el plan común y en spec-005. Lo que falta es reflejarlo en una de las specs afectadas. | Que Nicole añada `bloquearActividad`, `listar` y `obtener` a «En sentido contrario» de su contrato. spec-005 no tiene que cambiar nada. |
| I2 | Documentación desfasada | LOW | `research.md` L37-39 (R2, «Acuerdo»); `plan.md`, Constitution Check (fila XII) | R2 sigue diciendo que `bloquearActividad` «se propone a Nicole el 04/11» y que, si ella prefiere añadirla, «se quita de aquí». Cita el principio XI, aunque lo pertinente es el XII. No recoge el resultado: aprobada en el PR #2 (05/11, `4ee51bc`) y visto bueno del grupo el 17/11 (T021). | Añadir una línea a R2 con el resultado y el PR, y dejar el plan en pasado («se acordó con Nicole»). |
| I3 | Documentación desfasada (proceso) | LOW | `plan.md` L121-122; `tasks.md` T002 (L33), L120 y L141 | plan y tasks describen el PR #2 como «solo T001–T002» y prevén otro PR para toda la spec «cuando el PR #2 esté fusionado». En realidad, el PR #2 llevó todo el ciclo (lo dice su descripción); Nicole lo aprobó el 05/11 y se fusionó el 06/11 (`f67d459`). Es el resultado de I3 del analyze 1. | Anotar en tasks (Dependencies) y en plan que el PR #2 acabó llevando toda la spec, con su fecha de fusión. |
| I4 | Inconsistencia interna de tasks | LOW | `tasks.md` L138 («Implementation Strategy», paso 1) frente al checkpoint de la fase 2 (L46) | El paso 1 dice «comprobar que las pruebas de spec-007 siguen pasando con las funciones reales». El checkpoint, corregido tras G1 del analyze 1, dice que esas pruebas usan su simulación de `inscripciones.js` y que la integración real se prueba en `voluntariado/servicio.test.js`. Se corrigió uno y no el otro. | Igualar el paso 1 al checkpoint. |
| G1 | Cobertura entre módulos | LOW | `backend/src/modulos/actividades/servicio.test.js` L347-356 (fichero de Nicole); `voluntariado/servicio.test.js` L429, L448 y L541 | Las tres `it.skip` de spec-007 siguen ahí con el comentario «se activan al integrarlo». spec-005 las cubre sin simulaciones en su fichero (T014), pero cada ejecución sigue informando de 3 pruebas saltadas, y quien lea el fichero de spec-007 no sabe que ya están cubiertas. | Que Nicole cambie las `it.skip` por un comentario que remita a `voluntariado/servicio.test.js`, o las quite. |
| I5 | Quickstart incompleto | LOW | `quickstart.md` L13-19 (tabla de Preparación) y 1.2 (L32); `db/semillas/actividades.js` L76-84; `db/semillas/asistencias.js` | Las semillas tienen una segunda actividad celebrada, «Banco de alimentos» (hace 10 días, de spec-008), con una inscripción confirmada de `voluntario@` y su asistencia de 2 h. La tabla no la nombra y 1.2 habla de «la celebrada», en singular. No rompe ningún paso, porque tampoco sale en el listado. | Añadir la fila de «Banco de alimentos» (celebrada, de spec-008) y decir en 1.2 «las celebradas». |
| I6 | Documentos comunes desfasados | LOW | `specs/plan-comun.md` L445-446; `specs/modelo-datos.md` L370 y L389 | plan-comun sigue contando PA5.1 y PA5.2 entre las preguntas abiertas, aunque se resolvieron en el clarify de spec-005 el 04/11 (sí lo hace con PA1, PA3 y PA4). modelo-datos mantiene «Si PA5.1 decide comprobar la edad, se añadirá `fecha_nacimiento`» y da como alta «`en_espera` (completa)» sin «si lo pide» (Q3 del clarify). Están fuera de spec-005 y no contradicen su código. | Proponer al grupo (principio XII) un cambio pequeño en plan-comun y modelo-datos: PA5.1 y PA5.2 resueltas, quitar la nota de la edad y añadir «y lo pide» a la transición. |
| S1 | Criterio de éxito medido en parte | LOW | `refinamiento/prueba-manual.md` L56-60 (SC-001); FR-011 | SC-001 se cronometró una vez, como `voluntario2@` con el perfil ya guardado: 10 s. La primera inscripción, que añade los cuatro datos de contacto, no se cronometró. La frase «no cambian el resultado» es una estimación. Con 10 s frente a 2 min el margen es amplio, pero no está medido. | Cronometrar una vez el flujo de 2.11 (cuenta nueva) o decir en prueba-manual que esa parte es una estimación. |
| C1 | Proceso (principio XI) | LOW | commit `b930d76` (06/11); PR #3 (spec-006) | El único cambio de spec-005 posterior a la aprobación del PR #2 que está en `main` (`b930d76`: la prueba de bajar plazas e inscribirse a la vez acepta los dos órdenes posibles) entró dentro del PR #3 de spec-006. Lo revisó Nada (comentario el 06/11, aprobación el 18/11), no Nicole, revisora de spec-005. El principio XI se cumple, porque lo revisó otra integrante, pero la revisora de spec-005 no ha visto ese cambio. Los commits posteriores de spec-005 (`baa1d37`, `e7adf06`, `1cd132d`) solo tocan documentación y están en `entrega-documentacion`, no en `main`. | Pedir a Nicole que revise `b930d76` (10 líneas de prueba) o dejarlo anotado en el dossier. |

## Cobertura de requisitos

| Requisito | ¿Tarea? | Tareas | Pruebas automáticas (`voluntariado/servicio.test.js`) | Quickstart / manual | Notas |
|---|---|---|---|---|---|
| FR-001 | Sí | T009, T010, T012 | L135 | 1.1, 1.2 | |
| FR-002 | Sí | T009, T010, T011, T027 | L135 (datos de la API) | 1.1 | Presentación solo manual |
| FR-003 | Sí | T009, T010, T011, T023 | L171, L195 | 1.3 | Límite de proyectos inactivos aceptado (R8) |
| FR-004 | Sí | T013, T015, T016, T018, T019 | L233-242 (401 y 403 en las 4 rutas) | 2.9, 2.10 | |
| FR-005 | Sí | T013, T016 | L286 | 2.1 | |
| FR-006 | Sí | T004, T013, T014, T016 | L369, L541 | 2.8 | |
| FR-007 | Sí | T013, T016, T018, T019, T027 | L313, L336 | 2.3, 2.8 | |
| FR-008 | Sí | T013, T016 | L302, L345 | 2.4, borde «celebrada» | |
| FR-009 | Sí | T006, T014, T017, T019 | L383, L397, L409, L429, L448 | 2.5, 2.6, 2.7, bordes | |
| FR-010 | Sí | T013 | L361 | borde «Solapes» | |
| FR-011 | Sí | T005, T013, T015, T018 | L244, L253 | 2.11 | |
| SC-001 | Sí | T022, T028 | — | prueba-manual: 10 s | S1 |
| SC-002 | Sí | T013, T014 | L369, L541 | 2.6, 2.8 | |

Casos límite: los 6 tienen prueba y paso. Última plaza a la vez (L369), cancelar tras el inicio (L409),
actividad celebrada (L345), actividad cancelada por el coordinador (L563), solapes (L361) y volver tras
cancelar (L464).

Funciones para otros módulos (contrato): las seis tienen prueba (L473, L487, L501), más tres de
integración con el servicio real de spec-007 (L529, L541, L563).

**Tareas sin requisito directo**: T001–T003 y T005–T008 (infraestructura), T020 (formato), T021
(coordinación) y T024–T026 (documentación, principio III). Todas están justificadas en el plan o en el
converge; no hay alcance fantasma.

## Constitución

| Principio | Estado | Comprobación |
|---|---|---|
| I. Simplicidad | Cumple | Sin comprobación de requisitos ni de solapes; `posicion` y `plazasLibres` derivados. |
| II. Cero alcance fantasma | Cumple | El código solo implementa FR-001…FR-011; no hay rutas ni pantallas de más. |
| III. Verificable | Cumple | Todos los escenarios tienen paso en el quickstart y la prueba manual pasó. Quedan los desfases de documentación I2–I5 (LOW). |
| IV. Español | Cumple | Mensajes en español; fechas con `formatearFecha` y `formatearHora` (`fechas.js`, `horario`). |
| V. Seguridad y datos | Cumple | Rol comprobado en el servidor antes de validar; cancelar la de otro → 404; perfil solo con los 4 datos de contacto. |
| VI. Nada se borra | Cumple | Sin `DELETE`; cancelar cambia el estado y rellena `fecha_cancelacion`. |
| VII–IX. Pila, una sola aplicación, convenciones | Cumple | `transaccion()`, `ErrorApi`, `requiereRol`, componentes comunes; `voluntariado` no consulta `actividades` con SQL propio. |
| X. Responsable, revisor y ramas | Cumple | Commits `HU-05:` en la rama `spec-005`. |
| XI. Revisión antes de `main` | Cumple | PR #2 aprobado por Nicole. Ver C1 (LOW). |
| XII. Cambios comunes con acuerdo | Cumple en spec-005 | `bloquearActividad` acordada y plan-comun §4 y §7 actualizados (`baa1d37`). Falta reflejarla en el contrato de spec-007 (I1). |

## Métricas

- Requisitos: 13 (11 FR y 2 SC). Tareas: 28, todas hechas (T001–T022 y T023–T028 del converge).
- Cobertura: 100 % con tarea; 100 % con prueba (11 FR y SC-002 con prueba automática, SC-001 manual).
- Pruebas de spec-005: 34 en `voluntariado/servicio.test.js`, en verde en la regresión del 20/11.
- Ambigüedades: 0. Duplicaciones: 0. Problemas CRITICAL: 0. HIGH: 0.

## Conclusión

spec-005 llega a la entrega sin contradicciones críticas ni altas. spec, plan, tasks, contrato,
data-model y código dicen lo mismo en lo que afecta al comportamiento. Los 25 hallazgos del analyze 1
están cerrados con evidencia.

De los nueve hallazgos nuevos, seis son de documentación de spec-005 o de los documentos comunes que no
se actualizó tras el 04/11 (I2–I6, S1). Dos están en ficheros de Nicole (I1 y G1) y uno es una nota de
proceso (C1). Ninguno pide cambiar código.

Siguientes pasos recomendados, sin aplicar en esta pasada:

1. Pedir a Nicole que complete su contrato (I1) y retire o redirija sus tres `it.skip` (G1). Pedirle
   también que revise `b930d76` (C1).
2. En spec-005, si se quiere dejar todo al día: R2 y plan (I2), PR #2 en plan y tasks (I3), paso 1 de
   «Implementation Strategy» (I4), tabla del quickstart (I5) y nota de SC-001 (S1).
3. Proponer al grupo el cambio pequeño de plan-comun y modelo-datos sobre PA5.1, PA5.2 y la lista de
   espera (I6).
