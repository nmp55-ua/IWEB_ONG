# Tareas: HU-02 — Historial de aportaciones

**Rama**: `spec-002` · **Base de generación**: `453bfe8` · **Fecha**: 2026-11-10

**Responsable**: Nada · **Revisor**: Javi

**Fuentes**: [especificación](spec.md), [plan](plan.md), [investigación](research.md), [modelo de lectura](data-model.md), [contrato HTTP](contracts/api-historial.md), [contrato de interfaz](contracts/interfaz-historial.md) y [quickstart](quickstart.md).

## Alcance y lectura del desglose

La especificación contiene una sola historia de usuario, **US1 — Consultar mi historial de aportaciones (P1)**. Todos los incrementos funcionales siguientes pertenecen a ella. «E1»–«E9» identifican exclusivamente, en este documento, los nueve escenarios numerados de `spec.md`, sin cambiar sus identificadores originales ni crear historias nuevas.

T001–T014 están completadas y verificadas en el bloque de backend; T015–T035 permanecen pendientes. Las matrices conservan la cobertura prevista y deben contrastarse con las evidencias de cada bloque. Cada tarea indica dependencias, origen y comprobación; las rutas se interpretan desde la raíz del repositorio. Los informes de ejecución citados se crearán durante implementación; si ya existen al iniciar el bloque se conservarán y se usará el siguiente número libre, actualizando las referencias de evidencia.

Se reutiliza el módulo donaciones y el vínculo de HU-01. No se crean migraciones, entidades, permisos o servicios comunes nuevos; no se modifican certificados-informes ni otros módulos. El cambio compartido previsto se limita a activar la entrada reservada del menú, conservando el resto. Las correcciones, cobros y envíos reales quedan fuera de HU-02.

## Fase 1 — Preparación · Bloque A

**Objetivo**: registrar la base de ejecución y preparar un entorno exclusivo sin modificar configuración compartida.

- [x] T001 Registrar rama, HEAD, índice, archivos pendientes y fuentes vigentes en `specs/spec-002/refinamiento/validacion-local-01.md`, incluyendo las decisiones de clarify, el alcance de solo lectura y Nada/Javi. **Depende de**: ninguna. **Origen**: plan, constitución X–XII y FR-007. **Comprobación**: selección temporal resuelve `specs/spec-002`; inventario separa documentos pendientes, secretos y configuración local, sin seleccionarlos ni alterarlos.
- [x] T002 Preparar dependencias desde los lockfiles solo si faltan y seleccionar DATABASE_URL/TEST_DATABASE_URL para `ong_test_hu01` en una terminal exclusiva siguiendo `specs/spec-002/quickstart.md`; registrar las comprobaciones en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T001. **Origen**: R-09 y validación de FR-001–FR-008. **Comprobación**: conexión verificada sin secretos, servicios externos sintéticos, ninguna escritura en `.env`, lockfiles o base de desarrollo; una falta de configuración detiene la ejecución y no omite pruebas como aprobadas.

**Revisión de bloque**: entorno identificado y protecciones conservadas. No se ejecutan migraciones contra `public` ni semillas compartidas.

## Fase 2 — Fundamentos de prueba · Bloque B

**Objetivo**: disponer de fixtures reutilizables y aislamiento comprobado antes de implementar US1.

- [x] T003 Crear funciones de fixtures de HU-02 exportables desde `backend/src/modulos/donaciones/pruebas/historial-local.js` y sus comprobaciones en `backend/src/modulos/donaciones/historial.test.js`, reutilizando `pruebas/soporte.js` sin modificarlo. **Depende de**: T002. **Origen**: quickstart §2, E1–E9 y SC-001–SC-003. **Comprobación**: fixtures de propiedad, estados, fechas, empates BIGINT, importes grandes y cuenta separada con 60 cuotas de 2021–2025; referencias sintéticas válidas; importar el archivo no arranca servicios ni modifica datos por sí solo.
- [x] T004 Ejecutar las comprobaciones de entorno/fixtures de `backend/src/modulos/donaciones/historial.test.js` y registrar el resultado en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T003. **Origen**: R-09 y fundamento de SC-001–SC-003. **Comprobación**: base y esquema aleatorio verificados, migrador vigente ejecutado solo allí, limpieza limitada al esquema propio, rechazo de conexión incorrecta y ausencia de Stripe/SMTP reales. Si falla la preparación, no iniciar los casos funcionales.

