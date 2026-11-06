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

## Backend de donación puntual — T024–T044 · 2026-11-06

**Responsable**: Nada · **Revisor**: Rubén (revisión pendiente). Estado inicial: `spec-001`
limpia, HEAD `edc621c`, «HU-01: añade persistencia operativa y soporte de integración».
El procedimiento local de speckit-implement se aplica directamente al bloque autorizado;
se omiten los hooks opcionales de commit. La selección temporal
SPECIFY_FEATURE_DIRECTORY=specs/spec-001 resuelve la funcionalidad sin alterar configuración;
el script de prerrequisitos devuelve esa ruta y requirements.md conserva sus 16 comprobaciones
satisfechas. No se repiten fases cerradas.

### Cambios y comprobaciones

- `repositorio.js` y `confirmaciones.js`: resumen lógico único e inmutable, reclamación
  atómica, reserva de treinta segundos renovada cada diez y resultado condicionado al
  intento vigente. SMTP se invoca tras el commit; reintentar el correo no toca dinero.
- `servicio.js`: identidad sin sobrescritura, bloqueo ordenado por NIF y correo,
  preparación atómica y creación/reanudación bajo exclusión por conexión. Se conservan
  UUID canónico, referencia, huella, cuerpo y clave. El plazo de 23 horas usa el reloj de
  PostgreSQL y no se renueva; tampoco el permiso invitado de ocho horas. Se comprueban
  preparación ocupada, timeout, pérdida de conexión, desbloqueo imposible y recuperación
  desde otro proceso con el simulador persistente. Solo se termina el cliente propio de
  la prueba de pérdida de conexión, obtenido al adquirir su exclusión.
- `repositorio.js` y `servicio.js`: serialización por PaymentIntent, registro atómico de
  evento/cobro/notificación, rechazo seguido de éxito sobre la misma fila, confirmada
  inmutable, rollback y eventos simultáneos o antiguos. Checkout solo correlaciona/cierra;
  no confirma dinero. Una reentrega registrada puede recuperar el correo sin consultar
  otra vez Stripe. Una respuesta tardía de Checkout no reabre ni oculta una confirmación.
- `controlador.js` y `rutas.js`: contexto, creación puntual, DTO corto autorizado, resultado
  privado, reintento de correo y vínculo por enlace. Zod rechaza campos ajenos. Origen/CSRF
  se exigen al navegador; propiedad se obtiene del servidor. Correo coincidente, UUID y
  referencia no conceden acceso. Se comprueban errores 400/401/403/404/409/503 y el error
  común de infraestructura, sin detalles internos.
- Vínculo: token aleatorio de 32 bytes, solo hash persistido, treinta minutos, cuenta
  solicitante, invalidación del enlace anterior y consumo/asignación atómicos. Se prueban
  otra cuenta, vencimiento, repetición, consumo concurrente, conflicto de vínculo y GET sin
  consumo. El 202 genérico no acredita envío ni vínculo y se conserva ante fallo SMTP.
- `app.js`: registro del router y webhook POST con raw antes de JSON y sesiones. La prueba
  de la aplicación real confirma sin consultar el almacén de sesiones, incluso con cookie
  y almacén simulado no disponible. Comprueba también auth, proyectos y permisos de
  actividades. Los valores de autenticación/cookies no cambian; el resto del diff es formato.

Las pruebas se escribieron antes del servicio correspondiente. Los primeros comandos de
confirmaciones, servicio/rutas y eventos fallaron al faltar los módulos, sin omitir pruebas.
Las comprobaciones adicionales detectaron una URL cerrada todavía ofrecida, un resultado
antiguo tras confirmación concurrente y una dependencia externa innecesaria al repetir un
evento; esos casos fallaron antes de sus correcciones y pasan en el resultado final. También
se corrigieron dos errores de las pruebas: el tipo de error de firma simulado y una consulta
que no seleccionaba la referencia para compararla tras el reinicio.

### Comandos y resultados reales

Desde `backend`, selección de DATABASE_URL y TEST_DATABASE_URL iguales para **ong_test_hu01**,
derivadas de la conexión local sin imprimirla ni modificar .env. NODE_ENV=test. El soporte
comprueba nombre de base y search_path, crea esquemas propios y los elimina al terminar;
el reinicio recibe la URL del esquema de su prueba. No se vacía public ni otra base.
Las suites se ejecutan secuencialmente, sin instalaciones, SMTP o Stripe reales.

