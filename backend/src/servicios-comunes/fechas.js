// Todas las fechas de negocio se calculan en hora peninsular española.
import { config } from '../config.js';

export const ZONA = 'Europe/Madrid';

// «Ahora» del sistema. En pruebas se puede fijar con AHORA_SIMULADO (ISO 8601).
export function ahora() {
  return config.ahoraSimulado ? new Date(config.ahoraSimulado) : new Date();
}

// Desfase de Madrid respecto a UTC, en minutos, para un instante dado.
function desfaseMadrid(fecha) {
  const nombreZona = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, timeZoneName: 'longOffset' })
    .formatToParts(fecha)
    .find((parte) => parte.type === 'timeZoneName').value; // «GMT+01:00»
  const coincidencia = nombreZona.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!coincidencia) return 0;
  const [, signo, horas, minutos] = coincidencia;
  return (signo === '-' ? -1 : 1) * (Number(horas) * 60 + Number(minutos));
}

// Instante en que empieza en Madrid el día anio-mes-dia (mes de 1 a 12).
export function inicioDia(anio, mes, dia) {
  const utc = Date.UTC(anio, mes - 1, dia);
  const aproximado = new Date(utc - desfaseMadrid(new Date(utc)) * 60_000);
  return new Date(utc - desfaseMadrid(aproximado) * 60_000);
}

// Rangos semiabiertos [desde, hasta) en Madrid.
export function rangoAnio(anio) {
  return { desde: inicioDia(anio, 1, 1), hasta: inicioDia(anio + 1, 1, 1) };
}

export function rangoMes(anio, mes) {
  const hasta = mes === 12 ? inicioDia(anio + 1, 1, 1) : inicioDia(anio, mes + 1, 1);
  return { desde: inicioDia(anio, mes, 1), hasta };
}

export function rangoTrimestre(anio, trimestre) {
  const mesInicio = (trimestre - 1) * 3 + 1;
  const hasta = trimestre === 4 ? inicioDia(anio + 1, 1, 1) : inicioDia(anio, mesInicio + 3, 1);
  return { desde: inicioDia(anio, mesInicio, 1), hasta };
}

// Año natural en Madrid de un instante.
export function anioEnMadrid(fecha) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA, year: 'numeric' }).format(fecha));
}

// ISO 8601 con el desfase de Madrid: 2026-10-28T10:00:00+01:00
export function aIsoMadrid(fecha) {
  const desfase = desfaseMadrid(fecha);
  const local = new Date(fecha.getTime() + desfase * 60_000).toISOString().slice(0, 19);
  const signo = desfase < 0 ? '-' : '+';
  const absoluto = Math.abs(desfase);
  const hh = String(Math.floor(absoluto / 60)).padStart(2, '0');
  const mm = String(absoluto % 60).padStart(2, '0');
  return `${local}${signo}${hh}:${mm}`;
}
