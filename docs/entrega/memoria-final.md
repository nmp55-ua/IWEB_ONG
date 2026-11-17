# Sistema de Información 13 — Gestión de Donaciones y Voluntariado para una ONG

## Memoria final de grupo

*Nada · Rubén · Javi · Nicole · Pila tecnológica: Astro + React (islas) · Node.js/Express · PostgreSQL · Tailwind CSS*

> **Borrador para revisar en grupo.** Los párrafos marcados con «✎ Pendiente» debe escribirlos
> o confirmarlos la persona indicada.

### Resumen del sistema construido

El grupo ha desarrollado una aplicación web funcional para una ONG que se sostiene con dos tipos de
generosidad: el dinero de sus donantes y el tiempo de sus voluntarios. A partir de la descripción
narrativa del sistema se identificaron ocho historias de usuario (HU-01 a HU-08) que cubren los cuatro
perfiles implicados —donante, voluntario, coordinador de proyectos y administración— y, para cada una,
se desarrolló su especificación, su plan técnico, su desglose de tareas y su implementación, siguiendo
Spec-Driven Development con GitHub Spec Kit.

La aplicación permite a un **donante** hacer una donación puntual o hacerse socio con una cuota
mensual, trimestral o anual pagando en una pasarela segura (Stripe Checkout, en modo de pruebas),
consultar su historial de aportaciones agrupado por año y descargar su certificado fiscal anual.
Permite a un **voluntario** consultar las actividades disponibles, inscribirse (o apuntarse a la lista
de espera si están completas), ver sus compromisos en un calendario personal y consultar sus horas
acumuladas. Permite al **coordinador** crear, publicar, editar y cancelar actividades, gestionar
automáticamente la lista de espera y pasar lista de asistencia. Y permite a la **administración**
obtener informes de recaudación y voluntariado por proyecto y periodo, exportables a CSV y PDF.

### Arquitectura adoptada

El grupo siguió la pila propuesta para el sistema: front-end en **Astro** con islas de **React** y
**Tailwind CSS**, back-end en **Node.js con Express** organizado en módulos, y **PostgreSQL** como base
de datos. Para que cuatro personas construyeran una sola aplicación, antes de abrir las ramas se fijó
en `main` una base común:

- **Constitución** con doce principios en tres bloques (calidad, organización del código y
  colaboración), entre ellos «cero alcance fantasma», «cada uno ve lo suyo, comprobado en el servidor»
  y «nada se borra a ciegas».
- **Plan técnico y modelo de datos compartidos** (`specs/plan-comun.md`, `specs/modelo-datos.md`): una
  única definición de cada entidad, un dueño por tabla y números de migración reservados para que las
  ramas no chocaran.
- **Base de código común**: sesiones en PostgreSQL, `requiereRol(...)` en todas las rutas protegidas,
  un único formato de error (`{ error: { codigo, mensaje, campos } }`), servicios comunes de fechas en
  hora de Madrid, importes en céntimos, CSV para Excel en español, PDF, correo y la envoltura de la
  pasarela de pago, y un diseño de página y componentes de interfaz compartidos.

Cada módulo sigue las mismas capas (`rutas` → `controlador` → `servicio` → `repositorio`): un módulo
puede usar el servicio de otro, nunca su repositorio. Así, por ejemplo, el módulo de actividades
gestiona la lista de espera a través de las funciones que expone el servicio de voluntariado.

Se tomaron tres decisiones técnicas que conviene destacar. La primera, que **valores como las plazas
libres o las horas de un voluntario se calculan y no se guardan**, de forma que nunca se descuadran ni
se duplican al corregir. La segunda, que **el pago solo se confirma por la notificación firmada de la
pasarela** (webhook), nunca por la página de retorno del navegador, y que la aplicación nunca recibe
datos de tarjeta. La tercera, que **el aforo se protege con un bloqueo de la fila de la actividad**,
para que dos voluntarios no puedan ocupar a la vez la última plaza.

✎ Pendiente (Rubén): revisar este apartado y añadir lo que falte de certificados e informes (tarea
horaria de emisión, verificación pública por código).

### Reparto de responsabilidades individuales

| Integrante | Historia 1 | Historia 2 | Revisa |
|---|---|---|---|
| **Nada** | HU-01 · Donación puntual o alta como socio | HU-02 · Historial de aportaciones | HU-03, HU-06 |
| **Rubén** | HU-03 · Certificado fiscal anual | HU-04 · Informes para la junta | HU-01, HU-08 |
| **Javi** | HU-05 · Consulta e inscripción en actividades | HU-06 · Calendario del voluntario | HU-02, HU-07 |
| **Nicole** | HU-07 · Gestión de actividades y lista de espera | HU-08 · Asistencia y horas de voluntariado | HU-04, HU-05 |

