import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { crearEntornoPruebas, verificarEsquemaPruebas } from './pruebas/soporte.js';
import { contrasenaPruebas } from './pruebas/soporte.js';
import { crearFixturesHistorial, insertarAportacionHistorial } from './pruebas/historial-local.js';
import request from 'supertest';
import session from 'express-session';

const db = vi.hoisted(() => ({ pool: null }));
vi.mock('../../db/pool.js', () => ({
  pool: { query: (...args) => db.pool.query(...args), connect: () => db.pool.connect() },
  consulta: (...args) => db.pool.query(...args),
}));
vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));
vi.mock('../../servicios-comunes/pasarela.js', async (importar) => {
  const original = await importar();
  return Object.fromEntries(
    Object.entries(original).map(([clave, valor]) => [
      clave,
      typeof valor === 'function'
        ? vi.fn(() => {
            throw new Error('La consulta no puede llamar a Stripe.');
          })
        : valor,
    ]),
  );
});
import { crearApp } from '../../app.js';
import { crearServicio } from './servicio.js';
import { enviarCorreo } from '../../servicios-comunes/correo.js';
import * as pasarela from '../../servicios-comunes/pasarela.js';
import { autorizarAportacion } from './autorizacion.js';
import { enTransaccion } from './repositorio.js';
import { crearServicio as crearServicioCertificados } from '../certificados-informes/servicio.js';
import * as repositorioCertificados from '../certificados-informes/repositorio.js';

let entorno, fixtures, app, almacen;
beforeAll(async () => {
  entorno = await crearEntornoPruebas();
  fixtures = await crearFixturesHistorial(entorno);
  db.pool = entorno.pool;
  almacen = new session.MemoryStore();
  app = crearApp({ almacenSesiones: almacen });
}, 30000);
afterAll(async () => {
  if (almacen)
    await new Promise((resolver, rechazar) =>
      almacen.clear((error) => (error ? rechazar(error) : resolver())),
    );
  await entorno?.cerrar();
}, 30000);

const ruta = '/api/yo/aportaciones';
async function agente(nombre = 'principal') {
  const a = request.agent(app);
  await a
    .post('/api/auth/sesion')
    .send({ correo: fixtures.cuentas[nombre].usuario.correo, contrasena: contrasenaPruebas })
    .expect(200);
  return a;
}
async function leer(nombre = 'principal', query = '') {
  return (await (await agente(nombre)).get(ruta + query).expect(200)).body;
}
const filas = (dto) => dto.datos.flatMap((grupo) => grupo.aportaciones);
const centimos = (texto) => BigInt(texto.replace('.', ''));
const servicio = (pool) => crearServicio({ pool, pasarela, enviarCorreo });
const req = (nombre) => ({ usuario: fixtures.cuentas[nombre].usuario });
const permisoOperacion = () => {
  const creadoEn = Date.now();
  const estado = {
    permisos: { [fixtures.principal[0].referencia]: { creadoEn, venceEn: creadoEn + 8 * 3600000 } },
  };
  expect(
    autorizarAportacion(
      { session: { donaciones: estado } },
      fixtures.principal[0].referencia,
      fixtures.principal[0],
    ),
  ).toBe(true);
  return estado;
};

function observarPool({ despuesResumen, fallo } = {}) {
  const consultas = [],
    estados = [],
    liberaciones = [];
  return {
    consultas,
    estados,
    liberaciones,
    async connect() {
      const c = await entorno.pool.connect();
      return {
        async query(sql, args) {
          consultas.push(sql);
          if (fallo && /GROUP BY/.test(sql)) throw fallo;
          const resultado = await c.query(sql, args);
          if (/SET TRANSACTION/.test(sql)) {
            estados.push(
              (
                await c.query(
                  "SELECT current_setting('transaction_isolation') AS aislamiento,current_setting('transaction_read_only') AS solo_lectura",
                )
              ).rows[0],
            );
          }
          if (despuesResumen && /GROUP BY/.test(sql)) await despuesResumen();
          return resultado;
        },
        release() {
          liberaciones.push(true);
          c.release();
        },
      };
    },
  };
}