**Revisión de bloque**: fixtures y limpieza comprobados; todavía no se acredita el historial. No se añade un framework de pruebas ni una migración.

## Fase 3 — US1: backend de consulta · Bloque C

**Objetivo**: entregar un GET privado y consistente con su regresión dirigida.

**Prueba independiente**: con dos sesiones donante, la primera recibe solo sus confirmadas y los tres estados se distinguen; no consigue acceder al historial de la segunda.

Las pruebas T005–T007 se escriben antes de T008–T010. Se conservan los resultados iniciales y se distingue un fallo funcional esperado de un fallo de preparación.

- [x] T005 [US1] Escribir pruebas de autorización y contrato en `backend/src/modulos/donaciones/historial.test.js`. **Depende de**: T004. **Origen**: FR-007/FR-008, E6/E7 y SC-003; R-01. **Comprobación**: sesiones separadas; 401 sin sesión o con cuenta inactiva, 403 sin rol; propiedad por Usuario del servidor, correo coincidente sin vínculo y permiso invitado insuficientes; rechazo de selectores ajenos, 404 de rutas inexistentes; cabeceras privadas también en errores y ausencia de datos personales en el DTO.
- [x] T006 [US1] Añadir pruebas de contenido, estados y filtros en `backend/src/modulos/donaciones/historial.test.js`. **Depende de**: T005. **Origen**: FR-001–FR-006/FR-008, E1–E5/E7/E8 y SC-001; R-03–R-05. **Comprobación**: totales 20,00/80,00 €, exclusión de pendientes/rechazadas/canceladas, cuota conservada tras cancelar socio o fallar correo, proyecto inactivo/fondo general, límites Madrid, desempate BIGINT, tres estados vacíos, filtro inválido/repetido/desconocido y listado superior a 60 sin truncamiento. Dos importes de 999.999,99 € suman exactamente 1.999.999,98 €; contrastar también la suma de todos los grupos con el SUM independiente de todas las confirmadas de ese Donante, sin aritmética flotante.
- [x] T007 [US1] Añadir regresiones de instantánea, ciclo de transacción y ausencia de efectos en `backend/src/modulos/donaciones/historial.test.js`. **Depende de**: T006. **Origen**: FR-001–FR-003/FR-007, SC-001 y R-02/R-07. **Comprobación**: barreras de prueba sobre dos conexiones permiten confirmar entre resumen y detalle; la respuesta mantiene una instantánea y la siguiente incluye el nuevo cobro; error fuerza rollback/liberación. GET repetidos no crean operaciones, aportaciones, vínculos, correos o certificados y no llaman a Stripe/SMTP.
- [x] T008 [US1] Implementar la lectura por propietario, resúmenes y detalle en `backend/src/modulos/donaciones/repositorio.js`, reutilizando `enTransaccion` sin alterar su comportamiento para HU-01. **Depende de**: T007. **Origen**: FR-001–FR-007, E1–E4/E6 y R-02/R-03/R-04. **Comprobación**: consultas parametrizadas, proyección explícita, solo confirmadas, LEFT JOIN sin filtrar proyecto activo, `SUM(NUMERIC)` textual y orden `fecha_cobro DESC, id DESC`; dentro de la misma conexión se establece `REPEATABLE READ, READ ONLY` antes de leer. Sin vínculo no se consulta por correo ni se leen sus aportaciones.
- [x] T009 [US1] Implementar validación y composición del historial en `backend/src/modulos/donaciones/servicio.js`. **Depende de**: T008. **Origen**: FR-001–FR-008, E1–E8 y contrato HTTP. **Comprobación**: año opcional único de cuatro cifras entre 1000 y 9999, `rangoAnio`/`aIsoMadrid`, propietario del servidor, BIGINT y dinero como texto; DTO con totales de la instantánea, años disponibles sin filtro y `hayAportaciones` null/false/true. No reutilizar el validador de importe individual para sumas ni iniciar reconciliación fiscal.
- [x] T010 [US1] Incorporar el controlador GET en `backend/src/modulos/donaciones/controlador.js` y registrarlo en `backend/src/modulos/donaciones/rutas.js` como `/yo/aportaciones`. **Depende de**: T009. **Origen**: FR-007/FR-008 y contrato HTTP. **Comprobación**: cabeceras `private, no-store` y `Vary: Cookie` antes de autorización, middleware común y errores comunes; no aceptar propietario del cliente ni aplicar permiso invitado/CSRF de POST. El router ya registrado funciona sin modificar `app.js` ni el webhook.
- [x] T011 [US1] Ejecutar los casos de autorización, contenido y filtro de `backend/src/modulos/donaciones/historial.test.js` con el comando dirigido del quickstart y registrar comandos/resultados en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T010. **Origen**: FR-001–FR-008, E1–E8 y SC-001/SC-003. **Comprobación**: pruebas T005/T006 aprobadas en PostgreSQL aislado, DTO y códigos contrastados; conservar los fallos iniciales. Un resultado de API no acredita aún los avisos visibles.
- [x] T012 [US1] Ejecutar las regresiones T007 de concurrencia, rollback y ausencia de efectos de `backend/src/modulos/donaciones/historial.test.js`, documentando la coordinación y resultados en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T011. **Origen**: FR-001–FR-003/FR-007 y SC-001. **Comprobación**: confirmar realmente entre consultas en dos conexiones aisladas, comprobar detalle/total anterior y siguiente, liberación tras error y contadores sin efectos; no usar sleeps de producción ni modificar aportaciones de desarrollo.

