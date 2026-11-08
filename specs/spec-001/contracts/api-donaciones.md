# Contrato HTTP de HU-01

**Responsable**: Nada · **Revisor**: Rubén · **Fecha**: 2026-11-06  
**Estado**: Rutas implementadas en spec-001 y evidencias identificadas en la
[matriz de validación](../refinamiento/matriz-validacion-01.md). Preparado para revisión
de Rubén; no acredita incorporación compartida ni convergencia.

## Convenciones y autorización

Se conservan las [convenciones comunes](../../../CONVENCIONES.md): prefijo `/api`, JSON
en camelCase, importes como texto con dos decimales y errores `ErrorApi`. Los identificadores
BIGINT se serializan como texto. Fechas con hora usan ISO 8601 y desfase mediante el servicio
común; próximas fechas DATE se serializan `aaaa-mm-dd` y se muestran dd/mm/aaaa.

Los GET de contexto y resultado usan `Cache-Control: no-store`. Los POST del navegador
exigen origen igual a `FRONTEND_URL` y `tokenCsrf` aleatorio ligado a la sesión; su falta o
discordancia devuelve 403 `SOLICITUD_NO_AUTORIZADA`. Se incluye en JSON para reutilizar
`frontend/src/lib/api.js` sin cambiar su interfaz. El webhook solo usa firma de Stripe.

Una consulta o reintento se autoriza por una de estas pruebas, comprobada en el servidor:

1. Sesión vigente con permiso de la referencia concreta, creado al iniciar esa operación,
   con caducidad absoluta de ocho horas, además de la vigencia de la sesión común.
2. Cuenta identificada con rol donante y vínculo verificado `donantes.usuario_id` igual al
   usuario actual. Se utiliza el middleware común de roles para esta vía.

Una referencia, UUID de solicitud, correo coincidente, cookie sin permiso o rol por sí solo
no autorizan. No se aplica `requiereRol()` a la vía de invitado, pues exige cuenta. Una
operación ajena o inexistente devuelve el mismo 404 `APORTACION_NO_DISPONIBLE`, sin datos.
La sesión inicial no autoriza cuotas futuras. No se ofrece recuperación de acceso invitado.

## Rutas

| Método y ruta                                          | Función                                                              | Autorización                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| GET `/api/donaciones/contexto`                         | Preparar sesión y CSRF; devolver estado de identificación.           | Pública, sin datos de aportaciones.                  |
| POST `/api/aportaciones`                               | Preparar una operación y Checkout.                                   | Sesión de navegador y CSRF; cuenta opcional.         |
| GET `/api/aportaciones/referencia/:referencia`         | Consultar el resultado de una aportación concreta.                   | Permiso de operación o cuenta vinculada.             |
| POST `/api/aportaciones/referencia/:referencia/correo` | Reintentar solo la confirmación por correo.                          | Misma autorización, más CSRF.                        |
| POST `/api/donantes/vinculaciones`                     | Solicitar enlace al correo de la cuenta para el Donante coincidente. | `requiereRol('donante')` y CSRF.                     |
| POST `/api/donantes/vinculaciones/confirmar`           | Consumir el enlace y establecer el vínculo.                          | Misma cuenta solicitante, rol donante y CSRF.        |
| POST `/api/pasarela/webhook`                           | Reconciliar notificaciones firmadas.                                 | Firma y cuerpo crudo; sin dependencia del navegador. |

El listado de proyectos reutiliza GET `/api/proyectos`, ya existente. No se crea historial,
edición de perfil, modificación de cuota, baja ni endpoint que ordene cobros adicionales.

## Preparación de Checkout

GET contexto devuelve `{ "tokenCsrf": "valor-aleatorio", "usuario": null }` si no hay cuenta.
Con cuenta devuelve solo `{ id, nombre, roles }` en usuario; no incluye datos de otro Donante.
La sesión debe guardarse antes de devolver el contexto y antes de redirigir a Checkout.

POST `/api/aportaciones` recibe:

