import { consulta } from '../../db/pool.js';

export async function buscarPorCorreo(correo) {
  const { rows } = await consulta(
    'SELECT id, correo, nombre, roles, hash_contrasena, activo FROM usuarios WHERE correo = $1',
    [correo],
  );
  return rows[0] ?? null;
}

export async function crear({ correo, hashContrasena, nombre, roles }) {
  const { rows } = await consulta(
    `INSERT INTO usuarios (correo, hash_contrasena, nombre, roles)
     VALUES ($1, $2, $3, $4)
     RETURNING id, correo, nombre, roles`,
    [correo, hashContrasena, nombre, roles],
  );
  return rows[0];
}
