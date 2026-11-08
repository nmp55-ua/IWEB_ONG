// HU-03: orden de consola. Emite y regenera certificados de ejercicios cerrados.
//   npm run certificados                       → todos los ejercicios cerrados
//   npm run certificados -- --ejercicio 2025   → solo 2025
// Es la misma función que ejecuta la tarea horaria (tarea.js).
import { pool } from '../../db/pool.js';
import { servicio } from './servicio.js';

const lineaResultado = (r) =>
  `Ejercicio ${r.ejercicio}: ${r.emitidos} emitidos, ${r.regenerados} regenerados, ${r.correosFallidos} correos fallidos.`;

async function principal(argumentos) {
  const posicion = argumentos.indexOf('--ejercicio');
  let resultados;
  if (posicion >= 0) {
    const valor = argumentos[posicion + 1] ?? '';
    if (!/^\d{4}$/.test(valor)) throw new Error('Indica el ejercicio con 4 cifras: --ejercicio 2025');
    resultados = [await servicio.reconciliarEjercicio(Number(valor))];
  } else {
    resultados = await servicio.reconciliarCerrados();
  }
  if (resultados.length === 0) console.log('No hay ejercicios cerrados con aportaciones confirmadas.');
  for (const r of resultados) console.log(lineaResultado(r));
}

try {
  await principal(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
