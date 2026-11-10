// HU-03: lógica de presentación de los certificados, sin React (se prueba con `npm test`).
// Los textos coinciden con los errores 404 y 409 de la API (specs/spec-003/contracts/api-certificados.md).

// Qué decir al consultar un ejercicio: disponible, en curso (FR-006) o sin aportaciones (escenario 4).
export function mensajeEjercicio({ ejercicio, certificados, ejercicioEnCurso }) {
  const certificado = certificados.find((c) => c.ejercicio === ejercicio);
  if (certificado) {
    return { tipo: 'disponible', mensaje: `El certificado de ${ejercicio} está disponible.`, certificado };
  }
  if (ejercicio >= ejercicioEnCurso) {
    return {
      tipo: 'en-curso',
      mensaje: `El certificado de ${ejercicio} se generará a partir del 01/01/${ejercicio + 1}.`,
    };
  }
  return {
    tipo: 'sin-aportaciones',
    mensaje: `No tienes aportaciones confirmadas en ${ejercicio}, así que no hay certificado de ese ejercicio.`,
  };
}

// Del ejercicio en curso a diez años atrás, el más reciente primero.
export function ejerciciosConsultables(ejercicioEnCurso) {
  return Array.from({ length: 11 }, (_, i) => ejercicioEnCurso - i);
}

// Mismo criterio que el servidor: mayúsculas, sin espacios ni guiones, 16 caracteres de Crockford base32.
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function normalizarCodigo(texto) {
  const limpio = String(texto ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  if (limpio.length !== 16 || ![...limpio].every((c) => ALFABETO.includes(c))) return null;
  return limpio.match(/.{4}/g).join('-');
}
