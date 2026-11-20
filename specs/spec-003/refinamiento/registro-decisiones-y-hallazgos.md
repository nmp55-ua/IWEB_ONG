# Registro de decisiones y hallazgos — spec-003 (HU-03)

**Responsable**: Rubén · **Revisora**: Nada · **Herramienta**: Spec Kit 1.0.4 (comandos `/speckit-*`) con Claude Code

Reúne en un solo sitio lo que ya está en la sección *Clarifications* de [`spec.md`](../spec.md), en
[`research.md`](../research.md), en [`analyze-1.md`](analyze-1.md), [`analyze-2.md`](analyze-2.md) y
[`converge-1.md`](converge-1.md), y en la revisión del PR #5.

## 1. Decisiones de clarify (enunciado §5.1)

Dos sesiones. La diferencia entre la spec anterior y la revisada es el propio commit de cada sesión:
`17a33c6` (sesión del 04/11: `git show 17a33c6 -- specs/spec-003/spec.md`) y `7d3a0ef` (sesión del
08/11: `git show 7d3a0ef -- specs/spec-003/spec.md`).

| # | Pregunta | Respuesta | Justificación | Criterios afectados |
|---|---|---|---|---|
| C1 (PA3.1) | Si cambia el total de un ejercicio con el certificado ya emitido, ¿qué pasa con el certificado? | Se regenera el mismo: nuevo total, nueva fecha de emisión y código nuevo; el anterior deja de ser válido. Un único certificado por donante y ejercicio | El certificado debe reflejar siempre el total real; con uno solo por ejercicio no circulan dos documentos válidos para el mismo año, y el código nuevo permite a un tercero saber cuál vale (research R2 y R4) | FR-008, FR-011, escenario de regeneración |
| C2 (PA3.2) | ¿Se avisa por correo cuando hay un certificado nuevo o regenerado? | Sí, con enlace al área personal y sin el PDF adjunto | El donante necesita saber que ya puede descargarlo, pero los datos fiscales no tienen que viajar por correo: se pide solo lo imprescindible (principio V; research R8) | FR-009, escenario 12 |
| C3 | Si un donante no tenía NIF/NIE el 1 de enero y lo añade después, ¿se genera su certificado? | *Sustituida por C6* | — | — |
| C4 | ¿Hay una página pública para comprobar un certificado con su código? | Sí, sin iniciar sesión; con un código válido muestra ejercicio, importe, fecha y NIF/NIE enmascarado; uno antiguo o inexistente sale como «no válido» | Quien recibe el certificado (por ejemplo, Hacienda o una gestoría) tiene que poder comprobarlo sin cuenta. No se distingue entre código antiguo, inexistente o mal escrito para no dar pistas, y el NIF va enmascarado (research R5 y R10) | FR-011, escenario 10 |
| C5 | Si un donante donó sin cuenta, ¿se genera su certificado y cómo accede? | *Sustituida por C7* | — | — |
| C6 | ¿Qué se hace con el donante sin NIF/NIE, si HU-01 lo exige en cada donación? | Se elimina el caso: todo Donante tiene NIF/NIE. Se quitan FR-010, el escenario 10 antiguo y su caso límite | HU-01 (`004_donaciones`) no deja donar sin NIF/NIE ni cambiarlo después, así que el caso no puede darse; mantenerlo sería alcance fantasma (principio II) | FR-001, FR-010 (eliminado) |
| C7 | ¿Cómo accede a sus certificados quien donó sin cuenta, si coincidir en el correo no da acceso? | El certificado se genera igualmente; el correo le invita a crear o usar una cuenta de donante y vincularla en `/donar/vincular`. HU-03 no crea vínculos | La autorización la da solo el vínculo verificado de HU-01; usar la coincidencia de correo dejaría ver datos fiscales a quien no es su dueño (research R9) | FR-007, FR-012 |
| C8 | ¿Qué pasa si se confirma tarde un cobro de un ejercicio con certificado (pago del 31/12 confirmado el 2/1)? | Se regenera el certificado con el nuevo total, fecha y código, y se envía el aviso | HU-01 no corrige ni anula aportaciones confirmadas, así que la confirmación tardía es el único motivo por el que puede cambiar el total; precisa C1 | FR-008, FR-009 |

## 2. Hallazgos de analyze (enunciado §5.2)

Primera pasada sobre el commit `c347468` ([`analyze-1.md`](analyze-1.md)): 0 CRITICAL, 1 HIGH,
3 MEDIUM y 3 LOW. Las correcciones y la segunda pasada están en [`analyze-2.md`](analyze-2.md)
(commit `edc97c6`): 0 CRITICAL, 0 HIGH y solo C1, aceptado.

| ID | Informe | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| T1 | analyze-1 | Alta | T023 pedía pasar todas las pruebas en una sola base `ong_test`, pero las de HU-01 fallan si su base no es `ong_test_hu01` | Dos bases en el mismo PostgreSQL desechable: `ong_test` para todo salvo donaciones y `ong_test_hu01` para HU-01 (T023 y quickstart) | Rubén | Cerrado (`edc97c6`) |
| I1 | analyze-1 | Media | El mensaje del ejercicio sin aportaciones tenía tres redacciones distintas en contrato, quickstart y tareas | Un único texto en contrato, quickstart, servicio e interfaz | Rubén | Cerrado (`edc97c6`) |
| A1 | analyze-1 | Media | La spec dice que el certificado se emite «en ese momento» tras una confirmación tardía; el plan lo hace con una tarea horaria | Se mantiene la tarea horaria y se precisa en research R3 y en el quickstart: siguiente ejecución (≤ 1 h) u orden manual; lo descartado es esperar al 1 de enero. Avisar a HU-01 en cada pago acoplaba los dos módulos | Rubén | Cerrado (`edc97c6`, `d754a75`) |
| C1 | analyze-1 | Media | SC-001 compara con el historial de HU-02, que aún no estaba en `main` | Pendiente explícito en T024 hasta integrar HU-02; después se acreditó con los recorridos R3 y R4 de la matriz | Rubén | Cerrado tras integrar HU-02 |
| I2 | analyze-1 | Baja | T022 tocaba `backend/src/modulos/LEEME.md`, que no estaba en la lista de cambios comunes del plan | Añadido al punto 6 del plan | Rubén | Cerrado (`edc97c6`) |
| U1 | analyze-1 | Baja | Las pruebas de la API dependían de `AHORA_SIMULADO`, y T013 no lo decía | Fijarlo antes de importar la app, como `calendario.test.js` (T013) | Rubén | Cerrado (`edc97c6`) |
| U2 | analyze-1 | Baja | Entre una confirmación tardía y la siguiente ejecución horaria, la página diría «no tienes aportaciones» | Aceptado en v1 (≤ 1 h) y documentado en research R9 | Rubén | Aceptado |

## 3. Otros hallazgos (converge y revisión)

| ID | Origen | Gravedad | Evidencia (resumen) | Decisión | Responsable | Estado |
|---|---|---|---|---|---|---|
| F1 | converge-1 | Baja | En el PDF, pdfkit partía la dirección de verificación por `?` y quien la tecleara desde el papel podía equivocarse | La dirección va en su propia línea (T025) | Rubén | Cerrado (`29ae458`); `converge-2` sin diferencias |
| R1 | Revisión del PR #5 (Nada) | Alta | El total anual se guardaba en `NUMERIC(10,2)`, como una sola aportación: 101 aportaciones máximas en un año lo desbordarían | `NUMERIC(15,2)` en la migración 008 y en `modelo-datos.md`, con prueba de regresión que falla con el tipo anterior | Rubén | Cerrado (`223fd54`) |
