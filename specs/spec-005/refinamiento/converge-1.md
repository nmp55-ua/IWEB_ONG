# Converge 1 de spec-005 (HU-05), 04/11/2026

Informe inicial de `/speckit-converge` sobre el código del commit `dcc696e`, contrastado con `spec.md`,
`plan.md`, `research.md`, `data-model.md`, `contracts/api-voluntariado.md`, `quickstart.md` y `tasks.md`.
Se guarda sin corregir nada. Las tareas que añade (T023–T026) están en la «Phase 6: Convergence» de
`tasks.md`; T027 y T028 salen de la prueba manual del mismo día ([prueba-manual.md](prueba-manual.md)).

**Resultado**: 4 hallazgos (1 MEDIUM y 3 LOW), ninguno crítico ni alto. 33 elementos de la spec
revisados (11 FR, 2 SC, 14 escenarios y 6 casos límite): 0 sin hacer, 1 parcial, 3 contradicciones y
0 código sin justificar. Pruebas: 4 ficheros, 88 pasan y 3 saltadas (las `it.skip` de spec-007, ya
cubiertas en `voluntariado/servicio.test.js`).

## Hallazgos

| ID | Tipo | Gravedad | Origen | Evidencia | Propuesta |
|---|---|---|---|---|---|
| F1 | parcial | MEDIUM | FR-003; contrato de `GET /api/actividades/disponibles` (400 `DATOS_INVALIDOS`); data-model («Fecha no válida.») | `controlador.js:15`: el `refine` llama a `toISOString()` sobre una fecha inválida. Con un mes o un día imposibles (`2026-13-01`, `2026-12-32`, `2026-00-10`) salta un `RangeError` y el manejador común lo convierte en 500 `ERROR_INTERNO`. `2026-02-31` sí da 400, por eso la prueba actual pasa. La interfaz no lo provoca (usa `input type="date"`). | Comprobar que la fecha es válida antes de `toISOString()` y añadir esos casos a la prueba (T023). |
| F2 | contradicción | LOW | Quickstart 2.4; principio III | `servicio.js:144` dice «Ya estás inscrito o en la lista de espera de esta actividad.» y el quickstart espera «Ya estás inscrito en esta actividad.». El texto del código es más exacto (el escenario 4 cubre las dos situaciones). | Cambiar el quickstart; en 2.1, poner también los textos de la casilla y del botón (T024). |
| F3 | contradicción | LOW | data-model, validación de entrada | `controlador.js:33` usa comillas angulares («desde», «hasta») y data-model, rectas. | Igualarlos con comillas angulares (T025). |
| F4 | contradicción | LOW | research R2 («voluntariado nunca consulta actividades con SQL propio») | El módulo cumple (solo usa `voluntariado/actividades.js`), pero `db/semillas/voluntariado.js:68` y `:108` leen `actividades` por título. | Precisar en R2 que la regla es para el módulo; semillas y pruebas quedan fuera (T026). |

## Comprobado y correcto

- **Aforo y bloqueo (R1, FR-006, SC-002)**: `inscribir` bloquea la actividad al empezar la transacción
  y cuenta las confirmadas con el mismo `cliente` (S2). El orden es siempre actividad → inscripciones:
  en inscribir, cancelar, `promoverListaEspera` y en editar y cancelar actividad de spec-007.
- **Cancelar (S1)**: lectura sin bloqueo → `bloquearActividad` → segunda lectura con el mismo `cliente`;
  el correo sale después del `COMMIT` y si falla no se deshace nada.
- **Acceso a actividades (R2)** y **regla de la importación circular**: se cumplen. `inscripciones.js`
  solo reexporta las seis funciones; en `actividades/servicio.js` el único cambio es `bloquearActividad`.
- **Códigos y mensajes del contrato**: todos coinciden salvo F1 (401, 403 antes que la validación,
  `PERFIL_INCOMPLETO`, 404, `ACTIVIDAD_CELEBRADA`, `YA_INSCRITO` también por el índice único,
  `PLAZAS_AGOTADAS`, `INSCRIPCION_NO_CANCELABLE`, 404 si no es suya, 400 con otra acción).
- **Recursos, seis funciones y migración**: con la forma del contrato y de data-model.
- **Textos de la interfaz**: coinciden con el quickstart salvo F2.

## Cobertura

| Elemento | Resultado |
|---|---|
| FR-001, FR-002, FR-004 a FR-011 | cumple |
| FR-003 | filtrado correcto; validación de fechas parcial (F1) |
| SC-002 | cumple |
| SC-001 | sin verificar (T022) |
| US1 (3 escenarios), US2 (11 escenarios), 6 casos límite | cumple |
| Contrato (5 rutas y 6 funciones) | cumple salvo F1 |
| Constitución III | parcial (F2, F3, T022); XI y XII pendientes de la coordinación (T021) |