**Revisión de bloque**: backend utilizable y probado con datos sintéticos. No depende de nuevos pagos reales, cron ni cambios de esquema.

## Fase 3 — US1: contraste con HU-03 · Bloque D

**Objetivo**: acreditar la igualdad fiscal sobre datos y ejercicio comparables.

- [x] T013 [US1] Escribir el contraste fiscal en `backend/src/modulos/donaciones/historial.test.js`, importando el servicio y repositorio reales de certificados-informes con acceso a conexión aislado mediante dobles de prueba. **Depende de**: T012. **Origen**: FR-002/FR-003, SC-001 y dependencia HU-03; R-07. **Comprobación**: reloj sintético de 2026, ejercicio 2025 cerrado, correo simulado; reconciliar y comparar certificado persistido, SUM independiente e historial; añadir una confirmación tardía sintética, volver a reconciliar y repetir. No cambiar módulos de Rubén ni añadir efectos fiscales al GET.
- [x] T014 [US1] Ejecutar el contraste de `backend/src/modulos/donaciones/historial.test.js` y registrar sus resultados en `specs/spec-002/refinamiento/validacion-fiscal-01.md`. **Depende de**: T013. **Origen**: SC-001 y dependencia HU-03. **Comprobación**: igualdad al céntimo antes y después de la confirmación tardía una vez reconciliada, con propietario/rango Madrid coincidentes y sin escrituras entre lecturas; sin activar cron, CLI fiscal, correo real o suite ajena con TRUNCATE sobre `public`.

**Revisión de bloque**: contraste técnico local con HU-03; no acredita revisión de Rubén ni modifica su funcionalidad.

## Fase 3 — US1: interfaz de consulta · Bloque E

**Objetivo**: presentar el historial y sus estados usando la aplicación existente.

