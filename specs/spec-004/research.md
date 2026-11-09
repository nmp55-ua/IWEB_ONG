# Research: HU-04 — Informes de recaudación y voluntariado

Decisiones técnicas de [plan.md](plan.md). Las reglas funcionales están en [spec.md](spec.md)
(clarify de 2026-11-09); aquí solo se decide **cómo** cumplirlas con la base común.

## R1. Lectura de tablas de otros módulos

- **Decision**: `repositorio.js` de `certificados-informes` lee con SQL propio `aportaciones`
  (HU-01), `actividades` (HU-07), `inscripciones` (HU-05), `asistencias` (HU-08) y `proyectos`
  (común). No importa repositorios ni servicios de otros módulos y no escribe en ninguna tabla.
- **Rationale**: plan-comun §7, «`certificados-informes` solo **lee** tablas de otros
  módulos». Es el mismo criterio de HU-03, revisado por Nada.
- **Alternatives considered**: llamar a funciones de `donaciones` o `actividades` (acopla
  módulos de otras personas y obliga a coordinar interfaces nuevas).

## R2. Una sola función para pantalla, CSV y PDF

- **Decision**: `servicio.generarInforme(filtros)` devuelve `{ filtros, filas, vacio }`. La ruta
  JSON lo devuelve tal cual; las rutas `/csv` y `/pdf` llaman a la **misma** función y solo
  transforman sus `filas` con funciones puras de `textos.js` (`csvInforme`, `definicionPdfInforme`).
- **Rationale**: plan-comun §6 lo exige y es lo que garantiza FR-006 y SC-003 (mismas filas y
  cifras). Las pruebas comparan las tres salidas fila a fila.
- **Alternatives considered**: que el frontend genere el CSV (duplica formato y no sirve para el
  PDF); guardar informes (no es una entidad, spec «Key Entities»).

## R3. Agregación en SQL con `GROUPING SETS`

- **Decision**: dos consultas agregadas, una de dinero y otra de voluntariado, cada una con
  `GROUP BY GROUPING SETS ((periodo, proyecto_id), (periodo), ())`. `GROUPING()` distingue la
  fila de proyecto (incluido «fondo general», `proyecto_id NULL`) del subtotal de periodo y del
  total. El servicio une las dos por `(nivel, periodo, proyecto_id)`.
- **Rationale**:
  - las sumas quedan en `NUMERIC`, exactas al céntimo y a la centésima de hora (SC-001);
  - `count(DISTINCT voluntario_id)` se calcula en cada nivel, así que en subtotales y totales
    cuenta **personas distintas** y no la suma de filas (clarify, pregunta 3);
  - en el resto de cifras el subtotal coincide con la suma de sus filas por construcción.
- **Alternatives considered**: sumar en JavaScript (coma flotante, y los voluntarios distintos
  saldrían duplicados); una sola consulta con `JOIN` entre aportaciones y actividades (multiplica
  filas y descuadra las sumas).

## R4. Periodo, agrupación y zona horaria

- **Decision**:
  - entrada `desde` y `hasta` como `AAAA-MM-DD`; rango semiabierto
    `[inicioDia(desde), inicioDia(hasta + 1 día))` con `inicioDia` de `servicios-comunes/fechas.js`,
    así que ambos días cuentan completos en hora de Madrid (FR-002);
  - el corte por periodo se hace en SQL con `date_trunc($agrupacion, instante AT TIME ZONE
    'Europe/Madrid')`, con `agrupacion` ∈ `month`, `quarter`, `year`. Sin agrupación, el periodo
    es `NULL` y el servicio descarta el subtotal (que sería igual al total);
  - dinero: `fecha_cobro` de aportaciones `confirmada` (FR-003, como HU-02 y HU-03);
  - voluntariado: `inicio` de la actividad (clarify, pregunta 5), con la actividad entera,
    asistentes y horas, en el periodo donde empieza;
  - etiqueta del periodo: `01/2026` (mes), `T1 2026` (trimestre), `2026` (año). Se devuelven
    también `desde` y `hasta` del periodo **recortados al rango pedido** (p. ej. un informe del
    15/02 al 31/03 por meses tiene el periodo `02/2026` desde el 15/02).
- **Rationale**: el mismo rango de Madrid que ya usan HU-01 a HU-03; `date_trunc` sobre la hora
  local de Madrid corta bien en los cambios de horario.
- **Alternatives considered**: calcular los periodos en JavaScript con `rangoMes` y
  `rangoTrimestre` y una consulta por periodo (más consultas y el mismo resultado).

## R5. Qué cuenta como actividad celebrada y como voluntariado

- **Decision**:
  - actividad celebrada: `estado = 'publicada' AND inicio <= ahora`, con `ahora` de `fechas.js`
    (admite `AHORA_SIMULADO`) pasado como parámetro, no `now()` de SQL (modelo-datos,
    «actividades»). Las canceladas y en borrador no cuentan;
  - `actividades`: `count(DISTINCT actividad)` de las celebradas, tengan asistencias o no (caso
    límite: celebrada sin asistencias cuenta con 0 horas);
  - `voluntarios`: `count(DISTINCT inscripciones.voluntario_id)` de asistencias con
    `asistio = true`;
  - `horas`: `sum(asistencias.horas)` de asistencias con `asistio = true` (las corregidas a «no
    asistió» no cuentan, caso límite). Se usa `horas` guardada en la asistencia, como hace HU-08.
- **Rationale**: es la definición del modelo común; el total de horas nunca se guarda.

