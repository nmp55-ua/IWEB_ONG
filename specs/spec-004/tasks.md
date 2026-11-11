# Tasks: HU-04 — Informes de recaudación y voluntariado para la junta

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/api-informes.md](contracts/api-informes.md),
[quickstart.md](quickstart.md). Base común: [plan-comun.md](../plan-comun.md),
[modelo-datos.md](../modelo-datos.md), [CONVENCIONES.md](../../CONVENCIONES.md).

**Responsable**: *Rubén* · **Revisora**: *Nicole*

**Tests**: plan-comun §8 exige pruebas de permisos (401, 403) y de sumas al céntimo; SC-001 y SC-003
piden cuadre exacto y coincidencia de las tres salidas. Hay tareas de prueba en cada fase. Backend
con Vitest (las de base de datos se saltan sin `TEST_DATABASE_URL`); frontend con `node --test`.

**Commits**: en español y empezando por `HU-04:` (CONVENCIONES §9). Sin `push`.

**Dependencia de HU-08**: la tabla `asistencias` (migración `007`) aún no está en `main`. Las fases
1–5 no la leen. Mientras tanto, la consulta de voluntariado devuelve `voluntarios = 0` y
`horas = '0.00'` para las actividades celebradas. La fase 6 lo completa cuando HU-08 llegue a
`main`, y la PR de HU-04 no se abre antes (research R10).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes).
- **[Story]**:
  - US1: consultar el informe por proyecto y periodo (P1);
  - US2: exportarlo (P2).

## Path Conventions

Back-end en `backend/src/`, front-end en `frontend/src/`. Módulo propio:
`backend/src/modulos/certificados-informes/` y `frontend/src/components/certificados-informes/`.

---

## Phase 1: Setup

- [X] T001 Crear `backend/src/modulos/certificados-informes/informes.test.js` con la preparación común de las pruebas con base de datos (patrón de `certificados.test.js`):
  - `describe.skipIf(!TEST_DATABASE_URL)`;
  - antes de cada prueba, `TRUNCATE certificados_fiscales, inscripciones, actividades, aportaciones, suscripciones_socio, donantes, voluntarios RESTART IDENTITY CASCADE`. No se vacían `proyectos` ni `usuarios`, que son comunes: cada prueba crea los suyos con nombres y correos únicos, y los proyectos sobrantes no salen en el informe porque no tienen datos;
  - ayudantes `proyecto(nombre, activo)`, `donante()`, `aportacion({ donanteId, proyectoId, modalidad, importe, estado, fechaCobro })` (crea la suscripción si es `cuota_socio`), `actividad({ proyectoId, inicio, fin, estado })`, `voluntario()` e `inscripcion(voluntarioId, actividadId)`;
  - servicio creado con `crearServicio({ ahora })`;
  - usuarios `admin` (rol `administrador`) y `donante`, y la función `entrar(nombre)` para Supertest con sesión.

---

## Phase 2: Foundational (bloquea las fases 3 y 4)

- [X] T002 [P] Añadir a `backend/src/modulos/certificados-informes/textos.js` (funciones puras; research R4, R6 y R8):
  - `etiquetaPeriodo(agrupacion, inicioPeriodo)`: `'mes'` → `01/2026`, `'trimestre'` → `T1 2026`, `'anio'` → `2026`;
  - `COLUMNAS_INFORME(agrupacion)`: las columnas del contrato, con «Periodo» solo si hay agrupación;
  - `nombreFilaInforme(fila)`: el nombre del proyecto, `Fondo general`, `Subtotal <etiqueta>` o `Total`;
  - `formatearHorasInforme('3.50')` → `3,5 h`;
  - `MENSAJE_INFORME_VACIO`: «No hay aportaciones confirmadas ni actividades celebradas en este periodo.»