```powershell
npm test -- src/modulos/donaciones/confirmaciones.test.js --no-file-parallelism
npm test -- src/modulos/donaciones/servicio.test.js src/modulos/donaciones/rutas.test.js --no-file-parallelism
npm test -- src/modulos/donaciones/eventos.test.js --no-file-parallelism
npm test -- src/modulos/donaciones --no-file-parallelism
npm test -- src/servicios-comunes/correo.test.js --no-file-parallelism
```

Resultado final del módulo a las 20:42:18, hora local: **9 archivos y 288 pruebas aprobadas**,
código 0, duración 22,78 s. La regresión adicional de correo aprueba **16 pruebas**, código 0.

| Archivo de prueba en donaciones | Pruebas aprobadas |
| ------------------------------- | ----------------: |
| migraciones.test.js             |                68 |
| pasarela.test.js                |                36 |
| normalizacion.test.js           |               102 |
| autorizacion.test.js            |                35 |
| confirmaciones.test.js          |                 6 |
| servicio.test.js                |                17 |
| rutas.test.js                   |                 9 |
| eventos.test.js                 |                14 |
| registro.test.js                |                 1 |

Desde la raíz, Prettier 3.6.2 ya disponible en caché se aplica y comprueba únicamente en
los once archivos JavaScript del bloque, tasks.md y este informe. Comprobación final:
código 0. `git diff --check` termina con código 0. Los identificadores y dependencias de
las tareas se conservan; T029/T030/T027 añaden las rutas de sus pruebas efectivas.

Comandos de formato ejecutados con `$hu01Prettier` apuntando al binario de esa versión
en caché y `$hu01Archivos` conteniendo esos trece archivos, desde la raíz:

```powershell
node $hu01Prettier --config .prettierrc.json --write @hu01Archivos
node $hu01Prettier --config .prettierrc.json --check @hu01Archivos
git -c core.autocrlf=true diff --check
```

### Ajuste respecto al contrato y límites

