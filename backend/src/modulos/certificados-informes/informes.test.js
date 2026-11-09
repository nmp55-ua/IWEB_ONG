// Pruebas de HU-04 (informes) contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   DATABASE_URL=<ong_test> TEST_DATABASE_URL=<ong_test> npx vitest run src/modulos/certificados-informes
// Vacían aportaciones, donantes, actividades, inscripciones y voluntarios de esa base: nunca uses la
// de desarrollo. Proyectos y usuarios no se vacían (son comunes): se crean con nombres únicos.
// «Ahora» se inyecta en el servicio; la API usa AHORA_SIMULADO.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA = '2027-01-15T10:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-004';
const VACIAR =
  'TRUNCATE certificados_fiscales, inscripciones, actividades, aportaciones, suscripciones_socio, donantes, voluntarios RESTART IDENTITY CASCADE';

// NIF válido a partir de un número de 8 cifras.
const nif = (numero) => `${String(numero).padStart(8, '0')}${'TRWAGMYFPDXBNJZSQVHLCKE'[numero % 23]}`;

describe.skipIf(!URL_PRUEBAS)('HU-04 · informes', () => {
  let pool;
  let app;
  let crearServicio;
  let servicio;
  const usuarios = {};
  let contador = 0;
  const proyectosCreados = [];
  const unico = () => `${Date.now().toString(36)}-${++contador}`;

  async function proyecto(nombre, activo = true) {
    const { rows } = await pool.query(
      'INSERT INTO proyectos (nombre, activo) VALUES ($1, $2) RETURNING id::text AS id, nombre',
      [`${nombre} ${unico()}`, activo],
    );
    proyectosCreados.push(rows[0].id);
    return rows[0];
  }

  async function donante() {
    const numero = 40000000 + ++contador;
    const { rows } = await pool.query(
      `INSERT INTO donantes (nombre, apellidos, nif_nie, correo, direccion)
       VALUES ('Persona', 'Donante Informe', $1, $2, 'Calle Privada 7') RETURNING id::text AS id, nif_nie AS "nifNie", correo`,
      [nif(numero), `donante${numero}@prueba.test`],
    );
    return rows[0];
  }

  async function aportacion({ donanteId, proyectoId = null, modalidad = 'puntual', importe, estado = 'confirmada', fechaCobro }) {
    let suscripcion = null;
    if (modalidad === 'cuota_socio') {
      const { rows } = await pool.query(
        `INSERT INTO suscripciones_socio (donante_id, proyecto_id, importe, periodicidad, estado, fecha_alta)
         VALUES ($1, $2, $3::numeric, 'mensual', 'activa', $4) RETURNING id`,
        [donanteId, proyectoId, importe, fechaCobro],
      );
      suscripcion = rows[0].id;
    }
    await pool.query(
      `INSERT INTO aportaciones (donante_id, proyecto_id, suscripcion_socio_id, modalidad, importe, estado, fecha_cobro, referencia)
       VALUES ($1, $2, $3, $4, $5::numeric, $6, $7, $8)`,
      [donanteId, proyectoId, suscripcion, modalidad, importe, estado, estado === 'confirmada' ? fechaCobro : null, `HU04-T-${unico()}`],
    );
  }

  async function actividad({ proyectoId, inicio, fin, estado = 'publicada' }) {
    const { rows } = await pool.query(
      `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, estado, creada_por)
       VALUES ($1, $2, 'Prueba de HU-04', $3, $4, 'Alicante', 10, $5, $6) RETURNING id::text AS id`,
      [proyectoId, `Actividad ${unico()}`, inicio, fin ?? new Date(new Date(inicio).getTime() + 2 * 3600_000), estado, usuarios.coordinador],
    );
    return rows[0];
  }

  async function voluntario() {
    const { rows: u } = await pool.query(
      `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, 'x', 'Prueba', ARRAY['voluntario']) RETURNING id`,
      [`inf-vol-${unico()}@prueba.test`],
    );
    const { rows } = await pool.query(
      `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono)
       VALUES ($1, 'Voluntaria', 'Secreta Informe', 'vol-secreta@prueba.test', '600 000 000') RETURNING id::text AS id`,
      [u[0].id],
    );
    return rows[0];
  }

  async function inscripcion(voluntarioId, actividadId) {
    const { rows } = await pool.query(
      `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_confirmacion)
       VALUES ($1, $2, 'confirmada', true, now()) RETURNING id::text AS id`,
      [voluntarioId, actividadId],
    );
    return rows[0];
  }

  async function entrar(nombre) {
    const agente = request.agent(app);
    await agente
      .post('/api/auth/sesion')
      .send({ correo: `inf-${nombre}@prueba.test`, contrasena: CONTRASENA })
      .expect(200);
    return agente;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA;
    process.env.NODE_ENV = 'test';
    ({ pool } = await import('../../db/pool.js'));
    ({ crearServicio } = await import('./servicio.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });

    const hash = await bcrypt.hash(CONTRASENA, 4);
    for (const [nombre, roles] of [
      ['admin', ['administrador']],
      ['donante', ['donante']],
      ['coordinador', ['coordinador']],
    ]) {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true
         RETURNING id`,
        [`inf-${nombre}@prueba.test`, hash, roles],
      );
      usuarios[nombre] = rows[0].id;
    }
  });

  beforeEach(async () => {
    await pool.query(VACIAR);
    servicio = crearServicio({ ahora: () => new Date(AHORA) });
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query(VACIAR);
    await pool.query('DELETE FROM proyectos WHERE id = ANY($1::bigint[])', [proyectosCreados]);
    await pool.query("DELETE FROM usuarios WHERE correo LIKE 'inf-%@prueba.test'");
    await pool.end();
  });

  describe('consultas (repositorio)', () => {
    it('sin datos, solo devuelven la fila de total con ceros', async () => {
      const repositorio = await import('./repositorio.js');
      const rango = { desde: new Date('2026-01-01T00:00:00+01:00'), hasta: new Date('2027-01-01T00:00:00+01:00') };
      expect(await repositorio.recaudacionInforme({ ...rango, agrupacion: 'trimestre' })).toEqual([
        { nivel: 3, periodo: null, proyectoId: null, recaudadoPuntual: '0.00', recaudadoCuotas: '0.00', recaudadoTotal: '0.00', aportaciones: 0 },
      ]);
      expect(await repositorio.voluntariadoInforme({ ...rango, ahora: new Date(AHORA) })).toEqual([
        { nivel: 3, periodo: null, proyectoId: null, actividades: 0, voluntarios: 0, horas: '0.00' },
      ]);
    });
  });
});
