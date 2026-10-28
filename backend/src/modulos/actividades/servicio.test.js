// Pruebas de HU-07 contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   TEST_DATABASE_URL=postgres://ong:ong_dev@localhost:5432/ong_test npm test
// La tabla actividades de esa base se vacía en cada ejecución: nunca uses la de desarrollo.
// Las inscripciones (spec-005) y el correo se simulan.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA = '2026-11-01T12:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-007';

vi.mock('./inscripciones.js', () => ({
  contarConfirmadas: vi.fn(async () => 0),
  listarInscripcionesDeActividad: vi.fn(async () => ({ confirmadas: [], enEspera: [] })),
  promoverListaEspera: vi.fn(async () => []),
  cancelarInscripcionesDeActividad: vi.fn(async () => []),
}));
vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));

describe.skipIf(!URL_PRUEBAS)('HU-07 · actividades', () => {
  let app;
  let pool;
  let inscripciones;
  let correo;
  let proyectoActivo;
  let proyectoInactivo;
  let coordinador;

  const valida = () => ({
    titulo: 'Reparto de alimentos',
    descripcion: 'Repartir comida.',
    proyectoId: proyectoActivo,
    inicio: '2026-12-01T10:00:00+01:00',
    fin: '2026-12-01T13:30:00+01:00',
    lugar: 'Calle Mayor 3',
    plazas: 10,
  });

  async function entrar(correoUsuario) {
    const agente = request.agent(app);
    await agente.post('/api/auth/sesion').send({ correo: correoUsuario, contrasena: CONTRASENA }).expect(200);
    return agente;
  }

  // Inserta directamente una actividad (para estados y fechas que la API no permite crear).
  async function insertar({ estado = 'borrador', inicio = '2026-12-01T10:00:00+01:00', fin = '2026-12-01T12:00:00+01:00', plazas = 10, proyectoId = proyectoActivo } = {}) {
    const { rows } = await pool.query(
      `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, estado, creada_por)
       VALUES ($1, 'Prueba', 'Prueba.', $2, $3, 'Aquí', $4, $5, $6) RETURNING id`,
      [proyectoId, inicio, fin, plazas, estado, coordinador],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA;
    process.env.NODE_ENV = 'test';
    ({ pool } = await import('../../db/pool.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });
    inscripciones = await import('./inscripciones.js');
    correo = await import('../../servicios-comunes/correo.js');

    await pool.query('TRUNCATE actividades RESTART IDENTITY CASCADE');
    const hash = await bcrypt.hash(CONTRASENA, 4);
    for (const [c, roles] of [['coordinador@prueba.test', ['coordinador']], ['voluntario@prueba.test', ['voluntario']]]) {
      await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true`,
        [c, hash, roles],
      );
    }
    coordinador = (await pool.query("SELECT id FROM usuarios WHERE correo = 'coordinador@prueba.test'")).rows[0].id;
    for (const [nombre, activo] of [['Prueba activo', true], ['Prueba inactivo', false]]) {
      await pool.query(
        `INSERT INTO proyectos (nombre, activo) VALUES ($1, $2) ON CONFLICT (nombre) DO UPDATE SET activo = EXCLUDED.activo`,
        [nombre, activo],
      );
    }
    const { rows } = await pool.query("SELECT id, nombre FROM proyectos WHERE nombre LIKE 'Prueba %'");
    proyectoActivo = Number(rows.find((p) => p.nombre === 'Prueba activo').id);
    proyectoInactivo = Number(rows.find((p) => p.nombre === 'Prueba inactivo').id);
  });

  beforeEach(() => vi.clearAllMocks());

  afterAll(async () => {
    await pool?.end();
  });

  describe('permisos (FR-010)', () => {
    const rutas = [
      ['get', '/api/actividades'],
      ['post', '/api/actividades'],
      ['get', '/api/actividades/1'],
      ['patch', '/api/actividades/1'],
      ['get', '/api/actividades/1/inscripciones'],
    ];

    it.each(rutas)('%s %s → 401 sin sesión', async (metodo, ruta) => {
      expect((await request(app)[metodo](ruta).send({})).status).toBe(401);
    });

    it.each(rutas)('%s %s → 403 como voluntario', async (metodo, ruta) => {
      const agente = await entrar('voluntario@prueba.test');
      expect((await agente[metodo](ruta).send({})).status).toBe(403);
    });

    it(':id solo numérico: /api/actividades/abc no es de este módulo', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.get('/api/actividades/abc');
      expect(res.status).toBe(404);
      expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
    });
  });

  describe('crear (FR-002, FR-003)', () => {
    it('una actividad válida queda en borrador', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.post('/api/actividades').send(valida());
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ estado: 'borrador', plazas: 10, plazasLibres: 10, requisitos: '', celebrada: false });
      expect(res.body.inicio).toBe('2026-12-01T10:00:00+01:00');
    });

    it.each([
      ['titulo', { titulo: '  ' }],
      ['descripcion', { descripcion: '' }],
      ['lugar', { lugar: '' }],
      ['plazas', { plazas: 0 }],
      ['plazas', { plazas: 2.5 }],
      ['fin', { fin: '2026-12-01T10:00:00+01:00' }],
      ['inicio', { inicio: '2026-10-30T10:00:00+01:00', fin: '2026-10-30T12:00:00+01:00' }],
      ['proyectoId', { proyectoId: undefined }],
    ])('marca el campo %s y no la crea', async (campo, cambio) => {
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.post('/api/actividades').send({ ...valida(), ...cambio });
      expect(res.status).toBe(400);
      expect(res.body.error.campos[campo]).toBeTruthy();
    });

    it('rechaza un proyecto inactivo', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const res = await agente.post('/api/actividades').send({ ...valida(), proyectoId: proyectoInactivo });
      expect(res.status).toBe(400);
      expect(res.body.error.campos.proyectoId).toBe('El proyecto no está activo.');
    });
  });

  describe('publicar', () => {
    it('un borrador pasa a publicada', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar();
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'publicar' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('publicada');
      const publicadas = await agente.get('/api/actividades?estado=publicada');
      expect(publicadas.body.datos.map((a) => a.id)).toContain(Number(id));
    });

    it('no publica un borrador con el inicio ya pasado', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ inicio: '2026-10-30T10:00:00+01:00', fin: '2026-10-30T12:00:00+01:00' });
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'publicar' });
      expect(res.status).toBe(400);
      expect(res.body.error.campos.inicio).toBeTruthy();
    });

    it('no publica un borrador de un proyecto inactivo', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ proyectoId: proyectoInactivo });
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'publicar' });
      expect(res.status).toBe(400);
      expect(res.body.error.campos.proyectoId).toBeTruthy();
    });

    it.each(['publicada', 'cancelada'])('no publica una %s', async (estado) => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado });
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'publicar' });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('TRANSICION_NO_PERMITIDA');
    });

    it('no mezcla accion con campos', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar();
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'publicar', plazas: 3 });
      expect(res.status).toBe(400);
    });
  });

  describe('editar (FR-007, FR-011)', () => {
    it('no deja bajar las plazas por debajo de los confirmados', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado: 'publicada' });
      inscripciones.contarConfirmadas.mockResolvedValue(8);
      const res = await agente.patch(`/api/actividades/${id}`).send({ plazas: 6 });
      inscripciones.contarConfirmadas.mockResolvedValue(0);
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('PLAZAS_MENOR_QUE_INSCRITOS');
      expect(res.body.error.campos.plazas).toContain('8');
    });

    it.each([
      ['cancelada', {}],
      ['celebrada', { estado: 'publicada', inicio: '2026-10-30T10:00:00+01:00', fin: '2026-10-30T12:00:00+01:00' }],
    ])('no edita una actividad %s', async (estado, datos) => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar(estado === 'cancelada' ? { estado } : datos);
      const res = await agente.patch(`/api/actividades/${id}`).send({ titulo: 'Otro' });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('ACTIVIDAD_NO_EDITABLE');
    });

    it('avisa a inscritos y lista de espera si cambia el lugar de una publicada', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado: 'publicada' });
      inscripciones.listarInscripcionesDeActividad.mockResolvedValueOnce({
        confirmadas: [{ nombre: 'Ana', correo: 'ana@prueba.test' }],
        enEspera: [{ nombre: 'Luis', correo: 'luis@prueba.test', posicion: 1 }],
      });
      const res = await agente.patch(`/api/actividades/${id}`).send({ lugar: 'Plaza Mayor' });
      expect(res.status).toBe(200);
      expect(correo.enviarCorreo).toHaveBeenCalledTimes(2);
      expect(correo.enviarCorreo.mock.calls[0][0].texto).toContain('Plaza Mayor');
    });

    it('no avisa si solo cambia la descripción', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado: 'publicada' });
      await agente.patch(`/api/actividades/${id}`).send({ descripcion: 'Nueva.' }).expect(200);
      expect(correo.enviarCorreo).not.toHaveBeenCalled();
    });
  });

  describe('cancelar (FR-008)', () => {
    it('cancela una publicada, cancela sus inscripciones y avisa a cada afectado', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado: 'publicada' });
      inscripciones.cancelarInscripcionesDeActividad.mockResolvedValueOnce([
        { inscripcionId: 1, nombre: 'Ana', correo: 'ana@prueba.test', estadoAnterior: 'confirmada' },
        { inscripcionId: 2, nombre: 'Luis', correo: 'luis@prueba.test', estadoAnterior: 'en_espera' },
      ]);
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'cancelar' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('cancelada');
      expect(inscripciones.cancelarInscripcionesDeActividad).toHaveBeenCalledTimes(1);
      expect(correo.enviarCorreo).toHaveBeenCalledTimes(2);
    });

    it('cancela un borrador sin avisar a nadie', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar();
      await agente.patch(`/api/actividades/${id}`).send({ accion: 'cancelar' }).expect(200);
      expect(inscripciones.cancelarInscripcionesDeActividad).not.toHaveBeenCalled();
      expect(correo.enviarCorreo).not.toHaveBeenCalled();
    });

    it.each([
      ['cancelada', { estado: 'cancelada' }],
      ['celebrada', { estado: 'publicada', inicio: '2026-10-30T10:00:00+01:00', fin: '2026-10-30T12:00:00+01:00' }],
    ])('no cancela una actividad %s', async (_nombre, datos) => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar(datos);
      const res = await agente.patch(`/api/actividades/${id}`).send({ accion: 'cancelar' });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('TRANSICION_NO_PERMITIDA');
    });
  });

  describe('consultar (FR-009)', () => {
    it('devuelve inscritos y lista de espera', async () => {
      const agente = await entrar('coordinador@prueba.test');
      const id = await insertar({ estado: 'publicada' });
      const lista = { confirmadas: [{ inscripcionId: 1, nombre: 'Ana' }], enEspera: [{ inscripcionId: 2, posicion: 1 }] };
      inscripciones.listarInscripcionesDeActividad.mockResolvedValueOnce(lista);
      const res = await agente.get(`/api/actividades/${id}/inscripciones`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(lista);
    });

    it('404 si la actividad no existe', async () => {
      const agente = await entrar('coordinador@prueba.test');
      expect((await agente.get('/api/actividades/999999')).status).toBe(404);
    });
  });
});
