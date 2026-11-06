# Quickstart: validar HU-08

Base: [plan-comun.md §8](../plan-comun.md#8-pruebas-y-datos-de-prueba-comunes). Contrato:
[contracts/api-asistencias.md](contracts/api-asistencias.md). Modelo: [data-model.md](data-model.md).

## Preparación

1. `docker compose up -d`, luego en `backend/`: `npm run migrar` y `npm run semillas`.
2. `npm run dev` en `backend/` y en `frontend/`; abrir `http://localhost:4321`.
3. Datos necesarios (semillas): «Recogida de ropa», celebrada de 10:00 a 13:30, con 2 confirmados
   (`voluntario@ong.test`, `voluntario2@ong.test`), una en espera en otra actividad, una
   actividad futura, una cancelada y una asistencia de 2 h de `voluntario@ong.test`.

## Pruebas automáticas

`npm test` en `backend/` (`asistencias.test.js`): 10:00–13:30 = 3,5; 22:00–01:00 = 3; repetir el
guardado no duplica; corregir resta; FR-001 (borrador, cancelada, futura → 409); FR-006 (no
confirmada → 400); 401/403 en las rutas de coordinador; 401 en `/api/yo/horas`.

## Historia 1 — Registrar la asistencia (`coordinador@ong.test`)

Los escenarios 1.2–1.4 se validan cuando existen T015–T019 (`/mis-horas`), que es donde se ve el total.

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| 1.1 | Abrir directamente `/coordinacion/actividades/<id>/asistencia` de una actividad futura | Sin interruptores; aviso «La actividad todavía no ha comenzado»; el `PUT` da 409 |
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
| 2.1 | Paso previo: como `coordinador@ong.test`, marcar a `voluntario@ong.test` como asistente en «Recogida de ropa» y Guardar. Después, como `voluntario@ong.test`, menú «Mis horas» | Total de 5,5 h y desglose de las dos actividades con título, fecha dd/mm/aaaa y horas |
| 2.2 | Entrar como un voluntario sin asistencias | «0 h» y mensaje «Aún no tienes horas registradas» |
| 2.3 | Buscar cómo ver las horas de otro (no hay parámetro en `/api/yo/horas`) | Solo se ven las propias; la aplicación no ofrece forma de pedir las de otro |
| SC-001 | Comparar el total con la suma de su desglose | Coinciden siempre |
