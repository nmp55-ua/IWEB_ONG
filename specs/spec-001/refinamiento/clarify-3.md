# Informe de clarify — HU-01 — Segunda ronda

**Fecha de inicio**: 2026-11-04
**Rama**: `spec-001`
**Responsable**: Nada
**Revisor**: Rubén (revisión pendiente)
**Estado**: Segunda ronda finalizada para revisión. PA1.6, PA1.7 y PA1.8 integradas; ocho decisiones funcionales registradas entre las dos rondas. Ajustes comunes pendientes, sin realizar. No se declara alineación integral del proyecto ni se avanza a plan.
**Respuestas confirmadas en esta ronda**: 3.
**Informes anteriores**: [clarify-1.md](clarify-1.md) y [clarify-2.md](clarify-2.md), conservados sin modificar.

## Procedimiento y alcance

Se sigue directamente `.claude/skills/speckit-clarify/SKILL.md`, equivalente a
`/speckit-clarify`, que no está registrado en este chat. Se inicia una nueva ronda a petición
expresa, limitada a resolver PA1.6, PA1.7 y PA1.8, con una pregunta cada vez. No se atribuyen
respuestas a las preguntas pendientes ni se amplía el alcance funcional por anticipado.

Se ha comprobado la rama `spec-001`. Hay cambios documentales de la ronda anterior bajo
`specs/spec-001/`, que se conservan. El comprobador
`check-prerequisites.ps1 -Json -PathsOnly`, con `SPECIFY_FEATURE_DIRECTORY=specs/spec-001`
solo en el entorno del proceso, resuelve correctamente la carpeta y `spec.md` sin guardar
configuración de selección de historia.

Se revisan constitución, convenciones, plan común, modelo de datos, especificación,
checklist e informe vigente de la ronda anterior. Los hooks opcionales de commit se omiten
según el alcance autorizado. No se cambia de rama, no se modifica documentación común ni
de otras historias, no se implementa y no se ejecuta plan.

Este informe se actualiza conforme se confirmen las respuestas, junto con la especificación.
Al iniciar la ronda se conservaron las cinco aclaraciones y los catorce requisitos de la
ronda anterior. Tras integrar PA1.6, PA1.7 y PA1.8 hay tres aclaraciones adicionales en la
segunda ronda y diecinueve requisitos. La reevaluación del checklist al final de esta ronda
queda en 16/16 en su dimensión documental, sin acreditar alineación de los documentos comunes
ni comportamiento implementado. No se añade edición de perfil ni recuperación de acceso
directo sin cuenta.

## PA1.6 — Datos de un Donante ya registrado

### Evidencia al formular la pregunta

La especificación distingue la reutilización de un Donante con NIF/NIE y correo
coincidentes del rechazo de correo existente con otro NIF/NIE (FR-014). Falta resolver
el caso inverso: NIF/NIE existente con otro correo, y la autorización para modificar
nombre, apellidos o dirección del Donante existente. Conocer el NIF/NIE no acredita por
sí solo la autorización para modificar sus datos.

El modelo común, sección `donantes`, establece NIF/NIE único y dice que, si ya existe,
se reutiliza al Donante y se actualizan sus datos, pero no delimita quién puede hacerlo.
La condición de actualización debe concretarse y coordinarse con ese texto. No se
modifica el modelo ni se interpreta su redacción como permiso para sobrescribir datos
desde cualquier formulario de donación.

### Pregunta y opciones presentadas

**Pregunta**: ¿Qué debe hacerse si una nueva aportación usa un NIF/NIE ya registrado, pero
otro correo o datos fiscales distintos? (PA1.6)

| Opción | Comportamiento propuesto |
|---|---|
| A | En v1 no se modifican el correo ni los datos fiscales existentes desde HU-01. Ante diferencias se detiene la operación antes del pago y se pide revisar los datos, sin mostrar los datos guardados, sobrescribirlos ni crear otro Donante. Las correcciones quedan fuera de esta versión. |
| B | Se permite corregir los datos durante la nueva aportación solo al titular con autorización acreditada; deben definirse expresamente esa autorización y las condiciones del cambio de correo. Amplía el comportamiento de HU-01 y no se da por decidido. |

**Recomendación formulada antes de la respuesta**: A, por mantener el alcance de v1 centrado en
donaciones y altas, preservar el Donante existente y resolver el conflicto sin incorporar
un flujo de modificación de datos.

