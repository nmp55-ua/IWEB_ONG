# Primer informe de converge — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Rama comprobada:** spec-001 · **HEAD inicial:** 47e3ea1.

**Responsable:** Nada · **Revisor:** Rubén.

**Resultado:** `tasks_appended`, dos brechas nuevas de gravedad media. Diagnóstico sin
correcciones. No se declara HU-01 terminada ni convergencia sin reservas.

## Procedimiento, alcance y conservación

Se aplica el procedimiento Spec Kit del repositorio correspondiente a esta fase. Se mantienen el alcance y los resultados descritos en el informe.

La comprobación inicial de rama/HEAD/estado es una salvaguarda de alcance, no una
comparación de ramas, historial o diferencias para deducir requisitos. El estado inicial
coincide con el comunicado: sin cambios funcionales pendientes. Se conserva la configuración local, `.env`, selección de funcionalidad e informes históricos.

Se ejecuta únicamente la resolución de solo lectura:

```powershell
# Desde la raíz del repositorio.
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

Resuelve `specs/spec-001`; Se comprueba explícitamente la existencia de spec.md, plan.md
y tasks.md, porque PathsOnly no valida los requisitos. No se ejecuta la variante que
puede persistir selección. No hay hooks before_converge/after_converge en la configuración
consultada y no se ejecutan hooks de Git.

Se conserva este informe como escritura adicional expresamente autorizada por el encargo.
La otra escritura se limita a añadir `## Phase 6: Convergence` al final de tasks.md,
sin modificar su contenido anterior. No se modifica código, spec, plan, contratos,
configuración, migraciones ni otras historias.

## Hallazgos

Los dos hallazgos son **deducciones de los caminos de código leídos**, con secuencias
concretas que deberán reproducirse mediante regresiones nuevas. No se afirma haberlos
observado con PostgreSQL, navegador, SMTP o Stripe en esta revisión. Las pruebas
anteriores siguen siendo evidencia válida de los casos que realmente ejecutaron.

| ID       | Tipo    | Gravedad | Trazabilidad                                                                                                   | Evidencia principal                                                                                                                                                                                                                                                               | Trabajo restante                                                                                                                                                               |
| -------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CONV-001 | partial | MEDIUM   | FR-012; P09, arista concurrente; contrato HTTP, «Reintento exclusivo de correo»; T024–T026/T031                | confirmaciones.js, líneas 16–20: estado leído antes de reclamar; toda reclamación fallida se interpreta como envío vivo. repositorio.js, líneas 806–816: la reclamación también falla si el otro intento ya terminó en enviado.                                                   | Releer y distinguir el estado terminal antes de devolver conflicto; mantener una sola entrega lógica y añadir regresión determinista. T082.                                    |
| CONV-002 | partial | MEDIUM   | FR-018/FR-019; S10–S13, arista de recuperación del aviso; plan, correo y cuotas; modelo común, aviso histórico | servicio.js, líneas 110–112 y 373–381; repositorio.js, líneas 436–443/583–586: una reentrega recupera ambos tipos de correo. textoCorreo.js, líneas 75–86: el aviso afirma que la cuota no está contabilizada y presenta un próximo intento sin distinguir su carácter histórico. | Conservar el aviso histórico sin comunicarlo como estado vigente cuando la cuota ya se confirmó o cambió la previsión/cancelación; añadir regresiones de entrega tardía. T083. |

La gravedad media corresponde al resultado comunicado del correo en condiciones de
concurrencia/recuperación. No se ha identificado aquí duplicación de dinero, acceso ajeno,
modificación de cobros confirmados o una infracción constitucional directa que justifique
elevarlos a críticos. Tampoco son meras ausencias de prueba: se identifican ramas concretas
del código que producen la respuesta o texto incorrectos bajo las condiciones descritas.

### CONV-001 — Conflicto de reserva sin comprobar que el envío ya terminó

Fuentes:
[confirmaciones.js](../../../backend/src/modulos/donaciones/confirmaciones.js), líneas 16–20;
[repositorio.js](../../../backend/src/modulos/donaciones/repositorio.js), líneas 806–816;
[contrato HTTP](../contracts/api-donaciones.md), líneas 148–155.

Secuencia deducida:

