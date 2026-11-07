# Comprobaciones locales G1–G3 — HU-01

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD inicial:** 076e439.

**Responsable:** Nada · **Revisor:** Rubén, pendiente.

## Alcance y aislamiento

Se completan los huecos P05, P08, P10, P11, P16 y S05 identificados en la
[matriz vigente](matriz-validacion-01.md). Se conservan los cambios documentales
previos, `.env`, `.claude/launch.json` y los informes históricos. No se modifica
código del producto: se añaden seis pruebas y un banco reutilizable de pruebas.

El banco reutiliza `crearEntornoPruebas`, las migraciones, `crearServicio`,
`crearRutasDonaciones` y las páginas/componentes reales de Astro. La conexión se
selecciona en memoria para `ong_test_hu01`; el soporte verifica la base y crea un
esquema exclusivo. No se consulta ni modifica la base de desarrollo.

La instancia de navegador usa `127.0.0.1:44321`, un backend temporal en un puerto
libre y una sustitución del proxy solo en memoria. No se detienen los servicios
compartidos ni se cambia su configuración. La cuenta sintética fija y su Donante
vinculado proceden del servidor de pruebas; este identificador no se obtiene de
un campo del navegador. No se modifica la autenticación del producto.

Las cuatro operaciones sintéticas se crean por HTTP. Sus estados de rechazo y
confirmación se obtienen procesando avisos sintéticos y consultando recursos
canónicos simulados; no mediante cambios manuales de estado SQL. SMTP devuelve
`false`. No se realizan conexiones a Stripe, SMTP o Mailpit. Las fechas de enero
y febrero de 2027 de las capturas pertenecen a estos recursos sintéticos.

## Comandos y resultados

Desde `backend`, con `NODE_ENV=test` y `DATABASE_URL`/`TEST_DATABASE_URL` iguales
apuntando exclusivamente a `ong_test_hu01`, conforme al aislamiento del
[quickstart](../quickstart.md):

```powershell
npm test -- src/modulos/donaciones/validacion-local.test.js --no-file-parallelism
```

- Primer intento: conexión bloqueada por permisos locales, `EACCES 127.0.0.1:5440`;
  seis pruebas sin ejecutar. No se presenta como resultado funcional.
- Al habilitar la ejecución contra la base exclusiva, la preparación detectó una
  consulta incorrecta del nuevo banco (`operaciones_pago` no tiene `referencia`).
  Se corrigió usando la relación con `aportaciones`; no se cambió el producto ni
  el esquema. Después: **6/6 aprobadas**, duración total 3,78 s.
- Se añadió la comprobación de recuperación del mismo Checkout rechazado y se
  ejecutó la regresión dirigida, sin suites simultáneas:

```powershell
npm test -- src/modulos/donaciones/validacion-local.test.js src/modulos/donaciones/rutas.test.js --no-file-parallelism
```

Resultado final: **17/17 aprobadas**, dos archivos, duración total 13,68 s.
El aviso esperado de rechazo del correo de verificación pertenece a una prueba
de SMTP simulado de `rutas.test.js`. No se repite la suite completa de 367 pruebas.

Para el navegador se ejecutó, desde `backend`, con las mismas conexiones aisladas:

```powershell
$env:NODE_ENV = 'test'
$env:FRONTEND_URL = 'http://127.0.0.1:44321'
$env:ASTRO_TELEMETRY_DISABLED = '1'
node src/modulos/donaciones/pruebas/navegador-local.js
```

En esta ejecución se mantuvo únicamente ese proceso temporal en segundo plano,
con ventana oculta. El primer arranque detectó una importación de ruta Windows;
se corrigió a URL de archivo. Un primer proceso no persistió y la navegación
devolvió conexión rechazada. Se arrancó el banco persistente antes de observar
las pantallas; ninguno de esos intentos se cuenta como comprobación de interfaz.

La observación posterior sí se realizó mediante navegador integrado sobre las
páginas reales. Se validaron contenido, controles y acciones; no es una revisión
del estilo visual o de la maquetación. Las capturas se conservan junto al
[balance de persistencia y contadores](evidencias-g123/balance.json).

## Resultado por caso

| Caso | Entrada y observación                                                                                                                                                                            | Contraste de backend y persistencia                                                                                                                                                                                         | Resultado                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| P05  | Resultado rechazado, motivo «El pago no se ha completado», opción «Reintentar el pago». Retorno con `cancelado=1` muestra la aclaración y conserva pendiente.                                    | GET con/sin parámetro sobre pendiente, rechazada y confirmada devuelve los mismos datos. Recuperación HTTP con la misma clave devuelve referencia y URL originales; no añade llamada Checkout.                              | Cubierto localmente: API, PostgreSQL e interfaz. No se abre un Checkout externo. |
| P11  | Se sigue «Vincular mis aportaciones a una cuenta» desde resultado y formulario; ambos llegan a `/donar/vincular` sin token y muestran «Enviar enlace de verificación». No se pulsa ese botón.    | Contador de solicitudes de vínculo 0 antes y después; ningún SMTP adicional por navegar. Solicitud/verificación/no vínculo automático ya se acreditan en los informes y pruebas anteriores.                                 | Cerrado el hueco de las dos entradas; no se repite el enlace ya acreditado.      |
| P16  | Con cuenta vinculada, puntual: cambios reales independientes de nombre, apellidos y dirección muestran «Revisa los datos introducidos para continuar», permaneciendo en el formulario.           | Tres POST 409 `DATOS_DONANTE_INCOMPATIBLES`; fila del Donante conservada, sin nuevas aportaciones u operaciones ni otra llamada Checkout. Pruebas parametrizadas identifican cada campo.                                    | Cubierto en los tres campos, incluido el contexto de cuenta vinculada.           |
| P08  | Puntual confirmada: resumen y «No se ha podido enviar el correo de confirmación. Tu donación sigue confirmada», con «Reintentar solo el correo».                                                 | Primer intento SMTP simulado fallido; confirmación persistida y resumen conservados.                                                                                                                                        | Cubierto localmente; no acredita recepción de correo.                            |
| P10  | Se pulsa el reintento real desde esa pantalla; aparece «El reenvío ha vuelto a fallar. Tu donación sigue confirmada». Se conservan aviso, resumen y botón habilitado; no aparece éxito de envío. | POST de correo 200 con `estadoCorreo=fallido`; segundo intento registrado, `enviado_en=null`. Misma aportación, pago y operación; ninguna llamada Checkout adicional. La prueba dirigida contrasta el mismo recorrido HTTP. | Cubierto localmente. HTTP 200 no se interpreta como envío satisfactorio.         |
| S05  | Cuota confirmada, 20,00 €, fondo general, socio activo, periodicidad mensual, próxima fecha 15/02/2027; aviso de fallo y reintento junto al resumen.                                             | Aviso `invoice.paid` y recursos canónicos simulados activan la suscripción; correo persistido fallido con un intento, no enviado.                                                                                           | Cubierto localmente; no es otra alta ni fallo SMTP de Stripe real.               |

