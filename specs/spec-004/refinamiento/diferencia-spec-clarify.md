# Diferencia entre la especificación anterior y la revisada — spec-004

Versión anterior: `spec.md` tras el `specify` conjunto y el reparto (commit `a6eadf5`, 28/10/2026).
Versión revisada: `spec.md` tras `clarify` (commit `c60e122`, 09/11/2026).

Se obtiene con `git diff a6eadf5 c60e122 -- specs/spec-004/spec.md`. Las líneas que empiezan por «-»
son de la versión anterior y las que empiezan por «+», de la revisada. Las decisiones que explican
cada cambio, con su justificación, están en los informes de `clarify` de esta carpeta.

```diff
@@ -10,6 +10,16 @@
 
 **Input**: Descripción del SI-13: "quien lleva la administración de la ONG necesita poder rendir cuentas ante la junta directiva, para lo cual requiere informes que muestren, agrupado por proyecto y por periodo, tanto el dinero recaudado como el volumen de voluntariado generado, en un formato que se pueda exportar y presentar con facilidad."
 
+## Clarifications
+
+### Session 2026-11-09
+
+- Q: ¿El informe muestra solo cifras agregadas o puede incluir datos personales de donantes o voluntarios (nombre, correo, NIF/NIE)? → A: Solo cifras agregadas: ningún nombre, correo, NIF/NIE ni dirección de donantes o voluntarios, ni en pantalla ni en CSV o PDF (PA4.1).
+- Q: Con agrupación por mes, trimestre o año, ¿qué filas tiene el informe? → A: Una fila por cada periodo y proyecto (incluido «fondo general»), una fila de subtotal por periodo y una fila de totales al final.
+- Q: En subtotales y totales, ¿cómo se cuentan los voluntarios distintos? → A: Personas distintas en todo el ámbito de esa fila (periodo o informe completo), no la suma de filas; el resto de cifras sí se suman.
+- Q: ¿Aparecen con ceros los proyectos o periodos sin ningún dato? → A: No: solo aparecen las filas de proyecto y periodo con algún dato; si no queda ninguna, informe vacío con su mensaje.
+- Q: ¿Qué fecha decide en qué periodo cuenta una actividad con sus asistentes y horas? → A: Su inicio en hora de Madrid; la actividad entera cuenta en el periodo donde empieza; el periodo va de las 00:00 del día de inicio al final del día de fin, ambos incluidos; solo cuentan las celebradas (publicadas y ya empezadas).
+
 ## User Scenarios & Testing *(mandatory)*
 
 ### User Story 1 - Consultar el informe por proyecto y periodo (Priority: P1)
@@ -27,7 +37,7 @@ El administrador elige un periodo y, opcionalmente, un proyecto y una agrupació
 1. **Given** aportaciones confirmadas en 2026 en los proyectos A y B y en el fondo general, **When** el administrador pide el informe del 01/01/2026 al 31/12/2026 sin filtro de proyecto, **Then** ve una fila para A, otra para B, otra para «fondo general» y una fila de totales.
 2. **Given** cada fila de proyecto, **When** se muestra, **Then** incluye lo recaudado por donaciones puntuales, por cuotas de socio, número de aportaciones, número de actividades celebradas, voluntarios distintos que asistieron y horas de voluntariado.
 3. **Given** el filtro del proyecto A, **When** se genera el informe, **Then** solo aparecen las cifras de A.
-4. **Given** la agrupación por trimestre, **When** se genera el informe de 2026, **Then** aparece una fila por cada trimestre del periodo.
+4. **Given** la agrupación por trimestre, **When** se genera el informe de 2026, **Then** aparece, dentro de cada trimestre del periodo, una fila por proyecto (y «fondo general»), una fila de subtotal del trimestre y, al final, la fila de totales.
 5. **Given** aportaciones fuera del periodo o no confirmadas, **When** se genera el informe, **Then** no se cuentan.
 6. **Given** asistencias registradas en el periodo, **When** se genera el informe, **Then** las horas coinciden con la suma de esas asistencias.
 7. **Given** un periodo sin datos, **When** se genera el informe, **Then** se muestra un informe vacío con un mensaje claro, no un error.
@@ -55,21 +65,25 @@ Como administrador, quiero exportar el informe a CSV y a PDF, para analizarlo en
 
 - Asistencias corregidas a «no asistió» (HU-08): sus horas no cuentan.
 - Proyecto inactivo: sigue apareciendo si tiene datos en el periodo.
+- Proyecto activo sin aportaciones ni actividades en el periodo: no aparece.
 - Actividad celebrada sin ninguna asistencia registrada: cuenta como celebrada con 0 horas.
 - Actividad cancelada: no cuenta como celebrada.
+- Actividad que empieza el 31/12 y termina el 01/01: cuenta entera en el año (mes, trimestre) en que empieza.
+- Un voluntario que asistió en los proyectos A y B cuenta 1 en cada fila y 1 (no 2) en la fila de totales.
 
 ## Requirements *(mandatory)*
 
 ### Functional Requirements
 
 - **FR-001**: El sistema MUST permitir elegir un periodo (fecha de inicio y fin), un Proyecto opcional y una agrupación opcional por mes, trimestre o año.
-- **FR-002**: El sistema MUST rechazar un periodo cuya fecha de fin sea anterior a la de inicio.
+- **FR-002**: El sistema MUST rechazar un periodo cuya fecha de fin sea anterior a la de inicio. El periodo incluye completos el día de inicio y el de fin (de las 00:00 del primero al final del segundo, en hora de Madrid).
 - **FR-003**: El dinero recaudado MUST calcularse con las aportaciones confirmadas cuya fecha de cobro está dentro del periodo, separando donaciones puntuales y cuotas de socio, e indicando el número de aportaciones.
-- **FR-004**: El voluntariado MUST calcularse con las asistencias registradas de actividades celebradas dentro del periodo: número de actividades celebradas, voluntarios distintos que asistieron y horas totales.
-- **FR-005**: Sin filtro de proyecto, el informe MUST incluir una fila por proyecto, una de «fondo general» y una de totales.
+- **FR-004**: El voluntariado MUST calcularse con las asistencias registradas (con asistencia) de actividades celebradas (publicadas y con inicio ya pasado) cuyo **inicio**, en hora de Madrid, cae dentro del periodo; la actividad entera, con todos sus asistentes y horas, cuenta en el periodo (y el mes, trimestre o año) donde empieza: número de actividades celebradas, voluntarios distintos que asistieron y horas totales. En las filas de subtotal y de totales, los voluntarios distintos MUST contarse como personas distintas en todo el ámbito de la fila (no como suma de filas, porque una persona puede asistir en varios proyectos o periodos); el resto de cifras son la suma de sus filas.
+- **FR-005**: Sin filtro de proyecto, el informe MUST incluir una fila por proyecto, una de «fondo general» y una de totales. Con agrupación temporal, MUST haber una fila por cada periodo y proyecto (incluido «fondo general»), una fila de subtotal por periodo y la fila de totales al final.
 - **FR-006**: El informe MUST poder exportarse a CSV y a PDF con exactamente la misma información que la pantalla.
-- **FR-007**: Un periodo sin datos MUST mostrar un informe vacío con un mensaje explicativo.
+- **FR-007**: Un periodo sin datos MUST mostrar un informe vacío con un mensaje explicativo. Las filas de proyecto (o de proyecto y periodo) sin ninguna aportación ni actividad celebrada MUST omitirse; tampoco aparece el subtotal de un periodo sin filas.
 - **FR-008**: Solo los usuarios con rol administrador MUST poder acceder a los informes; la comprobación se hace en el servidor.
+- **FR-009**: El informe y sus exportaciones MUST contener solo cifras agregadas: ningún nombre, correo, NIF/NIE ni dirección de donantes o voluntarios (PA4.1).
 
 ### Key Entities
 
@@ -94,4 +108,4 @@ Como administrador, quiero exportar el informe a CSV y a PDF, para analizarlo en
 
 ## Open Questions (para `/speckit-clarify`)
 
-- **PA4.1**: ¿Los informes deben incluir datos personales de donantes o solo cifras agregadas? (Propuesta: solo agregadas, por protección de datos.)
+- ~~**PA4.1**~~: resuelta en Clarifications (solo cifras agregadas, FR-009).
```
