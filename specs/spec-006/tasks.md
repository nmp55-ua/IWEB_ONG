# Tasks: HU-06 — Calendario personal del voluntario

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-calendario.md](contracts/api-calendario.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md).

**Responsable**: *Javi* · **Revisora**: *Nada*

**Tests**: plan-comun §8 exige pruebas automáticas de permisos (401, 403 y «cada uno ve lo suyo») en
toda ruta personal; por eso hay tareas de prueba en cada historia.

**Commits**: en español y empezando por `HU-06:` (CONVENCIONES §9).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**: US1 = ver mis próximas actividades; US2 = gestionar una actividad desde el calendario.

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/voluntariado/` y `frontend/src/components/voluntariado/`.

---

## Phase 1: Setup

No hay migraciones ni dependencias nuevas: el calendario es una vista ([data-model.md](data-model.md)).

---

## Phase 2: Foundational (bloquea US1 y US2)

- [X] T001 [P] Añadir `obtener` a la reexportación de `backend/src/modulos/voluntariado/actividades.js` (junto a `listar`, `bloquearActividad` y `avisarPlazaConfirmada`), sin tocar `modulos/actividades/servicio.js` (research R2), y que su comentario apunte también al contrato de spec-006. Lo importado solo se usa dentro de funciones (importación circular)
- [X] T002 [P] En `backend/src/db/semillas/voluntariado.js`, crear antes de las inscripciones las 4 actividades publicadas de la tabla de [research R7](research.md#r7-semillas-para-el-independent-test), con su lugar, plazas y requisitos (por título e idempotentes, descripción «Actividad de prueba: …», `creada_por` = `coordinador@ong.test`). Las horas, con un `enMadrid(dias, hh, mm)` propio que corrige el desfase si ese día cambia la hora (R7). Añadir sus inscripciones previstas (`voluntario@` en las 4, en espera en Visita a la depuradora detrás de `voluntario6` y `voluntario7`). Actualizar en `specs/spec-005/quickstart.md` el paso 1.1 y la tabla de Preparación con las actividades nuevas (el paso 1.3 sigue igual)
- [X] T003 [P] Crear `frontend/src/components/voluntariado/fechas.js` con `horario({ inicio, fin })` (movida tal cual desde `TarjetaActividad.jsx`, que pasa a importarla), `diaMadrid(iso)` → `aaaa-mm-dd` en `Europe/Madrid` (propia, con `Intl.DateTimeFormat`; research R6, «Ayudantes»), `diasDeActividad({ inicio, fin })` (del día del inicio al de `fin − 1 ms`), `semanasDelMes({ anio, mes })` (semanas de lunes a domingo que contienen el mes), `mesActual()` en Madrid y los nombres del mes y del día en español ([data-model](data-model.md#días-de-la-vista-mensual-en-la-interfaz))

**Checkpoint**: las semillas cargan (`npm run semillas` dos veces seguidas da lo mismo) y las 88 pruebas de antes siguen pasando.

---

## Phase 3: User Story 1 — Ver mis próximas actividades (P1) 🎯 MVP

**Goal**: el voluntario ve en lista y en el mes sus actividades sin terminar, con las de espera etiquetadas.

**Independent Test**: [quickstart.md](quickstart.md#historia-1--ver-mis-próximas-actividades), 1.1–1.5.

### Tests for User Story 1

- [X] T004 [US1] Pruebas en `backend/src/modulos/voluntariado/calendario.test.js` (Vitest + Supertest contra la base de pruebas, `AHORA_SIMULADO` fijo, correo simulado, módulo `actividades` real; research R8): 401 sin sesión y 403 como donante; voluntario sin perfil → 200 `datos: []`; 3 confirmadas futuras y 1 en espera → las 4 por `inicio`, con `estado`, `posicion` (solo la de espera), `enCurso: false` y las fechas ISO con desfase de Madrid (SC-001: mismas que las activas de la base); terminada hoy, inscripción cancelada y actividad cancelada por el coordinador (con `cancelar` del servicio de `actividades`) → no salen; de varios días ya empezada → sale con `enCurso: true`; otro voluntario solo ve las suyas y `?voluntarioId=`/`?usuarioId=` no cambian nada; `desde`/`hasta` por solape (una de varios días entre el 30/11 y el 02/12 sale en noviembre y en diciembre); fechas mal escritas o imposibles y `desde > hasta` → 400 con `campos`

### Implementation for User Story 1

- [X] T005 [US1] `calendario(usuario, { desde, hasta })` en `servicio.js` según «Reglas de `servicio.js`» del [plan](plan.md#reglas-de-servicio-js) (`listarActivasDeUsuario` + `actividades.obtener`, publicadas con `fin > ahora()`, solape con `inicioDeDia`, orden por `inicio` e id, forma `EntradaCalendario` del contrato); en `controlador.js`, esquema de `desde`/`hasta` con el `dia` de HU-05 y el mismo `refine` de orden, y controlador `calendario`; en `rutas.js`, `GET /yo/calendario` con `requiereRol('voluntario')`, y su comentario, que hoy dice que el rol siempre se comprueba en el servicio, explica la excepción (research R1)
- [X] T006 [P] [US1] `frontend/src/components/voluntariado/ActividadCalendario.jsx` (props `entrada`, `siguiente` y `onCancelada(entrada)`): resumen de una entrada con `horario()`, título, lugar y estado («Confirmada», «En lista de espera · posición N», «En curso»), con estilos distintos para la espera (borde discontinuo ámbar) y la marca «Siguiente» si se le indica (research R4)
- [X] T007 [US1] `frontend/src/components/voluntariado/ListaCalendario.jsx` (entradas por fecha; «Siguiente» en la primera confirmada que no ha empezado) y `MesCalendario.jsx` (cuadrícula de lunes a domingo con las semanas completas, días de otro mes en gris y con sus actividades, «‹» desactivado en el mes actual, «›», cada día es un botón con etiquetas desde 640 px —hora de inicio, «hasta hh:mm» o «todo el día»— y barras en móvil, día elegido con sus `ActividadCalendario` debajo, primer día del mes con actividades desde hoy elegido al abrir, `EstadoVacio` si el día o el mes no tienen ninguna, y leyenda; research R6). Las dos pasan `onCancelada(entrada)` hacia arriba. `CalendarioVoluntario.jsx`: pestañas *Lista* (la primera) y *Mes* con `aria-pressed`; la lista pide `GET /api/yo/calendario` y el mes, con `desde`/`hasta` de sus semanas; `EstadoVacio` «Todavía no tienes actividades por delante.» con *Ver actividades disponibles* (`/actividades`); con 401, «Inicia sesión para ver tu calendario.» y *Entrar* (`/entrar?volver=/mi-calendario`); otros errores, con su mensaje en un `Aviso`
- [X] T008 [US1] `frontend/src/pages/mi-calendario.astro` con `Layout` («Mi calendario») y descomentar el enlace «Mi calendario» en `frontend/src/components/comunes/Menu.jsx`

**Checkpoint**: 1.1–1.5 del quickstart pasan.

---

## Phase 4: User Story 2 — Gestionar una actividad desde el calendario (P2)

**Goal**: ver el detalle, cancelar o salir de la lista de espera y que el calendario se actualice solo.

**Independent Test**: [quickstart.md](quickstart.md#historia-2--gestionar-una-actividad-desde-el-calendario), 2.1–2.3 y casos límite.

### Tests for User Story 2

- [X] T009 [US2] Pruebas en `calendario.test.js`: cancelar desde el calendario (`PATCH /api/yo/inscripciones/:id`) y volver a pedir → ya no sale; salir de la lista de espera → ya no sale; quien estaba en espera sale «confirmada» después de que otro cancele (escenario 2.3); `PATCH` sobre la inscripción de otro voluntario → 404 y su calendario no cambia; una en curso no se puede cancelar (409)

### Implementation for User Story 2

- [X] T010 [US2] En `ActividadCalendario.jsx`, *Ver detalle* / *Ocultar detalle* (`aria-expanded`) que despliega proyecto, descripción, requisitos («Sin requisitos» si no hay) y *Cancelar inscripción* o *Salir de la lista de espera*, que abre `CancelarInscripcion.jsx` sin cambiarlo; si `enCurso`, «La actividad ya ha empezado: no se puede cancelar.» en vez del botón (FR-004, research R4)
- [X] T011 [US2] En `CalendarioVoluntario.jsx`, la actualización de [research R5](research.md#r5-actualización-sin-recargar-fr-005-clarify-q2): recargar la vista actual tras cancelar (`onCancelada`), con el aviso «Has cancelado tu inscripción en «…».» o «Has salido de la lista de espera de «…».»; al volver (`visibilitychange` visible y `focus` de `window`, sin repetir si la última petición salió hace menos de 2 s; *cambiado en T025*) y al restaurarse desde la caché (`pageshow` con `persisted`), sin vaciar la pantalla mientras llega

**Checkpoint**: 2.1–2.3 y los casos límite del quickstart pasan.

---

## Phase 5: Polish & Cross-Cutting

- [X] T012 [P] Pasar Prettier (`.prettierrc.json`) a los ficheros nuevos o tocados de `backend/src/modulos/voluntariado/`, `backend/src/db/semillas/voluntariado.js`, `frontend/src/components/voluntariado/` y `frontend/src/pages/mi-calendario.astro` (no a `app.js` ni a `Menu.jsx`, que ya estaban sin formatear en `main`)
- [ ] T013 Coordinarse con el grupo: avisar de las 4 actividades de prueba nuevas de Agua potable (Rubén las verá en sus informes) y proponer añadirlas a la lista de semillas de plan-comun §8. Con Nicole: se crean en `semillas/voluntariado.js` (por si prefiere moverlas a `semillas/actividades.js`); su `enMadrid` da una hora de más o de menos el día del cambio de hora; hay dos actividades «completas de 2 plazas», así que sus pasos 1.6 y 2.3 deberían nombrar Reparto de alimentos; que su contrato recoja `listar`, `bloquearActividad` y `obtener` como funciones que usa voluntariado; dónde van las inscripciones de la actividad de 2 h y la de 20 confirmados de spec-008 (pendiente de la T021 de spec-005) y su línea «Mis horas» en `Menu.jsx`, para no chocar al fusionar; y que cambia el paso 1.1 del quickstart de spec-005. Proponer al grupo oscurecer el color común `aviso` de `#B26A00` a `#9A5B00` (de 4,2:1 a 5,4:1 sobre blanco; T018). Pedir la revisión del PR a Nada
- [X] T014 Recorrer [quickstart.md](quickstart.md) completo en el navegador a 375 y 1440 px (también el caso «En curso» con `AHORA_SIMULADO`), revisar la consola y cronometrar SC-002 (< 10 s); dejar el resultado en `refinamiento/prueba-manual.md` y actualizar plan o contrato si algo implementado difiere (principio III) — *Hecho el 06/11/2026 ([refinamiento/prueba-manual.md](refinamiento/prueba-manual.md)): todos los escenarios y casos límite pasan; salieron P1–P3 (T022–T024). Lo que necesita una persona (cronometrar SC-002 y el cambio real de pestaña o ventana) no está hecho: pasa a T026.*

