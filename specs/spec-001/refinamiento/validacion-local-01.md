# Validación local: persistencia operativa y soporte — HU-01

**Fecha**: 2026-11-06 · **Rama**: spec-001 · **HEAD inicial**: 8ee3976  
**Responsable**: Nada · **Revisor**: Rubén  
**Alcance**: T008–T013 y T019.  
**Resultado**: 68 pruebas aprobadas. T006 y T007 permanecen pendientes.

## Estado, numeración y dependencia

Se comprueba carpeta limpia y último commit «HU-01: añade funciones y pruebas de autorización».
009_operativa_donaciones.sql es una propuesta local autorizada, **sin reserva colectiva**.
Su número debe coordinarse en T007 y la revisión real de Rubén de T006 sigue pendiente.
Ambas condiciones preceden a la incorporación compartida; no se atribuye acuerdo colectivo.
La condición provisional consta en [LEEME](../../../backend/src/db/migraciones/LEEME.md)
y [ficha de revisión](revision-tecnica-01.md).

T008 cambia de T007 a T005 exclusivamente para este desarrollo local: 004 ya está validada.
T009–T013 conservan su cadena; T019 sigue dependiendo de T013. Se mantiene el modelo único
de [datos técnicos](../../modelo-datos.md#soporte-técnico-de-donaciones-spec-001), sin nuevos
campos o rediseños. Se omiten los hooks opcionales de commit del procedimiento de implementación.

## Migración y pruebas de esquema

Archivo: [009_operativa_donaciones.sql](../../../backend/src/db/migraciones/009_operativa_donaciones.sql).
Crea exclusivamente operaciones_pago, eventos_pasarela, verificaciones_donante y
correos_aportacion. Incluye solicitud_checkout JSONB no nulo, auditoría, estados con CHECK,
cuatro FK RESTRICT, intentos no negativos y las unicidades previstas.
Los diez índices únicos comprobados incluyen cuatro PK y seis unicidades de negocio;
no se añaden índices o estructuras ajenos al modelo.

Se conserva 004 byte a byte. El migrador existente tampoco cambia. La nueva migración
depende de 004 y de su base común, sin referencias a 006–008.
Las pruebas de [migraciones.test.js](../../../backend/src/modulos/donaciones/migraciones.test.js)
observan 004 y después 009 dentro de una transacción revertida, antes de 005 en la primera
secuencia. Así verifican siete tablas sin dependencia de actividades. Después ejecutan
el migrador real y comprueban nombres aplicados y una segunda ejecución sin reaplicación.

Se mantienen las dos secuencias de 004: base 001–003 y base 001–003/005.
Las pruebas amplían columnas, nulabilidad, JSONB, PK, FK, auditoría, estados y unicidad
de solicitud/aportación/Checkout, evento, token y aportación/tipo.
No hay SQL aplicado en public o en bases de desarrollo.

La inmutabilidad funcional de huella/snapshot/resumen, los permisos, las transiciones
y la reclamación de correo requieren los servicios/repositorios posteriores.
Esta entrega comprueba la estructura y restricciones declaradas, sin añadir triggers,
implementar esos servicios o afirmar que sus reglas ya funcionan.

## Soporte de T019 comprobado

[pruebas/soporte.js](../../../backend/src/modulos/donaciones/pruebas/soporte.js) proporciona:

- Entorno nuevo por esquema, migrador real y cierre controlado. Rechaza configuración
  ausente, base incorrecta y esquema incompleto; no omite pruebas por esos motivos.
- Usuarios con hashes bcrypt comprobados, donantes propios/ajenos e invitado, proyecto
  y aportaciones pendientes. Son fixtures sintéticos, no un alta o vinculación funcional.
- Sesiones separadas persistidas en sesiones, con IDs distintos y datos aislados.
- Pool acotado y conexiones controladas; se verifica aislamiento de una transacción
  entre dos conexiones y rollback. La eliminación de una tabla dentro de otra transacción
  comprueba el fallo por esquema incompleto y se revierte.
- Recursos canónicos Acacia correlacionados de Session, PaymentIntent, Invoice y
  Subscription, con objetos nuevos en cada preparación.
- Simulador local persistente por clave en directorio temporal propio. Publica registros
  completos mediante enlace de archivo atómico, compara el cuerpo canónico y conserva
  respuesta/solicitud entre procesos. Otra clave genera otro ID; otro cuerpo con la misma
  clave falla. No usa red ni credenciales reales.

Dos procesos nuevos leen la misma sesión y la misma base, con el mismo secreto sintético
comprobado por hash. Recuperan la misma respuesta del simulador. Otros dos procesos
concurrentes publican una clave nueva y obtienen el mismo resultado.
No se ejecutan suites en paralelo: esa concurrencia está controlada dentro de un caso.

El simulador no reproduce retención de claves, latencia o garantías de Stripe real.
La persistencia de datos de sesión no acredita cookies firmadas, middleware o rutas HTTP.
T019 queda verificada como soporte; la integración funcional continúa pendiente.

## Comandos y resultados reales

Desde PowerShell en backend. Se lee exclusivamente la URL de configuración local para
seleccionar ong_test_hu01, sin imprimirla ni sobrescribir .env. Las asignaciones afectan
solo al proceso aislado utilizado para ejecutar las pruebas:

```powershell
$hu01UrlPruebas = 'import {readFileSync} from "node:fs"; const texto=readFileSync("../.env","utf8"); const u=new URL(texto.match(/^DATABASE_URL=(.*)$/m)[1].trim()); u.pathname="/ong_test_hu01"; process.stdout.write(u.href);' | node --input-type=module
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hu01UrlPruebas)) {
    throw 'No se pudo seleccionar la base exclusiva.'
}
$env:DATABASE_URL = $hu01UrlPruebas
$env:TEST_DATABASE_URL = $hu01UrlPruebas
$env:NODE_ENV = 'test'
npm test -- src/modulos/donaciones/migraciones.test.js --no-file-parallelism --reporter=verbose
```

Se verifica el nombre real en PostgreSQL antes de crear esquemas. Cada esquema tiene
un nombre generado por la prueba. Se elimina únicamente ese esquema al cerrar; no se
vacían tablas públicas, bases o volúmenes. El directorio temporal del simulador se
comprueba dentro de la carpeta temporal y con prefijo propio antes de eliminarlo.

| Ejecución                                                  | Inicio mostrado por Vitest | Código | Resultado                                                                                                                                                                                         |
| ---------------------------------------------------------- | -------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Antes de crear 009                                         | 20:03:18                   |      1 | Dos hooks fallan por ENOENT de 009; 62 casos quedan omitidos por esa preparación fallida y 6 casos iniciales del soporte pasan. No es una validación satisfactoria del esquema. Duración 13,35 s. |
| Después de crear 009                                       | 20:04:37                   |      0 | 68/68 aprobados, 0 fallidos/omitidos. Duración 10,63 s.                                                                                                                                           |
| Final, con índices, bcrypt y guardia de esquema incompleto | 20:08:02                   |      0 | 68/68 aprobados, 0 fallidos/omitidos. Duración 7,61 s; 6,85 s de pruebas.                                                                                                                         |

Vitest 2.1.9. Total final: 62 casos de esquema/regresión de 004 y 6 de soporte.
La consulta posterior independiente confirma ong_test_hu01, **0 esquemas temporales**
con los prefijos de esta entrega y **0 tablas en public**.
No se ejecutan otras suites, instalaciones, Stripe/SMTP reales o migraciones en desarrollo.

## Formato y conservación

Prettier 3.6.2, configuración común, sobre los seis JavaScript/Markdown del bloque:

```powershell
$hu01Prettier = 'C:\Users\Nada\AppData\Local\npm-cache\_npx\83e71da30ae7cab2\node_modules\prettier\bin\prettier.cjs'
$hu01Archivos = @(
    'backend/src/db/migraciones/LEEME.md',
    'backend/src/modulos/donaciones/migraciones.test.js',
    'backend/src/modulos/donaciones/pruebas/soporte.js',
    'specs/spec-001/tasks.md',
    'specs/spec-001/refinamiento/revision-tecnica-01.md',
    'specs/spec-001/refinamiento/validacion-local-01.md'
)
node $hu01Prettier --config .prettierrc.json --write @hu01Archivos
node $hu01Prettier --config .prettierrc.json --check @hu01Archivos
```

Comprobación final de formato: código 0. Prettier sin plugins no procesa SQL; su sintaxis
y restricciones se validan ejecutándolo en PostgreSQL, sin instalar un formateador SQL.
Se contrastan huellas de 004, migraciones previas, migrador, secretos e informes históricos.
La ficha de revisión recibe únicamente la ampliación de alcance autorizada y formato;
los informes de analyze, clarify y validaciones anteriores permanecen intactos.

## Balance y parada

T008–T013 y T019 completadas en el alcance descrito. T006 y T007 no se marcan.
La incorporación compartida y el número definitivo siguen pendientes.
No se implementan rutas, reconciliación, confirmaciones de correo o pantallas.
Bloque detenido para revisión; sin git add, commit, push, merge o cambio de rama.
