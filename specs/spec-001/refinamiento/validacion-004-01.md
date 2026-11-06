# Validación de la entrega temprana 004 — HU-01

**Rama**: spec-001 · **Fecha**: 2026-11-06  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance ejecutado**: T001–T005. T006 y las tareas posteriores permanecen pendientes.  
**Resultado**: Validación local de persistencia superada. No acredita revisión de Rubén,
incorporación compartida, funcionamiento completo de HU-01 o integración Stripe.

## Procedimiento y contexto

Se sigue la definición local de
[speckit-implement](../../../.claude/skills/speckit-implement/SKILL.md), al no estar registrado
el comando en la sesión. Se limita expresamente a T001–T005. La selección de
specs/spec-001 se comprueba con check-prerequisites.ps1 -Json -PathsOnly y una variable
SPECIFY_FEATURE_DIRECTORY limitada al proceso, sin persistir feature.json.
Los hooks opcionales de commit se omiten. No se cambia de rama ni se altera el índice de Git.

| Comprobación inicial | Resultado |
|---|---|
| Rama / referencia Git | spec-001 / bdd6476. |
| Checklist requirements.md | 16 elementos, 16 marcados, 0 pendientes; no se modifica. |
| Documentación ya preparada en Git | Se conserva; no se crea commit ni se vuelve a añadir al índice. |
| .env / 004 antes del bloque | No existían. |
| Ficha / informe de esta entrega | No existían; se crean sin sobrescribir evidencias. |
| Contenedores / volúmenes al consultar Docker | Ninguno; la preparación crea los servicios y el volumen del proyecto, sin eliminar recursos. |

Fuentes: [modelo común](../../modelo-datos.md), [plan común](../../plan-comun.md),
[plan de HU-01](../plan.md), [tareas](../tasks.md) y
[ficha de revisión](revision-tecnica-01.md). Los informes de clarify, analyze-1,
analyze-2 y el registro de hallazgos permanecen intactos.

## Entorno preparado — T002

| Elemento | Resultado observado |
|---|---|
| Node.js / npm | 22.20.0 / 10.9.3. |
| Dependencias backend | npm --prefix backend ci: código 0; 279 paquetes instalados. |
| Dependencias frontend | npm --prefix frontend ci: código 0; 406 paquetes instalados. |
| Lockfiles y manifiestos | Huellas idénticas a las capturadas antes de la instalación. |
| Docker CLI / motor | 29.9.2 / 29.9.2. Se usa la ruta absoluta suministrada. |
| PostgreSQL | 16.15 (Debian 16.15-1.pgdg13+2), usuario ong. |
| Base exclusiva | ong_test_hu01, separada de ong; existencia y nombre real comprobados antes de las pruebas. |
| Publicación local | 127.0.0.1:5440. El puerto 5432 pertenece al PostgreSQL de Windows y se conserva sin cambios. |
| Mailpit | Servicio iniciado; SMTP 1025 y bandeja 8025. No se envían correos en este bloque. |
| .env | Creado desde la plantilla con contraseña de base, secreto de sesión y contraseña de semillas aleatorios; Stripe permanece vacío. Git lo ignora y no está en el índice. |

Los primeros intentos de npm con acceso restringido fallan con «Exit handler never called».
Los reintentos con acceso de descarga terminan correctamente desde los mismos lockfiles.
Docker necesita localizar docker-credential-desktop; su carpeta se añade únicamente al
PATH de ese proceso. No se cambia el PATH global ni se modifica Compose.

La primera conexión local al puerto 5432 devuelve 28P01. Se comprueba que el contenedor
y .env tienen contraseñas coincidentes y que PostgreSQL funciona dentro del contenedor.
La consulta de los puertos identifica otro postgres de Windows en 5432. Se comprueba que
5440 está libre, se ajusta solo el .env recién creado y se recrea el contenedor con su mismo
volumen. La conexión desde Node a ong_test_hu01 en 5440 queda verificada. El acceso
restringido a ese puerto devuelve EACCES; la ejecución autorizada confirma la conexión.
No se cambian credenciales, servicios o bases del PostgreSQL de Windows.

La auditoría automática de npm ci informa de dependencias con avisos: backend, 13
(5 moderados, 5 altos, 3 críticos); frontend, 7 (2 bajos, 4 altos, 1 crítico).
Son resultados de la instalación, sin análisis de explotabilidad ni corrección de
dependencias en este bloque. No se ejecuta npm audit fix ni se modifican lockfiles.

