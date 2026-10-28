// Formato común de error: { error: { codigo, mensaje, campos? } }  (plan-comun.md §4)
import { ZodError } from 'zod';

export class ErrorApi extends Error {
  constructor(estado, codigo, mensaje, campos) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.campos = campos;
  }
}

// Convierte un error de zod en un 400 con un mensaje por campo.
export function errorDeValidacion(errorZod) {
  const campos = {};
  for (const problema of errorZod.issues) {
    const campo = problema.path.join('.') || '_';
    campos[campo] ??= problema.message;
  }
  return new ErrorApi(400, 'DATOS_INVALIDOS', 'Revisa los datos marcados.', campos);
}

export function rutaNoEncontrada(req, res, next) {
  next(new ErrorApi(404, 'NO_ENCONTRADO', 'No existe el recurso solicitado.'));
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(error, req, res, next) {
  let errorApi = error;
  if (error instanceof ZodError) errorApi = errorDeValidacion(error);
  if (!(errorApi instanceof ErrorApi)) {
    console.error(error);
    errorApi = new ErrorApi(500, 'ERROR_INTERNO', 'Ha ocurrido un error inesperado. Inténtalo de nuevo.');
  }
  const cuerpo = { codigo: errorApi.codigo, mensaje: errorApi.message };
  if (errorApi.campos) cuerpo.campos = errorApi.campos;
  res.status(errorApi.estado).json({ error: cuerpo });
}
