# Converge 1 de spec-006 (HU-06), 06/11/2026

Informe inicial de `/speckit-converge` sobre el código del commit `a751d67`, contrastado con `spec.md`,
`plan.md`, `research.md`, `data-model.md`, `contracts/api-calendario.md`, `quickstart.md`, `tasks.md` y,
en `refinamiento/`, el clarify, los dos analyze y la prueba manual. Se guarda sin corregir nada. Las
tareas que añade (T015–T021) están en la «Phase 6: Convergence» de `tasks.md`; T022–T024 salen de la
prueba manual del mismo día ([prueba-manual.md](prueba-manual.md), P1–P3), que no se repiten aquí.

**Resultado**: 7 hallazgos (1 MEDIUM y 6 LOW), ninguno crítico ni alto. 22 elementos de la spec
revisados (6 FR, 2 SC, 8 escenarios y 6 casos límite): 0 sin hacer, 4 parciales, 3 contradicciones y
0 código sin justificar. Pruebas: 5 ficheros, 101 pasan y 3 saltadas (las `it.skip` de spec-007 en
`actividades/servicio.test.js`); las 13 de `voluntariado/calendario.test.js` pasan.

## Hallazgos

| ID | Tipo | Gravedad | Origen | Evidencia | Propuesta |
|---|---|---|---|---|---|
| F1 | parcial | MEDIUM | FR-001; research R6 (vista mensual) | `CalendarioVoluntario.jsx:50-53` vacía `entradas` al cambiar de mes, y `:136-138` solo pinta `MesCalendario` con datos y con el mes como `key`. Al pulsar «‹» o «›» se desmonta todo el mes, también el botón pulsado (`MesCalendario.jsx:59-72`). El foco vuelve al principio de la página: con el teclado hay que recorrer otra vez el menú, las pestañas y «‹» para pasar cada mes. El `h2` con `aria-live` (`:67`) se crea de nuevo, así que el mes nuevo no se anuncia de forma fiable. | Dejar montada la cabecera del mes mientras llega el nuevo y poner «Cargando…» solo en la cuadrícula (T015). |
| F2 | contradicción | LOW | research R5 («Las recargas en segundo plano no vacían la pantalla»); T011 | `CalendarioVoluntario.jsx:42-46`: si falla una recarga al volver a la pestaña (por ejemplo, «No se puede conectar con el servidor.» tras perder la red un momento), `entradas` pasa a `null` y la lista o el mes desaparecen; solo queda el aviso. Pulsar la pestaña activa no vuelve a pedir, porque la ruta no cambia (`:85-88`), así que no se recupera hasta salir y volver o cambiar de vista. | En las recargas en segundo plano, conservar los datos y enseñar el error encima (T016). |
| F3 | parcial | LOW | FR-005 («después de cada acción del voluntario en el calendario») | La vista solo se vuelve a pedir si la cancelación sale bien (`ActividadCalendario.jsx:69-72`; `CancelarInscripcion.jsx:21` solo llama a `onHecho` sin error). Si con la página abierta la actividad empieza o la cancela el coordinador, el `PATCH` da 409 (`servicio.js:157` y `:159`) y, al cerrar la ventana, la tarjeta sigue igual: con el botón de cancelar y sin «En curso». Es el mismo caso que la T027 de spec-005. | Volver a pedir la vista al cerrar la confirmación, sin cambiar `CancelarInscripcion.jsx` (T017). |
| F4 | parcial | LOW | research R6 (días de otro mes en gris); FR-003 | Texto pequeño por debajo de 4,5:1 (WCAG AA). El número de los días de otro mes, `text-gray-400` sobre `bg-gray-50` (`MesCalendario.jsx:97`), da 2,4:1. «en lista de espera» de 11 px en `text-aviso` sobre `bg-amber-50` (`:20` y `:118`) da 4,1:1, y «En lista de espera · posición N» sobre blanco (`ActividadCalendario.jsx:25`), 4,2:1. El Lighthouse de la prueba manual no lo recoge. `aviso` es un color común de `tailwind.config.mjs`; lo usan también `TarjetaActividad.jsx` (HU-05) y `Aviso.jsx`. | `text-gray-600` (7,2:1) en los días de otro mes; proponer al grupo un `aviso` más oscuro (T018). |
| F5 | contradicción | LOW | contrato, errores de `GET /api/yo/calendario`; data-model, validación de entrada | El `refine` de orden (`controlador.js:25-28`, compartido con el filtro de HU-05) compara también fechas que ya han fallado. Con `?desde=2026-13-01&hasta=2026-12-01` o `?desde=mañana&hasta=2026-12-01`, además de `campos.desde` «Fecha no válida.» sale `campos.hasta` «La fecha «desde» no puede ser posterior a «hasta».», que no es cierto. Comprobado con el mismo esquema (`zod` 3.25). La interfaz no lo provoca. | Comparar solo cuando las dos fechas son válidas y añadir el caso a la prueba (T019). |
| F6 | parcial | LOW | data-model, «Días de la vista mensual» (`aaaa-mm-dd` de Madrid); research R6, «Ayudantes» | `diaMadrid` (`fechas.js:7-12` y `:23-25`) saca «aaaa-mm-dd» del formato de presentación de `en-CA`, que depende de los datos de idioma del navegador y no está garantizado. Si cambiara, `sumarDias` recibiría otro texto y `toISOString()` (`:32`) lanzaría un `RangeError`: la vista mensual dejaría de pintarse. Las semillas ya lo hacen con `formatToParts` (`semillas/voluntariado.js:85`). | Construir el día con `formatToParts` (T020). |
| F7 | contradicción | LOW | quickstart 2.1; research R4; principio III | El quickstart dice que al desplegar salen «proyecto, descripción, fecha y horario, lugar, requisitos». En el código la fecha, el horario y el lugar ya están en la tarjeta (`ActividadCalendario.jsx:31-32`) y el detalle añade proyecto, requisitos y descripción (`:46-53`), como dice R4. La prueba manual lo anotó y dio el paso por bueno. | Corregir el paso 2.1 del quickstart (T021). |

