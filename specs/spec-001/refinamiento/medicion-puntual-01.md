# Medición puntual de T079 — ejecución 1

**Fecha:** 2026-11-07. **Historia:** HU-01. **Ejecución:** chat guía, mediante navegador integrado y consultas de solo lectura. Cuenta de pruebas vinculada existente.

## Medición observada

- Inicio registrado con Date.now antes de navegar al formulario vacío: 2026-11-07T03:58:36.900Z.
- Fin registrado después de observar el resultado confirmado en el navegador: 2026-11-07T04:06:37.736Z.
- Duración total registrada: **480,836 segundos (8 minutos y 0,836 segundos)**. Incluye los intervalos de observación de la herramienta; no se reconstruye desde timestamps del pago ni se resta ninguna espera.
- Resultado de SC-001 en esta ejecución: **no cumple el límite de menos de 180 segundos**. T079 permanece pendiente; esta medición asistida no determina por sí sola la duración de un recorrido humano sin interrupciones.

## Incidencias conservadas

El primer envío del formulario mostró «Ha ocurrido un error inesperado». La consulta posterior encontró la aportación 35 pendiente y la operación incierta, sin Checkout registrado. Se recuperó la misma solicitud, sin generar otra operación; no se acredita la causa técnica del error inicial.

En Checkout, un intento de automatización agotó el tiempo de espera. Las consultas posteriores a Stripe mostraron open/unpaid, sin PaymentIntent. La revisión automática bloqueó un segundo envío por tratarse de un reintento tras timeout. Nada autorizó expresamente reenviar el mismo Checkout, previa comprobación de que seguía sin pagar. Se volvió a comprobar open/unpaid, sin PaymentIntent y en modo de pruebas. Hubo además una pérdida de acceso de la herramienta al navegador, recuperada reiniciando únicamente su sesión de control, sin crear otra pestaña ni reiniciar la medición.

Después del envío autorizado se observó el retorno y la confirmación en pantalla: 20,00 €, donación puntual, fondo general, referencia original y correo aceptado. El cronómetro conservó todas las esperas, incluida la autorización entre mensajes.

## Operación y comprobaciones posteriores

- Aportación 35; referencia DON-0b914a77-2050-4429-ba19-19f16f62507c.
- UUID 98a1fc64-f740-446e-a301-ace4f711e23b.
- PaymentIntent pi_3UZ0tUE0jEvPnEcp04n3jnJD.
- Stripe: Checkout complete/paid; PaymentIntent succeeded; EUR, 2000 céntimos recibidos, livemode=false y referencia coincidente. Consultas con API acacia.
- PostgreSQL: confirmada; importe 20.00; fecha_cobro 2026-11-07T04:06:20.000Z; una aportación por ese pago y una operación asociada.
- Eventos payment_intent.succeeded y checkout.session.completed procesados, sin error_codigo. No se atribuyen códigos HTTP del listener no observados en esta ejecución.
- Correo enviado, un intento, enviado_en 2026-11-07T04:06:23.974Z. Mailpit devuelve una coincidencia y el mensaje jDYvMfFNJdVfBXv6hz6vrr. La lectura de su texto acredita referencia, 20,00 €, 07/11/2026, modalidad puntual y fondo general. La fecha persistida de envío no se presenta como hora exacta de recepción en Mailpit.
- Una búsqueda posterior por cada referencia de las aportaciones 30–35 devolvió una coincidencia por referencia: **6/6 confirmaciones recibidas para ese conjunto delimitado**. No es una auditoría de toda la base ni incluye semillas, avisos de fallo o vínculos.

No se creó otra operación para resolver la incertidumbre, no se inició otro pago independiente y no se actualizaron manualmente estados. Esta evidencia complementa la matriz y los informes existentes; no marca T079 o T080 ni acredita los escenarios locales todavía pendientes. Sin commits ni cambios de configuración.
