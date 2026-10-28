import { ErrorApi } from './errores.js';

// requiereRol() exige sesión; requiereRol('coordinador', 'administrador') exige además uno de esos roles.
export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new ErrorApi(401, 'NO_IDENTIFICADO', 'Inicia sesión para continuar.'));
    }
    if (roles.length > 0 && !roles.some((rol) => req.usuario.roles.includes(rol))) {
      return next(new ErrorApi(403, 'SIN_PERMISO', 'No tienes permiso para realizar esta acción.'));
    }
    next();
  };
}
