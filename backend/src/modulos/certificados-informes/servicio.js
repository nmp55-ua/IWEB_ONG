// HU-03: reglas del certificado fiscal anual (specs/spec-003/plan.md, «Reglas de servicio.js»).
// HU-04: informe de recaudación y voluntariado (specs/spec-004/plan.md, «Reglas de servicio.js»).
// Las dependencias se pueden inyectar para probar con otro «ahora» o con un correo simulado.
import { ErrorApi } from '../../middleware/errores.js';
import { transaccion as transaccionComun } from '../../db/pool.js';
import { enviarCorreo as enviarCorreoComun } from '../../servicios-comunes/correo.js';
import { ZONA, ahora as ahoraComun, anioEnMadrid, inicioDia, rangoAnio } from '../../servicios-comunes/fechas.js';
import { config as configComun } from '../../config.js';
import * as repositorioComun from './repositorio.js';
import {
  definicionPdf,
  enmascararNifNie,
  etiquetaPeriodo,
  generarCodigo as generarCodigoComun,
  normalizarCodigo,
  textoCorreo,
} from './textos.js';

const RESTRICCION_CODIGO = 'certificados_fiscales_codigo_verificacion_key';

// ── Utilidades del informe (HU-04) sobre fechas «aaaa-mm-dd» ──
const MESES_PERIODO = { mes: 1, trimestre: 3, anio: 12 };
const partesDia = (dia) => dia.split('-').map(Number);
const diaIso = (fechaUtc) => fechaUtc.toISOString().slice(0, 10);
// Último día del periodo que empieza en `inicio`.
const finPeriodo = (agrupacion, inicio) => {
  const [anio, mes] = partesDia(inicio);
  return diaIso(new Date(Date.UTC(anio, mes - 1 + MESES_PERIODO[agrupacion], 0)));
};
const CERO_DINERO = { recaudadoPuntual: '0.00', recaudadoCuotas: '0.00', recaudadoTotal: '0.00', aportaciones: 0 };
const CERO_VOLUNTARIADO = { actividades: 0, voluntarios: 0, horas: '0.00' };
const ORDEN_TIPO = { proyecto: 0, fondoGeneral: 1, subtotal: 2 };

// Día de Madrid de un instante como «aaaa-mm-dd».
const diaMadrid = (fecha) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);

