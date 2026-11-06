import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Modal from '../comunes/Modal.jsx';

// Confirmación para cancelar una inscripción o salir de la lista de espera (FR-009).
// La usan el listado de actividades (HU-05) y el calendario del voluntario (HU-06).
export default function CancelarInscripcion({ abierto, inscripcion, tituloActividad, onCerrar, onHecho }) {
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const enEspera = inscripcion.estado === 'en_espera';

  useEffect(() => {
    if (abierto) setError(null);
  }, [abierto]);

  async function confirmar() {
    setCargando(true);
    setError(null);
    try {
      onHecho(await api.patch(`/yo/inscripciones/${inscripcion.id}`, { accion: 'cancelar' }));
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={enEspera ? 'Salir de la lista de espera' : 'Cancelar inscripción'}
      textoConfirmar={enEspera ? 'Salir de la lista' : 'Cancelar inscripción'}
      variante="peligro"
      cargando={cargando}
      onConfirmar={confirmar}
      onCerrar={onCerrar}
    >
      <p>
        {enEspera
          ? `¿Quieres salir de la lista de espera de «${tituloActividad}»?`
          : `¿Quieres cancelar tu inscripción en «${tituloActividad}»? Si hay alguien en la lista de espera, la plaza pasará a esa persona.`}
      </p>
      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error.message}</Aviso>
        </div>
      )}
    </Modal>
  );
}
