# Modelo de datos común — SI-13 Donaciones y Voluntariado

**Fecha**: 2026-10-28 · **Plan**: [plan-comun.md](plan-comun.md) · **Base**: PostgreSQL

Es la **única** definición de cada entidad para las 8 specs (principio VIII de la constitution).
Quien es dueño de una tabla escribe su migración; los demás la usan y no la duplican. Cualquier
cambio se acuerda con el grupo y se hace con una migración nueva (principio XII).

**Estado de HU-01**: HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva.

## Reglas generales

- Tablas en plural y `snake_case`; columnas en `snake_case`; clave primaria `id` (`BIGSERIAL`);
  claves foráneas `<entidad>_id`.
- Todas las tablas tienen `creado_en` y `actualizado_en` (`TIMESTAMPTZ`, por defecto `now()`).
- Importes en `NUMERIC(10,2)` (los totales acumulados, más anchos: `certificados_fiscales.importe_total` es `NUMERIC(15,2)`); horas en `NUMERIC(5,2)`. Nunca coma flotante.
- Fechas con hora en `TIMESTAMPTZ`. Los cortes por día, mes, trimestre o año se calculan en la
  zona `Europe/Madrid`.
- **Nada se borra** (principio VI): no hay `DELETE` sobre aportaciones, suscripciones,
  inscripciones ni asistencias. Cambia su `estado` (o `asistio`). Las claves foráneas usan
  `ON DELETE RESTRICT`.
- Los estados se guardan como `TEXT` con `CHECK` (más simple de migrar que un `ENUM`).
- No se guarda ningún dato de tarjeta. En HU-01 se conservan los identificadores de pasarela,
  instantes de cobro y previsión, tipo y resultado de procesamiento y URL protegida de Checkout.
  No se guardan cuerpos completos de eventos ni secretos. Los tokens de vínculo solo se
  conservan como hash en el servidor.

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
| `operaciones_pago`, `eventos_pasarela`, `verificaciones_donante`, `correos_aportacion` | Soporte técnico de HU-01 | spec-001 (Nada) | Ampliación posterior a `004`; número aún no asignado | 001 |
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
| `usuario_id` | BIGINT → usuarios | opcional, único; vínculo con cuenta de correo coincidente tras verificar el acceso al buzón mediante enlace en donaciones (PA1.2 y PA1.3) |
| `nombre` | TEXT | obligatorio |
| `apellidos` | TEXT | obligatorio |
| `nif_nie` | TEXT | obligatorio, único, en mayúsculas, con letra de control válida |
| `correo` | TEXT | obligatorio, en minúsculas |
| `direccion` | TEXT | obligatorio |

En HU-01 v1 se reutiliza al Donante solo si coinciden NIF/NIE, correo, nombre, apellidos y
dirección, distinguiendo diferencias meramente de formato de cambios reales; no se
sobrescriben sus datos. Si un correo existente se presenta con otro NIF/NIE, o el mismo
NIF/NIE con cambios reales en esos datos, se detiene la operación antes del pago y se pide
revisarlos, sin mostrar los guardados, modificar al Donante, mezclar aportaciones ni crear
otro Donante (PA1.5 y PA1.6). Las correcciones quedan fuera de v1, incluso con cuenta vinculada.
La normalización y comparación de formato se definen en [research de HU-01](spec-001/research.md). Esta restricción funcional no añade una
unicidad SQL al correo. La prueba de vinculación se limita a donaciones; no cambia el
registro ni el inicio de sesión generales. La prueba se conserva en verificaciones_donante,
definida en este modelo; no se añade una verificación global a Usuario.

## suscripciones_socio (spec-001)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `proyecto_id` | BIGINT → proyectos | opcional (NULL = fondo general) |
| `importe` | NUMERIC(10,2) | entre 1,00 y 999.999,99, ambos incluidos; EUR |
| `periodicidad` | TEXT | `mensual`, `trimestral`, `anual` |
| `estado` | TEXT | `pendiente`, `activa`, `cancelada` |
| `fecha_alta` | TIMESTAMPTZ | NULL hasta el primer cobro confirmado; después conserva ese instante |
| `fecha_proximo_cobro` | DATE | nullable; proyección de Madrid del instante de previsión; NULL sin fecha futura comunicada |
| `pasarela_proximo_cobro_en` | TIMESTAMPTZ | nullable; último instante comunicado por la pasarela, usable solo mientras sea futuro |
| `pasarela_suscripcion_id` | TEXT | nullable hasta conocerlo, único; identificador Subscription de pasarela |

