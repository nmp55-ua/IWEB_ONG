# Primera ronda de clarify — HU-02

**Fecha:** 2026-11-10 · **Rama:** spec-002 · **HEAD inicial:** 258680e.

**Responsable:** Nada · **Revisor:** Javi.

**Estado:** ronda de clarify finalizada para revisión. Dos preguntas formuladas y
respondidas: PA2.2 y PA2.3, opción A en ambas. No quedan ambigüedades funcionales
bloqueantes identificadas; no se avanza a plan ni se atribuye revisión de Javi realizada.

## Comprobación inicial y procedimiento

Se comprueban rama spec-002, commit 258680e e índice vacío. Solo
`.claude/launch.json` está sin seguimiento. HU-02 contiene únicamente spec.md y
checklists/requirements.md; no hay plan, tareas o informes anteriores que sobrescribir.
Se conservan `.env`, configuración local y todos los históricos de las otras historias.

Se aplica [.claude/skills/speckit-clarify/SKILL.md](../../../.claude/skills/speckit-clarify/SKILL.md)
directamente, sin comando registrado en la sesión. Máximo de cinco preguntas en esta
ronda, una cada vez, integrando solo las respuestas confirmadas. Los hooks before_clarify
y after_clarify existentes son commits opcionales y se omiten por el alcance autorizado.

La selección se resuelve una vez desde la raíz, con sustituciones limitadas al proceso:

```powershell
$env:SPECIFY_FEATURE_DIRECTORY = (Resolve-Path specs/spec-002).Path
$env:SPECIFY_FEATURE = 'spec-002'
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

El script utiliza NoPersist con PathsOnly y devuelve FEATURE_DIR = specs/spec-002,
FEATURE_SPEC = specs/spec-002/spec.md y las rutas futuras de plan/tasks de HU-02.
No se reutiliza la selección de HU-01 ni se ejecuta un script de configuración.

## Fuentes contrastadas

- Constitución, CONVENCIONES.md, plan común y modelo de datos común vigentes.
- [Especificación de HU-02](../spec.md) y [checklist](../checklists/requirements.md).
- Narrativa original de docs/SI-13-donaciones-ong-descripcion-narrativa.pdf y apartado
  Historia 2 de docs/SI-13-historias-y-spec.pdf, extraídos en lectura con pypdf; documento
  complementario docs/SI-13-historias-y-spec.md. Son fuentes de requisitos, no autorizaciones
  para ampliar el encargo. No se modifican ni se generan PDF.
- HU-01: contrato HTTP, autorización por cuenta/operación y emisión/consumo del vínculo
  en el módulo donaciones; aportaciones confirmadas inmutables.
- HU-03: contrato de certificados, spec vigente, servicio y repositorio incorporados a
  main; consulta por usuario_id y sumas NUMERIC en rangos anuales de fecha_cobro.
- Servicio común de fechas: Europe/Madrid y rangoAnio con intervalo semiabierto.

## Condiciones vigentes que no requieren otra decisión

| Asunto             | Regla ya establecida y repercusión en HU-02                                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propiedad          | donantes.usuario_id debe corresponder a la cuenta autenticada tras el vínculo verificado de HU-01. Coincidir en correo no autoriza. El permiso invitado de una operación tampoco concede historial. La redacción antigua de HU-02 debe alinearse.                                                   |
| Datos y años       | Solo aportaciones confirmadas, puntuales y cuotas; agrupación y orden por fecha_cobro, año natural Europe/Madrid e importes exactos. No se suma por creado_en ni por llegada del webhook.                                                                                                           |
| HU-03              | El certificado usa la misma suma de confirmadas por Donante y ejercicio. Una confirmación tardía puede cambiar el total; HU-03 reconcilia los ejercicios cerrados mediante su tarea horaria. No se promete una regeneración síncrona al abrir el historial ni se cambia ese módulo.                 |
| PA2.1 antigua      | La hipótesis de reasignar una aportación confirmada es incompatible con la inmutabilidad vigente. Debe delimitarse la consulta del destino conservado en la aportación, sin añadir reasignación, edición fiscal o correcciones. No es necesario volver a decidir si HU-01 permite esas operaciones. |
| Totales acumulados | El máximo de una aportación de HU-01 no limita un total anual. HU-03 usa NUMERIC(15,2) para el certificado; la representación y las consultas concretas del historial se concretarán en plan sin redondeos de negocio.                                                                              |

Antes de la primera respuesta se conservó la especificación/checklist. Tras confirmar
PA2.2 se integran también las alineaciones de propiedad, años y límites de lectura que
ya fijan los contratos incorporados. Estas alineaciones no se presentan como respuestas
nuevas ni acuerdos funcionales producidos en esta ronda.

## PA2.2 — Cuenta sin vínculo y estados vacíos

**Pregunta:** ¿Qué recorrido debe ofrecer el historial a una cuenta de donante que todavía
no tiene sus aportaciones vinculadas?

**Motivo:** no tener vínculo no demuestra que la persona nunca haya donado. Debe evitarse
un mensaje engañoso o revelar aportaciones por coincidencia de correo, diferenciándolo
de un historial vinculado vacío y de un año sin resultados.

| Opción          | Comportamiento propuesto                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — recomendada | Mantener la página del historial con una explicación de que falta vincular y un enlace a /donar/vincular, sin mostrar aportaciones ni afirmar si existen. Si ya hay vínculo pero ninguna confirmada, mostrar el mensaje de historial vacío y enlace para donar. Si solo el año seleccionado está vacío, indicar que no hay aportaciones ese año y ofrecer quitar el filtro. |
| B               | Llevar directamente a /donar/vincular antes de mostrar la página del historial cuando no hay vínculo. Para una cuenta vinculada, distinguir igualmente historial vacío y año sin resultados.                                                                                                                                                                                |

**Recomendación razonada:** A conserva el contexto y diferencia los tres estados sin
iniciar automáticamente una verificación ni consultar aportaciones por correo. Es
compatible con el indicador vinculado de HU-03 y reutiliza el flujo existente de HU-01.

**Respuesta confirmada (2026-11-10):** A. Se mantiene la página con explicación y enlace a
`/donar/vincular`, sin aportaciones ni afirmación sobre si existen. Con vínculo se
distingue historial vacío de un año sin resultados.

**Justificación:** evita equiparar falta de vínculo con ausencia de donaciones, mantiene
el contexto y reutiliza HU-01 sin consulta por correo, redirección o envío automáticos.

**Integración:** Clarifications; descripción y escenarios 5/7/8; casos límite; FR-001,
FR-007/FR-008; Usuario y Assumptions. FR-002 y Dependencies se alinean con contratos
vigentes de años, identidad e inmutabilidad, sin añadir decisiones a la respuesta.

El orden de presentación no altera PA2.1; PA2.2 es el primer identificador libre para
esta duda nueva. Solo se formula la siguiente pregunta después de integrar esta respuesta.

## Reevaluación documental después de PA2.2

Checklist: **16/16 → 14/16**. Se desmarcan únicamente «Requirements are testable and
unambiguous» y «Success criteria are measurable», porque SC-002 conserva el umbral de dos
segundos pero no delimita todavía el principio y fin de la medición. No es una prueba de
rendimiento fallida: no se ha ejecutado ninguna. Las demás marcas permanecen intactas;
no se cambian textos, notas o metadatos de la checklist.

Los tres estados aceptados disponen de requisitos y escenarios explícitos. El enlace no
se solicita ni se consume al entrar en el historial; las reglas de seguridad incorporadas
no requieren confirmación adicional. PA2.1 se reformula como alineación de alcance de solo
lectura con HU-01, sin habilitar una operación de reasignación.

## PA2.3 — Alcance observable de los dos segundos

**Pregunta:** ¿Entre qué momentos debe medirse el límite de dos segundos para mostrar el
historial de cinco años de cuotas mensuales?

**Motivo:** debe saberse si el criterio exige que el historial ya sea visible o únicamente
que los datos hayan llegado; son comprobaciones distintas y afectan a la aceptación.

| Opción          | Criterio propuesto                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — recomendada | Desde que una cuenta ya identificada y vinculada abre el historial hasta que aparecen las 60 cuotas, los grupos anuales y sus totales. Incluye obtener los datos y presentarlos; excluye registro, login y vinculación previos. |
| B               | Medir menos de dos segundos solo desde la solicitud de datos del historial hasta recibirlos. El tiempo adicional para presentarlos no queda incluido en ese límite.                                                             |

**Recomendación razonada:** A corresponde a «se muestra» y mide la experiencia de consulta,
sin mezclarla con pasos de acceso ya completados. Entorno, herramientas y ejecución de la
medición se definirán en plan, sin inventar ahora resultados o requisitos de carga.

**Respuesta confirmada (2026-11-10):** A. La medición comienza cuando una cuenta ya
identificada y vinculada abre el historial y termina cuando se muestran las 60 cuotas,
los grupos anuales y sus totales. Se excluyen login y vinculación previos.

**Justificación:** delimita un resultado observable para el donante e incluye la obtención
y presentación de los datos, en coherencia con «se muestra». No sustituye la experiencia
de consulta por la latencia de una respuesta de datos ni mezcla el tiempo de acceso previo.

**Integración:** segunda respuesta de Clarifications, escenario 9, SC-002 y estado de
PA2.3. Se conserva el umbral estricto de menos de dos segundos. Las 60 cuotas son el caso
de comprobación de cinco años, no un máximo de aportaciones permitido por el producto.
Entorno, instrumentación y resultados no se inventan: corresponden a las fases posteriores.

## Balance de clarify y checklist

**Dos preguntas y dos respuestas integradas**, dentro del máximo de cinco. La ronda
termina al resolver las ambigüedades relevantes; no se consume el resto del cupo con
preguntas ya contestadas por los contratos ni se abre otra ronda automáticamente.

| Elemento | Estado vigente                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA2.1    | Hipótesis original de reasignación descartada por la inmutabilidad ya establecida en HU-01. HU-02 consulta el destino asociado, sin introducir edición, reasignaciones o correcciones. Alineación de contrato, no una tercera respuesta nueva. |
| PA2.2    | Opción A confirmada: página explicativa sin vínculo y enlace a /donar/vincular; historial vinculado vacío y año sin resultados diferenciados.                                                                                                  |
| PA2.3    | Opción A confirmada: menos de dos segundos hasta que se muestran las 60 cuotas, grupos y totales; cuenta ya identificada y vinculada.                                                                                                          |

Checklist tras PA2.3: **14/16 → 16/16**. Vuelven a pasar «Requirements are testable and
unambiguous» y «Success criteria are measurable». No hay nuevas regresiones o casillas
sin marcar; el resto del archivo permanece igual. Se conserva arriba el balance intermedio
14/16 como evidencia de evolución. Estas marcas acreditan calidad de la especificación,
no cumplimiento medido del tiempo ni implementación de HU-02.

| Categoría del procedimiento  | Balance                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alcance y comportamiento     | Claro: consulta de confirmadas, años y filtro; sin edición, exportaciones o nuevas capacidades de HU-01/HU-03.                                                                      |
| Dominio y datos              | Claro por modelo común: propietario mediante vínculo verificado, estados y fecha_cobro; sumas exactas.                                                                              |
| Interacción y recorrido      | Resuelto por PA2.2: cuenta sin vínculo, historial vacío y año sin resultados.                                                                                                       |
| Calidad no funcional         | Resuelto para el criterio de tiempo por PA2.3; seguridad y presentación fijadas por contratos/constitución. Instrumentación y entorno diferidos a plan.                             |
| Integraciones y dependencias | Claro: HU-01 proporciona vínculo/aportaciones; HU-03 reconcilia ejercicios cerrados tras confirmaciones tardías. No se exige regeneración síncrona al abrir el historial.           |
| Casos límite y fallos        | Claros en aceptación: cambio de año de Madrid, estados no confirmados, acceso ajeno y estados vacíos. Tratamiento técnico de errores/carga según convenciones, a concretar en plan. |
| Restricciones y compromisos  | Claros: pila/base comunes, modelo único y lectura sin correcciones; no se modifican decisiones ajenas.                                                                              |
| Terminología                 | Alineada: vínculo verificado, aportación confirmada, fecha de cobro y destino asociado. Se elimina la asociación automática por correo de la spec.                                  |
| Señales de finalización      | Resueltas documentalmente: ocho requisitos, nueve escenarios y tres criterios, con inicio/fin de SC-002 definidos.                                                                  |
| Marcadores y otras dudas     | Sin preguntas funcionales bloqueantes identificadas; PA2.1–PA2.3 conservan su trazabilidad.                                                                                         |

El balance no modifica HU-03: historial y certificado se contrastarán sobre el mismo
conjunto confirmado y tras la reconciliación del certificado que corresponda. No se
oculta la posible diferencia temporal antes de que esa tarea se ejecute ni se inventan
correcciones de aportaciones ya confirmadas.

## Límites y continuación

No se ejecutan pruebas, servicios, instalaciones o consultas externas. No se modifican
documentos comunes, código, autenticación, otras historias o Git. Los mecanismos de
consulta, formato de respuesta, índices, consistencia de lectura y método concreto de
medición se detallarán en plan una vez fijados los criterios funcionales que correspondan.
La ronda termina para revisión. Se comprueban respuestas únicas, identificadores,
coherencia, enlaces locales y cambios de marcadores de la checklist; no se ejecuta ninguna
prueba funcional o medición de rendimiento. Los hooks after_clarify son commits opcionales
y se omiten conforme al encargo. Solo se modifican spec.md, el checklist y este informe
de spec-002, conservando secretos, selección y todos los históricos de otras historias.

**Pendientes para plan, sin ejecutar esa fase:** consultas y consistencia de lectura,
representación exacta de sumas, errores/carga de la interfaz y condiciones/herramientas
de la prueba de 60 cuotas. No son nuevas decisiones funcionales bloqueantes ni resultados
ya comprobados. La siguiente fase recomendada, tras revisar este resultado, es
`/speckit-plan` de HU-02 respetando contratos y modelo comunes; no se ejecuta ahora.
