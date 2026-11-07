// Instrumentación exclusiva de pruebas: PostgreSQL aislado y adaptadores sin red.
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { crearEntornoPruebas, recursosCanonicos } from './soporte.js';
import { crearServicio } from '../servicio.js';
import { crearRutasDonaciones } from '../rutas.js';
import { manejadorErrores } from '../../../middleware/errores.js';

export async function crearBancoLocal(origen = 'http://localhost:4321') {
  if (process.env.NODE_ENV !== 'test') throw new Error('Banco permitido únicamente en pruebas.');
  const entorno = await crearEntornoPruebas();
  try {
    const fixtures = await entorno.crearFixtures();
    const cuenta = fixtures.usuarios[0];
    const donante = fixtures.donantes[0];
    const llamadas = { checkout: 0, smtp: 0, vinculos: 0, creaciones: [] };
    const sesiones = new Map();
    const pagos = new Map();
    const facturas = new Map();
    const suscripciones = new Map();
    const pasarela = {
      prepararSesionPago: (x) => ({ metadata: { referencia: x.referencia, modulo: 'donaciones' } }),
      async crearSesionPago() {
        llamadas.checkout++;
        const id = 'cs_local_' + randomUUID();
        const sesion = { id, status: 'open', url: origen + '/__pruebas/checkout' };
        sesiones.set(id, sesion);
        return { id, url: sesion.url };
      },
      obtenerSesionPago: async (id) => structuredClone(sesiones.get(id)),
      obtenerPago: async (id) => structuredClone(pagos.get(id)),
      obtenerFactura: async (id) => structuredClone(facturas.get(id)),
      obtenerSuscripcion: async (id) => structuredClone(suscripciones.get(id)),
      obtenerSesionDeSuscripcion: async () => ({ data: [], has_more: false }),
    };
    const servicio = crearServicio({
      pool: entorno.pool,
      pasarela,
      enviarCorreo: async () => {
        llamadas.smtp++;
        return false;
      },
    });
    const app = express();
    app.use(express.json());
    app.use(session({ secret: entorno.secretoSesion, resave: false, saveUninitialized: false }));
    // Cuenta fija cargada en el servidor de pruebas; no se lee identidad del cliente.
    app.use((req, res, next) => {
      req.usuario = cuenta;
      req.session.usuarioId = cuenta.id;
      if (req.method === 'POST' && req.path === '/api/donantes/vinculaciones') llamadas.vinculos++;
      if (req.method === 'POST' && req.path === '/api/aportaciones')
        res.on('finish', () => llamadas.creaciones.push({ estado: res.statusCode }));
      next();
    });
    app.get('/api/auth/yo', (req, res) =>
      res.json({ id: cuenta.id, nombre: cuenta.nombre, roles: cuenta.roles }),
    );
    app.get('/api/proyectos', (req, res) => res.json({ datos: [] }));
    app.use('/api', crearRutasDonaciones(servicio));
    app.use(manejadorErrores);
    const agente = request.agent(app);
    const tokenCsrf = (await agente.get('/api/donaciones/contexto').expect(200)).body.tokenCsrf;
    const dto = (cambios = {}) => ({
      claveSolicitud: randomUUID(),
      modalidad: 'puntual',
      importe: '20.00',
      proyectoId: null,
      donante: {
        nombre: donante.nombre,
        apellidos: donante.apellidos,
        nifNie: donante.nif_nie,
        correo: donante.correo,
        direccion: donante.direccion,
      },
      ...cambios,
    });
    async function crear(cambios) {
      return (
        await agente
          .post('/api/aportaciones')
          .set('origin', origen)
          .send({ ...dto(cambios), tokenCsrf })
          .expect(201)
      ).body;
    }
    const referencias = {};
    for (const caso of ['rechazada', 'pendiente', 'puntual', 'socio']) {
      const r = await crear(caso === 'socio' ? { modalidad: 'socio', periodicidad: 'mensual' } : {});
      referencias[caso] = r.referencia;
      if (caso === 'pendiente') continue;
      const canon = recursosCanonicos(r.referencia, 2000);
      const idPago = 'pi_local_' + randomUUID();
      canon.pago.id = idPago;
      canon.pago.invoice = null;
      canon.pago.status = caso === 'rechazada' ? 'requires_payment_method' : 'succeeded';
      canon.pago.amount_received = caso === 'rechazada' ? 0 : 2000;
      pagos.set(idPago, canon.pago);
      let tipo = caso === 'rechazada' ? 'payment_intent.payment_failed' : 'payment_intent.succeeded';
      let recurso = idPago;
      if (caso === 'socio') {
        canon.factura.payment_intent = { ...canon.pago, invoice: canon.factura.id };
        facturas.set(canon.factura.id, canon.factura);
        suscripciones.set(canon.suscripcion.id, canon.suscripcion);
        const op = (
          await entorno.pool.query(
            'SELECT o.* FROM operaciones_pago o JOIN aportaciones a ON a.id=o.aportacion_id WHERE a.referencia=$1',
            [r.referencia],
          )
        ).rows[0];
        Object.assign(sesiones.get(op.sesion_checkout_id), canon.sesion, { id: op.sesion_checkout_id });
        tipo = 'invoice.paid';
        recurso = canon.factura.id;
      }
      await servicio.procesarEvento({
        id: 'evt_local_' + randomUUID(),
        type: tipo,
        created: 1800000000,
        api_version: '2025-02-24.acacia',
        livemode: false,
        data: { object: { id: recurso } },
      });
    }
    async function balance() {
      const aportaciones = (await entorno.pool.query('SELECT * FROM aportaciones ORDER BY id')).rows;
      const operaciones = (await entorno.pool.query('SELECT * FROM operaciones_pago ORDER BY id')).rows;
      const correos = (
        await entorno.pool.query(
          'SELECT aportacion_id,estado,intentos,enviado_en FROM correos_aportacion ORDER BY id',
        )
      ).rows;
      const identidad = (await entorno.pool.query('SELECT * FROM donantes WHERE id=$1', [donante.id]))
        .rows[0];
      return { aportaciones, operaciones, correos, identidad, llamadas: structuredClone(llamadas) };
    }
    return {
      app,
      entorno,
      referencias,
      agente,
      tokenCsrf,
      dto,
      origen,
      balance,
      llamadas,
      cerrar: entorno.cerrar,
    };
  } catch (error) {
    await entorno.cerrar();
    throw error;
  }
}
