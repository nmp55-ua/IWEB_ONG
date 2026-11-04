# Clarify de spec-005 (HU-05), 04/11/2026

Decisiones tomadas en `/speckit-clarify` sobre la versión de `spec.md` del 28/10 (commit `2a1b1df`).

| ID | Pregunta | Respuesta | Por qué | Afecta a |
|---|---|---|---|---|
| PA5.1 | ¿Basta con que el voluntario declare que cumple los requisitos o el sistema comprueba alguno (la edad, por ejemplo)? | Basta con la declaración. | Los requisitos son texto libre («mayor de edad», «carné de conducir»…), así que no hay forma general de comprobarlos. Pedir la fecha de nacimiento sería un dato personal más (principio V) y una migración nueva sobre la tabla de Nicole. | FR-004, Assumptions |
| PA5.2 | ¿Se puede uno inscribir en dos actividades que se solapan? | Sí, no se comprueba. | Es lo más simple (principio I) y el calendario de HU-06 ya enseña las dos. Bloquearlo choca con la lista de espera: al promover a alguien automáticamente (PA7.2) podría quedar confirmado en dos actividades a la vez sin que nadie lo haya comprobado. | FR-010, Edge Cases |
| Q3 | Si la última plaza se ocupa mientras el voluntario confirma, ¿qué pasa? | No se inscribe; se le dice que no quedan plazas y se le ofrece la lista de espera. | Al liberarse una plaza la persona en espera queda confirmada sin preguntarle (decisión PA7.2 de spec-007). Por eso nadie debería acabar en la lista de espera sin haberlo pedido. | FR-007, escenario 8, Edge Cases |
| Q4 | ¿Qué pasa si un usuario sin rol de voluntario (solo donante) intenta inscribirse? | Se le deniega con un aviso. | Al registrarse ya se pueden elegir los dos roles. Añadir el rol desde aquí cambiaría la tabla común `usuarios` y necesitaría el acuerdo del grupo (principio XII). | FR-004, escenario 10, Assumptions |

## Otros cambios en `spec.md`

- **Escenario 5 dividido en 5 y 6** (hallazgo M1 del primer analyze de spec-007): al cancelar, las plazas libres solo suben si la lista de espera está vacía; si no, la plaza pasa a la primera persona. Se añade el escenario 7 para cuando quien cancela está en lista de espera.
- **Dependencies**: se apunta el acuerdo de la T023 de spec-007 (la cancelación llama a `promoverListaEspera` en la misma transacción y, tras el `COMMIT`, a `avisarPlazaConfirmada`) y las seis funciones que el servicio de voluntariado ofrece a `actividades` (cuatro para spec-007 y dos para spec-008, pedidas por Nicole el 04/11).
- **FR-011 y escenario 11**: los datos de contacto del voluntario se piden la primera vez que se inscribe. No es nuevo: viene de plan-comun §3 («el Voluntario se crea al completar el perfil de voluntario la primera vez») y de la entidad Voluntario, pero la spec no tenía ningún criterio que lo comprobara.

No ha quedado ninguna pregunta abierta en la spec.
