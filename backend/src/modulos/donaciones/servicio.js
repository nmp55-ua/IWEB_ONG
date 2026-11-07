import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { config } from '../../config.js';
import { ErrorApi } from '../../middleware/errores.js';
import { aIsoMadrid, ahora, ZONA } from '../../servicios-comunes/fechas.js';
import { normalizarDonante, normalizarImporte } from './normalizacion.js';
import {
  autorizarAportacion,
  prepararContextoDonaciones,
  registrarPermisoOperacion,
} from './autorizacion.js';
import { crearRepositorio, CIERRES } from './repositorio.js';
import { crearConfirmaciones } from './confirmaciones.js';
import { textoCorreoVerificacion } from './textoCorreo.js';

const hash = (texto) => createHash('sha256').update(texto).digest('hex');
const revision = () =>
  new ErrorApi(409, 'OPERACION_REQUIERE_REVISION', 'La preparación del pago requiere revisión.');
const pagoNoDisponible = () => new ErrorApi(503, 'PAGO_NO_DISPONIBLE', 'El pago no está disponible.');
const PERIODICIDADES = ['mensual', 'trimestral', 'anual'];
const TIPOS_FACTURA = ['invoice.paid', 'invoice.payment_failed', 'invoice.updated'];
const TIPOS_SUSCRIPCION = ['customer.subscription.updated', 'customer.subscription.deleted'];
// Solo avisos snapshot de estas dos versiones; los recursos de negocio se consultan en acacia.
const VERSIONES_EVENTO = new Set(['2025-02-24.acacia', '2026-10-28.endive']);
const diaMadrid = (fecha) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);

