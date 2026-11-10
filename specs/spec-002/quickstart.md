# Guía de validación prevista de HU-02

**Responsable**: Nada · **Revisor**: Javi · **Fecha**: 2026-11-10

Esta guía describe comprobaciones que deberán ejecutarse después de implementar HU-02. No contiene resultados de ejecución. `historial.test.js`, `historial-local.js` y los componentes nuevos son archivos previstos por el [plan](plan.md); sus comandos se ejecutarán cuando existan. Los scripts npm citados sí existen actualmente. No se crea `tasks.md` en esta fase.

## 1. Preparación segura

Requisitos: Node.js 22, npm, dependencias de los lockfiles y PostgreSQL accesible con permiso para crear una base de pruebas si falta y esquemas dentro de ella. No se necesita Stripe CLI, SMTP ni una cuenta de pruebas de Stripe para este bloque de consulta.

Abrir una terminal PowerShell dedicada a pruebas. Los ejemplos no escriben `.env`, no imprimen su contenido y no modifican la configuración de otros procesos. No ejecutar las suites contra la base de desarrollo.

Desde la raíz, comprobar los scripts y archivos antes de probar:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG'
git branch --show-current
git status --short
Get-Content backend/package.json
Get-Content frontend/package.json
```

Si faltan dependencias, instalar desde los lockfiles, durante implementación:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del backend.' }
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\frontend'
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación del frontend.' }
```

Seleccionar la base exclusiva reutilizada por el soporte existente. El siguiente bloque lee DATABASE_URL en un proceso hijo, cambia únicamente la base de destino y no imprime credenciales. Se ejecuta desde `backend`. La salida sensible de ese proceso se captura en una variable, sin escribirla en consola ni registrarla en las evidencias:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
$conexionHu02 = & node --env-file-if-exists=../.env --input-type=module -e 'const s=process.env.DATABASE_URL; if(!s) throw new Error("Falta DATABASE_URL para preparar pruebas."); const u=new URL(s); u.pathname="/ong_test_hu01"; u.searchParams.delete("options"); process.stdout.write(u.href);'
if ($LASTEXITCODE -ne 0 -or -not $conexionHu02) { throw 'No se pudo seleccionar la base exclusiva.' }
$env:DATABASE_URL = $conexionHu02
$env:TEST_DATABASE_URL = $conexionHu02
Remove-Variable conexionHu02
$env:NODE_ENV = 'test'
$env:SESSION_SECRET = 'hu02-sesion-sintetica-solo-pruebas'
$env:STRIPE_SECRET_KEY = 'sk_test_hu02_sintetica_no_utilizable'
$env:STRIPE_WEBHOOK_SECRET = 'whsec_hu02_sintetico'
$env:SMTP_HOST = '127.0.0.1'
$env:SMTP_PORT = '1'
$env:AHORA_SIMULADO = '2026-11-10T12:00:00Z'
```

No cargar después `.env` sobre esa terminal ni ejecutar `npm start`, migraciones, semillas o la CLI fiscal contra su configuración compartida. Si no existe `.env` ni DATABASE_URL heredada, la preparación se detiene para configurar una conexión de pruebas en esa terminal; no omite las pruebas como si hubieran pasado.

Crear la base solo si falta y verificar su identidad. Este bloque no borra una base existente ni vacía `public`; requiere privilegio de creación únicamente si falta la base:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
@'
import pg from 'pg';
const u = new URL(process.env.TEST_DATABASE_URL);
if (u.pathname !== '/ong_test_hu01' || process.env.DATABASE_URL !== u.href) {
  throw new Error('Conexión de pruebas incorrecta.');
}
const mantenimiento = new URL(u);
mantenimiento.pathname = '/postgres';
const admin = new pg.Client({ connectionString: mantenimiento.href });
try {
  await admin.connect();
  const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', ['ong_test_hu01']);
  if (!existe.rowCount) await admin.query('CREATE DATABASE ong_test_hu01');
} finally { await admin.end(); }
const cliente = new pg.Client({ connectionString: u.href });
try {
  await cliente.connect();
  const { rows } = await cliente.query('SELECT current_database() AS base');
  if (rows[0].base !== 'ong_test_hu01') throw new Error('Base incorrecta.');
  console.log('Base exclusiva de pruebas verificada.');
} finally { await cliente.end(); }
'@ | node --input-type=module
if ($LASTEXITCODE -ne 0) { throw 'No se ha preparado la base de pruebas.' }
```

Las pruebas y el banco usarán `crearEntornoPruebas` de `backend/src/modulos/donaciones/pruebas/soporte.js`: crea un esquema aleatorio propio, ejecuta allí el migrador vigente, verifica base/esquema y limpia solo ese esquema. No ejecutar `npm run migrar` sin ese aislamiento. No modificar el migrador, las migraciones ni las guardas para hacer pasar la comprobación.

## 2. Fixtures independientes

