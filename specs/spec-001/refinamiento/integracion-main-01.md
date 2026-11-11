# Integración local de main en spec-001 — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Responsable:** Nada · **Revisor:** Rubén, revisión pendiente.

**Origen local:** 95dd58d0caed3c2ce23b1a5c011619190f7200ea.
**Destino integrado:** origin/main, 272afd65a3a6f0a52129667c889e272c113456be.

## Estado inicial y autorización

La rama inicial es spec-001, sincronizada con origin/spec-001 en 95dd58d, índice vacío
y sin cambios funcionales pendientes. Se conserva `.env` y todos
los informes de HU-01. Se autoriza integrar main en esta rama, no incorporar HU-01 a main.

`git fetch origin` falla inicialmente por permiso de escritura de FETCH_HEAD en el entorno
restringido. Se repite con el acceso necesario y termina con salida 0. origin/main sigue
en el commit conocido 272afd65; no hay alcance publicado nuevo sobre esa referencia.
Incluye HU-05/HU-06 y 006_voluntariado.sql. El árbol del destino no contiene ninguna 009.

Se ejecuta `git merge --no-commit --no-ff origin/main`. Devuelve salida 1 por los cuatro
conflictos previstos. Se conserva el merge en curso, sin commit ni cambio de rama.
El cierre de converge-3 corresponde al árbol anterior y no se reutiliza como validación
del resultado integrado.

## Resolución por archivo

| Archivo                                  | Decisión de integración                                                                                                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backend/src/app.js                       | Mantener auth, proyectos, donaciones, voluntariado y actividades. Voluntariado precede a actividades para no ocultar /actividades/disponibles. Un solo webhook de donaciones con raw antes de JSON/sesión y verificación existente. |
| backend/src/db/semillas/index.js         | Conservar sembrarActividades(pool), sembrarDonaciones(pool) y sembrarVoluntariado(pool, hash), después de usuarios/proyectos comunes y en ese orden.                                                                                |
| frontend/src/components/comunes/Menu.jsx | Mantener Donar y Actividades públicas, Mi calendario para voluntario, gestión para coordinador y entradas/salidas existentes. El servidor conserva la autoridad de permisos.                                                        |
| backend/src/db/migraciones/LEEME.md      | Combinar 006 incorporada desde main con 004 validada y 009 como elección local sin reserva/aprobación. Registrar la referencia exacta del destino y el control de integración pendiente.                                            |

No se selecciona ours/theirs para archivos completos. Los módulos de voluntariado,
actividades, componentes/páginas de Javi, sus especificaciones, vitest.config.js y el
script frontend test combinados automáticamente se contrastan contra origin/main y
coinciden sin cambios propios. No se modifican las migraciones ni el migrador.

## Aislamiento y primera validación

Antes de ejecutar se leen las pruebas de voluntariado/calendario y actividades. Usan
TEST_DATABASE_URL y hacen TRUNCATE/DELETE; no basta que la variable exista para proteger
una base. No se ejecutan en desarrollo ni en public de ong_test_hu01.

Para donaciones se seleccionan en memoria DATABASE*URL y TEST_DATABASE_URL iguales,
con ruta ong_test_hu01, a partir solo de DATABASE_URL de `.env`, sin imprimirla ni cargar
el resto del archivo. Se verifica current_database(). NODE_ENV=test y las credenciales
de pasarela/sesión son sintéticas. Stripe y SMTP permanecen simulados. El soporte existente
crea/verifica/limpia exclusivamente sus esquemas hu01*\*.

Se amplía registro.test.js con dos comprobaciones de integración: coexistencia de rutas
y roles y ejecución doble del índice real de semillas en otro esquema exclusivo. Se
comparan cardinalidades de nueve tablas y las filas completas de aportaciones; no son
pagos o mensajes reales. La prueba previa de webhook/raw/sin sesión se conserva.

Desde backend:

