// Formato común de error: { error: { codigo, mensaje, campos? } }  (plan-comun.md §4)
import { z, ZodError, ZodIssueCode } from 'zod';

// Mensajes por defecto de zod en español (constitución IV), una sola vez para todas las rutas.
// Solo se usan cuando el esquema no da su propio mensaje: los de cada módulo tienen prioridad.
export function mapaErroresZod(problema) {
  const n = (v) => (typeof v === 'bigint' ? v.toString() : v);
  switch (problema.code) {
    case ZodIssueCode.invalid_type:
      return {
        message:
          problema.received === 'undefined'
            ? 'Este campo es obligatorio.'
            : 'El valor no tiene el tipo esperado.',
      };
    case ZodIssueCode.unrecognized_keys:
      return { message: `Campo no permitido: ${problema.keys.join(', ')}.` };
    case ZodIssueCode.invalid_string:
      if (problema.validation === 'email') return { message: 'Introduce un correo válido.' };
      if (problema.validation === 'url') return { message: 'Introduce una dirección web válida.' };
      if (problema.validation === 'uuid') return { message: 'Identificador no válido.' };
      if (problema.validation === 'datetime' || problema.validation === 'date')
        return { message: 'Fecha no válida.' };
      return { message: 'El formato no es válido.' };
    case ZodIssueCode.too_small:
      if (problema.type === 'string')
        return {
          message:
            n(problema.minimum) === 1
              ? 'Este campo es obligatorio.'
              : `Debe tener al menos ${n(problema.minimum)} caracteres.`,
        };
      if (problema.type === 'array')
        return { message: `Debe haber al menos ${n(problema.minimum)} elementos.` };
      return {
        message: `Debe ser ${problema.inclusive ? 'mayor o igual que' : 'mayor que'} ${n(problema.minimum)}.`,
      };
    case ZodIssueCode.too_big:
      if (problema.type === 'string')
        return { message: `Debe tener como máximo ${n(problema.maximum)} caracteres.` };
      if (problema.type === 'array')
        return { message: `Debe haber como máximo ${n(problema.maximum)} elementos.` };
      return {
        message: `Debe ser ${problema.inclusive ? 'menor o igual que' : 'menor que'} ${n(problema.maximum)}.`,
      };
    case ZodIssueCode.invalid_enum_value:
    case ZodIssueCode.invalid_literal:
    case ZodIssueCode.invalid_union:
    case ZodIssueCode.invalid_union_discriminator:
      return { message: 'Valor no válido.' };
    case ZodIssueCode.invalid_date:
      return { message: 'Fecha no válida.' };
    case ZodIssueCode.not_multiple_of:
      return { message: `Debe ser múltiplo de ${n(problema.multipleOf)}.` };
    case ZodIssueCode.not_finite:
      return { message: 'Debe ser un número válido.' };
    default:
      return { message: 'Valor no válido.' };
  }
}
z.setErrorMap(mapaErroresZod);

export class ErrorApi extends Error {
  constructor(estado, codigo, mensaje, campos) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.campos = campos;
  }
}

// Convierte un error de zod en un 400 con un mensaje por campo del formulario
// (el error de roles[0] se asocia al campo «roles»).
export function errorDeValidacion(errorZod) {
  const campos = {};
  for (const problema of errorZod.issues) {
    const campo = String(problema.path[0] ?? '_');
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