Transiciones: `pendiente → activa` (primer cobro confirmado, sin cierre definitivo actual) ·
`pendiente → cancelada` y `activa → cancelada` (cierre definitivo acreditado por la pasarela).
Un primer rechazo recuperable conserva pendiente y no activa el alta. Cancelada es terminal:
un cobro tardío se registra, pero no la reactiva. Modificar la cuota o darse de baja desde la aplicación queda fuera de v1
(PA1.1); eso no impide procesar una cancelación notificada por la pasarela (PA1.8).

El fallo de una cuota posterior al alta se registra e informa, pero no cancela por sí solo
la suscripción ni inicia cobros adicionales por la aplicación. La fecha del próximo cobro
no se inventa ni se toma de una fecha ya pasada; se aplica la regla anterior de PA1.8.

Ambos campos de previsión se actualizan juntos al reconciliar. Si no se comunica un
instante futuro, quedan NULL. La última previsión puede vencer entre eventos. Al consultar se compara de nuevo el instante con ahora(); si ya venció, se devuelve fecha null
y se muestra «Pendiente de confirmación», aunque no haya llegado otro webhook. DATE se
serializa como texto aaaa-mm-dd, sin conversión de medianoche a otra zona. La fuente externa
y el tratamiento del fallo se definen en el [contrato Stripe de HU-01](spec-001/contracts/pasarela-stripe.md#próxima-fecha-y-cancelación).
El cierre definitivo deja ambas previsiones NULL; una cancelación programada impide mostrar
como próximo un cobro en o después de su fecha efectiva.

## aportaciones (spec-001)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `proyecto_id` | BIGINT → proyectos | opcional (NULL = fondo general) |
| `suscripcion_socio_id` | BIGINT → suscripciones_socio | obligatorio si `modalidad = cuota_socio`; NULL si `puntual` |
| `modalidad` | TEXT | `puntual`, `cuota_socio` |
| `importe` | NUMERIC(10,2) | entre 1,00 y 999.999,99, ambos incluidos; EUR |
| `estado` | TEXT | `pendiente`, `confirmada`, `rechazada`, `cancelada` |
| `fecha_cobro` | TIMESTAMPTZ | obligatoria si `confirmada`; es la fecha que usan historial, certificado e informes |
| `referencia` | TEXT | única, legible para el donante (p. ej. `DON-2026-000123`); por sí sola no autoriza el acceso |
| `pasarela_pago_id` | TEXT | nullable hasta conocerlo, único; identificador PaymentIntent, nunca Session |
| `pasarela_factura_id` | TEXT | nullable, único; identificador Invoice para cuotas; NULL para puntuales |
| `motivo` | TEXT | motivo de rechazo o cancelación que se muestra al donante |

Transiciones: `pendiente → confirmada`, `pendiente → rechazada`, `pendiente → cancelada`,
`rechazada → cancelada`, `rechazada → confirmada` y `cancelada → confirmada`.
Las dos transiciones a confirmada desde un cierre local requieren prueba canónica del
cobro del mismo pago/factura. Rechazada → cancelada exige cierre definitivo de pasarela.
Se conserva fila, referencia, importe, Donante y destino. Una vez confirmada no cambia en v1
(correcciones: PA2.1 y PA3.1); un evento antiguo nunca la degrada.

Cada cobro puntual corresponde a un PaymentIntent. Cada cuota corresponde a una Invoice,
con PaymentIntent cuando existe. La primera factura reutiliza la aportación del alta; las
posteriores crean o reutilizan una fila por factura. Una cuota fallida se registra rechazada,
no suma y no altera aportaciones anteriores; si acaba pagada, se confirma esa misma fila.
Solo `confirmada` entra en las sumas de historial, certificado e informes.

Para puntual, fecha_cobro procede de event.created del evento firmado de éxito, validado
contra el PaymentIntent actual; para cuota, de Invoice.status_transitions.paid_at. No se usa
el comienzo del intento ni la recepción HTTP. Esa fuente se conserva tras confirmar.
La [reconciliación de HU-01](spec-001/contracts/pasarela-stripe.md) detalla la pertenencia,
moneda, importes y tratamiento de notificaciones repetidas o desordenadas.

Reintentar un correo no crea ni modifica aportaciones, suscripciones o cobros; su estado
se conserva en correos_aportacion. Índice financiero: `(donante_id, estado, fecha_cobro)`.

## Soporte técnico de donaciones (spec-001)

Las cuatro tablas siguientes pertenecen a donaciones (HU-01). No duplican entidades de otros módulos.
Todas incluyen `id BIGSERIAL PRIMARY KEY`, `creado_en` y `actualizado_en` TIMESTAMPTZ
no nulos, con valor inicial `now()`. Los campos son NOT NULL salvo indicación contraria.
Los estados son TEXT con CHECK. No se guarda el cuerpo completo de Stripe, datos de tarjeta,
contraseñas ni tokens de verificación en claro.

### operaciones_pago (spec-001)

Una fila por solicitud de pago iniciada desde la aplicación; no se crea para cada cuota automática.

| Columna | Tipo y restricción |
|---|---|
| `solicitud_id` | UUID, UNIQUE; clave aportada por el formulario para repetir una misma solicitud. |
| `aportacion_id` | BIGINT, FK a aportaciones, UNIQUE. |
| `huella_solicitud` | TEXT; SHA-256 inmutable de la entrada económica/fiscal normalizada, sin CSRF ni otros datos transitorios. |
| `solicitud_checkout` | JSONB, NOT NULL; instantánea inmutable de los parámetros efectivos de Checkout preparados en servidor, incluidas las URL de retorno. |
| `sesion_checkout_id` | TEXT nullable, UNIQUE. |
| `url_checkout` | TEXT nullable; URL devuelta por Stripe, solo accesible con autorización de operación. |
| `estado` | TEXT: `preparada`, `checkout_creado`, `incierta`, `cerrada`. |

La operación, su aportación, huella e instantánea se crean atómicamente. La clave externa
es hu01:<solicitud_id canónico>, en minúsculas y con guiones. Esa misma representación
se usa al derivar la exclusión, independientemente del formato recibido. Referencia,
entrada normalizada, instantánea y creado_en no se
actualizan al repetir. El UUID no autoriza: se exige permiso de operación o cuenta propia
vinculada, además de CSRF/origen. No se renueva el permiso invitado de ocho horas.

La instantánea conserva el cuerpo exacto que preparó la envoltura: modo, línea de precio,
tarjeta/EUR, correo, referencia/metadatos y URL. No contiene NIF/NIE, dirección, contraseña,
sesión, token CSRF, clave secreta o datos de tarjeta. La huella detecta un cambio de entrada,
pero no reconstruye URL o descripciones después de un reinicio; por ello se justifica este
único campo JSONB adicional, sin nueva tabla ni datos de lease/propietario de bloqueo.
Se incorpora a la ampliación operativa posterior a 004; no cambia la entrega temprana.

**Creación activa** significa que existe una conexión PostgreSQL que posee el bloqueo
consultivo de sesión de esa solicitud. El texto incierta no acredita que siga activa.
La preparación usa exclusión transaccional corta; después de guardar la sesión de navegador,
la llamada externa usa pg_try_advisory_lock con la misma clave derivada del UUID. Conserva
la conexión hasta persistir el resultado y liberar explícitamente el bloqueo; no mantiene
una transacción SQL abierta durante HTTP. Error y caída no autorizan otra clave o cuerpo.
El [protocolo de creación](spec-001/contracts/pasarela-stripe.md#exclusión-y-reanudación-de-la-creación)
fija adquisición, liberación, reanudación y destrucción de conexiones no recuperables.

La ventana local para iniciar o repetir una creación es de **23 horas desde creado_en**,
inmutable y anterior al primer envío. El reloj es el real de PostgreSQL, no AHORA_SIMULADO.
Se deja una hora de margen respecto de las 24 horas mínimas de conservación de claves
descritas por Stripe. No se renueva con actualizado_en, errores, reintentos o reinicios.
Al vencer, sin ID externo conocido, se exige revisión y se prohíben nuevas creaciones para
recuperar esa operación. No se inventa un rechazo/cancelación financiera; incierta se
conserva como evidencia de resultado no acreditado. Revision requerida es una condición
derivada, no otro estado financiero ni una renovación indefinida de la ventana.

Transiciones: preparada pasa a incierta, con commit, justo antes del envío bajo exclusión;
incierta pasa a checkout_creado al guardar una respuesta identificada. Un cierre acreditado
pasa a cerrada. Una respuesta tardía puede completar identificadores, pero no reabrir cerrada
ni degradar una aportación confirmada. Si ya se conoce Session, se consulta/reutiliza esa
Session, sin crear otra, incluso después de la ventana de creación.

### eventos_pasarela (spec-001)

Registro de procesamiento, no cola de trabajo ni copia del evento.

| Columna | Tipo y restricción |
|---|---|
| `pasarela_evento_id` | TEXT, UNIQUE. |
| `tipo` | TEXT; tipo oficial del evento recibido. |
| `objeto_id` | TEXT; identificador del recurso externo. |
| `ocurrido_en` | TIMESTAMPTZ; instante event.created comunicado por Stripe, no fecha de recepción. |
| `estado` | TEXT: `procesado`, `ignorado`, `incidencia`. |
| `error_codigo` | TEXT nullable; código interno sin datos personales. |

El registro definitivo se confirma en la misma transacción que los cambios financieros.
Un error transitorio hace rollback, no deja el evento falsamente procesado y permite reentrega.
La unicidad de este registro no sustituye las claves únicas de pago y factura.

### verificaciones_donante (spec-001)

| Columna | Tipo y restricción |
|---|---|
| `usuario_id` | BIGINT, FK a usuarios; cuenta que solicitó el enlace. |
| `donante_id` | BIGINT, FK a donantes; identidad a vincular. |
| `token_hash` | TEXT, UNIQUE; SHA-256 de 32 bytes aleatorios codificados en base64url. |
| `expira_en` | TIMESTAMPTZ; treinta minutos desde emisión. |
| `usado_en` | TIMESTAMPTZ nullable; marca de consumo. |

El consumo bloquea la verificación, la cuenta y el Donante; comprueba caducidad, correo
normalizado coincidente, rol donante y ausencia de un vínculo incompatible. Marca el uso y
asigna `donantes.usuario_id` en una única transacción. Los enlaces anteriores pendientes se
invalidan al emitir otro para la misma pareja, marcándolos vencidos, sin borrar evidencias.
La unicidad de `donantes.usuario_id` evita vincular dos identidades fiscales a una cuenta.

### correos_aportacion (spec-001)

Estado recuperable de las notificaciones de confirmación y de fallo de cuota posterior.

| Columna | Tipo y restricción |
|---|---|
| `aportacion_id` | BIGINT, FK a aportaciones. |
| `tipo` | TEXT: `confirmacion`, `fallo_cuota`; UNIQUE junto con aportacion_id. |
| `resumen` | JSONB; proyección inmutable del mensaje correspondiente. |
| `estado` | TEXT: `pendiente`, `enviando`, `enviado`, `fallido`. |
| `intentos` | INTEGER, por defecto 0, CHECK >= 0. |
| `reservado_hasta` | TIMESTAMPTZ nullable; reserva de envío de treinta segundos. |
| `enviado_en` | TIMESTAMPTZ nullable; éxito de la llamada SMTP, no prueba de lectura o entrega final. |

El resumen de confirmación contiene referencia, importe como texto, instante de cobro,
modalidad, nombre del destino y, si procede, periodicidad y próxima fecha conocida al
confirmar. No contiene NIF/NIE ni tarjeta. Es el mismo resumen que se muestra en pantalla
y se reenvía. La fecha futura actual se presenta por separado y puede cambiar después.

El aviso de fallo contiene referencia de cuota, importe, motivo genérico seguro y próxima
fecha conocida o su ausencia. Se emite al primer fallo de una cuota posterior. Repeticiones
no generan otro aviso lógico; si después se cobra esa factura, se conserva ese aviso y se
crea la confirmación como otro tipo de mensaje. No se sobrescribe un resumen ya emitido.
Así PA1.8 informa también a quien no conserva sesión: recibe correo, sin concederle acceso
a la cuota por la referencia. El reintento manual de FR-012 corresponde a confirmaciones.

Transiciones: pendiente o fallido pasan a enviando al reclamar el envío e incrementar
intentos; enviando pasa a enviado o fallido solo por el intento que conserva la reserva.
Una reserva vencida permite reclamar otro intento; enviado es terminal para ese mensaje.
Solo se reclama un envío bajo bloqueo de fila; SMTP se ejecuta fuera de la transacción.
Mientras el envío sigue vivo se renueva la reserva cada diez segundos. Toda renovación y
el guardado del resultado exigen el mismo valor de intentos reclamado al iniciar el envío;
un proceso antiguo no puede sobrescribir un intento posterior. Una reserva vencida puede
recuperarse. La ventana de caída entre aceptación SMTP y guardado
del resultado permite duplicar un mensaje físico, nunca una aportación o un cargo.


## certificados_fiscales (spec-003)

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `donante_id` | BIGINT → donantes | obligatorio |
| `ejercicio` | INTEGER | año; menor que el año en curso |
| `importe_total` | NUMERIC(15,2) | > 0; suma de un año, por eso más ancho que un importe suelto |
| `fecha_emision` | DATE | obligatoria |
| `codigo_verificacion` | TEXT | único |

Único: `(donante_id, ejercicio)`. El PDF **no** se guarda: se genera al descargar con estos
datos, así que siempre sale igual. Si después de emitirlo se confirma tarde una aportación de ese
ejercicio, se regenera la misma fila con el nuevo total, nueva `fecha_emision` y un
`codigo_verificacion` nuevo; el anterior deja de ser válido (PA3.1, spec-003). Migración
`008_certificados.sql`.

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
