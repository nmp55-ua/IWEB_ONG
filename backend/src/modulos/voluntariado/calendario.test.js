// Pruebas de HU-06 (calendario del voluntario) contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   TEST_DATABASE_URL=postgres://ong:ong_dev@localhost:5432/ong_test npm test
// Vacían actividades, voluntarios e inscripciones de esa base: nunca uses la de desarrollo.
// Los módulos voluntariado y actividades son los reales; el correo se simula (specs/spec-006/research.md, R8).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA = '2026-11-01T12:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-006';

vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));

describe.skipIf(!URL_PRUEBAS)('HU-06 · calendario del voluntario', () => {
  let app;
  let pool;
  let servicioActividades;
  const usuarios = {};
  let proyecto;

  async function entrar(nombre) {
    const agente = request.agent(app);
    await agente
      .post('/api/auth/sesion')
      .send({ correo: `cal-${nombre}@prueba.test`, contrasena: CONTRASENA })
      .expect(200);
    return agente;
  }

  let contadorTitulos = 0;
  async function actividad({
    inicio = '2026-12-01T10:00:00+01:00',
    fin = '2026-12-01T12:00:00+01:00',
    plazas = 10,
    estado = 'publicada',
    titulo = `Calendario ${++contadorTitulos}`,
  } = {}) {
    const { rows } = await pool.query(
      `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, requisitos, estado, creada_por)
       VALUES ($1, $2, 'Prueba.', $3, $4, 'Aquí', $5, 'Traer agua.', $6, $7) RETURNING id`,
      [proyecto, titulo, inicio, fin, plazas, estado, usuarios.coordinador],
    );
    return Number(rows[0].id);
  }

  // Inscripción directa en la base, para preparar situaciones (en orden de llegada).
  async function inscripcion(nombre, actividadId, estado = 'confirmada') {
    const { rows } = await pool.query(
      `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_inscripcion,
         fecha_confirmacion, fecha_cancelacion)
       SELECT v.id, $2, $3::text, true, clock_timestamp(),
         CASE WHEN $3::text = 'confirmada' THEN now() END, CASE WHEN $3::text = 'cancelada' THEN now() END
       FROM voluntarios v WHERE v.usuario_id = $1 RETURNING id`,
      [usuarios[nombre], actividadId, estado],
    );
    return Number(rows[0].id);
  }

  async function calendario(agente, consulta = '') {
    const res = await agente.get(`/api/yo/calendario${consulta}`).expect(200);
    return res.body;
  }

  const titulos = (cuerpo) => cuerpo.datos.map((e) => e.actividad.titulo);

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA;
    process.env.NODE_ENV = 'test';
    ({ pool } = await import('../../db/pool.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });
    servicioActividades = await import('../actividades/servicio.js');

    await pool.query('TRUNCATE inscripciones, voluntarios, actividades RESTART IDENTITY CASCADE');
    const hash = await bcrypt.hash(CONTRASENA, 4);
    const cuentas = [
      ['coordinador', ['coordinador']],
      ['donante', ['donante']],
      ['sinperfil', ['voluntario']],
      ['v1', ['voluntario']],
      ['v2', ['voluntario']],
    ];
    for (const [nombre, roles] of cuentas) {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true
         RETURNING id`,
        [`cal-${nombre}@prueba.test`, hash, roles],
      );
      usuarios[nombre] = rows[0].id;
    }
    for (const nombre of ['v1', 'v2']) {
      await pool.query(
        `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono) VALUES ($1, $2, 'Prueba', $3, '600000000')`,
        [usuarios[nombre], nombre.toUpperCase(), `cal-${nombre}@prueba.test`],
      );
    }
    const { rows } = await pool.query(
      `INSERT INTO proyectos (nombre, activo) VALUES ('Prueba calendario', true)
       ON CONFLICT (nombre) DO UPDATE SET activo = true RETURNING id`,
    );
    proyecto = Number(rows[0].id);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await pool.query('TRUNCATE inscripciones, actividades RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe('ver mis próximas actividades (US1)', () => {
    it('401 sin sesión y 403 sin rol de voluntario', async () => {
      expect((await request(app).get('/api/yo/calendario')).status).toBe(401);
      const res = await (await entrar('donante')).get('/api/yo/calendario');
      expect(res.status).toBe(403);
      expect(res.body.error.codigo).toBe('SIN_PERMISO');
    });

    it('un voluntario que nunca se ha inscrito tiene el calendario vacío (escenario 1.4)', async () => {
      await inscripcion('v1', await actividad());
      expect(await calendario(await entrar('sinperfil'))).toEqual({ datos: [], total: 0 });
    });

    it('3 confirmadas y 1 en espera, por fecha, en hora de Madrid y con su posición (escenarios 1.1 y 1.3, SC-001)', async () => {
      const charla = await actividad({
        titulo: 'Charla',
        inicio: '2026-11-20T10:00:00+01:00',
        fin: '2026-11-20T12:00:00+01:00',
      });
      const analisis = await actividad({
        titulo: 'Análisis',
        inicio: '2026-11-20T17:00:00+01:00',
        fin: '2026-11-20T19:30:00+01:00',
      });
      const jornadas = await actividad({
        titulo: 'Jornadas',
        inicio: '2026-11-25T09:00:00+01:00',
        fin: '2026-11-27T14:00:00+01:00',
      });
      const visita = await actividad({
        titulo: 'Visita',
        inicio: '2026-11-21T11:00:00+01:00',
        fin: '2026-11-21T13:00:00+01:00',
        plazas: 1,
      });
      await inscripcion('v1', jornadas);
      await inscripcion('v1', analisis);
      const idCharla = await inscripcion('v1', charla);
      await inscripcion('v2', visita);
      const idVisita = await inscripcion('v1', visita, 'en_espera');

      const cuerpo = await calendario(await entrar('v1'));
      expect(titulos(cuerpo)).toEqual(['Charla', 'Análisis', 'Visita', 'Jornadas']);
      expect(cuerpo.total).toBe(4);
      expect(cuerpo.datos[0]).toEqual({
        id: idCharla,
        estado: 'confirmada',
        posicion: null,
        enCurso: false,
        actividad: {
          id: charla,
          titulo: 'Charla',
          descripcion: 'Prueba.',
          proyecto: { id: proyecto, nombre: 'Prueba calendario' },
          inicio: '2026-11-20T10:00:00+01:00',
          fin: '2026-11-20T12:00:00+01:00',
          lugar: 'Aquí',
          requisitos: 'Traer agua.',
        },
      });
      expect(cuerpo.datos[2]).toMatchObject({ id: idVisita, estado: 'en_espera', posicion: 1 });
      expect(cuerpo.datos[3].actividad.fin).toBe('2026-11-27T14:00:00+01:00');

      // SC-001: salen todas las activas del voluntario en actividades sin terminar, y ninguna más.
      const { rows } = await pool.query(
        `SELECT i.id FROM inscripciones i JOIN voluntarios v ON v.id = i.voluntario_id
         JOIN actividades a ON a.id = i.actividad_id
         WHERE v.usuario_id = $1 AND i.estado IN ('confirmada', 'en_espera') AND a.fin > $2`,
        [usuarios.v1, AHORA],
      );
      expect(cuerpo.datos.map((e) => e.id).sort()).toEqual(rows.map((r) => Number(r.id)).sort());
    });

    it('las horas salen en hora peninsular también en verano', async () => {
      await inscripcion(
        'v1',
        await actividad({ inicio: '2027-06-10T08:00:00Z', fin: '2027-06-10T10:00:00Z' }),
      );
      const [entrada] = (await calendario(await entrar('v1'))).datos;
      expect(entrada.actividad.inicio).toBe('2027-06-10T10:00:00+02:00');
    });

    it('no salen las terminadas (también la de esta mañana), las canceladas ni las de una actividad cancelada (escenario 1.2, FR-002)', async () => {
      await inscripcion(
        'v1',
        await actividad({
          titulo: 'Celebrada',
          inicio: '2026-10-28T10:00:00+01:00',
          fin: '2026-10-28T13:30:00+01:00',
        }),
      );
      await inscripcion(
        'v1',
        await actividad({
          titulo: 'Esta mañana',
          inicio: '2026-11-01T09:00:00+01:00',
          fin: '2026-11-01T11:00:00+01:00',
        }),
      );
      await inscripcion('v1', await actividad({ titulo: 'Inscripción cancelada' }), 'cancelada');
      const anulada = await actividad({ titulo: 'Cancelada por el coordinador' });
      await inscripcion('v1', anulada);
      await inscripcion('v1', await actividad({ titulo: 'Sigue' }));
      await servicioActividades.cancelar(anulada);

      expect(titulos(await calendario(await entrar('v1')))).toEqual(['Sigue']);
    });

    it('una actividad de varios días ya empezada sigue saliendo, marcada como en curso (clarify Q3)', async () => {
      await inscripcion(
        'v1',
        await actividad({
          titulo: 'Campamento',
          inicio: '2026-10-31T09:00:00+01:00',
          fin: '2026-11-02T14:00:00+01:00',
        }),
      );
      const [entrada] = (await calendario(await entrar('v1'))).datos;
      expect(entrada).toMatchObject({ enCurso: true, actividad: { titulo: 'Campamento' } });
    });

    it('cada voluntario ve solo el suyo, aunque pida el de otro (escenario 1.5, FR-006)', async () => {
      await inscripcion('v1', await actividad({ titulo: 'De v1' }));
      await inscripcion('v2', await actividad({ titulo: 'De v2' }));
      const { rows } = await pool.query('SELECT id FROM voluntarios WHERE usuario_id = $1', [usuarios.v2]);
      const agente = await entrar('v1');
      expect(titulos(await calendario(agente))).toEqual(['De v1']);
      expect(
        titulos(await calendario(agente, `?voluntarioId=${rows[0].id}&usuarioId=${usuarios.v2}`)),
      ).toEqual(['De v1']);
      expect(titulos(await calendario(await entrar('v2')))).toEqual(['De v2']);
    });

    it('con desde y hasta salen las que se solapan con esos días de Madrid, también entre dos meses (research R3)', async () => {
      const crear = async (titulo, inicio, fin) =>
        inscripcion('v1', await actividad({ titulo, inicio, fin }));
      await crear('Noviembre', '2026-11-20T10:00:00+01:00', '2026-11-20T12:00:00+01:00');
      await crear('Entre meses', '2026-11-30T18:00:00+01:00', '2026-12-02T12:00:00+01:00');
      await crear('Hasta medianoche', '2026-11-30T20:00:00+01:00', '2026-12-01T00:00:00+01:00');
      await crear('Diciembre', '2026-12-10T10:00:00+01:00', '2026-12-10T12:00:00+01:00');
      const agente = await entrar('v1');

      expect(titulos(await calendario(agente, '?desde=2026-11-01&hasta=2026-11-30'))).toEqual([
        'Noviembre',
        'Entre meses',
        'Hasta medianoche',
      ]);
      expect(titulos(await calendario(agente, '?desde=2026-12-01&hasta=2026-12-31'))).toEqual([
        'Entre meses',
        'Diciembre',
      ]);
      expect(titulos(await calendario(agente, '?desde=2026-12-03'))).toEqual(['Diciembre']);
      expect(titulos(await calendario(agente, '?hasta=2026-11-29'))).toEqual(['Noviembre']);
      expect(titulos(await calendario(agente, '?desde=&hasta='))).toHaveLength(4);
    });

    it('fechas mal escritas o «desde» posterior a «hasta» → 400 con el campo', async () => {
      const agente = await entrar('v1');
      const res = await agente.get('/api/yo/calendario?desde=2026-12-05&hasta=2026-12-01');
      expect(res.status).toBe(400);
      expect(res.body.error.campos.hasta).toBe('La fecha «desde» no puede ser posterior a «hasta».');
      for (const fecha of ['2026-02-31', '2026-13-01', '2026-00-10', 'mañana']) {
        const mal = await agente.get(`/api/yo/calendario?hasta=${encodeURIComponent(fecha)}`);
        expect(mal.status).toBe(400);
        expect(mal.body.error.campos.hasta).toBe('Fecha no válida.');
      }
      // Con una mal escrita, solo su error: no se dice además que «desde» es posterior a «hasta».
      const solo = await agente.get('/api/yo/calendario?desde=2026-13-01&hasta=2026-12-01');
      expect(solo.status).toBe(400);
      expect(solo.body.error.campos).toEqual({ desde: 'Fecha no válida.' });
    });
  });

  describe('gestionar una actividad desde el calendario (US2)', () => {
    it('al cancelar o salir de la lista de espera, la actividad deja de salir (escenario 2.2)', async () => {
      const confirmada = await inscripcion('v1', await actividad({ titulo: 'Confirmada' }));
      const llena = await actividad({ titulo: 'Llena', plazas: 1 });
      await inscripcion('v2', llena);
      const enEspera = await inscripcion('v1', llena, 'en_espera');
      await inscripcion('v1', await actividad({ titulo: 'Otra' }));
      const agente = await entrar('v1');

      await agente.patch(`/api/yo/inscripciones/${confirmada}`).send({ accion: 'cancelar' }).expect(200);
      await agente.patch(`/api/yo/inscripciones/${enEspera}`).send({ accion: 'cancelar' }).expect(200);
      expect(titulos(await calendario(agente))).toEqual(['Otra']);
    });

    it('quien estaba en espera sale confirmado cuando otro libera la plaza (escenario 2.3)', async () => {
      const llena = await actividad({ titulo: 'Llena', plazas: 1 });
      const deV2 = await inscripcion('v2', llena);
      await inscripcion('v1', llena, 'en_espera');
      const agente = await entrar('v1');
      expect((await calendario(agente)).datos[0]).toMatchObject({ estado: 'en_espera', posicion: 1 });

      await (
        await entrar('v2')
      )
        .patch(`/api/yo/inscripciones/${deV2}`)
        .send({ accion: 'cancelar' })
        .expect(200);
      expect((await calendario(agente)).datos[0]).toMatchObject({
        estado: 'confirmada',
        posicion: null,
        actividad: { titulo: 'Llena' },
      });
    });

    it('no se puede cancelar la inscripción de otro (404) y su calendario no cambia (escenario 1.5)', async () => {
      const deV2 = await inscripcion('v2', await actividad({ titulo: 'De v2' }));
      const res = await (
        await entrar('v1')
      )
        .patch(`/api/yo/inscripciones/${deV2}`)
        .send({ accion: 'cancelar' });
      expect(res.status).toBe(404);
      expect(titulos(await calendario(await entrar('v2')))).toEqual(['De v2']);
    });

    it('una actividad en curso no se puede cancelar (409) y sigue en el calendario', async () => {
      const id = await inscripcion(
        'v1',
        await actividad({ inicio: '2026-10-31T09:00:00+01:00', fin: '2026-11-02T14:00:00+01:00' }),
      );
      const agente = await entrar('v1');
      const res = await agente.patch(`/api/yo/inscripciones/${id}`).send({ accion: 'cancelar' });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('INSCRIPCION_NO_CANCELABLE');
      expect((await calendario(agente)).total).toBe(1);
    });
  });
});
