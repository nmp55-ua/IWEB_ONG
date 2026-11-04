// Reglas de negocio de HU-07 (specs/spec-007/plan.md, «Reglas de servicio.js»).
// Importación circular con voluntariado (spec-005): ./inscripciones.js reexporta su servicio y este
// importa avisarPlazaConfirmada de aquí. Por eso esas funciones solo se usan dentro de funciones,
// nunca a nivel de módulo.
import { transaccion } from '../../db/pool.js';
import { ErrorApi } from '../../middleware/errores.js';
import { enviarCorreo } from '../../servicios-comunes/correo.js';
import { ahora, aIsoMadrid, ZONA } from '../../servicios-comunes/fechas.js';
import * as inscripciones from './inscripciones.js';
import * as repositorio from './repositorio.js';

// Una celebrada es una publicada cuyo inicio ya ha pasado (no es un estado guardado).
const estaCelebrada = (fila) => fila.estado === 'publicada' && new Date(fila.inicio) <= ahora();

const noEncontrada = () => new ErrorApi(404, 'NO_ENCONTRADO', 'No existe la actividad.');

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
// Al editar sin cambiar de proyecto no se comprueba el proyecto: desactivarlo no afecta a
// las actividades que ya tiene (clarify, pregunta 5).
export async function validarFechasYProyecto(
  { inicio, fin, proyectoId },
  cliente,
  { comprobarProyecto = true } = {},
) {
  const campos = {};
  if (new Date(fin) <= new Date(inicio)) campos.fin = 'El fin debe ser posterior al inicio.';
  if (new Date(inicio) <= ahora()) campos.inicio = 'El inicio debe ser posterior al momento actual.';
  if (comprobarProyecto) {
    const proyecto = await repositorio.obtenerProyecto(proyectoId, cliente);
    if (!proyecto) campos.proyectoId = 'Elige un proyecto.';
    else if (!proyecto.activo) campos.proyectoId = 'El proyecto no está activo.';
  }
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', campos);
  }
}

// «sábado, 15/11/2026, de 10:00 a 13:30»
function describirHorario(fila) {
  const dia = new Intl.DateTimeFormat('es-ES', {
    timeZone: ZONA,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fila.inicio));
  const hora = (f) =>
    new Intl.DateTimeFormat('es-ES', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' }).format(
      new Date(f),
    );
  return `${dia}, de ${hora(fila.inicio)} a ${hora(fila.fin)}`;
}

// Envía un correo a cada persona; los fallos ya los registra enviarCorreo y no se deshace nada.
async function avisar(personas, asunto, texto) {
  for (const persona of personas) {
    await enviarCorreo({
      para: persona.correo,
      asunto,
      texto: `Hola, ${persona.nombre}:\n\n${texto}\n\nGracias por colaborar.`,
    });
  }
}

// Único correo «plaza confirmada» (FR-006). Lo usan editar() al subir plazas y spec-005 al
// cancelar un voluntario. Si falla, enviarCorreo lo registra y no se lanza nada.
export async function avisarPlazaConfirmada(inscripcion, actividad) {
  await avisar(
    [inscripcion],
    `Plaza confirmada: «${actividad.titulo}»`,
    `Se ha liberado una plaza en la actividad «${actividad.titulo}» y ya tienes la tuya confirmada. ` +
      `Es el ${describirHorario(actividad)}, en ${actividad.lugar}. ` +
      'Si no puedes asistir, cancela tu inscripción para que la plaza pase a la siguiente persona.',
  );
}

export async function crear(datos, usuario) {
  return transaccion(async (cliente) => {
    await validarFechasYProyecto(datos, cliente);
    const fila = await repositorio.insertar({ ...datos, estado: 'borrador', creadaPor: usuario.id }, cliente);
    return aRecurso(fila, 0);
  });
}

export async function obtener(id) {
  const fila = await repositorio.obtenerPorId(id);
  if (!fila) throw noEncontrada();
  return aRecurso(fila, await inscripciones.contarConfirmadas(fila.id));
}

export async function listar(filtros) {
  const filas = await repositorio.listar(filtros);
  const datos = [];
  for (const fila of filas) datos.push(aRecurso(fila, await inscripciones.contarConfirmadas(fila.id)));
  return { datos, total: datos.length };
}

