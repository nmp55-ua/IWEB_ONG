import { useState } from 'react';
import Boton from '../comunes/Boton.jsx';
import CancelarInscripcion from './CancelarInscripcion.jsx';
import { horario } from './fechas.js';

// Una actividad del calendario de HU-06: resumen (FR-001, FR-003) y, al pedirlo, el detalle con la
// opción de cancelar de HU-05 (FR-004). El detalle se despliega aquí mismo (research R4).
export default function ActividadCalendario({ entrada, siguiente = false, onCancelada }) {
  const [abierta, setAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const { actividad, estado, posicion, enCurso } = entrada;
  const enEspera = estado === 'en_espera';
  const idDetalle = `detalle-inscripcion-${entrada.id}`;

  return (
    <article
      className={`bg-white rounded shadow-sm p-4 border-l-4 ${
        enEspera ? 'border-dashed border-aviso' : 'border-marca-700'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm mb-1">
        {siguiente && (
          <span className="rounded bg-marca-700 text-white px-2 py-0.5 text-xs font-semibold">Siguiente</span>
        )}
        <span className={`font-medium ${enEspera ? 'text-aviso' : 'text-exito'}`}>
          {enEspera ? `En lista de espera · posición ${posicion}` : 'Confirmada'}
        </span>
        {enCurso && <span className="font-medium text-marca-700">· En curso</span>}
      </div>
      <h3 className="text-lg font-semibold text-marca-700">{actividad.titulo}</h3>
      <p>{horario(actividad)}</p>
      <p className="text-sm text-gray-700">{actividad.lugar}</p>

      <Boton
        variante="secundario"
        className="mt-3 text-sm"
        aria-expanded={abierta}
        aria-controls={idDetalle}
        onClick={() => setAbierta(!abierta)}
      >
        {abierta ? 'Ocultar detalle' : 'Ver detalle'}
      </Boton>

      {abierta && (
        <div id={idDetalle} className="mt-3 pt-3 border-t border-gray-200">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mb-4">
            <dt className="font-medium">Proyecto</dt>
            <dd>{actividad.proyecto.nombre}</dd>
            <dt className="font-medium">Requisitos</dt>
            <dd>{actividad.requisitos || 'Sin requisitos'}</dd>
            <dt className="font-medium">Descripción</dt>
            <dd>{actividad.descripcion}</dd>
          </dl>
          {enCurso ? (
            <p className="text-sm text-gray-700">La actividad ya ha empezado: no se puede cancelar.</p>
          ) : (
            <Boton variante="peligro" onClick={() => setConfirmando(true)}>
              {enEspera ? 'Salir de la lista de espera' : 'Cancelar inscripción'}
            </Boton>
          )}
        </div>
      )}

      <CancelarInscripcion
        abierto={confirmando}
        inscripcion={entrada}
        tituloActividad={actividad.titulo}
        onCerrar={() => setConfirmando(false)}
        onHecho={() => {
          setConfirmando(false);
          onCancelada(entrada);
        }}
      />
    </article>
  );
}
