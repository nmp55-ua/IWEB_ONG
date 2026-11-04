// Conversión entre <input type="datetime-local"> (hora de Madrid, sin zona) y la ISO con
// desfase que usa la API. Tiene en cuenta el horario de verano.
const ZONA = 'Europe/Madrid';

// Desfase de Madrid respecto a UTC, en minutos, en un instante dado.
function desfaseMadrid(fecha) {
  const nombre = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, timeZoneName: 'longOffset' })
    .formatToParts(fecha)
    .find((p) => p.type === 'timeZoneName').value; // «GMT+01:00»
  const m = nombre.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

const dos = (n) => String(n).padStart(2, '0');

// «2026-12-01T10:00» (Madrid) → «2026-12-01T10:00:00+01:00». Vacío → ''.
export function localAIsoMadrid(valor) {
  if (!valor) return '';
  const [fecha, hora] = valor.split('T');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const comoUtc = Date.UTC(anio, mes - 1, dia, hh, mm);
  // Se calcula el desfase dos veces por si el primer cálculo cae al otro lado del cambio de hora.
  const aproximado = new Date(comoUtc - desfaseMadrid(new Date(comoUtc)) * 60_000);
  const desfase = desfaseMadrid(new Date(comoUtc - desfaseMadrid(aproximado) * 60_000));
  const signo = desfase < 0 ? '-' : '+';
  const absoluto = Math.abs(desfase);
  return `${fecha}T${dos(hh)}:${dos(mm)}:00${signo}${dos(Math.floor(absoluto / 60))}:${dos(absoluto % 60)}`;
}

// ISO (cualquier zona) → «2026-12-01T10:00» en hora de Madrid. Vacío → ''.
export function isoALocalMadrid(iso) {
  if (!iso) return '';
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: ZONA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}