export async function editar(id, cambios) {
  const { anterior, fila, confirmadas, promovidas } = await transaccion(async (cliente) => {
    const anterior = await repositorio.bloquearPorId(id, cliente);
    if (!anterior) throw noEncontrada();
    if (anterior.estado === 'cancelada' || estaCelebrada(anterior)) {
      throw new ErrorApi(
        409,
        'ACTIVIDAD_NO_EDITABLE',
        'No se puede editar una actividad cancelada o ya celebrada.',
      );
    }
    const resultado = {
      inicio: cambios.inicio ?? anterior.inicio,
      fin: cambios.fin ?? anterior.fin,
      proyectoId: cambios.proyectoId ?? anterior.proyecto_id,
    };
    const cambiaProyecto =
      cambios.proyectoId !== undefined && cambios.proyectoId !== Number(anterior.proyecto_id);
    await validarFechasYProyecto(resultado, cliente, { comprobarProyecto: cambiaProyecto });

    let confirmadas = await inscripciones.contarConfirmadas(id, cliente);
    if (cambios.plazas !== undefined && cambios.plazas < confirmadas) {
      throw new ErrorApi(
        409,
        'PLAZAS_MENOR_QUE_INSCRITOS',
        `Hay ${confirmadas} inscritos confirmados; no puedes dejar menos plazas.`,
        { plazas: `Hay ${confirmadas} inscritos confirmados; no puedes dejar menos plazas.` },
      );
    }
    const fila = await repositorio.actualizar(id, cambios, cliente);

    // FR-006: al subir las plazas de una publicada, la lista de espera ocupa las nuevas plazas
    // por orden de llegada, sin plazo de aceptación (PA7.2).
    let promovidas = [];
    if (anterior.estado === 'publicada' && fila.plazas > anterior.plazas) {
      promovidas = await inscripciones.promoverListaEspera(id, cliente);
      confirmadas += promovidas.length;
    }
    return { anterior, fila, confirmadas, promovidas };
  });

  for (const inscripcion of promovidas) await avisarPlazaConfirmada(inscripcion, fila);

  // FR-011: si una publicada cambia de fecha, hora o lugar, se avisa a inscritos y lista de espera.
  const cambiaHorario =
    new Date(fila.inicio).getTime() !== new Date(anterior.inicio).getTime() ||
    new Date(fila.fin).getTime() !== new Date(anterior.fin).getTime();
  if (anterior.estado === 'publicada' && (cambiaHorario || fila.lugar !== anterior.lugar)) {
    const { confirmadas: inscritos, enEspera } = await inscripciones.listarInscripcionesDeActividad(id);
    await avisar(
      [...inscritos, ...enEspera],
      `Cambios en la actividad «${fila.titulo}»`,
      `La actividad «${fila.titulo}» ha cambiado. Ahora es el ${describirHorario(fila)}, en ${fila.lugar}.`,
    );
  }
  return aRecurso(fila, confirmadas);
}

export async function publicar(id) {
  return transaccion(async (cliente) => {
    const actual = await repositorio.bloquearPorId(id, cliente);
    if (!actual) throw noEncontrada();
    if (actual.estado !== 'borrador') {
      throw new ErrorApi(409, 'TRANSICION_NO_PERMITIDA', 'Solo se puede publicar una actividad en borrador.');
    }
    await validarFechasYProyecto(
      { inicio: actual.inicio, fin: actual.fin, proyectoId: actual.proyecto_id },
      cliente,
    );
    const fila = await repositorio.actualizar(id, { estado: 'publicada' }, cliente);
    return aRecurso(fila, await inscripciones.contarConfirmadas(id, cliente));
  });
}

export async function cancelar(id) {
  const { anterior, fila, afectadas } = await transaccion(async (cliente) => {
    const anterior = await repositorio.bloquearPorId(id, cliente);
    if (!anterior) throw noEncontrada();
    if (anterior.estado === 'cancelada' || estaCelebrada(anterior)) {
      throw new ErrorApi(
        409,
        'TRANSICION_NO_PERMITIDA',
        'No se puede cancelar una actividad cancelada o ya celebrada.',
      );
    }
    const afectadas =
      anterior.estado === 'publicada'
        ? await inscripciones.cancelarInscripcionesDeActividad(id, cliente)
        : [];
    const fila = await repositorio.actualizar(id, { estado: 'cancelada' }, cliente);
    return { anterior, fila, afectadas };
  });

  // FR-008: solo una publicada tiene a quién avisar; un borrador se descarta sin avisos.
  if (anterior.estado === 'publicada') {
    await avisar(
      afectadas,
      `Actividad cancelada: «${fila.titulo}»`,
      `Sentimos comunicarte que la actividad «${fila.titulo}» del ${describirHorario(fila)} se ha cancelado. ` +
        'Tu inscripción ha quedado cancelada.',
    );
  }
  return aRecurso(fila, 0);
}

export async function listarInscripciones(id) {
  const fila = await repositorio.obtenerPorId(id);
  if (!fila) throw noEncontrada();
  return inscripciones.listarInscripcionesDeActividad(id);
}
