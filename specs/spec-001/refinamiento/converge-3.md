# Tercer informe de converge — HU-01

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD comprobado:** ba1410d.

**Responsable:** Nada · **Revisor externo:** Rubén, revisión y aprobación pendientes.

**Resultado:** `converged`. La implementación satisface la especificación, el plan y las
tareas en el alcance de HU-01 v1 y con los límites de evidencia descritos a continuación.
CONV-001, CONV-002 y CONV-003 quedan resueltos. No se identifican brechas accionables
nuevas. **El desarrollo y la verificación técnica pueden darse por terminados en esta
rama.** Esto no acredita aprobación externa, publicación ni incorporación a main.

## Procedimiento y estado inicial

Se aplica la definición local de
[speckit-converge](../../../.claude/skills/speckit-converge/SKILL.md), al no existir una
herramienta registrada con esa invocación en esta sesión. Se conserva la adaptación de
[preparacion-converge-01.md](preparacion-converge-01.md) y prevalece el
[ajuste posterior del flujo](ajuste-flujo-01.md): T006/T007 acreditan preparación técnica;
PR-R01/PR-R02 son controles pendientes antes de main, sin bloquear el cierre técnico.

La comprobación inicial confirma spec-001 y el commit local **ba1410d**, «HU-01: alinea el
estado documental y completa T084». T084 y su informe de validación están registrados,
no son cambios pendientes de la sesión anterior. Solo `.claude/launch.json` está sin
seguimiento. No se consulta ni se presupone la publicación de los commits locales.

Desde la raíz se ejecuta exclusivamente la resolución de selección sin persistencia:

