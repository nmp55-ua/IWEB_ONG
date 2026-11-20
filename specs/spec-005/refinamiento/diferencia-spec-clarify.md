# Diferencia entre la especificación anterior y la revisada — spec-005

Versión anterior: `spec.md` tras el `specify` conjunto y el reparto (commit `a6eadf5`, 28/10/2026).
Versión revisada: `spec.md` tras `clarify` (commit `1a9eac1`, 04/11/2026).

Se obtiene con `git diff a6eadf5 1a9eac1 -- specs/spec-005/spec.md`. Las líneas que empiezan por «-»
son de la versión anterior y las que empiezan por «+», de la revisada. Las decisiones que explican
cada cambio, con su justificación, están en los informes de `clarify` de esta carpeta.

```diff
@@ -10,6 +10,15 @@
 
 **Input**: Descripción del SI-13: "cualquier persona interesada en el voluntariado debe poder consultar las actividades disponibles y apuntarse a las que le interesen, viendo con claridad cuántas plazas quedan libres en cada una y qué requisitos concretos se piden para participar."
 
+## Clarifications
+
+### Session 2026-11-04
+
+- Q: ¿Basta con que el voluntario declare que cumple los requisitos o el sistema debe comprobar alguno automáticamente (por ejemplo, la edad)? → A: Basta con la declaración; el sistema no comprueba ningún requisito ni pide la fecha de nacimiento.
+- Q: ¿Se permite inscribirse en dos actividades que se solapan en el horario? → A: Sí; el sistema no comprueba solapes.
+- Q: Si al confirmar la inscripción otra persona acaba de ocupar la última plaza, ¿qué hace el sistema? → A: No inscribe, indica que ya no quedan plazas y ofrece apuntarse a la lista de espera; nadie entra en la lista de espera sin pedirlo.
+- Q: ¿Qué pasa si un usuario identificado sin el rol de voluntario (por ejemplo, solo donante) intenta inscribirse? → A: Se le deniega con un aviso de que necesita una cuenta de voluntario; no se le añade el rol.
+
 ## User Scenarios & Testing *(mandatory)*
 
 ### User Story 1 - Consultar las actividades disponibles (Priority: P1)
@@ -40,19 +49,26 @@ Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus req
 
 1. **Given** una actividad con plazas libres, **When** un voluntario identificado se inscribe y confirma que cumple los requisitos, **Then** su inscripción queda confirmada y las plazas libres bajan en una.
 2. **Given** el formulario de inscripción, **When** el voluntario no confirma que cumple los requisitos, **Then** no puede completar la inscripción.
-3. **Given** una actividad sin plazas libres, **When** el voluntario la abre, **Then** no se ofrece inscripción directa sino «Apuntarme a la lista de espera» (gestionada en HU-07).
+3. **Given** una actividad sin plazas libres, **When** el voluntario la abre, **Then** no se ofrece inscripción directa sino «Apuntarme a la lista de espera»; si la acepta confirmando los requisitos, queda en lista de espera y ve su posición (las reglas de la lista son de HU-07).
 4. **Given** un voluntario ya inscrito o en lista de espera, **When** intenta inscribirse de nuevo en la misma actividad, **Then** el sistema lo impide y lo indica.
-5. **Given** un voluntario inscrito, **When** cancela su inscripción antes del inicio, **Then** la plaza queda libre y las plazas libres suben en una.
-6. **Given** un usuario no identificado, **When** pulsa «Inscribirme», **Then** se le pide identificarse.
+5. **Given** un voluntario inscrito y la lista de espera vacía, **When** cancela su inscripción antes del inicio, **Then** la plaza queda libre y las plazas libres suben en una.
+6. **Given** un voluntario inscrito y personas en la lista de espera, **When** cancela su inscripción antes del inicio, **Then** su plaza pasa a la primera persona de la lista, que recibe el aviso de HU-07, y las plazas libres no cambian.
+7. **Given** un voluntario en lista de espera, **When** cancela antes del inicio, **Then** sale de la lista y las personas que iban detrás avanzan una posición.
+8. **Given** una actividad con una plaza libre, **When** otra persona la ocupa mientras el voluntario confirma su inscripción, **Then** el sistema no lo inscribe, le indica que ya no quedan plazas y le ofrece apuntarse a la lista de espera.
+9. **Given** un usuario no identificado, **When** pulsa «Inscribirme», **Then** se le pide identificarse.
+10. **Given** un usuario identificado sin el rol de voluntario, **When** intenta inscribirse, **Then** el sistema se lo deniega y le indica que necesita una cuenta de voluntario.
+11. **Given** un voluntario que se inscribe por primera vez, **When** confirma la inscripción, **Then** se le piden nombre, apellidos, correo y teléfono de contacto, que se guardan para las siguientes.
 
 ---
 
 ### Edge Cases
 
-- Dos voluntarios intentan ocupar la última plaza a la vez: solo uno la obtiene; al otro se le ofrece la lista de espera.
+- Dos voluntarios intentan ocupar la última plaza a la vez: solo uno la obtiene; al otro se le indica que no quedan plazas y se le ofrece la lista de espera.
 - Cancelación una vez iniciada la actividad: no se permite.
 - Actividad ya celebrada: no admite inscripción.
 - Actividad cancelada por el coordinador: desaparece del listado y sus inscripciones quedan canceladas (HU-07).
+- Actividades que se solapan en el horario: el voluntario puede inscribirse en todas.
+- Tras cancelar, el voluntario puede volver a inscribirse en la misma actividad si sigue abierta.
 
 ## Requirements *(mandatory)*
 
@@ -61,12 +77,14 @@ Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus req
 - **FR-001**: El sistema MUST mostrar a cualquier persona las actividades publicadas cuya fecha de inicio es futura.
 - **FR-002**: Cada actividad MUST mostrar título, descripción, fecha y horario de inicio y fin, lugar, proyecto, plazas libres / plazas totales y requisitos.
 - **FR-003**: El listado MUST poder filtrarse por proyecto y por fecha.
-- **FR-004**: Inscribirse MUST requerir estar identificado como voluntario y confirmar expresamente que se cumplen los requisitos.
+- **FR-004**: Inscribirse MUST requerir estar identificado con el rol de voluntario y confirmar expresamente que se cumplen los requisitos. El cumplimiento es una declaración del voluntario: el sistema no comprueba ningún requisito. A un usuario identificado sin ese rol se le deniega con un aviso de que necesita una cuenta de voluntario.
 - **FR-005**: Si hay plazas libres, la Inscripción MUST quedar confirmada y las plazas libres MUST disminuir en una.
 - **FR-006**: El número de inscripciones confirmadas MUST NOT superar las plazas de la actividad, ni siquiera con peticiones simultáneas.
-- **FR-007**: Si no hay plazas libres, el sistema MUST ofrecer la lista de espera en lugar de la inscripción directa.
+- **FR-007**: Si no hay plazas libres, el sistema MUST ofrecer la lista de espera en lugar de la inscripción directa, y solo entra en ella quien lo pide. Si la última plaza se ocupa mientras el voluntario confirma, el sistema MUST rechazar la inscripción indicando que no quedan plazas y ofrecer la lista de espera.
 - **FR-008**: Un voluntario MUST NOT tener dos inscripciones activas (confirmada o en lista de espera) en la misma actividad, ni inscribirse en una actividad ya celebrada.
-- **FR-009**: Un voluntario MUST poder cancelar su inscripción hasta el inicio de la actividad; la Inscripción pasa a «cancelada», no se elimina.
+- **FR-009**: Un voluntario MUST poder cancelar su inscripción, confirmada o en lista de espera, hasta el inicio de la actividad; la Inscripción pasa a «cancelada», no se elimina. Si estaba confirmada y hay lista de espera, la plaza pasa a la primera persona de la lista (regla de HU-07) y las plazas libres no cambian; si no hay nadie esperando, suben en una.
+- **FR-010**: El sistema MUST permitir inscribirse en actividades cuyos horarios se solapan; no comprueba solapes.
+- **FR-011**: La primera vez que un voluntario se inscribe, MUST indicar su nombre, apellidos, correo y teléfono de contacto; se guardan y se reutilizan en las siguientes inscripciones.
 
 ### Key Entities
 
@@ -77,6 +95,8 @@ Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus req
 ## Dependencies
 
 - **spec-007 (D)**: define Actividad, sus estados y la lista de espera; la inscripción en lista de espera y el paso automático a confirmada se rigen por sus reglas.
+- **Cancelación con lista de espera** *(acordado con Nicole, T023 de spec-007)*: al cancelar una inscripción confirmada, spec-005 llama a `promoverListaEspera` dentro de la misma transacción y, después del `COMMIT`, a `avisarPlazaConfirmada` de spec-007 para cada inscripción promovida. spec-005 no envía un correo propio.
+- **Funciones que spec-005 ofrece a `actividades`**: `contarConfirmadas`, `listarInscripcionesDeActividad`, `promoverListaEspera` y `cancelarInscripcionesDeActividad` (spec-007), y `listarConfirmadasDeActividad` y `listarInscripcionesDeUsuario` (spec-008).
 - **spec-006 (C, misma persona)** y **spec-008 (D)** consumen Inscripción.
 
 ## Success Criteria *(mandatory)*
@@ -88,10 +108,11 @@ Como voluntario, quiero apuntarme a una actividad confirmando que cumplo sus req
 
 ## Assumptions
 
-- El cumplimiento de requisitos es una declaración del voluntario (pendiente de PA5.1).
+- El cumplimiento de requisitos es una declaración del voluntario (PA5.1).
 - Los datos del Voluntario se limitan a los imprescindibles para contactar con él.
+- Una persona que quiera ser donante y voluntaria elige los dos roles al crear su cuenta.
 
 ## Open Questions (para `/speckit-clarify`)
 
-- **PA5.1**: ¿El sistema debe comprobar algún requisito automáticamente (por ejemplo, la edad a partir de la fecha de nacimiento) o basta con la declaración del voluntario?
-- **PA5.2**: ¿Se permite inscribirse en dos actividades que se solapan en el horario?
+- ~~PA5.1~~: resuelta (ver Clarifications).
+- ~~PA5.2~~: resuelta (ver Clarifications).
```