- [X] T003 [P] Pruebas sin base de datos de T002 en `backend/src/modulos/certificados-informes/textos.test.js` (bloque `describe('informe')`): las etiquetas de los tres tipos de periodo, incluido el T4 y el mes 12; las columnas con y sin agrupación; el nombre de cada `tipo` de fila; y las horas `3,5 h`, `0 h` y `13 h`.
- [X] T004 Añadir a `backend/src/modulos/certificados-informes/repositorio.js` (SQL parametrizado; research R1, R3–R5; sin importar otros módulos):
  - `recaudacionInforme({ desde, hasta, proyectoId, agrupacion })`:
    - aportaciones `confirmada` con `fecha_cobro >= desde AND fecha_cobro < hasta`, más el filtro opcional de proyecto;
    - `periodo` = `date_trunc(agrupacion_sql, fecha_cobro AT TIME ZONE 'Europe/Madrid')`, o `NULL` sin agrupación;
    - `GROUP BY GROUPING SETS ((periodo, proyecto_id), (periodo), ())` con `GROUPING(periodo, proyecto_id) AS nivel`;
    - `sum(importe) FILTER (WHERE modalidad = 'puntual')`, `… 'cuota_socio'`, `sum(importe)` y `count(*)`, con `coalesce(…, 0)::text`;
    - `proyecto_id::text` y `to_char(periodo, 'YYYY-MM-DD')`.
  - `voluntariadoInforme({ desde, hasta, proyectoId, agrupacion, ahora })`: lo mismo sobre `actividades` con `estado = 'publicada' AND inicio <= ahora` e `inicio` en el rango; `count(*)` de actividades; por ahora, `0 AS voluntarios` y `'0.00' AS horas` (fase 6).
  - `proyectoPorId(id)` y `todosLosProyectos()` (`id::text`, `nombre`, `activo`, por nombre).
  - Ninguna consulta selecciona columnas de `donantes`, `voluntarios` ni `usuarios` (FR-009).

**Checkpoint**: `npx vitest run src/modulos/certificados-informes/textos.test.js` pasa.

---

## Phase 3: User Story 1 — Consultar el informe por proyecto y periodo (Priority: P1) 🎯 MVP

**Goal**: el administrador ve en `/informes`, por proyecto (y periodo), lo recaudado y las
actividades celebradas, con subtotales y totales.

**Independent Test**: con `datos-prueba.sql`, el informe de 2023 sin agrupar da las cifras de
dinero, aportaciones y actividades de [quickstart.md](quickstart.md) §1.

- [X] T005 [US1] Añadir a `crearServicio` de `backend/src/modulos/certificados-informes/servicio.js` (plan, «Reglas de servicio.js»):
  - `generarInforme({ desde, hasta, proyectoId, agrupacion })`:
    - si `hasta < desde`, 400 `PERIODO_NO_VALIDO` con `campos.hasta`;
    - si hay `proyectoId` y `proyectoPorId` no existe, 404 `PROYECTO_NO_ENCONTRADO`;
    - rango `[inicioDia(desde), inicioDia(hasta + 1 día))`;
    - llama a las dos consultas (con `ahora()` en la de voluntariado) y las une por `nivel|periodo|proyectoId`, con ceros donde falte una parte;
    - descarta los subtotales sin agrupación y pone `tipo` (`proyecto`, `fondoGeneral`, `subtotal`, `total`) y nombres de proyecto;
    - pone `periodo { etiqueta, desde, hasta }`, con los límites recortados al rango pedido;
    - ordena según R6;
    - con 0 filas de detalle, devuelve `vacio: true` y `filas: []`;
    - devuelve `{ filtros: { desde, hasta, proyecto, agrupacion }, filas, vacio }`.
  - `listarProyectosInforme()` → `{ datos, total }`.
  - Las dependencias por defecto se siguen resolviendo al usarse, para no romper otras pruebas que importan `app.js`.