## R6. Filas que aparecen y orden

- **Decision**:
  - solo aparecen las filas de proyecto (o de proyecto y periodo) con alguna aportación
    confirmada o alguna actividad celebrada; los periodos sin filas no tienen subtotal
    (clarify, pregunta 4);
  - si no queda ninguna fila, `vacio: true` y `filas: []`, sin fila de totales; la interfaz
    muestra «No hay aportaciones confirmadas ni actividades celebradas en este periodo.» (FR-007);
  - orden: periodos ascendentes; dentro de cada uno, proyectos por nombre, después «Fondo
    general» y al final el subtotal; la fila de totales cierra el informe;
  - con filtro de proyecto se mantiene la fila de totales (igual a la del proyecto) para que el
    formato sea siempre el mismo. «Fondo general» no es un proyecto y no se ofrece como filtro
    (FR-001 habla de «un Proyecto»).
- **Rationale**: el informe queda corto para la junta y las pruebas son deterministas.

## R7. Lista de proyectos para el filtro

- **Decision**: nueva ruta `GET /api/informes/proyectos` (administrador) con **todos** los
  proyectos, activos e inactivos, por nombre. Un filtro con un `proyectoId` que no existe da 404
  `PROYECTO_NO_ENCONTRADO`.
- **Rationale**: `GET /api/proyectos` (común) solo devuelve los activos, pero un proyecto
  inactivo sigue apareciendo si tiene datos (caso límite), así que también debe poder filtrarse.
  Es una ruta del propio módulo; no cambia la común.
- **Alternatives considered**: cambiar `GET /api/proyectos` (es común y lo usan HU-01 y HU-07
  para elegir destino: mostraría proyectos inactivos donde no deben).

## R8. Formato de las exportaciones

- **Decision**:
  - columnas iguales en pantalla, CSV y PDF: Periodo (solo si hay agrupación), Proyecto,
    Donaciones puntuales, Cuotas de socio, Total recaudado, Aportaciones, Actividades celebradas,
    Voluntarios, Horas;
  - las filas de subtotal y totales llevan en «Proyecto» `Subtotal T1 2026` y `Total`;
  - CSV con `generarCsv` común (`;`, coma decimal, UTF-8 con BOM). Importes sin símbolo ni
    separador de miles (`1234,50`) para que Excel los trate como números. Horas con un decimal,
    igual que la pantalla (plan-comun §4). Nombre `informe-AAAA-MM-DD-AAAA-MM-DD.csv`;
  - PDF con `generarPdf` común: título «Informe de recaudación y voluntariado», un bloque con el
    periodo (dd/mm/aaaa), el proyecto («Todos») y la agrupación («Sin agrupar»), y la tabla con
    importes `1.234,50 €` y horas `3,5 h`. Nombre `informe-…pdf`. Un informe vacío da un PDF con
    el mismo mensaje de FR-007 y un CSV solo con la cabecera;
  - el total recaudado es puntual + cuotas, calculado en SQL;
  - solo cifras agregadas: ninguna consulta selecciona nombre, correo, NIF/NIE ni dirección de
    donantes o voluntarios (FR-009). Las pruebas lo comprueban en las tres salidas.
- **Rationale**: plan-comun §6 y principio IV; FR-006 («la misma información»).

## R9. Validación de la entrada

- **Decision**: `zod` en el controlador:
  - `desde` y `hasta` obligatorios, `AAAA-MM-DD` y fechas reales;
  - `proyectoId` opcional, entero positivo;
  - `agrupacion` opcional, `mes`, `trimestre` o `anio`.
  
  Si falla, 400 `VALIDACION` con `campos`. Si `hasta < desde`, 400 `PERIODO_NO_VALIDO` con
  «La fecha de fin no puede ser anterior a la de inicio.» y `campos.hasta` (FR-002). No hay
  límite de duración: un informe de muchos años por meses es grande, pero correcto (principio I).
- **Rationale**: formato común de errores (plan-comun §4).

## R10. Dependencia de HU-08 (tabla `asistencias`)

- **Decision**: se construye ya todo salvo lo que lee `asistencias` (migración `007`, solo en
  `origin/spec-008`). Mientras HU-08 no esté en `main`:
  - la consulta de voluntariado cuenta las actividades celebradas;
  - `voluntarios` y `horas` quedan pendientes de las tareas de la fase bloqueada;
  - la PR de HU-04 no se abre hasta completarlas (principio III: la historia está terminada solo
    cuando cumple todos sus criterios).
  
  Al llegar HU-08 a `main`, se hace `merge` de `main` en `spec-004` y se completan esas tareas.
- **Rationale**: decisión de Rubén del 2026-11-09 (opción A); evita fusionar `spec-008` sin
  revisar.
- **Alternatives considered**: fusionar `origin/spec-008` en `spec-004` (conflictos en ficheros
  ajenos y la PR arrastraría HU-08); crear `asistencias` solo en las pruebas (duplicaría la
  migración de Nicole).

## R11. Rendimiento (SC-002)

- **Decision**: sin índices nuevos. El dinero usa el índice `(donante_id, estado, fecha_cobro)`
  de HU-01 o un recorrido de `aportaciones`, y el voluntariado recorre las actividades del rango.
  Para los volúmenes de una ONG (miles de filas por año), ambas consultas tardan milisegundos y la
  exportación, menos de un segundo; SC-002 pide menos de 1 minuto para todo el proceso en la
  aplicación.
- **Alternatives considered**: tablas resumen o vistas materializadas (complejidad sin
  necesidad, principio I).
