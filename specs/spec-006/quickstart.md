# Quickstart: validar HU-06

## Preparación

Arranque según el [README](../../README.md): `npm run migrar` y `npm run semillas` en `backend/`, y
`npm run dev` en `backend/` y en `frontend/`. Correos en Mailpit (`http://localhost:8025`).
`npm run semillas` deja las actividades y las inscripciones de prueba como al principio, así que la
validación se puede repetir desde cero. También imprime los ids de las inscripciones de Recogida de ropa.

**Ojo**: las semillas solo recolocan las inscripciones de las actividades de prueba. Si antes se han
hecho los quickstarts de HU-05 (borde «Solapes») o de HU-07 (2.1 y 2.2), quedan inscripciones en
actividades creadas a mano y el calendario enseña más de lo que dice esta guía. Antes de empezar, cancelar
esas actividades como coordinador (sus inscripciones pasan a canceladas) o partir de una base nueva.

Datos de prueba ([research R7](research.md#r7-semillas-para-el-independent-test)), con la contraseña de
`CONTRASENA_SEMILLAS`. Las fechas son relativas al día en que se ejecutan las semillas (entre
paréntesis, si se ejecutan el 06/11/2026):

| Actividad · Agua potable salvo Recogida de ropa | Cuándo | Inscripción de `voluntario@ong.test` |
|---|---|---|
| Charla sobre el agua en el instituto | dentro de 11 días (17/11), de 10:00 a 12:00 | confirmada |
| Análisis de fuentes | dentro de 11 días (17/11), de 17:00 a 19:30 | confirmada |
| Visita a la depuradora · 2 plazas, completa (`voluntario6` y `voluntario7`) | dentro de 12 días (18/11), de 11:00 a 13:00 | en lista de espera, posición 1 |
| Jornadas de reforestación | de dentro de 15 días (21/11) a las 09:00 a dentro de 17 (23/11) a las 14:00 | confirmada |
| Recogida de ropa (de spec-007) | hace 3 días, de 10:00 a 13:30 | confirmada (ya celebrada) |

`voluntario2@ong.test` solo tiene la de Recogida de ropa, así que no tiene nada por delante.
`donante@ong.test` no es voluntario.

Pruebas automáticas: `TEST_DATABASE_URL=<url de ong_test> npm test` en `backend/`
(`voluntariado/calendario.test.js`; nunca contra la base de desarrollo).

## Historia 1 — Ver mis próximas actividades

| # | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Como `voluntario@ong.test`, *Mi calendario* en el menú (`/mi-calendario`) | Se abre la lista con cuatro actividades por fecha: Charla (17/11/2026, de 10:00 a 12:00, «Confirmada», marcada «Siguiente»), Análisis de fuentes (de 17:00 a 19:30), Visita a la depuradora y Jornadas de reforestación («del 21/11/2026 a las 09:00 al 23/11/2026 a las 14:00»), cada una con su lugar |
| 1.1 | Pulsar *Mes* y, si hace falta, «›» hasta el mes de esas fechas | Charla y Análisis el día 17, Visita el 18 y Jornadas el 21, 22 y 23; las horas son las mismas que en la lista |
| 1.2 | En la lista y en el mes actual | No sale Recogida de ropa (ya celebrada) |
| 1.3 | Mirar Visita a la depuradora | En la lista, «En lista de espera · posición 1»; en el mes (desde 640 px de ancho), con borde discontinuo y «en lista de espera»; la leyenda explica los dos estilos |
| 1.4 | Como `voluntario2@ong.test`, abrir *Mi calendario* | «Todavía no tienes actividades por delante.» y el enlace *Ver actividades disponibles*, que lleva a `/actividades` |
| 1.5 | Como `voluntario@`, con la cookie de sesión: `GET /api/yo/calendario?voluntarioId=2&usuarioId=4` (cualquier número: se ignoran); después `PATCH /api/yo/inscripciones/<id de voluntario2 en Recogida de ropa, que imprimen las semillas>` con `{ "accion": "cancelar" }` | La consulta devuelve las cuatro de `voluntario@`; el `PATCH` da 404. No hay ninguna página ni ruta que enseñe el calendario de otro |

## Historia 2 — Gestionar una actividad desde el calendario

Hacer los pasos en este orden (cada uno parte del anterior).

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Como `voluntario@`, en la lista, *Ver detalle* de Charla sobre el agua en el instituto | Se despliega: proyecto, descripción, fecha y horario, lugar, requisitos («Sin requisitos») y el botón *Cancelar inscripción*. En Visita a la depuradora el botón es *Salir de la lista de espera* |
| 2.2 | *Cancelar inscripción* en Charla y confirmar en la ventana | «Has cancelado tu inscripción en «Charla sobre el agua en el instituto».» y la actividad ya no está, sin recargar; Análisis de fuentes pasa a «Siguiente» |
| 2.3 | Dejar abierta la pestaña. En una ventana privada u otro navegador, como `voluntario6@ong.test`, *Cancelar inscripción* en Visita a la depuradora (en `/actividades` o en su calendario). Volver a la ventana de `voluntario@` (basta con pulsar en ella, aunque la otra no se cierre) | Sin recargar, Visita a la depuradora sale «Confirmada»; en Mailpit, «Plaza confirmada: «Visita a la depuradora»» para `voluntario@ong.test` |
| 2.4 | Tras `npm run semillas`, como `voluntario@`, *Ver detalle* en Visita a la depuradora, *Salir de la lista de espera* y confirmar | «Has salido de la lista de espera de «Visita a la depuradora».» y deja de salir, sin recargar |

## Casos límite

| Caso | Pasos | Resultado esperado |
|---|---|---|
| Actividad cancelada por el coordinador | Con la pestaña de `voluntario@` abierta, como `coordinador@ong.test` en otra ventana privada, cancelar Análisis de fuentes. Volver a la ventana de `voluntario@` | Desaparece sin recargar; el correo de cancelación es de HU-07 |
| Cambio de fecha o lugar | Como coordinador, cambiar el lugar de Jornadas de reforestación. Volver a la ventana de `voluntario@` | Sale el lugar nuevo |
| Varios días | Jornadas de reforestación | Una vez en la lista; en el mes, en sus tres días |
| Dos el mismo día | Tras `npm run semillas`, el día 17 en el mes, a 1440 px y a 375 px | A 1440 px, las dos con su hora y título; a 375 px, dos barras y, al pulsar el día, las dos tarjetas debajo |
| En curso | Tras `npm run semillas`, poner en `.env` `AHORA_SIMULADO` con el segundo día de Jornadas de reforestación a las 10:00 (si las semillas se ejecutaron el 06/11, `2026-11-22T10:00:00+01:00`) y reiniciar el back-end. Como `voluntario@`, abrir *Mi calendario*; después `PATCH /api/yo/inscripciones/<id>` con el `id` que da `GET /api/yo/calendario`. Al acabar, vaciar `AHORA_SIMULADO` y reiniciar | Solo sale Jornadas (las otras ya han terminado), con «En curso», sin la marca «Siguiente» y, en el detalle, «La actividad ya ha empezado: no se puede cancelar.»; el `PATCH` da 409 `INSCRIPCION_NO_CANCELABLE`. También lo cubre la prueba automática |
| Sin rol de voluntario | Como `donante@ong.test`: el menú no tiene *Mi calendario*; abrir `/mi-calendario` a mano | «No tienes permiso para realizar esta acción.»; la API responde 403 |
| Sin sesión | Abrir `/mi-calendario` sin entrar | «Inicia sesión para ver tu calendario.» y *Entrar*, que vuelve al calendario |
| Meses anteriores | En el mes actual | «‹» está desactivado |

## Criterios de éxito

- **SC-001**: tras `npm run semillas`, `voluntario@` tiene 4 inscripciones activas en actividades sin
  terminar y salen las 4 (paso 1.1); la prueba automática compara las de la base con las de la respuesta.
- **SC-002**: cronometrar desde que se abre `/mi-calendario` hasta decir cuál es la siguiente actividad
  (objetivo < 10 s): está arriba en la lista, marcada «Siguiente» (la primera confirmada que no ha
  empezado).
