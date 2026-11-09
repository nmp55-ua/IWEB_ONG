# Contrato: API de informes (HU-04)

Formato común de [plan-comun.md §4](../../plan-comun.md#4-formato-común-de-la-api): prefijo
`/api`, JSON `camelCase`, importes como texto con 2 decimales y punto, fechas sin hora
`AAAA-MM-DD` y errores `{ "error": { "codigo", "mensaje", "campos"? } }`.

Todas las rutas exigen sesión y el rol **administrador** (`requiereRol('administrador')`):
401 `NO_IDENTIFICADO` sin sesión y 403 `SIN_PERMISO` sin ese rol (FR-008).

## Parámetros del informe

Los usan `GET /api/informes`, `/api/informes/csv` y `/api/informes/pdf`, en la consulta:

| Parámetro | Obligatorio | Formato | Regla |
|---|---|---|---|
| `desde` | sí | `AAAA-MM-DD` | primer día del periodo, incluido |
| `hasta` | sí | `AAAA-MM-DD` | último día del periodo, incluido; no anterior a `desde` |
| `proyectoId` | no | entero positivo | solo ese proyecto; sin él, todos más «fondo general» |
| `agrupacion` | no | `mes` · `trimestre` · `anio` | sin él, una fila por proyecto |

Errores:

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `DATOS_INVALIDOS` | falta `desde` o `hasta`, no son fechas reales, `proyectoId` no es entero o `agrupacion` no es válida (`campos` con el mensaje de cada uno) |
| 400 | `PERIODO_NO_VALIDO` | `hasta` anterior a `desde`: «La fecha de fin no puede ser anterior a la de inicio.» (`campos.hasta`) |
| 404 | `PROYECTO_NO_ENCONTRADO` | `proyectoId` no existe: «No existe ese proyecto.» |

## `GET /api/informes`

200:

```json
{
  "filtros": {
    "desde": "2026-01-01",
    "hasta": "2026-12-31",
    "proyecto": null,
    "agrupacion": "trimestre"
  },
  "vacio": false,
  "filas": [
    {
      "tipo": "proyecto",
      "periodo": { "etiqueta": "T1 2026", "desde": "2026-01-01", "hasta": "2026-03-31" },
      "proyecto": { "id": "1", "nombre": "Agua potable" },
      "recaudadoPuntual": "50.00",
      "recaudadoCuotas": "30.00",
      "recaudadoTotal": "80.00",
      "aportaciones": 3,
      "actividades": 1,
      "voluntarios": 2,
      "horas": "7.00"
    },
    { "tipo": "fondoGeneral", "periodo": { "etiqueta": "T1 2026", "…": "…" }, "proyecto": null, "…": "…" },
    { "tipo": "subtotal", "periodo": { "etiqueta": "T1 2026", "…": "…" }, "proyecto": null, "…": "…" },
    { "tipo": "total", "periodo": null, "proyecto": null, "…": "…" }
  ]
}
```

- `filtros.proyecto` es `{ "id", "nombre" }` si se filtró, o `null`. `filtros.agrupacion` es
  `null` si no se agrupa.
- `tipo`:
  - `proyecto`: un proyecto, en un periodo si se agrupa;
  - `fondoGeneral`: aportaciones sin proyecto;
  - `subtotal`: un periodo; solo hay subtotales si se agrupa;
  - `total`: la última fila.
- `periodo` es `null` si no se agrupa y en la fila `total`. Su `desde` y `hasta` están recortados
  al rango pedido.
- Las cifras de cada fila son:
  - `recaudadoPuntual`, `recaudadoCuotas` y `recaudadoTotal`: texto, `"0.00"` si no hay;
  - `aportaciones` y `actividades`: enteros;
  - `voluntarios`: entero, personas distintas en el ámbito de la fila;
  - `horas`: texto con 2 decimales, exacto, que la interfaz muestra con 1 decimal.
- Sin datos: `{ "filtros": { … }, "vacio": true, "filas": [] }`.
- Nunca incluye nombre, correo, NIF/NIE ni dirección de donantes o voluntarios (FR-009).

## `GET /api/informes/csv`

200 `text/csv; charset=utf-8`, `Content-Disposition: attachment;
filename="informe-2026-01-01-2026-12-31.csv"`. Las mismas filas, en el mismo orden, que
`GET /api/informes` con los mismos parámetros. `generarCsv` común: separador `;`, UTF-8 con BOM,
importes `1234,50` y horas `3,5`.

Cabecera (sin «Periodo» si no se agrupa):

```text
Periodo;Proyecto;Donaciones puntuales;Cuotas de socio;Total recaudado;Aportaciones;Actividades celebradas;Voluntarios;Horas
```

En «Proyecto» se ponen el nombre, `Fondo general`, `Subtotal T1 2026` o `Total`. Un informe
vacío solo lleva la cabecera.

## `GET /api/informes/pdf`

200 `application/pdf`, `Content-Disposition: attachment; filename="informe-2026-01-01-2026-12-31.pdf"`.
Se genera con `generarPdf` común:

- título «Informe de recaudación y voluntariado»;
- un bloque con el periodo (`01/01/2026 – 31/12/2026`), el proyecto (o «Todos») y la agrupación
  (o «Sin agrupar»);
- la tabla con las mismas columnas y filas que el CSV, con importes `1.234,50 €` y horas `3,5 h`.

Un informe vacío lleva el texto «No hay aportaciones confirmadas ni actividades celebradas en este
periodo.» en lugar de la tabla.

## `GET /api/informes/proyectos`

200: `{ "datos": [ { "id": "3", "nombre": "Campaña 2024", "activo": false }, … ], "total": 3 }`,
con todos los proyectos ordenados por nombre. Sirve para el filtro de la página (R7).
