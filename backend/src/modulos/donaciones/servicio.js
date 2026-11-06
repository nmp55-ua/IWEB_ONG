import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { config } from '../../config.js';
import { ErrorApi } from '../../middleware/errores.js';
import { aIsoMadrid } from '../../servicios-comunes/fechas.js';
import { normalizarDonante, normalizarImporte } from './normalizacion.js';
import {
  autorizarAportacion,
  prepararContextoDonaciones,
  registrarPermisoOperacion,
} from './autorizacion.js';
import { crearRepositorio } from './repositorio.js';
import { crearConfirmaciones } from './confirmaciones.js';

const hash = (texto) => createHash('sha256').update(texto).digest('hex');
const revision = () =>
  new ErrorApi(409, 'OPERACION_REQUIERE_REVISION', 'La preparación del pago requiere revisión.');
const pagoNoDisponible = () => new ErrorApi(503, 'PAGO_NO_DISPONIBLE', 'El pago no está disponible.');
export const avisoVinculacion =
  'Si hay aportaciones que puedan vincularse al correo de tu cuenta, recibirás un enlace de verificación.';

export function crearServicio({ pool, pasarela, enviarCorreo }) {
  const repo = crearRepositorio(pool),
    confirmaciones = crearConfirmaciones(repo, enviarCorreo);
  function comprobar(req, op, huella) {
    autorizarAportacion(req, op.referencia, op);
    if (huella && huella !== op.huella_solicitud)
      throw new ErrorApi(
        409,
        'SOLICITUD_INCOMPATIBLE',
        'La solicitud no coincide con la operación original.',
      );
    if (!op.sesion_checkout_id && op.vencida && op.estado !== 'cerrada') throw revision();
  }
  async function intentarCorreo(id) {
    if (!id) return;
    try {
      await confirmaciones.enviar(id);
    } catch {
      /* El evento y el pago ya están confirmados. */
    }
  }
  return {
    repo,
    async contexto(req) {
      return {
        ...(await prepararContextoDonaciones(req)),
        usuario: req.usuario
          ? { id: req.usuario.id, nombre: req.usuario.nombre, roles: req.usuario.roles }
          : null,
      };
    },
    async crear(req, entrada) {
      const claveSolicitud = entrada.claveSolicitud.toLowerCase();
      let datos = { claveSolicitud },
        huella = null;
      if (entrada.donante) {
        datos = {
          claveSolicitud,
          modalidad: 'puntual',
          ...normalizarImporte(entrada.importe),
          proyectoId: entrada.proyectoId ?? null,
          donante: normalizarDonante(entrada.donante),
        };
        huella = hash(
          JSON.stringify({
            modalidad: 'puntual',
            importe: datos.importe,
            proyectoId: datos.proyectoId,
            donante: Object.fromEntries(
              Object.entries(datos.donante).map(([k, v]) => [k, v.toLowerCase().normalize('NFC')]),
            ),
          }),
        );
      }
      const existente = await repo.operacion(pool, claveSolicitud);
      if (existente) comprobar(req, existente, huella);
      const op = await repo.preparar(datos, huella, pasarela.prepararSesionPago, 'DON-' + randomUUID(), (x) =>
        comprobar(req, x, huella),
      );
      if (op.nueva) await registrarPermisoOperacion(req, op.referencia);
      // No se guarda sesión ni se pide otra conexión durante este tramo.
      try {
        return await repo.conExclusion('hu01:checkout:' + claveSolicitud, async (c, conexionViva) => {
          let actual = await repo.operacion(c, claveSolicitud);
          comprobar(req, actual, huella);
          if (actual.estado === 'cerrada' || actual.estado_aportacion === 'confirmada')
            return {
              nueva: false,
              referencia: actual.referencia,
              urlPago: null,
              estado: actual.estado_aportacion,
            };
          let sesion;
          if (actual.sesion_checkout_id) {
            sesion = await pasarela.obtenerSesionPago(actual.sesion_checkout_id);
            conexionViva();
            if (sesion.id !== actual.sesion_checkout_id) throw pagoNoDisponible();
            actual = await repo.operacion(c, claveSolicitud);
            comprobar(req, actual, huella);
            return {
              nueva: op.nueva,
              referencia: actual.referencia,
              urlPago:
                sesion.status === 'open' &&
                actual.estado !== 'cerrada' &&
                actual.estado_aportacion !== 'confirmada'
                  ? sesion.url
                  : null,
              estado: actual.estado_aportacion,
            };
          }
          if (!(await repo.iniciarCheckout(c, actual.id))) throw revision();
          // La consulta autocommit anterior fija incertidumbre y comprueba el reloj de PostgreSQL.
          sesion = await pasarela.crearSesionPago({
            solicitudCheckout: actual.solicitud_checkout,
            claveIdempotencia: 'hu01:' + claveSolicitud,
          });
          conexionViva();
          await repo.guardarCheckout(c, actual, sesion);
          actual = await repo.operacion(c, claveSolicitud);
          return {
            nueva: op.nueva,
            referencia: actual.referencia,
            urlPago: actual.estado === 'cerrada' ? null : sesion.url,
            estado: actual.estado_aportacion,
          };
        });
      } catch (error) {
        if (error instanceof ErrorApi) throw error;
        throw pagoNoDisponible();
      }
    },
    async resultado(req, referencia) {
      const a = await repo.aportacion(referencia);
      autorizarAportacion(req, referencia, a);
      const c = await repo.correo(a.id);
      const op = await repo.operacionDeAportacion(a.id);
      let urlPago = null;
      if (op?.sesion_checkout_id && op.estado !== 'cerrada' && a.estado !== 'confirmada') {
        try {
          const sesion = await pasarela.obtenerSesionPago(op.sesion_checkout_id);
          if (sesion.id === op.sesion_checkout_id && sesion.status === 'open') urlPago = sesion.url;
        } catch {
          /* El resultado financiero sigue disponible sin prometer un Checkout abierto. */
        }
      }
      return {
        referencia: a.referencia,
        estado: a.estado,
        modalidad: a.modalidad,
        importe: a.importe,
        fechaCobro: a.fecha_cobro ? aIsoMadrid(a.fecha_cobro) : null,
        destino: a.destino,
        motivo: a.motivo,
        resumenConfirmacion: c?.resumen ?? null,
        correo: {
          estado: c?.estado ?? 'noPrevisto',
          puedeReintentar:
            a.estado === 'confirmada' &&
            !!c &&
            c.estado !== 'enviado' &&
            (c.estado !== 'enviando' || c.reservado_hasta <= new Date()),
        },
        suscripcion: null,
        urlPago,
        preparacion: op
          ? {
              claveSolicitud: op.solicitud_id,
              reanudarHasta: new Date(op.creado_en.getTime() + 23 * 3600000).toISOString(),
              requiereRevision: !op.sesion_checkout_id && op.vencida,
            }
          : null,
      };
    },
    async reintentarCorreo(req, referencia) {
      const a = await repo.aportacion(referencia);
      autorizarAportacion(req, referencia, a);
      if (a.estado !== 'confirmada' || !(await repo.correo(a.id)))
        throw new ErrorApi(409, 'COBRO_NO_CONFIRMADO', 'El cobro no está confirmado.');
      return { estadoCorreo: await confirmaciones.enviar(a.id) };
    },
    async procesarEvento(e) {
      if (
        !e ||
        typeof e.id !== 'string' ||
        !e.id ||
        typeof e.type !== 'string' ||
        !e.type ||
        typeof e.data?.object?.id !== 'string' ||
        !e.data.object.id ||
        !Number.isSafeInteger(e.created) ||
        e.created < 0 ||
        !Number.isFinite(new Date(e.created * 1000).getTime()) ||
        typeof e.livemode !== 'boolean' ||
        e.api_version !== '2025-02-24.acacia'
      )
        throw new ErrorApi(400, 'EVENTO_NO_VALIDO', 'La notificación no es válida.');
      const real =
        config.stripe.claveSecreta.startsWith('sk_live_') ||
        config.stripe.claveSecreta.startsWith('rk_live_');
      if (e.livemode !== real) throw new ErrorApi(400, 'EVENTO_NO_VALIDO', 'La notificación no es válida.');
      try {
        let idCorreo;
        if (
          ['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled'].includes(
            e.type,
          )
        ) {
          idCorreo = await repo.conExclusion(
            'pi:' + e.data.object.id,
            async (c, conexionViva) => {
              if (await repo.eventoRegistrado(c, e.id))
                return (await repo.aportacionDePago(c, e.data.object.id))?.id;
              const pago = await pasarela.obtenerPago(e.data.object.id);
              conexionViva();
              return repo.guardarPago(c, e, pago);
            },
            true,
          );
        } else if (['checkout.session.completed', 'checkout.session.expired'].includes(e.type)) {
          await repo.conExclusion(
            'checkout:' + e.data.object.id,
            async (c, conexionViva) => {
              if (await repo.eventoRegistrado(c, e.id)) return;
              const sesion = await pasarela.obtenerSesionPago(e.data.object.id);
              conexionViva();
              await repo.guardarSesionEvento(c, e, sesion);
            },
            true,
          );
        } else {
          await repo.registrarEvento(pool, e, 'ignorado');
        }
        await intentarCorreo(idCorreo);
        return { recibido: true };
      } catch (error) {
        if (error instanceof ErrorApi) throw error;
        throw new ErrorApi(503, 'NOTIFICACION_NO_DISPONIBLE', 'No se pudo procesar la notificación.');
      }
    },
    async webhook(cuerpo, firma) {
      const e = pasarela.verificarEvento(cuerpo, firma);
      return this.procesarEvento(e);
    },
    async solicitarVinculo(req) {
      const token = randomBytes(32).toString('base64url');
      const destinatario = await repo.emitirVerificacion(req.usuario.id, hash(token));
      if (destinatario) {
        try {
          const aceptado = await enviarCorreo(
            {
              para: destinatario.correo,
              asunto: 'Verificar vínculo de aportaciones',
              texto: `Confirma el vínculo: ${config.urlFrontend}/donar/vincular#token=${token}`,
            },
            { tiempoConexionMs: 3000, tiempoSaludoMs: 3000, tiempoInactividadMs: 5000 },
          );
          if (!aceptado) console.warn('No se aceptó el correo de verificación de donaciones.');
        } catch {
          console.warn('No se aceptó el correo de verificación de donaciones.');
        }
      }
      return { mensaje: avisoVinculacion };
    },
    async confirmarVinculo(req, token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token))
        throw new ErrorApi(400, 'ENLACE_NO_VALIDO', 'El enlace no es válido.');
      return repo.consumirVerificacion(req.usuario.id, hash(token));
    },
  };
}