## Prueba dirigida y aislamiento — T003–T005

Archivo: [migraciones.test.js](../../../backend/src/modulos/donaciones/migraciones.test.js).

La suite exige DATABASE_URL y TEST_DATABASE_URL iguales, nombre de base ong_test_hu01 y
comprobación del nombre real en el servidor. Una configuración ausente o incorrecta falla;
no existe skip por falta de entorno. Cada secuencia crea un esquema de nombre aleatorio
hu01_004_..., fija search_path a ese esquema y elimina únicamente ese esquema al finalizar.
Cada caso usa transacción y rollback. No se vacían tablas públicas ni se borran bases o volúmenes.

Se prueban las dos secuencias:

| Secuencia | Preparación y comprobación |
|---|---|
| 001–003 → 004 | En un esquema nuevo se aplican las tres migraciones previas. Se ejecuta 004 en una transacción de observación y se comprueba que añade exactamente las tres tablas de dominio; después se revierte esa observación. El migrador real incorpora 004 y también 005, que seguía pendiente. |
| 001–003/005 → 004 | En otro esquema nuevo se aplican y registran 001–003 y 005. La misma observación comprueba el efecto aislado de 004. El migrador real añade 004, aunque 005 ya constaba aplicada, sin repetir 005. |
| Segunda ejecución, ambas secuencias | El migrador real no aplica ningún fichero, conserva el registro de nombres y sus timestamps, y no cambia el Donante de prueba existente. |

Se ejecuta el programa existente backend/src/db/migrar.js en un proceso Node con la
conexión del esquema correspondiente. No se copia ni se modifica su lógica para seleccionar
migraciones. Las cuatro migraciones previas permanecen intactas; 005 se utiliza solo como
precondición/pendiente del migrador en el esquema de prueba. No se ejecutan pruebas de otros módulos.

### Resultados reales

| Ejecución | Resultado |
|---|---|
| Antes de crear 004 | Código 1; ambas suites fallan en el hook de preparación por ENOENT de 004_donaciones.sql. Los 50 casos no llegan a ejecutarse y Vitest los muestra como skipped por ese fallo del hook, no como una validación satisfactoria. La conexión a la base ya estaba verificada. |
| Después de crear 004 | Código 0; 1 archivo de prueba aprobado, 50 casos aprobados, 0 fallidos y 0 omitidos: 25 por secuencia. |
| Medición informada por Vitest | Versión 2.1.9; inicio 04:59:32; duración total 6,04 s, de los cuales 5,50 s corresponden a las pruebas. |
| Comprobación posterior independiente | ong_test_hu01 conserva 0 tablas en public y 0 esquemas temporales hu01_004_.... Las bases ong, ong_test_hu01 y postgres siguen presentes. |

Extracto de la ejecución final:

```text
Test Files  1 passed (1)
     Tests  50 passed (50)
  Duration  6.04s
```

### Contrato verificado

| Área | Resultado comprobado en las dos secuencias |
|---|---|
| Alcance SQL | Solo donantes, suscripciones_socio y aportaciones; sin tablas operativas o datos reales. |
| Estructura | Columnas y nulabilidad previstas; PK BIGSERIAL y auditoría TIMESTAMPTZ no nula con valores iniciales. |
| Identidad | NIF/NIE único y válido, usuario opcional único, varios usuarios NULL, correo en minúsculas y sin UNIQUE SQL de correo. |
| Dinero | NUMERIC(10,2); extremos 1,00 y 999.999,99 incluidos; importes fuera de rango rechazados en ambas tablas financieras. Suma confirmada de 1.999.999,98 sin límite agregado. |
| Suscripción | Tres periodicidades, estados previstos, alta pendiente sin fecha y activa con fecha; previsión nullable como instante y DATE; identificador externo único nullable. |
| Aportación | Estados previstos; fecha obligatoria al confirmar; referencia y PaymentIntent únicos; Invoice única para cuotas. Identificadores externos desconocidos admiten NULL. |
| Modalidad y destino | Fondo general NULL; cuota exige suscripción; puntual no admite suscripción ni factura. |
| Relaciones | Seis FK ON DELETE RESTRICT, referencias inexistentes rechazadas y conservación de padres referenciados. |
| Consulta financiera | Índice por (donante_id, estado, fecha_cobro). |
| Migrador | 004 se incorpora después de 005 y no se reaplica al repetirse el programa, sin modificarlo. |

