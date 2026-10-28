// Único cliente de la API. Siempre devuelve los datos o lanza un ErrorApi con el formato común.
export class ErrorApi extends Error {
  constructor(estado, { codigo, mensaje, campos } = {}) {
    super(mensaje ?? 'Ha ocurrido un error inesperado.');
    this.estado = estado;
    this.codigo = codigo ?? 'ERROR';
    this.campos = campos ?? {};
  }
}

async function peticion(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, { codigo: 'SIN_CONEXION', mensaje: 'No se puede conectar con el servidor.' });
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos?.error);
  return datos;
}

export const api = {
  get: (ruta) => peticion('GET', ruta),
  post: (ruta, cuerpo = {}) => peticion('POST', ruta, cuerpo),
  put: (ruta, cuerpo = {}) => peticion('PUT', ruta, cuerpo),
  patch: (ruta, cuerpo = {}) => peticion('PATCH', ruta, cuerpo),
  delete: (ruta) => peticion('DELETE', ruta),
};

// Para descargar PDF o CSV: basta con un enlace normal a la ruta.
export const urlApi = (ruta) => `/api${ruta}`;
