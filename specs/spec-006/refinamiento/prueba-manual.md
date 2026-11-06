# Prueba manual de spec-006 (HU-06), 06/11/2026

Recorrido de [quickstart.md](../quickstart.md) (T014) con la aplicación en marcha en local: back-end en el
puerto 3000, front-end en el 4321 y PostgreSQL con `npm run migrar` y `npm run semillas`. Versión: rama
`spec-006`, commit `a751d67`. Navegador: el integrado de la aplicación de escritorio, a 1440×900 y a
375×812; el Lighthouse y el paso de cambiar de pestaña, también en Chrome. Los pasos de «otra persona»
(`voluntario6` y el coordinador) se hicieron con `curl` desde otra sesión, que equivale a otro navegador.
Fechas de las semillas ejecutadas el 06/11/2026.

## Historia 1 — Ver mis próximas actividades

| # | Resultado observado | ¿Pasa? |
|---|---|---|
| 1.1 | Como `voluntario@`, *Mi calendario* abre la lista: Charla sobre el agua en el instituto (17/11/2026, de 10:00 a 12:00, IES Miguel Hernández, «Siguiente» y «Confirmada»), Análisis de fuentes (de 17:00 a 19:30), Visita a la depuradora (18/11/2026) y Jornadas de reforestación («del 21/11/2026 a las 09:00 al 23/11/2026 a las 14:00»). En *Mes*, noviembre de 2026: el 17 con «10:00 Charla…» y «17:00 Análisis de fuentes», el 18 con Visita, el 21 «09:00 Jornadas…», el 22 «todo el día» y el 23 «hasta 14:00». El 17 sale elegido y debajo están sus dos tarjetas | Sí |
| 1.2 | Recogida de ropa (celebrada hace 3 días) no sale ni en la lista ni en el mes | Sí |
| 1.3 | Visita a la depuradora: «En lista de espera · posición 1» con borde izquierdo discontinuo ámbar en la lista; en el mes, borde discontinuo y «en lista de espera»; la leyenda explica los dos estilos | Sí |
| 1.4 | Como `voluntario2@`: «Todavía no tienes actividades por delante.» y el enlace *Ver actividades disponibles* a `/actividades`. En *Mes*, «No tienes actividades por delante en este mes.» y «‹» desactivado | Sí |
| 1.5 | `GET /api/yo/calendario?voluntarioId=2&usuarioId=4` como `voluntario@` devuelve solo lo suyo; `PATCH /api/yo/inscripciones/14` (de `voluntario2` en Recogida de ropa) da 404 y la inscripción sigue confirmada | Sí |

## Historia 2 — Gestionar una actividad desde el calendario

| # | Resultado observado | ¿Pasa? |
|---|---|---|
| 2.1 | *Ver detalle* en Charla despliega Proyecto (Agua potable), Requisitos («Sin requisitos»), Descripción y *Cancelar inscripción*; la fecha, el horario y el lugar ya están en la tarjeta. En Visita a la depuradora, «Calzado cerrado.» y *Salir de la lista de espera* | Sí |
| 2.2 | *Cancelar inscripción* abre la confirmación de HU-05; al confirmar, «Has cancelado tu inscripción en «Charla sobre el agua en el instituto».», Charla desaparece sin recargar y Análisis de fuentes pasa a «Siguiente» | Sí |
| 2.3 | `voluntario6` cancela su plaza en Visita a la depuradora. Antes de volver a la pestaña, `voluntario@` sigue viendo «En lista de espera · posición 1». Al volver, sale «Confirmada», sin recargar, y en el detalle el botón pasa a *Cancelar inscripción*. El correo «Plaza confirmada» se intenta enviar (en esta máquina no hay Mailpit, así que el registro del back-end muestra el error de conexión, sin deshacer nada). Ver «Volver a la pestaña» abajo | Sí |
| 2.4 | Tras `npm run semillas`, *Salir de la lista de espera* en Visita a la depuradora: «Has salido de la lista de espera de «Visita a la depuradora».» y deja de salir | Sí |

### Volver a la pestaña (FR-005)

Ni el navegador integrado ni el Chrome que maneja chrome-devtools ocultan la pestaña al cambiar de una a
otra: la página sigue en `visibilityState = "visible"` y no reciben `visibilitychange` ni `focus`
(comprobado registrando los eventos antes de cambiar). Por eso, el «volver» se ha hecho lanzando en la
página el mismo evento que lanza un navegador normal:

- `focus` en el navegador integrado (paso 2.3 y los dos casos límite de abajo): se hace una petición y la
  pantalla cambia;
