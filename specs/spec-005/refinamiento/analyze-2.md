# Registro de hallazgos del analyze 1 de spec-005, 04/11/2026

Qué se ha decidido con cada hallazgo de [analyze-1.md](analyze-1.md). Responsable de todos: Javi,
salvo que se diga otra cosa. «Coordinación» = se habla con Nicole (T021) y queda pendiente de su
respuesta.

| ID | Historia / criterio | Gravedad | Decisión | Dónde | Estado |
|---|---|---|---|---|---|
| I1 | HU-05 FR-011 · HU-08 1.2 | HIGH | Me adapto a spec-008: en Recogida de ropa van `voluntario@` y `voluntario2`, y `voluntario2` tiene perfil. Para FR-011 (2.11) se usa una cuenta nueva de `/registro`, que además se puede repetir (resuelve también C3). La actividad de 2 h y la de 20 confirmados son de spec-008: se pregunta a Nicole quién las siembra; las inscripciones irían en `semillas/voluntariado.js`. | quickstart, T007; coordinación | Hecho en spec-005 · resto pendiente de Nicole |
| S1 | FR-009 | HIGH | Se fija el orden: lectura sin bloqueo solo para el dueño y la actividad → `bloquearActividad` → segunda lectura con el mismo `cliente`, y se decide sobre esta. Así nunca se bloquea primero la inscripción. | plan (cancelar), T017 | Hecho |
| C1 | Principio XII | HIGH | `bloquearActividad` se propone a Nicole y solo entra en `main` con su revisión del PR (principio XI). Si prefiere añadirla ella, se quita de spec-005. | research R2, plan, T004; coordinación | Pendiente de Nicole |
| S2 | FR-009 escenario 6 | MEDIUM | `bloquearActividad` cuenta las confirmadas con el mismo `cliente`. | T004 | Hecho |
| G1 | FR-006 · SC-003 de spec-007 | MEDIUM | Las tres `it.skip` de Nicole se cubren en `voluntariado/servicio.test.js`, sin simular nada: promoción al cancelar, posiciones y bajar plazas a la vez que alguien se inscribe. Se corrige el checkpoint de la fase 2. | T014, checkpoint | Hecho en tasks |
| D1 | — | MEDIUM | Solo T006 cambia `actividades/inscripciones.js`; spec-007 y spec-008 se quedan con esa versión al fusionar `main`. | T006; coordinación | Pendiente de Nicole |
| C2 | Escenario 8 | MEDIUM | El paso 2.8 se hace en una ventana privada o en otro navegador. | quickstart | Hecho |
| C3 | Escenario 11 | MEDIUM | Ver I1: cuenta nueva de `/registro`. | quickstart | Hecho |
| C4 | FR-009 (bordes) | MEDIUM | Las semillas imprimen los ids de las inscripciones de Recogida de ropa. La interfaz no deja intentarlo (las celebradas no salen en el listado), así que ese borde solo se puede probar por la API, y lo cubre también una prueba automática. | T007, quickstart | Hecho en tasks |
| I2 | FR-007 · FR-005 de spec-007 | MEDIUM | No se reabre la Q3. En Dependencies de spec-005 queda cómo se lee el FR-005 de spec-007, y se pide a Nicole que lo reescriba si quiere. | spec (Dependencies); coordinación | Hecho en spec-005 |
| I3 | — | MEDIUM | No se hace push de `spec-005` hasta que Nicole fusione el PR #2. | — | Aplicado |
| S3 | Escenario 3 | LOW | La posición también va en «obtener por id» y en las activas de un usuario. | T005 | Hecho |
| S4 | FR-001, FR-002 | LOW | T010 dice que se quitan las celebradas, se ordena ascendente y se da la forma del contrato. | T010 | Hecho |
| I4 | FR-002 | LOW | Singular «1 plaza libre de 10». | T011 | Hecho |
| S5 | FR-003 | LOW | Se acepta como límite de la v1 y se deja escrito. | research R8 | Hecho |
| I5 | — | LOW | T014 sin [P] y T013 → T014 en orden. | tasks | Hecho |
| S6 | — | LOW | T007 y T008 indican el `import` y el sitio de la llamada. | T007, T008 | Hecho |
| S7 | FR-004 | LOW | **No aplica tal cual**: el controlador comprueba el rol antes de validar, así que sin el rol siempre es 403. Se deja escrito en R5 y en T013. | research R5, T013 | Hecho |
| I6 | — | LOW | Las fechas de inscripción, confirmación y cancelación son de registro y usan `now()`; las reglas usan `ahora()`. Se deja escrito. | data-model | Hecho |
| S8 | FR-002 | LOW | Si acaba otro día, se muestra también la fecha del fin. | T011 | Hecho |
| C5 | Principio XII | LOW | Se propone al grupo actualizar plan-comun §4 y §7; no lo cambio yo solo. | T021; coordinación | Pendiente del grupo |
| I7 | — | LOW | Se acepta nombrar en Dependencies las funciones acordadas (como spec-007) y se actualiza la nota del checklist. | checklists/requirements.md | Hecho |
| S9 | — | LOW | Se anota la regla de la importación circular en T004. | T004 | Hecho |
| I8 | Bordes | LOW | El borde de solapes empieza con `npm run semillas`. | quickstart | Hecho |
| I9 | — | LOW | Se avisa a Nicole de que sus dos funciones ya están. | T021; coordinación | Pendiente de avisar |

Ningún hallazgo era un falso positivo completo; S7 solo aplica a medias (ver arriba).
