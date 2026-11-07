import { createHash, randomUUID } from 'node:crypto';
import { ErrorApi } from '../../middleware/errores.js';
import { sonDatosDonanteEquivalentes } from './normalizacion.js';
import { aCentimos } from '../../servicios-comunes/importes.js';
import { aIsoMadrid } from '../../servicios-comunes/fechas.js';

export const claveBloqueo = (texto) =>
  createHash('sha256').update(texto).digest().readBigInt64BE().toString();

// Cierre definitivo de una Subscription; past_due y unpaid no cancelan por sí solos.
export const CIERRES = ['canceled', 'incomplete_expired'];
const MOTIVO_CUOTA_FALLIDA = 'La cuota no se ha podido cobrar.';
const MOTIVO_ALTA_FALLIDA = 'El primer cobro no se ha completado.';
const MOTIVO_ALTA_CERRADA = 'El alta de socio no se ha completado.';

// Pago real de una factura de cuota: pagada por la pasarela, EUR, importe de la cuota y
// PaymentIntent de esa misma factura con el importe recibido (pasarela-stripe.md, «Cuotas»).
function pagoAcreditado(factura, centimos, livemode) {
  const pago = factura?.payment_intent;
  return Boolean(
    pago &&
      factura.status === 'paid' &&
      factura.paid === true &&
      factura.paid_out_of_band === false &&
      factura.currency === 'eur' &&
      factura.amount_paid === centimos &&
      factura.livemode === livemode &&
      Number.isSafeInteger(factura.status_transitions?.paid_at) &&
      factura.status_transitions.paid_at > 0 &&
      pago.invoice === factura.id &&
      pago.status === 'succeeded' &&
      pago.currency === 'eur' &&
      pago.amount === centimos &&
      pago.amount_received === centimos &&
      pago.livemode === livemode,
  );
}

export async function enTransaccion(pool, trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}

