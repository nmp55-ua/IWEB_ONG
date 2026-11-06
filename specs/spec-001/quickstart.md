# Guía de validación prevista — HU-01

**Responsable**: Nada · **Revisor**: Rubén · **Fecha**: 2026-11-06  
**Estado**: Procedimiento preparado para una fase posterior; comandos y pruebas no ejecutados.

## Condiciones previas

El diseño está definido en esta rama y pendiente de revisión de Rubén. La aplicación aún
no implementa HU-01 y no existe 004. Los comandos siguientes se ejecutarán tras incorporar
la implementación y las migraciones revisadas; sus comprobaciones fallan si faltan tablas
o pruebas, sin convertir su ausencia en un resultado satisfactorio.

Node.js 22 y Docker Desktop son requisitos. La cuenta Stripe y P-05 solo se necesitan
para las pruebas reales de Checkout; la suite local usa pasarela simulada y firma sintética,
sin credenciales reales. Los datos de prueba nunca son datos de donantes reales.

La base **ong_test_hu01** se crea aparte de ong. Las pruebas existentes de actividades
vacían sus tablas: una base exclusiva es necesaria. No ejecutar la suite sobre la base de
desarrollo ni mientras se usa esa misma base para la comprobación manual.

## A. Dependencias y base exclusiva

Ejecutar este bloque en **PowerShell, desde la raíz del repositorio**. Conserva cualquier
.env existente; solo copia la plantilla si falta. No muestra sus valores. El contenedor
actual define usuario ong; contraseña y puerto proceden de la configuración local de Compose.

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env' -ErrorAction Stop
}
npm --prefix backend ci
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de backend.' }
npm --prefix frontend ci
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias de frontend.' }

