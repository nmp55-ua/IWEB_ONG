import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ejecutar = promisify(execFile);
const raizBackend = fileURLToPath(new URL('../../../', import.meta.url));
const carpetaMigraciones = new URL('../../db/migraciones/', import.meta.url);
const tablasDominio = ['aportaciones', 'donantes', 'suscripciones_socio'];
const previas = ['001_usuarios.sql', '002_sesiones.sql', '003_proyectos.sql'];
const secuencias = [
  { nombre: '001–003 → 004', codigo: 'base', previas },
  { nombre: '001–003/005 → 004', codigo: 'con005', previas: [...previas, '005_actividades.sql'] },
];

let administrador;
let conexionPruebas;
let tablasPublicasAntes;

async function tablasPublicas() {
  const { rows } = await administrador.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  return rows.map((fila) => fila.tablename);
}

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error('Configura DATABASE_URL y TEST_DATABASE_URL con la misma base exclusiva ong_test_hu01.');
  }
  conexionPruebas = new URL(process.env.TEST_DATABASE_URL);
  if (conexionPruebas.pathname !== '/ong_test_hu01') {
    throw new Error('Las pruebas de 004 solo pueden ejecutarse en ong_test_hu01.');
  }
  administrador = new pg.Client({ connectionString: conexionPruebas.href });
  await administrador.connect();
  const { rows } = await administrador.query('SELECT current_database() AS nombre');
  expect(rows[0].nombre).toBe('ong_test_hu01');
  tablasPublicasAntes = await tablasPublicas();
});

afterAll(async () => {
  if (!administrador) return;
  try {
    if (tablasPublicasAntes) expect(await tablasPublicas()).toEqual(tablasPublicasAntes);
  } finally {
    await administrador.end();
  }
});

