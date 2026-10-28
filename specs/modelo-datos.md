# Modelo de datos común — SI-13 Donaciones y Voluntariado

**Fecha**: 2026-10-28 · **Plan**: [plan-comun.md](plan-comun.md) · **Base**: PostgreSQL

Es la **única** definición de cada entidad para las 8 specs (principio VIII de la constitution).
Quien es dueño de una tabla escribe su migración; los demás la usan y no la duplican. Cualquier
cambio se acuerda con el grupo y se hace con una migración nueva (principio XII).

## Reglas generales

- Tablas en plural y `snake_case`; columnas en `snake_case`; clave primaria `id` (`BIGSERIAL`);
  claves foráneas `<entidad>_id`.
- Todas las tablas tienen `creado_en` y `actualizado_en` (`TIMESTAMPTZ`, por defecto `now()`).
- Importes en `NUMERIC(10,2)`; horas en `NUMERIC(5,2)`. Nunca coma flotante.
- Fechas con hora en `TIMESTAMPTZ`. Los cortes por día, mes, trimestre o año se calculan en la
  zona `Europe/Madrid`.
- **Nada se borra** (principio VI): no hay `DELETE` sobre aportaciones, suscripciones,
  inscripciones ni asistencias. Cambia su `estado` (o `asistio`). Las claves foráneas usan
  `ON DELETE RESTRICT`.
- Los estados se guardan como `TEXT` con `CHECK` (más simple de migrar que un `ENUM`).
- No se guarda ningún dato de tarjeta. De la pasarela solo se guardan sus identificadores.

## Diagrama de relaciones

```text
usuarios 1──0..1 donantes 1──* aportaciones *──0..1 proyectos
                    │                │
                    └──* suscripciones_socio 1──* aportaciones (cuotas)
                    └──* certificados_fiscales

usuarios 1──0..1 voluntarios 1──* inscripciones *──1 actividades *──1 proyectos
                                        │
                                        └──0..1 asistencias
```

## Dueños de cada tabla

| Tabla | Entidad | Dueño | Migración | La usan |
|---|---|---|---|---|
| `usuarios` | Usuario | Común | `001` | Todas |
| `sesiones` | (sesión de inicio) | Común | `002` | Todas |
| `proyectos` | Proyecto | Común | `003` | 001, 004, 005, 007 |
| `donantes` | Donante | spec-001 (Nada) | `004` | 002, 003, 004 |
| `suscripciones_socio` | SuscripcionSocio | spec-001 (Nada) | `004` | 002, 004 |
| `aportaciones` | Aportación | spec-001 (Nada) | `004` | 002, 003, 004 |
| `actividades` | Actividad | spec-007 (Nicole) | `005` | 004, 005, 006, 008 |
| `voluntarios` | Voluntario | spec-005 (Javi) | `006` | 006, 007, 008 |
| `inscripciones` | Inscripción | spec-005 (Javi) | `006` | 006, 007, 008 |
| `asistencias` | Asistencia | spec-008 (Nicole) | `007` | 004 |
| `certificados_fiscales` | CertificadoFiscal | spec-003 (Rubén) | `008` | — |

Los números de migración quedan **reservados** para evitar choques entre ramas. Los cambios
posteriores usan `009` en adelante, pidiendo el número al grupo.

---

## usuarios (común)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `correo` | TEXT | obligatorio, único, en minúsculas |
| `hash_contrasena` | TEXT | obligatorio (bcrypt); nunca la contraseña |
| `nombre` | TEXT | obligatorio |
| `roles` | TEXT[] | no vacío; cada valor en `donante`, `voluntario`, `coordinador`, `administrador` |
| `activo` | BOOLEAN | por defecto `true` |

Una persona puede tener varios roles (por ejemplo, `{donante, voluntario}`). Al registrarse, un
usuario elige `donante` y/o `voluntario`; `coordinador` y `administrador` solo se asignan con
las semillas o a mano.

## sesiones (común)

Tabla de sesiones del inicio de sesión (`sid`, `sess`, `expire`), con el formato que pide el
almacén de sesiones elegido en el plan. No la toca ninguna spec.

## proyectos (común)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `nombre` | TEXT | obligatorio, único |
| `descripcion` | TEXT | puede estar vacío |
| `activo` | BOOLEAN | por defecto `true`; solo los activos se ofrecen como destino o para actividades nuevas |

«Fondo general» **no** es un proyecto: es `proyecto_id = NULL`.

## donantes (spec-001)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `usuario_id` | BIGINT → usuarios | opcional, único (se rellena al enlazar con una cuenta por el correo; PA1.2) |
| `nombre` | TEXT | obligatorio |
| `apellidos` | TEXT | obligatorio |
| `nif_nie` | TEXT | obligatorio, único, en mayúsculas, con letra de control válida |
| `correo` | TEXT | obligatorio, en minúsculas |
| `direccion` | TEXT | obligatorio |

Si se dona con un NIF/NIE que ya existe, se reutiliza el Donante (y se actualizan sus datos).

## suscripciones_socio (spec-001)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `proyecto_id` | BIGINT → proyectos | opcional (NULL = fondo general) |
| `importe` | NUMERIC(10,2) | ≥ 1,00 |
| `periodicidad` | TEXT | `mensual`, `trimestral`, `anual` |
| `estado` | TEXT | `pendiente`, `activa`, `cancelada` |
| `fecha_alta` | TIMESTAMPTZ | se fija al confirmarse el primer cobro |
| `fecha_proximo_cobro` | DATE | la actualiza cada cobro notificado por la pasarela |
| `pasarela_suscripcion_id` | TEXT | único; identificador de la suscripción en la pasarela |