1. El intento A tiene una reserva y está enviando la confirmación.
2. B lee `repo.correo` y obtiene `enviando`; no entra en el retorno inmediato de `enviado`.
3. A termina satisfactoriamente y persiste `enviado` antes del UPDATE de reclamación de B.
4. B no obtiene fila: enviado no es reclamable. El código devuelve siempre 409
   `CORREO_EN_ENVIO`, aunque la reserva ya terminó y consta envío satisfactorio.

El contrato exige devolver el estado sin reenviar si ya está enviado y reserva el 409
para un envío reservado. La interfaz transforma el conflicto en «El correo ya se está
enviando»; una consulta posterior puede mostrar enviado al mismo tiempo. No se duplica
un correo en este camino, pero se informa un resultado que ya no corresponde.

La prueba «una reserva viva devuelve conflicto y no envía» de
[confirmaciones.test.js](../../../backend/src/modulos/donaciones/confirmaciones.test.js)
cubre la reserva activa; la rama de envío ya completado se prueba secuencialmente.
No cubren la terminación intercalada entre lectura y reclamación. G3/P10 cubre otro
caso: segundo fallo SMTP, no este éxito concurrente.

**Recomendación:** resolver una reclamación fallida con una lectura del estado actual,
sin reenviar un correo terminal ni apropiarse de una reserva ajena. Mantener 409 cuando
corresponda realmente a una reserva viva y el manejo previsto de fallos transitorios.
La regresión debe controlar ese intercalado y contrastar también el contrato HTTP,
sin nuevo cobro, filas financieras o envío adicional. No requiere nuevas tablas.

### CONV-002 — Recuperación de aviso histórico con texto de estado actual

Fuentes:
[servicio.js](../../../backend/src/modulos/donaciones/servicio.js), líneas 110–112/373–381;
[repositorio.js](../../../backend/src/modulos/donaciones/repositorio.js), líneas 436–443,
583–586 y 693–710;
[textoCorreo.js](../../../backend/src/modulos/donaciones/textoCorreo.js), líneas 75–86;
[modelo común](../../modelo-datos.md), apartado correos_aportacion.

Secuencia deducida:

1. Una cuota posterior falla: se crea `fallo_cuota` y SMTP falla, por lo que su aviso
   queda pendiente de recuperación en estado fallido.
2. La misma factura se paga posteriormente. El servicio confirma la misma cuota, crea
   su confirmación y conserva el aviso histórico, según el modelo.
3. Llega una reentrega de un evento de esa factura ya registrado. La vía de duplicado
   devuelve todos sus correos, sin discriminar confirmación frente a aviso histórico.
4. `intentarCorreos` permite recuperar el aviso fallido. Su texto dice «Esa cuota no se
   ha contabilizado como pagada» cuando la cuota ya está confirmada. Puede además
   presentar como próximo intento una previsión del fallo anterior ya pasada o que una
   cancelación dejó sin vigencia.

También puede reaparecer el aviso pendiente tras una cancelación y una reentrega del
evento de factura. La comprobación `estado !== 'cancelada'` de repositorio.js, línea 694,
impide preparar avisos nuevos en ese tramo, pero no protege la recuperación temprana de
uno ya existente. No es una duplicación de avisos lógicos: ambos tipos están previstos
y tienen su propia unicidad. La brecha es presentar el aviso histórico como verdad actual.

La prueba «fallo seguido de éxito de la misma factura de ciclo confirma la misma fila»
de [cuotas.test.js](../../../backend/src/modulos/donaciones/cuotas.test.js), líneas 540–562,
comprueba cuota, suma y coexistencia de ambos tipos. S10 comprueba deduplicación y S13
conservación tras cancelación, con SMTP satisfactorio de base. No combinan aviso SMTP
fallido, pago/cancelación posterior y reentrega que intenta recuperarlo. Por tanto, sus
resultados anteriores no demuestran que esta comunicación tardía sea correcta.

