# Quickstart: validar HU-08

Base: [plan-comun.md §8](../plan-comun.md#8-pruebas-y-datos-de-prueba-comunes). Contrato:
[contracts/api-asistencias.md](contracts/api-asistencias.md). Modelo: [data-model.md](data-model.md).

## Preparación

1. `docker compose up -d`, luego en `backend/`: `npm run migrar` y `npm run semillas`.
   Si la base es anterior a `006` (spec-005), recrearla (research R2).
2. `npm run dev` en `backend/` y en `frontend/`; abrir `http://localhost:4321`.
3. Datos necesarios (semillas): actividad celebrada de 10:00 a 13:30 con 2 confirmados
   (`voluntario@ong.test`, `voluntario2@ong.test`), una en espera en otra actividad, una
   actividad futura, una cancelada y una asistencia de 2 h de `voluntario@ong.test`.
   Mientras spec-005 no exista, las listas vienen vacías: validar con las pruebas automáticas.

## Pruebas automáticas

`npm test` en `backend/` (`asistencias.test.js`): 10:00–13:30 = 3,5; 22:00–01:00 = 3; repetir el
guardado no duplica; corregir resta; FR-001 (borrador, cancelada, futura → 409); FR-006 (no
confirmada → 400); 401/403 en las rutas de coordinador; 401 en `/api/yo/horas`.

## Historia 1 — Registrar la asistencia (`coordinador@ong.test`)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Abrir una actividad futura → «Registrar asistencia» (o `/coordinacion/actividades/<id>/asistencia`) | Sin interruptores; aviso «La actividad todavía no ha comenzado»; el `PUT` da 409 |
| 1.2 | En la actividad de 10:00–13:30, marcar a `voluntario2` como «asistió» y Guardar | Aviso de guardado; en `/mis-horas` de `voluntario2` el total sube 3,5 h |
| 1.3 | Guardar otra vez sin cambios | El total de `voluntario2` sigue igual |
| 1.4 | Cambiar `voluntario2` a «no asistió» y Guardar | Su total baja 3,5 h |
| 1.5 | Abrir la pantalla de asistencia | Solo aparecen confirmados; ni los de espera ni los cancelados |
| 1.6 | Entrar como `voluntario@ong.test` y abrir la URL de asistencia / llamar al `PUT` | Página sin acceso; API 403 |
| Edge | Abrir la asistencia de la actividad cancelada | Aviso y sin guardar (409) |
| SC-002 | Actividad con 20 confirmados: «Marcar todos» y Guardar, cronometrando | < 2 min |

## Historia 2 — Mis horas (`voluntario@ong.test`)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Menú «Mis horas» | Total (p. ej. 5,5 h) y desglose con título, fecha dd/mm/aaaa y horas |
| 2.2 | Entrar como un voluntario sin asistencias | «0 h» y mensaje «Aún no tienes horas registradas» |
| 2.3 | Buscar cómo ver las horas de otro (no hay parámetro en `/api/yo/horas`) | Solo se ven las propias |
| SC-001 | Comparar el total con la suma de su desglose | Coinciden siempre |
