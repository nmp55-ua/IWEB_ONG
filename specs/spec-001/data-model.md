# Uso del modelo común en HU-01

**Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva.

**Responsable**: Nada · **Revisor**: Rubén · **Fecha**: 2026-11-06  
**Estado**: Modelo implementado y validado localmente en `spec-001`; revisión de Rubén
e incorporación a main pendientes.

## Definición única

[modelo-datos.md](../modelo-datos.md) es la única definición de columnas, tipos,
nulabilidad, unicidad, estados y transiciones. P-01 incorpora allí las decisiones de esta
rama. Este documento describe su uso por HU-01; no mantiene otro esquema alternativo.
Las migraciones 004 y 009 existen en esta rama y su aplicación en los entornos de pruebas
consta en [validacion-004-01.md](refinamiento/validacion-004-01.md) y
[validacion-local-01.md](refinamiento/validacion-local-01.md). Esta evidencia local no
acredita publicación, aprobación ni incorporación compartida.

| Elemento del modelo común | Uso en HU-01 |
|---|---|
| Donante | Reutilización sin sobrescribir; conflicto de NIF/NIE, correo o datos fiscales detiene antes de Checkout. |
| Aportación | Un cobro puntual por PaymentIntent y una cuota por Invoice. La primera cuota reutiliza la fila del alta. |
| SuscripcionSocio | Activación tras primera cuota pagada, previsión comunicada por pasarela y cierre definitivo sin alterar cobros anteriores. |
| operaciones_pago | Solicitud estable e instantánea Checkout inmutable ante doble envío o reinicio. La exclusión está ligada a conexión; creado_en fija una ventana de 23 horas. No se crea por cada cuota automática. |
| eventos_pasarela | Evidencia transaccional de procesamiento, independiente de la deduplicación financiera. |
| verificaciones_donante | Enlace ligado a cuenta y Donante, con consumo único; no cambia Usuario ni el registro general. |
| correos_aportacion | Resumen inmutable y estado separado para confirmación y aviso de fallo de cuota posterior. |

Usuario y Proyecto se consumen de la base existente. Fondo general sigue siendo destino
NULL. No se crea una identidad paralela ni una tabla propia de sesiones.

## Invariantes del servicio

- Importe EUR entre 1,00 € y 999.999,99 €, incluidos ambos extremos, con máximo dos decimales.
  El servicio trabaja en céntimos enteros y PostgreSQL conserva NUMERIC; los totales de
  otras historias no quedan limitados al máximo de una aportación.
- La normalización descrita en [research.md](research.md) solo compara formatos equivalentes.
  No autoriza correcciones o cambios reales, tampoco con cuenta vinculada.
- Un pago rechazado que después se cobra conserva fila y referencia. La transición canónica
  está en el modelo común; no se crea otra aportación para eludir una clave única.
- Confirmada es inmutable en v1. Solo ese estado suma a historial, certificado e informes.
  Las políticas de rectificación de esos módulos no se modifican.
- La fecha de cobro procede del éxito comunicado por pasarela, no del comienzo del intento
  ni de la recepción HTTP. La previsión conserva instante y su fecha de Madrid; al vencer,
  la respuesta ya no la presenta como futura aunque aún no haya otro webhook.
- El permiso invitado se guarda en la sesión común por operación; no es un vínculo a Usuario
  ni autoriza las cuotas futuras. El vínculo exige la prueba persistida en el modelo común.
- El envío de correo queda fuera de la transacción financiera. La reserva y su número de
  intento impiden que una ejecución antigua sobrescriba el resultado de otra posterior.

## Concurrencia

La creación de Donante toma bloqueos transaccionales por NIF/NIE y correo normalizados en
orden estable y comprueba todas las coincidencias antes de insertar. No se añade UNIQUE al
correo. Identidades ya ambiguas se rechazan sin fusionarlas.

La preparación se serializa por UUID con bloqueo transaccional corto. La creación externa
usa después bloqueo consultivo de sesión con conexión propia, tras guardar el permiso, y
sin transacción durante HTTP. La instantánea nueva está justificada solo para conservar
el cuerpo tras reinicio/cambio de configuración; no se añade tabla de locks o lease de
creación. El reloj real y creado_en fijan un límite de 23 horas que no renueva ningún
reintento. Los detalles canónicos están en el protocolo Stripe.

Puntuales se reconcilian por `pi:<id>`
y suscripciones por `sub:<id>`. Dentro del bloqueo se consulta de nuevo el recurso externo
actual. Las claves únicas de pago, factura y evento mantienen funciones diferentes; una
violación de unicidad exige releer y verificar pertenencia, no ignorar el error.
El algoritmo y las permutaciones están en [pasarela-stripe.md](contracts/pasarela-stripe.md).

## Incorporación de datos

`004_donaciones.sql` contiene las tres entidades de dominio, sus restricciones e índice
financiero y está validada como entrega independiente. El paquete preparado permite a
Rubén revisar el consumo de aportaciones sin depender de la interfaz o persistencia técnica.

Las cuatro tablas de soporte están implementadas y validadas en
`009_operativa_donaciones.sql`, dependiente de 004 y su base común, sin requerir 006–008.
HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. No se renombran migraciones ya aplicadas. El detalle de integración se conserva en [cambios-comunes.md](contracts/cambios-comunes.md).
