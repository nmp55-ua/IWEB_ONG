# Prueba manual de spec-005 (HU-05), 04/11/2026

Recorrido completo de [quickstart.md](../quickstart.md) (T022) con la aplicación en marcha en local:
back-end en el puerto 3000, front-end en el 4321 y PostgreSQL con `npm run migrar` y `npm run semillas`.
Versión: rama `spec-005`, código del commit `dcc696e` y, para T027 y T028, el de la fase 6. Los pasos con
«otra persona» se hicieron desde otra sesión con `curl`, que equivale a otro navegador.

## Historia 1 — Consultar las actividades disponibles

| # | Resultado observado | ¿Pasa? |
|---|---|---|
| 1.1 | Sin sesión salen Reparto de alimentos (11/11/2026, de 09:00 a 12:00, «0 plazas libres de 2», «Sin requisitos») y Limpieza de playa (18/11/2026, de 10:00 a 13:00, «1 plaza libre de 10», «Traer guantes.»), por fecha y con proyecto, descripción y lugar | Sí |
| 1.2 | No salen Taller de reciclaje (borrador), Mercadillo solidario (cancelada) ni Recogida de ropa (celebrada) | Sí |
| 1.3 | Con *Proyecto* = Comedor social, solo Reparto de alimentos; con Agua potable y *Hasta* = 14/11/2026, «No hay actividades disponibles con estos filtros.». Con *Desde* posterior a *Hasta*, el mensaje sale junto al campo | Sí |

## Historia 2 — Inscribirme y cancelar

| # | Resultado observado | ¿Pasa? |
|---|---|---|
| 2.9 | Sin sesión, *Inscribirme* lleva a `/entrar?volver=/actividades` y, al entrar, vuelve al listado | Sí |
| 2.10 | Como `donante@`, la ventana muestra «Necesitas una cuenta de voluntario para inscribirte en actividades.» y no deja confirmar | Sí |
| 2.2 | Como `voluntario@`, *Confirmar inscripción* sin la casilla: «Confirma que cumples los requisitos de la actividad.» debajo de la casilla | Sí |
| 2.1 | Con la casilla: «Te has inscrito en «Limpieza de playa».», «Estás inscrito» y «0 plazas libres de 10» | Sí |
| 2.4 | Repetir el `POST`: 409 `YA_INSCRITO`, «Ya estás inscrito o en la lista de espera de esta actividad.» | Sí (el texto del quickstart se corrigió en T024) |
| 2.5 | *Cancelar inscripción*: «Has cancelado tu inscripción…» y vuelve a «1 plaza libre de 10» | Sí |
| 2.3 | En Reparto de alimentos: «Estás en la lista de espera… (posición 2).» y la tarjeta «En lista de espera · posición 2» | Sí |
| 2.7 | `voluntario5` sale de la lista: `voluntario@` pasa a la posición 1 | Sí |
| 2.6 | `voluntario3` cancela su plaza: `voluntario@` queda confirmado y las plazas libres siguen en 0. Se intenta un único correo, «Plaza confirmada: «Reparto de alimentos»», a `voluntario@ong.test` (en esta máquina no hay Mailpit, así que el registro del back-end muestra el intento y el error de conexión, sin deshacer nada) | Sí |
| 2.8 | Con la ventana de `voluntario@` abierta, `voluntario2` ocupa la última plaza; al confirmar sale «Ya no quedan plazas libres en esta actividad. Puedes apuntarte a la lista de espera.» y el botón cambia a *Apuntarme a la lista de espera*. **Al cerrar la ventana, la tarjeta seguía diciendo «1 plaza libre»** hasta recargar la página → T027 | Sí, con T027 |
| 2.11 | Con una cuenta nueva de `/registro`, la ventana pide nombre, apellidos, correo (relleno con el de la cuenta) y teléfono; «123» da «Introduce un teléfono válido.»; con un teléfono válido se inscribe y la siguiente vez ya no pide los datos | Sí |

## Bordes

| Caso | Resultado observado | ¿Pasa? |
|---|---|---|
| Actividad ya celebrada | 409 `ACTIVIDAD_CELEBRADA` | Sí |
| Cancelar tras el inicio (inscripción 17) | 409 `INSCRIPCION_NO_CANCELABLE` y la inscripción sigue confirmada | Sí |
| Inscripción de otro (18) | 404 | Sí |
| Solapes | Otra actividad a la misma hora que Limpieza de playa: `voluntario4`, ya inscrito en esta, se inscribe también (201) | Sí |
| Volver tras cancelar | Inscribirse, cancelar y volver a inscribirse: 201 | Sí |
| Actividad cancelada | El coordinador cancela Reparto de alimentos: desaparece del listado y sus 7 inscripciones quedan canceladas | Sí |
| Fechas imposibles en el filtro (`2026-13-01`, `2026-12-32`, `2026-00-10`) | **Antes de T023: 500 `ERROR_INTERNO`.** Después: 400 con «Fecha no válida.» | Sí, con T023 |

## Pantallas

- A 1440 px, dos tarjetas por fila; a 375 px, una columna y los filtros uno debajo de otro. Nada se sale.
- **Ventana de inscripción en móvil**: en 375×812, con los datos de contacto, ocupaba de 18 a 794 px, y en un
  móvil más bajo no se podía desplazar → T028. Después, en 375×667 va de 45 a 622 px, el contenido se
  desplaza y los botones quedan siempre visibles.
- Consola: solo las respuestas 400, 401, 404 y 409 que provocan los propios pasos (el 401 es el de
  `/api/auth/yo` sin sesión, del menú común). Tres 500 salieron cuando el back-end se reiniciaba tras un
  cambio; no son de la aplicación.

## Criterios de éxito

- **SC-001**: desde el listado son 4 acciones (*Inscribirme*, marcar la casilla, *Confirmar inscripción*
  y ya sale «Estás inscrito»). Falta cronometrarlo a mano con una persona; objetivo < 2 min.
- **SC-002**: en ningún paso hubo más confirmados que plazas (2.6, 2.8 y bordes); la prueba automática de
  peticiones simultáneas también pasa.
