# Diferencia entre la especificación anterior y la revisada — spec-006

Versión anterior: `spec.md` tras el `specify` conjunto y el reparto (commit `a6eadf5`, 28/10/2026).
Versión revisada: `spec.md` tras `clarify` (commit `5e7e6f7`, 06/11/2026).

Se obtiene con `git diff a6eadf5 5e7e6f7 -- specs/spec-006/spec.md`. Las líneas que empiezan por «-»
son de la versión anterior y las que empiezan por «+», de la revisada. Las decisiones que explican
cada cambio, con su justificación, están en los informes de `clarify` de esta carpeta.

```diff
@@ -10,13 +10,22 @@
 
 **Input**: Descripción del SI-13: "Una vez inscrito en varias actividades, ese voluntario necesita también una manera sencilla de ver todo lo que tiene por delante: un calendario personal con sus próximas actividades, que le ayude a organizar su disponibilidad y a no olvidar ningún compromiso adquirido."
 
+## Clarifications
+
+### Session 2026-11-06
+
+- Q: ¿El calendario permite exportar las actividades a otro calendario con un fichero .ics? → A: No; queda fuera de la v1.
+- Q: ¿Cuándo se actualiza el calendario sin que el voluntario recargue la página? → A: Al abrir la página, después de cada acción del voluntario en el calendario y cada vez que vuelve a la pestaña; no hay consultas periódicas ni avisos desde el servidor.
+- Q: ¿Qué actividades cuentan como «próximas»? → A: Las que aún no han terminado: una de hoy deja de salir al terminar y una de varios días ya empezada sigue saliendo hasta que acaba, sin opción de cancelar.
+- Q: ¿Qué vista ve primero el voluntario? → A: La lista, ordenada por fecha; la vista mensual está a un clic.
+
 ## User Scenarios & Testing *(mandatory)*
 
 ### User Story 1 - Ver mis próximas actividades (Priority: P1)
 
 Como voluntario, quiero ver en un calendario personal mis próximas actividades, para organizar mi disponibilidad y no olvidar ningún compromiso.
 
-El voluntario tiene en su área personal una vista mensual y una vista de lista con las actividades de hoy en adelante en las que tiene inscripción confirmada; las que están en lista de espera se muestran diferenciadas con la etiqueta «en lista de espera».
+El voluntario tiene en su área personal una vista de lista, que es la que ve primero, y una vista mensual con las actividades que aún no han terminado en las que tiene inscripción confirmada; las que están en lista de espera se muestran diferenciadas con la etiqueta «en lista de espera».
 
 **Why this priority**: Es el núcleo de la historia; requiere inscripciones (HU-05).
 
@@ -24,11 +33,11 @@ El voluntario tiene en su área personal una vista mensual y una vista de lista
 
 **Acceptance Scenarios**:
 
-1. **Given** un voluntario con tres inscripciones confirmadas en actividades futuras, **When** abre su calendario, **Then** ve las tres en su día y hora correctos (hora peninsular), en la vista mensual y en la de lista.
-2. **Given** una actividad ya celebrada, **When** el voluntario abre la vista de próximas actividades, **Then** no aparece.
+1. **Given** un voluntario con tres inscripciones confirmadas en actividades futuras, **When** abre su calendario, **Then** ve las tres en su día y hora correctos (hora peninsular), en la vista de lista (la primera es la siguiente) y en la mensual.
+2. **Given** una actividad ya terminada, **When** el voluntario abre su calendario, **Then** no aparece.
 3. **Given** una actividad en la que el voluntario está en lista de espera, **When** abre el calendario, **Then** aparece con la etiqueta «en lista de espera», diferenciada de las confirmadas.
-4. **Given** un voluntario sin actividades futuras, **When** abre el calendario, **Then** ve un mensaje claro con un enlace al listado de actividades disponibles.
-5. **Given** un voluntario identificado, **When** intenta ver el calendario de otro voluntario, **Then** el sistema deniega el acceso.
+4. **Given** un voluntario sin actividades por delante, **When** abre el calendario, **Then** ve un mensaje claro con un enlace al listado de actividades disponibles.
+5. **Given** un voluntario identificado, **When** intenta ver el calendario o una inscripción de otro voluntario, **Then** el sistema no se lo muestra: solo le da el suyo.
 
 ---
 
@@ -42,28 +51,31 @@ Como voluntario, quiero abrir una actividad del calendario para ver su detalle y
 
 **Acceptance Scenarios**:
 
-1. **Given** una actividad del calendario, **When** el voluntario la selecciona, **Then** ve su fecha, horario, lugar y requisitos y la opción de cancelar.
+1. **Given** una actividad del calendario, **When** el voluntario la selecciona, **Then** ve su fecha, horario, lugar y requisitos y la opción de cancelar (o de salir de la lista de espera).
 2. **Given** que el voluntario cancela una inscripción desde el detalle, **When** se completa la cancelación, **Then** la actividad desaparece del calendario sin recargar manualmente.
-3. **Given** que el voluntario sale de la lista de espera y obtiene plaza (HU-07), **When** abre el calendario, **Then** la actividad aparece como confirmada.
+3. **Given** que el voluntario sale de la lista de espera y obtiene plaza (HU-07), **When** abre el calendario o vuelve a su pestaña, **Then** la actividad aparece como confirmada.
 
 ---
 
 ### Edge Cases
 
-- Actividad cancelada por el coordinador: desaparece del calendario (el aviso lo envía HU-07).
-- Actividad que dura varios días: se muestra en todos sus días.
+- Actividad cancelada por el coordinador: desaparece del calendario al abrirlo o al volver a la pestaña (el aviso lo envía HU-07).
+- Actividad que dura varios días: se muestra en todos sus días en la vista mensual y una sola vez en la lista, con sus fechas de inicio y fin.
+- Actividad de varios días ya empezada: sigue en el calendario hasta que termina, sin opción de cancelar (HU-05 solo deja cancelar hasta el inicio).
 - Dos actividades el mismo día: ambas se muestran de forma legible.
+- El coordinador cambia la fecha o el lugar (HU-07): el calendario muestra los nuevos al abrirlo o al volver a la pestaña.
+- Usuario identificado sin el rol de voluntario: no tiene calendario; el servidor se lo deniega con un aviso.
 
 ## Requirements *(mandatory)*
 
 ### Functional Requirements
 
-- **FR-001**: El sistema MUST ofrecer al voluntario una vista mensual y una vista de lista de sus próximas actividades.
-- **FR-002**: El calendario MUST incluir solo actividades con fecha igual o posterior a hoy en las que el voluntario tiene una Inscripción confirmada o en lista de espera; las canceladas no aparecen.
+- **FR-001**: El sistema MUST ofrecer al voluntario una vista de lista, que es la que se abre primero, y una vista mensual de sus próximas actividades.
+- **FR-002**: El calendario MUST incluir solo actividades que aún no han terminado en las que el voluntario tiene una Inscripción confirmada o en lista de espera; las inscripciones canceladas no aparecen.
 - **FR-003**: Las actividades en lista de espera MUST distinguirse visualmente y con la etiqueta «en lista de espera».
-- **FR-004**: Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscripción con las reglas de HU-05.
-- **FR-005**: El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado sin que el voluntario tenga que recargar manualmente.
-- **FR-006**: Un voluntario MUST poder ver solo su propio calendario; la comprobación se hace en el servidor.
+- **FR-004**: Al seleccionar una actividad, el sistema MUST mostrar su detalle y permitir cancelar la inscripción o salir de la lista de espera con las reglas de HU-05 (solo antes del inicio).
+- **FR-005**: El calendario MUST reflejar inscripciones, cancelaciones y cambios de estado sin que el voluntario tenga que recargar manualmente: se actualiza al abrir la página, después de cada acción del voluntario en el calendario y cada vez que vuelve a la pestaña.
+- **FR-006**: Un voluntario MUST poder ver solo su propio calendario; la comprobación se hace en el servidor y no hay forma de pedir el de otra persona.
 
 ### Key Entities
 
@@ -78,13 +90,14 @@ Como voluntario, quiero abrir una actividad del calendario para ver su detalle y
 
 ### Measurable Outcomes
 
-- **SC-001**: El 100 % de las inscripciones activas futuras del voluntario aparecen en su calendario.
+- **SC-001**: El 100 % de las inscripciones activas del voluntario en actividades que aún no han terminado aparecen en su calendario.
 - **SC-002**: El voluntario identifica su siguiente actividad en menos de 10 segundos desde que abre el calendario.
 
 ## Assumptions
 
 - Las fechas se muestran en dd/mm/aaaa y las horas en hora peninsular española.
+- Exportar el calendario (.ics) o recibir recordatorios por correo quedan fuera de la v1.
 
 ## Open Questions (para `/speckit-clarify`)
 
-- **PA6.1**: ¿Se ofrece exportar el calendario (por ejemplo, a un fichero .ics)? (Propuesta: fuera de alcance en v1.)
+- ~~PA6.1~~: resuelta (ver Clarifications).
```