export function crearRepositorio(pool) {
  return {
    pool,
    async operacion(cliente, solicitudId) {
      return (
        await cliente.query(
          `SELECT o.*,a.referencia,a.estado AS estado_aportacion,a.importe,
        d.usuario_id AS "usuarioIdDonante",clock_timestamp()>=o.creado_en+interval '23 hours' AS vencida
        FROM operaciones_pago o JOIN aportaciones a ON a.id=o.aportacion_id
        JOIN donantes d ON d.id=a.donante_id WHERE o.solicitud_id=$1`,
          [solicitudId],
        )
      ).rows[0];
    },
    async aportacion(referencia, cliente = pool, bloquear = false) {
      return (
        await cliente.query(
          `SELECT a.*,d.usuario_id AS "usuarioIdDonante",d.correo,
        coalesce(p.nombre,'fondo general') AS destino FROM aportaciones a
        JOIN donantes d ON d.id=a.donante_id LEFT JOIN proyectos p ON p.id=a.proyecto_id
        WHERE a.referencia=$1 ${bloquear ? 'FOR UPDATE OF a' : ''}`,
          [referencia],
        )
      ).rows[0];
    },
    async operacionDeAportacion(id) {
      return (
        await pool.query(
          "SELECT *,clock_timestamp()>=creado_en+interval '23 hours' AS vencida FROM operaciones_pago WHERE aportacion_id=$1",
          [id],
        )
      ).rows[0];
    },
    async identidad(cliente, datos) {
      for (const clave of ['correo:' + datos.correo, 'nif:' + datos.nifNie].sort()) {
        await cliente.query('SELECT pg_advisory_xact_lock($1)', [claveBloqueo('hu01:identidad:' + clave)]);
      }
      const filas = (
        await cliente.query('SELECT * FROM donantes WHERE nif_nie=$1 OR correo=$2 FOR UPDATE', [
          datos.nifNie,
          datos.correo,
        ])
      ).rows;
      if (
        filas.length > 1 ||
        (filas[0] && !sonDatosDonanteEquivalentes(datos, { ...filas[0], nifNie: filas[0].nif_nie }))
      ) {
        throw new ErrorApi(
          409,
          'DATOS_DONANTE_INCOMPATIBLES',
          'Revisa los datos introducidos para continuar.',
        );
      }
      if (filas[0]) return filas[0];
      return (
        await cliente.query(
          `INSERT INTO donantes(nombre,apellidos,nif_nie,correo,direccion)
        VALUES($1,$2,$3,$4,$5) RETURNING *`,
          [datos.nombre, datos.apellidos, datos.nifNie, datos.correo, datos.direccion],
        )
      ).rows[0];
    },
    async preparar(datos, huella, prepararSesion, referencia, comprobarExistente) {
      return enTransaccion(pool, async (c) => {
        const bloqueo = (
          await c.query('SELECT pg_try_advisory_xact_lock($1) AS obtenido', [
            claveBloqueo('hu01:checkout:' + datos.claveSolicitud),
          ])
        ).rows[0].obtenido;
        if (!bloqueo) throw new ErrorApi(409, 'OPERACION_EN_CURSO', 'La operación se está preparando.');
        const anterior = await this.operacion(c, datos.claveSolicitud);
        if (anterior) {
          comprobarExistente(anterior);
          return { ...anterior, nueva: false };
        }
        if (!datos.donante)
          throw new ErrorApi(404, 'APORTACION_NO_DISPONIBLE', 'La aportación no está disponible.');
        let destino = 'fondo general';
        if (datos.proyectoId) {
          const p = (
            await c.query('SELECT nombre FROM proyectos WHERE id=$1 AND activo FOR SHARE', [datos.proyectoId])
          ).rows[0];
          if (!p) throw new ErrorApi(409, 'PROYECTO_NO_DISPONIBLE', 'El proyecto no está disponible.');
          destino = p.nombre;
        }
        const d = await this.identidad(c, datos.donante);
        const socio = datos.modalidad === 'socio';
        // Alta de socio: la suscripción nace pendiente, sin fecha de alta ni identificador
        // externo, y la aportación inicial es su primera cuota (modelo-datos.md).
        const suscripcionId = socio
          ? (
              await c.query(
                `INSERT INTO suscripciones_socio(donante_id,proyecto_id,importe,periodicidad)
              VALUES($1,$2,$3,$4) RETURNING id`,
                [d.id, datos.proyectoId, datos.importe, datos.periodicidad],
              )
            ).rows[0].id
          : null;
        const a = (
          await c.query(
            `INSERT INTO aportaciones(donante_id,proyecto_id,modalidad,importe,referencia,suscripcion_socio_id)
          VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
            [
              d.id,
              datos.proyectoId,
              socio ? 'cuota_socio' : 'puntual',
              datos.importe,
              referencia,
              suscripcionId,
            ],
          )
        ).rows[0];
        const cuerpo = prepararSesion({
          centimos: datos.centimos,
          descripcion: socio ? `Cuota de socio (${datos.periodicidad}): ${destino}` : 'Donación: ' + destino,
          correo: d.correo,
          referencia,
          ...(socio && { periodicidad: datos.periodicidad }),
        });
        await c.query(
          `INSERT INTO operaciones_pago(solicitud_id,aportacion_id,huella_solicitud,solicitud_checkout,estado)
          VALUES($1,$2,$3,$4,'preparada')`,
          [datos.claveSolicitud, a.id, huella, cuerpo],
        );
        return { ...(await this.operacion(c, datos.claveSolicitud)), nueva: true };
      });
    },
    async conExclusion(clave, trabajo, esperar = false) {
      const cliente = await pool.connect();
      let obtenido = false,
        destruir = false;
      const falloConexion = () => {
        destruir = true;
      };
      cliente.on('error', falloConexion);
      try {
        const funcion = esperar ? 'pg_advisory_lock' : 'pg_try_advisory_lock';
        const fila = (await cliente.query(`SELECT ${funcion}($1) AS obtenido`, [claveBloqueo(clave)]))
          .rows[0];
        obtenido = esperar || fila.obtenido;
        if (!obtenido) throw new ErrorApi(409, 'OPERACION_EN_CURSO', 'La operación se está preparando.');
        return await trabajo(cliente, () => {
          if (destruir) throw new ErrorApi(503, 'PAGO_NO_DISPONIBLE', 'El pago no está disponible.');
        });
      } finally {
        if (obtenido && !destruir) {
          try {
            destruir = !(
              await cliente.query('SELECT pg_advisory_unlock($1) AS liberado', [claveBloqueo(clave)])
            ).rows[0].liberado;
          } catch {
            destruir = true;
          }
        }
        cliente.removeListener('error', falloConexion);
        cliente.release(destruir);
      }
    },
    async registrarEvento(c, e, estado, errorCodigo = null) {
      await c.query(
        `INSERT INTO eventos_pasarela(pasarela_evento_id,tipo,objeto_id,ocurrido_en,estado,error_codigo)
        VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(pasarela_evento_id) DO NOTHING`,
        [e.id, e.type, e.data.object.id, new Date(e.created * 1000), estado, errorCodigo],
      );
    },
    async eventoRegistrado(c, id) {
      return (await c.query('SELECT * FROM eventos_pasarela WHERE pasarela_evento_id=$1', [id])).rows[0];
    },
    async aportacionDePago(c, id) {
      return (await c.query('SELECT id FROM aportaciones WHERE pasarela_pago_id=$1', [id])).rows[0];
    },
    async iniciarCheckout(c, id) {
      return (
        (
          await c.query(
            `UPDATE operaciones_pago SET estado='incierta',actualizado_en=clock_timestamp()
        WHERE id=$1 AND sesion_checkout_id IS NULL AND estado<>'cerrada'
        AND clock_timestamp()<creado_en+interval '23 hours' RETURNING id`,
            [id],
          )
        ).rowCount === 1
      );
    },
    async guardarCheckout(c, op, sesion) {
      await c.query(
        `UPDATE operaciones_pago SET sesion_checkout_id=$2,url_checkout=$3,
        estado=CASE WHEN estado='cerrada' OR EXISTS(SELECT 1 FROM aportaciones WHERE id=aportacion_id AND estado='confirmada')
          THEN 'cerrada' ELSE 'checkout_creado' END,actualizado_en=clock_timestamp()
        WHERE id=$1 AND (sesion_checkout_id IS NULL OR sesion_checkout_id=$2)`,
        [op.id, sesion.id, sesion.url],
      );
    },
    async guardarPago(c, e, pago) {
      await c.query('BEGIN');
      try {
        const duplicado = (
          await c.query('SELECT id FROM eventos_pasarela WHERE pasarela_evento_id=$1', [e.id])
        ).rowCount;
        const a = await this.aportacion(pago.metadata?.referencia, c, true);
        if (duplicado) {
          await c.query('COMMIT');
          return a?.id;
        }
        const valido =
          a &&
          a.modalidad === 'puntual' &&
          pago.id === e.data.object.id &&
          pago.metadata?.modulo === 'donaciones' &&
          pago.invoice === null &&
          pago.currency === 'eur' &&
          pago.amount === aCentimos(a.importe) &&
          (!a.pasarela_pago_id || a.pasarela_pago_id === pago.id) &&
          pago.livemode === e.livemode;
        if (!valido) {
          await this.registrarEvento(c, e, a ? 'incidencia' : 'ignorado', a ? 'PAGO_INCOMPATIBLE' : null);
          await c.query('COMMIT');
          return null;
        }
        let confirmar = false,
          estado = null,
          motivo = null;
        if (
          e.type === 'payment_intent.succeeded' &&
          pago.status === 'succeeded' &&
          pago.amount_received === pago.amount
        ) {
          confirmar = true;
          estado = 'confirmada';
        }
        if (e.type === 'payment_intent.payment_failed' && pago.status === 'requires_payment_method') {
          estado = 'rechazada';
          motivo = 'El pago no se ha completado.';
        }
        if (e.type === 'payment_intent.canceled' && pago.status === 'canceled') {
          estado = 'cancelada';
          motivo = 'La pasarela ha cancelado el pago.';
        }
        if (estado && a.estado !== 'confirmada' && (a.estado !== 'cancelada' || confirmar)) {
          const cambio = await c.query(
            `UPDATE aportaciones SET estado=$2,pasarela_pago_id=$3,fecha_cobro=$4,motivo=$5,actualizado_en=clock_timestamp()
            WHERE id=$1 AND estado<>'confirmada' RETURNING *`,
            [a.id, estado, pago.id, confirmar ? new Date(e.created * 1000) : null, motivo],
          );
          if (confirmar && cambio.rowCount) {
            await this.crearCorreo(c, a.id, {
              referencia: a.referencia,
              importe: a.importe,
              modalidad: 'puntual',
              destino: a.destino,
              fechaCobro: aIsoMadrid(new Date(e.created * 1000)),
            });
            await c.query(
              "UPDATE operaciones_pago SET estado='cerrada',actualizado_en=clock_timestamp() WHERE aportacion_id=$1",
              [a.id],
            );
          }
        }
        const incidencia = e.type === 'payment_intent.succeeded' && !confirmar;
        await this.registrarEvento(
          c,
          e,
          incidencia ? 'incidencia' : 'procesado',
          incidencia ? 'PAGO_NO_ACREDITADO' : null,
        );
        await c.query('COMMIT');
        return confirmar || a.estado === 'confirmada' ? a.id : null;
      } catch (error) {
        await c.query('ROLLBACK').catch(() => {});
        throw error;
      }
    },
    async guardarSesionEvento(c, e, sesion) {
      await c.query('BEGIN');
      try {
        const a = await this.aportacion(sesion.metadata?.referencia, c, true);
        const op = a
          ? (await c.query('SELECT * FROM operaciones_pago WHERE aportacion_id=$1 FOR UPDATE', [a.id]))
              .rows[0]
          : null;
        // Alta de socio: la Session solo correlaciona Subscription; nunca confirma una cuota.
        const socio = a?.modalidad === 'cuota_socio';
        const suscripcion = socio
          ? (
              await c.query('SELECT * FROM suscripciones_socio WHERE id=$1 FOR UPDATE', [
                a.suscripcion_socio_id,
              ])
            ).rows[0]
          : null;
        const comun =
          a &&
          op &&
          sesion.metadata?.modulo === 'donaciones' &&
          sesion.client_reference_id === a.referencia &&
          sesion.id === e.data.object.id &&
          sesion.livemode === e.livemode &&
          (!op.sesion_checkout_id || op.sesion_checkout_id === sesion.id);
        const valida = socio
          ? comun &&
            suscripcion &&
            sesion.mode === 'subscription' &&
            (!sesion.subscription ||
              !suscripcion.pasarela_suscripcion_id ||
              suscripcion.pasarela_suscripcion_id === sesion.subscription)
          : comun &&
            a.modalidad === 'puntual' &&
            sesion.mode === 'payment' &&
            sesion.invoice === null &&
            sesion.subscription === null &&
            (!sesion.payment_intent || !a.pasarela_pago_id || a.pasarela_pago_id === sesion.payment_intent);
        if (valida) {
          await this.guardarCheckout(c, op, sesion);
          if (socio && sesion.subscription) {
            await c.query(
              `UPDATE suscripciones_socio SET pasarela_suscripcion_id=$2,actualizado_en=clock_timestamp()
              WHERE id=$1 AND pasarela_suscripcion_id IS NULL`,
              [suscripcion.id, sesion.subscription],
            );
          }
          if (!socio && sesion.payment_intent) {
            await c.query(
              `UPDATE aportaciones SET pasarela_pago_id=$2,actualizado_en=clock_timestamp()
              WHERE id=$1 AND pasarela_pago_id IS NULL AND estado<>'confirmada'`,
              [a.id, sesion.payment_intent],
            );
          }
          if (
            e.type === 'checkout.session.expired' &&
            sesion.status === 'expired' &&
            a.estado !== 'confirmada' &&
            sesion.payment_status !== 'paid'
          ) {
            await c.query(
              "UPDATE aportaciones SET estado='cancelada',motivo='La sesión de pago ha caducado.',actualizado_en=clock_timestamp() WHERE id=$1 AND estado<>'confirmada'",
              [a.id],
            );
            await c.query(
              "UPDATE operaciones_pago SET estado='cerrada',actualizado_en=clock_timestamp() WHERE id=$1",
              [op.id],
            );
            // Sin Subscription creada, el alta no llegó a existir en la pasarela: cierre definitivo.
            if (socio && !sesion.subscription) {
              await c.query(
                `UPDATE suscripciones_socio SET estado='cancelada',fecha_proximo_cobro=NULL,
                pasarela_proximo_cobro_en=NULL,actualizado_en=clock_timestamp() WHERE id=$1 AND estado='pendiente'`,
                [suscripcion.id],
              );
            }
          }
        }
        await this.registrarEvento(
          c,
          e,
          valida ? 'procesado' : a ? 'incidencia' : 'ignorado',
          !valida && a ? 'SESION_INCOMPATIBLE' : null,
        );
        await c.query('COMMIT');
      } catch (error) {
        await c.query('ROLLBACK').catch(() => {});
        throw error;
      }
    },
    // ---- US2 · suscripciones y cuotas (pasarela-stripe.md, «Cuotas» y «Próxima fecha») ----
    async suscripcionDeAportacion(id) {
      return (
        await pool.query(
          `SELECT *,to_char(fecha_proximo_cobro,'YYYY-MM-DD') AS proximo FROM suscripciones_socio WHERE id=$1`,
          [id],
        )
      ).rows[0];
    },
    // Consulta preliminar, sin transacción: solo identifica el alta para recuperar su factura.
    async altaPorSuscripcion(c, suscripcionExterna, referencia) {
      return (
        await c.query(
          `SELECT a.id,a.referencia,a.estado,o.sesion_checkout_id FROM suscripciones_socio s
          JOIN aportaciones a ON a.suscripcion_socio_id=s.id JOIN operaciones_pago o ON o.aportacion_id=a.id
          WHERE s.pasarela_suscripcion_id=$1 OR (s.pasarela_suscripcion_id IS NULL AND a.referencia=$2)
          ORDER BY (s.pasarela_suscripcion_id IS NOT NULL) DESC LIMIT 1`,
          [suscripcionExterna, referencia ?? null],
        )
      ).rows[0];
    },
    async correosDeFactura(c, facturaId) {
      return (
        await c.query(
          `SELECT ca.aportacion_id AS id,ca.tipo FROM correos_aportacion ca
          JOIN aportaciones a ON a.id=ca.aportacion_id WHERE a.pasarela_factura_id=$1 ORDER BY ca.id`,
          [facturaId],
        )
      ).rows;
    },
    async insertarCuota(c, local, factura, pago) {
      return (
        await c.query(
          `INSERT INTO aportaciones(donante_id,proyecto_id,suscripcion_socio_id,modalidad,importe,referencia,
          pasarela_factura_id,pasarela_pago_id) VALUES($1,$2,$3,'cuota_socio',$4,$5,$6,$7) RETURNING *`,
          [
            local.donante_id,
            local.proyecto_id,
            local.id,
            local.importe,
            'DON-' + randomUUID(),
            factura.id,
            pago?.id ?? null,
          ],
        )
      ).rows[0];
    },
    async cuotaDeFactura(c, facturaId) {
      return (
        await c.query('SELECT * FROM aportaciones WHERE pasarela_factura_id=$1 FOR UPDATE', [facturaId])
      ).rows[0];
    },
    // Confirma la cuota de una factura ya verificada. La primera activa el alta salvo cierre
    // definitivo actual; una confirmada no cambia y paid_at fija fecha de cobro y de alta.
    async confirmarCuota(c, { local, sus, factura, objetivo, primera, confirmadas }) {
      const pago = factura.payment_intent;
      if (
        (objetivo.pasarela_factura_id && objetivo.pasarela_factura_id !== factura.id) ||
        (objetivo.pasarela_pago_id && objetivo.pasarela_pago_id !== pago.id)
      )
        return 'FACTURA_INCOMPATIBLE';
      const pagadaEn = new Date(factura.status_transitions.paid_at * 1000);
      if (objetivo.estado !== 'confirmada') {
        const cambio = await c.query(
          `UPDATE aportaciones SET estado='confirmada',fecha_cobro=$2,pasarela_factura_id=$3,pasarela_pago_id=$4,
          motivo=NULL,actualizado_en=clock_timestamp() WHERE id=$1 AND estado<>'confirmada' RETURNING id`,
          [objetivo.id, pagadaEn, factura.id, pago.id],
        );
        if (cambio.rowCount) confirmadas.push(objetivo.id);
        objetivo.estado = 'confirmada';
      }
      if (primera) {
        await c.query(
          `UPDATE suscripciones_socio SET fecha_alta=coalesce(fecha_alta,$2),
          estado=CASE WHEN estado='pendiente' AND NOT $3::boolean THEN 'activa' ELSE estado END,
          actualizado_en=clock_timestamp() WHERE id=$1`,
          [local.id, pagadaEn, CIERRES.includes(sus.status)],
        );
        await c.query(
          "UPDATE operaciones_pago SET estado='cerrada',actualizado_en=clock_timestamp() WHERE aportacion_id=$1",
          [objetivo.id],
        );
      }
      return null;
    },
    // Devuelve un código de incidencia o null. No escribe nada si la factura no se acredita.
    async aplicarFactura(c, e, ctx) {
      const { local, alta, sus, factura, inicial, centimos, confirmadas, avisos } = ctx;
      if (
        factura.subscription !== sus.id ||
        factura.livemode !== e.livemode ||
        factura.id !== e.data.object.id
      )
        return 'FACTURA_INCOMPATIBLE';
      if (e.type === 'invoice.updated') return null;
      if (!['subscription_create', 'subscription_cycle'].includes(factura.billing_reason))
        return 'FACTURA_FUERA_DE_ALCANCE';
      const pago = factura.payment_intent;
      const primera = factura.billing_reason === 'subscription_create';
      if (e.type === 'invoice.paid') {
        if (!pagoAcreditado(factura, centimos, e.livemode)) return 'FACTURA_NO_ACREDITADA';
        if (primera)
          return this.confirmarCuota(c, { local, sus, factura, objetivo: alta, primera, confirmadas });
        let objetivo = await this.cuotaDeFactura(c, factura.id);
        if (objetivo && objetivo.suscripcion_socio_id !== local.id) return 'FACTURA_INCOMPATIBLE';
        if (alta.estado !== 'confirmada') {
          // Ciclo notificado antes del primer cobro local: se reconcilia antes la factura inicial.
          const fi = inicial?.factura;
          if (
            !fi ||
            fi.billing_reason !== 'subscription_create' ||
            fi.subscription !== sus.id ||
            fi.livemode !== e.livemode ||
            !pagoAcreditado(fi, centimos, e.livemode)
          )
            return 'FACTURA_INICIAL_NO_ACREDITADA';
          const r = await this.confirmarCuota(c, {
            local,
            sus,
            factura: fi,
            objetivo: alta,
            primera: true,
            confirmadas,
          });
          if (r) return r;
        }
        objetivo ??= await this.insertarCuota(c, local, factura, pago);
        return this.confirmarCuota(c, { local, sus, factura, objetivo, primera: false, confirmadas });
      }
      // invoice.payment_failed: solo registra un rechazo que el recurso actual mantiene.
      if (
        !pago ||
        pago.invoice !== factura.id ||
        pago.currency !== 'eur' ||
        factura.currency !== 'eur' ||
        pago.amount !== centimos ||
        pago.livemode !== e.livemode
      )
        return 'FACTURA_INCOMPATIBLE';
      if (factura.paid || factura.status !== 'open' || pago.status !== 'requires_payment_method') return null;
      let objetivo = primera ? alta : await this.cuotaDeFactura(c, factura.id);
      if (
        objetivo &&
        (objetivo.suscripcion_socio_id !== local.id ||
          (objetivo.pasarela_factura_id && objetivo.pasarela_factura_id !== factura.id) ||
          (objetivo.pasarela_pago_id && objetivo.pasarela_pago_id !== pago.id))
      )
        return 'FACTURA_INCOMPATIBLE';
      objetivo ??= await this.insertarCuota(c, local, factura, pago);
      if (objetivo.estado === 'confirmada') return null;
      await c.query(
        `UPDATE aportaciones SET estado=CASE WHEN estado='pendiente' THEN 'rechazada' ELSE estado END,
        motivo=CASE WHEN estado='pendiente' THEN $4 ELSE motivo END,
        pasarela_factura_id=coalesce(pasarela_factura_id,$2),pasarela_pago_id=coalesce(pasarela_pago_id,$3),
        actualizado_en=clock_timestamp() WHERE id=$1 AND estado<>'confirmada'`,
        [objetivo.id, factura.id, pago.id, primera ? MOTIVO_ALTA_FALLIDA : MOTIVO_CUOTA_FALLIDA],
      );
      if (!primera) avisos.push(objetivo.id);
      return null;
    },
    // Transacción corta tras consultar la pasarela fuera de ella (bloqueo sub:<id> por conexión).
    async reconciliarSuscripcion(
      c,
      e,
      { suscripcion: sus, factura = null, inicial = null, prevision = null },
    ) {
      await c.query('BEGIN');
      try {
        if (await this.eventoRegistrado(c, e.id)) {
          const pendientes = factura ? await this.correosDeFactura(c, factura.id) : [];
          await c.query('COMMIT');
          return pendientes;
        }
        const fin = async (estado, codigo = null, correos = []) => {
          await this.registrarEvento(c, e, estado, codigo);
          await c.query('COMMIT');
          return correos;
        };
        const externa = e.type.startsWith('invoice.') ? factura?.subscription : e.data.object.id;
        if (!sus || sus.id !== externa) return fin('incidencia', 'SUSCRIPCION_NO_ACREDITADA');
        let local = (
          await c.query('SELECT * FROM suscripciones_socio WHERE pasarela_suscripcion_id=$1 FOR UPDATE', [
            sus.id,
          ])
        ).rows[0];
        const referenciaAlta = sus.metadata?.modulo === 'donaciones' ? sus.metadata.referencia : null;
        if (!local && typeof referenciaAlta === 'string' && referenciaAlta) {
          local = (
            await c.query(
              `SELECT s.* FROM suscripciones_socio s JOIN aportaciones a ON a.suscripcion_socio_id=s.id
              JOIN operaciones_pago o ON o.aportacion_id=a.id WHERE a.referencia=$1 FOR UPDATE OF s`,
              [referenciaAlta],
            )
          ).rows[0];
        }
        if (!local) return fin('ignorado');
        const alta = (
          await c.query(
            `SELECT a.* FROM aportaciones a JOIN operaciones_pago o ON o.aportacion_id=a.id
            WHERE a.suscripcion_socio_id=$1 FOR UPDATE OF a`,
            [local.id],
          )
        ).rows[0];
        if (
          !alta ||
          sus.metadata?.modulo !== 'donaciones' ||
          sus.metadata.referencia !== alta.referencia ||
          sus.livemode !== e.livemode ||
          (local.pasarela_suscripcion_id && local.pasarela_suscripcion_id !== sus.id)
        )
          return fin('incidencia', 'SUSCRIPCION_INCOMPATIBLE');
        if (e.type.startsWith('invoice.') && !factura) return fin('incidencia', 'FACTURA_NO_ACREDITADA');
        const confirmadas = [],
          avisos = [];
        if (factura) {
          const incidencia = await this.aplicarFactura(c, e, {
            local,
            alta,
            sus,
            factura,
            inicial,
            centimos: aCentimos(local.importe),
            confirmadas,
            avisos,
          });
          if (incidencia) {
            await c.query('ROLLBACK');
            await c.query('BEGIN');
            return fin('incidencia', incidencia);
          }
        }
        if (!local.pasarela_suscripcion_id) {
          await c.query(
            'UPDATE suscripciones_socio SET pasarela_suscripcion_id=$2,actualizado_en=clock_timestamp() WHERE id=$1',
            [local.id, sus.id],
          );
        }
        let estado = (await c.query('SELECT estado FROM suscripciones_socio WHERE id=$1', [local.id])).rows[0]
          .estado;
        if (CIERRES.includes(sus.status) && estado !== 'cancelada') {
          // Cierre definitivo canónico: no altera cuotas confirmadas; un alta nunca cobrada se cierra.
          await c.query(
            "UPDATE suscripciones_socio SET estado='cancelada',actualizado_en=clock_timestamp() WHERE id=$1",
            [local.id],
          );
          await c.query(
            `UPDATE aportaciones SET estado='cancelada',motivo=$2,actualizado_en=clock_timestamp()
            WHERE id=$1 AND estado IN ('pendiente','rechazada')`,
            [alta.id, MOTIVO_ALTA_CERRADA],
          );
          await c.query(
            "UPDATE operaciones_pago SET estado='cerrada',actualizado_en=clock_timestamp() WHERE aportacion_id=$1",
            [alta.id],
          );
          estado = 'cancelada';
        }
        // Instante y DATE se guardan juntos; sin alta activa no se anuncia ningún cobro.
        const vigente = estado === 'activa' ? prevision : null;
        await c.query(
          `UPDATE suscripciones_socio SET fecha_proximo_cobro=$2::date,pasarela_proximo_cobro_en=$3,
          actualizado_en=clock_timestamp() WHERE id=$1`,
          [local.id, vigente?.dia ?? null, vigente?.en ?? null],
        );
        const correos = [];
        for (const id of confirmadas) {
          const a = (await c.query('SELECT referencia FROM aportaciones WHERE id=$1', [id])).rows[0];
          const vista = await this.aportacion(a.referencia, c);
          await this.crearCorreo(c, id, {
            referencia: vista.referencia,
            importe: vista.importe,
            modalidad: 'cuota_socio',
            destino: vista.destino,
            fechaCobro: aIsoMadrid(vista.fecha_cobro),
            periodicidad: local.periodicidad,
            fechaProximoCobro: vigente?.dia ?? null,
          });
          correos.push({ id, tipo: 'confirmacion' });
        }
        // El aviso de fallo no se emite con la suscripción cerrada: no anuncia otro cobro.
        if (estado !== 'cancelada') {
          for (const id of avisos) {
            const a = (await c.query('SELECT referencia,importe FROM aportaciones WHERE id=$1', [id]))
              .rows[0];
            await this.crearCorreo(
              c,
              id,
              {
                referencia: a.referencia,
                importe: a.importe,
                motivo: MOTIVO_CUOTA_FALLIDA,
                fechaProximoCobro: vigente?.dia ?? null,
              },
              'fallo_cuota',
            );
            correos.push({ id, tipo: 'fallo_cuota' });
          }
        }
        return fin('procesado', null, correos);
      } catch (error) {
        await c.query('ROLLBACK').catch(() => {});
        throw error;
      }
    },
    async emitirVerificacion(usuarioId, hash) {
      return enTransaccion(pool, async (c) => {
        const u = (
          await c.query("SELECT * FROM usuarios WHERE id=$1 AND activo AND 'donante'=ANY(roles) FOR UPDATE", [
            usuarioId,
          ])
        ).rows[0];
        if (!u) return null;
        const ds = (
          await c.query('SELECT * FROM donantes WHERE correo=$1 FOR UPDATE', [
            u.correo.normalize('NFC').trim().toLowerCase(),
          ])
        ).rows;
        if (ds.length !== 1 || ds[0].usuario_id) return null;
        if ((await c.query('SELECT id FROM donantes WHERE usuario_id=$1', [u.id])).rowCount) return null;
        const d = ds[0];
        await c.query(
          `UPDATE verificaciones_donante SET expira_en=least(expira_en,clock_timestamp()),actualizado_en=clock_timestamp()
          WHERE usuario_id=$1 AND donante_id=$2 AND usado_en IS NULL`,
          [u.id, d.id],
        );
        await c.query(
          `INSERT INTO verificaciones_donante(usuario_id,donante_id,token_hash,expira_en)
          VALUES($1,$2,$3,clock_timestamp()+interval '30 minutes')`,
          [u.id, d.id, hash],
        );
        return { correo: u.correo };
      });
    },
    async consumirVerificacion(usuarioId, hash) {
      const invalido = () => new ErrorApi(400, 'ENLACE_NO_VALIDO', 'El enlace no es válido.');
      return enTransaccion(pool, async (c) => {
        // Mismo orden de bloqueo que la emisión: Usuario, Donante, verificación.
        const u = (await c.query('SELECT * FROM usuarios WHERE id=$1 FOR UPDATE', [usuarioId])).rows[0];
        const candidato = (
          await c.query('SELECT * FROM verificaciones_donante WHERE token_hash=$1 AND usuario_id=$2', [
            hash,
            usuarioId,
          ])
        ).rows[0];
        if (!candidato) throw invalido();
        const d = (await c.query('SELECT * FROM donantes WHERE id=$1 FOR UPDATE', [candidato.donante_id]))
          .rows[0];
        const v = (
          await c.query(
            `SELECT *,expira_en>clock_timestamp() AS vigente FROM verificaciones_donante WHERE id=$1 FOR UPDATE`,
            [candidato.id],
          )
        ).rows[0];
        if (!u?.activo || !u.roles.includes('donante') || !v.vigente || v.usado_en) throw invalido();
        const otro = (await c.query('SELECT id FROM donantes WHERE usuario_id=$1 AND id<>$2', [u.id, d.id]))
          .rowCount;
        if (d.correo !== u.correo.normalize('NFC').trim().toLowerCase() || d.usuario_id || otro)
          throw new ErrorApi(409, 'VINCULACION_NO_DISPONIBLE', 'La vinculación no está disponible.');
        await c.query('UPDATE donantes SET usuario_id=$1,actualizado_en=clock_timestamp() WHERE id=$2', [
          u.id,
          d.id,
        ]);
        await c.query(
          'UPDATE verificaciones_donante SET usado_en=clock_timestamp(),actualizado_en=clock_timestamp() WHERE id=$1',
          [v.id],
        );
        return { vinculado: true };
      });
    },
    async crearCorreo(cliente, aportacionId, resumen, tipo = 'confirmacion') {
      await cliente.query(
        `INSERT INTO correos_aportacion(aportacion_id,tipo,resumen,estado)
        VALUES($1,$3,$2,'pendiente') ON CONFLICT(aportacion_id,tipo) DO NOTHING`,
        [aportacionId, resumen, tipo],
      );
      return (
        await cliente.query('SELECT * FROM correos_aportacion WHERE aportacion_id=$1 AND tipo=$2', [
          aportacionId,
          tipo,
        ])
      ).rows[0];
    },
    async correo(aportacionId, tipo = 'confirmacion') {
      return (
        await pool.query(
          `SELECT c.*,d.correo FROM correos_aportacion c
        JOIN aportaciones a ON a.id=c.aportacion_id JOIN donantes d ON d.id=a.donante_id
        WHERE c.aportacion_id=$1 AND c.tipo=$2`,
          [aportacionId, tipo],
        )
      ).rows[0];
    },
    async reclamarCorreo(aportacionId, tipo = 'confirmacion') {
      return (
        (
          await pool.query(
            `UPDATE correos_aportacion SET estado='enviando',intentos=intentos+1,
        reservado_hasta=clock_timestamp()+interval '30 seconds',actualizado_en=clock_timestamp()
        WHERE aportacion_id=$1 AND tipo=$2 AND (estado IN ('pendiente','fallido')
        OR (estado='enviando' AND reservado_hasta<=clock_timestamp())) RETURNING *`,
            [aportacionId, tipo],
          )
        ).rows[0] ?? null
      );
    },
    async renovarCorreo(intento) {
      return (
        (
          await pool.query(
            `UPDATE correos_aportacion SET reservado_hasta=clock_timestamp()+interval '30 seconds',
        actualizado_en=clock_timestamp() WHERE id=$1 AND intentos=$2 AND estado='enviando'
        AND reservado_hasta>clock_timestamp() RETURNING id`,
            [intento.id, intento.intentos],
          )
        ).rowCount === 1
      );
    },
    async terminarCorreo(intento, aceptado) {
      return (
        (
          await pool.query(
            `UPDATE correos_aportacion SET estado=$3,reservado_hasta=NULL,
        enviado_en=CASE WHEN $3='enviado' THEN clock_timestamp() ELSE NULL END,actualizado_en=clock_timestamp()
        WHERE id=$1 AND intentos=$2 AND estado='enviando' AND reservado_hasta>clock_timestamp() RETURNING id`,
            [intento.id, intento.intentos, aceptado ? 'enviado' : 'fallido'],
          )
        ).rowCount === 1
      );
    },
  };
}
