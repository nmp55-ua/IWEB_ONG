// Carga req.usuario desde la sesión (o null si no hay sesión o el usuario está inactivo).
import { consulta } from '../db/pool.js';

export async function cargarUsuario(req, res, next) {
  req.usuario = null;
  const id = req.session?.usuarioId;
  if (!id) return next();
  try {
    const { rows } = await consulta(
      'SELECT id, correo, nombre, roles FROM usuarios WHERE id = $1 AND activo',
      [id],
    );
    req.usuario = rows[0] ?? null;
    next();
  } catch (error) {
    next(error);
  }
}