```powershell
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

Resuelve specs/spec-001. Se comprueba además la existencia de spec.md, plan.md y tasks.md,
porque PathsOnly no realiza esa validación. Se lee `.specify/extensions.yml`, sin hooks
before_converge/after_converge registrados. No se ejecutan hooks de Git ni agentes.
La salvaguarda de Git no se utiliza para deducir requisitos por diferencias entre ramas.

converge-3.md no existía al comenzar. Se autoriza su creación como evidencia adicional
del procedimiento; las tareas no necesitan nuevas adiciones y se conservan íntegramente.

## Cierre de los hallazgos anteriores

Los identificadores y la gravedad originales se conservan para trazabilidad. Las filas
siguientes son cierres, no hallazgos activos ni nuevas tareas.

| Hallazgo / tarea | Gravedad original y origen                          | Evidencia contrastada en el estado actual                                                                                                                                                                  | Resultado                                                                      |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| CONV-001 / T082  | MEDIUM; FR-012, P09/S06, contrato HTTP              | confirmaciones.js:19–24 relee enviado tras perder la reclamación; repositorio.js:806–842 conserva reserva y protección por intento. Regresiones en confirmaciones.test.js:107–152 y rutas.test.js:146–222. | Resuelto. Terminal enviado diferenciado de reserva viva sin otro SMTP o cobro. |
| CONV-002 / T083  | MEDIUM; FR-018/FR-019, S10–S13                      | textoCorreo.js:73–93 presenta intento/previsión históricos. cuotas.test.js:589–644 recupera el aviso después de pago o cancelación y comprueba resumen, cuotas, suscripción y confirmaciones conservados.  | Resuelto. No se comunica el fallo antiguo como impago o previsión actuales.    |
| CONV-003 / T084  | LOW; documentación vigente, T081 y constitución III | data-model.md:4–15/70–80, spec.md:151–155/181–189 y pasarela-stripe.md:200–209 enlazan implementación, migraciones y P-05 con sus evidencias; mantienen revisión/incorporación pendientes.                 | Resuelto documentalmente en ba1410d; validación de T084 registrada.            |

Para CONV-001/CONV-002 se consultan las aserciones y el registro
[validacion-converge-01.md](validacion-converge-01.md): cuatro regresiones iniciales
fallidas, después **83/83** en cuatro archivos y **21/21** de eventos en otra ejecución.
Se mantienen como ejecuciones previas con PostgreSQL aislado y Stripe/SMTP simulados.
No se repiten ni se presentan como una nueva suite global o como correo real recibido.

Para CONV-003 se verifica el contenido actual de los tres documentos y
[validacion-documental-01.md](validacion-documental-01.md). Ya no aparecen las cuatro
afirmaciones obsoletas identificadas en converge-2.md. 004/009 se describen como existentes
y validadas localmente; P-05 remite a T075–T076 y los recorridos reales a su informe.
La transición rechazo→éxito se distingue de la revisión de Rubén todavía pendiente.
Los enlaces a esas fuentes existen. No se extiende la evidencia local a publicación,
aprobación, todos los entornos o todos los recorridos reales de Stripe.

Las notas fechadas de los informes y los estados de fases anteriores siguen siendo
evidencia histórica. Las menciones al converge posterior en los documentos preparatorios
no invalidan el resultado de esta ejecución: este informe registra ese contraste, sin
reescribir las evidencias que lo preceden.

## Contraste técnico vigente

La intención procede de spec.md, plan.md y tasks.md, gobernados por la constitución.
Los tres contratos, research, el modelo único, quickstart y la matriz de validación
aclaran el diseño y sus fuentes, sin introducir prestaciones nuevas.

| Área y trazabilidad                 | Implementación y evidencia contrastadas                                                                                                                                          | Balance                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| FR-001/FR-002/FR-005; P01/P03, S01  | FormDonacion, controlador, normalizacion y envoltura Stripe: tarjeta/EUR, una línea, 1,00–999.999,99 €, céntimos seguros y recurrencias mensual/trimestral/anual. A1/A2/A9 y R3. | Sin brecha nueva; máximo propio de la aplicación.                                                                     |
| FR-003/FR-004; P02/P04              | Proyecto activo y fondo general en preparar; datos mínimos, NIF/NIE con letra y correo en normalizacion. A1/A2/A8/M1/R1.                                                         | Destino y validación coherentes.                                                                                      |
| FR-006/FR-010; P05/P21, S02/S03/S09 | guardarPago, guardarSesionEvento, aplicarFactura y confirmarCuota: consulta canónica, referencia conservada, claves únicas y eventos atómicos. A4/A7 y R2/R3.                    | Confirmadas no retroceden; retorno no modifica dinero; webhook independiente del cliente.                             |
| FR-007/FR-012; P06/P08–P10, S05/S06 | crearCorreo, reserva por intento, confirmaciones, DTO y ResultadoDonacion. A3/A6/A8/A10/A11/M1/M3 y correos R1–R5.                                                               | Fallo SMTP separado del pago; reintento exclusivo y resultado real; CONV-001 resuelto.                                |
| FR-008/FR-009; S01–S03              | Factura inicial reutilizada, cuota única por Invoice, activación solo tras pago y sin cierre definitivo. A7; primeras facturas R3.                                               | Sin segunda primera cuota ni activación por Checkout solo.                                                            |
| FR-011/FR-013; P07/P11/P12, S04     | Creación pública con sesión de operación; dos entradas visibles, FormEntrar reutilizado y vínculo por hash/cuenta/caducidad/consumo atómico. A2/A3/M1/M3/R1.                     | No se vincula por correo coincidente; no cambia auth común ni se implementa HU-02.                                    |
| FR-014/FR-015; P13–P17, S07/S08     | identidad serializa NIF/correo; normalización NFC/espacios/mayúsculas y comparación sin sobrescribir. A1/A2/A10/M3.                                                              | Conflictos antes de Stripe; cuenta vinculada no habilita edición fiscal.                                              |
| FR-016; P18–P20, S06                | autorizacion y consultas de propietario en servidor; BIGINT textual, permiso por referencia, ocho horas absolutas y 404 genérico. A3/A5/M1/R1.                                   | Referencia, UUID, correo y sesión de otra operación no conceden acceso.                                               |
| FR-017; P21/S09                     | app.js:21 registra raw/webhook antes de JSON y sesión; controlador exige firma, no CSRF de navegador. A3/A4 y R2.                                                                | Procesamiento sin retorno ni permiso invitado vigente; acceso posterior sigue autorizado.                             |
| FR-018/FR-019; S10–S13              | calcularPrevision, reconciliación, CIERRES, resultado y aviso histórico. A7/A11/M2; R3 parcial.                                                                                  | Fallo no suma/cancela por sí solo; cancelación válida sí se procesa; fecha canónica futura o null; CONV-002 resuelto. |

Las fuentes A/M/R son las identificadas por la
[matriz vigente de 34 escenarios](matriz-validacion-01.md). Se contrastan las condiciones
y caminos que respaldan cada grupo; ni las marcas de tareas ni los totales de pruebas
se toman por sí solos como demostración de cumplimiento.

### Cobertura de escenarios y criterios de éxito

| Escenarios | Evidencia conservada y límite principal                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P01–P04    | Validación/resumen/destino en A1/A2/A3/A8/A9/M1; pagos R1/R2/R4/R5 según su alcance.                                                                               |
| P05–P10    | Estados y recuperación A2/A4/A6/A10/A11, interfaz M1/M3 y confirmaciones recibidas R1–R5. cancel_url no es una cancelación financiera.                             |
| P11–P17    | Vínculo e identidad A1/A2/A3/A10/M1/M3/R1; entradas recorridas sin solicitar enlaces innecesarios.                                                                 |
| P18–P21    | Autorización A3/A5 y webhook A3/A4; denegación R1 y primera transición real P21 en R2, no solo una reentrega sobre confirmada.                                     |
| S01–S04    | A2/A3/A7/A9/M2 y tres altas reales R3. S02/S03 y alta invitada S04 no se presentan como recorridos reales completos de Stripe.                                     |
| S05–S09    | A2/A3/A6/A7/A10/A11/M1/M2/M3: correo, permiso de ciclos, conflictos y ausencia de retorno. S09 conserva su comprobación local/simulada.                            |
| S10–S13    | A7/A8/A11/M2: fallo, previsión, cancelación posterior y avisos recuperados. R3 canceló después de un alta pagada; no prueba una cancelación real después de fallo. |

| Criterio | Evidencia y conclusión dentro del alcance comprobado                                                                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-001   | Nada observó **61 s** en la ejecución 2, desde antes de abrir el formulario hasta confirmación. Se conserva la ejecución 1 de **480,836 s**, fallida. Sin t0/t1 o capturas inventados, sin reconstrucción por timestamps y sin garantía universal de rendimiento. |
| SC-002   | El guía acredita **7/7 confirmaciones recibidas por referencia**, aportaciones 30–36, en Mailpit. Conjunto manual delimitado sin confirmaciones pendientes; no auditoría global. Semillas, avisos y vínculos excluidos.                                           |
| SC-003   | T074 y A9: esquema, datos/sesión/registros revisados y proyecciones sin tarjeta; Checkout alojado. No se realiza una nueva auditoría ni se atribuye comprobación absoluta de infraestructura.                                                                     |
| SC-004   | R1/R3/R5 y A1/A8/A9: correspondencia al céntimo entre pasarela, datos locales y resúmenes según cada fuente. No se inventan nuevos cotejos visuales.                                                                                                              |

Los cierres T079/T080 se mantienen con sus fuentes en
[medicion-puntual-02.md](medicion-puntual-02.md), sin repetir cronómetro ni ampliar el
inventario manual. La inspección de esta fase no convierte un SMTP true o un texto
simulado en recepción real. P21 conserva el cierre de páginas de aplicación/Checkout,
no un cierre de todos los procesos de Firefox.

### Decisiones del plan y constitución

Se contrastan diez decisiones del plan: D01, alcance de pago y normalización; D02,
modelo único y migraciones; D03, creación con exclusión/instantánea/plazo; D04, adaptador
Stripe y compatibilidad limitada; D05, permisos de ocho horas/origen/CSRF; D06, vínculo;
D07, correo recuperable; D08, ciclos/previsión/cancelación; D09, interfaz/fechas/importes;
D10, validación aislada y separación de evidencias. No se identifica trabajo pendiente
nuevo en ellas.

En particular, crear usa la misma instantánea/clave, guarda la sesión antes de la exclusión
y conserva el plazo no renovable de 23 horas con reloj PostgreSQL. Las consultas externas
no mantienen transacciones financieras abiertas. Los eventos permitidos acacia/endive
solo aportan el sobre/ID del recurso; factura y suscripción se acreditan mediante consultas
canónicas acacia, bajo la exclusión correspondiente. Se mantienen firma, modo, pertenencia,
importes, transacción corta e idempotencia. No se añaden cobros, cancelaciones o reembolsos
ordenados por la aplicación.

La constitución se contrasta en sus doce principios: I–II, simplicidad y alcance; III–IV,
verificabilidad, documentación y presentación española; V–VI, propiedad en servidor,
Checkout externo e historial conservado; VII–IX, pila, capas, reutilización y modelo único;
X, responsable/revisor y rama; XI–XII, revisión e incorporación común condicionadas por
los controles de PR. No se identifica una nueva infracción en el alcance inspeccionado.
La declaración técnica no sustituye la revisión exigida antes de main.

## Comprobaciones realizadas y límites

**Nuevas comprobaciones de esta fase:** lectura local de artefactos/código/aserciones;
resolución y existencia de spec/plan/tasks; identificación de commit y estado; contraste
de los cierres CONV-001–CONV-003 y búsqueda de afirmaciones obsoletas; comprobación de
enlaces locales; inventario de 84 tareas únicas, todas marcadas en su alcance vigente.

**Resultados previos consultados, no reejecutados:** regresión 367/367 comunicada por el
guía; G1–G3, 17/17 y observación de interfaz; T082–T083, 83/83 y 21/21 en ejecuciones
separadas; validaciones de migraciones, compilación y seguridad registradas; recorridos
Stripe/Mailpit y mediciones atribuidos a Nada y al guía en sus informes. No se suman como
una nueva suite ni se atribuyen a una ejecución de este converge.

**Sin nuevas ejecuciones funcionales o consultas externas:** no se ejecutan suites,
compilación, SQL, migraciones, navegador, servicios, pagos, reenvíos, consultas Stripe,
Mailpit o GitHub. No hay un cambio funcional o resultado nuevo que justifique repetirlas.

Se conservan estos límites conocidos, sin convertirlos en brechas nuevas o acuerdos:

- Renovaciones, primer rechazo, fallos posteriores, alta de socio invitada y ausencia de
  retorno de socio tienen evidencia local/simulada donde así consta; no se declara
  integración Stripe real completa para esas secuencias.
- La recuperación de acceso invitado perdido y la edición fiscal/cuota/baja local siguen
  fuera de v1. El vínculo de donaciones no recupera cuentas reservadas con correo ajeno.
- SMTP puede duplicar un mensaje físico si se acepta y el proceso cae antes de guardar;
  no duplica dinero. Sin un reintento autorizado, un correo puede quedar pendiente y
  SC-002 no se cumpliría en ese conjunto. No ocurre en el conjunto manual acreditado 30–36.
- spec.md/data-model.md conservan formato heredado no conforme íntegramente a Prettier,
  ya identificado en T084; no altera requisitos, enlaces o estado corregido, ni justifica
  otro ciclo de implementación. Los marcadores de plantilla no atribuyen aprobación.
- Las observaciones de registros comunes de T074 se conservan para revisión, sin afirmar
  una vulnerabilidad nueva que esta inspección no ha demostrado.

## Métricas y resultado

| Métrica                                           | Resultado                                               |
| ------------------------------------------------- | ------------------------------------------------------- |
| Requisitos funcionales contrastados               | 19: FR-001–FR-019.                                      |
| Criterios de éxito                                | 4: SC-001–SC-004, con el alcance de evidencia indicado. |
| Escenarios                                        | 34: P01–P21/S01–S13.                                    |
| Inventario FR/SC/escenarios                       | 57 elementos.                                           |
| Decisiones técnicas / principios constitucionales | 10 / 12.                                                |
| Hallazgos anteriores                              | CONV-001, CONV-002 y CONV-003 resueltos.                |
| Hallazgos nuevos por tipo                         | missing 0; partial 0; contradicts 0; unrequested 0.     |
| Hallazgos nuevos por gravedad                     | CRITICAL 0; HIGH 0; MEDIUM 0; LOW 0.                    |
| Tareas existentes / nuevas                        | 84 únicas, completadas en su alcance; 0 nuevas.         |
| Pruebas funcionales o consultas externas nuevas   | 0.                                                      |

**Convergencia técnica alcanzada.** No queda trabajo accionable identificado que impida
dar por terminados el desarrollo y la verificación técnica de HU-01 v1 en esta rama.
No se necesita otra pasada de implement para el alcance revisado. Se recomienda pasar
a la revisión del paquete y preparación de PR, sin que este informe la publique.

## Revisión externa e incorporación: controles pendientes

| Control | Estado y condición antes de main                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-R01  | Pendiente: revisión/aprobación reales de Rubén del paquete completo, incluidas 004/P-01–P-03, resolución de observaciones y coordinación común aplicable.       |
| PR-R02  | Pendiente: explicar la elección local de 009, actualizar el contraste frente al destino de integración y resolver conflictos considerando entornos ya migrados. |

T006/T007 permanecen completadas como preparación técnica, no como aprobaciones. La
consulta de nueve ramas/seis commits del 2026-11-07T05:24:01.3676404Z se conserva como
evidencia de T007, no como nueva comprobación de disponibilidad en este converge. No
descarta trabajo sin publicar ni reserva colectivamente 009. El migrador registra nombres:
un eventual renombrado debe contemplar los entornos donde ya se aplicó y no ejecutarse
ciegamente como otra migración.

Estos controles no bloquean el cierre técnico declarado; sí condicionan la incorporación
a main. No se atribuye acuerdo colectivo, aprobación de Rubén, publicación de cambios o PR
ni incorporación realizada. El cierre de toda la entrega compartida no se deduce de este
resultado técnico.

## Conservación y parada

Se crea únicamente este informe. tasks.md queda byte por byte intacto, sin fase vacía ni
renumeración. La comparación SHA-256 de los 264 archivos iniciales conserva constitución,
spec, plan, tareas, contratos, código, migraciones, selección, `.env`, `.claude/launch.json`
y todos los históricos, incluidos converge-1.md/converge-2.md y ambas mediciones.

Se comprueban formato del informe con Prettier local, enlaces y `git diff --check`, sin
instalaciones. No se modifica el índice; rama y HEAD iniciales se conservan. La parada se
produce tras el diagnóstico para revisión, antes de git add o commit, sin publicación,
comunicaciones externas, push, merge o cambios de rama.

**Commit propuesto, no ejecutado:** `HU-01: registra converge-3 y cierre técnico`.
