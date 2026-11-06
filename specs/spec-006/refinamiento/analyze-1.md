# Analyze 1 de spec-006 (HU-06), 06/11/2026

Informe inicial de `/speckit-analyze` (solo lectura) sobre `spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/api-calendario.md`, `quickstart.md`, `tasks.md` y `refinamiento/clarify-1.md`
del commit `a80e217`, contrastados también con la constitución, CONVENCIONES, plan-comun, modelo-datos,
spec-005 (research, contrato, quickstart y código de `voluntariado`), spec-007 (contrato, quickstart y
código de `actividades`), las semillas, los componentes del front-end que se reutilizan y la rama
`origin/spec-008`. Se guarda sin corregir nada; las decisiones irán en [analyze-2.md](analyze-2.md).

**Resultado: 0 CRITICAL, 1 HIGH, 4 MEDIUM, 11 LOW.** Cobertura del 100 % (6 FR y 2 SC con tareas).
El diseño del servidor cuadra con el código: `obtener(id)` ya existe y basta reexportarlo,
`listarActivasDeUsuario` ya da la posición con el mismo desempate, `voluntario6` y `voluntario7` existen
y dejan a `voluntario@` en la posición 1 de Visita a la depuradora, y empezar a +11 días mantiene el
paso 1.3 de HU-05. Los problemas están en la verificación manual: la actualización «al volver» depende
de un evento que no salta al cambiar de ventana, un caso límite solo se prueba con Vitest y las
semillas no reinician lo que dejan otros quickstarts.

## Hallazgos

