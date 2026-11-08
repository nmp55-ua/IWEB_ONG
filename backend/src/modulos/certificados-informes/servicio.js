// HU-03: reglas del certificado fiscal anual (specs/spec-003/plan.md, «Reglas de servicio.js»).
// Las dependencias se pueden inyectar para probar con otro «ahora» o con un correo simulado.
import { ErrorApi } from '../../middleware/errores.js';
import { transaccion as transaccionComun } from '../../db/pool.js';
import { enviarCorreo as enviarCorreoComun } from '../../servicios-comunes/correo.js';
import { ZONA, ahora as ahoraComun, anioEnMadrid, rangoAnio } from '../../servicios-comunes/fechas.js';
import { config as configComun } from '../../config.js';
import * as repositorioComun from './repositorio.js';
import { generarCodigo as generarCodigoComun, textoCorreo } from './textos.js';

const RESTRICCION_CODIGO = 'certificados_fiscales_codigo_verificacion_key';

// Día de Madrid de un instante como «aaaa-mm-dd».
const diaMadrid = (fecha) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);

export function crearServicio({
  repositorio = repositorioComun,
  transaccion = transaccionComun,
  enviarCorreo = enviarCorreoComun,
  ahora = ahoraComun,
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

  return { reconciliarEjercicio, reconciliarCerrados, ejercicioEnCurso };
}

export const servicio = crearServicio();
