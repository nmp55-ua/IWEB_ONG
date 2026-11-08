import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile, link, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const ejecutar = promisify(execFile);
const raizBackend = fileURLToPath(new URL('../../../../', import.meta.url));
export const contrasenaPruebas = 'clave-sintetica-hu01';
export const secretoSesionPruebas = 'hu01-sesion-sintetica-compartida-entre-procesos';

export async function verificarEsquemaPruebas(cliente, esquema) {
  const { rows } = await cliente.query('SELECT current_database() AS base, current_schema() AS esquema');
  if (rows[0].base !== 'ong_test_hu01' || rows[0].esquema !== esquema || !/^hu01_[a-z0-9_]+$/.test(esquema)) {
    throw new Error('Esquema exclusivo de pruebas incorrecto.');
  }
  for (const tabla of [
    'donantes',
    'aportaciones',
    'suscripciones_socio',
    'operaciones_pago',
    'eventos_pasarela',
    'verificaciones_donante',
    'correos_aportacion',
  ]) {
    if (!(await cliente.query('SELECT to_regclass($1) AS tabla', [tabla])).rows[0].tabla) {
      throw new Error(`Falta tabla de pruebas: ${tabla}`);
    }
  }
}

export async function crearEntornoPruebas() {
  const conexion = process.env.TEST_DATABASE_URL;
  if (!conexion || conexion !== process.env.DATABASE_URL || new URL(conexion).pathname !== '/ong_test_hu01') {
    throw new Error('Selecciona DATABASE_URL y TEST_DATABASE_URL iguales para ong_test_hu01.');
  }
  const administrador = new pg.Client({ connectionString: conexion });
  let creado = false;
  const esquema = `hu01_integracion_${randomUUID().replaceAll('-', '')}`;
  let pool;
  const clientes = new Set();
  const cerrar = async () => {
    for (const cliente of clientes) cliente.release(true);
    if (pool) await pool.end();
    try {
      if (creado) await administrador.query(`DROP SCHEMA "${esquema}" CASCADE`);
    } finally {
      await administrador.end();
    }
  };
  try {
    await administrador.connect();
    const base = (await administrador.query('SELECT current_database() AS nombre')).rows[0].nombre;
    if (base !== 'ong_test_hu01') throw new Error('Base de pruebas incorrecta.');
    await administrador.query(`CREATE SCHEMA "${esquema}"`);
    creado = true;
    const url = new URL(conexion);
    url.searchParams.set('options', `-csearch_path=${esquema} -cstatement_timeout=5000`);
    pool = new pg.Pool({ connectionString: url.href, max: 4 });
    const migrar = async () =>
      (
        await ejecutar(process.execPath, ['src/db/migrar.js'], {
          cwd: raizBackend,
          env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: url.href, TEST_DATABASE_URL: url.href },
          timeout: 30000,
          windowsHide: true,
        })
      ).stdout.trim();
    await migrar();
    await verificarEsquemaPruebas(pool, esquema);
    return {
      esquema,
      urlConexion: url.href,
      pool,
      migrar,
      cerrar,
      secretoSesion: secretoSesionPruebas,
      async conectar() {
        const cliente = await pool.connect();
        const liberar = cliente.release.bind(cliente);
        cliente.release = (destruir) => {
          clientes.delete(cliente);
          liberar(destruir);
        };
        clientes.add(cliente);
        return cliente;
      },
      async crearSesion(datos = {}) {
        const id = randomUUID();
        const sesion = { ...datos, cookie: { expires: new Date(Date.now() + 24 * 3600000).toISOString() } };
        await pool.query('INSERT INTO sesiones (sid, sess, expire) VALUES ($1, $2, $3)', [
          id,
          sesion,
          sesion.cookie.expires,
        ]);
        return { id, datos: sesion };
      },
      async leerSesion(id) {
        return (
          (await pool.query('SELECT sess FROM sesiones WHERE sid = $1 AND expire > now()', [id])).rows[0]
            ?.sess ?? null
        );
      },
      async crearFixtures() {
        const hash = await bcrypt.hash(contrasenaPruebas, 4);
        const usuarios = [];
        const donantes = [];
        const nifs = ['12345678Z', '00000000T'];
        for (let i = 0; i < 2; i++) {
          const correo = `persona-${i}@example.test`;
          const usuario = (
            await pool.query(
              `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles)
            VALUES ($1, $2, 'Prueba', ARRAY['donante']) RETURNING *`,
              [correo, hash],
            )
          ).rows[0];
          usuarios.push(usuario);
          donantes.push(
            (
              await pool.query(
                `INSERT INTO donantes (usuario_id,nombre,apellidos,nif_nie,correo,direccion)
            VALUES ($1,'Prueba','Sintetica',$2,$3,'Calle Ejemplo 1') RETURNING *`,
                [usuario.id, nifs[i], correo],
              )
            ).rows[0],
          );
        }
        const invitado = (
          await pool.query(`INSERT INTO donantes (nombre,apellidos,nif_nie,correo,direccion)
          VALUES ('Invitado','Sintetico','99999999R','invitado@example.test','Calle Ejemplo 2') RETURNING *`)
        ).rows[0];
        const proyecto = (
          await pool.query("INSERT INTO proyectos (nombre) VALUES ('Proyecto sintetico') RETURNING *")
        ).rows[0];
        const aportaciones = [];
        for (const donante of [...donantes, invitado]) {
          aportaciones.push(
            (
              await pool.query(
                `INSERT INTO aportaciones (donante_id,modalidad,importe,referencia)
            VALUES ($1,'puntual',20.00,$2) RETURNING *`,
                [donante.id, `DON-TEST-${randomUUID()}`],
              )
            ).rows[0],
          );
        }
        return { usuarios, donantes, invitado, proyecto, aportaciones };
      },
    };
  } catch (error) {
    await cerrar();
    throw error;
  }
}

