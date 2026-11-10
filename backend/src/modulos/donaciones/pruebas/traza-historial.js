// Puente de lectura para T030: exporta datos reales, sin alterar el observador o el producto.
import { createServer, request } from 'node:http';
import { createInterface } from 'node:readline';

function exportarTrazaReal() {
  const temporizador = setInterval(() => {
    const medicion = window.__hu02Medicion;
    if (!medicion || medicion.estado === 'esperando') return;
    clearInterval(temporizador);
    const nodo = document.createElement('script');
    nodo.type = 'application/json';
    nodo.id = 'hu02-traza-real';
    nodo.textContent = JSON.stringify({
      formato: 'Performance Timeline y observador HU-02',
      capturadaEn: new Date().toISOString(),
      medicion,
      entorno: {
        userAgent: navigator.userAgent,
        plataforma: navigator.platform,
        concurrencia: navigator.hardwareConcurrency,
        memoriaGB: navigator.deviceMemory,
        ancho: innerWidth,
        alto: innerHeight,
        pixelRatio: devicePixelRatio,
        visibilidad: document.visibilityState,
        timeOrigin: performance.timeOrigin,
      },
      navegacion: performance.getEntriesByType('navigation').map((e) => e.toJSON()),
      recursos: performance.getEntriesByType('resource').map((e) => e.toJSON()),
      pintado: performance.getEntriesByType('paint').map((e) => e.toJSON()),
      contenido: [...document.querySelectorAll('[data-hu02-anio]')].map((grupo) => ({
        anio: grupo.dataset.hu02Anio,
        total: grupo.dataset.hu02Total,
        texto: grupo.innerText,
        filas: [...grupo.querySelectorAll('[data-hu02-aportacion]')].map((fila) => ({
          id: fila.dataset.hu02Aportacion,
          texto: fila.closest('tr').innerText,
        })),
      })),
    });
    document.documentElement.append(nodo);
  }, 50);
}
const servidor = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:44325');
  const p = request(
    {
      hostname: '127.0.0.1',
      port: 44322,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, 'accept-encoding': 'identity' },
    },
    (upstream) => {
      if (
        url.pathname !== '/mis-aportaciones' ||
        url.searchParams.get('medir') !== '1' ||
        !upstream.headers['content-type']?.includes('text/html')
      ) {
        res.writeHead(upstream.statusCode, upstream.headers);
        upstream.pipe(res);
        return;
      }
      const partes = [];
      upstream.on('data', (x) => partes.push(x));
      upstream.on('end', () => {
        const html = Buffer.concat(partes)
          .toString('utf8')
          .replace('</head>', `<script>(${exportarTrazaReal.toString()})();</script></head>`);
        const cabeceras = { ...upstream.headers, 'cache-control': 'no-store' };
        delete cabeceras['content-length'];
        delete cabeceras['content-encoding'];
        res.writeHead(upstream.statusCode, cabeceras);
        res.end(html);
      });
    },
  );
  p.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    if (!res.destroyed) res.end('Banco no disponible.');
  });
  req.pipe(p);
});
await new Promise((resolve, reject) => {
  servidor.once('error', reject);
  servidor.listen(44325, '127.0.0.1', resolve);
});
console.log('Puente de traza preparado en http://127.0.0.1:44325; destino: banco existente 44322.');
const entrada = createInterface({ input: process.stdin });
for await (const linea of entrada) {
  if (linea.trim() === 'cerrar') break;
}
entrada.close();
servidor.closeAllConnections();
await new Promise((resolve) => servidor.close(resolve));
console.log('Puente de traza cerrado.');
