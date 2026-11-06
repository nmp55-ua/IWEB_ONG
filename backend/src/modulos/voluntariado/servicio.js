// Reglas de negocio de HU-05 (specs/spec-005/plan.md, «Reglas de servicio.js») y funciones que usa
// el módulo actividades (specs/spec-005/contracts/api-voluntariado.md).
// Importación circular con actividades: ./actividades.js reexporta su servicio, y ese servicio importa
// este a través de actividades/inscripciones.js. Por eso lo de ./actividades.js solo se usa dentro de
// funciones, nunca a nivel de módulo.
import { transaccion } from '../../db/pool.js';
import { ErrorApi } from '../../middleware/errores.js';
import { ahora, aIsoMadrid, inicioDia } from '../../servicios-comunes/fechas.js';
import * as actividades from './actividades.js';
import * as repositorio from './repositorio.js';

const iso = (fecha) => (fecha ? aIsoMadrid(new Date(fecha)) : null);

const noEncontrada = () => new ErrorApi(404, 'NO_ENCONTRADO', 'No existe la inscripción.');
const noDisponible = () =>
  new ErrorApi(404, 'NO_ENCONTRADO', 'No existe la actividad o ya no está disponible.');
const noCancelable = (mensaje) => new ErrorApi(409, 'INSCRIPCION_NO_CANCELABLE', mensaje);

// FR-004: el rol se comprueba aquí para poder explicar por qué se deniega (research R5).
export function exigirVoluntario(usuario) {
  if (!usuario.roles.includes('voluntario')) {
    throw new ErrorApi(
      403,
      'SIN_PERMISO',
      'Necesitas una cuenta de voluntario para inscribirte en actividades.',
    );
  }
}

// Fila de la base de datos → recurso Inscripción del contrato.
function aInscripcion(fila) {
  return {
    id: Number(fila.id),
    actividadId: Number(fila.actividad_id),
    estado: fila.estado,
    posicion: fila.posicion ?? null,
    fechaInscripcion: iso(fila.fecha_inscripcion),
    fechaConfirmacion: iso(fila.fecha_confirmacion),
    fechaCancelacion: iso(fila.fecha_cancelacion),
  };
}

const aVoluntario = ({ nombre, apellidos, correo, telefono }) => ({ nombre, apellidos, correo, telefono });

// «2026-11-18» → instante en que empieza ese día en Madrid; con despues = 1, el del día siguiente.
function inicioDeDia(texto, despues = 0) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return inicioDia(anio, mes, dia + despues);
}

// ---------------------------------------------------------------------------------------------
// Rutas de HU-05
// ---------------------------------------------------------------------------------------------

// FR-001 a FR-003: publicadas con inicio futuro, por fecha. desde y hasta son días de Madrid
// incluidos (research R8). Si el usuario es voluntario, cada actividad lleva su inscripción activa.
export async function listarDisponibles({ proyectoId, desde, hasta }, usuario) {
  const { datos } = await actividades.listar({ estado: 'publicada', proyectoId });
  const minimo = desde ? inicioDeDia(desde) : null;
  const limite = hasta ? inicioDeDia(hasta, 1) : null;
  const disponibles = datos
    .filter((a) => !a.celebrada)
    .filter((a) => (!minimo || new Date(a.inicio) >= minimo) && (!limite || new Date(a.inicio) < limite))
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

  const mias = new Map();
  if (usuario) {
    for (const fila of await repositorio.listarActivasDeUsuario(usuario.id)) {
      mias.set(Number(fila.actividad_id), {
        id: Number(fila.id),
        estado: fila.estado,
        posicion: fila.posicion,
      });
    }
  }
  const resultado = disponibles.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion,
    proyecto: a.proyecto,
    inicio: a.inicio,
    fin: a.fin,
    lugar: a.lugar,
    plazas: a.plazas,
    plazasLibres: a.plazasLibres,
    requisitos: a.requisitos,
    miInscripcion: mias.get(a.id) ?? null,
  }));
  return { datos: resultado, total: resultado.length };
}

export async function obtenerPerfil(usuario) {
  const voluntario = await repositorio.obtenerVoluntarioDeUsuario(usuario.id);
  if (!voluntario) {
    throw new ErrorApi(404, 'NO_ENCONTRADO', 'Todavía no has completado tus datos de voluntario.');
  }
  return aVoluntario(voluntario);
}

// FR-011: los datos de contacto se piden la primera vez y se reutilizan en las siguientes.
export async function guardarPerfil(usuario, datos) {
  return aVoluntario(await repositorio.guardarVoluntario(usuario.id, datos));
}