```powershell
npm test -- src/modulos/donaciones/registro.test.js --no-file-parallelism
```

**Resultado inicial dirigido:** 3/3 aprobadas, sin omisiones; inicio 07:38:14 mostrado
por Vitest, duración 11,02 s. El registro conjunto de semillas se ejecuta dos veces sin
duplicados ni alteración de aportaciones sintéticas.

Primera regresión integrada, también desde backend:

```powershell
npm test -- src/modulos/donaciones src/servicios-comunes/correo.test.js --no-file-parallelism
```

**Fallo inicial observado antes de corregir:** dos casos de migraciones.test.js,
«el migrador incorpora 004 pendiente aunque 005 ya esté registrada», uno por secuencia.
Esperaban seis nombres registrados; el migrador integrado registra correctamente siete,
incluyendo 006_voluntariado.sql. La expectativa de HU-01 no contemplaba la migración
publicada de Javi. Es un desfase de la prueba, no un fallo o cambio del migrador/SQL.
La evidencia inicial se conserva aquí; Se completará el resultado total al finalizar.

**Resultado total de esa primera ejecución:** salida 1; 393 aprobadas y 2 fallidas,
395 casos en 13 archivos, sin omisiones. Inicio 07:38:46, duración 52,96 s. El diff de la
aserción muestra únicamente el nombre adicional 006_voluntariado.sql. Se ajusta esa lista
esperada en migraciones.test.js, sin modificar SQL, restricciones, migrador o protección
de esquemas. Los casos de no reaplicación y conservación de 004 permanecen intactos.

## Validación final del árbol integrado

Se repite la regresión de HU-01/correo después de ajustar únicamente la expectativa de 006. Mismo comando anterior, conexiones verificadas y esquemas aislados:
**salida 0, 395/395 aprobadas**, 13 archivos, sin omisiones; inicio 07:40:40 y duración
50,91 s. Incluye las tres pruebas de registro/semillas y las regresiones de CONV-001/002.
El aviso «No se aceptó el correo de verificación» corresponde al caso SMTP simulado
fallido previsto en rutas.test.js, no a un envío real ni a un fallo de la ejecución.

### Voluntariado, calendario, actividades y base común

Se crea una base nueva, exclusiva de este bloque:
`ong_test_integracion_hu01_20261107_7c1a89`, OID 74865. Se exige que no exista antes;
se selecciona en memoria en DATABASE_URL y TEST_DATABASE_URL y se verifica su nombre
mediante current_database() antes de migrar o probar. No se reutiliza otra base.

Desde backend, únicamente sobre esa base:

```powershell
node src/db/migrar.js
npm test -- src/modulos/voluntariado src/modulos/actividades src/app.test.js src/servicios-comunes/comunes.test.js --no-file-parallelism
```

Migración correcta de 001, 002, 003, 004, 005, 006 y 009. Pruebas: **101 aprobadas y 3
omitidas de 104**, cinco archivos, salida 0; inicio 07:41:55, duración 16,91 s. Desglose:
HU-05 34, calendario HU-06 13, actividades 41 aprobadas y 3 omitidas, app 6 y comunes 7.
Las tres it.skip de actividades ya existían: promoción al cancelar, posiciones tras
salir de espera y concurrencia plazas/inscripción. No se activan ni presentan como
aprobadas. La suite HU-05 ejecuta integración real con actividades y correo simulado.

Las ejecuciones de suites son secuenciales. Al terminar se comprueba que la base temporal
conserva el mismo nombre/OID y no tiene conexiones; Se elimina sin FORCE. No se elimina
ninguna base anterior, volumen o esquema ajeno. Los esquemas de HU-01 se limpian mediante
su soporte verificado; sus pruebas de migraciones conservan el inventario previo de public.

### Frontend, menú y rutas

Desde frontend:

```powershell
npm test
npm run build
```

