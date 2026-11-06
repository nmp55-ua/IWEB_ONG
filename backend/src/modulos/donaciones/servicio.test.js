import { beforeAll, afterAll, it, expect, vi } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import { crearEntornoPruebas, crearSimuladorStripe } from './pruebas/soporte.js';
import { crearServicio } from './servicio.js';
import { claveBloqueo } from './repositorio.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { crearRepositorio } from './repositorio.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
let entorno, servicio, pasarela, enviar, carpeta, fixtures;
const donante = {
  nombre: 'Ana',
  apellidos: 'Pérez López',
  nifNie: '11111111H',
  correo: 'ana@example.test',
  direccion: 'Calle Mayor 1',
};
const solicitud = (datos = {}) => ({
  claveSolicitud: randomUUID(),
  modalidad: 'puntual',
  importe: '20.00',
  proyectoId: null,
  donante: { ...donante },
  ...datos,
});
const req = () => ({
  session: {
    save(cb) {
      cb();
    },
  },
});
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await entorno.crearFixtures();
  carpeta = await mkdtemp(join(tmpdir(), 'hu01-checkout-'));
  const simulador = crearSimuladorStripe(carpeta);
  pasarela = {
    prepararSesionPago: vi.fn((x) => ({
      client_reference_id: x.referencia,
      metadata: { referencia: x.referencia, modulo: 'donaciones' },
      line_items: [{ price_data: { unit_amount: x.centimos } }],
    })),
    crearSesionPago: vi.fn((x) =>
      simulador.crearSesion(x.solicitudCheckout, { idempotencyKey: x.claveIdempotencia }),
    ),
    obtenerSesionPago: vi.fn(async (id) => ({
      id,
      status: 'open',
      url: 'https://checkout.stripe.test/recuperada',
    })),
  };
  enviar = vi.fn(async () => true);
  servicio = crearServicio({ pool: entorno.pool, pasarela, enviarCorreo: enviar });
});
afterAll(async () => {
  await entorno?.cerrar();
  if (carpeta) await rm(carpeta, { recursive: true, force: true });
});
it('reutiliza formatos equivalentes sin sobrescribir y rechaza cambios reales antes de Stripe', async () => {
  const a = await servicio.crear(req(), solicitud());
  expect(a.nueva).toBe(true);
  const antes = (await entorno.pool.query('SELECT * FROM donantes WHERE nif_nie=$1', [donante.nifNie]))
    .rows[0];
  await servicio.crear(req(), solicitud({ donante: { ...donante, nombre: ' ANA ', nifNie: '11111111-h' } }));
  expect((await entorno.pool.query('SELECT * FROM donantes WHERE id=$1', [antes.id])).rows[0]).toEqual(antes);
  const llamadas = pasarela.crearSesionPago.mock.calls.length;
  for (const cambio of [{ nombre: 'Otra' }, { correo: 'otro@example.test' }, { nifNie: '22222222J' }]) {
    await expect(
      servicio.crear(req(), solicitud({ donante: { ...donante, ...cambio } })),
    ).rejects.toMatchObject({ codigo: 'DATOS_DONANTE_INCOMPATIBLES' });
  }
  expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(llamadas);
});
it('serializa la identidad y conserva un único Donante en altas simultáneas', async () => {
  const datos = { ...donante, nifNie: '33333333P', correo: 'carrera@example.test' };
  await Promise.all([
    servicio.crear(req(), solicitud({ donante: datos })),
    servicio.crear(req(), solicitud({ donante: datos })),
  ]);
  expect(
    (await entorno.pool.query('SELECT count(*) FROM donantes WHERE nif_nie=$1', [datos.nifNie])).rows[0]
      .count,
  ).toBe('1');
});
it('repite UUID canónico con permiso y no reconstruye la instantánea; UUID ajeno no autoriza', async () => {
  const r = req(),
    dto = solicitud();
  const primero = await servicio.crear(r, dto);
  const preparaciones = pasarela.prepararSesionPago.mock.calls.length;
  const segundo = await servicio.crear(r, { claveSolicitud: dto.claveSolicitud.toUpperCase() });
  expect(segundo.referencia).toBe(primero.referencia);
  expect(segundo.nueva).toBe(false);
  expect(pasarela.prepararSesionPago).toHaveBeenCalledTimes(preparaciones);
  await expect(servicio.crear(req(), { claveSolicitud: dto.claveSolicitud })).rejects.toMatchObject({
    estado: 404,
  });
  await expect(servicio.crear(r, { ...dto, importe: '21.00' })).rejects.toMatchObject({
    codigo: 'SOLICITUD_INCOMPATIBLE',
  });
});
it('timeout y reinicio conservan solicitud/cuerpo/clave; el límite fijo impide otro POST', async () => {
  const r = req(),
    dto = solicitud();
  pasarela.crearSesionPago.mockRejectedValueOnce(new Error('timeout'));
  await expect(servicio.crear(r, dto)).rejects.toMatchObject({ estado: 503 });
  const inicial = (
    await entorno.pool.query('SELECT * FROM operaciones_pago WHERE solicitud_id=$1', [dto.claveSolicitud])
  ).rows[0];
  const reiniciado = crearServicio({ pool: entorno.pool, pasarela, enviarCorreo: enviar });
  await reiniciado.crear(r, { claveSolicitud: dto.claveSolicitud });
  const ultimo = pasarela.crearSesionPago.mock.calls.at(-1)[0];
  expect(ultimo.solicitudCheckout).toEqual(inicial.solicitud_checkout);
  expect(ultimo.claveIdempotencia).toBe('hu01:' + dto.claveSolicitud);
  const r2 = req(),
    d2 = solicitud();
  pasarela.crearSesionPago.mockRejectedValueOnce(new Error('timeout'));
  await expect(servicio.crear(r2, d2)).rejects.toMatchObject({ estado: 503 });
  await entorno.pool.query(
    "UPDATE operaciones_pago SET creado_en=clock_timestamp()-interval '23 hours' WHERE solicitud_id=$1",
    [d2.claveSolicitud],
  );
  const n = pasarela.crearSesionPago.mock.calls.length;
  await expect(servicio.crear(r2, { claveSolicitud: d2.claveSolicitud })).rejects.toMatchObject({
    codigo: 'OPERACION_REQUIERE_REVISION',
  });
  expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(n);
});
it('el lock acredita actividad, se libera en error y guardar sesión precede a Stripe', async () => {
  const r = req(),
    dto = solicitud();
  pasarela.crearSesionPago.mockRejectedValueOnce(new Error('timeout'));
  await expect(servicio.crear(r, dto)).rejects.toMatchObject({ estado: 503 });
  const c = await entorno.conectar(),
    clave = claveBloqueo('hu01:checkout:' + dto.claveSolicitud);
  await c.query('SELECT pg_advisory_lock($1)', [clave]);
  try {
    await expect(servicio.crear(r, { claveSolicitud: dto.claveSolicitud })).rejects.toMatchObject({
      codigo: 'OPERACION_EN_CURSO',
    });
  } finally {
    await c.query('SELECT pg_advisory_unlock($1)', [clave]);
    c.release();
  }
  const n = pasarela.crearSesionPago.mock.calls.length;
  await expect(
    servicio.crear(
      {
        session: {
          save(cb) {
            cb(new Error('fallo'));
          },
        },
      },
      solicitud(),
    ),
  ).rejects.toMatchObject({ codigo: 'SESION_NO_DISPONIBLE' });
  expect(pasarela.crearSesionPago).toHaveBeenCalledTimes(n);
});
it('no revalida el proyecto de una operación existente y no acepta destinos inactivos nuevos', async () => {
  const r = req(),
    dto = solicitud({ proyectoId: fixtures.proyecto.id });
  await servicio.crear(r, dto);
  await entorno.pool.query('UPDATE proyectos SET activo=false WHERE id=$1', [fixtures.proyecto.id]);
  await servicio.crear(r, { claveSolicitud: dto.claveSolicitud });
  await expect(servicio.crear(req(), solicitud({ proyectoId: fixtures.proyecto.id }))).rejects.toMatchObject({
    codigo: 'PROYECTO_NO_DISPONIBLE',
  });
});
it('vincula solo con hash, cuenta solicitante, caducidad y consumo único atómico', async () => {
  const u = fixtures.usuarios[0],
    otro = fixtures.usuarios[1];
  await entorno.pool.query('UPDATE donantes SET usuario_id=NULL WHERE id=$1', [fixtures.donantes[0].id]);
  await servicio.solicitarVinculo({ usuario: u });
  const mensaje = enviar.mock.calls.at(-1)[0];
  expect(mensaje.para).toBe(u.correo);
  const token = mensaje.texto.match(/#token=([A-Za-z0-9_-]+)/)[1];
  expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  const v = (await entorno.pool.query('SELECT * FROM verificaciones_donante ORDER BY id DESC LIMIT 1'))
    .rows[0];
  expect(v.token_hash).not.toBe(token);
  expect(v.token_hash).toHaveLength(64);
  expect(v.expira_en.getTime() - Date.now()).toBeGreaterThan(1790000);
  await expect(servicio.confirmarVinculo({ usuario: otro }, token)).rejects.toMatchObject({
    codigo: 'ENLACE_NO_VALIDO',
  });
  const resultados = await Promise.allSettled([
    servicio.confirmarVinculo({ usuario: u }, token),
    servicio.confirmarVinculo({ usuario: u }, token),
  ]);
  expect(resultados.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
  expect(
    (await entorno.pool.query('SELECT usuario_id FROM donantes WHERE id=$1', [v.donante_id])).rows[0]
      .usuario_id,
  ).toBe(u.id);
  await expect(servicio.confirmarVinculo({ usuario: u }, token)).rejects.toMatchObject({
    codigo: 'ENLACE_NO_VALIDO',
  });
});
it('solicitar otro enlace invalida el anterior y un enlace vencido no vincula', async () => {
  const u = fixtures.usuarios[0];
  await entorno.pool.query('UPDATE donantes SET usuario_id=NULL WHERE id=$1', [fixtures.donantes[0].id]);
  await servicio.solicitarVinculo({ usuario: u });
  const viejo = enviar.mock.calls.at(-1)[0].texto.match(/#token=([A-Za-z0-9_-]+)/)[1];
  await servicio.solicitarVinculo({ usuario: u });
  const nuevo = enviar.mock.calls.at(-1)[0].texto.match(/#token=([A-Za-z0-9_-]+)/)[1];
  await expect(servicio.confirmarVinculo({ usuario: u }, viejo)).rejects.toMatchObject({
    codigo: 'ENLACE_NO_VALIDO',
  });
  await entorno.pool.query(
    'UPDATE verificaciones_donante SET expira_en=clock_timestamp() WHERE usuario_id=$1',
    [u.id],
  );
  await expect(servicio.confirmarVinculo({ usuario: u }, nuevo)).rejects.toMatchObject({
    codigo: 'ENLACE_NO_VALIDO',
  });
});
it('destruye la conexión si falla el desbloqueo y no devuelve un lock al pool', async () => {
  const cliente = new EventEmitter();
  cliente.release = vi.fn();
  cliente.query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [{ obtenido: true }] })
    .mockRejectedValueOnce(new Error('desbloqueo imposible'));
  const repositorio = crearRepositorio({ connect: async () => cliente });
  expect(await repositorio.conExclusion('prueba', async () => 42)).toBe(42);
  expect(cliente.release).toHaveBeenCalledWith(true);
});
it('la pérdida de conexión durante HTTP conserva la incertidumbre y no escribe con otra conexión', async () => {
  const r = req(),
    dto = solicitud();
  const crearOriginal = pasarela.crearSesionPago.getMockImplementation();
  let pidPropio;
  const exclusionOriginal = servicio.repo.conExclusion.bind(servicio.repo);
  vi.spyOn(servicio.repo, 'conExclusion').mockImplementationOnce((clave, trabajo) =>
    exclusionOriginal(clave, async (c, viva) => {
      pidPropio = c.processID;
      return trabajo(c, viva);
    }),
  );
  pasarela.crearSesionPago.mockImplementationOnce(async (x) => {
    // Solo se termina un cliente adquirido por esta prueba, nunca una búsqueda global de procesos.
    await entorno.pool.query('SELECT pg_terminate_backend($1)', [pidPropio]);
    await new Promise((resolve) => setTimeout(resolve, 30));
    return crearOriginal(x);
  });
  await expect(servicio.crear(r, dto)).rejects.toMatchObject({ estado: 503 });
  const op = (
    await entorno.pool.query('SELECT * FROM operaciones_pago WHERE solicitud_id=$1', [dto.claveSolicitud])
  ).rows[0];
  expect(op.estado).toBe('incierta');
  expect(op.sesion_checkout_id).toBeNull();
  await servicio.crear(r, { claveSolicitud: dto.claveSolicitud });
});
it('no renueva ocho horas de invitado ni reabre una aportación confirmada', async () => {
  const r = req(),
    dto = solicitud(),
    a = await servicio.crear(r, dto);
  const permiso = { ...r.session.donaciones.permisos[a.referencia] };
  await servicio.crear(r, { claveSolicitud: dto.claveSolicitud });
  expect(r.session.donaciones.permisos[a.referencia]).toEqual(permiso);
  await entorno.pool.query(
    "UPDATE aportaciones SET estado='confirmada',fecha_cobro=clock_timestamp() WHERE referencia=$1",
    [a.referencia],
  );
  expect((await servicio.crear(r, { claveSolicitud: dto.claveSolicitud })).urlPago).toBeNull();
  const reloj = vi.spyOn(Date, 'now').mockReturnValue(permiso.venceEn);
  try {
    await expect(servicio.crear(r, { claveSolicitud: dto.claveSolicitud })).rejects.toMatchObject({
      estado: 404,
    });
  } finally {
    reloj.mockRestore();
  }
});
it('reanuda desde otro proceso con sesión, instantánea y simulador persistentes', async () => {
  const r = req(),
    dto = solicitud();
  const original = pasarela.crearSesionPago.getMockImplementation();
  pasarela.crearSesionPago.mockImplementationOnce(async (x) => {
    await original(x);
    throw new Error('Respuesta perdida tras aceptar la solicitud');
  });
  await expect(servicio.crear(r, dto)).rejects.toMatchObject({ estado: 503 });
  const op = (
    await entorno.pool.query(
      'SELECT o.*,a.referencia FROM operaciones_pago o JOIN aportaciones a ON a.id=o.aportacion_id WHERE solicitud_id=$1',
      [dto.claveSolicitud],
    )
  ).rows[0];
  const codigo = `
 import pg from 'pg';
 import {crearServicio} from './src/modulos/donaciones/servicio.js';
 import {crearSimuladorStripe,verificarEsquemaPruebas} from './src/modulos/donaciones/pruebas/soporte.js';
 const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});
 try {
  await verificarEsquemaPruebas(pool,process.env.HU01_ESQUEMA);
  const simulador=crearSimuladorStripe(process.env.HU01_DIRECTORIO);
  const pasarela={prepararSesionPago(){throw new Error('No debe reconstruirse');},crearSesionPago:x=>simulador.crearSesion(x.solicitudCheckout,{idempotencyKey:x.claveIdempotencia})};
  const servicio=crearServicio({pool,pasarela,enviarCorreo:async()=>{throw new Error('No debe enviar');}});
  const session={...JSON.parse(process.env.HU01_SESION),save:cb=>cb()};
  const r=await servicio.crear({session},{claveSolicitud:process.env.HU01_CLAVE});
  process.stdout.write(JSON.stringify(r));
 }finally{await pool.end();}`;
  const salida = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', codigo], {
    env: {
      ...process.env,
      DATABASE_URL: entorno.urlConexion,
      TEST_DATABASE_URL: entorno.urlConexion,
      HU01_ESQUEMA: entorno.esquema,
      HU01_DIRECTORIO: carpeta,
      HU01_SESION: JSON.stringify(r.session),
      HU01_CLAVE: dto.claveSolicitud,
    },
    windowsHide: true,
    timeout: 15000,
  });
  const recuperada = JSON.parse(salida.stdout);
  expect(recuperada.referencia).toBe(op.referencia);
  const esperado = await crearSimuladorStripe(carpeta).crearSesion(op.solicitud_checkout, {
    idempotencyKey: 'hu01:' + dto.claveSolicitud,
  });
  expect(recuperada.urlPago).toBe(esperado.url);
  expect(
    (
      await entorno.pool.query('SELECT solicitud_checkout FROM operaciones_pago WHERE solicitud_id=$1', [
        dto.claveSolicitud,
      ])
    ).rows[0].solicitud_checkout,
  ).toEqual(op.solicitud_checkout);
});
it('el resultado no ofrece una URL de Checkout que ya no está abierto', async () => {
  const r = req(),
    a = await servicio.crear(r, solicitud());
  pasarela.obtenerSesionPago.mockResolvedValueOnce({ id: 'cs_cerrado', status: 'complete', url: null });
  expect((await servicio.resultado(r, a.referencia)).urlPago).toBeNull();
});
it('una respuesta tardía al recuperar Session no oculta una confirmación concurrente', async () => {
  const r = req(),
    dto = solicitud(),
    a = await servicio.crear(r, dto);
  pasarela.obtenerSesionPago.mockImplementationOnce(async (id) => {
    await entorno.pool.query(
      "UPDATE aportaciones SET estado='confirmada',fecha_cobro=clock_timestamp() WHERE referencia=$1",
      [a.referencia],
    );
    await entorno.pool.query("UPDATE operaciones_pago SET estado='cerrada' WHERE solicitud_id=$1", [
      dto.claveSolicitud,
    ]);
    return { id, status: 'open', url: 'https://checkout.stripe.test/antigua' };
  });
  const resultado = await servicio.crear(r, { claveSolicitud: dto.claveSolicitud });
  expect(resultado.estado).toBe('confirmada');
  expect(resultado.urlPago).toBeNull();
});
it('guarda sesión antes del tramo exclusivo y funciona con una única conexión disponible', async () => {
  const pool = new pg.Pool({ connectionString: entorno.urlConexion, max: 1, connectionTimeoutMillis: 1000 });
  const local = crearServicio({ pool, pasarela, enviarCorreo: enviar });
  let cliente;
  const original = local.repo.conExclusion.bind(local.repo);
  vi.spyOn(local.repo, 'conExclusion').mockImplementation((clave, trabajo) =>
    original(clave, async (c, viva) => {
      cliente = c;
      return trabajo(c, viva);
    }),
  );
  const crearOriginal = pasarela.crearSesionPago.getMockImplementation();
  pasarela.crearSesionPago.mockImplementationOnce(async (x) => {
    expect((await cliente.query('SELECT txid_current_if_assigned() AS id')).rows[0].id).toBeNull();
    return crearOriginal(x);
  });
  const r = {
    session: {
      save(cb) {
        pool.query('SELECT 1').then(() => cb(), cb);
      },
    },
  };
  try {
    expect((await local.crear(r, solicitud())).urlPago).toBeTruthy();
  } finally {
    await pool.end();
  }
});
it('la preparación ocupada no crea filas y dos identidades incompatibles no comparten correo', async () => {
  const d = solicitud(),
    c = await entorno.conectar();
  await c.query('BEGIN');
  await c.query('SELECT pg_advisory_xact_lock($1)', [claveBloqueo('hu01:checkout:' + d.claveSolicitud)]);
  try {
    await expect(servicio.crear(req(), d)).rejects.toMatchObject({ codigo: 'OPERACION_EN_CURSO' });
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
  expect(
    (
      await entorno.pool.query('SELECT count(*) FROM operaciones_pago WHERE solicitud_id=$1', [
        d.claveSolicitud,
      ])
    ).rows[0].count,
  ).toBe('0');
  const correo = 'identidad-carrera@example.test';
  const resultados = await Promise.allSettled([
    servicio.crear(req(), solicitud({ donante: { ...donante, nifNie: '44444444A', correo } })),
    servicio.crear(req(), solicitud({ donante: { ...donante, nifNie: '55555555K', correo } })),
  ]);
  expect(resultados.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
  expect(resultados.find((x) => x.status === 'rejected').reason.codigo).toBe('DATOS_DONANTE_INCOMPATIBLES');
  expect(
    (await entorno.pool.query('SELECT count(*) FROM donantes WHERE correo=$1', [correo])).rows[0].count,
  ).toBe('1');
});
it('un vínculo incompatible no consume el token ni modifica el Donante solicitado', async () => {
  const u = fixtures.usuarios[0];
  await servicio.solicitarVinculo({ usuario: u });
  const token = enviar.mock.calls.at(-1)[0].texto.match(/#token=([A-Za-z0-9_-]+)/)[1];
  await entorno.pool.query('UPDATE donantes SET usuario_id=$1 WHERE id=$2', [u.id, fixtures.invitado.id]);
  try {
    await expect(servicio.confirmarVinculo({ usuario: u }, token)).rejects.toMatchObject({
      codigo: 'VINCULACION_NO_DISPONIBLE',
    });
    expect(
      (await entorno.pool.query('SELECT usuario_id FROM donantes WHERE id=$1', [fixtures.donantes[0].id]))
        .rows[0].usuario_id,
    ).toBeNull();
    expect(
      (
        await entorno.pool.query('SELECT usado_en FROM verificaciones_donante WHERE token_hash=$1', [
          createHash('sha256').update(token).digest('hex'),
        ])
      ).rows[0].usado_en,
    ).toBeNull();
  } finally {
    await entorno.pool.query('UPDATE donantes SET usuario_id=NULL WHERE id=$1', [fixtures.invitado.id]);
  }
});
