// Pruebas de HU-05 contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   TEST_DATABASE_URL=postgres://ong:ong_dev@localhost:5432/ong_test npm test
// Vacían actividades, voluntarios e inscripciones de esa base: nunca uses la de desarrollo.
// El módulo actividades es el real (así se prueba también la integración con spec-007); el correo
// se simula.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import session from 'express-session';
import request from 'supertest';

const URL_PRUEBAS = process.env.TEST_DATABASE_URL;
const AHORA = '2026-11-01T12:00:00+01:00';
const CONTRASENA = 'clave-de-pruebas-005';
const MENSAJE_SIN_ROL = 'Necesitas una cuenta de voluntario para inscribirte en actividades.';

vi.mock('../../servicios-comunes/correo.js', () => ({ enviarCorreo: vi.fn(async () => true) }));

describe.skipIf(!URL_PRUEBAS)('HU-05 · voluntariado', () => {
  let app;
  let pool;
  let servicio;
  let correo;
  let transaccion;
  const usuarios = {};
  let proyecto;
  let otroProyecto;

  async function entrar(nombre) {
    const agente = request.agent(app);
    await agente
      .post('/api/auth/sesion')
      .send({ correo: `${nombre}@prueba.test`, contrasena: CONTRASENA })
      .expect(200);
    return agente;
  }

  let contadorTitulos = 0;
  async function actividad({
    estado = 'publicada',
    inicio = '2026-12-01T10:00:00+01:00',
    fin = '2026-12-01T12:00:00+01:00',
    plazas = 10,
    proyectoId = proyecto,
    titulo = `Prueba ${++contadorTitulos}`,
  } = {}) {
    const { rows } = await pool.query(
      `INSERT INTO actividades (proyecto_id, titulo, descripcion, inicio, fin, lugar, plazas, requisitos, estado, creada_por)
       VALUES ($1, $2, 'Prueba.', $3, $4, 'Aquí', $5, 'Traer guantes.', $6, $7) RETURNING id`,
      [proyectoId, titulo, inicio, fin, plazas, estado, usuarios.coordinador],
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

  async function estadoDe(id) {
    const { rows } = await pool.query('SELECT estado FROM inscripciones WHERE id = $1', [id]);
    return rows[0].estado;
  }

  async function disponible(agente, id) {
    const res = await agente.get('/api/actividades/disponibles').expect(200);
    return res.body.datos.find((a) => a.id === id);
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_PRUEBAS;
    process.env.AHORA_SIMULADO = AHORA;
    process.env.NODE_ENV = 'test';
    ({ pool, transaccion } = await import('../../db/pool.js'));
    const { crearApp } = await import('../../app.js');
    app = crearApp({ almacenSesiones: new session.MemoryStore() });
    servicio = await import('./servicio.js');
    correo = await import('../../servicios-comunes/correo.js');

    await pool.query('TRUNCATE inscripciones, voluntarios, actividades RESTART IDENTITY CASCADE');
    const hash = await bcrypt.hash(CONTRASENA, 4);
    const cuentas = [
      ['coordinador', ['coordinador']],
      ['donante', ['donante']],
      ['sinperfil', ['voluntario']],
      ...['v1', 'v2', 'v3', 'v4'].map((n) => [n, ['voluntario']]),
    ];
    for (const [nombre, roles] of cuentas) {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles) VALUES ($1, $2, 'Prueba', $3)
         ON CONFLICT (correo) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, roles = EXCLUDED.roles, activo = true
         RETURNING id`,
        [`${nombre}@prueba.test`, hash, roles],
      );
      usuarios[nombre] = rows[0].id;
    }
    for (const nombre of ['v1', 'v2', 'v3', 'v4']) {
      await pool.query(
        `INSERT INTO voluntarios (usuario_id, nombre, apellidos, correo, telefono) VALUES ($1, $2, 'Prueba', $3, '600000000')`,
        [usuarios[nombre], nombre.toUpperCase(), `${nombre}@prueba.test`],
      );
    }
    for (const nombre of ['Prueba activo', 'Prueba otro']) {
      await pool.query(
        `INSERT INTO proyectos (nombre, activo) VALUES ($1, true) ON CONFLICT (nombre) DO UPDATE SET activo = true`,
        [nombre],
      );
    }
    const { rows } = await pool.query(
      "SELECT id, nombre FROM proyectos WHERE nombre IN ('Prueba activo', 'Prueba otro')",
    );
    proyecto = Number(rows.find((p) => p.nombre === 'Prueba activo').id);
    otroProyecto = Number(rows.find((p) => p.nombre === 'Prueba otro').id);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await pool.query('TRUNCATE inscripciones, actividades RESTART IDENTITY CASCADE');
    await pool.query('DELETE FROM voluntarios WHERE usuario_id = $1', [usuarios.sinperfil]);
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe('consultar las actividades disponibles (US1)', () => {
    it('sin sesión, solo las publicadas futuras, por fecha, con plazas libres y requisitos (FR-001, FR-002)', async () => {
      const tarde = await actividad({
        titulo: 'Tarde',
        inicio: '2026-12-05T10:00:00+01:00',
        fin: '2026-12-05T12:00:00+01:00',
      });
      await actividad({
        titulo: 'Pronto',
        inicio: '2026-11-20T10:00:00+01:00',
        fin: '2026-11-20T12:00:00+01:00',
      });
      await actividad({ titulo: 'Borrador', estado: 'borrador' });
      await actividad({ titulo: 'Cancelada', estado: 'cancelada' });
      await actividad({
        titulo: 'Celebrada',
        inicio: '2026-10-30T10:00:00+01:00',
        fin: '2026-10-30T12:00:00+01:00',
      });
      await inscripcion('v1', tarde);

      const res = await request(app).get('/api/actividades/disponibles').expect(200);
      expect(res.body.datos.map((a) => a.titulo)).toEqual(['Pronto', 'Tarde']);
      expect(res.body.total).toBe(2);
      const datos = res.body.datos[1];
      expect(datos).toMatchObject({
        plazas: 10,
        plazasLibres: 9,
        requisitos: 'Traer guantes.',
        lugar: 'Aquí',
        proyecto: { id: proyecto, nombre: 'Prueba activo' },
        miInscripcion: null,
      });
      expect(datos.inicio).toBe('2026-12-05T10:00:00+01:00');
      expect(datos).not.toHaveProperty('estado');
    });

    it('filtra por proyecto y por días de Madrid, ambos incluidos (FR-003)', async () => {
      await actividad({
        titulo: 'Día 1',
        inicio: '2026-12-01T23:30:00+01:00',
        fin: '2026-12-02T00:30:00+01:00',
      });
      await actividad({
        titulo: 'Día 2',
        inicio: '2026-12-02T00:30:00+01:00',
        fin: '2026-12-02T02:00:00+01:00',
      });
      await actividad({ titulo: 'Otro proyecto', proyectoId: otroProyecto });

      const titulos = async (consulta) =>
        (await request(app).get(`/api/actividades/disponibles${consulta}`).expect(200)).body.datos.map(
          (a) => a.titulo,
        );
      expect(await titulos('?hasta=2026-12-01')).toEqual(['Otro proyecto', 'Día 1']);
      expect(await titulos('?desde=2026-12-02')).toEqual(['Día 2']);
      expect(await titulos(`?proyectoId=${otroProyecto}`)).toEqual(['Otro proyecto']);
      expect(await titulos(`?proyectoId=${proyecto}&desde=2026-12-01&hasta=2026-12-01`)).toEqual(['Día 1']);
      expect(await titulos('?proyectoId=&desde=&hasta=')).toHaveLength(3);
    });

    it('fechas mal escritas o «desde» posterior a «hasta» → 400 con el campo', async () => {
      const res = await request(app).get('/api/actividades/disponibles?desde=2026-12-05&hasta=2026-12-01');
      expect(res.status).toBe(400);
      expect(res.body.error.campos.hasta).toBeDefined();
      const mal = await request(app).get('/api/actividades/disponibles?desde=2026-02-31');
      expect(mal.status).toBe(400);
      expect(mal.body.error.campos.desde).toBe('Fecha no válida.');
    });

    it('con sesión, cada actividad indica la inscripción activa del voluntario y su posición', async () => {
      const llena = await actividad({ plazas: 1 });
      const libre = await actividad();
      await inscripcion('v2', llena);
      await inscripcion('v1', llena, 'en_espera');
      const id = await inscripcion('v1', libre);
      const agente = await entrar('v1');
      expect((await disponible(agente, libre)).miInscripcion).toEqual({
        id,
        estado: 'confirmada',
        posicion: null,
      });
      expect((await disponible(agente, llena)).miInscripcion).toMatchObject({
        estado: 'en_espera',
        posicion: 1,
      });
    });
  });

  describe('permisos y perfil de voluntario (FR-004, FR-011)', () => {
    const rutas = [
      ['post', '/api/actividades/1/inscripciones'],
      ['patch', '/api/yo/inscripciones/1'],
      ['get', '/api/yo/perfil-voluntario'],
      ['put', '/api/yo/perfil-voluntario'],
    ];

    it.each(rutas)('%s %s → 401 sin sesión', async (metodo, ruta) => {
      expect((await request(app)[metodo](ruta).send({})).status).toBe(401);
    });

    it.each(rutas)('%s %s → 403 sin rol de voluntario, explicando por qué', async (metodo, ruta) => {
      const agente = await entrar('donante');
      const res = await agente[metodo](ruta).send({ aceptaRequisitos: true });
      expect(res.status).toBe(403);
      expect(res.body.error.mensaje).toBe(MENSAJE_SIN_ROL);
    });

    it('sin perfil: GET 404 e inscribirse 409 PERFIL_INCOMPLETO', async () => {
      const id = await actividad();
      const agente = await entrar('sinperfil');
      expect((await agente.get('/api/yo/perfil-voluntario')).status).toBe(404);
      const res = await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true });
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('PERFIL_INCOMPLETO');
    });

    it('PUT valida cada campo y, si es correcto, guarda el perfil y lo reutiliza', async () => {
      const agente = await entrar('sinperfil');
      const mal = await agente
        .put('/api/yo/perfil-voluntario')
        .send({ nombre: ' ', apellidos: 'Ruiz', correo: 'no-es-correo', telefono: '123' });
      expect(mal.status).toBe(400);
      expect(Object.keys(mal.body.error.campos).sort()).toEqual(['correo', 'nombre', 'telefono']);

      const datos = {
        nombre: 'Ana',
        apellidos: 'Ruiz',
        correo: 'ana@prueba.test',
        telefono: '+34 600 000 000',
      };
      expect((await agente.put('/api/yo/perfil-voluntario').send(datos)).body).toEqual(datos);
      expect((await agente.get('/api/yo/perfil-voluntario')).body).toEqual(datos);
      const id = await actividad();
      await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true }).expect(201);
    });
  });

  describe('inscribirse (US2)', () => {
    it('sin confirmar los requisitos → 400 junto a la casilla (escenario 2)', async () => {
      const id = await actividad();
      const agente = await entrar('v1');
      const res = await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: false });
      expect(res.status).toBe(400);
      expect(res.body.error.campos.aceptaRequisitos).toBe(
        'Confirma que cumples los requisitos de la actividad.',
      );
      expect((await disponible(agente, id)).plazasLibres).toBe(10);
    });

    it('con plaza queda confirmada y las plazas libres bajan en una (escenario 1, FR-005)', async () => {
      const id = await actividad();
      for (const n of ['v2', 'v3']) await inscripcion(n, id);
      const agente = await entrar('v1');
      const res = await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        actividadId: id,
        estado: 'confirmada',
        posicion: null,
        fechaCancelacion: null,
      });
      expect(res.body.fechaConfirmacion).toBeTruthy();
      expect((await disponible(agente, id)).plazasLibres).toBe(7);
    });

    it('dos veces en la misma actividad → 409 YA_INSCRITO, también si está en espera (escenario 4)', async () => {
      const id = await actividad({ plazas: 1 });
      const agente = await entrar('v1');
      await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true }).expect(201);
      const otra = await agente
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true, listaEspera: true });
      expect(otra.status).toBe(409);
      expect(otra.body.error.codigo).toBe('YA_INSCRITO');
    });

    it('completa: sin pedirlo → 409 PLAZAS_AGOTADAS; pidiendo la lista de espera → en espera con su posición (escenario 3, FR-007)', async () => {
      const id = await actividad({ plazas: 1 });
      await inscripcion('v3', id);
      const v1 = await entrar('v1');
      const rechazada = await v1
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true });
      expect(rechazada.status).toBe(409);
      expect(rechazada.body.error.codigo).toBe('PLAZAS_AGOTADAS');

      const r1 = await v1
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true, listaEspera: true });
      expect(r1.status).toBe(201);
      expect(r1.body).toMatchObject({ estado: 'en_espera', posicion: 1, fechaConfirmacion: null });
      const v2 = await entrar('v2');
      const r2 = await v2
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true, listaEspera: true });
      expect(r2.body).toMatchObject({ estado: 'en_espera', posicion: 2 });
      expect((await disponible(v1, id)).plazasLibres).toBe(0);
    });

    it('pidiendo la lista de espera cuando sí hay plaza, queda confirmada', async () => {
      const id = await actividad({ plazas: 2 });
      const agente = await entrar('v1');
      const res = await agente
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true, listaEspera: true });
      expect(res.body.estado).toBe('confirmada');
    });

    it('borrador, cancelada o inexistente → 404; celebrada → 409 (FR-008)', async () => {
      const agente = await entrar('v1');
      const intento = (id) =>
        agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true });
      expect((await intento(await actividad({ estado: 'borrador' }))).status).toBe(404);
      expect((await intento(await actividad({ estado: 'cancelada' }))).status).toBe(404);
      expect((await intento(9999)).status).toBe(404);
      const celebrada = await actividad({
        inicio: '2026-11-01T11:00:00+01:00',
        fin: '2026-11-01T13:00:00+01:00',
      });
      const res = await intento(celebrada);
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('ACTIVIDAD_CELEBRADA');
    });

    it('se permite inscribirse en dos actividades que se solapan (FR-010)', async () => {
      const a = await actividad();
      const b = await actividad();
      const agente = await entrar('v1');
      await agente.post(`/api/actividades/${a}/inscripciones`).send({ aceptaRequisitos: true }).expect(201);
      await agente.post(`/api/actividades/${b}/inscripciones`).send({ aceptaRequisitos: true }).expect(201);
    });

    it('dos peticiones simultáneas por la última plaza: una entra y la otra recibe PLAZAS_AGOTADAS (FR-006, SC-002)', async () => {
      const id = await actividad({ plazas: 3 });
      for (const n of ['v3', 'v4']) await inscripcion(n, id);
      const [v1, v2] = [await entrar('v1'), await entrar('v2')];
      const respuestas = await Promise.all(
        [v1, v2].map((a) => a.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true })),
      );
      expect(respuestas.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(respuestas.find((r) => r.status === 409).body.error.codigo).toBe('PLAZAS_AGOTADAS');
      expect(await servicio.contarConfirmadas(id)).toBe(3);
    });
  });

  describe('cancelar la inscripción (US2, FR-009)', () => {
    it('la propia, sin lista de espera: pasa a cancelada y la plaza queda libre (escenario 5)', async () => {
      const id = await actividad();
      const agente = await entrar('v1');
      const { body } = await agente
        .post(`/api/actividades/${id}/inscripciones`)
        .send({ aceptaRequisitos: true });
      const res = await agente.patch(`/api/yo/inscripciones/${body.id}`).send({ accion: 'cancelar' });
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('cancelada');
      expect(res.body.fechaCancelacion).toBeTruthy();
      expect((await disponible(agente, id)).plazasLibres).toBe(10);
      expect(correo.enviarCorreo).not.toHaveBeenCalled();
    });

    it('la de otra persona o una inexistente → 404', async () => {
      const id = await inscripcion('v2', await actividad());
      const agente = await entrar('v1');
      expect((await agente.patch(`/api/yo/inscripciones/${id}`).send({ accion: 'cancelar' })).status).toBe(
        404,
      );
      expect((await agente.patch('/api/yo/inscripciones/9999').send({ accion: 'cancelar' })).status).toBe(
        404,
      );
      expect(await estadoDe(id)).toBe('confirmada');
    });

    it('ya cancelada o con la actividad empezada → 409; acción desconocida → 400', async () => {
      const agente = await entrar('v1');
      const cancelada = await inscripcion('v1', await actividad(), 'cancelada');
      const r1 = await agente.patch(`/api/yo/inscripciones/${cancelada}`).send({ accion: 'cancelar' });
      expect(r1.status).toBe(409);
      expect(r1.body.error.codigo).toBe('INSCRIPCION_NO_CANCELABLE');

      const empezada = await actividad({
        inicio: '2026-11-01T11:00:00+01:00',
        fin: '2026-11-01T13:00:00+01:00',
      });
      const id = await inscripcion('v1', empezada);
      expect((await agente.patch(`/api/yo/inscripciones/${id}`).send({ accion: 'cancelar' })).status).toBe(
        409,
      );
      expect(await estadoDe(id)).toBe('confirmada');

      expect((await agente.patch(`/api/yo/inscripciones/${id}`).send({ accion: 'borrar' })).status).toBe(400);
    });

    it('confirmada con lista de espera: la primera pasa a confirmada, recibe un único aviso y las plazas libres no cambian (escenario 6)', async () => {
      const id = await actividad({ plazas: 1 });
      const mia = await inscripcion('v1', id);
      const primera = await inscripcion('v2', id, 'en_espera');
      const segunda = await inscripcion('v3', id, 'en_espera');
      const agente = await entrar('v1');
      await agente.patch(`/api/yo/inscripciones/${mia}`).send({ accion: 'cancelar' }).expect(200);

      expect(await estadoDe(primera)).toBe('confirmada');
      expect(await estadoDe(segunda)).toBe('en_espera');
      expect((await disponible(agente, id)).plazasLibres).toBe(0);
      expect((await servicio.listarInscripcionesDeActividad(id)).enEspera).toMatchObject([
        { inscripcionId: segunda, posicion: 1 },
      ]);
      expect(correo.enviarCorreo).toHaveBeenCalledTimes(1);
      expect(correo.enviarCorreo.mock.calls[0][0]).toMatchObject({ para: 'v2@prueba.test' });
      expect(correo.enviarCorreo.mock.calls[0][0].asunto).toContain('Plaza confirmada');
    });

    it('en espera: sale de la lista y las de detrás avanzan una posición (escenario 7)', async () => {
      const id = await actividad({ plazas: 1 });
      await inscripcion('v4', id);
      const mia = await inscripcion('v1', id, 'en_espera');
      const v2 = await inscripcion('v2', id, 'en_espera');
      const v3 = await inscripcion('v3', id, 'en_espera');
      const agente = await entrar('v1');
      await agente.patch(`/api/yo/inscripciones/${mia}`).send({ accion: 'cancelar' }).expect(200);
      const { enEspera } = await servicio.listarInscripcionesDeActividad(id);
      expect(enEspera.map((e) => [e.inscripcionId, e.posicion])).toEqual([
        [v2, 1],
        [v3, 2],
      ]);
      expect(correo.enviarCorreo).not.toHaveBeenCalled();
    });

    it('tras cancelar se puede volver a inscribir en la misma actividad', async () => {
      const id = await actividad();
      await inscripcion('v1', id, 'cancelada');
      const agente = await entrar('v1');
      await agente.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true }).expect(201);
    });
  });

  describe('funciones para el módulo actividades (contrato)', () => {
    it('promoverListaEspera confirma por orden de llegada tantas como plazas libres haya', async () => {
      const id = await actividad({ plazas: 3 });
      await inscripcion('v1', id);
      const e1 = await inscripcion('v2', id, 'en_espera');
      const e2 = await inscripcion('v3', id, 'en_espera');
      const e3 = await inscripcion('v4', id, 'en_espera');
      const promovidas = await transaccion((cliente) => servicio.promoverListaEspera(id, cliente));
      expect(promovidas).toEqual([
        { inscripcionId: e1, nombre: 'V2', correo: 'v2@prueba.test' },
        { inscripcionId: e2, nombre: 'V3', correo: 'v3@prueba.test' },
      ]);
      expect(await estadoDe(e3)).toBe('en_espera');
    });

    it('cancelarInscripcionesDeActividad cancela las activas e indica su estado anterior', async () => {
      const id = await actividad({ plazas: 1 });
      const c = await inscripcion('v1', id);
      const e = await inscripcion('v2', id, 'en_espera');
      await inscripcion('v3', id, 'cancelada');
      const canceladas = await transaccion((cliente) =>
        servicio.cancelarInscripcionesDeActividad(id, cliente),
      );
      expect(canceladas.sort((a, b) => a.inscripcionId - b.inscripcionId)).toEqual([
        { inscripcionId: c, nombre: 'V1', correo: 'v1@prueba.test', estadoAnterior: 'confirmada' },
        { inscripcionId: e, nombre: 'V2', correo: 'v2@prueba.test', estadoAnterior: 'en_espera' },
      ]);
    });

    it('listarInscripcionesDeActividad, listarConfirmadasDeActividad y listarInscripcionesDeUsuario', async () => {
      const id = await actividad({ plazas: 1 });
      const c = await inscripcion('v1', id);
      const e = await inscripcion('v2', id, 'en_espera');
      const vieja = await inscripcion('v1', await actividad(), 'cancelada');

      const lista = await servicio.listarInscripcionesDeActividad(id);
      expect(lista.confirmadas).toEqual([
        expect.objectContaining({
          inscripcionId: c,
          nombre: 'V1',
          apellidos: 'Prueba',
          telefono: '600000000',
        }),
      ]);
      expect(lista.enEspera).toEqual([
        expect.objectContaining({ inscripcionId: e, posicion: 1, correo: 'v2@prueba.test' }),
      ]);
      expect(await servicio.listarConfirmadasDeActividad(id)).toEqual([
        { inscripcionId: c, nombre: 'V1', apellidos: 'Prueba', correo: 'v1@prueba.test' },
      ]);
      expect(await servicio.listarInscripcionesDeUsuario(usuarios.v1)).toEqual([
        { inscripcionId: c, actividadId: id },
        { inscripcionId: vieja, actividadId: expect.any(Number) },
      ]);
      expect(await servicio.listarInscripcionesDeUsuario(usuarios.sinperfil)).toEqual([]);
    });

    it('integración con spec-007: al subir plazas, el coordinador promueve la lista de espera y se avisa', async () => {
      const id = await actividad({ plazas: 1 });
      await inscripcion('v1', id);
      const e = await inscripcion('v2', id, 'en_espera');
      const coordinador = await entrar('coordinador');
      const res = await coordinador.patch(`/api/actividades/${id}`).send({ plazas: 2 });
      expect(res.status).toBe(200);
      expect(res.body.plazasLibres).toBe(0);
      expect(await estadoDe(e)).toBe('confirmada');
      expect(correo.enviarCorreo.mock.calls.map(([c]) => c.para)).toEqual(['v2@prueba.test']);
    });

    it('integración con spec-007: bajar plazas e inscribirse a la vez nunca deja más confirmadas que plazas (SC-003)', async () => {
      for (let vuelta = 0; vuelta < 5; vuelta++) {
        const id = await actividad({ plazas: 3 });
        for (const n of ['v3', 'v4']) await inscripcion(n, id);
        const [coordinador, v1] = [await entrar('coordinador'), await entrar('v1')];
        const [bajar, inscribir] = await Promise.all([
          coordinador.patch(`/api/actividades/${id}`).send({ plazas: 2 }),
          v1.post(`/api/actividades/${id}/inscripciones`).send({ aceptaRequisitos: true }),
        ]);
        // Gana la primera que bloquea la actividad; la otra se rechaza con su motivo.
        expect([bajar.status, inscribir.status].sort()).toEqual([200, 409].sort());
        const { rows } = await pool.query('SELECT plazas FROM actividades WHERE id = $1', [id]);
        expect(await servicio.contarConfirmadas(id)).toBeLessThanOrEqual(rows[0].plazas);
      }
    });

    it('integración con spec-007: al cancelar la actividad, sus inscripciones activas pasan a canceladas', async () => {
      const id = await actividad({ plazas: 1 });
      const c = await inscripcion('v1', id);
      const e = await inscripcion('v2', id, 'en_espera');
      const coordinador = await entrar('coordinador');
      await coordinador.patch(`/api/actividades/${id}`).send({ accion: 'cancelar' }).expect(200);
      expect([await estadoDe(c), await estadoDe(e)]).toEqual(['cancelada', 'cancelada']);
      expect(await disponible(coordinador, id)).toBeUndefined();
    });
  });
});
