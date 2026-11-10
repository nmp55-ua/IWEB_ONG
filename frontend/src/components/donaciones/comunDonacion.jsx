// Estado local de HU-01 en sessionStorage de la pestaña. Solo se guarda el UUID de la
// operación y, temporalmente, el token de vinculación; nunca datos fiscales ni de tarjeta.
const CLAVE_OPERACION = 'hu01.claveSolicitud';
const CLAVE_TOKEN = 'hu01.tokenVinculo';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function leer(clave, patron) {
  try {
    const valor = window.sessionStorage.getItem(clave);
    if (valor && patron.test(valor)) return valor;
    if (valor) window.sessionStorage.removeItem(clave);
  } catch {
    /* Sin almacenamiento de sesión disponible. */
  }
  return null;
}

function escribir(clave, valor) {
  try {
    if (valor) window.sessionStorage.setItem(clave, valor);
    else window.sessionStorage.removeItem(clave);
  } catch {
    /* Sin almacenamiento de sesión disponible. */
  }
}

export const leerClaveSolicitud = () => leer(CLAVE_OPERACION, UUID);
export const guardarClaveSolicitud = (clave) => escribir(CLAVE_OPERACION, clave);
export const borrarClaveSolicitud = () => escribir(CLAVE_OPERACION, null);

export const leerTokenVinculo = () => leer(CLAVE_TOKEN, TOKEN);
export const guardarTokenVinculo = (token) => escribir(CLAVE_TOKEN, TOKEN.test(token ?? '') ? token : null);
export const borrarTokenVinculo = () => escribir(CLAVE_TOKEN, null);

export const esTokenVinculo = (texto) => TOKEN.test(texto ?? '');

export const avisoVinculacion =
  'Si hay aportaciones que puedan vincularse al correo de tu cuenta, recibirás un enlace de verificación.';

export const MODALIDADES = { puntual: 'Donación puntual', cuota_socio: 'Cuota de socio' };

export function EnlaceVincular() {
  return (
    <p className="mt-6 text-sm">
      <a href="/donar/vincular" className="text-marca-500 underline">
        Vincular mis aportaciones a una cuenta
      </a>
    </p>
  );
}
