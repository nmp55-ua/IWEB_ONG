// Aplica en orden las migraciones de db/migraciones que aún no se hayan aplicado.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const carpeta = fileURLToPath(new URL('./migraciones/', import.meta.url));

await pool.query(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
  nombre TEXT PRIMARY KEY,
  aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
)`);

const { rows } = await pool.query('SELECT nombre FROM migraciones_aplicadas');
const aplicadas = new Set(rows.map((fila) => fila.nombre));
const ficheros = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();

for (const fichero of ficheros) {
  if (aplicadas.has(fichero)) continue;
  const sql = await readFile(carpeta + fichero, 'utf8');
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(sql);
    await cliente.query('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [fichero]);
    await cliente.query('COMMIT');
    console.log(`Aplicada ${fichero}`);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(`Error en ${fichero}: ${error.message}`);
    process.exitCode = 1;
    break;
  } finally {
    cliente.release();
  }
}

await pool.end();