- [ ] T015 [P] [US1] Escribir pruebas del formato exacto anual en `frontend/src/components/donaciones/historial.test.js`. **Depende de**: T004. **Origen**: FR-003, E1 y SC-001; R-04. **Comprobación**: dos decimales y miles españoles para 80,00 €, 1.999.999,98 € y un decimal textual mayor que el rango seguro de céntimos Number; entradas mal formadas no se convierten en cero. Registrar el fallo inicial antes de T016.
- [ ] T016 [P] [US1] Implementar el formato puro de totales en `frontend/src/components/donaciones/historial.js` y ejecutar `historial.test.js` con el script existente de frontend. **Depende de**: T015. **Origen**: FR-003 y SC-001. **Comprobación**: operar sobre dígitos del texto, sin Number/parseFloat, redondeo o límite individual; todas las pruebas T015 aprobadas. No modificar `frontend/src/lib/formato.js`.
- [ ] T017 [US1] Crear `frontend/src/components/donaciones/HistorialAportaciones.jsx` para solicitar y presentar grupos, filas y totales con componentes comunes. **Depende de**: T011, T016. **Origen**: FR-001–FR-004/FR-006, E1–E3 y contrato de interfaz. **Comprobación**: cliente `api.get`, encabezados anuales, fecha Madrid, modalidad y destino; ID textual como clave, orden del servidor y formato anual exacto. Región de carga accesible y marcadores de filas/grupos; sin paginación, ocultación diferida o corte a 60.
- [ ] T018 [US1] Incorporar en `frontend/src/components/donaciones/HistorialAportaciones.jsx` los estados de sesión, permiso, vínculo y ausencia de datos. **Depende de**: T017. **Origen**: FR-007/FR-008, E5–E8 y PA2.2. **Comprobación**: sin vínculo, explicación y `/donar/vincular` sin afirmar existencia ni hacer POST; vinculado vacío, texto exacto y `/donar`; año sin resultados, aviso específico. Sin sesión, entrada común con retorno; rol incorrecto, aviso sin datos. La carga no se presenta como vacío.
- [ ] T019 [US1] Añadir filtro explícito, eliminación, error/reintento y control de respuestas antiguas en `frontend/src/components/donaciones/HistorialAportaciones.jsx`. **Depende de**: T018. **Origen**: FR-005/FR-008, E4/E8 y R-06. **Comprobación**: validación junto a Año, «Filtrar»/«Todos los años», estado aplicado de la respuesta, carga al cambiar filtro; solicitudes fuera de orden o tras desmontaje no sobrescriben el estado; fallo de red/contrato no muestra éxito, total cero ni resultados del filtro anterior como actuales.
- [ ] T020 [US1] Crear `frontend/src/pages/mis-aportaciones.astro` con Layout e isla `client:load` y activar solo la entrada prevista de donante en `frontend/src/components/comunes/Menu.jsx`. **Depende de**: T019. **Origen**: entrada de US1, FR-001/FR-007 y contrato de interfaz. **Comprobación**: página directa y enlace «Mis aportaciones» alcanzables, título correcto, mismos enlaces/permisos de otros módulos; revisión identifica el ajuste compartido sin cambiar autenticación, cookies, layout o cliente HTTP.

**Revisión de bloque**: página y formato preparados; las comprobaciones visibles y de tiempo se acreditan en el bloque G, no mediante el build por sí solo.

## Fase 3 — US1: banco integrado de navegador · Bloque F

**Objetivo**: comprobar la interfaz con backend y persistencia reales aislados, sin servicios externos.

- [ ] T021 [US1] Ampliar `backend/src/modulos/donaciones/pruebas/historial-local.js` con el arranque de backend propio sobre el esquema de T003, `crearApp`, MemoryStore y login común. **Depende de**: T014, T020. **Origen**: FR-007, E6/E7 y SC-003; quickstart §5. **Comprobación**: configuración sintética del hijo antes de importar pools, sesiones separadas y Usuario cargado por servidor; sin cabeceras que falsifiquen identidad, cron, `.env` en hijos o cambios en `app.js`.
- [ ] T022 [US1] Incorporar al banco `backend/src/modulos/donaciones/pruebas/historial-local.js` el frontend construido, proxy local y limpieza controlada. **Depende de**: T021. **Origen**: E1–E9 y R-08/R-09. **Comprobación**: build standalone en 127.0.0.1:44323 y proxy 44322 con `/api` al backend propio; puertos ocupados provocan parada segura. Arranque oculto en Windows, cierre solo de hijos/conexiones propios y eliminación solo del esquema propio incluso ante error; ningún servicio compartido se detiene.
- [ ] T023 [US1] Añadir al banco `backend/src/modulos/donaciones/pruebas/historial-local.js` el observador de presentación descrito en quickstart, fuera del bundle de producto. **Depende de**: T022. **Origen**: E9, SC-002 y PA2.3. **Comprobación**: inicio de navegación del documento, fin después de 60 filas, cinco grupos y totales correctos sin carga, más dos requestAnimationFrame; detectar pestaña oculta/error, conservar recuentos y duración sin restas ni secretos. La instrumentación no inicia login o fetch previos del historial ni confunde latencia de API con presentación.
- [ ] T024 [US1] Ejecutar las pruebas puras, el build y el arranque/cierre del banco siguiendo `specs/spec-002/quickstart.md`, registrando comandos y resultados en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T023. **Origen**: E1–E9 y prerrequisitos de SC-002/SC-003. **Comprobación**: `npm test -- src/components/donaciones/historial.test.js`, `npm run build` desde frontend y el banco desde backend; comprobar conexión aislada, login real, proxy y limpieza. Todavía no declarar aprobados recorridos o duración sin observarlos.

