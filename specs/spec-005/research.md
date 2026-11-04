# Research: HU-05 — Consulta e inscripción en actividades

Las decisiones técnicas generales están en [plan-comun.md](../plan-comun.md#decisiones-técnicas-research).
Aquí solo las propias de HU-05.

## R1. Aforo con peticiones simultáneas (FR-006, SC-002)

- **Decision**: `inscribir` y `cancelar` se hacen en `transaccion()` y empiezan bloqueando la fila
  de la actividad (`SELECT … FOR UPDATE`, a través de `bloquearActividad`). Con la fila
  bloqueada se cuentan las confirmadas y se decide `confirmada` o `en_espera`. Si dos personas
  piden la última plaza a la vez, la segunda espera al `COMMIT` de la primera, cuenta de nuevo y
  recibe `PLAZAS_AGOTADAS`.
- **Rationale**: es la decisión de bloqueo de plan-comun, y spec-007 bloquea la misma fila al
  editar plazas o cancelar la actividad (su R2), así que todas se serializan.
- **Alternatives considered**: aislamiento serializable con reintentos (descartado en
  plan-comun); un contador de plazas libres guardado (se descuadra).

## R2. Acceso a `actividades` (dueño: spec-007)

- **Decision**: `voluntariado` nunca consulta `actividades` con SQL propio, igual que
  `actividades` no consulta `inscripciones` (R3 de spec-007). Lo que necesita lo toma del
  servicio de `actividades` a través de un único fichero, `voluntariado/actividades.js`:
  - `listar({ estado: 'publicada', proyectoId })`, que ya existe, para el listado público; el
    filtro de «futuras» y de fechas se hace en el servicio de voluntariado sobre los recursos que
    devuelve (`celebrada`, `inicio`).
  - `bloquearActividad(id, cliente)`, **nueva**: bloquea la fila en la transacción de quien llama
    y devuelve el recurso `Actividad` (o `null`). Son tres líneas sobre `repositorio.bloquearPorId`
    y `aRecurso` que ya tiene Nicole. La usan `inscribir`, `cancelar` y `promoverListaEspera`
    (esta última la llama spec-007 dentro de su transacción después de cambiar las plazas, así que
    tiene que leer las plazas con ese mismo `cliente`).
  - `avisarPlazaConfirmada(inscripcion, actividad)`, que ya existe.
- **Rationale**: plan-comun §1 (se llama al servicio de otro módulo, nunca a su repositorio) y
  dueño único de cada tabla.
- **Acuerdo**: `bloquearActividad` se propone a Nicole el 04/11. Se escribe en la rama `spec-005` y
  solo entra en `main` con su revisión del PR (principio XI); si prefiere añadirla ella en spec-007, se
  quita de aquí.
- **Alternatives considered**: leer `actividades` desde el repositorio de voluntariado (rompe la
  propiedad de la tabla); un `listarDisponibles` nuevo en `actividades` (más código en el módulo
  de Nicole para algo que ya da `listar`).

## R3. Lista de espera solo si se pide (FR-007, clarify Q3)

- **Decision**: `POST /api/actividades/:id/inscripciones` lleva `listaEspera` (por defecto
  `false`). Sin plazas y sin `listaEspera` → 409 `PLAZAS_AGOTADAS`, y la interfaz ofrece
  «Apuntarme a la lista de espera», que repite la petición con `listaEspera: true`. Si con
  `listaEspera: true` resulta que hay plaza, se confirma directamente.
- **Rationale**: al liberarse una plaza, la persona en espera queda confirmada sin preguntarle
  (PA7.2), así que nadie entra en la lista sin pedirlo.

## R4. Perfil de voluntario (FR-011)

- **Decision**: `GET` y `PUT /api/yo/perfil-voluntario`. La interfaz pide el perfil al abrir la
  ventana de inscripción; si no existe (404), muestra los cuatro campos (el correo sale relleno
  con el de la cuenta) y los guarda con `PUT` antes de inscribirse. `inscribir` sin perfil →
  409 `PERFIL_INCOMPLETO`. El `GET` no está en la tabla de rutas de plan-comun §4: es una ruta
  más del mismo recurso, dentro del módulo.
- **Rationale**: plan-comun §3 («el Voluntario se crea al completar el perfil la primera vez») y
  solo los datos imprescindibles (principio V).
- **Alternatives considered**: mandar el perfil dentro de la inscripción (mezcla dos recursos en
  una petición).

## R5. Rol de voluntario con mensaje propio (FR-004, clarify Q4)

- **Decision**: las rutas de voluntario usan `requiereRol()` (solo sesión, 401) y el servicio
  comprueba el rol con su propio mensaje: 403 `SIN_PERMISO`, «Necesitas una cuenta de voluntario
  para inscribirte en actividades.».
- **Rationale**: `requiereRol('voluntario')` daría el mensaje genérico, y el escenario 10 pide
  que se explique por qué. No se toca el middleware común. El controlador llama a
  `exigirVoluntario` antes de validar los datos, así que sin el rol siempre es 403, aunque el cuerpo
  sea inválido.

## R6. Cancelar con `PATCH { accion: 'cancelar' }`

- **Decision**: `PATCH /api/yo/inscripciones/:id` con `{ "accion": "cancelar" }`, como el
  `PATCH` de actividades de spec-007. Otra inscripción que no sea suya → 404 (plan-comun §3).
  Ya cancelada o con la actividad empezada → 409 `INSCRIPCION_NO_CANCELABLE`.

## R7. Pruebas en serie (`backend/vitest.config.js`)

- **Decision**: `fileParallelism: false`. Las pruebas de `actividades` vacían la tabla con
  `TRUNCATE actividades … CASCADE`, que ahora también vacía `inscripciones`; si los ficheros
  corren a la vez sobre la misma base de pruebas, se pisan.
- **Rationale**: es lo más simple; las pruebas tardan pocos segundos. Se avisa al grupo, porque
  afecta a todas las pruebas del back-end (principio XII).
- **Alternatives considered**: una base de pruebas por fichero (más preparación para todos).

## R8. Filtro de fechas (FR-003)

- **Decision**: `desde` y `hasta` opcionales, con formato `aaaa-mm-dd`, como días completos de
  Madrid (`inicioDia` de `fechas.js`): `desde` ≤ inicio < día siguiente a `hasta`. `desde` mayor
  que `hasta` → 400. Es la forma de plan-comun §4 (`?proyectoId&desde&hasta`).
- **Límite conocido**: el desplegable de proyectos sale de `GET /api/proyectos`, que solo da los
  activos. Una actividad publicada de un proyecto que se ha desactivado después sigue en el listado
  (clarify 5 de spec-007), pero no se puede filtrar por ese proyecto. Se acepta en la v1.
