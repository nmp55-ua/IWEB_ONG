# Informe de clarify — HU-01 — Iteración 1

**Fecha**: 2026-11-04
**Rama**: `spec-001`
**Historia afectada**: HU-01 — Donación puntual o alta como socio
**Responsable**: Nada
**Revisor**: Rubén (revisión pendiente)
**Estado**: Sesión detenida tras cinco respuestas; clarify NO completamente cerrado. PA1.1, PA1.2 y PA1.4 confirmadas e integradas; PA1.3 y PA1.5 son propuestas pendientes de acuerdo común. Persisten ambigüedades bloqueantes.
**Estado inicial del repositorio**: HEAD `bdd6476`, árbol de trabajo limpio.

## Procedimiento y alcance

Se sigue directamente `.claude/skills/speckit-clarify/SKILL.md`, equivalente al comando
`/speckit-clarify`, que no está registrado en este chat. Se formulan las preguntas de una
en una y solo se incorporan las respuestas confirmadas por Nada.

El comprobador `check-prerequisites.ps1 -Json -PathsOnly` se ejecutó indicando
`SPECIFY_FEATURE_DIRECTORY=specs/spec-001` únicamente en el entorno del proceso. La
resolución se contrastó con `Get-FeaturePathsEnv -NoPersist`: carpeta y especificación
corresponden a `specs/spec-001`. No se guardó configuración de selección de historia.

Se consultaron la constitución, `CONVENCIONES.md`, el plan común, el modelo de datos,
la especificación y su checklist, además de los contratos implementados relevantes de
autenticación, proyectos, pasarela, correo e importes. Los hooks opcionales de commit
se omiten por instrucción expresa de Nada. Los cambios se limitan a documentación de
spec-001. No se ha ejecutado plan, implement ni ninguna operación de escritura de Git.

## Decisiones confirmadas

### PA1.1 — Modificación de cuota y baja desde la aplicación

- **Pregunta**: ¿Debe un socio poder modificar el importe de su cuota o darse de baja desde
  la aplicación en esta primera versión?
- **Respuesta confirmada por Nada**: Opción A. En esta primera versión, modificar el
  importe de la cuota y darse de baja desde la aplicación quedan fuera de alcance. Se
  mantienen el alta como socio y el registro de los cobros periódicos previstos en HU-01.
- **Justificación aportada por Nada**: Mantener el alcance de los criterios actuales de
  HU-01, centrados en donaciones y altas.
- **Historia afectada**: HU-01; escenario de alta como socio y requisitos FR-008 y FR-009.
- **Integración**: Se registra la respuesta en `spec.md`, sección `Clarifications`, sesión
  2026-11-04; se explicita la exclusión en FR-008 y se retira PA1.1 de las preguntas abiertas.
  FR-009 y los escenarios existentes de alta y cobros periódicos se conservan.
- **Antes**: PA1.1 contenía una propuesta de exclusión pendiente de confirmar.
- **Después**: La exclusión está confirmada y forma parte del alcance de HU-01.
- **Compatibilidad común**: No exige modificar el plan ni el modelo compartidos. El modelo
  condiciona la transición de suscripción activa a cancelada a una resolución favorable de
  PA1.1; esta respuesta excluye la baja desde la aplicación. Se mantienen las cancelaciones
  de altas pendientes por rechazo o cancelación del primer pago.
- **Estado**: Confirmada e integrada; revisión de Rubén pendiente.

### PA1.2 — Donaciones y altas sin cuenta

- **Pregunta**: ¿Debe ser obligatorio tener una cuenta para hacer una donación puntual o
  darse de alta como socio?
- **Respuesta confirmada por Nada**: Opción A. Tanto la donación puntual como el alta de
  socio pueden completarse sin tener cuenta. Para consultar el historial será necesario
  iniciar sesión con una cuenta del mismo correo utilizado al donar.
- **Justificación aportada por Nada**: Permitir colaborar sin registro previo, manteniendo
  el historial como información privada.
- **Historia afectada**: HU-01, ambas modalidades de aportación; dependencia con HU-02 para
  la consulta privada del historial. No se modifica la documentación de HU-02.
- **Instrucción adicional de Nada**: No dar por segura la vinculación por la mera coincidencia
  de correos; comprobar si está definido cómo acreditar la titularidad y preguntar si falta.
