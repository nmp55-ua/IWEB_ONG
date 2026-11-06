import { useState } from 'react';
import { formatearHora } from '../../lib/formato.js';
import Boton from '../comunes/Boton.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import ActividadCalendario from './ActividadCalendario.jsx';
import { diaMadrid, diasDeActividad, hoy, nombreDia, nombreMes, semanasDelMes } from './fechas.js';

const DIAS_SEMANA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['X', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
];

const ESTILO = {
  confirmada: 'bg-marca-700 text-white',
  en_espera: 'border border-dashed border-aviso bg-amber-50 text-aviso',
};

// Hora de la etiqueta de un día: la de inicio el primer día, «hasta hh:mm» el último y «todo el día»
// los de en medio.
function horaDelDia({ actividad }, dia) {
  if (diaMadrid(actividad.inicio) === dia) return formatearHora(actividad.inicio);
  if (diaMadrid(new Date(actividad.fin).getTime() - 1) === dia)
    return `hasta ${formatearHora(actividad.fin)}`;
  return 'todo el día';
}

const cuantas = (n) => (n === 0 ? 'sin actividades' : n === 1 ? '1 actividad' : `${n} actividades`);

// Vista mensual de HU-06 (research R6): semanas completas de lunes a domingo (los días de otro mes, en
// gris y con sus actividades); cada actividad sale en todos sus días. Desde 640 px cada día enseña la
// hora y el título; en móvil, una barra por actividad. Al pulsar un día, sus actividades salen debajo
// con la misma tarjeta que la lista.
export default function MesCalendario({ mes, entradas, puedeRetroceder, onMes, onCancelada }) {
  const [elegido, setElegido] = useState(null);
  const semanas = semanasDelMes(mes);
  const hoyEs = hoy();

  const porDia = new Map();
  for (const entrada of entradas) {
    for (const dia of diasDeActividad(entrada.actividad)) {
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia).push(entrada);
    }
  }
  const delMes = (dia) => Number(dia.slice(5, 7)) === mes.mes;
  // Sin elegir, el primer día del mes con actividades desde hoy.
  const diaVisto =
    elegido ?? semanas.flat().find((dia) => delMes(dia) && dia >= hoyEs && porDia.has(dia)) ?? null;
  const delDia = diaVisto ? (porDia.get(diaVisto) ?? []) : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <Boton
          variante="secundario"
          onClick={() => onMes(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
        >
          ‹
        </Boton>
        <h2 className="text-lg font-semibold text-marca-700" aria-live="polite">
          {nombreMes(mes)}
        </h2>
        <Boton variante="secundario" onClick={() => onMes(1)} aria-label="Mes siguiente">
          ›
        </Boton>
      </div>

      <div
        className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600 mb-1"
        aria-hidden="true"
      >
        {DIAS_SEMANA.map(([letra, nombre]) => (
          <abbr key={nombre} title={nombre} className="no-underline">
            {letra}
          </abbr>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden">
        {semanas.flat().map((dia) => {
          const lista = porDia.get(dia) ?? [];
          const esElegido = dia === diaVisto;
          return (
            <button
              type="button"
              key={dia}
              onClick={() => setElegido(dia)}
              aria-pressed={esElegido}
              aria-label={`${nombreDia(dia)}: ${cuantas(lista.length)}`}
              className={`min-h-16 sm:min-h-24 p-1 flex flex-col gap-1 text-left min-w-0 ${
                delMes(dia) ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${esElegido ? 'ring-2 ring-inset ring-marca-500' : ''}`}
            >
              <span
                className={`text-xs self-start ${
                  dia === hoyEs ? 'rounded-full bg-marca-700 text-white px-1.5 font-semibold' : ''
                }`}
              >
                {Number(dia.slice(8))}
              </span>
              {lista.map((entrada) => (
                <span
                  key={entrada.id}
                  className={`block w-full rounded h-2 sm:h-auto sm:px-1 sm:py-0.5 text-[11px] leading-tight ${
                    ESTILO[entrada.estado]
                  }`}
                >
                  <span className="hidden sm:block truncate">
                    {horaDelDia(entrada, dia)} {entrada.actividad.titulo}
                  </span>
                  {entrada.estado === 'en_espera' && (
                    <span className="hidden sm:block truncate">en lista de espera</span>
                  )}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-700 mt-2">
        <span className="flex items-center gap-1">
          <span className={`inline-block w-4 h-2 rounded ${ESTILO.confirmada}`} /> Confirmada
        </span>
        <span className="flex items-center gap-1">
          <span className={`inline-block w-4 h-2 rounded ${ESTILO.en_espera}`} /> En lista de espera
        </span>
      </div>

      <section className="mt-6" aria-live="polite">
        {diaVisto ? (
          <>
            <h3 className="font-semibold mb-3">{nombreDia(diaVisto)}</h3>
            {delDia.length === 0 ? (
              <EstadoVacio mensaje="No tienes actividades este día." />
            ) : (
              <div className="space-y-3">
                {delDia.map((entrada) => (
                  <ActividadCalendario key={entrada.id} entrada={entrada} onCancelada={onCancelada} />
                ))}
              </div>
            )}
          </>
        ) : (
          <EstadoVacio mensaje="No tienes actividades por delante en este mes." />
        )}
      </section>
    </div>
  );
}
