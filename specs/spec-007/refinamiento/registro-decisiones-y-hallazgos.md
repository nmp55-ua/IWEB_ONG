# Registro de decisiones y hallazgos — spec-007 (HU-07)

**Responsable**: Nicole · **Revisor**: Javi · **Herramienta**: Spec Kit 1.0.4 (comandos `/speckit-*`) con Claude Code

## 1. Decisiones de clarify (enunciado §5.1)

Sesión del 28/10/2026, commit `4da496a`. La diferencia entre la spec anterior y la revisada es
ese commit (`git show 4da496a -- specs/spec-007/spec.md`).

| # | Pregunta | Respuesta | Justificación | Criterios afectados |
|---|---|---|---|---|
| C1 | ¿Un coordinador gestiona cualquier actividad o solo las de sus proyectos? | Cualquier coordinador, cualquier actividad | La narrativa habla de «quien coordina los proyectos» sin asignar coordinadores a proyectos; el modelo de datos no tiene ese vínculo. Es la regla más simple de comprobar en el servidor (principio I) | FR-010, US1 |
| C2 | Al liberarse una plaza, ¿se confirma directamente o hay plazo para aceptarla? | Confirmación directa y aviso por correo; si no puede ir, cancela | Evita estados intermedios («plaza ofrecida») y tareas programadas. La persona sigue pudiendo cancelar. Afecta a Inscripción (spec-005): acordado y confirmado con Javi | FR-006, US2 escenarios 2 y 4 |
| C3 | ¿Qué se puede editar de una actividad publicada? | Todo, respetando FR-003 y FR-007; si cambian fecha, hora o lugar se avisa a inscritos y lista de espera | El coordinador necesita corregir errores; avisar solo cuando el cambio afecta a la asistencia evita correos innecesarios. Una publicada no vuelve a borrador para no ocultar una actividad con inscritos | FR-011, FR-003, FR-007 |
| C4 | ¿Se puede cancelar una celebrada y cómo se descarta un borrador? | Una celebrada no se edita ni se cancela; un borrador se descarta cancelándolo, sin avisos | Las celebradas tienen asistencias y horas (HU-08) que no deben cambiar. Principio VI: nunca se borra físicamente | FR-004, FR-008, casos límite |
| C5 | ¿Qué se exige del proyecto y la fecha al crear, editar y publicar? | Proyecto activo e inicio futuro en las tres operaciones | No tiene sentido publicar una actividad pasada o de un proyecto cerrado. Desactivar un proyecto no cancela sus actividades ya publicadas, para no dejar a inscritos sin aviso | FR-003 |

## 2. Hallazgos de analyze (enunciado §5.2)

| ID | Informe | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| H1 | analyze-1 | Alta | Nadie promovía la lista de espera al cancelar un voluntario: spec-005 lo remitía a HU-07 y T023 solo decía «comprobar con Javi» | Contrato con spec-005: la cancelación llama a `promoverListaEspera`; correo único `avisarPlazaConfirmada` | Nicole (con Javi) | Cerrado (`ff7a202`), verificado en R2 |
| H2 | analyze-1 | Alta | El acceso provisional a inscripciones se creaba dentro del módulo de Javi | Provisional en `actividades/inscripciones.js`, que reexporta cuando existe spec-005 | Nicole | Cerrado (`ff7a202`) |
| H3 | analyze-1 | Alta | La prueba independiente de US1 dependía de la ruta pública de spec-005 | Validar con `GET /api/actividades?estado=publicada` hasta integrar | Nicole | Cerrado (`ff7a202`) |
| M1 | analyze-1 | Media | spec-005 decía que al cancelar «suben las plazas», falso con lista de espera | Fuera de spec-007: comunicado a Javi | Javi | Cerrado en spec-005 |
| M2 | analyze-1 | Media | No se fijaba qué devuelven las funciones del contrato | Valores de retorno añadidos al contrato y a T004 | Nicole | Cerrado |
| M3 | analyze-1 | Media | La decisión C2 constaba como cerrada sin la confirmación de Javi | Nota «confirmado con Javi» | Nicole | Cerrado |
| M4, L1–L3 | analyze-1 | Media/Baja | Pruebas de SC-002/SC-003 y aserciones menores sin tarea | Añadidas a T017 y T021 | Nicole | Cerrado |
| M1′, L1′, L2′ | analyze-2 | Media/Baja | Restos de «a acordar», fichero sin listar en el plan, nota de importaciones circulares | Corregidos en contrato, research, plan y T022 | Nicole | Cerrado; analyze-3 sin hallazgos |

## 3. Brechas de converge (enunciado §5.3)

| ID | Tipo | Origen | Tarea | Responsable · revisor | Prueba antes / después | Estado |
|---|---|---|---|---|---|---|
| F1 | Parcial | FR-003, US1 escenario 2 | T027 | Nicole · Javi | Antes: «Revisa los datos marcados.» sin campo marcado. Después: «El proyecto no está activo.» (prueba manual, punto 5) | Cerrado (`4d923cf`) |
| F2 | Parcial | Plan (pruebas) | T028 | Nicole · Javi | El quickstart explica cómo preparar `ong_test` | Cerrado (`4d923cf`) |
| F3 | No pedido | Plan (estructura) | T029 | Nicole · Javi | `estados.js` en el árbol del plan | Cerrado (`4d923cf`); converge-2 sin diferencias |
