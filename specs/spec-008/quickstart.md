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
| 1.1 | Abrir directamente `/coordinacion/actividades/<id>/asistencia` de una actividad futura | Controles desactivados; aviso «La actividad todavía no ha comenzado»; el `PUT` da 409 |
| 1.2 | En la actividad de 10:00–13:30, marcar a `voluntario2` como «asistió» y Guardar | Aviso de guardado; en `/mis-horas` de `voluntario2` el total sube 3,5 h |
| 1.3 | Guardar otra vez sin cambios | El total de `voluntario2` sigue igual |
| 1.4 | Cambiar `voluntario2` a «no asistió» y Guardar | Su total baja 3,5 h |
| 1.5 | Abrir la pantalla de asistencia | Solo aparecen confirmados; ni los de espera ni los cancelados |
| 1.6 | Entrar como `voluntario@ong.test` y abrir la URL de asistencia / llamar al `PUT` | Página sin acceso; API 403 |
| Edge | Abrir la asistencia de la actividad cancelada | Aviso y sin guardar (409) |
| SC-002 | Paso previo: preparar los datos como se indica abajo. Después, «Marcar todos» y Guardar, cronometrando | < 2 min |

### Datos temporales para SC-002

Las semillas no traen una actividad celebrada con 20 confirmados y la aplicación no permite crearla, porque el inicio debe ser futuro. Se prepara con una inserción temporal por SQL, **solo en la base de desarrollo** y sin añadirla a las semillas:

1. Insertar una actividad `publicada` con `inicio` y `fin` ya pasados y 20 plazas.
2. Insertar 20 inscripciones `confirmada` con `acepta_requisitos = true`: una por cada uno de los 11 voluntarios de las semillas y otras 9 de usuarios y voluntarios temporales, también insertados a mano.
3. Al terminar, recrear la base de desarrollo (`docker compose down -v`, `npm run migrar` y `npm run semillas`).

## Historia 2 — Mis horas (`voluntario@ong.test`)

| Escenario | Pasos | Resultado esperado |
|---|---|---|
| 2.1 | Paso previo: como `coordinador@ong.test`, marcar a `voluntario@ong.test` como asistente en «Recogida de ropa» y Guardar. Después, como `voluntario@ong.test`, menú «Mis horas» | Total de 5,5 h y desglose de las dos actividades con título, fecha dd/mm/aaaa y horas |
| 2.2 | Entrar como `voluntario3@ong.test`, de la semilla y sin asistencias | «0 h» y mensaje «Aún no tienes horas registradas» |
| 2.3 | Buscar cómo ver las horas de otro (no hay parámetro en `/api/yo/horas`) | Solo se ven las propias; la aplicación no ofrece forma de pedir las de otro |
| SC-001 | Comparar el total con la suma de su desglose | Coinciden siempre |

## Resultado de la prueba (T022, 2026-11-06)

| Escenario | Resultado | Cómo se comprobó |
|---|---|---|
| 1.1 | Correcto | Pantalla: controles desactivados y aviso, sin «Guardar». El `PUT` en futura, solo en las pruebas automáticas |
| 1.2 | Correcto | Pantalla: marcar y Guardar; `/mis-horas` de `voluntario2` muestra 3,5 h |
| 1.3, 1.4 | Correcto | Petición `PUT` con sesión de coordinador; tras corregir, `/mis-horas` de `voluntario2` muestra 0 h |
| 1.5 | Correcto | API: actividad con 2 confirmados y 1 en espera, y la lista devuelve 2 |
| 1.6 | Correcto | Pantalla: «No tienes permiso para registrar asistencias.»; API 403 |
| Actividad cancelada y en borrador | Correcto | API 409 con su motivo |
| Fila guardada | Correcto | Pantalla: «Sin registrar» queda desactivado |
| 2.1, 2.2, SC-001 | Correcto | Pantalla: 5,5 h con el desglose (3,5 h y 2 h); `voluntario3` ve 0 h y el mensaje |
| 2.3 | Correcto | Pruebas automáticas: un parámetro con otro usuario se ignora |
| FR-009 | Correcto | API: 409 `INSCRIPCION_NO_CANCELABLE` |
| SC-002 | **Pendiente** | Cronometrado manual a cargo de Nicole; «Marcar todos» tampoco se ha pulsado en pantalla |
