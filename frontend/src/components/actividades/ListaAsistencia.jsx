import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearFechaHora, formatearHoras } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import Tabla from '../comunes/Tabla.jsx';

const ESTADOS = [
  { valor: null, texto: 'Sin registrar' },
  { valor: true, texto: 'Asistió' },
  { valor: false, texto: 'No asistió' },
];

function motivoNoRegistrable(actividad) {
  if (actividad.estado === 'borrador') return 'La actividad está en borrador: no admite registro de asistencia.';
  if (actividad.estado === 'cancelada') return 'La actividad está cancelada: no admite registro de asistencia.';
  return 'La actividad todavía no ha comenzado.';
}

export default function ListaAsistencia({ id }) {
  const [actividad, setActividad] = useState(null);
  const [filas, setFilas] = useState([]);
  const [guardadas, setGuardadas] = useState(new Set()); // inscripciones que ya tienen asistencia
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  function aplicar(respuesta) {
    setActividad(respuesta.actividad);
    setFilas(respuesta.datos);
    setGuardadas(new Set(respuesta.datos.filter((f) => f.asistio !== null).map((f) => f.inscripcionId)));
  }

  useEffect(() => {
    api.get(`/actividades/${id}/asistencias`).then(aplicar).catch(setError);
  }, [id]);

  const marcar = (inscripcionId, asistio) => {
    setMensaje(null);
    setFilas((actuales) => actuales.map((f) => (f.inscripcionId === inscripcionId ? { ...f, asistio } : f)));
  };

  const marcarTodos = () => {
    setMensaje(null);
    setFilas((actuales) => actuales.map((f) => ({ ...f, asistio: true })));
  };

  const marcadas = filas.filter((f) => f.asistio !== null);

  async function guardar() {
    setCargando(true);
    setError(null);
    setMensaje(null);
    try {
      aplicar(
        await api.put(`/actividades/${id}/asistencias`, {
          asistencias: marcadas.map(({ inscripcionId, asistio }) => ({ inscripcionId, asistio })),
        }),
      );
      setMensaje('Asistencia guardada.');
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }

  const textoError = error?.estado === 403 ? 'No tienes permiso para registrar asistencias.' : error?.message;

  if (!actividad) {
    return error ? <Aviso tipo="error">{textoError}</Aviso> : <p>Cargando…</p>;
  }

  const columnas = [
    { clave: 'nombre', titulo: 'Nombre', formato: (v, f) => `${v} ${f.apellidos ?? ''}` },
    { clave: 'correo', titulo: 'Correo' },
    {
      clave: 'asistio',
      titulo: 'Asistencia',
      formato: (valor, fila) => (
        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Asistencia de {fila.nombre}</legend>
          {ESTADOS.map((estado) => (
            <label key={estado.texto} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name={`asistencia-${fila.inscripcionId}`}
                checked={valor === estado.valor}
                // Una fila ya guardada solo cambia entre «asistió» y «no asistió».
                disabled={!actividad.registrable || (estado.valor === null && guardadas.has(fila.inscripcionId))}
                onChange={() => marcar(fila.inscripcionId, estado.valor)}
              />
              {estado.texto}
            </label>
          ))}
        </fieldset>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <a href={`/coordinacion/actividades/${id}`} className="text-marca-500 underline">
        Volver
      </a>
      <div>
        <h2 className="text-xl font-semibold text-marca-700">{actividad.titulo}</h2>
        <p>
          {formatearFechaHora(actividad.inicio)} – {formatearFechaHora(actividad.fin)} · {formatearHoras(actividad.horas)}
        </p>
      </div>
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {error && <Aviso tipo="error">{textoError}</Aviso>}
      {!actividad.registrable && <Aviso tipo="aviso">{motivoNoRegistrable(actividad)}</Aviso>}

      {filas.length === 0 ? (
        <EstadoVacio mensaje="Esta actividad no tiene inscritos confirmados." />
      ) : (
        <>
          <Tabla columnas={columnas} filas={filas} claveFila="inscripcionId" />
          {actividad.registrable && (
            <div className="flex flex-wrap gap-3">
              <Boton variante="secundario" onClick={marcarTodos}>
                Marcar todos como asistentes
              </Boton>
              <Boton cargando={cargando} disabled={marcadas.length === 0} onClick={guardar}>
                Guardar
              </Boton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
