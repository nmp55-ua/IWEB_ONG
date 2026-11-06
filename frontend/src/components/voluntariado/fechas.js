// Fechas del módulo voluntariado en la interfaz, siempre en hora de Madrid (principio IV).
// Los días se manejan como texto «aaaa-mm-dd» de Madrid; para sumar días se usa UTC, que no tiene
// cambios de hora (specs/spec-006/data-model.md, «Días de la vista mensual»).
import { formatearFecha, formatearHora } from '../../lib/formato.js';

const ZONA = 'Europe/Madrid';
const formatoDia = new Intl.DateTimeFormat('es-ES', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// «18/11/2026, de 10:00 a 13:00» (o con las dos fechas si acaba otro día).
export function horario({ inicio, fin }) {
  if (formatearFecha(inicio) === formatearFecha(fin)) {
    return `${formatearFecha(inicio)}, de ${formatearHora(inicio)} a ${formatearHora(fin)}`;
  }
  return `del ${formatearFecha(inicio)} a las ${formatearHora(inicio)} al ${formatearFecha(fin)} a las ${formatearHora(fin)}`;
}

// Instante → día que es en Madrid: «2026-11-18». Se monta con las partes, que no dependen del
// formato de presentación de ningún idioma.
export function diaMadrid(instante) {
  const partes = Object.fromEntries(
    formatoDia.formatToParts(new Date(instante)).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}

export const hoy = () => diaMadrid(new Date());

export function sumarDias(dia, dias) {
  const fecha = new Date(`${dia}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Días que ocupa una actividad: del de su inicio al de su fin. Una que acaba justo a las 00:00 no
// ocupa el día siguiente (por eso fin − 1 ms).
export function diasDeActividad({ inicio, fin }) {
  const ultimo = diaMadrid(new Date(fin).getTime() - 1);
  const dias = [];
  for (let dia = diaMadrid(inicio); dia <= ultimo; dia = sumarDias(dia, 1)) dias.push(dia);
  return dias;
}

// Mes de hoy en Madrid: { anio, mes }, con el mes de 1 a 12.
export function mesActual() {
  const [anio, mes] = hoy().split('-').map(Number);
  return { anio, mes };
}

// Mes anterior o siguiente: desplazarMes({ anio: 2026, mes: 12 }, 1) → { anio: 2027, mes: 1 }.
export function desplazarMes({ anio, mes }, cuantos) {
  const indice = anio * 12 + (mes - 1) + cuantos;
  return { anio: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

// Semanas, de lunes a domingo, que contienen el mes: [[«aaaa-mm-dd» × 7], …].
export function semanasDelMes({ anio, mes }) {
  const primero = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const huecos = (new Date(`${primero}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = lunes
  let dia = sumarDias(primero, -huecos);
  const semanas = [];
  do {
    const semana = [];
    for (let i = 0; i < 7; i++) {
      semana.push(dia);
      dia = sumarDias(dia, 1);
    }
    semanas.push(semana);
  } while (Number(dia.slice(5, 7)) === mes);
  return semanas;
}

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// { anio: 2026, mes: 11 } → «Noviembre de 2026»
export function nombreMes({ anio, mes }) {
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  return mayuscula(
    new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(fecha),
  );
}

// «2026-11-17» → «Martes, 17/11/2026»
export function nombreDia(dia) {
  const [anio, mes, numero] = dia.split('-');
  const semana = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', weekday: 'long' }).format(
    new Date(`${dia}T00:00:00Z`),
  );
  return `${mayuscula(semana)}, ${numero}/${mes}/${anio}`;
}
