# Validación 2 de spec-004 (HU-04), 11/11/2026

Ejecución local de T021 al terminar la fase 6, tras hacer `merge` de `main` en `spec-004` con HU-02 y
HU-08 ya integradas (`a0f004a`, sin conflictos).

Entorno desechable: contenedor `postgres:16` con `--rm` en el puerto 5499, con tres bases:

- `ong_test`: migrada (001–009, incluida `007_asistencias`), para las pruebas generales;
- `ong_test_hu01`: vacía, para las pruebas de HU-01;
- `ong_qs`: migraciones, semillas, [datos-prueba.sql](../datos-prueba.sql) y
  [datos-prueba-asistencias.sql](../datos-prueba-asistencias.sql), para el quickstart.

No se ha leído ni usado `.env`: las variables se pasaron en cada orden y el servidor, la migración y
las semillas se lanzaron con `node` directamente. Node 24.21.

## Repetición de T016 — Pruebas automáticas

| Conjunto | Resultado |
|---|---|
| Backend salvo donaciones (`ong_test`) | 11 ficheros, **229 pasan** y 3 omitidas (las de `actividades/servicio.test.js`, ya omitidas antes) |
| Backend donaciones, HU-01 (`ong_test_hu01`) | 15 ficheros, **429 pasan** |
| Frontend `npm test` | **40 pasan** (4 de HU-04) |
| Frontend `npm run build` | Compila |

La fase 6 añade 6 pruebas en `informes.test.js` (27 en total):

- escenario 6 y SC-001: horas exactas a la centésima, iguales a `sum(horas)` de las asistencias;
- asistencia corregida a «no asistió»: no cuenta horas ni voluntario;
- un voluntario en dos proyectos cuenta 1 en cada fila, en el subtotal del periodo y en el total;
- actividad celebrada sin asistencias: 1 actividad, 0 voluntarios y `0.00` h;
- no cuentan las asistencias de actividades canceladas, futuras o fuera del periodo;
- FR-009: JSON, CSV y PDF sin nombre, apellidos, correo, teléfono ni cuenta de los voluntarios.

## Quickstart completo contra el servidor real

Servidor `node src/servidor.js` sobre `ong_qs`, con las llamadas hechas con `curl` y las cuentas de
las semillas. La segunda carga de `datos-prueba-asistencias.sql` no añade filas (5 asistencias de
2023, 13 h, más la de 2 h de las semillas de HU-08, que no es de 2023).

| Paso | Resultado |
|---|---|
| 2.1 Anual 2023 | Agua potable 95,50 €, 4 aport., 2 activ., **2 volunt., 9 h**; Campaña 2024 70,00 €; Comedor social 100,00 €, 2 activ., **1 volunt., 4 h**; Fondo general 30,00 €; total 295,50 €, 7 aport., 4 activ., **2 volunt., 13 h**. Coincide con quickstart §1 |
| 2.2 Agua potable | Solo su fila y el total, iguales (2 volunt., 9 h) |
| 2.3 Por trimestre | T1 70,00 €, 3, 1, 2, 7 h; T2 25,50 €, 1, 1, 1, 2 h; T3 Comedor 0 aport., 1 activ., 0 h, Fondo general 30,00 €, subtotal 30,00 €, 1, 1, 0, 0 h; T4 subtotal 170,00 €, 2, 1, 1, 4 h; total igual al anual. Coincide con el quickstart |
| 2.5 Horas | 9 h (3,5 + 3,5 + 2), 4 h y 13 h; la charla corregida a «no asistió» no suma |
| 2.6 Vacío 2019 | `vacio: true`, 200 |
| 2.7 Fin anterior | 400 `PERIODO_NO_VALIDO` con `campos.hasta` |
| 2.8 Permisos | sin sesión → 401; `donante@ong.test` → 403 `SIN_PERMISO` |
| 2.9 CSV | `text/csv; charset=utf-8`, BOM, `informe-2023-01-01-2023-12-31.csv`; mismas 11 filas y cifras que la pantalla, con las horas con un decimal (`7`, `13`) |
| 2.10 PDF | Título, «Periodo: 01/01/2023 – 31/12/2023 · Proyecto: Todos · Agrupación: Por trimestre» y la misma tabla, en 1 página y sin filas solapadas. El encabezado sale «ONG · CIF» porque no se pasaron `ONG_NOMBRE` ni `ONG_CIF` (se toman de la configuración) |
| 2.11 Datos personales | Ninguno de los 56 valores personales de donantes y voluntarios de la base (nombre, apellidos, NIF/NIE, correo, dirección y teléfono) aparece en el JSON, el CSV o el texto del PDF |
| 2.12 Tiempo | El PDF anual por trimestres se genera en 0,09 s en la API |

**No recorrido a mano en el navegador**: el aspecto de `/informes` y la apertura del CSV en una hoja
de cálculo, ni el cronometraje de SC-002 en la página. Queda para la revisión de Nicole con el
quickstart (principio III).