// FR-004 a FR-008. La fila de la actividad queda bloqueada hasta el COMMIT, así que dos peticiones
// por la última plaza se atienden de una en una (research R1).
export async function inscribir(actividadId, { listaEspera = false }, usuario) {
  const voluntario = await repositorio.obtenerVoluntarioDeUsuario(usuario.id);
  if (!voluntario) {
    throw new ErrorApi(409, 'PERFIL_INCOMPLETO', 'Completa tus datos de contacto antes de inscribirte.');
  }
  try {
    const fila = await transaccion(async (cliente) => {
      const actividad = await actividades.bloquearActividad(actividadId, cliente);
      if (!actividad || actividad.estado !== 'publicada') throw noDisponible();
      if (actividad.celebrada) {
        throw new ErrorApi(409, 'ACTIVIDAD_CELEBRADA', 'Esta actividad ya ha empezado o se ha celebrado.');
      }
      if (await repositorio.obtenerActiva(voluntario.id, actividadId, cliente)) throw yaInscrito();

      let estado = 'confirmada';
      if (actividad.plazasLibres <= 0) {
        // Solo entra en la lista de espera quien lo pide (FR-007, research R3).
        if (!listaEspera) {
          throw new ErrorApi(
            409,
            'PLAZAS_AGOTADAS',
            'Ya no quedan plazas libres en esta actividad. Puedes apuntarte a la lista de espera.',
          );
        }
        estado = 'en_espera';
      }
      return repositorio.insertar({ voluntarioId: voluntario.id, actividadId, estado }, cliente);
    });
    return aInscripcion(fila);
  } catch (error) {
    // Por si acaso: el índice único de inscripción activa también lo impide (FR-008).
    if (error.code === '23505') throw yaInscrito();
    throw error;
  }
}

function yaInscrito() {
  return new ErrorApi(409, 'YA_INSCRITO', 'Ya estás inscrito o en la lista de espera de esta actividad.');
}

// FR-009. Si la inscripción estaba confirmada, la plaza pasa a la lista de espera en la misma
// transacción y el aviso sale de avisarPlazaConfirmada de spec-007 (acuerdo T023).
export async function cancelar(inscripcionId, usuario) {
  const previa = await repositorio.obtenerInscripcion(inscripcionId);
  // La de otra persona se trata como inexistente (plan-comun §3).
  if (!previa || String(previa.usuario_id) !== String(usuario.id)) throw noEncontrada();

  const { fila, actividad, promovidas } = await transaccion(async (cliente) => {
    const actividad = await actividades.bloquearActividad(previa.actividad_id, cliente);
    const actual = await repositorio.obtenerInscripcion(inscripcionId, cliente);
    if (actual.estado === 'cancelada') throw noCancelable('Esta inscripción ya está cancelada.');
    if (new Date(actividad.inicio) <= ahora()) {
      throw noCancelable('La actividad ya ha empezado: no se puede cancelar la inscripción.');
    }
    await repositorio.cancelar(inscripcionId, cliente);
    const promovidas = actual.estado === 'confirmada' ? await promoverListaEspera(actividad.id, cliente) : [];
    return { fila: await repositorio.obtenerInscripcion(inscripcionId, cliente), actividad, promovidas };
  });

  for (const inscripcion of promovidas) await actividades.avisarPlazaConfirmada(inscripcion, actividad);
  return aInscripcion(fila);
}

// ---------------------------------------------------------------------------------------------
// Funciones para el módulo actividades (spec-007 y spec-008), vía actividades/inscripciones.js
// ---------------------------------------------------------------------------------------------

export async function contarConfirmadas(actividadId, cliente) {
  return repositorio.contarConfirmadas(actividadId, cliente);
}

export async function listarInscripcionesDeActividad(actividadId) {
  const filas = await repositorio.listarActivasDeActividad(actividadId);
  const contacto = (f) => ({
    inscripcionId: Number(f.id),
    nombre: f.nombre,
    apellidos: f.apellidos,
    correo: f.correo,
    telefono: f.telefono,
  });
  return {
    confirmadas: filas
      .filter((f) => f.estado === 'confirmada')
      .map((f) => ({ ...contacto(f), fechaConfirmacion: iso(f.fecha_confirmacion) })),
    enEspera: filas
      .filter((f) => f.estado === 'en_espera')
      .map((f, i) => ({
        inscripcionId: Number(f.id),
        posicion: i + 1,
        ...contacto(f),
        fechaInscripcion: iso(f.fecha_inscripcion),
      })),
  };
}

// Confirma, por orden de llegada, a tantas personas en espera como plazas libres haya (FR-006 de
// spec-007). Lee las plazas con el cliente de quien llama: spec-007 la usa justo después de subirlas.
export async function promoverListaEspera(actividadId, cliente) {
  if (!cliente) return transaccion((nuevo) => promoverListaEspera(actividadId, nuevo));
  const actividad = await actividades.bloquearActividad(actividadId, cliente);
  if (!actividad || actividad.estado !== 'publicada' || actividad.plazasLibres <= 0) return [];
  const filas = await repositorio.confirmarPrimerasEnEspera(actividadId, actividad.plazasLibres, cliente);
  return filas.map((f) => ({ inscripcionId: Number(f.id), nombre: f.nombre, correo: f.correo }));
}

export async function cancelarInscripcionesDeActividad(actividadId, cliente) {
  const filas = await repositorio.cancelarActivasDeActividad(actividadId, cliente);
  return filas.map((f) => ({
    inscripcionId: Number(f.id),
    nombre: f.nombre,
    correo: f.correo,
    estadoAnterior: f.estado_anterior,
  }));
}

export async function listarConfirmadasDeActividad(actividadId) {
  const { confirmadas } = await listarInscripcionesDeActividad(actividadId);
  return confirmadas.map(({ inscripcionId, nombre, apellidos, correo }) => ({
    inscripcionId,
    nombre,
    apellidos,
    correo,
  }));
}

export async function listarInscripcionesDeUsuario(usuarioId) {
  const filas = await repositorio.listarDeUsuario(usuarioId);
  return filas.map((f) => ({ inscripcionId: Number(f.id), actividadId: Number(f.actividad_id) }));
}
