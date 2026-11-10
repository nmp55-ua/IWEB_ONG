// Ejecutar desde backend con NODE_ENV=test y ambas conexiones a ong_test_hu01.
// No carga .env. Los adaptadores de banco-local.js no realizan conexiones externas.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origen = 'http://127.0.0.1:44321';
if (process.env.NODE_ENV !== 'test' || process.env.FRONTEND_URL !== origen)
  throw new Error('Selecciona el entorno test y el origen exclusivo 127.0.0.1:44321.');
const { crearBancoLocal } = await import('./banco-local.js');
const banco = await crearBancoLocal(origen);
const inicial = await banco.balance();
let api, astro, cache;
async function cerrar() {
  await astro?.stop();
  if (api) await new Promise((resolve) => api.close(resolve));
  await banco.cerrar();
  if (cache) {
    if (!cache.startsWith(join(tmpdir(), 'hu01-navegador-'))) throw new Error('Ruta temporal incorrecta.');
    await rm(cache, { recursive: true, force: true });
  }
}
try {
  banco.app.post('/api/__pruebas/cerrar', (req, res) => {
    res.json({ cerrado: true });
    res.on('finish', async () => {
      await cerrar();
      process.exit(0);
    });
  });
  banco.app.get('/api/__pruebas/estado', async (req, res, next) => {
    try {
      const actual = await banco.balance();
      res.json({
        entorno: 'aislado-sin-Stripe-ni-SMTP',
        esquema: banco.entorno.esquema,
        referencias: banco.referencias,
        inicial,
        actual,
      });
    } catch (error) {
      next(error);
    }
  });
  api = await new Promise((resolve, reject) => {
    const s = banco.app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  const frontend = new URL('../../../../../frontend/', import.meta.url);
  const requireFrontend = createRequire(new URL('package.json', frontend));
  const { dev } = await import(pathToFileURL(requireFrontend.resolve('astro')).href);
  cache = await mkdtemp(join(tmpdir(), 'hu01-navegador-'));
  astro = await dev({
    root: fileURLToPath(frontend),
    cacheDir: cache,
    server: { host: '127.0.0.1', port: 44321 },
    devToolbar: { enabled: false },
    vite: {
      server: {
        proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}`, changeOrigin: false } },
      },
    },
  });
  if (astro.address.port !== 44321) throw new Error('Puerto ocupado: no se utiliza un origen distinto.');
  console.log('BANCO_LOCAL_LISTO', JSON.stringify({ origen, referencias: banco.referencias }));
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (texto) => {
    if (texto.trim() === 'cerrar') {
      await cerrar();
      process.exit(0);
    }
  });
  process.once('SIGINT', async () => {
    await cerrar();
    process.exit(0);
  });
} catch (error) {
  await cerrar();
  throw error;
}
