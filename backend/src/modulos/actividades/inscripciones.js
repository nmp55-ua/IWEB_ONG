// Provisional de spec-007: cuando exista spec-005, solo reexporta desde ../voluntariado/servicio.js.
// Es el único punto desde el que el módulo actividades accede a las inscripciones (dueño: spec-005).
// Contrato acordado con Javi: specs/spec-007/contracts/api-actividades.md.
//
// Cuando exista spec-005, todo este fichero se sustituye por:
//   export { contarConfirmadas, listarInscripcionesDeActividad, promoverListaEspera,
//     cancelarInscripcionesDeActividad } from '../voluntariado/servicio.js';

// → número de inscripciones confirmadas de la actividad.
export async function contarConfirmadas(actividadId, cliente) {
  return 0;
}

// → { confirmadas: [{ inscripcionId, nombre, apellidos, correo, telefono, fechaConfirmacion }],
//     enEspera: [{ inscripcionId, posicion, nombre, apellidos, correo, telefono, fechaInscripcion }] }
export async function listarInscripcionesDeActividad(actividadId) {
  return { confirmadas: [], enEspera: [] };
}

// Confirma, por orden de llegada, a tantas personas en espera como plazas libres haya.
// → inscripciones promovidas: [{ inscripcionId, nombre, correo }]
export async function promoverListaEspera(actividadId, cliente) {
  return [];
}

// Pasa a «cancelada» las inscripciones confirmadas y en espera de la actividad.
// → inscripciones canceladas: [{ inscripcionId, nombre, correo, estadoAnterior }]
export async function cancelarInscripcionesDeActividad(actividadId, cliente) {
  return [];
}
