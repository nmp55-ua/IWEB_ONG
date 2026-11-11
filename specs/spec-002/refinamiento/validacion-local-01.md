# Validación local de HU-02 — T001–T014

**Fecha**: 2026-11-10 · **Rama**: `spec-002` · **Base**: `24282d5e2d558b84ae88236291809fb5fff3e155`

**Responsable**: Nada · **Revisor**: Javi

## Preparación — T001/T002

El estado inicial contiene únicamente `.claude/launch.json` sin seguimiento y el índice vacío. El commit `24282d5` registra plan, tareas y primer analyze; se conservan todos esos documentos e informes. La selección temporal mediante `check-prerequisites.ps1 -Json -PathsOnly` resuelve `specs/spec-002` sin escribir configuración.

Se aplica el procedimiento local `speckit-implement` directamente, al no estar registrado como herramienta, limitado a T001–T014. El checklist requirements contiene 16 marcas y cero pendientes; no se modifica. El hook anterior de commit es opcional y se omite; no hay un hook posterior de implementación configurado. Las exclusiones Git protegen `.env`, node_modules y dist. El formato se aplicará por rutas explícitas, sin crear o modificar configuración de herramientas.

Comandos iniciales: `git branch --show-current`, `git rev-parse HEAD`, `git status --short`, `git diff --cached --name-only`, `node --version`, `npm --version` y `npm ls --depth=0` desde backend. Resultados: Node 22.20.0, npm 10.9.3; dependencias instaladas disponibles, incluidos Vitest 2.1.9, Supertest 7.3.1, pg 8.23.1 y Stripe 17.7.0. No se necesita instalación ni se actualizan lockfiles.

La conexión se deriva de DATABASE_URL en un proceso hijo que lee `.env`, sustituyendo únicamente la base por `ong_test_hu01`; su salida se captura sin imprimirla. DATABASE_URL y TEST_DATABASE_URL quedan iguales solo en los procesos de pruebas. Las claves de sesión/Stripe/webhook son sintéticas; SMTP usa un doble de prueba. No se sobrescribe `.env` ni se cargan sus secretos en la suite.

La primera consulta de identidad de PostgreSQL falla con `EACCES` por la restricción de conexión del entorno de ejecución. No es un fallo funcional de HU-02. Se repite con permiso de conexión: salida correcta, `current_database() = ong_test_hu01`, PostgreSQL 16.15. No se crean ni vacían bases. Las migraciones existentes se ejecutarán exclusivamente en esquemas aleatorios propios mediante el soporte vigente.

## Registro de ejecución

Primera ejecución de `npm test -- src/modulos/donaciones/historial.test.js --no-file-parallelism` desde backend: preparación fallida, cinco casos omitidos por fallo de beforeAll. Causa: el nuevo fixture de correo no incluía `resumen`, obligatorio en la migración vigente. Se conserva el diagnóstico: `null value in column "resumen" of relation "correos_aportacion" violates not-null constraint`. Es un defecto del fixture, no una fase roja funcional ni una incompatibilidad del contrato. Se corrige solo el fixture para respetar el esquema, sin modificar migraciones o guardas; no se dan esas cinco pruebas por realizadas.

Segunda ejecución del mismo comando: **5/5 aprobadas**, código 0, duración Vitest 5,53 s. Se comprueban migraciones en esquema exclusivo, conjunto de 60 cuotas y cinco totales, BIGINT, correo fallido, rechazo de conexión incorrecta y eliminación solo del segundo esquema propio. La importación del módulo de fixtures no arranca servidores.

## Pruebas previas al backend — T005–T007

Se añaden casos sobre la aplicación Express real, sesión MemoryStore y login/middleware comunes. El módulo de conexión se redirige al pool del esquema propio; Stripe y SMTP se sustituyen por funciones de prueba.

Tercera ejecución del mismo comando, **antes de modificar producción**: **5 aprobadas y 31 fallidas de 36**, código 1, duración Vitest 10,26 s. Causas funcionales esperadas: el GET todavía devuelve 404 en vez de los resultados/códigos de su contrato y `servicio(...).historial is not a function` en las pruebas directas de transacción. Se conserva esta fase roja separada del fallo de fixture inicial. No hay fallos de conexión o preparación en esta ejecución.

