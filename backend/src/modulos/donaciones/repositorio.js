import { createHash } from 'node:crypto';
import { ErrorApi } from '../../middleware/errores.js';
import { sonDatosDonanteEquivalentes } from './normalizacion.js';
import { aCentimos } from '../../servicios-comunes/importes.js';
import { aIsoMadrid } from '../../servicios-comunes/fechas.js';

export const claveBloqueo = (texto) =>
  createHash('sha256').update(texto).digest().readBigInt64BE().toString();

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
        const a = (
          await c.query(
            `INSERT INTO aportaciones(donante_id,proyecto_id,modalidad,importe,referencia)
          VALUES($1,$2,'puntual',$3,$4) RETURNING id`,
            [d.id, datos.proyectoId, datos.importe, referencia],
          )
        ).rows[0];
        const cuerpo = prepararSesion({
          centimos: datos.centimos,
          descripcion: 'Donación: ' + destino,
          correo: d.correo,
          referencia,
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
        const valida =
          a &&
          op &&
          a.modalidad === 'puntual' &&
          sesion.mode === 'payment' &&
          sesion.metadata?.modulo === 'donaciones' &&
          sesion.client_reference_id === a.referencia &&
          sesion.invoice === null &&
          sesion.subscription === null &&
          sesion.id === e.data.object.id &&
          sesion.livemode === e.livemode &&
          (!sesion.payment_intent || !a.pasarela_pago_id || a.pasarela_pago_id === sesion.payment_intent) &&
          (!op.sesion_checkout_id || op.sesion_checkout_id === sesion.id);
        if (valida) {
          await this.guardarCheckout(c, op, sesion);
          if (sesion.payment_intent) {
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
    async crearCorreo(cliente, aportacionId, resumen) {
      await cliente.query(
        `INSERT INTO correos_aportacion(aportacion_id,tipo,resumen,estado)
        VALUES($1,'confirmacion',$2,'pendiente') ON CONFLICT(aportacion_id,tipo) DO NOTHING`,
        [aportacionId, resumen],
      );
      return (
        await cliente.query(
          "SELECT * FROM correos_aportacion WHERE aportacion_id=$1 AND tipo='confirmacion'",
          [aportacionId],
        )
      ).rows[0];
    },
    async correo(aportacionId) {
      return (
        await pool.query(
          `SELECT c.*,d.correo FROM correos_aportacion c
        JOIN aportaciones a ON a.id=c.aportacion_id JOIN donantes d ON d.id=a.donante_id
        WHERE c.aportacion_id=$1 AND c.tipo='confirmacion'`,
          [aportacionId],
        )
      ).rows[0];
    },
    async reclamarCorreo(aportacionId) {
      return (
        (
          await pool.query(
            `UPDATE correos_aportacion SET estado='enviando',intentos=intentos+1,
        reservado_hasta=clock_timestamp()+interval '30 seconds',actualizado_en=clock_timestamp()
        WHERE aportacion_id=$1 AND tipo='confirmacion' AND (estado IN ('pendiente','fallido')
        OR (estado='enviando' AND reservado_hasta<=clock_timestamp())) RETURNING *`,
            [aportacionId],
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