| ID | Categoría | Gravedad | Ubicación | Resumen y evidencia | Recomendación |
|---|---|---|---|---|---|
| I1 | Inconsistencia (diseño frente a quickstart) | HIGH | research.md R5; tasks.md T011; quickstart.md 2.3 y casos límite «Actividad cancelada por el coordinador» y «Cambio de fecha o lugar» | La actualización al volver solo escucha `visibilitychange` y `pageshow`. Ese evento salta al cambiar de pestaña o al minimizar, pero no al pasar a otra ventana que sigue a la vista (si la tapa del todo, depende del navegador y del sistema). Así es justo como se prueban 2.3 y los dos casos límite («En una ventana privada u otro navegador… Volver a la pestaña»), porque la otra sesión necesita otra ventana. Y es el caso real del que parte R5: el voluntario lee el correo de HU-07 en otra aplicación y vuelve al navegador. | Escuchar también `focus` en `window`, con la misma función y sin pedir dos veces seguidas, y escribirlo en R5 y T011. Como mínimo, que el quickstart diga que hay que minimizar la otra ventana. |
| C1 | Constitución III | MEDIUM | quickstart.md, caso «En curso»; plan.md, Constitution Check III; spec.md, Edge Cases («varios días ya empezada») y FR-004 | El caso «sigue en el calendario hasta que termina, sin opción de cancelar» solo se comprueba con la prueba automática («las semillas no tienen ninguna a medias»), pero el plan dice que cada caso límite tiene su paso con semillas. Se puede ver en la aplicación sin tocar las semillas: `AHORA_SIMULADO` está en `.env.example` (L31-32) y `config.js` lo lee también fuera de las pruebas. | Añadir el paso: con `AHORA_SIMULADO` el día siguiente al inicio de Jornadas a las 10:00 y el back-end reiniciado, Jornadas sale «En curso», sin botón, y el `PATCH` da 409; después vaciar la variable. Si no, corregir la frase del Constitution Check. |
| C2 | Constitución III | MEDIUM | quickstart.md, Preparación (L7-8), 1.1, 1.4 y SC-001; `db/semillas/voluntariado.js` L67-101; quickstart de spec-007 2.1-2.2; quickstart de spec-005, borde «Solapes» | «`npm run semillas` deja… como al principio» solo vale para las actividades de prueba: las semillas recolocan las inscripciones de las actividades de su lista, no las de actividades creadas a mano. Tras el quickstart de HU-07 (2.1-2.2: actividad nueva de 1 plaza, `voluntario@` cancela y `voluntario2` queda confirmado), el calendario de `voluntario2` ya no está vacío y 1.4 falla. Si en «Solapes» de HU-05 se inscribe `voluntario@`, 1.1 y SC-001 dan cinco en vez de cuatro. Le puede pasar a la revisora en su base. | Avisarlo en Preparación: si antes se han hecho los quickstarts de HU-05 o HU-07, cancelar como coordinador las actividades creadas a mano (sus inscripciones pasan a canceladas) o partir de una base nueva. |
| G1 | Cobertura | MEDIUM | spec.md FR-004 y escenario 2.1; quickstart.md 2.1-2.3; research.md R5; tasks.md T011 | Salir de la lista de espera desde el calendario no tiene paso en el quickstart: 2.1 solo mira que el botón existe en Visita a la depuradora, y si se pulsa, 2.3 ya no se puede hacer porque `voluntario@` deja de estar en espera. Solo lo prueba T009 por la API. Además, R5 da un único aviso («Has cancelado tu inscripción en «…».») y T011 da dos (también «Has salido de la lista de espera de «…».»). | Añadir un paso al final («Tras `npm run semillas`, *Salir de la lista de espera* en Visita a la depuradora») con el aviso y la desaparición, y poner los dos avisos en R5. |
| S1 | Subespecificación (vista mensual) | MEDIUM | research.md R6; data-model.md, «Días de la vista mensual»; tasks.md T007; CONVENCIONES §6 | No se dice qué sale debajo de la cuadrícula si el día pulsado no tiene actividades o si en el mes no queda ninguna desde hoy (no hay «primer día con actividades» que elegir), ni si con el calendario vacío (1.4) se ve la pestaña *Mes*. CONVENCIONES §6 pide siempre un `EstadoVacio`. Tampoco se dice qué etiqueta llevan el segundo y el tercer día de Jornadas («hora de inicio» daría 09:00 los tres días) ni si los días de otro mes que completan las semanas (del 26/10 al 06/12 en noviembre de 2026) muestran actividades. | Fijarlo en R6 y T007: mensaje para el día y el mes sin actividades, qué se muestra en los días en que una actividad continúa y qué pasa con los días de fuera del mes. |
| A1 | Ambigüedad | LOW | research.md R4; tasks.md T007; SC-002 | «La primera lleva la marca «Siguiente»», pero no se dice qué pasa si la primera está en lista de espera (no es un compromiso seguro) o ya ha empezado. Con las semillas no ocurre: Visita es la tercera. | Decidir si «Siguiente» va en la primera confirmada que no ha empezado o dejar escrito que es siempre la primera. |
| A2 | Ambigüedad | LOW | spec.md escenario 1.5; refinamiento/clarify-1.md («abrirla o cancelarla da 404»); quickstart.md 1.5 | No hay ninguna ruta para ver una inscripción: solo existe el `PATCH` de cancelar, que es lo que prueba 1.5. Además, 1.5 pide «<id de voluntario2>», que no imprime nadie (las semillas imprimen ids de inscripciones). | En el escenario y en el clarify, «cancelar»; en 1.5, «cualquier número», porque se ignora. |
| I2 | Inconsistencia (datos de prueba) | LOW | research.md R7 (tabla); tasks.md T002; contracts/api-calendario.md (ejemplo); quickstart.md 1.1 y 2.1 | Ni R7 ni T002 dan el lugar ni la descripción de las 4 actividades, aunque 1.1 espera «cada una con su lugar» y un caso límite cambia el de Jornadas. T002 da tres requisitos sin decir de cuál es cada uno, y el ejemplo del contrato pone a Visita a la depuradora «Depuradora municipal» y `"requisitos": ""`, cuando según T002 solo la Charla no tiene. | Completar la tabla de R7 con el lugar y los requisitos de cada una y ajustar el ejemplo del contrato. |
| I3 | Inconsistencia con spec-007 | LOW | quickstart de spec-007 1.6 y 2.3; plan-comun §8 (L277-278) | Con Visita a la depuradora hay dos actividades «completas de 2 plazas con 1 en espera». Los pasos de Nicole dan lo mismo con cualquiera, pero si se elige Visita cambia lo que espera HU-06 (`voluntario@` pasa a confirmado o se cancela). | Decírselo a Nicole en T013 para que sus pasos nombren Reparto de alimentos. |
| I4 | Inconsistencia | LOW | plan.md, Constraints («"ahora" siempre de `servicios-comunes/fechas.js`»); tasks.md T003 (`mesActual()`); research.md R6 | La interfaz usa el reloj del navegador para el mes actual, el «‹» desactivado y el primer día «desde hoy». Con relojes reales no se nota, pero con `AHORA_SIMULADO` (C1) el servidor y la interfaz no coinciden. | Escribir en el plan que el navegador solo decide la navegación del mes, y que lo que sale y si se puede cancelar lo decide el servidor. |
| I5 | Coordinación con spec-008 | LOW | research.md R7 («así no hay conflictos al fusionar»); tasks.md de spec-005, T021 (sin hacer); plan de spec-008 (Project Structure); `Menu.jsx` L6-14 | T021 de spec-005 sigue abierta y deja las inscripciones de la actividad de 2 h y la de 20 confirmados de spec-008 en `semillas/voluntariado.js`, el mismo objeto que amplía T002. Además, spec-008 añade «Mis horas» a la lista `ENLACES` de `Menu.jsx`, la misma que toca T008; si van en líneas contiguas, habrá conflicto al fusionar. | Meter en T013 lo pendiente de T021 y acordar con Nicole dónde va cada línea. |
| I6 | Documentación | LOW | `voluntariado/actividades.js` L2; `voluntariado/rutas.js` L6-7; contrato de spec-007 («En sentido contrario», L81-83) | Tras T001, el comentario de `actividades.js` sigue apuntando solo al contrato de spec-005, y el de `rutas.js` dice que el rol se comprueba en el servicio, que ya no vale para `/yo/calendario`. El contrato de Nicole solo nombra `avisarPlazaConfirmada` como función que usa voluntariado; no recoge `listar`, `bloquearActividad` ni ahora `obtener`. | Actualizar los dos comentarios en T001 y T005, y pedir a Nicole en T013 que complete su contrato. |
| C3 | Constitución XII / CONVENCIONES §2 | LOW | plan.md, Constitution Check XII y Structure Decision; tasks.md T013; CONVENCIONES §2 (L55); plan-comun §8 | El plan dice «No se toca nada común», pero `db/semillas/` y `components/comunes/` son compartidos («se cambia con aviso al grupo»). La línea de `Menu.jsx` estaba reservada y `semillas/voluntariado.js` es de Javi, así que no hace falta permiso, pero T013 solo avisa a Nicole y la lista de semillas de plan-comun §8 queda incompleta (Rubén también usa las actividades de Agua potable para su informe). | Avisar al grupo, no solo a Nicole, y cambiar la frase del Constitution Check. |
| D1 | Duplicación | LOW | tasks.md T002 y T003; `semillas/actividades.js` L6 (`enMadrid`, sin exportar); `components/actividades/fechasFormulario.js` (`isoALocalMadrid`) | T002 necesita fechas «relativas a hoy en Madrid», y el ayudante que ya existe, `enMadrid`, no se exporta: sin tocar el fichero de Nicole hay que copiarlo. T003 crea `diaMadrid(iso)`, que es `isoALocalMadrid(iso).slice(0, 10)` del módulo de Nicole. Si se copia `enMadrid`, hereda que suma horas desde la medianoche: el día del cambio de hora, «10:00» sale a las 11:00 o a las 9:00. | Decir en T002 y T003 si se copia o se reutiliza, y por qué (principio VIII). |
| S2 | Subespecificación | LOW | tasks.md T010, T011 y «Parallel Opportunities» | T010 y T011 van «en paralelo», pero el aviso de cancelación tiene que subir de `ActividadCalendario` a `CalendarioVoluntario` a través de `ListaCalendario` y `MesCalendario`, que son de T007 y que ninguna de las dos tareas nombra. | Fijar el nombre de la función (por ejemplo, `onCancelada(entrada)`) en T007, o hacer T010 → T011. |
| S3 | Rendimiento | LOW | research.md R2 (Rationale); `voluntariado/repositorio.js` L138 (`listarActivasDeUsuario`) | «Un voluntario tiene pocas inscripciones activas» no es exacto: las inscripciones de actividades celebradas siguen `confirmada` para siempre (modelo-datos no tiene otra transición), así que el servicio llamará a `obtener` (dos consultas) por cada actividad de su historial, y lo repetirá cada vez que vuelva a la pestaña. | Aceptarlo para la v1 y corregir el motivo en R2. |