Transiciones: `pendiente → activa` (primer cobro confirmado) · `pendiente → cancelada`
(primer cobro rechazado o cancelado) · `activa → cancelada` (solo si se resuelve PA1.1 a favor).

## aportaciones (spec-001)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `proyecto_id` | BIGINT → proyectos | opcional (NULL = fondo general) |
| `suscripcion_socio_id` | BIGINT → suscripciones_socio | obligatorio si `modalidad = cuota_socio`; NULL si `puntual` |
| `modalidad` | TEXT | `puntual`, `cuota_socio` |
| `importe` | NUMERIC(10,2) | ≥ 1,00 |
| `estado` | TEXT | `pendiente`, `confirmada`, `rechazada`, `cancelada` |
| `fecha_cobro` | TIMESTAMPTZ | obligatoria si `confirmada`; es la fecha que usan historial, certificado e informes |
| `referencia` | TEXT | única, legible para el donante (p. ej. `DON-2026-000123`) |
| `pasarela_pago_id` | TEXT | único; garantiza que una notificación repetida no crea dos aportaciones |
| `motivo` | TEXT | motivo de rechazo o cancelación que se muestra al donante |

Transiciones: `pendiente → confirmada | rechazada | cancelada`. Una vez `confirmada` no cambia en
v1 (correcciones: PA2.1 y PA3.1).

Índice: `(donante_id, estado, fecha_cobro)` para historial y certificados.

## certificados_fiscales (spec-003)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `ejercicio` | INTEGER | año; menor que el año en curso |
| `importe_total` | NUMERIC(10,2) | > 0 |
| `fecha_emision` | DATE | obligatoria |
| `codigo_verificacion` | TEXT | único |

Único: `(donante_id, ejercicio)`. El PDF **no** se guarda: se genera al descargar con estos
datos, así que siempre sale igual. Cómo se tratan las rectificaciones queda pendiente de PA3.1.

## actividades (spec-007)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `proyecto_id` | BIGINT → proyectos | obligatorio |
| `titulo` | TEXT | obligatorio |
| `descripcion` | TEXT | obligatorio |
| `inicio` | TIMESTAMPTZ | obligatorio; posterior a ahora al crear o editar |
| `fin` | TIMESTAMPTZ | obligatorio; `fin > inicio` |
| `lugar` | TEXT | obligatorio |
| `plazas` | INTEGER | > 0 y ≥ número de inscripciones confirmadas |
| `requisitos` | TEXT | puede estar vacío |
| `estado` | TEXT | `borrador`, `publicada`, `cancelada` |
| `creada_por` | BIGINT → usuarios | coordinador que la crea |

Transiciones: `borrador → publicada` · `borrador | publicada → cancelada`. Una actividad
**celebrada** es una `publicada` con `inicio <= now()`: no es un estado guardado.

Valores derivados (no se guardan):
- `plazasLibres = plazas − inscripciones confirmadas`.
- `horas = (fin − inicio)` en horas, redondeado a 2 decimales.

## voluntarios (spec-005)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `usuario_id` | BIGINT → usuarios | obligatorio, único |
| `nombre` | TEXT | obligatorio |
| `apellidos` | TEXT | obligatorio |
| `correo` | TEXT | obligatorio |
| `telefono` | TEXT | obligatorio |

Si PA5.1 decide comprobar la edad, se añadirá `fecha_nacimiento` con una migración nueva.

## inscripciones (spec-005)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `voluntario_id` | BIGINT → voluntarios | obligatorio |
| `actividad_id` | BIGINT → actividades | obligatorio |
| `estado` | TEXT | `confirmada`, `en_espera`, `cancelada` |
| `acepta_requisitos` | BOOLEAN | debe ser `true` |
| `fecha_inscripcion` | TIMESTAMPTZ | orden de llegada a la lista de espera |
| `fecha_confirmacion` | TIMESTAMPTZ | al pasar a `confirmada` |
| `fecha_cancelacion` | TIMESTAMPTZ | al pasar a `cancelada` |

Único parcial: `(voluntario_id, actividad_id) WHERE estado IN ('confirmada','en_espera')`, para
que no haya dos inscripciones activas en la misma actividad (sí puede volver a apuntarse tras
cancelar).

Transiciones: alta como `confirmada` (hay plaza) o `en_espera` (completa) ·
`en_espera → confirmada` (plaza liberada, la primera por `fecha_inscripcion`; spec-007) ·
`confirmada | en_espera → cancelada` (el voluntario antes del inicio, o al cancelar la
actividad).

La **posición** en la lista de espera se calcula (orden de `fecha_inscripcion` entre las
`en_espera` de la actividad); no se guarda, así no hay que renumerar.

## asistencias (spec-008)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `inscripcion_id` | BIGINT → inscripciones | obligatorio, **único**; la inscripción debe estar `confirmada` |
| `asistio` | BOOLEAN | obligatorio |
| `horas` | NUMERIC(5,2) | horas de la actividad al registrar |
| `registrada_por` | BIGINT → usuarios | coordinador |
| `fecha_registro` | TIMESTAMPTZ | última modificación |

Una inscripción tiene como mucho una asistencia; corregir cambia `asistio`, no crea otra fila.
El **total de horas** de un voluntario no se guarda: es `SUM(horas) WHERE asistio = true`. Así
nunca se suman horas dos veces y una corrección resta sola.

## Correspondencia con la API

Las columnas se exponen en `camelCase` (`fecha_cobro → fechaCobro`, `plazas_libres →
plazasLibres`), los importes como texto con 2 decimales (`"20.00"`) y las fechas en ISO 8601 con
desfase (ver [plan-comun.md](plan-comun.md#4-formato-común-de-la-api)).
