import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import {
  crearEntornoPruebas,
  crearSimuladorStripe,
  recursosCanonicos,
  contrasenaPruebas,
  verificarEsquemaPruebas,
} from './pruebas/soporte.js';
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
  let tablasConOperativa;
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
      nombre: 'Persona',
      apellidos: 'De Prueba',
      nif_nie: nif,
      correo: `donante-${nif.toLowerCase()}@example.test`,
      direccion: 'Calle Ejemplo 1',
      ...datos,
    });
  }

  function suscripcion(datos = {}) {
    return insertar('suscripciones_socio', {
      donante_id: donanteId,
      importe: '10.00',
      periodicidad: 'mensual',
      ...datos,
    });
  }

  function aportacion(datos = {}) {
    return insertar('aportaciones', {
      donante_id: donanteId,
      modalidad: 'puntual',
      importe: '20.00',
      referencia: `DON-PRUEBA-${secuencia.codigo}-${++numero}`,
      ...datos,
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
    const sql009 = await readFile(new URL('009_operativa_donaciones.sql', carpetaMigraciones), 'utf8');
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
    const listarTablas = async () =>
      (
        await cliente.query('SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename', [
          esquema,
        ])
      ).rows.map((fila) => fila.tablename);
    const antes = await listarTablas();
    // Se observa exclusivamente el efecto de 004 y se deshace antes del migrador real.
    await cliente.query('BEGIN');
    try {
      await cliente.query(sql004);
      creadasPor004 = (await listarTablas()).filter((tabla) => !antes.includes(tabla));
      await cliente.query(sql009);
      tablasConOperativa = (await listarTablas()).filter((tabla) => !antes.includes(tabla));
    } finally {
      await cliente.query('ROLLBACK');
    }
    salidaInicial = await ejecutarMigrador();
    usuarioId = (
      await cliente.query(`INSERT INTO usuarios (correo, hash_contrasena, nombre, roles)
      VALUES ('usuario@example.test', 'hash-sintetico', 'Persona', ARRAY['donante']) RETURNING id`)
    ).rows[0].id;
    proyectoId = (
      await cliente.query("INSERT INTO proyectos (nombre) VALUES ('Proyecto de prueba') RETURNING id")
    ).rows[0].id;
    donanteId = (await donante()).id;
    suscripcionId = (await suscripcion()).id;
  }, 30000);

  beforeEach(async () => {
    await cliente.query('BEGIN');
  });
  afterEach(async () => {
    if (cliente) await cliente.query('ROLLBACK');
  });

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
    expect(rows.map((fila) => fila.nombre)).toEqual([
      ...previas,
      '004_donaciones.sql',
      '005_actividades.sql',
      '006_voluntariado.sql',
      '007_asistencias.sql',
      '008_certificados.sql',
      '009_operativa_donaciones.sql',
    ]);
  });

  it('repetir el migrador no reaplica 004 ni cambia registros o auditoría', async () => {
    const antes = (await cliente.query('SELECT * FROM migraciones_aplicadas ORDER BY nombre')).rows;
    const donanteAntes = (await cliente.query('SELECT * FROM donantes WHERE id = $1', [donanteId])).rows;
    expect(await ejecutarMigrador()).toBe('');
    expect((await cliente.query('SELECT * FROM migraciones_aplicadas ORDER BY nombre')).rows).toEqual(antes);
    expect((await cliente.query('SELECT * FROM donantes WHERE id = $1', [donanteId])).rows).toEqual(
      donanteAntes,
    );
  });

  it.each(tablasDominio)(
    '%s tiene PK BIGSERIAL y auditoría temporal no nula con valores iniciales',
    async (tabla) => {
      const { rows } = await cliente.query(
        `SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2
      AND column_name IN ('id', 'creado_en', 'actualizado_en') ORDER BY column_name`,
        [esquema, tabla],
      );
      expect(rows).toHaveLength(3);
      for (const fila of rows) {
        expect(fila.is_nullable).toBe('NO');
        expect(fila.data_type).toBe(fila.column_name === 'id' ? 'bigint' : 'timestamp with time zone');
        expect(fila.column_default).toContain(fila.column_name === 'id' ? 'nextval(' : 'now()');
      }
      const pk = await cliente.query(
        `SELECT c.contype FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1 AND t.relname = $2 AND c.contype = 'p'`,
        [esquema, tabla],
      );
      expect(pk.rows).toHaveLength(1);
    },
  );

  it('las columnas de dominio y su nulabilidad coinciden con el contrato, sin soporte operativo', async () => {
    const esperadas = {
      donantes: [
        'apellidos',
        'correo',
        'creado_en',
        'direccion',
        'id',
        'nif_nie',
        'nombre',
        'actualizado_en',
        'usuario_id',
      ],
      suscripciones_socio: [
        'id',
        'donante_id',
        'proyecto_id',
        'importe',
        'periodicidad',
        'estado',
        'fecha_alta',
        'fecha_proximo_cobro',
        'pasarela_proximo_cobro_en',
        'pasarela_suscripcion_id',
        'creado_en',
        'actualizado_en',
      ],
      aportaciones: [
        'id',
        'donante_id',
        'proyecto_id',
        'suscripcion_socio_id',
        'modalidad',
        'importe',
        'estado',
        'fecha_cobro',
        'referencia',
        'pasarela_pago_id',
        'pasarela_factura_id',
        'motivo',
        'creado_en',
        'actualizado_en',
      ],
    };
    const opcionales = {
      donantes: ['usuario_id'],
      suscripciones_socio: [
        'proyecto_id',
        'fecha_alta',
        'fecha_proximo_cobro',
        'pasarela_proximo_cobro_en',
        'pasarela_suscripcion_id',
      ],
      aportaciones: [
        'proyecto_id',
        'suscripcion_socio_id',
        'fecha_cobro',
        'pasarela_pago_id',
        'pasarela_factura_id',
        'motivo',
      ],
    };
    for (const tabla of tablasDominio) {
      const { rows } = await cliente.query(
        `SELECT column_name, is_nullable FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 ORDER BY column_name`,
        [esquema, tabla],
      );
      expect(rows.map((fila) => fila.column_name)).toEqual(esperadas[tabla].sort());
      expect(rows.filter((fila) => fila.is_nullable === 'YES').map((fila) => fila.column_name)).toEqual(
        opcionales[tabla].sort(),
      );
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

  it.each(['12345678A', '12345678z', 'INVALIDO'])(
    'rechaza NIF/NIE inválido o sin normalizar: %s',
    async (nif) => {
      await rechaza(() => donante({ nif_nie: nif }), '23514');
    },
  );

  it('acepta NIE válido y exige correo en minúsculas', async () => {
    expect((await donante({ nif_nie: 'X1234567L' })).nif_nie).toBe('X1234567L');
    await rechaza(() => donante({ correo: 'Persona@example.test' }), '23514');
  });

  it.each(['aportaciones', 'suscripciones_socio'])(
    '%s guarda NUMERIC(10,2) sin coma flotante',
    async (tabla) => {
      const { rows } = await cliente.query(
        `SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'importe'`,
        [esquema, tabla],
      );
      expect(rows[0]).toEqual({ data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 });
      const crear = tabla === 'aportaciones' ? aportacion : suscripcion;
      expect((await crear({ importe: '1.00' })).importe).toBe('1.00');
      expect((await crear({ importe: '999999.99' })).importe).toBe('999999.99');
      for (const importe of ['0.00', '-1.00', '0.99', '1000000.00']) {
        await rechaza(() => crear({ importe }), '23514');
      }
    },
  );

  it('el máximo individual no limita los totales de confirmadas', async () => {
    await aportacion({ importe: '999999.99', estado: 'confirmada', fecha_cobro: '2026-11-01T12:00:00Z' });
    await aportacion({ importe: '999999.99', estado: 'confirmada', fecha_cobro: '2026-11-02T12:00:00Z' });
    await aportacion({ importe: '20.00', estado: 'rechazada' });
    const { rows } = await cliente.query(
      "SELECT sum(importe)::text AS total FROM aportaciones WHERE estado = 'confirmada'",
    );
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
    expect((await suscripcion({ estado: 'activa', fecha_alta: '2026-11-01T12:00:00Z' })).estado).toBe(
      'activa',
    );
    expect((await suscripcion({ estado: 'cancelada' })).estado).toBe('cancelada');
  });

  it('conserva previsión nullable como instante y DATE, sin inventar fecha', async () => {
    const alta = await suscripcion();
    expect(alta.fecha_proximo_cobro).toBeNull();
    expect(alta.pasarela_proximo_cobro_en).toBeNull();
    const prevista = await suscripcion({
      fecha_proximo_cobro: '2026-11-20',
      pasarela_proximo_cobro_en: '2026-11-19T23:30:00Z',
    });
    const { rows } = await cliente.query(
      `SELECT fecha_proximo_cobro::text AS fecha,
      (pasarela_proximo_cobro_en AT TIME ZONE 'Europe/Madrid')::date::text AS madrid
      FROM suscripciones_socio WHERE id = $1`,
      [prevista.id],
    );
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
    for (const columna of [
      'proyecto_id',
      'suscripcion_socio_id',
      'fecha_cobro',
      'pasarela_pago_id',
      'pasarela_factura_id',
      'motivo',
    ]) {
      expect(nueva[columna]).toBeNull();
    }
    expect((await aportacion({ proyecto_id: proyectoId })).proyecto_id).toBe(proyectoId);
  });

  it('solo admite estados previstos y exige fecha al confirmar', async () => {
    await rechaza(() => aportacion({ estado: 'confirmada' }), '23514');
    await rechaza(() => aportacion({ estado: 'desconocido' }), '23514');
    for (const estado of ['pendiente', 'rechazada', 'cancelada'])
      expect((await aportacion({ estado })).estado).toBe(estado);
    expect((await aportacion({ estado: 'confirmada', fecha_cobro: '2026-11-01T12:00:00Z' })).estado).toBe(
      'confirmada',
    );
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
    await aportacion({
      modalidad: 'cuota_socio',
      suscripcion_socio_id: suscripcionId,
      pasarela_factura_id: 'in_unica',
    });
    await rechaza(
      () =>
        aportacion({
          modalidad: 'cuota_socio',
          suscripcion_socio_id: suscripcionId,
          pasarela_factura_id: 'in_unica',
        }),
      '23505',
    );
    expect((await aportacion()).pasarela_pago_id).toBeNull();
    expect((await aportacion()).pasarela_pago_id).toBeNull();
  });

  it('las seis FK de donaciones usan RESTRICT y rechazan referencias inexistentes', async () => {
    const { rows } = await cliente.query(
      `SELECT c.confdeltype FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = $1 AND t.relname = ANY($2::text[]) AND c.contype = 'f'`,
      [esquema, tablasDominio],
    );
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
    await rechaza(
      () => cliente.query('DELETE FROM suscripciones_socio WHERE id = $1', [suscripcionId]),
      '23503',
    );
  });

  it('incluye el índice financiero por donante, estado y fecha de cobro', async () => {
    const { rows } = await cliente.query(
      `SELECT indexdef FROM pg_indexes
      WHERE schemaname = $1 AND tablename = 'aportaciones'`,
      [esquema],
    );
    expect(rows.some((fila) => fila.indexdef.includes('(donante_id, estado, fecha_cobro)'))).toBe(true);
  });
  const tecnicas = ['operaciones_pago', 'eventos_pasarela', 'verificaciones_donante', 'correos_aportacion'];
  async function operacion(datos = {}) {
    const aporte = await aportacion();
    const valor = {
      solicitud_id: crypto.randomUUID(),
      aportacion_id: aporte.id,
      huella_solicitud: 'a'.repeat(64),
      solicitud_checkout: { mode: 'payment', line_items: [], metadata: { modulo: 'donaciones' } },
      estado: 'preparada',
      ...datos,
    };
    const columnas = Object.keys(valor);
    return (
      await cliente.query(
        `INSERT INTO operaciones_pago (${columnas.join(',')}) VALUES (${columnas.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`,
        Object.values(valor),
      )
    ).rows[0];
  }
  it('009 añade solo cuatro tablas y funciona después de 004 sin necesitar 005–008', () => {
    expect(tablasConOperativa.sort()).toEqual([...tablasDominio, ...tecnicas].sort());
    expect(salidaInicial).toContain('Aplicada 009_operativa_donaciones.sql');
  });
  it('las columnas técnicas coinciden con el modelo y sus cuatro FK son RESTRICT', async () => {
    const modelo = {
      operaciones_pago: [
        'solicitud_id',
        'aportacion_id',
        'huella_solicitud',
        'solicitud_checkout',
        'sesion_checkout_id',
        'url_checkout',
        'estado',
      ],
      eventos_pasarela: ['pasarela_evento_id', 'tipo', 'objeto_id', 'ocurrido_en', 'estado', 'error_codigo'],
      verificaciones_donante: ['usuario_id', 'donante_id', 'token_hash', 'expira_en', 'usado_en'],
      correos_aportacion: [
        'aportacion_id',
        'tipo',
        'resumen',
        'estado',
        'intentos',
        'reservado_hasta',
        'enviado_en',
      ],
    };
    const opcionales = {
      operaciones_pago: ['sesion_checkout_id', 'url_checkout'],
      eventos_pasarela: ['error_codigo'],
      verificaciones_donante: ['usado_en'],
      correos_aportacion: ['reservado_hasta', 'enviado_en'],
    };
    for (const tabla of tecnicas) {
      const { rows } = await cliente.query(
        `SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
        [esquema, tabla],
      );
      expect(rows.map((r) => r.column_name).sort()).toEqual(
        [...modelo[tabla], 'id', 'creado_en', 'actualizado_en'].sort(),
      );
      expect(
        rows
          .filter((r) => r.is_nullable === 'YES')
          .map((r) => r.column_name)
          .sort(),
      ).toEqual(opcionales[tabla].sort());
      for (const campo of ['creado_en', 'actualizado_en'])
        expect(rows.find((r) => r.column_name === campo)).toMatchObject({
          data_type: 'timestamp with time zone',
          column_default: 'now()',
        });
      expect(rows.find((r) => r.column_name === 'id').column_default).toContain('nextval(');
    }
    const { rows } = await cliente.query(
      `SELECT c.confdeltype FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=$1 AND t.relname=ANY($2::text[]) AND c.contype='f'`,
      [esquema, tecnicas],
    );
    expect(rows).toHaveLength(4);
    const claves = await cliente.query(
      `SELECT t.relname, count(*)::int AS total FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=$1 AND t.relname=ANY($2::text[]) AND c.contype='p' GROUP BY t.relname`,
      [esquema, tecnicas],
    );
    expect(claves.rows).toHaveLength(4);
    expect(claves.rows.every((r) => r.total === 1)).toBe(true);
    const indices = await cliente.query(
      `SELECT t.relname, count(*)::int AS total FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=$1 AND t.relname=ANY($2::text[]) AND i.indisunique GROUP BY t.relname`,
      [esquema, tecnicas],
    );
    expect(Object.fromEntries(indices.rows.map((r) => [r.relname, r.total]))).toEqual({
      operaciones_pago: 4,
      eventos_pasarela: 2,
      verificaciones_donante: 2,
      correos_aportacion: 2,
    });

    expect(rows.every((r) => r.confdeltype === 'r')).toBe(true);
  });
  it('operaciones impide duplicar UUID, aportación o Checkout y exige JSONB no nulo', async () => {
    const primera = await operacion({ sesion_checkout_id: 'cs_unica' });
    await rechaza(() => operacion({ solicitud_id: primera.solicitud_id }), '23505');
    await rechaza(() => operacion({ aportacion_id: primera.aportacion_id }), '23505');
    await rechaza(() => operacion({ sesion_checkout_id: 'cs_unica' }), '23505');
    await rechaza(() => operacion({ solicitud_checkout: null }), '23502');
    await rechaza(() => operacion({ aportacion_id: '-1' }), '23503');
    await rechaza(() => operacion({ estado: 'desconocido' }), '23514');
    for (const estado of ['preparada', 'checkout_creado', 'incierta', 'cerrada'])
      expect((await operacion({ estado })).estado).toBe(estado);
    expect(primera.solicitud_checkout).toEqual({
      mode: 'payment',
      line_items: [],
      metadata: { modulo: 'donaciones' },
    });
    expect((await operacion()).sesion_checkout_id).toBeNull();
    expect((await operacion()).sesion_checkout_id).toBeNull();
    expect(
      (
        await cliente.query(
          `SELECT data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name='operaciones_pago' AND column_name='solicitud_checkout'`,
          [esquema],
        )
      ).rows[0].data_type,
    ).toBe('jsonb');
  });
  it('eventos deduplica por ID, valida estados y conserva tiempo externo y código nullable', async () => {
    for (const [i, estado] of ['procesado', 'ignorado', 'incidencia'].entries())
      await cliente.query(
        `INSERT INTO eventos_pasarela (pasarela_evento_id,tipo,objeto_id,ocurrido_en,estado) VALUES ($1,'invoice.paid','in_test','2026-11-01T10:00:00Z',$2)`,
        ['evt_' + i, estado],
      );
    await rechaza(
      () =>
        cliente.query(
          `INSERT INTO eventos_pasarela (pasarela_evento_id,tipo,objeto_id,ocurrido_en,estado) VALUES ('evt_0','invoice.paid','in_test',now(),'procesado')`,
        ),
      '23505',
    );
    await rechaza(() => cliente.query(`UPDATE eventos_pasarela SET estado='pendiente'`), '23514');
    expect(
      (
        await cliente.query(
          `SELECT error_codigo,ocurrido_en FROM eventos_pasarela WHERE pasarela_evento_id='evt_0'`,
        )
      ).rows[0],
    ).toEqual({ error_codigo: null, ocurrido_en: new Date('2026-11-01T10:00:00Z') });
  });
  it('verificaciones exige token único y referencias válidas, con consumo inicialmente nullable', async () => {
    const sql = `INSERT INTO verificaciones_donante (usuario_id,donante_id,token_hash,expira_en) VALUES ($1,$2,$3,now()+interval '30 minutes') RETURNING *`;
    const primero = (await cliente.query(sql, [usuarioId, donanteId, 'b'.repeat(64)])).rows[0];
    expect(primero.usado_en).toBeNull();
    await rechaza(() => cliente.query(sql, [usuarioId, donanteId, 'b'.repeat(64)]), '23505');
    await rechaza(() => cliente.query(sql, ['-1', donanteId, 'c'.repeat(64)]), '23503');
    await rechaza(() => cliente.query(sql, [usuarioId, '-1', 'c'.repeat(64)]), '23503');
  });
  it('correos deduplica por aportación/tipo, exige JSONB y valida estados e intentos', async () => {
    const aporte = await aportacion();
    const sql = `INSERT INTO correos_aportacion (aportacion_id,tipo,resumen,estado) VALUES ($1,$2,$3,'pendiente') RETURNING *`;
    const primero = (
      await cliente.query(sql, [
        aporte.id,
        'confirmacion',
        { referencia: aporte.referencia, importe: '20.00' },
      ])
    ).rows[0];
    expect(primero.intentos).toBe(0);
    expect(primero.enviado_en).toBeNull();
    expect(primero.reservado_hasta).toBeNull();
    await rechaza(() => cliente.query(sql, [aporte.id, 'confirmacion', {}]), '23505');
    await cliente.query(sql, [aporte.id, 'fallo_cuota', {}]);
    await rechaza(() => cliente.query(sql, [aporte.id, 'otro', {}]), '23514');
    await rechaza(() => cliente.query(sql, ['-1', 'confirmacion', {}]), '23503');
    await rechaza(() => cliente.query(sql, [aporte.id, 'confirmacion', null]), '23502');
    await rechaza(() => cliente.query(`UPDATE correos_aportacion SET intentos=-1`), '23514');
    await rechaza(() => cliente.query(`UPDATE correos_aportacion SET estado='desconocido'`), '23514');
    for (const estado of ['pendiente', 'enviando', 'enviado', 'fallido'])
      await cliente.query(`UPDATE correos_aportacion SET estado=$1`, [estado]);
    const json = (
      await cliente.query(
        `SELECT data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name='correos_aportacion' AND column_name='resumen'`,
        [esquema],
      )
    ).rows[0];
    expect(json.data_type).toBe('jsonb');
  });
});

describe('HU-01 · soporte de integración T019', () => {
  let entorno;
  let directorio;
  beforeAll(async () => {
    entorno = await crearEntornoPruebas();
    directorio = await mkdtemp(join(tmpdir(), 'hu01-stripe-'));
  }, 30000);
  afterAll(async () => {
    try {
      if (entorno) await entorno.cerrar();
    } finally {
      if (directorio) {
        const destino = resolve(directorio);
        if (dirname(destino) !== resolve(tmpdir()) || !basename(destino).startsWith('hu01-stripe-'))
          throw new Error('Directorio temporal inesperado.');
        await rm(destino, { recursive: true });
      }
    }
  });
  it('falla sin configuración o con una base distinta, sin omitir pruebas', async () => {
    const anterior = {
      DATABASE_URL: process.env.DATABASE_URL,
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    };
    try {
      delete process.env.TEST_DATABASE_URL;
      await expect(crearEntornoPruebas()).rejects.toThrow('Selecciona');
      process.env.TEST_DATABASE_URL = 'postgres://ong@127.0.0.1/ong';
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      await expect(crearEntornoPruebas()).rejects.toThrow('Selecciona');
    } finally {
      Object.assign(process.env, anterior);
    }
  });
  it('crea usuarios autenticables, donantes propios/ajenos e invitado y sesiones separadas', async () => {
    const fixtures = await entorno.crearFixtures();
    expect(fixtures.usuarios).toHaveLength(2);
    expect(typeof fixtures.usuarios[0].id).toBe('string');
    expect(await bcrypt.compare(contrasenaPruebas, fixtures.usuarios[0].hash_contrasena)).toBe(true);
    expect(fixtures.donantes[0].usuario_id).toBe(fixtures.usuarios[0].id);
    expect(fixtures.invitado.usuario_id).toBeNull();
    expect(fixtures.aportaciones).toHaveLength(3);
    const a = await entorno.crearSesion({
      usuarioId: fixtures.usuarios[0].id,
      donaciones: { permisos: { A: { creadoEn: 1, venceEn: 28800001 } } },
    });
    const b = await entorno.crearSesion({ usuarioId: fixtures.usuarios[1].id });
    expect(a.id).not.toBe(b.id);
    expect((await entorno.leerSesion(a.id)).donaciones.permisos).toHaveProperty('A');
    expect((await entorno.leerSesion(b.id)).donaciones).toBeUndefined();
  });
  it('controla dos conexiones independientes y rollback real sin afectar public', async () => {
    const a = await entorno.conectar();
    const b = await entorno.conectar();
    try {
      const ids = await Promise.all([
        a.query('SELECT pg_backend_pid() AS id,current_schema() AS esquema'),
        b.query('SELECT pg_backend_pid() AS id,current_schema() AS esquema'),
      ]);
      expect(ids[0].rows[0].id).not.toBe(ids[1].rows[0].id);
      expect(ids[0].rows[0].esquema).toBe(entorno.esquema);
      await a.query('BEGIN');
      await a.query("INSERT INTO proyectos (nombre) VALUES ('Solo transaccion')");
      expect(
        (await b.query("SELECT count(*)::int AS total FROM proyectos WHERE nombre='Solo transaccion'"))
          .rows[0].total,
      ).toBe(0);
      await a.query('ROLLBACK');
      expect(
        (await b.query("SELECT count(*)::int AS total FROM proyectos WHERE nombre='Solo transaccion'"))
          .rows[0].total,
      ).toBe(0);
      await a.query('BEGIN');
      try {
        await a.query('DROP TABLE eventos_pasarela');
        await expect(verificarEsquemaPruebas(a, entorno.esquema)).rejects.toThrow('Falta tabla');
      } finally {
        await a.query('ROLLBACK');
      }
    } finally {
      a.release();
      b.release();
    }
  });
  it('conserva recursos Acacia correlacionados y fresh para cada fixture', () => {
    const recursos = recursosCanonicos('DON-TEST');
    expect(recursos.factura.payment_intent).toBe(recursos.pago.id);
    expect(recursos.pago.invoice).toBe(recursos.factura.id);
    expect(recursos.sesion.subscription).toBe(recursos.suscripcion.id);
    expect(recursos.pago.amount_received).toBe(2000);
    recursos.pago.status = 'requires_payment_method';
    expect(recursosCanonicos('DON-TEST').pago.status).toBe('succeeded');
  });
  it('persiste cuerpo y respuesta por clave, sin mezclar otras solicitudes', async () => {
    const simulador = crearSimuladorStripe(directorio);
    const cuerpo = { mode: 'payment', metadata: { referencia: 'DON-TEST' }, line_items: [] };
    const primero = await simulador.crearSesion(cuerpo, { idempotencyKey: 'misma' });
    const mismo = await crearSimuladorStripe(directorio).crearSesion(
      { line_items: [], metadata: { referencia: 'DON-TEST' }, mode: 'payment' },
      { idempotencyKey: 'misma' },
    );
    expect(mismo).toEqual(primero);
    await expect(
      simulador.crearSesion({ ...cuerpo, mode: 'subscription' }, { idempotencyKey: 'misma' }),
    ).rejects.toThrow('incompatible');
    expect((await simulador.crearSesion(cuerpo, { idempotencyKey: 'otra' })).id).not.toBe(primero.id);
  });
  it('dos procesos nuevos conservan sesión/base/secreto y comparten el simulador por clave', async () => {
    const sesion = await entorno.crearSesion({ usuarioId: '9007199254740993' });
    const codigo = `
      import pg from 'pg';
      import {createHash} from 'node:crypto';
      const {crearSimuladorStripe}=await import(process.env.HU01_SOPORTE);
      const cliente=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
      try {
        await cliente.connect();
        const base=(await cliente.query('SELECT current_database() AS base')).rows[0].base;
        if(base!=='ong_test_hu01')throw new Error('Base inesperada');
        const sesion=(await cliente.query('SELECT sess FROM sesiones WHERE sid=$1',[process.env.HU01_SID])).rows[0].sess;
        const respuesta=await crearSimuladorStripe(process.env.HU01_DIRECTORIO).crearSesion({mode:'payment'},{idempotencyKey:process.env.HU01_CLAVE});
        console.log(JSON.stringify({id:respuesta.id,usuarioId:sesion.usuarioId,secretoHash:createHash('sha256').update(process.env.SESSION_SECRET).digest('hex')}));
      } finally {await cliente.end();}
    `;
    const ejecutarHijo = (clave = 'reinicio') =>
      ejecutar(process.execPath, ['--input-type=module', '-e', codigo], {
        cwd: raizBackend,
        windowsHide: true,
        timeout: 15000,
        env: {
          ...process.env,
          TEST_DATABASE_URL: entorno.urlConexion,
          DATABASE_URL: entorno.urlConexion,
          SESSION_SECRET: entorno.secretoSesion,
          HU01_CLAVE: clave,
          HU01_SID: sesion.id,
          HU01_DIRECTORIO: directorio,
          HU01_SOPORTE: new URL('./pruebas/soporte.js', import.meta.url).href,
        },
      });
    const uno = JSON.parse((await ejecutarHijo()).stdout);
    const dos = JSON.parse((await ejecutarHijo()).stdout);
    expect(dos).toEqual(uno);
    expect(dos.usuarioId).toBe('9007199254740993');
    expect(dos.secretoHash).toBe(createHash('sha256').update(entorno.secretoSesion).digest('hex'));
    const concurrentes = await Promise.all([ejecutarHijo('carrera'), ejecutarHijo('carrera')]);
    expect(JSON.parse(concurrentes[0].stdout)).toEqual(JSON.parse(concurrentes[1].stdout));
    expect(JSON.parse(concurrentes[0].stdout).id).not.toBe(uno.id);
  }, 30000);
});
