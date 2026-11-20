# Reparto de historias: 4 personas × 2 historias

Grupo G10 · Sistema de Información 13 (Donaciones y Voluntariado para una ONG).

| Persona | Integrante (GitHub) | Historias | Spec / rama | Tema | Revisa |
|---|---|---|---|---|---|
| **A** | Nada (`nb97-ua`) | HU-01 + HU-02 | [spec-001](../specs/spec-001/spec.md), [spec-002](../specs/spec-002/spec.md) | Donaciones: entra el dinero y el donante consulta lo que ha aportado | HU-03, HU-06 |
| **B** | Rubén (`rlo7-ua`) | HU-03 + HU-04 | [spec-003](../specs/spec-003/spec.md), [spec-004](../specs/spec-004/spec.md) | Resultados: certificado fiscal anual e informes para la junta | HU-01, HU-08 |
| **C** | Javi (`jms153-ua`) | HU-05 + HU-06 | [spec-005](../specs/spec-005/spec.md), [spec-006](../specs/spec-006/spec.md) | Voluntario: inscribirse en actividades y ver su calendario | HU-02, HU-07 |
| **D** | Nicole (`nmp55-ua`) | HU-07 + HU-08 | [spec-007](../specs/spec-007/spec.md), [spec-008](../specs/spec-008/spec.md) | Coordinador: actividades, lista de espera y asistencia | HU-04, HU-05 |

Cada historia se desarrolló en su rama (`spec-001` a `spec-008`) y llegó a `main` con un pull
request aprobado por su revisor:

| Spec | Historia | Responsable | Revisor | PR |
|---|---|---|---|---|
| spec-001 | HU-01 Donación puntual o alta como socio | Nada | Rubén | #4 |
| spec-002 | HU-02 Historial de aportaciones | Nada | Javi | #6 |
| spec-003 | HU-03 Certificado fiscal anual | Rubén | Nada | #5 |
| spec-004 | HU-04 Informes para la junta | Rubén | Nicole | #8 |
| spec-005 | HU-05 Consulta e inscripción en actividades | Javi | Nicole | #2 |
| spec-006 | HU-06 Calendario del voluntario | Javi | Nada | #3 |
| spec-007 | HU-07 Gestión de actividades y lista de espera | Nicole | Javi | #1 |
| spec-008 | HU-08 Asistencia y horas de voluntariado | Nicole | Rubén | #7 |

## Por qué así

- **A (HU-01 + HU-02)**: las dos trabajan con Donante y Aportación. Quien crea las aportaciones es
  quien mejor sabe cuáles debe mostrar el historial (solo las confirmadas) y cómo se vincula una
  cuenta con su donante.
- **B (HU-03 + HU-04)**: las dos solo leen datos de otros y los resumen. El certificado y el informe
  usan las mismas reglas de cálculo (aportaciones confirmadas por fecha de cobro en hora de Madrid),
  así que conviene que las lleve una sola persona.
- **C (HU-05 + HU-06)**: las dos son pantallas del voluntario y giran en torno a la Inscripción. El
  calendario solo muestra y cancela inscripciones que crea HU-05.
- **D (HU-07 + HU-08)**: las dos son del coordinador y giran en torno a la Actividad. Quien define
  los estados de una actividad decide también cuándo se puede pasar lista.

## Dependencias entre personas

- **D** (HU-07) y **A** (HU-01) son la base: actividades por un lado y aportaciones por otro.
- **C** necesita las actividades de **D**. La lista de espera se acordó entre los dos: al cancelar
  una inscripción confirmada, HU-05 llama a `promoverListaEspera` en la misma transacción y, tras el
  `COMMIT`, a `avisarPlazaConfirmada` de HU-07, que es la única que envía el correo de plaza confirmada.
- **D** (HU-08) necesita las inscripciones confirmadas de **C** para pasar lista. La migración de
  voluntariado (006) se adelantó para que la de asistencias (007) pudiera apoyarse en ella.
- **B** necesita las aportaciones de **A** (HU-03 exige el NIF/NIE que pide HU-01 y el vínculo
  verificado de `/donar/vincular`) y, para el informe, las actividades y asistencias de **D** y las
  inscripciones de **C**. Mientras no estuvieron en `main` trabajó con datos de prueba.
- **A** (HU-02) y **B** (HU-03) deben dar el mismo total anual al céntimo.

## Acuerdos comunes

Antes de empezar cada historia se cerraron en común:

1. **Constitución** del proyecto ([`.specify/memory/constitution.md`](../.specify/memory/constitution.md)).
2. **Plan común** ([`specs/plan-comun.md`](../specs/plan-comun.md)) y **modelo de datos único**
   ([`specs/modelo-datos.md`](../specs/modelo-datos.md)): cada entidad tiene una sola spec dueña y
   el resto la consume.
3. **Convenciones** de código, ramas y commits ([`CONVENCIONES.md`](../CONVENCIONES.md)).
4. **Revisión cruzada**: ninguna historia entra en `main` sin la aprobación de su revisor en el PR.

## Orden seguido

Las ocho historias se trabajaron en paralelo, cada una en su rama. El orden de llegada a `main`
siguió las dependencias:

1. Base común: usuarios, sesiones, roles y proyectos (migraciones 001 a 003).
2. HU-07 (PR #1, 04/11), HU-05 (PR #2, 06/11) y HU-06 (PR #3, 06/11): actividades e inscripciones.
3. HU-01 (PR #4, 07/11) y HU-03 (PR #5, 08/11): aportaciones y certificado.
4. HU-02 (PR #6, 11/11), HU-08 (PR #7, 11/11) y HU-04 (PR #8, 12/11): historial, asistencia y,
   la última, el informe, que necesita los datos de todas las demás.

El detalle de responsabilidades, iteraciones y valoraciones de cada integrante está en
[`memoria.md`](memoria.md).
