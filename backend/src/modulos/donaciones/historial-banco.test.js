import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import pg from 'pg';
import { runInNewContext } from 'node:vm';
import * as banco from './pruebas/historial-local.js';
import { contrasenaPruebas } from './pruebas/soporte.js';

async function esquemaExiste(nombre) {
  const cliente = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await cliente.connect();
    if ((await cliente.query('SELECT current_database() AS base')).rows[0].base !== 'ong_test_hu01')
      throw new Error('Base incorrecta.');
    return (
      (await cliente.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [nombre])).rows[0]
        .n !== 0
    );
  } finally {
    await cliente.end();
  }
}
async function ocupar(puerto) {
  const s = createServer((req, res) => res.end('Servidor de prueba previo'));
  s.listen(puerto, '127.0.0.1');
  await once(s, 'listening');
  return s;
}
async function cerrarServidor(s) {
  if (s?.listening) {
    s.closeAllConnections();
    await new Promise((resolve) => s.close(resolve));
  }
}

describe('Banco integrado HU-02, sin navegador', () => {
  it('arranca build/proxy/backend reales, usa login comun y limpia solo recursos propios', async () => {
    const b = await banco.crearBancoHistorial();
    let esquema;
    try {
      esquema = b.entorno.esquema;
      expect(await esquemaExiste(esquema)).toBe(true);
      const pagina = await fetch(b.url + '/mis-aportaciones');
      const html = await pagina.text();
      expect(pagina.status).toBe(200);
      expect(html).toContain('Mis aportaciones');
      expect(html).toContain('historial-aportaciones');
      expect(html).not.toContain('__hu02Medicion');
      const instrumento = await (await fetch(b.url + '/mis-aportaciones?medir=1')).text();
      expect(instrumento).toContain('__hu02Medicion');
      expect(instrumento.indexOf('__hu02Medicion')).toBeLessThan(instrumento.indexOf('</head>'));
      const asset = html.match(/(?:src|href)="([^"\s]*\/_astro\/[^"\s]+)"/)[1];
      expect((await fetch(new URL(asset, b.url))).status).toBe(200);
      expect((await fetch(b.url + '/api/yo/aportaciones')).status).toBe(401);
      const login = await fetch(b.url + '/api/auth/sesion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ correo: b.cuentas.principal, contrasena: contrasenaPruebas }),
      });
      expect(login.status).toBe(200);
      const cookie = login.headers
        .getSetCookie()
        .map((x) => x.split(';')[0])
        .join('; ');
      const datos = await (await fetch(b.url + '/api/yo/aportaciones', { headers: { cookie } })).json();
      expect(datos.total).toBe(3);
      expect(datos.datos.map((x) => x.importeTotal)).toEqual(['20.00', '80.00']);
      expect((await fetch(b.url + '/api/aportaciones', { method: 'POST' })).status).toBe(403);
      expect(await b.llamadas()).toEqual({ stripe: 0, smtp: 0 });
    } finally {
      await b.cerrar();
    }
    expect(await esquemaExiste(esquema)).toBe(false);
    expect(b.recursosCerrados()).toBe(true);
    await expect(fetch(b.url)).rejects.toThrow();
    // Ambos puertos quedan de nuevo disponibles; no se mata un proceso por numero de puerto.
    for (const puerto of [44322, 44323]) {
      const s = await ocupar(puerto);
      await cerrarServidor(s);
    }
    await b.cerrar();
  }, 60000);
  it.each([44322, 44323])('rechaza puerto %s ocupado y conserva el servicio previo', async (puerto) => {
    const s = await ocupar(puerto);
    try {
      await expect(banco.crearBancoHistorial()).rejects.toMatchObject({ code: 'EADDRINUSE' });
      expect(await (await fetch(`http://127.0.0.1:${puerto}`)).text()).toBe('Servidor de prueba previo');
    } finally {
      await cerrarServidor(s);
    }
  });
  it('un fallo al arrancar Astro cierra el backend, el esquema y los puertos', async () => {
    let fallo;
    try {
      await banco.crearBancoHistorial({ entradaAstro: new URL('./no-existe-hu02.mjs', import.meta.url) });
    } catch (error) {
      fallo = error;
    }
    expect(fallo).toBeInstanceOf(Error);
    expect(fallo.esquemaPruebas).toMatch(/^hu01_integracion_/);
    expect(await esquemaExiste(fallo.esquemaPruebas)).toBe(false);
    for (const puerto of [44322, 44323]) {
      const s = await ocupar(puerto);
      await cerrarServidor(s);
    }
  }, 60000);
});

