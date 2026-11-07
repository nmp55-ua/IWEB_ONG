import { beforeAll, afterAll, it, expect, vi } from 'vitest';
import request from 'supertest';
import session from 'express-session';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { crearEntornoPruebas, contrasenaPruebas } from './pruebas/soporte.js';
const db = vi.hoisted(() => ({ pool: null }));
vi.mock('../../db/pool.js', () => ({
  pool: { query: (...args) => db.pool.query(...args), connect: () => db.pool.connect() },
  consulta: (...args) => db.pool.query(...args),
}));
vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));
vi.mock('../../servicios-comunes/pasarela.js', async (importar) => {
  const original = await importar();
  return {
    ...original,
    crearSesionPago: vi.fn(async () => ({
      id: 'cs_' + randomUUID(),
      url: 'https://checkout.stripe.test/prueba',
    })),
    obtenerPago: vi.fn(),
    verificarEvento: vi.fn((cuerpo, firma) => {
      if (firma !== 'valida-sintetica')
        throw new Error('No debe invocarse con firma inválida en esta prueba');
      if (!Buffer.isBuffer(cuerpo)) throw new Error('Se perdió el cuerpo crudo');
      return JSON.parse(cuerpo.toString());
    }),
  };
});
import { crearApp } from '../../app.js';
import * as pasarela from '../../servicios-comunes/pasarela.js';
let entorno, fixtures, app, almacen;
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await entorno.crearFixtures();
  db.pool = entorno.pool;
  almacen = new session.MemoryStore();
  app = crearApp({ almacenSesiones: almacen });
});
afterAll(async () => {
  await entorno?.cerrar();
});
it('registra donaciones en la aplicación real y conserva auth, proyectos y permisos de actividades', async () => {
  const a = request.agent(app);
  await a.get('/api/auth/yo').expect(401);
  await a.get('/api/actividades').expect(401);
  expect((await a.get('/api/proyectos').expect(200)).body.datos).toHaveLength(1);
  await a
    .post('/api/auth/sesion')
    .send({ correo: fixtures.usuarios[0].correo, contrasena: contrasenaPruebas })
    .expect(200);
  expect((await a.get('/api/auth/yo').expect(200)).body.id).toBe(fixtures.usuarios[0].id);
  await a.get('/api/actividades').expect(403);
  const c = await a.get('/api/donaciones/contexto').expect(200);
  expect(c.body.usuario.id).toBe(fixtures.usuarios[0].id);
  const r = await a
    .post('/api/aportaciones')
    .set('origin', 'http://localhost:4321')
    .send({
      tokenCsrf: c.body.tokenCsrf,
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
    })
    .expect(201);
  const aporte = (
    await entorno.pool.query('SELECT * FROM aportaciones WHERE referencia=$1', [r.body.referencia])
  ).rows[0];
  pasarela.obtenerPago.mockResolvedValue({
    id: 'pi_sintetico_registro',
    amount: 2000,
    amount_received: 2000,
    currency: 'eur',
    status: 'succeeded',
    invoice: null,
    metadata: { modulo: 'donaciones', referencia: aporte.referencia },
    livemode: false,
  });
  // Un navegador cerrado y un almacén no disponible no impiden procesar el webhook.
  const lectura = vi.spyOn(almacen, 'get').mockImplementation(() => {
    throw new Error('No debe consultar sesiones');
  });
  try {
    await a
      .post('/api/pasarela/webhook')
      .set('stripe-signature', 'valida-sintetica')
      .send({
        id: 'evt_registro',
        type: 'payment_intent.succeeded',
        created: 1800000000,
        api_version: '2025-02-24.acacia',
        livemode: false,
        data: { object: { id: 'pi_sintetico_registro' } },
      })
      .expect(200);
    expect(lectura).not.toHaveBeenCalled();
  } finally {
    lectura.mockRestore();
  }
  expect((await a.get('/api/aportaciones/referencia/' + aporte.referencia).expect(200)).body.estado).toBe(
    'confirmada',
  );
  await request(app)
    .get('/api/aportaciones/referencia/' + aporte.referencia)
    .expect(404);
});

it('integra las rutas públicas y los permisos de calendario sin ocultar las rutas de actividades', async () => {
  const publico = request.agent(app);
  const disponibles = await publico.get('/api/actividades/disponibles').expect(200);
  expect(disponibles.body.datos).toEqual([]);
  await publico.get('/api/yo/calendario').expect(401);
  await publico.get('/api/actividades').expect(401);
  await publico.get('/api/donaciones/contexto').expect(200);

  const donante = request.agent(app);
  await donante
    .post('/api/auth/sesion')
    .send({ correo: fixtures.usuarios[0].correo, contrasena: contrasenaPruebas })
    .expect(200);
  await donante.get('/api/yo/calendario').expect(403);

  const cuenta = fixtures.usuarios[1];
  await entorno.pool.query("UPDATE usuarios SET roles=ARRAY['voluntario','donante'] WHERE id=$1", [
    cuenta.id,
  ]);
  const voluntario = request.agent(app);
  await voluntario
    .post('/api/auth/sesion')
    .send({ correo: cuenta.correo, contrasena: contrasenaPruebas })
    .expect(200);
  expect((await voluntario.get('/api/yo/calendario').expect(200)).body.datos).toEqual([]);
  expect((await voluntario.get('/api/donaciones/contexto').expect(200)).body.usuario.id).toBe(cuenta.id);
  await voluntario.get('/api/actividades').expect(403);
});

it('ejecuta dos veces el registro conjunto de semillas en un esquema exclusivo sin duplicar datos', async () => {
  const semillas = await crearEntornoPruebas();
  const ejecutar = promisify(execFile);
  const cwd = fileURLToPath(new URL('../../../', import.meta.url));
  const tablas = [
    'usuarios',
    'proyectos',
    'actividades',
    'donantes',
    'aportaciones',
    'suscripciones_socio',
    'correos_aportacion',
    'voluntarios',
    'inscripciones',
  ];
  const contar = async () => {
    const resultado = {};
    for (const tabla of tablas)
      resultado[tabla] = (await semillas.pool.query(`SELECT count(*) FROM ${tabla}`)).rows[0].count;
    return resultado;
  };
  const sembrar = () =>
    ejecutar(process.execPath, ['src/db/semillas/index.js'], {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: semillas.urlConexion,
        TEST_DATABASE_URL: semillas.urlConexion,
        CONTRASENA_SEMILLAS: contrasenaPruebas,
      },
      timeout: 30000,
      windowsHide: true,
    });
  try {
    const primera = await sembrar();
    expect(primera.stderr).toBe('');
    const antes = await contar();
    for (const tabla of tablas) expect(Number(antes[tabla])).toBeGreaterThan(0);
    const aportaciones = (await semillas.pool.query('SELECT * FROM aportaciones ORDER BY id')).rows;
    const segunda = await sembrar();
    expect(segunda.stderr).toBe('');
    expect(await contar()).toEqual(antes);
    expect((await semillas.pool.query('SELECT * FROM aportaciones ORDER BY id')).rows).toEqual(aportaciones);
  } finally {
    await semillas.cerrar();
  }
});
