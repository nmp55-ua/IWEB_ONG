# Tasks: HU-08 — Registro de asistencia y acumulación de horas

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-asistencias.md](contracts/api-asistencias.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md).

**Responsable**: *Nicole* · **Revisor**: *Rubén*

**Tests**: plan-comun §8 exige pruebas automáticas (Vitest + Supertest) de permisos y de horas
(10:00–13:30 = 3,5; repetir el guardado no duplica; corregir resta); por eso hay tareas de prueba
en cada historia. Se ejecutan con `TEST_DATABASE_URL` apuntando a una base de pruebas migrada
(p. ej. `ong_test`), como `actividades/servicio.test.js`; sin ella, `npm test` las salta.

**Commits**: en español y empezando por `HU-08:` (CONVENCIONES §9).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**: US1 = registrar la asistencia; US2 = ver mis horas.

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/actividades/` y `frontend/src/components/actividades/`. No se toca
`backend/src/modulos/voluntariado/` ni `backend/src/modulos/actividades/inscripciones.js`, que ya
reexporta `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario`.

---

## Phase 1: Setup

**Purpose**: la tabla `asistencias`, que también lee spec-004 (Rubén).

- [X] T001 Crear `backend/src/db/migraciones/007_asistencias.sql` con la tabla `asistencias` como en [data-model.md](data-model.md): `inscripcion_id BIGINT NOT NULL UNIQUE REFERENCES inscripciones(id) ON DELETE RESTRICT` (siempre, sin comprobar si la tabla existe, research R2), `asistio BOOLEAN NOT NULL`, `horas NUMERIC(5,2) NOT NULL CHECK (horas > 0)`, `registrada_por BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT`, `fecha_registro TIMESTAMPTZ NOT NULL`; comentario de cabecera `-- spec-008 (Nicole). Ver specs/modelo-datos.md#asistencias-spec-008`
- [X] T002 Marcar `007_asistencias.sql` como «hecha» en `backend/src/db/migraciones/LEEME.md` y aplicarla con `npm run migrar` en `backend/`

---

## Phase 2: Foundational (bloquea US1 y US2)

- [X] T003 Añadir a `backend/src/modulos/actividades/repositorio.js`, con SQL parametrizado sobre `asistencias` y `actividades` (nunca sobre `inscripciones` ni `voluntarios`): `listarAsistencias(inscripcionIds)` y `horasDeActividad(id, cliente)`, que devuelve como número `ROUND(EXTRACT(EPOCH FROM fin - inicio) / 3600, 2)` (22:00–01:00 = 3, research R5), y `guardarAsistencias(filas, cliente)`, un upsert `INSERT … ON CONFLICT (inscripcion_id) DO UPDATE` de `asistio`, `horas`, `registrada_por` y `fecha_registro` (research R1). Reutilizar `obtenerPorId` y `bloquearPorId` de spec-007
- [X] T004 Crear `backend/src/modulos/actividades/asistencias.js` con la ayuda `esRegistrable(actividad)`; las horas no se calculan aquí, sino en SQL con `horasDeActividad` del repositorio (T003, research R5). `esRegistrable`: `estado === 'publicada' && inicio <= ahora()`, con `ahora()` de `servicios-comunes/fechas.js` y sin límite posterior (Clarifications 2026-11-04)

**Checkpoint**: migración aplicada y módulo arrancando sin rutas nuevas.

---

## Phase 3: User Story 1 - Registrar la asistencia (Priority: P1) 🎯 MVP (con US2)

**Goal**: el coordinador marca a cada inscrito confirmado como «asistió» o «no asistió» desde la hora de inicio de la actividad, y puede corregirlo sin duplicar horas.

**Independent Test**: en «Recogida de ropa» (10:00–13:30, ya celebrada, 2 confirmados), marcar a `voluntario2@ong.test` como asistente: en `/mis-horas` su total sube 3,5 h y el de `voluntario@ong.test` no cambia. Se comprueba cuando existen T015–T019.

### Tests for User Story 1

- [X] T005 [US1] Crear `backend/src/modulos/actividades/asistencias.test.js` con el mismo montaje que `servicio.test.js` (`TEST_DATABASE_URL`, `AHORA_SIMULADO`, `vi.mock('./inscripciones.js')` e inscripciones reales insertadas para la FK): 10:00–13:30 = 3,5 h; 22:00–01:00 = 3 h; repetir el `PUT` no duplica; pasar a «no asistió» resta sin borrar la fila; 409 `ASISTENCIA_NO_PERMITIDA` en borrador, cancelada y futura; se admite en curso y sin plazo posterior; 400 `DATOS_INVALIDOS` con inscripción no confirmada o de otra actividad, sin guardar ninguna fila; el `GET` solo lista confirmadas con `asistio` `null` si no hay registro; 401, 403 y 404 en ambas rutas

### Implementation for User Story 1

