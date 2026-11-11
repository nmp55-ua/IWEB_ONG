# Tasks: HU-07 — Gestión de actividades, plazas y lista de espera

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-actividades.md](contracts/api-actividades.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md).

**Responsable**: *Nicole* · **Revisor**: *Javi*

**Tests**: plan-comun §8 exige pruebas automáticas (Vitest + Supertest) de permisos, aforo y
paso FIFO desde la lista de espera; por eso hay tareas de prueba en cada historia.

**Commits**: en español y empezando por `HU-07:` (CONVENCIONES §9).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**: US1 = crear/publicar/editar/cancelar; US2 = lista de espera automática.

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/actividades/` y `frontend/src/components/actividades/`.

---

## Phase 1: Setup

**Purpose**: la tabla `actividades` en `main` lo antes posible (plan-comun §7), porque
`006_voluntariado.sql` (Javi) tiene una FK a ella.

- [X] T001 Crear `backend/src/db/migraciones/005_actividades.sql` con la tabla `actividades` exactamente como en [data-model.md](data-model.md) (tipos, FK a `proyectos` y `usuarios`, `CHECK` de texto no vacío, `fin > inicio`, `plazas > 0`, `estado IN ('borrador','publicada','cancelada')` con `DEFAULT 'borrador'`, `requisitos DEFAULT ''`, `creado_en`/`actualizado_en`) e índice `(estado, inicio)`; comentario de cabecera `-- spec-007 (Nicole). Ver specs/modelo-datos.md#actividades-spec-007`
- [X] T002 Marcar `005_actividades.sql` como «hecha» en `backend/src/db/migraciones/LEEME.md`, aplicar con `npm run migrar` en `backend/` y abrir un PR pequeño a `main` solo con T001–T002 (revisa Javi) — *Hecho con el PR #1, de spec-007 completa, revisado por Javi.*

---

## Phase 2: Foundational (bloquea US1 y US2)