function ejecutarObservador({ duracion = 1234, visible = true, total = '120.00', filas = 60 } = {}) {
  const frames = [],
    eventos = new Map(),
    ventana = {};
  let timeout;
  const pintado = (texto) => ({ textContent: texto, getClientRects: () => [{}] });
  let n = 0;
  const grupos = [2025, 2024, 2023, 2022, 2021].map((anio) => {
    const cuotas = Array.from({ length: 12 }, (_, mes) => {
      const fecha = `15/${String(12 - mes).padStart(2, '0')}/${anio}`;
      const fila = {
        ...pintado(fecha),
        dataset: { hu02Aportacion: String(9007199254740992n + BigInt(n++)) },
        closest: () => ({
          querySelectorAll: () => [fecha, '10,00 €', 'Cuota de socio', 'fondo general'].map(pintado),
        }),
      };
      return fila;
    }).filter((_, mes) => [2025, 2024, 2023, 2022, 2021].indexOf(anio) * 12 + mes < filas);
    return {
      dataset: { hu02Anio: String(anio), hu02Total: total },
      querySelector: () => pintado('120,00 €'),
      querySelectorAll: () => cuotas,
    };
  });
  const marcadores = grupos.flatMap((g) => g.querySelectorAll());
  const seleccionar = (selector) => (selector === '[data-hu02-anio]' ? grupos : marcadores);
  const region = { ...pintado('Historial'), getAttribute: () => 'false', querySelectorAll: seleccionar };
  const documento = {
    documentElement: {},
    visibilityState: visible ? 'visible' : 'hidden',
    querySelector: () => region,
    querySelectorAll: seleccionar,
    addEventListener: (nombre, fn) => eventos.set(nombre, fn),
    removeEventListener: (nombre) => eventos.delete(nombre),
  };
  runInNewContext(`(${banco.observarHistorialEnNavegador.toString()})();`, {
    window: ventana,
    document: documento,
    performance: { getEntriesByType: () => [{ startTime: 0 }], now: () => duracion },
    getComputedStyle: () => ({ visibility: 'visible' }),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame: (fn) => frames.push(fn),
    setTimeout: (fn) => {
      timeout = fn;
      return 1;
    },
    clearTimeout: () => {},
  });
  return { ventana, frames, eventos, documento, timeout: () => timeout() };
}

describe('Observador simulado, sin acreditar navegador ni rendimiento real', () => {
  it('espera dos frames y conserva inicio, fin, contenido y revision visual pendiente', () => {
    const o = ejecutarObservador();
    expect(o.ventana.__hu02Medicion.estado).toBe('esperando');
    o.frames.shift()();
    expect(o.ventana.__hu02Medicion.estado).toBe('esperando');
    o.frames.shift()();
    expect(o.ventana.__hu02Medicion).toMatchObject({
      estado: 'registrada',
      inicioMs: 0,
      finMs: 1234,
      duracionMs: 1234,
      filas: 60,
      grupos: 5,
      inferiorA2000Ms: true,
      requiereRevisionVisual: true,
    });
  });
  it('no oculta una duracion igual al limite', () => {
    const o = ejecutarObservador({ duracion: 2000 });
    o.frames.shift()();
    o.frames.shift()();
    expect(o.ventana.__hu02Medicion.inferiorA2000Ms).toBe(false);
    expect(o.ventana.__hu02Medicion.duracionMs).toBe(2000);
  });
  it.each([{ filas: 59 }, { total: '100.00' }])('no completa con un conjunto incorrecto: %j', (opciones) => {
    const o = ejecutarObservador(opciones);
    expect(o.frames).toHaveLength(0);
    o.timeout();
    expect(o.ventana.__hu02Medicion.estado).toBe('invalida');
    expect(o.ventana.__hu02Medicion.inferiorA2000Ms).toBe(false);
  });
  it('invalida una pestaña inicialmente oculta o que pierde visibilidad', () => {
    const oculta = ejecutarObservador({ visible: false });
    expect(oculta.ventana.__hu02Medicion.estado).toBe('invalida');
    const o = ejecutarObservador();
    o.documento.visibilityState = 'hidden';
    o.eventos.get('visibilitychange')();
    o.frames.shift()();
    o.frames.shift()();
    expect(o.ventana.__hu02Medicion.estado).toBe('invalida');
  });
});
