# Tasks: HU-05 — Consulta e inscripción en actividades de voluntariado

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-voluntariado.md](contracts/api-voluntariado.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md).

**Responsable**: *Javi* · **Revisor**: *Nicole*

**Tests**: plan-comun §8 exige pruebas automáticas de permisos, aforo con peticiones simultáneas
y paso FIFO desde la lista de espera; por eso hay tareas de prueba en cada historia.

**Commits**: en español y empezando por `HU-05:` (CONVENCIONES §9).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**: US1 = consultar actividades; US2 = inscribirse y cancelar.

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/voluntariado/` y `frontend/src/components/voluntariado/`.

---

## Phase 1: Setup

**Purpose**: la tabla `inscripciones` en `main` cuanto antes, porque `asistencias` (spec-008)
tiene una FK a ella (plan-comun §7).

- [X] T001 Crear `backend/src/db/migraciones/006_voluntariado.sql` con `voluntarios` e `inscripciones` como en [data-model.md](data-model.md): FKs `ON DELETE RESTRICT`, `CHECK` de texto no vacío, de `estado`, de `acepta_requisitos` y de las fechas de confirmación y cancelación, índice único parcial de inscripción activa e índice `(actividad_id, estado, fecha_inscripcion)`
- [X] T002 Marcar `006_voluntariado.sql` como «hecha» en `backend/src/db/migraciones/LEEME.md`, aplicar con `npm run migrar` y abrir un PR a `main` solo con T001–T002 (PR #2, revisa Nicole)

---

## Phase 2: Foundational (bloquea US1 y US2)

- [ ] T003 [P] Crear `backend/vitest.config.js` con `test.fileParallelism: false` para que los ficheros de prueba no se pisen en la base de pruebas (research R7) y avisar al grupo
- [ ] T004 [P] Añadir `bloquearActividad(id, cliente)` a `backend/src/modulos/actividades/servicio.js` (bloquea con `repositorio.bloquearPorId` y devuelve `aRecurso(fila, contarConfirmadas)` o `null`), acordada con Nicole (research R2). Crear `backend/src/modulos/voluntariado/actividades.js`, único punto de acceso a `actividades`, que reexporta `listar`, `bloquearActividad` y `avisarPlazaConfirmada`
- [ ] T005 Crear `backend/src/modulos/voluntariado/repositorio.js` con SQL parametrizado (con `consulta` o el `cliente` recibido) sobre `voluntarios` e `inscripciones`: perfil por usuario (obtener y guardar con `ON CONFLICT (usuario_id)`), inscripción activa de un voluntario en una actividad, insertar, obtener por id con su voluntario, cambiar estado (rellenando `fecha_confirmacion` o `fecha_cancelacion` y `actualizado_en`), contar confirmadas, listar confirmadas y en espera de una actividad con `posicion` calculada, e inscripciones activas de un voluntario
- [ ] T006 Crear en `backend/src/modulos/voluntariado/servicio.js` las seis funciones del [contrato](contracts/api-voluntariado.md#funciones-para-el-módulo-actividades): `contarConfirmadas`, `listarInscripcionesDeActividad`, `promoverListaEspera` (lee las plazas con `bloquearActividad` en el `cliente` recibido y confirma en espera por `fecha_inscripcion`), `cancelarInscripcionesDeActividad`, `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario`. Sustituir el provisional de `backend/src/modulos/actividades/inscripciones.js` por la reexportación de esas seis funciones desde `../voluntariado/servicio.js`
- [ ] T007 [P] Crear `backend/src/db/semillas/voluntariado.js` (idempotente) con lo de [quickstart.md](quickstart.md#preparación): usuarios `voluntario3`…`voluntario11@ong.test`, perfiles de `voluntario@` y `voluntario3`…`11` (no de `voluntario2`) y las inscripciones de prueba de Limpieza de playa, Reparto de alimentos y Recogida de ropa; al repetirse, las demás inscripciones activas de esas tres actividades pasan a `cancelada`. Importarlo al final de `backend/src/db/semillas/index.js`
- [ ] T008 Crear `backend/src/modulos/voluntariado/rutas.js` exportando `rutasVoluntariado` (`:id` solo numérico) y registrarlo en `backend/src/app.js` descomentando `api.use(rutasVoluntariado)`

**Checkpoint**: las semillas cargan, las pruebas de spec-007 siguen pasando con las funciones reales.

---

## Phase 3: User Story 1 — Consultar las actividades disponibles (P1) 🎯 MVP

**Goal**: cualquiera ve las actividades publicadas y futuras, con plazas libres y requisitos.

**Independent Test**: [quickstart.md](quickstart.md#historia-1--consultar-las-actividades-disponibles), 1.1–1.3.

### Tests for User Story 1

- [ ] T009 [P] [US1] Pruebas en `backend/src/modulos/voluntariado/servicio.test.js` (Vitest + Supertest contra la base de pruebas, `AHORA_SIMULADO` fijo, correo simulado): `GET /api/actividades/disponibles` sin sesión → 200 solo con publicadas futuras (no borrador, cancelada ni celebrada), con `plazasLibres` y `requisitos`, por `inicio` ascendente; filtros `proyectoId`, `desde` y `hasta` (días de Madrid incluidos); `desde > hasta` o fecha mal escrita → 400; `miInscripcion` con la inscripción activa del voluntario y `null` sin sesión

### Implementation for User Story 1

- [ ] T010 [US1] `listarDisponibles` en `servicio.js` (research R8), su esquema zod y controlador en `controlador.js`, y la ruta pública `GET /actividades/disponibles` en `rutas.js`
- [ ] T011 [P] [US1] `frontend/src/components/voluntariado/TarjetaActividad.jsx` (datos de FR-002 con `formatearFecha` y `formatearHora`, «N plazas libres de M», «Sin requisitos» si está vacío) y `frontend/src/components/voluntariado/ActividadesDisponibles.jsx` (filtros de proyecto con `GET /api/proyectos`, desde y hasta; `EstadoVacio` si no hay ninguna)
- [ ] T012 [US1] `frontend/src/pages/actividades/index.astro` con `Layout` y descomentar el enlace «Actividades» en `frontend/src/components/comunes/Menu.jsx`

**Checkpoint**: 1.1–1.3 del quickstart pasan sin sesión.

---

## Phase 4: User Story 2 — Inscribirme y cancelar (P1)

**Goal**: el voluntario se inscribe, entra en la lista de espera si lo pide y cancela.

**Independent Test**: [quickstart.md](quickstart.md#historia-2--inscribirme-y-cancelar), 2.1–2.11 y bordes.

### Tests for User Story 2

- [ ] T013 [P] [US2] Pruebas de inscripción en `servicio.test.js`: 401 sin sesión y 403 con el mensaje de FR-004 como donante en las rutas de voluntario; perfil: `GET` 404 sin perfil, `PUT` válido 200 e inválido 400 con `campos`; inscribir sin perfil → 409 `PERFIL_INCOMPLETO`; sin `aceptaRequisitos` → 400; con plaza → 201 `confirmada` y `plazasLibres` baja; repetida → 409 `YA_INSCRITO`; completa sin `listaEspera` → 409 `PLAZAS_AGOTADAS`, con `listaEspera` → `en_espera` con `posicion`; borrador o cancelada → 404; celebrada → 409; dos actividades que se solapan → se permite; **dos peticiones simultáneas por la última plaza → una 201 y otra 409 `PLAZAS_AGOTADAS`** (FR-006)
- [ ] T014 [P] [US2] Pruebas de cancelación y de las funciones para `actividades` en `servicio.test.js`: cancelar la propia → `cancelada` y la plaza queda libre; la de otro → 404; ya cancelada o con la actividad empezada → 409; confirmada con lista de espera → la primera pasa a `confirmada`, `plazasLibres` no cambia y se envía un único correo «Plaza confirmada» a esa persona; en espera → las de detrás avanzan una posición; volver a inscribirse tras cancelar → se permite; `promoverListaEspera` confirma por orden de llegada tantas como plazas libres; `cancelarInscripcionesDeActividad`, `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario` devuelven lo del contrato

### Implementation for User Story 2

- [ ] T015 [US2] `obtenerPerfil` y `guardarPerfil` en `servicio.js` (rol comprobado en el servicio con el mensaje de FR-004, research R5), esquema zod del perfil en `controlador.js` y rutas `GET` y `PUT /yo/perfil-voluntario` detrás de `requiereRol()`
- [ ] T016 [US2] `inscribir` en `servicio.js` según «Reglas de `servicio.js`» del [plan](plan.md#reglas-de-servicio-js) (en `transaccion()` con `bloquearActividad`; `23505` del índice único → `YA_INSCRITO`), esquema zod en `controlador.js` y ruta `POST /actividades/:id/inscripciones`
- [ ] T017 [US2] `cancelar` en `servicio.js` (en `transaccion()` con `bloquearActividad`; si estaba confirmada, `promoverListaEspera` con el mismo `cliente`; tras el `COMMIT`, `avisarPlazaConfirmada` por cada promovida, sin correo propio), controlador y ruta `PATCH /yo/inscripciones/:id`
- [ ] T018 [P] [US2] `frontend/src/components/voluntariado/FormInscripcion.jsx` sobre `Modal`: requisitos de la actividad y casilla «Cumplo los requisitos de esta actividad»; si `GET /api/yo/perfil-voluntario` da 404, campos de nombre, apellidos, correo (relleno con el de la cuenta) y teléfono, guardados con `PUT` antes de inscribirse; errores junto a su campo; con 409 `PLAZAS_AGOTADAS`, aviso y botón «Apuntarme a la lista de espera»; con 403, el aviso de FR-004
- [ ] T019 [US2] `frontend/src/components/voluntariado/CancelarInscripcion.jsx` (confirmación con `Modal`, reutilizable por HU-06) e integrar en `TarjetaActividad.jsx` el botón según el caso: sin sesión, «Inscribirme» lleva a `/entrar?volver=/actividades`; sin plazas, «Apuntarme a la lista de espera»; inscrito, «Estás inscrito» y «Cancelar inscripción»; en espera, «En lista de espera · posición N» y «Salir de la lista de espera»

**Checkpoint**: 2.1–2.11 y los bordes del quickstart pasan.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T020 [P] Pasar Prettier (`.prettierrc.json`) a los ficheros nuevos o tocados de `backend/src/modulos/voluntariado/`, `backend/src/db/semillas/` y `frontend/src/components/voluntariado/`
- [ ] T021 Avisar a Nicole de que ya están las funciones reales para su integración (T023 y T026 de spec-007 y sus pruebas en `it.skip`)
- [ ] T022 Recorrer [quickstart.md](quickstart.md) completo a mano y cronometrar SC-001 (< 2 min); dejar el resultado en `refinamiento/prueba-manual.md` y actualizar plan o contrato si algo implementado difiere (principio III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → hechas; el PR #2 tiene que estar en `main` antes del PR de toda la spec.
- **Foundational (T003–T008)** → bloquea US1 y US2. T004 → T006 (`promoverListaEspera` usa `bloquearActividad`).
- **US1 (T009–T012)** → MVP; no depende de US2.
- **US2 (T013–T019)** → depende de la fase 2; T018 y T019 usan `TarjetaActividad.jsx` (T011).
- **Polish (T020–T022)** → al final.

### Within Each Story

Pruebas (que fallan) → servicio → controlador → rutas → componentes → páginas.

### Parallel Opportunities

- T003, T004 y T007 en paralelo; T005 → T006 → T008 en orden.
- T009 en paralelo con T010; T011 en paralelo con el back-end en cuanto el contrato es estable.
- T013 y T014 en paralelo entre sí; T018 en paralelo con T016–T017.

## Implementation Strategy

1. Fase 2 y comprobar que las pruebas de spec-007 siguen pasando con las funciones reales.
2. US1 y validar 1.1–1.3.
3. US2 y validar 2.1–2.11 y bordes.
4. Polish, y PR de `spec-005` a `main` revisado por Nicole cuando el PR #2 esté fusionado.

## Notes

- No hay rutas `DELETE`; cancelar = cambiar el estado (principio VI).
- Nunca se consulta `actividades` desde `voluntariado/repositorio.js`; siempre a través de
  `voluntariado/actividades.js`.
