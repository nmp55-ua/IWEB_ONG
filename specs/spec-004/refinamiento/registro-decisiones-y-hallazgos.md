# Registro de decisiones y hallazgos — spec-004 (HU-04)

**Responsable**: Rubén · **Revisora**: Nicole · **Herramienta**: Spec Kit 1.0.4 (comandos `/speckit-*`) con Claude Code

Reúne en un solo sitio lo que ya está en la sección *Clarifications* de [`spec.md`](../spec.md), en
[`research.md`](../research.md), en [`analyze-1.md`](analyze-1.md), [`analyze-2.md`](analyze-2.md),
[`converge-1.md`](converge-1.md), [`converge-2.md`](converge-2.md) y en las validaciones manuales.

## 1. Decisiones de clarify (enunciado §5.1)

Sesión del 09/11/2026, commit `c60e122`. La diferencia entre la spec anterior y la revisada es ese
commit (`git show c60e122 -- specs/spec-004/spec.md`).

| # | Pregunta | Respuesta | Justificación | Criterios afectados |
|---|---|---|---|---|
| C1 (PA4.1) | ¿El informe muestra solo cifras agregadas o puede incluir datos personales de donantes o voluntarios? | Solo cifras agregadas: ningún nombre, correo, NIF/NIE ni dirección, ni en pantalla ni en CSV o PDF | La constitución lo fija (principio V: «los informes muestran cifras agregadas, no datos personales») y la junta solo necesita rendir cuentas de totales | FR-009 |
| C2 | Con agrupación por mes, trimestre o año, ¿qué filas tiene el informe? | Una fila por periodo y proyecto (incluido «fondo general»), un subtotal por periodo y una fila de totales | La historia pide los datos «por proyecto y por periodo»: así la junta compara proyectos dentro de cada periodo y periodos entre sí sin hacer cuentas a mano (research R3) | FR-005, escenarios 2 y 3 |
| C3 | En subtotales y totales, ¿cómo se cuentan los voluntarios distintos? | Personas distintas en todo el ámbito de la fila, no la suma de filas; el resto de cifras sí se suman | Una misma persona puede asistir en varios proyectos o periodos: sumar filas la contaría varias veces e inflaría el voluntariado. `count(DISTINCT …)` en cada nivel de `GROUPING SETS` lo resuelve (research R3) | FR-004, SC-001 |
| C4 | ¿Aparecen con ceros los proyectos o periodos sin datos? | No: solo las filas con algún dato; si no queda ninguna, informe vacío con su mensaje | El informe queda corto y legible para la junta, y las pruebas son deterministas (research R6) | FR-007 |
| C5 | ¿Qué fecha decide en qué periodo cuenta una actividad? | Su inicio en hora de Madrid; la actividad entera cuenta en el periodo donde empieza; solo las celebradas | Una actividad de varios días no se parte entre dos periodos ni se cuenta dos veces, y se usa el mismo corte en hora de Madrid que en HU-01 a HU-03 (research R4 y R5; principio I) | FR-004, casos límite |

## 2. Hallazgos de analyze (enunciado §5.2)

Primera pasada ([`analyze-1.md`](analyze-1.md), commit `fa49b7e`): 0 CRITICAL, 0 HIGH, 2 MEDIUM y
3 LOW. Segunda pasada ([`analyze-2.md`](analyze-2.md)): A1 y A2 corregidos, sin hallazgos nuevos y
cobertura del 100 %.

| ID | Informe | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| A1 | analyze-1 | Media | La preparación de `informes.test.js` vaciaba `proyectos` y los usuarios con `TRUNCATE … CASCADE`, tablas comunes que ninguna otra prueba vacía | T001 vacía solo las tablas de dominio; cada prueba crea sus proyectos y usuarios con nombres únicos | Rubén | Cerrado (`fa49b7e`) |
| A2 | analyze-1 | Media | SC-002 (informe anual exportado en menos de 1 minuto) solo se cronometraba en T021, bloqueada por HU-08 | Se cronometra ya en T017 sin voluntariado y se repite completo en T021 | Rubén | Cerrado (`fa49b7e`); medido: 0,14 s el informe y 0,10 s el PDF |
| A3 | analyze-1 | Baja | La columna «Total recaudado» no aparece literalmente en el escenario 2 | Se mantiene: es «el dinero recaudado» de FR-003 (puntual + cuotas), research R8 | Rubén | Aceptado |
| A4 | analyze-1 | Baja | SC-001 pide horas «a la décima» y el cálculo es a la centésima | Compatible: el cálculo es más preciso que lo pedido y se muestra con un decimal | Rubén | Aceptado |
| A5 | analyze-1 | Baja | El quickstart usa 2023 en lugar de 2026 | Justificado en quickstart §0: las semillas generan fechas relativas a «hoy» | Rubén | Aceptado |

## 3. Otros hallazgos (plan, converge y validación)

| ID | Origen | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| D1 | Plan (research R10) | Alta | La tabla `asistencias` (migración 007 de HU-08) solo existía en la rama de Nicole; fusionarla arrastraba trabajo ajeno sin revisar y crearla en las pruebas duplicaba su migración | Construir todo lo demás y dejar voluntarios y horas en una fase propia (T018–T021), bloqueada hasta que HU-08 llegara a `main`; la PR no se abre antes (principio III) | Rubén | Cerrado el 11/11 (`fd19932`) |
| F1 | converge-1 | — | FR-004 parcial: faltaban voluntarios y horas | Ya planificado en la fase 6 (D1); no se añaden tareas | Rubén | Cerrado; `converge-2` sin diferencias (`22eb7c7`) |
| V1 | Validación manual (`validacion-01.md`) | Media | El PDF común solapaba las filas de una tabla cuando una celda ocupaba dos líneas | Corrección en `servicios-comunes/pdf.js`, acordada con el grupo, comprobando que las 33 pruebas del certificado de HU-03 seguían pasando | Rubén | Cerrado (`d203246`) |