- [X] T006 [US1] Añadir a `backend/src/modulos/certificados-informes/controlador.js` el esquema `zod` de los filtros: `desde` y `hasta` `AAAA-MM-DD` y fechas reales, `proyectoId` entero positivo opcional, `agrupacion` en `mes|trimestre|anio` opcional; si falla, 400 `DATOS_INVALIDOS` con `campos` (research R9). Añadir los manejadores `informe` (JSON) y `proyectosInforme`. En `backend/src/modulos/certificados-informes/rutas.js`, añadir `GET /informes` y `GET /informes/proyectos`, ambas con `requiereRol('administrador')`.
- [X] T007 [US1] Pruebas con base de datos en `backend/src/modulos/certificados-informes/informes.test.js`:
  - escenario 1: proyectos A y B y fondo general en 2026, con una fila por cada uno más totales, en orden;
  - escenario 2: puntuales, cuotas, total y número de aportaciones por fila, exactos al céntimo, con sumas que en coma flotante no cuadran (`1.10 + 1.20`) y totales por encima de 999.999,99 €;
  - escenario 3: el filtro de A deja solo A y el total;
  - escenario 4: agrupado por trimestre, filas por trimestre y proyecto, subtotales y total, y periodos recortados (del 15/02 al 31/03 por meses);
  - escenario 5: pendientes, rechazadas, canceladas y fuera de rango (31/12 23:59 y 01/01 00:00 de Madrid) no cuentan;
  - escenario 7: periodo vacío, `vacio: true` y 200;
  - escenario 8: `hasta < desde` da 400 `PERIODO_NO_VALIDO`, y entradas mal formadas dan 400 `DATOS_INVALIDOS`;
  - escenario 9: 401 sin sesión y 403 con rol donante en `GET /api/informes` y `/proyectos`;
  - casos límite:
    - proyecto inactivo con datos aparece y sin datos no;
    - actividad celebrada sin asistencias cuenta;
    - cancelada, borrador y futura (`inicio > ahora`) no cuentan;
    - la actividad del 31/12 22:00 al 01/01 cuenta en el año de su inicio;
  - SC-001: cuadre de cada subtotal y del total con sus filas;
  - FR-009: el JSON no contiene el nombre, correo ni NIF/NIE de los donantes de prueba;
  - `proyectoId` inexistente da 404;
  - `/informes/proyectos` incluye los inactivos.
- [X] T008 [P] [US1] Crear `frontend/src/components/certificados-informes/informes.js` (funciones puras): `validarPeriodo({ desde, hasta })` → errores por campo (obligatorias; fin no anterior a inicio, con el mismo texto que el servidor); `consultaInforme(filtros)` → `URLSearchParams` sin vacíos; `urlExportacion(filtros, 'csv'|'pdf')`; `filasParaTabla(informe)` → filas con `nombre` (nombre, `Fondo general`, `Subtotal …`, `Total`) y `clave` única. Y sus pruebas en `frontend/src/components/certificados-informes/informes.test.js`.
- [X] T009 [US1] Crear `frontend/src/components/certificados-informes/Informes.jsx` (isla React, componentes comunes `Campo`, `Boton`, `Tabla`, `Aviso`, `EstadoVacio`, `formatearEuros` y `formatearHoras` de `lib/formato.js`):
  - formulario con «Desde», «Hasta», «Proyecto» (de `GET /api/informes/proyectos`, con «Todos» e indicación «(inactivo)») y «Agrupación» («Sin agrupar», «Por mes», «Por trimestre», «Por año»);
  - «Generar» valida con `validarPeriodo` y muestra los errores del servidor junto a su campo;
  - tabla con las columnas del contrato, con subtotales y total en negrita;
  - el informe vacío muestra el mensaje de FR-007;
  - con 401 o 403, un `Aviso` de acceso denegado.
  
  Crear también `frontend/src/pages/informes.astro` con `Layout` y la isla.