El banco y la suite futura crearán datos sintéticos dentro de cada esquema, sin usar semillas o aportaciones de desarrollo:

| Conjunto            | Contenido y propósito                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aceptación básica   | Dos confirmadas de 50,00 y 30,00 € en 2025, una de 20,00 € en 2026; destinos mixtos                                                                                     |
| Privacidad y vacíos | Dos cuentas donante vinculadas a personas distintas, una cuenta sin vínculo con correo coincidente, una vinculada sin confirmadas y otra con rol no admitido            |
| Exclusiones         | Pendiente, rechazada y cancelada; cuota confirmada de suscripción posteriormente cancelada; correo fallido que no elimina su aportación                                 |
| Fechas y orden      | `2025-12-31T22:59:59Z` pertenece a 2025 Madrid; `2025-12-31T23:00:00Z`, a 2026; misma fecha con IDs numéricos consecutivos mayores que Number.MAX_SAFE_INTEGER          |
| Exactitud           | Dos confirmadas de 999.999,99 € en el mismo año: total 1.999.999,98 €; pruebas puras adicionales con texto decimal grande                                               |
| Rendimiento         | Una cuenta vinculada y una suscripción con 60 cuotas mensuales confirmadas, 12 por año de 2021 a 2025, de 10,00 €: cinco totales de 120,00 € y suma de control 600,00 € |

El conjunto de rendimiento se mantiene separado de los casos adicionales: la cuenta medida tiene exactamente esas 60 cuotas. Los fixtures de cuotas referencian una SuscripcionSocio válida y cumplen las restricciones vigentes, sin simular pagos reales ni insertar eventos de Stripe.

## 3. Pruebas dirigidas de backend

Desde `backend`, una vez implementada la suite:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm test -- src/modulos/donaciones/historial.test.js --no-file-parallelism
if ($LASTEXITCODE -ne 0) { throw 'Falló la validación dirigida de HU-02.' }
```

Comprobaciones mínimas:

1. Escenarios 1–4: contenido, fechas, destinos, orden, filtro y exclusión de todos los estados no confirmados. Un Proyecto inactivo mantiene visible su aportación.
2. Escenarios 5, 7 y 8: tres estados vacíos distintos, sin consulta por correo ni envío automático. Comprobar también el filtro válido sin resultados y el filtro inválido.
3. Escenario 6 y SC-003: sesiones separadas, rol incorrecto, cuenta sin sesión, correo coincidente, IDs o referencias conocidos y permiso invitado no autorizan historial ajeno. No se aceptan selectores de propietario enviados por cliente.
4. FR-002/003 y SC-001: límites Madrid, desempate numérico BIGINT, suma superior al máximo individual y respuesta privada sin flotantes ni información fiscal.
5. Instantánea: coordinar dos conexiones con barreras de prueba; confirmar una nueva aportación entre lectura de resúmenes y detalle. La respuesta en curso conserva su conjunto anterior y la siguiente incorpora la nueva fila con su total. No modificar código de negocio para introducir esperas.
6. Ausencia de efectos: espías de Stripe/SMTP inyectados y recuentos antes/después de GET repetidos; ninguna operación, aportación, vinculación, correo o certificado nuevo. Comprobar rollback y liberación de conexión ante error.

Para el contraste con HU-03, usar el servicio y las consultas reales de certificados-informes, con el acceso a pool redirigido al esquema aislado mediante dobles de prueba del módulo de conexión. Inyectar transacción, reloj de 2026 y correo simulado. Ejecutar `reconciliarEjercicio(2025)` y comparar certificado persistido, SUM independiente e historial. Añadir una confirmación tardía en ese ejercicio, reconciliar de nuevo y repetir la igualdad. No importar `servidor.js`, activar cron, ejecutar su CLI ni modificar archivos de Rubén.

Regresión proporcional después de cambios de implementación:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
npm test -- src/modulos/donaciones src/servicios-comunes/correo.test.js --no-file-parallelism
if ($LASTEXITCODE -ne 0) { throw 'Falló la regresión de donaciones o correo.' }
```

No ejecutar suites ajenas que hagan TRUNCATE de tablas sin comprobar antes sus protecciones. El contraste fiscal se incluye en la suite aislada propia; no exige ejecutar toda la suite HU-03 contra `public`.

## 4. Funciones de interfaz y build