**5/5 pruebas de vuelta.js aprobadas**, sin omisiones, con node --test. **Build Astro
correcto**, salida 0, con islas de donación, actividades disponibles y calendario; se
generan los artefactos ignorados habituales dist/. No se instalan dependencias.

Se evalúa la lista declarativa real de Menu.jsx y se contrasta su filtro por rol con
aserciones de Node; las páginas de destino existen:

| Cuenta             | Enlaces funcionales visibles contrastados   |
| ------------------ | ------------------------------------------- |
| Invitado o donante | Actividades y Donar.                        |
| Voluntario         | Actividades, Donar y Mi calendario.         |
| Coordinador        | Actividades, Donar y Gestionar actividades. |

Se conservan Entrar, Crear cuenta y Salir. La comprobación es de configuración/filtro y
compilación, no una nueva inspección visual o prueba de hidratación en navegador.
Las pruebas HTTP del registro integrado acreditan listado disponible público 200,
calendario 401 sin cuenta/403 donante/200 voluntario y coexistencia con contexto de
donaciones y permisos de actividades. La prueba existente de webhook usa cuerpo Buffer
y confirma sin consultar sesión; el adaptador conserva las pruebas sintéticas de firma.
La inspección del registro comprueba un solo endpoint webhook y raw antes de JSON/sesión.

### Formato y conservación

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

La comparación SHA-256 conserva .env, 004/009, todos los informes
anteriores y demás archivos propios de HU-01 salvo sus dos pruebas señaladas. La migración
006 y los SQL ya publicados coinciden con el destino; no se edita ningún SQL ni migrador.
Los cambios propios adicionales a la resolución son solo registro.test.js,
migraciones.test.js y este informe. Las modificaciones en actividades y demás partes de
Javi proceden de origin/main, sin correcciones propias en sus módulos.

## Estado de 009 y controles pendientes

El árbol actualizado y fijado de origin/main no contiene 009; Se integra 006 sin colisión
con 004/009. Esto acredita ausencia en ese destino exacto, numeración definitiva ni
disponibilidad garantizada frente a trabajo sin publicar o futuros commits. No se renombra,
reaplica en entornos existentes o edita una migración para resolver la integración.

el control de revisión mantiene pendiente la revisión/aprobación de Rubén. el control de integración conserva la explicación
de 009 y la resolución de conflictos antes de incorporar a main, considerando que hay
entornos donde ya está aplicada. El merge local sin conflictos no completa esos controles.
No se ejecuta un nuevo converge ni se reescriben sus informes. La validación de este árbol
es la registrada aquí, no una extensión automática del cierre técnico anterior.

## Merge e inventario exacto para revisión

HEAD permanece en 95dd58d0caed3c2ce23b1a5c011619190f7200ea y MERGE_HEAD en
272afd65a3a6f0a52129667c889e272c113456be. Merge en curso, conflictos resueltos y sin commit.
Se usa git add únicamente para los cuatro archivos inicialmente conflictivos, con rutas
explícitas, sin git add . ni selección de secretos/configuración.

Git ya había seleccionado automáticamente los otros 56 archivos incorporados. El índice
contiene **60 rutas: 48 altas, 11 modificaciones y una eliminación**. La eliminación es el
.gitkeep de voluntariado sustituido por sus componentes. Inventario de
`git diff --cached --name-status`:

