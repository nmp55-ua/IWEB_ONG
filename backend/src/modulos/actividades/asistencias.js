// Reglas de negocio de HU-08 (specs/spec-008/plan.md, «Reglas de asistencias.js»).
import { transaccion } from '../../db/pool.js';
import { ErrorApi } from '../../middleware/errores.js';
import { ahora, aIsoMadrid } from '../../servicios-comunes/fechas.js';
import * as inscripciones from './inscripciones.js';
import * as repositorio from './repositorio.js';

const noEncontrada = () => new ErrorApi(404, 'NO_ENCONTRADO', 'No existe la actividad.');

// Desde la hora de inicio y sin plazo posterior (Clarifications 2026-11-04). Las horas no se
// calculan aquí, sino en SQL: repositorio.horasDeActividad (research R5).
export function esRegistrable(actividad) {
  return actividad.estado === 'publicada' && new Date(actividad.inicio) <= ahora();
}

function motivoNoRegistrable(actividad) {
  if (actividad.estado === 'borrador') return 'La actividad está en borrador.';
  if (actividad.estado === 'cancelada') return 'La actividad está cancelada.';
  return 'La actividad todavía no ha comenzado.';
}

export async function obtenerAsistencia(actividadId) {
  const actividad = await repositorio.obtenerPorId(actividadId);
  if (!actividad) throw noEncontrada();
  const confirmadas = await inscripciones.listarConfirmadasDeActividad(actividadId);
  const guardadas = await repositorio.listarAsistencias(confirmadas.map((c) => c.inscripcionId));
  const asistioPorInscripcion = new Map(guardadas.map((g) => [Number(g.inscripcion_id), g.asistio]));
  const datos = confirmadas.map((c) => ({
    ...c,
    asistio: asistioPorInscripcion.get(c.inscripcionId) ?? null,
  }));
  return {
    actividad: {
      id: Number(actividad.id),
      titulo: actividad.titulo,
      estado: actividad.estado,
      inicio: aIsoMadrid(new Date(actividad.inicio)),
      fin: aIsoMadrid(new Date(actividad.fin)),
      horas: await repositorio.horasDeActividad(actividadId),
      registrable: esRegistrable(actividad),
    },
    datos,
    total: datos.length,
  };
}

export async function guardarAsistencia(actividadId, filas, usuario) {
  await transaccion(async (cliente) => {
    const actividad = await repositorio.bloquearPorId(actividadId, cliente);
    if (!actividad) throw noEncontrada();
    if (!esRegistrable(actividad)) {
      throw new ErrorApi(409, 'ASISTENCIA_NO_PERMITIDA', motivoNoRegistrable(actividad));
    }
    const confirmadas = await inscripciones.listarConfirmadasDeActividad(actividadId);
    const validas = new Set(confirmadas.map((c) => c.inscripcionId));
    const campos = {};
    filas.forEach((fila, i) => {
      if (!validas.has(fila.inscripcionId)) {
        campos[`asistencias.${i}`] = 'No es una inscripción confirmada de esta actividad.';
      }
    });
    if (Object.keys(campos).length > 0) {
      throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', campos);
    }
    const horas = await repositorio.horasDeActividad(actividadId, cliente);
    await repositorio.guardarAsistencias(
      filas.map((fila) => ({ ...fila, horas, registradaPor: usuario.id, fechaRegistro: ahora() })),
      cliente,
    );
  });
  return obtenerAsistencia(actividadId);
}

// Siempre a partir del usuario de la sesión: nadie puede pedir las horas de otro (FR-007).
export async function horasDeUsuario(usuarioId) {
  const pares = await inscripciones.listarInscripcionesDeUsuario(usuarioId);
  const { totalHoras, filas } = await repositorio.sumarHorasDeInscripciones(pares);
  const datos = filas.map((f) => ({
    actividadId: Number(f.actividad_id),
    titulo: f.titulo,
    inicio: aIsoMadrid(new Date(f.inicio)),
    horas: f.horas,
  }));
  return { totalHoras, datos, total: datos.length };
}
