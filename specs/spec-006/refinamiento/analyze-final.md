# Analyze final de spec-006 (HU-06), 20/11/2026

Segunda pasada de `/speckit-analyze` (solo lectura) e informe final. El informe inicial es
[analyze-1.md](analyze-1.md) y lo que se hizo con cada uno de sus hallazgos está en
[registro-hallazgos.md](registro-hallazgos.md).

- **Fecha**: 20/11/2026.
- **Commit analizado**: `a560889` (rama `entrega-documentacion`), con la implementación de HU-06 ya en `main`
  (PR #3, aprobado por Nada el 18/11/2026).
- **Artefactos**: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`,
  `contracts/api-calendario.md` y `quickstart.md` de spec-006, contrastados con
  `.specify/memory/constitution.md`, `specs/plan-comun.md` (§3, §4, §7 y §8), `specs/modelo-datos.md`
  (`actividades`, `voluntarios`, `inscripciones` y dueños de cada tabla) y `CONVENCIONES.md` §2.
- **Código**: `backend/src/modulos/voluntariado/` (`actividades.js`, `rutas.js`, `controlador.js`,
  `servicio.js`, `repositorio.js`, `calendario.test.js`), `backend/src/db/semillas/`,
  `frontend/src/components/voluntariado/` (`CalendarioVoluntario.jsx`, `ListaCalendario.jsx`,
  `MesCalendario.jsx`, `ActividadCalendario.jsx`, `fechas.js`, `vuelta.js`, `vuelta.test.js`),
  `frontend/src/pages/mi-calendario.astro` y `frontend/src/components/comunes/Menu.jsx`.
- **Pruebas**: back-end, regresión del 20/11/2026 sobre `a560889` (`docs/entrega/regresion/backend.txt`):
  `voluntariado/calendario.test.js` 13 de 13 y la batería sin donaciones 232 pasan y 3 saltadas. Front-end:
  `npm test` en `frontend/` repetido para este informe, 40 de 40 (las 5 de `vuelta.test.js` incluidas).

> **Nota posterior (20/11/2026)**: la regresión final de la entrega (`docs/entrega/regresion/backend.txt`)
> ya no tiene pruebas saltadas. Desde `4af4d04`, las tres `it.skip` de `actividades/servicio.test.js` son un
> comentario que remite a `voluntariado/servicio.test.js`, donde esos casos se prueban con el servicio real.
> La cabecera de `spec.md` ya dice «Status: Implementada». Este informe no se ha reescrito; lo que se decidió con cada hallazgo está en
> [registro-hallazgos.md](registro-hallazgos.md), «Decisiones sobre el analyze final (20/11/2026)».

## Resultado

**0 CRITICAL · 0 HIGH · 0 MEDIUM · 8 LOW.** Cobertura del 100 %: los 6 FR y los 2 SC tienen tareas y
prueba (automática, manual o las dos). Las 26 tareas están hechas.

De los 16 hallazgos de analyze-1, 13 están resueltos y comprobados en el código o en los documentos. Lo
que queda abierto está en ficheros de spec-007 (K1) y no afecta a lo que hace HU-06. Los hallazgos nuevos
son de documentación: inventarios del plan y de los datos de prueba que no recogen cambios posteriores, y
notas de T013 que no dicen lo que pasó después. Ninguno cambia el comportamiento ni contradice un
requisito.

## Hallazgos

| ID | Categoría | Gravedad | Ubicación | Resumen y evidencia | Recomendación |
|---|---|---|---|---|---|
| G1 | Cobertura (verificación manual de FR-005) | LOW | quickstart.md, casos límite «Actividad cancelada por el coordinador» y «Cambio de fecha o lugar»; [prueba-manual.md](prueba-manual.md); [revision-pr-3.md](revision-pr-3.md) §2; T026 | En un navegador normal solo se comprobó el paso 2.3, al cambiar de pestaña y de ventana. Los dos casos límite se probaron el 06/11 lanzando a mano el evento de volver, y T026 dice que no se repitieron porque usan la misma recarga. Además, el caso «Cambio de fecha o lugar» solo cambia el lugar: ningún paso cambia la fecha, que es lo que movería la actividad de día en la vista mensual. La cancelación por el coordinador sí tiene prueba automática en la API (`calendario.test.js`, «no salen las terminadas…, las canceladas ni las de una actividad cancelada»); el cambio de fecha no tiene ninguna. El riesgo es bajo: el servidor vuelve a leer la actividad en cada petición, y la recarga al volver ya se comprobó con 2.3. | Repetir una vez los dos casos límite en un navegador normal y añadir al caso un cambio de fecha (por ejemplo, Jornadas un día más tarde: en *Mes* pasa al 22, 23 y 24). Apuntar el resultado en `prueba-manual.md`. |
| I1 | Inconsistencia (tasks frente a quickstart) | LOW | tasks.md, Phase 4: «Independent Test» y «Checkpoint»; quickstart.md 2.4 | Las dos líneas citan «2.1–2.3», pero el quickstart tiene un paso 2.4 (salir de la lista de espera, añadido al resolver G1 de analyze-1) que `prueba-manual.md` da por bueno. | Cambiar a «2.1–2.4» en las dos líneas. |
| I2 | Inconsistencia (datos de prueba) | LOW | quickstart.md, tabla de Preparación; research.md R7 («`voluntario@` ya tiene la celebrada Recogida de ropa»); `db/semillas/asistencias.js`; `db/semillas/actividades.js` («Banco de alimentos») | Desde `2546ae2` (HU-08), las semillas dan a `voluntario@ong.test` otra inscripción confirmada en una actividad ya celebrada, «Banco de alimentos» (Comedor social, hace 10 días, 2 h de asistencia). La tabla de Preparación y R7 solo nombran Recogida de ropa. Lo que se ve no cambia, porque una actividad terminada no sale; pero la tabla no dice todas las inscripciones del voluntario de prueba, y el paso 1.2 podría comprobar las dos. | Añadir una fila «Banco de alimentos (de spec-008) · hace 10 días · confirmada (ya celebrada)» y nombrarla en 1.2 y en R7. |
| I3 | Inconsistencia (plan frente a código) | LOW | plan.md, Technical Context, Source Code y Structure Decision; quickstart.md («Pruebas automáticas»); `frontend/package.json` (`"test": "node --test"`); plan-comun «Testing» | T025 (`80878c2`) añadió `vuelta.js`, `vuelta.test.js` y el script `test` de `frontend/package.json`. El plan no los recoge: la estructura no los nombra, el Technical Context solo habla de Vitest + Supertest y la Structure Decision dice que fuera del módulo solo cambian `Menu.jsx`, las semillas y el quickstart de spec-005, aunque también cambió `frontend/package.json`. El quickstart solo explica cómo pasar las pruebas del back-end. Este fichero no está entre los compartidos de CONVENCIONES §2, y después lo usaron también HU-02, HU-03 y HU-04 para sus pruebas del front-end. Aun así, plan-comun no recoge las pruebas del front-end. El comportamiento sí está documentado (research R5, T025 y revision-pr-3.md), así que no se considera una infracción del principio III. | Añadir `vuelta.js` y `vuelta.test.js` a la estructura del plan, el ejecutor de Node al Technical Context y `frontend/package.json` a la Structure Decision; en el quickstart, `npm test` en `frontend/`. Proponer al grupo una línea en plan-comun «Testing» sobre las pruebas del front-end. |
| I4 | Inconsistencia (registro de coordinación) | LOW | tasks.md, nota de cierre de T013 («su línea «Mis horas» en `Menu.jsx` sin conflicto»); merge `c4b414c` | El mensaje del merge de `main` en `spec-008` (10/11/2026) dice «Conflictos resueltos sumando ambas partes en Menu.jsx». El resultado es el esperado (`Menu.jsx` L11-12, «Mi calendario» y «Mis horas» seguidas), pero el conflicto que preveía I5 de analyze-1 sí se produjo. | Corregir la nota: «hubo conflicto en el merge `c4b414c` y se resolvió conservando las dos líneas». |
| I5 | Documentación desfasada | LOW | tasks.md, notas de T013 y T018 («El color `aviso` se propone al grupo y no se cambia sin su acuerdo»); [converge-2.md](converge-2.md), F4 («`aviso` pendiente del grupo»); `frontend/tailwind.config.mjs` L16 | El 19/11/2026 el color común `aviso` pasó de `#B26A00` a `#9A5B00` (`c959fe5`, «propuesto en converge-2 de spec-006»). La nota de T013 todavía lo da por pendiente. No consta que se haya vuelto a pasar Lighthouse tras el cambio: la última cifra de accesibilidad de la página (96) es de converge-2, con el color anterior. | Añadir a T013 el resultado (`c959fe5`) y, si se quiere la cifra, volver a pasar Lighthouse en `/mi-calendario` y apuntarla en `converge-2.md` o en `prueba-manual.md`. |
| C1 | Constitución (Constitution Check incompleto) | LOW | plan.md, Constitution Check | La tabla revisa I, II, III, IV, V, VI, VIII y XII, pero no VII, IX, X ni XI. Los cuatro se cumplen. VII: pila del Technical Context. IX: tasks.md cita CONVENCIONES §9 y research cita §2 y §4. X: Javi es el responsable y Nada la revisora, se trabajó en la rama `spec-006` y los commits empiezan por «HU-06:». XI: PR #3 aprobado por Nada. No hay ninguna infracción; solo falta escribirlo. | Añadir las cuatro filas con esa evidencia. |
| K1 | Coordinación con spec-007 (pendientes de analyze-1) | LOW | `specs/spec-007/quickstart.md` 1.6 y 2.3; `specs/spec-007/contracts/`, «En sentido contrario»; `db/semillas/actividades.js` L5-15 | Lo que T013 pasó a Nicole sigue igual en `a560889`. Sus pasos 1.6 y 2.3 no nombran Reparto de alimentos (I3 de analyze-1). Su contrato solo nombra `avisarPlazaConfirmada` como función que usa voluntariado, aunque plan-comun §7 ya recoge `listar`, `obtener` y `bloquearActividad` (I6). Su `enMadrid` sigue sumando horas a la medianoche, con el desfase el día del cambio de hora (D1). Para HU-06 el impacto es bajo: `npm run semillas` restaura Visita a la depuradora, el contrato común ya está en plan-comun, y las actividades de HU-06 usan el `enMadrid` corregido. | Fuera del alcance de spec-006 (ficheros de Nicole, principios X y XII): mantenerlo registrado como pendiente de spec-007 y recordárselo antes de la entrega. |

## Comprobado y correcto

- **Ruta y permisos (FR-006, R1, plan-comun §3 y §4)**: `GET /yo/calendario` con `requiereRol('voluntario')`
  (`rutas.js` L22). El esquema de `controlador.js` solo acepta `desde` y `hasta`, así que `voluntarioId` y
  `usuarioId` se descartan, y el servicio solo usa `usuario.id`. Cancelar una inscripción ajena da 404
  (`servicio.js`, `cancelar`). La respuesta no lleva plazas ni datos de otros voluntarios (principio V).
- **Reglas del servicio (FR-002, R3, data-model)**: `calendario()` coincide con «Reglas de `servicio.js`»
  del plan. Usa `listarActivasDeUsuario` (con `posicion`) y `actividades.obtener`, y se queda con las
  `publicada` que cumplen `fin > ahora()`. El solape con `inicioDeDia(desde)` e `inicioDeDia(hasta, 1)`
  coincide con el data-model y research R3. Ordena por `inicio` e id y calcula `enCurso = inicio <= ahora()`.
  La forma de la respuesta es `EntradaCalendario` del contrato, con `{ datos, total }`.
- **Acceso a actividades (R2, modelo-datos)**: solo a través de `voluntariado/actividades.js`, que
  reexporta `obtener` y apunta a los dos contratos. `repositorio.js` no consulta la tabla `actividades`.
  La tabla de dueños de modelo-datos ya cuenta a 006 entre quienes usan `actividades`, `voluntarios` e
  `inscripciones`.
- **Validación (contrato, data-model)**: fechas mal escritas o imposibles dan «Fecha no válida.» en su
  campo. El orden solo se compara si las dos fechas son válidas (T019), y `desde > hasta` da el error en
  `campos.hasta`.
- **Semillas (R7)**: las cuatro actividades de `semillas/voluntariado.js` coinciden con la tabla de R7
  (lugar, plazas y requisitos) y con plan-comun §8. `voluntario@` queda en la posición 1 de Visita a la
  depuradora.
- **Interfaz (R4, R5, R6)**: la lista se abre primero. «Siguiente» va en la primera confirmada que no ha
  empezado. Los estados y la etiqueta de espera son los de R4, y el detalle se despliega con
  `aria-expanded` y reutiliza `CancelarInscripcion.jsx`. La actualización usa `visibilitychange`, `focus`,
  `blur` y `pageshow` con `vuelta.js`; tras cancelar, y al cerrar la confirmación, se vuelve a pedir la vista
  sin vaciarla. La vista mensual tiene semanas de lunes a domingo, días de Madrid con `formatToParts`,
  `EstadoVacio` del día y del mes, `title` en las etiquetas y la cabecera fija al cambiar de mes. Los
  errores 401 y 403 se tratan como dice el quickstart.
- **Principios**: I (sin librerías ni tablas nuevas), II (nada fuera de FR-001…FR-006), III (cada escenario
  y caso límite tiene paso en el quickstart y resultado en `prueba-manual.md`, salvo lo dicho en G1), IV
  (dd/mm/aaaa y hora de Madrid), V, VI (cancelar es un cambio de estado), VIII (reutiliza `Layout`, `Menu`,
  componentes comunes y la cancelación de HU-05) y XII (cambios comunes avisados, salvo lo dicho en I3).
- Todas las specs del grupo mantienen «Status: Draft» en la cabecera de `spec.md`. Como es común a las 8,
  no se cuenta como hallazgo de spec-006.

## Cobertura de requisitos

| Requisito | ¿Tarea? | Tareas | Prueba automática | Prueba manual | Estado |
|---|---|---|---|---|---|
| FR-001 (lista primero y vista mensual) | Sí | T003, T006, T007, T008, T015, T020, T022, T024 | — (interfaz) | `prueba-manual.md` 1.1 y 1.4; `converge-2.md` (F1, F6, P1, P3) | Cumple |
| FR-002 (solo actividades sin terminar, confirmada o en espera) | Sí | T002, T004, T005 | `calendario.test.js`: «3 confirmadas y 1 en espera…», «no salen las terminadas…», «varios días ya empezada…», «desde y hasta…» | `prueba-manual.md` 1.1 y 1.2 | Cumple |
| FR-003 (lista de espera diferenciada y etiquetada) | Sí | T006, T007, T018, T024 | `calendario.test.js` (estado y `posicion` en espera) | `prueba-manual.md` 1.3; `converge-2.md` (F4, P3) | Cumple (color común ajustado en `c959fe5`, I5) |
| FR-004 (detalle y cancelar o salir de la lista antes del inicio) | Sí | T009, T010, T017 | `calendario.test.js`: «al cancelar o salir de la lista de espera…», «una actividad en curso no se puede cancelar (409)» | `prueba-manual.md` 2.1, 2.2, 2.4 y «En curso»; `converge-2.md` (F3) | Cumple |
| FR-005 (se actualiza sin recargar) | Sí | T009, T011, T016, T017, T025, T026 | `calendario.test.js` (2.2 y 2.3 en la API); `vuelta.test.js` (5) | 2.3 en un navegador normal, de pestaña y de ventana (`revision-pr-3.md` §2); casos límite con el evento lanzado a mano (`prueba-manual.md`) | Cumple (G1) |
| FR-006 (solo el propio calendario) | Sí | T004, T005, T009, T023 | `calendario.test.js`: «401 sin sesión y 403…», «cada voluntario ve solo el suyo…», «no se puede cancelar la inscripción de otro (404)…» | `prueba-manual.md` 1.5, «Sin rol de voluntario» y «Sin sesión» | Cumple |
| SC-001 (100 % de las inscripciones activas) | Sí | T002, T004, T014 | `calendario.test.js` compara con la base | `prueba-manual.md` 1.1 (4 de 4) | Cumple |
| SC-002 (siguiente actividad en < 10 s) | Sí | T007, T014, T026 | — (se mide con una persona) | Menos de 5 s, cronometrado por Javi (`revision-pr-3.md` §2, `67c7bd1`) | Cumple |

| Escenario o caso límite | Tareas | Comprobación | Estado |
|---|---|---|---|
| Escenarios 1.1–1.5 | T004–T008 | `calendario.test.js` y `prueba-manual.md` 1.1–1.5 | Cumple |
| Escenarios 2.1–2.3 (y paso 2.4) | T009–T011, T017, T025 | `calendario.test.js`, `vuelta.test.js`, `prueba-manual.md` 2.1–2.4 y `revision-pr-3.md` §2 | Cumple (I1) |
| Cancelada por el coordinador | T004, T011 | `calendario.test.js` y `prueba-manual.md` | Cumple (G1) |
| Varios días | T003, T004, T007 | `calendario.test.js` (solape entre meses) y `prueba-manual.md` | Cumple |
| Varios días ya empezada | T004, T009, T010 | `calendario.test.js` y `prueba-manual.md` «En curso» | Cumple |
| Dos el mismo día | T007, T024 | `prueba-manual.md` a 1440 y 375 px; `converge-2.md` (P3) | Cumple |
| Cambio de fecha o lugar | T011 | `prueba-manual.md` (solo el lugar) | Cumple para el lugar; fecha sin paso (G1) |
| Sin rol de voluntario | T004, T007, T023 | `calendario.test.js` (403) y `prueba-manual.md`; `converge-2.md` (P2) | Cumple |

**Tareas sin requisito propio**: T001 y T002 (base del servidor y semillas), T012 (formato), T013
(coordinación) y T014 (recorrido del quickstart), justificadas en el plan. T015–T026 citan en su texto el
requisito o el paso que corrigen. No hay alcance fantasma.

**Métricas**: 8 requisitos (6 FR y 2 SC) · 26 tareas, todas hechas · cobertura 100 % · 0 ambigüedades ·
0 duplicaciones · 0 subespecificaciones · 0 CRITICAL · 0 HIGH · 0 MEDIUM · 8 LOW.

## Conclusión

spec-006 llega a la entrega sin hallazgos críticos, altos ni medios abiertos. El único HIGH de analyze-1
(I1, actualizar al volver desde otra ventana) se resolvió, se corrigió de nuevo en la revisión del PR #3 (T025) y se
comprobó a mano en un navegador normal (T026). Spec, plan, tasks, contrato y código dicen lo mismo en todo
lo que decide el comportamiento: qué sale, en qué intervalo, quién puede verlo y cuándo se actualiza.

Los ocho hallazgos nuevos son LOW. Siete se arreglan con cambios de texto en `tasks.md`, `plan.md`,
`quickstart.md` y `research.md` (I1, I2, I3, I4, I5, C1), más una repetición manual corta (G1). El octavo
(K1) depende de ficheros de spec-007. Este informe no cambia nada: las recomendaciones quedan para que
el responsable decida si las aplica antes de la entrega.