**Respuesta confirmada**: Opción A. En v1, HU-01 no permite modificar el correo, nombre,
apellidos ni dirección de un Donante existente. Si se presenta el mismo NIF/NIE con datos
realmente distintos, se detiene la operación antes del pago y se pide revisar los datos,
sin mostrar los guardados, sobrescribirlos ni crear otro Donante. Las correcciones quedan
fuera de v1. La regla se aplica también cuando existe una cuenta identificada o vinculada.

**Justificación de la decisión**: Preservar los datos existentes y mantener el alcance de
v1 sin un flujo de corrección o edición de perfil. Se recoge expresamente la limitación
aceptada: una persona cuyos datos hayan cambiado no podrá usar los nuevos datos mediante
este flujo. Las diferencias meramente de formato se distinguen de los cambios reales;
el tratamiento concreto se definirá en plan.

**Historia afectada**: HU-01; reutilización del Donante y validación anterior al pago.
**Dependencias**: HU-02, HU-03 y HU-04 consumen los datos y aportaciones del Donante.

### Integración y escenarios afectados

- Se registra una única respuesta de PA1.6 en `spec.md`, bajo la sesión de la ronda 2.
- FR-015 recoge la no modificación de datos, el rechazo anterior al pago, la conservación
  del Donante, la aplicación con o sin cuenta y la distinción funcional entre formato y
  cambios reales. FR-001 a FR-014 conservan sus identificadores y contenido.
- Donación puntual, escenario 14: se precisa que deben coincidir todos los datos fiscales,
  distinguiendo el formato de cambios reales, para reutilizar sin sobrescribir ni duplicar.
- Donación puntual, escenarios 15–17: mismo NIF/NIE con otro correo; cambios fiscales
  incluso con una cuenta vinculada; diferencias meramente de formato, respectivamente.
- Alta de socio, escenario 8: rechazo de cambios reales con el mismo NIF/NIE antes del pago.
- Se actualizan el caso límite de identificación y la dependencia del modelo común; se
  registra la limitación aceptada y se retira PA1.6 de las preguntas abiertas.
- No se introduce un formulario de perfil, una autorización de edición ni un procedimiento
  de corrección fuera de HU-01.

### Separación respecto de plan

La decisión funcional ya fija que HU-01 no autoriza cambios reales de datos existentes
en v1 y que una discrepancia real detiene la operación antes del pago. El método técnico
de comparación y normalización de campos, las consultas, transacciones, rutas y pruebas
concretas corresponden a plan y tasks. No se eligen equivalencias concretas ni se
implementan en este paso.

### Ajuste común identificado, sin realizar

`specs/modelo-datos.md`, sección `donantes`, contiene: «Si se dona con un NIF/NIE que ya
existe, se reutiliza el Donante (y se actualizan sus datos)». Ese texto necesita precisar
que, en HU-01 v1, se reutiliza sin modificar correo, nombre, apellidos ni dirección; si
hay cambios reales se rechaza antes del pago y no se crea otro Donante. También debe
alinearse el flujo de creación o reutilización de `specs/plan-comun.md` §5.

La discrepancia se registra en `spec.md` y aquí. No se modifica ninguno de esos documentos,
no se altera una migración ni se impone una nueva restricción a la base de datos. No se
afirma que la actualización común o la revisión de Rubén ya se hayan realizado.

## PA1.7 — Acceso al resultado y al reintento del correo sin cuenta

**Estado**: Respuesta confirmada e integrada. La política de acceso y su límite en v1
quedan definidos; no se decide cómo construir la prueba técnica de autorización.

**Pregunta**: ¿Cómo debe acceder una persona sin cuenta al resultado de su pago y al
reintento del correo de confirmación? (PA1.7)

| Opción | Comportamiento propuesto |
|---|---|
| A | Acceso únicamente desde el mismo navegador que inició el pago, mientras siga vigente su sesión de esa operación. Conocer la referencia no basta. Si se pierde esa sesión, la recuperación de ese acceso sin cuenta queda fuera de v1. |
| B | El mismo acceso inicial de A y, además, recuperación desde otro navegador mediante un enlace privado enviado al correo de la aportación. Añade un flujo de recuperación que habría que definir. |

**Recomendación formulada antes de la respuesta**: A. Mantiene la confirmación inmediata y el
reintento cuando falla el correo, con una autorización limitada al navegador de origen,
sin añadir recuperación de acceso sin cuenta.