// Las dependencias comunes por defecto se resuelven al usarlas, no al crear el servicio: así importar
// app.js no exige que un módulo simulado en otras pruebas (p. ej. db/pool.js) exporte todo.
export function crearServicio({
  repositorio = repositorioComun,
  transaccion = (fn) => transaccionComun(fn),
  enviarCorreo = (...args) => enviarCorreoComun(...args),
  ahora = () => ahoraComun(),
  generarCodigo = generarCodigoComun,
  config = configComun,
} = {}) {
  const ejercicioEnCurso = () => anioEnMadrid(ahora());

  function exigirCerrado(ejercicio) {
    if (ejercicio >= ejercicioEnCurso()) {
      throw new ErrorApi(
        409,
        'EJERCICIO_NO_CERRADO',
        `El certificado de ${ejercicio} se generará a partir del 01/01/${ejercicio + 1}.`,
      );
    }
  }

  // Guarda con un código nuevo; si por azar choca con otro existente, lo intenta una vez más.
  async function guardarConCodigoNuevo(cliente, datos) {
    for (let intento = 0; ; intento++) {
      const codigo = generarCodigo();
      await cliente.query('SAVEPOINT certificado');
      try {
        await repositorio.guardarCertificado(cliente, { ...datos, codigo });
        await cliente.query('RELEASE SAVEPOINT certificado');
        return codigo;
      } catch (error) {
        await cliente.query('ROLLBACK TO SAVEPOINT certificado');
        if (error.code === '23505' && error.constraint === RESTRICCION_CODIGO && intento === 0) continue;
        throw error;
      }
    }
  }

  async function avisar(pendiente, ejercicio) {
    const { asunto, texto } = textoCorreo({
      nombre: pendiente.nombre,
      ejercicio,
      importeTotal: pendiente.importeTotal,
      regenerado: pendiente.existe,
      vinculado: pendiente.vinculado,
      urlFrontend: config.urlFrontend,
    });
    try {
      return await enviarCorreo({ para: pendiente.correo, asunto, texto });
    } catch (error) {
      console.error(`No se pudo enviar el aviso del certificado de ${ejercicio}: ${error.message}`);
      return false;
    }
  }

  // FR-001 y FR-008: emite los que faltan y regenera los que han cambiado de total.
  async function reconciliarEjercicio(ejercicio) {
    exigirCerrado(ejercicio);
    const { desde, hasta } = rangoAnio(ejercicio);
    const fechaEmision = diaMadrid(ahora());

    const cambios = await transaccion(async (cliente) => {
      await repositorio.bloquearEjercicio(cliente, ejercicio);
      const pendientes = await repositorio.pendientesDeEjercicio(cliente, { ejercicio, desde, hasta });
      for (const p of pendientes) {
        await guardarConCodigoNuevo(cliente, {
          donanteId: p.donanteId,
          ejercicio,
          importeTotal: p.importeTotal,
          fechaEmision,
        });
      }
      return pendientes;
    });

    // FR-009: después del commit; un fallo de correo no deshace el certificado.
    let correosFallidos = 0;
    for (const p of cambios) {
      if (!(await avisar(p, ejercicio))) correosFallidos++;
    }
    const regenerados = cambios.filter((p) => p.existe).length;
    return { ejercicio, emitidos: cambios.length - regenerados, regenerados, correosFallidos };
  }

  // Todos los ejercicios cerrados desde el del primer cobro confirmado (tarea horaria).
  async function reconciliarCerrados() {
    const primero = await repositorio.primerCobroConfirmado();
    if (!primero) return [];
    const resultados = [];
    for (let ejercicio = anioEnMadrid(primero); ejercicio < ejercicioEnCurso(); ejercicio++) {
      resultados.push(await reconciliarEjercicio(ejercicio));
    }
    return resultados;
  }

  // FR-005, FR-007 y FR-012: solo los del Donante vinculado a la cuenta (donantes.usuario_id).
  // Coincidir en el correo no da acceso.
  async function listarPropios(usuario) {
    const enCurso = ejercicioEnCurso();
    const donante = await repositorio.donanteDeUsuario(usuario.id);
    if (!donante) return { datos: [], total: 0, ejercicioEnCurso: enCurso, vinculado: false };
    const datos = await repositorio.certificadosDeDonante(donante.id);
    return { datos, total: datos.length, ejercicioEnCurso: enCurso, vinculado: true };
  }

  // FR-004 y FR-006: definición del PDF del certificado propio de un ejercicio cerrado.
  // Sin vínculo, sin certificado o de otro Donante: el mismo 404 (plan-comun §3).
  async function pdfPropio(usuario, ejercicio) {
    exigirCerrado(ejercicio);
    const donante = await repositorio.donanteDeUsuario(usuario.id);
    const certificado = donante ? await repositorio.certificadoDeDonante(donante.id, ejercicio) : null;
    if (!certificado) {
      throw new ErrorApi(
        404,
        'CERTIFICADO_NO_DISPONIBLE',
        `No tienes aportaciones confirmadas en ${ejercicio}, así que no hay certificado de ese ejercicio.`,
      );
    }
    return definicionPdf({ ong: config.ong, donante, certificado, urlFrontend: config.urlFrontend });
  }

  // FR-011: pública. Solo un código vigente es válido; nunca devuelve nombre, correo ni dirección.
  async function verificar(texto) {
    const codigo = normalizarCodigo(texto);
    const certificado = codigo ? await repositorio.certificadoPorCodigo(codigo) : null;
    if (!certificado) return { valido: false };
    return {
      valido: true,
      ejercicio: certificado.ejercicio,
      importeTotal: certificado.importeTotal,
      fechaEmision: certificado.fechaEmision,
      nifNieEnmascarado: enmascararNifNie(certificado.nifNie),
    };
  }

  // HU-04 (FR-001–FR-005, FR-007): una sola función para pantalla, CSV y PDF (research R2).
  async function generarInforme({ desde, hasta, proyectoId = null, agrupacion = null }) {
    if (hasta < desde) {
      throw new ErrorApi(400, 'PERIODO_NO_VALIDO', 'La fecha de fin no puede ser anterior a la de inicio.', {
        hasta: 'La fecha de fin no puede ser anterior a la de inicio.',
      });
    }
    let proyecto = null;
    if (proyectoId) {
      proyecto = await repositorio.proyectoPorId(proyectoId);
      if (!proyecto) throw new ErrorApi(404, 'PROYECTO_NO_ENCONTRADO', 'No existe ese proyecto.');
    }

    // Días completos de Madrid: [00:00 de «desde», 00:00 del día siguiente a «hasta»).
    const [ad, md, dd] = partesDia(desde);
    const [ah, mh, dh] = partesDia(hasta);
    const rango = { desde: inicioDia(ad, md, dd), hasta: inicioDia(ah, mh, dh + 1), proyectoId, agrupacion };

    const [dinero, voluntariado, proyectos] = await Promise.all([
      repositorio.recaudacionInforme(rango),
      repositorio.voluntariadoInforme({ ...rango, ahora: ahora() }),
      repositorio.todosLosProyectos(),
    ]);
    const nombres = new Map(proyectos.map((p) => [p.id, p.nombre]));

    // Une las dos consultas por nivel, periodo y proyecto; lo que falte en una, a cero.
    const filasPorClave = new Map();
    for (const [lista, ceros] of [
      [dinero, CERO_VOLUNTARIADO],
      [voluntariado, CERO_DINERO],
    ]) {
      for (const { nivel, periodo, proyectoId: id, ...cifras } of lista) {
        const clave = `${nivel}|${periodo ?? ''}|${id ?? ''}`;
        const fila = filasPorClave.get(clave) ?? { nivel, periodo, proyectoId: id, ...ceros };
        filasPorClave.set(clave, Object.assign(fila, cifras));
      }
    }

    const periodo = (inicio) =>
      inicio && agrupacion
        ? {
            etiqueta: etiquetaPeriodo(agrupacion, inicio),
            desde: inicio < desde ? desde : inicio,
            hasta: finPeriodo(agrupacion, inicio) > hasta ? hasta : finPeriodo(agrupacion, inicio),
          }
        : null;
    const aFila = ({ nivel, periodo: inicio, proyectoId: id, ...cifras }) => {
      const tipo = nivel === 3 ? 'total' : nivel === 1 ? 'subtotal' : id ? 'proyecto' : 'fondoGeneral';
      return {
        tipo,
        periodo: tipo === 'total' ? null : periodo(inicio),
        proyecto: tipo === 'proyecto' ? { id, nombre: nombres.get(id) } : null,
        ...cifras,
      };
    };

    const todas = [...filasPorClave.values()];
    const detalle = todas.filter((f) => f.nivel === 0).map(aFila);
    const subtotales = agrupacion ? todas.filter((f) => f.nivel === 1).map(aFila) : [];
    const total = aFila(todas.find((f) => f.nivel === 3));

    const filtros = {
      desde,
      hasta,
      proyecto: proyecto ? { id: proyecto.id, nombre: proyecto.nombre } : null,
      agrupacion: agrupacion ?? null,
    };
    if (detalle.length === 0) return { filtros, vacio: true, filas: [] };

    // Periodo ascendente; dentro, proyectos por nombre, «Fondo general» y el subtotal (R6).
    const ordenadas = [...detalle, ...subtotales].sort(
      (a, b) =>
        (a.periodo?.desde ?? '').localeCompare(b.periodo?.desde ?? '') ||
        ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] ||
        (a.proyecto?.nombre ?? '').localeCompare(b.proyecto?.nombre ?? '', 'es'),
    );
    return { filtros, vacio: false, filas: [...ordenadas, total] };
  }

  // Para el filtro: todos los proyectos, también los inactivos (research R7).
  async function listarProyectosInforme() {
    const datos = await repositorio.todosLosProyectos();
    return { datos, total: datos.length };
  }

  return {
    reconciliarEjercicio,
    reconciliarCerrados,
    ejercicioEnCurso,
    listarPropios,
    pdfPropio,
    verificar,
    generarInforme,
    listarProyectosInforme,
  };
}

export const servicio = crearServicio();