## Backend privado y consistente — T008–T012

Se añaden la consulta de repositorio y la composición de servicio, el controlador y la ruta GET `/api/yo/aportaciones`. El propietario procede del middleware común; la proyección no expone datos fiscales o identificadores Stripe. La ruta fija cabeceras privadas antes de exigir rol. El filtro valida un año único y rechaza claves desconocidas; no exige token CSRF u origen para esta consulta de solo lectura.

Cuarta ejecución del mismo comando: **36/36 aprobadas**, código 0, duración Vitest 9,28 s. Se comprueban login/sesiones comunes, cuenta desactivada, rol incorrecto, cuentas distintas, falta de vínculo pese a correo coincidente y permiso invitado válido, 401/403/400/404, cabeceras privadas y todos los campos de la proyección.

Las consultas devuelven solo confirmadas, sin depender del estado de suscripción o correo. Se verifican 2026/2025 y 20,00/80,00 €, destino inactivo/fondo general, límites de año Madrid, ID `9007199254740993` sin pérdida, suma 1.999.999,98 € sin límite individual, suma global independiente mediante NUMERIC/BigInt, 60 cuotas y un historial de 61 filas sin corte.

La prueba concurrente usa un wrapper exclusivo de pruebas sobre una conexión real: tras obtener el resumen, otra conexión confirma la aportación sintética pendiente antes del detalle. La primera respuesta conserva 7,00 € y una fila; la siguiente devuelve 9,00 € y dos. Se comprueban el orden BEGIN → configuración de aislamiento, `repeatable read`/`read only`, COMMIT y liberación. Otra prueba inyecta un fallo SQL, comprueba ROLLBACK/liberación y posterior modo de lectura normal. No se añaden hooks o esperas al código de producción.

GET repetidos conservan íntegramente los registros sintéticos de usuarios, donantes, aportaciones, suscripciones, operaciones, eventos, verificaciones, correos y certificados. Los espías de Stripe y SMTP no registran llamadas. La prueba de permisos invitados verifica antes que el permiso sintético es válido para una aportación concreta mediante el ayudante real de HU-01; ese permiso no concede historial.

Esta ejecución acredita backend y persistencia aislados, no estados visibles en navegador, formato anual de interfaz o SC-002. T015 y siguientes permanecen fuera de este bloque.

## Contraste fiscal y regresión adicional

Al añadir la prueba fiscal y el caso HTTP 500, la suite dirigida devuelve **38/38 aprobadas**, código 0 y duración 13,57 s. El contraste se detalla en [validacion-fiscal-01.md](validacion-fiscal-01.md).

Por los cambios en rutas, servicio y repositorio de HU-01 se ejecuta una regresión acotada, sin la suite de migraciones o suites ajenas:

```powershell
# Desde backend, con las variables exclusivas de pruebas ya seleccionadas.
npm test -- src/modulos/donaciones/historial.test.js src/modulos/donaciones/rutas.test.js src/modulos/donaciones/registro.test.js src/modulos/donaciones/eventos.test.js src/modulos/donaciones/cuotas.test.js src/modulos/donaciones/servicio.test.js src/modulos/donaciones/confirmaciones.test.js src/servicios-comunes/correo.test.js --no-file-parallelism
```

Primera ejecución: **158 aprobadas y 1 fallida de 159**, siete archivos aprobados y uno fallido, código 1, duración Vitest 41,15 s. Falla únicamente HU-01/S12 en `cuotas.test.js`: `expected null not to be null`, al esperar una previsión futura.

Causa comprobada en código: la preparación de quickstart fija globalmente `AHORA_SIMULADO=2026-11-10T12:00:00Z`, mientras que esa prueba construye `next_payment_attempt` mediante `Date.now()+3600s`. En esta ejecución el reloj real era aproximadamente 01:23Z; para el reloj fijo la previsión ya había vencido. No es una regresión del cálculo de HU-01 ni se modifica su prueba o reglas para evitarla.

