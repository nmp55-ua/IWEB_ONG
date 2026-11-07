# Decisiones compartidas de diseño y revisión — HU-01

**Responsable**: Nada · **Revisor**: Rubén · **Fecha**: 2026-11-06  
**Estado**: P-01–P-04 definidos y alineados documentalmente en `spec-001`. La revisión de
Rubén y la incorporación compartida siguen pendientes. No se atribuye acuerdo colectivo.
P-01–P-03 ya están implementados en esta rama; los resultados se conservan en la
[matriz vigente](../refinamiento/matriz-validacion-01.md), sin atribuir publicación.

## P-01 — Persistencia y transiciones

**Definición vigente**: [modelo-datos.md](../../modelo-datos.md), apartados de donaciones y
soporte técnico. [data-model.md](../data-model.md) explica su uso, sin repetir el esquema.

El modelo común documenta PaymentIntent único por pago, Invoice única por cuota, nulabilidad
antes de conocer identificadores externos y fechas, y el instante de previsión junto a su
DATE de Madrid. La confirmación tras rechazo o cierre local conserva la misma aportación;
confirmada sigue siendo inmutable. Un primer rechazo recuperable deja el alta pendiente;
solo el cierre definitivo cancela. Se evita cancelar irreversiblemente un alta que la
misma pasarela todavía puede cobrar.

Las cuatro tablas de soporte conservan solicitud de Checkout, procesamiento de eventos,
prueba de vínculo y notificaciones. Se justifican por reenvíos, orden no garantizado,
seguridad del historial y recuperación del correo. No son entidades fiscales duplicadas.
La corrección UND-001 añade a operaciones_pago solo solicitud_checkout JSONB, la instantánea
inmutable del cuerpo que la huella no puede reconstruir tras reinicio. Se reutiliza creado_en
para el límite de 23 horas; no hay nueva tabla de locks, propietario o lease de creación.
Este ajuste de P-01 está implementado en la migración operativa local y se conserva
para revisión de Rubén; no equivale a una incorporación compartida.
La regla de conservación admite esos metadatos mínimos, sin cuerpos completos, tarjetas,
contraseñas o tokens de enlace en claro. No se añade unicidad SQL al correo.

**Impacto**: HU-02, HU-03 y HU-04 siguen usando el modelo único, filtrando confirmadas y
fecha_cobro. Una cuota rechazada puede confirmarse después con la misma referencia.
No cambian las reglas de generación o rectificación de informes y certificados. Rubén
debe revisar los campos, fuentes temporales y transiciones antes de incorporar la base compartida.

### Estrategia de migraciones

1. **Incorporación temprana**: `004_donaciones.sql`, reservada a Nada, con donantes,
   suscripciones_socio y aportaciones completas según el modelo común. Incluye claves de
   pago/factura, previsión temporal, auditoría, restricciones e índice financiero. Sin UI,
   procesamiento Stripe, tablas técnicas o datos reales.
2. **Revisión pequeña con Rubén**: comprobar contrato y aplicación sobre una base con
   001–003 y sobre otra con 001–003 y 005. El migrador consulta nombres aplicados, no solo
   el mayor número; puede incorporar 004 después de 005. Usar bases exclusivas de pruebas.
   Esta entrega desbloquea el consumo de aportaciones sin esperar HU-01 completa.
3. **Ampliación operativa**: migración nueva con las cuatro tablas técnicas. Se coordina
   el siguiente número libre desde 009 al preparar su incorporación; **009 no está reservado**.
   En esta rama existe `009_operativa_donaciones.sql` como nombre provisional, sin reserva
   colectiva. Solo depende de 004 y su base común, sin referencias a 006–008.
4. **Conservación**: no editar 004 publicada; ajustes posteriores requieren otra migración.
   La ampliación operativa es necesaria para ejecutar HU-01, pero no para consultar el dominio.

La asignación de número es coordinación de integración, no una decisión pendiente sobre el
esquema. El SQL existe y está validado localmente; esta documentación no afirma la
existencia de una rama de integración, PR aprobada o incorporación compartida.

## P-02 — Pasarela e integración

