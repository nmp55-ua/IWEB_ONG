// Reglas de negocio de HU-07 (specs/spec-007/plan.md, «Reglas de servicio.js»).
import { ErrorApi } from '../../middleware/errores.js';
import { ahora, aIsoMadrid } from '../../servicios-comunes/fechas.js';
import * as repositorio from './repositorio.js';

// Una celebrada es una publicada cuyo inicio ya ha pasado (no es un estado guardado).
const estaCelebrada = (fila) => fila.estado === 'publicada' && new Date(fila.inicio) <= ahora();

// Fila de la base de datos → recurso Actividad del contrato.
export function aRecurso(fila, confirmadas) {
  return {
    id: Number(fila.id),
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    proyecto: { id: Number(fila.proyecto_id), nombre: fila.proyecto_nombre },
    inicio: aIsoMadrid(new Date(fila.inicio)),
    fin: aIsoMadrid(new Date(fila.fin)),
    lugar: fila.lugar,
    plazas: fila.plazas,
    plazasLibres: fila.plazas - confirmadas,
    requisitos: fila.requisitos,
    estado: fila.estado,
    celebrada: estaCelebrada(fila),
    creadoEn: aIsoMadrid(new Date(fila.creado_en)),
    actualizadoEn: aIsoMadrid(new Date(fila.actualizado_en)),
  };
}

// FR-003: fin posterior al inicio, inicio futuro y proyecto activo. Lanza un 400 por campo.
export async function validarFechasYProyecto({ inicio, fin, proyectoId }, cliente) {
  const campos = {};
  if (new Date(fin) <= new Date(inicio)) campos.fin = 'El fin debe ser posterior al inicio.';
  if (new Date(inicio) <= ahora()) campos.inicio = 'El inicio debe ser posterior al momento actual.';
  const proyecto = await repositorio.obtenerProyecto(proyectoId, cliente);
  if (!proyecto) campos.proyectoId = 'Elige un proyecto.';
  else if (!proyecto.activo) campos.proyectoId = 'El proyecto no está activo.';
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', campos);
  }
}
