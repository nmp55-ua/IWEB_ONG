# Converge 2 de spec-006 (HU-06), 06/11/2026

Segunda pasada de `/speckit-converge` después de implementar la «Phase 6: Convergence» (T015–T024). Se
vuelve a contrastar cada hallazgo de [converge-1.md](converge-1.md) y de la [prueba manual](prueba-manual.md)
con el código, y se repiten todas las pruebas. «Antes» es lo observado con el código del commit `a751d67`;
«después», con el de este commit, en la aplicación en marcha.

| Hallazgo | Tarea | Antes | Después | Estado |
|---|---|---|---|---|
| F1 — al cambiar de mes se desmontaba la cabecera | T015 | Con el foco en «›», al pulsarlo el foco pasa a `BODY` y hay que volver a recorrer el menú y las pestañas | El foco sigue en «Mes siguiente», el `h2` («Diciembre de 2026») no se vuelve a crear y anuncia el cambio; «Cargando…» sale solo donde va la cuadrícula | Cerrado |
| F2 — una recarga que fallaba vaciaba la vista | T016 | Con la red cortada al volver a la pestaña, de 4 tarjetas a 0 y solo «No se puede conectar con el servidor.» | Siguen las 4 tarjetas con el aviso encima; en la siguiente vuelta, ya con red, el aviso desaparece | Cerrado |
| F3 — tras un 409 la tarjeta seguía ofreciendo cancelar | T017 | El coordinador cancela Charla; al cancelarla desde el calendario, «Esta inscripción ya está cancelada.» y, al cerrar, la tarjeta sigue con *Cancelar inscripción* | Mismo caso: al cerrar la confirmación se vuelve a pedir la vista y Charla desaparece | Cerrado |
| F4 — contraste | T018 | Días de otro mes en `text-gray-400` sobre `bg-gray-50`: 2,4:1 | `text-gray-600` (color calculado `rgb(75, 85, 99)`): 7,2:1. El color común `aviso` sigue en 4,2:1 sobre blanco (Lighthouse `color-contrast` en «En lista de espera · posición 1», también en HU-05): se propone al grupo `#9A5B00` (5,4:1), T013 | Cerrado en spec-006 · `aviso` pendiente del grupo |
| F5 — doble error con una fecha mal escrita | T019 | `?desde=2026-13-01&hasta=2026-12-01` → `campos.desde` «Fecha no válida.» y `campos.hasta` «La fecha «desde» no puede ser posterior a «hasta».» (también en `/api/actividades/disponibles`) | Solo `campos.desde`, en las dos rutas; `?desde=2026-12-05&hasta=2026-12-01` sigue dando el error de orden. Caso nuevo en `calendario.test.js` | Cerrado |
| F6 — `diaMadrid` dependía del formato de `en-CA` | T020 | `formatoDia.format(...)` daba el texto de presentación de un idioma | `formatToParts` con año, mes y día de `Europe/Madrid`; mismos resultados con el navegador en otra zona (`TZ=Pacific/Auckland`): semanas de noviembre, actividad del 30/11 al 02/12 y la que acaba a las 00:00 | Cerrado |
| F7 — texto del paso 2.1 | T021 | El quickstart decía que el detalle desplegaba también la fecha, el horario y el lugar | Dice que la tarjeta ya los enseña y el detalle añade proyecto, requisitos, descripción y el botón | Cerrado |
| P1 — orden de encabezados | T022 | Lista: `H1`, `H3`…; mes: `H3` del día y `H3` de cada tarjeta. Lighthouse `heading-order` falla | Lista: `H1 Mi calendario`, `H2 Charla…`; mes: `H2 Noviembre de 2026`, `H3 Martes, 17/11/2026`, `H4 Charla…`. Lighthouse `heading-order` pasa | Cerrado |
| P2 — pestañas con el aviso de 403 | T023 | Como donante: «Lista · Mes · No tienes permiso para realizar esta acción.» | Solo «No tienes permiso para realizar esta acción.» | Cerrado |
| P3 — etiquetas recortadas | T024 | Etiqueta del 17 recortada y sin `title` | `title` «10:00 Charla sobre el agua en el instituto» y, en la de espera, «11:00 Visita a la depuradora (en lista de espera)» | Cerrado |

**Pruebas**: 5 ficheros, 101 pasan y 3 saltadas (las `it.skip` de spec-007, cubiertas en
`voluntariado/servicio.test.js`). El front-end compila (`astro build`) y Prettier no cambia nada en los
ficheros del módulo. Lighthouse (escritorio): accesibilidad 96 por el color común `aviso` (F4) y buenas
prácticas 100; la meta descripción es del `Layout` común.

Se actualizan research R1, R3, R4, R5 y R6 con lo que cambia (T015–T024), para que los documentos digan lo
mismo que el código.

**Brechas nuevas**: ninguna. Queda abierto lo que no depende del código:
- T013, la coordinación con el grupo y con Nicole (semillas, su `enMadrid`, sus pasos 1.6 y 2.3, su
  contrato, spec-008 y el color `aviso`).
- Cronometrar SC-002 con una persona y probar en un navegador normal que al cambiar de pestaña o de
  ventana el calendario se actualiza solo (T014).
