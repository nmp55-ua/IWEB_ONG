# Investigación técnica de HU-02

**Fecha**: 2026-11-10 · **Base**: `453bfe8` · **Responsable**: Nada · **Revisor**: Javi

Las decisiones siguientes definen el diseño de esta rama. No acreditan implementación, resultados de pruebas ni aprobación externa. Se mantienen las decisiones de [clarify](refinamiento/clarify-1.md), el [plan común](../plan-comun.md) y el [modelo común](../modelo-datos.md).

## R-01 — Autorización y vínculo existente

**Decisión.** Proteger el GET con `requiereRol('donante')` y resolver `donantes.usuario_id` usando exclusivamente `req.usuario.id`, cargado por el middleware común. Conservar identificadores BIGINT como texto. Sin vínculo se devuelve una explicación y un enlace a `/donar/vincular`, sin buscar por correo ni iniciar ese flujo.

**Justificación.** HU-01 persiste el vínculo tras verificar el acceso al correo; HU-03 ya consulta el Donante por Usuario. La sesión invitada autoriza únicamente operaciones concretas y no concede historial.

**Alternativas.** La búsqueda por correo, el ID de Donante enviado por el cliente y la reutilización de permisos invitados permitirían ampliar indebidamente el acceso; se descartan. No se añade una segunda verificación ni se cambia el login.

**Evidencia local.** `backend/src/modulos/donaciones/autorizacion.js`, `rutas.js`, `servicio.js`; `backend/src/modulos/certificados-informes/repositorio.js`; middleware común de autenticación y roles.

## R-02 — Instantánea consistente y ausencia de efectos

**Decisión.** Reutilizar `enTransaccion` de donaciones. Su primera instrucción después de `BEGIN` será `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY`. Vínculo, resúmenes y detalle se leen en esa misma conexión. Se libera en éxito y error.

