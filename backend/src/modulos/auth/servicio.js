import bcrypt from 'bcrypt';
import { ErrorApi } from '../../middleware/errores.js';
import * as repositorio from './repositorio.js';

const COSTE_BCRYPT = 12;

// Al registrarse solo se puede elegir donante y/o voluntario (modelo-datos.md, usuarios).
export async function registrar({ correo, contrasena, nombre, roles }) {
  const correoNormalizado = correo.trim().toLowerCase();
  if (await repositorio.buscarPorCorreo(correoNormalizado)) {
    throw new ErrorApi(409, 'CORREO_EN_USO', 'Ya existe una cuenta con ese correo.', {
      correo: 'Ya existe una cuenta con ese correo.',
    });
  }
  const hashContrasena = await bcrypt.hash(contrasena, COSTE_BCRYPT);
  return repositorio.crear({ correo: correoNormalizado, hashContrasena, nombre: nombre.trim(), roles });
}

export async function comprobarCredenciales({ correo, contrasena }) {
  const usuario = await repositorio.buscarPorCorreo(correo.trim().toLowerCase());
  const valida = usuario?.activo && (await bcrypt.compare(contrasena, usuario.hash_contrasena));
  if (!valida) {
    throw new ErrorApi(401, 'CREDENCIALES_INCORRECTAS', 'El correo o la contraseña no son correctos.');
  }
  return { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, roles: usuario.roles };
}
