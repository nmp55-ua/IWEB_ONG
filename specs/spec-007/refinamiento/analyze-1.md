## Análisis de spec-007

He revisado `spec.md`, `plan.md` y `tasks.md`, y lo he contrastado con spec-005 y la constitución. Es solo lectura: no he cambiado nada. No hay problemas críticos, pero hay 3 importantes en la frontera con spec-005.

### Problemas importantes

**H1. Nadie se encarga de verdad de la promoción cuando cancela un voluntario.**
- **Dónde:** US2 escenarios 2 y 4, FR-006 y SC-002 de spec-007; FR-009 de spec-005; T023.
- **Qué pasa:** spec-005 dice que la lista de espera «se rige por las reglas de HU-07». En cambio, T023 solo dice «comprobar con Javi». Así, ninguna de las dos specs tiene una tarea que llame a `promoverListaEspera` al cancelar un voluntario ni que envíe ese correo.
- **Propuesta:** acordar con Javi que su cancelación llama a `promoverListaEspera`. El correo «plaza confirmada» saldría de una sola función compartida: o la define T022, o la pone el servicio de voluntariado. Hay que dejarlo escrito en ambas specs.

**H2. El servicio provisional se crea dentro del módulo de Javi.**
- **Dónde:** T004, plan.md (sección Dependencias), CONVENCIONES §2 y principio VIII.
- **Qué pasa:** crear `modulos/voluntariado/servicio.js` en `spec-007` choca con la propiedad del módulo y garantiza un conflicto de merge cuando Javi suba el suyo.
- **Propuesta:** dejar el provisional en `modulos/actividades/inscripciones.js`, que reexportaría las funciones de voluntariado cuando existan. También vale que Javi suba a `main` un esqueleto de su servicio junto con la migración 006.

**H3. La prueba independiente de US1 depende de spec-005.**
- **Dónde:** US1 «Independent Test» y escenario 3; quickstart 1.3.
- **Qué pasa:** «aparece en el listado público» es la ruta `GET /api/actividades/disponibles` de spec-005. Mientras no exista, US1 no se puede validar por sí sola.
- **Propuesta:** hasta entonces, validar con `GET /api/actividades?estado=publicada` y decirlo en el quickstart. La comprobación pública se haría al integrar spec-005.

### Problemas medios y menores

| ID | Gravedad | Dónde | Problema | Propuesta |
|---|---|---|---|---|
| M1 | Media | spec-005 escenario 5 / Edge Cases de spec-007 | spec-005 dice que al cancelar, las plazas libres «suben en una». Eso no es cierto si hay lista de espera: se quedan igual, porque la plaza pasa al siguiente. | Matizar el escenario de spec-005 («si la lista de espera está vacía»). |
| M2 | Media | contrato, plan-comun §7 | El plan común no dice qué devuelven `promoverListaEspera` y `cancelarInscripcionesDeActividad`. spec-007 necesita la lista de afectados para enviar los correos. | Incluir el valor de retorno en el acuerdo con Javi (T004). |
| M3 | Media | spec.md Clarifications (Q2) | El commit `4da496a` dice «la 2 pendiente de confirmar con Javi», pero la spec la da por cerrada. | Añadir esa nota en la spec o confirmar con Javi. |
| M4 | Media | T021 | Las pruebas de SC-002/SC-003 quedan en `it.skip` hasta que exista spec-005, y no cubren la promoción al cancelar un voluntario. | Añadir ese caso a T021 al integrar, junto con H1. |
| L1 | Menor | US2 escenario 4 | Que las siguientes avancen una posición no tiene tarea, porque la posición es un valor calculado. | Añadir una aserción en T021. |
| L2 | Menor | T017 | No dice con qué función se pasa de `datetime-local` a ISO con desfase de Madrid; `lib/formato.js` solo formatea. | Indicar el fichero o la función. |
| L3 | Menor | FR-008 «deja de estar disponible» | Ninguna tarea de spec-007 lo comprueba; depende del filtro de spec-005 (su FR-001). | Comprobarlo al integrar (quickstart 1.5). |

### Cobertura

| Requisito | ¿Tiene tarea? | Tareas |
|---|---|---|
| FR-001 crear, editar, publicar, cancelar | Sí | T009–T016, T017–T020 |
| FR-002 campos | Sí | T001, T015, T017 |
| FR-003 fechas y proyecto | Sí | T006, T009, T011, T012 |
| FR-004 estados | Sí | T001, T012, T013 |
| FR-005 entrar en lista de espera | Lo hace spec-005 | — |
| FR-006 promoción automática | Solo en parte (H1) | T022, T023 |
| FR-007 plazas ≥ confirmados | Sí | T011, T008 |
| FR-008 aviso al cancelar | Sí | T013 |
| FR-009 ver inscritos y lista de espera | Sí | T014, T019 |
| FR-010 solo coordinador | Sí | T007, T008 |
| FR-011 editar una publicada y avisar | Sí | T011, T019, T024 |
| SC-001 menos de 3 min | Sí | T026 |
| SC-002 / SC-003 | Solo en parte (M4) | T021 |

**Tareas sin requisito que las justifique:** ninguna. T024 (principio XII) y T025 (Prettier) están justificadas.

**Constitución:** no hay incumplimientos. H2 choca con CONVENCIONES, que el principio IX hace obligatorias, pero T004 ya dice que se acuerda con Javi.

**Cifras:**

| Medida | Valor |
|---|---|
| Requisitos | 14 (11 FR y 3 SC) |
| Tareas | 26 |
| Cobertura completa | 11 de 14 |
| Cobertura parcial | 2 (FR-006, SC-002/SC-003) |
| Delegados en spec-005 | 1 (FR-005) |
| Ambigüedades | 3 |
| Duplicados | 0 |
| Críticos | 0 |

### Siguientes pasos

Puedes pasar a `/speckit-implement`. Antes de llegar a la fase 4 (US2) conviene cerrar H1 y M2 con Javi, y H2 antes de T004.