### Decisión, justificación y limitación

**Respuesta confirmada**: Opción A. Una persona sin cuenta consulta el resultado y reintenta
el correo únicamente desde la sesión vigente de la operación iniciada en ese navegador.
La autorización se limita a esa operación: no permite consultar otras aportaciones ni el
historial; conocer la referencia por sí solo no da acceso.

**Justificación**: Mantener la consulta inmediata y el reintento ante fallos del correo,
protegiendo el acceso a una operación concreta y evitando ampliar v1 con recuperación de
acceso directo sin cuenta. Se distingue la autorización para consultar del procesamiento
del pago, que no debe depender del navegador.

**Limitación aceptada**: Si la sesión se pierde o caduca, recuperar ese acceso directo sin
cuenta queda fuera de v1. No se cancela el pago ni se elimina la aportación por ese motivo.
La limitación tampoco convierte un correo pendiente en enviado ni cumple SC-002: se
conserva la exigencia de evidencia de envío satisfactorio.

**Condición confirmada sobre la pasarela**: Las notificaciones válidas deben procesarse
aunque se cierre el navegador o no se vuelva a la aplicación. La confirmación y registro
del cobro y, cuando corresponda, la activación del alta de socio no exigen una sesión
vigente del donante. Se conserva la idempotencia; no se confía en el retorno del navegador.

**Historia afectada**: HU-01, ambas modalidades, consulta del resultado y reintento del correo.
No se concede acceso al historial de HU-02 ni a cuotas posteriores por la autorización
del alta: son otras operaciones. No se modifica la documentación de HU-02.

### Integración y escenarios afectados

- Se registra una única aclaración de PA1.7 en la sesión de la ronda 2 y se retira de
  `Open Questions`; queda pendiente PA1.8.
- FR-016 fija el acceso permitido y denegado por operación y la limitación de recuperación.
- FR-017 separa el procesamiento de notificaciones de pasarela de la sesión del donante.
- FR-007 y FR-012 se precisan para aplicar la autorización a las consultas y los reintentos,
  manteniendo el envío de confirmación y el procesamiento del pago independientes de ella.
- Donación puntual, escenarios 9–10: los reintentos requieren autorización vigente.
- Donación puntual, escenarios 18–21: acceso permitido en la sesión de origen; denegación
  al conocer solo la referencia o perder la sesión; aislamiento de otras operaciones e
  historial; procesamiento de una notificación válida sin retorno ni sesión del navegador.
- Alta de socio, escenario 6: la autorización del alta no permite consultar cuotas posteriores.
  Escenario 9: el primer cobro puede confirmarse y activar el alta sin sesión ni retorno.
- Se actualizan el caso límite de cierre del navegador, la dependencia y la limitación de v1.

### Ajustes comunes identificados, sin realizar

`specs/plan-comun.md` §4, tabla de rutas de donaciones, clasifica la consulta de confirmación
como pública. Debe precisar que «sin cuenta» no significa «conocer la referencia basta»:
se exige la autorización vigente de la operación para consultar o reintentar el correo.
El §5 debe recoger este límite en la página de resultado, la ausencia de recuperación
directa sin cuenta y la independencia de las notificaciones válidas respecto del navegador.

El soporte común de sesiones existe en `backend/src/app.js`, pero no acredita por sí solo
autorización sobre una aportación concreta. La generación, conservación y protección de
esa prueba, su caducidad y las rutas concretas corresponden a plan. No se altera ahora
el contrato de sesión ni se añaden campos, tablas, variables o mecanismos técnicos.
Si el diseño necesita un cambio del modelo compartido, se identificará antes de realizarlo;
no se da por necesaria ni se aprueba una modificación estructural por anticipado.

No se aplican restricciones de sesión de donante al receptor de notificaciones de la
pasarela: estas conservan su propia validación. Los documentos y servicios comunes
permanecen sin modificar.

## PA1.8 — Fallo de una cuota posterior al primer cobro

**Estado**: Respuesta confirmada e integrada. La cuota no se considera pagada, el fallo
por sí solo no cancela la suscripción y se respeta una cancelación posterior válida de
la pasarela. Los eventos, identificadores y mecanismos concretos se dejan para plan.

**Pregunta**: ¿Qué debe ocurrir con la suscripción y la información del próximo cobro si
falla una cuota posterior al alta como socio? (PA1.8)