- **Integración**: Se registra PA1.2 en `Clarifications`, se explicita el acceso sin cuenta en
  los dos recorridos y se añaden escenarios de aceptación (donación puntual, escenario 7;
  alta de socio, escenario 4). FR-011 recoge ambas modalidades sin cuenta y distingue la
  coincidencia de correo de la acreditación de su titularidad. Se sustituye la pregunta
  resuelta por PA1.3 y se registra la dependencia pendiente.
- **Antes**: La donación sin cuenta figuraba como propuesta pendiente en PA1.2.
- **Después**: Ambas modalidades sin cuenta están confirmadas; el mecanismo de vinculación
  segura sigue sin decidirse.
- **Compatibilidad común**: El acceso público de las rutas de donación y `donantes.usuario_id`
  opcional ya contemplan donar sin cuenta. La acreditación de titularidad no está definida
  en esos contratos; queda señalada a continuación, sin modificar documentos ni código comunes.
- **Estado**: Confirmada e integrada; revisión de Rubén pendiente.

## Diagnóstico inicial — PA1.3: titularidad del correo

- **Evidencia documental**: `specs/plan-comun.md`, apartado 3, prevé enlazar Usuario y Donante
  cuando coincida el correo; `specs/modelo-datos.md`, tabla `donantes`, contempla `usuario_id`
  opcional y el enlace por correo. No describen una comprobación de acceso al buzón.
- **Evidencia de código**: `backend/src/modulos/auth/controlador.js` valida el formato del
  correo y crea una sesión inmediatamente después del registro. `servicio.js` comprueba la
  unicidad del correo y las credenciales; `repositorio.js` crea y consulta cuentas sin estado
  de correo verificado. Las rutas de `auth/rutas.js` no incluyen verificación de correo y
  `001_usuarios.sql` no define ese estado ni evidencias de verificación. El formulario de
  registro tampoco solicita una confirmación recibida en el buzón.
- **Resultado**: Crear una cuenta e iniciar sesión con una contraseña elegida al registrarla
  no acredita controlar el correo indicado. La coincidencia textual no basta para considerar
  autorizada la vinculación de aportaciones previas. No se ha implementado ni probado un
  acceso indebido: se identifica una condición de seguridad todavía sin definir.
- **Impacto común**: Para exigir una verificación habrá que acordar el contrato entre
  autenticación y donaciones, la prueba de titularidad y su conservación. Si se introduce
  estado de verificación en usuarios u otros cambios compartidos, el plan y el modelo común
  requerirán acuerdo del grupo y una migración nueva cuando corresponda. Estos cambios no
  están autorizados ni se realizan en este encargo. No se modifica una migración existente.
- **Estado al formular la pregunta**: Pendiente de respuesta de Nada; en ese momento no se
  había elegido enlace, código ni otro mecanismo. La respuesta posterior se conserva debajo.

## Propuesta condicionada — PA1.3: enlace para vincular aportaciones

- **Pregunta**: ¿Cómo debe demostrar una persona que controla el correo utilizado al donar
  antes de vincular las aportaciones a su cuenta?
- **Respuesta de Nada**: Opción A como propuesta: antes de vincular las aportaciones a una
  cuenta, la persona debe abrir un enlace de verificación enviado al correo utilizado al donar.
  La verificación se limita a la vinculación de aportaciones.
- **Justificación aportada por Nada**: Proteger el historial frente a cuentas creadas con
  correos ajenos.
- **Historia afectada**: HU-01, vinculación del Donante con una cuenta; dependencia con la
  privacidad del historial de HU-02. La propuesta no convierte la verificación en condición
  general para crear una cuenta o iniciar sesión.
- **Integración documental**: Se registra la respuesta en `spec.md`, `Clarifications`, como
  propuesta, y se actualizan `Dependencies` y el estado abierto de PA1.3. No se añade un
  requisito de enlace como si estuviese aprobado por el grupo.
- **Estado**: Propuesta de Nada registrada. Encaje común y detalles pendientes; revisión de
  Rubén pendiente. No equivale a una decisión completamente cerrada ni a una implementación.

### Viabilidad dentro del módulo de donaciones

La lógica de solicitar el enlace, comprobarlo y autorizar la asignación de
`donantes.usuario_id` puede residir en donaciones. Es una valoración de encaje basada en los
contratos leídos, no un plan de implementación ni una prueba de funcionamiento:

