// HU-01 · Textos de los correos al donante. Funciones puras: solo presentan lo recibido,
// sin consultar ni modificar nada. El resumen guardado no cambia; aquí solo se formatea.
const ZONA = 'Europe/Madrid';
const MODALIDADES = { puntual: 'Donación puntual', cuota_socio: 'Cuota de socio' };
const IMPORTE = /^(\d+)(?:\.(\d{1,2}))?$/;

// Caducidad del enlace de verificación (repositorio.js, emitirVerificacion: interval '30 minutes').
export const MINUTOS_VERIFICACION = 30;

// «1234.5» → «1.234,50 €», sin pasar por coma flotante. Un valor inesperado se muestra tal cual.
export function formatearImporteCorreo(importe) {
  const texto = String(importe ?? '').trim();
  const partes = texto.match(IMPORTE);
  if (!partes) return texto;
  const entero = partes[1].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${entero},${(partes[2] ?? '').padEnd(2, '0')} €`;
}

// ISO → «dd/mm/aaaa» en hora de Madrid (igual que formatearFecha del frontend).
export function formatearFechaCorreo(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha);
}

export function formatearDestinoCorreo(destino) {
  if (destino === null || destino === undefined || destino === '') return '';
  return String(destino).trim().toLowerCase() === 'fondo general' ? 'Fondo general' : String(destino);
}

export function textoCorreoConfirmacion(resumen) {
  const r = resumen ?? {};
  const filas = [
    ['Importe', formatearImporteCorreo(r.importe)],
    ['Fecha de cobro', formatearFechaCorreo(r.fechaCobro)],
    ['Modalidad', MODALIDADES[r.modalidad] ?? r.modalidad ?? ''],
    ['Destino', formatearDestinoCorreo(r.destino)],
    ['Referencia', r.referencia ?? ''],
  ].filter(([, valor]) => valor !== '');
  return [
    'Hola:',
    '',
    'Gracias por tu aportación. Estos son los datos de tu donación:',
    '',
    ...filas.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
    '',
    'Este es un correo automático.',
  ].join('\n');
}

export function textoCorreoVerificacion(enlace) {
  return [
    'Hola:',
    '',
    'Desde tu cuenta se ha pedido vincular a ella las aportaciones hechas con esta dirección de correo.',
    'Para confirmarlo, abre este enlace:',
    '',
    enlace,
    '',
    `El enlace caduca en ${MINUTOS_VERIFICACION} minutos, solo funciona con la cuenta desde la que se pidió y se puede usar una sola vez.`,
    '',
    'Si no lo has pedido tú, puedes ignorar este correo.',
  ].join('\n');
}