**Contrato único de funciones**: [plan común, §5.1](../../plan-comun.md#51-contrato-de-la-envoltura-de-stripe).
El [contrato de Stripe](pasarela-stripe.md) fija la validación de recursos y eventos.

La ampliación de crearSesionPago conserva argumentos anteriores y salida id/url. HU-01
usa claveIdempotencia y solicitudCheckout guardadas; prepararSesionPago es la única función
pura que construye ese cuerpo. La llamada compatible sin instantánea usa el mismo
preparador. Se conserva tarjeta/EUR y propagación de metadatos, sin reconstruir el cuerpo
de una operación existente. El protocolo de exclusión por conexión y el plazo fijo de
23 horas se detallan en el contrato Stripe; su incorporación queda pendiente de revisión. Las consultas devuelven proyecciones sin tarjeta. Se fija API 2025-02-24.acacia,
llamadas de 3000 ms y cero reintentos automáticos; fallo transitorio responde 503 y no se
considera procesado. Las opciones constan en el [SDK fijado](https://raw.githubusercontent.com/stripe/stripe-node/v17.7.0/types/lib.d.ts).

**Archivos de implementación afectados en esta rama**:

- `backend/src/servicios-comunes/pasarela.js`: envoltura ampliada, sin funciones
  que ordenen cargos adicionales o cancelaciones.
- `backend/src/app.js`: rutasDonaciones registradas; raw antes de json en el webhook,
  sin exigir sesión o rol. Los permisos propios se comprueban dentro de donaciones.
- `backend/src/db/semillas/index.js`: semillas sintéticas e idempotentes integradas después
  de proyectos, sin llamadas a Stripe ni cambios en las semillas ajenas.
- `frontend/src/components/comunes/Menu.jsx`: entrada pública a /donar, conservando las
  otras opciones. FormDonacion y ResultadoDonacion ofrecen /donar/vincular; VincularDonante
  cubre solicitud sin token y confirmación con token. Se reutilizan FormEntrar, Layout y
  cliente API, sin depender de HU-02 o cambiar registro/login.
- LEEME de módulos/migraciones y README: integración y límites actualizados en T081.

No cambia registro, login, cookies, roles o lib/api.js. La revisión de Rubén sigue pendiente;
las funciones están disponibles en esta rama, sin atribuir integración compartida.

## P-03 — Correo compatible y recuperación

**Contrato único**: [plan común, §6](../../plan-comun.md#6-servicios-comunes-pdf-csv-y-correo).
La llamada existente de un argumento conserva su comportamiento y retorno booleano.
El segundo argumento opcional permite que solo HU-01 seleccione tiempos de conexión,
saludo e inactividad. Su transporte no muta el usado por otros módulos. Se descarta cambiar
globalmente sus tiempos de espera.

Donaciones conserva resumen, resultado y reserva por intento en el modelo común. El envío
renueva la reserva mientras está vivo y guarda el resultado solo si conserva el intento
reclamado. Los tiempos SMTP de cada fase no garantizan duración total; la renovación evita
basar la exclusión en una suma de timeouts. Un intento antiguo no puede sobrescribir otro
posterior. No se añade una cola o un trabajador.

La aceptación SMTP no demuestra recepción: SC-002 exige evidencia en Mailpit. Una caída
tras aceptación y antes de guardar puede duplicar un mensaje físico, nunca dinero.
Un fallo ya respondido con 200 no obliga a Stripe a reenviar el evento. El reintento exige
autorización; sin ella, el correo puede quedar pendiente y SC-002 sin cumplir. Son límites
conocidos, no decisiones de diseño sin resolver.

## P-04 — Alcance de pago en v1

**Decisión cerrada**: exclusivamente tarjeta mediante Stripe Checkout, EUR e importe entre
1,00 € y 999.999,99 €, ambos incluidos, con máximo dos decimales. Es un límite elegido para
esta aplicación, no el máximo universal de Stripe. No hay cargos fraccionados para superarlo
ni soporte implícito de otros medios o monedas.

FR-002, FR-005, escenarios existentes, modelo, plan y contratos reflejan esa decisión.
El máximo se aplica a cada aportación/cuota, no a totales acumulados de certificados e
informes. La representación común NUMERIC(10,2) se conserva. P-04 no sigue abierto.

## P-05 — Preparación del entorno antes de Stripe real

No es un bloqueo de diseño ni un requisito para las pruebas locales con pasarela simulada.
Antes de las pruebas reales de Stripe, en una fase autorizada, deberá comprobarse:

1. Instalación desde lockfile y versión efectiva; referencia actual 17.7.0.
2. Cliente con API 2025-02-24.acacia y destino de webhooks con avisos snapshot acacia o
   2026-10-28.endive, exclusivamente según la [compatibilidad limitada](pasarela-stripe.md#compatibilidad-limitada-de-webhooks--2026-11-07).
   La instalación 17.7.0, entregas endive y recursos canónicos acacia constan en
   T075–T078 y sus informes, sin cambiar automáticamente la configuración de la cuenta.
3. Credenciales y firma del entorno de pruebas, locales y sin publicarlas o enviarlas al frontend.
4. Cobro automático, recuperación de cuotas y cancelación de la cuenta de pruebas.

La preparación y su evolución constan en
[preparacion-stripe-01.md](../refinamiento/preparacion-stripe-01.md); las comprobaciones
reales posteriores, en [validacion-stripe-01.md](../refinamiento/validacion-stripe-01.md).
Se conserva su atribución a Nada y al guía, y los límites de cada recorrido. Una versión
de evento distinta de las dos enumeradas exige una nueva revisión antes de admitirla.

## Estado para revisión

No quedan decisiones de diseño identificadas sin resolver en HU-01: PA1.1–PA1.8 se mantienen,
P-01–P-03 tienen definición única y P-04 está incorporado. La revisión de Rubén y el proceso
de incorporación compartida siguen pendientes; son condiciones anteriores a integrar cambios
comunes, no acuerdos ya producidos. La implementación, SQL y comprobaciones de P-05 constan
en esta rama y sus evidencias. La numeración de la ampliación sigue pendiente de T007.
T081 prepara la revisión; no la sustituye ni ejecuta converge.