## Fase 3 — US1: aceptación visible y duración · Bloque G

**Objetivo**: acreditar la historia en navegador, además de sus resultados de API.

- [ ] T025 [US1] Comprobar en navegador menú, acceso directo y privacidad con sesiones separadas sobre el banco `backend/src/modulos/donaciones/pruebas/historial-local.js`; guardar evidencia en `specs/spec-002/refinamiento/validacion-interfaz-01.md`. **Depende de**: T024. **Origen**: FR-007, E6 y SC-003. **Comprobación**: cada cuenta ve solo sus filas; sin sesión o rol se muestran avisos; conocer IDs, correo o referencia y conservar permiso invitado no revela filas de otra persona. Relacionar lo visible con las denegaciones de API de T011, sin sustituirlas por controles solo de menú.
- [ ] T026 [US1] Recorrer contenido y los tres estados vacíos del contrato de `frontend/src/components/donaciones/HistorialAportaciones.jsx`; registrar capturas/observaciones en `specs/spec-002/refinamiento/validacion-interfaz-01.md`. **Depende de**: T025. **Origen**: FR-001–FR-004/FR-006/FR-008 y E1–E3/E5/E7/E8. **Comprobación**: grupos 2026/2025, 20,00/80,00 €, campos y exclusiones; sin vínculo explicación/enlace sin afirmaciones ni solicitud automática; vacío vinculado con texto exacto/enlace para donar; año sin resultados distinto y con quitar filtro. Verificar red y persistencia para ausencia de efectos, sin solicitar enlaces reales innecesarios.
- [ ] T027 [US1] Verificar filtro, errores, carga, respuestas fuera de orden y navegación con teclado de `frontend/src/components/donaciones/HistorialAportaciones.jsx`; guardar evidencia en `specs/spec-002/refinamiento/validacion-interfaz-01.md`. **Depende de**: T026. **Origen**: FR-005/FR-008, E4/E8 y contrato de interfaz. **Comprobación**: aplicar/quitar filtro, año inválido junto al campo, fallo de consulta con reintento y sin falso vacío, dos peticiones con respuesta invertida, desmontaje durante petición y avisos accesibles. Para retrasos/fallos usar interceptación local de prueba y distinguirla de la consulta real; no modificar estados o servicios compartidos.
- [ ] T028 [US1] Contrastar en pantalla fechas Madrid, empates, destinos y sumas grandes del banco; registrar resultados en `specs/spec-002/refinamiento/validacion-interfaz-01.md`. **Depende de**: T027. **Origen**: FR-002–FR-004, E1/E2 y SC-001. **Comprobación**: cambio de año UTC/Madrid, orden numérico BIGINT estable, proyecto inactivo/fondo general y 1.999.999,98 € sin límite individual. Relacionar filas y totales visibles con las comprobaciones exactas T011/T016 y los valores persistidos del fixture.
- [ ] T029 [US1] Verificar el conjunto de rendimiento de `backend/src/modulos/donaciones/pruebas/historial-local.js` antes de medir y registrar controles en `specs/spec-002/refinamiento/medicion-historial-01.md`. **Depende de**: T028. **Origen**: FR-001–FR-003, E9 y SC-001/SC-002. **Comprobación**: cuenta ya identificada/vinculada, exactamente 60 cuotas confirmadas, 12 por año 2021–2025, cinco sumas de 120,00 € y control de 600,00 €; servicios preparados y build identificado. No abrir ni precargar el historial de la sesión medida para preparar el cronómetro.
- [ ] T030 [US1] Ejecutar la medición completa en navegador y conservar resultados en `specs/spec-002/refinamiento/medicion-historial-01.md` con captura y traza asociadas. **Depende de**: T029. **Origen**: E9, SC-002 y PA2.3. **Comprobación**: navegación normal al historial desde otra página, inicio Navigation Timing y fin del observador T023 con 60 filas/grupos/totales presentados; registrar equipo, navegador, caché, duración sin restas, recuentos y contenido. Umbral estricto <2.000 ms; conservar intentos fallidos y distinguir pestaña oculta o medición inválida. No marcar completa por latencia SQL/API, una media o login excluido incorrectamente del punto de inicio.