- `middleware/autenticacion.js` ya proporciona `req.usuario.id`, `correo` y `roles` a partir
  de la sesión. `middleware/roles.js` permite exigir la sesión y el rol donante. La sesión
  identifica una cuenta; no se trata como prueba de acceso al buzón.
- `servicios-comunes/correo.js` ya admite enviar un enlace dentro de `texto` y devuelve el
  resultado del envío. Puede reutilizarse sin ampliar su interfaz.
- `db/pool.js` ya ofrece consultas parametrizadas y transacciones. Donaciones es dueño de
  la tabla `donantes` y puede gestionar su vínculo con un Usuario existente sin llamar al
  repositorio privado de autenticación.
- `app.js` ya configura las sesiones y carga al usuario antes de los routers. No existe una
  exigencia técnica comprobada de modificar el registro, el inicio de sesión ni el contrato
  de `GET /api/auth/yo` para una comprobación limitada a vincular aportaciones.
- Falta concretar cómo la prueba se asocia a la cuenta y al Donante correctos, cómo caduca
  y cómo se evita reutilizarla o cambiar el destinatario. No se da por seguro un enlace solo
  por existir, ni se elige aquí un diseño de almacenamiento.

### Elementos comunes afectados, sin modificar

| Elemento | Ajuste o acuerdo pendiente | Carácter |
|---|---|---|
| `specs/plan-comun.md`, §3, enlace Usuario–Donante | Acordar que la coincidencia de correo es necesaria pero no suficiente, y que donaciones acredita el acceso al buzón antes de establecer el vínculo; no cambiar el inicio de sesión general. | Condición compartida pendiente de acuerdo. |
| `specs/modelo-datos.md`, `donantes.usuario_id` y su regla de enlace | Reflejar la condición de prueba previa y concretar su conservación. El modelo actual no recoge ese procedimiento. | Aclaración compartida pendiente de acuerdo; no implica por sí sola añadir columnas a `usuarios`. |
| `backend/src/app.js` | Registrar el futuro router de donaciones en el punto ya previsto para el módulo. | Integración común de HU-01, no un cambio de autenticación causado por PA1.3; no se realiza en clarify. |
| `backend/src/db/migraciones/004_donaciones.sql` (todavía inexistente) | Crear en su fase la estructura de donaciones acordada. Si el diseño requiere campos o tablas adicionales para la prueba, acordarlos primero en el modelo común. | Archivo reservado a Nada; no se crea en clarify. No se modifica `001_usuarios.sql` ni otra migración existente. Un cambio posterior a una migración ya publicada requiere un número nuevo acordado. |
| `specs/spec-002/spec.md` | En su fase, alinear el acceso al historial con el vínculo autorizado, evitando atribuir aportaciones por mera coincidencia del correo. | Dependencia con HU-02 registrada; fuera de las ediciones de este encargo. |

No se ha demostrado que sean necesarios cambios en `backend/src/modulos/auth/`,
`backend/src/middleware/`, `backend/src/servicios-comunes/correo.js` ni
`frontend/src/components/auth/`. Tampoco se exige una nueva variable de configuración o
una nueva columna por anticipado. Si el diseño posterior los necesitara, se señalarían
como cambios comunes antes de realizarlos. Se conserva el diagnóstico anterior: los
contratos actuales no acreditan la titularidad por sí mismos.

La propuesta puede situarse en donaciones respetando la autenticación existente, pero su
regla de vinculación debe coordinarse con los documentos compartidos y las historias que
consumen el vínculo. Este informe no sustituye ese acuerdo del grupo.

## Decisión confirmada — PA1.4: fallo y reintento del correo de confirmación

- **Pregunta**: ¿Qué debe ocurrir si el cobro está confirmado pero falla el envío del correo
  de confirmación?
- **Respuesta confirmada por Nada**: Opción A. Se conserva la aportación confirmada, se
  muestra el resumen y se avisa del fallo. Se permite reintentar únicamente el envío del
  correo, sin iniciar otro cobro ni crear otra aportación.
- **Justificación derivada de la decisión y de la indicación expresa de Nada**: Recuperar
  el correo sin duplicar pagos ni aportaciones y sin confundir el aviso de fallo con un
  correo enviado. Nada pidió expresamente revisar la coherencia con FR-007 y SC-002.