Cada historia se desarrolló en su propia rama (`spec-001` a `spec-008`) y llegó a `main` mediante un
pull request revisado por otro integrante (PR #1 a #8). El reparto agrupa historias que comparten
datos y pantallas para reducir dependencias: las de Rubén se apoyan en los datos de Nada y Nicole, y
las de Javi en las actividades de Nicole.

### Iteraciones relevantes de loop engineering

#### La lista de espera no tenía dueño cuando cancelaba un voluntario (HU-05 y HU-07)

El primer `analyze` de spec-007 detectó que ninguna de las dos specs se encargaba de promover a la
primera persona en espera cuando un voluntario cancelaba su inscripción: spec-005 lo remitía a HU-07 y
spec-007 solo decía «comprobar con Javi». Nicole y Javi acordaron un contrato entre módulos: la
cancelación llama a `promoverListaEspera`, que devuelve las inscripciones promovidas, y el correo
«plaza confirmada» sale siempre de una única función, `avisarPlazaConfirmada`. El acuerdo se reflejó en
las dos specs antes de implementar, y se comprobó después con una cancelación real: entra la primera
persona en espera, le llega el correo y las plazas libres no cambian.

#### Las asistencias no tenían las columnas de auditoría del modelo común (HU-08)

El `converge` de spec-008 detectó que la tabla `asistencias` no tenía `creado_en` ni `actualizado_en`,
aunque el modelo de datos común las exige en todas las tablas. Al revisarlo se vio que el error venía
de la propia documentación: la sección de asistencias de `modelo-datos.md` tampoco las listaba. Se
corrigieron a la vez el documento común, la spec y la migración, y se avisó al grupo del cambio en lo
común. Es un ejemplo de por qué una tarea marcada como hecha no basta como prueba de cumplimiento.

#### La migración de asistencias no podía depender de una tabla que aún no existía (HU-08)

El primer plan de spec-008 proponía que la migración 007 creara la clave foránea a `inscripciones`
solo si esa tabla existía, porque spec-005 aún no estaba en `main`. Al revisarlo se descartó: dejaba
bases de datos con estructuras distintas según el orden en que se aplicaran las migraciones. En su
lugar, se pidió a Javi que adelantara su migración 006, como preveía el plan común, y la 007 crea siempre
la relación.

#### ✎ Pendiente (Nada): una iteración de HU-01 o HU-02

Sugerencia a partir de sus informes: el reintento de correo y la recuperación de una operación de pago
incierta (`analyze-1`, UND-001; `converge-1`, CONV-001 y CONV-002).

#### ✎ Pendiente (Rubén): una iteración de HU-03 o HU-04

Sugerencia: los tres mensajes distintos para «ejercicio sin aportaciones» o el plazo de emisión del
certificado tras una confirmación tardía (`analyze-1` de spec-003, I1 y A1).

#### Cancelar mientras se promueve la lista de espera (HU-05 y HU-07)

El primer `analyze` de spec-005 marcó como grave (S1) un caso que el plan no resolvía: para cancelar
una inscripción hay que leerla primero y, con ella, bloquear su actividad. Si el estado se decidía con
esa primera lectura y entre medias otra operación promovía a la persona de la lista de espera, la
cancelación no promovía a nadie y la actividad se quedaba con una plaza libre y gente esperando. La
salida evidente, bloquear antes la inscripción, invertía el orden de bloqueo que usa spec-007
(primero la actividad, luego las inscripciones) y podía provocar un interbloqueo entre las dos
historias. Antes de implementar se fijó en el plan y en la tarea T017 un orden único: leer sin
bloqueo solo para saber de quién es la inscripción y de qué actividad, bloquear la actividad con
`bloquearActividad` y volver a leer la inscripción dentro de la misma transacción, decidiendo sobre
esa segunda lectura. El acuerdo sobre `bloquearActividad`, que es del módulo de Nicole, quedó como
tarea de coordinación (T021). El registro de hallazgos (`analyze-2`) da S1 por hecho, y el mismo bloqueo es
el que comprueban las pruebas de concurrencia: dos peticiones a la vez por la última plaza y bajar
plazas mientras alguien se inscribe.

### Integración entre historias

Integrar el trabajo de cuatro personas generó tres tipos de problemas, todos resueltos sin rehacer
nada. **Ficheros comunes en conflicto** (el menú, `app.js`, las semillas y el registro de migraciones):
cada historia añadía su línea en el mismo sitio, y los conflictos se resolvieron sumando las dos
partes. **Pruebas escritas antes de que existiera el trabajo de otro**: una prueba de HU-01 tenía la
lista de migraciones escrita a mano y falló al llegar la 007, por lo que se actualizó la lista. **Datos
de prueba compartidos**: las semillas de cada historia tuvieron que coordinarse para que los
escenarios de unas no rompieran los de otras (por ejemplo, las inscripciones de «Recogida de ropa» que
usan HU-05 y HU-08).

Antes de fusionar cada pull request se traía a la rama la última versión de `main` y se ejecutaban
todas las pruebas: las de donaciones sobre su base aislada (`ong_test_hu01`) y el resto sobre la base
de pruebas común.

### Conclusiones y aprendizajes

El grupo destaca que lo más costoso no fue escribir código, sino **coordinar las fronteras entre
historias**: quién es dueño de cada tabla, qué devuelve cada función que usa otro módulo y qué datos de
prueba necesita cada uno. Fijar desde el principio una constitución, un plan y un modelo de datos
comunes, y respetarlos en todas las ramas, permitió que cuatro personas trabajaran en paralelo y que el
resultado pareciera una sola aplicación.

También destaca que **`analyze` y `converge` encontraron problemas reales** que las pruebas no
detectaban: requisitos sin dueño, contradicciones entre documentos y reglas del modelo común que el
código no cumplía. Volver a la spec o al plan antes de tocar el código hizo que cada corrección quedara
documentada y no solo «arreglada».

#### Valoraciones personales

**Nicole (HU-07 y HU-08).** Lo que más me ha aportado la práctica es entender que, cuando varias
personas construyen partes de la misma aplicación, el trabajo difícil está en las fronteras. Mis dos
historias dependían de las inscripciones de Javi, y las dos veces que algo no encajaba —quién promueve
la lista de espera cuando cancela un voluntario y qué hacer con una migración que necesitaba una tabla
que aún no existía— la solución no fue cambiar el código, sino hablarlo, acordar un contrato y dejarlo
escrito en las dos specs antes de implementar. También me ha sorprendido el valor de repetir `analyze`
y `converge` hasta que salían limpios: encontraron cosas que mis pruebas no veían, como las columnas
que faltaban en asistencias por un error del propio modelo común. Usar un asistente de IA para generar
planes, tareas y código me ha permitido iterar muy rápido, pero me he dado cuenta de que mi papel era
decidir: responder las preguntas de `clarify` con criterio, revisar cada informe antes de aceptarlo y
comprobar en la aplicación que lo que decía la spec era lo que pasaba de verdad, cronometrando las
pruebas de SC-001 y SC-002. Si volviera a empezar, acordaría antes con el grupo los datos de prueba
compartidos, que fueron la fuente de varios conflictos al integrar.

**Javi (HU-05 y HU-06).** Para mí la práctica ha servido sobre todo para ver cómo funciona
Spec-Driven Development cuando el proyecto es de cuatro personas y no un ejercicio suelto. Con Spec Kit
cada historia pasaba por `clarify`, `plan`, `tasks`, `analyze` y `converge` antes de darla por
buena, y al principio me parecía mucho papeleo para dos historias. Cambié de idea con HU-05: el
`analyze` encontró el fallo de cancelar con lista de espera antes de escribir el código, y el
`converge` de HU-06 sacó problemas de accesibilidad y de recarga que las pruebas automáticas no
veían. Como mis historias dependían del módulo de actividades de Nicole, me tocó negociar con ella qué
funciones usaba cada uno y quién sembraba cada dato, y aprendí que eso tiene que acabar en el plan
común y no quedarse en un mensaje del grupo. Lo que haría distinto es cerrar antes las tareas de
coordinación y medir con una persona los criterios de tiempo en cuanto la historia funciona, no al
final.

✎ Pendiente (Nada y Rubén): un párrafo breve de cada uno con su valoración personal.

### Repositorio y demostración

El código fuente, con el historial de commits y pull requests que permite seguir las iteraciones, está
en https://github.com/nmp55-ua/IWEB_ONG. El `README.md` explica cómo arrancar la aplicación en local con
Docker. La matriz de trazabilidad de las ocho historias está en
`docs/entrega/matriz-trazabilidad.md`, y los informes de clarify, analyze y converge de cada historia, en
`specs/spec-00N/refinamiento/`.
