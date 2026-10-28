// Importes: entrada «20», «20,5» o «20.50» → céntimos enteros; salida «20.00».
// Nunca se usa coma flotante para dinero (plan-comun.md §4).
const PATRON = /^\d+([.,]\d{1,2})?$/;

// Devuelve los céntimos, o null si el texto no es un importe válido.
export function aCentimos(texto) {
  const limpio = String(texto ?? '').trim();
  if (!PATRON.test(limpio)) return null;
  const [entero, decimales = ''] = limpio.replace(',', '.').split('.');
  return Number(entero) * 100 + Number(decimales.padEnd(2, '0'));
}

export function centimosATexto(centimos) {
  return `${Math.floor(centimos / 100)}.${String(centimos % 100).padStart(2, '0')}`;
}