describe('Preparacion HU-02', () => {
  it('verifica base/esquema exclusivo y todas las migraciones necesarias', async () => {
    await verificarEsquemaPruebas(entorno.pool, entorno.esquema);
    const { rows } = await entorno.pool.query(
      'SELECT current_database() AS base,current_schema() AS esquema,to_regclass($1)::text AS certificado',
      ['certificados_fiscales'],
    );
    expect(rows[0]).toEqual({
      base: 'ong_test_hu01',
      esquema: entorno.esquema,
      certificado: 'certificados_fiscales',
    });
  });
  it('dispone de 60 cuotas separadas, cinco sumas de 120.00 y total 600.00', async () => {
    const { rows } = await entorno.pool.query(
      `SELECT EXTRACT(YEAR FROM fecha_cobro AT TIME ZONE 'Europe/Madrid')::int AS anio,
         count(*)::int AS cantidad,sum(importe)::text AS total
       FROM aportaciones WHERE donante_id=$1 AND estado='confirmada' GROUP BY 1 ORDER BY 1`,
      [fixtures.cuentas.periodico.donante.id],
    );
    expect(rows).toEqual(
      [2021, 2022, 2023, 2024, 2025].map((anio) => ({ anio, cantidad: 12, total: '120.00' })),
    );
    expect(
      (
        await entorno.pool.query('SELECT sum(importe)::text AS total FROM aportaciones WHERE donante_id=$1', [
          fixtures.cuentas.periodico.donante.id,
        ])
      ).rows[0].total,
    ).toBe('600.00');
  });
  it('conserva BIGINT textuales, estados y cuota de socio cancelado con correo fallido', async () => {
    const { rows } = await entorno.pool.query(
      'SELECT id::text AS id FROM aportaciones WHERE donante_id=$1 ORDER BY id DESC',
      [fixtures.cuentas.empates.donante.id],
    );
    expect(rows.map((x) => x.id)).toEqual(['9007199254740993', '9007199254740992']);
    expect(fixtures.socioCancelado.estado).toBe('cancelada');
    const correo = (
      await entorno.pool.query('SELECT estado FROM correos_aportacion WHERE aportacion_id=$1', [
        fixtures.principal[1].id,
      ])
    ).rows[0];
    expect(correo.estado).toBe('fallido');
  });
  it('rechaza una conexion incorrecta antes de crear el esquema', async () => {
    const original = process.env.DATABASE_URL;
    vi.stubEnv('DATABASE_URL', 'postgresql://sintetico@127.0.0.1/no_permitida');
    try {
      await expect(crearEntornoPruebas()).rejects.toThrow('Selecciona DATABASE_URL');
    } finally {
      vi.stubEnv('DATABASE_URL', original);
    }
  });
  it('comprueba limpieza limitada al esquema propio', async () => {
    const otro = await crearEntornoPruebas();
    const nombre = otro.esquema;
    await otro.cerrar();
    expect(
      (await entorno.pool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [nombre]))
        .rows[0].n,
    ).toBe(0);
    await verificarEsquemaPruebas(entorno.pool, entorno.esquema);
  }, 30000);
});