**Justificación.** PostgreSQL permite fijar aislamiento antes de la primera consulta y mantener una instantánea para las lecturas de la transacción. Esto evita inconsistencias si HU-01 confirma otro cobro entre consultas. La modalidad de solo lectura impide escrituras accidentales de esta consulta. Véase [SET TRANSACTION, PostgreSQL 16](https://www.postgresql.org/docs/16/sql-set-transaction.html).

**Alternativas.** Varias consultas independientes podrían mezclar instantes. Una consulta única con agregación JSON también sería consistente, pero acoplaría excesivamente el DTO y los estados vacíos al SQL. No hacen falta bloqueos de negocio, serialización global ni modificaciones del helper común.

## R-03 — Año Madrid, orden y filtro

**Decisión.** Agrupar con `EXTRACT(YEAR FROM fecha_cobro AT TIME ZONE 'Europe/Madrid')`. Para filtrar se reutiliza `rangoAnio(anio)` y el intervalo semiabierto `[desde, hasta)`. Grupos descendentes; dentro de cada grupo, `fecha_cobro DESC, id DESC` en PostgreSQL. El filtro opcional acepta un único año de cuatro dígitos entre 1000 y 9999.

**Justificación.** HU-03 usa `rangoAnio` y fecha de cobro. La zona de la sesión SQL o del equipo no debe decidir el año. El ID resuelve empates sin convertir BIGINT a Number. El intervalo evita duplicar el instante del cambio de año.

**Alternativas.** Agrupar por UTC, por creación o por fecha de alta del socio cambia los importes anuales. Restar un milisegundo al final del año es innecesario. No se infiere el año a partir de texto ya formateado.

**Evidencia local.** `backend/src/servicios-comunes/fechas.js`, repositorio y servicio de certificados-informes; índice `aportaciones_donante_estado_fecha_cobro_idx` en `004_donaciones.sql`.

## R-04 — Exactitud y límites distintos de importe y suma

**Decisión.** Calcular `SUM(importe)` en PostgreSQL y devolver texto decimal con dos posiciones. No convertir importes o sumas a flotante ni imponer a la suma el máximo de una aportación. El formato de los totales anuales será una función pura local de HU-02 que agrupa dígitos del texto, conserva los dos decimales y añade el símbolo euro.

**Justificación.** `NUMERIC` es exacto y `SUM(NUMERIC)` devuelve `NUMERIC`; la suma no hereda el límite individual de HU-01. Véanse [tipos numéricos](https://www.postgresql.org/docs/16/datatype-numeric.html) y [agregados](https://www.postgresql.org/docs/16/functions-aggregate.html). El helper común de frontend convierte a Number; resulta adecuado para el rango individual existente, pero no acredita exactitud para sumas potencialmente mayores.

**Alternativas.** Sumar Number, limitar a 999.999,99 € o convertir a céntimos Number una suma sin límite funcional son incorrectos. Cambiar el formateador común ampliaría el alcance a otros módulos. El formato local debe rechazar datos no canónicos en pruebas, sin presentar cero como sustituto de un error.

**Compatibilidad fiscal.** HU-03 ya almacena el total de certificado como `NUMERIC(15,2)` en la migración vigente `008_certificados.sql`. HU-02 no copia ese límite de almacenamiento a la respuesta agregada ni modifica dicha migración. Una futura acumulación que excediera la capacidad del certificado correspondería a HU-03 y requeriría una propuesta separada; no es necesaria para los casos de aceptación actuales.

## R-05 — Tres estados sin resultados y contrato mínimo

**Decisión.** Separar `vinculado`, `hayAportaciones`, `aniosDisponibles` y las filas seleccionadas. `hayAportaciones` será null cuando no hay vínculo, false cuando no existen confirmadas de la persona vinculada y true si las hay, aunque el filtro no devuelva ninguna. La respuesta no incluye correo, NIF, dirección ni identificadores de Stripe.

**Justificación.** FR-008 exige no confundir ausencia de vínculo con ausencia de donaciones y no presentar un año vacío como historial global vacío. Un GET sin vínculo no debe deducir la existencia de donaciones por correo.

**Alternativas.** Un array vacío aislado no distingue esos estados. Redirigir o enviar automáticamente un enlace altera la decisión de clarify. No hacen falta endpoints adicionales para cada estado.

## R-06 — Reutilización de módulo y componentes

**Decisión.** Ampliar rutas/controlador/servicio/repositorio de donaciones. Usar la página Astro, una isla React, `api.get`, Layout y componentes comunes. Activar solo la entrada reservada de «Mis aportaciones» del menú de donantes. El filtro se aplicará mediante acción explícita y tendrá opción de quitarlo.

**Justificación.** El router de donaciones ya está registrado. La consulta no requiere modificar `app.js`, el webhook, autenticación ni cookies. El cliente común no admite una señal de cancelación; la isla descartará respuestas anteriores mediante un contador de solicitudes y limpieza al desmontar.

**Alternativas.** Un módulo paralelo, un cliente fetch alternativo, una biblioteca de tablas o un nuevo sistema de caché añaden duplicación. No se necesita paginación para el caso de 60 filas y no se introduce un corte silencioso del historial.

## R-07 — Paridad con HU-03 después de reconciliar

**Decisión.** Comparar un ejercicio cerrado tras ejecutar el servicio actual `reconciliarEjercicio` con repositorio y transacción inyectados sobre el esquema aislado. Simular correo; no iniciar cron. Contrastar el certificado persistido, el agregado SQL independiente y el DTO de historial para el mismo Donante y conjunto de confirmadas.

**Justificación.** El certificado es una materialización que puede necesitar reconciliación tras confirmaciones tardías. Una comparación anterior no acredita una divergencia del historial. La ruta GET no debe enviar correo fiscal ni regenerar certificados.

**Alternativas.** Duplicar el cálculo fiscal en producción o llamar a su CLI desde el GET acopla historias y añade efectos. El contraste de integración puede importar el servicio existente para pruebas sin modificar archivos de Rubén. La suite completa de certificados contiene limpiezas de tablas y no se utilizará contra una base compartida.

## R-08 — Medición completa de las 60 cuotas

**Decisión.** Medir una navegación normal con la cuenta ya autenticada y vinculada, desde `PerformanceNavigationTiming.startTime` hasta la presentación de las 60 filas, cinco grupos y totales correctos. El banco de pruebas observará el DOM y esperará dos cuadros de animación tras su actualización, con pestaña visible; se conservarán duración, recuentos, captura y traza de navegador.

**Justificación.** Navigation Timing proporciona la referencia de la navegación del documento. `requestAnimationFrame` se ejecuta antes del repintado y puede pausarse en segundo plano; dos callbacks son un margen conservador de presentación, no una prueba física de cada píxel. La inspección visual y la traza complementan el marcador. Fuentes: [PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming) y [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

**Alternativas.** Cronometrar solo SQL, el endpoint o un efecto React posterior al fetch excluye parte del criterio. Login, vinculación y carga de fixtures se realizan antes del inicio. No se resta el tiempo de descarga o hidratación ni se limita la vista a unas pocas filas.

**Entorno.** Build de Astro y proxy del banco para `/api`, con backend y PostgreSQL aislados. El proxy de Vite solo existe en desarrollo; no se supone que siga funcionando en el build. No se añade dependencia de automatización de navegador ni instrumentación al producto.

## R-09 — Persistencia y soporte suficientes

**Decisión.** Reutilizar las migraciones e índice existentes y el soporte de donaciones que exige `ong_test_hu01`, igualdad de DATABASE_URL/TEST_DATABASE_URL y esquemas exclusivos. Añadir en implementación un banco propio de HU-02 con fixtures y servicios aislados.

**Justificación.** El nombre de la base refleja el soporte heredado, no el alcance funcional de las pruebas. Debilitar sus guardas o usar la base de desarrollo no aporta valor. La ausencia de migración nueva evita coordinación de numeración innecesaria.

**Alternativas.** No se crean tablas de historial, cachés de totales, semillas comunes ni índices sin medición que los justifique. Las pruebas no se saltarán por falta de configuración: la preparación verificará la conexión antes de iniciarlas.

## Resultado de investigación

No quedan decisiones de diseño bloqueantes identificadas. La revisión de Javi, la implementación del banco, las pruebas de paridad y la medición de rendimiento son trabajo posterior, no resultados de esta investigación. Las fuentes oficiales fundamentan los mecanismos; la adecuación al proyecto se ha contrastado mediante lectura del código vigente.
