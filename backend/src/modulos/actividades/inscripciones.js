// Único punto desde el que el módulo actividades accede a las inscripciones (dueño: spec-005).
// Contratos: specs/spec-007/contracts/api-actividades.md y specs/spec-005/contracts/api-voluntariado.md.
export {
  cancelarInscripcionesDeActividad,
  contarConfirmadas,
  listarConfirmadasDeActividad,
  listarInscripcionesDeActividad,
  listarInscripcionesDeUsuario,
  promoverListaEspera,
} from '../voluntariado/servicio.js';
