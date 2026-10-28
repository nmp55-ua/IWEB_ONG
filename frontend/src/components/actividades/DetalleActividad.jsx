import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearFechaHora } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Modal from '../comunes/Modal.jsx';
import Tabla from '../comunes/Tabla.jsx';
import FormActividad from './FormActividad.jsx';
import { esEditable, textoEstado } from './estados.js';

const COLUMNAS_CONFIRMADAS = [
  { clave: 'nombre', titulo: 'Nombre', formato: (v, f) => `${v} ${f.apellidos ?? ''}` },
  { clave: 'correo', titulo: 'Correo' },
  { clave: 'telefono', titulo: 'Teléfono' },
  { clave: 'fechaConfirmacion', titulo: 'Confirmada el', formato: formatearFechaHora },
];

const COLUMNAS_ESPERA = [
  { clave: 'posicion', titulo: 'Posición', alinear: 'derecha' },
  ...COLUMNAS_CONFIRMADAS.slice(0, 3),
  { clave: 'fechaInscripcion', titulo: 'Apuntada el', formato: formatearFechaHora },
];

export default function DetalleActividad({ id, recienCreada = false }) {
  const [actividad, setActividad] = useState(null);
  const [inscripciones, setInscripciones] = useState({ confirmadas: [], enEspera: [] });
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(recienCreada ? 'Actividad creada en borrador.' : null);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    try {
      const [a, i] = await Promise.all([
        api.get(`/actividades/${id}`),
        api.get(`/actividades/${id}/inscripciones`),
      ]);
      setActividad(a);
      setInscripciones(i);
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    cargar();
  }, [id]);

  async function cambiarEstado(accion, textoExito) {
    setCargando(true);
    setError(null);
    setMensaje(null);
    try {
      setActividad(await api.patch(`/actividades/${id}`, { accion }));
      setInscripciones(await api.get(`/actividades/${id}/inscripciones`));
      setMensaje(textoExito);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
      setConfirmarCancelacion(false);
    }
  }

  async function guardada(nueva) {
    setActividad(nueva);
    setInscripciones(await api.get(`/actividades/${id}/inscripciones`).catch(() => inscripciones));
  }

  if (!actividad) {
    return error ? <Aviso tipo="error">{error.message}</Aviso> : <p>Cargando…</p>;
  }

  const editable = esEditable(actividad);

  return (
    <div className="space-y-8">
      <a href="/coordinacion/actividades" className="text-marca-500 underline">
        Volver
      </a>
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {error && <Aviso tipo="error">{error.message}</Aviso>}

      <section className="bg-white rounded shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-marca-700">{actividad.titulo}</h2>
            <p className="text-gray-700">
              {actividad.proyecto.nombre} · {textoEstado(actividad)}
            </p>
            <p>
              {formatearFechaHora(actividad.inicio)} – {formatearFechaHora(actividad.fin)} · {actividad.lugar}
            </p>
            <p>
              {actividad.plazasLibres} plazas libres de {actividad.plazas}
            </p>
          </div>
          <div className="flex gap-3">
            {actividad.estado === 'borrador' && (
              <Boton cargando={cargando} onClick={() => cambiarEstado('publicar', 'Actividad publicada.')}>
                Publicar
              </Boton>
            )}
            {editable && (
              <Boton variante="peligro" onClick={() => setConfirmarCancelacion(true)}>
                Cancelar actividad
              </Boton>
            )}
          </div>
        </div>
      </section>

      {editable && (
        <section>
          <h2 className="text-lg font-semibold text-marca-700 mb-3">Editar</h2>
          {/* key: se rehace el formulario con los datos guardados */}
          <FormActividad key={actividad.actualizadoEn} actividad={actividad} onGuardada={guardada} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-marca-700 mb-3">Inscritos confirmados</h2>
        <Tabla
          columnas={COLUMNAS_CONFIRMADAS}
          filas={inscripciones.confirmadas}
          claveFila="inscripcionId"
          mensajeVacio="Todavía no hay inscritos confirmados."
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-marca-700 mb-3">Lista de espera</h2>
        <Tabla
          columnas={COLUMNAS_ESPERA}
          filas={inscripciones.enEspera}
          claveFila="inscripcionId"
          mensajeVacio="No hay nadie en la lista de espera."
        />
      </section>

      <Modal
        abierto={confirmarCancelacion}
        titulo="Cancelar actividad"
        variante="peligro"
        textoConfirmar="Cancelar actividad"
        cargando={cargando}
        onCerrar={() => setConfirmarCancelacion(false)}
        onConfirmar={() => cambiarEstado('cancelar', 'Actividad cancelada.')}
      >
        {actividad.estado === 'publicada'
          ? 'Se cancelarán todas las inscripciones y se avisará por correo a los inscritos y a la lista de espera. No se puede deshacer.'
          : 'El borrador quedará cancelado. No se puede deshacer.'}
      </Modal>
    </div>
  );
}