| Opción | Comportamiento propuesto |
|---|---|
| A | No dar de baja automáticamente por ese fallo: registrar el fallo sin contar la cuota como pagada, conservar la suscripción activa e informar del fallo. Mostrar como próximo cobro solo una fecha futura comunicada por la pasarela; si no la hay, indicar que está pendiente de confirmación. La aplicación no inicia un cobro adicional por su cuenta. |
| B | Dar de baja automáticamente la suscripción al primer fallo e informar de que no hay próximo cobro. Añade una regla de cancelación automática y requiere revisar su encaje con el modelo y el contrato de pasarela. |

**Recomendación formulada antes de la respuesta**: A, por conservar la continuidad de las cuotas
y dejar los cobros en la pasarela sin añadir cancelación automática en v1. No se decide
por anticipado cómo se registra el intento ni cómo se mapean eventos o estados técnicos.

### Decisión y justificación

**Respuesta confirmada**: Opción A, con precisión sobre la cancelación posterior:

- Se registra el fallo sin considerar pagada la cuota ni incrementar el total aportado.
- El fallo por sí solo no cancela la suscripción; no autoriza a ignorar una cancelación
  que comunique posteriormente la pasarela.
- Se informa del fallo conservando intactas las aportaciones anteriores.
- Solo se muestra una fecha futura de cobro comunicada por la pasarela. Si no existe,
  se muestra «Pendiente de confirmación».
- La aplicación no inicia cobros adicionales por su cuenta.

**Justificación**: Distinguir un fallo de cobro de una baja, preservar las cantidades
efectivamente aportadas y el historial anterior, y mantener la gestión de cobros y sus
fechas en la pasarela. La continuidad ante un fallo no permite desatender una cancelación
posterior válida. Esta precisión no introduce baja de socio desde la aplicación.

**Historia afectada**: HU-01, cobros periódicos posteriores al alta. La exclusión de importes
no pagados mantiene coherencia con los datos consumidos por HU-02, HU-03 y HU-04, sin
modificar sus especificaciones.

### Integración y escenarios afectados

- Se registra una única aclaración de PA1.8 en la ronda 2, conservando sus cinco respuestas
  anteriores en la primera ronda y las dos respuestas previas en esta ronda.
- FR-018 fija el registro y comunicación del fallo, su exclusión de los totales, la
  conservación de aportaciones anteriores y la continuidad salvo cancelación válida.
- FR-019 fija la fecha futura comunicada o «Pendiente de confirmación».
- FR-008 distingue la baja desde la aplicación de la cancelación comunicada por pasarela.
- Alta de socio, escenarios 10–13: fallo posterior sin sumar ni cancelar por sí solo;
  fecha futura comunicada; ausencia de fecha futura; cancelación posterior válida.
- Se añade el caso límite y la dependencia común. Se retira PA1.8 de preguntas abiertas:
  no quedan respuestas pendientes en PA1.1–PA1.8. No se añade un mecanismo de cobro propio.

### Ajustes comunes identificados, sin realizar

- `specs/plan-comun.md` §5: completar el comportamiento de una cuota posterior fallida,
  la información del fallo y del próximo cobro, la ausencia de cobro adicional iniciado
  por la aplicación y el procesamiento de una cancelación posterior válida.
- `specs/modelo-datos.md`, `suscripciones_socio`: la transición `activa → cancelada` se
  condiciona actualmente a una resolución favorable de PA1.1. Debe distinguir la baja
  desde la aplicación, fuera de v1, de una cancelación válida comunicada por la pasarela,
  que sí debe reflejarse según la decisión de PA1.8.
- En ese modelo, la regla de `fecha_proximo_cobro` debe alinearse con mostrar solo una
  fecha futura notificada o la ausencia de confirmación. No se presupone una columna nueva.
- El registro técnico del intento fallido y de un cobro confirmado posterior, su
  identificación e idempotencia deben diseñarse en plan respetando la unicidad del pago
  y las transiciones de `aportaciones`. Si el diseño requiere ajustar una transición o
  persistencia común, deberá identificarse y coordinarse antes de editarla. No se decide
  aquí que una aportación rechazada pase automáticamente a confirmada ni se crean estados.

Ninguno de esos documentos se modifica en esta ronda. No se atribuye una actualización
común realizada ni una revisión de Rubén completada.

