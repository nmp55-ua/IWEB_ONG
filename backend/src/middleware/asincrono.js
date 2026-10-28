// Express 4 no pasa al manejador de errores lo que lanza una función async; esto lo hace.
export function asincrono(controlador) {
  return (req, res, next) => Promise.resolve(controlador(req, res, next)).catch(next);
}