**Recomendación:** distinguir inequívocamente información histórica de estado actual al
recuperar un aviso de fallo. Conservar el aviso y su resumen inmutable, sin borrar,
reescribir confirmaciones o cancelar cuotas. La corrección puede contextualizar el mensaje
histórico para que no afirme un impago o una previsión actuales; no se impone aquí una
política nueva de eliminar/suprimir avisos. Si se propone dejar de enviarlos o añadir
estados, esa decisión requerirá revisión explícita y no se atribuye como acordada.
Añadir regresiones sin red para pago posterior y cancelación, conservando cardinalidad,
fechas, referencia y ausencia de llamadas para cobrar otra vez.

## Cobertura de requisitos y criterios

La tabla identifica el código contrastado y la evidencia previa utilizada. «Sin otra
brecha identificada» describe el resultado de lectura, no una ejecución satisfactoria
nueva ni una garantía de ausencia total de defectos.

| Requisito | Implementación contrastada                                      | Resultado de esta revisión                                                                     |
| --------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| FR-001    | FormDonacion, controlador, servicio y recurrencias de pasarela  | Puntual y socio con tres periodicidades; sin otra brecha identificada.                         |
| FR-002    | normalizacion.js, importes común y CHECK de 004                 | Rango inclusivo, dos decimales, céntimos seguros y sin redondeo; evidencia A1.                 |
| FR-003    | repositorio.preparar, Proyecto activo FOR SHARE y formulario    | Destino activo o NULL; no se revalida como alta una operación existente.                       |
| FR-004    | normalizarDonante/normalizarNifNie, controlador y Campo         | Campos obligatorios, letra y errores; sin otra brecha identificada.                            |
| FR-005    | prepararSesionPago/proyecciones, frontend y esquema             | Card/EUR alojado; sin campos de tarjeta en datos de la ONG según código y T074.                |
| FR-006    | guardarPago, guardarSesionEvento, aplicarFactura/confirmarCuota | Confirmación canónica y conservación de estados/filas; evidencia A4/A7.                        |
| FR-007    | crearCorreo, confirmaciones, ResultadoDonacion, textoCorreo     | Resumen y fallo separados del dinero; CONV-001 afecta el resultado concurrente de correo.      |
| FR-008    | suscripciones, calcularPrevision y Suscripcion                  | Alta tras primer pago, previsión y cancelación sin editar cuota; sin otra brecha identificada. |
| FR-009    | aplicarFactura e insertarCuota                                  | Factura de ciclo identifica cuota y no duplica la inicial; evidencia A7.                       |
| FR-010    | claves únicas, eventos y exclusiones por pago/suscripción       | Deduplicación y transacción corta; no se deduce idempotencia real de una simulación.           |
| FR-011    | rutas de creación sin requiereRol y permiso invitado            | Ambas modalidades sin cuenta; historial fuera de alcance.                                      |
| FR-012    | reintentarCorreo, reclamar/terminarCorreo y UI                  | Brecha concurrente CONV-001; no se pierde el aislamiento del pago.                             |
| FR-013    | VincularDonante, emitir/consumirVerificacion y roles            | Dos entradas, enlace con hash/cuenta/caducidad/uso único; evidencia M1/R1/M3.                  |
| FR-014    | identidad, bloqueos ordenados por NIF y correo                  | Rechazo genérico previo a Stripe, sin UNIQUE de correo ni mezcla de datos.                     |
| FR-015    | equivalencias y reutilización sin UPDATE fiscal                 | Sin edición ni duplicación de Donante; G2/A10 cubre cuenta vinculada.                          |
| FR-016    | autorizacion.js, consultas de propiedad y controlador           | Ocho horas absolutas, 404 genérico, permisos separados y BIGINT textual; evidencia A5.         |
| FR-017    | app.js raw y webhook sin sesión                                 | Confirmación independiente del cliente; evidencia real P21 conservada.                         |
| FR-018    | aplicarFactura, CIERRES y avisos por tipo                       | Datos financieros conservados; CONV-002 en la comunicación tardía del aviso.                   |
| FR-019    | calcularPrevision y resultado; texto de aviso guardado          | API/UI ocultan previsión caducada; CONV-002 en su presentación tardía por correo histórico.    |

