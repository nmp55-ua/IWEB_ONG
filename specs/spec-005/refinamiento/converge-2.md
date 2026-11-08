# Converge 2 de spec-005 (HU-05), 04/11/2026

Segunda pasada de `/speckit-converge` después de implementar la «Phase 6: Convergence» (T023–T028).
Se vuelve a contrastar cada hallazgo de [converge-1.md](converge-1.md) y de la
[prueba manual](prueba-manual.md) con el código y se repiten todas las pruebas.

| Hallazgo | Tarea | Comprobación | Estado |
|---|---|---|---|
| F1 — fechas imposibles daban 500 | T023 | `controlador.js` valida con `existeDia()` antes de `toISOString()`. La prueba de fechas mal escritas recorre `2026-02-31`, `2026-13-01`, `2026-12-32`, `2026-00-10` y `mañana`: todas dan 400 con «Fecha no válida.». Contra la aplicación en marcha, las tres que antes daban 500 dan 400 | Cerrado |
| F2 — texto de 2.4 | T024 | El quickstart dice «Ya estás inscrito o en la lista de espera de esta actividad.» (igual que `servicio.js`), y 2.1 y 2.2 usan los textos reales de la casilla, del botón y del aviso | Cerrado |
| F3 — comillas del mensaje de fechas | T025 | data-model y `controlador.js` dicen lo mismo: «La fecha «desde» no puede ser posterior a «hasta».» | Cerrado |
| F4 — SQL sobre `actividades` en las semillas | T026 | research R2 indica que la regla es para el módulo; las semillas y las pruebas quedan fuera, como en spec-007. El módulo sigue sin SQL propio sobre `actividades` | Cerrado |
| Tarjeta desfasada tras `PLAZAS_AGOTADAS` | T027 | `FormInscripcion` avisa con `onDesfase` y el listado se recarga; repetido el paso 2.8, al cerrar la ventana la tarjeta dice «0 plazas libres de 10» y ofrece la lista de espera | Cerrado |
| Ventana que no cabe en móvil | T028 | El contenido va dentro de un bloque con `max-h-[60vh] overflow-y-auto`, sin tocar el `Modal` común; en 375×667 cabe entera y se desplaza | Cerrado |

**Pruebas**: 4 ficheros, 88 pasan y 3 saltadas (las `it.skip` de spec-007, cubiertas en
`voluntariado/servicio.test.js`). El front-end compila (`astro build`).

**Brechas nuevas**: ninguna. Queda abierto lo que no depende del código:
- T021, la coordinación con Nicole (visto bueno a `bloquearActividad`, quién siembra las actividades de
  spec-008, texto de su FR-005 y propuesta de cambio de plan-comun al grupo).
- Cronometrar SC-001 con una persona (T022).