## Balance de las ocho decisiones

| Identificador | Decisión funcional vigente | Requisitos y evidencia |
|---|---|---|
| PA1.1 | Modificar cuota y baja desde la aplicación fuera de v1; alta y cobros periódicos conservados. | FR-008 y FR-009; ronda 1. |
| PA1.2 | Donación puntual y alta de socio sin cuenta; historial privado con cuenta vinculada. | FR-011; donación puntual, escenario 7; socio, escenario 4. |
| PA1.3 | Enlace al correo antes de vincular aportaciones; comprobación limitada a donaciones. | FR-013; donación puntual, escenarios 11–12. |
| PA1.4 | Conservar pago ante fallo de correo y reintentar solo el envío; un aviso no es un envío satisfactorio. | FR-007 y FR-012; SC-002; donación puntual, escenarios 6 y 8–10; socio, escenarios 5–6. |
| PA1.5 | Correo existente con otro NIF/NIE: detener antes del pago sin revelar datos, modificar ni mezclar. | FR-014; donación puntual, escenario 13; socio, escenario 7. |
| PA1.6 | Datos existentes sin modificación desde HU-01; ante cambios reales, detener antes del pago. Formato equivalente se distingue en plan. | FR-015; donación puntual, escenarios 14–17; socio, escenario 8; limitación aceptada. |
| PA1.7 | Acceso sin cuenta limitado a la sesión vigente y a su operación; perderla no cancela el pago ni impide notificaciones válidas. | FR-016 y FR-017; donación puntual, escenarios 18–21; socio, escenario 9; limitación aceptada. |
| PA1.8 | Fallo posterior sin cuota pagada, suma ni cancelación por sí solo; respetar cancelación posterior válida y fecha comunicada, sin cobros propios. | FR-018 y FR-019; socio, escenarios 10–13. |

Las ocho decisiones tienen respuesta registrada. No se plantean nuevas preguntas
funcionales ni se presentan detalles técnicos pendientes como si fueran respuestas
funcionales todavía sin decidir.

## Pendientes que afectan al avance y detalles propios de plan

### Diferencias comunes que impiden aprobar un plan como plenamente alineado

El cierre de estas preguntas no elimina las diferencias con los documentos compartidos.
Para validar un plan como coherente con la constitución es necesario coordinar su
alineación, sin dar por aprobados ni realizados los cambios comunes:

| Documento | Alineación pendiente |
|---|---|
| `specs/plan-comun.md` §3 y `specs/modelo-datos.md`, `donantes.usuario_id` | Verificación de acceso al correo antes de vincular, limitada a donaciones (PA1.3). |
| `specs/modelo-datos.md`, reglas de Donante, y `specs/plan-comun.md` §5 | Rechazo de conflictos de correo/NIF, reutilización sin sobrescritura y correcciones fuera de v1 (PA1.5 y PA1.6). |
| `specs/plan-comun.md` §4 y §5 | Acceso sin cuenta autorizado por operación, referencia insuficiente, pérdida de acceso sin recuperación y procesamiento de pasarela independiente del navegador (PA1.7). |
| `specs/plan-comun.md` §5 y `specs/modelo-datos.md`, suscripciones | Fallo posterior, fecha del próximo cobro y distinción entre baja desde la aplicación y cancelación comunicada por pasarela (PA1.8). |

Estas son diferencias de coordinación y coherencia conocidas, no nuevas preguntas
funcionales PA1.1–PA1.8. La revisión de Rubén sigue pendiente. No se exige una nueva
funcionalidad ni una nueva respuesta solo para concretar un mecanismo técnico.

### Decisiones técnicas que pertenecen a plan

- Normalización y equivalencias de formato de correo, NIF/NIE, nombre, apellidos y dirección.
- Prueba de vinculación por enlace: generación, conservación, caducidad y protección.
- Autorización de la operación sin cuenta: asociación con la sesión, aislamiento y protección.
- Registro de resultados de correo y reintento, sin confundir intento, envío y recepción
  comprobada; conservar el objetivo de SC-002 sin prometer que un fallo permanente esté resuelto.
- Eventos concretos de la pasarela, identificación de intento y cobro, idempotencia,
  correspondencia de estados, próximo cobro y cancelación válida.
- Contratos detallados, posible persistencia, migraciones, transacciones y estrategia de pruebas.

