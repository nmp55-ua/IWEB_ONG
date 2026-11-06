// Único punto desde el que el módulo voluntariado accede a las actividades (dueño: spec-007).
// Contratos: specs/spec-005/contracts/api-voluntariado.md, «Lo que spec-005 usa de actividades», y
// specs/spec-006/contracts/api-calendario.md, «Lo que spec-006 usa de actividades».
export { avisarPlazaConfirmada, bloquearActividad, listar, obtener } from '../actividades/servicio.js';