La validación de entrada con más de dos decimales corresponde al servicio/controlador
posterior: NUMERIC(10,2) fija la representación y no sustituye esa validación.
La verificación del correo, conflictos funcionales de identidad, permisos, transiciones
financieras, inmutabilidad después de confirmar y actualización de previsión se implementarán
en las tareas posteriores. Estas pruebas de esquema no acreditan esos comportamientos,
una donación completa o pruebas reales de Stripe.

## Reproducción del comando dirigido

Ejecutar en PowerShell **desde backend**, con el entorno local preparado. El bloque
selecciona únicamente la base exclusiva; no muestra la URL ni modifica .env.
Se restaura el entorno de la terminal al terminar:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
$hu01UrlPruebas = 'const u = new URL(process.env.DATABASE_URL); u.pathname = "/ong_test_hu01"; process.stdout.write(u.href);' | node --env-file=../.env
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hu01UrlPruebas)) {
    throw 'No se pudo seleccionar la base exclusiva.'
}
$hu01Nombres = @('DATABASE_URL', 'TEST_DATABASE_URL', 'NODE_ENV', 'AHORA_SIMULADO')
$hu01Antes = @{}
foreach ($hu01Nombre in $hu01Nombres) {
    $hu01Antes[$hu01Nombre] = [Environment]::GetEnvironmentVariable($hu01Nombre, 'Process')
}
try {
    $env:DATABASE_URL = $hu01UrlPruebas
    $env:TEST_DATABASE_URL = $hu01UrlPruebas
    $env:NODE_ENV = 'test'
    $env:AHORA_SIMULADO = ''
    npm test -- src/modulos/donaciones/migraciones.test.js --no-file-parallelism --reporter=verbose
    if ($LASTEXITCODE -ne 0) { throw 'Falló la validación dirigida de 004.' }
}
finally {
    foreach ($hu01Nombre in $hu01Nombres) {
        [Environment]::SetEnvironmentVariable($hu01Nombre, $hu01Antes[$hu01Nombre], 'Process')
    }
}
```

El comando dirigido npm test y la selección de la conexión son los ejecutados en la
validación. El envoltorio de restauración se documenta para reutilizarlo en una terminal
interactiva; las ejecuciones registradas usaron procesos independientes.
No se ejecutó el bloque B completo, la suite general o la compilación de frontend.

## Conservación y huellas

| Archivo | SHA-256 |
|---|---|
| 004_donaciones.sql validada | `ba9ff15813e073dd4ca53092a8851deb732dbf72d4517538010d6bde17a16b65` |
| migraciones.test.js ejecutado | `16d7da48ea2637488240c08aa01e59869a7e2727a4e5f10a4eafba9e1d4141db` |
| migrar.js existente, sin modificar | `9e0ea7f17a33dc0182cf6ff3f5247341c4b6f49a7479db7669dc9b3eb3ef6c80` |
| analyze-1.md, conservado | `ac2b0c787587d70de37d183ecedbd25e5f07efb4f65167cd983caca9335a5110` |
| analyze-2.md, conservado | `59bf47efa6267423b4c4092ba5cc8b163377c72c6f88619529318db433f7ffa1` |

La comparación con las huellas iniciales confirma la conservación de código previo,
migraciones 001–003/005, manifiestos, lockfiles y todos los informes históricos.
El índice de Git conserva los mismos objetos preparados al inicio; los cambios nuevos
no se añaden al índice. .env y node_modules quedan ignorados.

## Balance y punto de parada

| Tarea | Estado y evidencia |
|---|---|
| T001 | Completada: ficha preparada con P-01–P-03, contrato de consulta y revisión pendiente. |
| T002 | Completada: dependencias instaladas desde lockfiles, secretos locales y base exclusiva con conexión comprobada. |
| T003 | Completada: pruebas escritas antes de 004; fallo esperado por archivo ausente comprobado. |
| T004 | Completada: tres tablas de dominio creadas en el fichero 004 y contrato de esquema validado. |
| T005 | Completada: ambas secuencias y repetición del migrador aprobadas; resultados y límites conservados en este informe. |
| T006 | Pendiente. La revisión de Rubén no se ha realizado. |

No quedan impedimentos para completar T001–T005. El siguiente control es T006, con
revisión real de Rubén y coordinación común antes de incorporar la entrega. No se inicia
T006 ni se asigna el número de la migración operativa. Tampoco se implementan rutas,
pantallas, Stripe, correo o historias ajenas. No se realizan commit, push, merge o cambio de rama.
