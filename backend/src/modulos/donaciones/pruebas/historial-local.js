// Fixtures de HU-02: importar este módulo no abre conexiones ni arranca servicios.
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import {
  contrasenaPruebas,
  verificarEsquemaPruebas,
  crearEntornoPruebas,
  secretoSesionPruebas,
} from './soporte.js';
import { createServer, request as solicitarHttp } from 'node:http';
import { fork, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { exportarTrazaReal } from './traza-navegador.js';

export async function insertarAportacionHistorial(pool, donanteId, datos = {}) {
  const {
    importe = '1.00',
    estado = 'confirmada',
    fecha = '2025-06-15T11:00:00Z',
    proyectoId = null,
    suscripcionId = null,
    id = null,
  } = datos;
  return (
    await pool.query(
      `INSERT INTO aportaciones
         (id,donante_id,proyecto_id,suscripcion_socio_id,modalidad,importe,estado,fecha_cobro,referencia,pasarela_pago_id)
       VALUES (COALESCE($1::bigint,nextval('aportaciones_id_seq')),$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id,
        donanteId,
        proyectoId,
        suscripcionId,
        suscripcionId ? 'cuota_socio' : 'puntual',
        importe,
        estado,
        estado === 'confirmada' ? fecha : null,
        `DON-HU02-${randomUUID()}`,
        `pi_sintetico_${randomUUID()}`,
      ],
    )
  ).rows[0];
}

export async function crearFixturesHistorial(entorno) {
  if (process.env.NODE_ENV !== 'test') throw new Error('Fixtures permitidos únicamente en pruebas.');
  await verificarEsquemaPruebas(entorno.pool, entorno.esquema);
  const { pool } = entorno;
  const hash = await bcrypt.hash(contrasenaPruebas, 4);
  const cuentas = {};
  const nombres = [
    'principal',
    'otra',
    'sinVinculo',
    'vacio',
    'voluntario',
    'inactivo',
    'fechas',
    'grande',
    'empates',
    'extenso',
    'periodico',
  ];
  for (const [i, nombre] of nombres.entries()) {
    const correo = `${nombre.toLowerCase()}@historial.example.test`;
    const usuario = (
      await pool.query(
        `INSERT INTO usuarios (correo,hash_contrasena,nombre,roles,activo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [correo, hash, nombre, [nombre === 'voluntario' ? 'voluntario' : 'donante'], nombre !== 'inactivo'],
      )
    ).rows[0];
    const numero = 10000000 + i;
    const nif = `${numero}${'TRWAGMYFPDXBNJZSQVHLCKE'[numero % 23]}`;
    const donante = (
      await pool.query(
        `INSERT INTO donantes (usuario_id,nombre,apellidos,nif_nie,correo,direccion)
       VALUES ($1,$2,'Sintetico',$3,$4,'Calle Prueba 1') RETURNING *`,
        [nombre === 'sinVinculo' ? null : usuario.id, nombre, nif, correo],
      )
    ).rows[0];
    cuentas[nombre] = { usuario, donante };
  }
  const proyecto = (
    await pool.query(
      "INSERT INTO proyectos (nombre,activo) VALUES ('Destino historico sintetico',false) RETURNING *",
    )
  ).rows[0];
  const aportar = (nombre, datos) => insertarAportacionHistorial(pool, cuentas[nombre].donante.id, datos);
  const suscripcion = async (nombre, importe, estado = 'activa') =>
    (
      await pool.query(
        `INSERT INTO suscripciones_socio (donante_id,importe,periodicidad,estado,fecha_alta)
     VALUES ($1,$2,'mensual',$3,'2021-01-15T11:00:00Z') RETURNING *`,
        [cuentas[nombre].donante.id, importe, estado],
      )
    ).rows[0];
  const socioCancelado = await suscripcion('principal', '30.00', 'cancelada');
  const principal = [
    await aportar('principal', { importe: '50.00', fecha: '2025-01-15T11:00:00Z' }),
    await aportar('principal', {
      importe: '30.00',
      fecha: '2025-12-15T11:00:00Z',
      proyectoId: proyecto.id,
      suscripcionId: socioCancelado.id,
    }),
    await aportar('principal', { importe: '20.00', fecha: '2026-01-15T11:00:00Z' }),
  ];
  await pool.query(
    "INSERT INTO correos_aportacion (aportacion_id,tipo,resumen,estado,intentos) VALUES ($1,'confirmacion',$2,'fallido',1)",
    [
      principal[1].id,
      {
        referencia: principal[1].referencia,
        importe: '30.00',
        modalidad: 'cuota_socio',
        destino: proyecto.nombre,
      },
    ],
  );
  for (const estado of ['pendiente', 'rechazada', 'cancelada'])
    await aportar('principal', { estado, importe: '99.99' });
  await aportar('otra', { importe: '7.00' });
  await aportar('sinVinculo', { importe: '9.00' });
  await aportar('fechas', { fecha: '2025-12-31T22:59:59Z' });
  await aportar('fechas', { fecha: '2025-12-31T23:00:00Z', importe: '2.00' });
  await aportar('grande', { importe: '999999.99' });
  await aportar('grande', { importe: '999999.99' });
  await aportar('empates', { id: '9007199254740992' });
  await aportar('empates', { id: '9007199254740993' });
  for (let i = 0; i < 61; i++) await aportar('extenso', {});
  const socioPeriodico = await suscripcion('periodico', '10.00');
  for (let anio = 2021; anio <= 2025; anio++) {
    for (let mes = 1; mes <= 12; mes++) {
      await aportar('periodico', {
        importe: '10.00',
        fecha: `${anio}-${String(mes).padStart(2, '0')}-15T11:00:00Z`,
        suscripcionId: socioPeriodico.id,
      });
    }
  }
  return { cuentas, proyecto, principal, socioCancelado, socioPeriodico };
}

// Funcion autocontenida que solo se inyecta en HTML del banco con ?medir=1.
export function observarHistorialEnNavegador() {
  const inicio = performance.getEntriesByType('navigation')[0]?.startTime;
  let terminado = false,
    finalizando = false;
  const normalizar = (texto) => texto.replace(/\s+/g, ' ').trim();
  const visible = (el) =>
    el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const resultado = (estado, motivo) => {
    if (terminado) return;
    terminado = true;
    observador.disconnect();
    clearTimeout(limite);
    document.removeEventListener('visibilitychange', cambioVisibilidad);
    window.__hu02Medicion = {
      estado,
      motivo,
      inicioMs: inicio,
      finMs: performance.now(),
      filas: document.querySelectorAll('[data-hu02-aportacion]').length,
      grupos: document.querySelectorAll('[data-hu02-anio]').length,
      requiereRevisionVisual: true,
    };
    window.__hu02Medicion.duracionMs = window.__hu02Medicion.finMs - inicio;
    window.__hu02Medicion.inferiorA2000Ms =
      estado === 'registrada' && window.__hu02Medicion.duracionMs < 2000;
  };
  function correcto() {
    const region = document.querySelector('#historial-aportaciones');
    if (!visible(region) || region.getAttribute('aria-busy') !== 'false') return false;
    const grupos = [...region.querySelectorAll('[data-hu02-anio]')];
    const filas = [...region.querySelectorAll('[data-hu02-aportacion]')];
    if (
      grupos.length !== 5 ||
      filas.length !== 60 ||
      new Set(filas.map((f) => f.dataset.hu02Aportacion)).size !== 60
    )
      return false;
    return grupos.every((grupo, i) => {
      const anio = 2025 - i;
      const total = grupo.querySelector('[data-hu02-total-visible]');
      const cuotas = [...grupo.querySelectorAll('[data-hu02-aportacion]')];
      return (
        grupo.dataset.hu02Anio === String(anio) &&
        grupo.dataset.hu02Total === '120.00' &&
        visible(total) &&
        normalizar(total.textContent) === '120,00 €' &&
        cuotas.length === 12 &&
        cuotas.every((fila, mes) => {
          const celdas = fila.closest('tr')?.querySelectorAll('td');
          return (
            visible(fila) &&
            normalizar(fila.textContent) === `15/${String(12 - mes).padStart(2, '0')}/${anio}` &&
            celdas?.length === 4 &&
            normalizar(celdas[1].textContent) === '10,00 €' &&
            normalizar(celdas[2].textContent) === 'Cuota de socio' &&
            normalizar(celdas[3].textContent) === 'fondo general'
          );
        })
      );
    });
  }
  function comprobar() {
    if (terminado || finalizando || !correcto()) return;
    finalizando = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (terminado) return;
        if (document.visibilityState !== 'visible') return resultado('invalida', 'Pestaña no visible.');
        if (correcto()) resultado('registrada', 'Contenido preparado; contrastar captura y traza.');
        else {
          finalizando = false;
          comprobar();
        }
      }),
    );
  }
  function cambioVisibilidad() {
    if (document.visibilityState !== 'visible') resultado('invalida', 'Pestaña no visible.');
  }
  const observador = new MutationObserver(comprobar);
  const limite = setTimeout(
    () => resultado('invalida', 'No se presentó el conjunto esperado dentro del plazo de observación.'),
    15000,
  );
  window.__hu02Medicion = { estado: 'esperando', inicioMs: inicio, requiereRevisionVisual: true };
  observador.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  document.addEventListener('visibilitychange', cambioVisibilidad);
  if (inicio === undefined) resultado('invalida', 'No existe inicio de navegación.');
  else if (document.visibilityState !== 'visible') cambioVisibilidad();
  else comprobar();
}

