import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { formatearFecha, formatearHora } from '../../lib/formato.js';
import Aviso from '../comunes/Aviso.jsx';
import Boton from '../comunes/Boton.jsx';
import Campo from '../comunes/Campo.jsx';
import EstadoVacio from '../comunes/EstadoVacio.jsx';
import Tabla from '../comunes/Tabla.jsx';
import { textoEstado } from './estados.js';

const FILTROS = [
  { valor: '', texto: 'Todas' },
  { valor: 'borrador', texto: 'Borrador' },
  { valor: 'publicada', texto: 'Publicada' },
  { valor: 'cancelada', texto: 'Cancelada' },
];

export default function ListaActividades() {
  const [estado, setEstado] = useState('');
  const [actividades, setActividades] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setActividades(null);
    api.get(`/actividades${estado ? `?estado=${estado}` : ''}`)
      .then(({ datos }) => setActividades(datos))
      .catch(setError);
  }, [estado]);

  const columnas = [
    { clave: 'titulo', titulo: 'Actividad', formato: (v, a) => <a href={`/coordinacion/actividades/${a.id}`} className="text-marca-500 underline">{v}</a> },
    { clave: 'proyecto', titulo: 'Proyecto', formato: (p) => p.nombre },
    { clave: 'inicio', titulo: 'Fecha', formato: (v) => `${formatearFecha(v)} ${formatearHora(v)}` },
    { clave: 'estado', titulo: 'Estado', formato: (_v, a) => textoEstado(a) },
    { clave: 'plazas', titulo: 'Plazas libres', alinear: 'derecha', formato: (v, a) => `${a.plazasLibres} de ${v}` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <Campo etiqueta="Estado" tipo="select" value={estado} onChange={(e) => setEstado(e.target.value)}
          opciones={FILTROS} className="mb-0 w-48" />
        <Boton href="/coordinacion/actividades/nueva">Nueva actividad</Boton>
      </div>
      {error && <Aviso tipo="error">{error.message}</Aviso>}
      {!error && actividades === null && <p>Cargando…</p>}
      {actividades && (
        actividades.length === 0
          ? <EstadoVacio mensaje="No hay actividades con este filtro." />
          : <Tabla columnas={columnas} filas={actividades} />
      )}
    </div>
  );
}
