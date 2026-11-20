# Diferencia entre la especificación anterior y la revisada — spec-007

Versión anterior: `spec.md` tras el `specify` conjunto y el reparto (commit `a6eadf5`, 28/10/2026).
Versión revisada: `spec.md` tras `clarify` (commit `4da496a`, 28/10/2026).

Se obtiene con `git diff a6eadf5 4da496a -- specs/spec-007/spec.md`. Las líneas que empiezan por «-»
son de la versión anterior y las que empiezan por «+», de la revisada. Las decisiones que explican
cada cambio, con su justificación, están en los informes de `clarify` de esta carpeta.

```diff
@@ -10,6 +10,16 @@
 
 **Input**: Descripción del SI-13: "Quien coordina los proyectos de la organización, por su parte, es el encargado de crear y mantener las actividades disponibles, definiendo cuántas plazas tiene cada una y gestionando la correspondiente lista de espera cuando la demanda supera al aforo previsto."
 
+## Clarifications
+
+### Session 2026-10-28
+
+- Q: ¿Puede un coordinador gestionar cualquier actividad o solo las de los proyectos que coordina? → A: Cualquier coordinador gestiona cualquier actividad de cualquier proyecto (no hay vínculo coordinador–proyecto).
+- Q: Al liberarse una plaza, ¿se confirma directamente o hay plazo para aceptarla? → A: Confirmación directa con aviso por correo; si no puede asistir, la persona cancela y la plaza pasa a la siguiente.
+- Q: ¿Qué se puede editar de una actividad publicada? → A: Todo, respetando FR-003 y FR-007; si cambian fecha, hora o lugar se avisa por correo a inscritos y lista de espera. Una publicada no vuelve a borrador.
+- Q: ¿Se puede cancelar una actividad ya celebrada y cómo se descarta un borrador? → A: Una celebrada no se puede cancelar ni editar; un borrador se descarta cancelándolo (sin avisos); nunca se borra físicamente.
+- Q: ¿Qué se exige del proyecto y la fecha al crear, editar y publicar? → A: Proyecto activo e inicio futuro en las tres operaciones; desactivar un proyecto no afecta a sus actividades ya publicadas.
+
 ## User Scenarios & Testing *(mandatory)*
 
 ### User Story 1 - Crear, publicar, editar y cancelar actividades (Priority: P1)
@@ -51,7 +61,8 @@ Como coordinador, quiero que, cuando la demanda supere el aforo, los interesados
 
 ### Edge Cases
 
-- Actividad ya celebrada o cancelada: no se puede editar ni volver a publicar.
+- Actividad ya celebrada (inicio pasado) o cancelada: no se puede editar, cancelar ni volver a publicar; el sistema lo rechaza explicando el motivo.
+- Un borrador que no se quiere se descarta cancelándolo (sin avisos, porque no tiene inscritos); las actividades nunca se borran físicamente.
 - Se libera una plaza y la lista de espera está vacía: las plazas libres aumentan en una.
 - Una actividad cancelada conserva sus inscripciones con estado «cancelada»; no se eliminan.
 
@@ -61,14 +72,15 @@ Como coordinador, quiero que, cuando la demanda supere el aforo, los interesados
 
 - **FR-001**: El coordinador MUST poder crear, editar, publicar y cancelar actividades.
 - **FR-002**: Cada Actividad MUST tener título, descripción, Proyecto, fecha y hora de inicio y fin, lugar, plazas (entero mayor que cero) y requisitos (texto, puede estar vacío).
-- **FR-003**: El sistema MUST validar que el fin es posterior al inicio y que el inicio es posterior al momento actual.
+- **FR-003**: Al crear, editar y publicar, el sistema MUST validar que el fin es posterior al inicio, que el inicio es posterior al momento actual y que el Proyecto está activo; un borrador cuyo inicio ya ha pasado no se puede publicar. Desactivar un proyecto no afecta a sus actividades ya publicadas.
 - **FR-004**: Los estados de una Actividad MUST ser borrador, publicada o cancelada; solo las publicadas son visibles para los voluntarios.
 - **FR-005**: Cuando una actividad publicada está completa, las nuevas solicitudes MUST entrar en una lista de espera por orden de llegada.
-- **FR-006**: Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confirmar automáticamente a la primera persona de la lista de espera y avisarla por correo.
+- **FR-006**: Al liberarse una plaza (cancelación de un inscrito o aumento de plazas), el sistema MUST confirmar automáticamente y de inmediato a la primera persona de la lista de espera (sin plazo de aceptación ni estado intermedio) y avisarla por correo; si no puede asistir, cancela ella misma su inscripción y la plaza pasa a la siguiente.
 - **FR-007**: El sistema MUST NOT permitir reducir las plazas por debajo del número de inscritos confirmados.
 - **FR-008**: Al cancelar una actividad, el sistema MUST avisar a inscritos y lista de espera y MUST dejar de mostrarla como disponible.
 - **FR-009**: El coordinador MUST poder consultar, en cada actividad, los inscritos confirmados y la lista de espera con su orden.
-- **FR-010**: Solo los usuarios con rol coordinador MUST poder gestionar actividades; la comprobación se hace en el servidor.
+- **FR-010**: Solo los usuarios con rol coordinador MUST poder gestionar actividades; cualquier coordinador puede gestionar cualquier actividad de cualquier proyecto, sin vínculo coordinador–proyecto. La comprobación se hace en el servidor.
+- **FR-011**: Una actividad publicada MUST poder editarse en todos sus campos (con las validaciones de FR-003 y FR-007); si cambian la fecha, la hora o el lugar, el sistema MUST avisar por correo a inscritos confirmados y lista de espera. Una actividad publicada MUST NOT volver a borrador.
 
 ### Key Entities
 
@@ -95,5 +107,5 @@ Como coordinador, quiero que, cuando la demanda supere el aforo, los interesados
 
 ## Open Questions (para `/speckit-clarify`)
 
-- **PA7.1**: ¿Puede un coordinador editar actividades de proyectos que no coordina?
-- **PA7.2**: ¿Existe un plazo para aceptar la plaza liberada, o se confirma directamente?
+- ~~PA7.1~~: resuelta (ver Clarifications).
+- ~~PA7.2~~: resuelta (ver Clarifications).
```
