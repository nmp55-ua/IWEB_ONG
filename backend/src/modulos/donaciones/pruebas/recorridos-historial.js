// Instrumentacion de T025–T030: solo banco aislado, nunca el servidor de desarrollo.
import { createServer, request } from 'node:http';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { crearBancoHistorial } from './historial-local.js';

const banco = await crearBancoHistorial();
const carpeta = new URL(
  '../../../../../specs/spec-002/refinamiento/evidencias-interfaz-01/',
  import.meta.url,
);
await mkdir(carpeta, { recursive: true });
const red = [];
let fallo = 0,
  retener = null,
  retenidas = [],
  cerrado = false;
const salida = (dato) => console.log(JSON.stringify(dato));
const proxy = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:44324');
  const esHistorial = url.pathname === '/api/yo/aportaciones';
  const registro = { instante: new Date().toISOString(), metodo: req.method, ruta: req.url };
  if (url.pathname.startsWith('/api/')) red.push(registro);
  if (esHistorial && fallo > 0) {
    fallo--;
    registro.estado = 503;
    registro.simulado = true;
    res.writeHead(503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(
      JSON.stringify({
        error: { codigo: 'FALLO_PRUEBA', mensaje: 'Fallo de consulta simulado para validación local.' },
      }),
    );
    return;
  }
  const detener = esHistorial && retener !== null && url.searchParams.get('anio') === String(retener);
  if (detener) retener = null;
  const p = request(
    { hostname: '127.0.0.1', port: 44322, path: req.url, method: req.method, headers: req.headers },
    (upstream) => {
      registro.estado = upstream.statusCode;
      if (!detener) {
        res.writeHead(upstream.statusCode, upstream.headers);
        upstream.pipe(res);
        return;
      }
      const partes = [];
      upstream.on('data', (x) => partes.push(x));
      upstream.on('end', () => {
        retenidas.push(() => {
          registro.liberada = new Date().toISOString();
          registro.clienteCerrado = res.destroyed;
          if (!res.destroyed) {
            res.writeHead(upstream.statusCode, upstream.headers);
            res.end(Buffer.concat(partes));
          }
        });
        salida({ evento: 'retenida', anio: url.searchParams.get('anio') });
      });
    },
  );
  p.on('error', () => {
    registro.estado = 502;
    if (!res.headersSent) res.writeHead(502);
    if (!res.destroyed) res.end('Fallo del proxy de pruebas.');
  });
  req.pipe(p);
});
try {
  await new Promise((resolve, reject) => {
    proxy.once('error', reject);
    proxy.listen(44324, '127.0.0.1', resolve);
  });
} catch (error) {
  await banco.cerrar();
  throw error;
}
const cuentas = (
  await banco.entorno.pool.query(`SELECT u.nombre,u.id::text AS usuario,d.id::text AS donante,d.correo
  FROM usuarios u LEFT JOIN donantes d ON d.usuario_id=u.id ORDER BY u.id`)
).rows;
const referencia = (
  await banco.entorno.pool.query(
    `SELECT referencia FROM aportaciones WHERE donante_id=$1 AND estado='confirmada' ORDER BY id LIMIT 1`,
    [cuentas.find((x) => x.nombre === 'principal').donante],
  )
).rows[0].referencia;
salida({
  evento: 'listo',
  url: banco.url,
  proxyFallos: 'http://127.0.0.1:44324',
  esquema: banco.entorno.esquema,
  cuentas,
  referencia,
});

async function balance() {
  const resultado = {};
  for (const tabla of [
    'donantes',
    'aportaciones',
    'suscripciones_socio',
    'operaciones_pago',
    'eventos_pasarela',
    'verificaciones_donante',
    'correos_aportacion',
    'certificados_fiscales',
  ]) {
    const { rows } = await banco.entorno.pool.query(
      `SELECT count(*)::int AS n,coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS datos FROM ${tabla} t`,
    );
    resultado[tabla] = {
      cantidad: rows[0].n,
      huella: createHash('sha256').update(JSON.stringify(rows[0].datos)).digest('hex'),
    };
  }
  return resultado;
}
async function cerrar() {
  if (cerrado) return;
  cerrado = true;
  retenidas.forEach((f) => f());
  retenidas = [];
  proxy.closeAllConnections();
  await new Promise((resolve) => proxy.close(resolve));
  await banco.cerrar();
  entrada.close();
  salida({ evento: 'cerrado', recursosCerrados: banco.recursosCerrados() });
}
const entrada = createInterface({ input: process.stdin });
for await (const linea of entrada) {
  try {
    const comando = JSON.parse(linea);
    if (comando.accion === 'fallar') {
      fallo = 1;
      salida({ accion: 'fallar', preparado: true });
    } else if (comando.accion === 'retener') {
      retener = comando.anio;
      salida({ accion: 'retener', anio: retener });
    } else if (comando.accion === 'liberar') {
      retenidas.forEach((f) => f());
      retenidas = [];
      salida({ accion: 'liberar' });
    } else if (comando.accion === 'permiso')
      salida({ accion: 'permiso', autorizadoOperacion: await banco.permitirInvitado(referencia) });
    else if (comando.accion === 'balance')
      salida({ accion: 'balance', datos: await balance(), llamadas: await banco.llamadas() });
    else if (comando.accion === 'fixture')
      salida({
        accion: 'fixture',
        datos: (
          await banco.entorno.pool.query(
            `SELECT
      EXTRACT(YEAR FROM a.fecha_cobro AT TIME ZONE 'Europe/Madrid')::int AS anio,count(*)::int AS cuotas,sum(a.importe)::text AS total,
      min(a.importe)::text AS minimo,max(a.importe)::text AS maximo
      FROM aportaciones a JOIN donantes d ON d.id=a.donante_id JOIN usuarios u ON u.id=d.usuario_id
      WHERE u.correo=$1 AND a.estado='confirmada' GROUP BY 1 ORDER BY 1 DESC`,
            [banco.cuentas.periodico],
          )
        ).rows,
      });
    else if (comando.accion === 'guardar') {
      await writeFile(new URL('red-local-01.json', carpeta), JSON.stringify(red, null, 2), { flag: 'wx' });
      salida({ accion: 'guardar', archivo: fileURLToPath(new URL('red-local-01.json', carpeta)) });
    } else if (comando.accion === 'cerrar') {
      await cerrar();
      break;
    }
  } catch (error) {
    salida({ error: error.code ?? error.message });
  }
}
await cerrar();
