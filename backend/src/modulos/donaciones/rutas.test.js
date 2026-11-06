import { beforeAll, afterAll, it, expect, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { crearEntornoPruebas } from './pruebas/soporte.js';
import { crearServicio } from './servicio.js';
import { crearRutasDonaciones, crearWebhook } from './rutas.js';
import { manejadorErrores, ErrorApi } from '../../middleware/errores.js';
let entorno, fixtures, servicio, pasarela, enviar, app;
const origen = 'http://localhost:4321';
const dto = () => ({
  claveSolicitud: randomUUID(),
  modalidad: 'puntual',
  importe: '20.00',
  proyectoId: null,
  donante: {
    nombre: 'Invitado',
    apellidos: 'Sintetico',
    nifNie: '99999999R',
    correo: 'invitado@example.test',
    direccion: 'Calle Ejemplo 2',
  },
});
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await entorno.crearFixtures();
  pasarela = {
    prepararSesionPago: vi.fn((x) => ({ metadata: { referencia: x.referencia, modulo: 'donaciones' } })),
    crearSesionPago: vi.fn(async () => ({
      id: 'cs_' + randomUUID(),
      url: 'https://checkout.stripe.test/sesion',
    })),
    obtenerSesionPago: vi.fn(async (id) => ({
      id,
      status: 'open',
      url: 'https://checkout.stripe.test/sesion',
    })),
    verificarEvento: vi.fn((buffer, firma) => {
      if (firma !== 'sintetica' || !Buffer.isBuffer(buffer))
        throw new ErrorApi(400, 'FIRMA_INVALIDA', 'Firma inválida');
      return JSON.parse(buffer);
    }),
  };
  enviar = vi.fn(async () => true);
  servicio = crearServicio({ pool: entorno.pool, pasarela, enviarCorreo: enviar });
  app = express();
  app.post('/api/pasarela/webhook', express.raw({ type: 'application/json' }), crearWebhook(servicio));
  app.use(express.json());
  app.use(session({ secret: 'sesion-sintetica-hu01', resave: false, saveUninitialized: false }));
  // Identificación sintética de servidor; no existe este selector en las rutas del producto.
  app.use((req, res, next) => {
    const u = fixtures.usuarios.find((x) => x.id === req.get('x-cuenta-prueba'));
    req.usuario = u ?? null;
    if (u) req.session.usuarioId = u.id;
    next();
  });
  app.use('/api', crearRutasDonaciones(servicio));
  app.use(manejadorErrores);
});
afterAll(async () => {
  await entorno?.cerrar();
});
async function contexto(agente, usuario) {
  let r = agente.get('/api/donaciones/contexto');
  if (usuario) r = r.set('x-cuenta-prueba', usuario.id);
  return (await r.expect(200)).body.tokenCsrf;
}
it('contexto, creación privada y DTO corto; rechaza CSRF, campos desconocidos y sesión ajena', async () => {
  const a = request.agent(app),
    b = request.agent(app),
    tokenCsrf = await contexto(a),
    datos = dto();
  const n = pasarela.crearSesionPago.mock.calls.length;
  await a
    .post('/api/aportaciones')
    .send({ ...datos, tokenCsrf })
    .expect(403);
  await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ ...datos, tokenCsrf, donanteId: '1' })
    .expect(400);
  expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(n);
  const r = await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ ...datos, tokenCsrf })
    .expect(201);
  const repetida = await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ claveSolicitud: datos.claveSolicitud, tokenCsrf })
    .expect(200);
  expect(repetida.body.referencia).toBe(r.body.referencia);
  const ruta = '/api/aportaciones/referencia/' + r.body.referencia;
  const propio = await a.get(ruta).expect(200);
  expect(propio.headers['cache-control']).toBe('no-store');
  expect(propio.body).not.toHaveProperty('donante');
  expect(propio.body.correo.estado).toBe('noPrevisto');
  expect((await b.get(ruta).expect(404)).body).toEqual(
    (await b.get('/api/aportaciones/referencia/no-existe').expect(404)).body,
  );
  await a
    .post(ruta + '/correo')
    .set('origin', origen)
    .send({ tokenCsrf })
    .expect(409);
});
it('resultado y correo propios: un fallo SMTP conserva el cobro y reintentar no cobra otra vez', async () => {
  const a = request.agent(app),
    tokenCsrf = await contexto(a),
    r = await a
      .post('/api/aportaciones')
      .set('origin', origen)
      .send({ ...dto(), tokenCsrf })
      .expect(201);
  const aporte = (
    await entorno.pool.query('SELECT * FROM aportaciones WHERE referencia=$1', [r.body.referencia])
  ).rows[0];
  await entorno.pool.query(
    "UPDATE aportaciones SET estado='confirmada',fecha_cobro=clock_timestamp() WHERE id=$1",
    [aporte.id],
  );
  await servicio.repo.crearCorreo(entorno.pool, aporte.id, {
    referencia: aporte.referencia,
    importe: '20.00',
    modalidad: 'puntual',
    destino: 'fondo general',
    fechaCobro: '2026-11-06T12:00:00+01:00',
  });
  const n = pasarela.crearSesionPago.mock.calls.length,
    ruta = '/api/aportaciones/referencia/' + aporte.referencia + '/correo';
  enviar.mockResolvedValueOnce(false);
  expect((await a.post(ruta).set('origin', origen).send({ tokenCsrf }).expect(200)).body.estadoCorreo).toBe(
    'fallido',
  );
  expect((await a.post(ruta).set('origin', origen).send({ tokenCsrf }).expect(200)).body.estadoCorreo).toBe(
    'enviado',
  );
  const correos = enviar.mock.calls.length;
  await a.post(ruta).set('origin', origen).send({ tokenCsrf }).expect(200);
  expect(enviar).toHaveBeenCalledTimes(correos);
  expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(n);
});
it('solicitud de vínculo no enumera, exige cuenta/rol y el cliente no elige destinatario', async () => {
  const a = request.agent(app),
    tokenCsrf = await contexto(a);
  await a.post('/api/donantes/vinculaciones').set('origin', origen).send({ tokenCsrf }).expect(401);
  const u = fixtures.usuarios[0];
  await entorno.pool.query('UPDATE donantes SET usuario_id=NULL WHERE id=$1', [fixtures.donantes[0].id]);
  const t = await contexto(a, u);
  enviar.mockResolvedValueOnce(false);
  const r = await a
    .post('/api/donantes/vinculaciones')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf: t })
    .expect(202);
  expect(r.body.mensaje).toContain('Si hay aportaciones');
  expect(
    (await entorno.pool.query('SELECT usuario_id FROM donantes WHERE id=$1', [fixtures.donantes[0].id]))
      .rows[0].usuario_id,
  ).toBeNull();
  await a
    .post('/api/donantes/vinculaciones')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf: t, correo: 'ajeno@example.test' })
    .expect(400);
});
it('el webhook recibe Buffer sin cookie ni CSRF y rechaza firma inválida', async () => {
  await request(app).post('/api/pasarela/webhook').send({ id: 'evento' }).expect(400);
  const r = await request(app)
    .post('/api/pasarela/webhook')
    .set('stripe-signature', 'sintetica')
    .send({
      id: 'evt_ajeno',
      type: 'evento.ajeno',
      api_version: '2025-02-24.acacia',
      created: 1800000000,
      livemode: false,
      data: { object: { id: 'obj_ajeno' } },
    })
    .expect(200);
  expect(r.headers['set-cookie']).toBeUndefined();
});
it('el vínculo se solicita y confirma por POST; otra cuenta, repetición y GET no consumen', async () => {
  const a = request.agent(app),
    b = request.agent(app),
    u = fixtures.usuarios[0],
    otro = fixtures.usuarios[1];
  const tokenCsrf = await contexto(a, u),
    tokenOtro = await contexto(b, otro);
  await a
    .get('/api/aportaciones/referencia/' + fixtures.aportaciones[0].referencia)
    .set('x-cuenta-prueba', u.id)
    .expect(404);
  await a
    .post('/api/donantes/vinculaciones')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf })
    .expect(202);
  const token = enviar.mock.calls.at(-1)[0].texto.match(/#token=([A-Za-z0-9_-]+)/)[1];
  await a.get('/api/donantes/vinculaciones/confirmar').set('x-cuenta-prueba', u.id).expect(404);
  await b
    .post('/api/donantes/vinculaciones/confirmar')
    .set('x-cuenta-prueba', otro.id)
    .set('origin', origen)
    .send({ tokenCsrf: tokenOtro, token })
    .expect(400);
  await a
    .post('/api/donantes/vinculaciones/confirmar')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf, token })
    .expect(200);
  await a
    .post('/api/donantes/vinculaciones/confirmar')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf, token })
    .expect(400);
  const propio = '/api/aportaciones/referencia/' + fixtures.aportaciones[0].referencia;
  await a.get(propio).set('x-cuenta-prueba', u.id).expect(200);
  await b.get(propio).set('x-cuenta-prueba', otro.id).expect(404);
});
it('aviso 202 idéntico sin elegibilidad y ante fallo SMTP; cuenta sin rol recibe 403', async () => {
  const a = request.agent(app),
    u = fixtures.usuarios[0],
    tokenCsrf = await contexto(a, u);
  const r = await a
    .post('/api/donantes/vinculaciones')
    .set('x-cuenta-prueba', u.id)
    .set('origin', origen)
    .send({ tokenCsrf })
    .expect(202);
  expect(r.body.mensaje).toBe(
    'Si hay aportaciones que puedan vincularse al correo de tu cuenta, recibirás un enlace de verificación.',
  );
  const anteriores = u.roles;
  u.roles = ['voluntario'];
  try {
    await a
      .post('/api/donantes/vinculaciones')
      .set('x-cuenta-prueba', u.id)
      .set('origin', origen)
      .send({ tokenCsrf })
      .expect(403);
  } finally {
    u.roles = anteriores;
  }
});
it('propaga 503 sin descartar la operación, permite recuperar y bloquea una incertidumbre vencida', async () => {
  const a = request.agent(app),
    tokenCsrf = await contexto(a),
    datos = dto();
  pasarela.crearSesionPago.mockRejectedValueOnce(new Error('Timeout sintético'));
  await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ ...datos, tokenCsrf })
    .expect(503);
  const op = (
    await entorno.pool.query('SELECT * FROM operaciones_pago WHERE solicitud_id=$1', [datos.claveSolicitud])
  ).rows[0];
  const recuperada = await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ claveSolicitud: datos.claveSolicitud, tokenCsrf })
    .expect(200);
  expect(recuperada.body.urlPago).toBeTruthy();
  await entorno.pool.query(
    "UPDATE operaciones_pago SET sesion_checkout_id=NULL,url_checkout=NULL,estado='incierta',creado_en=clock_timestamp()-interval '23 hours' WHERE id=$1",
    [op.id],
  );
  const r = await a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ claveSolicitud: datos.claveSolicitud, tokenCsrf })
    .expect(409);
  expect(r.body.error.codigo).toBe('OPERACION_REQUIERE_REVISION');
});
it('una creación activa devuelve 409 sin segunda llamada y una reserva de correo devuelve 409', async () => {
  const a = request.agent(app),
    tokenCsrf = await contexto(a),
    datos = dto();
  let liberar, avisar;
  const llegada = new Promise((r) => {
    avisar = r;
  });
  pasarela.crearSesionPago.mockImplementationOnce(() => {
    avisar();
    return new Promise((r) => {
      liberar = r;
    });
  });
  const primera = a
    .post('/api/aportaciones')
    .set('origin', origen)
    .send({ ...datos, tokenCsrf })
    .then((r) => r);
  await llegada;
  try {
    const r = await a
      .post('/api/aportaciones')
      .set('origin', origen)
      .send({ claveSolicitud: datos.claveSolicitud, tokenCsrf })
      .expect(409);
    expect(r.body.error.codigo).toBe('OPERACION_EN_CURSO');
  } finally {
    liberar({ id: 'cs_' + randomUUID(), url: 'https://checkout.stripe.test/sesion' });
  }
  const r = await primera;
  expect(r.status).toBe(201);
  const aporte = (
    await entorno.pool.query('SELECT * FROM aportaciones WHERE referencia=$1', [r.body.referencia])
  ).rows[0];
  await entorno.pool.query(
    "UPDATE aportaciones SET estado='confirmada',fecha_cobro=clock_timestamp() WHERE id=$1",
    [aporte.id],
  );
  await servicio.repo.crearCorreo(entorno.pool, aporte.id, { referencia: aporte.referencia });
  await servicio.repo.reclamarCorreo(aporte.id);
  const reservado = await a
    .post('/api/aportaciones/referencia/' + aporte.referencia + '/correo')
    .set('origin', origen)
    .send({ tokenCsrf })
    .expect(409);
  expect(reservado.body.error.codigo).toBe('CORREO_EN_ENVIO');
});
it('un fallo de infraestructura al solicitar el vínculo devuelve solo el error común', async () => {
  const a = request.agent(app),
    u = fixtures.usuarios[0],
    tokenCsrf = await contexto(a, u);
  const fallo = vi
    .spyOn(servicio.repo, 'emitirVerificacion')
    .mockRejectedValueOnce(new Error('Fallo SQL sintético interno'));
  const registro = vi.spyOn(console, 'error').mockImplementation(() => {});
  const n = enviar.mock.calls.length;
  try {
    const r = await a
      .post('/api/donantes/vinculaciones')
      .set('x-cuenta-prueba', u.id)
      .set('origin', origen)
      .send({ tokenCsrf })
      .expect(500);
    expect(r.body.error.codigo).toBe('ERROR_INTERNO');
    expect(JSON.stringify(r.body)).not.toContain('SQL');
    expect(enviar).toHaveBeenCalledTimes(n);
  } finally {
    fallo.mockRestore();
    registro.mockRestore();
  }
});