- [X] T006 [US1] Añadir `obtenerAsistencia(actividadId)` a `backend/src/modulos/actividades/asistencias.js`: 404 `NO_ENCONTRADO` si no existe; devuelve la actividad con `horas` (de `horasDeActividad`) y `registrable`, y una fila por cada resultado de `listarConfirmadasDeActividad` (de `./inscripciones.js`) con `asistio` `true`, `false` o `null`, y las horas como número, en la forma del [contrato](contracts/api-asistencias.md)
- [X] T007 [US1] Añadir `guardarAsistencia(actividadId, filas, usuario)` a `backend/src/modulos/actividades/asistencias.js`: en `transaccion()` con `bloquearPorId`; 404 si no existe; 409 `ASISTENCIA_NO_PERMITIDA` con un mensaje distinto para borrador, cancelada y aún no comenzada; 400 `DATOS_INVALIDOS` con `campos["asistencias.N"]` si un `inscripcionId` no es confirmado de esa actividad (FR-006); upsert con las `horas` de `horasDeActividad`, `registrada_por = usuario.id` y `fecha_registro = ahora()`; devuelve lo mismo que `obtenerAsistencia`
- [X] T008 [US1] Añadir a `backend/src/modulos/actividades/controlador.js` el esquema zod del `PUT` (`asistencias` con 1–500 elementos, `inscripcionId` entero positivo sin repetir, `asistio` booleano; error 400 `DATOS_INVALIDOS`) y los manejadores `obtenerAsistencias` y `guardarAsistencias`
- [X] T009 [US1] Añadir `GET` y `PUT /actividades/:id(\\d+)/asistencias` con `requiereRol('coordinador')` a `backend/src/modulos/actividades/rutas.js`
- [X] T010 [P] [US1] Crear `frontend/src/components/actividades/ListaAsistencia.jsx` con `lib/api.js` y los componentes comunes: tabla de confirmados con un control por fila y los tres estados visibles («sin registrar», «asistió» y «no asistió»); una fila ya guardada no puede volver a «sin registrar»: solo cambia entre «asistió» y «no asistió»; «Marcar todos como asistentes» y un único «Guardar» que envía solo las filas marcadas («asistió» o «no asistió») y está desactivado si no hay ninguna; si `registrable` es `false`, controles desactivados y `Aviso` con el motivo; `EstadoVacio` sin confirmados; horas con `formatearHoras`; avisos de guardado y de error, y `Aviso` de permiso si la API responde 403
- [X] T011 [US1] Crear `frontend/src/pages/coordinacion/actividades/[id]/asistencia.astro`, que valida que `id` sea numérico como `[id].astro` (si no, redirige a `/coordinacion/actividades`) y monta `ListaAsistencia` con `client:load`
- [X] T012 [P] [US1] Añadir en `frontend/src/components/actividades/DetalleActividad.jsx` el enlace «Registrar asistencia» a `/coordinacion/actividades/:id/asistencia` cuando `actividad.celebrada` sea `true`

**Checkpoint**: escenarios 1.1, 1.5, 1.6 y bordes de US1 validados en la aplicación; 1.2–1.4 se validan cuando existen T015–T019 (`/mis-horas`).

---

## Phase 4: User Story 2 - Ver mis horas (Priority: P2) 🎯 MVP (con US1)

**Goal**: el voluntario ve en `/mis-horas` su total y el desglose por actividad, solo los suyos.

**Independent Test**: `voluntario@ong.test`, con asistencias de 3,5 h y 2 h, abre `/mis-horas` y ve 5,5 h y las dos actividades.

### Tests for User Story 2

- [X] T013 [US2] Añadir a `backend/src/modulos/actividades/asistencias.test.js` los casos de `GET /api/yo/horas`: 401 sin sesión; total 5,5 con desglose de 3,5 y 2; una asistencia con `asistio = false` no cuenta; usuario sin voluntario o sin asistencias → `totalHoras: 0`, `datos: []`, `total: 0`; un parámetro con otro usuario se ignora y solo devuelve las propias; el total coincide con la suma del desglose (SC-001)

### Implementation for User Story 2

