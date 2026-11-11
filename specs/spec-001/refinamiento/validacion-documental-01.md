# Validación documental de T084 / CONV-003 — HU-01

> **Estado actual:** HU-01 revisada por el revisor asignado e incorporada a main mediante la PR #4; `009_operativa_donaciones.sql` es la numeración definitiva. Los estados de preparación y revisión descritos en los apartados fechados corresponden a esas fases anteriores.

**Fecha:** 2026-11-07 · **Rama:** spec-001 · **HEAD inicial:** 93152c4.

**Responsable:** Nada · **Revisor externo:** Rubén, revisión/aprobación pendientes.

## Alcance y estado inicial

Se comprueba que el commit local 93152c4, «HU-01: registra converge-2 y pendiente documental
T084», contiene el segundo diagnóstico y su tarea sin marcar. La rama es spec-001 y solo
 está sin seguimiento. No se comprueba la publicación de ese commit.
Se conservan configuración local, `.env` e históricos. No se ejecuta el siguiente converge.

El alcance es la incoherencia documental CONV-003 de
[converge-2.md](converge-2.md). No se reabren CONV-001/CONV-002 ni se repite su validación.

## Correcciones y fuentes

Las ubicaciones de origen son las de converge-2.md, antes de esta corrección.

| Documento y ubicación anterior                            | Afirmación corregida                                                             | Estado documentado y evidencia                                                                                                                                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [data-model.md](../data-model.md):11                      | No se había creado ni aplicado ninguna migración.                                | 004 y 009 existen en la rama; su aplicación/validación en pruebas consta en [validacion-004-01.md](validacion-004-01.md) y [validacion-local-01.md](validacion-local-01.md). No se afirma aplicación en todos los entornos.            |
| data-model.md, cabecera e incorporación                   | Diseño únicamente y migración operativa descrita como futura sin elección local. | Modelo implementado/validado localmente; 004 como entrega independiente y 009 como elección local como elección de numeración de HU-01, dependiente de 004/base común. Se conserva la revisión y el control de integración pendientes.                |
| [spec.md](../spec.md):153                                 | P-05 todavía sin comprobar.                                                      | Referencias a [preparacion-stripe-01.md](preparacion-stripe-01.md) para T075–T076 y [validacion-stripe-01.md](validacion-stripe-01.md) para recorridos reales y límites. No se afirma integración real para escenarios solo simulados. |
| spec.md:183–184                                           | Implementación y preparación para pruebas como trabajo futuro.                   | Implementación y validación locales enlazadas con la [matriz vigente](matriz-validacion-01.md); los controles de incorporación pendientes antes de main.                                                                                                |
| [pasarela-stripe.md](../contracts/pasarela-stripe.md):204 | Implementación y revisión presentadas ambas como pendientes.                     | Transición rechazo→éxito implementada/comprobada localmente, con fuente en validación local; simulaciones diferenciadas de todos los rechazos reales de Stripe. Revisión e incorporación pendientes.                                   |

Se mantiene la definición única de datos, las transiciones, los criterios funcionales y
los límites de las pruebas. No se cambian reglas de negocio, contratos de ejecución o SQL.
Las afirmaciones de estado se corrigen en documentación vigente, sin reescribir relatos
fechados de los informes de las fases anteriores.

## Separación de estados

- **Implementación local:** disponible en spec-001, con las fuentes identificadas.
- **Validación técnica:** resultados anteriores consultados, con sus entornos, autores y
  límites. Este bloque no ejecuta pruebas funcionales ni consultas externas.
- **Publicación:** no comprobada en este bloque ni deducida de los archivos o commits locales.
- **Incorporación a main:** pendiente de los controles de incorporación según
  [ajuste-flujo-01.md](ajuste-flujo-01.md). No se atribuye aprobación de Rubén, acuerdo
  colectivo o reserva de 009. Se conserva la necesidad de resolver conflictos considerando
  entornos donde la migración ya está aplicada.

## Comprobaciones documentales

Se revisan las diferencias completas de los tres documentos. La búsqueda de las cuatro
afirmaciones obsoletas señaladas no devuelve coincidencias en ellos. Los destinos locales
de los enlaces existen; no se consultan fuentes externas ni se valida de nuevo la cuenta
de Stripe. Las fuentes históricas se leen con su fecha y alcance, no como estado actual.

La comparación de spec.md contra HEAD, normalizando únicamente saltos de línea para el
cotejo, confirma igualdad de estos bloques:

- Historial de clarify y cabecera anterior a los escenarios.
- Escenarios, casos límite, FR-001–FR-019 y entidades, hasta Dependencies.
- SC-001–SC-004 y limitaciones de Assumptions, hasta Open Questions.

Se comprobó el formato, los enlaces y el alcance de los archivos indicados.

La comparación SHA-256 con el estado inicial conserva converge-1.md, converge-2.md,
mediciones y todos los informes anteriores, además de código, migraciones, selección,
`.env`. Los únicos archivos previos modificados son los tres
documentos identificados y tasks.md; este informe es nuevo. En tasks.md únicamente cambia
la marca de T084 y se añade su resultado documental. El índice permanece sin cambios.

## Resultado y parada

**T084 completada en su alcance documental; CONV-003 corregido documentalmente.** Las
afirmaciones señaladas remiten al estado acreditado y distinguen preparación técnica de
aprobación/incorporación. La tarea se marca por estas comprobaciones, no por pruebas
funcionales nuevas. No se modifica ningún requisito ni se atribuye una ejecución ajena.

El cierre técnico queda sujeto al siguiente contraste de converge, no ejecutado en este
bloque. los controles de incorporación continúan pendientes antes de main y no se presentan como bloqueos
del desarrollo. No se declara HU-01 incorporada ni aprobada.

Se detiene para revisión antes de git add o commit, sin pagos, reenvíos, instalaciones,
consultas externas, comunicaciones, cambios de configuración, push, merge o cambio de rama.

**Commit propuesto, no ejecutado:** `HU-01: alinea el estado documental y completa T084`.