Su concreción no requiere reabrir las decisiones funcionales salvo que revele una
incompatibilidad real con ellas. Si exige alterar contratos o estructuras comunes, se
identificará ese cambio para coordinación antes de realizarlo. No se diseñan ni implementan
esos mecanismos en este informe.

## Reevaluación del checklist y cobertura

El checklist se reevalúa contra el contenido funcional vigente de `spec.md`, no contra
una implementación ni como sustituto de analyze entre documentos.

**Resultado de esta ronda**: 13/16 → 16/16. Cambian únicamente tres marcas a completadas:

- `Requirements are testable and unambiguous`: las tres dudas de esta ronda tienen resultado
  funcional definido; lo diferido a plan es el mecanismo técnico.
- `All acceptance scenarios are defined`: se añaden los escenarios de cambios de datos,
  permisos por operación, pérdida de sesión y fallo posterior/cancelación.
- `All functional requirements have clear acceptance criteria`: los requisitos nuevos y
  los precisados tienen escenarios y limitaciones explícitos.

No quedan casillas desmarcadas ni regresiones nuevas. Las otras trece marcas y todo el
texto del checklist se conservan. Su nota heredada sobre preguntas abiertas no reabre
las ocho decisiones: `Open Questions` de `spec.md` indica que no quedan respuestas
pendientes en las rondas realizadas y conserva la remisión a las diferencias comunes.

16/16 significa calidad documental del alcance aclarado; no demuestra alineación común,
pruebas superadas, correo recibido, cobros correctos ni una historia implementada.

| Categoría de clarify | Estado al finalizar la ronda | Límite o evidencia |
|---|---|---|
| Alcance y comportamiento | Resuelto para las ocho decisiones | Correcciones, edición de cuota/baja y recuperación sin cuenta delimitadas fuera de v1. |
| Dominio y datos | Resuelto funcionalmente; alineación común pendiente | Identificación, no sobrescritura y vinculación definidas; no se modifican las entidades comunes. |
| Interacción y experiencia | Resuelto funcionalmente | Acceso permitido/denegado, aviso de fallo y fecha pendiente descritos. |
| Calidad no funcional | Claro; diseño y comprobación diferidos | Privacidad y resultados esperados definidos; rendimiento y funcionamiento sin probar. |
| Integraciones externas | Resuelto funcionalmente; diseño diferido | Fallo de correo, fallo de cuota, notificaciones y cancelación válidas; eventos concretos para plan. |
| Casos límite y fallos | Resuelto para los casos revisados | Escenarios positivos y negativos añadidos sin afirmar verificación de la aplicación. |
| Restricciones y compromisos | Claro | Ámbito documental y pila común conservados; diferencias registradas. |
| Terminología | Claro | Pago confirmado, fallo, cuota pagada, correo enviado y autorización diferenciados. |
| Señales de finalización | Resuelta la ronda; revisión pendiente | Ocho respuestas registradas y checklist documental 16/16; alineación integral no declarada. |
| Preguntas abiertas | Sin respuestas pendientes en PA1.1–PA1.8 | Los mecanismos técnicos y cambios comunes identificados no se ocultan. |

## Estado de la ronda

- PA1.6: respuesta confirmada e integrada; decisión funcional resuelta y ajuste común identificado.
- PA1.7: respuesta confirmada e integrada, con límite de acceso y ajuste común identificados.
- PA1.8: respuesta confirmada e integrada; fallo, cancelación posterior y próximo cobro definidos.
- Único archivo creado al iniciar esta ronda: `refinamiento/clarify-3.md`.
- Tras las tres respuestas, se actualizan `spec.md`, tres marcas del checklist y este informe.
  Los informes `clarify-1.md` y `clarify-2.md` se conservan sin modificar.
- Se comprueban rama `spec-001`, ocho aclaraciones (cinco y tres por ronda), diecinueve
  requisitos con identificadores consecutivos y dieciséis casillas marcadas.
- Se comprueba el formato con `git diff --check` y que los cambios quedan bajo `specs/spec-001/`.
- El hook `after_clarify` de commit es opcional y se omite por el alcance autorizado.
- No se han realizado pruebas funcionales, instalaciones, arranques, cambios comunes,
  implementación, commits, push ni cambios de rama.
- Segunda ronda terminada para revisión; no se declara cerrado el conjunto de diferencias
  compartidas ni validada la implementación. Se detiene antes de plan, sin iniciarlo.
