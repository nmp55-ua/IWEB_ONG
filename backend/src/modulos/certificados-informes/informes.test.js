// Pruebas de HU-04 (informes) contra una base de pruebas (plan-comun.md §8).
// Se ejecutan solo si TEST_DATABASE_URL apunta a una base con las migraciones aplicadas, p. ej.:
//   DATABASE_URL=<ong_test> TEST_DATABASE_URL=<ong_test> npx vitest run src/modulos/certificados-informes
// Vacían aportaciones, donantes, actividades, inscripciones, asistencias y voluntarios de esa base: nunca uses la
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
  'TRUNCATE certificados_fiscales, asistencias, inscripciones, actividades, aportaciones, suscripciones_socio, donantes, voluntarios RESTART IDENTITY CASCADE';

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

  async function asistencia(inscripcionId, { asistio = true, horas }) {
    await pool.query(
      `INSERT INTO asistencias (inscripcion_id, asistio, horas, registrada_por, fecha_registro)
       VALUES ($1, $2, $3::numeric, $4, now())`,
      [inscripcionId, asistio, horas, usuarios.coordinador],
    );
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

  // Cifras de una fila sin tipo, periodo ni proyecto, para comparar.
  const cifras = ({ tipo, periodo, proyecto, ...resto }) => resto;
  const ceros = { recaudadoPuntual: '0.00', recaudadoCuotas: '0.00', recaudadoTotal: '0.00', aportaciones: 0, actividades: 0, voluntarios: 0, horas: '0.00' };
  const AÑO_2026 = { desde: '2026-01-01', hasta: '2026-12-31' };

  describe('informe por proyecto y periodo (US1)', () => {
    let a;
    let b;
    let donanteA;

    // Proyectos A y B y fondo general con aportaciones y actividades en 2026.
    beforeEach(async () => {
      a = await proyecto('A Agua');
      b = await proyecto('B Comedor');
      donanteA = await donante();
      const d2 = await donante();
      await aportacion({ donanteId: donanteA.id, proyectoId: a.id, importe: '50.00', fechaCobro: '2026-02-15T10:00:00+01:00' });
      await aportacion({ donanteId: d2.id, proyectoId: a.id, modalidad: 'cuota_socio', importe: '10.00', fechaCobro: '2026-03-01T08:00:00+01:00' });
      await aportacion({ donanteId: d2.id, proyectoId: a.id, importe: '25.50', fechaCobro: '2026-05-10T12:00:00+02:00' });
      await aportacion({ donanteId: d2.id, proyectoId: b.id, importe: '100.00', fechaCobro: '2026-12-31T23:30:00+01:00' });
      await aportacion({ donanteId: donanteA.id, importe: '30.00', fechaCobro: '2026-07-01T11:00:00+02:00' });
      await actividad({ proyectoId: a.id, inicio: '2026-03-18T10:00:00+01:00' });
      await actividad({ proyectoId: b.id, inicio: '2026-09-15T10:00:00+02:00' });
    });

    it('escenarios 1 y 2: una fila por proyecto, otra de fondo general y la de totales, con todas las cifras', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026 });

      expect(informe.vacio).toBe(false);
      expect(informe.filtros).toEqual({ ...AÑO_2026, proyecto: null, agrupacion: null });
      expect(informe.filas.map((f) => [f.tipo, f.proyecto?.nombre ?? null])).toEqual([
        ['proyecto', a.nombre],
        ['proyecto', b.nombre],
        ['fondoGeneral', null],
        ['total', null],
      ]);
      const [filaA, filaB, fondo, total] = informe.filas;
      expect(filaA).toMatchObject({ periodo: null, proyecto: { id: a.id, nombre: a.nombre } });
      expect(cifras(filaA)).toEqual({ ...ceros, recaudadoPuntual: '75.50', recaudadoCuotas: '10.00', recaudadoTotal: '85.50', aportaciones: 3, actividades: 1 });
      expect(cifras(filaB)).toEqual({ ...ceros, recaudadoPuntual: '100.00', recaudadoTotal: '100.00', aportaciones: 1, actividades: 1 });
      expect(cifras(fondo)).toEqual({ ...ceros, recaudadoPuntual: '30.00', recaudadoTotal: '30.00', aportaciones: 1 });
      expect(cifras(total)).toEqual({ ...ceros, recaudadoPuntual: '205.50', recaudadoCuotas: '10.00', recaudadoTotal: '215.50', aportaciones: 5, actividades: 2 });
    });

    it('escenario 3: con el filtro de A solo aparecen sus cifras', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026, proyectoId: a.id });
      expect(informe.filtros.proyecto).toEqual({ id: a.id, nombre: a.nombre });
      expect(informe.filas.map((f) => f.tipo)).toEqual(['proyecto', 'total']);
      expect(informe.filas[0].proyecto.id).toBe(a.id);
      expect(cifras(informe.filas[1])).toEqual(cifras(informe.filas[0]));
    });

    it('escenario 4: por trimestre, filas por trimestre y proyecto, subtotales y total', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026, agrupacion: 'trimestre' });
      const resumen = informe.filas.map((f) => [f.periodo?.etiqueta ?? null, f.tipo, f.proyecto?.nombre ?? null, f.recaudadoTotal, f.actividades]);
      expect(resumen).toEqual([
        ['T1 2026', 'proyecto', a.nombre, '60.00', 1],
        ['T1 2026', 'subtotal', null, '60.00', 1],
        ['T2 2026', 'proyecto', a.nombre, '25.50', 0],
        ['T2 2026', 'subtotal', null, '25.50', 0],
        ['T3 2026', 'proyecto', b.nombre, '0.00', 1],
        ['T3 2026', 'fondoGeneral', null, '30.00', 0],
        ['T3 2026', 'subtotal', null, '30.00', 1],
        ['T4 2026', 'proyecto', b.nombre, '100.00', 0],
        ['T4 2026', 'subtotal', null, '100.00', 0],
        [null, 'total', null, '215.50', 2],
      ]);
      expect(informe.filas[0].periodo).toEqual({ etiqueta: 'T1 2026', desde: '2026-01-01', hasta: '2026-03-31' });
      expect(informe.filas[7].periodo).toEqual({ etiqueta: 'T4 2026', desde: '2026-10-01', hasta: '2026-12-31' });
    });

    it('por mes y por año; los periodos se recortan al rango pedido', async () => {
      const meses = await servicio.generarInforme({ desde: '2026-02-15', hasta: '2026-03-20', agrupacion: 'mes' });
      expect(meses.filas.map((f) => f.periodo)).toEqual([
        { etiqueta: '02/2026', desde: '2026-02-15', hasta: '2026-02-28' },
        { etiqueta: '02/2026', desde: '2026-02-15', hasta: '2026-02-28' },
        { etiqueta: '03/2026', desde: '2026-03-01', hasta: '2026-03-20' },
        { etiqueta: '03/2026', desde: '2026-03-01', hasta: '2026-03-20' },
        null,
      ]);
      const anios = await servicio.generarInforme({ desde: '2025-06-01', hasta: '2026-12-31', agrupacion: 'anio' });
      expect(anios.filas.filter((f) => f.tipo === 'subtotal').map((f) => [f.periodo.etiqueta, f.periodo.desde, f.recaudadoTotal])).toEqual([
        ['2026', '2026-01-01', '215.50'],
      ]);
    });

    it('escenario 5 y caso límite: no cuentan las no confirmadas ni las de fuera del periodo (hora de Madrid)', async () => {
      const c = await proyecto('C Límites');
      for (const estado of ['pendiente', 'rechazada', 'cancelada']) {
        await aportacion({ donanteId: donanteA.id, proyectoId: c.id, importe: '40.00', estado });
      }
      await aportacion({ donanteId: donanteA.id, proyectoId: c.id, importe: '20.00', fechaCobro: '2027-01-01T00:00:00+01:00' });
      await aportacion({ donanteId: donanteA.id, proyectoId: c.id, importe: '60.00', fechaCobro: '2025-12-31T23:59:59+01:00' });
      await aportacion({ donanteId: donanteA.id, proyectoId: c.id, importe: '7.00', fechaCobro: '2026-01-01T00:00:00+01:00' });

      const informe = await servicio.generarInforme({ ...AÑO_2026, proyectoId: c.id });

      expect(cifras(informe.filas[0])).toEqual({ ...ceros, recaudadoPuntual: '7.00', recaudadoTotal: '7.00', aportaciones: 1 });
    });

    it('suma al céntimo, también por encima del máximo de una aportación', async () => {
      const c = await proyecto('C Céntimos');
      for (const importe of ['1.10', '1.20', '999999.99', '999999.99']) {
        await aportacion({ donanteId: donanteA.id, proyectoId: c.id, importe, fechaCobro: '2026-06-01T12:00:00+02:00' });
      }
      const informe = await servicio.generarInforme({ ...AÑO_2026, proyectoId: c.id });
      expect(informe.filas[0].recaudadoTotal).toBe('2000002.28');
    });

    it('SC-001: cada subtotal y el total cuadran con sus filas', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026, agrupacion: 'mes' });
      const centimos = (t) => Math.round(Number(t) * 100);
      const sumar = (filas, clave) => filas.reduce((s, f) => s + (typeof f[clave] === 'number' ? f[clave] : centimos(f[clave])), 0);
      const detalle = informe.filas.filter((f) => f.tipo === 'proyecto' || f.tipo === 'fondoGeneral');
      const total = informe.filas.at(-1);
      for (const clave of ['recaudadoPuntual', 'recaudadoCuotas', 'recaudadoTotal', 'aportaciones', 'actividades', 'horas']) {
        const valor = typeof total[clave] === 'number' ? total[clave] : centimos(total[clave]);
        expect(sumar(detalle, clave)).toBe(valor);
        for (const sub of informe.filas.filter((f) => f.tipo === 'subtotal')) {
          const delPeriodo = detalle.filter((f) => f.periodo.etiqueta === sub.periodo.etiqueta);
          expect(sumar(delPeriodo, clave)).toBe(typeof sub[clave] === 'number' ? sub[clave] : centimos(sub[clave]));
        }
      }
    });

    it('escenario 7: un periodo sin datos da un informe vacío, no un error', async () => {
      expect(await servicio.generarInforme({ desde: '2019-01-01', hasta: '2019-12-31', agrupacion: 'mes' })).toEqual({
        filtros: { desde: '2019-01-01', hasta: '2019-12-31', proyecto: null, agrupacion: 'mes' },
        vacio: true,
        filas: [],
      });
    });

    it('casos límite de proyectos: el inactivo con datos aparece; el activo sin datos, no', async () => {
      const inactivo = await proyecto('Campaña vieja', false);
      await proyecto('Sin datos');
      await aportacion({ donanteId: donanteA.id, proyectoId: inactivo.id, importe: '70.00', fechaCobro: '2026-11-20T09:00:00+01:00' });

      const nombres = (await servicio.generarInforme({ ...AÑO_2026 })).filas.map((f) => f.proyecto?.nombre).filter(Boolean);

      expect(nombres).toEqual([a.nombre, b.nombre, inactivo.nombre]);
    });

    it('casos límite de actividades: solo cuentan las celebradas, en el periodo de su inicio', async () => {
      const c = await proyecto('C Actividades');
      await actividad({ proyectoId: c.id, inicio: '2026-04-01T10:00:00+02:00' }); // celebrada sin asistencias
      await actividad({ proyectoId: c.id, inicio: '2026-04-02T10:00:00+02:00', estado: 'cancelada' });
      await actividad({ proyectoId: c.id, inicio: '2026-04-03T10:00:00+02:00', estado: 'borrador' });
      await actividad({ proyectoId: c.id, inicio: '2026-12-31T22:00:00+01:00', fin: '2027-01-01T02:00:00+01:00' });
      await actividad({ proyectoId: c.id, inicio: '2027-01-01T00:30:00+01:00' }); // otro año

      const anual = await servicio.generarInforme({ ...AÑO_2026, proyectoId: c.id });
      expect(cifras(anual.filas[0])).toEqual({ ...ceros, actividades: 2 });

      // Con «ahora» antes de la cena del 31/12, aún no está celebrada.
      const antes = crearServicio({ ahora: () => new Date('2026-12-31T12:00:00+01:00') });
      expect((await antes.generarInforme({ ...AÑO_2026, proyectoId: c.id })).filas[0].actividades).toBe(1);
    });

    it('errores: fin anterior al inicio y proyecto inexistente', async () => {
      await expect(servicio.generarInforme({ desde: '2026-12-31', hasta: '2026-01-01' })).rejects.toMatchObject({
        estado: 400,
        codigo: 'PERIODO_NO_VALIDO',
        message: 'La fecha de fin no puede ser anterior a la de inicio.',
        campos: { hasta: 'La fecha de fin no puede ser anterior a la de inicio.' },
      });
      await expect(servicio.generarInforme({ ...AÑO_2026, proyectoId: '999999' })).rejects.toMatchObject({
        estado: 404,
        codigo: 'PROYECTO_NO_ENCONTRADO',
      });
    });

    it('un solo día cuenta completo (desde y hasta iguales)', async () => {
      const informe = await servicio.generarInforme({ desde: '2026-12-31', hasta: '2026-12-31' });
      expect(informe.filas.at(-1).recaudadoTotal).toBe('100.00');
    });
  });

  describe('API (FR-008, FR-009)', () => {
    it('escenario 9: 401 sin sesión y 403 sin rol de administrador', async () => {
      for (const ruta of ['/api/informes?desde=2026-01-01&hasta=2026-12-31', '/api/informes/proyectos']) {
        expect((await request(app).get(ruta)).status).toBe(401);
        const donanteSesion = await entrar('donante');
        const res = await donanteSesion.get(ruta);
        expect(res.status).toBe(403);
        expect(res.body.error.codigo).toBe('SIN_PERMISO');
      }
    });

    it('el administrador obtiene el informe y nunca datos personales', async () => {
      const p = await proyecto('API');
      const d = await donante();
      await aportacion({ donanteId: d.id, proyectoId: p.id, importe: '12.00', fechaCobro: '2026-03-01T10:00:00+01:00' });
      const act = await actividad({ proyectoId: p.id, inicio: '2026-03-02T10:00:00+01:00' });
      await inscripcion((await voluntario()).id, act.id);

      const admin = await entrar('admin');
      const res = await admin.get('/api/informes').query({ ...AÑO_2026, agrupacion: 'trimestre' });

      expect(res.status).toBe(200);
      expect(res.body.filas.at(-1)).toMatchObject({ tipo: 'total', recaudadoTotal: '12.00', aportaciones: 1, actividades: 1 });
      const texto = JSON.stringify(res.body);
      for (const dato of [d.nifNie, d.correo, 'Donante Informe', 'Calle Privada', 'Secreta Informe', 'vol-secreta@prueba.test', '600 000 000']) {
        expect(texto).not.toContain(dato);
      }
    });

    it('escenario 8 y validación: 400 con el mensaje junto a su campo', async () => {
      const admin = await entrar('admin');
      const fin = await admin.get('/api/informes').query({ desde: '2026-12-31', hasta: '2026-01-01' });
      expect(fin.status).toBe(400);
      expect(fin.body.error).toEqual({
        codigo: 'PERIODO_NO_VALIDO',
        mensaje: 'La fecha de fin no puede ser anterior a la de inicio.',
        campos: { hasta: 'La fecha de fin no puede ser anterior a la de inicio.' },
      });

      const casos = [
        [{ hasta: '2026-12-31' }, 'desde'],
        [{ desde: '2026-01-01' }, 'hasta'],
        [{ desde: '01/01/2026', hasta: '2026-12-31' }, 'desde'],
        [{ desde: '2026-02-30', hasta: '2026-12-31' }, 'desde'],
        [{ ...AÑO_2026, proyectoId: 'abc' }, 'proyectoId'],
        [{ ...AÑO_2026, agrupacion: 'semana' }, 'agrupacion'],
      ];
      for (const [consulta, campo] of casos) {
        const res = await admin.get('/api/informes').query(consulta);
        expect(res.status, JSON.stringify(consulta)).toBe(400);
        expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
        expect(Object.keys(res.body.error.campos)).toContain(campo);
      }

      const vacios = await admin.get('/api/informes').query({ ...AÑO_2026, proyectoId: '', agrupacion: '' });
      expect(vacios.status).toBe(200);
      const inexistente = await admin.get('/api/informes').query({ ...AÑO_2026, proyectoId: '999999' });
      expect(inexistente.status).toBe(404);
    });

    it('la lista de proyectos del filtro incluye los inactivos', async () => {
      const activo = await proyecto('Lista activo');
      const inactivo = await proyecto('Lista inactivo', false);
      const admin = await entrar('admin');
      const res = await admin.get('/api/informes/proyectos');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(res.body.datos.length);
      expect(res.body.datos).toEqual(
        expect.arrayContaining([
          { id: activo.id, nombre: activo.nombre, activo: true },
          { id: inactivo.id, nombre: inactivo.nombre, activo: false },
        ]),
      );
    });
  });

  describe('exportación (US2, FR-006, SC-003)', () => {
    let filtros;
    let datosPersonales;

    const binario = (res, fin) => {
      const trozos = [];
      res.on('data', (t) => trozos.push(t));
      res.on('end', () => fin(null, Buffer.concat(trozos)));
    };

    beforeEach(async () => {
      const p = await proyecto('Export; "A"');
      const q = await proyecto('Export B');
      const d = await donante();
      await aportacion({ donanteId: d.id, proyectoId: p.id, importe: '1234.50', fechaCobro: '2026-02-01T10:00:00+01:00' });
      await aportacion({ donanteId: d.id, proyectoId: q.id, modalidad: 'cuota_socio', importe: '10.00', fechaCobro: '2026-05-01T10:00:00+02:00' });
      await aportacion({ donanteId: d.id, importe: '30.00', fechaCobro: '2026-08-01T10:00:00+02:00' });
      await actividad({ proyectoId: q.id, inicio: '2026-05-02T10:00:00+02:00' });
      filtros = { ...AÑO_2026, agrupacion: 'trimestre' };
      datosPersonales = [d.nifNie, d.correo, 'Donante Informe', 'Calle Privada'];
    });

    it('SC-003: el CSV tiene las mismas filas y cifras que la pantalla', async () => {
      const admin = await entrar('admin');
      const pantalla = (await admin.get('/api/informes').query(filtros)).body;
      const res = await admin.get('/api/informes/csv').query(filtros);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toBe('attachment; filename="informe-2026-01-01-2026-12-31.csv"');
      expect(res.text.startsWith('﻿')).toBe(true);
      const lineas = res.text.slice(1).split('\r\n').filter(Boolean);
      expect(lineas).toHaveLength(pantalla.filas.length + 1);
      const coma = (t) => t.replace('.', ',');
      pantalla.filas.forEach((fila, i) => {
        const celdas = lineas[i + 1].match(/("([^"]|"")*"|[^;]*)(;|$)/g).map((c) => c.replace(/;$/, ''));
        expect(celdas.slice(2, 8)).toEqual([
          coma(fila.recaudadoPuntual),
          coma(fila.recaudadoCuotas),
          coma(fila.recaudadoTotal),
          String(fila.aportaciones),
          String(fila.actividades),
          String(fila.voluntarios),
        ]);
        expect(celdas[0]).toBe(fila.periodo?.etiqueta ?? '');
      });
      expect(lineas[1]).toContain('"Export; ""A""');
      for (const dato of datosPersonales) expect(res.text).not.toContain(dato);
    });

    it('SC-003: el PDF es un PDF y su tabla tiene las mismas filas que la pantalla', async () => {
      const { definicionPdfInforme } = await import('./textos.js');
      const admin = await entrar('admin');
      const pantalla = (await admin.get('/api/informes').query(filtros)).body;
      const res = await admin.get('/api/informes/pdf').query(filtros).buffer(true).parse(binario);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toBe('attachment; filename="informe-2026-01-01-2026-12-31.pdf"');
      expect(res.body.subarray(0, 4).toString()).toBe('%PDF');
      const tabla = definicionPdfInforme(pantalla).bloques[1];
      expect(tabla.filas).toHaveLength(pantalla.filas.length);
      expect(JSON.stringify(definicionPdfInforme(pantalla))).not.toMatch(new RegExp(datosPersonales.join('|')));
    });

    it('un informe vacío también se exporta (CSV con la cabecera, PDF con el mensaje)', async () => {
      const admin = await entrar('admin');
      const vacio = { desde: '2019-01-01', hasta: '2019-12-31' };
      const csv = await admin.get('/api/informes/csv').query(vacio);
      expect(csv.status).toBe(200);
      expect(csv.text.slice(1).split('\r\n').filter(Boolean)).toHaveLength(1);
      const pdf = await admin.get('/api/informes/pdf').query(vacio).buffer(true).parse(binario);
      expect(pdf.status).toBe(200);
    });

    it('/csv y /pdf: 401, 403 y los mismos errores de validación', async () => {
      const admin = await entrar('admin');
      const donanteSesion = await entrar('donante');
      for (const formato of ['csv', 'pdf']) {
        const ruta = `/api/informes/${formato}`;
        expect((await request(app).get(ruta).query(filtros)).status).toBe(401);
        expect((await donanteSesion.get(ruta).query(filtros)).status).toBe(403);
        const fin = await admin.get(ruta).query({ desde: '2026-12-31', hasta: '2026-01-01' });
        expect(fin.status).toBe(400);
        expect(fin.body.error.codigo).toBe('PERIODO_NO_VALIDO');
        expect((await admin.get(ruta).query({ desde: '2026-01-01' })).body.error.codigo).toBe('DATOS_INVALIDOS');
      }
    });
  });

  // Fase 6: voluntarios distintos y horas con las asistencias de HU-08 (research R3 y R5).
  describe('voluntariado (escenario 6, FR-004, SC-001, FR-009)', () => {
    let a;
    let b;
    let v1;
    let v2;
    let v3;
    let actA1;
    let actA2;
    let actB;

    // A: dos actividades en T1 y T2; B: una en T1. v1 va a las tres (A y B), v2 solo a A1 y
    // v3 tiene la asistencia corregida a «no asistió» en B.
    beforeEach(async () => {
      a = await proyecto('A Agua');
      b = await proyecto('B Comedor');
      [v1, v2, v3] = [await voluntario(), await voluntario(), await voluntario()];
      actA1 = await actividad({ proyectoId: a.id, inicio: '2026-02-10T10:00:00+01:00' });
      actA2 = await actividad({ proyectoId: a.id, inicio: '2026-05-10T10:00:00+02:00' });
      actB = await actividad({ proyectoId: b.id, inicio: '2026-03-20T10:00:00+01:00' });
      await asistencia((await inscripcion(v1.id, actA1.id)).id, { horas: '2.25' });
      await asistencia((await inscripcion(v2.id, actA1.id)).id, { horas: '1.50' });
      await asistencia((await inscripcion(v1.id, actA2.id)).id, { horas: '3.00' });
      await asistencia((await inscripcion(v1.id, actB.id)).id, { horas: '0.75' });
      await asistencia((await inscripcion(v3.id, actB.id)).id, { asistio: false, horas: '4.00' });
    });

    it('escenario 6 y SC-001: las horas son la suma exacta de las asistencias, a la centésima', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026 });
      const [filaA, filaB, total] = informe.filas;

      expect(filaA).toMatchObject({ tipo: 'proyecto', proyecto: { id: a.id }, actividades: 2, voluntarios: 2, horas: '6.75' });
      expect(filaB).toMatchObject({ tipo: 'proyecto', proyecto: { id: b.id }, actividades: 1, voluntarios: 1, horas: '0.75' });
      expect(total).toMatchObject({ tipo: 'total', actividades: 3, horas: '7.50' });
      const { rows } = await pool.query('SELECT sum(horas)::text AS horas FROM asistencias WHERE asistio');
      expect(total.horas).toBe(rows[0].horas);
    });

    it('caso límite: una asistencia corregida a «no asistió» no cuenta horas ni voluntario', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026, proyectoId: b.id });
      expect(cifras(informe.filas[0])).toEqual({ ...ceros, actividades: 1, voluntarios: 1, horas: '0.75' });

      await pool.query('UPDATE asistencias SET asistio = false WHERE inscripcion_id IN (SELECT id FROM inscripciones WHERE actividad_id = $1)', [actB.id]);
      const corregido = await servicio.generarInforme({ ...AÑO_2026, proyectoId: b.id });
      expect(cifras(corregido.filas[0])).toEqual({ ...ceros, actividades: 1 });
    });

    it('clarify 3: un voluntario en dos proyectos cuenta 1 en cada fila y 1 en el subtotal y el total', async () => {
      const informe = await servicio.generarInforme({ ...AÑO_2026, agrupacion: 'trimestre' });
      const resumen = informe.filas.map((f) => [f.tipo, f.periodo?.etiqueta ?? null, f.proyecto?.id ?? null, f.voluntarios, f.horas]);

      expect(resumen).toEqual([
        ['proyecto', 'T1 2026', a.id, 2, '3.75'],
        ['proyecto', 'T1 2026', b.id, 1, '0.75'],
        ['subtotal', 'T1 2026', null, 2, '4.50'],
        ['proyecto', 'T2 2026', a.id, 1, '3.00'],
        ['subtotal', 'T2 2026', null, 1, '3.00'],
        ['total', null, null, 2, '7.50'],
      ]);
    });

    it('caso límite: una actividad celebrada sin asistencias cuenta 1 actividad, 0 voluntarios y 0.00 h', async () => {
      const c = await proyecto('C Sin asistencias');
      const act = await actividad({ proyectoId: c.id, inicio: '2026-06-01T10:00:00+02:00' });
      await inscripcion(v2.id, act.id);

      const informe = await servicio.generarInforme({ ...AÑO_2026, proyectoId: c.id });
      expect(cifras(informe.filas[0])).toEqual({ ...ceros, actividades: 1 });
      expect(cifras(informe.filas.at(-1))).toEqual({ ...ceros, actividades: 1 });
    });

    it('no cuentan las asistencias de actividades canceladas, futuras o fuera del periodo', async () => {
      const c = await proyecto('C Fuera');
      for (const datos of [
        { proyectoId: c.id, inicio: '2026-04-01T10:00:00+02:00', estado: 'cancelada' },
        { proyectoId: c.id, inicio: '2025-12-31T22:00:00+01:00' },
        { proyectoId: c.id, inicio: '2027-01-20T10:00:00+01:00' },
      ]) {
        const act = await actividad(datos);
        await asistencia((await inscripcion(v2.id, act.id)).id, { horas: '5.00' });
      }
      const informe = await servicio.generarInforme({ ...AÑO_2026 });
      expect(informe.filas.map((f) => f.proyecto?.id ?? null)).not.toContain(c.id);
      expect(informe.filas.at(-1)).toMatchObject({ actividades: 3, voluntarios: 2, horas: '7.50' });
    });

    it('FR-009: el JSON, el CSV y el PDF no contienen datos de los voluntarios; el CSV lleva las horas con un decimal', async () => {
      const { definicionPdfInforme } = await import('./textos.js');
      const admin = await entrar('admin');
      const filtros = { ...AÑO_2026, agrupacion: 'trimestre' };
      const pantalla = (await admin.get('/api/informes').query(filtros)).body;
      const csv = (await admin.get('/api/informes/csv').query(filtros)).text;
      const pdf = JSON.stringify(definicionPdfInforme(pantalla));

      expect(pantalla.filas.at(-1)).toMatchObject({ voluntarios: 2, horas: '7.50' });
      const lineas = csv.slice(1).split('\r\n').filter(Boolean);
      expect(lineas.at(-1).split(';').slice(-2)).toEqual(['2', '7,5']);
      expect(pdf).toContain('7,5 h');
      const { rows } = await pool.query(
        `SELECT u.correo AS cuenta FROM voluntarios v JOIN usuarios u ON u.id = v.usuario_id WHERE v.id = ANY($1::bigint[])`,
        [[v1.id, v2.id, v3.id]],
      );
      const datos = ['Voluntaria', 'Secreta Informe', 'vol-secreta@prueba.test', '600 000 000', ...rows.map((r) => r.cuenta)];
      for (const salida of [JSON.stringify(pantalla), csv, pdf]) {
        for (const dato of datos) expect(salida).not.toContain(dato);
      }
    });
  });
});