// Próximo cobro solo desde recursos actuales (pasarela-stripe.md, «Próxima fecha y cancelación»):
// tras fallo de la última factura, next_payment_attempt; si no, current_period_end con cobro
// automático y sin cancelación programada. Nulo, pasado, cerrado o en/después de la
// cancelación programada → null. No se calcula ninguna fecha localmente.
export function calcularPrevision(sus, ultima, instante = ahora()) {
  if (!sus || CIERRES.includes(sus.status)) return null;
  const fallo =
    ultima &&
    ultima.subscription === sus.id &&
    ultima.status === 'open' &&
    ultima.paid !== true &&
    ultima.payment_intent?.status === 'requires_payment_method';
  let segundos = null;
  if (fallo) segundos = ultima.next_payment_attempt;
  else if (sus.collection_method === 'charge_automatically' && !sus.cancel_at_period_end && !sus.cancel_at)
    segundos = sus.current_period_end;
  if (!Number.isSafeInteger(segundos) || segundos * 1000 <= instante.getTime()) return null;
  const limite = sus.cancel_at_period_end ? sus.current_period_end : sus.cancel_at;
  if (Number.isSafeInteger(limite) && segundos >= limite) return null;
  const en = new Date(segundos * 1000);
  return { en, dia: diaMadrid(en) };
}
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
  async function intentarCorreos(lista) {
    for (const { id, tipo } of lista) {
      try {
        await confirmaciones.enviar(id, tipo);
      } catch {
        /* El evento y el dinero ya están registrados; el correo queda recuperable. */
      }
    }
  }
  // Factura inicial del alta para reconciliarla antes de un ciclo notificado primero: por
  // Session.invoice de la operación o por listado de Session (límite 2, coincidencia única).
  async function facturaInicial(alta, externa, conexionViva) {
    let id = null;
    if (alta.sesion_checkout_id) {
      const sesion = await pasarela.obtenerSesionPago(alta.sesion_checkout_id);
      conexionViva();
      if (
        sesion?.id === alta.sesion_checkout_id &&
        sesion.subscription === externa &&
        sesion.client_reference_id === alta.referencia
      )
        id = sesion.invoice;
    } else {
      const lista = await pasarela.obtenerSesionDeSuscripcion(externa);
      conexionViva();
      const coincidencias = (lista?.data ?? []).filter(
        (x) =>
          x.subscription === externa &&
          x.client_reference_id === alta.referencia &&
          x.metadata?.referencia === alta.referencia,
      );
      if (coincidencias.length === 1 && !lista.has_more) id = coincidencias[0].invoice;
    }
    if (!id) return null;
    const factura = await pasarela.obtenerFactura(id);
    conexionViva();
    return { factura };
  }
  // Todas las consultas a la pasarela se hacen aquí, con la exclusión de la conexión y FUERA
  // de transacción SQL; después el repositorio aplica el resultado en una transacción corta.
  async function reconciliar(c, conexionViva, e, externa) {
    const factura = TIPOS_FACTURA.includes(e.type) ? e.data.object.id : null;
    if (await repo.eventoRegistrado(c, e.id)) return factura ? repo.correosDeFactura(c, factura) : [];
    const actual = factura ? await pasarela.obtenerFactura(factura) : null;
    conexionViva();
    if (factura && (actual?.id !== factura || actual.subscription !== externa))
      throw new ErrorApi(
        503,
        'NOTIFICACION_NO_DISPONIBLE',
        'No se pudo acreditar la suscripción de la factura.',
      );
    const sus = await pasarela.obtenerSuscripcion(externa);
    conexionViva();
    let ultima = null;
    if (sus?.latest_invoice) {
      ultima = sus.latest_invoice === actual?.id ? actual : await pasarela.obtenerFactura(sus.latest_invoice);
      conexionViva();
    }
    let inicial = null;
    if (e.type === 'invoice.paid' && actual?.billing_reason === 'subscription_cycle') {
      const alta = await repo.altaPorSuscripcion(
        c,
        externa,
        sus?.metadata?.modulo === 'donaciones' ? sus.metadata.referencia : null,
      );
      if (alta && alta.estado !== 'confirmada') inicial = await facturaInicial(alta, externa, conexionViva);
    }
    return repo.reconciliarSuscripcion(c, e, {
      suscripcion: sus,
      factura: actual,
      inicial,
      prevision: calcularPrevision(sus, ultima),
    });
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
        const socio = entrada.modalidad === 'socio';
        if (socio && !PERIODICIDADES.includes(entrada.periodicidad))
          throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', {
            periodicidad: 'Elige una periodicidad mensual, trimestral o anual.',
          });
        datos = {
          claveSolicitud,
          modalidad: socio ? 'socio' : 'puntual',
          ...(socio && { periodicidad: entrada.periodicidad }),
          ...normalizarImporte(entrada.importe),
          proyectoId: entrada.proyectoId ?? null,
          donante: normalizarDonante(entrada.donante),
        };
        // La huella puntual conserva exactamente su forma anterior; la de socio añade periodicidad.
        huella = hash(
          JSON.stringify({
            modalidad: datos.modalidad,
            ...(socio && { periodicidad: datos.periodicidad }),
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
      // Previsión actual separada del resumen histórico: un instante vencido se devuelve null.
      let suscripcion = null;
      if (a.modalidad === 'cuota_socio' && a.suscripcion_socio_id) {
        const s = await repo.suscripcionDeAportacion(a.suscripcion_socio_id);
        suscripcion = {
          estado: s.estado,
          periodicidad: s.periodicidad,
          fechaProximoCobro:
            s.estado === 'activa' && s.pasarela_proximo_cobro_en && s.pasarela_proximo_cobro_en > ahora()
              ? s.proximo
              : null,
        };
      }
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
        suscripcion,
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
        !VERSIONES_EVENTO.has(e.api_version)
      )
        throw new ErrorApi(400, 'EVENTO_NO_VALIDO', 'La notificación no es válida.');
      const real =
        config.stripe.claveSecreta.startsWith('sk_live_') ||
        config.stripe.claveSecreta.startsWith('rk_live_');
      if (e.livemode !== real) throw new ErrorApi(400, 'EVENTO_NO_VALIDO', 'La notificación no es válida.');
      try {
        let correos = [];
        if (
          ['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled'].includes(
            e.type,
          )
        ) {
          const idCorreo = await repo.conExclusion(
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
          if (idCorreo) correos = [{ id: idCorreo, tipo: 'confirmacion' }];
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
        } else if (TIPOS_FACTURA.includes(e.type) || TIPOS_SUSCRIPCION.includes(e.type)) {
          // No leer subscription ni parent del snapshot: su forma depende de la versión.
          // La consulta preliminar identifica el lock; se vuelve a consultar bajo exclusión.
          let externa = e.data.object.id;
          if (TIPOS_FACTURA.includes(e.type)) {
            const factura = await pasarela.obtenerFactura(e.data.object.id);
            if (
              factura?.id !== e.data.object.id ||
              !(
                factura.subscription === null ||
                (typeof factura.subscription === 'string' && factura.subscription.startsWith('sub_'))
              )
            )
              throw new ErrorApi(503, 'NOTIFICACION_NO_DISPONIBLE', 'No se pudo identificar la factura.');
            externa = factura.subscription;
          }
          if (typeof externa !== 'string' || !externa) await repo.registrarEvento(pool, e, 'ignorado');
          else
            correos = await repo.conExclusion(
              'sub:' + externa,
              (c, conexionViva) => reconciliar(c, conexionViva, e, externa),
              true,
            );
        } else {
          await repo.registrarEvento(pool, e, 'ignorado');
        }
        await intentarCorreos(correos);
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
              texto: textoCorreoVerificacion(`${config.urlFrontend}/donar/vincular#token=${token}`),
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
