# Preparación de converge — HU-01

**Fecha:** 2026-11-07 · **Responsable:** Nada · **Revisor:** Rubén.

**Estado:** procedimiento consultado; converge no ejecutado. No es un informe de convergencia.

## Definición y sintaxis comprobadas

La definición existente es
[.claude/skills/speckit-converge/SKILL.md](../../../.claude/skills/speckit-converge/SKILL.md),
con `name: speckit-converge` y `user-invocable: true`. La invocación prevista por el
repositorio es **`/speckit-converge`**, seguida del alcance opcional. No es un comando
de PowerShell o un script npm; este chat no dispone de una herramienta registrada con
ese nombre. El siguiente encargo puede seguir directamente el archivo si la interfaz
no registra la invocación. No se ejecuta ahora.

El procedimiento revisa spec, plan y tasks con la constitución como autoridad, inspecciona
el código y clasifica brechas `missing`, `partial`, `contradicts` o `unrequested`.
No compara ramas ni historial de Git. Presenta hallazgos antes de escribir y solo añade
una nueva fase de tareas, con IDs posteriores al máximo existente; si no hay brechas
accionables, tasks.md queda byte por byte igual. No implementa correcciones.

El script local admite `-RequireSpec`, `-RequireTasks`, `-IncludeTasks`, `-Json` y
`-PathsOnly`. La definición pide:

```powershell
# Desde la raíz del repositorio; referencia del procedimiento, no ejecutada en T081.
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -RequireSpec -RequireTasks -IncludeTasks
```

Su resolución normal puede persistir la selección cuando existe una sustitución por
variable de entorno. Para conservar la selección, T081 comprobó únicamente:

```powershell
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -PathsOnly
```

Resolvió `specs/spec-001`, sus spec/plan/tasks y la rama esperada. `-PathsOnly` omite
la validación de requisitos, por lo que la adaptación de solo lectura debe comprobar
explícitamente la existencia de esos tres archivos. No se cambia feature.json.
No se encontraron hooks `before_converge`/`after_converge` en la configuración consultada;
debe comprobarse de nuevo en la ejecución, sin realizar commits opcionales.

La escritura de un informe en refinamiento es una ampliación explícita del encargo
siguiente respecto al procedimiento, que limita su escritura a tasks.md. Responde a la
evidencia metodológica de la práctica; no habilita otras correcciones o escrituras.

## Encargo preparado para la siguiente fase

Ejecuta únicamente el primer converge de HU-01 en la rama spec-001 del repositorio
`E:\asignaturas\IWeb\Practica grupal\IWEB_ONG`.

Usa `/speckit-converge` si está registrado; si no, sigue
`.claude/skills/speckit-converge/SKILL.md` y explica la adaptación. No crees agentes.

Antes del procedimiento, comprueba en solo lectura rama, HEAD y estado como salvaguarda
de alcance; conserva cambios locales, `.env`, `.claude/launch.json` e históricos. Esa
salvaguarda no convierte converge en una comparación de ramas o commits. Comprueba
la selección con `check-prerequisites.ps1 -Json -PathsOnly` y verifica que spec.md,
plan.md y tasks.md existen en specs/spec-001, sin modificar la selección.

Contrasta la implementación actual con spec.md, plan.md y tasks.md, bajo la constitución.
Consulta los contratos y evidencias referenciados para interpretar el diseño y sus
límites, sin añadir requisitos. No repitas T079–T080, pruebas funcionales o consultas
externas ya acreditadas. Distingue código comprobado, pruebas simuladas, Stripe de
pruebas y revisión/coordinación pendientes; no inventes resultados ni acuerdos.

Presenta primero los hallazgos con ID estable, tipo de brecha, gravedad, referencia de
origen y evidencia concreta. Si exigen trabajo nuevo, añade únicamente una nueva sección
`## Phase N: Convergence` al final de tasks.md con los siguientes IDs libres, tareas
pequeñas sin marcar y trazables. No reescribas, renumeres ni cambies las marcas de tareas
existentes. Si no hay brechas nuevas accionables, deja tasks.md byte por byte intacto.

Conserva T006 y T007 como revisión real y coordinación pendientes. No las dupliques como
nuevas tareas ni las des por completadas. La preparación T081 no acredita aprobación de
Rubén. Aunque no aparezcan brechas de código, no declares HU-01 terminada ni convergencia
sin reservas mientras permanezcan esas condiciones; informa del resultado y sus límites.

Se autoriza, adicionalmente a la escritura append-only de tareas, guardar el primer
informe completo en `specs/spec-001/refinamiento/converge-1.md`. Comprueba antes que no
exista; si existe, consérvalo y usa el siguiente número libre. Incluye alcance, cobertura,
hallazgos, tareas nuevas si las hay, comprobaciones realizadas/no realizadas y pendientes
reales. No modifiques los demás documentos ni corrijas código durante el diagnóstico.

Detente tras el informe y las tareas nuevas justificadas. No implementes, no ejecutes
pagos, altas, cancelaciones, reenvíos o cambios de configuración. Sin git add, commit,
push, merge, cambios de rama ni comunicaciones externas. Omite los hooks opcionales
de Git y conserva todas las evidencias anteriores.