const archivoBanco = fileURLToPath(import.meta.url);
const raizFrontend = fileURLToPath(new URL('../../../../../frontend/', import.meta.url));
async function escuchar(servidor, puerto) {
  await new Promise((resolver, rechazar) => {
    servidor.once('error', rechazar);
    servidor.listen(puerto, '127.0.0.1', () => {
      servidor.off('error', rechazar);
      resolver();
    });
  });
}
async function cerrarServidor(servidor) {
  if (!servidor.listening) return;
  servidor.closeAllConnections();
  await new Promise((resolve) => servidor.close(resolve));
}
function entornoSintetico() {
  const os = [
    'PATH',
    'Path',
    'SystemRoot',
    'SYSTEMROOT',
    'ComSpec',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'PATHEXT',
  ];
  return {
    ...Object.fromEntries(os.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]])),
    NODE_ENV: 'test',
    SESSION_SECRET: secretoSesionPruebas,
    STRIPE_SECRET_KEY: 'sk_test_hu02_sintetica',
    STRIPE_WEBHOOK_SECRET: 'whsec_hu02_sintetico',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: '1',
    ASTRO_TELEMETRY_DISABLED: '1',
  };
}
async function detenerHijo(hijo) {
  if (!hijo.pid || hijo.exitCode !== null || hijo.signalCode !== null) return;
  const terminado = once(hijo, 'exit');
  if (hijo.connected) hijo.send({ tipo: 'cerrar' });
  else hijo.kill();
  const limite = setTimeout(() => hijo.kill(), 5000);
  try {
    await terminado;
  } finally {
    clearTimeout(limite);
  }
}
async function esperarBackend(hijo) {
  return new Promise((resolver, rechazar) => {
    const limpiar = () => {
      clearTimeout(limite);
      hijo.off('message', mensaje);
      hijo.off('exit', salida);
      hijo.off('error', error);
    };
    const mensaje = (msg) => {
      if (msg.tipo === 'listo') {
        limpiar();
        resolver(msg.puerto);
      } else if (msg.tipo === 'error') {
        limpiar();
        rechazar(new Error(`No arrancó el backend aislado (${msg.codigo}).`));
      }
    };
    const salida = () => {
      limpiar();
      rechazar(new Error('Terminó el backend antes de estar preparado.'));
    };
    const error = () => {
      limpiar();
      rechazar(new Error('No se pudo crear el proceso de backend.'));
    };
    const limite = setTimeout(() => {
      limpiar();
      rechazar(new Error('Tiempo de arranque del backend agotado.'));
    }, 20000);
    hijo.on('message', mensaje);
    hijo.once('exit', salida);
    hijo.once('error', error);
  });
}