---

## Phase 6: Convergence

Tareas que salen del primer converge ([refinamiento/converge-1.md](refinamiento/converge-1.md)), T015–T021,
y de la prueba manual del 06/11 ([refinamiento/prueba-manual.md](refinamiento/prueba-manual.md)), P1–P3 en T022–T024.
Responsable: Javi · Revisora: Nada.

- [X] T015 En `frontend/src/components/voluntariado/CalendarioVoluntario.jsx` y `MesCalendario.jsx`, que al pulsar «‹» o «›» no se desmonte la cabecera del mes: dejar montados los dos botones y el nombre del mes mientras llega el mes nuevo y poner «Cargando…» solo en la cuadrícula, para que el foco siga en el botón pulsado y el `aria-live` anuncie el mes; el día elegido se sigue reiniciando al cambiar de mes per FR-001 / research R6 (partial)
- [X] T016 En `frontend/src/components/voluntariado/CalendarioVoluntario.jsx`, que una recarga en segundo plano que falla (al volver a la pestaña o a la ventana, o tras cancelar) conserve las entradas que ya se ven y enseñe el error en el `Aviso` de encima; vaciar la vista solo si falla la primera carga de la vista o del mes per research R5 / T011 (contradicts)
- [X] T017 En `frontend/src/components/voluntariado/ActividadCalendario.jsx` y `CalendarioVoluntario.jsx`, volver a pedir la vista (sin vaciar la pantalla) al cerrar la confirmación de cancelar, para que tras un 409 porque la actividad ya ha empezado o la ha cancelado el coordinador la tarjeta deje de ofrecer cancelar; sin cambiar `CancelarInscripcion.jsx` per FR-005 (partial)
- [X] T018 En `frontend/src/components/voluntariado/MesCalendario.jsx`, el número de los días de otro mes con `text-gray-600` en vez de `text-gray-400` (de 2,4:1 a 7,2:1 sobre `bg-gray-50`); proponer al grupo (T013) oscurecer el color común `aviso` de `frontend/tailwind.config.mjs`, que en texto pequeño da 4,1–4,2:1 en las etiquetas de lista de espera de HU-05 y HU-06 per research R6 / FR-003 (partial)
- [X] T019 En `backend/src/modulos/voluntariado/controlador.js`, que `desdeAntesQueHasta` solo compare cuando `desde` y `hasta` son días válidos (`existeDia`), para que una fecha mal escrita dé solo «Fecha no válida.» en su campo; añadir a `calendario.test.js` el caso `?desde=2026-13-01&hasta=2026-12-01` (solo `campos.desde`) per contrato `GET /api/yo/calendario` / data-model, validación de entrada (contradicts)
- [X] T020 En `frontend/src/components/voluntariado/fechas.js`, construir `diaMadrid` con `formatToParts` (año, mes y día en `Europe/Madrid`) en vez de depender del formato de presentación de `en-CA` per data-model, días de la vista mensual (partial)
- [X] T021 Corregir el paso 2.1 de `specs/spec-006/quickstart.md`: la fecha, el horario y el lugar ya están en la tarjeta, y *Ver detalle* despliega proyecto, requisitos («Sin requisitos»), descripción y el botón per quickstart 2.1 / research R4 / principio III (contradicts)
- [X] T022 En `frontend/src/components/voluntariado/ActividadCalendario.jsx`, el nivel del título según dónde se pinta, con un prop que le pasan `ListaCalendario.jsx` y `MesCalendario.jsx`: `h2` en la lista (debajo del `h1` de la página, como en `TarjetaActividad.jsx` de HU-05) y `h4` en el mes (debajo del `h3` del día); volver a pasar Lighthouse (`heading-order`) per prueba manual P1 / FR-001 (partial)
- [X] T023 En `frontend/src/components/voluntariado/CalendarioVoluntario.jsx`, con un 403 mostrar solo el `Aviso` «No tienes permiso para realizar esta acción.», sin las pestañas *Lista* y *Mes*, igual que ya se hace con el 401 per prueba manual P2 / caso límite «sin rol de voluntario» (partial)
- [X] T024 En `frontend/src/components/voluntariado/MesCalendario.jsx`, que cada etiqueta de la cuadrícula lleve un `title` con la hora, el título completo y, si es el caso, «en lista de espera», para poder leerla entera sin pulsar el día per prueba manual P3 / caso límite «dos el mismo día» (partial)