**Revisión de bloque**: evidencias de interfaz y medición real del navegador disponibles. Si faltan navegador, captura/traza o un tiempo satisfactorio, se documenta el límite y la tarea afectada permanece pendiente.

## Fase 4 — Validación final y documentación · Bloque H

**Objetivo**: reunir las evidencias, comprobar regresión proporcional y preparar revisión sin atribuirla como recibida.

- [ ] T031 Ejecutar la regresión `npm test -- src/modulos/donaciones src/servicios-comunes/correo.test.js --no-file-parallelism` desde backend y registrar resultados en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T030, T014. **Origen**: FR-001–FR-008 y reutilización de HU-01/HU-03. **Comprobación**: base y esquemas exclusivos, Stripe/SMTP simulados, ninguna suite ajena destructiva contra `public`; conservar fallos y causas. Si el árbol no cambió desde una ejecución acreditada del mismo alcance, referenciarla con commit/árbol y comando en lugar de repetirla sin motivo.
- [ ] T032 Comprobar las pruebas de `frontend/src/components/donaciones/historial.test.js`, build y formato Prettier de los archivos tocados; registrar resultados en `specs/spec-002/refinamiento/validacion-local-01.md`. **Depende de**: T031. **Origen**: FR-002–FR-005/FR-008 y convenciones. **Comprobación**: scripts existentes de frontend, build correspondiente al árbol validado y formato común; reutilizar resultados acreditados si no cambió el árbol. Ninguna instalación o actualización nueva para ejecutar formato.
- [ ] T033 Actualizar únicamente lo necesario de `README.md`, `backend/src/modulos/LEEME.md` y `specs/spec-002/quickstart.md` para reflejar rutas, funcionamiento, comandos y aislamiento implementados. **Depende de**: T032. **Origen**: constitución III/IX y contratos HU-02. **Comprobación**: enlaces y comandos reales, retirada de indicaciones prospectivas que ya no correspondan, sin reescribir históricos, reglas de otros módulos ni presentar cambios locales como publicados; preservar las decisiones del plan.
- [ ] T034 Preparar el balance de aceptación en `specs/spec-002/refinamiento/matriz-validacion-01.md` y actualizar solo marcas acreditadas de `specs/spec-002/tasks.md`. **Depende de**: T033. **Origen**: FR-001–FR-008, E1–E9 y SC-001–SC-003. **Comprobación**: cada fila enlaza evidencia concreta y resultado; separar pruebas automáticas, recorrido visible y medición. Contrastar conjunto completo, exactitud fiscal tras reconciliación y autorización; ninguna referencia de matriz sustituye una prueba ni se oculta un fallo pendiente.
- [ ] T035 Preparar el resumen de revisión en `specs/spec-002/refinamiento/revision-tecnica-01.md`, con alcance implementado, cambios del menú, comandos/evidencias, límites y puntos para Javi. **Depende de**: T034. **Origen**: constitución X–XII y dependencia HU-03. **Comprobación**: revisión externa se indica pendiente hasta recibirse, sin publicar PR o comunicarse automáticamente; rama y commits reales identificados, sin secretos. El resumen distingue desarrollo comprobado, diagnóstico posterior y aprobación antes de main.

## Dependencias y bloques de revisión

| Bloque                | Tareas    | Cantidad | Entrada y salida                                         |
| --------------------- | --------- | -------- | -------------------------------------------------------- |
| A — Preparación       | T001–T002 | 2        | Estado real → entorno seguro documentado                 |
| B — Fundamentos       | T003–T004 | 2        | A → fixtures y aislamiento comprobados                   |
| C — Backend           | T005–T012 | 8        | B → GET privado, consistente y probado                   |
| D — Contraste fiscal  | T013–T014 | 2        | C → igualdad con HU-03 después de reconciliar            |
| E — Interfaz          | T015–T020 | 6        | Formato desde B; isla tras T011/T016 → página completa   |
| F — Banco integrado   | T021–T024 | 4        | D y E → servicios propios, observador y build preparados |
| G — Aceptación        | T025–T030 | 6        | F → recorridos visibles y duración acreditados           |
| H — Cierre documental | T031–T035 | 5        | G → regresión, balance y paquete para revisión           |

