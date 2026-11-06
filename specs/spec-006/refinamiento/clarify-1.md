# Clarify de spec-006 (HU-06), 06/11/2026

Decisiones tomadas en `/speckit-clarify` sobre la versión de `spec.md` del 28/10 (commit `a6eadf5`).
Las cuatro preguntas se hicieron juntas y en las cuatro se eligió la opción recomendada.

| ID | Pregunta | Respuesta | Por qué | Afecta a |
|---|---|---|---|---|
| PA6.1 | ¿Se puede exportar el calendario a otro (Google, Outlook…) con un fichero .ics? | No, queda fuera de la v1. | Ningún criterio de aceptación lo pide y sería un formato y una ruta más (principios I y II). Un .ics descargado no se entera si luego la actividad cambia o se cancela, y una suscripción que se actualice sola necesita un enlace secreto que funcione sin sesión, que es un riesgo para los datos personales (principio V). | Assumptions |
| Q2 | ¿Cuándo se actualiza el calendario sin recargar la página? | Al abrir la página, después de cada acción del voluntario en el calendario y cada vez que vuelve a la pestaña. | Las acciones propias se ven al momento. Los cambios que hacen otros (el coordinador cancela o cambia la fecha, a uno le dan plaza desde la lista de espera) llegan con un correo de HU-07, así que el voluntario los mira al volver a la pestaña, y es entonces cuando se piden los datos otra vez. Consultar cada minuto serían muchas peticiones para un caso raro, y avisar desde el servidor (WebSocket) sería una pieza nueva en la arquitectura común que habría que acordar con el grupo (principios I y XII). | FR-005, escenario 2.3, Edge Cases |
| Q3 | ¿Qué actividades cuentan como «próximas»? | Las que aún no han terminado. | FR-002 decía «fecha igual o posterior a hoy» y el escenario 2, que una celebrada no sale: chocaban con una actividad de esta mañana que ya ha acabado. Con «aún no ha terminado», una de varios días que ya empezó sigue saliendo, porque el voluntario todavía tiene ese compromiso. Desde el inicio ya no se puede cancelar (regla de HU-05), así que el detalle no ofrece cancelar. | FR-002, FR-004, SC-001, escenarios 1.2 y 1.4, Edge Cases |
| Q4 | ¿Qué vista se ve primero? | La lista, ordenada por fecha; la mensual, a un clic. | Con la lista, la primera actividad es la siguiente, que es lo que mide SC-002 (menos de 10 s). En un móvil la cuadrícula del mes es estrecha y la lista se lee mejor. Las dos a la vez cargarían la pantalla. | FR-001, escenario 1.1, SC-002 |

## Otros cambios en `spec.md`

- **Escenario 5 y FR-006**: el calendario es una ruta personal (`/api/yo/calendario`, plan-comun §3) que no lleva el identificador de nadie, así que no hay forma de pedir el de otro. Para que el criterio se pueda comprobar, el escenario habla también de «una inscripción de otro voluntario»: abrirla o cancelarla da 404, como en HU-05.
- **FR-004 y escenario 2.1**: en lista de espera la opción es «salir de la lista de espera», que es la misma cancelación de HU-05.
- **Edge Cases**: se añaden la actividad de varios días ya empezada, el cambio de fecha o lugar hecho por el coordinador (HU-07) y el usuario sin rol de voluntario, que no tiene calendario. Se precisa que una actividad de varios días sale en todos sus días en la vista mensual y una vez en la lista.
- **Assumptions**: los recordatorios por correo tampoco entran en la v1; el correo común solo tiene los avisos de spec-001 y spec-007 (plan-comun §6).

No ha quedado ninguna pregunta abierta en la spec.
