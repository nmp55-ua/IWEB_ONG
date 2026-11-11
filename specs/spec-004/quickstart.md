# Quickstart: HU-04 — Informes de recaudación y voluntariado

Guía para comprobar cada escenario de [spec.md](spec.md) en la aplicación (principio III). El
formato de la API está en [contracts/api-informes.md](contracts/api-informes.md).

## 0. Preparación

1. Base de desarrollo con las migraciones y las semillas: `npm run migrar` y `npm run semillas`
   en `backend/`.
2. Cargar los datos sintéticos de 2023 (año que las semillas no usan):
   `psql "$DATABASE_URL" -f specs/spec-004/datos-prueba.sql`.
3. Cargar las asistencias de esos datos (necesitan la migración `007_asistencias` de HU-08):
   `psql "$DATABASE_URL" -f specs/spec-004/datos-prueba-asistencias.sql`.
4. Arrancar backend y frontend (`npm run dev` en cada uno) y entrar como `admin@ong.test`.

## 1. Cifras esperadas del informe 2023 (sin agrupar)

Periodo del 01/01/2023 al 31/12/2023, sin filtro de proyecto:

| Proyecto | Puntuales | Cuotas | Total | Aport. | Activ. | Volunt. | Horas |
|---|---|---|---|---|---|---|---|
| Agua potable | 75,50 € | 20,00 € | 95,50 € | 4 | 2 | 2 | 9 h |
| Campaña 2024 | 70,00 € | 0,00 € | 70,00 € | 1 | 0 | 0 | 0 h |
| Comedor social | 100,00 € | 0,00 € | 100,00 € | 1 | 2 | 1 | 4 h |
| Fondo general | 30,00 € | 0,00 € | 30,00 € | 1 | 0 | 0 | 0 h |
| **Total** | 275,50 € | 20,00 € | 295,50 € | 7 | 4 | **2** | 13 h |

- No cuentan la pendiente de 40 € ni la rechazada de 15 €, la de 20 € del 01/01/2024 a las 00:00
  ni la de 60 € del 31/12/2022.
- La cena solidaria del 31/12 a las 22:00, que acaba el 01/01, cuenta en 2023.
- El inventario cuenta como celebrado con 0 h. El mercadillo, cancelado, no cuenta.
- La segunda asistencia de la charla está corregida a «no asistió» y no suma horas.
- Hay **2** voluntarios en el total aunque las filas sumen 3: `voluntario@ong.test` asistió en Agua
  potable y en Comedor social.

## 2. Escenarios

| Paso | Escenario | Acción | Resultado esperado |
|---|---|---|---|
| 2.1 | US1-1, US1-2 | En **Informes**, del 01/01/2023 al 31/12/2023, sin proyecto ni agrupación, «Generar» | Las 4 filas y el total de la tabla del apartado 1, en ese orden y con todas sus columnas |
| 2.2 | US1-3 | Igual, con el proyecto «Agua potable» | Solo la fila de Agua potable y el total, con las mismas cifras |
| 2.3 | US1-4 | Igual, sin proyecto y agrupado por trimestre | T1: Agua potable 50,00 + 20,00 = 70,00 €, 3 aport., 1 activ., 2 volunt., 7 h; subtotal igual. T2: Agua potable 25,50 €, 1, 1, 1, 2 h; subtotal igual. T3: Comedor social 0,00 €, 0 aport., 1 activ., 0, 0 h; Fondo general 30,00 €, 1 aport.; subtotal 30,00 €, 1, 1, 0, 0 h. T4: Campaña 2024 70,00 €, 1; Comedor social 100,00 €, 1, 1, 1, 4 h; subtotal 170,00 €, 2, 1, 1, 4 h. Total como en el apartado 1 |
| 2.4 | US1-5 | Revisar 2.1 | No cuentan las aportaciones pendiente y rechazada ni las del 31/12/2022 y el 01/01/2024 |
| 2.5 | US1-6 | Revisar 2.1 con las asistencias cargadas | Horas: 9 h (3,5 + 3,5 + 2), 4 h y total 13 h |
| 2.6 | US1-7 | Del 01/01/2019 al 31/12/2019 | Mensaje «No hay aportaciones confirmadas ni actividades celebradas en este periodo.», sin error |
| 2.7 | US1-8 | Desde 31/12/2023 hasta 01/01/2023 | No se genera; junto a «Hasta»: «La fecha de fin no puede ser anterior a la de inicio.» |
| 2.8 | US1-9 | Entrar como `donante@ong.test` y abrir `/informes`; sin sesión, `curl -i "http://localhost:3000/api/informes?desde=2023-01-01&hasta=2023-12-31"` | No aparece «Informes» en el menú; la página muestra el aviso de acceso denegado; la API da 403 `SIN_PERMISO` y, sin sesión, 401 `NO_IDENTIFICADO` |
| 2.9 | US2-1 | Con el informe de 2.3 en pantalla, «Exportar CSV» y abrirlo en una hoja de cálculo | Mismas filas, columnas y cifras que en pantalla (importes con coma, horas con un decimal), con acentos correctos |
| 2.10 | US2-2 | «Exportar PDF» | Encabezado de la ONG, título, «Periodo: 01/01/2023 – 31/12/2023 · Proyecto: Todos · Agrupación: Por trimestre» y la misma tabla |
| 2.11 | FR-009 | Revisar pantalla, CSV y PDF | Ningún nombre, correo, NIF/NIE ni dirección de donantes o voluntarios |
| 2.12 | SC-002 | Cronometrar desde abrir Informes hasta tener el PDF anual descargado | Menos de 1 minuto |

## 3. Pruebas automáticas

```bash
# backend/, con una base de pruebas desechable (nunca la de desarrollo)
DATABASE_URL=<ong_test> TEST_DATABASE_URL=<ong_test> npx vitest run src/modulos/certificados-informes
# frontend/
npm test
```