**Total: 35 tareas.** Preparación: 2; fundamentos: 2; US1: 26; validación final/documentación: 5.

Grafo de orden principal:

```text
A → B → C → D ───────────────────────┐
    └→ T015 → T016 ─┐              │
             T011 ──┴→ T017…T020 ──┴→ F → G → H
```

Cada dependencia individual figura en su tarea y prevalece sobre la representación resumida. En particular, la interfaz puede avanzar después de T011 aunque siga pendiente T012 o el contraste fiscal; el banco integrado espera T014 y T020. No hay dependencias de tareas futuras o ciclos.

### Paralelo permitido

Solo T015 y T016 llevan `[P]`: una vez completada T004, las pruebas y la función pura de frontend pueden avanzar, en su orden T015 → T016, mientras se trabaja en T005–T014 del backend. Se tocan archivos distintos y no se necesita el endpoint para comprobar el formato puro. No son paralelas entre sí.

No se ejecutan suites o bancos simultáneos contra la base de pruebas. Las tareas del mismo `historial.test.js`, los cambios sucesivos de la isla, los del banco y los informes compartidos se realizan secuencialmente para conservar evidencias y evitar conflictos. `[P]` describe una posibilidad de organización, no una instrucción para crear agentes.

## Matriz de trazabilidad funcional

| Requisito | Implementación      | Comprobación y evidencia previstas                                                                  |
| --------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| FR-001    | T008–T010, T017     | T006/T011: todas las modalidades confirmadas y más de 60 sin corte; T026/T029: contenido visible    |
| FR-002    | T008/T009/T017      | T006/T011: Madrid y desempate; T028: grupos y fechas visibles                                       |
| FR-003    | T008/T009/T016/T017 | T006/T011/T012: sumas exactas/consistentes; T014: paridad; T028/T029: formato y contenido visibles  |
| FR-004    | T008/T009/T017      | T006/T011: campos y destinos; T026/T028: presentación                                               |
| FR-005    | T008–T010/T019      | T006/T011: filtros válidos/erróneos; T027: aplicar, quitar y respuestas antiguas                    |
| FR-006    | T008/T009           | T006/T011: estados excluidos; T026: ausencia visible                                                |
| FR-007    | T008–T010/T018      | T005/T011/T012: propiedad, sesión, privacidad y efectos; T025: acceso visible por cuentas separadas |
| FR-008    | T009/T018/T019      | T005/T006/T011: DTO de estados; T026/T027: tres vacíos, enlaces y ausencia de envío automático      |

## Matriz de escenarios de aceptación

Las descripciones siguientes resumen los escenarios vigentes, cuya fuente normativa sigue siendo [spec.md](spec.md).

| Escenario | Criterio de aceptación                                               | Preparación/implementación | Verificación efectiva prevista                                                         |
| --------- | -------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| E1        | 2026: 20,00 €; 2025: 80,00 €; grupos descendentes                    | T003/T008/T009/T016/T017   | T006/T011 y T026: DTO y dos bloques visibles correctos                                 |
| E2        | Fecha, importe, modalidad y destino o fondo general                  | T008/T009/T017             | T006/T011 y T026/T028: campos visibles, Madrid y precisión                             |
| E3        | No mostrar pendientes, rechazadas o canceladas                       | T008/T009                  | T006/T011 y T026: mezcla controlada excluida de la vista                               |
| E4        | Filtrar por 2025                                                     | T008–T010/T019             | T006/T011 y T027: solo filas de 2025 y quitar filtro                                   |
| E5        | Vinculado sin confirmadas: mensaje exacto y enlace para donar        | T009/T018                  | T006/T011 y T026: estado global vacío, texto y enlace                                  |
| E6        | Denegar historial ajeno incluso con su identificador                 | T008–T010/T018             | T005/T011 y T025: propiedad en servidor y sesiones separadas                           |
| E7        | Sin vínculo: explicación/enlace sin datos ni verificación automática | T009/T018                  | T005/T006/T011 y T026: red, DTO, persistencia y pantalla sin efecto automático         |
| E8        | Año vacío distinto de historial vacío, con quitar filtro             | T009/T018/T019             | T006/T011 y T026/T027: años disponibles preservados y aviso específico                 |
| E9        | 60 cuotas/cinco años con filas, grupos y totales visibles en <2 s    | T003/T017/T021–T023        | T029: control exacto del conjunto; T030: navegador, duración completa, captura y traza |

