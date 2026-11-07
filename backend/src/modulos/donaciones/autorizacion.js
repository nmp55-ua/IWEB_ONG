import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ErrorApi } from '../../middleware/errores.js';

const ochoHoras = 8 * 60 * 60 * 1000;
const esRegistro = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esToken = (valor) => typeof valor === 'string' && /^[a-f0-9]{64}$/.test(valor);
const esIdTexto = (valor) => typeof valor === 'string' && /^[1-9][0-9]*$/.test(valor);

function noDisponible() {
  return new ErrorApi(404, 'APORTACION_NO_DISPONIBLE', 'La aportación no está disponible.');
}

function sesionDisponible(req) {
  if (!req.session || typeof req.session.save !== 'function') {
    throw new ErrorApi(503, 'SESION_NO_DISPONIBLE', 'No se pudo guardar la sesión.');
  }
  return req.session;
}

function nuevoEstado(sesion) {
  const anterior = esRegistro(sesion.donaciones) ? sesion.donaciones : {};
  return {
    ...anterior,
    tokenCsrf: esToken(anterior.tokenCsrf) ? anterior.tokenCsrf : randomBytes(32).toString('hex'),
    permisos: esRegistro(anterior.permisos) ? { ...anterior.permisos } : {},
  };
}

async function persistir(sesion, estado) {
  const anterior = sesion.donaciones;
  sesion.donaciones = estado;
  try {
    await new Promise((resolver, rechazar) => {
      sesion.save((error) => (error ? rechazar(error) : resolver()));
    });
  } catch {
    if (anterior === undefined) delete sesion.donaciones;
    else sesion.donaciones = anterior;
    throw new ErrorApi(503, 'SESION_NO_DISPONIBLE', 'No se pudo guardar la sesión.');
  }
}

export async function prepararContextoDonaciones(req) {
  const sesion = sesionDisponible(req);
  const estado = nuevoEstado(sesion);
  await persistir(sesion, estado);
  return { tokenCsrf: estado.tokenCsrf };
}

function permisoVigente(permiso, ahora) {
  return (
    esRegistro(permiso) &&
    Number.isSafeInteger(permiso.creadoEn) &&
    Number.isSafeInteger(permiso.venceEn) &&
    Number.isSafeInteger(ahora) &&
    permiso.venceEn === permiso.creadoEn + ochoHoras &&
    ahora >= permiso.creadoEn &&
    ahora < permiso.venceEn
  );
}

// Invocar solo con la referencia de la operación iniciada y validada en servidor.
export async function registrarPermisoOperacion(req, referencia, ahora = Date.now()) {
  const sesion = sesionDisponible(req);
  if (typeof referencia !== 'string' || !referencia || !Number.isSafeInteger(ahora) || ahora < 0) {
    throw noDisponible();
  }
  const estado = nuevoEstado(sesion);
  if (Object.hasOwn(estado.permisos, referencia)) {
    if (!permisoVigente(estado.permisos[referencia], ahora)) throw noDisponible();
  } else {
    Object.defineProperty(estado.permisos, referencia, {
      value: { creadoEn: ahora, venceEn: ahora + ochoHoras },
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  await persistir(sesion, estado);
}

// aportacionServidor debe proceder de una consulta del servidor, nunca de req.body.
// usuarioIdDonante es donantes.usuario_id: no nulo solo tras vínculo verificado.
export function autorizarAportacion(req, referencia, aportacionServidor, ahora = Date.now()) {
  if (
    typeof referencia !== 'string' ||
    !referencia ||
    !aportacionServidor ||
    aportacionServidor.referencia !== referencia
  ) {
    throw noDisponible();
  }
  const permisos = req.session?.donaciones?.permisos;
  if (
    esRegistro(permisos) &&
    Object.hasOwn(permisos, referencia) &&
    permisoVigente(permisos[referencia], ahora)
  ) {
    return true;
  }
  const usuario = req.usuario;
  const propietario = aportacionServidor.usuarioIdDonante;
  if (
    esIdTexto(usuario?.id) &&
    esIdTexto(propietario) &&
    usuario.id === propietario &&
    req.session?.usuarioId === usuario.id &&
    Array.isArray(usuario.roles) &&
    usuario.roles.includes('donante')
  ) {
    return true;
  }
  throw noDisponible();
}

// Solo para las operaciones de navegador; no registrar como middleware del webhook.
export function validarSolicitudNavegador(req, origenPermitido) {
  const token = req.body?.tokenCsrf;
  const esperado = req.session?.donaciones?.tokenCsrf;
  const origen = req.get ? req.get('origin') : req.headers?.origin;
  let origenConfigurado;
  try {
    origenConfigurado = new URL(origenPermitido).origin;
  } catch {
    origenConfigurado = null;
  }
  if (
    !origenConfigurado ||
    origen !== origenConfigurado ||
    !esToken(token) ||
    !esToken(esperado) ||
    !timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(esperado, 'hex'))
  ) {
    throw new ErrorApi(403, 'SOLICITUD_NO_AUTORIZADA', 'Solicitud no autorizada.');
  }
}
