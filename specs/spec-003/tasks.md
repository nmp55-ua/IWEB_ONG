# Tasks: HU-03 — Certificado fiscal anual de donaciones

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-certificados.md](contracts/api-certificados.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md). Datos de HU-01:
[resumen técnico](../spec-001/refinamiento/resumen-tecnico-hu03-01.md).

**Responsable**: *Rubén* · **Revisora**: *Nada*

**Tests**: plan-comun §8 exige pruebas de permisos (401, 403, 404) y de sumas al céntimo; hay tareas
de prueba en cada fase. Backend con Vitest (las de base de datos se saltan sin `TEST_DATABASE_URL`);
frontend con `node --test`.

**Commits**: en español y empezando por `HU-03:` (CONVENCIONES §9). Sin `push`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**: US1 = descargar mi certificado fiscal (la única historia de la spec). Para entregarla
  por partes se divide en tres incrementos comprobables: emisión y regeneración (fase 3), área
  personal (fase 4) y verificación pública (fase 5).

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/certificados-informes/` y `frontend/src/components/certificados-informes/`.

---

## Phase 1: Setup

- [X] T001 Crear `backend/src/db/migraciones/008_certificados.sql` con `certificados_fiscales` exactamente como [data-model.md](data-model.md) (FK `ON DELETE RESTRICT` a `donantes`, `CHECK` de ejercicio, importe > 0 y formato de código, `UNIQUE (donante_id, ejercicio)` y `UNIQUE (codigo_verificacion)`, `creado_en`/`actualizado_en`). No tocar 004 ni 009. *Hecho: además, con aprobación de Rubén, se añade `008_certificados.sql` a la lista exacta de migraciones que espera `backend/src/modulos/donaciones/migraciones.test.js` (2 pruebas de HU-01 fallaban por la migración nueva); se avisa a Nada en la PR.*

**Checkpoint**: `npm run migrar` sobre una base vacía aplica 001–006, 008 y 009 sin errores.

---

## Phase 2: Foundational (bloquea las fases 3–5)

- [X] T002 [P] Crear `backend/src/modulos/certificados-informes/textos.js` (funciones puras, research R4–R8): `generarCodigo(aleatorio = randomInt)` → `XXXX-XXXX-XXXX-XXXX` en Crockford base32; `normalizarCodigo(texto)` → código agrupado o `null` si no tiene 16 caracteres válidos; `enmascararNifNie(nif)` → `***` + últimos 4 dígitos + `*`; `formatearEuros(texto)` → `80,00 €` (`Intl` es-ES); `formatearFechaDia('2026-01-01')` → `01/01/2026`; `textoCorreo({ nombre, ejercicio, importeTotal, regenerado, vinculado, urlFrontend })` → `{ asunto, texto }` (contrato «Correo de aviso»); `definicionPdf({ ong, donante, certificado, urlFrontend })` → definición para `generarPdf` con los datos de FR-003 y la dirección `…/verificar-certificado?codigo=…`
- [X] T003 [P] Pruebas sin base de datos en `backend/src/modulos/certificados-informes/textos.test.js`: formato y alfabeto del código (sin I, L, O, U), normalización (minúsculas, espacios, guiones, longitud errónea → `null`), enmascarado de DNI y NIE (`12344567Z` y `X1234567L` → `***4567*`), euros y fecha, correo de emisión, de regeneración (código anterior no válido) y sin vínculo (invitación a `/donar/vincular`), sin NIF/NIE en el correo; el PDF contiene nombre y CIF de la ONG, nombre, apellidos y NIF/NIE, ejercicio, importe, fecha y código
- [X] T004 Crear `backend/src/modulos/certificados-informes/repositorio.js` (SQL parametrizado, `consulta` y `transaccion` de `db/pool.js`; research R1–R2): `primerCobroConfirmado()` (mínimo `fecha_cobro` confirmada; el servicio saca el año con `anioEnMadrid`); `pendientesDeEjercicio(cliente, { ejercicio, desde, hasta })` → Donantes con total > 0 de confirmadas en `[desde, hasta)` sin certificado o con total distinto, con `nombre`, `correo`, `usuario_id` y si ya existía; `guardarCertificado(cliente, { donanteId, ejercicio, importeTotal, fechaEmision, codigo })` (`INSERT … ON CONFLICT (donante_id, ejercicio) DO UPDATE`); `bloquearEjercicio(cliente, ejercicio)` (`pg_advisory_xact_lock`); `donanteDeUsuario(usuarioId)`; `certificadosDeDonante(donanteId)` y `certificadoDeDonante(donanteId, ejercicio)` con `importe_total::text` y `to_char(fecha_emision, 'YYYY-MM-DD')`; `certificadoPorCodigo(codigo)` con `nif_nie`. No importar nada de `modulos/donaciones/`

**Checkpoint**: `npx vitest run src/modulos/certificados-informes/textos.test.js` pasa.

---

## Phase 3: User Story 1 — Emisión y regeneración (Priority: P1) 🎯 MVP

**Goal**: el 1 de enero (y cada hora) se emiten los certificados del ejercicio cerrado y se
regeneran los que cambian por una confirmación tardía, con aviso por correo.

**Independent Test**: con las aportaciones de 50 € y 30 € de 2025 y «ahora» el 01/01/2026,
`npm run certificados -- --ejercicio 2025` crea un certificado de 80,00 € y un correo.

- [X] T005 [US1] Crear `backend/src/modulos/certificados-informes/servicio.js` con `crearServicio({ repositorio, transaccion, enviarCorreo, ahora, generarCodigo, config })` y la instancia por defecto exportada. `reconciliarEjercicio(ejercicio)`: 409 `EJERCICIO_NO_CERRADO` si `ejercicio >= anioEnMadrid(ahora())`; en una transacción con `bloquearEjercicio`, `pendientesDeEjercicio` con `rangoAnio(ejercicio)` y `guardarCertificado` con código nuevo y `fecha_emision` = día de Madrid de `ahora()` (un reintento con otro código si choca la unicidad del código); tras el commit, `enviarCorreo(textoCorreo(…))` a `donantes.correo` por cada emitido o regenerado; devuelve `{ ejercicio, emitidos, regenerados, correosFallidos }`. `reconciliarCerrados()`: de `anioEnMadrid(primerCobroConfirmado())` al año anterior al actual
- [X] T006 [US1] Crear `backend/src/modulos/certificados-informes/generar.js` (orden de consola, contrato): lee `--ejercicio AAAA` opcional, llama a `reconciliarEjercicio` o `reconciliarCerrados`, imprime una línea por ejercicio, cierra el pool y sale con 1 ante un error (ejercicio no cerrado o mal escrito)
- [X] T007 [P] [US1] Crear `backend/src/modulos/certificados-informes/tarea.js` con `programarCertificados()` (`node-cron`, `'5 * * * *'`, `timezone: 'Europe/Madrid'`, llama a `reconciliarCerrados()` y registra el resultado o el error sin tumbar el proceso; research R3), con sus pruebas sin base de datos en `backend/src/modulos/certificados-informes/tarea.test.js`
- [X] T008 [US1] Pruebas con base de datos en `backend/src/modulos/certificados-informes/certificados.test.js` (patrón de `voluntariado/calendario.test.js`, `describe.skipIf(!TEST_DATABASE_URL)`, `TRUNCATE certificados_fiscales, aportaciones, suscripciones_socio, donantes … CASCADE`, correo con `vi.fn`, servicio con `ahora` inyectado): escenario 1 (50 € + 30 € = `80.00`); escenario 2 (01/01/2026 00:00 Madrid no cuenta; 31/12/2025 23:59 Madrid sí); pendientes, rechazadas y canceladas no suman; ejercicio en curso → `EJERCICIO_NO_CERRADO`; idempotencia (segunda ejecución: 0 emitidos, 0 regenerados, sin correo); escenario 8 (confirmación tardía: misma fila, total `100.00`, fecha y código nuevos); confirmación tardía sin certificado previo → emite; escenario 9 y 12 (correo de emisión, de regeneración y con invitación si no hay `usuario_id`); fallo de correo (`enviarCorreo` → `false`): certificado guardado y `correosFallidos = 1`; `reconciliarCerrados` cubre varios años; SC-002 (todos los Donantes con confirmadas del ejercicio tienen certificado); dos reconciliaciones simultáneas del mismo ejercicio solo envían un correo
- [X] T009 [US1] Sustituir en `backend/package.json` el script reservado `certificados` por `node --env-file-if-exists=../.env src/modulos/certificados-informes/generar.js` (cambio común aprobado, plan «Cambios comunes» 4)

**Checkpoint**: T003 y T008 pasan; la orden de consola funciona contra la base de pruebas.

---

## Phase 4: User Story 1 — Área personal y PDF (Priority: P1)

**Goal**: el donante con cuenta vinculada ve y descarga solo sus certificados; se le explica el
ejercicio en curso, el ejercicio sin aportaciones y la falta de vínculo.

**Independent Test**: como la cuenta vinculada, `/mis-certificados` muestra 2025 por 80,00 € y
descarga el PDF; otra cuenta recibe 404 para ese ejercicio.

- [X] T010 [US1] Añadir a `backend/src/modulos/certificados-informes/servicio.js` `listarPropios(usuario)` (`{ datos, total, ejercicioEnCurso, vinculado }`) y `pdfPropio(usuario, ejercicio)` (409 `EJERCICIO_NO_CERRADO` «El certificado de 2026 se generará a partir del 01/01/2027.» si `ejercicio >= ejercicioEnCurso`; 404 `CERTIFICADO_NO_DISPONIBLE` «No tienes aportaciones confirmadas en AAAA, así que no hay certificado de ese ejercicio.» sin vínculo o sin certificado propio; devuelve `definicionPdf`) según [contrato](contracts/api-certificados.md)
- [X] T011 [US1] Crear `backend/src/modulos/certificados-informes/controlador.js` (zod: `ejercicio` de 4 dígitos → 400; respuesta camelCase; PDF con `generarPdf` y `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="certificado-AAAA.pdf"`) y `backend/src/modulos/certificados-informes/rutas.js` con `GET /yo/certificados` y `GET /yo/certificados/:ejercicio/pdf` tras `requiereRol('donante')`, exportando `rutasCertificadosInformes`
- [X] T012 [US1] Registrar el router en `backend/src/app.js` en la línea reservada (cambio común aprobado, plan «Cambios comunes» 1)
- [X] T013 [US1] Ampliar `backend/src/modulos/certificados-informes/certificados.test.js` con la API (con `AHORA_SIMULADO=2026-01-02T10:00:00+01:00` fijado antes de importar `app.js`, como `calendario.test.js`, y los certificados preparados con el servicio de `ahora` inyectado): 401 sin sesión, 403 sin rol donante; cuenta vinculada ve solo los suyos con `ejercicioEnCurso` y `vinculado: true` (escenario 6: 2024 y 2025); cuenta donante sin vínculo con el mismo correo → `vinculado: false` y lista vacía (FR-012: el correo no da acceso); PDF propio 200 `application/pdf`; escenario 7 (otra cuenta pide el mismo ejercicio → 404); escenario 4 (ejercicio sin aportaciones → 404 con su mensaje); escenario 5 (ejercicio en curso → 409); `:ejercicio` no numérico → 400; tras vincular (`usuario_id` asignado) ve los ya generados (escenario 12)
- [X] T014 [P] [US1] Crear `frontend/src/components/certificados-informes/certificados.js` con `mensajeEjercicio({ ejercicio, certificados, ejercicioEnCurso })` → `{ tipo: 'disponible' | 'en-curso' | 'sin-aportaciones', mensaje }` (mismos textos que los errores 409 y 404 del contrato), `ejerciciosConsultables(ejercicioEnCurso)` (del en curso a 10 años atrás) y `normalizarCodigo(texto)` (mismo criterio que el backend)
- [X] T015 [P] [US1] Pruebas `node --test` en `frontend/src/components/certificados-informes/certificados.test.js` para `mensajeEjercicio` (los tres casos, con 2026/2027 y 2023), `ejerciciosConsultables` y `normalizarCodigo`
- [X] T016 [US1] Crear `frontend/src/components/certificados-informes/MisCertificados.jsx` (carga `GET /yo/certificados`; 401 → «Inicia sesión para ver tus certificados.» con *Entrar* (`/entrar`); 403 → mensaje del servidor; `vinculado: false` → `Aviso` con enlace a `/donar/vincular`; `Tabla` con Ejercicio, Importe total (`formatearEuros`), Fecha de emisión (`formatearFecha`), Código y *Descargar PDF* (`urlApi`); `EstadoVacio` si no hay; selector «Consultar un ejercicio» con `mensajeEjercicio`) y `frontend/src/pages/mis-certificados.astro` con `Layout` titulado «Mis certificados fiscales»
- [X] T017 [US1] Descomentar en `frontend/src/components/comunes/Menu.jsx` el enlace `{ rol: 'donante', href: '/mis-certificados', texto: 'Certificados' }` (cambio común aprobado, plan «Cambios comunes» 3)

**Checkpoint**: T013 y T015 pasan; `npm run build` en `frontend/` compila.

---

## Phase 5: User Story 1 — Verificación pública (Priority: P1)

**Goal**: cualquiera comprueba un código sin iniciar sesión (FR-011).

**Independent Test**: el código actual da «válido» con ejercicio, importe, fecha y `***4567*`; el
anterior a una regeneración da «no válido».

- [X] T018 [US1] Añadir `verificar(codigo)` a `backend/src/modulos/certificados-informes/servicio.js` (`normalizarCodigo`; `{ valido: false }` si es `null` o no existe; si existe, `{ valido: true, ejercicio, importeTotal, fechaEmision, nifNieEnmascarado }`), su controlador y `GET /certificados/verificacion` pública en `backend/src/modulos/certificados-informes/rutas.js`
- [X] T019 [US1] Ampliar `backend/src/modulos/certificados-informes/certificados.test.js`: escenario 10 (válido sin sesión, con NIF/NIE enmascarado y sin nombre, correo ni dirección en el cuerpo); escenario 11 (código anterior tras regenerar, inexistente, vacío y mal formado → `{ valido: false }`); código en minúsculas y sin guiones → válido
- [X] T020 [US1] Crear `frontend/src/components/certificados-informes/VerificarCertificado.jsx` (campo «Código de verificación», botón «Comprobar»; si la URL trae `?codigo=` lo comprueba al abrir; «Certificado válido» con ejercicio, importe, fecha de emisión y NIF/NIE enmascarado, o «Código no válido» sin datos) y `frontend/src/pages/verificar-certificado.astro` con `Layout` titulado «Verificar un certificado fiscal»

**Checkpoint**: T019 pasa; la página compila.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T021 Programar la tarea en `backend/src/servidor.js` con `programarCertificados()` tras `listen` (cambio común aprobado, plan «Cambios comunes» 2)
- [ ] T022 [P] Documentación común aprobada (plan «Cambios comunes» 5–6): `specs/plan-comun.md` §4 (ruta pública de verificación), §6 (tarea horaria y regeneración) y «Preguntas abiertas» (PA3.1/PA3.2 resueltas en spec-003); `specs/modelo-datos.md` (regeneración en `certificados_fiscales` en vez de «pendiente de PA3.1»); `backend/src/db/migraciones/LEEME.md` (008 creada) y `backend/src/modulos/LEEME.md` (sección de certificados con sus rutas)
- [ ] T023 Ejecutar todas las pruebas en un PostgreSQL 16 desechable con dos bases: (a) `ong_test`, migrada con `npm run migrar`, para todo el backend salvo `src/modulos/donaciones/` (`npx vitest run --exclude 'src/modulos/donaciones/**'`); (b) `ong_test_hu01`, vacía, para `src/modulos/donaciones/` (sus pruebas exigen esa base y crean esquemas temporales), en ambos casos con `DATABASE_URL` = `TEST_DATABASE_URL` en la propia orden. Frontend: `npm test` y `npm run build`. Registrar resultados en `specs/spec-003/refinamiento/validacion-01.md`
- [ ] T024 Revisar el [quickstart](quickstart.md) contra lo implementado (textos, rutas, `datos-prueba.sql` cargable sobre las semillas) y anotar en `specs/spec-003/refinamiento/validacion-01.md` que SC-001 queda pendiente de HU-02

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T004)** → fases 3, 4 y 5.
- **Fase 3** (T005–T009): T005 depende de T002 y T004; T006 y T007 de T005; T008 de T005.
- **Fase 4** (T010–T017): T010 depende de T005; T011 de T010; T012 de T011; T013 de T012;
  T014/T015 son independientes del backend; T016 de T014; T017 de T016.
- **Fase 5** (T018–T020): T018 depende de T011; T019 de T018; T020 de T014.
- **Fase 6**: T021 depende de T007; T022 en cualquier momento tras aprobar los cambios comunes;
  T023 y T024 al final.

## Parallel Opportunities

- T002 ‖ T003 (fichero y su prueba se escriben juntos) ‖ T001.
- T007 ‖ T006 una vez hecho T005.
- T014 ‖ T015 ‖ todo el backend de la fase 4.
- T020 ‖ T018/T019.

## Implementation Strategy

1. **MVP** = fases 1–3: los certificados existen, son correctos al céntimo y se regeneran; se puede
   comprobar con la orden de consola y SQL.
2. Fase 4: el donante los ve y los descarga (cierra FR-004–FR-007 y FR-012).
3. Fase 5: verificación pública (FR-011).
4. Fase 6: tarea programada, documentación común y validación completa.

Los cambios en ficheros comunes (T009, T012, T017, T021, T022) se hacen solo con el cambio exacto
aprobado por Rubén antes (principio XII).