---

## Phase 7: Revisión del PR #3

Tareas de la revisión de Nada del 06/11/2026 ([refinamiento/revision-pr-3.md](refinamiento/revision-pr-3.md)).
Responsable: Javi · Revisora: Nada.

- [X] T025 En `frontend/src/components/voluntariado/CalendarioVoluntario.jsx`, sustituir el margen de 2 s por `crearVuelta` de `frontend/src/components/voluntariado/vuelta.js`: se apunta la salida (`visibilitychange` oculta o `blur`) y se recarga una sola vez en la primera vuelta (`visibilitychange` visible o `focus`), por rápida que sea; prueba de regresión en `vuelta.test.js` con el ejecutor de Node (`npm test` en `frontend/`, sin dependencias nuevas) per FR-005 / research R5 (contradicts)
- [ ] T026 Con una persona y un navegador normal: cronometrar SC-002 (< 10 s desde que se abre *Mi calendario* hasta decir cuál es la siguiente actividad) y hacer los pasos del quickstart que cambian de pestaña o de ventana (2.3 y los casos límite «Actividad cancelada por el coordinador» y «Cambio de fecha o lugar»); apuntar los resultados en `refinamiento/revision-pr-3.md` per SC-002 / FR-005 — *pendiente: en el navegador integrado y en Chrome automatizado, la pestaña de detrás sigue «visible», así que no sirven para esta comprobación*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (T001–T003)** → bloquea US1 y US2. T001 → T005; T003 → T006 y T007.
- **US1 (T004–T008)** → MVP; T005 → T007 (la interfaz necesita la ruta).
- **US2 (T009–T011)** → depende de US1: T010 amplía `ActividadCalendario.jsx` (T006) y T011, `CalendarioVoluntario.jsx` (T007). T010 → T011: el aviso de cancelación sube con `onCancelada(entrada)`, ya previsto en T006 y T007.
- **Polish (T012–T014)** → al final.

### Within Each Story

Pruebas (que fallan) → servicio → controlador → rutas → componentes → páginas.

### Parallel Opportunities

- T001, T002 y T003 en paralelo.
- T004 en paralelo con T005; T006 en paralelo con el back-end en cuanto el contrato es estable.
- T004 y T009 en orden (mismo fichero); T010 → T011.

## Implementation Strategy

1. Fase 2 y comprobar que las semillas y las pruebas de antes siguen bien.
2. US1 y validar 1.1–1.5.
3. US2 y validar 2.1–2.3 y casos límite.
4. Polish, y PR de `spec-006` a `main` revisado por Nada.

## Notes

- No hay rutas `DELETE`; cancelar es la ruta de HU-05, que cambia el estado (principio VI).
- Nunca se consulta `actividades` desde `voluntariado/repositorio.js`; siempre a través de
  `voluntariado/actividades.js`.