Se retira AHORA_SIMULADO únicamente del proceso de la nueva ejecución, conservando intactos `.env` y la configuración local. El contraste fiscal ya inyecta su propio reloj de 2026, por lo que no necesita alterar el reloj global. Para reproducir esta regresión, después de seleccionar las variables del quickstart:

```powershell
Remove-Item Env:AHORA_SIMULADO -ErrorAction SilentlyContinue
```

Esta precisión sobre la preparación del comando se conserva aquí; no se reescriben el plan ni los informes históricos y no se dan por ejecutadas tareas posteriores de documentación o validación final.

Repetición del comando dirigido tras retirar el reloj global: **159/159 aprobadas**, ocho archivos aprobados, código **0**, duración Vitest **49,28 s**. Desglose: historial 38, cuotas 38, servicio 24, rutas 12, eventos 21, correo 16, registro 3 y confirmaciones 7. El mensaje `No se aceptó el correo de verificación de donaciones` pertenece al caso de fallo SMTP simulado de la suite de rutas, que termina aprobado.

El contraste incluye la aplicación real registrada y la repetibilidad de semillas en otro esquema exclusivo, según las pruebas existentes de registro. No se ejecuta la suite global, la de migraciones ni pruebas de otros módulos que puedan vaciar tablas compartidas. Esta regresión se realiza para los cambios de T008–T010; no completa por extensión T031 o tareas posteriores.

## Resultado y límites de la entrega

T001–T014 quedan acreditadas por las comprobaciones anteriores y el informe fiscal. T015–T035 permanecen pendientes. No se crean pantallas, no se modifica el menú, no se hacen nuevos pagos, reenvíos o envíos SMTP reales y no se acredita recepción de correo. No hay cambios en migraciones, autenticación, roles, cookies, app.js, módulos de compañeros, configuración o secretos.

Prettier aprueba los nueve archivos del bloque con la configuración existente; `git diff --check` no detecta errores. Los avisos de conversión LF/CRLF de Git son informativos y no se modifica su configuración. Los enlaces locales de tareas e informes son válidos.

La comparación SHA-256 de 353 archivos iniciales detecta cambios únicamente en controlador, rutas, servicio, repositorio de donaciones y tasks.md. El resto, incluidos `.env`, `.claude/launch.json`, `.specify/feature.json`, migraciones, módulos ajenos y todos los históricos, permanece intacto. La rama/HEAD siguen en `spec-002`/`24282d5`; el índice está vacío y no se hacen commits.

## Preparación de interfaz y banco — T015–T024

Nueva entrega sobre `ca172ffecca737df6d96567bc2904f8cfe9b053c`, en `spec-002`; T001–T014 están registradas y no se repiten. Al inicio solo `.claude/launch.json` está sin seguimiento, el índice está vacío y el checklist conserva 16/16. Se aplica el procedimiento local de implementación dentro del bloque autorizado, selección temporal sin persistencia y sin hooks opcionales de commit. La evidencia de los bloques anteriores se conserva íntegra.

T015: se escriben primero los casos del formato anual. Desde frontend se ejecuta `npm test -- src/components/donaciones/historial.test.js`. Primera ejecución: código 1, un archivo fallido por `ERR_MODULE_NOT_FOUND` de `historial.js`, aún no implementado; cero casos aprobados. Es la fase roja inicial de este bloque, sin instalación ni conexión de base. Se implementa después el formateador mediante dígitos del texto, sin Number, parseFloat, redondeo o límite individual.

Segunda ejecución: **20/20 aprobadas**, código 0. Incluye 80,00 €, 1.999.999,98 € y textos decimales mayores que el rango seguro de Number; las entradas incorrectas provocan error, sin convertirse en cero.

Se añaden seis regresiones puras para la coordinación que utilizará la isla. Antes de implementarla, el comando devuelve **20 aprobadas y 6 fallidas**, código 1: faltan `crearConsultasHistorial` y `validarRespuestaHistorial`. Tras implementar esos ayudantes y conectarlos a React, devuelve **26/26 aprobadas**, código 0. Se comprueban respuesta antigua y error antiguo después de una petición nueva, invalidación al desmontar, reintento del mismo filtro y rechazo de respuestas monetarias o DTO incorrectos. Estas pruebas son de lógica pura, no recorridos de navegador.

