import { useState } from 'react';
import { formatearFecha, formatearHora } from '../../lib/formato.js';
import Boton from '../comunes/Boton.jsx';
import CancelarInscripcion from './CancelarInscripcion.jsx';
import FormInscripcion from './FormInscripcion.jsx';

// «18/11/2026, de 10:00 a 13:00» (o con las dos fechas si acaba otro día).
function horario({ inicio, fin }) {
  if (formatearFecha(inicio) === formatearFecha(fin)) {
    return `${formatearFecha(inicio)}, de ${formatearHora(inicio)} a ${formatearHora(fin)}`;
  }
  return `del ${formatearFecha(inicio)} a las ${formatearHora(inicio)} al ${formatearFecha(fin)} a las ${formatearHora(fin)}`;
}

const textoPlazas = ({ plazasLibres, plazas }) =>
  `${plazasLibres} ${plazasLibres === 1 ? 'plaza libre' : 'plazas libres'} de ${plazas}`;

// Una actividad del listado (FR-002) con el botón que toca según la situación del usuario.
export default function TarjetaActividad({ actividad, usuario, onCambio }) {
  const [ventana, setVentana] = useState(null); // 'inscribir' | 'espera' | 'cancelar'
  const mia = actividad.miInscripcion;
  const completa = actividad.plazasLibres <= 0;
  const textoBoton = completa ? 'Apuntarme a la lista de espera' : 'Inscribirme';

  function alInscribirse(inscripcion) {
    setVentana(null);
    onCambio(
      inscripcion.estado === 'confirmada'
        ? `Te has inscrito en «${actividad.titulo}».`
        : `Estás en la lista de espera de «${actividad.titulo}» (posición ${inscripcion.posicion}).`,
    );
  }

  function alCancelar() {
    setVentana(null);
    onCambio(
      mia.estado === 'en_espera'
        ? `Has salido de la lista de espera de «${actividad.titulo}».`
        : `Has cancelado tu inscripción en «${actividad.titulo}».`,
    );
  }

  return (
    <article className="bg-white rounded shadow-sm p-5 flex flex-col">
      <p className="text-sm text-gray-600">{actividad.proyecto.nombre}</p>
      <h2 className="text-lg font-semibold text-marca-700 mb-2">{actividad.titulo}</h2>
      <p className="mb-3">{actividad.descripcion}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mb-4">
        <dt className="font-medium">Cuándo</dt>
        <dd>{horario(actividad)}</dd>
        <dt className="font-medium">Dónde</dt>
        <dd>{actividad.lugar}</dd>
        <dt className="font-medium">Plazas</dt>
        <dd className={completa ? 'text-aviso font-medium' : ''}>{textoPlazas(actividad)}</dd>
        <dt className="font-medium">Requisitos</dt>
        <dd>{actividad.requisitos || 'Sin requisitos'}</dd>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-3">
        {mia?.estado === 'confirmada' && (
          <>
            <span className="font-medium text-exito">Estás inscrito</span>
            <Boton variante="secundario" onClick={() => setVentana('cancelar')}>
              Cancelar inscripción
            </Boton>
          </>
        )}
        {mia?.estado === 'en_espera' && (
          <>
            <span className="font-medium text-aviso">En lista de espera · posición {mia.posicion}</span>
            <Boton variante="secundario" onClick={() => setVentana('cancelar')}>
              Salir de la lista de espera
            </Boton>
          </>
        )}
        {!mia && usuario === null && <Boton href="/entrar?volver=/actividades">{textoBoton}</Boton>}
        {!mia && usuario && (
          <Boton onClick={() => setVentana(completa ? 'espera' : 'inscribir')}>{textoBoton}</Boton>
        )}
      </div>

      {usuario && (
        <FormInscripcion
          abierto={ventana === 'inscribir' || ventana === 'espera'}
          actividad={actividad}
          usuario={usuario}
          listaEspera={ventana === 'espera'}
          onCerrar={() => setVentana(null)}
          onHecho={alInscribirse}
        />
      )}
      {mia && (
        <CancelarInscripcion
          abierto={ventana === 'cancelar'}
          inscripcion={mia}
          tituloActividad={actividad.titulo}
          onCerrar={() => setVentana(null)}
          onHecho={alCancelar}
        />
      )}
    </article>
  );
}