| Criterio | Fuente y alcance conservados                                                       | Resultado                                                                                                          |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SC-001   | medicion-puntual-02.md: 61 s medidos con cronómetro; sin t0/t1 ni captura comunicados | Evidencia de esa ejecución; no se mide otra ni se reconstruye duración. Medición 1 fallida conservada.             |
| SC-002   | Registro de comprobación: 7/7 confirmaciones recibidas por referencia para 30–36                       | Conjunto delimitado, no auditoría global. CONV-001/002 no se presentan como fallos observados en esas operaciones. |
| SC-003   | T074, DTOs, proyecciones Stripe, esquema, sesión y frontend                        | Evidencia previa y lectura sin campos de tarjeta; no se repite inspección de bases o logs.                         |
| SC-004   | R1/R3/R5 de la matriz, céntimos y formato de resúmenes                             | Cotejos previos conservados; sin nuevo pago o cotejo externo.                                                      |

## Cobertura de los 34 escenarios

Fuentes A/M/R y sus límites son los de la [matriz vigente](matriz-validacion-01.md):
A representa automatización previa, M recorridos locales y R Stripe de pruebas.
La nueva revisión comprueba los caminos y aserciones, no vuelve a ejecutar esas pruebas.

| Caso | Camino y evidencia previa contrastados                | Reserva nueva o límite conservado                                                  |
| ---- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| P01  | Creación/confirmación/resumen; A3/A4/A8, R2/R4/R5     | 61 s de R5 no es una garantía universal.                                           |
| P02  | Proyecto de preparación y resumen; A2/A8, R1          | Sin otra brecha identificada.                                                      |
| P03  | Importe en formulario/servidor/SQL; A1/A3, M1         | Sin cobros de extremos adicionales.                                                |
| P04  | NIF/NIE con letra y Campo; A1/M1                      | Sin otra brecha identificada.                                                      |
| P05  | Recursos canónicos, rechazo y cancel_url; A4/A10, M3  | El retorno no prueba cancelación financiera.                                       |
| P06  | Resumen y correo; A8, R1/R4/R5                        | Recepción delimitada, sin auditoría global.                                        |
| P07  | Creación sin cuenta y permiso; A3/M1/R1               | No se atribuye a R5 un recorrido invitado no comunicado.                           |
| P08  | Confirmación y SMTP fallido; A3/A4/A10, M3            | Sin otra brecha en el fallo ordinario.                                             |
| P09  | Reintento satisfactorio y terminal; A3/A6, M1         | CONV-001: arista concurrente no cubierta por éxito secuencial.                     |
| P10  | Segundo fallo HTTP y aviso; A10/M3                    | Conserva su cobertura; no es el intercalado de CONV-001.                           |
| P11  | Dos entradas y solicitud; A3/M1/R1/M3                 | Sin solicitar otro enlace para repetir evidencia.                                  |
| P12  | Cuenta, hash, caducidad, POST y consumo; A2/A3, M1/R1 | Sin otra brecha identificada.                                                      |
| P13  | Correo/NIF incompatible; A2 y error genérico          | No necesita un pago real para comprobar bloqueo previo.                            |
| P14  | Reutilización y locks de identidad; A2                | No se sobrescriben datos existentes.                                               |
| P15  | Otro correo para NIF existente; A2                    | Sin otra brecha identificada.                                                      |
| P16  | Tres cambios con cuenta vinculada; A10/M3             | Sin otra brecha identificada.                                                      |
| P17  | Equivalencias NFC/espacios/mayúsculas; A1/A2          | No se eliminan tildes o particularidades de correo.                                |
| P18  | Permiso de operación para resultado/correo; A3/A5/M1  | Reintento autorizado no autoriza otros recursos.                                   |
| P19  | Falta de permiso y caducidad; A3/A5/M1/R1             | Caducidad exacta acreditada en automatización previa.                              |
| P20  | Referencias A/B y cuenta propietaria; A3/A5/M1        | No supone HU-02 implementada.                                                      |
| P21  | Webhook independiente y primera transición; A3/A4/R2  | Cierre de páginas, no todos los procesos Firefox.                                  |
| S01  | Factura inicial, cuota y periodicidad; A2/A7/M2/R3    | Tres altas reales, no ciclos reales.                                               |
| S02  | Invoice de ciclo y reconciliación inicial; A7/A3      | Ciclo cubierto localmente, no renovación real.                                     |
| S03  | Primer rechazo y cierre definitivo; A7                | Rechazo real de primera factura no ejecutado.                                      |
| S04  | Alta sin cuenta por HTTP; A2/A3/M2                    | No se presenta como alta Stripe real invitada.                                     |
| S05  | SMTP fallido y socio activo; A3/A10/M3                | Mantiene resumen, periodicidad y previsión.                                        |
| S06  | Reintento y permisos distintos de cuota; A3/M1        | CONV-001 afecta también a una confirmación de cuota concurrente.                   |
| S07  | Conflicto de correo/NIF antes de alta; A2             | Sin otra brecha identificada.                                                      |
| S08  | Cambios fiscales en alta; A2                          | Sin otra brecha identificada.                                                      |
| S09  | Alta sin retorno en servicio; A7/A3                   | Sin recorrido real completo de socio con cliente cerrado.                          |
| S10  | Cuota rechazada, aviso y suma; A7/M2                  | CONV-002: aviso fallido recuperado después de cobrar.                              |
| S11  | next_payment_attempt actual; A7/M2                    | CONV-002: no confundir previsión histórica del correo con actual.                  |
| S12  | Próxima fecha nula/pasada; A7/M2                      | API/UI correctas en lectura; reserva de comunicación histórica CONV-002.           |
| S13  | Cancelación y pagos conservados; A7/M2/R3 parcial     | CONV-002 para aviso antiguo recuperado. R3 canceló tras éxito, no tras fallo real. |