## Comprobado y correcto

- **Ruta y permisos (R1, FR-006, escenario 1.5)**: `GET /yo/calendario` con `requiereRol('voluntario')`
  (`rutas.js:22`), que da 401 `NO_IDENTIFICADO` y 403 `SIN_PERMISO`. El servicio solo usa `usuario.id` y
  `zod` descarta `voluntarioId` y `usuarioId`. Cancelar la inscripción de otro da 404 (`servicio.js:152`).
  La respuesta no lleva plazas ni datos de otros voluntarios (principio V).
- **Reglas de la vista (FR-002, R3, data-model)**: `confirmada` y `en_espera` de `listarActivasDeUsuario`,
  actividad publicada con `fin > ahora()`, solape con `inicioDeDia` (`fin > inicio de desde` e
  `inicio < día siguiente a hasta`), orden por `inicio` e id de inscripción, `enCurso = inicio <= ahora()`
  y lista vacía sin perfil. La forma es la de `EntradaCalendario`, con `posicion` solo en espera.
- **Acceso a actividades (R2)**: solo `obtener`, a través de `voluntariado/actividades.js` y dentro de la
  función (importación circular). `repositorio.js` no cambia. Los comentarios de `actividades.js` y
  `rutas.js` están al día (T001, T005).
- **Validación**: mensajes del data-model; fechas mal escritas o imposibles y `desde > hasta` dan 400
  con `campos` (salvo F5).
- **Semillas (R7, T002)**: las 4 actividades con el lugar, las plazas, los requisitos y la descripción
  de la tabla; `enMadrid` corrige el desfase si ese día cambia la hora; `voluntario@` queda en la
  posición 1 de Visita a la depuradora, detrás de `voluntario6` y `voluntario7`. El quickstart de
  spec-005 nombra las actividades nuevas.
- **Lista y detalle (R4, FR-001, FR-003, FR-004, SC-002)**: la lista se abre primero; «Siguiente» va en
  la primera confirmada que no ha empezado; estados «Confirmada», «En lista de espera · posición N» y
  «En curso»; *Ver detalle* con `aria-expanded`, «Sin requisitos», el botón según el estado y, en curso,
  «La actividad ya ha empezado: no se puede cancelar.». Reutiliza `CancelarInscripcion.jsx` sin cambios.
- **Vista mensual (R6, data-model)**: semanas de lunes a domingo; días de otro mes con sus actividades;
  cada actividad del día de su inicio al de `fin − 1 ms`; hora de inicio, «hasta hh:mm» y «todo el día»;
  barras en móvil; leyenda; primer día con actividades desde hoy; `EstadoVacio` del día y del mes; «‹»
  desactivado en el mes actual. Los días se calculan en Madrid y se suman en UTC, sin saltos por el
  cambio de hora.
- **Actualización (R5, FR-005)**: `visibilitychange`, `focus` y `pageshow` con `persisted`, con el margen
  de 2 s; los avisos de cancelar y de salir de la lista de espera; un número de petición hace que valga
  la última respuesta si llegan desordenadas (`CalendarioVoluntario.jsx:32-47`).
- **Estados de la página**: 401 con «Inicia sesión para ver tu calendario.» y *Entrar*
  (`/entrar?volver=/mi-calendario`); calendario vacío con *Ver actividades disponibles*.
- **Menú y página (T008)**: solo cambia la línea reservada de `Menu.jsx`; `mi-calendario.astro` usa el
  `Layout` común.
- **Formato (T012)**: `prettier --check` pasa en los 12 ficheros JS y JSX tocados.
- **Pruebas (R8, T004, T009)**: cubren todo lo previsto, también la hora de verano y el SC-001 contra la
  base.

## Cobertura

| Elemento | Resultado |
|---|---|
| FR-001 | cumple; la vista mensual tiene F1, F4 y F6 |
| FR-002, FR-004, FR-006 | cumple |
| FR-003 | cumple; contraste del ámbar (F4) |
| FR-005 | parcial (F2, F3); falta probar el cambio real de pestaña o de ventana en un navegador normal (T014) |
| SC-001 | cumple (prueba automática y paso 1.1) |
| SC-002 | sin cronometrar con una persona (T014) |
| US1 (5 escenarios) | cumple |
| US2 (3 escenarios) | cumple; el texto del paso 2.1 no coincide (F7) |
| 6 casos límite | cumple; «dos el mismo día» con P3 y «sin rol de voluntario» con P2 |
| Contrato (1 ruta, recurso y errores) | cumple salvo F5 |
| Constitución III | parcial (F7, T014); V y VI cumplen; XII pendiente de la coordinación (T013) |