docker compose up -d db mailpit
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron iniciar los servicios de pruebas.' }
$hu01Lista = $false
for ($hu01Intento = 0; $hu01Intento -lt 30; $hu01Intento++) {
    docker compose exec -T db pg_isready -U ong -d postgres *> $null
    if ($LASTEXITCODE -eq 0) { $hu01Lista = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $hu01Lista) { throw 'PostgreSQL no está disponible.' }

$hu01Existe = docker compose exec -T db psql -U ong -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'ong_test_hu01';"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar la existencia de la base de pruebas.' }
if (($hu01Existe -join '').Trim() -ne '1') {
    docker compose exec -T db createdb -U ong --owner=ong ong_test_hu01
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear ong_test_hu01.' }
}
```

No se borra ninguna base o volumen. Si el contenedor ya conserva una contraseña distinta
de la configuración local, la conexión posterior debe corregirse con sus credenciales
reales; no se resuelve eliminando el volumen.

## B. Selección de conexión, migración y suite

Ejecutar el bloque completo en **la misma PowerShell, desde la raíz**. Se construye una
conexión a Compose sin imprimirla, usando POSTGRES_PASSWORD y DB_PORT de la configuración
local. Solo cambia la base a ong_test_hu01. No se reutiliza a ciegas DATABASE_URL del entorno.

DATABASE_URL dirige pool y migrador; TEST_DATABASE_URL activa las pruebas con base.
Se asignan ambas a la misma conexión antes de arrancar Node/Vitest. npm test no carga .env
por sí mismo. Las variables del proceso prevalecen sobre --env-file del migrador, según
la [precedencia documentada por Node.js 22](https://raw.githubusercontent.com/nodejs/node/v22.20.0/doc/api/cli.md);
no se reescribe .env. El bloque comprueba base real, esquema y archivos de pruebas y restaura
las variables del proceso al terminar, también si falla.

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
$hu01Repo = (Get-Location).Path
$hu01UrlPruebas = 'const u = new URL("postgres://ong@127.0.0.1/ong_test_hu01"); u.port = process.env.DB_PORT || "5432"; u.password = process.env.POSTGRES_PASSWORD || "ong_dev"; process.stdout.write(u.href);' | & node --env-file-if-exists=.env
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hu01UrlPruebas)) {
    throw 'No se pudo preparar la conexión de pruebas.'
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
    if ([string]::IsNullOrWhiteSpace($env:TEST_DATABASE_URL) -or $env:DATABASE_URL -ne $env:TEST_DATABASE_URL) {
        throw 'DATABASE_URL y TEST_DATABASE_URL deben seleccionar la misma base exclusiva.'
    }
    Set-Location -LiteralPath (Join-Path $hu01Repo 'backend')
    $hu01VerificarBase = @'
import pg from "pg";
const cliente = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
try {
  await cliente.connect();
  const resultado = await cliente.query("SELECT current_database() AS nombre");
  if (resultado.rows[0].nombre !== "ong_test_hu01") throw new Error("Base incorrecta");
  console.log("Base exclusiva de pruebas verificada.");
} catch {
  console.error("No se pudo verificar ong_test_hu01. No se ejecutan migraciones ni pruebas.");
  process.exitCode = 1;
} finally {
  await cliente.end();
}
'@
    $hu01VerificarBase | & node --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'Conexión de pruebas no válida.' }

    npm run migrar
    if ($LASTEXITCODE -ne 0) { throw 'Falló la migración de la base de pruebas.' }

    $hu01VerificarTablas = @'
import pg from "pg";
const cliente = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
const tablas = ["usuarios", "sesiones", "proyectos", "actividades", "donantes",
  "aportaciones", "suscripciones_socio", "operaciones_pago", "eventos_pasarela",
  "verificaciones_donante", "correos_aportacion"];
try {
  await cliente.connect();
  for (const tabla of tablas) {
    const resultado = await cliente.query("SELECT to_regclass($1) AS tabla", [tabla]);
    if (!resultado.rows[0].tabla) {
      console.error("Falta tabla de pruebas: " + tabla);
      process.exitCode = 1;
    }
  }
} catch {
  console.error("No se pudo comprobar el esquema de pruebas.");
  process.exitCode = 1;
} finally {
  await cliente.end();
}
'@
    $hu01VerificarTablas | & node --input-type=module
    if ($LASTEXITCODE -ne 0) { throw 'Esquema de HU-01 incompleto; no se declara validado.' }
    foreach ($hu01Archivo in @('servicio.test.js', 'rutas.test.js', 'pasarela.test.js')) {
        if (-not (Test-Path -LiteralPath (Join-Path 'src/modulos/donaciones' $hu01Archivo))) {
            throw "Falta la prueba prevista de HU-01: $hu01Archivo"
        }
    }
    npm test -- --no-file-parallelism --reporter=verbose
    if ($LASTEXITCODE -ne 0) { throw 'La suite de pruebas ha fallado.' }
    Set-Location -LiteralPath $hu01Repo
    npm --prefix frontend run build
    if ($LASTEXITCODE -ne 0) { throw 'La compilación del frontend ha fallado.' }
}
finally {
    Set-Location -LiteralPath $hu01Repo
    foreach ($hu01Nombre in $hu01Nombres) {
        [Environment]::SetEnvironmentVariable($hu01Nombre, $hu01Antes[$hu01Nombre], 'Process')
    }
}
```

El migrador aplica todos los ficheros presentes no registrados, incluido 004 cuando exista;
no depende de que la ampliación operativa tenga número 009. Las semillas no son requisito
de la suite: sus fixtures crean datos propios. Las futuras pruebas de integración HU-01
deben fallar explícitamente si no hay TEST_DATABASE_URL o esquema, sin describe.skipIf
por falta de configuración. Las pruebas de firma generan secretos falsos locales y no
consultan Stripe.

La [opción fileParallelism de Vitest 2](https://v2.vitest.dev/config/#fileparallelism)
evita ejecutar ficheros de integración simultáneamente sobre la misma base; no sustituye
los casos que provocan concurrencia dentro de una prueba. Registrar el resumen de la suite:
actualmente hay tres it.skip explícitos de HU-07 por integración pendiente con HU-05.
Son limitaciones ajenas existentes; configurar la base no las resuelve ni autoriza a editarlas.
No debe omitirse toda la suite de actividades por TEST_DATABASE_URL ausente, ni ningún caso
de HU-01 por configuración. No se ha ejecutado ninguna suite al redactar esta guía.

## C. Comprobación manual posterior

Después de P-05 y de las pruebas automatizadas, usar la misma base exclusiva, sin ejecutar
la suite al mismo tiempo. Las semillas actuales crean usuarios, proyectos y actividades;
las futuras de donaciones deben ser idempotentes y no llamar a Stripe.

**Terminal 1, PowerShell desde la raíz**: la contraseña solicitada solo se usa en el proceso
de semillas y para entrar con los usuarios sintéticos; no se muestra o guarda en el documento.
.env conserva sus credenciales de Stripe, aún por comprobar.

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
$hu01Repo = (Get-Location).Path
$hu01UrlPruebas = 'const u = new URL("postgres://ong@127.0.0.1/ong_test_hu01"); u.port = process.env.DB_PORT || "5432"; u.password = process.env.POSTGRES_PASSWORD || "ong_dev"; process.stdout.write(u.href);' | & node --env-file-if-exists=.env
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la conexión de pruebas.' }
$hu01Nombres = @('DATABASE_URL', 'NODE_ENV', 'SESSION_SECRET', 'CONTRASENA_SEMILLAS', 'AHORA_SIMULADO', 'FRONTEND_URL', 'SMTP_HOST', 'SMTP_PORT')
$hu01Antes = @{}
foreach ($hu01Nombre in $hu01Nombres) {
    $hu01Antes[$hu01Nombre] = [Environment]::GetEnvironmentVariable($hu01Nombre, 'Process')
}
try {
    $env:DATABASE_URL = $hu01UrlPruebas
    $env:NODE_ENV = 'development'
    $env:AHORA_SIMULADO = ''
    $env:FRONTEND_URL = 'http://localhost:4321'
    $env:SMTP_HOST = '127.0.0.1'
    $env:SMTP_PORT = '1025'
    $env:SESSION_SECRET = 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))' | & node
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la sesión local.' }
    $hu01Clave = Read-Host 'Contraseña para los usuarios sintéticos de esta prueba' -AsSecureString
    $env:CONTRASENA_SEMILLAS = [System.Net.NetworkCredential]::new('', $hu01Clave).Password
    npm --prefix backend run semillas
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron cargar las semillas de pruebas.' }
    npm --prefix backend run dev
}
finally {
    foreach ($hu01Nombre in $hu01Nombres) {
        [Environment]::SetEnvironmentVariable($hu01Nombre, $hu01Antes[$hu01Nombre], 'Process')
    }
}
```

**Terminal 2, otra PowerShell desde la raíz**:

```powershell
Set-Location -LiteralPath 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
npm --prefix frontend run dev
```

Web prevista: http://localhost:4321/donar; resultado /donar/resultado?ref=... y vínculo
/donar/vincular. Mailpit: http://localhost:8025. El proxy Astro mantiene la cookie en el mismo
origen. Antes de usar Checkout, P-05 configura/verifica destino HTTPS o reenvío local hacia
/api/pasarela/webhook, versión y eventos. No se presupone una cuenta, clave o destino ya comprobado.

La tarjeta se introduce únicamente en Stripe, usando [datos oficiales de prueba](https://docs.stripe.com/testing?testing-method=card-numbers).
Las [pruebas automatizadas locales](https://docs.stripe.com/automated-testing) simulan la
pasarela; no generan carga contra Stripe.

## Datos y evidencia

- Invitado: navegador sin cuenta, datos sintéticos válidos, NIF `12345678Z`, correo de pruebas
  y dirección ficticia. No reutilizar esa identidad para otro caso sin comprobar su estado.
- Cuenta propia y ajena: `donante@ong.test` y `donante2@ong.test`, contraseña local de semillas.
  Usar un Donante de cada correo con NIF válido distinto; el vínculo empieza sin verificar.
- Proyectos existentes: «Agua potable», «Comedor social» y «Campaña 2024» inactivo.
- Para conflictos, conservar una copia de los campos del Donante antes de la prueba y
  comprobar después que siguen idénticos. Las capturas no muestran datos reales.
- Registrar por caso entrada, resultado de API/pantalla, estado final y cardinalidad en base,
  correo visible en Mailpit y referencia de la operación. No guardar payloads completos de
  Stripe ni datos de tarjeta en evidencias.

Los códigos P01–P21 y S01–S13 son **alias de esta guía**, no nuevos identificadores en la
especificación: P corresponde al escenario numerado de User Story 1 y S al de User Story 2
de [spec.md](spec.md). Cada caso se repetirá con la aplicación y se complementará con pruebas
de reglas y API. El resultado de todas las filas siguientes es actualmente **no ejecutado**.

## Donación puntual y reglas compartidas

| Caso | Requisitos | Ejecución y resultado verificable |
|---|---|---|
| P01 | FR-001, FR-002, FR-005–FR-007 | Donar 20 € con tarjeta en Checkout, EUR y fondo general. Confirmación con 20,00 €, fecha de Madrid, modalidad, destino y referencia; una sola fila confirmada. |
| P02 | FR-003, FR-007 | Donar a Agua potable. Mismo proyecto en base, resumen y correo. |
| P03 | FR-002 | Probar 0, -1, 0,99, 1000000, 1000000.00, texto, exponente, miles y tres decimales: error junto al importe y cero llamadas a Checkout. Admitir 1.00 y 999999.99, ambos extremos, también con coma decimal. Repetir límites para socio. No se redondea 999999.999. |
| P04 | FR-004 | Letra errónea y formato NIF/NIE inválido; no se llega a Stripe. Probar también correo inválido y campos obligatorios vacíos. |
| P05 | FR-006 | Rechazo real simulado y expiración/cancelación acreditada: sin confirmada, motivo claro y opción de reintento compatible con el estado actual. Volver por cancel_url no confirma cancelación. |
| P06 | FR-007 | Cobro confirmado con SMTP disponible. Mensaje recibido en Mailpit con el mismo resumen visible; no basta estado enviado. |
| P07 | FR-011 | Completar puntual en navegador invitado; no exige registro ni login. |
| P08 | FR-007, FR-012 | Simular SMTP caído al confirmar. Pago confirmado, resumen visible y aviso de correo pendiente. |
| P09 | FR-012 | Restablecer SMTP y reintentar con permiso. Misma referencia, resumen y única aportación; cero llamadas de cobro. |
| P10 | FR-012 | Reintentar con SMTP aún caído. Aviso real de fallo y opción de repetir; no mensaje de éxito ni filas financieras nuevas. |
| P11 | FR-011, FR-013 | Abrir «Vincular mis aportaciones a una cuenta» desde formulario y resultado. Sin token, entrar con FormEntrar existente y solicitar el enlace. El 202 muestra el mismo aviso genérico con/sin Donante elegible y no vincula o autoriza por correo coincidente. |
| P12 | FR-013 | Recorrer entrada visible → página sin token → solicitud autenticada → aviso genérico → mensaje Mailpit → abrir token → confirmar POST con la misma cuenta. GET no envía/consume; token caducado/usado u otra cuenta no vinculan, y solicitar otro requiere acción explícita. Sin depender de HU-02. |
| P13 | FR-014 | Mismo correo y otro NIF válido. Rechazo antes de Stripe, mensaje genérico, Donante y aportaciones intactos. |
| P14 | FR-015 | Nueva donación con todos los datos equivalentes. Reutiliza un Donante sin actualizarlo; nueva operación independiente. |
| P15 | FR-015 | Mismo NIF y otro correo. Se detiene sin pago, nueva identidad o exposición de datos guardados. |
| P16 | FR-015 | Cambiar nombre, apellidos o dirección con el mismo NIF, invitado y cuenta vinculada. Se detiene en ambos casos. |
| P17 | FR-015 | Variar mayúsculas, espacios y representación NFC; NIF con espacios/guion de presentación. Reutiliza sin sobrescribir. Cambiar tildes, puntuación o contenido real sigue siendo conflicto. |
| P18 | FR-012, FR-016 | Consultar y reintentar correo desde el navegador de origen, permiso vigente. Solo esa operación. |
| P19 | FR-016 | Otro navegador con referencia, cookie eliminada o permiso vencido: 404 genérico, sin datos ni envío. |
| P20 | FR-016 | Sesión A intenta resultado y correo de B. Ambos denegados. La sesión invitada tampoco autoriza historial. |
| P21 | FR-010, FR-017 | Cerrar navegador antes del pago; entregar después webhook firmado válido dos veces. Una aportación confirmada y envío independiente de sesión. |

## Alta y cuotas de socio

| Caso | Requisitos | Ejecución y resultado verificable |
|---|---|---|
| S01 | FR-001, FR-008 | Alta de 10 €/mes, primer cobro válido. Una aportación, suscripción activa, periodicidad y fecha futura de pasarela. Repetir con trimestral y anual. |
| S02 | FR-009, FR-010 | Notificar una factura de ciclo posterior pagada. Una nueva cuota confirmada; el total aumenta exactamente su importe. |
| S03 | FR-006, FR-008 | Primer cobro fallido. Ninguna suscripción activa ni aportación confirmada; pendiente recuperable según P-01, cancelada solo ante cierre definitivo. |
| S04 | FR-011 | Alta completa sin cuenta, resultado y confirmación en el navegador autorizado. |
| S05 | FR-007, FR-008, FR-012 | Primer cobro válido y SMTP fallido. Alta activa, resumen con periodicidad y próxima fecha, aviso real de correo pendiente. |
| S06 | FR-012, FR-016 | Reenviar confirmación de cuota con permiso. Misma cuota y suscripción; sin cargo. Invitado del alta intenta una cuota posterior y se deniega. Cuenta vinculada propietaria puede autorizarla. |
| S07 | FR-014 | Correo existente y otro NIF en alta. Detención previa a Stripe, sin modificación ni mezcla. |
| S08 | FR-015 | Mismo NIF con cambios reales en correo o datos fiscales en alta. Detención, sin duplicación ni actualización. |
| S09 | FR-010, FR-017 | Primer cobro se notifica sin retorno o sesión. Una primera cuota y activación; no requiere navegador. |
| S10 | FR-018 | Cuota posterior falla. Fila rechazada, aviso de fallo, total anterior intacto, suscripción aún activa y ninguna orden adicional de cobro. |
| S11 | FR-019 | Tras fallo, next_payment_attempt futuro canónico. Solo se muestra esa fecha en Madrid, incluida actualización posterior por invoice.updated. |
| S12 | FR-019 | Previsión nula o pasada, incluido vencimiento dentro del mismo día sin otro webhook. Mostrar «Pendiente de confirmación», no el fin de periodo ni una suma local de meses. |
| S13 | FR-008, FR-018 | Cancelación definitiva posterior al fallo, seguida de evento antiguo. Suscripción cancelada, próxima fecha null, anteriores confirmadas intactas y sin nuevo cobro. |

## Pruebas técnicas complementarias

**Reglas y base de datos**: Vitest sobre normalización, importes y letras de control;
pruebas con PostgreSQL real de las restricciones y transacciones. Una simulación de SQL no
demuestra unicidad ni bloqueo. Ejecutar además las pruebas comunes existentes; no sustituyen
los casos nuevos de HU-01.

**API**: Supertest con sesiones separadas, origen y CSRF. Probar firma inválida/cuerpo
alterado, webhook válido sin cookie, rol incorrecto para vínculo, token de otra cuenta,
caducado o consumido, dos consumos simultáneos y ausencia de datos personales en errores.
Las pruebas del verificador usan firma de prueba y bytes crudos, sin invocar Stripe real.
El token de enlace no debe aparecer en URL enviada al servidor, historial tras retirarlo
ni registros. Probar que GET del enlace no vincula ni solicita otro correo automáticamente.
Sin token, el botón debe ser alcanzable desde las dos entradas; el 202 no prueba envío y
las respuestas de solicitud no enumeran Donantes. Con token, solo confirmar o pedir otro
explícitamente; no se modifica el registro, login o el rol.

**Idempotencia y desorden**: verificar estas secuencias sobre recursos canónicos controlados:

- Mismo event ID repetido; distintos event IDs del mismo PaymentIntent/Invoice; dos entregas
  simultáneas. Cardinalidad, referencia y suma no cambian por la repetición.
- Primera cuota con Invoice antes/después de Checkout, incluyendo entrega simultánea.
  Solo una cuota inicial y una suscripción.
- Una factura de ciclo pagada llega antes que el aviso de la cuota inicial. Recuperar su
  factura de alta desde Session, verificar ambos pagos y registrar exactamente dos cuotas;
  fecha de alta del primer cobro. Repetir sin ID local de Session y con coincidencia externa
  ausente o ambigua: recuperación acotada o incidencia, nunca primera cuota inventada.
- Rechazo y posterior éxito del mismo PaymentIntent y de la misma factura de cuota;
  después, reentrega del fallo antiguo. Misma fila confirmada sin retroceso.
- Cancelación y pago antiguo en ambos órdenes; una cancelación canónica definitiva no se
  revierte. Una factura realmente pagada se registra sin reactivar el alta cancelada.
- Un error de Stripe o base antes del commit produce 503 sin evento procesado; reentrega
  recupera una vez. Caída tras commit y antes de correo recupera el envío pendiente.
- Crear Checkout con dos peticiones autorizadas concurrentes: una obtiene exclusión y
  la otra recibe 409 OPERACION_EN_CURSO, sin otro envío. Comparar UUID, referencia, cuerpo
  efectivo e idempotencyKey, no solo cardinalidad local. UUID equivalente en mayúsculas o
  minúsculas debe generar el mismo identificador canónico, lock y clave de Stripe.
- Forzar timeout y error: incierta conserva la instantánea y finalmente se libera el
  bloqueo. Reanudar repite el cuerpo original; un cambio posterior de configuración no
  recalcula URL o descripción. Otro cuerpo con la misma clave se rechaza.
- Interrumpir/reiniciar el proceso de prueba, conservando base y secreto de sesión de
  fixtures. Sin dueño vivo y con plazo/permiso, se readquiere y se envía la misma instantánea;
  si la conexión anterior aún conserva el bloqueo, no se fuerza ni se crea otro Checkout.
  El simulador Stripe debe conservar su respuesta por clave entre los dos procesos.
- Simular pérdida de conexión durante HTTP y respuesta tardía: no se escribe o reenvía
  con otro cliente sin readquirir; cerrada/confirmada no se degradan. Verificar finally,
  desbloqueo y destrucción de cliente si no se acredita la liberación, sin sesiones con
  locks devueltas al pool ni espera por una segunda conexión desde el tramo protegido.
- Comparar justo antes/al alcanzar creado_en + 23 horas con fixtures del reloj real de
  base: reanudar tras error no modifica creado_en, huella o snapshot; actualizado_en no
  renueva la ventana. Sin Session, al vencer aparece revisión requerida y cero nuevos
  POST de creación; con Session conocida solo se consulta/reutiliza. El permiso invitado
  puede caducar antes, a las ocho horas, y no se amplía hasta las 23 horas.
- Recargar el formulario conserva solo claveSolicitud en sessionStorage y reanuda mediante
  el DTO corto autorizado. Borrar/cambiar la clave o usar otra sesión no da acceso a la operación original; no hay
  reinicio automático con un UUID distinto para recuperar una preparación incierta.
- Dos altas simultáneas con correo compartido y NIF diferentes: solo una identidad aceptada;
  dos solicitudes equivalentes reutilizan un Donante. Proyecto desactivado antes de aceptar
  requiere nueva elección, sin reasignación automática.
- Dos reintentos simultáneos de correo: uno reserva el envío, otro recibe conflicto; no hay
  cambios financieros ni llamadas a Stripe. Reserva vencida y caída tras aceptación SMTP:
  reconocer el posible mensaje físico duplicado, nunca prometer entrega exactamente una vez.

**Interfaz**: comprobar mensajes junto al campo, navegación por teclado, carga y ausencia
de pantalla vacía, dos modalidades, tres periodicidades, estados de pago/correo separados,
euros con dos decimales y fechas de Madrid en cambio de día, año y horario de verano.
Comprobar un intento iniciado el 31 de diciembre y confirmado el 1 de enero: se usa el
instante de éxito de Stripe, no el inicio del intento ni la entrega posterior del webhook.
Comprobar que no se ofrecen otros medios de pago o moneda; una entrada manipulada con
moneda o campos no admitidos se rechaza antes de Stripe. En pruebas locales con pasarela
simulada, verificar límite superior e inferior y exactamente card/eur en la creación. No
se exige un cargo real del importe máximo para demostrar el límite de entrada.
El frontend no tiene script test actual; no se inventa uno. Su build y la comprobación manual
complementan las pruebas de backend.

## Criterios de éxito y salida de validación

| Criterio | Evidencia que se obtendrá al implementar |
|---|---|
| SC-001 | Cronometrar donación puntual desde entrada al formulario hasta resultado confirmado; debe ser < 3 minutos. Registrar condiciones y duración real, sin afirmarlo por diseño. |
| SC-002 | Relacionar todas las confirmadas de la prueba con un mensaje recibido en Mailpit, tras recuperación de fallos si procede. Cobertura del 100 %; cualquier pendiente impide darlo por cumplido. |
| SC-003 | Comprobar payloads de la ONG, columnas, logs, sesión y evidencias: no contienen números ni datos de tarjeta. La tarjeta solo se introduce en Checkout. |
| SC-004 | Comparar céntimos recibidos de Stripe, base, pantalla y correo para puntual y cuotas. No comparar floats ni solo textos visuales. |

La checklist de requisitos existente contiene 16/16 marcas de calidad documental; no
acredita ejecución de esta guía, revisión de Rubén o preparación de P-05. Los resultados se
registrarán en la fase de validación autorizada, sin alterar los informes históricos de
clarify. La fase de plan termina con esta guía y sus dependencias de revisión identificadas.