## Cobertura

| Requisito | ¿Tarea? | Tareas | Notas |
|---|---|---|---|
| FR-001 | Sí | T003, T006, T007, T008 | S1, A1 |
| FR-002 | Sí | T002, T004, T005 | C2 |
| FR-003 | Sí | T004, T006, T007 | |
| FR-004 | Sí | T009, T010 | C1, G1 |
| FR-005 | Sí | T009, T011 | I1 |
| FR-006 | Sí | T004, T005, T009 | A2 |
| SC-001 | Sí | T004, T014 | La prueba compara con la base; a mano, paso 1.1 (C2) |
| SC-002 | Sí | T007, T014 | Manual, cronometrado (A1) |
| Escenarios 1.1-1.5 | Sí | T004, T006, T007, T014 | Pasos 1.1-1.5 del quickstart |
| Escenarios 2.1-2.3 | Sí | T009, T010, T011, T014 | G1, I1 |
| Caso límite: cancelada por el coordinador | Sí | T004, T011 | I1 |
| Caso límite: varios días | Sí | T003, T004, T007 | El solape entre dos meses está en T004 |
| Caso límite: varios días ya empezada | Sí | T004, T009, T010 | Solo prueba automática (C1) |
| Caso límite: dos el mismo día | Sí | T007 | Charla y Análisis de fuentes, el mismo día |
| Caso límite: cambio de fecha o lugar | Sí | T011 | El quickstart solo cambia el lugar; sin prueba automática, porque cada petición vuelve a leer la actividad |
| Caso límite: sin rol de voluntario | Sí | T004, T007 | |

Tareas sin requisito: T001, T002 y T003 (base), T012 (formato), T013 (coordinación) y T014
(verificación), justificadas en el plan; no hay alcance fantasma.

**Métricas**: 8 requisitos · 14 tareas (ninguna hecha) · cobertura 100 % · 3 subespecificaciones ·
2 ambigüedades · 1 duplicación · 0 CRITICAL.