describe.each(secuencias)('HU-01 · 004 · $nombre', (secuencia) => {
  let cliente;
  let esquema;
  let esquemaCreado = false;
  let urlEsquema;
  let creadasPor004;
  let salidaInicial;
  let usuarioId;
  let proyectoId;
  let donanteId;
  let suscripcionId;
  let numero = 0;

  async function ejecutarMigrador() {
    const { stdout } = await ejecutar(process.execPath, ['src/db/migrar.js'], {
      cwd: raizBackend,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: urlEsquema.href,
        TEST_DATABASE_URL: urlEsquema.href,
        AHORA_SIMULADO: '',
      },
      timeout: 15000,
      windowsHide: true,
    });
    return stdout.trim();
  }

  async function insertar(tabla, datos) {
    if (!tablasDominio.includes(tabla)) throw new Error('Tabla de fixture no permitida.');
    const columnas = Object.keys(datos);
    if (!columnas.every((columna) => /^[a-z_]+$/.test(columna))) throw new Error('Columna no válida.');
    const parametros = columnas.map((_, indice) => `$${indice + 1}`);
    const { rows } = await cliente.query(
      `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${parametros.join(', ')}) RETURNING *`,
      Object.values(datos),
    );
    return rows[0];
  }

  function siguienteNif() {
    const digitos = String(10000000 + ++numero);
    return digitos + 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(digitos) % 23];
  }

  function donante(datos = {}) {
    const nif = siguienteNif();
    return insertar('donantes', {
      nombre: 'Persona', apellidos: 'De Prueba', nif_nie: nif,
      correo: `donante-${nif.toLowerCase()}@example.test`, direccion: 'Calle Ejemplo 1', ...datos,
    });
  }

  function suscripcion(datos = {}) {
    return insertar('suscripciones_socio', {
      donante_id: donanteId, importe: '10.00', periodicidad: 'mensual', ...datos,
    });
  }

  function aportacion(datos = {}) {
    return insertar('aportaciones', {
      donante_id: donanteId, modalidad: 'puntual', importe: '20.00',
      referencia: `DON-PRUEBA-${secuencia.codigo}-${++numero}`, ...datos,
    });
  }

  async function rechaza(accion, codigo) {
    await cliente.query('SAVEPOINT dato_invalido');
    try {
      await expect(accion()).rejects.toMatchObject({ code: codigo });
    } finally {
      await cliente.query('ROLLBACK TO SAVEPOINT dato_invalido');
      await cliente.query('RELEASE SAVEPOINT dato_invalido');
    }
  }

  beforeAll(async () => {
    // La falta de 004 es un fallo explícito, nunca una omisión por configuración.
    const sql004 = await readFile(new URL('004_donaciones.sql', carpetaMigraciones), 'utf8');
    esquema = `hu01_004_${secuencia.codigo}_${process.pid}_${randomBytes(6).toString('hex')}`;
    if (!/^hu01_004_[a-z0-9_]+$/.test(esquema)) throw new Error('Esquema de prueba no válido.');
    await administrador.query(`CREATE SCHEMA "${esquema}"`);
    esquemaCreado = true;
    urlEsquema = new URL(conexionPruebas);
    urlEsquema.searchParams.set('options', `-csearch_path=${esquema}`);
    cliente = new pg.Client({ connectionString: urlEsquema.href });
    await cliente.connect();
    expect((await cliente.query('SELECT current_schema() AS nombre')).rows[0].nombre).toBe(esquema);
    await cliente.query(`CREATE TABLE migraciones_aplicadas (
      nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    for (const nombre of secuencia.previas) {
      await cliente.query(await readFile(new URL(nombre, carpetaMigraciones), 'utf8'));
      await cliente.query('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [nombre]);
    }
    const listarTablas = async () => (await cliente.query(
      'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename', [esquema],
    )).rows.map((fila) => fila.tablename);
    const antes = await listarTablas();
    // Se observa exclusivamente el efecto de 004 y se deshace antes del migrador real.
    await cliente.query('BEGIN');
    try {
      await cliente.query(sql004);
      creadasPor004 = (await listarTablas()).filter((tabla) => !antes.includes(tabla));
    } finally {
      await cliente.query('ROLLBACK');
    }
    salidaInicial = await ejecutarMigrador();
    usuarioId = (await cliente.query(`INSERT INTO usuarios (correo, hash_contrasena, nombre, roles)
      VALUES ('usuario@example.test', 'hash-sintetico', 'Persona', ARRAY['donante']) RETURNING id`)).rows[0].id;
    proyectoId = (await cliente.query("INSERT INTO proyectos (nombre) VALUES ('Proyecto de prueba') RETURNING id"))
      .rows[0].id;
    donanteId = (await donante()).id;
    suscripcionId = (await suscripcion()).id;
  }, 30000);

  beforeEach(async () => { await cliente.query('BEGIN'); });
  afterEach(async () => { if (cliente) await cliente.query('ROLLBACK'); });

  afterAll(async () => {
    try {
      if (cliente) await cliente.end();
    } finally {
      // Solo se elimina el esquema creado por esta ejecución, nunca una base o public.
      if (esquemaCreado) await administrador.query(`DROP SCHEMA "${esquema}" CASCADE`);
    }
  });

  it('004 crea únicamente las tres tablas de dominio', () => {
    expect(creadasPor004).toEqual(tablasDominio);
  });

  it('el migrador incorpora 004 pendiente aunque 005 ya esté registrada', async () => {
    expect(salidaInicial).toContain('Aplicada 004_donaciones.sql');
    expect(salidaInicial.includes('Aplicada 005_actividades.sql')).toBe(secuencia.codigo === 'base');
    const { rows } = await cliente.query('SELECT nombre FROM migraciones_aplicadas ORDER BY nombre');
    expect(rows.map((fila) => fila.nombre)).toEqual([...previas, '004_donaciones.sql', '005_actividades.sql']);
  });

  it('repetir el migrador no reaplica 004 ni cambia registros o auditoría', async () => {
    const antes = (await cliente.query('SELECT * FROM migraciones_aplicadas ORDER BY nombre')).rows;
    const donanteAntes = (await cliente.query('SELECT * FROM donantes WHERE id = $1', [donanteId])).rows;
    expect(await ejecutarMigrador()).toBe('');
    expect((await cliente.query('SELECT * FROM migraciones_aplicadas ORDER BY nombre')).rows).toEqual(antes);
    expect((await cliente.query('SELECT * FROM donantes WHERE id = $1', [donanteId])).rows).toEqual(donanteAntes);
  });

  it.each(tablasDominio)('%s tiene PK BIGSERIAL y auditoría temporal no nula con valores iniciales', async (tabla) => {
    const { rows } = await cliente.query(`SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2
      AND column_name IN ('id', 'creado_en', 'actualizado_en') ORDER BY column_name`, [esquema, tabla]);
    expect(rows).toHaveLength(3);
    for (const fila of rows) {
      expect(fila.is_nullable).toBe('NO');
      expect(fila.data_type).toBe(fila.column_name === 'id' ? 'bigint' : 'timestamp with time zone');
      expect(fila.column_default).toContain(fila.column_name === 'id' ? 'nextval(' : 'now()');
    }
    const pk = await cliente.query(`SELECT c.contype FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1 AND t.relname = $2 AND c.contype = 'p'`, [esquema, tabla]);
    expect(pk.rows).toHaveLength(1);
  });

  it('las columnas de dominio y su nulabilidad coinciden con el contrato, sin soporte operativo', async () => {
    const esperadas = {
      donantes: ['apellidos', 'correo', 'creado_en', 'direccion', 'id', 'nif_nie', 'nombre', 'actualizado_en', 'usuario_id'],
      suscripciones_socio: ['id', 'donante_id', 'proyecto_id', 'importe', 'periodicidad', 'estado', 'fecha_alta',
        'fecha_proximo_cobro', 'pasarela_proximo_cobro_en', 'pasarela_suscripcion_id', 'creado_en', 'actualizado_en'],
      aportaciones: ['id', 'donante_id', 'proyecto_id', 'suscripcion_socio_id', 'modalidad', 'importe', 'estado',
        'fecha_cobro', 'referencia', 'pasarela_pago_id', 'pasarela_factura_id', 'motivo', 'creado_en', 'actualizado_en'],
    };
    const opcionales = {
      donantes: ['usuario_id'],
      suscripciones_socio: ['proyecto_id', 'fecha_alta', 'fecha_proximo_cobro', 'pasarela_proximo_cobro_en', 'pasarela_suscripcion_id'],
      aportaciones: ['proyecto_id', 'suscripcion_socio_id', 'fecha_cobro', 'pasarela_pago_id', 'pasarela_factura_id', 'motivo'],
    };
    for (const tabla of tablasDominio) {
      const { rows } = await cliente.query(`SELECT column_name, is_nullable FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 ORDER BY column_name`, [esquema, tabla]);
      expect(rows.map((fila) => fila.column_name)).toEqual(esperadas[tabla].sort());
      expect(rows.filter((fila) => fila.is_nullable === 'YES').map((fila) => fila.column_name))
        .toEqual(opcionales[tabla].sort());
    }
  });

  it('NIF/NIE y usuario vinculado son únicos, con varios donantes sin usuario', async () => {
    const primero = await donante({ usuario_id: usuarioId });
    await rechaza(() => donante({ nif_nie: primero.nif_nie }), '23505');
    await rechaza(() => donante({ usuario_id: usuarioId }), '23505');
    expect((await donante()).usuario_id).toBeNull();
    expect((await donante()).usuario_id).toBeNull();
  });

  it('el correo no tiene restricción UNIQUE de base de datos', async () => {
    const primero = await donante({ correo: 'compartido@example.test' });
    const segundo = await donante({ correo: primero.correo });
    expect(segundo.id).not.toBe(primero.id);
    expect(segundo.nif_nie).not.toBe(primero.nif_nie);
  });

  it.each(['12345678A', '12345678z', 'INVALIDO'])('rechaza NIF/NIE inválido o sin normalizar: %s', async (nif) => {
    await rechaza(() => donante({ nif_nie: nif }), '23514');
  });

  it('acepta NIE válido y exige correo en minúsculas', async () => {
    expect((await donante({ nif_nie: 'X1234567L' })).nif_nie).toBe('X1234567L');
    await rechaza(() => donante({ correo: 'Persona@example.test' }), '23514');
  });

  it.each(['aportaciones', 'suscripciones_socio'])('%s guarda NUMERIC(10,2) sin coma flotante', async (tabla) => {
    const { rows } = await cliente.query(`SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'importe'`,
    [esquema, tabla]);
    expect(rows[0]).toEqual({ data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 });
    const crear = tabla === 'aportaciones' ? aportacion : suscripcion;
    expect((await crear({ importe: '1.00' })).importe).toBe('1.00');
    expect((await crear({ importe: '999999.99' })).importe).toBe('999999.99');
    for (const importe of ['0.00', '-1.00', '0.99', '1000000.00']) {
      await rechaza(() => crear({ importe }), '23514');
    }
  });

  it('el máximo individual no limita los totales de confirmadas', async () => {
    await aportacion({ importe: '999999.99', estado: 'confirmada', fecha_cobro: '2026-11-01T12:00:00Z' });
    await aportacion({ importe: '999999.99', estado: 'confirmada', fecha_cobro: '2026-11-02T12:00:00Z' });
    await aportacion({ importe: '20.00', estado: 'rechazada' });
    const { rows } = await cliente.query("SELECT sum(importe)::text AS total FROM aportaciones WHERE estado = 'confirmada'");
    expect(rows[0].total).toBe('1999999.98');
  });

  it('el alta nace pendiente, admite las tres periodicidades y rechaza valores ajenos', async () => {
    for (const periodicidad of ['mensual', 'trimestral', 'anual']) {
      const alta = await suscripcion({ periodicidad });
      expect(alta.estado).toBe('pendiente');
      expect(alta.fecha_alta).toBeNull();
    }
    await rechaza(() => suscripcion({ periodicidad: 'semanal' }), '23514');
    await rechaza(() => suscripcion({ estado: 'desconocida' }), '23514');
    await rechaza(() => suscripcion({ estado: 'activa' }), '23514');
    expect((await suscripcion({ estado: 'activa', fecha_alta: '2026-11-01T12:00:00Z' })).estado).toBe('activa');
    expect((await suscripcion({ estado: 'cancelada' })).estado).toBe('cancelada');
  });

  it('conserva previsión nullable como instante y DATE, sin inventar fecha', async () => {
    const alta = await suscripcion();
    expect(alta.fecha_proximo_cobro).toBeNull();
    expect(alta.pasarela_proximo_cobro_en).toBeNull();
    const prevista = await suscripcion({
      fecha_proximo_cobro: '2026-11-20', pasarela_proximo_cobro_en: '2026-11-19T23:30:00Z',
    });
    const { rows } = await cliente.query(`SELECT fecha_proximo_cobro::text AS fecha,
      (pasarela_proximo_cobro_en AT TIME ZONE 'Europe/Madrid')::date::text AS madrid
      FROM suscripciones_socio WHERE id = $1`, [prevista.id]);
    expect(rows[0]).toEqual({ fecha: '2026-11-20', madrid: '2026-11-20' });
  });

  it('Subscription externo es único y admite identificadores aún desconocidos', async () => {
    expect((await suscripcion()).pasarela_suscripcion_id).toBeNull();
    await suscripcion({ pasarela_suscripcion_id: 'sub_prueba' });
    await rechaza(() => suscripcion({ pasarela_suscripcion_id: 'sub_prueba' }), '23505');
  });

  it('fondo general es NULL y una aportación nueva no está cobrada', async () => {
    const nueva = await aportacion();
    expect(nueva.estado).toBe('pendiente');
    for (const columna of ['proyecto_id', 'suscripcion_socio_id', 'fecha_cobro', 'pasarela_pago_id', 'pasarela_factura_id', 'motivo']) {
      expect(nueva[columna]).toBeNull();
    }
    expect((await aportacion({ proyecto_id: proyectoId })).proyecto_id).toBe(proyectoId);
  });

  it('solo admite estados previstos y exige fecha al confirmar', async () => {
    await rechaza(() => aportacion({ estado: 'confirmada' }), '23514');
    await rechaza(() => aportacion({ estado: 'desconocido' }), '23514');
    for (const estado of ['pendiente', 'rechazada', 'cancelada']) expect((await aportacion({ estado })).estado).toBe(estado);
    expect((await aportacion({ estado: 'confirmada', fecha_cobro: '2026-11-01T12:00:00Z' })).estado).toBe('confirmada');
  });

  it('cuota exige suscripción y puntual no admite suscripción ni factura', async () => {
    await rechaza(() => aportacion({ modalidad: 'cuota_socio' }), '23514');
    await rechaza(() => aportacion({ suscripcion_socio_id: suscripcionId }), '23514');
    await rechaza(() => aportacion({ pasarela_factura_id: 'in_puntual' }), '23514');
    await rechaza(() => aportacion({ modalidad: 'ajena' }), '23514');
    const cuota = await aportacion({ modalidad: 'cuota_socio', suscripcion_socio_id: suscripcionId });
    expect(cuota.suscripcion_socio_id).toBe(suscripcionId);
  });

  it('referencia, PaymentIntent y factura no se duplican; los identificadores pueden faltar', async () => {
    const primera = await aportacion({ pasarela_pago_id: 'pi_unico' });
    await rechaza(() => aportacion({ referencia: primera.referencia }), '23505');
    await rechaza(() => aportacion({ pasarela_pago_id: 'pi_unico' }), '23505');
    await aportacion({ modalidad: 'cuota_socio', suscripcion_socio_id: suscripcionId, pasarela_factura_id: 'in_unica' });
    await rechaza(() => aportacion({ modalidad: 'cuota_socio', suscripcion_socio_id: suscripcionId,
      pasarela_factura_id: 'in_unica' }), '23505');
    expect((await aportacion()).pasarela_pago_id).toBeNull();
    expect((await aportacion()).pasarela_pago_id).toBeNull();
  });

  it('las seis FK de donaciones usan RESTRICT y rechazan referencias inexistentes', async () => {
    const { rows } = await cliente.query(`SELECT c.confdeltype FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1 AND t.relname = ANY($2::text[]) AND c.contype = 'f'`, [esquema, tablasDominio]);
    expect(rows).toHaveLength(6);
    expect(rows.every((fila) => fila.confdeltype === 'r')).toBe(true);
    await rechaza(() => donante({ usuario_id: '-1' }), '23503');
    await rechaza(() => suscripcion({ donante_id: '-1' }), '23503');
    await rechaza(() => suscripcion({ proyecto_id: '-1' }), '23503');
    await rechaza(() => aportacion({ donante_id: '-1' }), '23503');
    await rechaza(() => aportacion({ proyecto_id: '-1' }), '23503');
    await rechaza(() => aportacion({ modalidad: 'cuota_socio', suscripcion_socio_id: '-1' }), '23503');
    await aportacion({ modalidad: 'cuota_socio', suscripcion_socio_id: suscripcionId });
    await rechaza(() => cliente.query('DELETE FROM donantes WHERE id = $1', [donanteId]), '23503');
    await rechaza(() => cliente.query('DELETE FROM suscripciones_socio WHERE id = $1', [suscripcionId]), '23503');
  });

  it('incluye el índice financiero por donante, estado y fecha de cobro', async () => {
    const { rows } = await cliente.query(`SELECT indexdef FROM pg_indexes
      WHERE schemaname = $1 AND tablename = 'aportaciones'`, [esquema]);
    expect(rows.some((fila) => fila.indexdef.includes('(donante_id, estado, fecha_cobro)'))).toBe(true);
  });
});