- **Historia afectada**: HU-01, donación puntual, alta de socio y confirmaciones de cuotas.
- **Integración**: FR-007 distingue la confirmación del pago de la obligación pendiente de
  enviar el correo. FR-012 define el reintento exclusivo del correo sin repetir cobros ni
  registros. Se actualiza el escenario 6 de donación puntual y se añaden los escenarios
  8–10 de fallo, reintento satisfactorio y nuevo fallo; el alta de socio añade los escenarios
  5–6. Se añade el caso límite y la aclaración correspondiente en la sesión de `spec.md`.
- **Coherencia de SC-002**: Se conserva el objetivo del 100 % y se precisa la evidencia de
  envío satisfactorio. Un fallo, un intento o un aviso no se cuentan como éxito. Si no se
  logra enviar un correo, SC-002 sigue sin cumplirse para el conjunto revisado, aunque la
  aportación esté correctamente confirmada. No se reduce el criterio a «se intentó enviar».
- **Evidencia disponible**: `servicios-comunes/correo.js` devuelve `true` si `sendMail`
  termina sin error y `false` si lanza una excepción; registra el fallo y no deshace el pago.
  Ese retorno permite distinguir resultados de envío, pero por sí solo no demuestra la
  recepción final en un buzón. La comprobación de SC-002 exige revisar el correo recibido
  en el entorno de pruebas, no solo una pantalla ni el retorno de la función.
- **Compatibilidad común**: Se respeta `plan-comun.md` §6: un fallo de correo no deshace la
  operación. La acción de reintento puede pertenecer a donaciones reutilizando
  `enviarCorreo({ para, asunto, texto })` sin cambiar su contrato. El modelo actual no define
  estado de envío; el diseño de cómo conservar y consultar un envío pendiente queda para
  una fase posterior. Si requiere campos o tablas nuevos, se acordarán antes en
  `modelo-datos.md` y se aplicarán en la migración de donaciones que corresponda. No se
  añaden aquí campos, tablas, endpoints, colas ni tareas de implementación.
- **Estado**: Confirmada e integrada documentalmente; revisión de Rubén pendiente. No se
  ha enviado ningún correo ni ejecutado una prueba funcional de esta decisión.

## Seguimiento del acuerdo común de PA1.3

Nada ha incluido un texto que solicita al grupo acordar la verificación por enlace limitada
a vincular aportaciones y reflejarla en `plan-comun.md` §3 y `modelo-datos.md`, regla de
`donantes.usuario_id`, con especial atención a Rubén por el uso en certificados. En este chat
no consta una respuesta de aprobación del grupo. El texto no se interpreta como aprobación
de Rubén ni de los demás integrantes, ni autoriza modificar archivos comunes. Se mantiene
la propuesta y su análisis de encaje, con el acuerdo todavía pendiente.

## Propuesta condicionada — PA1.5: correo utilizado con otro NIF/NIE

- **Pregunta**: ¿Qué debe ocurrir si alguien introduce un correo ya utilizado por un donante,
  pero con un NIF/NIE diferente?
- **Respuesta de Nada**: Opción A como propuesta para v1. Se detiene la operación antes del
  pago y se pide revisar los datos, sin mostrar datos del donante existente, modificarlo
  ni mezclar aportaciones.
- **Justificación aportada por Nada**: Evitar atribuir aportaciones a otra persona mientras
  no exista una política acordada para correos compartidos. El correo por sí solo no
  identifica al donante.
- **Historia afectada**: HU-01, identificación del Donante antes de iniciar el pago;
  dependencias con HU-02, HU-03 y HU-04, que consumen sus aportaciones.
- **Integración documental**: Se registra la respuesta como propuesta en `Clarifications`,
  `Dependencies` y `Open Questions` de `spec.md`. El caso límite que antes ordenaba reutilizar
  indistintamente por NIF/NIE o correo queda explícitamente pendiente de la regla acordada:
  no se mantiene como una identificación automática ya válida ni se sustituye por una
  prohibición aprobada que todavía no existe. No se añade un requisito obligatorio ni un
  escenario aprobado para esta propuesta.
- **Conflicto con la base común**: `specs/modelo-datos.md`, tabla `donantes`, declara único
  `nif_nie`, pero no `correo`; además prevé reutilizar y actualizar al Donante por NIF/NIE.
  Rechazar en v1 los correos compartidos con otro NIF/NIE añade una restricción funcional
  que no está acordada en ese modelo. No puede darse por aprobada solo por esta respuesta.