- [X] T010 [US1] **Cambio común (mostrar antes a Rubén)**: descomentar en `frontend/src/components/comunes/Menu.jsx` el enlace reservado `{ rol: 'administrador', href: '/informes', texto: 'Informes' }`.

**Checkpoint**: `npx vitest run src/modulos/certificados-informes` y `npm test` del frontend pasan; el paso 2.1 del quickstart (sin las columnas de voluntariado) se ve en `/informes`.

---

## Phase 4: User Story 2 — Exportar el informe (Priority: P2)

**Goal**: el informe en pantalla se descarga en CSV y PDF con la misma información.

**Independent Test**: el informe de 2023 por trimestres exportado en CSV y PDF tiene las mismas
filas y cifras que `GET /api/informes`.

- [X] T011 [US2] Añadir a `backend/src/modulos/certificados-informes/textos.js` las funciones `csvInforme(informe)` y `definicionPdfInforme(informe)` (research R8):
  - `csvInforme` usa `generarCsv` con las columnas de `COLUMNAS_INFORME`, importes `1234,50`, horas con un decimal y «Proyecto» según `nombreFilaInforme`; un informe vacío solo lleva la cabecera;
  - `definicionPdfInforme` lleva el título, el bloque «Periodo: dd/mm/aaaa – dd/mm/aaaa · Proyecto: … · Agrupación: …» y la tabla con `formatearEuros` y `formatearHorasInforme`; un informe vacío lleva el mensaje de FR-007 en lugar de la tabla.
  
  *Hecho: con aprobación de Rubén, en `servicios-comunes/pdf.js` cada fila de tabla ocupa lo que su celda más alta y pasa de página si no cabe (con 9 columnas se solapaban), y se añade `tamanoLetra` opcional (el informe usa 7,5). Prueba en `comunes.test.js`; el certificado de HU-03 no cambia.*
  
  Pruebas en `textos.test.js`:
  - mismas filas y cifras en las dos salidas;
  - BOM, `;` y comillas en un nombre de proyecto con `;`;
  - ningún dato personal.
- [X] T012 [US2] Añadir a `controlador.js` los manejadores `csv` y `pdf`. Los dos llaman a la misma `servicio.generarInforme(filtros)` que `informe`, con `Content-Type` y `Content-Disposition: attachment; filename="informe-<desde>-<hasta>.csv|pdf"`. El PDF se escribe con `generarPdf(definicion).pipe(res)`. Añadir a `rutas.js` las rutas `GET /informes/csv` y `GET /informes/pdf` con `requiereRol('administrador')`.
- [X] T013 [US2] Pruebas con base de datos en `informes.test.js`:
  - SC-003: para el mismo informe agrupado, el CSV (decodificado, sin BOM) tiene una línea por fila del JSON más la cabecera, con las mismas cifras;
  - el PDF responde 200 `application/pdf` con `%PDF`, y su definición (`definicionPdfInforme` sobre el JSON) tiene las mismas filas;
  - errores de validación y 401/403 también en `/csv` y `/pdf`;
  - nombre del fichero correcto.
- [X] T014 [US2] Añadir a `Informes.jsx` los botones «Exportar CSV» y «Exportar PDF», visibles con un informe generado y no vacío. Son enlaces de descarga a `urlExportacion(filtros, …)` con los **mismos** filtros del informe en pantalla, no con los del formulario si se han cambiado después.

**Checkpoint**: pasos 2.9 y 2.10 del quickstart.

---

## Phase 5: Polish y documentación común

- [X] T015 **Cambio común (mostrar antes a Rubén)**:
  - `specs/plan-comun.md` §4: añadir `GET /api/informes/proyectos` a la fila de certificados-informes (004); en «Preguntas abiertas», quitar PA4.1 de la lista pendiente y anotarla como resuelta en `specs/spec-004/spec.md`;
  - `backend/src/modulos/LEEME.md`: sección de HU-04 con sus 4 rutas.