export async function crearBancoHistorial({
  entradaAstro = new URL('../../../../../frontend/dist/server/entry.mjs', import.meta.url),
  puertoProxy = 44322,
  trazaNavegador = false,
} = {}) {
  if (
    process.env.NODE_ENV !== 'test' ||
    !process.env.TEST_DATABASE_URL ||
    process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL ||
    new URL(process.env.TEST_DATABASE_URL).pathname !== '/ong_test_hu01'
  ) {
    throw new Error('Selecciona exclusivamente ong_test_hu01 en un proceso de pruebas.');
  }
  const recursos = [];
  let cierre,
    cerrando = false,
    backendPuerto,
    entorno,
    astro;
  const cerrar = () =>
    (cierre ??= (async () => {
      cerrando = true;
      const errores = [];
      for (const recurso of [...recursos].reverse()) {
        try {
          await recurso();
        } catch (e) {
          errores.push(e);
        }
      }
      if (errores.length)
        throw new AggregateError(errores, 'No se pudieron cerrar todos los recursos propios.');
    })());
  const proxy = createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${puertoProxy}`);
    const api = url.pathname.startsWith('/api/');
    const permitida =
      (req.method === 'GET' &&
        ['/api/auth/yo', '/api/yo/aportaciones', '/api/donaciones/contexto'].includes(url.pathname)) ||
      (req.method === 'POST' && url.pathname === '/api/auth/sesion') ||
      (req.method === 'DELETE' && url.pathname === '/api/auth/sesion');
    if (api && !permitida) {
      res.writeHead(403, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(
        JSON.stringify({
          error: { codigo: 'BANCO_SOLO_CONSULTA', mensaje: 'Operación fuera del banco de historial.' },
        }),
      );
      return;
    }
    if (cerrando || !backendPuerto || !astro) {
      res.writeHead(503);
      res.end('Banco no preparado.');
      return;
    }
    const peticion = solicitarHttp(
      {
        hostname: '127.0.0.1',
        port: api ? backendPuerto : 44323,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, 'accept-encoding': 'identity' },
      },
      (respuesta) => {
        const medir =
          !api &&
          url.pathname === '/mis-aportaciones' &&
          url.searchParams.get('medir') === '1' &&
          respuesta.headers['content-type']?.includes('text/html');
        if (!medir) {
          res.writeHead(respuesta.statusCode, respuesta.headers);
          respuesta.pipe(res);
          return;
        }
        const partes = [];
        respuesta.on('data', (x) => partes.push(x));
        respuesta.on('end', () => {
          const html = Buffer.concat(partes)
            .toString('utf8')
            .replace(
              '</head>',
              `<script>(${observarHistorialEnNavegador.toString()})();${trazaNavegador ? `(${exportarTrazaReal.toString()})();` : ''}</script></head>`,
            );
          const cabeceras = { ...respuesta.headers, 'cache-control': 'no-store' };
          delete cabeceras['content-length'];
          delete cabeceras['content-encoding'];
          res.writeHead(respuesta.statusCode, cabeceras);
          res.end(html);
        });
      },
    );
    peticion.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end('Servicio del banco no disponible.');
    });
    req.on('aborted', () => peticion.destroy());
    req.pipe(peticion);
  });
  recursos.push(() => cerrarServidor(proxy));
  try {
    await escuchar(proxy, puertoProxy);
    const reserva = createServer();
    recursos.push(() => cerrarServidor(reserva));
    await escuchar(reserva, 44323);
    entorno = await crearEntornoPruebas();
    // El esquema se elimina despues de parar los hijos y antes de liberar el proxy.
    recursos.push(() => entorno.cerrar());
    const fixtures = await crearFixturesHistorial(entorno);
    const env = {
      ...entornoSintetico(),
      DATABASE_URL: entorno.urlConexion,
      TEST_DATABASE_URL: entorno.urlConexion,
      HU02_ESQUEMA: entorno.esquema,
      FRONTEND_URL: `http://127.0.0.1:${puertoProxy}`,
    };
    const backend = fork(archivoBanco, ['--backend'], {
      env,
      execArgv: ['--experimental-test-module-mocks'],
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    recursos.push(() => detenerHijo(backend));
    backendPuerto = await esperarBackend(backend);
    await cerrarServidor(reserva);
    astro = spawn(process.execPath, [fileURLToPath(entradaAstro)], {
      cwd: raizFrontend,
      env: { ...entornoSintetico(), HOST: '127.0.0.1', PORT: '44323' },
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    recursos.push(() => detenerHijo(astro));
    let falloAstro = false;
    astro.once('error', () => {
      falloAstro = true;
    });
    const inicio = Date.now();
    while (true) {
      if (falloAstro || astro.exitCode !== null || astro.signalCode !== null)
        throw new Error('No arrancó el build de Astro.');
      try {
        if ((await fetch('http://127.0.0.1:44323/', { signal: AbortSignal.timeout(1000) })).ok) break;
      } catch {
        /* Aun no esta escuchando. */
      }
      if (Date.now() - inicio > 20000) throw new Error('Tiempo de arranque de Astro agotado.');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    for (const hijo of [backend, astro]) {
      if (hijo.exitCode !== null || hijo.signalCode !== null)
        throw new Error('Terminó un servicio durante el arranque del banco.');
      hijo.once('exit', () => {
        if (!cerrando) void cerrar().catch(() => {});
      });
    }
    return {
      url: `http://127.0.0.1:${puertoProxy}`,
      entorno,
      cuentas: Object.fromEntries(Object.entries(fixtures.cuentas).map(([k, v]) => [k, v.usuario.correo])),
      cerrar,
      recursosCerrados: () =>
        !proxy.listening && [backend, astro].every((h) => h.exitCode !== null || h.signalCode !== null),
      permitirInvitado: (referencia) =>
        new Promise((resolver, rechazar) => {
          const id = randomUUID();
          const fin = (msg) => {
            if (msg.tipo === 'permiso_invitado' && msg.id === id) {
              clearTimeout(limite);
              backend.off('message', fin);
              resolver(msg.autorizadoOperacion);
            }
          };
          const limite = setTimeout(() => {
            backend.off('message', fin);
            rechazar(new Error('Sin respuesta del backend de pruebas.'));
          }, 2000);
          backend.on('message', fin);
          backend.send({ tipo: 'permiso_invitado', id, referencia });
        }),
      llamadas: () =>
        new Promise((resolver, rechazar) => {
          const id = randomUUID();
          const fin = (msg) => {
            if (msg.tipo === 'llamadas' && msg.id === id) {
              clearTimeout(limite);
              backend.off('message', fin);
              resolver(msg.contadores);
            }
          };
          const limite = setTimeout(() => {
            backend.off('message', fin);
            rechazar(new Error('Sin respuesta del backend.'));
          }, 2000);
          backend.on('message', fin);
          backend.send({ tipo: 'llamadas', id });
        }),
    };
  } catch (error) {
    if (entorno) error.esquemaPruebas = entorno.esquema;
    await cerrar();
    throw error;
  }
}

async function backendAislado() {
  const { mock } = await import('node:test');
  const contadores = { stripe: 0, smtp: 0 };
  const nombres = [
    'prepararSesionPago',
    'crearSesionPago',
    'verificarEvento',
    'obtenerSesionPago',
    'obtenerSesionDeSuscripcion',
    'obtenerPago',
    'obtenerFactura',
    'obtenerSuscripcion',
  ];
  mock.module(new URL('../../../servicios-comunes/pasarela.js', import.meta.url), {
    cache: true,
    namedExports: Object.fromEntries(
      nombres.map((k) => [
        k,
        () => {
          contadores.stripe++;
          throw new Error('Stripe simulado: operación fuera del banco.');
        },
      ]),
    ),
  });
  mock.module(new URL('../../../servicios-comunes/correo.js', import.meta.url), {
    cache: true,
    namedExports: {
      enviarCorreo: async () => {
        contadores.smtp++;
        return false;
      },
    },
  });
  const { pool } = await import('../../../db/pool.js');
  await verificarEsquemaPruebas(pool, process.env.HU02_ESQUEMA);
  const { crearApp } = await import('../../../app.js');
  const { default: session } = await import('express-session');
  const almacen = new session.MemoryStore();
  const servidor = crearApp({ almacenSesiones: almacen }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  let cerrado = false;
  const apagar = async () => {
    if (cerrado) return;
    cerrado = true;
    await cerrarServidor(servidor);
    almacen.clear();
    await pool.end();
    mock.restoreAll();
    if (process.connected) process.disconnect();
  };
  process.on('message', (msg) => {
    if (msg.tipo === 'cerrar') void apagar();
    else if (msg.tipo === 'llamadas') process.send({ tipo: 'llamadas', id: msg.id, contadores });
    else if (msg.tipo === 'permiso_invitado')
      void (async () => {
        // Solo IPC del padre del banco: no hay una ruta HTTP que conceda permisos.
        const sesiones = await new Promise((resolve, reject) =>
          almacen.all((e, s) => (e ? reject(e) : resolve(s))),
        );
        const invitados = Object.entries(sesiones).filter(([, s]) => !s.usuarioId);
        if (invitados.length !== 1 || !msg.referencia?.startsWith('DON-HU02-'))
          throw new Error('Invitado de pruebas no unico.');
        const aportacion = (
          await pool.query('SELECT referencia FROM aportaciones WHERE referencia=$1', [msg.referencia])
        ).rows[0];
        if (!aportacion) throw new Error('Aportacion sintetica inexistente.');
        const [sid, datos] = invitados[0],
          creadoEn = Date.now();
        datos.donaciones = {
          ...datos.donaciones,
          permisos: {
            ...datos.donaciones?.permisos,
            [msg.referencia]: { creadoEn, venceEn: creadoEn + 8 * 3600000 },
          },
        };
        await new Promise((resolve, reject) => almacen.set(sid, datos, (e) => (e ? reject(e) : resolve())));
        const { autorizarAportacion } = await import('../autorizacion.js');
        process.send({
          tipo: 'permiso_invitado',
          id: msg.id,
          autorizadoOperacion: autorizarAportacion({ session: datos }, msg.referencia, aportacion),
        });
      })().catch(() => process.send({ tipo: 'permiso_invitado', id: msg.id, autorizadoOperacion: false }));
  });
  process.once('disconnect', () => {
    void apagar();
  });
  process.send({ tipo: 'listo', puerto: servidor.address().port });
}

if (process.argv[1] && resolve(process.argv[1]) === archivoBanco) {
  if (process.argv.includes('--backend')) {
    backendAislado().catch((error) => {
      process.send?.({ tipo: 'error', codigo: error.code ?? 'FALLO_INICIO' });
      process.exitCode = 1;
    });
  } else {
    crearBancoHistorial()
      .then(async (banco) => {
        const terminar = () => {
          void banco.cerrar().catch(() => {
            process.exitCode = 1;
          });
        };
        process.once('SIGINT', terminar);
        process.once('SIGTERM', terminar);
        if (process.argv.includes('--comprobar')) {
          try {
            const html = await fetch(banco.url + '/mis-aportaciones');
            if (!html.ok || !(await html.text()).includes('historial-aportaciones'))
              throw new Error('Página no disponible.');
            const sesion = await fetch(banco.url + '/api/auth/sesion', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ correo: banco.cuentas.principal, contrasena: contrasenaPruebas }),
            });
            if (!sesion.ok) throw new Error('Login no disponible.');
            const cookie = sesion.headers
              .getSetCookie()
              .map((x) => x.split(';')[0])
              .join('; ');
            const dto = await (
              await fetch(banco.url + '/api/yo/aportaciones', { headers: { cookie } })
            ).json();
            if (dto.total !== 3) throw new Error('Fixtures no disponibles.');
            console.log('Banco preparado: build, proxy, login y consulta aislada correctos.');
          } finally {
            await banco.cerrar();
          }
        } else {
          console.log(
            JSON.stringify({
              url: banco.url,
              cuentasSinteticas: banco.cuentas,
              contrasenaSintetica: contrasenaPruebas,
              medicion: '/mis-aportaciones?medir=1',
            }),
          );
        }
      })
      .catch((error) => {
        console.error('No se pudo preparar el banco de historial:', error.code ?? error.message);
        process.exitCode = 1;
      });
  }
}
