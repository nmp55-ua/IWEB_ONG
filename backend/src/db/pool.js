import pg from 'pg';
import { config } from '../config.js';

// NUMERIC llega como texto: así no se pierden céntimos.
export const pool = new pg.Pool({ connectionString: config.urlBaseDatos });

export function consulta(sql, parametros = []) {
  return pool.query(sql, parametros);
}

// Ejecuta fn(cliente) dentro de una transacción. Si fn lanza, se deshace todo.
export async function transaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
