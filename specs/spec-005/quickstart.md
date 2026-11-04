# Quickstart: validar HU-05

## Preparación

Arranque según el [README](../../README.md): `npm run migrar` y `npm run semillas` en `backend/`,
y `npm run dev` en `backend/` y en `frontend/`. Correos en Mailpit (`http://localhost:8025`).
`npm run semillas` deja las inscripciones de prueba como al principio, así que se puede repetir
la validación desde cero.

Datos de prueba (plan-comun §8 y `db/semillas/voluntariado.js`), con la contraseña de
`CONTRASENA_SEMILLAS`:

| Actividad (semillas de spec-007) | Estado | Inscripciones de prueba |
|---|---|---|
| Limpieza de playa · Agua potable · dentro de 14 días · 10 plazas · «Traer guantes.» | publicada | 9 confirmadas (`voluntario3`…`voluntario11@ong.test`) |
| Reparto de alimentos · Comedor social · dentro de 7 días · 2 plazas | publicada | confirmadas `voluntario3` y `voluntario4`; en espera `voluntario5` |
| Recogida de ropa · hace 3 días | celebrada | confirmadas `voluntario@` y `voluntario3` |
| Taller de reciclaje / Mercadillo solidario | borrador / cancelada | — |

`voluntario@ong.test` y `voluntario3`…`11` tienen perfil de voluntario; `voluntario2@ong.test`
(voluntario y donante) todavía no. `donante@ong.test` no es voluntario.

Pruebas automáticas: `TEST_DATABASE_URL=<url de ong_test> npm test` en `backend/` (como en el
quickstart de spec-007; nunca contra la base de desarrollo).

## Historia 1 — Consultar las actividades disponibles

| # | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Sin sesión, abrir *Actividades* (`/actividades`) | Limpieza de playa y Reparto de alimentos, por fecha, con título, descripción, día y horario, lugar, proyecto, «1 plaza libre de 10» / «0 plazas libres de 2» y requisitos («Sin requisitos» si no hay) |
| 1.2 | En el mismo listado | No salen el borrador, la cancelada ni la celebrada |
| 1.3 | Filtrar *Proyecto* = Comedor social; después *Hasta* = dentro de 10 días con *Proyecto* = Agua potable | Solo Reparto de alimentos; después ninguna, con el mensaje de lista vacía |

## Historia 2 — Inscribirme y cancelar

Hacer los pasos en este orden (cada uno parte del anterior).

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.9 | Sin sesión, *Inscribirme* en Limpieza de playa | Lleva a *Entrar* y, al entrar, vuelve a `/actividades` |
| 2.10 | Como `donante@ong.test`, *Inscribirme* | Aviso «Necesitas una cuenta de voluntario para inscribirte en actividades.» |
| 2.2 | Como `voluntario@ong.test`, *Inscribirme* en Limpieza de playa y *Confirmar* sin marcar la casilla de requisitos | Mensaje junto a la casilla; no se inscribe |
| 2.1 | Marcar «Cumplo los requisitos» y *Confirmar* | «Estás inscrito»; la tarjeta pasa a «0 plazas libres de 10» |
| 2.4 | Repetir la petición con `curl` (`POST /api/actividades/<id>/inscripciones` con la cookie de sesión) | 409 «Ya estás inscrito en esta actividad.» |
| 2.5 | *Cancelar inscripción* en Limpieza de playa y confirmar | Vuelve a «1 plaza libre de 10» y a «Inscribirme» |
| 2.3 | En Reparto de alimentos (completa), *Apuntarme a la lista de espera*, marcar la casilla y confirmar | «En lista de espera · posición 2» |
| 2.7 | Como `voluntario5@ong.test`, *Salir de la lista de espera* en Reparto de alimentos. Volver como `voluntario@` | `voluntario@` pasa a la posición 1 |
| 2.6 | Como `voluntario3@ong.test`, *Cancelar inscripción* en Reparto de alimentos | Sigue en «0 plazas libres de 2»; `voluntario@` queda confirmado y en Mailpit le llega «Plaza confirmada: «Reparto de alimentos»» |
| 2.8 | Tras `npm run semillas`: abrir *Inscribirme* en Limpieza de playa como `voluntario@` y, sin confirmar, inscribir a `voluntario2` en otra ventana (paso 2.11); después confirmar la primera | «Ya no quedan plazas libres…» y el botón *Apuntarme a la lista de espera* |
| 2.11 | Como `voluntario2@ong.test`, *Inscribirme* | Pide nombre, apellidos, correo (relleno con el de la cuenta) y teléfono; tras inscribirse, la siguiente vez ya no los pide |

## Bordes

| Caso | Pasos | Resultado esperado |
|---|---|---|
| Actividad ya celebrada | `POST /api/actividades/<id de Recogida de ropa>/inscripciones` como `voluntario2` | 409 `ACTIVIDAD_CELEBRADA` |
| Cancelar tras el inicio | `PATCH /api/yo/inscripciones/<id>` de `voluntario@` en Recogida de ropa | 409 `INSCRIPCION_NO_CANCELABLE` |
| Inscripción de otro | `PATCH /api/yo/inscripciones/<id de voluntario3>` como `voluntario@` | 404 |
| Solapes | Como coordinador, crear y publicar otra actividad a la misma hora que Limpieza de playa; inscribirse en las dos | Se permite (FR-010) |
| Volver tras cancelar | Inscribirse, cancelar y volver a inscribirse en la misma | Se permite |
| Actividad cancelada | Como coordinador, cancelar Reparto de alimentos | Desaparece de `/actividades`; los inscritos reciben el aviso de HU-07 |

## Criterios de éxito

- **SC-001**: cronometrar desde abrir `/actividades` hasta «Estás inscrito» (objetivo < 2 min).
- **SC-002**: la prueba automática de peticiones simultáneas y los pasos 2.6 y 2.8.
