// Único punto desde el que el módulo voluntariado accede a las actividades (dueño: spec-007).
// Contrato: specs/spec-005/contracts/api-voluntariado.md, «Lo que spec-005 usa de actividades».
export { avisarPlazaConfirmada, bloquearActividad, listar } from '../actividades/servicio.js';