- **Acuerdo pendiente**: Acordar la política con el grupo y reflejarla en las reglas de
  `donantes` en `specs/modelo-datos.md` y, si corresponde, en el flujo de creación o
  reutilización del Donante de `specs/plan-comun.md` §5. Contrastar el efecto en las historias
  consumidoras, con especial atención a Rubén por certificados e informes.
- **Límites**: No se modifican esos documentos ni las specs consumidoras. No se crea ni
  altera una migración, un índice único o cualquier otra restricción de base de datos.
  Proponer una validación funcional no equivale a decidir una unicidad SQL del correo.
- **Estado**: Propuesta de Nada registrada; acuerdo del grupo y revisión de Rubén pendientes.

## Otras ambigüedades relevantes pendientes

Se registran sin formular nuevas preguntas ni aprobar soluciones después de la quinta
respuesta. Estos identificadores permiten retomarlas en otra sesión de clarify:

| Identificador | Ambigüedad y evidencia | Impacto y estado |
|---|---|---|
| PA1.6 | Mismo NIF/NIE con un correo distinto, o modificación de datos de un Donante ya vinculado. El modelo dice que se actualizan sus datos, pero no concreta quién puede cambiarlos ni con qué prueba. PA1.5 solo aborda el caso inverso: mismo correo y NIF/NIE distinto. | Bloqueante para la identificación y actualización segura del Donante. No se permite asumir una reasignación automática; política pendiente, sin solución elegida. |
| PA1.7 | Acceso sin cuenta al resultado del pago y al reintento del correo. El plan prevé una consulta pública por referencia y el modelo da un ejemplo legible de referencia, pero no define la prueba que autoriza a consultar esa aportación o reintentar su correo. | Bloqueante de privacidad y permisos. Hay que delimitar los datos expuestos y el acceso del donante sin cuenta; una referencia única no acredita por sí sola autorización. PA1.3 se limita al vínculo con una cuenta y no resuelve este acceso. |
| PA1.8 | Rechazo de un cobro periódico posterior al primero: FR-009 describe los cobros confirmados, pero no se especifica qué debe ver el socio ni cómo queda la suscripción y la fecha del siguiente cobro ante un fallo posterior. | Pendiente funcional del ciclo de cobros periódicos. No se añaden estados nuevos, bajas, reembolsos ni cambios de comportamiento de la pasarela. |

Los detalles técnicos de conservación de la prueba de PA1.3, del resultado de envío de
PA1.4 y de la deduplicación de pagos no se diseñan aquí. Deben respetar las decisiones
funcionales y el acuerdo común que corresponda. No se confunden con funcionalidades ya
aprobadas ni se inicia plan para resolverlos.

## Cobertura al detener la sesión

Se han formulado y respondido cinco preguntas. Hay tres decisiones confirmadas (PA1.1,
PA1.2, PA1.4) y dos propuestas condicionadas (PA1.3, PA1.5). La revisión de Rubén no se
presupone realizada.

| Categoría del procedimiento de clarify | Estado | Evidencia o limitación |
|---|---|---|
| Alcance y comportamiento funcional | Diferido parcialmente | PA1.1, PA1.2 y PA1.4 resueltos; PA1.3 y PA1.5 necesitan acuerdo. PA1.8 sigue sin concretar. |
| Dominio y modelo de datos | Diferido | Identificación, vinculación y actualización: PA1.3, PA1.5 y PA1.6. No se altera el modelo común. |
| Interacción y experiencia de usuario | Diferido parcialmente | Fallo y reintento de correo definidos; acceso al resultado sin cuenta pendiente en PA1.7. |
| Calidad no funcional | Diferido parcialmente | Se precisa la evidencia de SC-002; la privacidad sigue condicionada por PA1.3, PA1.6 y PA1.7. No se ha medido rendimiento ni probado la aplicación. |
| Integraciones y dependencias externas | Diferido parcialmente | Fallo de correo definido en PA1.4; fallo de cuota posterior pendiente en PA1.8. Contratos comunes consultados, no ejecutados. |
| Casos límite y tratamiento de fallos | Diferido parcialmente | Reintentos sin doble cobro definidos; conflictos de identidad y fallo de cuota posterior sin cerrar. |
| Restricciones y compromisos | Claro | Pila, reutilización, ámbito documental y acuerdo previo para cambios comunes conservados. |
| Terminología y coherencia | Claro | Se distingue cuenta, Donante, prueba del correo, pago confirmado y correo enviado; las propuestas se marcan como tales. |
| Señales de finalización | Diferido | Hay criterios revisados, pero no todos los casos tienen una regla aprobada. Checklist reevaluado y verificación funcional no realizada. |
| Preguntas y marcadores pendientes | Diferido | Se mantienen PA1.3 y PA1.5 abiertas y se registran PA1.6–PA1.8 sin inventar respuestas. |

