// Reglas de negocio de HU-08 (specs/spec-008/plan.md, «Reglas de asistencias.js»).
import { ahora } from '../../servicios-comunes/fechas.js';

// Desde la hora de inicio y sin plazo posterior (Clarifications 2026-11-04). Las horas no se
// calculan aquí, sino en SQL: repositorio.horasDeActividad (research R5).
export function esRegistrable(actividad) {
  return actividad.estado === 'publicada' && new Date(actividad.inicio) <= ahora();
}
