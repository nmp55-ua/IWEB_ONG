// Formateo común para la interfaz: español de España y hora de Madrid (principio IV).
const ZONA = 'Europe/Madrid';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

// «20.00» (como llega de la API) → «20,00 €»
export function formatearEuros(importe) {
  if (importe === null || importe === undefined || importe === '') return '';
  return euros.format(Number(importe));
}

// ISO → «28/10/2026»
export function formatearFecha(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

// ISO → «10:00»
export function formatearHora(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-ES', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

// ISO → «28/10/2026 10:00»
export function formatearFechaHora(iso) {
  return iso ? `${formatearFecha(iso)} ${formatearHora(iso)}` : '';
}

// 3.5 → «3,5 h»
export function formatearHoras(horas) {
  if (horas === null || horas === undefined) return '';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(Number(horas))} h`;
}