Desde `frontend`, después de crear las funciones y pruebas previstas:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\frontend'
npm test -- src/components/donaciones/historial.test.js
if ($LASTEXITCODE -ne 0) { throw 'Falló el formato exacto del historial.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló el build del frontend.' }
```

Comprobar texto de totales grandes, dos decimales, IDs textuales y rechazo de datos monetarios mal formados. El build y las funciones puras no acreditan por sí solos los estados visibles, la autorización ni SC-002.

## 5. Banco de navegador aislado

Se prevé `backend/src/modulos/donaciones/pruebas/historial-local.js`. El siguiente comando es su interfaz de ejecución propuesta y **no está disponible todavía**:

```powershell
Set-Location 'E:\asignaturas\IWeb\Practica grupal\IWEB_ONG\backend'
node src/modulos/donaciones/pruebas/historial-local.js
```

El banco deberá:

- Crear el entorno mediante el soporte existente. Migrar y preparar fixtures antes de abrir servicios.
- Arrancar un proceso backend propio con la URL de su esquema en DATABASE_URL y TEST_DATABASE_URL antes de importar configuración o pools. Usar `crearApp` y un MemoryStore de pruebas, login y middleware reales. No falsificar `req.usuario` mediante cabeceras ni modificar `app.js`.
- Servir el build standalone de Astro mediante `node dist/server/entry.mjs`, con directorio `frontend`, HOST `127.0.0.1` y PORT `44323`. Exponer un proxy de prueba en `http://127.0.0.1:44322`, `/api` hacia el backend propio y el resto hacia Astro. El backend puede usar un puerto libre asignado por el sistema.
- Usar credenciales exclusivamente sintéticas, sin cargar `.env` en los procesos hijos. La consulta no llama a Stripe ni SMTP; las pruebas dirigidas anteriores comprobarán esos límites con espías. No invocar endpoints de pago desde el banco.
- Negarse a arrancar si sus puertos fijos están ocupados. Registrar solo URLs locales, usuarios sintéticos y resultados no sensibles; no mostrar cookies ni conexiones de base.
- Conservar sus sesiones mientras se realizan los recorridos; al terminar, cerrar solo sus procesos y conexiones, y eliminar solo su esquema. Lanzar hijos ocultos en Windows y mantener la limpieza también ante error o interrupción.

Recorridos visibles a registrar: menú y acceso directo; inicio de sesión; estados sin vínculo, vacío y año sin resultados; navegación al enlace de HU-01 sin solicitarlo automáticamente; filtro y eliminación; error y reintento; orden, campos y totales; cambio rápido de filtros sin respuestas antiguas. Las verificaciones de API se relacionan con estos recorridos, sin presentar una pantalla simulada como prueba de persistencia.

## 6. Medición de SC-002

1. Registrar commit, sistema, navegador/versión, equipo, configuración de caché y build. Mantener visible la pestaña y servicios ya preparados. No usar el servidor de desarrollo como evidencia final de rendimiento.
2. Iniciar sesión con la cuenta sintética de rendimiento y verificar su vínculo antes de medir. Permanecer en otra página de la misma aplicación. No precargar el GET del historial ni abrirlo previamente para preparar la medición principal.
3. Abrir `/mis-aportaciones` mediante navegación normal. El instante inicial es `performance.getEntriesByType('navigation')[0].startTime` del documento de destino. Incluye carga de página y recursos, hidratación React, obtención de datos y presentación; no iniciar el cronómetro en un efecto posterior al fetch.
4. El banco inyectará en la respuesta HTML un observador de prueba, antes de la isla. Esperará la región `#historial-aportaciones` sin carga, 60 marcadores `data-hu02-aportacion`, cinco grupos `data-hu02-anio` con años y totales exactos y elementos no ocultos. Después de dos `requestAnimationFrame`, tomará `performance.now()` y la diferencia respecto del inicio. Esta instrumentación permanece en el banco, fuera del bundle de producto.
5. Conservar duración sin restas, recuentos, totales, captura y traza de navegador que respalde la presentación. Los 60 elementos deben estar renderizados y accesibles mediante desplazamiento; no se exige que quepan todos en el área visible simultáneamente. Si la pestaña pierde visibilidad, hay error o faltan filas/totales, registrar el intento y su limitación, sin declararlo aprobado.
6. El resultado debe ser estrictamente inferior a 2.000 ms. Conservar todos los intentos y distinguir repeticiones con caché de la navegación principal; no usar una media para ocultar un incumplimiento. No convertir la latencia de API en duración de extremo a extremo.

La medición acredita el caso y entorno registrados, sin prometer ese tiempo para cualquier volumen o equipo. Las cinco sumas deben ser 120,00 € y el control independiente 600,00 €; el contador de filas no basta si el contenido es incorrecto.

## 7. Registro y cierre de validación

Durante implementación se creará un informe numerado nuevo en `refinamiento/`, sin sobrescribir clarify. Incluirá comandos y códigos de salida, base/esquema verificados sin secretos, fixtures, resultados de escenarios 1–9 y SC-001–SC-003, contraste fiscal, observaciones de navegador y mediciones. Se distinguirán pruebas automáticas, recorridos manuales y límites reales.

Una prueba pendiente, omitida por falta de configuración o limitada a API no se presenta como interfaz validada. No se necesita ejecutar un nuevo pago real de Stripe para validar este historial de datos ya confirmados. La revisión de Javi y la incorporación a main permanecen separadas del resultado técnico.