### Interfaz implementada — T017–T020

La página `/mis-aportaciones` usa Layout e isla React, componentes comunes y el cliente api.get. Incluye carga, permisos, tres estados sin datos, enlaces existentes, filtro con validación junto al campo, retirada y reintento. Al cambiar la consulta desaparecen los datos anteriores; el filtro permanece disponible para una cuenta vinculada. El gestor invalida las respuestas antiguas y las que llegan después del desmontaje. La suma anual se presenta mediante texto exacto; las fechas e importes individuales reutilizan los servicios comunes.

La única modificación compartida es descomentar la entrada reservada de donante «Mis aportaciones» en Menu.jsx; el diff conserva el resto de enlaces y permisos. No se modifica autenticación, cookies, cliente HTTP, formateador común o módulos ajenos.

Desde frontend se ejecuta `npm run build` con ASTRO_TELEMETRY_DISABLED limitado al proceso: código **0**. El build inicial termina en **11,97 s** según Astro; después de los últimos ajustes de la isla se repiten las 26 pruebas puras y el build, ambos con código **0**, build final **7,19 s** según Astro. Las duraciones de build no miden la presentación del historial.

### Banco integrado — T021–T024

Se amplía `backend/src/modulos/donaciones/pruebas/historial-local.js` sin cambiar sus fixtures de T003. Importarlo sigue sin abrir conexiones ni arrancar servicios. La ejecución de banco exige NODE_ENV=test y DATABASE_URL/TEST_DATABASE_URL iguales para ong_test_hu01; usa el soporte existente para su esquema aleatorio. Arranca un backend hijo con configuración sintética antes de importar los pools, `crearApp`, MemoryStore y login/middleware reales. No simula identidad mediante cabeceras.