- [X] T003 [P] Crear `backend/src/db/semillas/actividades.js` (idempotente, buscando por título) con las actividades de plan-comun §8: «Limpieza de playa» publicada de 10 plazas, «Reparto de alimentos» publicada de 2 plazas, «Taller de reciclaje» en borrador, «Mercadillo solidario» cancelada y «Recogida de ropa» publicada ya celebrada de 10:00 a 13:30 (fechas relativas a hoy en `Europe/Madrid`; `creada_por` = `coordinador@ong.test`); importarlo al final de `backend/src/db/semillas/index.js` antes de `pool.end()`. Las inscripciones de prueba (9 inscritos, 1 en espera, 2 en la celebrada) las añade spec-005 cuando exista `inscripciones`
- [X] T004 [P] Contrato acordado con Javi en [contracts/api-actividades.md](contracts/api-actividades.md#contrato-con-el-servicio-de-voluntariado-spec-005), **incluido el valor de retorno** de `promoverListaEspera` (inscripciones promovidas `[{ inscripcionId, nombre, correo }]`) y de `cancelarInscripcionesDeActividad` (inscripciones canceladas `[{ inscripcionId, nombre, correo, estadoAnterior }]`), y que spec-005 usará `avisarPlazaConfirmada` (T022). Crear `backend/src/modulos/actividades/inscripciones.js`, único punto desde el que `actividades` accede a inscripciones, que exporta `contarConfirmadas(actividadId, cliente)`, `listarInscripcionesDeActividad(actividadId)`, `promoverListaEspera(actividadId, cliente)` y `cancelarInscripcionesDeActividad(actividadId, cliente)`: mientras spec-005 no exista, versión provisional que devuelve `0`, `{ confirmadas: [], enEspera: [] }` y `[]`, con cabecera `// Provisional de spec-007: cuando exista spec-005, solo reexporta desde ../voluntariado/servicio.js.`; cuando exista, se sustituye por `export { … } from '../voluntariado/servicio.js'`. **No** se crea nada dentro de `modulos/voluntariado/`
- [X] T005 Crear `backend/src/modulos/actividades/repositorio.js` con SQL parametrizado (usando `consulta` o el `cliente` recibido): `insertar(datos, cliente)`, `obtenerPorId(id, cliente)` con `JOIN proyectos` para `proyecto.nombre`, `bloquearPorId(id, cliente)` (`SELECT … FOR UPDATE`), `actualizar(id, cambios, cliente)` (actualiza también `actualizado_en = now()`), `listar({ estado, proyectoId })` ordenado por `inicio DESC`, y `obtenerProyecto(id, cliente)` (`id, activo`). Devuelve filas en `snake_case`
- [X] T006 Crear en `backend/src/modulos/actividades/servicio.js` la función `aRecurso(fila, confirmadas)` que convierte una fila al recurso `Actividad` del contrato (`camelCase`, fechas con `aIsoMadrid`, `plazasLibres = plazas − confirmadas`, `celebrada = estado === 'publicada' && inicio <= ahora()`) y una ayuda `validarFechasYProyecto({ inicio, fin, proyectoId }, cliente)` que lanza `ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', campos)` con los mensajes de [data-model.md](data-model.md#validación-de-entrada-zod-en-controladorjs) (`fin` ≤ `inicio`, `inicio` ≤ `ahora()`, proyecto inexistente o inactivo)
- [X] T007 Crear `backend/src/modulos/actividades/rutas.js` exportando `rutasActividades` (Router) con todas las rutas detrás de `requiereRol('coordinador')` y `:id` limitado a dígitos (`/actividades/:id(\\d+)`, research R6), y registrarlo en `backend/src/app.js` descomentando `api.use(rutasActividades)`

**Checkpoint**: migración aplicada, semillas cargan, el módulo arranca sin rutas rotas.

---

## Phase 3: User Story 1 — Crear, publicar, editar y cancelar actividades (P1) 🎯 MVP

**Goal**: el coordinador gestiona el ciclo de vida completo de una actividad.

**Independent Test**: como `coordinador@ong.test`, crear una actividad (queda en borrador y no
aparece en `GET /api/actividades?estado=publicada`), publicarla (aparece) y cancelarla. El
listado público `/actividades` (spec-005) se comprueba al integrar spec-005 ([quickstart.md](quickstart.md#historia-1--crear-publicar-editar-y-cancelar), 1.1–1.7).

### Tests for User Story 1

- [X] T008 [P] [US1] Pruebas en `backend/src/modulos/actividades/servicio.test.js` (Vitest + Supertest contra la base de pruebas, `AHORA_SIMULADO` fijo): 401 sin sesión y 403 como voluntario en las 5 rutas; crear válida → 201 en `borrador`; cada validación de FR-002/FR-003 → 400 con su `campos`; publicar borrador con inicio pasado o proyecto inactivo → 400; publicar no-borrador → 409 `TRANSICION_NO_PERMITIDA`; editar o cancelar cancelada o celebrada → 409; bajar plazas por debajo de confirmados → 409 `PLAZAS_MENOR_QUE_INSCRITOS`; cancelar borrador no envía correo; `GET /api/actividades/abc` → 404 (no captura `disponibles`)

### Implementation for User Story 1

- [X] T009 [US1] En `backend/src/modulos/actividades/servicio.js`, `crear(datos, usuario)`: dentro de `transaccion()`, `validarFechasYProyecto`, `insertar` con `estado = 'borrador'` y `creada_por = usuario.id`; devuelve `aRecurso(fila, 0)`
- [X] T010 [US1] En `servicio.js`, `obtener(id)` y `listar(filtros)`: cualquier coordinador ve cualquier actividad (PA7.1); `plazasLibres` con `contarConfirmadas`; 404 `NO_ENCONTRADO` si no existe
- [X] T011 [US1] En `servicio.js`, `editar(id, cambios)`: en `transaccion()` con `bloquearPorId`; 409 `ACTIVIDAD_NO_EDITABLE` («No se puede editar una actividad cancelada o ya celebrada.») si está cancelada o celebrada; combinar con la fila actual y `validarFechasYProyecto` sobre el resultado; si `plazas` < `contarConfirmadas` → `ErrorApi(409, 'PLAZAS_MENOR_QUE_INSCRITOS', 'Hay N inscritos confirmados; no puedes dejar menos plazas.', { plazas: … })`; `actualizar`. Tras el `COMMIT`, si estaba publicada y cambiaron `inicio`, `fin` o `lugar`, enviar con `enviarCorreo` el aviso de cambio (FR-011) a `listarInscripcionesDeActividad` (confirmadas + en espera), con fechas en dd/mm/aaaa y hora de Madrid; un fallo de correo se registra con `console.error` y no se deshace nada
- [X] T012 [US1] En `servicio.js`, `publicar(id)`: bloquear; solo desde `borrador` (si no, 409 `TRANSICION_NO_PERMITIDA` «Solo se puede publicar una actividad en borrador.»); `validarFechasYProyecto` de nuevo; pasar a `publicada`
- [X] T013 [US1] En `servicio.js`, `cancelar(id)`: bloquear; 409 `TRANSICION_NO_PERMITIDA` si ya está cancelada o celebrada; si era `publicada`, `cancelarInscripcionesDeActividad(id, cliente)` en la misma transacción; pasar a `cancelada`. Tras el `COMMIT`, si era publicada, correo «actividad cancelada» a cada afectado devuelto (FR-008); si era borrador, sin avisos
- [X] T014 [US1] En `servicio.js`, `listarInscripciones(id)`: 404 si no existe; devuelve `listarInscripcionesDeActividad(id)` con el formato del contrato (FR-009)
- [X] T015 [US1] Crear `backend/src/modulos/actividades/controlador.js` con esquemas zod de [data-model.md](data-model.md#validación-de-entrada-zod-en-controladorjs): `esquemaActividad` (creación, `requisitos` opcional por defecto `''`, `inicio`/`fin` con `z.string().datetime({ offset: true })`), su versión `.partial()` para editar y `esquemaAccion` (`{ accion: z.enum(['publicar','cancelar']) }` estricto). En `PATCH`, si el cuerpo trae `accion` se valida con `esquemaAccion` (rechazando otros campos) y si no, con el parcial. Handlers `listar`, `crear` (201), `obtener`, `modificar`, `inscripciones`
- [X] T016 [US1] Completar `backend/src/modulos/actividades/rutas.js`: `GET /actividades`, `POST /actividades`, `GET /actividades/:id(\\d+)`, `PATCH /actividades/:id(\\d+)`, `GET /actividades/:id(\\d+)/inscripciones`, todas con `asincrono(...)`
- [X] T017 [P] [US1] Crear `frontend/src/components/actividades/FormActividad.jsx` (alta y edición): campos con `Campo` (título, descripción, proyecto desde `GET /api/proyectos`, inicio y fin `datetime-local` convertidos con `localAIsoMadrid(valor)` y, al editar, rellenados con `isoALocalMadrid(iso)`, ambas en un nuevo `frontend/src/components/actividades/fechasFormulario.js` (hora de `Europe/Madrid` con `Intl.DateTimeFormat`, desfase correcto en horario de verano e invierno), lugar, plazas, requisitos), botón «Guardar», errores de `error.campos` junto a cada campo y `error.mensaje` en `Aviso`; usa `lib/api.js`
- [X] T018 [P] [US1] Crear `frontend/src/components/actividades/ListaActividades.jsx`: `Tabla` con título, proyecto, fecha (`formatearFecha`), estado («Borrador», «Publicada», «Celebrada», «Cancelada»), plazas libres/plazas y enlace al detalle; filtro por estado; `EstadoVacio` si no hay; botón «Nueva actividad»
- [X] T019 [US1] Crear `frontend/src/components/actividades/DetalleActividad.jsx`: datos de la actividad, `FormActividad` en modo edición si es editable, botones «Publicar» (solo borrador) y «Cancelar actividad» (con `Modal` de confirmación; no en celebrada ni cancelada), nunca «Volver a borrador»; tablas «Inscritos confirmados» y «Lista de espera» (con posición) desde `/api/actividades/:id/inscripciones`, con `EstadoVacio`
- [X] T020 [US1] Crear las páginas con `Layout.astro`: `frontend/src/pages/coordinacion/actividades/index.astro` (`ListaActividades`), `nueva.astro` (`FormActividad`, redirige al detalle al guardar) y `[id].astro` (`DetalleActividad`), todas con `client:load`; y descomentar en `frontend/src/components/comunes/Menu.jsx` el enlace `{ rol: 'coordinador', href: '/coordinacion/actividades', texto: 'Gestionar actividades' }`

**Checkpoint**: escenarios 1.1–1.7 y bordes de [quickstart.md](quickstart.md) pasan (1.4, 1.5 y
1.6 con inscripciones reales en cuanto exista spec-005).

---

## Phase 4: User Story 2 — Lista de espera automática (P1)

**Goal**: las plazas liberadas pasan solas y por orden a la lista de espera.

**Independent Test**: [quickstart.md](quickstart.md#historia-2--lista-de-espera-automática) 2.1–2.4.

### Tests for User Story 2

- [X] T021 [P] [US2] Añadir a `backend/src/modulos/actividades/servicio.test.js`: subir plazas de 10 a 12 con 2 en espera → ambas confirmadas, en orden de `fechaInscripcion`, y `avisarPlazaConfirmada` llamada para cada una (simulando `enviarCorreo`); subir plazas en un borrador no promueve; cancelar un voluntario confirmado con lista de espera (flujo de spec-005) → la primera en espera pasa a confirmada, recibe el correo y las plazas libres no cambian (SC-002); con 3 en espera, cancela la primera → las otras pasan a posiciones 1 y 2 (US2 escenario 4); peticiones simultáneas de «bajar plazas» e inscripción nunca dejan más confirmados que plazas (SC-003). Requiere la tabla `inscripciones` de spec-005; hasta entonces, `it.skip` con el motivo, y se activan al integrar

### Implementation for User Story 2

- [X] T022 [US2] En `backend/src/modulos/actividades/servicio.js`, crear y exportar `avisarPlazaConfirmada(inscripcion, actividad)`: **única** función que envía el correo «plaza confirmada» (asunto y texto en español, con título, fecha dd/mm/aaaa, hora y lugar en `Europe/Madrid`) con `enviarCorreo`; si falla, `console.error` sin lanzar. En `editar`: si la actividad está `publicada` y `plazas` sube, llamar a `promoverListaEspera(id, cliente)` (de `./inscripciones.js`) dentro de la misma transacción, después de `actualizar`, y tras el `COMMIT` llamar a `avisarPlazaConfirmada` para cada inscripción devuelta. Sin plazo de aceptación (PA7.2). Como `actividades/inscripciones.js` reexporta el servicio de voluntariado y este importa `avisarPlazaConfirmada` de `actividades/servicio.js` (importación circular), esas importaciones se usan solo dentro de funciones, nunca a nivel de módulo
- [X] T023 [US2] *(Acordado con Javi.)* Comprobar que la cancelación de spec-005 (`PATCH /api/yo/inscripciones/:id`) bloquea la fila de la actividad, llama a `promoverListaEspera(actividadId, cliente)` en su transacción y, tras el `COMMIT`, llama a `avisarPlazaConfirmada` (T022) para cada inscripción promovida, sin enviar un correo propio (FR-006, US2 escenarios 2 y 4). Dejar el acuerdo anotado en la sección Dependencies de `specs/spec-007/spec.md` (ya está) y avisar a Javi para que lo refleje en spec-005 — *Comprobado el 06/11/2026 tras fusionar spec-005 (punto 7 de refinamiento/prueba-manual-T026.md).*

**Checkpoint**: 2.1–2.4 pasan con spec-005 integrada.

---

## Phase 5: Polish & Cross-Cutting

- [X] T024 [P] Añadir el correo «cambio de fecha, hora o lugar» (FR-011) a la lista de correos de `specs/plan-comun.md` §6 con aviso al grupo (principio XII, research R5)
- [X] T025 [P] Pasar Prettier (`.prettierrc.json`) a los ficheros nuevos de `backend/src/modulos/actividades/` y `frontend/src/components/actividades/`
- [X] T026 Recorrer [quickstart.md](quickstart.md) completo a mano, cronometrar SC-001 (< 3 min), y al integrar spec-005 comprobar en `/actividades` que una actividad publicada aparece y una cancelada deja de estar disponible (US1 escenarios 3 y 5, FR-008); actualizar plan/contrato si algo implementado difiere (principio III) — *Hecho el 04/11/2026 por Nicole: SC-001 en 1 min 30 s (ver [refinamiento/prueba-manual-T026.md](refinamiento/prueba-manual-T026.md)). Plazas con inscritos y listado público comprobados por API el 06/11/2026.*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → antes que todo; T002 desbloquea a Javi (migración 006).
- **Foundational (T003–T007)** → bloquea US1 y US2.
- **US1 (T008–T020)** → MVP; no depende de US2.
- **US2 (T021–T023)** → depende de US1 (`editar`) y de que spec-005 tenga `inscripciones` y su servicio real.
- **Polish (T024–T026)** → al final.

### User Story Dependencies

- US1: solo la base común y la fase 2. Funciona con el provisional de `actividades/inscripciones.js` (T004), aunque 1.4–1.6 necesitan inscripciones reales.
- US2: US1 + spec-005.

### Within Each Story

Pruebas (que fallan) → servicio → controlador → rutas → componentes → páginas.

### Parallel Opportunities

- T003 y T004 en paralelo; T005 → T006 → T007 en orden.
- T008 en paralelo con T009–T014 (otro fichero).
- T017 y T018 en paralelo entre sí y con el back-end en cuanto el contrato es estable.
- T021 en paralelo con T022; T024 y T025 en paralelo.

## Parallel Example: User Story 1

```text
T008  Pruebas de servicio.test.js
T017  FormActividad.jsx
T018  ListaActividades.jsx
(mientras tanto, en orden: T009 → T010 → … → T016)
```

## Implementation Strategy

### MVP First (US1)

1. T001–T002 y PR de la migración a `main`.
2. Fase 2.
3. US1 completa y validar 1.1–1.3, 1.7 y bordes con las semillas.

### Incremental Delivery

4. Cuando spec-005 llegue a `main`: `merge` en `spec-007`, sustituir el provisional de `actividades/inscripciones.js` por la reexportación (T004), validar 1.4–1.6.
5. US2 y escenarios 2.1–2.4.
6. Polish y PR de `spec-007` a `main` revisado por Javi.

## Notes

- No hay rutas `DELETE`; descartar un borrador = cancelarlo (principio VI).
- Nunca se consulta `inscripciones` desde `actividades/repositorio.js`; siempre a través de `actividades/inscripciones.js`, que reexporta el servicio de voluntariado.
- El correo «plaza confirmada» sale solo de `avisarPlazaConfirmada` (T022), también cuando cancela un voluntario en spec-005.
- «Ahora» siempre de `servicios-comunes/fechas.js` (`ahora()`), nunca `new Date()` directo.

---

## Phase 6: Convergence

- [X] T027 En `frontend/src/components/actividades/DetalleActividad.jsx`, cuando «Publicar» falla con 400 y `error.campos`, mostrar en el `Aviso` el motivo concreto de cada campo (p. ej. «El inicio debe ser posterior al momento actual.» o «El proyecto no está activo.») en lugar de solo «Revisa los datos marcados.», que no marca nada porque la publicación no pasa por el formulario per FR-003 / US1/AC2 (partial)
- [X] T028 Actualizar `specs/spec-007/quickstart.md` (apartado «Preparación») para indicar que las pruebas de `servicio.test.js` solo se ejecutan con `TEST_DATABASE_URL` apuntando a una base de pruebas migrada (p. ej. `ong_test`, creada con `createdb` y `npm run migrar` con esa URL); sin ella `npm test` las salta per plan: Testing / plan-comun §8 (partial)
- [X] T029 Añadir `frontend/src/components/actividades/estados.js` (`textoEstado`, `esEditable`) al árbol de ficheros de `specs/spec-007/plan.md`, o integrarlo en los componentes si se prefiere no tener el fichero per plan: Project Structure (unrequested)