```json
{
  "tokenCsrf": "valor-de-la-sesion",
  "claveSolicitud": "0d9cdd1a-b77e-42aa-a260-e286bb8f79c5",
  "modalidad": "puntual",
  "importe": "20.00",
  "proyectoId": null,
  "donante": {
    "nombre": "Ana",
    "apellidos": "Pérez López",
    "nifNie": "12345678Z",
    "correo": "ana@example.test",
    "direccion": "Calle Mayor 1, Madrid"
  }
}
```

Para `modalidad: "socio"` se añade `periodicidad`: mensual, trimestral o anual. No se acepta
periodicidad para puntual. Importe de entrada admite coma o punto, sin miles, máximo dos
decimales e importe entre 1,00 € y 999.999,99 €, ambos incluidos. Es el límite propio de v1;
fuera de ese rango devuelve 400 DATOS_INVALIDOS junto al campo importe y no crea Checkout.
El pago es exclusivamente tarjeta en Stripe Checkout y EUR; no se acepta otra moneda. Destino
null significa fondo general. Se validan campos obligatorios no vacíos y letra del NIF/NIE.
Se rechazan campos desconocidos; no se aceptan identificadores de Usuario/Donante, estados,
fechas de cobro, precios de Stripe o datos de tarjeta proporcionados por el navegador.
Normalización y conflictos siguen [research.md](../research.md). Se convierten a céntimos
enteros y se exige 100 <= centimos <= 99999999; nunca se redondea una entrada con tres decimales.

Una creación devuelve 201 con { referencia, urlPago, estado: "pendiente" }. La interfaz
conserva claveSolicitud en sessionStorage por operación, sin datos fiscales. Para una
operación existente se admite también el DTO corto { tokenCsrf, claveSolicitud }: solo
reanuda la solicitud ya guardada y requiere su permiso o cuenta propia vinculada. No es
un alta sin datos ni un acceso por UUID: si no existe o no está autorizada, devuelve
404 APORTACION_NO_DISPONIBLE. Si se reenvía el cuerpo completo, debe conservar su huella;
cambiar modalidad, importe, destino o identidad produce conflicto, no otra creación.
El cliente no puede aportar solicitudCheckout o parámetros de pasarela.
Repetir clave, cuerpo normalizado y autorización devuelve 200 con la misma operación y
Checkout, sin ampliar el permiso ni duplicar Donante, aportación o suscripción. Un doble
envío concurrente se serializa por clave. Reutilizar clave con otro cuerpo devuelve 409
`SOLICITUD_INCOMPATIBLE`; una clave existente sin permiso no permite recuperar su respuesta.
Si la operación ya está cerrada, el reenvío devuelve su estado financiero actual y urlPago
null; no vuelve a presentar pendiente un cobro confirmado ni crea otro Checkout.

Errores específicos:

| HTTP y código                     | Resultado                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 400 `DATOS_INVALIDOS`             | Errores junto a los campos; no se ha llamado a Stripe.                                                                                   |
| 409 `DATOS_DONANTE_INCOMPATIBLES` | «Revisa los datos introducidos para continuar». Sin mostrar datos guardados ni distinguir qué identidad existe.                          |
| 409 `PROYECTO_NO_DISPONIBLE`      | El proyecto dejó de estar activo; elegir otro destino o fondo general expresamente.                                                      |
| 409 `OPERACION_EN_CURSO`          | Una conexión posee la exclusión de la misma solicitud; no se ha enviado otra creación. Reintentar conserva UUID y cuerpo.                |
| 409 `OPERACION_REQUIERE_REVISION` | No hay ID externo conocido y venció creado_en + 23 horas. No se permite otra creación para recuperar la operación ni un cambio de clave. |
| 503 `PAGO_NO_DISPONIBLE`          | Fallo o resultado incierto de pasarela. Se conserva referencia y solicitud si ya existen; no se crea otro pago automáticamente.          |