Los adaptadores se sustituyen únicamente en ese hijo con `node:test.mock.module`, activado con `--experimental-test-module-mocks`, comprobado sobre Node 22.20.0. Se ha contrastado la interfaz `namedExports` y su carácter experimental en la [documentación oficial de Node 22.20.0](https://nodejs.org/download/release/v22.20.0/docs/api/test.html#mockmodulespecifier-options). No se añaden dependencias ni se cambia app.js. Los contadores verifican cero invocaciones a Stripe/SMTP; el proxy bloquea operaciones fuera de la consulta y autenticación del banco.

El banco sirve el build standalone de Astro en 127.0.0.1:44323 y el proxy en 44322, con API al backend propio. Reserva y comprueba los puertos, se niega a usar uno ocupado y no detiene procesos por número de puerto. Los hijos se crean ocultos en Windows. Su cierre detiene exclusivamente hijos y conexiones propios, elimina solo su esquema y libera puertos; la limpieza también se comprueba ante fallo al arrancar Astro.

El observador se inyecta antes de terminar el head únicamente al abrir `/mis-aportaciones?medir=1` en el banco. El producto no incluye esa instrumentación. Espera 60 filas únicas, cinco grupos 2025–2021, doce fechas mensuales por grupo, importes de 10,00 €, modalidad/destino y totales de 120,00 € correctos y no ocultos. Usa el inicio de navegación y dos requestAnimationFrame antes del fin; conserva intentos inválidos, falta de contenido, pestaña oculta o umbral no cumplido. `window.__hu02Medicion` conserva los datos y señala la revisión visual pendiente. Ninguna prueba simulada de ese observador se considera una medición real.

Se añade `backend/src/modulos/donaciones/historial-banco.test.js`, acotado al soporte propio. Primera ejecución desde backend:

```powershell
npm test -- src/modulos/donaciones/historial-banco.test.js --no-file-parallelism
```

Resultado inicial: **4/4 fallidas**, código 1, por `crearBancoHistorial is not a function`, antes de implementar el banco. Después: **4/4 aprobadas**, código 0, duración Vitest **12,44 s**. Se amplía la regresión para comprobar expresamente la desaparición del esquema tras fallo y probar el observador con un DOM y reloj ficticios: resultado final **9/9 aprobadas**, código **0**, duración Vitest **11,82 s**.

La prueba de ciclo completo verifica HTTP 200 de la página SSR y un asset construido, instrumento solo bajo el parámetro de pruebas, 401 sin sesión, login real y consulta de tres aportaciones con sumas 20.00/80.00. Comprueba bloqueo de POST de pago, contadores Stripe/SMTP a cero, procesos terminados, esquema eliminado, puertos reutilizables y cierre repetido sin efectos. Los casos de puertos ocupados conservan el servidor de prueba previo. Las comprobaciones HTTP/SSR no acreditan hidratación o avisos visibles en navegador.

### Formato y límites de esta entrega

Se ejecuta Prettier con la configuración existente sobre las rutas explícitas. El primer comando devuelve código 1 únicamente porque no puede inferir parser para `mis-aportaciones.astro`; sí procesa los archivos JS/JSX. La plantilla Astro se revisa manualmente respecto a las páginas existentes y se compila en el build final. No se instala un plugin ni se modifica configuración por ese motivo. La comprobación final de Prettier se limita a los formatos compatibles y la página Astro conserva esta limitación explícita.

No se realizan pagos, altas reales, envíos o reenvíos ni se ejecutan suites antiguas ya acreditadas sin necesidad. AHORA_SIMULADO no se transmite a los procesos hijos del banco; para las pruebas con reloj real se retira únicamente de su proceso de ejecución, siguiendo la precisión del bloque anterior. Los recorridos visibles T025–T028 y la preparación/medición T029–T030 permanecen pendientes. El build, HTTP y el DOM ficticio no sustituyen esas evidencias.

Comprobación adicional del comando de banco desde backend:

```powershell
node src/modulos/donaciones/pruebas/historial-local.js --comprobar
```

Resultado real: código **0**, mensaje `Banco preparado: build, proxy, login y consulta aislada correctos.` El comando termina cerrando sus recursos; no abre navegador ni toma una medición. Para el siguiente bloque, el comando sin `--comprobar` mantiene el banco activo y muestra únicamente URL local y cuentas/contraseña sintéticas de fixtures. Se usa la misma preparación de conexión exclusiva; no se imprimen claves o secretos de `.env`.

T015–T024 quedan completadas con ese alcance: formato y coordinación puros, interfaz implementada/compilada y banco integrado comprobado por HTTP. T025 y siguientes permanecen pendientes, incluida toda observación visible o aceptación del límite de dos segundos. Los commits anteriores y los informes históricos permanecen intactos; esta sección amplía la evidencia local sin reemplazar resultados anteriores.

Comprobación final: Prettier aprueba los ocho archivos JS/JSX/Markdown del bloque, con la limitación Astro anterior; `git diff --check` no detecta errores y los enlaces locales son válidos. La comparación de 357 archivos iniciales detecta únicamente cuatro modificaciones previstas: banco existente, Menu.jsx, tasks.md y este informe. Los cinco archivos nuevos son la isla, sus funciones y pruebas puras, la página Astro y la suite del banco. El contenido de este informe anterior a la nueva sección se conserva íntegramente. `.env`, `.claude/launch.json`, selección de funcionalidad, migraciones, documentos de diseño, módulos ajenos y demás históricos permanecen intactos. Rama/HEAD: `spec-002`/`ca172ff`; índice vacío, sin acciones Git de escritura.

## Validación final y preparación de revisión — T031–T035 · 2026-11-10

Base de esta entrega: **0cc28b1e44a1d932cf1da61cdc869883652693c4**, rama spec-002, con T001–T030 registradas. El árbol seguido estaba limpio; se conservan .claude/launch.json, output/ y tmp/ sin seguimiento. No se repiten sus bloques, commits o navegaciones. La selección temporal mediante SPECIFY_FEATURE_DIRECTORY/SPECIFY_FEATURE y `check-prerequisites.ps1 -Json -PathsOnly` resuelve specs/spec-002 sin persistir configuración. Checklist requirements: 16 marcadas, cero pendientes.

Se aplica el procedimiento local de implementación limitado a estas cinco tareas. El comando no está registrado como herramienta; se usa directamente su SKILL.md. La comprobación se adapta con PathsOnly y validación directa de spec, plan y tasks para evitar la escritura de selección del modo general. Los hooks de Git antes/después son opcionales y no se ejecutan. El alcance no incluye converge ni revisión externa.

### T031 — regresión backend nueva

Se revisan las protecciones del soporte y de migraciones antes de ejecutar: DATABASE_URL y TEST_DATABASE_URL iguales, destino ong_test_hu01 y esquema propio. Las suites de donaciones usan esquemas aleatorios, procesos y adaptadores de pruebas. La de migraciones comprueba además el inventario de public antes/después; no se ejecuta una suite ajena contra tablas compartidas. No se activa cron fiscal ni se ejecuta la CLI de certificados.

Desde backend, con conexión exclusiva y secretos sintéticos seleccionados según quickstart, se ejecuta:

```powershell
Remove-Item Env:AHORA_SIMULADO -ErrorAction SilentlyContinue
npm test -- src/modulos/donaciones src/servicios-comunes/correo.test.js --no-file-parallelism
```

Resultado nuevo: **442/442 pruebas aprobadas, 15 archivos, código 0, duración Vitest 71,91 s**. [Salida completa](evidencias-finales-01/regresion-backend.txt). Desglose: migraciones 68, cuotas 38, servicio 24, rutas 12, historial 38, pasarela 37, eventos 21, autorización 35, texto de correo 26, banco de historial 9, correo común 16, registro 3, confirmaciones 7, normalización 102 y validación local 6.

No hay ejecución funcional fallida nueva en este bloque. El mensaje de rechazo de correo de verificación es stderr del caso SMTP simulado de rutas, que termina aprobado. Las fases rojas y el primer fallo de preparación del reloj de entregas anteriores se conservan arriba; no se presentan como fallos nuevos ni se borran. AHORA_SIMULADO se retira solo de este proceso para las previsiones construidas con Date.now; el contraste fiscal inyecta su propio reloj de 2026. .env y el reloj del sistema permanecen intactos.

Los 38 casos de historial incluyen privacidad, ocho FR, 60 cuotas y un conjunto mayor sin truncar, fechas Madrid, orden BIGINT, sumas exactas, instantánea concurrente, errores/liberación y ausencia de efectos. El contraste de servicios reales de HU-03 vuelve a acreditar igualdad posterior a reconciliación, incluida una confirmación tardía; no se modifica ese módulo. Esta ejecución no prueba pagos de Stripe, recepción SMTP real o un cron desplegado.

### T032 — frontend, build y formato

Desde frontend:

```powershell
npm test -- src/components/donaciones/historial.test.js
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm run build
```

Pruebas: **26/26 aprobadas**, código 0, duración del ejecutor **210,10 ms**; [salida](evidencias-finales-01/pruebas-frontend.txt). Son funciones puras: formato exacto sin flotantes, DTO inválido, filtros/reintentos y respuestas desordenadas/desmontaje. No se presentan como DOM de navegador.

Build: código **0**, Astro **11,08 s**; [salida](evidencias-finales-01/build-frontend.txt). Se reconstruye con el código de 0cc28b1, sin cambios funcionales posteriores. La medición de T030 conserva su build y traza propios; los hashes se contrastan sin repetir la navegación. El build incluye páginas de la aplicación completa, pero no acredita casos de aceptación de otras historias.

El nuevo entry.mjs tiene SHA-256 `9DD2042E7E2D1F330ED7D09F2A6372ED83BB19C440B4D5EB52480EBBA6EEE58C`, distinto del artefacto medido en T030 (`40598C4CBE40217E5FCD8C2B1A29543557D0FF990EBF168AB36E64416B4E50AB`). No se afirma identidad binaria ni se atribuye a este build una medición no ejecutada. La isla fuente conserva SHA-256 `79AFE5C1C27EB655736CA40008EA69CB3C7353DF47EDBC78F279B0631F094030`; se reutiliza aceptación del mismo código de 0cc28b1, con el artefacto original identificado en su informe.

Prettier se ejecuta desde el binario ya instalado en la caché local, con .prettierrc.json y rutas explícitas, sin instalaciones o cambios de configuración. Se comprueban archivos JS/JSX de HU-02 y la documentación actualizada. La página Astro se verifica mediante build y lectura; se mantiene la limitación documentada del parser sin instalar un plugin. El resultado de formato y enlaces se registra al finalizar este apartado.

### T033–T035 — documentación y balance

README, LEEME de módulos y quickstart reflejan la consulta implementada, rutas, estados, comandos reales y aislamiento. El quickstart retira el reloj global, explica banco/medición actuales y referencia resultados conservados. Plan, investigación y encabezados de contratos expresan el estado en rama y mantienen decisiones, datos y procedencia metodológica. No se realiza una limpieza general de otras historias ni se cambian requisitos funcionales.

La [matriz](matriz-validacion-01.md) contrasta **8/8 FR, 9/9 escenarios y 3/3 SC**. Se reutilizan exclusivamente las evidencias visibles y de duración de 0cc28b1, con código funcional y observador sin cambios: [interfaz](validacion-interfaz-01.md), [contraste fiscal](validacion-fiscal-01.md) y [T030](cierre-t030-01.md). SC-002: **638,20 ms**, 60 cuotas y cinco grupos correctos en su entorno; también se mantienen 2.745,30 ms, el intento inválido y 4.258,90 ms. No se hace una media ni se atribuye causalidad única de la mejora a memoria, SQL o render.

El [paquete para Javi](revision-tecnica-01.md) reúne alcance, commits reales, cambios mínimos de menú, comandos y límites. Identifica propuestas editoriales sobre referencias operativas de los informes históricos **sin aplicarlas**; el texto anterior de este informe se conserva íntegro. Preparar la revisión no acredita que Javi la haya realizado ni que estos ajustes estén publicados.

Converge, revisión externa e integración permanecen pendientes. T031–T035 solo se marcan por sus comprobaciones técnicas/documentales; no se declara HU-02 terminada. Sin pagos, reenvíos, mensajes, instalaciones, git add, commits, push, merge o cambios de rama.

### Comprobaciones finales del bloque

Prettier aprueba **26 archivos JS/JSX/Markdown** de rutas explícitas, con la configuración común y sin instalación: [salida de formato](evidencias-finales-01/formato.txt). La página Astro se mantiene fuera de ese parser y está compilada correctamente en el build. Los enlaces locales comprobados de los once documentos de cierre tienen destino existente; las referencias a archivos de evidencia se contrastan además con sus resultados, sin hacer nuevas consultas externas.

Una consulta de solo lectura verifica PostgreSQL 16.15, base ong*test_hu01 y cero esquemas hu01*\* restantes. Las pruebas de migraciones comprueban conservación del inventario de public; los tests de GET y los balances visibles anteriores acreditan ausencia de efectos con su alcance, sin afirmar una auditoría global de bases.

Se comprueba que el texto anterior de este informe es prefijo íntegro del nuevo, normalizando únicamente CRLF para la comparación. La revisión de huellas iniciales/finales y el diff delimitan los cambios a documentación autorizada, sin modificar código, migraciones, secretos o configuración. El índice permanece vacío. Los ficheros de output/, tmp/ y .claude/launch.json se mantienen fuera del bloque y no se seleccionan.

Resultado de preservación: **411 archivos comparados**, con cambios solo en README, LEEME de módulos, plan, investigación, quickstart, dos contratos, tasks y el apartado nuevo de este informe. Se verifican **123 enlaces locales**, sin destinos ausentes. Los dos informes nuevos son matriz-validacion-01.md y revision-tecnica-01.md; las cuatro salidas nuevas están en evidencias-finales-01. T031–T035 quedan marcadas por su alcance, con converge y revisión externa expresamente pendientes.
