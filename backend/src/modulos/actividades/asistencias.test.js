// Pruebas de HU-08 contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas.
// Las tablas actividades, inscripciones y asistencias de esa base se vacían: nunca uses la de desarrollo.
// Las funciones de ./inscripciones.js se simulan; las inscripciones reales se insertan por la FK.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA = '2026-11-01T12:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-008';

vi.mock('./inscripciones.js', () => ({
  listarConfirmadasDeActividad: vi.fn(async () => []),
  listarInscripcionesDeUsuario: vi.fn(async () => []),
}));

describe.skipIf(!URL_PRUEBAS)('HU-08 · asistencias', () => {
  let app;
  let pool;
  let inscripciones;
  let coordinador;
  let proyecto;
  let voluntarioA;
  let voluntarioB;
  const usuarios = {};

  async function entrar(correo) {
    const agente = request.agent(app);
    await agente.post('/api/auth/sesion').send({ correo, contrasena: CONTRASENA }).expect(200);
    return agente;
  }

  async function crearActividad({
    estado = 'publicada',
    inicio = '2026-10-20T10:00:00+02:00',
    fin = '2026-10-20T13:30:00+02:00',
    titulo = 'Prueba',
  } = {}) {
    const { rows } = await pool.query(
      `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, estado, creada_por)
       VALUES ($1, $2, 'Prueba.', $3, $4, 'Aquí', 10, $5, $6) RETURNING id`,
      [proyecto, titulo, inicio, fin, estado, coordinador],
    );
    return Number(rows[0].id);
  }

  async function inscribir(actividadId, voluntarioId) {
    const { rows } = await pool.query(
      `INSERT INTO inscripciones (voluntario_id, actividad_id, estado, acepta_requisitos, fecha_confirmacion)
       VALUES ($1, $2, 'confirmada', true, now()) RETURNING id`,
      [voluntarioId, actividadId],
    );
    return Number(rows[0].id);
  }

  // Actividad con dos confirmados, y el servicio simulado devolviéndolos.
  async function preparar(opciones) {
    const actividadId = await crearActividad(opciones);
    const a = await inscribir(actividadId, voluntarioA);
    const b = await inscribir(actividadId, voluntarioB);
    inscripciones.listarConfirmadasDeActividad.mockResolvedValue([
      { inscripcionId: a, nombre: 'Ana', apellidos: 'Uno', correo: 'a@prueba.test' },
      { inscripcionId: b, nombre: 'Berta', apellidos: 'Dos', correo: 'b@prueba.test' },
    ]);
    return { actividadId, a, b };
  }

  const filaDe = async (inscripcionId) =>
    (await pool.query('SELECT * FROM asistencias WHERE inscripcion_id = $1', [inscripcionId])).rows[0];

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA;
    process.env.NODE_ENV = 'test';
    ({ pool } = await import('../../db/pool.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });
    inscripciones = await import('./inscripciones.js');

    await pool.query('TRUNCATE actividades, voluntarios RESTART IDENTITY CASCADE');
    const hash = await bcrypt.hash(CONTRASENA, 4);
    for (const [correo, roles] of [
      ['coordinador@prueba.test', ['coordinador']],
      ['a@prueba.test', ['voluntario']],
      ['b@prueba.test', ['voluntario']],
    ]) {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true
         RETURNING id`,
        [correo, hash, roles],
      );
      usuarios[correo] = Number(rows[0].id);
    }
    coordinador = usuarios['coordinador@prueba.test'];
    const crearVoluntario = async (correo) =>
      Number(
        (
          await pool.query(
            `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono)
             VALUES ($1, 'Prueba', 'Prueba', $2, '600') RETURNING id`,
            [usuarios[correo], correo],
          )
        ).rows[0].id,
      );
    voluntarioA = await crearVoluntario('a@prueba.test');
    voluntarioB = await crearVoluntario('b@prueba.test');
    proyecto = Number(
      (
        await pool.query(
          `INSERT INTO proyectos (nombre, activo) VALUES ('Prueba asistencia', true)
           ON CONFLICT (nombre) DO UPDATE SET activo = true RETURNING id`,
        )
      ).rows[0].id,
    );
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    inscripciones.listarConfirmadasDeActividad.mockResolvedValue([]);
    inscripciones.listarInscripcionesDeUsuario.mockResolvedValue([]);
    await pool.query('TRUNCATE actividades RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe('permisos (FR-008)', () => {
    const rutas = [
      ['get', '/api/actividades/1/asistencias'],
      ['put', '/api/actividades/1/asistencias'],
    ];

    it.each(rutas)('%s %s → 401 sin sesión', async (metodo, ruta) => {
      expect((await request(app)[metodo](ruta).send({})).status).toBe(401);
    });

    it.each(rutas)('%s %s → 403 como voluntario', async (metodo, ruta) => {
      const agente = await entrar('a@prueba.test');
      expect((await agente[metodo](ruta).send({})).status).toBe(403);
    });

    it('actividad inexistente → 404 en GET y PUT', async () => {
      const agente = await entrar('coordinador@prueba.test');
      expect((await agente.get('/api/actividades/999/asistencias')).status).toBe(404);
      const res = await agente
        .put('/api/actividades/999/asistencias')
        .send({ asistencias: [{ inscripcionId: 1, asistio: true }] });
      expect(res.status).toBe(404);
    });
  });

  describe('horas (FR-003, FR-004, FR-005)', () => {
    it('10:00–13:30 = 3,5 h', async () => {
      const { actividadId, a } = await preparar();
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente
        .put(`/api/actividades/${actividadId}/asistencias`)
        .send({ asistencias: [{ inscripcionId: a, asistio: true }] });
      expect(res.status).toBe(200);
      expect(res.body.actividad.horas).toBe(3.5);
      expect(Number((await filaDe(a)).horas)).toBe(3.5);
      expect(Number((await filaDe(a)).registrada_por)).toBe(coordinador);
    });

    it('22:00–01:00 = 3 h (cruza la medianoche)', async () => {
      const { actividadId, a } = await preparar({
        inicio: '2026-10-20T22:00:00+02:00',
        fin: '2026-10-21T01:00:00+02:00',
      });
      const agente = await entrar('coordinador@prueba.test');
      await agente
        .put(`/api/actividades/${actividadId}/asistencias`)
        .send({ asistencias: [{ inscripcionId: a, asistio: true }] })
        .expect(200);
      expect(Number((await filaDe(a)).horas)).toBe(3);
    });

    it('repetir el PUT no duplica y corregir conserva la fila', async () => {
      const { actividadId, a } = await preparar();
      const agente = await entrar('coordinador@prueba.test');
      const ruta = `/api/actividades/${actividadId}/asistencias`;
      await agente.put(ruta).send({ asistencias: [{ inscripcionId: a, asistio: true }] }).expect(200);
      await agente.put(ruta).send({ asistencias: [{ inscripcionId: a, asistio: true }] }).expect(200);
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM asistencias');
      expect(rows[0].n).toBe(1);

      await agente.put(ruta).send({ asistencias: [{ inscripcionId: a, asistio: false }] }).expect(200);
      expect((await filaDe(a)).asistio).toBe(false);
    });

    it('las filas no enviadas no cambian', async () => {
      const { actividadId, a, b } = await preparar();
      const agente = await entrar('coordinador@prueba.test');
      const ruta = `/api/actividades/${actividadId}/asistencias`;
      await agente.put(ruta).send({ asistencias: [{ inscripcionId: a, asistio: true }] }).expect(200);
      await agente.put(ruta).send({ asistencias: [{ inscripcionId: b, asistio: false }] }).expect(200);
      expect((await filaDe(a)).asistio).toBe(true);
    });
  });

  describe('cuándo se puede registrar (FR-001)', () => {
    it.each([
      ['borrador', { estado: 'borrador' }],
      ['cancelada', { estado: 'cancelada' }],
      ['futura', { inicio: '2026-12-01T10:00:00+01:00', fin: '2026-12-01T12:00:00+01:00' }],
    ])('%s → 409 ASISTENCIA_NO_PERMITIDA', async (_nombre, opciones) => {
      const { actividadId, a } = await preparar(opciones);
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente
        .put(`/api/actividades/${actividadId}/asistencias`)
        .send({ asistencias: [{ inscripcionId: a, asistio: true }] });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('ASISTENCIA_NO_PERMITIDA');
      expect(await filaDe(a)).toBeUndefined();
      const lectura = await agente.get(`/api/actividades/${actividadId}/asistencias`);
      expect(lectura.body.actividad.registrable).toBe(false);
    });

    it.each([
      ['en curso', { inicio: '2026-11-01T11:00:00+01:00', fin: '2026-11-01T13:00:00+01:00' }],
      ['mucho después (sin plazo)', { inicio: '2020-01-10T10:00:00+01:00', fin: '2020-01-10T12:00:00+01:00' }],
    ])('%s → se admite', async (_nombre, opciones) => {
      const { actividadId, a } = await preparar(opciones);
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente
        .put(`/api/actividades/${actividadId}/asistencias`)
        .send({ asistencias: [{ inscripcionId: a, asistio: true }] });
      expect(res.status).toBe(200);
      expect(res.body.actividad.registrable).toBe(true);
    });
  });

  describe('solo confirmados (FR-006)', () => {
    it('inscripción no confirmada o de otra actividad → 400 y no se guarda ninguna fila', async () => {
      const { actividadId, a } = await preparar();
      const otra = await crearActividad({ titulo: 'Otra' });
      const ajena = await inscribir(otra, voluntarioA);
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.put(`/api/actividades/${actividadId}/asistencias`).send({
        asistencias: [
          { inscripcionId: a, asistio: true },
          { inscripcionId: ajena, asistio: true },
        ],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
      expect(res.body.error.campos['asistencias.1']).toBeTruthy();
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM asistencias');
      expect(rows[0].n).toBe(0);
    });

    it.each([
      ['lista vacía', { asistencias: [] }],
      ['repetidos', { asistencias: [{ inscripcionId: 1, asistio: true }, { inscripcionId: 1, asistio: false }] }],
      ['asistio no booleano', { asistencias: [{ inscripcionId: 1, asistio: 'sí' }] }],
    ])('%s → 400', async (_nombre, cuerpo) => {
      const { actividadId } = await preparar();
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.put(`/api/actividades/${actividadId}/asistencias`).send(cuerpo);
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    });

    it('el GET lista las confirmadas, con asistio null si no hay registro', async () => {
      const { actividadId, a, b } = await preparar();
      const agente = await entrar('coordinador@prueba.test');
      const ruta = `/api/actividades/${actividadId}/asistencias`;
      await agente.put(ruta).send({ asistencias: [{ inscripcionId: a, asistio: false }] }).expect(200);
      const res = await agente.get(ruta).expect(200);
      expect(res.body.total).toBe(2);
      expect(res.body.datos.map((f) => [f.inscripcionId, f.asistio])).toEqual([
        [a, false],
        [b, null],
      ]);
      expect(res.body.actividad).toMatchObject({ id: actividadId, horas: 3.5, registrable: true });
    });
  });
});