### Referencias y capturas

Todas las referencias siguientes son exclusivas del banco, ajenas a las aportaciones
reales de pruebas 30–35:

- Rechazada: `DON-c113c84f-b124-4c73-befc-d4a9565f5bb5`;
  [motivo y reintento](evidencias-g123/p05-rechazo-reintento.png).
- Pendiente: `DON-777a55ba-edc4-4644-b3fd-8d9242dbeacf`;
  [retorno sin transición financiera](evidencias-g123/p05-retorno-pendiente.png).
- Puntual confirmada: `DON-3ab5ce15-925d-49fe-8325-62b0b763d36c`;
  [segundo fallo visible](evidencias-g123/p10-segundo-fallo.png). El resumen, el
  aviso del primer fallo y el botón se observaron también antes de pulsarlo.
- Socio: `DON-f31330e4-ab98-4864-a360-61cb2b1ff371`;
  [alta activa y correo fallido](evidencias-g123/s05-socio-correo-fallido.png).
- Vínculo: [entrada del formulario](evidencias-g123/p11-entrada-formulario.png)
  y [destino sin token](evidencias-g123/p11-vincular-sin-token.png). La entrada del
  resultado figura también en la captura de P10 y se siguió hasta ese mismo destino.
- Identidad: [nombre](evidencias-g123/p16-nombre.png),
  [apellidos](evidencias-g123/p16-apellidos.png) y
  [dirección](evidencias-g123/p16-direccion.png), cada uno con rechazo visible.

El balance antes/después del navegador conserva exactamente las filas de
aportaciones y operaciones y el Donante observado. Checkout: **4 → 4** llamadas,
todas de la preparación de los cuatro casos. SMTP: **2 → 3**, exclusivamente el
segundo intento fallido de la puntual. Solicitudes de vínculo: **0 → 0**. Los tres
POST de cambio de identidad devuelven **409**. Correo puntual: **1 → 2** intentos,
fallido; correo de socio: un intento, fallido. Estos contadores son del simulador,
no una comprobación de idempotencia o facturación real de Stripe.

Se cerró la instancia temporal al finalizar. El proxy devolvió una respuesta
interrumpida al cerrarse; se verificó posteriormente por SQL que su esquema
`hu01_integracion_51b86385362145de9105c51ab29b9c09` ya no existía. Se eliminó
también el esquema residual del primer proceso, identificado exclusivamente por
su referencia sintética, tras verificar `current_database() = ong_test_hu01`.
No se elimina `public` ni ningún esquema de otros bloques.

## Medición y balance que permanecen pendientes

La [medición puntual 1](medicion-puntual-01.md), realizada por el guía, queda
intacta: aportación **35**, referencia `DON-0b914a77-2050-4429-ba19-19f16f62507c`,
20,00 €, **480,836 s** incluyendo todas las incidencias. **No cumple SC-001**;
no se reinicia ni reconstruye el cronómetro. La confirmación y recepción del
correo se conservan como evidencia válida independiente de la duración.

El guía acredita **6/6** confirmaciones recibidas por referencia en el conjunto
delimitado 30–35. No se han repetido sus pagos ni envíos y no se presenta como
auditoría global. Se excluyen estas semillas locales, correos simulados, avisos
de fallo y mensajes de vinculación del numerador y denominador de SC-002.

La matriz queda con **34/34 escenarios con evidencia en el alcance declarado**,
sin los seis huecos locales iniciales. Renovaciones y fallos de cuotas cubiertos
con simulaciones no se presentan como recorridos ejecutados en Stripe real.
T080 permanece sin marcar: depende de T079 y exige también el balance de
SC-001–SC-004; falta una medición satisfactoria de SC-001. T079, T081, T006,
T007, converge y coordinación de 009 permanecen pendientes. No se detectaron
defectos nuevos del producto en este bloque. No se hicieron operaciones externas
ni escrituras de Git.

Comprobación documental final: Prettier correcto en los siete archivos de texto
del bloque; enlaces locales de matriz e informe sin destinos ausentes; 34
identificadores de escenario distintos; `git diff --check` correcto e índice sin
cambios. La comparación SHA-256 inicial/final conserva `.env`, `.claude/launch.json`,
la medición 1 y los informes históricos. Solo cambian `tasks.md` y la matriz entre
los archivos ya existentes al comenzar; el cambio previo de `quickstart.md` queda
intacto. HEAD permanece en 076e439.