- [X] T016 Ejecutar todas las pruebas sobre un PostgreSQL desechable:
  - backend salvo donaciones sobre `ong_test`;
  - donaciones sobre `ong_test_hu01`;
  - frontend con `npm test` y `npm run build`.
  
  Guardar el resultado en `specs/spec-004/refinamiento/validacion-01.md`.
- [X] T017 Recorrer [quickstart.md](quickstart.md) contra el servidor real con `datos-prueba.sql`: pasos 2.1–2.4 y 2.6–2.11, sin las columnas de voluntariado, y cronometrar el 2.12 (SC-002) con el informe anual sin voluntariado. Anotar el resultado en `validacion-01.md`.

---

## Phase 6: Voluntariado completo (HU-08 integrada en `main` el 11/11/2026)

- [X] T018 Cuando la PR de HU-08 esté fusionada, hacer `git merge origin/main` en `spec-004` y comprobar que `007_asistencias.sql` se aplica.
- [X] T019 En `voluntariadoInforme` de `repositorio.js`, unir `inscripciones` y `asistencias` (`LEFT JOIN`) y calcular:
  - `count(DISTINCT actividad)`;
  - `count(DISTINCT inscripciones.voluntario_id) FILTER (WHERE asistio)`;
  - `coalesce(sum(asistencias.horas) FILTER (WHERE asistio), 0)::text`.
  
  Se mantienen los mismos `GROUPING SETS`, de modo que los voluntarios distintos se cuentan por ámbito (research R3 y R5).
- [X] T020 Pruebas en `informes.test.js`:
  - escenario 6: las horas coinciden con la suma de las asistencias;
  - una asistencia corregida a `asistio = false` no cuenta horas ni voluntario;
  - un voluntario en dos proyectos cuenta 1 en cada fila y 1 en el total y en el subtotal del periodo;
  - celebrada sin asistencias: 1 actividad, 0 voluntarios y `0.00` h;
  - SC-001: horas a la centésima;
  - FR-009: el JSON, el CSV y el PDF no contienen el nombre ni el correo de los voluntarios.
- [X] T021 Repetir T016 y recorrer el quickstart completo con `datos-prueba-asistencias.sql` (pasos 2.1–2.12, incluido el cronometraje de SC-002). Anotarlo en `refinamiento/validacion-02.md`.

---

## Dependencies & Execution Order

- **Fase 1** (T001): ninguna.
- **Fase 2** (T002–T004): T003 depende de T002; T004 es independiente.
- **Fase 3** (T005–T010):
  - T005 depende de T002 y T004;
  - T006 depende de T005;
  - T007 depende de T001 y T006;
  - T008 es independiente del backend;
  - T009 depende de T008 y T006;
  - T010 depende de T009.
- **Fase 4** (T011–T014): T011 depende de T002; T012 de T011 y T006; T013 de T012; T014 de T009.
- **Fase 5**:
  - T015 se puede hacer en cualquier momento tras aprobar los cambios comunes;
  - T016 y T017 van al final de las fases 1–4.
- **Fase 6**: bloqueada por HU-08 hasta su integración en `main` (11/11/2026). Dentro de ella: T018, después T019 y T020, y por último T021.

## Parallel Opportunities

- T002 y T003 ‖ T004 ‖ T001.
- T008 ‖ todo el backend de la fase 3.
- T011 ‖ T009 y T010.

## Implementation Strategy

1. **MVP** = fases 1–3: el administrador ve el informe correcto de dinero y actividades en pantalla.
2. Fase 4: lo exporta a CSV y PDF con la misma información.
3. Fase 5: documentación común y validación de lo que no depende de HU-08.
4. Fase 6: voluntarios y horas en cuanto HU-08 esté en `main`. Solo entonces se abre la PR para
   Nicole.

Los cambios en ficheros comunes (T010 y T015) se hacen solo con el cambio exacto aprobado antes por
Rubén (principio XII).