function canonico(valor) {
  if (Array.isArray(valor)) return valor.map(canonico);
  if (valor && typeof valor === 'object')
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((k) => [k, canonico(valor[k])]),
    );
  return valor;
}

// Simulador de pruebas: publicación atómica de un registro completo por clave.
// No modela la retención o las garantías reales de Stripe.
export function crearSimuladorStripe(directorio) {
  return {
    async crearSesion(cuerpo, { idempotencyKey }) {
      if (typeof idempotencyKey !== 'string' || !idempotencyKey)
        throw new Error('Falta clave del simulador.');
      await mkdir(directorio, { recursive: true });
      const clave = createHash('sha256').update(idempotencyKey).digest('hex');
      const archivo = join(directorio, `${clave}.json`);
      const temporal = join(directorio, `${randomUUID()}.tmp`);
      const solicitud = JSON.stringify(canonico(cuerpo));
      const registro = {
        solicitud,
        respuesta: { id: `cs_test_${clave}`, url: `https://checkout.example.test/${clave}` },
      };
      await writeFile(temporal, JSON.stringify(registro), { flag: 'wx' });
      try {
        await link(temporal, archivo);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      } finally {
        await unlink(temporal);
      }
      const guardado = JSON.parse(await readFile(archivo, 'utf8'));
      if (guardado.solicitud !== solicitud)
        throw new Error('Solicitud incompatible con la clave del simulador.');
      return structuredClone(guardado.respuesta);
    },
  };
}

export function recursosCanonicos(referencia, centimos = 2000) {
  const metadata = { referencia, modulo: 'donaciones' };
  return {
    pago: {
      id: 'pi_test',
      amount: centimos,
      amount_received: centimos,
      currency: 'eur',
      status: 'succeeded',
      invoice: 'in_test',
      metadata,
      livemode: false,
    },
    factura: {
      id: 'in_test',
      subscription: 'sub_test',
      payment_intent: 'pi_test',
      billing_reason: 'subscription_create',
      paid: true,
      paid_out_of_band: false,
      amount_paid: centimos,
      currency: 'eur',
      status: 'paid',
      status_transitions: { paid_at: 1800000000 },
      next_payment_attempt: null,
      livemode: false,
    },
    suscripcion: {
      id: 'sub_test',
      metadata: { ...metadata },
      status: 'active',
      latest_invoice: 'in_test',
      collection_method: 'charge_automatically',
      current_period_end: 1802678400,
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: null,
      livemode: false,
    },
    sesion: {
      id: 'cs_test',
      status: 'complete',
      payment_status: 'paid',
      mode: 'subscription',
      client_reference_id: referencia,
      metadata: { ...metadata },
      payment_intent: 'pi_test',
      subscription: 'sub_test',
      invoice: 'in_test',
      url: null,
      expires_at: 1800086400,
      livemode: false,
    },
  };
}
