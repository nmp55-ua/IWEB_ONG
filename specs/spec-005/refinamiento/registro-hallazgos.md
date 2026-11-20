# Registro de hallazgos del analyze 1 de spec-005 (HU-05)

Qué se decidió con cada hallazgo de [analyze-1.md](analyze-1.md) y cómo terminó. Las decisiones son del
04/11/2026; los estados se cerraron el 20/11/2026 comprobando el repositorio (tareas, commits, código y
pull requests). La segunda pasada de `/speckit-analyze` está en [analyze-final.md](analyze-final.md).
Hasta el 20/11 este fichero se llamaba `analyze-2.md`.

Responsable de todos: Javi, salvo que se diga otra cosa. «Coordinación» = se habla con Nicole en la
tarea T021 de [tasks.md](../tasks.md), cerrada el 17/11/2026 (commit `baa1d37`).

## Resumen

- 25 hallazgos (3 HIGH, 8 MEDIUM, 14 LOW): **25 cerrados**, ninguno pendiente.
- Los cuatro que el 04/11 dependían de otras personas (C1, D1, C5 e I9) y las partes de coordinación
  de I1 e I2 quedaron cerradas con la T021.
- I3 no se aplicó tal cual: el PR #2 acabó llevando toda la spec (ver la fila). El objetivo, que nada
  llegara a `main` sin la revisión de Nicole, sí se cumplió.
- Ningún hallazgo era un falso positivo completo; S7 solo aplicaba a medias.
- Quedan dos flecos fuera de spec-005, de ficheros de Nicole, que no impiden cerrar ningún hallazgo:
  su contrato no nombra `bloquearActividad` y sus tres `it.skip` siguen en su fichero. Se recogen en
  [analyze-final.md](analyze-final.md) (I1 y G1).

## Hallazgos

