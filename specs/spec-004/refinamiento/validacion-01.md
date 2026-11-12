# Validación 1 de spec-004 (HU-04), 09/11/2026

Ejecución local de T016 y T017 al terminar las fases 1–5 de `/speckit-implement`.

Entorno desechable: contenedor `postgres:16` con `--rm` en el puerto 5499, con tres bases:

- `ong_test`: migrada, para las pruebas generales;
- `ong_test_hu01`: vacía, para las pruebas de HU-01;
- `ong_qs`: migraciones, semillas y [datos-prueba.sql](../datos-prueba.sql), para el quickstart.

No se ha leído ni usado `.env`: las variables se pasaron en cada orden y el servidor y las semillas se
lanzaron con `node` directamente, sin `--env-file`. Node 24.21.

**Sin la tabla `asistencias`** (HU-08 aún no está en `main`), por lo que las columnas «Voluntarios» y
«Horas» valen 0 en todas las filas. Su comprobación queda para la fase 6 (`validacion-02.md`).

## T016 — Pruebas automáticas

| Conjunto | Resultado |
|---|---|
| Backend salvo donaciones (`ong_test`) | 10 ficheros, **200 pasan** y 3 omitidas (las de `actividades/servicio.test.js`, que ya se omitían antes) |
| Backend donaciones, HU-01 (`ong_test_hu01`) | 12 ficheros, **379 pasan** |
| Frontend `npm test` | **14 pasan** (4 de HU-04) |
| Frontend `npm run build` | Compila |

Línea base antes de HU-04: 167 pasan + 3 omitidas. HU-04 añade 33 pruebas:

- 21 en `informes.test.js`;
- 10 en `textos.test.js`;
- 2 del PDF común en `comunes.test.js`.

Las 33 de `certificados.test.js` (HU-03) siguen pasando con el cambio de `pdf.js`.

## T017 — Quickstart contra el servidor real

Servidor `node src/servidor.js` sobre `ong_qs`, con las llamadas hechas con `curl` y las cuentas de las semillas.

| Paso | Resultado |
|---|---|
| Carga de `datos-prueba.sql` | Se aplica sobre las semillas; la segunda vez no añade filas (11 aportaciones, 5 actividades y 5 inscripciones) |
| 2.1 Anual 2023 | Agua potable 75,50 + 20,00 = 95,50 €, 4 aport., 2 activ.; Campaña 2024 (inactivo) 70,00 €; Comedor social 100,00 €, 2 activ.; Fondo general 30,00 €; total 275,50 + 20,00 = 295,50 €, 7 aport., 4 activ. Coincide con quickstart §1 |
| 2.2 Agua potable | Solo su fila y el total, iguales |
| 2.3 Por trimestre | T1 70,00 € (3 aport., 1 activ.); T2 25,50 €; T3 Comedor 0,00 € con 1 activ. y Fondo general 30,00 €, subtotal 30,00 €; T4 Campaña 2024 70,00 € y Comedor 100,00 €, subtotal 170,00 €; total igual al anual |
| 2.4 | No cuentan la pendiente, la rechazada ni las del 31/12/2022 y el 01/01/2024; la cena del 31/12 a las 22:00 cuenta en el T4; el mercadillo cancelado no cuenta |
| 2.6 Vacío 2019 | `vacio: true`, 200 |
| 2.7 Fin anterior | 400 `PERIODO_NO_VALIDO` con `campos.hasta` |
| 2.8 Permisos | `donante@ong.test` → 403 `SIN_PERMISO`; sin sesión → 401 `NO_IDENTIFICADO` |
| 2.9 CSV | `text/csv; charset=utf-8`, UTF-8 con BOM, CRLF y `informe-2023-01-01-2023-12-31.csv`; mismas 11 filas y cifras que la pantalla |
| 2.10 PDF | Encabezado «ONG de Prueba · CIF G12345678», título, «Periodo: 01/01/2023 – 31/12/2023 · Proyecto: Todos · Agrupación: Por trimestre» y la misma tabla, sin filas solapadas |
| 2.11 Datos personales | Ningún nombre, apellido, NIF/NIE, correo, dirección o teléfono de los donantes y voluntarios de la base aparece en el JSON, el CSV o el texto del PDF |
| 2.12 Tiempo | El PDF anual se genera en 0,06 s en la API; el recorrido completo en la página queda para la revisión a mano |

**No recorrido a mano en el navegador**: el aspecto de `/informes` (formulario, tabla, negritas,
enlace «Informes» del menú solo para administración, aviso de acceso denegado) y la apertura del CSV
en una hoja de cálculo. La lógica está cubierta por las pruebas automáticas, pero el principio III
pide comprobarlo en la aplicación. Queda para la revisión de Nicole con el quickstart.

## Pendiente (fase 6, bloqueada por HU-08)

- T018–T021: voluntarios distintos y horas con `asistencias`, escenario 6, caso límite de asistencias
  corregidas, y SC-001 de horas. Después, la repetición completa del quickstart con
  [datos-prueba-asistencias.sql](../datos-prueba-asistencias.sql).
