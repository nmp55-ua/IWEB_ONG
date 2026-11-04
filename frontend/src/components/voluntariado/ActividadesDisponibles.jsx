import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Aviso from '../comunes/Aviso.jsx';
import Campo from '../comunes/Campo.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import TarjetaActividad from './TarjetaActividad.jsx';

// HU-05: listado público de actividades publicadas y futuras, con filtros por proyecto y fechas.
export default function ActividadesDisponibles() {
  const [filtros, setFiltros] = useState({ proyectoId: '', desde: '', hasta: '' });
  const [proyectos, setProyectos] = useState([]);
  const [usuario, setUsuario] = useState(undefined); // undefined = cargando, null = sin sesión
  const [actividades, setActividades] = useState(null);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    api
      .get('/proyectos')
      .then(({ datos }) => setProyectos(datos))
      .catch(() => setProyectos([]));
    api
      .get('/auth/yo')
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, []);

  const cargar = useCallback(() => {
    const consulta = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor)).toString();
    return api
      .get(`/actividades/disponibles${consulta ? `?${consulta}` : ''}`)
      .then(({ datos }) => {
        setActividades(datos);
        setError(null);
      })
      .catch((err) => {
        setActividades([]);
        setError(err);
      });
  }, [filtros]);

  useEffect(() => {
    setActividades(null);
    cargar();
  }, [cargar]);

  const cambiarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  function alCambiar(texto) {
    setMensaje(texto);
    cargar();
  }

  const opcionesProyecto = [
    { valor: '', texto: 'Todos' },
    ...proyectos.map((p) => ({ valor: p.id, texto: p.nombre })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4 mb-4">
        <Campo
          etiqueta="Proyecto"
          tipo="select"
          name="proyectoId"
          value={filtros.proyectoId}
          onChange={cambiarFiltro}
          opciones={opcionesProyecto}
          error={error?.campos?.proyectoId}
          className="mb-0 w-56"
        />
        <Campo
          etiqueta="Desde"
          tipo="date"
          name="desde"
          value={filtros.desde}
          onChange={cambiarFiltro}
          error={error?.campos?.desde}
          className="mb-0 w-44"
        />
        <Campo
          etiqueta="Hasta"
          tipo="date"
          name="hasta"
          value={filtros.hasta}
          onChange={cambiarFiltro}
          error={error?.campos?.hasta}
          className="mb-0 w-44"
        />
      </div>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {error && Object.keys(error.campos).length === 0 && <Aviso tipo="error">{error.message}</Aviso>}
      {actividades === null && <p>Cargando…</p>}
      {actividades &&
        !error &&
        (actividades.length === 0 ? (
          <EstadoVacio mensaje="No hay actividades disponibles con estos filtros." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {actividades.map((actividad) => (
              <TarjetaActividad
                key={actividad.id}
                actividad={actividad}
                usuario={usuario}
                onCambio={alCambiar}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