El paso 3 de [Entregas duplicadas, concurrencia y desorden](../contracts/pasarela-stripe.md#entregas-duplicadas-concurrencia-y-desorden)
describe consultar Stripe dentro de una transacción. La condición expresa de este bloque
exige hacerlo fuera: se mantiene exclusión consultiva por conexión mientras se consulta y
después una transacción corta con bloqueo de la aportación guarda evento, dinero y correo.
Así se mantiene la serialización sin transacciones durante Stripe o SMTP ni tablas nuevas.
Este ajuste se documenta para revisión; el contrato y los documentos comunes permanecen
intactos. La alineación de esa redacción queda pendiente de revisión documental.

**T024–T044 completadas** en el alcance local comprobado. T006 y T007 siguen pendientes;
009 es provisional y no acredita reserva colectiva. No se modifica 004, 009, autenticación,
roles, configuración, secretos, módulos ajenos o los informes históricos. Se añaden cinco
archivos de implementación y cinco de pruebas en donaciones; solo cambian además app.js,
tasks.md y este informe, conservando íntegro su contenido anterior.

Las simulaciones no acreditan idempotencia real de Stripe, recepción en buzón ni Checkout
real. Las firmas sintéticas del adaptador y los mocks HTTP no equivalen a un endpoint real
configurado. La integración de rutas se acredita solo para los casos ejecutados. No se
implementan alta de socio, cuotas, frontend o HU-02. T045 y posteriores quedan sin marcar.
La revisión de Rubén y la incorporación compartida siguen pendientes. Sin git add, commit,
push, merge o cambio de rama; entrega detenida para revisión.

### Comprobación adicional antes de registrar la entrega

Se repiten las pruebas: 288 del módulo y 16 de correo aprobadas. La revisión detecta que
un fallo tardío podía cambiar cancelada a rechazada, transición ajena al modelo. Se añade
la condición que conserva cancelada salvo cobro acreditado y una prueba que comprueba
tanto esa conservación como la confirmación posterior de la misma aportación.

La suite completa posterior termina con código 0: 289 pruebas aprobadas en nueve archivos,
ninguna fallida u omitida; inicio 20:53:14 y duración 26,46 s. Eventos pasa de 14 a 15 casos.
La regresión de correo conserva sus 16 casos aprobados. Se mantienen las evidencias anteriores,
las limitaciones de simulación y la alineación contractual pendiente.

## Frontend de donación puntual, vínculo y semillas — T045–T053 · 2026-11-06

Entorno: Windows, Node 22.20.0 y PowerShell. Backend en el puerto 3000, frontend en 4321 y
Mailpit en 8025. STRIPE_SECRET_KEY vacía y sin Checkout real.

### Cambios

- **Restauración.** Los archivos nuevos de T045–T053 se habían borrado del árbol de trabajo
  y se restauraron sin cambios. Los cambios sobre archivos versionados se rehicieron:
  Menu.jsx, semillas/index.js y el paso 3 de pasarela-stripe.md.
- **Correcciones antes de registrar:**
  - FormDonacion: PAGO_NO_DISPONIBLE expresa incertidumbre y no afirma que no haya habido
    cobro.
  - El formulario ya no ofrece cambiar de clave ante ningún error ni tras recargar.
    ResultadoDonacion solo libera la clave tras «rechazada» o «cancelada» informadas por el
    servidor y sin revisión requerida.
  - Los correos de confirmación y de verificación se dirigen al donante y se generan con
    textoCorreo.js, una función pura. El resumen guardado no cambia.
  - Resultado: no aparece la fila «Fecha» vacía, hay un único aviso tras el reenvío y
    «Fondo general» se muestra con mayúscula inicial.
  - Contrato pasarela-stripe.md, paso 3: la consulta a Stripe se hace fuera de la
    transacción, con la exclusión mantenida por la conexión. En los pagos, la transacción
    corta vuelve a comprobar el evento y lo registra de forma idempotente. La alineación
    documental queda pendiente de la revisión de HU-01.

### Comandos y resultados reales

| Comando o recorrido | Resultado |
| --- | --- |
| `npm test -- src/modulos/donaciones --no-file-parallelism` (ong_test_hu01) | 10 archivos; 310 pruebas aprobadas y 0 omitidas: 289 previas más 21 de `textoCorreo.test.js`. Antes de corregir los correos se habían obtenido 289/289. |
| `src/servicios-comunes/correo.test.js` | 16/16 aprobadas. |
| `npm run build` (frontend) | Correcto. |
| `npm run migrar` sobre `ong` (Docker, 127.0.0.1:5440), inicialmente vacía | Se aplicaron 001–005 y 009. |
| `npm run semillas`, primera ejecución | 6 usuarios, 3 proyectos, 5 actividades, 3 donantes, 5 aportaciones y 3 correos. |
| `npm run semillas`, segunda ejecución | 0 aportaciones nuevas. Recuentos y huella MD5 del contenido de aportaciones y correos_aportacion idénticos entre ejecuciones. |

Las aportaciones sembradas son sintéticas y no tienen identificadores de Stripe: no son
cobros, y el estado «enviado» de las semillas no acredita ningún envío.

Recorridos en el navegador:

- /donar es accesible sin cuenta y el menú muestra el enlace «Donar». Con importe 0,99 y
  campos vacíos aparecen errores junto a cada campo y no se hace ninguna petición a la API.
- Un envío válido devuelve 503 PASARELA_NO_CONFIGURADA con un mensaje neutro, y se conserva
  la aportación pendiente con su operación. Al recargar:
  - se mantiene el mismo UUID en sessionStorage;
  - solo se ofrece «Continuar el pago»;
  - el envío del formulario queda desactivado.

  «Continuar el pago» reenvía con el mismo UUID y no crea otra operación: la base contiene
  una sola.
- /donar/resultado de una aportación ajena muestra «No podemos mostrar esta aportación», sin
  datos. La propia se muestra como pendiente, sin dar el cobro por hecho.
- Vínculo con donante@ong.test:
  - la solicitud devuelve 202 con un aviso genérico y el correo llega a Mailpit;
  - el token va en el fragmento: al abrir la página se retira de la URL y se guarda en
    sessionStorage, y la base confirma que no se consume;
  - al confirmar por POST, el Donante queda vinculado y el token se marca como usado
    (caducidad de 30 minutos);
  - reutilizar el enlace muestra «El enlace no es válido…»;
  - la cuenta vinculada ve su aportación confirmada y no ve una ajena.
- Reintento del correo de una aportación confirmada con correo fallido (donante2@ong.test):
  - el correo llega a Mailpit en UTF-8, con el texto nuevo: «Importe: 50,00 €», «Fecha de
    cobro: 01/11/2026», «Modalidad: Donación puntual», «Destino: Comedor social» y la
    referencia;
  - la aportación sigue confirmada, con el mismo importe y la misma fecha, y aparece un
    único aviso de éxito;
  - para repetir la prueba, el correo sintético se volvió a poner en «fallido» en la base de
    desarrollo.
- El nuevo correo de verificación llega a Mailpit. Explica el propósito, la caducidad, la
  cuenta, el uso único y qué hacer si no se pidió.

### Límites

- No se ha usado Stripe real, así que no se prueban Checkout ni la idempotencia real. SC-001 y
  SC-002 no se declaran.
- La recepción en Mailpit es local y no acredita la entrega a buzones reales.
- La confirmación con otra cuenta, la caducidad, la operación en curso y la revisión requerida
  se cubren solo con pruebas automatizadas, no con recorridos en el navegador.
- La caducidad de 30 minutos está en el SQL y repetida en el texto del correo.
- Un token rechazado se conserva en la pestaña hasta pulsar «Solicitar otro enlace».
- La pantalla no separa los miles en importes de cuatro cifras («1234,50 €»), porque formato.js
  es común; el correo sí los separa («1.234,50 €»).
- La base de desarrollo contiene además una aportación pendiente de prueba y una cuenta local
  de prueba.
- T006 y T007 siguen pendientes.

## Alta y cuotas de socio — T054–T072 · 2026-11-06

Entorno: Windows y Node 22.20.0. Backend en el puerto 3000 y frontend en 4321;
STRIPE_SECRET_KEY vacía y sin Checkout real.

### Cambios

- **Pruebas (T054–T057):**
  - alta en `servicio.test.js`;
  - reconciliación de facturas y suscripciones en el nuevo `cuotas.test.js`;
  - permisos y correo de cuota en `rutas.test.js`;
  - textos de cuota en `textoCorreo.test.js`.

  Los casos de T055 y T056 están en `cuotas.test.js`, no en `pasarela.test.js` ni en
  `servicio.test.js`, porque necesitan PostgreSQL real.
- **Backend (T058–T068):**
  - el alta reutiliza el protocolo de creación de US1 y crea la suscripción pendiente con su
    cuota inicial;
  - los eventos invoice.* y customer.subscription.* se reconcilian bajo el bloqueo sub:<id>,
    con la consulta a la pasarela fuera de la transacción;
  - las cuotas solo se confirman por invoice.paid con pago verificado;
  - el aviso fallo_cuota se guarda en correos_aportacion, deduplicado y separado de la
    confirmación;
  - la previsión se toma de los recursos actuales;
  - el resultado incluye la suscripción.

  No se han modificado 004, 009, el adaptador común de pasarela ni el de correo.
- **Frontend y semillas (T069–T071):**
  - el formulario exige elegir la modalidad y, para socio, la periodicidad;
  - el resultado muestra periodicidad, estado de la suscripción, próxima fecha y rechazo de
    cuota;
  - las semillas añaden cuatro casos sintéticos de socio del Donante vinculado a
    donante2@ong.test.
- **Corrección de aislamiento:** la prueba del destino de socio y la S02 de `cuotas.test.js`
  crean su propio proyecto activo, en lugar de reutilizar fixtures.proyecto, que otra prueba
  deja inactivo. El código de producción no cambió.

### Decisiones no fijadas en la spec

**Backend, T054–T068:**

- **Descripción del Checkout de socio:** «Cuota de socio (periodicidad): destino».
- **Referencia de las cuotas de ciclo:** `DON-<uuid>`, el mismo formato que la puntual.
- **Checkout del alta caducado sin Subscription:** cancela la suscripción pendiente.
- **Alta nunca cobrada:** su aportación pasa a cancelada al cerrarse definitivamente la
  suscripción (canceled o incomplete_expired).
- **Previsión solo con alta activa:** con la suscripción pendiente o cancelada, la próxima
  fecha es null.
- **Sin aviso fallo_cuota** con la suscripción cancelada ni en el primer cobro; la cuota se
  registra igualmente como rechazada.
- **Criterio de «fallo de la última factura»:** factura open, no pagada, con PaymentIntent en
  requires_payment_method.
- **Ambigüedad al recuperar la factura inicial:** se registra una incidencia y se responde
  200, por lo que ese ciclo requiere revisión manual.
- **Bloqueos:**
  - la Session del alta se correlaciona bajo checkout:<id>, con bloqueo de fila sobre la
    suscripción;
  - las facturas y suscripciones, bajo sub:<id>, identificando la suscripción con
    data.object.subscription del evento firmado; decide el recurso actual.
- **Asunto y contenido de los mensajes:**
  - asunto del aviso: «Aviso de cuota de socio no cobrada»;
  - el resumen de confirmación de una cuota añade periodicidad y fechaProximoCobro;
  - el aviso contiene referencia, importe, motivo y fechaProximoCobro.
- **Vencimiento de la previsión:** se compara con ahora(), que respeta AHORA_SIMULADO; la
  ventana de 23 horas de la creación no cambia.

Las dos decisiones de cancelación (Checkout del alta caducado sin Subscription y alta nunca
cobrada al cerrarse la suscripción) deben comentarse con el revisor de HU-01.

**Frontend y semillas, T069–T071:**

- **Modalidad como desplegable** sin valor por defecto, que obliga a una elección explícita.
- **Cuota posterior:** se identifica en pantalla por la ausencia de preparacion; su rechazo
  muestra «Esta cuota no se ha podido cobrar» y no ofrece «Hacer otra donación».
- **Suscripción cancelada:** no muestra línea de próximo cobro.
- **Textos nuevos:** «Pendiente de confirmación del primer cobro» y «¡Gracias! Esta cuota de
  socio está confirmada».
- **Semillas sin operaciones_pago**, para no inventar una instantánea de Checkout.
- **Idempotencia de las semillas por la referencia del alta:** cada caso se crea completo en
  su propia transacción.

### Comandos y resultados reales

| Comando o recorrido | Resultado |
| --- | --- |
| Primera ejecución de la suite de donaciones tras T054–T068 (ong_test_hu01) | 349/350. El fallo era de aislamiento (fixtures.proyecto inactivo); se corrigió en las pruebas sin cambiar el código de producción. |
| `npm test -- src/modulos/donaciones --no-file-parallelism` (ong_test_hu01) | 11 archivos; 350 pruebas aprobadas y 0 omitidas: `cuotas.test.js` 26, `servicio.test.js` 24, `rutas.test.js` 11 y `textoCorreo.test.js` 26. Las pruebas de US1 se mantienen. |
| `src/servicios-comunes/correo.test.js` | 16/16 aprobadas. |
| `npm run build` (frontend) | Correcto. |
| `npm run semillas`, primera ejecución sobre `ong` | 4 suscripciones y 7 cuotas de socio; 0 aportaciones puntuales nuevas. |
| `npm run semillas`, segunda ejecución | 0 nuevas. Recuentos y huellas MD5 de suscripciones_socio, aportaciones y correos_aportacion idénticos. |

Casos sembrados:

- activa mensual con próxima fecha futura;
- activa con cuota de ciclo rechazada, aviso fallo_cuota y previsión nula;
- alta trimestral pendiente sin fecha;
- anual cancelada con sus cuotas confirmadas conservadas.

No tienen identificadores de Stripe. Son datos sintéticos y el estado «enviado» no acredita
envíos.

Recorridos en el navegador:

- **Formulario.** La modalidad es obligatoria; con «Hacerme socio» aparece la periodicidad.
  Sin ella, el error aparece en el campo y no se hace ninguna petición a la API.
- **Alta completa** (trimestral, 12,50 €, Agua potable): devuelve 503
  PASARELA_NO_CONFIGURADA. En la base:
  - suscripción pendiente, sin fecha_alta ni identificador externo;
  - cuota_socio pendiente con su operación;
  - Donante no vinculado a la cuenta con sesión por coincidir el correo;
  - UUID conservado.
- **Resultado del alta:** «Pendiente de confirmación del primer cobro» y próximo cobro
  «Pendiente de confirmación».
- **Cuenta ajena:** no ve las cuotas sembradas («No podemos mostrar esta aportación»).
- **Cuotas de donante2@ong.test:**
  - cuota confirmada con periodicidad Mensual, suscripción Activa y próximo cobro 26/11/2026;
  - cuota rechazada con «Esta cuota no se ha podido cobrar», sin presentarla como pagada y
    con próximo cobro «Pendiente de confirmación»;
  - alta pendiente sin fecha;
  - cuota confirmada de una suscripción cancelada, sin línea de próximo cobro y con el aviso
    de que se conservan las cuotas cobradas.

### Límites

- No se ha usado Stripe real, así que no se prueban el Checkout de suscripción, los webhooks
  reales de invoice.* y customer.subscription.*, Smart Retries ni la idempotencia real.
- Los correos de confirmación de cuota y de fallo_cuota se verifican solo con pruebas
  automatizadas, no en Mailpit, porque los genera la recepción de webhooks.
- Las altas sembradas no tienen operación de navegador: se ven solo con la cuenta vinculada y
  se presentan como una cuota posterior.
- La base de desarrollo contiene además un alta de socio pendiente de prueba.
- T006 y T007 siguen pendientes.

## Regresión completa y seguridad — T073–T074 · 2026-11-06

Entorno: Windows y Node 22.20.0.

### Regresión completa (T073)

La suite de actividades ejecuta TRUNCATE sobre el esquema public. Para no vaciar public de
ong_test_hu01, la regresión se ejecuta por separado: la suite de donaciones sobre
ong_test_hu01 y el resto de módulos sobre una base temporal propia. La nota correspondiente
se ha añadido a la sección B de quickstart.md.

| Comando | Resultado |
| --- | --- |
| `npx vitest run src/modulos/donaciones --no-file-parallelism` (ong_test_hu01) | 11 archivos; 350 pruebas aprobadas y 0 omitidas. |
| Base temporal ong_test_t073: creación y `node src/db/migrar.js` | Migraciones aplicadas: 001, 002, 003, 004, 005 y 009. |
| `npx vitest run src/app.test.js src/modulos/actividades src/servicios-comunes --no-file-parallelism` (ong_test_t073) | 4 archivos; 70 pruebas aprobadas y 3 omitidas: `actividades/servicio.test.js` 44, con los 3 it.skip de HU-07 que esperan la integración con spec-005; `correo.test.js` 16; `app.test.js` 6; `comunes.test.js` 7. |
| Eliminación de ong_test_t073 | Base eliminada al terminar. |
| `npm --prefix frontend run build` | Correcto. El frontend no tiene suite de pruebas. |

Ningún caso de HU-01 se omitió por el entorno. Los it.skip ajenos no se han activado ni
modificado.

### Datos persistidos, sesión y registros (T074)

Comprobación sobre los datos generados en la base de desarrollo y sobre el código:

- **Instantánea de Checkout** (operaciones_pago.solicitud_checkout). Solo contiene estas
  claves:
  - mode, success_url y cancel_url;
  - client_reference_id y customer_email;
  - line_items;
  - metadata (modulo, referencia);
  - payment_intent_data o subscription_data, con la misma metadata;
  - payment_method_types ["card"].

  No contiene NIF, dirección, apellidos, CSRF, contraseñas, sesión ni datos de tarjeta.
- **verificaciones_donante:** guarda solo token_hash SHA-256 (64 hexadecimales). El token
  usado en la prueba de navegador no aparece en la base.
- **Esquema:** no hay columnas de tarjeta, IBAN o CVC; la única que contiene «token» es
  token_hash.
- **Sesiones:** solo guardan usuarioId y cookie, sin NIF, dirección ni token.
- **Acceso y errores:** que ni la referencia ni el UUID solos den acceso, y que los errores no
  revelen otro Donante, lo cubren `autorizacion.test.js`, `rutas.test.js` y
  `servicio.test.js` (S07/S08 y P13–P16), además de los recorridos de T052 y T068.
- **Registros:** el módulo de donaciones solo emite avisos genéricos (`servicio.js:381` y
  `383`).

### Límites y observaciones

- `servicios-comunes/correo.js:27` registra la dirección del destinatario cuando falla el
  SMTP. No registra el texto ni el token.
- `middleware/errores.js:33` registra el error completo en los 500 inesperados, que podría
  incluir valores de PostgreSQL.
- Ambos son archivos comunes: no se han modificado y quedan para la revisión con el revisor
  de HU-01.
- No se ha modificado la autenticación ni los roles.
- T006 y T007 siguen pendientes.
