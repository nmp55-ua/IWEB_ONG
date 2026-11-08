// Pruebas de HU-03 (certificado fiscal) contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   DATABASE_URL=<ong_test> TEST_DATABASE_URL=<ong_test> npx vitest run src/modulos/certificados-informes
// Vacían donantes, aportaciones y certificados de esa base: nunca uses la de desarrollo.
// «Ahora» se inyecta en el servicio; la API usa AHORA_SIMULADO (2026-01-02). El correo se simula.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA_API = '2026-01-02T10:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-003';

vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));

// NIF válido a partir de un número de 8 cifras.
const nif = (numero) => `${String(numero).padStart(8, '0')}${'TRWAGMYFPDXBNJZSQVHLCKE'[numero % 23]}`;

describe.skipIf(!URL_PRUEBAS)('HU-03 · certificado fiscal', () => {
  let pool;
  let app;
  let crearServicio;
  const usuarios = {};
  let reloj;
  let correo;
  let servicio;
  let contadorReferencias = 0;
  let contadorNif = 10000000;

  async function donante({ cuenta = null, correoDonante, nombre = 'Ana', apellidos = 'Prueba Certificado' } = {}) {
    const numero = ++contadorNif;
    const { rows } = await pool.query(
      `INSERT INTO donantes (usuario_id, nombre, apellidos, nif_nie, correo, direccion)
       VALUES ($1, $2, $3, $4, $5, 'Calle de Prueba 1') RETURNING id::text AS id, nif_nie`,
      [cuenta ? usuarios[cuenta] : null, nombre, apellidos, nif(numero), correoDonante ?? `d${numero}@prueba.test`],
    );
    return rows[0];
  }

  async function aportacion(donanteId, importe, fechaCobro, estado = 'confirmada') {
    const { rows } = await pool.query(
      `INSERT INTO aportaciones (donante_id, modalidad, importe, estado, fecha_cobro, referencia)
       VALUES ($1, 'puntual', $2::numeric, $3, $4, $5) RETURNING id`,
      [donanteId, importe, estado, estado === 'confirmada' ? fechaCobro : null, `HU03-T-${++contadorReferencias}`],
    );
    return rows[0].id;
  }

  async function certificados(donanteId) {
    const { rows } = await pool.query(
      `SELECT id::text, ejercicio, importe_total::text AS total, to_char(fecha_emision, 'YYYY-MM-DD') AS fecha,
              codigo_verificacion AS codigo
         FROM certificados_fiscales WHERE donante_id = $1 ORDER BY ejercicio`,
      [donanteId],
    );
    return rows;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA_API;
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'http://ong.test';
    ({ pool } = await import('../../db/pool.js'));
    ({ crearServicio } = await import('./servicio.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });

    const hash = await bcrypt.hash(CONTRASENA, 4);
    const cuentas = [
      ['ana', ['donante']],
      ['otro', ['donante']],
      ['sinvinculo', ['donante']],
      ['coordinador', ['coordinador']],
    ];
    for (const [nombre, roles] of cuentas) {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true
         RETURNING id`,
        [`cert-${nombre}@prueba.test`, hash, roles],
      );
      usuarios[nombre] = rows[0].id;
    }
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE certificados_fiscales, aportaciones, suscripciones_socio, donantes RESTART IDENTITY CASCADE');
    reloj = '2026-01-01T00:05:00+01:00';
    correo = vi.fn(async () => true);
    servicio = crearServicio({ ahora: () => new Date(reloj), enviarCorreo: correo });
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query('TRUNCATE certificados_fiscales, aportaciones, suscripciones_socio, donantes RESTART IDENTITY CASCADE');
    await pool.query("DELETE FROM usuarios WHERE correo LIKE 'cert-%@prueba.test'");
    await pool.end();
  });

  describe('emisión (FR-001, FR-002)', () => {
    it('escenario 1: 50 € + 30 € confirmadas en 2025 → certificado de 2025 por 80.00', async () => {
      const ana = await donante({ cuenta: 'ana' });
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      await aportacion(ana.id, '30.00', '2025-11-10T18:30:00+01:00');

      const r = await servicio.reconciliarEjercicio(2025);

      expect(r).toEqual({ ejercicio: 2025, emitidos: 1, regenerados: 0, correosFallidos: 0 });
      const [c] = await certificados(ana.id);
      expect(c).toMatchObject({ ejercicio: 2025, total: '80.00', fecha: '2026-01-01' });
      expect(c.codigo).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    });

    it('escenario 2 y caso límite: el 31/12 a las 23:59 de Madrid cuenta; el 01/01 a las 00:00 no', async () => {
      const ana = await donante();
      await aportacion(ana.id, '10.00', '2025-12-31T23:59:00+01:00');
      await aportacion(ana.id, '20.00', '2026-01-01T00:00:00+01:00');
      await aportacion(ana.id, '40.00', '2024-12-31T23:59:59+01:00');

      await servicio.reconciliarEjercicio(2025);

      expect((await certificados(ana.id))[0].total).toBe('10.00');
    });

    it('pendientes, rechazadas y canceladas no suman', async () => {
      const ana = await donante();
      await aportacion(ana.id, '25.00', '2025-05-01T12:00:00+02:00');
      await aportacion(ana.id, '15.00', null, 'pendiente');
      await aportacion(ana.id, '12.00', null, 'rechazada');
      await aportacion(ana.id, '7.00', null, 'cancelada');

      await servicio.reconciliarEjercicio(2025);

      expect((await certificados(ana.id))[0].total).toBe('25.00');
    });

    it('suma al céntimo, sin coma flotante', async () => {
      const ana = await donante();
      // 1,10 + 1,20 da 2,3000000000000003 en coma flotante; el total pasa además del máximo de una aportación.
      for (const importe of ['1.10', '1.20', '999999.99', '999999.99']) {
        await aportacion(ana.id, importe, '2025-06-01T12:00:00+02:00');
      }
      await servicio.reconciliarEjercicio(2025);
      expect((await certificados(ana.id))[0].total).toBe('2000002.28');
    });

    it('sin aportaciones confirmadas no hay certificado', async () => {
      const ana = await donante();
      await aportacion(ana.id, '15.00', null, 'pendiente');
      const r = await servicio.reconciliarEjercicio(2025);
      expect(r.emitidos).toBe(0);
      expect(await certificados(ana.id)).toEqual([]);
    });

    it('FR-006: el ejercicio en curso o futuro no se puede generar', async () => {
      await expect(servicio.reconciliarEjercicio(2026)).rejects.toMatchObject({
        estado: 409,
        codigo: 'EJERCICIO_NO_CERRADO',
        message: 'El certificado de 2026 se generará a partir del 01/01/2027.',
      });
      await expect(servicio.reconciliarEjercicio(2027)).rejects.toMatchObject({ codigo: 'EJERCICIO_NO_CERRADO' });
    });

    it('es idempotente: repetir no cambia nada ni envía correos', async () => {
      const ana = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      await servicio.reconciliarEjercicio(2025);
      const antes = await certificados(ana.id);
      correo.mockClear();

      reloj = '2026-01-05T12:00:00+01:00';
      const r = await servicio.reconciliarEjercicio(2025);

      expect(r).toEqual({ ejercicio: 2025, emitidos: 0, regenerados: 0, correosFallidos: 0 });
      expect(await certificados(ana.id)).toEqual(antes);
      expect(correo).not.toHaveBeenCalled();
    });

    it('SC-002: todos los Donantes con confirmadas del ejercicio tienen su certificado', async () => {
      for (let i = 0; i < 5; i++) {
        const d = await donante();
        await aportacion(d.id, `${10 + i}.00`, '2025-07-01T12:00:00+02:00');
      }
      const sinNada = await donante();
      await aportacion(sinNada.id, '5.00', '2026-02-01T12:00:00+01:00');

      await servicio.reconciliarEjercicio(2025);

      const { rows } = await pool.query(
        `SELECT
           (SELECT count(DISTINCT donante_id) FROM aportaciones WHERE estado = 'confirmada'
              AND fecha_cobro >= '2025-01-01T00:00:00+01:00' AND fecha_cobro < '2026-01-01T00:00:00+01:00')::int AS donantes,
           (SELECT count(*) FROM certificados_fiscales WHERE ejercicio = 2025)::int AS certificados`,
      );
      expect(rows[0]).toEqual({ donantes: 5, certificados: 5 });
    });

    it('reconciliarCerrados recorre todos los ejercicios cerrados desde el primer cobro', async () => {
      reloj = '2026-03-01T12:00:00+01:00';
      const ana = await donante();
      await aportacion(ana.id, '25.00', '2023-05-20T12:00:00+02:00');
      await aportacion(ana.id, '30.00', '2025-05-20T12:00:00+02:00');
      await aportacion(ana.id, '99.00', '2026-02-01T12:00:00+01:00');

      const r = await servicio.reconciliarCerrados();

      expect(r.map((x) => [x.ejercicio, x.emitidos])).toEqual([
        [2023, 1],
        [2024, 0],
        [2025, 1],
      ]);
      expect((await certificados(ana.id)).map((c) => [c.ejercicio, c.total])).toEqual([
        [2023, '25.00'],
        [2025, '30.00'],
      ]);
    });

    it('reconciliarCerrados sin cobros confirmados no hace nada', async () => {
      expect(await servicio.reconciliarCerrados()).toEqual([]);
    });
  });

  describe('confirmación tardía (FR-008)', () => {
    it('escenario 8: regenera la misma fila con nuevo total, fecha y código', async () => {
      const ana = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      await aportacion(ana.id, '30.00', '2025-11-10T18:30:00+01:00');
      const tardia = await aportacion(ana.id, '20.00', null, 'pendiente');
      await servicio.reconciliarEjercicio(2025);
      const [antes] = await certificados(ana.id);

      reloj = '2026-01-02T10:00:00+01:00';
      await pool.query(
        "UPDATE aportaciones SET estado = 'confirmada', fecha_cobro = '2025-12-31T23:59:00+01:00' WHERE id = $1",
        [tardia],
      );
      const r = await servicio.reconciliarEjercicio(2025);

      expect(r).toEqual({ ejercicio: 2025, emitidos: 0, regenerados: 1, correosFallidos: 0 });
      const lista = await certificados(ana.id);
      expect(lista).toHaveLength(1);
      expect(lista[0]).toMatchObject({ id: antes.id, total: '100.00', fecha: '2026-01-02' });
      expect(lista[0].codigo).not.toBe(antes.codigo);
    });

    it('si aún no tenía certificado de ese ejercicio, lo emite', async () => {
      reloj = '2026-02-10T12:00:00+01:00';
      const ana = await donante();
      const tardia = await aportacion(ana.id, '20.00', null, 'pendiente');
      expect((await servicio.reconciliarEjercicio(2025)).emitidos).toBe(0);

      await pool.query(
        "UPDATE aportaciones SET estado = 'confirmada', fecha_cobro = '2025-12-31T20:00:00+01:00' WHERE id = $1",
        [tardia],
      );
      const r = await servicio.reconciliarEjercicio(2025);

      expect(r.emitidos).toBe(1);
      expect((await certificados(ana.id))[0]).toMatchObject({ total: '20.00', fecha: '2026-02-10' });
      expect(correo.mock.calls[0][0].asunto).toBe('Tu certificado fiscal de 2025 está disponible');
    });

    it('una aportación que pasa a rechazada o cancelada no regenera ni envía correo', async () => {
      const ana = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      const otra = await aportacion(ana.id, '20.00', null, 'pendiente');
      await servicio.reconciliarEjercicio(2025);
      const antes = await certificados(ana.id);
      correo.mockClear();

      await pool.query("UPDATE aportaciones SET estado = 'cancelada' WHERE id = $1", [otra]);
      const r = await servicio.reconciliarEjercicio(2025);

      expect(r).toMatchObject({ emitidos: 0, regenerados: 0 });
      expect(await certificados(ana.id)).toEqual(antes);
      expect(correo).not.toHaveBeenCalled();
    });

    it('dos reconciliaciones simultáneas del mismo ejercicio solo emiten y avisan una vez', async () => {
      const ana = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');

      const [a, b] = await Promise.all([servicio.reconciliarEjercicio(2025), servicio.reconciliarEjercicio(2025)]);

      expect(a.emitidos + b.emitidos).toBe(1);
      expect(a.regenerados + b.regenerados).toBe(0);
      expect(correo).toHaveBeenCalledTimes(1);
      expect(await certificados(ana.id)).toHaveLength(1);
    });

    it('si el código generado ya existe, lo intenta con otro', async () => {
      const ana = await donante();
      const pablo = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      await aportacion(pablo.id, '30.00', '2025-03-15T10:00:00+01:00');
      const codigos = ['AAAA-AAAA-AAAA-AAAA', 'AAAA-AAAA-AAAA-AAAA', 'BBBB-BBBB-BBBB-BBBB'];
      const conChoque = crearServicio({ ahora: () => new Date(reloj), enviarCorreo: correo, generarCodigo: () => codigos.shift() });

      expect((await conChoque.reconciliarEjercicio(2025)).emitidos).toBe(2);
      const { rows } = await pool.query('SELECT codigo_verificacion FROM certificados_fiscales ORDER BY donante_id');
      expect(rows.map((f) => f.codigo_verificacion)).toEqual(['AAAA-AAAA-AAAA-AAAA', 'BBBB-BBBB-BBBB-BBBB']);
    });
  });

  describe('correo de aviso (FR-009, FR-012)', () => {
    it('escenario 9: avisa al correo del Donante al emitir y al regenerar, sin adjuntos', async () => {
      const ana = await donante({ cuenta: 'ana', correoDonante: 'ana.donante@prueba.test' });
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      const tardia = await aportacion(ana.id, '20.00', null, 'pendiente');
      await servicio.reconciliarEjercicio(2025);
      await pool.query(
        "UPDATE aportaciones SET estado = 'confirmada', fecha_cobro = '2025-12-31T12:00:00+01:00' WHERE id = $1",
        [tardia],
      );
      await servicio.reconciliarEjercicio(2025);

      expect(correo).toHaveBeenCalledTimes(2);
      const [emision, regeneracion] = correo.mock.calls.map((c) => c[0]);
      expect(emision.para).toBe('ana.donante@prueba.test');
      expect(emision.asunto).toBe('Tu certificado fiscal de 2025 está disponible');
      expect(emision.texto).toContain('http://ong.test/mis-certificados');
      expect(emision.texto).not.toContain('/donar/vincular');
      expect(regeneracion.asunto).toBe('Tu certificado fiscal de 2025 se ha actualizado');
      expect(regeneracion.texto).toContain('El código de verificación anterior ya no es válido');
      expect(Object.keys(emision).sort()).toEqual(['asunto', 'para', 'texto']);
      expect(emision.texto).not.toContain(ana.nif_nie);
    });

    it('escenario 12: sin cuenta vinculada también se emite y el correo invita a vincular', async () => {
      const sinCuenta = await donante({ correoDonante: 'sin.cuenta@prueba.test' });
      await aportacion(sinCuenta.id, '45.00', '2025-06-01T09:00:00+02:00');

      const r = await servicio.reconciliarEjercicio(2025);

      expect(r.emitidos).toBe(1);
      expect(correo.mock.calls[0][0].para).toBe('sin.cuenta@prueba.test');
      expect(correo.mock.calls[0][0].texto).toContain('http://ong.test/donar/vincular');
    });

    it('si falla el envío, el certificado se mantiene y se cuenta el fallo', async () => {
      const ana = await donante();
      const pablo = await donante();
      await aportacion(ana.id, '50.00', '2025-03-15T10:00:00+01:00');
      await aportacion(pablo.id, '30.00', '2025-03-15T10:00:00+01:00');
      correo.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('SMTP caído'));
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      const r = await servicio.reconciliarEjercicio(2025);

      expect(r).toEqual({ ejercicio: 2025, emitidos: 2, regenerados: 0, correosFallidos: 2 });
      expect(await certificados(ana.id)).toHaveLength(1);
      expect(await certificados(pablo.id)).toHaveLength(1);
      expect(error).toHaveBeenCalled();
      error.mockRestore();
    });
  });
});