| ID | Historia / criterio | Gravedad | Decisión (04/11) | Dónde | Estado final y evidencia |
|---|---|---|---|---|---|
| I1 | HU-05 FR-011 · HU-08 1.2 | HIGH | Me adapto a spec-008: en Recogida de ropa van `voluntario@` y `voluntario2`, y `voluntario2` tiene perfil. Para FR-011 (2.11) se usa una cuenta nueva de `/registro`, que además se puede repetir (resuelve también C3). La actividad de 2 h y la de 20 confirmados son de spec-008: se pregunta a Nicole quién las siembra. | quickstart, T007; coordinación | **Cerrado.** spec-005: `semillas/voluntariado.js` L137-140 (Recogida de ropa con `voluntario@` y `voluntario2`) y quickstart 2.11 con cuenta nueva. Coordinación (T021): la asistencia de 2 h la siembra spec-008 en `semillas/asistencias.js`, sobre la actividad celebrada «Banco de alimentos» de `semillas/actividades.js`, y esa misma semilla crea la inscripción (no `semillas/voluntariado.js`, como se pensó el 04/11). La actividad de 20 confirmados no va en las semillas: se prepara a mano («Datos temporales para SC-002» del quickstart de spec-008; SC-002 cronometrado por Nicole el 10/11). |
| S1 | FR-009 | HIGH | Se fija el orden: lectura sin bloqueo solo para el dueño y la actividad → `bloquearActividad` → segunda lectura con el mismo `cliente`, y se decide sobre esta. Así nunca se bloquea primero la inscripción. | plan (cancelar), T017 | **Cerrado.** T017 hecha; `voluntariado/servicio.js` L149-168 (`cancelar`) sigue ese orden. Lo cubren las pruebas de cancelación de `voluntariado/servicio.test.js` (L382-470). |
| C1 | Principio XII | HIGH | `bloquearActividad` se propone a Nicole y solo entra en `main` con su revisión del PR (principio XI). Si prefiere añadirla ella, se quita de spec-005. | research R2, plan, T004; coordinación | **Cerrado.** Nicole (`nmp55-ua`) aprobó el PR #2 el 05/11/2026 sobre el commit `4ee51bc`, que ya incluía `bloquearActividad` (añadida en `55ba4c6`); se fusionó el 06/11 (`f67d459`). Visto bueno del grupo el 17/11, anotado en T021 (`baa1d37`). La función está en `actividades/servicio.js` L113-116 y en plan-comun §7. Fleco: el contrato de spec-007 aún no la nombra (pasado a Nicole; I1 de [analyze-final.md](analyze-final.md)). |
| S2 | FR-009 escenario 6 | MEDIUM | `bloquearActividad` cuenta las confirmadas con el mismo `cliente`. | T004 | **Cerrado.** `actividades/servicio.js` L115: `aRecurso(fila, await inscripciones.contarConfirmadas(id, cliente))`. Prueba del escenario 6 en `servicio.test.js` L429. |
| G1 | FR-006 · SC-003 de spec-007 | MEDIUM | Las tres `it.skip` de Nicole se cubren en `voluntariado/servicio.test.js`, sin simular nada: promoción al cancelar, posiciones y bajar plazas a la vez que alguien se inscribe. Se corrige el checkpoint de la fase 2. | T014, checkpoint | **Cerrado.** T014 hecha; pruebas en `servicio.test.js` L429 (promoción y aviso), L448 (posiciones) y L541 (bajar plazas e inscribirse a la vez, ajustada en `b930d76`). Checkpoint de la fase 2 corregido. Flecos: las `it.skip` siguen en el fichero de Nicole y el paso 1 de «Implementation Strategy» de tasks no se corrigió (G1 e I4 de [analyze-final.md](analyze-final.md)). |
| D1 | — | MEDIUM | Solo T006 cambia `actividades/inscripciones.js`; spec-007 y spec-008 se quedan con esa versión al fusionar `main`. | T006; coordinación | **Cerrado.** `git log --all -- backend/src/modulos/actividades/inscripciones.js` solo da dos commits: `6f8bedb` (provisional de spec-007) y `55ba4c6` (T006, la reexportación actual). spec-008 renunció a su provisional el 06/11 (`c031d5f`, su research R3). Anotado en T021. |
| C2 | Escenario 8 | MEDIUM | El paso 2.8 se hace en una ventana privada o en otro navegador. | quickstart | **Cerrado.** quickstart 2.8. |
| C3 | Escenario 11 | MEDIUM | Ver I1: cuenta nueva de `/registro`. | quickstart | **Cerrado.** quickstart (Preparación) y 2.11. |
| C4 | FR-009 (bordes) | MEDIUM | Las semillas imprimen los ids de las inscripciones de Recogida de ropa. La interfaz no deja intentarlo (las celebradas no salen en el listado), así que ese borde solo se puede probar por la API, y lo cubre también una prueba automática. | T007, quickstart | **Cerrado.** `semillas/voluntariado.js` L214-222 imprime los ids; quickstart, «Bordes»; prueba «ya cancelada o con la actividad empezada → 409» en `servicio.test.js` L409. |
| I2 | FR-007 · FR-005 de spec-007 | MEDIUM | No se reabre la Q3. En Dependencies de spec-005 queda cómo se lee el FR-005 de spec-007, y se pide a Nicole que lo reescriba si quiere. | spec (Dependencies); coordinación | **Cerrado sin cambio en spec-007.** Su FR-005 sigue diciendo «nuevas solicitudes» y se mantiene la lectura escrita en Dependencies de spec-005 (T021). |
| I3 | — | MEDIUM | No se hace push de `spec-005` hasta que Nicole fusione el PR #2. | — | **Cerrado, superado.** No se aplicó tal cual: se hizo push y el PR #2 pasó a llevar todo el ciclo de spec-005 (lo dice su descripción: «Al principio el PR era solo la migración […]; ahora lleva todo el ciclo»). Nicole lo aprobó el 05/11 y se fusionó el 06/11 (`f67d459`), así que nada llegó a `main` sin su revisión. plan y tasks aún describen el PR #2 como solo la migración (I3 de [analyze-final.md](analyze-final.md)). |
| S3 | Escenario 3 | LOW | La posición también va en «obtener por id» y en las activas de un usuario. | T005 | **Cerrado.** `voluntariado/repositorio.js`: `COLUMNAS` con `POSICION`, usado en `obtenerInscripcion` y `listarActivasDeUsuario`. |
| S4 | FR-001, FR-002 | LOW | T010 dice que se quitan las celebradas, se ordena ascendente y se da la forma del contrato. | T010 | **Cerrado.** `voluntariado/servicio.js` L57-90 (`listarDisponibles`). |
| I4 | FR-002 | LOW | Singular «1 plaza libre de 10». | T011 | **Cerrado.** `TarjetaActividad.jsx` L7-8 (`textoPlazas`). |
| S5 | FR-003 | LOW | Se acepta como límite de la v1 y se deja escrito. | research R8 | **Cerrado.** research R8, «Límite conocido». |
| I5 | — | LOW | T014 sin [P] y T013 → T014 en orden. | tasks | **Cerrado.** tasks.md. |
| S6 | — | LOW | T007 y T008 indican el `import` y el sitio de la llamada. | T007, T008 | **Cerrado.** T007 y T008. |
| S7 | FR-004 | LOW | **No aplica tal cual**: el controlador comprueba el rol antes de validar, así que sin el rol siempre es 403. Se deja escrito en R5 y en T013. | research R5, T013 | **Cerrado.** `voluntariado/controlador.js` llama a `exigirVoluntario` antes de cada `parse`; la prueba de 403 (`servicio.test.js` L237-242) envía a `PUT` y `PATCH` un cuerpo que no es válido para ellos y recibe 403. |
| I6 | — | LOW | Las fechas de inscripción, confirmación y cancelación son de registro y usan `now()`; las reglas usan `ahora()`. Se deja escrito. | data-model | **Cerrado.** data-model, «Estados y transiciones». |
| S8 | FR-002 | LOW | Si acaba otro día, se muestra también la fecha del fin. | T011 | **Cerrado.** `horario()` en `components/voluntariado/fechas.js` L15-20 (se movió desde `TarjetaActividad.jsx` en `a751d67`, HU-06, sin cambiar el comportamiento). |
| C5 | Principio XII | LOW | Se propone al grupo actualizar plan-comun §4 y §7; no lo cambio yo solo. | T021; coordinación | **Cerrado.** plan-comun §4 con `GET/PUT /api/yo/perfil-voluntario` y §7 con las firmas (`cliente`) y retornos implementados, avisando al grupo (T021, commit `baa1d37` del 17/11, en la rama `entrega-documentacion`). |
| I7 | — | LOW | Se acepta nombrar en Dependencies las funciones acordadas (como spec-007) y se actualiza la nota del checklist. | checklists/requirements.md | **Cerrado.** Nota del checklist actualizada. |
| S9 | — | LOW | Se anota la regla de la importación circular en T004. | T004 | **Cerrado.** T004 y cabeceras de `voluntariado/servicio.js` y `actividades/servicio.js`. |
| I8 | Bordes | LOW | El borde de solapes empieza con `npm run semillas`. | quickstart | **Cerrado.** quickstart, «Bordes», fila «Solapes». |
| I9 | — | LOW | Se avisa a Nicole de que sus dos funciones ya están. | T021; coordinación | **Cerrado.** Nicole quitó «Pendiente: acordar las dos funciones con Javi» de su research R3 el 06/11 (`c031d5f`), que ahora dice que `inscripciones.js` ya las reexporta. Anotado en T021. |
