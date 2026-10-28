# Quickstart: validar HU-07

## Preparación

Arranque según el [README](../../README.md): `docker compose up -d`, `npm run migrar`,
`npm run semillas` en `backend/`, y `npm run dev` en `backend/` y en `frontend/`. Correos en
Mailpit (`http://localhost:8025`). Usuarios de prueba: plan-comun §8 (`coordinador@ong.test`,
`voluntario@ong.test`, `voluntario2@ong.test`, `donante@ong.test`).

Pruebas automáticas: `npm test` en `backend/` (`modulos/actividades/servicio.test.js`).

## Historia 1 — Crear, publicar, editar y cancelar

| # | Pasos (como `coordinador@ong.test`, en *Gestionar actividades*) | Resultado esperado |
|---|---|---|
| 1.1 | *Nueva actividad*, rellenar todo con fecha futura, *Guardar* | Aparece en la lista con estado «Borrador» |
| 1.2 | Repetir dejando el título vacío; luego plazas 0; luego fin = inicio; luego inicio ayer | No se crea; mensaje junto al campo correspondiente |
| 1.3 | Con `GET /api/actividades?estado=publicada` (como coordinador): antes no aparece; *Publicar* → repetir. Al integrar spec-005, comprobarlo también en `/actividades` sin sesión | Antes no aparece; después sí |
| 1.4 | En la actividad de semillas con 9 inscritos, apuntar a uno más (10) y poner plazas 6 | Rechazado: «Hay 10 inscritos confirmados…» |
| 1.5 | *Cancelar* una actividad publicada con inscritos y espera | Estado «Cancelada»; ya no sale en `GET /api/actividades?estado=publicada` (y, al integrar spec-005, desaparece de `/actividades`, FR-008); correos en Mailpit a todos |
| 1.6 | Abrir la actividad completa de 2 plazas | Tabla de 2 confirmados y lista de espera con posición 1 |
| 1.7 | Entrar como `voluntario@ong.test` y abrir `/coordinacion/actividades`; con `curl` hacer `POST /api/actividades` | Sin enlace en el menú; la API responde 403 (401 sin sesión) |
| Bordes | Intentar editar o cancelar la celebrada y la cancelada de las semillas; publicar un borrador con inicio pasado | 409 / 400 con mensaje |
| FR-011 | Cambiar el lugar de una publicada con inscritos | Correo de aviso en Mailpit; una publicada no muestra *Volver a borrador* |

## Historia 2 — Lista de espera automática

| # | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Crear y publicar una actividad de 1 plaza; apuntar a `voluntario@` y a `voluntario2@` (HU-05) | El segundo queda en espera, posición 1 |
| 2.2 | Cancelar la inscripción de `voluntario@` | `voluntario2@` pasa a confirmado y recibe correo |
| 2.3 | Actividad completa de 2 plazas con 1 en espera: subir plazas a 3 | El de la espera pasa a confirmado y recibe correo |
| 2.4 | Con 2 en espera, cancela el primero | El segundo pasa a posición 1 |

En 2.2 el correo lo envía `avisarPlazaConfirmada` (spec-007) aunque la cancelación sea de spec-005.

Los pasos 2.1, 2.2 y 2.4 necesitan la inscripción de spec-005; mientras no esté, se comprueban
con `servicio.test.js` y las semillas.

## Criterios de éxito

- SC-001: cronometrar 1.1 + 1.3 (< 3 min).
- SC-002 / SC-003: `servicio.test.js` con peticiones simultáneas de inscripción y cambio de
  plazas: nunca más confirmados que plazas y nadie queda en espera con plazas libres.