- [X] T014 [US2] Añadir `sumarHorasDeInscripciones(pares)` a `backend/src/modulos/actividades/repositorio.js`, que recibe los pares `{ inscripcionId, actividadId }` de `listarInscripcionesDeUsuario` y, sin consultar `inscripciones`, enlaza en SQL `asistencias` con `actividades` mediante el `actividadId` de cada par: `COALESCE(SUM(horas), 0)` y desglose con título, inicio y horas de las asistencias con `asistio = true`, ordenado por inicio descendente, con el total y las horas convertidos a número
- [X] T015 [US2] Añadir `horasDeUsuario(usuarioId)` a `backend/src/modulos/actividades/asistencias.js` con `listarInscripcionesDeUsuario` de `./inscripciones.js`, pasando sus pares a `sumarHorasDeInscripciones` y devolviendo la forma del [contrato](contracts/api-asistencias.md#get-apiyohoras): `{ totalHoras, datos: [{ actividadId, titulo, inicio, horas }], total }`
- [X] T016 [US2] Añadir el manejador `misHoras` a `backend/src/modulos/actividades/controlador.js`, que usa solo `req.usuario.id`
- [X] T017 [US2] Crear `backend/src/modulos/actividades/rutasYo.js` exportando `rutasYoActividades` con `GET /yo/horas` detrás de `requiereRol()`, y registrarlo en `backend/src/app.js` junto a `rutasActividades`
- [X] T018 [P] [US2] Crear `frontend/src/components/actividades/MisHoras.jsx`: total y `Tabla` con actividad, fecha (`formatearFecha`, dd/mm/aaaa) y horas (`formatearHoras`); sin asistencias, «0 h» y `EstadoVacio` con «Aún no tienes horas registradas»
- [X] T019 [US2] Crear `frontend/src/pages/mis-horas.astro`, que monta `MisHoras` con `client:load`, y añadir `{ rol: 'voluntario', href: '/mis-horas', texto: 'Mis horas' }` en `frontend/src/components/comunes/Menu.jsx`
- [X] T020 [US2] Añadir la actividad celebrada de 2 h de plan-comun §8 en `backend/src/db/semillas/actividades.js`: «Banco de alimentos», proyecto «Comedor social», `inicio: enMadrid(-10, 17)`, `fin: enMadrid(-10, 19)` (17:00–19:00), lugar «Calle Mayor 3», 10 plazas, `publicada`, sin requisitos, y crear `backend/src/db/semillas/asistencias.js` (idempotente) con la inscripción confirmada de `voluntario@ong.test` en ella y su asistencia de 2 h; llamar a `sembrarAsistencias` en `backend/src/db/semillas/index.js` después de `sembrarVoluntariado`. No registrar asistencia en «Recogida de ropa», que queda libre para los escenarios 1.2–1.4; la asistencia de `voluntario@ong.test` allí se marca a mano como paso previo de 2.1, y así llega a 5,5 h

**Checkpoint**: escenarios 2.1–2.3 validados; las dos historias funcionan juntas.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T021 Aplicar `007_asistencias.sql` también a la base de pruebas (`ong_test`, con `npm run migrar` y esa URL), ejecutar `npm test` en `backend/` con `TEST_DATABASE_URL` apuntando a ella y corregir los fallos en `backend/src/modulos/actividades/`
- [ ] T022 Recorrer [quickstart.md](quickstart.md) a mano en la aplicación, incluidos SC-001, SC-002 cronometrado con 20 confirmados (actividad celebrada preparada con la inserción temporal del quickstart, solo en la base de desarrollo y sin añadirla a las semillas) y la comprobación de que un voluntario no puede cancelar una inscripción de una actividad ya iniciada (FR-009, spec-005), y anotar el resultado en `specs/spec-008/quickstart.md`

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T004)** → US1 y US2, que no dependen entre sí en el back-end; los escenarios 1.2–1.4 de US1 sí necesitan T015–T019 para validarse.
- **US2** usa la tabla de la fase 1; sus datos pueden venir de la semilla (T020), sin la pantalla de US1.
- **Polish** tras las dos historias.
- Dentro de cada historia: pruebas → repositorio → servicio → controlador → rutas → front-end.
- T005 y T013 tocan el mismo fichero, igual que T006, T007 y T015 (`asistencias.js`), T003 y T014 (`repositorio.js`) y T008 y T016 (`controlador.js`): no van en paralelo entre sí.

### Parallel Opportunities

```text
# US1, con T006–T009 terminadas: T010 y T012 (T011 después de T010)
# US2, con T015–T017 terminadas: T018; T019 después de T018
```

## Implementation Strategy

### MVP First (US1 + US2)

1. Fases 1 y 2.
2. US1 y validar 1.1, 1.5, 1.6 y bordes.
3. US2 con su semilla, validar 1.2–1.4 en `/mis-horas` con «Recogida de ropa» y después 2.1–2.3.

### Incremental Delivery

4. Polish y PR de `spec-008` a `main` revisado por Rubén.

## Notes

- No hay rutas `DELETE`; corregir solo cambia `asistio` (principio VI).
- El total nunca se guarda: siempre `SUM(horas)` con `asistio = true`.
- «Ahora» siempre de `servicios-comunes/fechas.js`, nunca `new Date()` directo.

---

## Phase 6: Convergence

- [ ] T023 Añadir a `asistencias` las columnas `creado_en` y `actualizado_en` (`TIMESTAMPTZ NOT NULL DEFAULT now()`) editando `backend/src/db/migraciones/007_asistencias.sql` (aún no está en `main`, así que se puede editar según `LEEME.md`), hacer que el upsert de `guardarAsistencias` en `backend/src/modulos/actividades/repositorio.js` ponga `actualizado_en = now()` al corregir, recrear las bases locales de desarrollo y de pruebas (`ong`, `ong_test`) para volver a aplicar `007`, y añadir las dos columnas a la tabla de `specs/spec-008/data-model.md` per modelo-datos.md «Reglas generales» / CONVENCIONES.md (contradicts)
- [ ] T024 Dar mensajes en español a las validaciones de `inscripcionId` (`.int()`, `.positive()`) y a las claves no reconocidas (`.strict()`) de `esquemaAsistencias` en `backend/src/modulos/actividades/controlador.js`, que hoy devuelven en `campos` los mensajes por defecto de zod en inglés per Constitution IV (partial)
