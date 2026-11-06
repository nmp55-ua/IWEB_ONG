# Research: HU-06 — Calendario personal del voluntario

Las decisiones técnicas generales están en [plan-comun.md](../plan-comun.md#decisiones-técnicas-research)
y las de inscripciones, en el [research de spec-005](../spec-005/research.md). Aquí solo las propias de
HU-06.

## R1. Una ruta personal: `GET /api/yo/calendario` (FR-006, escenario 1.5)

- **Decision**: la ruta acordada en plan-comun §4, detrás de `requiereRol('voluntario')` (401 sin
  sesión, 403 sin el rol). El servicio busca siempre a partir de `req.usuario.id`; la ruta no lleva el
  identificador de nadie y el esquema de zod descarta cualquier otro parámetro de la consulta, así que
  `?voluntarioId=…` o `?usuarioId=…` devuelven igualmente el calendario propio. Abrir o cancelar una
  inscripción ajena con `PATCH /api/yo/inscripciones/:id` ya da 404 (HU-05).
- **Rationale**: plan-comun §3 («las rutas personales no llevan el identificador de otra persona»).
  Así el escenario 1.5 se cumple por construcción y se puede comprobar: no hay ninguna forma de
  pedir el de otro.
- **Por qué no `exigirVoluntario`**: en HU-05 el rol se comprueba en el servicio porque su escenario
  10 pide explicar que hace falta una cuenta de voluntario para inscribirse (research R5 de
  spec-005), y ese mensaje habla de inscribirse. HU-06 no tiene un escenario así y el enlace solo se
  ve con el rol, así que basta con el middleware común y su mensaje (CONVENCIONES §4).
- **Alternatives considered**: `GET /api/voluntarios/:id/calendario` con comprobación de dueño (deja
  la puerta a equivocarse en la comprobación, y plan-comun ya eligió `/yo/...`).

## R2. Acceso a las actividades a través de su servicio

- **Decision**: `calendario` parte de `repositorio.listarActivasDeUsuario(usuario.id)`, que ya da
  las inscripciones activas con su `posicion`, y pide cada actividad con `obtener(id)` del servicio de
  `actividades`. `obtener` ya existe; solo se añade a la reexportación de `voluntariado/actividades.js`.
  Por la importación circular, como en spec-005, lo importado de `./actividades.js` solo se usa dentro
  de funciones.
- **Rationale**: research R2 de spec-005: el módulo `voluntariado` nunca consulta la tabla
  `actividades` con SQL propio (dueña: Nicole). Un voluntario tiene pocas inscripciones activas, así
  que pedirlas de una en una (dos consultas por actividad) no se nota.
- **Alternatives considered**: un `JOIN` con `actividades` en `voluntariado/repositorio.js` (rompe la
  propiedad de la tabla); una función nueva `listarPorIds` en el servicio de Nicole (código nuevo en su
  módulo para ganar unos milisegundos).

## R3. Qué sale y en qué intervalo (FR-002, clarify Q3)

- **Decision**: sale toda inscripción `confirmada` o `en_espera` cuya actividad está publicada y
  tiene `fin > ahora()`. `desde` y `hasta` son opcionales, con formato `aaaa-mm-dd`, y son días
  completos de Madrid (`inicioDia` de `fechas.js`, la misma validación que el filtro de HU-05, R8 de
  spec-005). Con ellos solo salen las que **se solapan** con el intervalo: `fin > inicio de desde` e
  `inicio < inicio del día siguiente a hasta`. Cada entrada lleva `enCurso = inicio <= ahora()`.
- **Rationale**: «aún no ha terminado» resuelve el choque entre FR-002 y el escenario 2 (clarify Q3).
  El solape, y no la fecha de inicio, hace que una actividad de varios días que empieza el 30 de un mes
  y acaba el 2 del siguiente salga en los dos meses. `enCurso` lo calcula el servidor con `ahora()`, que
  en pruebas se simula, para que la interfaz no dependa del reloj del navegador al decidir si se ofrece
  cancelar (HU-05 solo deja hasta el inicio).
- **Uso en la interfaz**: la lista pide sin intervalo (todo lo que tiene por delante); la vista mensual
  pide el intervalo de las semanas que enseña.
- **Alternatives considered**: `inicio >= hoy` (deja fuera una actividad de varios días ya empezada y
  deja dentro una de esta mañana ya terminada).

## R4. Vista de lista y detalle (FR-001, FR-004, SC-002, clarify Q4)

- **Decision**: es la vista que se abre primero. Una fila por inscripción, ordenadas por inicio, con
  fecha y horario (una de varios días sale una vez, «del 21/11/2026 a las 09:00 al 23/11/2026 a las
  14:00»), título, lugar y el estado: «Confirmada» o «En lista de espera · posición N», y «En curso» si ya
  ha empezado. La primera lleva la marca «Siguiente». Al pulsar *Ver detalle* se despliega en la misma
  tarjeta: proyecto, descripción, requisitos («Sin requisitos» si no hay) y *Cancelar inscripción* o
  *Salir de la lista de espera*, que abre la confirmación de HU-05 (`CancelarInscripcion.jsx`). Si la
  actividad está en curso, en vez del botón sale «La actividad ya ha empezado: no se puede cancelar.».
- **Rationale**: la primera fila es la siguiente actividad (SC-002). El detalle se despliega en la
  tarjeta en vez de en una ventana porque el `Modal` común tiene un botón «Cancelar» (cerrar) que, junto a
  «Cancelar inscripción», confunde, y la confirmación de HU-05 sería una segunda ventana encima de la
  primera. Mostrar la posición no es nuevo: ya la da HU-05 (su escenario 3) y viene en la misma consulta.
- **Alternatives considered**: el detalle en un `Modal` (ver arriba); una página por actividad
  (otra ruta y otra carga para tres datos más).

## R5. Actualización sin recargar (FR-005, clarify Q2)

- **Decision**: `CalendarioVoluntario.jsx` vuelve a pedir la vista que se está viendo: al abrir la
  página; después de cancelar o salir de la lista de espera (`onHecho` de `CancelarInscripcion`), y con
  un aviso «Has cancelado tu inscripción en «…».»; cuando la pestaña vuelve a estar visible
  (`visibilitychange` con `document.visibilityState === 'visible'`), y cuando el navegador la restaura
  desde su caché al volver atrás (`pageshow` con `persisted`). Las recargas en segundo plano no vacían
  la pantalla: se cambian los datos al llegar.
- **Rationale**: los cambios de otros llegan con un correo de HU-07 (actividad cancelada, cambio de
  fecha, plaza confirmada) y el voluntario vuelve a la pestaña para mirarlos. Es lo más simple que cumple
  FR-005 (principio I).
- **Alternatives considered**: consultar cada minuto; WebSocket o SSE (pieza nueva en la arquitectura
  común, principio XII). Descartadas en el clarify.

## R6. Vista mensual sin librería (FR-001, FR-003, casos límite)

- **Decision**: cuadrícula propia de 7 columnas, de lunes a domingo (L M X J V S D), con las semanas
  que contienen el mes; arriba, «‹», el mes y el año («Noviembre de 2026») y «›». No se puede ir a meses
  anteriores al actual (antes no hay nada que enseñar, FR-002). Los días se calculan como fechas de
  calendario de Madrid: una actividad sale en cada día desde el de su inicio hasta el de `fin − 1 ms`
  (una que acaba justo a las 00:00 no sale al día siguiente). Cada día es un botón; al pulsarlo, debajo de
  la cuadrícula salen sus actividades con la misma tarjeta de la lista (R4). Al abrir un mes se elige el
  primer día con actividades desde hoy. En cada día:
  - desde 640 px, una etiqueta por actividad con la hora de inicio y el título (recortado), fondo de
    color si está confirmada y borde discontinuo ámbar con «en lista de espera» si está en espera;
  - en móvil, una barra de color por actividad (con el mismo código) y el número de actividades para los
    lectores de pantalla; los textos se leen en las tarjetas del día elegido.
  Debajo, una leyenda con los dos estilos.
- **Rationale**: con 375 px cada día mide unos 45 px: dos títulos no caben de forma legible, así que en
  móvil la cuadrícula solo indica qué días tienen algo y el detalle va debajo (caso límite «dos
  actividades el mismo día»). La etiqueta «en lista de espera» sale siempre en las tarjetas, y en la
  cuadrícula de escritorio (FR-003).
- **Alternatives considered**: FullCalendar o react-big-calendar (dependencia grande, con estilos
  propios que habría que adaptar a Tailwind; principio I).

## R7. Semillas para el «Independent Test»

- **Problema**: el Independent Test pide un voluntario con 3 confirmadas futuras y en espera en una
  cuarta, pero las semillas de spec-007 solo tienen 2 actividades futuras publicadas, y meter a alguien
  más en ellas cambia los números del quickstart de HU-05 («1 plaza libre de 10», posición 2…).
- **Decision**: 4 actividades publicadas nuevas, todas de «Agua potable» y a partir de dentro de 11 días,
  creadas en `db/semillas/voluntariado.js` igual que las de spec-007 (por título, idempotentes, con fechas
  relativas a hoy y `creada_por` = coordinador):

  | Actividad | Cuándo | Plazas | Inscripciones |
  |---|---|---|---|
  | Charla sobre el agua en el instituto | dentro de 11 días, de 10:00 a 12:00 | 20 | `voluntario@` confirmada |
  | Análisis de fuentes | dentro de 11 días, de 17:00 a 19:30 | 8 | `voluntario@` confirmada |
  | Visita a la depuradora | dentro de 12 días, de 11:00 a 13:00 | 2 | `voluntario6` y `voluntario7` confirmadas; `voluntario@` en espera |
  | Jornadas de reforestación | de dentro de 15 días a las 09:00 a dentro de 17 a las 14:00 | 12 | `voluntario@` confirmada |

  `voluntario@` ya tiene la celebrada Recogida de ropa (escenario 1.2). `voluntario2` solo tiene esa,
  así que su calendario está vacío (escenario 1.4). Dos actividades el mismo día y una de varios días
  cubren los casos límite.
- **Rationale**: «Agua potable» y más allá de 10 días para que el paso 1.3 del quickstart de HU-05
  («Agua potable» hasta dentro de 10 días → ninguna) siga valiendo; el 1.1 se actualiza para nombrar
  también las nuevas. No se toca `semillas/actividades.js` de Nicole, donde spec-008 añadirá sus
  actividades de prueba, y así no hay conflictos al fusionar. Las semillas quedan fuera de la regla R2
  (research R2 de spec-005).
- **Coordinación**: se avisa a Nicole de que hay 4 actividades de prueba más y de dónde se crean, por si
  prefiere moverlas a su fichero (tarea de coordinación en tasks.md).
- **Alternatives considered**: usar las dos actividades que ya hay (cambia el quickstart de HU-05 y de
  HU-07); un voluntario nuevo solo para HU-06 (haría falta otra inscripción en la celebrada, que cambia lo
  que espera spec-008).

## R8. Pruebas (`voluntariado/calendario.test.js`)

- **Decision**: un fichero propio de HU-06, con la misma preparación que `servicio.test.js`
  (Vitest + Supertest contra `TEST_DATABASE_URL`, `AHORA_SIMULADO` fijo, correo simulado, actividades
  reales). Cubre: 401 y 403; perfil sin inscripciones → lista vacía; 3 confirmadas y 1 en espera con
  posición, por fecha y en hora de Madrid; terminada, cancelada y de una actividad cancelada por el
  coordinador → no salen; de varios días en curso → sale con `enCurso`; otro voluntario y
  `?voluntarioId=` → solo las propias; `desde`/`hasta` por solape (también entre dos meses) y errores
  400; cancelar desde el calendario → desaparece; promoción desde la lista de espera → sale confirmada.
- **Rationale**: plan-comun §8 (permisos 401/403 en toda ruta personal) y un caso por escenario. Va en
  serie con los demás ficheros (R7 de spec-005).