## Matriz de criterios de éxito

| Criterio | Acreditación prevista                                                                                                                                                                         | Límite de interpretación                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-001   | T006/T011: sumas anuales y suma global de control mediante cálculo exacto independiente; T012: instantánea; T014: paridad tras reconciliar; T016/T028: representación sin pérdida de céntimos | No aplicar máximo individual ni convertir sumas a flotante; el certificado anterior a reconciliación no es una comparación equivalente                                 |
| SC-002   | T029 y T030 sobre fixtures de T003 y build/banco de T024                                                                                                                                      | Incluye página, recursos, hidratación, datos y presentación; excluye login/vinculación previos; conserva fallos, sin reconstruir duración desde timestamps de servidor |
| SC-003   | T005/T011 y T025: ausencia de autorización por correo, ID, referencia o permiso invitado; solo Usuario autenticado y vínculo persistido                                                       | Una interfaz que oculte enlaces no sustituye la comprobación de propiedad del backend                                                                                  |

T034 verifica la cobertura completa de las tres matrices con resultados obtenidos, no solo sus referencias. T035 prepara revisión; no sustituye analyze, converge o aprobación externa.

## Estrategia de entrega

El incremento mínimo funcional es US1, única historia de esta especificación. Los bloques A–H permiten revisar y registrar cambios pequeños por separado durante implementación. Backend sin interfaz, formato puro o build aislado son incrementos revisables, pero no constituyen HU-02 terminada. La aceptación exige el contraste fiscal previsto, los recorridos de interfaz y la medición completa satisfactoria.

Los comandos de validación y sus directorios son los del quickstart: Vitest dirigido y regresión desde backend; `node --test` mediante npm y build desde frontend; banco local solo cuando esté implementado. No se necesitan pruebas reales de Stripe para una consulta de aportaciones confirmadas sintéticas. Ante una brecha se conserva su evidencia y se revisa el alcance de corrección; no se oculta mediante marcas de tarea o cambios de criterio.

## Procedimiento y comprobaciones de generación

Se siguió el [procedimiento local de speckit-tasks](../../.claude/skills/speckit-tasks/SKILL.md), al no estar registrado `/speckit-tasks` como herramienta. Se comprobó la selección temporal de `specs/spec-002` mediante `check-prerequisites.ps1 -Json -PathsOnly` y se resolvió la plantilla local. No se ejecutó `setup-tasks.ps1`, porque llama a la resolución de funcionalidad sin `NoPersist`; sus entradas se obtuvieron en lectura sin guardar selección.

Los hooks `before_tasks` y `after_tasks` de `.specify/extensions.yml` son commits opcionales y se omiten. La generación se limita a este archivo; conserva los seis documentos de plan pendientes de commit, clarify, secretos, configuración e históricos. No se ejecutan pruebas funcionales ni se inicia analyze o implementación.

## Ejecución de T001–T014 · 2026-11-10

Base de implementación: `24282d5`, que registra los documentos anteriores. Se conservan la evidencia de generación y el primer analyze como históricos.

Resultados y comandos reales: [validacion-local-01.md](refinamiento/validacion-local-01.md) y [validacion-fiscal-01.md](refinamiento/validacion-fiscal-01.md). La entrega acredita fixtures aislados, backend privado consistente y paridad con HU-03 tras reconciliación. Se conservan el fallo inicial del fixture, la fase roja funcional y el fallo de preparación del reloj en la primera regresión. El resultado final es 38 pruebas dirigidas HU-02 y 159 pruebas de regresión aprobadas, con PostgreSQL aislado y adaptadores simulados.

Para la regresión que incluye cuotas de HU-01 debe retirarse AHORA_SIMULADO solo del proceso de pruebas, porque esa suite construye previsiones con el reloj real. El contraste fiscal inyecta su propio reloj. La precisión se documenta en la evidencia local; no se altera `.env` ni el código de otros módulos.

No se ejecuta ni se marca T015 o ninguna tarea posterior por extensión. Los estados visibles, formato anual de frontend y SC-002 siguen pendientes; no se declara HU-02 terminada ni revisada por Javi.