```text
M	backend/src/app.js
A	backend/src/db/migraciones/006_voluntariado.sql
M	backend/src/db/migraciones/LEEME.md
M	backend/src/db/semillas/index.js
A	backend/src/db/semillas/voluntariado.js
M	backend/src/modulos/actividades/inscripciones.js
M	backend/src/modulos/actividades/servicio.js
A	backend/src/modulos/voluntariado/actividades.js
A	backend/src/modulos/voluntariado/calendario.test.js
A	backend/src/modulos/voluntariado/controlador.js
A	backend/src/modulos/voluntariado/repositorio.js
A	backend/src/modulos/voluntariado/rutas.js
A	backend/src/modulos/voluntariado/servicio.js
A	backend/src/modulos/voluntariado/servicio.test.js
A	backend/vitest.config.js
M	frontend/package.json
M	frontend/src/components/comunes/Menu.jsx
D	frontend/src/components/voluntariado/.gitkeep
A	frontend/src/components/voluntariado/ActividadCalendario.jsx
A	frontend/src/components/voluntariado/ActividadesDisponibles.jsx
A	frontend/src/components/voluntariado/CalendarioVoluntario.jsx
A	frontend/src/components/voluntariado/CancelarInscripcion.jsx
A	frontend/src/components/voluntariado/FormInscripcion.jsx
A	frontend/src/components/voluntariado/ListaCalendario.jsx
A	frontend/src/components/voluntariado/MesCalendario.jsx
A	frontend/src/components/voluntariado/TarjetaActividad.jsx
A	frontend/src/components/voluntariado/fechas.js
A	frontend/src/components/voluntariado/vuelta.js
A	frontend/src/components/voluntariado/vuelta.test.js
A	frontend/src/pages/actividades/index.astro
A	frontend/src/pages/mi-calendario.astro
M	specs/spec-005/checklists/requirements.md
A	specs/spec-005/contracts/api-voluntariado.md
A	specs/spec-005/data-model.md
A	specs/spec-005/plan.md
A	specs/spec-005/quickstart.md
A	specs/spec-005/refinamiento/analyze-1.md
A	specs/spec-005/refinamiento/analyze-2.md
A	specs/spec-005/refinamiento/clarify-1.md
A	specs/spec-005/refinamiento/converge-1.md
A	specs/spec-005/refinamiento/converge-2.md
A	specs/spec-005/refinamiento/prueba-manual.md
A	specs/spec-005/research.md
M	specs/spec-005/spec.md
A	specs/spec-005/tasks.md
M	specs/spec-006/checklists/requirements.md
A	specs/spec-006/contracts/api-calendario.md
A	specs/spec-006/data-model.md
A	specs/spec-006/plan.md
A	specs/spec-006/quickstart.md
A	specs/spec-006/refinamiento/analyze-1.md
A	specs/spec-006/refinamiento/analyze-2.md
A	specs/spec-006/refinamiento/clarify-1.md
A	specs/spec-006/refinamiento/converge-1.md
A	specs/spec-006/refinamiento/converge-2.md
A	specs/spec-006/refinamiento/prueba-manual.md
A	specs/spec-006/refinamiento/revision-pr-3.md
A	specs/spec-006/research.md
M	specs/spec-006/spec.md
A	specs/spec-006/tasks.md
```

**Cambios existentes sin seleccionar** (`git diff --name-status`):

```text
M backend/src/modulos/donaciones/migraciones.test.js
M backend/src/modulos/donaciones/registro.test.js
```

**Sin seguimiento:** este informe, specs/spec-001/refinamiento/integracion-main-01.md,
y  conservado. .env sigue ignorado y fuera del índice. El informe y
las pruebas añadidas no se seleccionan, porque la autorización de git add se limita a
marcar los conflictos; el índice actual por sí solo no incluye esas evidencias nuevas.

## Límites y parada

La validación es local, con datos sintéticos y Stripe/SMTP simulados. No se realizan
pagos, cancelaciones, reenvíos o nuevas comprobaciones reales de Stripe/Mailpit. No se
prueba aquí un recorrido manual completo de navegador ni se eliminan los tres skip
anteriores de actividades. No quedan comprobaciones requeridas sin ejecutar fuera de
los límites explícitos de esas omisiones y de la inspección del menú.

Se conserva el merge para revisión, sin abortar, restaurar archivos, cambiar de rama,
hacer commit/push, publicar PR, integrar spec-001 hacia main o enviar comunicaciones.

**Commit de integración propuesto, no ejecutado:**
`HU-01: integra main con voluntariado y calendario`.