«Diferido» indica pendiente después de agotar las cinco preguntas de esta sesión; no
significa que el asunto se haya aceptado ni que sea seguro pasar a plan.

## Reevaluación del checklist de requisitos

Se revisan las 16 casillas de `checklists/requirements.md` contra la especificación
actualizada. Se cambian únicamente cuatro marcas de casilla, sin reescribir notas ni
otros textos del checklist.

**Resultado documental**: 16/16 marcadas inicialmente → 12/16 marcadas tras la revisión.
Ningún elemento pasa de pendiente a marcado. Los cuatro elementos desmarcados y todavía
pendientes son:

| Elemento | Motivo |
|---|---|
| Requirements are testable and unambiguous | No existe una regla completamente aprobada para identificar, actualizar y vincular al Donante; PA1.8 mantiene un fallo de estado sin concretar. |
| All acceptance scenarios are defined | Faltan resultados aprobados y escenarios para las decisiones condicionadas y los casos PA1.6–PA1.8. |
| Scope is clearly bounded | La condición de vínculo y la restricción de correos compartidos siguen propuestas pendientes del acuerdo común. |
| All functional requirements have clear acceptance criteria | La identificación necesaria para registrar aportaciones y el acceso seguro a confirmación y reintento no tienen todavía todos sus criterios inequívocos. |

Se conserva marcada la ausencia de `[NEEDS CLARIFICATION]` porque no existe ese marcador
en `spec.md`; ello no acredita que las preguntas abiertas estén resueltas. Las demás
marcas son una evaluación de calidad documental, no evidencia de que la implementación
cumpla los criterios ni de que se hayan realizado pruebas funcionales.

Se eliminó de `Dependencies` de `spec.md` la explicación de integración en ficheros de
código, que permanece en este informe. La especificación conserva la regla funcional,
la dependencia y el estado de las propuestas, sin convertirla en un plan técnico.

## Comprobaciones y límites

- Rama final comprobada: `spec-001`. `git diff --check` termina sin errores de formato.
- Se comprueba que hay exactamente cinco aclaraciones y doce requisitos con identificadores
  únicos y consecutivos FR-001 a FR-012. El checklist conserva dieciséis elementos: doce
  marcados y cuatro pendientes.
- `git status` y el inventario de cambios muestran únicamente `spec.md`, las cuatro marcas
  de `checklists/requirements.md` y este informe nuevo, todos bajo `specs/spec-001/`.
- Se preservan los identificadores FR-001 a FR-010. Se añaden FR-011 y FR-012; los cambios de
  FR-007, SC-002 y los escenarios están vinculados a las respuestas de PA1.2 y PA1.4.
- Se registra una única aclaración por respuesta: tres decisiones confirmadas y dos propuestas
  condicionadas. PA1.3 y PA1.5 no se presentan como acuerdo del grupo ni como resueltas.
- No se han modificado documentos comunes, código ni documentación de otras historias.
- El checklist queda en 12/16 marcas tras la reevaluación documental descrita; las cuatro
  restantes siguen pendientes. Se conserva la evidencia de las 16 marcas iniciales.
- Esta iteración es documental: no acredita el funcionamiento de la aplicación.
- Se revisó el hook `after_clarify` en `.specify/extensions.yml`: el commit es opcional y se
  omite por la instrucción de Nada. No se invoca ningún hook de escritura de Git.
- Se detiene la sesión después de la quinta respuesta, como pidió Nada. Clarify NO está
  completamente cerrado: faltan acuerdos y decisiones bloqueantes. No se formulan más
  preguntas ni se avanza a plan.
- Siguiente paso recomendado: obtener el acuerdo del grupo sobre PA1.3 y PA1.5 y retomar
  clarify para resolver las ambigüedades bloqueantes restantes; mantener los documentos
  comunes sin cambios hasta que se acuerden y se autorice su edición.