Las marcas anteriores de T079–T081 y su relato no se reescriben. La matriz de la fase
anterior conserva su fecha y alcance; estas aristas nuevas quedan diagnosticadas aquí
y en las tareas de corrección. No se afirma que todas las combinaciones posibles
estuvieran cubiertas por aquel balance ni se exigen 34 nuevos pagos de Stripe.

## Decisiones del plan contrastadas

| ID de revisión | Decisión existente                                         | Código/resultado de lectura                                                                                    |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| D01            | P-04 y normalización R-03                                  | Normalización, importes y formularios acordes; límite por operación.                                           |
| D02            | P-01, modelo único e incorporación 004/operativa           | Tres tablas de dominio y cuatro técnicas; migrador por nombre; T006/T007 pendientes.                           |
| D03            | Snapshot/idempotencia/exclusión de creación, 23 horas      | preparar/operacion/iniciarCheckout/conExclusion y servicio.crear mantienen cuerpo/clave y reloj de PostgreSQL. |
| D04            | P-02, acacia y avisos compatibles limitados                | SDK y proyecciones; solo acacia/endive exactos; factura por ID, sin depender de subscription del snapshot.     |
| D05            | R-05, permiso de ocho horas y origen/CSRF                  | Sesión guardada antes de redirigir; referencias concretas y propietario cargado en servidor.                   |
| D06            | Verificación de vínculo sin cambiar auth                   | Hash, caducidad, cuenta, consumo transaccional; rutas comunes de autenticación conservadas.                    |
| D07            | P-03/R-07, reserva renovable y recuperación                | Reserva/contador y envío fuera de transacción presentes; dos aristas parciales CONV-001/002.                   |
| D08            | R-06, previsión canónica y cancelación                     | No suma de meses ni cobros propios; conservación financiera. Reserva del aviso tardío en CONV-002.             |
| D09            | Interfaz, euros y fechas de Madrid                         | Componentes comunes y formato español; páginas/rutas reales referenciadas en evidencias previas.               |
| D10            | Validación aislada y separación de evidencia real/simulada | Guardas de ong_test_hu01/esquemas, adaptadores sintéticos y banco test; no conectados al router de producción. |

## Constitución y coordinación

Se contrastan los doce principios, sin sustituir la revisión humana:

- **I y II:** no se identifican entidades o capacidades de producto nuevas fuera del
  alcance; instrumentación sintética separada del producto y autorizada para G1–G3.
- **III y IV:** escenarios, límites y presentación española trazables; las dos brechas
  informativas se documentan sin inventar una ejecución. No se declara historia terminada.
- **V y VI:** permisos en servidor, Checkout alojado, DTOs sin tarjeta, hash de vínculo
  y conservación de aportaciones. Las observaciones previas de registros comunes de T074
  siguen para revisión; no se convierten aquí en una vulnerabilidad nueva sin evidencia.
