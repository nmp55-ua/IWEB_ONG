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