describe('Autorizacion y contrato HU-02', () => {
  it('requiere sesion y conserva cabeceras privadas incluso en 401', async () => {
    const r = await request(app).get(ruta).expect(401);
    expect(r.body.error.codigo).toBe('NO_IDENTIFICADO');
    expect(r.headers['cache-control']).toBe('private, no-store');
    expect(r.headers.vary).toContain('Cookie');
  });
  it('deniega un rol distinto con error comun y cabeceras privadas', async () => {
    const r = await (await agente('voluntario')).get(ruta).expect(403);
    expect(r.body.error.codigo).toBe('SIN_PERMISO');
    expect(r.headers['cache-control']).toBe('private, no-store');
  });
  it('una cuenta que se desactiva pierde acceso aun conservando su sesion', async () => {
    const a = await agente('otra');
    const id = fixtures.cuentas.otra.usuario.id;
    await entorno.pool.query('UPDATE usuarios SET activo=false WHERE id=$1', [id]);
    try {
      await a.get(ruta).expect(401);
    } finally {
      await entorno.pool.query('UPDATE usuarios SET activo=true WHERE id=$1', [id]);
    }
  });
  it('dos cuentas obtienen solo sus aportaciones y no filtran por propietario del cliente', async () => {
    const a = await leer(),
      b = await leer('otra');
    expect(a.total).toBe(3);
    expect(b.total).toBe(1);
    expect(filas(a).map((x) => x.id)).not.toContain(filas(b)[0].id);
    const r = await (await agente()).get(ruta + '?donanteId=' + fixtures.cuentas.otra.donante.id).expect(400);
    expect(r.body.error.codigo).toBe('DATOS_INVALIDOS');
    await (await agente()).get('/api/yo/aportaciones/' + fixtures.cuentas.otra.donante.id).expect(404);
  });
  it('sin vinculo no concede historial por correo coincidente ni por permiso invitado', async () => {
    const a = await agente('sinVinculo');
    const contexto = await a.get('/api/donaciones/contexto').expect(200);
    expect(contexto.body.usuario.id).toBe(fixtures.cuentas.sinVinculo.usuario.id);
    // Permiso de operacion real en una sesion del servidor, sin atribuir un vinculo.
    const sesiones = await new Promise((resolver, rechazar) =>
      almacen.all((error, datos) => (error ? rechazar(error) : resolver(datos))),
    );
    const entrada = Object.entries(sesiones).find(
      ([, s]) => s.usuarioId === fixtures.cuentas.sinVinculo.usuario.id,
    );
    await new Promise((resolver, rechazar) =>
      almacen.set(entrada[0], { ...entrada[1], donaciones: permisoOperacion() }, (error) =>
        error ? rechazar(error) : resolver(),
      ),
    );
    const r = await a.get(ruta).expect(200);
    expect(r.body).toEqual({
      vinculado: false,
      filtroAnio: null,
      hayAportaciones: null,
      aniosDisponibles: [],
      datos: [],
      total: 0,
    });
    const sinConsultas = observarPool();
    await servicio(sinConsultas).historial(req('sinVinculo'), {});
    expect(sinConsultas.consultas.filter((x) => /FROM aportaciones/.test(x))).toHaveLength(0);
  });
  it('invitado sin cuenta no obtiene historial aunque conserve permiso de operacion', async () => {
    const a = request.agent(app);
    await a.get('/api/donaciones/contexto').expect(200);
    const sesiones = await new Promise((resolver, rechazar) =>
      almacen.all((error, datos) => (error ? rechazar(error) : resolver(datos))),
    );
    const entrada = Object.entries(sesiones).find(([, s]) => !s.usuarioId);
    await new Promise((resolver, rechazar) =>
      almacen.set(entrada[0], { ...entrada[1], donaciones: permisoOperacion() }, (error) =>
        error ? rechazar(error) : resolver(),
      ),
    );
    await a.get(ruta).expect(401);
  });
  it('la proyeccion no expone identidad fiscal, contacto, propietarios o claves de pago', async () => {
    const r = await (await agente()).get(ruta).expect(200);
    expect(r.headers['cache-control']).toBe('private, no-store');
    expect(r.headers.vary).toContain('Cookie');
    for (const f of filas(r.body))
      expect(Object.keys(f).sort()).toEqual(['destino', 'fechaCobro', 'id', 'importe', 'modalidad']);
    const texto = JSON.stringify(r.body);
    for (const secreto of [
      'nifNie',
      'correo',
      'direccion',
      'donanteId',
      'usuarioId',
      'pi_sintetico',
      'referencia',
    ])
      expect(texto).not.toContain(secreto);
  });
  it.each([
    '?anio=',
    '?anio=99',
    '?anio=0999',
    '?anio=10000',
    '?anio=2025.0',
    '?anio=abcd',
    '?anio=2025&anio=2026',
    '?anio[]=2025',
    '?usuarioId=1',
    '?correo=otra@example.test',
    '?extra=1',
  ])('rechaza query invalida %s sin revelar aportaciones', async (query) => {
    const r = await (await agente()).get(ruta + query).expect(400);
    expect(r.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(r.body.error.campos).toBeTruthy();
    expect(r.headers['cache-control']).toBe('private, no-store');
  });
  it('valida el filtro tambien antes de resolver una cuenta sin vinculo', async () => {
    await (await agente('sinVinculo')).get(ruta + '?anio=fallo').expect(400);
  });
});

describe('Contenido y exactitud HU-02', () => {
  it('agrupa 2026/2025, excluye estados y conserva cuota/correo fallido y proyecto inactivo', async () => {
    const dto = await leer();
    expect(dto).toMatchObject({
      vinculado: true,
      filtroAnio: null,
      hayAportaciones: true,
      aniosDisponibles: [2026, 2025],
      total: 3,
    });
    expect(dto.datos.map((x) => [x.anio, x.importeTotal])).toEqual([
      [2026, '20.00'],
      [2025, '80.00'],
    ]);
    expect(dto.datos[1].aportaciones.map((x) => x.importe)).toEqual(['30.00', '50.00']);
    expect(dto.datos[1].aportaciones[0]).toMatchObject({
      modalidad: 'cuota_socio',
      destino: fixtures.proyecto.nombre,
      fechaCobro: '2025-12-15T12:00:00+01:00',
    });
    expect(dto.datos[0].aportaciones[0]).toMatchObject({ modalidad: 'puntual', destino: 'fondo general' });
  });
  it('filtra 2025 y conserva los anios disponibles del historial completo', async () => {
    const dto = await leer('principal', '?anio=2025');
    expect(dto.filtroAnio).toBe(2025);
    expect(dto.aniosDisponibles).toEqual([2026, 2025]);
    expect(dto.total).toBe(2);
    expect(dto.datos.map((x) => x.anio)).toEqual([2025]);
    expect((await leer()).total).toBe(3);
  });
  it('distingue vacio vinculado de anio sin resultados', async () => {
    expect(await leer('vacio')).toEqual({
      vinculado: true,
      filtroAnio: null,
      hayAportaciones: false,
      aniosDisponibles: [],
      datos: [],
      total: 0,
    });
    expect(await leer('principal', '?anio=2024')).toEqual({
      vinculado: true,
      filtroAnio: 2024,
      hayAportaciones: true,
      aniosDisponibles: [2026, 2025],
      datos: [],
      total: 0,
    });
  });
  it.each(['1000', '9999'])('admite el limite de anio %s sin redondeos', async (anio) => {
    const dto = await leer('principal', '?anio=' + anio);
    expect(dto).toMatchObject({ filtroAnio: Number(anio), hayAportaciones: true, datos: [], total: 0 });
  });
  it('agrupa y filtra por Madrid, no por UTC o creado_en', async () => {
    const dto = await leer('fechas');
    expect(dto.datos.map((x) => [x.anio, x.importeTotal])).toEqual([
      [2026, '2.00'],
      [2025, '1.00'],
    ]);
    expect((await leer('fechas', '?anio=2026')).datos[0].aportaciones[0].fechaCobro).toBe(
      '2026-01-01T00:00:00+01:00',
    );
    expect((await leer('fechas', '?anio=2025')).total).toBe(1);
  });
  it('ordena empates por BIGINT numerico descendente sin perder digitos', async () => {
    const dto = await leer('empates');
    expect(filas(dto).map((x) => x.id)).toEqual(['9007199254740993', '9007199254740992']);
    expect(await leer('empates')).toEqual(dto);
  });
  it('suma por encima del limite individual y contrasta todos los grupos al centimo', async () => {
    expect((await leer('grande')).datos[0].importeTotal).toBe('1999999.98');
    for (const nombre of ['principal', 'grande', 'periodico']) {
      const dto = await leer(nombre);
      const suma = dto.datos.reduce((a, x) => a + centimos(x.importeTotal), 0n);
      const control = (
        await entorno.pool.query(
          "SELECT sum(importe)::text AS total FROM aportaciones WHERE donante_id=$1 AND estado='confirmada'",
          [fixtures.cuentas[nombre].donante.id],
        )
      ).rows[0].total;
      expect(suma).toBe(centimos(control));
    }
  });
  it('devuelve las 60 cuotas y tambien un historial mayor sin truncarlo', async () => {
    const dto = await leer('periodico');
    expect(dto.total).toBe(60);
    expect(dto.datos).toHaveLength(5);
    expect(dto.datos.every((x) => x.aportaciones.length === 12 && x.importeTotal === '120.00')).toBe(true);
    expect((await leer('extenso')).total).toBe(61);
  });
});

describe('Consistencia y ausencia de efectos HU-02', () => {
  it('conserva instantanea mientras otra conexion confirma entre resumen y detalle', async () => {
    const pendiente = await insertarAportacionHistorial(entorno.pool, fixtures.cuentas.otra.donante.id, {
      importe: '2.00',
      estado: 'pendiente',
    });
    const observado = observarPool({
      despuesResumen: async () => {
        await entorno.pool.query(
          "UPDATE aportaciones SET estado='confirmada',fecha_cobro='2025-07-15T11:00:00Z' WHERE id=$1",
          [pendiente.id],
        );
      },
    });
    const inicial = await servicio(observado).historial(req('otra'), {});
    expect(inicial.total).toBe(1);
    expect(inicial.datos[0].importeTotal).toBe('7.00');
    expect(filas(inicial).map((x) => x.id)).not.toContain(pendiente.id);
    expect(observado.consultas[0]).toBe('BEGIN');
    expect(observado.consultas[1]).toMatch(/SET TRANSACTION.*REPEATABLE READ.*READ ONLY/);
    expect(observado.estados).toEqual([{ aislamiento: 'repeatable read', solo_lectura: 'on' }]);
    expect(observado.consultas.at(-1)).toBe('COMMIT');
    expect(observado.liberaciones).toHaveLength(1);
    const siguiente = await servicio(entorno.pool).historial(req('otra'), {});
    expect(siguiente.total).toBe(2);
    expect(siguiente.datos[0].importeTotal).toBe('9.00');
  });
  it('un fallo SQL revierte y libera conexion sin dejar modo de transaccion activo', async () => {
    const fallo = new Error('fallo SQL sintetico');
    const observado = observarPool({ fallo });
    await expect(servicio(observado).historial(req('principal'), {})).rejects.toBe(fallo);
    expect(observado.consultas.at(-1)).toBe('ROLLBACK');
    expect(observado.liberaciones).toHaveLength(1);
    expect(
      (await entorno.pool.query("SELECT current_setting('transaction_read_only') AS lectura")).rows[0]
        .lectura,
    ).toBe('off');
    expect((await leer()).total).toBe(3);
  });
  it('un fallo SQL por HTTP devuelve error generico 500 privado y no un historial vacio', async () => {
    const a = await agente();
    const fallo = new Error('fallo SQL privado sintetico');
    const observado = observarPool({ fallo });
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
    db.pool = { query: (...args) => entorno.pool.query(...args), connect: () => observado.connect() };
    try {
      const r = await a.get(ruta).expect(500);
      expect(r.body.error.codigo).toBe('ERROR_INTERNO');
      expect(r.body).not.toHaveProperty('datos');
      expect(JSON.stringify(r.body)).not.toContain(fallo.message);
      expect(r.headers['cache-control']).toBe('private, no-store');
      expect(r.headers.vary).toContain('Cookie');
      expect(observado.consultas.at(-1)).toBe('ROLLBACK');
      expect(observado.liberaciones).toHaveLength(1);
      expect(errores).toHaveBeenCalledWith(fallo);
    } finally {
      db.pool = entorno.pool;
      errores.mockRestore();
    }
  });
  it('GET repetidos no cambian ninguna entidad ni invocan Stripe, SMTP o certificados', async () => {
    const tablas = [
      'usuarios',
      'donantes',
      'aportaciones',
      'suscripciones_socio',
      'operaciones_pago',
      'eventos_pasarela',
      'verificaciones_donante',
      'correos_aportacion',
      'certificados_fiscales',
    ];
    async function balance() {
      const datos = {};
      for (const tabla of tablas)
        datos[tabla] = (
          await entorno.pool.query(
            `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS datos FROM ${tabla} t`,
          )
        ).rows[0].datos;
      return datos;
    }
    const a = await agente();
    vi.clearAllMocks();
    const antes = await balance();
    await a.get(ruta).expect(200);
    await a.get(ruta + '?anio=2025').expect(200);
    await a.get(ruta).expect(200);
    expect(await balance()).toEqual(antes);
    expect(enviarCorreo).not.toHaveBeenCalled();
    for (const adaptador of Object.values(pasarela))
      if (vi.isMockFunction(adaptador)) expect(adaptador).not.toHaveBeenCalled();
  });
});

describe('Contraste fiscal HU-02 y HU-03', () => {
  it('reconcilia el ejercicio cerrado y conserva igualdad con el certificado persistido tras confirmacion tardia', async () => {
    const smtpFiscal = vi.fn(async () => true);
    const transacciones = [];
    const fiscal = crearServicioCertificados({
      repositorio: repositorioCertificados,
      transaccion: async (trabajo) => {
        const resultado = await enTransaccion(entorno.pool, trabajo);
        transacciones.push('commit');
        return resultado;
      },
      enviarCorreo: smtpFiscal,
      ahora: () => new Date('2026-11-10T12:00:00Z'),
    });
    const cuenta = fixtures.cuentas.fechas;
    const aportacionesAntes = (
      await entorno.pool.query('SELECT * FROM aportaciones WHERE donante_id=$1 ORDER BY id', [
        cuenta.donante.id,
      ])
    ).rows;
    async function comprobar(total) {
      const certificado = await repositorioCertificados.certificadoDeDonante(cuenta.donante.id, 2025);
      const dto = await servicio(entorno.pool).historial({ usuario: cuenta.usuario }, { anio: '2025' });
      const control = (
        await entorno.pool.query(
          `SELECT sum(importe)::text AS total FROM aportaciones WHERE donante_id=$1 AND estado='confirmada'
         AND fecha_cobro >= '2024-12-31T23:00:00Z' AND fecha_cobro < '2025-12-31T23:00:00Z'`,
          [cuenta.donante.id],
        )
      ).rows[0].total;
      expect(certificado.importeTotal).toBe(total);
      expect(dto.datos[0].importeTotal).toBe(total);
      expect(control).toBe(total);
      return certificado;
    }
    expect(await repositorioCertificados.certificadoDeDonante(cuenta.donante.id, 2025)).toBeNull();
    const primera = await fiscal.reconciliarEjercicio(2025);
    expect(primera.emitidos).toBeGreaterThan(0);
    expect(primera.correosFallidos).toBe(0);
    const anterior = await comprobar('1.00');
    const filaAnterior = (
      await entorno.pool.query(
        'SELECT id::text AS id FROM certificados_fiscales WHERE donante_id=$1 AND ejercicio=2025',
        [cuenta.donante.id],
      )
    ).rows[0];
    const tardia = await insertarAportacionHistorial(entorno.pool, cuenta.donante.id, {
      importe: '3.00',
      estado: 'pendiente',
    });
    await entorno.pool.query(
      "UPDATE aportaciones SET estado='confirmada',fecha_cobro='2025-06-15T11:00:00Z' WHERE id=$1 AND estado='pendiente'",
      [tardia.id],
    );
    const antesReconciliar = await servicio(entorno.pool).historial(
      { usuario: cuenta.usuario },
      { anio: '2025' },
    );
    expect(antesReconciliar.datos[0].importeTotal).toBe('4.00');
    expect((await repositorioCertificados.certificadoDeDonante(cuenta.donante.id, 2025)).importeTotal).toBe(
      '1.00',
    );
    const segunda = await fiscal.reconciliarEjercicio(2025);
    expect(segunda).toEqual({ ejercicio: 2025, emitidos: 0, regenerados: 1, correosFallidos: 0 });
    const actual = await comprobar('4.00');
    expect(actual.codigoVerificacion).not.toBe(anterior.codigoVerificacion);
    expect(
      (
        await entorno.pool.query(
          'SELECT id::text AS id FROM certificados_fiscales WHERE donante_id=$1 AND ejercicio=2025',
          [cuenta.donante.id],
        )
      ).rows[0],
    ).toEqual(filaAnterior);
    expect(
      (
        await entorno.pool.query('SELECT * FROM aportaciones WHERE donante_id=$1 AND id<>$2 ORDER BY id', [
          cuenta.donante.id,
          tardia.id,
        ])
      ).rows,
    ).toEqual(aportacionesAntes);
    expect(transacciones).toEqual(['commit', 'commit']);
    expect(smtpFiscal).toHaveBeenCalled();
  });
});