- **VII, VIII y IX:** pila, capas y servicios compartidos presentes; un modelo único;
  no se redefine autenticación, roles, cookies ni entidades de otras historias.
- **X, XI y XII:** autoría/revisor identificados y cambios preparados en rama; T006 y T007
  no completadas. No se realiza incorporación a main ni se atribuye acuerdo colectivo.

**Pendientes existentes, no nuevos defectos ni tareas duplicadas:**

| Pendiente                          | Estado y condición                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T006                               | Revisión real de Rubén de 004 y P-01–P-03, acreditable en la PR; converge no la sustituye.                                                                                              |
| T007                               | Coordinación efectiva de número/nombre de 009. Su ausencia en ramas publicadas comprobadas no es reserva ni descarta trabajo sin publicar.                                              |
| Límites reales de pruebas          | Renovaciones/fallos y recorridos de socio solo simulados donde así consta; no se convierten en casos reales aprobados.                                                                  |
| Límite conocido de SMTP            | Una caída tras aceptación y antes del guardado puede duplicar mensaje físico; está documentado y no implica duplicación financiera. No se añade una promesa de exactamente una entrega. |
| Acceso invitado y cuenta reservada | No hay recuperación directa de sesión invitada ni recuperación de cuentas con correo ocupado; límites aceptados de v1, sin tareas de perfil nuevas.                                     |

## Métricas y tareas derivadas

| Métrica                                                         | Resultado                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| Requisitos funcionales contrastados                             | 19, FR-001–FR-019                                          |
| Criterios de éxito contrastados                                 | 4, SC-001–SC-004                                           |
| Escenarios contrastados                                         | 34, P01–P21/S01–S13                                        |
| Elementos FR/SC/escenario inventariados                         | 57                                                         |
| Decisiones técnicas del plan contrastadas                       | 10, D01–D10; incluyen P-01–P-05 y decisiones referenciadas |
| Principios constitucionales contrastados                        | 12; no se omite por plantilla                              |
| Tareas preexistentes                                            | 81: 79 marcadas y T006/T007 pendientes                     |
| Hallazgos nuevos                                                | 2: missing 0, partial 2, contradicts 0, unrequested 0      |
| Gravedad                                                        | CRITICAL 0, HIGH 0, MEDIUM 2, LOW 0                        |
| Tareas nuevas                                                   | T082 y T083, sin marcar; Phase 6: Convergence              |
| Pruebas funcionales nuevas/repetidas en este diagnóstico        | 0                                                          |
| Consultas a bases, Stripe, SMTP o navegador en este diagnóstico | 0                                                          |

**T082 → CONV-001:** regresión del intercalado lectura/reclamación y corrección del
resultado concurrente, conservando exclusión, permisos y ausencia de cobros nuevos.

**T083 → CONV-002:** regresión del aviso fallido recuperado después de pago/cancelación
y corrección de su carácter histórico, sin borrar/reescribir resúmenes ni decidir una
política nueva de supresión de avisos. No requiere otra estructura de datos por defecto.

## Siguiente bloque propuesto y parada

Tras revisar este diagnóstico, implementar juntas T082–T083 con pruebas nuevas primero,
solo en donaciones y sus pruebas, usando ong_test_hu01 y esquemas aislados, Stripe/SMTP
simulados. La corrección del aviso debe respetar el modelo común y su conservación
histórica; cualquier cambio funcional de política se planteará antes de aplicarlo.
No es necesario volver a cobrar, reenviar eventos reales o repetir cronómetros.

Como validación futura dirigida, desde backend y con las conexiones de pruebas verificadas:

```powershell
# Propuesta para el bloque de corrección; NO ejecutada en converge.
npm test -- src/modulos/donaciones/confirmaciones.test.js src/modulos/donaciones/rutas.test.js src/modulos/donaciones/cuotas.test.js --no-file-parallelism
```

Conservar evidencia del fallo antes de corregir y del resultado posterior. El siguiente
converge deberá contrastar las nuevas tareas y mantener los pendientes humanos reales.
Este diagnóstico termina con el informe y la adición de tareas; no implementa ninguna,
no modifica marcas previas y no declara HU-01 terminada o aprobada por Rubén.

## Comprobación documental final

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.