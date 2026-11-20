# Modelo de lectura de HU-02

**Responsable**: Nada · **Revisor**: Javi · **Fecha**: 2026-11-10

## Fuente única y alcance

Las entidades y restricciones se definen en [modelo-datos.md](../modelo-datos.md). HU-02 las consume sin redefinir su esquema, añadir estados ni crear tablas. Las migraciones vigentes `004_donaciones.sql`, `008_certificados.sql` y `009_operativa_donaciones.sql` se conservan intactas.

| Entidad existente | Uso en la consulta                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Usuario           | Identidad activa y rol obtenidos por el middleware común                                             |
| Donante           | Resolución única mediante `usuario_id` verificado por HU-01                                          |
| Aportación        | Filas de ese Donante con `estado = 'confirmada'`; importe, fecha de cobro, modalidad y destino       |
| Proyecto          | Nombre del proyecto asociado mediante LEFT JOIN; null se presenta como fondo general                 |
| SuscripcionSocio  | Relación de las cuotas ya registrada por HU-01; su estado actual no elimina cuotas confirmadas       |
| CertificadoFiscal | Referencia de contraste posterior a reconciliación; no se consulta ni modifica al abrir el historial |

El estado de una suscripción, la fecha de creación de la operación y el estado del correo no deciden la inclusión en el historial. Una cuota confirmada permanece visible aunque se cancele posteriormente la suscripción o falle su correo.

## Proyección de lectura

El contrato exacto está en [api-historial.md](contracts/api-historial.md). Los nombres camelCase son campos de respuesta, no columnas nuevas.

| Campo                       | Tipo y significado                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `vinculado`                 | Booleano: se ha encontrado el Donante del Usuario autenticado                           |
| `filtroAnio`                | Año entero solicitado o null para el historial completo                                 |
| `hayAportaciones`           | Booleano para cuentas vinculadas; null sin vínculo, sin afirmar si existen aportaciones |
| `aniosDisponibles`          | Años descendentes con confirmadas de esa persona, sin aplicar el filtro                 |
| `datos`                     | Grupos seleccionados, ordenados por año descendente                                     |
| `datos[].anio`              | Año natural Madrid de los cobros                                                        |
| `datos[].importeTotal`      | Suma SQL exacta de ese año, texto decimal de dos posiciones sin separadores de miles    |
| `datos[].aportaciones`      | Filas de ese año ordenadas por fecha de cobro e ID descendentes                         |
| `aportaciones[].id`         | BIGINT representado como texto; clave estable de interfaz                               |
| `aportaciones[].fechaCobro` | ISO 8601 con desfase Madrid, mediante `aIsoMadrid`                                      |
| `aportaciones[].importe`    | Texto decimal canónico de dos posiciones                                                |
| `aportaciones[].modalidad`  | `puntual` o `cuota_socio`, según el valor persistido                                    |
| `aportaciones[].destino`    | Nombre del Proyecto asociado o `fondo general`                                          |
| `total`                     | Número de aportaciones seleccionadas, no número de grupos ni importe monetario          |

La respuesta no contiene NIF/NIE, correo, dirección, usuario_id, donante_id, claves de pasarela ni información de tarjeta. El ID de aportación sirve para identificar filas, no autoriza otras consultas.

## Lecturas e invariantes

Se realizan sobre una única conexión y una única transacción `REPEATABLE READ, READ ONLY`:

1. Resolver Donante mediante `WHERE usuario_id = $1`, con el Usuario del servidor. Si no existe, terminar sin consultar aportaciones.
2. Obtener los años y sumas de todas sus confirmadas: restringir siempre por `donante_id` y estado; agrupar por `EXTRACT(YEAR FROM fecha_cobro AT TIME ZONE 'Europe/Madrid')`; ordenar el año descendente.
3. Obtener detalle del mismo Donante y estado. Cuando se filtra, añadir `fecha_cobro >= $desde AND fecha_cobro < $hasta`, calculados mediante `rangoAnio`. Incluir el año Madrid en la proyección SQL para agrupar sin depender de la zona del proceso. Ordenar por `fecha_cobro DESC, id DESC`.

Los parámetros se enlazan en consultas SQL, sin interpolar el año o identificadores. Las columnas de la proyección se seleccionan explícitamente. Se usan los totales del segundo paso para los grupos incluidos en el tercero; no se recalculan con aritmética de JavaScript. Para año sin resultados se mantienen los años disponibles de toda la persona.

El JOIN de Proyecto no filtra por activo: desactivar un proyecto no debe ocultar aportaciones históricas. No se reasigna el destino ni se crea una copia histórica del nombre del Proyecto.

El índice existente `(donante_id, estado, fecha_cobro)` permite restringir persona, estado y rango. El desempate por ID no justifica por sí solo un índice adicional. Se observará el plan de consulta durante las pruebas; ninguna medición se ha realizado en esta fase.

## Exactitud

- El límite individual de HU-01 permanece en su dominio. No se reutiliza la validación de importe individual para sumas anuales.
- PostgreSQL acumula con `SUM(NUMERIC)` sin cast a `NUMERIC(10,2)`. El DTO conserva dos decimales, incluyendo `"1999999.98"` para dos aportaciones de `"999999.99"`.
- No se usa `parseFloat`, Number ni conversión a céntimos Number para agregar o presentar el total anual. El formato local opera sobre dígitos del texto canónico.
- Los BIGINT se conservan como texto fuera de PostgreSQL; se ordenan numéricamente en SQL. El ID `9007199254740993` no debe confundirse con el anterior.
- El formato individual puede reutilizar `formatearEuros` dentro del rango acotado de HU-01; el formato anual exacto es propio de HU-02.

## Estados de presentación

| Condición                             | Resultado                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Cuenta sin vínculo                    | `vinculado: false`, `hayAportaciones: null`, arrays vacíos, explicación y enlace de HU-01           |
| Vínculo sin confirmadas en ningún año | `vinculado: true`, `hayAportaciones: false`, mensaje de historial vacío                             |
| Hay confirmadas, pero no en el filtro | `hayAportaciones: true`, años disponibles conservados, grupos vacíos, aviso del año y quitar filtro |
| Hay confirmadas seleccionadas         | Grupos, filas y sumas de la misma instantánea                                                       |
| Error de consulta                     | Error común, sin sustituir por un historial vacío o total cero                                      |

HU-02 no define transiciones persistidas. Un nuevo cobro solo se incorpora después de que HU-01 lo confirme; una consulta iniciada antes lo verá en su siguiente apertura o actualización.

## Contraste fiscal

Para un ejercicio cerrado se comparan tres resultados sobre fixtures sin escrituras concurrentes: el SUM independiente del rango Madrid, el total del historial de ese año y el certificado persistido por el servicio real de HU-03 tras reconciliar. Se repite el contraste después de añadir una confirmación tardía y volver a reconciliar.

La comparación preserva las dependencias existentes de HU-03 y simula su correo en el entorno aislado. No modifica el certificado de desarrollo ni incorpora lógica de certificados al historial. El límite de almacenamiento del certificado y el límite individual no se convierten en restricciones nuevas del total mostrado por HU-02.
