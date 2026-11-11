# Segundo informe de converge — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD comprobado:** 140718b.

**Responsable:** Nada · **Revisor externo:** Rubén, revisión y aprobación pendientes.

**Resultado:** `tasks_appended`. CONV-001 y CONV-002 resueltos; una brecha documental
nueva, CONV-003, de gravedad baja. No se identifica otra brecha funcional en los caminos
inspeccionados. Se añade T084 sin modificar las 83 tareas anteriores.

## Procedimiento y conservación

Se sigue la definición local de
[speckit-converge](../../../.claude/skills/speckit-converge/SKILL.md), sin herramienta
registrada para invocar `/speckit-converge` en esta fase. La intención procede de
[spec.md](../spec.md), [plan.md](../plan.md) y [tasks.md](../tasks.md), bajo la constitución.
Se consultan contratos, modelo y evidencias para contrastarla, sin añadir requisitos.

El [primer diagnóstico de converge](converge-1.md) se aplica con el
[ajuste posterior documentado](ajuste-flujo-01.md): T006/T007 son preparación
técnica completada; los controles de incorporación son controles externos antes de main. El significado
anterior de esas tareas en el primer informe no se interpreta como un bloqueo vigente
para desarrollar, verificar o preparar/abrir una PR.

La salvaguarda inicial confirma spec-001 y HEAD 140718b; Se conserva la configuración local.
 sin seguimiento. Los commits locales comprobados son:

| Commit  | Evidencia conservada                                     |
| ------- | -------------------------------------------------------- |
| 6492b91 | Primer diagnóstico de converge.                          |
| 7c650fc | Correcciones y regresiones de CONV-001/CONV-002.         |
| 140718b | Ajuste del flujo y documentación de preparación técnica. |

No se comparan ramas para inferir requisitos ni se presentan estos commits como
publicados. No se repiten sus acciones. La resolución de selección, desde la raíz, es:

```powershell
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

Resuelve specs/spec-001; Se verifica además la existencia de spec.md, plan.md y tasks.md.
Se usa PathsOnly para evitar persistir la selección; no sustituye esa comprobación de
existencia. Se lee `.specify/extensions.yml`: no registra before_converge/after_converge.
No se ejecutan hooks de Git. La escritura adicional del informe está autorizada por el
encargo. converge-2.md no existía al comenzar; converge-1.md se conserva íntegro.

## Hallazgos anteriores: trazabilidad y resolución

| ID       | Tipo y gravedad originales | Origen                                                    | Evidencia actual                                                                                                                                                                                                 | Estado                                                                       |
| -------- | -------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CONV-001 | partial · MEDIUM           | FR-012; P09/S06; contrato HTTP, reintento exclusivo; T082 | confirmaciones.js:19–24 relee el correo tras una reclamación sin fila y devuelve enviado si el otro intento ya terminó. Regresión de servicio en confirmaciones.test.js:107–152 y HTTP en rutas.test.js:146–222. | Resuelto en código y respaldado por ejecución anterior; no reejecutado aquí. |
| CONV-002 | partial · MEDIUM           | FR-018/FR-019; S10–S13; correo recuperable; T083          | textoCorreo.js:73–93 identifica el intento y su previsión históricos; no afirma impago actual ni anuncia otro cobro. cuotas.test.js:589–644 cubre recuperación después del pago y de cancelación.                | Resuelto en código y respaldado por ejecución anterior; no reejecutado aquí. |

### CONV-001: resultado concurrente sin otro envío

La reclamación SQL de repositorio.js:806–817 solo admite pendiente/fallido o una reserva
vencida. Si el otro intento ya persistió enviado, el UPDATE no devuelve fila. La nueva
relectura distingue ese terminal y retorna enviado sin reclamar de nuevo ni llamar a SMTP.
Si la reserva sigue viva, permanece el 409 CORREO_EN_ENVIO; no se permite apropiársela.

La regresión controla el intercalado entre lectura y reclamación con PostgreSQL aislado,
espera la terminación del primer intento y usa la reclamación SQL real. La variante HTTP
usa permiso y CSRF válidos y exige 200/enviado, una llamada SMTP, contador de intento 1,
Checkout sin llamadas adicionales y aportación/operación sin cambios. El caso previo de
reserva viva y el de protección frente a un intento antiguo siguen presentes.

La relectura no modifica autorización ni estados financieros. servicio.js:298–303
autoriza antes de enviar y exige cobro confirmado; controlador.js valida origen/CSRF.
No se obtiene acceso por referencia, UUID o correo coincidente. La deducción está acotada
al estado observado en esa lectura, sin prometer una vista atómica perpetua entre procesos.

### CONV-002: recuperación conservando el aviso histórico

El resumen persistido y la notificación lógica no cambian. El formateador puro presenta
«En el intento al que se refiere este aviso…», «Previsión comunicada en aquel momento»
y «No determina el estado actual de la cuota ni anuncia un nuevo cobro». Se conserva el
aviso; no se introduce supresión, un estado nuevo o una política de cobro.

Las dos variantes de cuotas.test.js generan un aviso fallido, pagan la misma factura o
cancelan la suscripción y vuelven a procesar el evento sintético original. Exigen el mismo
ID/resumen, paso a enviado con intento 2, confirmaciones y filas financieras idénticas,
ningún nuevo Checkout y ninguna llamada SMTP adicional en la siguiente reentrega.
textoCorreo.test.js contrasta también etiquetas y contenido. No son entregas reales de
Stripe o SMTP. El texto de confirmación y los permisos no se alteran.

## Brecha nueva accionable

| ID       | Tipo    | Gravedad | Trazabilidad                                                                                        | Evidencia concreta                                                                                                                                                                                                                                                                                                                                      | Recomendación y tarea                                                                                                                                                                            |
| -------- | ------- | -------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CONV-003 | partial | LOW      | Plan: documentación vigente y evidencias; T081; constitución III, coherencia documental al terminar | data-model.md:11 afirma «No se ha creado ni aplicado ninguna migración», aunque existen 004/009 y validaciones de ambas. spec.md:153 presenta P-05 «aún sin comprobar» y :183–184 sitúa implementación/preparación como futuras. pasarela-stripe.md:204 sigue diciendo que implementación y revisión están pendientes, mezclando dos estados distintos. | Actualizar solo esas afirmaciones de estado o identificarlas explícitamente como antecedentes de la fase de diseño; enlazar evidencias vigentes y conservar la revisión externa pendiente. T084. |

Es una incoherencia de estado documental, no una nueva brecha de dinero, permisos,
compatibilidad de Stripe o esquema. Su contraste no exige repetir pagos, suites ni
migraciones. La evidencia contraria está en los archivos SQL, el código inspeccionado y
los informes validacion-004-01.md, validacion-local-01.md, preparacion-stripe-01.md y
validacion-stripe-01.md. La propia definición de data-model.md remite al modelo común,
pero esa frase absoluta no está marcada como estado histórico y contradice el estado
actual del plan/README. Se agrupan las tres manifestaciones en una sola tarea pequeña.

No se considera que el marcador Draft, por sí solo, pruebe un defecto funcional. Tampoco
se convierten en defectos los relatos parciales fechados que después registran su cierre,
ni las reservas expresas de revisión externa. No se modifica ahora ningún artefacto para
resolver CONV-003 ni se altera el contenido de las fases anteriores de tasks.md.

## Cobertura funcional contrastada

Los alias A1–A11, M1–M3 y R1–R5 remiten a las fuentes identificadas en la
[matriz vigente](matriz-validacion-01.md). Se inspeccionan los caminos de implementación
y las aserciones relevantes; una marca de tarea o una fila de matriz no se usa como
prueba de ejecución. El resultado siguiente conserva el alcance de esas fuentes.

| Requisito | Implementación contrastada                                      | Evidencia existente y resultado                                                           |
| --------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| FR-001    | FormDonacion, controlador, prepararSesionPago y alta            | A2/A7/A9 y R3: tres periodicidades y puntual. Sin nueva brecha funcional identificada.    |
| FR-002    | normalizarImporte, validación de formulario y CHECK SQL         | A1/A2: céntimos seguros, rango y dos decimales. Límite propio de la aplicación.           |
| FR-003    | preparar e identidad de destino, DTO y resumen                  | A2/A8, R1: proyecto activo o fondo general; sin reasignación silenciosa.                  |
| FR-004    | normalizarDonante/normalizarNifNie y esquema estricto           | A1/A2/M1: obligatorios, correo y letra de control; sin datos de tarjeta.                  |
| FR-005    | Envoltura Stripe, snapshot y Checkout alojado                   | A9/T074/R1–R3: tarjeta/EUR; proyecciones sin datos de tarjeta.                            |
| FR-006    | guardarPago, guardarSesionEvento, aplicarFactura                | A4/A7: canónicos, rechazo recuperable y confirmación conservada.                          |
| FR-007    | crearCorreo, confirmaciones y ResultadoDonacion                 | A3/A6/A8/M3/R1–R5: fallo SMTP separado del cobro; CONV-001 resuelto.                      |
| FR-008    | confirmarCuota, CIERRES, calcularPrevision y Suscripcion        | A7/M2/R3: alta tras pago, cancelación externa y previsión; sin edición/baja local.        |
| FR-009    | insertarCuota, cuotaDeFactura y reconciliación inicial          | A7: cuota por Invoice, inicial reutilizada; ciclos simulados, no renovación Stripe real.  |
| FR-010    | Exclusiones y claves únicas de pago/factura/evento              | A4/A7/R2/R3: cardinalidad y reentregas; simulación no prueba idempotencia externa.        |
| FR-011    | Creación pública con sesión de operación, sin requiereRol       | A2/A3/M1/R1: sin cuenta; HU-02 no implementada por extensión.                             |
| FR-012    | reintentarCorreo y reserva por intento                          | A3/A6/M3/A11: respuesta real, misma aportación/resumen y ningún cobro; CONV-001 resuelto. |
| FR-013    | Entradas visibles, VincularDonante, emitir/consumirVerificacion | A2/A3/M1/M3/R1: hash, cuenta solicitante, caducidad y consumo atómico.                    |
| FR-014    | identidad con bloqueo ordenado NIF/correo                       | A2: conflicto genérico antes de Stripe, sin mezcla ni exposición.                         |
| FR-015    | Comparación normalizada sin UPDATE de datos fiscales            | A1/A2/A10/M3: equivalencias y tres cambios reales con cuenta vinculada.                   |
| FR-016    | autorizacion.js y propiedad consultada en servidor              | A3/A5: ocho horas absolutas, A/B, BIGINT textual y 404 genérico.                          |
| FR-017    | app.js raw antes de sesión/JSON y webhook independiente         | A3/A4/R2: primera confirmación local tras cierre de páginas, sin sesión del cliente.      |
| FR-018    | aplicarFactura, cancelación canónica y avisos por tipo          | A7/A11/M2, R3 parcial: fallo no suma/cancela por sí solo; CONV-002 resuelto.              |
| FR-019    | calcularPrevision, resultado y texto histórico                  | A7/A11/M2: fecha futura canónica o null, sin meses calculados; CONV-002 resuelto.         |

| Criterio | Evidencia contrastada                                                                    | Límite conservado                                                                       |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| SC-001   | R5 y medicion-puntual-02.md: 61 s medidos con cronómetro.                                   | Una ejecución, sin reconstruir t0/t1; R4 conserva 480,836 s fallidos.                   |
| SC-002   | R1–R5: se acredita 7/7 confirmaciones recibidas por referencia, aportaciones 30–36. | Conjunto manual delimitado, no auditoría global. SMTP aceptado no equivale a recepción. |
| SC-003   | T074, esquema, DTOs y proyecciones del adaptador.                                        | Inspección previa conservada; no nueva auditoría de bases, logs o infraestructura.      |
| SC-004   | R1/R3/R5 y A1/A8/A9: céntimos, base, pantalla y mensajes según cada fuente.              | No se inventan capturas o cotejos visuales nuevos.                                      |

### Los 34 escenarios

| Escenario | Camino y fuentes contrastados                            | Resultado y límite relevante                                                            |
| --------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| P01       | Creación/resumen puntual; A3/A4/A8, R2/R4/R5             | Cubierto en el alcance registrado; duración de R5 no universal.                         |
| P02       | Proyecto activo y resumen; A2/A8/R1                      | Destino Agua potable acreditado.                                                        |
| P03       | Importe inválido; A1/A2/A3/M1                            | Bloqueo antes de pasarela y error de campo.                                             |
| P04       | NIF/NIE; A1/M1                                           | Letra/formato y presentación de validación.                                             |
| P05       | Rechazo, motivo, recuperación y cancel_url; A2/A4/A10/M3 | Retorno no cambia por sí solo dinero.                                                   |
| P06       | Contenido y recepción; A8/M1/R1–R5                       | Recepción limitada al conjunto documentado.                                             |
| P07       | Creación sin cuenta; A3/M1/R1                            | No se atribuye a otras ejecuciones un invitado no observado.                            |
| P08       | SMTP fallido y resumen/aviso; A3/A4/A10/M3               | Dinero confirmado conservado.                                                           |
| P09       | Reintento satisfactorio; A3/A6/M1/A11                    | CONV-001 resuelto también en intercalado HTTP.                                          |
| P10       | Segundo fallo y opción visible; A6/A10/M3                | Sin éxito falso ni otro cobro.                                                          |
| P11       | Ambas entradas y solicitud explícita; A3/M1/M3/R1        | Coincidencia de correo no vincula.                                                      |
| P12       | Solicitud, correo y confirmación; A2/A3/M1/R1            | GET no consume, cuenta/caducidad/uso único.                                             |
| P13       | Correo de otro NIF; A2/T074                              | Conflicto genérico antes de Stripe.                                                     |
| P14       | Reutilización; A2                                        | Sin duplicar ni sobrescribir Donante.                                                   |
| P15       | NIF con otro correo; A2                                  | Rechazo sin mostrar datos existentes.                                                   |
| P16       | Cambio real con cuenta vinculada; A1/A2/A10/M3           | Tres campos contrastados, sin actualización ni Checkout.                                |
| P17       | NFC, espacios y mayúsculas; A1/A2                        | Conservación de tildes, puntuación y particularidades del correo.                       |
| P18       | Permiso de operación y correo; A3/A5/M1                  | Alcance por referencia, sin cuotas futuras.                                             |
| P19       | Referencia sin permiso y vencimiento; A3/A5/M1/R1        | 404 genérico; sin recuperación invitada en v1.                                          |
| P20       | Sesiones A/B y propiedad; A3/A5/M1                       | Sin acceso ajeno ni historial por extensión.                                            |
| P21       | Webhook sin sesión y primera transición; A3/A4/R2        | Aportación 31 pendiente antes del cierre; no afirmar cierre total de Firefox.           |
| S01       | Alta y periodicidades; A2/A7/A8/M2/R3                    | Tres primeras facturas reales; no ciclos reales.                                        |
| S02       | Invoice de ciclo y recuperación inicial; A3/A7           | PostgreSQL real de pruebas, recursos Stripe simulados.                                  |
| S03       | Primer rechazo y cierre; A7                              | Sin primer rechazo real de Stripe acreditado.                                           |
| S04       | Alta sin cuenta; A2/A3/M2                                | Cubierto localmente, no alta Stripe invitada observada.                                 |
| S05       | Alta activa con SMTP fallido; A3/A10/M3                  | Resumen, periodicidad, previsión y aviso visibles.                                      |
| S06       | Correo de cuota y permisos; A3/M1/A11                    | Mismo servicio corregido; permiso inicial no autoriza ciclo.                            |
| S07       | Conflicto correo/NIF en alta; A2                         | Sin nuevas filas o llamada a Stripe.                                                    |
| S08       | Datos fiscales distintos en alta; A2                     | Inmutabilidad, incluso con cuenta identificada.                                         |
| S09       | Primera cuota sin retorno; A3/A7                         | Servicio/PG sin autorización de navegador; no recorrido real completo de socio cerrado. |
| S10       | Fallo posterior, aviso y suma; A7/A8/A11/M2              | CONV-002 resuelto; fallo real de ciclo no ejecutado.                                    |
| S11       | Próxima fecha canónica; A7/A11/M2                        | Previsión actual separada de la histórica del correo.                                   |
| S12       | Fecha ausente, pasada o vencida; A7/A11/M2               | null/Pendiente de confirmación; sin espera real hasta vencimiento.                      |
| S13       | Fallo, cancelación y conservación; A7/A11/M2/R3 parcial  | R3 canceló tras éxito, no tras fallo; secuencia exigida cubierta con simulación.        |

No se deduce una integración real de las filas A/M. Las limitaciones anteriores no
introducen una exigencia de 34 pagos Stripe ni invalidan T079/T080 por defecto. Las
cuatro regresiones nuevas de correo amplían casos concretos, sin sustituir la evidencia
de interfaz y recepción real conservada para los demás escenarios.

## Decisiones técnicas y constitución

| Decisión revisada                    | Contraste actual                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| D01 · P-04 y R-03                    | EUR/tarjeta/rango, normalización y céntimos en servidor/formulario/esquema.                                                     |
| D02 · P-01 y modelo único            | Tres tablas de dominio y cuatro técnicas; SQL 004/009 y migrador por nombre. Falta documental CONV-003, no otro esquema.        |
| D03 · Creación e incertidumbre       | Instantánea/clave invariables; exclusión por conexión, guardado de sesión previo y plazo fijo de 23 horas con reloj PostgreSQL. |
| D04 · P-02 y compatibilidad limitada | API acacia, solo avisos acacia/endive enumerados; factura por ID y subscription de consulta canónica, no del snapshot.          |
| D05 · R-05 y permisos                | Ocho horas absolutas, origen/CSRF de navegador, propiedad en servidor y webhook separado.                                       |
| D06 · Vínculo                        | Hash, treinta minutos, cuenta solicitante y transacción de consumo/vínculo; auth común intacta.                                 |
| D07 · P-03/R-07 y recuperación       | Reserva de treinta segundos, renovación de diez segundos y contador de intento; enviado terminal. CONV-001/002 resueltos.       |
| D08 · R-06 y cuotas                  | Factura inicial reutilizada, ciclo único, canónico tras fallo y cancelación sin reactivar ni iniciar cobros propios.            |
| D09 · Presentación                   | Componentes comunes, importes exactos, fechas Europe/Madrid y distinción de resumen histórico/previsión actual.                 |
| D10 · Validación y P-05              | Guardas de ong_test_hu01/esquemas; simulación separada de Stripe de pruebas; preparación y controles externos documentados.     |

Se contrastan los doce principios constitucionales: I–II, simplicidad y alcance de HU-01;
III, verificabilidad y coherencia documental, con la reserva CONV-003; IV, español,
euros y fechas; V–VI, autorización en servidor, Checkout alojado y conservación financiera;
VII–IX, pila, capas, reutilización y modelo único; X, responsable/revisor y rama; XI–XII,
revisión e incorporación de cambios comunes aún sujetas a los controles de incorporación. No se identifica
otra infracción en el código inspeccionado ni se certifica seguridad absoluta mediante
esta lectura. La aprobación externa no se sustituye por converge.

## Comprobaciones y procedencia

### Realizadas en este diagnóstico

- Lectura de rama, HEAD y estado; resolución PathsOnly y existencia de los tres artefactos.
- Lectura de constitución, convenciones, plan/modelo comunes, spec, plan, tareas, contratos,
  uso del modelo, quickstart, paquete de revisión y fuentes de validación referenciadas.
- Inspección estática de donaciones, autorización, normalización, textos, controladores,
  rutas, registro raw, adaptadores y componentes de formulario/resultado/vínculo.
- Lectura de aserciones de regresiones de correo y caminos financieros/identidad/sesión;
  contraste de matriz y criterios de T079/T080, sin repetir sus ejecuciones.
- Comprobación de IDs: 83 tareas únicas, todas marcadas antes de esta adición; siguiente
  ID libre T084 y siguiente fase Phase 7. No se toma ese número como prueba funcional.

### Resultados previos consultados, no ejecutados de nuevo

| Fuente                                    | Resultado registrado                                                 | Alcance                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| validacion-converge-01.md                 | Cuatro fallos iniciales; después 83/83 y 21/21 en otra ejecución.   | PostgreSQL aislado y Stripe/SMTP simulados; cierres CONV-001/002.                                         |
| Matriz y validacion-stripe-01.md          | Regresión de donaciones 367/367; repetición comunicada en el registro de ejecución.  | Otra fecha/alcance; no suite de este converge ni suma con las anteriores.                                 |
| validacion-local-g1-g3-01.md              | 17/17 dirigidas y recorrido de interfaz del banco aislado.           | Seis huecos G1–G3, con persistencia y pasarela/SMTP simulados.                                            |
| validacion-local-01.md, T073/T074         | Regresión/compilación y revisión de datos, sesión y registros.       | Pruebas ajenas omitidas identificadas allí; observaciones de registros comunes conservadas para revisión. |
| Stripe, mediciones e inventario de correo | Puntuales, P21, tres altas/reentregas/cancelación anual; 61 s y 7/7. | Observaciones de observación y consulta registradas y comprobaciones anteriores atribuidas en sus informes, no de esta sesión.     |

No se ejecutan pruebas funcionales, compilación, consultas a PostgreSQL, Stripe o Mailpit,
pagos, reenvíos, navegador, servicios o consultas de ramas publicadas. Tampoco se cambia
configuración, SQL, código o documentación vigente para corregir el hallazgo nuevo.

## Métricas y tareas derivadas

| Métrica                                             | Resultado                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Requisitos funcionales                              | 19: FR-001–FR-019.                                                |
| Criterios de éxito                                  | 4: SC-001–SC-004.                                                 |
| Escenarios                                          | 34: P01–P21/S01–S13.                                              |
| Inventario FR/SC/escenarios                         | 57 elementos con el alcance de evidencia indicado.                |
| Decisiones técnicas / principios                    | 10 / 12.                                                          |
| Hallazgos anteriores                                | 2 resueltos: CONV-001 y CONV-002.                                 |
| Hallazgos nuevos                                    | 1 documental: missing 0, partial 1, contradicts 0, unrequested 0. |
| Gravedad nueva                                      | CRITICAL 0; HIGH 0; MEDIUM 0; LOW 1.                              |
| Tareas anteriores                                   | T001–T083, sin modificación.                                      |
| Tarea añadida                                       | T084, sin marcar, Phase 7: Convergence.                           |
| Nuevas ejecuciones funcionales o consultas externas | 0.                                                                |

## Resultado técnico y controles externos separados

**Desarrollo funcional y verificación:** CONV-001/002 quedan cerrados en su alcance
demostrado. No se propone otra implementación o prueba funcional por las rutas revisadas.
Sin embargo, **no procede declarar todavía el cierre técnico completo** de HU-01:
CONV-003 deja documentación vigente contradictoria con lo implementado y comprobado.
Es el único trabajo nuevo identificado; no se utiliza la revisión externa para bloquear
ese cierre. Tras T084 corresponde un contraste documental de converge, sin repetir
pagos/suites si no aparecen cambios que lo justifiquen.

**Revisión e incorporación:** continúan pendientes y no se presentan como realizadas:

| Control | Condición pendiente                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| el control de revisión  | Revisión/aprobación reales de Rubén del paquete 004/P-01–P-03/incremento completo, observaciones resueltas y coordinación común aplicable antes de main. |
| el control de integración  | Explicar 009 en la PR, comprobar el destino de integración actualizado y resolver conflictos, considerando entornos donde el nombre ya está aplicado.    |

T006 acredita paquete preparado y T007 la comprobación/elección local registrada en
ajuste-flujo-01.md: nueve ramas/seis commits, consulta del 2026-11-07T05:24:01.3676404Z,
sin 009 en las cabezas enumeradas. Este converge no vuelve a consultar GitHub ni convierte
aquella ausencia en disponibilidad actual garantizada o numeración de la migración. No descarta
trabajo sin publicar. Un eventual renombrado requiere tratar el registro de nombres
aplicados; no basta renombrar y ejecutar de nuevo.

Los controles de incorporación no impiden preparar/abrir una PR ni terminar el trabajo técnico
en la rama; sí condicionan main. Este diagnóstico no publica PR, no envía mensajes y no
declara aprobación externa, incorporación o historia terminada.

## Siguiente bloque propuesto y parada

Corregir únicamente T084: actualizar las afirmaciones de estado en spec.md, data-model.md
y contracts/pasarela-stripe.md, conservando requisitos, datos, contratos, históricos,
límites reales y controles externos. Comprobar referencias/formato y registrar la evidencia
documental; ninguna suite o prueba real nueva es necesaria por ese cambio de redacción.
No se implementa esa corrección durante este converge.

La entrega se limita a este informe y al apéndice de tasks.md. Se detiene para revisión,
sin git add, commit, push, merge, cambios de rama, pagos, reenvíos o comunicaciones externas.

## Comprobación documental final

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.