No hay rollback de una operación ya cobrada por un error de respuesta HTTP. El resultado
incierto se consulta por referencia con permiso; si la primera respuesta no dio referencia,
se reanuda por claveSolicitud y autorización, nunca como portador de una clave suficiente.
El criterio de actividad y el plazo no renovable están en el
[protocolo de creación](pasarela-stripe.md#exclusión-y-reanudación-de-la-creación).
Un reinicio sin ID permite repetir la instantánea solo bajo exclusión, permiso vigente y
antes de creado_en + 23 horas. actualizado_en no renueva ese plazo. Al vencer, la interfaz
muestra «La preparación del pago requiere revisión», sin simular rechazo del cobro ni
ofrecer reiniciar con otro UUID para resolver la incertidumbre.
Si ya hay Session, se consulta/reutiliza esa Session: no se hace otro POST de creación.
No se revalida como alta nueva un destino aceptado anteriormente ni se cambian sus datos.
Si Checkout sigue abierto, «Reintentar» recupera su misma URL. Un rechazo de tarjeta no
exige otra aportación; una sesión invitada perdida sigue sin recuperación en v1.

## Resultado autorizado

La respuesta 200 contiene:

| Campo                                          | Contenido                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `referencia`, `estado`, `modalidad`, `importe` | Identidad pública, estado local y modalidad de dominio; importe normalizado.                                                                                                                                                                                     |
| `fechaCobro`                                   | Instante ISO o null si no confirmada.                                                                                                                                                                                                                            |
| `destino`                                      | Nombre del proyecto o «fondo general».                                                                                                                                                                                                                           |
| `motivo`                                       | Motivo genérico de rechazo/cancelación o null, sin detalles internos.                                                                                                                                                                                            |
| `resumenConfirmacion`                          | Proyección inmutable del resumen enviado o null; no contiene NIF ni tarjeta.                                                                                                                                                                                     |
| `correo`                                       | `{ estado, puedeReintentar }`; estado `noPrevisto` antes de confirmarse o pendiente/enviando/enviado/fallido después.                                                                                                                                            |
| `suscripcion`                                  | Null para puntual; para socio, `{ estado, periodicidad, fechaProximoCobro }`.                                                                                                                                                                                    |
| `urlPago`                                      | URL del mismo Checkout solo si la operación propia sigue abierta; en otro caso null.                                                                                                                                                                             |
| `preparacion`                                  | Null para una cuota automática sin operación de navegador; en otro caso { claveSolicitud, reanudarHasta, requiereRevision }. Fecha ISO derivada de creado_en + 23 horas; requiereRevision solo si no hay Session conocida y venció el plazo. No amplía permisos. |

Fecha futura desconocida o ya pasada se devuelve null y se muestra «Pendiente de
confirmación»; nunca se presenta una fecha pasada como próxima. Las fechas del resumen
histórico no se reescriben cuando cambia la previsión actual. Para cuota posterior fallida
se muestra rechazo y aviso de fallo; no se presenta como pagada ni se modifica el total.

La ruta no interpreta `cancelado=1` como prueba de cancelación y no muta el pago. La página
puede consultar periódicamente mientras el permiso siga vigente. Sin confirmación válida
se muestra pendiente, sin afirmar éxito. El webhook no requiere esta consulta ni la sesión.

## Reintento exclusivo de correo

POST correo recibe solo `{ tokenCsrf }`. Exige aportación confirmada y su notificación de
confirmación. Responde 200 `{ "estadoCorreo": "enviado" }` si consta éxito, o 200
`{ "estadoCorreo": "fallido" }` cuando falla el intento; la interfaz muestra el resultado
real y mantiene el pago confirmado. No se representa fallo de correo como fallo de pago.
Si ya está enviado, devuelve el estado sin enviar otro mensaje. Si hay envío reservado
devuelve 409 `CORREO_EN_ENVIO`; si la aportación no está confirmada, 409 `COBRO_NO_CONFIRMADO`.
Si una reclamación pierde la carrera con otro intento que ya terminó satisfactoriamente,
se relee y devuelve enviado; no se confunde el estado terminal con una reserva viva.
No se llama a Stripe ni se insertan aportaciones o suscripciones en este flujo.

## Verificación y vínculo

### Entrada y página sin token

El formulario /donar y su resultado /donar/resultado muestran siempre un enlace visible
«Vincular mis aportaciones a una cuenta» a /donar/vincular. No depende del historial,
de que el navegador conserve otra operación o de que se revele si existe un Donante.
Seguir ese enlace no vincula, no envía correos y no cancela pagos.

Sin token, la página explica que solo se vincula una cuenta del mismo correo acreditado.
Si no hay cuenta identificada reutiliza FormEntrar con volverA=/donar/vincular; el enlace
a /registro sigue siendo el existente, sin cambiar su flujo. Una cuenta con rol donante
obtiene contexto/CSRF y dispone de «Enviar enlace de verificación». Una cuenta sin rol
usa el error común de permisos; no se le cambia el rol desde esta página.

Solo pulsar ese botón llama a POST /api/donantes/vinculaciones con tokenCsrf; no acepta
correo objetivo, usuarioId o donanteId. Ante 202 se muestra exactamente:
«Si hay aportaciones que puedan vincularse al correo de tu cuenta, recibirás un enlace
de verificación». El texto es igual con o sin Donante elegible, también si falla el envío individual, y
no acredita envío, titularidad o vínculo. El fallo SMTP se registra sin cambiar ese 202.
Un error de infraestructura común presenta un aviso genérico y la opción de volver a
solicitar, sin exponer datos ni afectar cobros.

### Solicitud → correo → confirmación

La solicitud recibe solo `{ tokenCsrf }`. Busca el Donante por el correo normalizado de la
cuenta actual; no acepta un correo, usuarioId o donanteId arbitrario. Devuelve 202 y el mismo
mensaje genérico tanto si existe Donante elegible como si no, también si el intento SMTP
falla. CORREO_NO_DISPONIBLE solo puede describir una indisponibilidad común determinada
antes de evaluar elegibilidad, nunca revelar el resultado individual de la búsqueda.
La respuesta no acredita envío ni verificación. Se conserva solo el hash del token, con caducidad de treinta minutos.

El correo contiene `/donar/vincular#token=...`. La página retira el fragmento, exige entrar
con la cuenta solicitante si es necesario y solo consume el enlace mediante una acción de
confirmación POST, con `{ tokenCsrf, token }`. Un lector automático de enlaces no vincula.
Para conservarlo durante el acceso a la cuenta, el token se mantiene temporalmente en
sessionStorage de esa pestaña. Se reutiliza `FormEntrar` con su propiedad existente
`volverA="/donar/vincular"`, sin cambiar autenticación. Se elimina el token local al terminar
o comprobar su caducidad; no se añade a parámetros, cookies, logs o persistencia de servidor
en claro. Una recarga de la página no confirma por sí sola el vínculo.
Llegar con token no solicita otro enlace automáticamente: se conserva el token y se ofrece
«Confirmar vinculación» a la cuenta solicitante. Tras error por caducidad/uso, «Solicitar
otro enlace» limpia el token local y vuelve al estado sin token; tampoco envía por GET.
El recorrido completo es entrada visible → login existente si procede → solicitud
explícita → aviso genérico → correo → apertura del enlace → confirmación POST.
La confirmación devuelve 200 { "vinculado": true }. Token inválido, vencido, consumido o
de otra cuenta produce 400 `ENLACE_NO_VALIDO`; vínculo incompatible, 409
`VINCULACION_NO_DISPONIBLE`. No hay vínculo parcial: consumo y asignación son atómicos.
Sin cuenta se devuelve 401 y sin rol, 403, usando los contratos comunes. No se promueven roles.

## Notificación externa

Se conserva `/api/pasarela/webhook` y su cuerpo crudo ya preparado en `app.js`. Respuestas:
200 para procesamiento confirmado, duplicado, evento ajeno ignorado o incidencia permanente
registrada; 400 para firma/esquema o versión incompatible; 503 para fallo transitorio de
consulta o persistencia sin commit. La respuesta no contiene datos del donante. Los criterios
financieros, eventos y ampliaciones necesarias se fijan en
[pasarela-stripe.md](pasarela-stripe.md) y [cambios-comunes.md](cambios-comunes.md).
