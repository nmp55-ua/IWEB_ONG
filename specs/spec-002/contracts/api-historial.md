# Contrato HTTP de HU-02

**Estado**: implementado y validado en spec-002; converge y revisión externa pendientes · **Responsable**: Nada · **Revisor**: Javi

Se aplica el formato común de [CONVENCIONES.md](../../../CONVENCIONES.md) y [plan-comun.md](../../plan-comun.md). Se reutiliza el router de donaciones y el middleware común. Este endpoint no modifica los contratos de HU-01 ni HU-03.

## GET /api/yo/aportaciones

Consulta privada de las aportaciones confirmadas del Donante vinculado al Usuario de la sesión.

### Autorización

- Requiere cuenta activa y `requiereRol('donante')` antes del servicio.
- El servidor obtiene `req.usuario.id`; busca exclusivamente `donantes.usuario_id`. No se aceptan Usuario ni Donante en query, cuerpo o ruta.
- El correo coincidente, conocer IDs o referencias y disponer de `req.session.donaciones` no conceden acceso.
- Sin vínculo se responde 200 con el estado sin vínculo. No se responde buscando por correo ni revelando si existen aportaciones asociadas a él.
- Es un GET de solo lectura: no reutiliza las comprobaciones de origen/CSRF de los POST de navegador de HU-01 ni su permiso invitado. La protección sigue siendo la sesión y el rol comunes.
- La respuesta y los errores propios de esta ruta se servirán con `Cache-Control: private, no-store` y `Vary: Cookie`; no se almacenan en localStorage ni se comparten entre cuentas. Las cabeceras se fijan al entrar en la ruta, antes del middleware de autorización.

### Parámetro opcional

| Parámetro | Reglas                                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anio`    | Una única cadena de cuatro dígitos, valor entre 1000 y 9999. Ausente significa todos los años. Vacío, repetido, array, decimal o fuera de rango produce 400 |

Se rechazan claves desconocidas, incluidas `usuarioId`, `donanteId` y `correo`, como datos inválidos. No se ignoran selectores de otra persona aparentando aplicarlos. Rutas para historiales ajenos que no existen conservan el 404 común.

### Respuesta 200 con resultados

```json
{
  "vinculado": true,
  "filtroAnio": null,
  "hayAportaciones": true,
  "aniosDisponibles": [2026, 2025],
  "datos": [
    {
      "anio": 2026,
      "importeTotal": "20.00",
      "aportaciones": [
        {
          "id": "9007199254740993",
          "fechaCobro": "2026-01-15T12:00:00+01:00",
          "importe": "20.00",
          "modalidad": "puntual",
          "destino": "fondo general"
        }
      ]
    },
    {
      "anio": 2025,
      "importeTotal": "80.00",
      "aportaciones": [
        {
          "id": "102",
          "fechaCobro": "2025-12-15T12:00:00+01:00",
          "importe": "30.00",
          "modalidad": "cuota_socio",
          "destino": "Agua potable"
        },
        {
          "id": "101",
          "fechaCobro": "2025-01-15T12:00:00+01:00",
          "importe": "50.00",
          "modalidad": "puntual",
          "destino": "fondo general"
        }
      ]
    }
  ],
  "total": 3
}
```

El ejemplo es sintético. Los grupos y filas se ordenan en el servidor; el desempate de filas de igual fecha usa ID numérico descendente, conservando su representación textual en JSON. No se limita el número de resultados a 60. Los grupos solo contienen aportaciones confirmadas.

Con `?anio=2025` se conserva `aniosDisponibles: [2026, 2025]`, se devuelve solo el grupo 2025, `filtroAnio: 2025` y `total: 2`. Cada `importeTotal` corresponde a todas las filas de ese año, no a un subtotal paginado.

### Respuestas 200 sin filas

Sin vínculo verificado:

```json
{
  "vinculado": false,
  "filtroAnio": null,
  "hayAportaciones": null,
  "aniosDisponibles": [],
  "datos": [],
  "total": 0
}
```

`total: 0` cuenta filas accesibles en esa respuesta; no afirma que la persona nunca haya donado. No se consultan aportaciones para determinar ese estado.

Con vínculo y sin confirmadas en ningún año:

```json
{
  "vinculado": true,
  "filtroAnio": null,
  "hayAportaciones": false,
  "aniosDisponibles": [],
  "datos": [],
  "total": 0
}
```

Con vínculo y confirmadas en otros años, filtrando un año sin resultados:

```json
{
  "vinculado": true,
  "filtroAnio": 2024,
  "hayAportaciones": true,
  "aniosDisponibles": [2026, 2025],
  "datos": [],
  "total": 0
}
```

La validación del filtro se realiza también sin vínculo; un filtro inválido no se transforma en una petición válida por carecer de vínculo.

### Errores

| HTTP | Código            | Situación                                                                 |
| ---- | ----------------- | ------------------------------------------------------------------------- |
| 400  | `DATOS_INVALIDOS` | Filtro o claves no admitidas; detalle junto a `anio` o campo general `_`  |
| 401  | `NO_IDENTIFICADO` | Sin sesión válida, según middleware común                                 |
| 403  | `SIN_PERMISO`     | Cuenta sin rol donante, según middleware común                            |
| 500  | `ERROR_INTERNO`   | Fallo no controlado de consulta; no revela SQL ni datos de otras personas |

```json
{
  "error": {
    "codigo": "DATOS_INVALIDOS",
    "mensaje": "Revisa los datos marcados.",
    "campos": { "anio": "Introduce un año de cuatro cifras entre 1000 y 9999." }
  }
}
```

### Dinero y fechas

`importe` e `importeTotal` son texto decimal con punto y dos decimales. La suma no tiene el límite individual de HU-01. El servidor conserva NUMERIC y la interfaz formatea la suma sin Number. `fechaCobro` usa `aIsoMadrid`; el filtro y año se calculan con Europe/Madrid, nunca a partir de la fecha de creación.

### Ausencia de efectos

Abrir, filtrar y repetir la consulta no crea aportaciones, operaciones, correos, vínculos ni certificados; tampoco llama a Stripe o SMTP. Los pagos no confirmados no se incluyen, incluso si existe retorno de Checkout. Las confirmaciones que ocurran después de la instantánea se incorporan en la siguiente petición.