- `visibilitychange` seguido de `focus` en Chrome: se hace **una sola** petición a `/api/yo/calendario`
  (el `focus` llega dentro del margen de 2 s) y Análisis de fuentes, cancelada por el coordinador,
  desaparece.

Queda por comprobar a mano en un navegador normal que al cambiar de pestaña o de ventana se actualiza
solo (10 segundos, con el paso 2.3).

## Casos límite

| Caso | Resultado observado | ¿Pasa? |
|---|---|---|
| Actividad cancelada por el coordinador | Cancelada Análisis de fuentes desde otra sesión: al volver desaparece del calendario | Sí |
| Cambio de fecha o lugar | El coordinador cambia el lugar de Jornadas a «Sierra de Mariola»: al volver sale el nuevo | Sí |
| Varios días | Jornadas sale una vez en la lista y en el mes los días 21, 22 y 23 | Sí |
| Dos el mismo día | A 1440 px, el 17 tiene dos etiquetas con hora y título; a 375 px, dos barras y, al pulsar el día, las dos tarjetas debajo | Sí |
| En curso | Con `AHORA_SIMULADO=2026-11-22T10:00:00+01:00` y el back-end reiniciado: solo sale Jornadas, «Confirmada · En curso», sin «Siguiente»; en el detalle, «La actividad ya ha empezado: no se puede cancelar.»; el `PATCH` da 409 `INSCRIPCION_NO_CANCELABLE`. Después se vació la variable | Sí |
| Sin rol de voluntario | Como `donante@`, el menú solo tiene *Actividades*; `/mi-calendario` muestra «No tienes permiso para realizar esta acción.» y la API da 403. **Encima del aviso siguen las pestañas *Lista* y *Mes***, que no sirven para nada | Sí, con un fallo de presentación (P2) |
| Sin sesión | «Inicia sesión para ver tu calendario.» y *Entrar*, que lleva a `/entrar?volver=/mi-calendario` y, al entrar, vuelve al calendario | Sí |
| Meses anteriores | En noviembre, «‹» está desactivado | Sí |
| Fechas imposibles en la API | `?desde=2026-13-01` → 400 con «Fecha no válida.» en `campos.desde` | Sí |

## Pantallas

- **1440 px**: la lista ocupa el ancho del contenido; la cuadrícula del mes, 7 columnas con días de unos
  110 px. **Las etiquetas largas se recortan** («10:00 Charla sobre el a…») y no hay forma de leer el título
  entero sin pulsar el día (P3).
- **375 px**: lista en una columna; en el mes, barras de color por actividad y el panel del día debajo. Nada
  se sale de la pantalla (`scrollWidth` = 375). El nombre del día pulsado se lee en `aria-label` («Martes,
  17/11/2026: 2 actividades»).
- **Consola**: solo las respuestas 401, 403 y 409 que provocan los propios pasos (401 sin sesión, 403 como
  donante y 409 al cancelar una en curso). Ningún error de JavaScript.
- **Lighthouse** (Chrome, escritorio, sobre la página ya cargada): accesibilidad 98, buenas prácticas 100.
  Falla `heading-order`: en la lista se pasa de `h1` (Mi calendario) a `h3` (cada actividad) sin `h2`, y en el
  mes el título de cada tarjeta es `h3`, igual que el del día que la contiene (P1). Falla también la meta
  descripción, que es del `Layout` común (para todas las páginas; se comenta al grupo).

## Fallos encontrados (pasan al converge)

| ID | Fallo | Antes |
|---|---|---|
| P1 | Orden de encabezados | Lista: `H1 Mi calendario`, `H3 Charla…`, `H3 Análisis…`. Mes: `H1`, `H2 Noviembre de 2026`, `H3 Martes, 17/11/2026`, `H3 Charla…` |
| P2 | Pestañas *Lista* y *Mes* con el aviso de 403 | Texto de la página como donante: «Lista · Mes · No tienes permiso para realizar esta acción.» |
| P3 | Etiqueta recortada sin el título completo | Etiqueta del 17: `recortada: true`, sin atributo `title` |

## Criterios de éxito

- **SC-001**: tras `npm run semillas`, `voluntario@` tiene 4 inscripciones activas en actividades sin
  terminar y salen las 4 (1.1); la prueba automática lo compara con la base.
- **SC-002**: la siguiente actividad sale arriba y marcada «Siguiente». Los datos llegan a los 132 ms de abrir
  la página. Falta cronometrarlo a mano con una persona; el objetivo es menos de 10 s.
